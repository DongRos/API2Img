import { getStore } from "@edgeone/pages-blob";

const STORE_NAME = "api2image-gallery";
const ITEM_PREFIX = "items/";
const IMAGE_PREFIX = "images/";
const MAX_GALLERY_BYTES = 5 * 1024 * 1024;

export async function onRequest(context) {
  if (context.request.method === "OPTIONS") return optionsResponse();
  const url = new URL(context.request.url);
  try {
    if (context.request.method === "GET" && url.pathname === "/api/gallery") {
      return listGallery(context, url);
    }
    if (context.request.method === "POST" && url.pathname === "/api/gallery") {
      return uploadGalleryItem(context);
    }
    const imageMatch = url.pathname.match(/^\/api\/gallery\/image\/([^/]+)$/);
    if (context.request.method === "GET" && imageMatch) {
      return readGalleryImage(context, imageMatch[1]);
    }
    return jsonResponse(404, { ok: false, error: { code: "not_found", message: "接口不存在" } });
  } catch (error) {
    const status = Number(error?.status || 500);
    return jsonResponse(status >= 400 && status < 600 ? status : 500, {
      ok: false,
      error: {
        code: "gallery_failed",
        message: error?.message || "画廊服务暂时不可用",
      },
    });
  }
}

async function listGallery(context, url) {
  const limit = clamp(Number(url.searchParams.get("limit") || 80), 1, 120);
  const store = galleryStore(context);
  const { blobs } = await store.list({ prefix: ITEM_PREFIX, consistency: "strong", paginate: false });
  const keys = blobs
    .map((item) => item.key)
    .filter((key) => key.startsWith(ITEM_PREFIX))
    .sort()
    .slice(0, limit);
  const items = (await Promise.all(keys.map((key) => readGalleryItem(store, key)))).filter(Boolean);
  return jsonResponse(200, { ok: true, gallery: items });
}

async function uploadGalleryItem(context) {
  const user = await currentGalleryUser(context);
  if (!user) {
    return jsonResponse(401, { ok: false, error: { code: "auth_required", message: "请先登录" } });
  }
  const payload = await readJson(context.request);
  const parsed = dataUrlToImage(payload.dataUrl || "");
  if (parsed.bytes.byteLength > MAX_GALLERY_BYTES) {
    return jsonResponse(413, { ok: false, error: { code: "gallery_image_too_large", message: "上传到画廊的图片不能超过 5MB" } });
  }

  const now = Date.now();
  const id = makeId();
  const filename = `${id}.${parsed.extension}`;
  const imageKey = `${IMAGE_PREFIX}${filename}`;
  const itemKey = `${ITEM_PREFIX}${String(9999999999999 - now).padStart(13, "0")}-${id}.json`;
  const item = {
    id,
    filename,
    prompt: usageText(payload.prompt || "", 1000),
    model: usageText(payload.model || "gpt-image-2", 120) || "gpt-image-2",
    size: usageText(payload.size || "", 40),
    width: Math.max(1, Math.round(Number(payload.width || 1))),
    height: Math.max(1, Math.round(Number(payload.height || 1))),
    uploaderEmail: user.email || "",
    createdAt: now,
  };

  const store = galleryStore(context);
  await store.set(imageKey, parsed.bytes.buffer.slice(parsed.bytes.byteOffset, parsed.bytes.byteOffset + parsed.bytes.byteLength), {
    cacheControl: "public, max-age=31536000, immutable",
  });
  await store.setJSON(itemKey, item, { cacheControl: "max-age=0, stale-while-revalidate=20" });
  return jsonResponse(200, { ok: true, item: publicGalleryItem(item) });
}

async function readGalleryImage(context, rawFilename) {
  const filename = basename(decodeURIComponent(rawFilename || ""));
  if (!/^[A-Za-z0-9_-]+\.(?:png|jpe?g|webp)$/.test(filename)) {
    return jsonResponse(404, { ok: false, error: { code: "gallery_image_not_found", message: "画廊图片不存在" } });
  }
  const bytes = await galleryStore(context).get(`${IMAGE_PREFIX}${filename}`, { type: "arrayBuffer", consistency: "strong" });
  if (!bytes) {
    return jsonResponse(404, { ok: false, error: { code: "gallery_image_not_found", message: "画廊图片不存在" } });
  }
  return new Response(bytes, {
    status: 200,
    headers: corsHeaders({
      "Content-Type": mimeFromFilename(filename),
      "Cache-Control": "public, max-age=31536000, immutable",
    }),
  });
}

