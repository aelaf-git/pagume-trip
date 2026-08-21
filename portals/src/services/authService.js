import { api } from "./api";
import { normalizeUser, REGISTER_TYPE_TO_ROLE } from "../utils/roles";

const BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1";

export async function login(email, password) {
  const form = new URLSearchParams();
  form.set("username", email);
  form.set("password", password);

  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text.includes("Incorrect") ? "Invalid email or password." : "Login failed.");
  }
  const { access_token } = await res.json();
  const me = await api.get("/auth/me", access_token);
  return { token: access_token, user: normalizeUser(me) };
}

export async function register({ email, password, fullName, providerType }) {
  const role = REGISTER_TYPE_TO_ROLE[providerType];
  if (!role) throw new Error("Unknown provider type");
  const created = await api.post("/auth/register", {
    email,
    password,
    full_name: fullName,
    role,
  });
  return normalizeUser(created);
}

export async function logout() {
  return true;
}

export async function fetchMe(token) {
  const me = await api.get("/auth/me", token);
  return normalizeUser(me);
}
