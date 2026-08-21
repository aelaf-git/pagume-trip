import { api } from "./api";

export async function getReviews() {
  const rows = await api.get("/providers/reviews");
  return rows.map((r) => ({
    id: String(r.id),
    authorName: r.author_name,
    rating: r.rating,
    comment: r.comment,
    status: r.status,
    createdAt: r.created_at,
  }));
}

export async function hideReview(id) {
  const r = await api.put(`/providers/reviews/${id}/hide`, {});
  return {
    id: String(r.id),
    authorName: r.author_name,
    rating: r.rating,
    comment: r.comment,
    status: r.status,
    createdAt: r.created_at,
  };
}
