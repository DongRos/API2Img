const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const port = Number(process.env.PORT || 4173);
const host = "127.0.0.1";

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

  res.writeHead(upstream.status, {
    "Content-Type": contentType,
    "Cache-Control": "no-store",
  });
  res.end(responseBody);
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

  fs.readFile(filePath, (error, data) => {
    if (error) {
      sendText(res, 404, "Not found");
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
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

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(payload));
}

function sendText(res, status, text) {
  res.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(text);
}

function escapeMultipartName(value) {
  return String(value).replaceAll('"', "%22").replaceAll("\r", "").replaceAll("\n", "");
}
