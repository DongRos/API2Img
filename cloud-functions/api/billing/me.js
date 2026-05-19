import { deprecatedResponse, optionsResponse } from "../../lib/deprecated-response.js";

export async function onRequestOptions() {
  return optionsResponse();
}

export async function onRequestGet() {
  return deprecatedResponse("旧钱包接口已停用，请使用邮箱验证码登录后的 /api/auth/me。", "billing_me_deprecated");
}

export async function onRequest() {
  return new Response("Method not allowed", { status: 405 });
}
