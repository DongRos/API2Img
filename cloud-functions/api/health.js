export function onRequestGet() {
  return new Response(
    JSON.stringify({
      ok: true,
      service: "api-2-image-edgeone-functions",
      time: new Date().toISOString(),
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*",
      },
    },
  );
}
