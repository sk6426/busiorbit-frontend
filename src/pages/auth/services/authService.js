// 📄 src/pages/auth/services/authService.js
import axiosClient, { TOKEN_KEY } from "../../../api/axiosClient";

export const login = async (email, password) => {
  const { data } = await axiosClient.post("/auth/login", { email, password });
  // Backend returns: { token: "<jwt>" }
  if (!data?.token) {
    const msg = data?.message || "❌ Login failed.";
    const err = new Error(msg);
    err.isCustom = true;
    throw err;
  }
  localStorage.setItem(TOKEN_KEY, data.token);
  return { success: true };
};

export const logout = () => {
  localStorage.removeItem(TOKEN_KEY);
};

// // 📄 src/pages/auth/services/authService.js
// import axiosClient, { TOKEN_KEY } from "../../../api/axiosClient";

// export const login = async (email, password) => {
//   const { data } = await axiosClient.post("/auth/login", {
//     email,
//     password,
//   });
//   // Backend must return: { token: "<jwt>" }
//   if (!data?.token) {
//     const msg = data?.message || "❌ Login failed.";
//     const err = new Error(msg);
//     err.isCustom = true;
//     throw err;
//   }
//   localStorage.setItem(TOKEN_KEY, data.token);
//   return { success: true };
// };

// export const logout = () => {
//   localStorage.removeItem(TOKEN_KEY);
// };

// // src/pages/auth/services/authService.js
// import axiosClient from "../../../api/axiosClient";

// export const login = async (email, password) => {
//   const response = await axiosClient.post(
//     "/auth/login",
//     { email, password },
//     { withCredentials: true }
// //  );

//   // ✅ Check success flag only
//   if (!response.data.success) {
//     const msg = response.data.message || "❌ Login failed.";
//     const error = new Error(msg);
//     error.isCustom = true;
//     throw error;
//   }

//   // ✅ Return userDto or fallback data
//   return response.data.data || {};
// };
