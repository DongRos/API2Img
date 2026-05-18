import { guarded, optionsResponse, restoreBalance } from "../../lib/billing-edgeone.js";

export async function onRequestOptions() {
  return optionsResponse();
}

export async function onRequestPost(context) {
  return guarded(restoreBalance, context);
}

export async function onRequest() {
  return new Response("Method not allowed", { status: 405 });
}
