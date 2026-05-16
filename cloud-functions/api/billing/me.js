import { billingMe, guarded, optionsResponse } from "../../lib/billing-edgeone.js";

export async function onRequestOptions() {
  return optionsResponse();
}

export async function onRequestGet(context) {
  return guarded(billingMe, context);
}

export async function onRequest() {
  return new Response("Method not allowed", { status: 405 });
}
