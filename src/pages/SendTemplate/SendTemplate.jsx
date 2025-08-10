// File: src/pages/Messaging/TemplateSender.jsx

import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";

/**
 * This component allows users to send WhatsApp template messages.
 * It fetches template metadata from the backend and dynamically adjusts
 * parameter fields and preview accordingly.
 */
function TemplateSender() {
  const [templates, setTemplates] = useState([]);
  const [selected, setSelected] = useState(null);
  const [recipient, setRecipient] = useState("");
  const [params, setParams] = useState([]);

  const businessId =
    localStorage.getItem("businessId") ||
    "68a5b6cd-a420-41d1-9a35-08705748e855";

  // 🔁 Fetch template metadata on load
  useEffect(() => {
    axios
      .get("/api/templates/metadata")
      .then(res => {
        if (res.data.success) {
          setTemplates(res.data.templates);
        } else {
          toast.error("Failed to load templates");
        }
      })
      .catch(err => {
        console.error(err);
        toast.error("Error fetching templates");
      });
  }, []);

  // 🔁 Handle selection
  const handleTemplateChange = name => {
    const tpl = templates.find(t => t.name === name);
    setSelected(tpl);
    setParams(Array(tpl?.placeholderCount || 0).fill(""));
  };

  const handleParamChange = (index, value) => {
    const updated = [...params];
    updated[index] = value;
    setParams(updated);
  };

  const preview = () => {
    if (!selected?.body) return "";
    let rendered = selected.body;
    const regex = /{{(.*?)}}/g;
    let i = 0;
    rendered = rendered.replace(regex, () => {
      const val = params[i] || `[${i + 1}]`;
      i++;
      return val;
    });
    return rendered;
  };

  const handleSubmit = async e => {
    e.preventDefault();

    if (!selected || !recipient) {
      toast.error("Fill all required fields");
      return;
    }

    const payload = {
      businessId,
      recipientNumber: recipient,
      templateName: selected.name,
      languageCode: selected.language,
      templateParameters: params,
      messageType: "template",
    };

    try {
      const res = await axios.post("/api/messages/send-template", payload);
      toast.success("✅ Message sent successfully");
      console.log(res.data);
    } catch (err) {
      toast.error("❌ Failed to send message");
      console.error(err);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4">📩 Send Template Message</h2>
      <form
        onSubmit={handleSubmit}
        className="space-y-4 bg-white shadow p-4 rounded"
      >
        {/* Template Dropdown */}
        <div>
          <label className="block font-medium mb-1">Template *</label>
          <select
            value={selected?.name || ""}
            onChange={e => handleTemplateChange(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          >
            <option value="">-- Select Template --</option>
            {templates.map(tpl => (
              <option key={tpl.name} value={tpl.name}>
                {tpl.name} ({tpl.language})
              </option>
            ))}
          </select>
        </div>

        {/* Recipient Input */}
        <div>
          <label className="block font-medium mb-1">Recipient Number *</label>
          <input
            type="text"
            value={recipient}
            onChange={e => setRecipient(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            placeholder="+91xxxxxxxxxx"
          />
        </div>

        {/* Dynamic Parameters */}
        {selected?.placeholderCount > 0 && (
          <div>
            <label className="block font-medium mb-1">Parameters</label>
            {params.map((val, idx) => (
              <input
                key={idx}
                type="text"
                value={val}
                onChange={e => handleParamChange(idx, e.target.value)}
                placeholder={`Value for {{${idx + 1}}}`}
                className="w-full mb-2 border px-3 py-2 rounded"
              />
            ))}
          </div>
        )}

        {/* Final Preview */}
        {selected?.body && (
          <div className="bg-gray-100 p-3 rounded text-sm">
            <p className="font-semibold mb-1">🧾 Preview</p>
            <p className="text-gray-700 whitespace-pre-wrap">{preview()}</p>
          </div>
        )}

        <button
          type="submit"
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
        >
          🚀 Send Template
        </button>
      </form>
    </div>
  );
}

export default TemplateSender;
