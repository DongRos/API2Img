import { optionsResponse } from "../../lib/php-api-proxy.js";

export async function onRequestOptions() {
  return optionsResponse();
}

export async function onRequestPost() {
  return deprecatedPlatformResponse();
}

export async function onRequest() {
  return new Response("Method not allowed", { status: 405 });
}

function deprecatedPlatformResponse() {
  return new Response(
    JSON.stringify({
      ok: false,
      error: {
        code: "platform_direct_deprecated",
        message: "站点 API 已升级为后端数据库钱包扣费，不再向前端下发 API 配置。",
      },
    }),
    {
      status: 410,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      },
    },
  );
}
