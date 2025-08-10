// src/auth/hooks/useCompanyName.js

import { jwtDecode } from "jwt-decode";

export function useCompanyName() {
  const token = localStorage.getItem("xbytechat-token");

  if (!token) return "";

  try {
    const decoded = jwtDecode(token);
    return decoded.companyName || "";
  } catch (err) {
    console.error("❌ Failed to decode companyName from token:", err);
    return "";
  }
}
