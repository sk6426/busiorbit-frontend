// 📄 src/auth/hooks/useRole.js
import { useAuth } from "../../pages/auth/context/AuthContext";
export function useRole() {
  const { role } = useAuth();
  return role || "";
}

// // src/auth/hooks/useRole.js

// import { jwtDecode } from "jwt-decode";

// export function useRole() {
//   const token = localStorage.getItem("xbytechat-token");

//   if (!token) return "";

//   try {
//     const decoded = jwtDecode(token);
//     return decoded.role || "";
//   } catch (err) {
//     console.error("❌ Failed to decode role from token:", err);
//     return "";
//   }
// }