async function readGalleryItem(store, key) {
  try {
    const item = await store.get(key, { type: "json", consistency: "strong" });
    return item?.filename ? publicGalleryItem(item) : null;
  } catch {
    return null;
  }
}

async function currentGalleryUser(context) {
  const base = normalizePhpApiBaseUrl(getEnv(context, "PHP_API_BASE_URL")).replace(/\/+$/, "");
  if (!base) return null;
  const headers = new Headers();
  const token = context.request.headers.get("x-api2image-session") || parseCookies(context.request.headers.get("cookie") || "").api2image_session || "";
  if (token) headers.set("X-Api2Image-Session", token);
  const cookie = context.request.headers.get("cookie") || "";
  if (cookie) headers.set("Cookie", cookie);
  const response = await fetch(`${base}/api/auth/me`, { headers });
  const payload = await response.json().catch(() => ({}));
  return response.ok && payload?.authenticated && payload?.user ? payload.user : null;
}

function publicGalleryItem(item) {
  return {
    id: String(item.id || ""),
    src: `/api/gallery/image/${encodeURIComponent(item.filename || "")}`,
    prompt: String(item.prompt || ""),
    model: String(item.model || ""),
    size: String(item.size || ""),
    width: Math.max(1, Number(item.width || 1)),
    height: Math.max(1, Number(item.height || 1)),
    createdAt: Math.max(0, Number(item.createdAt || 0)),
    uploader: maskEmail(String(item.uploaderEmail || "")),
  };
}

function dataUrlToImage(dataUrl) {
  const match = String(dataUrl).match(/^data:(image\/(?:png|jpe?g|webp))(;base64)?,(.*)$/is);
  if (!match) throw new Error("参考图格式无效");
  const mime = match[1].toLowerCase();
  const bytes = match[2] ? base64ToUint8Array(match[3]) : new TextEncoder().encode(decodeURIComponent(match[3] || ""));
  if (!bytes.byteLength) throw new Error("参考图数据无效");
  const extension = mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";
  return { bytes, mime, extension };
}

function base64ToUint8Array(value) {
  const clean = String(value || "").replace(/\s+/g, "");
  const binary = typeof atob === "function" ? atob(clean) : Buffer.from(clean, "base64").toString("binary");
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function galleryStore(context) {
  return getStore({ name: getEnv(context, "GALLERY_STORE_NAME") || STORE_NAME, consistency: "strong" });
}

function jsonResponse(status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: corsHeaders({
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    }),
  });
}

function optionsResponse() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

function corsHeaders(extra = {}) {
  const headers = new Headers(extra);
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, X-Api2Image-Session");
  return headers;
}

async function readJson(request) {
  const payload = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object") throw new Error("请求 JSON 格式不正确");
  return payload;
}

function makeId() {
  if (crypto.randomUUID) return crypto.randomUUID().replace(/-/g, "");
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function usageText(value, limit) {
  return String(value || "").replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]+/g, "").trim().slice(0, limit);
}

function basename(value) {
  return String(value || "").split(/[\\/]/).pop() || "";
}

function mimeFromFilename(filename) {
  if (/\.png$/i.test(filename)) return "image/png";
  if (/\.webp$/i.test(filename)) return "image/webp";
  return "image/jpeg";
}

function maskEmail(email) {
  const clean = email.trim().toLowerCase();
  const [name, domain] = clean.split("@");
  if (!name || !domain) return "";
  return `${name.slice(0, 2)}***@${domain}`;
}

function clamp(value, min, max) {
  const numeric = Number.isFinite(value) ? value : min;
  return Math.max(min, Math.min(max, numeric));
}

function parseCookies(value) {
  return String(value || "")
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((cookies, part) => {
      const index = part.indexOf("=");
      if (index <= 0) return cookies;
      cookies[part.slice(0, index)] = decodeURIComponent(part.slice(index + 1));
      return cookies;
    }, {});
}

function getEnv(context, key) {
  return String(context?.env?.[key] ?? globalThis?.process?.env?.[key] ?? "").trim();
}

function normalizePhpApiBaseUrl(value) {
  return String(value || "").replace(/^https?:\/\/api2img\.shop(?=\/|$)/i, "https://www.api2img.shop");
}
