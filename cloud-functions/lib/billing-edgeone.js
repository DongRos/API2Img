import { getStore } from "@edgeone/pages-blob";

const DB_KEY = "billing.json";
const DEFAULT_DB = {
  customers: {},
  sessions: {},
  orders: {},
  usage: {},
  redeemCodes: {},
  redemptions: {},
  settings: {},
};

export async function billingConfig(context) {
  const session = await resolveSession(context);
  const platform = await getPlatformConfig(context);
  return jsonResponse(
    200,
    {
      ok: true,
      priceCents: platform.priceCents,
      upstreamCostCents: platform.upstreamCostCents,
      currency: "CNY",
      paymentMethods: paymentMethods(context),
      platformEnabled: platform.enabled,
      customerId: session.customerId,
    },
    session,
  );
}

export async function billingMe(context) {
  const session = await resolveSession(context);
  const platform = await getPlatformConfig(context);
  const dashboard = await getDashboard(context, session.customerId);
  return jsonResponse(
    200,
    {
      ok: true,
      customerId: session.customerId,
      customer: publicCustomer(dashboard.customer),
      orders: dashboard.orders.map(publicOrder),
      usage: dashboard.usage.map(publicUsage),
      redemptions: dashboard.redemptions.map(publicRedemption),
      priceCents: platform.priceCents,
      upstreamCostCents: platform.upstreamCostCents,
      currency: "CNY",
    },
    session,
  );
}

export async function createOrder(context) {
  const session = await resolveSession(context);
  const payload = await readJson(context.request);
  const amountCents = normalizeRechargeAmount(payload.amountCents);
  const paymentMethod = normalizePaymentMethod(context, payload.paymentMethod);
  if (!amountCents) return jsonResponse(400, { error: { message: "充值金额不能低于 1 元" } }, session);
  if (!paymentMethod) return jsonResponse(400, { error: { message: "请选择微信或支付宝" } }, session);

  const order = await mutateDb(context, (db) => {
    const customer = ensureCustomerRecord(db, session.customerId);
    const now = Date.now();
    const record = {
      id: makeId("ord"),
      customerId: customer.id,
      amountCents,
      paymentMethod,
      note: String(payload.note || "").trim(),
      paymentReference: "",
      status: "pending",
      createdAt: now,
      updatedAt: now,
      submittedAt: 0,
      reviewedAt: 0,
      paidAt: 0,
      reviewNote: "",
    };
    db.orders[record.id] = record;
    customer.updatedAt = now;
    return { ...record };
  });

  return jsonResponse(
    200,
    {
      ok: true,
      order: publicOrder(order),
      payment: paymentMethods(context).find((item) => item.id === paymentMethod),
    },
    session,
  );
}

export async function submitOrder(context) {
  const session = await resolveSession(context);
  const payload = await readJson(context.request);
  const orderId = String(payload.orderId || "");
  const paymentReference = String(payload.paymentReference || "").trim().slice(0, 120);

  const order = await mutateDb(context, (db) => {
    const record = db.orders[orderId];
    if (!record || record.customerId !== session.customerId) throw new Error("订单不存在");
    if (record.status === "paid") return { ...record };
    if (record.status === "rejected") throw new Error("该订单已被驳回，请重新创建充值订单");
    const now = Date.now();
    record.status = "submitted";
    record.paymentReference = paymentReference;
    record.submittedAt = now;
    record.updatedAt = now;
    return { ...record };
  });

  return jsonResponse(200, { ok: true, order: publicOrder(order) }, session);
}

export async function redeemCode(context) {
  const session = await resolveSession(context);
  const payload = await readJson(context.request);
  const code = normalizeRedeemCode(payload.code);
  if (!code) return jsonResponse(400, { error: { message: "请输入兑换码" } }, session);

  const result = await mutateDb(context, (db) => {
    const customer = ensureCustomerRecord(db, session.customerId);
    const record = db.redeemCodes[code];
    if (!record) throw new Error("兑换码不存在");
    if (record.status !== "active" || record.usedAt || record.usedBy) throw new Error("兑换码已使用或已失效");

    const now = Date.now();
    const redemption = {
      id: makeId("rdm"),
      code,
      customerId: session.customerId,
      amountCents: Number(record.amountCents || 0),
      label: record.label || "",
      createdAt: now,
    };
    record.status = "used";
    record.usedAt = now;
    record.usedBy = session.customerId;
    record.redemptionId = redemption.id;
    record.updatedAt = now;
    db.redemptions[redemption.id] = redemption;
    customer.balanceCents += redemption.amountCents;
    customer.totalRechargedCents += redemption.amountCents;
    customer.updatedAt = now;
    return { redemption: { ...redemption }, customer: { ...customer } };
  });

  return jsonResponse(
    200,
    {
      ok: true,
      customer: publicCustomer(result.customer),
      redemption: publicRedemption(result.redemption),
    },
    session,
  );
}

