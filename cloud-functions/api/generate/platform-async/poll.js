import { optionsResponse, proxyPhpApi } from "../../../lib/php-api-proxy.js";

export async function onRequestOptions() {
  return optionsResponse();
}

export async function onRequestPost(context) {
  return proxyPhpApi(context);
}

export async function onRequest() {
  return new Response("Method not allowed", { status: 405 });
}
