export async function onRequestOptions() {
  return corsResponse(null, { status: 204 });
}

export async function onRequestPost({ request }) {
  try {
    const payload = await request.json();
    const endpoint = String(payload.endpoint || "");
    const upstreamRequest = payload.request || {};

    if (!/^https?:\/\//i.test(endpoint)) {
      return jsonResponse(400, { error: { message: "API URL 必须以 http:// 或 https:// 开头" } });
    }

    const headers = sanitizeHeaders(upstreamRequest.headers || {});
    const init = {
      method: upstreamRequest.method || "POST",
      headers,
    };

    if (upstreamRequest.bodyType === "multipart") {
      const form = new FormData();
      Object.entries(upstreamRequest.fields || {}).forEach(([key, value]) => {
        form.append(key, value == null ? "" : String(value));
      });
      for (const file of upstreamRequest.files || []) {
        const parsed = dataUrlToBlob(file.dataUrl || "");
        form.append(file.field || "image", parsed.blob, file.filename || "image.png");
      }
      delete init.headers["Content-Type"];
      delete init.headers["content-type"];
      init.body = form;
    } else {
      init.body = upstreamRequest.body || "";
      if (!init.headers["Content-Type"] && !init.headers["content-type"]) {
        init.headers["Content-Type"] = "application/json";
      }
    }

    const upstream = await fetchWithTimeout(endpoint, init, 25000);
    const contentType = upstream.headers.get("content-type") || "application/json; charset=utf-8";
    const responseBytes = await upstream.arrayBuffer();

    if (contentType.startsWith("image/")) {
      return jsonResponse(upstream.status, {
        data: [{ url: `data:${contentType.split(";")[0]};base64,${arrayBufferToBase64(responseBytes)}` }],
      });
    }

    return corsResponse(responseBytes, {
      status: upstream.status,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      return jsonResponse(504, {
        error: {
          code: "edgeone_proxy_timeout",
          message: "EdgeOne 代理等待上游生图超时。请在网页设置里切换到“浏览器直连”，或降低生成数量后重试。",
        },
      });
    }
    return jsonResponse(500, { error: { message: error?.message || "Proxy server error" } });
  }
}

export async function onRequest() {
  return textResponse(405, "Method not allowed");
}

function dataUrlToBlob(dataUrl) {
  const match = String(dataUrl).match(/^data:([^;,]+)?(;base64)?,(.*)$/);
  if (!match) throw new Error("图片数据格式无效");
  const mime = match[1] || "image/png";
  const raw = match[2] ? base64ToUint8Array(match[3]) : new TextEncoder().encode(decodeURIComponent(match[3] || ""));
  return { blob: new Blob([raw], { type: mime }), mime };
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

function base64ToUint8Array(base64) {
  const normalized = String(base64 || "").replace(/\s/g, "");
  if (typeof Buffer !== "undefined") return new Uint8Array(Buffer.from(normalized, "base64"));
  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
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