export async function listAdminOrders(context) {
  if (!isAdminRequest(context)) return jsonResponse(401, { error: { message: "管理员密码不正确" } });
  const url = new URL(context.request.url);
  const limit = Math.max(1, Number(url.searchParams.get("limit") || 30));
  const db = await readDb(context);
  const orders = Object.values(db.orders)
    .filter((order) => order.status === "submitted")
    .sort((a, b) => Number(b.updatedAt || 0) - Number(a.updatedAt || 0))
    .slice(0, limit)
    .map((order) => ({
      ...publicAdminOrder(order),
      customer: {
        id: order.customerId,
        balanceCents: db.customers[order.customerId]?.balanceCents || 0,
      },
    }));
  return jsonResponse(200, { ok: true, orders });
}

export async function approveOrder(context) {
  if (!isAdminRequest(context)) return jsonResponse(401, { error: { message: "管理员密码不正确" } });
  const payload = await readJson(context.request);
  const result = await mutateDb(context, (db) => {
    const order = db.orders[String(payload.orderId || "")];
    if (!order) throw new Error("订单不存在");
    if (order.status === "paid") {
      return { order: { ...order }, customer: { ...ensureCustomerRecord(db, order.customerId) } };
    }
    if (order.status !== "submitted" && order.status !== "pending") throw new Error("该订单当前不能审核通过");
    const customer = ensureCustomerRecord(db, order.customerId);
    const now = Date.now();
    order.status = "paid";
    order.reviewNote = String(payload.reviewNote || "").trim().slice(0, 200);
    order.reviewedAt = now;
    order.paidAt = now;
    order.updatedAt = now;
    customer.balanceCents += Number(order.amountCents || 0);
    customer.totalRechargedCents += Number(order.amountCents || 0);
    customer.updatedAt = now;
    return { order: { ...order }, customer: { ...customer } };
  });
  return jsonResponse(200, { ok: true, order: publicAdminOrder(result.order), customer: publicCustomer(result.customer) });
}

export async function rejectOrder(context) {
  if (!isAdminRequest(context)) return jsonResponse(401, { error: { message: "管理员密码不正确" } });
  const payload = await readJson(context.request);
  const order = await mutateDb(context, (db) => {
    const record = db.orders[String(payload.orderId || "")];
    if (!record) throw new Error("订单不存在");
    if (record.status === "paid") throw new Error("已到账订单不能驳回");
    const now = Date.now();
    record.status = "rejected";
    record.reviewNote = String(payload.reviewNote || "").trim().slice(0, 200);
    record.reviewedAt = now;
    record.updatedAt = now;
    return { ...record };
  });
  return jsonResponse(200, { ok: true, order: publicAdminOrder(order) });
}

export async function listRedeemCodes(context) {
  if (!isAdminRequest(context)) return jsonResponse(401, { error: { message: "管理员密码不正确" } });
  const url = new URL(context.request.url);
  const limit = Math.max(1, Number(url.searchParams.get("limit") || 50));
  const db = await readDb(context);
  const codes = Object.values(db.redeemCodes)
    .sort((a, b) => Number(b.updatedAt || b.createdAt || 0) - Number(a.updatedAt || a.createdAt || 0))
    .slice(0, limit)
    .map(publicRedeemCode);
  return jsonResponse(200, { ok: true, codes });
}

