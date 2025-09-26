import axios from "axios";
import { toast } from "react-toastify";

// Base URL (override via REACT_APP_API_BASE_URL)
const rawBase =
  (process.env.REACT_APP_API_BASE_URL &&
    process.env.REACT_APP_API_BASE_URL.trim()) ||
  "https://app.xolorebytesolutions.com";

// Ensure it ends with /api (but not //api)
function normalizeBaseUrl(url) {
  const u = url.replace(/\/+$/, ""); // strip trailing slashes
  return u.endsWith("/api") ? u : `${u}/api`;
}

const apiBaseUrl = normalizeBaseUrl(rawBase);

// Single source of truth for token key
export const TOKEN_KEY = "xbyte_token";

const axiosClient = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: false, // we use Bearer tokens, not cookies
});

// Attach Authorization header if token exists
axiosClient.interceptors.request.use(config => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Helpers to avoid noisy toasts/redirect loops on auth screens
const AUTH_PAGES = [
  "/login",
  "/signup",
  "/pending-approval",
  "/profile-completion",
];
const isOnAuthPage = () =>
  AUTH_PAGES.some(p => window.location.pathname.startsWith(p));

let showingAuthToast = false;

axiosClient.interceptors.response.use(
  res => res,
  error => {
    const status = error?.response?.status;
    const msg =
      error?.response?.data?.message ||
      error?.message ||
      "❌ Something went wrong.";

    const cfg = error?.config || {};
    const suppress401 =
      cfg.__silent401 ||
      cfg.headers?.["x-suppress-401-toast"] ||
      isOnAuthPage();
    const suppress403 =
      cfg.__silent403 ||
      cfg.headers?.["x-suppress-403-toast"] ||
      isOnAuthPage();

    if (status === 401) {
      // Token invalid/expired or not authorized (yet)
      localStorage.removeItem(TOKEN_KEY);

      if (!suppress401 && !showingAuthToast) {
        toast.error("⏰ Session expired. Please log in again.");
        showingAuthToast = true;
        setTimeout(() => (showingAuthToast = false), 2000);
      }

      // Only redirect if we aren't already on an auth page and we didn't opt out
      if (!suppress401 && !isOnAuthPage()) {
        const redirectTo = encodeURIComponent(
          window.location.pathname +
            window.location.search +
            window.location.hash
        );
        window.location.href = `/login?redirectTo=${redirectTo}`;
      }

      return Promise.reject(error);
    }

    if (status === 403) {
      // Forbidden (e.g., business pending/under review). Don't scream on auth pages.
      if (!suppress403 && !showingAuthToast) {
        toast.error("⛔ Access denied.");
        showingAuthToast = true;
        setTimeout(() => (showingAuthToast = false), 2000);
      }
      return Promise.reject(error);
    }

    // Generic error
    if (!showingAuthToast) {
      toast.error(msg);
      showingAuthToast = true;
      setTimeout(() => (showingAuthToast = false), 1500);
    }

    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error("[Axios Error]", error);
    }

    return Promise.reject(error);
  }
);

if (process.env.NODE_ENV !== "production") {
  // eslint-disable-next-line no-console
  console.log("✅ Axios BASE URL:", axiosClient.defaults.baseURL);
}

export default axiosClient;
