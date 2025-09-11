import { useRef } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../pages/auth/context/pld_AuthContext";
import { toast } from "react-toastify";

export default function FeatureGuard({ featureKey, children }) {
  const { isLoading, can, hasAllAccess } = useAuth();
  const location = useLocation();
  const notifiedRef = useRef(false);

  // While auth/permissions are loading, render a stable placeholder
  if (isLoading) {
    return (
      <div
        data-test-id="featureguard-loading"
        aria-busy="true"
        style={{ display: "none" }}
      />
    );
  }

  if (!featureKey) {
    if (!notifiedRef.current) {
      toast.error("Feature access check failed: featureKey not provided");
      notifiedRef.current = true;
    }
    return (
      <Navigate
        to="/no-access"
        replace
        state={{ reason: "missing-featureKey", from: location.pathname }}
      />
    );
  }

  // Admin wildcard from context
  if (hasAllAccess) return children;

  const allowed = can(featureKey);
  if (!allowed) {
    if (!notifiedRef.current) {
      toast.error(`🚫 You don't have access to "${featureKey}"`);
      notifiedRef.current = true;
    }
    return (
      <Navigate
        to="/no-access"
        replace
        state={{
          reason: "feature-denied",
          featureKey,
          from: location.pathname,
        }}
      />
    );
  }

  return children;
}

// Below code comment out for some newly upfated

// import { useEffect, useRef } from "react";
// import { Navigate, useLocation } from "react-router-dom";
// import { useAuth } from "../../pages/auth/context/AuthContext";
// import { toast } from "react-toastify";

// export default function FeatureGuard({ featureKey, children }) {
//   const { isLoading, availableFeatures = {}, role } = useAuth();
//   const safeRole = (role || "").toLowerCase();
//   const location = useLocation();
//   const notifiedRef = useRef(false); // avoid duplicate toasts

//   // ⏳ While auth/feature map is loading, render a tiny stable hook
//   if (
//     isLoading ||
//     !availableFeatures ||
//     Object.keys(availableFeatures).length === 0
//   ) {
//     return (
//       <div
//         data-test-id="featureguard-loading"
//         aria-busy="true"
//         style={{ display: "none" }}
//       />
//     );
//   }

//   // 🚫 Catch missing featureKey usage
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

//   // ✅ Allow all for superadmin
//   if (safeRole === "superadmin") return children;

//   const isAllowed = availableFeatures[featureKey] === true;

//   if (!isAllowed) {
//     if (!notifiedRef.current) {
//       toast.error(`🚫 You don't have access to "${featureKey}"`);
//       notifiedRef.current = true;
//     }
//     return (
//       <Navigate
//         to="/no-access"
//         replace
//         state={{
//           reason: "feature-denied",
//           featureKey,
//           from: location.pathname,
//         }}
//       />
//     );
//   }

//   return children;
// }