export async function createRedeemCodes(context) {
  if (!isAdminRequest(context)) return jsonResponse(401, { error: { message: "管理员密码不正确" } });
  const payload = await readJson(context.request);
  const created = await mutateDb(context, (db) => {
    const now = Date.now();
    const codes = [];
    for (const item of payload.codes || []) {
      const code = normalizeRedeemCode(item.code);
      const amountCents = Math.max(1, Number(item.amountCents || 0));
      if (!code || !amountCents) continue;
      if (db.redeemCodes[code]) throw new Error(`兑换码已存在：${code}`);
      const record = {
        code,
        amountCents,
        label: String(item.label || "").trim(),
        status: "active",
        createdAt: now,
        updatedAt: now,
        usedAt: 0,
        usedBy: "",
        redemptionId: "",
      };
      db.redeemCodes[code] = record;
      codes.push({ ...record });
    }
    return codes;
  });
  return jsonResponse(200, { ok: true, codes: created.map(publicRedeemCode) });
}

export async function getPlatformAdminConfig(context) {
  if (!isAdminRequest(context)) return jsonResponse(401, { error: { message: "管理员密码不正确" } });
  return jsonResponse(200, { ok: true, platform: adminPlatformConfig(await getPlatformConfig(context)) });
}

export async function updatePlatformAdminConfig(context) {
  if (!isAdminRequest(context)) return jsonResponse(401, { error: { message: "管理员密码不正确" } });
  const payload = await readJson(context.request);
  const settings = await mutateDb(context, (db) => {
    const existing = db.settings.platform || {};
    const incomingApiKey = String(payload.apiKey || "").trim();
    const next = {
      ...existing,
      textEndpoint: String(payload.textEndpoint || "").trim(),
      editEndpoint: String(payload.editEndpoint || "").trim(),
      apiKey: incomingApiKey || existing.apiKey || "",
      priceCents: Math.max(1, Math.round(Number(payload.priceCents || 10))),
      upstreamCostCents: Math.max(0, Math.round(Number(payload.upstreamCostCents || 0))),
      updatedAt: Date.now(),
    };
    db.settings.platform = next;
    return { ...next };
  });
  return jsonResponse(200, { ok: true, platform: adminPlatformConfig(platformConfigFromSettings(context, settings)) });
}

export async function platformImage(context) {
  const session = await resolveSession(context);
  const platform = await getPlatformConfig(context);
  if (!platform.enabled) {
    return jsonResponse(503, { error: { message: "推荐 API 还没有配置，请联系站长处理" } }, session);
  }

  const payload = await readJson(context.request);
  const mode = payload.mode === "image" ? "image" : "text";
  const requestedCount = Math.max(1, Number(payload.count || 1));
  const requiredCents = requestedCount * platform.priceCents;
  const dashboard = await getDashboard(context, session.customerId);
  if (dashboard.customer.balanceCents < requiredCents) {
    return jsonResponse(
      402,
      {
        error: {
          code: "insufficient_balance",
          message: `余额不足，本次预计需要 ${formatMoney(requiredCents)} 元`,
        },
      },
      session,
    );
  }

  const endpoint = mode === "image" ? platform.editEndpoint || inferEditEndpoint(platform.textEndpoint) : platform.textEndpoint;
  if (!endpoint) return jsonResponse(503, { error: { message: "推荐 API 图生图接口还没有配置" } }, session);

  const upstreamRequest = payload.request || {};
  const upstream = await fetchUpstreamImage(endpoint, {
    ...upstreamRequest,
    headers: {
      ...sanitizePlatformRequestHeaders(upstreamRequest.headers || {}),
      Authorization: `Bearer ${platform.apiKey}`,
    },
  });
  const responseBytes = await upstream.arrayBuffer();
  const contentType = upstream.headers.get("content-type") || "application/json; charset=utf-8";

  const headers = new Headers({
    "Content-Type": contentType,
    "Cache-Control": "no-store",
  });
  appendSessionCookie(headers, session);
  return new Response(responseBytes, { status: upstream.status, headers });
}

