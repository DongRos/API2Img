const http = require("http");
const fs = require("fs");
const path = require("path");
const { BillingStore } = require("./lib/billing-store");

const root = __dirname;
const port = Number(process.env.PORT || 4173);
const host = "127.0.0.1";
loadEnvFile(path.join(root, ".env"));

const billingDataFile = resolveBillingDataFile();
migrateLegacyBillingData(path.join(root, "data", "billing.json"), billingDataFile);
const billingStore = new BillingStore(billingDataFile);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

const server = http.createServer(async (req, res) => {
  try {
    if (req.url.startsWith("/api/site")) {
      await handleSiteRequest(req, res);
      return;
    }
    if (req.url.startsWith("/api/billing")) {
      await handleBillingRequest(req, res);
      return;
    }
    if (req.method === "POST" && req.url === "/api/proxy-image") {
      await proxyImageRequest(req, res);
      return;
    }
    if (req.method === "POST" && req.url === "/api/cache-image") {
      await cacheImageRequest(req, res);
      return;
    }

    if (req.method !== "GET" && req.method !== "HEAD") {
      sendText(res, 405, "Method not allowed");
      return;
    }

    serveStatic(req, res);
  } catch (error) {
    sendJson(res, 500, { error: { message: error.message || "Proxy server error" } });
  }
});

server.listen(port, host, () => {
  console.log(`Image2 Canvas running at http://${host}:${port}/`);
});

async function handleBillingRequest(req, res) {
  const url = new URL(req.url, `http://${host}:${port}`);
  const route = url.pathname.replace(/\/+$/, "") || "/";
  if (route.startsWith("/api/billing/admin")) {
    await handleBillingAdminRequest(req, res, route);
    return;
  }
  const session = await resolveBillingSession(req, res);

  if (req.method === "GET" && route === "/api/billing/config") {
    const platform = await platformConfig();
    sendJson(res, 200, {
      ok: true,
      priceCents: platform.priceCents,
      upstreamCostCents: platform.upstreamCostCents,
      currency: "CNY",
      paymentMethods: paymentMethods(),
      platformEnabled: platform.enabled,
      customerId: session.customerId,
    });
    return;
  }

  if (req.method === "GET" && route === "/api/billing/me") {
    const platform = await platformConfig();
    const dashboard = await billingStore.getDashboard(session.customerId);
    sendJson(res, 200, {
      ok: true,
      customerId: session.customerId,
      customer: publicCustomer(dashboard.customer),
      orders: dashboard.orders.map(publicOrder),
      usage: dashboard.usage.map(publicUsage),
      redemptions: dashboard.redemptions.map(publicRedemption),
      priceCents: platform.priceCents,
      upstreamCostCents: platform.upstreamCostCents,
      currency: "CNY",
    });
    return;
  }

  if (req.method === "POST" && route === "/api/billing/orders") {
    const payload = await readJson(req);
    const amountCents = normalizeRechargeAmount(payload.amountCents);
    if (!amountCents) {
      sendJson(res, 400, { error: { message: "充值金额不能低于 1 元" } });
      return;
    }
    const method = normalizePaymentMethod(payload.paymentMethod);
    if (!method) {
      sendJson(res, 400, { error: { message: "请选择微信或支付宝" } });
      return;
    }
    const order = await billingStore.createOrder(session.customerId, {
      amountCents,
      paymentMethod: method,
      note: payload.note || "",
    });
    sendJson(res, 200, {
      ok: true,
      order: publicOrder(order),
      payment: paymentMethods().find((item) => item.id === method),
    });
    return;
  }

  if (req.method === "POST" && route === "/api/billing/orders/submit") {
    const order = await billingStore.submitOrder(session.customerId, await readJson(req));
    sendJson(res, 200, { ok: true, order: publicOrder(order) });
    return;
  }

  if (req.method === "POST" && route === "/api/billing/redeem") {
    const payload = await readJson(req);
    const result = await billingStore.redeemCode(session.customerId, payload.code, payload.email);
    sendJson(res, 200, {
      ok: true,
      customer: publicCustomer(result.customer),
      redemption: publicRedemption(result.redemption),
    });
    return;
  }

  if (req.method === "POST" && route === "/api/billing/restore") {
    const payload = await readJson(req);
    const restored = await billingStore.restoreByEmailAndCode(session.sessionToken, payload.email, payload.code);
    appendSetCookie(res, "image2_session", restored.sessionToken, {
      httpOnly: true,
      sameSite: "Lax",
      maxAge: 60 * 60 * 24 * 365,
    });
    const dashboard = await billingStore.getDashboard(restored.customer.id);
    sendJson(res, 200, {
      ok: true,
      customerId: restored.customer.id,
      customer: publicCustomer(dashboard.customer),
      orders: dashboard.orders.map(publicOrder),
      usage: dashboard.usage.map(publicUsage),
      redemptions: dashboard.redemptions.map(publicRedemption),
      priceCents: (await platformConfig()).priceCents,
      currency: "CNY",
    });
    return;
  }

  if (req.method === "POST" && route === "/api/billing/platform-image") {
    await platformImageRequest(req, res, session.customerId);
    return;
  }

  if (req.method === "POST" && route === "/api/billing/platform-direct-config") {
    await platformDirectConfigRequest(req, res, session.customerId);
    return;
  }

  if (req.method === "POST" && route === "/api/billing/platform-usage") {
    await platformUsageRequest(req, res, session.customerId);
    return;
  }

  sendJson(res, 404, { error: { message: "Billing route not found" } });
}

