import { api } from "./api";

function mapItem(item) {
  return {
    id: String(item.id),
    providerId: String(item.provider_id),
    contentType: item.content_type,
    contentRefId: item.content_ref_id,
    title: item.title,
    description: item.description,
    status: item.status,
    flagReason: item.flag_reason,
    providerName: item.provider_name,
    category: item.category,
    uploadedAt: item.uploaded_at,
  };
}

export async function getContentItems() {
  const rows = await api.get("/admin/moderation");
  return rows.map(mapItem);
}

export async function approveContent(id) {
  const item = await api.put(`/admin/moderation/${id}`, { status: "APPROVED" });
  return mapItem(item);
}

export async function flagContent(id, reason) {
  const item = await api.put(`/admin/moderation/${id}`, {
    status: "FLAGGED",
    flag_reason: reason,
  });
  return mapItem(item);
}

export async function requestContentEdit(id, reason) {
  const item = await api.put(`/admin/moderation/${id}`, {
    status: "EDIT_REQUESTED",
    flag_reason: reason,
  });
  return mapItem(item);
}

export const requestEdit = requestContentEdit;