export async function platformDirectConfig(context) {
  const session = await resolveSession(context);
  const platform = await getPlatformConfig(context);
  if (!platform.enabled) {
    return jsonResponse(503, { error: { message: "推荐 API 还没有配置，请联系站长处理" } }, session);
  }

  const payload = await readJson(context.request);
  const mode = payload.mode === "image" ? "image" : "text";
  const requestedCount = Math.max(1, Math.min(20, Math.round(Number(payload.count || 1))));
  const requiredCents = requestedCount * platform.priceCents;
  const dashboard = await getDashboard(context, session.customerId);
  if (dashboard.customer.balanceCents < requiredCents) {
    return jsonResponse(
      402,
      {
        error: {
          code: "insufficient_balance",
          message: `余额不足，本次预计需要 ${formatMoney(requiredCents)} 元`,
        },
      },
      session,
    );
  }

  const endpoint = mode === "image" ? platform.editEndpoint || inferEditEndpoint(platform.textEndpoint) : platform.textEndpoint;
  if (!endpoint) return jsonResponse(503, { error: { message: "推荐 API 图生图接口还没有配置" } }, session);

  return jsonResponse(
    200,
    {
      ok: true,
      endpoint,
      apiKey: platform.apiKey,
      priceCents: platform.priceCents,
      mode,
    },
    session,
  );
}

export async function platformUsage(context) {
  const session = await resolveSession(context);
  const platform = await getPlatformConfig(context);
  if (!platform.enabled) {
    return jsonResponse(503, { error: { message: "推荐 API 还没有配置，请联系站长处理" } }, session);
  }

  const payload = await readJson(context.request);
  const imageCount = Math.max(0, Math.min(20, Math.round(Number(payload.imageCount || 0))));
  if (!imageCount) return jsonResponse(400, { error: { message: "没有可扣费的图片" } }, session);

  const mode = payload.mode === "image" ? "image" : "text";
  const endpoint = mode === "image" ? platform.editEndpoint || inferEditEndpoint(platform.textEndpoint) : platform.textEndpoint;
  const charged = await recordUsage(context, session.customerId, {
    amountCents: imageCount * platform.priceCents,
    imageCount,
    mode,
    model: payload.model || "",
    endpoint,
    requestId: payload.requestId || payload.generationId || "",
  });

  return jsonResponse(
    200,
    {
      ok: true,
      chargedCents: charged.usage.amountCents,
      balanceCents: charged.customer.balanceCents,
      usage: publicUsage(charged.usage),
      customer: publicCustomer(charged.customer),
    },
    session,
  );
}

export function optionsResponse() {
  return corsResponse(null, { status: 204 });
}

export async function guarded(handler, context) {
  try {
    return await handler(context);
  } catch (error) {
    return jsonResponse(500, { error: { message: error?.message || "Billing error" } });
  }
}

async function resolveSession(context) {
  const token = parseCookies(context.request.headers.get("cookie") || "").image2_session || "";
  if (token) {
    const db = await readDb(context);
    const session = db.sessions[token];
    if (session && db.customers[session.customerId]) {
      await mutateDb(context, (writeDb) => {
        if (writeDb.sessions[token]) writeDb.sessions[token].lastSeenAt = Date.now();
      });
      return { sessionToken: token, customerId: session.customerId, isNew: false };
    }
  }

  return mutateDb(context, (db) => {
    const customerId = makeId("cus");
    const sessionToken = makeId("sess");
    const now = Date.now();
    db.customers[customerId] = {
      id: customerId,
      balanceCents: 0,
      totalSpentCents: 0,
      totalRechargedCents: 0,
      createdAt: now,
      updatedAt: now,
    };
    db.sessions[sessionToken] = {
      id: sessionToken,
      customerId,
      createdAt: now,
      lastSeenAt: now,
    };
    return { sessionToken, customerId, isNew: true };
  });
}

async function getDashboard(context, customerId) {
  const db = await readDb(context);
  const customer = ensureCustomerRecord(db, customerId);
  return {
    customer: { ...customer },
    orders: valuesByCustomer(db.orders, customerId).slice(0, 10),
    usage: valuesByCustomer(db.usage, customerId).slice(0, 12),
    redemptions: valuesByCustomer(db.redemptions, customerId).slice(0, 12),
  };
}

