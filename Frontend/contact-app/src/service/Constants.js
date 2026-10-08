import axios from "axios";

export const API_URL = "http://localhost:8080";

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