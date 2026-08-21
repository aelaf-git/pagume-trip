import { api } from "./api";

function mapDocs(documents) {
  if (!Array.isArray(documents)) return {};
  const out = {};
  for (const d of documents) {
    out[d.doc_type] = {
      name: d.file_name,
      size: d.file_size,
      status: "success",
      url: d.url,
    };
  }
  return out;
}

function mapStatus(status) {
  if (status === "PENDING" || status === "DOCS_REQUESTED") return "UNDER_REVIEW";
  return status;
}

function mapProvider(p) {
  return {
    id: String(p.user_id),
    profileId: p.id,
    businessName: p.business_name,
    category: p.category,
    email: p.email,
    phone: p.phone,
    address: p.address,
    registeredAt: p.registered_at,
    status: mapStatus(p.status),
    rejectionReason: p.rejection_reason,
    statusNote: p.status_note,
    registrationData: p.details || {},
    documents: mapDocs(p.documents),
  };
}

export async function getProviders() {
  const rows = await api.get("/admin/providers");
  return rows.map(mapProvider);
}

export async function getProvider(id) {
  const rows = await getProviders();
  return rows.find((p) => p.id === String(id)) || null;
}

export async function approveProvider(id) {
  const p = await api.put(`/admin/providers/${id}/status`, {
    status: "VERIFIED",
    reason: "Verified by admin.",
  });
  return mapProvider(p);
}

export async function rejectProvider(id, reason) {
  const p = await api.put(`/admin/providers/${id}/status`, {
    status: "REJECTED",
    reason,
  });
  return mapProvider(p);
}

export async function requestDocuments(id, reason) {
  const p = await api.put(`/admin/providers/${id}/status`, {
    status: "DOCS_REQUESTED",
    reason: reason || "Additional documents requested.",
  });
  return mapProvider(p);
}

export async function suspendProvider(id, reason) {
  const p = await api.put(`/admin/providers/${id}/status`, {
    status: "SUSPENDED",
    reason,
  });
  return mapProvider(p);
}
