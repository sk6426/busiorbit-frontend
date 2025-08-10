// src/pages/Plans/PlanFeatures/FeatureComparison.jsx

const features = [
  { name: "Send Message", basic: true, smart: true, advanced: true },
  { name: "Campaigns", basic: false, smart: true, advanced: true },
  { name: "CRM Insights", basic: false, smart: false, advanced: true },
  { name: "Priority Support", basic: false, smart: false, advanced: true },
];

export default function FeatureComparison() {
  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold text-purple-800 mb-4">
        Feature Comparison
      </h3>
      <div className="overflow-auto">
        <table className="min-w-full bg-white border rounded-lg shadow-sm">
          <thead>
            <tr>
              <th className="text-left p-3 border-b">Feature</th>
              <th className="text-center p-3 border-b">Basic</th>
              <th className="text-center p-3 border-b">Smart</th>
              <th className="text-center p-3 border-b">Advanced</th>
            </tr>
          </thead>
          <tbody>
            {features.map(f => (
              <tr key={f.name}>
                <td className="p-3 border-b">{f.name}</td>
                <td className="text-center border-b">{f.basic ? "✅" : "—"}</td>
                <td className="text-center border-b">{f.smart ? "✅" : "—"}</td>
                <td className="text-center border-b">
                  {f.advanced ? "✅" : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
