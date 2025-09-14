// src/app/routes/ProtectedRoute.jsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../providers/AuthProvider";

/**
 * Props:
 * - featureKey?: string            // e.g. "Messaging", "Dashboard"
 * - perm?: string | string[]       // e.g. "messaging.inbox.view" or ["perm.a","perm.b"]
 * - requireAllPerms?: boolean      // default false (ANY of the perms passes)
 * - fallback?: string              // legacy: used if onDeny is not provided (default: "/no-access")
 * - onDeny?: "403" | "app" | string  // prefer this. "403" => /403, "app" => /app, or any absolute path
 * - allowed?: boolean              // optional external allow/deny flag
 */
export default function ProtectedRoute({
  children,
  featureKey,
  perm,
  allowed,
  requireAllPerms = false,
  fallback = "/no-access",
  onDeny,
}) {
  const location = useLocation();
  const {
    isLoading,
    isAuthenticated,
    hasAllAccess, // superadmin / wildcard
    can, // (perm: string) => boolean
    availableFeatures = {},

    // The following fields should be exposed by your AuthProvider
    // If any are missing, the guard degrades gracefully.
    status, // "pending" | "approved" | "active" | "rejected" | "hold" | "suspended" | ...
    isProfileComplete, // boolean (preferred)
    profileCompleted, // boolean (fallback name)
    needsProfileCompletion, // boolean (alt flag, if you expose this)
  } = useAuth();

  // ---------- loading ----------
  if (isLoading) return null;

  // ---------- not logged in ----------
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // ---------- superadmin bypass ----------
  if (hasAllAccess) return children;

  // ---------- derive normalized onboarding state ----------
  const normStatus = (status || "").toLowerCase();
  const profileDone =
    typeof isProfileComplete === "boolean"
      ? isProfileComplete
      : typeof profileCompleted === "boolean"
      ? profileCompleted
      : undefined;

  const mustCompleteProfile =
    needsProfileCompletion === true ||
    (normStatus === "approved" && profileDone === false);

  const PENDING_PAGE = "/pending-approval";
  const PROFILE_PAGE = "/app/profile-completion";
  const NO_ACCESS = "/no-access";

  // ---------- hard gates based on business status ----------
  if (normStatus === "pending") {
    if (location.pathname !== PENDING_PAGE) {
      return (
        <Navigate
          to={PENDING_PAGE}
          replace
          state={{ reason: "pending", from: location.pathname }}
        />
      );
    }
  } else if (
    normStatus === "rejected" ||
    normStatus === "hold" ||
    normStatus === "suspended"
  ) {
    if (location.pathname !== NO_ACCESS) {
      return (
        <Navigate
          to={NO_ACCESS}
          replace
          state={{ reason: normStatus, from: location.pathname }}
        />
      );
    }
  } else if (mustCompleteProfile) {
    // Force approved-but-incomplete users to profile completion
    if (location.pathname !== PROFILE_PAGE) {
      return (
        <Navigate
          to={PROFILE_PAGE}
          replace
          state={{ reason: "profile-incomplete", from: location.pathname }}
        />
      );
    }
  }

  // ---------- feature/permission gating ----------
  const resolveDenyTarget = () => {
    if (onDeny === "403") return "/403";
    if (onDeny === "app") return "/app";
    if (typeof onDeny === "string" && onDeny.startsWith("/")) return onDeny;
    return fallback || "/no-access";
  };

  // external allow flag
  if (typeof allowed === "boolean" && !allowed) {
    return <Navigate to={resolveDenyTarget()} replace />;
  }

  // feature flag gating
  if (featureKey && !availableFeatures[featureKey]) {
    return <Navigate to={resolveDenyTarget()} replace />;
  }

  // permission gating
  if (perm) {
    const perms = Array.isArray(perm) ? perm : [perm];
    const ok = requireAllPerms
      ? perms.every(p => can?.(p))
      : perms.some(p => can?.(p));
    if (!ok) {
      return <Navigate to={resolveDenyTarget()} replace />;
    }
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
//  * - fallback?: string              // legacy: used if onDeny is not provided (default: "/no-access")
//  * - onDeny?: "403" | "app" | string  // NEW: prefer this. "403" => /403, "app" => /app, or any absolute path (e.g. "/no-access")
//  *
//  * - allowed?: boolean              // optional external allow/deny flag (if you pass it)
//  */
// export default function ProtectedRoute({
//   children,
//   featureKey,
//   perm,
//   allowed, // optional external flag
//   requireAllPerms = false,
//   fallback = "/no-access", // kept for backward compatibility
//   onDeny, // NEW
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

//   // Decide where to send an authorized-but-forbidden user
//   const resolveDenyTarget = () => {
//     if (onDeny === "403") return "/403";
//     if (onDeny === "app") return "/app";
//     if (typeof onDeny === "string" && onDeny.startsWith("/")) return onDeny;
//     // fallback to legacy prop if onDeny not provided
//     return fallback || "/no-access";
//   };

//   // 🔒 External allow/deny flag (if provided)
//   if (typeof allowed === "boolean" && !allowed) {
//     return <Navigate to={resolveDenyTarget()} replace />;
//   }

//   // 🔒 Feature gating (if provided)
//   if (featureKey && !availableFeatures[featureKey]) {
//     return <Navigate to={resolveDenyTarget()} replace />;
//   }

//   // 🔒 Permission gating (if provided)
//   if (perm) {
//     const perms = Array.isArray(perm) ? perm : [perm];
//     const ok = requireAllPerms
//       ? perms.every(p => can?.(p))
//       : perms.some(p => can?.(p));
//     if (!ok) return <Navigate to={resolveDenyTarget()} replace />;
//   }

//   return children;
// }
