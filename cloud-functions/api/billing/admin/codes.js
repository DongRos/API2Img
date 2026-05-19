import { deprecatedResponse, optionsResponse } from "../../../lib/deprecated-response.js";

export async function onRequestOptions() {
  return optionsResponse();
}

export async function onRequestGet() {
  return deprecatedResponse("旧兑换码管理接口已停用，请使用 /api/admin/redeem-codes。", "admin_codes_deprecated");
}

export async function onRequestPost() {
  return deprecatedResponse("旧兑换码管理接口已停用，请使用 /api/admin/redeem-codes。", "admin_codes_deprecated");
}

export async function onRequest() {
  return new Response("Method not allowed", { status: 405 });
}
