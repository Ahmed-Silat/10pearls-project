import axios from "axios";

export const API_URL = "http://localhost:8080";

/** sessionStorage key set when the user is logged out because their session expired. */
export const SESSION_EXPIRED_KEY = "sessionExpired";

/**
 * Shared axios instance. Attaches the JWT from localStorage to every
 * request and redirects to /login when the session expires (401).
 */
const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const stored = localStorage.getItem("userData");
  if (stored) {
    const { token } = JSON.parse(stored);
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.includes("/login")) {
      localStorage.removeItem("userData");
      // The page reloads below, so leave a note for the Login page to show a "session expired" toast.
      try {
        sessionStorage.setItem(SESSION_EXPIRED_KEY, "1");
      } catch {
        // Storage unavailable (e.g. private mode): the redirect still works, just without the toast.
      }
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

/** Extracts a human-readable message from a backend error response. */
export const getApiErrorMessage = (error, fallback = "Something went wrong") => {
  const data = error?.response?.data;
  if (data?.errors && typeof data.errors === "object") {
    return Object.values(data.errors).join(" ");
  }
  return data?.message || fallback;
};

export default api;