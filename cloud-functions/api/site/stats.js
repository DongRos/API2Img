import { guarded, optionsResponse, siteStats } from "../../lib/billing-edgeone.js";

export async function onRequestOptions() {
  return optionsResponse();
}

export async function onRequestGet(context) {
  return guarded(siteStats, context);
}

export async function onRequest() {
  return new Response("Method not allowed", { status: 405 });
}