async function recordUsage(context, customerId, payload) {
  return mutateDb(context, (db) => {
    const customer = ensureCustomerRecord(db, customerId);
    const amountCents = Math.max(0, Number(payload.amountCents || 0));
    const requestId = String(payload.requestId || "").trim().slice(0, 160);
    if (requestId) {
      const existing = Object.values(db.usage).find((item) => item.customerId === customerId && item.requestId === requestId);
      if (existing) return { usage: { ...existing }, customer: { ...customer } };
    }
    if (customer.balanceCents < amountCents) throw new Error("余额不足");
    const now = Date.now();
    const usage = {
      id: makeId("use"),
      customerId,
      amountCents,
      imageCount: Math.max(0, Number(payload.imageCount || 0)),
      mode: String(payload.mode || "text"),
      model: String(payload.model || ""),
      endpoint: String(payload.endpoint || ""),
      requestId,
      createdAt: now,
    };
    db.usage[usage.id] = usage;
    customer.balanceCents -= amountCents;
    customer.totalSpentCents += amountCents;
    customer.updatedAt = now;
    return { usage: { ...usage }, customer: { ...customer } };
  });
}

async function fetchUpstreamImage(endpoint, request) {
  const headers = sanitizeHeaders(request.headers || {});
  const init = {
    method: request.method || "POST",
    headers,
  };

  if (request.bodyType === "multipart") {
    const form = new FormData();
    Object.entries(request.fields || {}).forEach(([key, value]) => {
      form.append(key, value == null ? "" : String(value));
    });
    for (const file of request.files || []) {
      const parsed = dataUrlToBlob(file.dataUrl || "");
      form.append(file.field || "image", parsed.blob, file.filename || "image.png");
    }
    delete init.headers["Content-Type"];
    delete init.headers["content-type"];
    init.body = form;
  } else {
    init.body = request.body || "";
    if (!init.headers["Content-Type"] && !init.headers["content-type"]) {
      init.headers["Content-Type"] = "application/json";
    }
  }

  return fetch(endpoint, init);
}

async function readDb(context) {
  const store = getBillingStore(context);
  try {
    return normalizeDb((await store.get(DB_KEY, { type: "json", consistency: "strong" })) || {});
  } catch {
    return normalizeDb({});
  }
}

async function writeDb(context, db) {
  await getBillingStore(context).setJSON(DB_KEY, normalizeDb(db));
}

async function mutateDb(context, mutator) {
  const db = await readDb(context);
  const result = await mutator(db);
  await writeDb(context, db);
  return result;
}

function getBillingStore(context) {
  return getStore({ name: getEnv(context, "BILLING_STORE_NAME") || "api2image-billing", consistency: "strong" });
}

function normalizeDb(value) {
  return {
    customers: isRecord(value?.customers) ? value.customers : { ...DEFAULT_DB.customers },
    sessions: isRecord(value?.sessions) ? value.sessions : { ...DEFAULT_DB.sessions },
    orders: isRecord(value?.orders) ? value.orders : { ...DEFAULT_DB.orders },
    usage: isRecord(value?.usage) ? value.usage : { ...DEFAULT_DB.usage },
    redeemCodes: isRecord(value?.redeemCodes) ? value.redeemCodes : { ...DEFAULT_DB.redeemCodes },
    redemptions: isRecord(value?.redemptions) ? value.redemptions : { ...DEFAULT_DB.redemptions },
    settings: isRecord(value?.settings) ? value.settings : { ...DEFAULT_DB.settings },
  };
}

function ensureCustomerRecord(db, customerId) {
  const customer = db.customers[customerId];
  if (!customer) throw new Error("用户不存在");
  customer.balanceCents = Number(customer.balanceCents || 0);
  customer.totalSpentCents = Number(customer.totalSpentCents || 0);
  customer.totalRechargedCents = Number(customer.totalRechargedCents || 0);
  customer.createdAt = Number(customer.createdAt || Date.now());
  customer.updatedAt = Number(customer.updatedAt || customer.createdAt);
  return customer;
}

function valuesByCustomer(record, customerId) {
  return Object.values(record)
    .filter((item) => item.customerId === customerId)
    .sort((a, b) => Number(b.updatedAt || b.createdAt || 0) - Number(a.updatedAt || a.createdAt || 0))
    .map((item) => ({ ...item }));
}

async function getPlatformConfig(context) {
  const db = await readDb(context);
  return platformConfigFromSettings(context, db.settings.platform || {});
}

