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
        code: "platform_usage_deprecated",
        message: "站点 API 扣费已迁移到后端原子事务，前端上报扣费接口已停用。",
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
