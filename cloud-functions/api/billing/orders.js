import { deprecatedResponse, optionsResponse } from "../../lib/deprecated-response.js";

export async function onRequestOptions() {
  return optionsResponse();
}

export async function onRequestPost() {
  return deprecatedResponse("旧订单充值接口已停用，请登录后用发卡网卡密兑换到账。", "orders_deprecated");
}

export async function onRequest() {
  return new Response("Method not allowed", { status: 405 });
}
