// 📄 File: src/pages/CTAFlowBuilder/VisualFlowMap.jsx
import React from "react";

export default function VisualFlowMap({ steps, onLinkStep }) {
  if (!steps || steps.length === 0) return null;

  const getStepName = id => {
    const match = steps.find(s => s.id === id);
    return match ? `${match.buttonText || "Untitled"}` : null;
  };

  return (
    <div className="mt-8 bg-white border rounded-lg p-4 shadow">
      <h3 className="text-lg font-semibold text-purple-700 mb-4">
        🔗 Visual Flow Map
      </h3>
      <ul className="space-y-4">
        {steps.map((step, index) => {
          const target = getStepName(step.nextStepId);
          const linkableOptions = steps.filter(s => s.id !== step.id);

          return (
            <li key={step.id} className="text-sm text-gray-800">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-purple-600">
                  Step {index + 1}: {step.buttonText || "(Untitled)"}
                </span>

                <span>→</span>

                <select
                  value={step.nextStepId || ""}
                  onChange={e => onLinkStep(step.id, e.target.value || null)}
                  className="text-sm border rounded px-2 py-1 bg-white shadow-sm"
                >
                  <option value="">⏹️ End</option>
                  {linkableOptions.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.buttonText || s.templateName || "Untitled"}
                    </option>
                  ))}
                </select>

                {!target && step.nextStepId && (
                  <span className="text-red-500">❌ Broken link</span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
