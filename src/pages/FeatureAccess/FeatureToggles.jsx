// 📄 File: src/pages/admin/FeatureAccess/FeatureToggles.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

export default function FeatureToggles() {
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFeatures = async () => {
    try {
      const res = await axios.get("/api/feature-access/feature-toggle-view");
      setFeatures(res.data.data || []);
    } catch (err) {
      toast.error("Failed to load feature toggles.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeatures();
  }, []);

  const handleToggle = async (featureCode, currentOverride) => {
    const nextOverride =
      currentOverride === null ? true : currentOverride === true ? false : null;

    try {
      await axios.patch(`/api/feature-access/${featureCode}`, {
        isEnabled: nextOverride,
      });

      setFeatures(prev =>
        prev.map(f =>
          f.featureCode === featureCode
            ? { ...f, isOverridden: nextOverride }
            : f
        )
      );
      toast.success("Override updated.");
    } catch (err) {
      toast.error("Failed to update override.");
    }
  };

  const groupFeatures = () => {
    const grouped = {};
    for (const feature of features) {
      const group = feature.group || "General";
      if (!grouped[group]) grouped[group] = [];
      grouped[group].push(feature);
    }
    return grouped;
  };

  if (loading) return <div className="p-4 text-gray-500">Loading...</div>;

  const groupedFeatures = groupFeatures();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">🔧 Feature Toggles</h1>
      {Object.entries(groupedFeatures).map(([groupName, groupFeatures]) => (
        <div key={groupName} className="mb-8">
          <h2 className="text-lg font-bold text-purple-700 mb-3">
            {groupName}
          </h2>
          <div className="bg-white shadow-md rounded-xl overflow-hidden border">
            <table className="min-w-full text-sm text-gray-700">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">Feature</th>
                  <th className="px-4 py-2">Plan</th>
                  <th className="px-4 py-2">Override</th>
                  <th className="px-4 py-2">Active</th>
                  <th className="px-4 py-2 text-right">Toggle</th>
                </tr>
              </thead>
              <tbody>
                {groupFeatures.map(f => {
                  const override = f.isOverridden;
                  const isActive = override ?? f.isAvailableInPlan;
                  return (
                    <tr key={f.featureCode} className="border-t">
                      <td className="px-4 py-2">
                        <div className="font-medium">{f.featureCode}</div>
                        <div className="text-xs text-gray-500">
                          {f.description}
                        </div>
                      </td>
                      <td className="px-4 py-2 text-center">
                        {f.isAvailableInPlan ? (
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                            ✅ Yes
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full">
                            ❌ No
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {override === true && (
                          <span className="text-green-600 font-semibold">
                            On
                          </span>
                        )}
                        {override === false && (
                          <span className="text-red-600 font-semibold">
                            Off
                          </span>
                        )}
                        {override === null && (
                          <span className="text-gray-500 italic">Default</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {isActive ? (
                          <span className="text-green-600 font-semibold">
                            🟢 Enabled
                          </span>
                        ) : (
                          <span className="text-gray-500">⚪ Disabled</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <button
                          onClick={() => handleToggle(f.featureCode, override)}
                          className="text-sm bg-purple-600 text-white px-3 py-1 rounded-full hover:bg-purple-700"
                        >
                          Toggle
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
