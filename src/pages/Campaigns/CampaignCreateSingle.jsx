// ✅ File: src/pages/campaigns/CampaignCreateSingle.jsx
import React, { useEffect, useState } from "react";
import axiosClient from "../../api/axiosClient";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

function CampaignCreateSingle() {
  const navigate = useNavigate();

  const [templates] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [templateMessage, setTemplateMessage] = useState("");
  const [form, setForm] = useState({
    templateName: "",
    message: "",
    contactIds: [],
    name: "",
    scheduledAt: "",
    templateParams: [],
  });

  const isFormValid =
    form.name.trim() &&
    (form.templateName || form.message.trim()) &&
    form.contactIds.length > 0;

  const generatePreview = (template, paramValues) => {
    if (!template) return "";
    return template.replace(/{{(\d+)}}/g, (_, p1) => {
      const index = parseInt(p1, 10) - 1;
      return paramValues[index] || `{{${p1}}}`;
    });
  };

  const previewMessage = generatePreview(
    templateMessage || form.message,
    form.templateParams
  );

  const extractParamCount = message => {
    const matches = message.match(/{{\d+}}/g);
    const unique = [...new Set(matches || [])];
    return unique.length;
  };

  const updateField = (key, value) => {
    setForm(f => ({ ...f, [key]: value }));
  };

  const handleTemplateChange = e => {
    const tplName = e.target.value;
    const tpl = templates.find(t => t.name === tplName);
    const msg = tpl?.body || "";
    const paramCount = extractParamCount(msg);

    setTemplateMessage(msg);
    updateField("templateName", tplName);
    updateField("templateParams", Array(paramCount).fill(""));
    updateField("message", "");
  };

  const updateParam = (index, value) => {
    setForm(f => {
      const updated = [...f.templateParams];
      updated[index] = value;
      return { ...f, templateParams: updated };
    });
  };

  const toggleContact = id => {
    setForm(f => ({
      ...f,
      contactIds: f.contactIds.includes(id)
        ? f.contactIds.filter(cid => cid !== id)
        : [...f.contactIds, id],
    }));
  };

  const handleSubmit = async () => {
    if (!isFormValid) {
      if (!form.name.trim()) toast.warn("⚠️ Campaign name is required");
      else if (form.contactIds.length === 0) toast.warn("⚠️ Select contacts");
      else toast.warn("⚠️ Message cannot be empty");
      return;
    }

    setSubmitting(true);

    const payload = {
      name: form.name.trim(),
      contactIds: form.contactIds,
      scheduledAt: form.scheduledAt || null,
      isTemplate: !!form.templateName,
      ...(form.templateName
        ? {
            templateName: form.templateName,
            templateId: form.templateName,
            templateParams: form.templateParams,
            messageTemplate: previewMessage.trim(),
          }
        : {
            messageTemplate: form.message.trim(),
          }),
    };

    try {
      const res = await axiosClient.post(
        "campaign/create-text-campaign",
        payload
      );
      toast.success("🚀 Campaign created!");
      localStorage.setItem(
        "lastCampaign",
        JSON.stringify({
          lastCampaignName: form.name.trim(),
          lastCampaignId: res?.data?.campaignId || null,
          launchedAt: new Date().toISOString(),
        })
      );
      navigate("/app/campaigns/list");
    } catch (err) {
      toast.error("❌ Failed to create campaign");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    axiosClient
      .get("/contacts")
      .then(res => {
        const contactList = Array.isArray(res.data) ? res.data : res.data?.data;

        if (!Array.isArray(contactList)) {
          toast.error("❌ Invalid contact format received");
          return setContacts([]);
        }

        setContacts(contactList);
      })
      .catch(() => toast.error("❌ Error loading contacts"))
      .finally(() => setLoadingContacts(false));
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-purple-700">✨ Build Campaign</h1>

      {/* Template Selection */}
      <div className="bg-white p-4 rounded shadow space-y-2">
        <label className="font-medium">Approved Template (optional)</label>
        <select
          value={form.templateName}
          onChange={handleTemplateChange}
          className="w-full border rounded px-3 py-2"
        >
          <option value="">– none –</option>
          {templates.map(t => (
            <option key={t.name} value={t.name}>
              {t.name} ({t.language})
            </option>
          ))}
        </select>

        <label className="font-medium">Message Body</label>
        <div className="w-full border rounded px-3 py-2 bg-gray-100 whitespace-pre-wrap text-sm text-gray-800">
          {templateMessage || form.message}
        </div>

        {form.templateName &&
          form.templateParams.map((param, idx) => (
            <input
              key={idx}
              type="text"
              value={param}
              onChange={e => updateParam(idx, e.target.value)}
              placeholder={`Param ${idx + 1}`}
              className="w-full border rounded px-3 py-2 mt-2"
            />
          ))}

        <p className="text-xs text-gray-500">
          Placeholders like <code>{`{{1}}`}</code> will be auto-replaced.
        </p>
      </div>

      {/* Contact Selection */}
      <div className="bg-white p-4 rounded shadow space-y-2">
        <label className="font-medium">Select Contacts</label>
        <div className="flex gap-2 mb-2">
          <button
            onClick={() =>
              setForm(f => ({
                ...f,
                contactIds: contacts.map(c => c.id),
              }))
            }
            className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm"
          >
            Select All
          </button>
          <button
            onClick={() => updateField("contactIds", [])}
            className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-sm"
          >
            Deselect All
          </button>
          <span className="text-sm text-gray-500">
            {form.contactIds.length} selected
          </span>
        </div>
        {loadingContacts ? (
          <p>Loading contacts…</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-2 max-h-64 overflow-auto">
            {contacts.map(c => (
              <label
                key={c.id}
                className="flex flex-col border rounded p-2 hover:bg-gray-50"
              >
                <div className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.contactIds.includes(c.id)}
                    onChange={() => toggleContact(c.id)}
                  />
                  {c.name} ({c.phoneNumber})
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Campaign Info */}
      <div className="bg-white p-4 rounded shadow space-y-2">
        <label className="font-medium">Campaign Name</label>
        <input
          type="text"
          value={form.name}
          onChange={e => updateField("name", e.target.value)}
          className="w-full border rounded px-3 py-2"
          placeholder="e.g. Summer Promo"
        />
        <label className="font-medium">Schedule (optional)</label>
        <input
          type="datetime-local"
          value={form.scheduledAt}
          onChange={e => updateField("scheduledAt", e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
      </div>

      {/* Preview */}
      <div className="bg-gray-100 p-4 rounded text-sm">
        <p className="font-semibold mb-1">👁️ Live Preview</p>
        <p className="whitespace-pre-wrap">{previewMessage}</p>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!isFormValid || submitting}
        className={`w-full py-3 font-semibold rounded transition ${
          isFormValid && !submitting
            ? "bg-green-600 text-white hover:bg-green-700"
            : "bg-gray-300 text-gray-500 cursor-not-allowed"
        }`}
      >
        {submitting ? "⏳ Launching..." : "🚀 Launch Campaign"}
      </button>
    </div>
  );
}

export default CampaignCreateSingle;