function platformConfigFromSettings(context, settings = {}) {
  const textEndpoint = String(getEnv(context, "PLATFORM_TEXT_ENDPOINT") || settings.textEndpoint || "").trim();
  const editEndpoint = String(getEnv(context, "PLATFORM_EDIT_ENDPOINT") || settings.editEndpoint || "").trim();
  const apiKey = String(getEnv(context, "PLATFORM_API_KEY") || settings.apiKey || "").trim();
  const priceCents = Math.max(1, Number(getEnv(context, "PLATFORM_PRICE_CENTS") || settings.priceCents || 10));
  const upstreamCostCents = Math.max(0, Number(getEnv(context, "PLATFORM_UPSTREAM_COST_CENTS") || settings.upstreamCostCents || 4));
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

function paymentMethods(context) {
  return [
    {
      id: "wechat",
      name: "微信支付",
      qrUrl: getEnv(context, "PAYMENT_WECHAT_QR_URL"),
      note: getEnv(context, "PAYMENT_WECHAT_NOTE") || "付款时请备注订单号后六位",
    },
    {
      id: "alipay",
      name: "支付宝",
      qrUrl: getEnv(context, "PAYMENT_ALIPAY_QR_URL"),
      note: getEnv(context, "PAYMENT_ALIPAY_NOTE") || "付款时请备注订单号后六位",
    },
  ];
}

function normalizePaymentMethod(context, value) {
  const method = String(value || "").trim();
  return paymentMethods(context).some((item) => item.id === method) ? method : "";
}

function normalizeRechargeAmount(value) {
  const cents = Math.round(Number(value || 0));
  if (!Number.isFinite(cents) || cents < 100) return 0;
  return Math.min(cents, 500000);
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

function publicAdminOrder(order) {
  return {
    ...publicOrder(order),
    customerId: order.customerId,
  };
}

function normalizeRedeemCode(code) {
  return String(code || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/[^\w-]/g, "");
}

function maskRedeemCode(code) {
  const normalized = String(code || "");
  if (normalized.length <= 8) return normalized;
  return `${normalized.slice(0, 4)}...${normalized.slice(-4)}`;
}

function dataUrlToBlob(dataUrl) {
  const match = String(dataUrl).match(/^data:([^;,]+)?(;base64)?,(.*)$/);
  if (!match) throw new Error("图片数据格式无效");
  const mime = match[1] || "image/png";
  const raw = match[2] ? base64ToUint8Array(match[3]) : new TextEncoder().encode(decodeURIComponent(match[3] || ""));
  return { blob: new Blob([raw], { type: mime }), mime };
}

function base64ToUint8Array(base64) {
  if (typeof Buffer !== "undefined") return new Uint8Array(Buffer.from(String(base64 || ""), "base64"));
  const binary = atob(String(base64 || "").replace(/\s/g, ""));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
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

function inferEditEndpoint(textEndpoint) {
  return String(textEndpoint || "").replace(/\/images\/generations\/?([?#].*)?$/i, "/images/edits$1");
}

function isAdminRequest(context) {
  const provided = String(context.request.headers.get("x-admin-password") || "").trim();
  const envPassword = getEnv(context, "BILLING_ADMIN_PASSWORD");
  return Boolean(envPassword && provided === envPassword);
}

function getEnv(context, key) {
  return String(context?.env?.[key] ?? globalThis?.[key] ?? globalThis?.process?.env?.[key] ?? "").trim();
}

function parseCookies(header) {
  return String(header || "")
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean)
    .reduce((cookies, item) => {
      const index = item.indexOf("=");
      if (index === -1) return cookies;
      cookies[item.slice(0, index).trim()] = decodeURIComponent(item.slice(index + 1).trim());
      return cookies;
    }, {});
}

async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

function jsonResponse(status, payload, session = null) {
  return corsResponse(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
    session,
  });
}

function corsResponse(body, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Admin-Password");
  appendSessionCookie(headers, init.session);
  return new Response(body, { ...init, headers });
}

function appendSessionCookie(headers, session) {
  if (!session?.isNew) return;
  headers.append("Set-Cookie", `image2_session=${encodeURIComponent(session.sessionToken)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000`);
}

function formatMoney(cents) {
  return (Number(cents || 0) / 100).toFixed(2);
}

function isRecord(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

function makeId(prefix) {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  const body = [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${prefix}_${body}`;
}
