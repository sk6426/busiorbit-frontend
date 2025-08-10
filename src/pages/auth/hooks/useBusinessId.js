// 📄 src/auth/hooks/useBusinessId.js
import { useAuth } from "../../pages/auth/context/AuthContext";
export function useBusinessId() {
  const { businessId } = useAuth();
  return businessId || "";
}

// // src/auth/hooks/useBusinessId.js

// import { jwtDecode } from "jwt-decode";

// export function useBusinessId() {
//   const token = localStorage.getItem("xbytechat-token");

//   if (!token) return "";

//   try {
//     const decoded = jwtDecode(token);
//     return decoded.businessId || "";
//   } catch (err) {
//     console.error("❌ Failed to decode businessId from token:", err);
//     return "";
//   }
// }
