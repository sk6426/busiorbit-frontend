import React from "react";
import { useFeatureAccess } from "./useFeatureAccess";
import { usePlan } from "./usePlan";

// 🔐 Wrapper to conditionally show children if feature allowed
export default function RequireFeature({ name, children }) {
  const isFeatureAllowed = useFeatureAccess(name);
  const { hasPlan } = usePlan();

  // 🧠 Runtime logic:
  // 1. If featureAccess table allows → ✅ show
  // 2. Else → check plan fallback (optional)
  const isAllowed =
    isFeatureAllowed ||
    (name === "CRM" && hasPlan("Basic")) ||
    (name === "Campaigns" && hasPlan("Smart")) ||
    (name === "Catalog" && hasPlan("Advanced"));

  if (!isAllowed) return null;

  return <>{children}</>;
}
