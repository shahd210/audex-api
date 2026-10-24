
const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:8000/api/v1"
).replace(/\/+$/, "");

export function getToken() {
  return localStorage.getItem("audex_token");
}

export function setToken(token) {
  localStorage.setItem("audex_token", token);
}

export function clearToken() {
  localStorage.removeItem("audex_token");
}

export async function apiRequest(path, options = {}) {
  const token = getToken();

  const isFormData =
    typeof FormData !== "undefined" &&
    options.body instanceof FormData;

  const headers = {
    Accept: "application/json",
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    body:
      options.body && !isFormData && typeof options.body !== "string"
        ? JSON.stringify(options.body)
        : options.body,
  });

  const contentType = response.headers.get("content-type") || "";
  const responseText = await response.text();

  let payload = responseText;

  if (responseText && contentType.includes("application/json")) {
    try {
      payload = JSON.parse(responseText);
    } catch {
      throw new Error("The API returned an invalid JSON response.");
    }
  }

  if (!response.ok) {
    if (response.status === 401) {
      clearToken();
      window.dispatchEvent(new Event("audex:unauthorized"));
    }

    const validationMessages = payload?.errors
      ? Object.values(payload.errors).flat().join(" ")
      : "";

    throw new Error(
      validationMessages ||
        payload?.message ||
        (typeof payload === "string" && payload) ||
        `API request failed (${response.status}).`
    );
  }

  return payload;
}

export async function login(email, password) {
  const payload = await apiRequest("/auth/login", {
    method: "POST",
    body: { email, password },
  });

  if (!payload.token) {
    throw new Error("The API did not return an access token.");
  }

  setToken(payload.token);
  return payload.user;
}

export async function logout() {
  try {
    if (getToken()) {
      await apiRequest("/auth/logout", { method: "POST" });
    }
  } finally {
    clearToken();
  }
}

export function unwrapList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}
