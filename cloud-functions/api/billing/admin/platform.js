import { getPlatformAdminConfig, guarded, optionsResponse, updatePlatformAdminConfig } from "../../../lib/billing-edgeone.js";

export async function onRequestOptions() {
  return optionsResponse();
}

export async function onRequestGet(context) {
  return guarded(getPlatformAdminConfig, context);
}

export async function onRequestPost(context) {
  return guarded(updatePlatformAdminConfig, context);
}

export async function onRequest() {
  return new Response("Method not allowed", { status: 405 });
}
