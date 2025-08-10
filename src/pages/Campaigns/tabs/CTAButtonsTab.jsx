// ✅ CTAButtonsTab.jsx – For text templates
import React from "react";

const maxButtons = 3;

function CTAButtonsTab({ formData, setFormData }) {
  const buttons = formData.multiButtons || [];

  const handleChange = (index, field, value) => {
    const updated = [...buttons];
    updated[index] = { ...updated[index], [field]: value };
    setFormData(prev => ({ ...prev, multiButtons: updated }));
  };

  const addButton = () => {
    if (buttons.length < maxButtons) {
      setFormData(prev => ({
        ...prev,
        multiButtons: [
          ...buttons,
          { buttonText: "", buttonType: "URL", targetUrl: "" },
        ],
      }));
    }
  };

  const removeButton = index => {
    const updated = [...buttons];
    updated.splice(index, 1);
    setFormData(prev => ({ ...prev, multiButtons: updated }));
  };

  return (
    <div>
      <h3 className="text-2xl font-semibold mb-4">CTA Buttons (optional)</h3>

      {buttons.map((btn, i) => (
        <div key={i} className="mb-4 border p-4 rounded shadow-sm">
          <div className="mb-2">
            <label className="block text-sm font-medium mb-1">
              Button Text
            </label>
            <input
              type="text"
              value={btn.buttonText}
              onChange={e => handleChange(i, "buttonText", e.target.value)}
              className="w-full border rounded px-4 py-2"
              placeholder="e.g. Buy Now"
            />
          </div>

          <div className="mb-2">
            <label className="block text-sm font-medium mb-1">
              Button Type
            </label>
            <select
              value={btn.buttonType}
              onChange={e => handleChange(i, "buttonType", e.target.value)}
              className="w-full border rounded px-4 py-2"
            >
              <option value="URL">URL</option>
              <option value="PHONE">Phone</option>
              <option value="QUICK_REPLY">Quick Reply</option>
            </select>
          </div>

          {btn.buttonType !== "QUICK_REPLY" && (
            <div className="mb-2">
              <label className="block text-sm font-medium mb-1">Target</label>
              <input
                type="text"
                value={btn.targetUrl}
                onChange={e => handleChange(i, "targetUrl", e.target.value)}
                className="w-full border rounded px-4 py-2"
                placeholder={
                  btn.buttonType === "URL"
                    ? "https://example.com"
                    : "+919000000000"
                }
              />
            </div>
          )}

          <button
            onClick={() => removeButton(i)}
            className="mt-2 text-red-600 hover:underline text-sm"
          >
            Remove
          </button>
        </div>
      ))}

      {buttons.length < maxButtons && (
        <button
          onClick={addButton}
          className="px-4 py-2 bg-purple-600 text-white rounded shadow"
        >
          + Add Button
        </button>
      )}
    </div>
  );
}

export default CTAButtonsTab;
