export async function onRequestOptions() {
  return corsResponse(null, { status: 204 });
}

export async function onRequestPost({ request }) {
  try {
    const payload = await request.json();
    const imageUrl = String(payload.url || "");

    if (!/^https?:\/\//i.test(imageUrl)) {
      return jsonResponse(400, { error: { message: "图片 URL 必须以 http:// 或 https:// 开头" } });
    }

    const upstream = await fetchWithTimeout(imageUrl, {
      headers: sanitizeHeaders(payload.headers || {}),
    }, 25000);
    const contentType = upstream.headers.get("content-type") || "";
    if (!upstream.ok || !contentType.startsWith("image/")) {
      return jsonResponse(upstream.ok ? 415 : upstream.status, {
        error: { message: `图片缓存失败：${upstream.status || 415}` },
      });
    }

    return jsonResponse(200, {
      dataUrl: `data:${contentType.split(";")[0]};base64,${arrayBufferToBase64(await upstream.arrayBuffer())}`,
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      return jsonResponse(504, { error: { code: "edgeone_cache_timeout", message: "EdgeOne 图片缓存代理超时" } });
    }
    return jsonResponse(500, { error: { message: error?.message || "Image cache error" } });
  }
}

export async function onRequest() {
  return textResponse(405, "Method not allowed");
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

function jsonResponse(status, payload) {
  return corsResponse(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

function textResponse(status, text) {
  return corsResponse(text, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}

function corsResponse(body, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return new Response(body, { ...init, headers });
}

function fetchWithTimeout(url, init, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer));
}

function arrayBufferToBase64(buffer) {
  if (typeof Buffer !== "undefined") return Buffer.from(buffer).toString("base64");
  const bytes = new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}
