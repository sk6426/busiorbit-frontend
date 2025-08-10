import { useEffect, useState } from "react";
import axiosClient from "../../../api/axiosClient"; // ✅ relative path confirmed

const featureAccessCache = {};

export function useFeatureAccess(businessId, featureName) {
  const [isAllowed, setIsAllowed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!businessId || !featureName) return;

    const cacheKey = `${businessId}-${featureName}`;

    if (featureAccessCache[cacheKey] !== undefined) {
      setIsAllowed(featureAccessCache[cacheKey]);
      setLoading(false);
      return;
    }

    const fetchAccess = async () => {
      try {
        const response = await axiosClient.get(
          `/api/feature-access/business/${businessId}`
        );
        const accessList = response.data || [];

        const feature = accessList.find(f => f.featureName === featureName);
        const allowed = feature ? feature.isEnabled : false;

        featureAccessCache[cacheKey] = allowed;
        setIsAllowed(allowed);
      } catch (err) {
        console.error("❌ Feature access check failed:", err);
        setIsAllowed(false);
      } finally {
        setLoading(false);
      }
    };

    fetchAccess();
  }, [businessId, featureName]);

  return { isAllowed, loading };
}
