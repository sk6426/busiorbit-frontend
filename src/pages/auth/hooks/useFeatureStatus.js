// 📄 src/pages/auth/hooks/useFeatureStatus.js
import { useAuth } from "../context/AuthContext";

export default function useFeatureStatus(featureKey) {
  const { featureMatrix } = useAuth();
  const feature = featureMatrix?.[featureKey];

  if (feature === undefined)
    return { status: "unknown", label: "Unknown", color: "gray" };

  if (feature.isOverridden !== null) {
    return {
      status: "overridden",
      label: feature.isOverridden
        ? "Overridden: Enabled"
        : "Overridden: Disabled",
      color: feature.isOverridden ? "yellow" : "gray",
    };
  }

  return feature.isAvailableInPlan
    ? { status: "enabled", label: "Plan: Enabled", color: "green" }
    : { status: "disabled", label: "Plan: Not Available", color: "red" };
}
