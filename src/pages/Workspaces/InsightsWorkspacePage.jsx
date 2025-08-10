// 📄 File: src/pages/Workspaces/InsightsWorkspacePage.jsx

import { Card } from "../../components/ui/card";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../pages/auth/context/AuthContext";

export default function InsightsWorkspacePage() {
  const navigate = useNavigate();
  const { availableFeatures = {}, isLoading } = useAuth();

  // 🚩 Feature-based cards
  const insightCards = [
    {
      key: "CatalogInsights",
      label: "🛍️ Catalog Dashboard",
      desc: "Track catalog performance — clicks, shares, and product views.",
      onClick: () => navigate("/app/catalog/insights"),
    },
    {
      key: "CRMInsights",
      label: "🤝 CRM Insights",
      desc: "Understand lead behavior, contact activity, and follow-up stats.",
      onClick: () => navigate("/app/insights/crm"),
    },
    {
      key: "FlowInsights",
      label: "🔁 Flow Analytics",
      desc: "Analyze CTA performance, click-through rates, and automation flows.",
      onClick: () => navigate("/app/campaigns/FlowAnalyticsDashboard"),
    },
  ];

  if (isLoading)
    return (
      <div className="p-10 text-center text-lg text-gray-500">
        Loading features…
      </div>
    );

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-purple-800 mb-6">
        📊 Insights & Analytics Workspace
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {insightCards
          .filter(card => availableFeatures[card.key])
          .map(card => (
            <Card
              key={card.key}
              className="hover:shadow-lg transition cursor-pointer"
              onClick={card.onClick}
            >
              <div className="p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  {card.label}
                </h3>
                <p className="text-gray-600 text-sm">{card.desc}</p>
              </div>
            </Card>
          ))}
      </div>
    </div>
  );
}