async function handleSiteRequest(req, res) {
  const url = new URL(req.url, `http://${host}:${port}`);
  const route = url.pathname.replace(/\/+$/, "") || "/";
  const session = await resolveBillingSession(req, res);

  if (req.method === "GET" && route === "/api/site/announcements") {
    const limit = Math.max(1, Number(url.searchParams.get("limit") || 20));
    sendJson(res, 200, {
      ok: true,
      announcements: (await billingStore.listAnnouncements(limit)).map(publicAnnouncement),
    });
    return;
  }

  if (req.method === "POST" && route === "/api/site/track") {
    const payload = await readJson(req);
    const kind = String(payload.kind || "visit").trim().toLowerCase() === "heartbeat" ? "heartbeat" : "visit";
    await billingStore.recordSiteTrack(session.sessionToken, kind);
    sendJson(res, 200, {
      ok: true,
      siteStats: await billingStore.getSiteStats(),
    });
    return;
  }

  if (req.method === "GET" && route === "/api/site/stats") {
    sendJson(res, 200, {
      ok: true,
      siteStats: await billingStore.getSiteStats(),
    });
    return;
  }

  sendJson(res, 404, { error: { message: "Site route not found" } });
}

async function proxyImageRequest(req, res) {
  const payload = JSON.parse(await readBody(req));
  const endpoint = String(payload.endpoint || "");
  const request = payload.request || {};

  if (!/^https?:\/\//i.test(endpoint)) {
    sendJson(res, 400, { error: { message: "API URL 必须以 http:// 或 https:// 开头" } });
    return;
  }

  const headers = sanitizeHeaders(request.headers || {});
  let body;

  if (request.bodyType === "multipart") {
    const multipart = buildMultipartBody(request.fields || {}, request.files || []);
    headers["Content-Type"] = `multipart/form-data; boundary=${multipart.boundary}`;
    headers["Content-Length"] = String(multipart.body.length);
    body = multipart.body;
  } else {
    body = request.body || "";
    if (!headers["Content-Type"] && !headers["content-type"]) {
      headers["Content-Type"] = "application/json";
    }
    headers["Content-Length"] = Buffer.byteLength(body);
  }

  const upstream = await fetch(endpoint, {
    method: request.method || "POST",
    headers,
    body,
  });

  const responseBody = Buffer.from(await upstream.arrayBuffer());
  const contentType = upstream.headers.get("content-type") || "application/json; charset=utf-8";
  if (contentType.startsWith("image/")) {
    sendJson(res, upstream.status, {
      data: [{ url: `data:${contentType.split(";")[0]};base64,${responseBody.toString("base64")}` }],
    });
    return;
  }

  writeHead(res, upstream.status, {
    "Content-Type": contentType,
    "Cache-Control": "no-store",
  });
  res.end(responseBody);
}

