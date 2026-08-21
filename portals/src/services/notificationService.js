import { api } from "./api";

function relativeTime(iso) {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  const diff = Date.now() - t;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export async function getNotifications() {
  const rows = await api.get("/providers/notifications");
  return rows.map((n) => ({
    id: n.id,
    title: n.title,
    body: n.body,
    read: n.read,
    time: relativeTime(n.created_at),
    createdAt: n.created_at,
  }));
}

export async function markRead(id) {
  return api.put(`/providers/notifications/${id}/read`, {});
}
