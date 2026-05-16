import { createRedeemCodes, guarded, listRedeemCodes, optionsResponse } from "../../../lib/billing-edgeone.js";

export async function onRequestOptions() {
  return optionsResponse();
}

export async function onRequestGet(context) {
  return guarded(listRedeemCodes, context);
}

export async function onRequestPost(context) {
  return guarded(createRedeemCodes, context);
}

export async function onRequest() {
  return new Response("Method not allowed", { status: 405 });
}