async function platformImageRequest(req, res, customerId) {
  const platform = await platformConfig();
  if (!platform.enabled) {
    sendJson(res, 503, { error: { message: "站点 API 还没有配置，请联系站长处理" } });
    return;
  }

  const payload = await readJson(req);
  const mode = payload.mode === "image" ? "image" : "text";
  const upstreamRequest = payload.request || {};
  const requestedCount = Math.max(1, Number(payload.count || upstreamRequest.fields?.n || 1));
  const requiredCents = requestedCount * platform.priceCents;
  const hasBalance = await billingStore.hasEnoughBalance(customerId, requiredCents);
  if (!hasBalance) {
    sendJson(res, 402, {
      error: {
        code: "insufficient_balance",
        message: `余额不足，本次预计需要 ${formatMoney(requiredCents)} 元`,
      },
    });
    return;
  }

  const endpoint = mode === "image" ? platform.editEndpoint || inferEditEndpoint(platform.textEndpoint) : platform.textEndpoint;
  if (!endpoint) {
    sendJson(res, 503, { error: { message: "站点 API 图生图接口还没有配置" } });
    return;
  }

  const request = {
    ...upstreamRequest,
    headers: {
      ...sanitizePlatformRequestHeaders(upstreamRequest.headers || {}),
      Authorization: `Bearer ${platform.apiKey}`,
    },
  };
  const upstream = await fetchUpstreamImage(endpoint, request);
  const responseBody = Buffer.from(await upstream.arrayBuffer());
  const contentType = upstream.headers.get("content-type") || "application/json; charset=utf-8";

  writeHead(res, upstream.status, {
    "Content-Type": contentType,
    "Cache-Control": "no-store",
  });
  res.end(responseBody);
}

async function platformDirectConfigRequest(req, res, customerId) {
  const platform = await platformConfig();
  if (!platform.enabled) {
    sendJson(res, 503, { error: { message: "站点 API 还没有配置，请联系站长处理" } });
    return;
  }

  const payload = await readJson(req);
  const mode = payload.mode === "image" ? "image" : "text";
  const requestedCount = Math.max(1, Math.min(20, Math.round(Number(payload.count || 1))));
  const requiredCents = requestedCount * platform.priceCents;
  const hasBalance = await billingStore.hasEnoughBalance(customerId, requiredCents);
  if (!hasBalance) {
    sendJson(res, 402, {
      error: {
        code: "insufficient_balance",
        message: `余额不足，本次预计需要 ${formatMoney(requiredCents)} 元`,
      },
    });
    return;
  }

  const endpoint = mode === "image" ? platform.editEndpoint || inferEditEndpoint(platform.textEndpoint) : platform.textEndpoint;
  if (!endpoint) {
    sendJson(res, 503, { error: { message: "站点 API 图生图接口还没有配置" } });
    return;
  }

  sendJson(res, 200, {
    ok: true,
    endpoint,
    apiKey: platform.apiKey,
    priceCents: platform.priceCents,
    mode,
  });
}

async function platformUsageRequest(req, res, customerId) {
  const platform = await platformConfig();
  if (!platform.enabled) {
    sendJson(res, 503, { error: { message: "站点 API 还没有配置，请联系站长处理" } });
    return;
  }

  const payload = await readJson(req);
  const imageCount = Math.max(0, Math.min(20, Math.round(Number(payload.imageCount || 0))));
  if (!imageCount) {
    sendJson(res, 400, { error: { message: "没有可扣费的图片" } });
    return;
  }

  const mode = payload.mode === "image" ? "image" : "text";
  const endpoint = mode === "image" ? platform.editEndpoint || inferEditEndpoint(platform.textEndpoint) : platform.textEndpoint;
  const charged = await billingStore.recordUsage(customerId, {
    amountCents: imageCount * platform.priceCents,
    imageCount,
    mode,
    model: payload.model || "",
    endpoint,
    requestId: payload.requestId || payload.generationId || "",
  });

  sendJson(res, 200, {
    ok: true,
    chargedCents: charged.usage.amountCents,
    balanceCents: charged.customer.balanceCents,
    usage: publicUsage(charged.usage),
    customer: publicCustomer(charged.customer),
  });
}

