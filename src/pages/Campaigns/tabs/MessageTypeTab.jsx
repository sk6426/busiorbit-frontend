import React, { useMemo } from "react";

function MessageBuilderTab({ formData, setFormData }) {
  const { messageType, messageBody = "", templateParams = [] } = formData;

  // ✅ Extract placeholders from message body like {{1}}, {{2}}, ...
  const placeholderIndexes = useMemo(() => {
    const matches = messageBody.match(/{{(\d+)}}/g);
    if (!matches) return [];
    const uniqueIndexes = [
      ...new Set(matches.map(m => Number(m.match(/\d+/)[0]))),
    ];
    return uniqueIndexes.sort((a, b) => a - b);
  }, [messageBody]);

  const handleParamChange = (index, value) => {
    const updated = [...templateParams];
    updated[index - 1] = value; // 1-based placeholders
    setFormData(prev => ({ ...prev, templateParams: updated }));
  };

  return (
    <div className="max-w-xl">
      <h3 className="text-2xl font-semibold mb-4">Fill Template Parameters</h3>

      {messageType !== "text" && (
        <div className="text-gray-500 italic">
          This section is only enabled for text templates right now.
        </div>
      )}

      {messageType === "text" && placeholderIndexes.length === 0 && (
        <div className="text-gray-500 italic">
          No parameters found in the selected template.
        </div>
      )}

      {messageType === "text" && placeholderIndexes.length > 0 && (
        <div className="space-y-4">
          {placeholderIndexes.map(paramNum => (
            <div key={paramNum}>
              <label className="block text-sm font-medium mb-1">
                Value for <span className="font-mono">{`{{${paramNum}}}`}</span>
              </label>

              <input
                type="text"
                value={templateParams[paramNum - 1] || ""}
                onChange={e => handleParamChange(paramNum, e.target.value)}
                placeholder={`Enter value for {{${paramNum}}}`}
                className="w-full border rounded px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MessageBuilderTab;
