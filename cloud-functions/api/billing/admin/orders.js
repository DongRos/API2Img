import { deprecatedResponse, optionsResponse } from "../../../lib/deprecated-response.js";

export async function onRequestOptions() {
  return optionsResponse();
}

export async function onRequestGet() {
  return deprecatedResponse("旧订单后台接口已停用。", "admin_orders_deprecated");
}

export async function onRequest() {
  return new Response("Method not allowed", { status: 405 });
}
