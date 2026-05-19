import { deprecatedResponse, optionsResponse } from "../../../lib/deprecated-response.js";

export async function onRequestOptions() {
  return optionsResponse();
}

export async function onRequestGet() {
  return deprecatedResponse("推荐 API 配置已迁移到 PHP 服务器配置文件。", "admin_platform_deprecated");
}

export async function onRequestPost() {
  return deprecatedResponse("推荐 API 配置已迁移到 PHP 服务器配置文件。", "admin_platform_deprecated");
}

export async function onRequest() {
  return new Response("Method not allowed", { status: 405 });
}
