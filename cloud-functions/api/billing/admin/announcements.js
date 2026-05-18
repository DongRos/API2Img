import { createAnnouncement, guarded, listAdminAnnouncements, optionsResponse } from "../../../lib/billing-edgeone.js";

export async function onRequestOptions() {
  return optionsResponse();
}

export async function onRequestGet(context) {
  return guarded(listAdminAnnouncements, context);
}

export async function onRequestPost(context) {
  return guarded(createAnnouncement, context);
}

export async function onRequest() {
  return new Response("Method not allowed", { status: 405 });
}
