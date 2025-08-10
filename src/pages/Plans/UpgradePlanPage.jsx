import React, { useState } from "react";
import { CheckCircle, Star, Flame } from "lucide-react";
import { usePlan } from "../auth/hooks/usePlan";

const plans = [
  {
    id: "basic",
    name: "Basic",
    priceMonthly: 0,
    priceYearly: 0,
    features: [
      "Send WhatsApp messages",
      "Manage contacts & tags",
      "Access basic CRM",
    ],
    icon: "⚡",
  },
  {
    id: "smart",
    name: "Smart",
    priceMonthly: 399,
    priceYearly: 3999,
    features: [
      "Campaign management",
      "Product catalog sharing",
      "Catalog analytics",
      "Reminder automation",
    ],
    tag: "popular",
    icon: "👑",
  },
  {
    id: "advanced",
    name: "Advanced",
    priceMonthly: 899,
    priceYearly: 8999,
    features: [
      "CRM insights",
      "Catalog CTA heatmaps",
      "Team collaboration tools",
      "Priority support",
    ],
    tag: "recommended",
    icon: "👑",
  },
];

export default function UpgradePlanPage() {
  const [billingCycle, setBillingCycle] = useState("yearly");
  const { plan: currentPlan } = usePlan();

  const getPrice = plan =>
    billingCycle === "monthly" ? plan.priceMonthly : plan.priceYearly;

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-purple-700 flex items-center gap-2">
        🚀 Upgrade Your Plan
      </h2>
      <p className="text-gray-500 mt-1">
        Unlock premium features to grow your business faster.
      </p>

      {/* Toggle Monthly/Yearly */}
      <div className="flex items-center gap-4 mt-6">
        <button
          className={`px-4 py-2 rounded-full text-sm font-medium ${
            billingCycle === "monthly"
              ? "bg-purple-600 text-white"
              : "bg-gray-100 text-gray-600"
          }`}
          onClick={() => setBillingCycle("monthly")}
        >
          Monthly Billing
        </button>
        <button
          className={`px-4 py-2 rounded-full text-sm font-medium ${
            billingCycle === "yearly"
              ? "bg-purple-600 text-white"
              : "bg-gray-100 text-gray-600"
          }`}
          onClick={() => setBillingCycle("yearly")}
        >
          Yearly Billing 🎁{" "}
          <span className="ml-1 text-yellow-400">Save 2 Months</span>
        </button>
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        {plans.map(plan => {
          const price = getPrice(plan);
          const isCurrent = currentPlan === plan.id;
          const isYearly = billingCycle === "yearly";
          const showDiscount = plan.id !== "basic" && isYearly;
          const isRecommended = plan.tag === "recommended";
          const isPopular = plan.tag === "popular";

          return (
            <div
              key={plan.id}
              className={`relative bg-white border rounded-xl p-6 shadow-md flex flex-col ${
                isRecommended
                  ? "border-yellow-500 bg-gradient-to-br from-yellow-50 to-white"
                  : ""
              }`}
            >
              {/* Tag badges */}
              {isPopular && (
                <span className="absolute top-3 right-3 bg-purple-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full shadow">
                  <Flame size={12} className="inline mr-1" />
                  Most Popular
                </span>
              )}
              {isRecommended && (
                <span className="absolute top-3 right-3 bg-yellow-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full shadow">
                  <Star size={12} className="inline mr-1" />
                  Recommended
                </span>
              )}

              <div className="text-2xl font-bold text-purple-700 flex items-center gap-2 mb-2">
                <span>{plan.icon}</span> {plan.name}
              </div>

              <div className="text-3xl font-extrabold mt-2 mb-1">
                {plan.priceMonthly === 0 && plan.priceYearly === 0 ? (
                  <>Free</>
                ) : (
                  <>
                    ₹{price}
                    <span className="text-sm font-normal text-gray-500">
                      {" "}
                      /{billingCycle === "monthly" ? "mo" : "yr"}
                    </span>
                  </>
                )}
              </div>

              {/* Discount info */}
              {showDiscount && (
                <div className="text-xs text-green-600 font-semibold mt-1">
                  Save ₹{plan.priceMonthly * 12 - plan.priceYearly} per year!
                </div>
              )}

              <ul className="text-sm mt-4 space-y-2">
                {plan.features.map((f, idx) => (
                  <li
                    key={idx}
                    className="flex items-center gap-2 text-gray-700"
                  >
                    <CheckCircle className="text-green-500" size={16} />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                disabled={isCurrent}
                className={`w-full mt-auto px-4 py-2 text-sm font-medium rounded-lg transition mt-6 ${
                  isCurrent
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-purple-600 text-white hover:bg-purple-700"
                }`}
              >
                {isCurrent ? "Current Plan" : "Choose Plan"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
