// src/components/common/TemplatePreviewBubble.jsx
import React from "react";

function TemplatePreviewBubble({ template, params }) {
  if (!template) return null;

  let preview = template.body;
  (params || []).forEach((val, i) => {
    preview = preview.replace(`{{${i + 1}}}`, val || `[${i + 1}]`);
  });

  return (
    <div className="mt-2 border px-4 py-2 rounded shadow text-sm bg-white whitespace-pre-wrap">
      <div className="font-semibold mb-1">👁 Preview</div>
      <div className="text-gray-800">{preview}</div>
    </div>
  );
}

export default TemplatePreviewBubble;
