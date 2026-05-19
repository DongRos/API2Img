import { optionsResponse } from "../../lib/php-api-proxy.js";

export async function onRequestOptions() {
  return optionsResponse();
}

export async function onRequestPost() {
  return new Response(
    JSON.stringify({
      ok: false,
      error: {
        code: "restore_deprecated",
        message: "余额找回已升级为邮箱验证码登录，请登录同一邮箱查看余额。",
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

export async function onRequest() {
  return new Response("Method not allowed", { status: 405 });
}
