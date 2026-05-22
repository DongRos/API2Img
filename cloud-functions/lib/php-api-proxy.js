const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "content-encoding",
  "content-length",
  "host",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

export async function proxyPhpApi(context) {
  const base = normalizePhpApiBaseUrl(getEnv(context, "PHP_API_BASE_URL")).replace(/\/+$/, "");
  if (!base) {
    return jsonResponse(503, { error: { code: "php_api_not_configured", message: "PHP API 尚未配置" } });
  }

  const sourceUrl = new URL(context.request.url);
  const targetUrl = new URL(`${base}${sourceUrl.pathname}${sourceUrl.search}`);
  const headers = new Headers();
  context.request.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (HOP_BY_HOP_HEADERS.has(lower)) return;
    headers.set(key, value);
  });
  headers.set("X-Forwarded-Host", sourceUrl.host);
  headers.set("X-Forwarded-Proto", sourceUrl.protocol.replace(":", ""));

  const init = {
    method: context.request.method,
    headers,
    redirect: "manual",
  };
  if (!["GET", "HEAD"].includes(context.request.method)) {
    init.body = await context.request.arrayBuffer();
  }

  const upstream = await fetch(targetUrl.toString(), init);
  const responseHeaders = new Headers();
  const proxiedSession = upstream.headers.get("x-api2image-set-session");
  const proxiedSessionMaxAge = upstream.headers.get("x-api2image-session-max-age") || String(30 * 86400);
  const shouldClearSession = upstream.headers.get("x-api2image-clear-session") === "1";
  upstream.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (HOP_BY_HOP_HEADERS.has(lower)) return;
    if (lower === "set-cookie") return;
    if (lower.startsWith("x-api2image-")) return;
    if (lower === "access-control-allow-origin") return;
    if (lower === "access-control-allow-credentials") return;
    responseHeaders.append(key, value);
  });
  if (proxiedSession) {
    responseHeaders.append("Set-Cookie", `api2image_session=${encodeURIComponent(proxiedSession)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${Number(proxiedSessionMaxAge) || 2592000}`);
  }
  if (shouldClearSession) {
    responseHeaders.append("Set-Cookie", "api2image_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0");
  }
  if (sourceUrl.pathname.startsWith("/api/gallery/image/")) {
    if (!responseHeaders.has("Cache-Control")) {
      responseHeaders.set("Cache-Control", "public, max-age=31536000, immutable");
    }
  } else {
    responseHeaders.set("Cache-Control", "no-store");
  }
  return new Response(await upstream.arrayBuffer(), {
    status: upstream.status,
    headers: responseHeaders,
  });
}

export function optionsResponse() {
  return new Response(null, { status: 204 });
}

function jsonResponse(status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function getEnv(context, key) {
  return String(context?.env?.[key] ?? globalThis?.process?.env?.[key] ?? "").trim();
}

function normalizePhpApiBaseUrl(value) {
  return String(value || "").replace(/^https?:\/\/(?:www\.|api\.)?api2img\.shop(?=\/|$)/i, "https://deep666.top");
}
