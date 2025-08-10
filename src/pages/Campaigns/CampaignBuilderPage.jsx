import React, { useEffect, useState } from "react";
import axiosClient from "../../api/axiosClient";
import { toast } from "react-toastify";
import WhatsAppBubblePreview from "../../components/WhatsAppBubblePreview";
import { useNavigate } from "react-router-dom";

function CampaignBuilderPage() {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templateParams, setTemplateParams] = useState([]);
  const [buttonParams, setButtonParams] = useState([]);
  const [imageUrl, setImageUrl] = useState("");
  const [campaignName, setCampaignName] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const businessId = localStorage.getItem("businessId");
  const createdBy = localStorage.getItem("userId");
  const navigate = useNavigate();

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const res = await axiosClient.get(
          "/WhatsAppTemplateFetcher/get-template-all"
        );
        if (res.data.success && res.data.templates) {
          setTemplates(res.data.templates);
        } else {
          toast.error("❌ Template fetch failed.");
        }
      } catch {
        toast.error("❌ Error fetching templates.");
      }
    };
    loadTemplates();
  }, []);

  const isImageTemplate = tpl => tpl?.hasImageHeader === true;

  const handleTemplateSelect = name => {
    const tpl = templates.find(t => t.name === name);
    setSelectedTemplate(tpl);
    setTemplateParams(Array(tpl?.parametersCount || 0).fill(""));
    setImageUrl("");

    const dynamicParams =
      tpl?.buttonParams?.map(btn => {
        const subtype = btn.subType?.toLowerCase();
        const isDynamic = ["url", "copy_code", "flow"].includes(subtype);
        return isDynamic ? "" : null;
      }) || [];
    setButtonParams(dynamicParams);
  };

  const handleCreateCampaign = async () => {
    if (!campaignName || !selectedTemplate || templateParams.some(p => !p)) {
      toast.warn("⚠️ Please fill all required fields.");
      return;
    }

    setSubmitting(true);

    const dynamicButtonPayload =
      selectedTemplate.buttonParams?.map((btn, idx) => {
        const subtype = btn.subType?.toLowerCase();
        const isDynamic = ["url", "copy_code", "flow"].includes(subtype);
        return {
          text: btn.text,
          type: btn.type,
          subType: btn.subType,
          value: isDynamic ? buttonParams[idx] || "" : btn.parameterValue || "",
        };
      }) || [];

    const payload = {
      name: campaignName,
      messageTemplate: selectedTemplate.name,
      templateId: selectedTemplate.name,
      campaignType: isImageTemplate(selectedTemplate) ? "image" : "text",
      imageUrl: isImageTemplate(selectedTemplate) ? imageUrl : null,
      scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
      createdBy,
      businessId,
      templateParameters: templateParams,
      buttonParams: dynamicButtonPayload,
    };

    try {
      const res = await axiosClient.post(
        "/campaign/create-text-campaign",
        payload
      );
      if (res.data.success && res.data.campaignId) {
        toast.success("✅ Campaign created successfully.");
        navigate(
          `/app/campaigns/image-campaigns/assign-contacts/${res.data.campaignId}`
        );
      } else {
        toast.error("❌ Failed to create campaign.");
      }
    } catch (err) {
      console.error("❌ Error creating campaign:", err);
      toast.error("❌ Error creating campaign.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h2 className="text-xl font-bold text-purple-700">
        Create WhatsApp Campaign
      </h2>

      <input
        type="text"
        className="w-full border p-2 rounded"
        placeholder="Campaign Name"
        value={campaignName}
        onChange={e => setCampaignName(e.target.value)}
      />

      <select
        className="w-full border p-2 rounded"
        onChange={e => handleTemplateSelect(e.target.value)}
      >
        <option value="">-- Select Template --</option>
        {templates.map(tpl => (
          <option key={tpl.name} value={tpl.name}>
            {tpl.name} ({tpl.language}) — {tpl.parametersCount} param
          </option>
        ))}
      </select>

      {templateParams.length > 0 && (
        <div className="space-y-3 border p-4 rounded bg-gray-50">
          <h3 className="text-sm font-semibold">Template Parameters</h3>
          {templateParams.map((val, idx) => (
            <input
              key={idx}
              className="w-full border p-2 rounded"
              placeholder={`Param {{${idx + 1}}}`}
              value={val}
              onChange={e => {
                const updated = [...templateParams];
                updated[idx] = e.target.value;
                setTemplateParams(updated);
              }}
            />
          ))}
        </div>
      )}

      {selectedTemplate?.buttonParams?.length > 0 && (
        <div className="space-y-3 border p-4 rounded bg-gray-50">
          <h3 className="text-sm font-semibold">Button Parameters</h3>
          {selectedTemplate.buttonParams.map((btn, idx) => {
            const subtype = btn.subType?.toLowerCase();
            const isDynamic = ["url", "copy_code", "flow"].includes(subtype);

            const placeholderMap = {
              url: "Enter Redirect URL",
              copy_code: "Enter Coupon Code",
              flow: "Enter Flow ID",
            };

            const placeholder =
              placeholderMap[subtype] || `Static button (${subtype})`;

            return (
              <div key={idx}>
                <label className="block text-sm text-gray-600 mb-1 font-medium">
                  Button {idx + 1}: {subtype.toUpperCase()}
                </label>
                {isDynamic ? (
                  <input
                    className="w-full border p-2 rounded"
                    placeholder={placeholder}
                    value={buttonParams[idx] || ""}
                    onChange={e => {
                      const updated = [...buttonParams];
                      updated[idx] = e.target.value;
                      setButtonParams(updated);
                    }}
                  />
                ) : (
                  <p className="text-sm text-gray-500 italic">
                    Static button — no input required
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {selectedTemplate && isImageTemplate(selectedTemplate) && (
        <input
          type="text"
          className="w-full border p-2 rounded"
          placeholder="Image URL"
          value={imageUrl}
          onChange={e => setImageUrl(e.target.value)}
        />
      )}

      {selectedTemplate && (
        <WhatsAppBubblePreview
          templateBody={selectedTemplate.body}
          parameters={templateParams}
          buttonParams={buttonParams.filter(v => v !== null)}
          imageUrl={imageUrl}
        />
      )}

      <input
        type="datetime-local"
        className="w-full border p-2 rounded"
        value={scheduledAt}
        onChange={e => setScheduledAt(e.target.value)}
      />

      <button
        onClick={handleCreateCampaign}
        disabled={submitting}
        className={`w-full py-3 font-semibold rounded transition ${
          submitting
            ? "bg-gray-400"
            : "bg-green-600 hover:bg-green-700 text-white"
        }`}
      >
        {submitting ? "Creating..." : "Create Campaign"}
      </button>
    </div>
  );
}

export default CampaignBuilderPage;
