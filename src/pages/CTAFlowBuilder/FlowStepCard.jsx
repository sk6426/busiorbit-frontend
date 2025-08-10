// 📄 File: src/pages/CTAFlowBuilder/FlowStepCard.jsx
import React from "react";
import { Pencil, Trash2 } from "lucide-react";

const FlowStepCard = ({
  step,
  index,
  onEdit,
  onRequestDelete,
  disabled,
  templates,
  isActiveStep,
}) => {
  const matchedTemplate = templates?.find(
    tpl => tpl.name === step.templateName
  );
  const messageBody = matchedTemplate?.body || "Template preview unavailable.";

  // Replace {{1}}, {{2}}... with mock values
  const previewBody = messageBody.replace(/\{\{\s*\d+\s*\}\}/g, match => {
    const n = match.match(/\d+/)?.[0];
    return `Value${n}`;
  });

  return (
    <div
      id={`step-card-${step.id}`}
      className={`relative bg-white border rounded-xl shadow-md p-5 group transition-all duration-300 overflow-hidden hover:shadow-lg ${
        isActiveStep ? "ring-2 ring-blue-400" : ""
      }`}
    >
      {isActiveStep && (
        <div className="absolute inset-0 bg-blue-50 bg-opacity-40 pointer-events-none animate-pulse" />
      )}

      {/* Header */}
      <div className="flex justify-between items-start mb-3 relative z-10">
        <div className="space-y-1">
          <h3 className="text-purple-700 font-semibold text-base">
            Step {index}: {step.buttonText || "Untitled"}
          </h3>
          <p className="text-xs text-gray-500">
            Type: {step.triggerButtonType || "cta"}
          </p>
          <p className="text-xs text-gray-500">
            Template: {step.templateName || "-"}
          </p>
          <p className="text-xs text-gray-500">Order: {step.stepOrder}</p>
        </div>
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            className="p-1 text-gray-600 hover:text-purple-600"
            onClick={onEdit}
            disabled={disabled}
          >
            <Pencil size={16} />
          </button>
          <button
            className="p-1 text-gray-600 hover:text-red-600"
            onClick={onRequestDelete}
            disabled={disabled}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* WhatsApp-style Bubble */}
      <div className="bg-green-100 border border-green-300 rounded-2xl px-4 py-3 text-sm text-gray-800 shadow-inner relative max-w-[90%] z-10">
        <div className="font-medium text-green-900 mb-1">
          📩 {step.templateName || "No template"}
        </div>
        <p className="text-sm whitespace-pre-line leading-snug">
          {previewBody}
        </p>
        <div className="absolute bottom-[-8px] left-4 w-3 h-3 bg-green-100 rotate-45 border-l border-b border-green-300" />

        {/* Buttons visual (if any) */}
        {step.buttonLinks?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {step.buttonLinks.map((btn, idx) => (
              <span
                key={idx}
                className="inline-block bg-white border border-green-300 text-green-700 text-xs px-3 py-1 rounded-full shadow-sm"
              >
                {btn.ButtonText || "Unnamed"}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FlowStepCard;