async function handleBillingAdminRequest(req, res, route) {
  if (!isAdminRequest(req)) {
    sendJson(res, 401, { error: { message: "管理员密码不正确" } });
    return;
  }

  if (req.method === "GET" && route === "/api/billing/admin/orders") {
    const limit = Number(new URL(req.url, `http://${host}:${port}`).searchParams.get("limit") || 30);
    const orders = await billingStore.listPendingOrders(limit);
    sendJson(res, 200, { ok: true, orders: orders.map(publicAdminOrder) });
    return;
  }

  if (req.method === "POST" && route === "/api/billing/admin/orders/approve") {
    const payload = await readJson(req);
    const result = await billingStore.approveOrder(String(payload.orderId || ""), payload.reviewNote || "");
    sendJson(res, 200, {
      ok: true,
      order: publicAdminOrder(result.order),
      customer: publicCustomer(result.customer),
    });
    return;
  }

  if (req.method === "POST" && route === "/api/billing/admin/orders/reject") {
    const payload = await readJson(req);
    const order = await billingStore.rejectOrder(String(payload.orderId || ""), payload.reviewNote || "");
    sendJson(res, 200, { ok: true, order: publicAdminOrder(order) });
    return;
  }

  if (req.method === "GET" && route === "/api/billing/admin/codes") {
    const limit = Number(new URL(req.url, `http://${host}:${port}`).searchParams.get("limit") || 50);
    const codes = await billingStore.listRedeemCodes(limit);
    sendJson(res, 200, { ok: true, codes: codes.map(publicRedeemCode) });
    return;
  }

  if (req.method === "POST" && route === "/api/billing/admin/codes") {
    const payload = await readJson(req);
    const codes = await billingStore.createRedeemCodes(payload.codes || []);
    sendJson(res, 200, { ok: true, codes: codes.map(publicRedeemCode) });
    return;
  }

  if (req.method === "GET" && route === "/api/billing/admin/announcements") {
    const limit = Math.max(1, Number(new URL(req.url, `http://${host}:${port}`).searchParams.get("limit") || 20));
    const announcements = await billingStore.listAnnouncements(limit);
    sendJson(res, 200, { ok: true, announcements: announcements.map(publicAnnouncement) });
    return;
  }

  if (req.method === "POST" && route === "/api/billing/admin/announcements") {
    const payload = await readJson(req);
    const announcement = await billingStore.createAnnouncement(payload);
    sendJson(res, 200, { ok: true, announcement: publicAnnouncement(announcement) });
    return;
  }

  if (req.method === "PATCH" && route === "/api/billing/admin/announcements") {
    const url = new URL(req.url, `http://${host}:${port}`);
    const payload = await readJson(req);
    const announcement = await billingStore.updateAnnouncement(url.searchParams.get("id") || payload.id, payload);
    sendJson(res, 200, { ok: true, announcement: publicAnnouncement(announcement) });
    return;
  }

  if (req.method === "DELETE" && route === "/api/billing/admin/announcements") {
    const url = new URL(req.url, `http://${host}:${port}`);
    const payload = await readJson(req);
    const announcement = await billingStore.deleteAnnouncement(url.searchParams.get("id") || payload.id);
    sendJson(res, 200, { ok: true, announcement: publicAnnouncement(announcement) });
    return;
  }

  if (req.method === "GET" && route === "/api/billing/admin/platform") {
    sendJson(res, 200, { ok: true, platform: adminPlatformConfig(await platformConfig()) });
    return;
  }

  if (req.method === "POST" && route === "/api/billing/admin/platform") {
    const settings = await billingStore.updatePlatformSettings(await readJson(req));
    sendJson(res, 200, { ok: true, platform: adminPlatformConfig(platformConfigFromSettings(settings)) });
    return;
  }

  sendJson(res, 404, { error: { message: "Admin route not found" } });
}

