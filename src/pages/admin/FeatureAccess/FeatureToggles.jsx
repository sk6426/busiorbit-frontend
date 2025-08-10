import React, { useEffect, useState } from "react";
import axiosClient from "../../../api/axiosClient";
import FeatureToggleTable from "./FeatureToggleTable";
import { toast } from "react-toastify";

export default function FeatureToggles() {
  const [businessList, setBusinessList] = useState([]);
  const [featureAccessMap, setFeatureAccessMap] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const availableFeatures = ["CRM", "Campaigns", "Catalog"];

  useEffect(() => {
    loadBusinesses();
  }, []);

  async function loadBusinesses() {
    try {
      setIsLoading(true);

      const response = await axiosClient.get("/businesses/approved");
      const businesses = response.data;
      setBusinessList(businesses);

      const allFeatureAccess = {};

      for (const business of businesses) {
        const res = await axiosClient.get(
          `/feature-access/business/${business.id}`
        );
        allFeatureAccess[business.id] = res.data;
      }

      setFeatureAccessMap(allFeatureAccess);
    } catch (err) {
      toast.error("Failed to load businesses or access rules");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleToggle(businessId, featureName, isEnabled) {
    const existing = featureAccessMap[businessId]?.find(
      f => f.featureName === featureName
    );

    try {
      if (existing) {
        await axiosClient.put(`/feature-access/${existing.id}`, {
          ...existing,
          isEnabled,
        });
      } else {
        await axiosClient.post(`/feature-access`, {
          businessId,
          featureName,
          isEnabled,
          notes: "",
        });
      }

      toast.success("Feature access updated");
      loadBusinesses();
    } catch (err) {
      toast.error("Failed to update feature access");
      console.error(err);
    }
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Feature Access Control</h2>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <FeatureToggleTable
          businesses={businessList}
          features={availableFeatures}
          featureAccessMap={featureAccessMap}
          onToggle={handleToggle}
        />
      )}
    </div>
  );
}
