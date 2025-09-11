// src/app/routes/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../../providers/AuthProvider";

/**
 * Props:
 * - featureKey?: string            // e.g. "Messaging", "Dashboard"
 * - perm?: string | string[]       // e.g. "messaging.inbox.view" or ["perm.a","perm.b"]
 * - requireAllPerms?: boolean      // default false (ANY of the perms passes)
 * - fallback?: string              // legacy: used if onDeny is not provided (default: "/no-access")
 * - onDeny?: "403" | "app" | string  // NEW: prefer this. "403" => /403, "app" => /app, or any absolute path (e.g. "/no-access")
 *
 * - allowed?: boolean              // optional external allow/deny flag (if you pass it)
 */
export default function ProtectedRoute({
  children,
  featureKey,
  perm,
  allowed, // optional external flag
  requireAllPerms = false,
  fallback = "/no-access", // kept for backward compatibility
  onDeny, // NEW
}) {
  const {
    isLoading,
    isAuthenticated,
    availableFeatures = {},
    can,
    hasAllAccess, // true for superadmin or "*" perms
  } = useAuth();

  if (isLoading) return null;

  // ❌ Not logged in → go to login (do NOT preserve last path)
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // ✅ Superadmin / wildcard → allow everything
  if (hasAllAccess) return children;

  // Decide where to send an authorized-but-forbidden user
  const resolveDenyTarget = () => {
    if (onDeny === "403") return "/403";
    if (onDeny === "app") return "/app";
    if (typeof onDeny === "string" && onDeny.startsWith("/")) return onDeny;
    // fallback to legacy prop if onDeny not provided
    return fallback || "/no-access";
  };

  // 🔒 External allow/deny flag (if provided)
  if (typeof allowed === "boolean" && !allowed) {
    return <Navigate to={resolveDenyTarget()} replace />;
  }

  // 🔒 Feature gating (if provided)
  if (featureKey && !availableFeatures[featureKey]) {
    return <Navigate to={resolveDenyTarget()} replace />;
  }

  // 🔒 Permission gating (if provided)
  if (perm) {
    const perms = Array.isArray(perm) ? perm : [perm];
    const ok = requireAllPerms
      ? perms.every(p => can?.(p))
      : perms.some(p => can?.(p));
    if (!ok) return <Navigate to={resolveDenyTarget()} replace />;
  }

  return children;
}

// // src/app/routes/ProtectedRoute.jsx
// import { Navigate } from "react-router-dom";
// import { useAuth } from "../../providers/AuthProvider";

// /**
//  * Props:
//  * - featureKey?: string            // e.g. "Messaging", "Dashboard"
//  * - perm?: string | string[]       // e.g. "messaging.inbox.view" or ["perm.a","perm.b"]
//  * - requireAllPerms?: boolean      // default false (ANY of the perms passes)
//  * - fallback?: string              // where to send authorized-but-forbidden users (default: "/no-access")
//  */
// export default function ProtectedRoute({
//   children,
//   featureKey,
//   perm,
//   allowed,
//   requireAllPerms = false,
//   fallback = "/no-access",
// }) {
//   const {
//     isLoading,
//     isAuthenticated,
//     availableFeatures = {},
//     can,
//     hasAllAccess, // true for superadmin or "*" perms
//   } = useAuth();

//   if (isLoading) return null;

//   // ❌ Not logged in → go to login (do NOT preserve last path)
//   if (!isAuthenticated) return <Navigate to="/login" replace />;

//   // ✅ Superadmin / wildcard → allow everything
//   if (hasAllAccess) return children;

//   // 🔒 Feature gating (if provided)
//   if (featureKey && !availableFeatures[featureKey]) {
//     return <Navigate to={fallback} replace />;
//   }
//   if (!allowed) {
//     return <Navigate to="/403" replace />; // or stick with /app if you prefer
//   }
//   // 🔒 Permission gating (if provided)
//   if (perm) {
//     const perms = Array.isArray(perm) ? perm : [perm];
//     const ok = requireAllPerms
//       ? perms.every(p => can?.(p))
//       : perms.some(p => can?.(p));
//     if (!ok) return <Navigate to={fallback} replace />;
//   }

//   return children;
// }

// // src/app/routes/ProtectedRoute.jsx
// import { Navigate, useLocation } from "react-router-dom";
// import { useAuth } from "../../providers/AuthProvider";
// /**
//  * Props:
//  * - featureKey?: string            // e.g. "Messaging", "Dashboard"
//  * - perm?: string | string[]       // e.g. "messaging.inbox.view" or ["perm.a","perm.b"]
//  * - requireAllPerms?: boolean      // default false (ANY of the perms passes)
//  * - fallback?: string              // route to send authorized-but-forbidden users; default "/app"
//  */
// export default function ProtectedRoute({
//   children,
//   featureKey,
//   perm,
//   requireAllPerms = false,
//   fallback = "/app",
// }) {
//   const {
//     isLoading,
//     isAuthenticated,
//     availableFeatures = {},
//     can,
//     hasAllAccess,
//   } = useAuth();
//   const location = useLocation();

