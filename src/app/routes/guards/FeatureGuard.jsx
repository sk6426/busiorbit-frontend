// src/app/routes/guards/FeatureGuard.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../../providers/AuthProvider";

export default function FeatureGuard({
  featureKey,
  perm,
  requireAllPerms = false,
  children,
}) {
  const {
    isLoading,
    role,
    hasAllAccess,
    can,
    availableFeatures = {},
  } = useAuth();
  if (isLoading) return null;

  const safeRole = String(role || "").toLowerCase();
  if (hasAllAccess || safeRole === "superadmin") return children;

  const testPermList = (list = []) => {
    const ok = requireAllPerms
      ? list.every(code => can?.(code))
      : list.some(code => can?.(code));
    if (!ok) {
      // TEMP debug:
      // eslint-disable-next-line no-console
      console.warn("[FeatureGuard] blocked", { featureKey, perm: list });
    }
    return ok;
  };

  // A) explicit perm wins
  if (perm) {
    const list = Array.isArray(perm) ? perm : [perm];
    return testPermList(list) ? children : <Navigate to="/no-access" replace />;
  }

  // B) feature key via availableFeatures
  if (featureKey && availableFeatures[featureKey]) return children;

  // C) no key/perm → allow
  return children;
}

// import { Navigate } from "react-router-dom";
// import { useAuth } from "../../providers/AuthProvider";

// export default function FeatureGuard({ featureKey, children }) {
//   const {
//     isLoading,
//     role,
//     hasAllAccess, // true if perms contains "*" or role === "superadmin"
//     can, // (code) => boolean
//   } = useAuth();

//   if (isLoading) return null;

//   // Superadmin or global wildcard -> always allow
//   const safeRole = String(role || "").toLowerCase();
//   if (hasAllAccess || safeRole === "superadmin") return children;

//   // If we have a featureKey, enforce it via can()
//   if (featureKey) {
//     return can(featureKey) ? children : <Navigate to="/no-access" replace />;
//   }

//   // No featureKey provided -> allow by default
//   return children;
// }

// // 📄 src/app/routes/guards/FeatureGuard.jsx
// import { Navigate } from "react-router-dom";
// import { useAuth } from "../../../pages/auth/context/pld_AuthContext"; // keep this path
// // If your useAuth is re-exported somewhere else, adjust the path accordingly.

// export default function FeatureGuard({ featureKey, children }) {
//   const {
//     isLoading,
//     role,
//     hasAllAccess, // preferred: true for superadmin or ["*"] from server
//     can, // preferred: (code) => boolean
//     availableFeatures, // fallback map { [FEATURE_KEYS.X]: true }
//   } = useAuth() || {};

//   if (isLoading) return null;

//   // 1) Superadmin (or global-allow) always passes
//   const safeRole = String(role || "").toLowerCase();
//   if (hasAllAccess || safeRole === "superadmin") return children;

//   // 2) If we have a 'can()' primitive, use it first (server-authoritative)
//   if (typeof can === "function" && featureKey) {
//     if (can(featureKey)) return children;
//     return <Navigate to="/no-access" replace />;
//   }

//   // 3) Legacy fallback: use availableFeatures map
//   if (featureKey && availableFeatures && availableFeatures[featureKey]) {
//     return children;
//   }

//   // Explicit deny fallback
//   return <Navigate to="/no-access" replace />;
// }

// import { Navigate, useLocation } from "react-router-dom";
// import { useAuth } from "../../providers/AuthProvider";
// import { useRef } from "react";
// import { toast } from "react-toastify";

// export default function FeatureGuard({ featureKey, children }) {
//   const { isLoading, can, hasAllAccess } = useAuth();
//   const loc = useLocation();
//   const notified = useRef(false);

//   if (isLoading) return null;

//   if (!featureKey) {
//     if (!notified.current) {
//       toast.error("Feature access check failed: featureKey not provided");
//       notified.current = true;
//     }
//     return <Navigate to="/no-access" replace state={{ from: loc.pathname }} />;
//   }

//   const allowed =
//     hasAllAccess || (typeof can === "function" && can(featureKey));

//   if (!allowed) {
//     if (!notified.current) {
//       toast.error(`🚫 You don't have access to "${featureKey}"`);
//       notified.current = true;
//     }
//     return (
//       <Navigate
//         to="/no-access"
//         replace
//         state={{ reason: "feature-denied", featureKey, from: loc.pathname }}
//       />
//     );
//   }
//   return children;
// }

// import { useRef } from "react";
// import { Navigate, useLocation } from "react-router-dom";
// import { useAuth } from "../../providers/AuthProvider";
// import { toast } from "react-toastify";

// export default function FeatureGuard({ featureKey, children }) {
//   const { isLoading, hasAllAccess, can } = useAuth();
//   const location = useLocation();
//   const notifiedRef = useRef(false);

//   if (isLoading) return null;
//   if (!featureKey) {
//     if (!notifiedRef.current) {
//       toast.error("Feature access check failed: featureKey not provided");
//       notifiedRef.current = true;
//     }
//     return (
//       <Navigate
//         to="/no-access"
//         replace
//         state={{ reason: "missing-featureKey", from: location.pathname }}
//       />
//     );
//   }
//   if (hasAllAccess || can(featureKey)) return children;

//   if (!notifiedRef.current) {
//     toast.error(`🚫 You don't have access to "${featureKey}"`);
//     notifiedRef.current = true;
//   }
//   return (
//     <Navigate
//       to="/no-access"
//       replace
//       state={{ reason: "feature-denied", featureKey, from: location.pathname }}
//     />
//   );
// }
