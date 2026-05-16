import { approveOrder, guarded, optionsResponse } from "../../../../lib/billing-edgeone.js";

export async function onRequestOptions() {
  return optionsResponse();
}

export async function onRequestPost(context) {
  return guarded(approveOrder, context);
}

export async function onRequest() {
  return new Response("Method not allowed", { status: 405 });
}
