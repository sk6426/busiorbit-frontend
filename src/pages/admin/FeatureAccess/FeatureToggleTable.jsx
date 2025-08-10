import React from "react";
import ToggleSwitch from "../../../components/common/ToggleSwitch";

export default function FeatureToggleTable({
  businesses,
  features,
  featureAccessMap,
  onToggle,
}) {
  return (
    <div className="overflow-auto border rounded-md">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-100 text-left">
          <tr>
            <th className="px-4 py-2">Business Name</th>
            {features.map(feature => (
              <th key={feature} className="px-4 py-2 text-center">
                {feature}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {businesses.map(biz => (
            <tr key={biz.id} className="border-t">
              <td className="px-4 py-2 font-medium">{biz.companyName}</td>
              {features.map(feature => {
                const access = featureAccessMap[biz.id]?.find(
                  f => f.featureName === feature
                );
                const isEnabled = access ? access.isEnabled : false;

                return (
                  <td key={feature} className="px-4 py-2 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <ToggleSwitch
                        checked={isEnabled}
                        onChange={e =>
                          onToggle(biz.id, feature, e.target.checked)
                        }
                      />
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded ${
                          isEnabled
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {isEnabled ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
