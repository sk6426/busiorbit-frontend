// 📄 src/utils/axiosClient.js
import axios from "axios";
import { toast } from "react-toastify";

// 👉 Set this in your env: REACT_APP_API_BASE_URL=https://busiorbit-api-hcbyhrg2gafqe6e7.centralindia-01.azurewebsites.net
const apiBaseUrl =
  (process.env.REACT_APP_API_BASE_URL &&
    process.env.REACT_APP_API_BASE_URL.trim()) ||
  "https://busiorbit-api-hcbyhrg2gafqe6e7.centralindia-01.azurewebsites.net";

// Token storage key (single source of truth)
export const TOKEN_KEY = "xbyte_token";

const axiosClient = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  // ❌ No cookies in Bearer mode
  withCredentials: false,
});

// 🔐 Attach Authorization header if token exists
axiosClient.interceptors.request.use(config => {
  const t = localStorage.getItem(TOKEN_KEY);
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

// ❗Basic error handling
axiosClient.interceptors.response.use(
  res => res,
  error => {
    const status = error?.response?.status;
    if (status === 401) {
      // Not authenticated or token expired
      const redirectTo = encodeURIComponent(
        window.location.pathname + window.location.search
      );
      toast.error("⏰ Session expired. Please log in again.");
      localStorage.removeItem(TOKEN_KEY);
      window.location.href = `/login?redirectTo=${redirectTo}`;
      return;
    }
    if (status === 403) toast.error("⛔ Access denied.");
    const msg = error?.response?.data?.message || "❌ Something went wrong.";
    toast.error(msg);
    if (process.env.NODE_ENV !== "production")
      console.error("[Axios Error]", error);
    return Promise.reject(error);
  }
);

if (process.env.NODE_ENV !== "production") {
  console.log("✅ Axios BASE URL:", axiosClient.defaults.baseURL);
}

export default axiosClient;

// // 📄 src/utils/axiosClient.js
// import axios from "axios";
// import { toast } from "react-toastify";

// // 🚦 API base URL from env (fallback to same-origin for SSR/local dev)
// const apiBaseUrl = process.env.REACT_APP_API_BASE_URL?.trim() || ""; // "" = same origin (useful for SSR/local/proxy setups)

// // 🚨 Warn if HTTP in production (not allowed for secure cookies)
// if (
//   process.env.NODE_ENV === "production" &&
//   apiBaseUrl &&
//   !apiBaseUrl.startsWith("https://")
// ) {
//   // eslint-disable-next-line no-console
//   console.warn(
//     "[SECURITY] API base URL is not HTTPS! Secure cookies will not work in production."
//   );
// }

// // ✅ Create Axios instance with cookie support (secure by default)
// const axiosClient = axios.create({
//   baseURL: apiBaseUrl,
//   headers: {
//     "Content-Type": "application/json",
//     Accept: "application/json", // Always expect JSON
//     // Example: If you add CSRF protection, add here:
//     // "X-CSRF-Token": csrfToken,
//   },
//   withCredentials: true, // Always send cookies (needed for HttpOnly JWT)
// });

// // Refresh logic for handling token/session expiry (same as your version)
// let isRefreshing = false;
// let refreshSubscribers = [];

// function onRefreshed() {
//   refreshSubscribers.forEach(callback => callback());
//   refreshSubscribers = [];
// }
// function addRefreshSubscriber(callback) {
//   refreshSubscribers.push(callback);
// }

// axiosClient.interceptors.response.use(
//   response => response,
//   async error => {
//     const status = error?.response?.status;
//     const originalRequest = error.config;
//     const isRefreshRequest = originalRequest?.url?.includes("/auth/refresh");

//     if (status === 401 && !originalRequest._retry && !isRefreshRequest) {
//       originalRequest._retry = true;
//       if (!originalRequest._retryCount) originalRequest._retryCount = 0;
//       if (originalRequest._retryCount >= 1) return Promise.reject(error);
//       originalRequest._retryCount++;

//       if (!isRefreshing) {
//         isRefreshing = true;
//         try {
//           await axios.post(
//             `${apiBaseUrl}/auth/refresh`,
//             {},
//             { withCredentials: true }
//           );
//           onRefreshed();
//         } catch (err) {
//           refreshSubscribers = [];
//           toast.error("⏰ Session expired. Please log in again.");
//           // Optional: log out user on session expiry
//           const redirectTo = encodeURIComponent(
//             window.location.pathname + window.location.search
//           );
//           window.location.href = `/login?redirectTo=${redirectTo}`;
//           return Promise.reject(err);
//         } finally {
//           isRefreshing = false;
//         }
//       }
//       return new Promise(resolve => {
//         addRefreshSubscriber(() => {
//           resolve(axiosClient(originalRequest));
//         });
//       });
//     }

//     if (status === 403) {
//       toast.error("⛔ Access denied. Please contact your admin.");
//     }

//     const message =
//       error?.response?.data?.message ||
//       "❌ Something went wrong. Please try again.";
//     toast.error(message);

//     // For devs: log errors in dev only
//     if (process.env.NODE_ENV !== "production") {
//       // eslint-disable-next-line no-console
//       console.error("[Axios Error]", error);
//     }

//     return Promise.reject(error);
//   }
// );

// // 📢 Always log the API base URL for visibility in console
// if (process.env.NODE_ENV !== "production") {
//   // eslint-disable-next-line no-console
//   console.log("✅ Axios BASE URL:", axiosClient.defaults.baseURL);
// }

// /*
// SECURITY NOTES:
// - Do NOT store sensitive tokens in localStorage or sessionStorage.
// - Only use HttpOnly cookies for JWT/session tokens (which you're doing!).
// - Consider implementing CSRF tokens if you allow any state-changing POSTs from browsers.
// */

// export default axiosClient;

// // 📄 src/utils/axiosClient.js
// import axios from "axios";
// import { toast } from "react-toastify";

// // ✅ Create Axios instance with cookie support
// const axiosClient = axios.create({
//   baseURL: process.env.REACT_APP_API_BASE_URL,
//   headers: {
//     "Content-Type": "application/json",
//   },
//   withCredentials: true, // ✅ Required for cookie-based JWT auth
// });

// let isRefreshing = false;
// let refreshSubscribers = [];

// function onRefreshed() {
//   refreshSubscribers.forEach(callback => callback());
//   refreshSubscribers = [];
// }

// function addRefreshSubscriber(callback) {
//   refreshSubscribers.push(callback);
// }

// axiosClient.interceptors.response.use(
//   response => response,
//   async error => {
//     const status = error?.response?.status;
//     const originalRequest = error.config;

//     // 🛡 Prevent retry loop and skip for refresh endpoint itself
//     const isRefreshRequest = originalRequest?.url?.includes("/auth/refresh");

//     if (status === 401 && !originalRequest._retry && !isRefreshRequest) {
//       originalRequest._retry = true;

//       // Optional: prevent infinite retry loop
//       if (!originalRequest._retryCount) originalRequest._retryCount = 0;
//       if (originalRequest._retryCount >= 1) {
//         return Promise.reject(error);
//       }
//       originalRequest._retryCount++;

//       if (!isRefreshing) {
//         isRefreshing = true;
//         try {
//           await axios.post(
//             `${process.env.REACT_APP_API_BASE_URL}/auth/refresh`,
//             {},
//             { withCredentials: true }
//           );
//           onRefreshed();
//         } catch (err) {
//           refreshSubscribers = []; // ⛔ Clear queued retries
//           toast.error("⏰ Session expired. Please log in again.");
//           const redirectTo = encodeURIComponent(
//             window.location.pathname + window.location.search
//           );
//           window.location.href = `/login?redirectTo=${redirectTo}`;
//           return Promise.reject(err);
//         } finally {
//           isRefreshing = false;
//         }
//       }

//       return new Promise(resolve => {
//         addRefreshSubscriber(() => {
//           resolve(axiosClient(originalRequest));
//         });
//       });
//     }

//     // 🛑 403 Forbidden
//     if (status === 403) {
//       toast.error("⛔ Access denied. Please contact your admin.");
//     }

//     // 🔔 General error message
//     const message =
//       error?.response?.data?.message ||
//       "❌ Something went wrong. Please try again.";

//     toast.error(message);
//     return Promise.reject(error);
//   }
// );

// console.log("✅ Axios BASE URL:", axiosClient.defaults.baseURL);

// export default axiosClient;