//   if (isLoading) return null;

//   // Not logged in → kick to login, preserving intended URL
//   if (!isAuthenticated) {
//     return (
//       <Navigate
//         to={`/login?redirectTo=${encodeURIComponent(
//           location.pathname + location.search
//         )}`}
//         replace
//       />
//     );
//   }

//   // Superadmins bypass everything
//   if (hasAllAccess) return children;

//   // Feature gating (if specified)
//   if (featureKey && !availableFeatures[featureKey]) {
//     return <Navigate to={fallback} replace />;
//   }

//   // Permission gating (if specified)
//   if (perm) {
//     const perms = Array.isArray(perm) ? perm : [perm];
//     const ok = requireAllPerms
//       ? perms.every(p => can?.(p))
//       : perms.some(p => can?.(p));
//     if (!ok) return <Navigate to={fallback} replace />;
//   }

//   return children;
// }

// import { Navigate, useLocation } from "react-router-dom";
// import { useAuth } from "../../providers/AuthProvider";

// export default function ProtectedRoute({ children }) {
//   const { isLoading, isAuthenticated } = useAuth();
//   const location = useLocation();

//   if (isLoading) return null;

//   if (!isAuthenticated) {
//     return (
//       <Navigate
//         to={`/login?redirectTo=${encodeURIComponent(
//           location.pathname + location.search
//         )}`}
//         replace
//       />
//     );
//   }

//   return children;
// }

// // src/routes/ProtectedRoute.jsx
// import React from "react";
// import { Navigate, useLocation } from "react-router-dom";
// import { useAuth } from "../../../pages/auth/context/pld_AuthContext";

// const ProtectedRoute = ({ children }) => {
//   const { isLoading, isAuthenticated, role, plan, status, businessId } =
//     useAuth();
//   const location = useLocation();

//   // 🟣 Debug log for visibility in dev
//   console.log("🟣 [ProtectedRoute] Render:", {
//     isLoading,
//     isAuthenticated,
//     role,
//     plan,
//     status,
//     businessId,
//     path: location.pathname + location.search,
//   });

//   // ⏳ Spinner while checking session (stable test hook for E2E)
//   if (isLoading) {
//     console.log("🔄 [ProtectedRoute] Loading spinner shown.");
//     return (
//       <div
//         className="flex justify-center items-center min-h-screen text-lg text-gray-600"
//         role="status"
//         aria-busy="true"
//         data-test-id="protected-loading"
//       >
//         Loading...
//       </div>
//     );
//   }

//   // 🚫 If not authenticated, bounce to login with redirectTo=<original path>
//   if (!isAuthenticated) {
//     const original = location.pathname + location.search + location.hash;
//     const target = `/login?redirectTo=${encodeURIComponent(original)}`;
//     console.log(
//       "⛔ [ProtectedRoute] Not authenticated! Redirecting to:",
//       target
//     );
//     return <Navigate to={target} replace />;
//   }

//   console.log("✅ [ProtectedRoute] Authenticated, rendering children:", {
//     path: location.pathname,
//   });

//   return children;
// };

// export default ProtectedRoute;

// // src/routes/ProtectedRoute.jsx
// import React from "react";
// import { Navigate } from "react-router-dom";
// import { useAuth } from "../pages/auth/context/AuthContext";

// const ProtectedRoute = ({ children }) => {
//   const { isLoading, isAuthenticated, role, plan, status, businessId } =
//     useAuth();

//   // 🚩 Always log the current context state!
//   console.log("🟣 [ProtectedRoute] Render:", {
//     isLoading,
//     isAuthenticated,
//     role,
//     plan,
//     status,
//     businessId,
//     path: window.location.pathname,
//   });

//   // Spinner while checking session
//   if (isLoading) {
//     console.log("🔄 [ProtectedRoute] Loading spinner shown.");
//     return (
//       <div className="flex justify-center items-center min-h-screen text-lg text-gray-600">
//         Loading...
//       </div>
//     );
//   }

//   // 🚩 Main fix: Only check isAuthenticated, NOT businessId directly!
//   if (!isAuthenticated) {
//     console.log("⛔ [ProtectedRoute] Not authenticated! Redirecting to /login");
//     return <Navigate to="/login" replace />;
//   }

//   console.log("✅ [ProtectedRoute] Authenticated, rendering children:", {
//     path: window.location.pathname,
//   });

//   return children;
// };

// export default ProtectedRoute;
