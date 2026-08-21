import { api } from "./api";

export async function getPayments() {
  const rows = await api.get("/providers/payments");
  return rows.map((p) => ({
    id: String(p.id),
    bookingId: p.booking_id != null ? String(p.booking_id) : null,
    amount: p.amount,
    currency: p.currency,
    status: p.status,
    method: p.method,
    reference: p.reference,
    occurredAt: p.occurred_at,
  }));
}

export async function getAdminPayments() {
  const rows = await api.get("/admin/payments");
  return rows.map((p) => ({
    id: String(p.id),
    providerId: String(p.provider_id),
    bookingId: p.booking_id != null ? String(p.booking_id) : null,
    amount: p.amount,
    currency: p.currency,
    status: p.status,
    method: p.method,
    reference: p.reference,
    occurredAt: p.occurred_at,
  }));
}
