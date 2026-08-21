const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1";

function getStoredToken() {
  try {
    const raw = localStorage.getItem("pagume_auth_session");
    if (!raw) return null;
    const session = JSON.parse(raw);
    return session?.token ?? null;
  } catch {
    return null;
  }
}

async function request(path, { method = "GET", body, token, formData } = {}) {
  const headers = {};
  const authToken = token ?? getStoredToken();
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  let payload = body;
  if (formData) {
    payload = formData;
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: payload,
  });

  if (!res.ok) {
    const message = await res.text().catch(() => res.statusText);
    let detail = message || `Request failed with status ${res.status}`;
    try {
      const json = JSON.parse(message);
      detail = json.detail || detail;
      if (Array.isArray(detail)) detail = detail.map((d) => d.msg || d).join(", ");
    } catch {
      /* plain text */
    }
    throw new Error(typeof detail === "string" ? detail : "Request failed");
  }

  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  get: (path, token) => request(path, { token }),
  post: (path, body, token) => request(path, { method: "POST", body, token }),
  put: (path, body, token) => request(path, { method: "PUT", body, token }),
  del: (path, token) => request(path, { method: "DELETE", token }),
  postForm: (path, formData, token) =>
    request(path, { method: "POST", formData, token }),
};

export { BASE_URL };
