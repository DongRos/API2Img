import { optionsResponse } from "./php-api-proxy.js";

export { optionsResponse };

export function deprecatedResponse(message, code = "deprecated") {
  return new Response(
    JSON.stringify({
      ok: false,
      error: { code, message },
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
