import { useEffect, useState } from "react";
import axiosClient from "../../../api/axiosClient";

const featureMapCache = {};

export function useAllFeatureAccess(businessId) {
  const [featureMap, setFeatureMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!businessId) return;

    if (featureMapCache[businessId]) {
      setFeatureMap(featureMapCache[businessId]);
      setLoading(false);
      return;
    }

    const fetchAll = async () => {
      try {
        const response = await axiosClient.get(
          `/api/feature-access/business/${businessId}`
        );
        const accessList = response.data || [];

        const map = {};
        for (const item of accessList) {
          map[item.featureName] = item.isEnabled;
        }

        featureMapCache[businessId] = map;
        setFeatureMap(map);
      } catch (err) {
        console.error("Failed to fetch feature access list:", err);
        setFeatureMap({});
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [businessId]);

  return { featureMap, loading };
}
