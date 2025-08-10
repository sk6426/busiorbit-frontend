import { Navigate } from "react-router-dom";
import { useAuth } from "../../pages/auth/context/AuthContext";
import { toast } from "react-toastify";

export default function FeatureGuard({ featureKey, children }) {
  const { isLoading, availableFeatures = {}, role } = useAuth();
  const safeRole = (role || "").toLowerCase();

  if (isLoading) return null;

  // 🚫 Catch missing featureKey usage
  if (!featureKey) {
    console.warn("🚫 FeatureGuard: missing 'featureKey' prop");
    toast.error(`Feature access check failed: featureKey not provided`);
    return <Navigate to="/app/unauthorized" replace />;
  }

  // ✅ Allow all for superadmin
  if (safeRole === "superadmin") return children;

  // ⏳ Feature map not loaded yet
  if (!availableFeatures || Object.keys(availableFeatures).length === 0) {
    console.warn("⏳ FeatureGuard: availableFeatures not loaded yet.");
    return null;
  }

  const isAllowed = availableFeatures[featureKey];

  if (!isAllowed) {
    console.warn(`⛔ FeatureGuard: access denied for "${featureKey}"`);
    toast.error(`🚫 You don't have access to "${featureKey}" feature`);
    return <Navigate to="/app/unauthorized" replace />;
  }

  return children;
}
