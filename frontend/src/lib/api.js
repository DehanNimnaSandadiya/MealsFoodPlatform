/**
 * API client: base URL + optional Clerk token for authenticated requests.
 */

const rawBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const BASE = typeof rawBase === "string" ? rawBase.replace(/\/+$/, "") : rawBase;

export const api = {
  async request(path, options = {}, getToken) {
    const p = path.startsWith("/") ? path : `/${path}`;
    const url = path.startsWith("http") ? path : `${BASE}${p}`;
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };
    if (getToken) {
      try {
        const token = await getToken();
        if (token) headers.Authorization = `Bearer ${token}`;
      } catch {
        // ignore
      }
    }
    const res = await fetch(url, { ...options, headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data?.error?.message || "Request failed");
      err.code = data?.error?.code;
      err.status = res.status;
      throw err;
    }
    return data;
  },

  get(path, getToken) {
    return this.request(path, { method: "GET" }, getToken);
  },

  post(path, body, getToken) {
    return this.request(path, { method: "POST", body: JSON.stringify(body) }, getToken);
  },

  patch(path, body, getToken) {
    return this.request(path, { method: "PATCH", body: JSON.stringify(body) }, getToken);
  },

  delete(path, getToken) {
    return this.request(path, { method: "DELETE" }, getToken);
  },
};

export default api;
