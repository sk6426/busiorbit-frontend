// ✅ MessageBuilderTab.jsx — Param fields for Text Template
import React from "react";

function MessageBuilderTab({ formData, setFormData }) {
  const handleParamChange = (index, value) => {
    const updatedParams = [...(formData.templateParams || [])];
    updatedParams[index] = value;
    setFormData(prev => ({
      ...prev,
      templateParams: updatedParams,
    }));
  };

  return (
    <div>
      <h3 className="text-2xl font-semibold mb-4">Template Parameters</h3>

      {/* Only for text templates */}
      {formData.messageType === "text" && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i}>
              <label className="block text-sm font-medium mb-1">
                Param {`{{${i + 1}}}`}
              </label>
              <input
                type="text"
                className="w-full border rounded px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder={`Enter value for {{${i + 1}}}`}
                value={formData.templateParams?.[i] || ""}
                onChange={e => handleParamChange(i, e.target.value)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Future cases for image, doc can be handled here */}
      {formData.messageType !== "text" && (
        <p className="text-gray-500 italic">
          Builder not implemented for this message type.
        </p>
      )}
    </div>
  );
}

export default MessageBuilderTab;
