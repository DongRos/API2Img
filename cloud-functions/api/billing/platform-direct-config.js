import { guarded, optionsResponse, platformDirectConfig } from "../../lib/billing-edgeone.js";

export async function onRequestOptions() {
  return optionsResponse();
}

export async function onRequestPost(context) {
  return guarded(platformDirectConfig, context);
}

export async function onRequest() {
  return new Response("Method not allowed", { status: 405 });
}
