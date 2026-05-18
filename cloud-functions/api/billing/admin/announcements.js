import {
  createAnnouncement,
  deleteAnnouncement,
  guarded,
  listAdminAnnouncements,
  optionsResponse,
  updateAnnouncement,
} from "../../../lib/billing-edgeone.js";

export async function onRequestOptions() {
  return optionsResponse();
}

export async function onRequestGet(context) {
  return guarded(listAdminAnnouncements, context);
}

export async function onRequestPost(context) {
  return guarded(createAnnouncement, context);
}

export async function onRequestPatch(context) {
  return guarded(updateAnnouncement, context);
}

export async function onRequestDelete(context) {
  return guarded(deleteAnnouncement, context);
}

export async function onRequest() {
  return new Response("Method not allowed", { status: 405 });
}
