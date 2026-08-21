import { api } from "./api";

export async function getUsers(params = {}) {
  const q = new URLSearchParams();
  if (params.role) q.set("role", params.role);
  if (params.is_verified != null) q.set("is_verified", String(params.is_verified));
  const suffix = q.toString() ? `?${q}` : "";
  return api.get(`/admin/users${suffix}`);
}

export async function setUserVerified(userId, isVerified) {
  return api.put(`/admin/users/${userId}/verify?is_verified=${isVerified}`, {});
}

export async function getAdminBookings() {
  const rows = await api.get("/admin/bookings");
  return rows.map((b) => ({
    id: String(b.id),
    providerId: String(b.provider_id),
    serviceName: b.service_name,
    customerName: b.customer_name,
    dates: b.dates,
    price: b.price,
    bookingStatus: b.booking_status,
    paymentStatus: b.payment_status,
  }));
}

export async function getSettings() {
  return api.get("/admin/settings");
}

export async function upsertSetting(key, value) {
  return api.put(`/admin/settings/${key}`, { value });
}
