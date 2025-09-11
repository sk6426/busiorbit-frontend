// utils/jwt.js (or wherever this lives)
import { jwtDecode } from "jwt-decode";
import { TOKEN_KEY } from "../api/axiosClient";

export function readToken() {
  const t = localStorage.getItem(TOKEN_KEY);
  if (!t) return null;
  try {
    // claims we care about:
    // role, plan_id, businessId, name, permissions (CSV), features (CSV), hasAllAccess ("true"/"false"), exp
    return jwtDecode(t);
  } catch {
    return null;
  }
}

export function getAuthFromToken() {
  const payload = readToken();
  if (!payload) return { isAuth: false };

  // role (support both custom & MS claim)
  const role = (
    payload.role ||
    payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ||
    "business"
  ).toLowerCase();

  // plan id & business id
  const planId = payload["plan_id"] || null;
  const businessId = payload.businessId || payload.biz || null;

  // name
  const name = payload.name || payload.fullName || payload.email || "User";

  // permissions & features come as CSV strings on the token
  const permissionsCsv = String(payload.permissions || "").trim();
  const featuresCsv = String(payload.features || "").trim();

  // superadmin bypass OR explicit claim
  const hasAllAccess =
    role === "superadmin" ||
    payload.hasAllAccess === true ||
    String(payload.hasAllAccess || "").toLowerCase() === "true";

  // client-side expiry check (server still authoritative)
  if (payload.exp && Date.now() / 1000 > payload.exp) {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {}
    return { isAuth: false };
  }

  return {
    isAuth: true,
    role,
    planId,
    businessId,
    name,
    permissionsCsv, // <- e.g. "messaging.inbox.view,messaging.send,..."
    featuresCsv, // <- e.g. "Messaging,Dashboard"
    hasAllAccess, // <- boolean
  };
}

// import { jwtDecode } from "jwt-decode";
// import { TOKEN_KEY } from "../api/axiosClient";

// export function readToken() {
//   const t = localStorage.getItem(TOKEN_KEY);
//   if (!t) return null;
//   try {
//     return jwtDecode(t); // { sub, email, name, role, plan_id, businessId, exp, ... }
//   } catch {
//     return null;
//   }
// }

// export function getAuthFromToken() {
//   const payload = readToken();
//   if (!payload) return { isAuth: false };

//   const role = (
//     payload.role ||
//     payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ||
//     "business"
//   ).toLowerCase();

//   // ✅ use plan_id only
//   const planId = payload["plan_id"] || null;

//   const businessId = payload.businessId || payload.biz || null;
//   const name = payload.name || payload.fullName || payload.email || "User";

//   // Client-side expiry check (server still authoritative)
//   if (payload.exp && Date.now() / 1000 > payload.exp) {
//     try {
//       localStorage.removeItem(TOKEN_KEY);
//     } catch {}
//     return { isAuth: false };
//   }

//   return { isAuth: true, role, planId, businessId, name };
// }

// // 📄 src/pages/auth/utils/jwt.js
// import { jwtDecode } from "jwt-decode";
// import { TOKEN_KEY } from "../api/axiosClient";

// export function readToken() {
//   const t = localStorage.getItem(TOKEN_KEY);
//   if (!t) return null;
//   try {
//     return jwtDecode(t); // { sub, email, name, role, plan, biz, exp, ... }
//   } catch {
//     return null;
//   }
// }

// export function getAuthFromToken() {
//   const payload = readToken();
//   if (!payload) return { isAuth: false };

//   const role =
//     payload.role ||
//     payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ||
//     "business";
//   const plan = (payload.plan || "basic").toLowerCase();
//   const businessId = payload.biz || payload.businessId || null;
//   const name = payload.name || payload.fullName || payload.email || "User";

//   // exp check (optional extra safety on client)
//   if (payload.exp && Date.now() / 1000 > payload.exp) {
//     localStorage.removeItem(TOKEN_KEY);
//     return { isAuth: false };
//   }

//   return { isAuth: true, role: role.toLowerCase(), plan, businessId, name };
// }
