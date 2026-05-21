import { optionsResponse, proxyPhpApi } from "../lib/php-api-proxy.js";

export async function onRequest(context) {
  if (context.request.method === "OPTIONS") return optionsResponse();
  return proxyPhpApi(context);
}
