import React from "react";

/**
 * 📄 WhatsAppTemplatePreview
 * @param {Object} props.template - Template metadata from backend
 */
export default function WhatsAppTemplatePreview({ template }) {
  if (!template) return null;

  const {
    name,
    language,
    body,
    bodyText,
    placeholderCount,
    hasImageHeader,
    multiButtons = [],
  } = template;

  const finalBody = body || bodyText || "No content";

  return (
    <div className="mt-4 border rounded-md bg-green-50 px-4 py-3 text-sm text-zinc-800 shadow-sm">
      {/* Header */}
      <div className="mb-2">
        <span className="text-xs font-semibold text-green-700">
          🟢 WhatsApp Template Preview
        </span>
      </div>

      {/* Template Name + Language */}
      <div className="text-xs mb-2 text-zinc-500">
        <span className="mr-2">
          📄 <strong>{name}</strong>
        </span>
        <span className="ml-2">🌐 {language}</span>
        <span className="ml-2">🔢 {placeholderCount} placeholders</span>
      </div>

      {/* Image Header */}
      {hasImageHeader && (
        <div className="mb-2 rounded-md bg-gray-200 text-xs text-center text-gray-600 py-1">
          🖼️ Image Header Enabled
        </div>
      )}

      {/* Body */}
      <div className="bg-white border border-gray-200 rounded-md px-3 py-2 whitespace-pre-wrap">
        {finalBody}
      </div>

      {/* Buttons */}
      {multiButtons.length > 0 && (
        <div className="mt-3 space-y-1">
          {multiButtons.map((btn, index) => (
            <div
              key={index}
              className="flex items-center justify-between border border-green-200 rounded px-3 py-1 bg-green-100 text-xs"
            >
              <div className="font-medium">{btn.buttonText}</div>
              <div className="text-gray-600">
                {btn.buttonType}{" "}
                {btn.targetUrl && (
                  <span className="text-gray-500 italic">
                    ({btn.targetUrl})
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
