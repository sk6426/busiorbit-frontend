// 📄 src/pages/auth/utils/jwt.js
import { jwtDecode } from "jwt-decode";
import { TOKEN_KEY } from "../api/axiosClient";

export function readToken() {
  const t = localStorage.getItem(TOKEN_KEY);
  if (!t) return null;
  try {
    return jwtDecode(t); // { sub, email, name, role, plan, biz, exp, ... }
  } catch {
    return null;
  }
}

export function getAuthFromToken() {
  const payload = readToken();
  if (!payload) return { isAuth: false };

  const role =
    payload.role ||
    payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ||
    "business";
  const plan = (payload.plan || "basic").toLowerCase();
  const businessId = payload.biz || payload.businessId || null;
  const name = payload.name || payload.fullName || payload.email || "User";

  // exp check (optional extra safety on client)
  if (payload.exp && Date.now() / 1000 > payload.exp) {
    localStorage.removeItem(TOKEN_KEY);
    return { isAuth: false };
  }

  return { isAuth: true, role: role.toLowerCase(), plan, businessId, name };
}
