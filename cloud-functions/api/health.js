import { optionsResponse, proxyPhpApi } from "../lib/php-api-proxy.js";

export async function onRequestOptions() {
  return optionsResponse();
}

export async function onRequestGet(context) {
  try {
    return await proxyPhpApi(context);
  } catch {
    return new Response(
      JSON.stringify({
        ok: false,
        service: "api-2-image-edgeone-functions",
        time: new Date().toISOString(),
        phpProxy: false,
      }),
      {
        status: 503,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  }
}
