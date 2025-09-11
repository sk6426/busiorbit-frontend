// 📄 src/pages/campaigns/CampaignBuilderPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import axiosClient from "../../api/axiosClient";
import { toast } from "react-toastify";
import PhoneWhatsAppPreview from "../../components/PhoneWhatsAppPreview";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/context/pld_AuthContext"; // adjust if your path differs

// === Adjust this if your API route differs ===
const SYNC_ENDPOINT = bid => `/templates/sync/${bid}`; // POST

const isGuid = v =>
  !!v &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v
  );

function CampaignBuilderPage() {
  const { businessId: ctxBusinessId } = useAuth();

  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templateParams, setTemplateParams] = useState([]);
  const [buttonParams, setButtonParams] = useState([]);
  const [imageUrl, setImageUrl] = useState("");

  const [campaignName, setCampaignName] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // 🆕 Flow association state
  const [useFlow, setUseFlow] = useState(false);
  const [flows, setFlows] = useState([]);
  const [loadingFlows, setLoadingFlows] = useState(false);
  const [selectedFlowId, setSelectedFlowId] = useState("");

  const businessId = useMemo(
    () => ctxBusinessId || localStorage.getItem("businessId") || null,
    [ctxBusinessId]
  );
  const hasValidBusiness = isGuid(businessId);

  const createdBy = localStorage.getItem("userId");
  const businessName = localStorage.getItem("businessName") || "Your Business";
  const navigate = useNavigate();

  const isImageTemplate = tpl => tpl?.hasImageHeader === true;

  // Load approved templates when businessId is ready
  useEffect(() => {
    const load = async () => {
      if (!hasValidBusiness) return;
      setLoadingTemplates(true);
      try {
        const res = await axiosClient.get(
          `/templates/${businessId}?status=APPROVED`
        );
        if (res.data?.success) setTemplates(res.data.templates || []);
        else toast.error("❌ Failed to load templates.");
      } catch {
        toast.error("❌ Error loading templates.");
      } finally {
        setLoadingTemplates(false);
      }
    };
    load();
  }, [businessId, hasValidBusiness]);

  // 🔁 Load flows from CampaignController when "Attach Flow" is toggled
  useEffect(() => {
    if (!useFlow || !hasValidBusiness) return;

    const loadFlows = async () => {
      setLoadingFlows(true);
      try {
        // With [Route("api/[controller]")] + [HttpGet("list/{businessId:guid}")]
        // and axiosClient baseURL="/api", the path below resolves to /api/campaign/list/{businessId}
        const r = await axiosClient.get(
          `/campaign/list/${businessId}?onlyPublished=true`
        );

        const items = Array.isArray(r.data?.items) ? r.data.items : [];
        const mapped = items
          .map(f => ({
            id: f.id ?? f.Id,
            name: f.flowName ?? f.FlowName,
            isPublished: f.isPublished ?? f.IsPublished ?? true,
          }))
          .filter(x => x.id && x.name);

        setFlows(mapped);
        if (!mapped.length) {
          toast.info(
            "ℹ️ No published flows found. You can still create a campaign without a flow."
          );
        }
      } catch {
        toast.error("❌ Error loading flows.");
        setFlows([]);
      } finally {
        setLoadingFlows(false);
      }
    };

    loadFlows();
  }, [useFlow, hasValidBusiness, businessId]);

  // 🔄 Sync Templates
  const handleSyncTemplates = async () => {
    if (!hasValidBusiness) {
      toast.warn("⚠️ Business context missing. Please re-login.");
      return;
    }
    setSyncing(true);
    try {
      const res = await axiosClient.post(SYNC_ENDPOINT(businessId));
      const ok =
        res?.data?.success === true ||
        res?.status === 200 ||
        res?.status === 204;
      if (ok) {
        toast.success("✅ Templates synced. Refreshing list…");
        setLoadingTemplates(true);
        try {
          const r2 = await axiosClient.get(
            `/templates/${businessId}?status=APPROVED`
          );
          if (r2.data?.success) setTemplates(r2.data.templates || []);
        } finally {
          setLoadingTemplates(false);
        }
      } else {
        toast.error("❌ Sync failed.");
      }
    } catch (e) {
      toast.error("❌ Error syncing templates.");
    } finally {
      setSyncing(false);
    }
  };

  const handleTemplateSelect = async name => {
    if (!name) {
      setSelectedTemplate(null);
      setTemplateParams([]);
      setButtonParams([]);
      setImageUrl("");
      return;
    }
    try {
      if (!hasValidBusiness) {
        toast.error("Invalid or missing Business ID. Please re-login.");
        return;
      }
      const res = await axiosClient.get(
        `/templates/${businessId}/${encodeURIComponent(name)}`
      );
      const t = res.data;
      if (!t?.name) {
        toast.error("❌ Could not load template details.");
        return;
      }

      let parsedButtons = [];
      try {
        parsedButtons = t.buttonsJson ? JSON.parse(t.buttonsJson) : [];
      } catch {
        parsedButtons = [];
      }

      const normalized = {
        name: t.name,
        language: t.language,
        body: t.body || "",
        hasImageHeader: !!t.hasImageHeader,
        parametersCount: t.placeholderCount || 0,
        buttonParams: parsedButtons,
      };

      setSelectedTemplate(normalized);
      setTemplateParams(Array(normalized.parametersCount).fill(""));

      const dynSlots =
        normalized.buttonParams?.map(btn => {
          const originalUrl = btn?.ParameterValue || btn?.parameterValue || "";
          const subtype = (btn?.SubType || btn?.subType || "").toLowerCase();
          const isDynamic =
            ["url", "copy_code", "flow"].includes(subtype) ||
            originalUrl.includes("{{1}}");
          return isDynamic ? "" : null;
        }) || [];
      setButtonParams(dynSlots);
      setImageUrl("");
    } catch {
      toast.error("❌ Error loading template details.");
    }
  };

  // 📄 Create Campaign
  const handleCreateCampaign = async () => {
    if (!hasValidBusiness) {
      toast.error("Invalid or missing Business ID. Please re-login.");
      return;
    }
    if (!campaignName || !selectedTemplate) {
      toast.warn("⚠️ Please fill campaign name and choose a template.");
      return;
    }
    if (templateParams.some(p => p === "")) {
      toast.warn("⚠️ Please fill all template parameters.");
      return;
    }
    if (useFlow && !selectedFlowId) {
      toast.warn("⚠️ Please select a flow or uncheck “Attach Flow”.");
      return;
    }

    setSubmitting(true);

    const buttonPayload =
      selectedTemplate.buttonParams?.map((btn, idx) => {
        const originalUrl = btn?.ParameterValue || btn?.parameterValue || "";
        const subtype = (btn?.SubType || btn?.subType || "").toLowerCase();
        const isDynamic =
          ["url", "copy_code", "flow"].includes(subtype) ||
          originalUrl.includes("{{1}}");

        return {
          text: btn?.Text || btn?.text || "Button",
          type: btn?.Type || btn?.type || "",
          value: isDynamic ? buttonParams[idx] || "" : originalUrl,
          position: idx + 1,
        };
      }) || [];

    const payload = {
      name: campaignName,
      messageTemplate: selectedTemplate.name,
      templateId: selectedTemplate.name,
      buttonParams: buttonPayload,
      campaignType: isImageTemplate(selectedTemplate) ? "image" : "text",
      imageUrl: isImageTemplate(selectedTemplate) ? imageUrl : null,
      scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
      createdBy,
      businessId,
      templateParameters: templateParams,

      // 🆕 Optional flow link (backend treats null/empty as “no flow”)
      ctaFlowConfigId: useFlow ? selectedFlowId : null,
    };

    try {
      const res = await axiosClient.post(
        "/campaign/create-text-campaign",
        payload
      );
      if (res.data?.success && res.data?.campaignId) {
        toast.success("✅ Campaign created successfully.");
        navigate(
          `/app/campaigns/image-campaigns/assign-contacts/${res.data.campaignId}`
        );
      } else {
        toast.error("❌ Failed to create campaign.");
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || "❌ Error creating campaign.";
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const templateOptions = useMemo(
    () =>
      templates.map(tpl => ({
        key: `${tpl.name}-${tpl.language}`,
        label: `${tpl.name} (${tpl.language}) — ${tpl.placeholderCount} param`,
        value: tpl.name,
      })),
    [templates]
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      {/* Header */}
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Create WhatsApp Campaign
          </h1>
          <p className="mt-0.5 text-xs text-gray-500">
            Pick a template, preview, then schedule.
          </p>
        </div>

        {/* 🔄 Sync Templates action */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSyncTemplates}
            disabled={!hasValidBusiness || syncing}
            className={`rounded-lg px-3 py-2 text-sm font-semibold text-white shadow-sm transition ${
              !hasValidBusiness || syncing
                ? "bg-gray-400"
                : "bg-indigo-600 hover:bg-indigo-700"
            }`}
            title={
              !hasValidBusiness ? "Login required to sync templates" : undefined
            }
          >
            {syncing ? "Syncing…" : "Sync Templates"}
          </button>
        </div>
      </div>

      {/* Friendly fallback if businessId not available */}
      {!hasValidBusiness && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <div className="flex items-start gap-3">
            <span className="mt-0.5">⚠️</span>
            <div>
              <p className="font-medium">
                We’re loading your business context…
              </p>
              <p className="mt-1 text-amber-800/90">
                If this doesn’t resolve in a moment, please re-login so we can
                attach your Business ID to requests.
              </p>
              <div className="mt-3">
                <button
                  onClick={() => navigate("/login")}
                  className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
                  type="button"
                >
                  Go to Login
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content grid */}
      <div className="grid gap-4 md:grid-cols-[1fr_320px]">
        {/* Left column – form */}
        <div className="space-y-4">
          {/* Campaign meta */}
          <section className="rounded-xl border bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-gray-800">
              Campaign details
            </h2>
            <div className="space-y-3 text-sm">
              <div>
                <label className="mb-1 block font-medium text-gray-700">
                  Campaign name
                </label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-purple-500"
                  placeholder="e.g. Diwali Blast – Returning Customers"
                  value={campaignName}
                  onChange={e => setCampaignName(e.target.value)}
                  disabled={!hasValidBusiness}
                />
              </div>

              <div>
                <label className="mb-1 block font-medium text-gray-700">
                  Template <span className="text-gray-400">(approved)</span>
                </label>
                <select
                  disabled={loadingTemplates || !hasValidBusiness}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-purple-500 disabled:bg-gray-100"
                  onChange={e => handleTemplateSelect(e.target.value)}
                  value={selectedTemplate?.name || ""}
                >
                  <option value="" disabled>
                    {loadingTemplates
                      ? "Loading templates…"
                      : "-- Select Template --"}
                  </option>
                  {templateOptions.map(o => (
                    <option key={o.key} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-gray-400">
                  Only templates with status{" "}
                  <span className="font-medium">APPROVED</span> are listed.
                </p>
              </div>
            </div>
          </section>

          {/* 🆕 Flow association (optional) */}
          <section className="rounded-xl border bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-gray-800">
              Flow (optional)
            </h2>
            <div className="flex items-center gap-3 text-sm">
              <input
                id="useFlow"
                type="checkbox"
                checked={useFlow}
                onChange={e => {
                  setUseFlow(e.target.checked);
                  if (!e.target.checked) setSelectedFlowId("");
                }}
                disabled={!hasValidBusiness}
              />
              <label htmlFor="useFlow" className="text-gray-700">
                Attach a Visual Flow to this campaign
              </label>
            </div>

            {useFlow && (
              <div className="mt-3">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Select Flow
                </label>
                <select
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-purple-500 disabled:bg-gray-100"
                  disabled={loadingFlows || !hasValidBusiness}
                  value={selectedFlowId}
                  onChange={e => setSelectedFlowId(e.target.value)}
                >
                  <option value="">
                    {loadingFlows ? "Loading flows…" : "-- Select Flow --"}
                  </option>
                  {flows.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-gray-400">
                  If attached, the campaign will <strong>start</strong> from the
                  flow’s entry step. The backend will align the starting
                  template automatically.
                </p>
              </div>
            )}
          </section>

          {/* Parameters */}
          {selectedTemplate && (
            <section className="rounded-xl border bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold text-gray-800">
                Personalization
              </h2>

              {/* Template params */}
              {templateParams.length > 0 && (
                <div className="mb-4 space-y-2 text-sm">
                  <h3 className="text-xs font-semibold text-gray-700">
                    Template parameters
                  </h3>
                  {templateParams.map((val, idx) => (
                    <div key={`tp-${idx}`} className="flex items-center gap-2">
                      <div className="w-20 shrink-0 text-xs text-gray-500">{`{{${
                        idx + 1
                      }}}`}</div>
                      <input
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-purple-500"
                        placeholder={`Value for {{${idx + 1}}}`}
                        value={val}
                        onChange={e => {
                          const next = [...templateParams];
                          next[idx] = e.target.value;
                          setTemplateParams(next);
                        }}
                        disabled={!hasValidBusiness}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Button params */}
              {selectedTemplate?.buttonParams?.length > 0 && (
                <div className="space-y-2 text-sm">
                  <h3 className="text-xs font-semibold text-gray-700">
                    Button parameters
                  </h3>
                  {selectedTemplate.buttonParams.map((btn, idx) => {
                    const originalUrl =
                      btn?.ParameterValue || btn?.parameterValue || "";
                    const subtype = (
                      btn?.SubType ||
                      btn?.subType ||
                      ""
                    ).toLowerCase();
                    const dynamic =
                      ["url", "copy_code", "flow"].includes(subtype) ||
                      originalUrl.includes("{{1}}");
                    const placeholders = {
                      url: "Enter Redirect URL",
                      copy_code: "Enter Coupon Code",
                      flow: "Enter Flow ID",
                    };
                    return (
                      <div key={`bp-${idx}`}>
                        <label className="mb-1 block text-[11px] font-medium text-gray-500">
                          {btn?.Text || btn?.text || "Button"} ·{" "}
                          {subtype ? subtype.toUpperCase() : "STATIC"}
                        </label>
                        {dynamic ? (
                          <input
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-purple-500"
                            placeholder={placeholders[subtype] || "Enter value"}
                            value={buttonParams[idx] || ""}
                            onChange={e => {
                              const next = [...buttonParams];
                              next[idx] = e.target.value;
                              setButtonParams(next);
                            }}
                            disabled={!hasValidBusiness}
                          />
                        ) : (
                          <p className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-500">
                            Static value:{" "}
                            {btn?.ParameterValue ||
                              btn?.parameterValue ||
                              "N/A"}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* Media + schedule */}
          <section className="rounded-xl border bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-gray-800">
              Delivery
            </h2>

            {selectedTemplate && isImageTemplate(selectedTemplate) && (
              <div className="mb-3 text-sm">
                <label className="mb-1 block font-medium text-gray-700">
                  Image URL
                </label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-purple-500"
                  placeholder="https://…"
                  value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                  disabled={!hasValidBusiness}
                />
              </div>
            )}

            <div className="text-sm">
              <label className="mb-1 block font-medium text-gray-700">
                Schedule
              </label>
              <input
                type="datetime-local"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-purple-500"
                value={scheduledAt}
                onChange={e => setScheduledAt(e.target.value)}
                disabled={!hasValidBusiness}
              />
              <p className="mt-1 text-[11px] text-gray-400">
                Leave empty to send immediately after assignment.
              </p>
            </div>
          </section>

          {/* Submit */}
          <div className="sticky bottom-3 z-10">
            <button
              onClick={handleCreateCampaign}
              disabled={submitting || !hasValidBusiness}
              className={`w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition ${
                submitting || !hasValidBusiness
                  ? "bg-gray-400"
                  : "bg-green-600 hover:bg-green-700"
              }`}
              title={
                !hasValidBusiness
                  ? "Login required to create a campaign"
                  : undefined
              }
            >
              {submitting ? "Creating…" : "Create Campaign"}
            </button>
          </div>
        </div>

        {/* Right column – sticky preview */}
        <aside className="md:sticky md:top-4">
          <div className="rounded-xl border bg-[#fafaf7] p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-xs font-semibold text-gray-800">Preview</h3>
              <span className="text-[11px] text-gray-400">Customer view</span>
            </div>

            {hasValidBusiness ? (
              selectedTemplate ? (
                <div className="flex justify-center">
                  <PhoneWhatsAppPreview
                    businessName={businessName}
                    templateBody={selectedTemplate.body}
                    parameters={templateParams}
                    imageUrl={isImageTemplate(selectedTemplate) ? imageUrl : ""}
                    buttonParams={(selectedTemplate.buttonParams || []).map(
                      (btn, idx) => {
                        const originalUrl =
                          btn?.ParameterValue || btn?.parameterValue || "";
                        const subtype = (
                          btn?.SubType ||
                          btn?.subType ||
                          ""
                        ).toLowerCase();
                        const dynamic =
                          ["url", "copy_code", "flow"].includes(subtype) ||
                          originalUrl.includes("{{1}}");
                        return {
                          text: btn?.Text || btn?.text || "Button",
                          subType: btn?.SubType || btn?.subType || "",
                          type: btn?.Type || btn?.type || "",
                          value: dynamic
                            ? buttonParams?.[idx] || ""
                            : btn?.ParameterValue || btn?.parameterValue || "",
                        };
                      }
                    )}
                    width="clamp(330px, 42vw, 410px)"
                  />
                </div>
              ) : (
                <div className="flex h-[460px] items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white text-xs text-gray-400">
                  Select a template to preview it here
                </div>
              )
            ) : (
              <div className="flex h-[460px] items-center justify-center rounded-xl border border-dashed border-amber-200 bg-amber-50 text-xs text-amber-900">
                Waiting for Business ID…
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

export default CampaignBuilderPage;
