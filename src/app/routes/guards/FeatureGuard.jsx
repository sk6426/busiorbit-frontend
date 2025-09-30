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
