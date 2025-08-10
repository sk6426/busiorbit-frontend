import React, { useState } from "react";

function PreviewTest() {
  const [template, setTemplate] = useState(
    "Your order {{1}} is out for delivery!\nIt should arrive by {{2}}."
  );
  const [params, setParams] = useState(["", ""]);

  // ✅ Reliable param replacement
  const generatePreview = (template, paramValues) => {
    if (!template) return "";
    return template.replace(/{{(\d+)}}/g, (_, p1) => {
      const index = parseInt(p1, 10) - 1;
      return paramValues[index] || `{{${p1}}}`;
    });
  };

  const preview = generatePreview(template, params);

  const handleParamChange = (index, value) => {
    const updated = [...params];
    updated[index] = value;
    setParams(updated);
  };

  return (
    <div className="max-w-xl mx-auto p-6 space-y-4">
      <h2 className="text-2xl font-bold text-purple-700">
        🧪 Parameter Preview Test
      </h2>

      <div className="space-y-2">
        <label className="font-medium">Template Body</label>
        <textarea
          className="w-full border rounded p-2"
          rows={4}
          value={template}
          onChange={e => {
            setTemplate(e.target.value);

            // 🧠 Optional: auto update param array size
            const matchCount = (e.target.value.match(/{{\d+}}/g) || []).length;
            const filled = [...params];
            while (filled.length < matchCount) filled.push("");
            setParams(filled.slice(0, matchCount));
          }}
        />
      </div>

      <div className="space-y-2">
        <label className="font-medium">Parameter Inputs</label>
        {params.map((val, idx) => (
          <input
            key={idx}
            type="text"
            placeholder={`Param ${idx + 1}`}
            value={val}
            onChange={e => handleParamChange(idx, e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        ))}
      </div>

      <div className="bg-gray-100 p-4 rounded">
        <p className="font-semibold mb-2">Live Preview</p>
        <p className="whitespace-pre-wrap">{preview}</p>
      </div>
    </div>
  );
}

export default PreviewTest;