async function fetchUpstreamImage(endpoint, request) {
  if (!/^https?:\/\//i.test(endpoint)) throw new Error("站点 API URL 必须以 http:// 或 https:// 开头");
  const headers = sanitizeHeaders(request.headers || {});
  let body;

  if (request.bodyType === "multipart") {
    const multipart = buildMultipartBody(request.fields || {}, request.files || []);
    headers["Content-Type"] = `multipart/form-data; boundary=${multipart.boundary}`;
    headers["Content-Length"] = String(multipart.body.length);
    body = multipart.body;
  } else {
    body = request.body || "";
    if (!headers["Content-Type"] && !headers["content-type"]) {
      headers["Content-Type"] = "application/json";
    }
    headers["Content-Length"] = Buffer.byteLength(body);
  }

  return fetch(endpoint, {
    method: request.method || "POST",
    headers,
    body,
  });
}

async function cacheImageRequest(req, res) {
  const payload = JSON.parse(await readBody(req));
  const imageUrl = String(payload.url || "");

  if (!/^https?:\/\//i.test(imageUrl)) {
    sendJson(res, 400, { error: { message: "图片 URL 必须以 http:// 或 https:// 开头" } });
    return;
  }

  const upstream = await fetch(imageUrl, {
    headers: sanitizeHeaders(payload.headers || {}),
  });
  const contentType = upstream.headers.get("content-type") || "";
  if (!upstream.ok || !contentType.startsWith("image/")) {
    sendJson(res, upstream.ok ? 415 : upstream.status, {
      error: { message: `图片缓存失败：${upstream.status || 415}` },
    });
    return;
  }

  const responseBody = Buffer.from(await upstream.arrayBuffer());
  sendJson(res, 200, {
    dataUrl: `data:${contentType.split(";")[0]};base64,${responseBody.toString("base64")}`,
  });
}

function serveStatic(req, res) {
  const url = new URL(req.url, `http://${host}:${port}`);
  const pathname = decodeURIComponent(url.pathname);
  const relativePath = pathname === "/" ? "index.html" : pathname.slice(1);
  const filePath = path.resolve(root, relativePath);

  if (!filePath.startsWith(root)) {
    sendText(res, 403, "Forbidden");
    return;
  }
  if (isBlockedStaticPath(relativePath)) {
    sendText(res, 403, "Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      sendText(res, 404, "Not found");
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    writeHead(res, 200, {
      "Content-Type": mimeTypes[ext] || "application/octet-stream",
      "Cache-Control": "no-cache",
    });
    if (req.method === "HEAD") res.end();
    else res.end(data);
  });
}

function buildMultipartBody(fields, files) {
  const boundary = `----image2-${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`;
  const chunks = [];

  Object.entries(fields).forEach(([name, value]) => {
    chunks.push(Buffer.from(`--${boundary}\r\n`));
    chunks.push(Buffer.from(`Content-Disposition: form-data; name="${escapeMultipartName(name)}"\r\n\r\n`));
    chunks.push(Buffer.from(`${value ?? ""}\r\n`));
  });

  files.forEach((file) => {
    const parsed = parseDataUrl(file.dataUrl || "");
    chunks.push(Buffer.from(`--${boundary}\r\n`));
    chunks.push(
      Buffer.from(
        `Content-Disposition: form-data; name="${escapeMultipartName(file.field)}"; filename="${escapeMultipartName(file.filename || "image.png")}"\r\n`,
      ),
    );
    chunks.push(Buffer.from(`Content-Type: ${parsed.mime}\r\n\r\n`));
    chunks.push(parsed.buffer);
    chunks.push(Buffer.from("\r\n"));
  });

  chunks.push(Buffer.from(`--${boundary}--\r\n`));
  return { boundary, body: Buffer.concat(chunks) };
}

function parseDataUrl(dataUrl) {
  const match = dataUrl.match(/^data:([^;,]+)?(;base64)?,(.*)$/);
  if (!match) {
    throw new Error("图片数据格式无效");
  }
  const mime = match[1] || "image/png";
  const buffer = match[2] ? Buffer.from(match[3], "base64") : Buffer.from(decodeURIComponent(match[3]));
  return { mime, buffer };
}

function sanitizeHeaders(headers) {
  const clean = {};
  Object.entries(headers).forEach(([key, value]) => {
    if (!value) return;
    const lower = key.toLowerCase();
    if (["host", "origin", "referer", "content-length"].includes(lower)) return;
    clean[key] = String(value);
  });
  return clean;
}

function sanitizePlatformRequestHeaders(headers) {
  const clean = {};
  Object.entries(headers).forEach(([key, value]) => {
    if (!value) return;
    if (key.toLowerCase() !== "content-type") return;
    clean[key] = String(value);
  });
  return clean;
}

async function resolveBillingSession(req, res) {
  const cookieToken = parseCookies(req.headers.cookie || "").image2_session || "";
  const session = await billingStore.getOrCreateSession(cookieToken);
  if (session.sessionToken !== cookieToken) {
    appendSetCookie(res, "image2_session", session.sessionToken, {
      httpOnly: true,
      sameSite: "Lax",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  return session;
}

async function platformConfig() {
  return platformConfigFromSettings(await billingStore.getPlatformSettings());
}

function platformConfigFromSettings(settings = {}) {
  const textEndpoint = String(process.env.PLATFORM_TEXT_ENDPOINT || settings.textEndpoint || "").trim();
  const editEndpoint = String(process.env.PLATFORM_EDIT_ENDPOINT || settings.editEndpoint || "").trim();
  const apiKey = String(process.env.PLATFORM_API_KEY || settings.apiKey || "").trim();
  const priceCents = Math.max(1, Math.round(Number(process.env.PLATFORM_PRICE_CENTS || settings.priceCents || 10)));
  const upstreamCostCents = Math.max(0, Math.round(Number(process.env.PLATFORM_UPSTREAM_COST_CENTS || settings.upstreamCostCents || 4)));
  return {
    textEndpoint,
    editEndpoint,
    apiKey,
    priceCents,
    upstreamCostCents,
    enabled: Boolean(textEndpoint && apiKey),
    updatedAt: Number(settings.updatedAt || 0),
  };
}

function adminPlatformConfig(platform) {
  return {
    textEndpoint: platform.textEndpoint,
    editEndpoint: platform.editEndpoint,
    apiKey: "",
    apiKeyConfigured: Boolean(platform.apiKey),
    priceCents: platform.priceCents,
    upstreamCostCents: platform.upstreamCostCents,
    enabled: platform.enabled,
    updatedAt: platform.updatedAt,
  };
}

function paymentMethods() {
  return [
    {
      id: "wechat",
      name: "微信支付",
      qrUrl: String(process.env.PAYMENT_WECHAT_QR_URL || "").trim(),
      note: String(process.env.PAYMENT_WECHAT_NOTE || "付款时请备注订单号后六位").trim(),
    },
    {
      id: "alipay",
      name: "支付宝",
      qrUrl: String(process.env.PAYMENT_ALIPAY_QR_URL || "").trim(),
      note: String(process.env.PAYMENT_ALIPAY_NOTE || "付款时请备注订单号后六位").trim(),
    },
  ];
}

function normalizePaymentMethod(value) {
  const method = String(value || "").trim();
  return paymentMethods().some((item) => item.id === method) ? method : "";
}

function normalizeRechargeAmount(amountCents) {
  const cents = Math.round(Number(amountCents || 0));
  if (!Number.isFinite(cents) || cents < 100) return 0;
  return Math.min(cents, 500000);
}

function resolveBillingDataFile() {
  const configured = String(process.env.BILLING_DATA_FILE || "").trim();
  if (configured) {
    return path.isAbsolute(configured) ? configured : path.resolve(root, configured);
  }
  return path.join(root, ".data", "billing.json");
}

function migrateLegacyBillingData(legacyFile, targetFile) {
  const legacyPath = path.resolve(legacyFile);
  const targetPath = path.resolve(targetFile);
  if (legacyPath === targetPath) return;
  if (!fs.existsSync(legacyPath) || fs.existsSync(targetPath)) return;
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  try {
    fs.renameSync(legacyPath, targetPath);
  } catch {
    fs.copyFileSync(legacyPath, targetPath);
    try {
      fs.unlinkSync(legacyPath);
    } catch {}
  }
}

function isBlockedStaticPath(relativePath) {
  const normalized = String(relativePath || "").replace(/\\/g, "/");
  const parts = normalized.split("/").filter(Boolean);
  if (!parts.length) return false;
  if (parts.some((part) => part === "." || part === ".." || part.startsWith("."))) return true;
  const blockedNames = new Set([
    "data",
    ".data",
    "lib",
    "scripts",
    "cloud-functions",
    "node_modules",
    "server.js",
    "package.json",
    "package-lock.json",
    ".env",
    ".env.example",
    "billing.md",
    "deploy_edgeone.md",
  ]);
  return parts.some((part) => blockedNames.has(part.toLowerCase()));
}

function inferEditEndpoint(textEndpoint) {
  const endpoint = String(textEndpoint || "").trim();
  if (!endpoint) return "";
  return endpoint.replace(/\/images\/generations\/?([?#].*)?$/i, "/images/edits$1");
}

function publicCustomer(customer) {
  return {
    id: customer.id,
    balanceCents: Number(customer.balanceCents || 0),
    totalSpentCents: Number(customer.totalSpentCents || 0),
    totalRechargedCents: Number(customer.totalRechargedCents || 0),
    createdAt: Number(customer.createdAt || 0),
    updatedAt: Number(customer.updatedAt || 0),
  };
}

function publicOrder(order) {
  return {
    id: order.id,
    amountCents: Number(order.amountCents || 0),
    paymentMethod: order.paymentMethod,
    paymentReference: order.paymentReference || "",
    status: order.status,
    note: order.note || "",
    reviewNote: order.reviewNote || "",
    createdAt: Number(order.createdAt || 0),
    updatedAt: Number(order.updatedAt || 0),
    submittedAt: Number(order.submittedAt || 0),
    paidAt: Number(order.paidAt || 0),
  };
}

function publicUsage(usage) {
  return {
    id: usage.id,
    amountCents: Number(usage.amountCents || 0),
    imageCount: Number(usage.imageCount || 0),
    mode: usage.mode || "",
    model: usage.model || "",
    createdAt: Number(usage.createdAt || 0),
  };
}

function publicRedemption(redemption) {
  return {
    id: redemption.id,
    code: maskRedeemCode(redemption.code),
    contactEmail: redemption.contactEmailMasked || maskEmail(redemption.contactEmail || ""),
    amountCents: Number(redemption.amountCents || 0),
    label: redemption.label || "",
    createdAt: Number(redemption.createdAt || 0),
  };
}

function publicRedeemCode(code) {
  return {
    code: code.code,
    amountCents: Number(code.amountCents || 0),
    label: code.label || "",
    status: code.status || "active",
    createdAt: Number(code.createdAt || 0),
    updatedAt: Number(code.updatedAt || 0),
    usedAt: Number(code.usedAt || 0),
    usedBy: code.usedBy || "",
  };
}

function publicAnnouncement(announcement) {
  return {
    id: String(announcement?.id || ""),
    title: String(announcement?.title || "").trim(),
    body: String(announcement?.body || "").trim(),
    pinned: Boolean(announcement?.pinned),
    pinnedAt: Number(announcement?.pinnedAt || 0),
    createdAt: Number(announcement?.createdAt || 0),
    updatedAt: Number(announcement?.updatedAt || announcement?.createdAt || 0),
  };
}

function publicAdminOrder(order) {
  return {
    ...publicOrder(order),
    customerId: order.customerId,
    customer: order.customer || undefined,
  };
}

function maskRedeemCode(code) {
  const normalized = String(code || "");
  if (normalized.length <= 8) return normalized;
  return `${normalized.slice(0, 4)}...${normalized.slice(-4)}`;
}

function maskEmail(email) {
  const normalized = String(email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) return "";
  const [name, domain] = normalized.split("@");
  const safeName = name.length <= 2 ? `${name[0] || "*"}*` : `${name.slice(0, 2)}***${name.slice(-1)}`;
  return `${safeName}@${domain}`;
}

function isAdminRequest(req) {
  const provided = String(req.headers["x-admin-password"] || "").trim();
  const envPassword = String(process.env.BILLING_ADMIN_PASSWORD || "").trim();
  return Boolean(envPassword && provided === envPassword);
}

function formatMoney(cents) {
  return (Number(cents || 0) / 100).toFixed(2);
}

async function readJson(req) {
  const text = await readBody(req);
  if (!text) return {};
  return JSON.parse(text);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function sendJson(res, status, payload) {
  writeHead(res, status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(payload));
}

function sendText(res, status, text) {
  writeHead(res, status, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(text);
}

function writeHead(res, status, headers = {}) {
  const pending = res.__headers || {};
  res.writeHead(status, { ...pending, ...headers });
}

function appendSetCookie(res, name, value, options = {}) {
  const cookie = buildCookie(name, value, options);
  const headers = res.__headers || {};
  const existing = headers["Set-Cookie"];
  headers["Set-Cookie"] = existing ? [].concat(existing, cookie) : cookie;
  res.__headers = headers;
}

function buildCookie(name, value, options = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`, "Path=/"];
  if (options.httpOnly) parts.push("HttpOnly");
  if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
  if (options.maxAge) parts.push(`Max-Age=${Number(options.maxAge)}`);
  return parts.join("; ");
}

function parseCookies(header) {
  return String(header || "")
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean)
    .reduce((cookies, item) => {
      const index = item.indexOf("=");
      if (index === -1) return cookies;
      const key = item.slice(0, index).trim();
      const value = item.slice(index + 1).trim();
      cookies[key] = decodeURIComponent(value);
      return cookies;
    }, {});
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const raw = fs.readFileSync(filePath, "utf8");
  raw.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const index = trimmed.indexOf("=");
    if (index === -1) return;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "");
    if (key && process.env[key] == null) process.env[key] = value;
  });
}

function escapeMultipartName(value) {
  return String(value).replaceAll('"', "%22").replaceAll("\r", "").replaceAll("\n", "");
}
