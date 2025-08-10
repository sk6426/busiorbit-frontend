// src/pages/Plans/PlanSelection/PlanSelectWidget.jsx

export default function PlanSelectWidget({ currentPlan, onChange }) {
  const plans = ["basic", "smart", "advanced"];

  return (
    <div className="flex items-center gap-4">
      {plans.map(plan => (
        <button
          key={plan}
          onClick={() => onChange(plan)}
          className={`px-4 py-2 rounded-full border ${
            currentPlan === plan
              ? "bg-purple-600 text-white"
              : "bg-white text-purple-600 border-purple-400"
          }`}
        >
          {plan.charAt(0).toUpperCase() + plan.slice(1)}
        </button>
      ))}
    </div>
  );
}
