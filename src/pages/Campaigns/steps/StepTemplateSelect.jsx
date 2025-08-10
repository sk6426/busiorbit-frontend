import React, { useEffect, useState } from "react";
import axiosClient from "../../../api/axiosClient";
import { toast } from "react-toastify";

function StepTemplateSelect({ selectedTemplateId, message, onChange }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch templates safely
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await axiosClient.get("/whatsapp/templates");

        const data = res.data;
        if (data.success && Array.isArray(data.templates)) {
          setTemplates(data.templates);
        } else {
          toast.error("⚠️ Failed to load templates (invalid format)");
          setTemplates([]);
        }
      } catch (err) {
        toast.error("❌ Error loading templates");
        setTemplates([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  // ✅ Handle dropdown change
  const handleTemplateChange = e => {
    const selectedId = e.target.value;
    const selected = templates.find(t => t.name === selectedId); // Match by name
    onChange({
      templateId: selectedId,
      message: selected ? selected.body : "",
    });
  };

  return (
    <div className="bg-white p-6 rounded shadow space-y-4">
      <h2 className="text-xl font-semibold text-purple-700">
        🧾 Step 1: Choose Approved Template
      </h2>

      {/* Dropdown */}
      {loading ? (
        <p>Loading templates...</p>
      ) : (
        <select
          value={selectedTemplateId || ""}
          onChange={handleTemplateChange}
          className="border rounded px-3 py-2 w-full"
        >
          <option value="">-- Select Template --</option>
          {templates.map(t => (
            <option key={t.name} value={t.name}>
              {t.name}
            </option>
          ))}
        </select>
      )}

      {/* Message Preview / Editor */}
      <label className="block text-sm font-medium text-gray-700">
        ✍️ Message Body (Editable)
      </label>
      <textarea
        rows={5}
        value={message}
        onChange={e => onChange({ message: e.target.value })}
        className="border rounded w-full px-3 py-2"
        placeholder="Hello {name}, your status is {status}."
      />

      <div className="text-xs text-gray-500 mt-1">
        You can use placeholders like <code>{`{name}`}</code> and{" "}
        <code>{`{status}`}</code>.
      </div>
    </div>
  );
}

export default StepTemplateSelect;
