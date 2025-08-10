import React, { useEffect, useState } from "react";
import axiosClient from "../../api/axiosClient";
import { toast } from "react-toastify";

function TemplateMessageTab() {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templateParams, setTemplateParams] = useState([]);
  const [recipientNumber, setRecipientNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [previewBody, setPreviewBody] = useState("");

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const res = await axiosClient.get(
          `/WhatsAppTemplateFetcher/get-template-all`
        );

        if (res.data.success && res.data.templates) {
          const enriched = res.data.templates.map(tpl => {
            const bodyComponent = tpl.components?.find(c => c.type === "BODY");
            const buttonComponent = tpl.components?.find(
              c => c.type === "BUTTON"
            );

            // ✅ Safely extract bodyText with fallback to example
            let bodyText = "";
            if (bodyComponent) {
              if (
                typeof bodyComponent.text === "string" &&
                bodyComponent.text.trim()
              ) {
                bodyText = bodyComponent.text;
              } else if (
                bodyComponent.example &&
                Array.isArray(bodyComponent.example.body_text) &&
                bodyComponent.example.body_text.length > 0
              ) {
                bodyText = bodyComponent.example.body_text[0];
              }
            }

            const paramCount = (bodyText.match(/{{\d+}}/g) || []).length;
            const buttonText = buttonComponent?.buttons?.[0]?.text || "";

            return {
              name: tpl.name,
              language: tpl.language,
              bodyText,
              bodyParamCount: paramCount,
              buttonText,
            };
          });

          setTemplates(enriched);
        } else {
          toast.warn("⚠️ No templates found.");
        }
      } catch (err) {
        toast.error("❌ Failed to fetch templates.");
      }
    };

    loadTemplates();
  }, []);

  const handleTemplateChange = e => {
    const templateName = e.target.value;
    const found = templates.find(t => t.name === templateName);
    setSelectedTemplate(found);

    if (found) {
      const emptyParams = Array(found.bodyParamCount).fill("");
      setTemplateParams(emptyParams);

      let preview = found.bodyText || "";
      emptyParams.forEach((val, idx) => {
        preview = preview.replace(`{{${idx + 1}}}`, val || `{{${idx + 1}}}`);
      });

      setPreviewBody(preview);
    }
  };

  const handleParamChange = (index, value) => {
    const newParams = [...templateParams];
    newParams[index] = value;
    setTemplateParams(newParams);

    if (selectedTemplate?.bodyText) {
      let preview = selectedTemplate.bodyText;
      newParams.forEach((val, idx) => {
        preview = preview.replace(`{{${idx + 1}}}`, val || `{{${idx + 1}}}`);
      });
      setPreviewBody(preview);
    }
  };

  const handleSend = async () => {
    if (!recipientNumber || !selectedTemplate) {
      toast.warn("📌 Fill recipient and select a template.");
      return;
    }

    const businessId = localStorage.getItem("businessId");
    if (!businessId) {
      toast.error("❌ Business ID missing.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        businessId,
        recipientNumber,
        templateName: selectedTemplate.name,
        templateParams,
      };

      const res = await axiosClient.post(
        "/messageengine/send-template",
        payload
      );

      if (res.status === 200) {
        toast.success("✅ Template message sent!");
        setRecipientNumber("");
        setSelectedTemplate(null);
        setTemplateParams([]);
        setPreviewBody("");
      } else {
        toast.error("❌ Send failed.");
      }
    } catch (err) {
      toast.error("❌ Error sending.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Phone Number Input */}
      <input
        type="text"
        placeholder="Enter phone number"
        value={recipientNumber}
        onChange={e => setRecipientNumber(e.target.value)}
        className="w-full border px-3 py-2 rounded-md shadow-sm"
      />

      {/* Template Dropdown */}
      <select
        className="w-full border px-3 py-2 rounded-md"
        value={selectedTemplate?.name || ""}
        onChange={handleTemplateChange}
      >
        <option value="">-- Select Template --</option>
        {templates.map(tpl => (
          <option key={tpl.name} value={tpl.name}>
            {tpl.name} ({tpl.language})
          </option>
        ))}
      </select>

      {/* Param Inputs */}
      {templateParams.length > 0 && (
        <div className="space-y-2">
          {templateParams.map((val, idx) => (
            <input
              key={idx}
              type="text"
              placeholder={`Param ${idx + 1}`}
              value={val}
              onChange={e => handleParamChange(idx, e.target.value)}
              className="w-full border px-3 py-2 rounded-md shadow-sm"
            />
          ))}
        </div>
      )}

      {/* WhatsApp-Style Preview */}
      {selectedTemplate && (
        <div className="rounded-md bg-white border px-4 py-3 shadow-sm w-full text-gray-800">
          <div className="flex flex-col gap-2">
            <div className="bg-[#f0f0f0] rounded-lg px-4 py-3 shadow-inner">
              <p className="font-semibold text-[15px] text-black">
                {selectedTemplate?.name.replaceAll("_", " ")}
              </p>
              <p className="mt-1 whitespace-pre-line text-sm text-gray-800">
                {previewBody || "(no preview available)"}
              </p>

              {selectedTemplate?.buttonText && (
                <div className="mt-3">
                  <button className="text-blue-600 text-sm underline hover:text-blue-800">
                    {selectedTemplate.buttonText}
                  </button>
                </div>
              )}
            </div>
            <div className="text-[10px] text-right text-gray-400">07:58</div>
          </div>
        </div>
      )}

      {/* Send Button */}
      <button
        onClick={handleSend}
        disabled={loading}
        className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50 w-full"
      >
        {loading ? "Sending..." : "Send Message"}
      </button>
    </div>
  );
}

export default TemplateMessageTab;
