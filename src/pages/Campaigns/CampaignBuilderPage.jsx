// 📄 src/pages/campaigns/CampaignBuilderPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import axiosClient from "../../api/axiosClient";
import { toast } from "react-toastify";
import PhoneWhatsAppPreview from "../../components/PhoneWhatsAppPreview";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/context/pld_AuthContext";

// === Adjust this if your API route differs ===
const SYNC_ENDPOINT = bid => `/templates/sync/${bid}`; // POST

const isGuid = v =>
  !!v &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v
  );

// Header kind helpers (frontend-only)
const HK = Object.freeze({
  None: "none",
  Text: "text",
  Image: "image",
  Video: "video",
  Document: "document",
});
const isMediaHeader = hk =>
  hk === HK.Image || hk === HK.Video || hk === HK.Document;
const mediaLabel = hk =>
  hk === HK.Image
    ? "Image URL"
    : hk === HK.Video
    ? "Video URL"
    : "Document URL";

function CampaignBuilderPage() {
  const { businessId: ctxBusinessId } = useAuth();

  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templateParams, setTemplateParams] = useState([]);
  const [buttonParams, setButtonParams] = useState([]);

  // Unified header media url (for Image/Video/Document)
  const [headerMediaUrl, setHeaderMediaUrl] = useState("");

  const [campaignName, setCampaignName] = useState("");

  const [scheduledAt, setScheduledAt] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Optional Flow
  const [useFlow, setUseFlow] = useState(false);
  const [flows, setFlows] = useState([]);
  const [loadingFlows, setLoadingFlows] = useState(false);
  const [selectedFlowId, setSelectedFlowId] = useState("");

  // Sender selection (from WhatsAppPhoneNumbers)
  const [senders, setSenders] = useState([]); // [{id, provider, phoneNumberId, whatsAppNumber}]
  const [selectedSenderId, setSelectedSenderId] = useState("");

  // CSV controls all dynamic personalization (default ON)
  const [useCsvPersonalization, setUseCsvPersonalization] = useState(true);

  const businessId = useMemo(
    () => ctxBusinessId || localStorage.getItem("businessId") || null,
    [ctxBusinessId]
  );
  const hasValidBusiness = isGuid(businessId);

  const createdBy = localStorage.getItem("userId");
  const businessName = localStorage.getItem("businessName") || "Your Business";
  const navigate = useNavigate();

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

  // Load flows when "Attach Flow" is toggled
  useEffect(() => {
    if (!useFlow || !hasValidBusiness) return;

    const loadFlows = async () => {
      setLoadingFlows(true);
      try {
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

  // Load available senders (WhatsAppPhoneNumbers) for this business
  useEffect(() => {
    if (!hasValidBusiness) return;
    (async () => {
      try {
        const r = await axiosClient.get(
          `/WhatsAppSettings/senders/${businessId}`
        );

        const raw = Array.isArray(r.data) ? r.data : r.data?.items || [];
        const normalized = raw.map(x => {
          const provider = String(x.provider || "").toUpperCase(); // "PINNACLE" | "META_CLOUD"
          const phoneNumberId = x.phoneNumberId;
          const whatsAppNumber =
            x.whatsAppBusinessNumber ??
            x.whatsappBusinessNumber ??
            x.displayNumber ??
            x.phoneNumber ??
            x.phoneNumberId;

          const id = x.id ?? `${provider}|${phoneNumberId}`;
          return { id, provider, phoneNumberId, whatsAppNumber };
        });

        setSenders(normalized);
        // If exactly one sender, preselect it
        if (normalized.length === 1) setSelectedSenderId(normalized[0].id);
      } catch {
        toast.error("❌ Failed to load WhatsApp senders.");
        setSenders([]);
        setSelectedSenderId("");
      }
    })();
  }, [hasValidBusiness, businessId]);

  // Sync Templates
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
    } catch {
      toast.error("❌ Error syncing templates.");
    } finally {
      setSyncing(false);
    }
  };

  const normalizeHeaderKind = t => {
    // Prefer new backend fields; fallback to image-only legacy flag
    const raw = (t.headerKind || "").toString().toLowerCase();
    if (
      raw === HK.Image ||
      raw === HK.Video ||
      raw === HK.Document ||
      raw === HK.Text ||
      raw === HK.None
    ) {
      return raw;
    }
    // Legacy: only image known
    return t.hasImageHeader ? HK.Image : HK.None;
  };

  const handleTemplateSelect = async name => {
    if (!name) {
      setSelectedTemplate(null);
      setTemplateParams([]);
      setButtonParams([]);
      setHeaderMediaUrl("");
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

      const hk = normalizeHeaderKind(t);
      const requiresHeaderMediaUrl =
        t.requiresHeaderMediaUrl === true || isMediaHeader(hk);

      const normalized = {
        name: t.name,
        language: t.language, // <-- we will send this at creation
        body: t.body || "",
        headerKind: hk, // "image" | "video" | "document" | "text" | "none"
        requiresHeaderMediaUrl,
        // Legacy fields kept (not used for logic anymore)
        hasImageHeader: !!t.hasImageHeader,
        parametersCount: t.placeholderCount || 0, // total placeholders in body (server-derived)
        buttonParams: parsedButtons,
      };

      setSelectedTemplate(normalized);
      setTemplateParams(Array(normalized.parametersCount).fill(""));

      // Build client-side slots only to render the preview (actual dynamic values come from CSV later)
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
      setHeaderMediaUrl("");
    } catch {
      toast.error("❌ Error loading template details.");
    }
  };

  // Create Campaign
  const handleCreateCampaign = async () => {
    if (!hasValidBusiness) {
      toast.error("Invalid or missing Business ID. Please re-login.");
      return;
    }
    if (!campaignName || !selectedTemplate) {
      toast.warn("⚠️ Please fill campaign name and choose a template.");
      return;
    }
    // Only require body params when NOT using CSV
    if (!useCsvPersonalization && templateParams.some(p => p === "")) {
      toast.warn("⚠️ Please fill all template parameters or enable CSV.");
      return;
    }
    if (useFlow && !selectedFlowId) {
      toast.warn("⚠️ Please select a flow or uncheck “Attach Flow”.");
      return;
    }

    // Resolve selected sender (required)
    const selectedSender = senders.find(s => s.id === selectedSenderId);
    if (!selectedSender || !selectedSender.phoneNumberId) {
      toast.warn("⚠️ Please choose a Sender (number).");
      return;
    }

    // Header media rules (campaign-level)
    const hk = selectedTemplate?.headerKind || HK.None;
    if (isMediaHeader(hk) && !headerMediaUrl) {
      toast.warn(`⚠️ Please provide a ${mediaLabel(hk)}.`);
      return;
    }

    setSubmitting(true);

    // Keep static button values; leave dynamic button values empty (CSV will provide later)
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
          value: isDynamic
            ? useCsvPersonalization
              ? ""
              : buttonParams[idx] || ""
            : originalUrl,
          position: idx + 1,
        };
      }) || [];

    // For now (until backend supports video/document),
    // keep campaignType = "image" only if image header, else "text"
    const campaignType = hk === HK.Image ? "image" : "text";

    const payload = {
      name: campaignName,
      messageTemplate: (selectedTemplate.body || "").trim(), // template name
      templateId: selectedTemplate.name, // legacy/alias
      templateLanguage: selectedTemplate.language || undefined, // ✅ critical for provider payloads
      buttonParams: buttonPayload,

      campaignType,
      // Back-compat: old backend expects imageUrl when campaignType === "image"
      imageUrl: hk === HK.Image ? headerMediaUrl : null,

      // Future-friendly: always send headerMediaUrl + headerKind
      headerMediaUrl: isMediaHeader(hk) ? headerMediaUrl : null,
      headerKind: hk, // "image" | "video" | "document" | "text" | "none"

      scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
      createdBy,
      businessId,

      // ✅ If CSV is used, do not send per-recipient params here
      templateParameters: useCsvPersonalization ? [] : templateParams,
      useCsvPersonalization, // ✅ tell backend who owns personalization

      // Flow (optional)
      ctaFlowConfigId: useFlow ? selectedFlowId : null,

      // Sender
      provider: String(selectedSender.provider || "").toUpperCase(), // "PINNACLE" | "META_CLOUD"
      phoneNumberId: selectedSender.phoneNumberId,
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
        err?.response?.data?.message || "❌ Error creating campaign.";
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

        {/* Sync Templates */}
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

      {/* Business guard */}
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

          {/* Flow (optional) */}
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

          {/* Personalization */}
          {selectedTemplate && (
            <section className="rounded-xl border bg-white p-4 shadow-sm">
              <h2 className="mb-1 text-sm font-semibold text-gray-800">
                Personalization
              </h2>

              {/* CSV toggle */}
              <div className="mb-3 flex items-center gap-2 text-xs text-gray-600">
                <input
                  id="useCsv"
                  type="checkbox"
                  checked={useCsvPersonalization}
                  onChange={e => setUseCsvPersonalization(e.target.checked)}
                />
                <label htmlFor="useCsv">
                  I’ll upload a CSV later for personalization (recommended for
                  bulk)
                </label>
              </div>

              {/* Body params — show only if NOT using CSV */}
              {!useCsvPersonalization && templateParams.length > 0 && (
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

              {/* Button params — show only if NOT using CSV */}
              {!useCsvPersonalization &&
                selectedTemplate?.buttonParams?.length > 0 && (
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
                              placeholder={
                                placeholders[subtype] || "Enter value"
                              }
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
                              Static value: {originalUrl || "N/A"}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
            </section>
          )}

          {/* Media + sender + schedule */}
          <section className="rounded-xl border bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-gray-800">
              Delivery
            </h2>

            {/* Sender selection (Provider auto-derived) */}
            <div className="mb-3 text-sm">
              <label className="mb-1 block font-medium text-gray-700">
                Sender (WhatsApp Number • Provider)
              </label>
              <select
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-purple-500 disabled:bg-gray-100"
                disabled={!hasValidBusiness || !senders.length}
                value={selectedSenderId}
                onChange={e => setSelectedSenderId(e.target.value)}
              >
                <option value="" disabled>
                  {senders.length
                    ? "-- Select Sender --"
                    : "No active senders found"}
                </option>
                {senders.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.whatsAppNumber} • {s.provider}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-gray-400">
                Only the number is shown for selection. We’ll save the sender’s
                phoneNumberId and provider.
              </p>
            </div>

            {selectedTemplate?.requiresHeaderMediaUrl && (
              <div className="mb-3 text-sm">
                <label className="mb-1 block font-medium text-gray-700">
                  {mediaLabel(selectedTemplate.headerKind)}
                </label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-purple-500"
                  placeholder="https://…"
                  value={headerMediaUrl}
                  onChange={e => setHeaderMediaUrl(e.target.value)}
                  disabled={!hasValidBusiness}
                />
                <p className="mt-1 text-[11px] text-gray-400">
                  This is set once per campaign (not in CSV). Must be a public
                  HTTPS link.
                </p>
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
                    parameters={useCsvPersonalization ? [] : templateParams}
                    // For now, only image preview is supported; others will come later.
                    imageUrl={
                      selectedTemplate.headerKind === HK.Image
                        ? headerMediaUrl
                        : ""
                    }
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
                            ? "" // CSV will provide dynamic at send-time
                            : originalUrl,
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

// // 📄 src/pages/campaigns/CampaignBuilderPage.jsx
// import React, { useEffect, useMemo, useState } from "react";
// import axiosClient from "../../api/axiosClient";
// import { toast } from "react-toastify";
// import PhoneWhatsAppPreview from "../../components/PhoneWhatsAppPreview";
// import { useNavigate } from "react-router-dom";
// import { useAuth } from "../auth/context/pld_AuthContext"; // adjust if your path differs

// // === Adjust this if your API route differs ===
// const SYNC_ENDPOINT = bid => `/templates/sync/${bid}`; // POST

// const isGuid = v =>
//   !!v &&
//   /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
//     v
//   );

// // Header kind helpers (frontend-only)
// const HK = Object.freeze({
//   None: "none",
//   Text: "text",
//   Image: "image",
//   Video: "video",
//   Document: "document",
// });
// const isMediaHeader = hk =>
//   hk === HK.Image || hk === HK.Video || hk === HK.Document;
// const mediaLabel = hk =>
//   hk === HK.Image
//     ? "Image URL"
//     : hk === HK.Video
//     ? "Video URL"
//     : "Document URL";

// function CampaignBuilderPage() {
//   const { businessId: ctxBusinessId } = useAuth();

//   const [templates, setTemplates] = useState([]);
//   const [loadingTemplates, setLoadingTemplates] = useState(false);
//   const [syncing, setSyncing] = useState(false);

//   const [selectedTemplate, setSelectedTemplate] = useState(null);
//   const [templateParams, setTemplateParams] = useState([]);
//   const [buttonParams, setButtonParams] = useState([]);

//   // 🆕 unified header media url (for Image/Video/Document)
//   const [headerMediaUrl, setHeaderMediaUrl] = useState("");

//   const [campaignName, setCampaignName] = useState("");

//   const [scheduledAt, setScheduledAt] = useState("");
//   const [submitting, setSubmitting] = useState(false);

//   // 🆕 Flow association state
//   const [useFlow, setUseFlow] = useState(false);
//   const [flows, setFlows] = useState([]);
//   const [loadingFlows, setLoadingFlows] = useState(false);
//   const [selectedFlowId, setSelectedFlowId] = useState("");

//   // 🆕 Sender selection (from WhatsAppPhoneNumbers)
//   const [senders, setSenders] = useState([]); // [{id, provider, phoneNumberId, whatsAppNumber}]
//   const [selectedSenderId, setSelectedSenderId] = useState("");

//   // 🆕 Use CSV for all dynamic personalization (default ON)
//   const [useCsvPersonalization, setUseCsvPersonalization] = useState(true);

//   const businessId = useMemo(
//     () => ctxBusinessId || localStorage.getItem("businessId") || null,
//     [ctxBusinessId]
//   );
//   const hasValidBusiness = isGuid(businessId);

//   const createdBy = localStorage.getItem("userId");
//   const businessName = localStorage.getItem("businessName") || "Your Business";
//   const navigate = useNavigate();

//   // Load approved templates when businessId is ready
//   useEffect(() => {
//     const load = async () => {
//       if (!hasValidBusiness) return;
//       setLoadingTemplates(true);
//       try {
//         const res = await axiosClient.get(
//           `/templates/${businessId}?status=APPROVED`
//         );
//         if (res.data?.success) setTemplates(res.data.templates || []);
//         else toast.error("❌ Failed to load templates.");
//       } catch {
//         toast.error("❌ Error loading templates.");
//       } finally {
//         setLoadingTemplates(false);
//       }
//     };
//     load();
//   }, [businessId, hasValidBusiness]);

//   // 🔁 Load flows when "Attach Flow" is toggled
//   useEffect(() => {
//     if (!useFlow || !hasValidBusiness) return;

//     const loadFlows = async () => {
//       setLoadingFlows(true);
//       try {
//         const r = await axiosClient.get(
//           `/campaign/list/${businessId}?onlyPublished=true`
//         );

//         const items = Array.isArray(r.data?.items) ? r.data.items : [];
//         const mapped = items
//           .map(f => ({
//             id: f.id ?? f.Id,
//             name: f.flowName ?? f.FlowName,
//             isPublished: f.isPublished ?? f.IsPublished ?? true,
//           }))
//           .filter(x => x.id && x.name);

//         setFlows(mapped);
//         if (!mapped.length) {
//           toast.info(
//             "ℹ️ No published flows found. You can still create a campaign without a flow."
//           );
//         }
//       } catch {
//         toast.error("❌ Error loading flows.");
//         setFlows([]);
//       } finally {
//         setLoadingFlows(false);
//       }
//     };

//     loadFlows();
//   }, [useFlow, hasValidBusiness, businessId]);

//   // 🆕 Load available senders (WhatsAppPhoneNumbers) for this business
//   useEffect(() => {
//     if (!hasValidBusiness) return;
//     (async () => {
//       try {
//         const r = await axiosClient.get(
//           `/WhatsAppSettings/senders/${businessId}`
//         );

//         const raw = Array.isArray(r.data) ? r.data : r.data?.items || [];
//         const normalized = raw.map(x => {
//           const provider = String(x.provider || "").toUpperCase(); // "PINNACLE" | "META_CLOUD"
//           const phoneNumberId = x.phoneNumberId;
//           const whatsAppNumber =
//             x.whatsAppBusinessNumber ??
//             x.whatsappBusinessNumber ??
//             x.displayNumber ??
//             x.phoneNumber ??
//             x.phoneNumberId;

//           const id = x.id ?? `${provider}|${phoneNumberId}`;
//           return { id, provider, phoneNumberId, whatsAppNumber };
//         });

//         setSenders(normalized);
//         if (normalized.length === 1) setSelectedSenderId(normalized[0].id);
//       } catch {
//         toast.error("❌ Failed to load WhatsApp senders.");
//         setSenders([]);
//         setSelectedSenderId("");
//       }
//     })();
//   }, [hasValidBusiness, businessId]);

//   // 🔄 Sync Templates
//   const handleSyncTemplates = async () => {
//     if (!hasValidBusiness) {
//       toast.warn("⚠️ Business context missing. Please re-login.");
//       return;
//     }
//     setSyncing(true);
//     try {
//       const res = await axiosClient.post(SYNC_ENDPOINT(businessId));
//       const ok =
//         res?.data?.success === true ||
//         res?.status === 200 ||
//         res?.status === 204;
//       if (ok) {
//         toast.success("✅ Templates synced. Refreshing list…");
//         setLoadingTemplates(true);
//         try {
//           const r2 = await axiosClient.get(
//             `/templates/${businessId}?status=APPROVED`
//           );
//           if (r2.data?.success) setTemplates(r2.data.templates || []);
//         } finally {
//           setLoadingTemplates(false);
//         }
//       } else {
//         toast.error("❌ Sync failed.");
//       }
//     } catch (e) {
//       toast.error("❌ Error syncing templates.");
//     } finally {
//       setSyncing(false);
//     }
//   };

//   const normalizeHeaderKind = t => {
//     // Prefer new backend fields; fallback to image-only legacy flag
//     const raw = (t.headerKind || "").toString().toLowerCase();
//     if (
//       raw === HK.Image ||
//       raw === HK.Video ||
//       raw === HK.Document ||
//       raw === HK.Text ||
//       raw === HK.None
//     ) {
//       return raw;
//     }
//     // Legacy: only image known
//     return t.hasImageHeader ? HK.Image : HK.None;
//   };

//   const handleTemplateSelect = async name => {
//     if (!name) {
//       setSelectedTemplate(null);
//       setTemplateParams([]);
//       setButtonParams([]);
//       setHeaderMediaUrl("");
//       return;
//     }
//     try {
//       if (!hasValidBusiness) {
//         toast.error("Invalid or missing Business ID. Please re-login.");
//         return;
//       }
//       const res = await axiosClient.get(
//         `/templates/${businessId}/${encodeURIComponent(name)}`
//       );
//       const t = res.data;
//       if (!t?.name) {
//         toast.error("❌ Could not load template details.");
//         return;
//       }

//       let parsedButtons = [];
//       try {
//         parsedButtons = t.buttonsJson ? JSON.parse(t.buttonsJson) : [];
//       } catch {
//         parsedButtons = [];
//       }

//       const hk = normalizeHeaderKind(t);
//       const requiresHeaderMediaUrl =
//         t.requiresHeaderMediaUrl === true || isMediaHeader(hk);

//       const normalized = {
//         name: t.name,
//         language: t.language,
//         body: t.body || "",
//         headerKind: hk, // "image" | "video" | "document" | "text" | "none"
//         requiresHeaderMediaUrl,
//         // Legacy fields kept (not used for logic anymore)
//         hasImageHeader: !!t.hasImageHeader,
//         parametersCount: t.placeholderCount || 0, // legacy: total placeholder count; we’ll refine later
//         buttonParams: parsedButtons,
//       };

//       setSelectedTemplate(normalized);
//       setTemplateParams(Array(normalized.parametersCount).fill(""));

//       const dynSlots =
//         normalized.buttonParams?.map(btn => {
//           const originalUrl = btn?.ParameterValue || btn?.parameterValue || "";
//           const subtype = (btn?.SubType || btn?.subType || "").toLowerCase();
//           const isDynamic =
//             ["url", "copy_code", "flow"].includes(subtype) ||
//             originalUrl.includes("{{1}}");
//           return isDynamic ? "" : null;
//         }) || [];
//       setButtonParams(dynSlots);
//       setHeaderMediaUrl("");
//     } catch {
//       toast.error("❌ Error loading template details.");
//     }
//   };

//   // 📄 Create Campaign
//   const handleCreateCampaign = async () => {
//     if (!hasValidBusiness) {
//       toast.error("Invalid or missing Business ID. Please re-login.");
//       return;
//     }
//     if (!campaignName || !selectedTemplate) {
//       toast.warn("⚠️ Please fill campaign name and choose a template.");
//       return;
//     }
//     // Require body params ONLY when not using CSV
//     if (!useCsvPersonalization && templateParams.some(p => p === "")) {
//       toast.warn("⚠️ Please fill all template parameters.");
//       return;
//     }
//     if (useFlow && !selectedFlowId) {
//       toast.warn("⚠️ Please select a flow or uncheck “Attach Flow”.");
//       return;
//     }

//     // 🧲 Resolve selected sender (required)
//     const selectedSender = senders.find(s => s.id === selectedSenderId);
//     if (!selectedSender || !selectedSender.phoneNumberId) {
//       toast.warn("⚠️ Please choose a Sender (number).");
//       return;
//     }

//     // Header media rules (campaign-level)
//     const hk = selectedTemplate?.headerKind || HK.None;
//     if (isMediaHeader(hk) && !headerMediaUrl) {
//       toast.warn(`⚠️ Please provide a ${mediaLabel(hk)}.`);
//       return;
//     }

//     setSubmitting(true);

//     // Keep static button values; leave dynamic button values empty (CSV will provide)
//     const buttonPayload =
//       selectedTemplate.buttonParams?.map((btn, idx) => {
//         const originalUrl = btn?.ParameterValue || btn?.parameterValue || "";
//         const subtype = (btn?.SubType || btn?.subType || "").toLowerCase();
//         const isDynamic =
//           ["url", "copy_code", "flow"].includes(subtype) ||
//           originalUrl.includes("{{1}}");

//         return {
//           text: btn?.Text || btn?.text || "Button",
//           type: btn?.Type || btn?.type || "",
//           value: isDynamic ? "" : originalUrl,
//           position: idx + 1,
//         };
//       }) || [];

//     // For now (until backend supports video/document),
//     // keep campaignType = "image" only if image header, else "text"
//     const campaignType = hk === HK.Image ? "image" : "text";

//     const payload = {
//       name: campaignName,
//       messageTemplate: selectedTemplate.name,
//       templateId: selectedTemplate.name,
//       buttonParams: buttonPayload,

//       campaignType,
//       // Back-compat: old backend expects imageUrl when campaignType === "image"
//       imageUrl: hk === HK.Image ? headerMediaUrl : null,

//       // Future-friendly: always send headerMediaUrl + headerKind
//       headerMediaUrl: isMediaHeader(hk) ? headerMediaUrl : null,
//       headerKind: hk, // "image" | "video" | "document" | "text" | "none"

//       scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
//       createdBy,
//       businessId,

//       // ✅ If CSV is used, do not send per-recipient params here
//       templateParameters: useCsvPersonalization ? [] : templateParams,

//       // Flow (optional)
//       ctaFlowConfigId: useFlow ? selectedFlowId : null,

//       // Sender
//       provider: String(selectedSender.provider || "").toUpperCase(), // "PINNACLE" | "META_CLOUD"
//       phoneNumberId: selectedSender.phoneNumberId,
//     };

//     try {
//       const res = await axiosClient.post(
//         "/campaign/create-text-campaign",
//         payload
//       );
//       if (res.data?.success && res.data?.campaignId) {
//         toast.success("✅ Campaign created successfully.");
//         navigate(
//           `/app/campaigns/image-campaigns/assign-contacts/${res.data.campaignId}`
//         );
//       } else {
//         toast.error("❌ Failed to create campaign.");
//       }
//     } catch (err) {
//       const errorMsg =
//         err.response?.data?.message || "❌ Error creating campaign.";
//       toast.error(errorMsg);
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   const templateOptions = useMemo(
//     () =>
//       templates.map(tpl => ({
//         key: `${tpl.name}-${tpl.language}`,
//         label: `${tpl.name} (${tpl.language}) — ${tpl.placeholderCount} param`,
//         value: tpl.name,
//       })),
//     [templates]
//   );

//   return (
//     <div className="mx-auto max-w-5xl px-4 py-6">
//       {/* Header */}
//       <div className="mb-4 flex items-end justify-between">
//         <div>
//           <h1 className="text-xl font-bold text-gray-900">
//             Create WhatsApp Campaign
//           </h1>
//           <p className="mt-0.5 text-xs text-gray-500">
//             Pick a template, preview, then schedule.
//           </p>
//         </div>

//         {/* 🔄 Sync Templates action */}
//         <div className="flex items-center gap-2">
//           <button
//             type="button"
//             onClick={handleSyncTemplates}
//             disabled={!hasValidBusiness || syncing}
//             className={`rounded-lg px-3 py-2 text-sm font-semibold text-white shadow-sm transition ${
//               !hasValidBusiness || syncing
//                 ? "bg-gray-400"
//                 : "bg-indigo-600 hover:bg-indigo-700"
//             }`}
//             title={
//               !hasValidBusiness ? "Login required to sync templates" : undefined
//             }
//           >
//             {syncing ? "Syncing…" : "Sync Templates"}
//           </button>
//         </div>
//       </div>

//       {/* Friendly fallback if businessId not available */}
//       {!hasValidBusiness && (
//         <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
//           <div className="flex items-start gap-3">
//             <span className="mt-0.5">⚠️</span>
//             <div>
//               <p className="font-medium">
//                 We’re loading your business context…
//               </p>
//               <p className="mt-1 text-amber-800/90">
//                 If this doesn’t resolve in a moment, please re-login so we can
//                 attach your Business ID to requests.
//               </p>
//               <div className="mt-3">
//                 <button
//                   onClick={() => navigate("/login")}
//                   className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
//                   type="button"
//                 >
//                   Go to Login
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Content grid */}
//       <div className="grid gap-4 md:grid-cols-[1fr_320px]">
//         {/* Left column – form */}
//         <div className="space-y-4">
//           {/* Campaign meta */}
//           <section className="rounded-xl border bg-white p-4 shadow-sm">
//             <div className="space-y-3 text-sm">
//               <div>
//                 <label className="mb-1 block font-medium text-gray-700">
//                   Campaign name
//                 </label>
//                 <input
//                   type="text"
//                   className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-purple-500"
//                   placeholder="e.g. Diwali Blast – Returning Customers"
//                   value={campaignName}
//                   onChange={e => setCampaignName(e.target.value)}
//                   disabled={!hasValidBusiness}
//                 />
//               </div>

//               <div>
//                 <label className="mb-1 block font-medium text-gray-700">
//                   Template <span className="text-gray-400">(approved)</span>
//                 </label>
//                 <select
//                   disabled={loadingTemplates || !hasValidBusiness}
//                   className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-purple-500 disabled:bg-gray-100"
//                   onChange={e => handleTemplateSelect(e.target.value)}
//                   value={selectedTemplate?.name || ""}
//                 >
//                   <option value="" disabled>
//                     {loadingTemplates
//                       ? "Loading templates…"
//                       : "-- Select Template --"}
//                   </option>
//                   {templateOptions.map(o => (
//                     <option key={o.key} value={o.value}>
//                       {o.label}
//                     </option>
//                   ))}
//                 </select>
//                 <p className="mt-1 text-[11px] text-gray-400">
//                   Only templates with status{" "}
//                   <span className="font-medium">APPROVED</span> are listed.
//                 </p>
//               </div>
//             </div>
//           </section>

//           {/* Flow (optional) */}
//           <section className="rounded-xl border bg-white p-4 shadow-sm">
//             <h2 className="mb-3 text-sm font-semibold text-gray-800">
//               Flow (optional)
//             </h2>
//             <div className="flex items-center gap-3 text-sm">
//               <input
//                 id="useFlow"
//                 type="checkbox"
//                 checked={useFlow}
//                 onChange={e => {
//                   setUseFlow(e.target.checked);
//                   if (!e.target.checked) setSelectedFlowId("");
//                 }}
//                 disabled={!hasValidBusiness}
//               />
//               <label htmlFor="useFlow" className="text-gray-700">
//                 Attach a Visual Flow to this campaign
//               </label>
//             </div>

//             {useFlow && (
//               <div className="mt-3">
//                 <label className="mb-1 block text-sm font-medium text-gray-700">
//                   Select Flow
//                 </label>
//                 <select
//                   className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-purple-500 disabled:bg-gray-100"
//                   disabled={loadingFlows || !hasValidBusiness}
//                   value={selectedFlowId}
//                   onChange={e => setSelectedFlowId(e.target.value)}
//                 >
//                   <option value="">
//                     {loadingFlows ? "Loading flows…" : "-- Select Flow --"}
//                   </option>
//                   {flows.map(f => (
//                     <option key={f.id} value={f.id}>
//                       {f.name}
//                     </option>
//                   ))}
//                 </select>
//                 <p className="mt-1 text-[11px] text-gray-400">
//                   If attached, the campaign will <strong>start</strong> from the
//                   flow’s entry step. The backend will align the starting
//                   template automatically.
//                 </p>
//               </div>
//             )}
//           </section>

//           {/* Parameters */}
//           {selectedTemplate && (
//             <section className="rounded-xl border bg-white p-4 shadow-sm">
//               <h2 className="mb-1 text-sm font-semibold text-gray-800">
//                 Personalization
//               </h2>

//               {/* CSV toggle */}
//               <div className="mb-3 flex items-center gap-2 text-xs text-gray-600">
//                 <input
//                   id="useCsv"
//                   type="checkbox"
//                   checked={useCsvPersonalization}
//                   onChange={e => setUseCsvPersonalization(e.target.checked)}
//                 />
//                 <label htmlFor="useCsv">
//                   I’ll upload a CSV later for personalization (recommended for
//                   bulk)
//                 </label>
//               </div>

//               {/* Body params — show only if NOT using CSV */}
//               {!useCsvPersonalization && templateParams.length > 0 && (
//                 <div className="mb-4 space-y-2 text-sm">
//                   <h3 className="text-xs font-semibold text-gray-700">
//                     Template parameters
//                   </h3>
//                   {templateParams.map((val, idx) => (
//                     <div key={`tp-${idx}`} className="flex items-center gap-2">
//                       <div className="w-20 shrink-0 text-xs text-gray-500">{`{{${
//                         idx + 1
//                       }}}`}</div>
//                       <input
//                         className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-purple-500"
//                         placeholder={`Value for {{${idx + 1}}}`}
//                         value={val}
//                         onChange={e => {
//                           const next = [...templateParams];
//                           next[idx] = e.target.value;
//                           setTemplateParams(next);
//                         }}
//                         disabled={!hasValidBusiness}
//                       />
//                     </div>
//                   ))}
//                 </div>
//               )}

//               {/* Button params — show only if NOT using CSV */}
//               {!useCsvPersonalization &&
//                 selectedTemplate?.buttonParams?.length > 0 && (
//                   <div className="space-y-2 text-sm">
//                     <h3 className="text-xs font-semibold text-gray-700">
//                       Button parameters
//                     </h3>
//                     {selectedTemplate.buttonParams.map((btn, idx) => {
//                       const originalUrl =
//                         btn?.ParameterValue || btn?.parameterValue || "";
//                       const subtype = (
//                         btn?.SubType ||
//                         btn?.subType ||
//                         ""
//                       ).toLowerCase();
//                       const dynamic =
//                         ["url", "copy_code", "flow"].includes(subtype) ||
//                         originalUrl.includes("{{1}}");
//                       const placeholders = {
//                         url: "Enter Redirect URL",
//                         copy_code: "Enter Coupon Code",
//                         flow: "Enter Flow ID",
//                       };
//                       return (
//                         <div key={`bp-${idx}`}>
//                           <label className="mb-1 block text-[11px] font-medium text-gray-500">
//                             {btn?.Text || btn?.text || "Button"} ·{" "}
//                             {subtype ? subtype.toUpperCase() : "STATIC"}
//                           </label>
//                           {dynamic ? (
//                             <input
//                               className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-purple-500"
//                               placeholder={
//                                 placeholders[subtype] || "Enter value"
//                               }
//                               value={buttonParams[idx] || ""}
//                               onChange={e => {
//                                 const next = [...buttonParams];
//                                 next[idx] = e.target.value;
//                                 setButtonParams(next);
//                               }}
//                               disabled={!hasValidBusiness}
//                             />
//                           ) : (
//                             <p className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-500">
//                               Static value:{" "}
//                               {btn?.ParameterValue ||
//                                 btn?.parameterValue ||
//                                 "N/A"}
//                             </p>
//                           )}
//                         </div>
//                       );
//                     })}
//                   </div>
//                 )}
//             </section>
//           )}

//           {/* Media + sender + schedule */}
//           <section className="rounded-xl border bg-white p-4 shadow-sm">
//             <h2 className="mb-3 text-sm font-semibold text-gray-800">
//               Delivery
//             </h2>

//             {/* 🆕 Sender selection (Provider auto-derived) */}
//             <div className="mb-3 text-sm">
//               <label className="mb-1 block font-medium text-gray-700">
//                 Sender (WhatsApp Number • Provider)
//               </label>
//               <select
//                 className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-purple-500 disabled:bg-gray-100"
//                 disabled={!hasValidBusiness || !senders.length}
//                 value={selectedSenderId}
//                 onChange={e => setSelectedSenderId(e.target.value)}
//               >
//                 <option value="" disabled>
//                   {senders.length
//                     ? "-- Select Sender --"
//                     : "No active senders found"}
//                 </option>
//                 {senders.map(s => (
//                   <option key={s.id} value={s.id}>
//                     {s.whatsAppNumber} • {s.provider}
//                   </option>
//                 ))}
//               </select>
//               <p className="mt-1 text-[11px] text-gray-400">
//                 Only the number is shown for selection. We’ll save the sender’s
//                 phoneNumberId and provider.
//               </p>
//             </div>

//             {selectedTemplate?.requiresHeaderMediaUrl && (
//               <div className="mb-3 text-sm">
//                 <label className="mb-1 block font-medium text-gray-700">
//                   {mediaLabel(selectedTemplate.headerKind)}
//                 </label>
//                 <input
//                   type="text"
//                   className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-purple-500"
//                   placeholder="https://…"
//                   value={headerMediaUrl}
//                   onChange={e => setHeaderMediaUrl(e.target.value)}
//                   disabled={!hasValidBusiness}
//                 />
//                 <p className="mt-1 text-[11px] text-gray-400">
//                   This is set once per campaign (not in CSV). Must be a public
//                   HTTPS link.
//                 </p>
//               </div>
//             )}

//             <div className="text-sm">
//               <label className="mb-1 block font-medium text-gray-700">
//                 Schedule
//               </label>
//               <input
//                 type="datetime-local"
//                 className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-purple-500"
//                 value={scheduledAt}
//                 onChange={e => setScheduledAt(e.target.value)}
//                 disabled={!hasValidBusiness}
//               />
//               <p className="mt-1 text-[11px] text-gray-400">
//                 Leave empty to send immediately after assignment.
//               </p>
//             </div>
//           </section>

//           {/* Submit */}
//           <div className="sticky bottom-3 z-10">
//             <button
//               onClick={handleCreateCampaign}
//               disabled={submitting || !hasValidBusiness}
//               className={`w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition ${
//                 submitting || !hasValidBusiness
//                   ? "bg-gray-400"
//                   : "bg-green-600 hover:bg-green-700"
//               }`}
//               title={
//                 !hasValidBusiness
//                   ? "Login required to create a campaign"
//                   : undefined
//               }
//             >
//               {submitting ? "Creating…" : "Create Campaign"}
//             </button>
//           </div>
//         </div>

//         {/* Right column – sticky preview */}
//         <aside className="md:sticky md:top-4">
//           <div className="rounded-xl border bg-[#fafaf7] p-4 shadow-sm">
//             <div className="mb-2 flex items-center justify-between">
//               <h3 className="text-xs font-semibold text-gray-800">Preview</h3>
//               <span className="text-[11px] text-gray-400">Customer view</span>
//             </div>

//             {hasValidBusiness ? (
//               selectedTemplate ? (
//                 <div className="flex justify-center">
//                   <PhoneWhatsAppPreview
//                     businessName={businessName}
//                     templateBody={selectedTemplate.body}
//                     parameters={useCsvPersonalization ? [] : templateParams}
//                     // For now, only image preview is supported; others will come later.
//                     imageUrl={
//                       selectedTemplate.headerKind === HK.Image
//                         ? headerMediaUrl
//                         : ""
//                     }
//                     buttonParams={(selectedTemplate.buttonParams || []).map(
//                       (btn, idx) => {
//                         const originalUrl =
//                           btn?.ParameterValue || btn?.parameterValue || "";
//                         const subtype = (
//                           btn?.SubType ||
//                           btn?.subType ||
//                           ""
//                         ).toLowerCase();
//                         const dynamic =
//                           ["url", "copy_code", "flow"].includes(subtype) ||
//                           originalUrl.includes("{{1}}");
//                         return {
//                           text: btn?.Text || btn?.text || "Button",
//                           subType: btn?.SubType || btn?.subType || "",
//                           type: btn?.Type || btn?.type || "",
//                           value: dynamic
//                             ? "" // CSV will provide dynamic at send-time
//                             : originalUrl,
//                         };
//                       }
//                     )}
//                     width="clamp(330px, 42vw, 410px)"
//                   />
//                 </div>
//               ) : (
//                 <div className="flex h-[460px] items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white text-xs text-gray-400">
//                   Select a template to preview it here
//                 </div>
//               )
//             ) : (
//               <div className="flex h-[460px] items-center justify-center rounded-xl border border-dashed border-amber-200 bg-amber-50 text-xs text-amber-900">
//                 Waiting for Business ID…
//               </div>
//             )}
//           </div>
//         </aside>
//       </div>
//     </div>
//   );
// }

// export default CampaignBuilderPage;

// // 📄 src/pages/campaigns/CampaignBuilderPage.jsx
// import React, { useEffect, useMemo, useState } from "react";
// import axiosClient from "../../api/axiosClient";
// import { toast } from "react-toastify";
// import PhoneWhatsAppPreview from "../../components/PhoneWhatsAppPreview";
// import { useNavigate } from "react-router-dom";
// import { useAuth } from "../auth/context/pld_AuthContext"; // adjust if your path differs

// // === Adjust this if your API route differs ===
// const SYNC_ENDPOINT = bid => `/templates/sync/${bid}`; // POST

// const isGuid = v =>
//   !!v &&
//   /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
//     v
//   );

// // Header kind helpers (frontend-only)
// const HK = Object.freeze({
//   None: "none",
//   Text: "text",
//   Image: "image",
//   Video: "video",
//   Document: "document",
// });
// const isMediaHeader = hk =>
//   hk === HK.Image || hk === HK.Video || hk === HK.Document;
// const mediaLabel = hk =>
//   hk === HK.Image
//     ? "Image URL"
//     : hk === HK.Video
//     ? "Video URL"
//     : "Document URL";

// function CampaignBuilderPage() {
//   const { businessId: ctxBusinessId } = useAuth();

//   const [templates, setTemplates] = useState([]);
//   const [loadingTemplates, setLoadingTemplates] = useState(false);
//   const [syncing, setSyncing] = useState(false);

//   const [selectedTemplate, setSelectedTemplate] = useState(null);
//   const [templateParams, setTemplateParams] = useState([]);
//   const [buttonParams, setButtonParams] = useState([]);

//   // 🆕 unified header media url (for Image/Video/Document)
//   const [headerMediaUrl, setHeaderMediaUrl] = useState("");

//   const [campaignName, setCampaignName] = useState("");

//   const [scheduledAt, setScheduledAt] = useState("");
//   const [submitting, setSubmitting] = useState(false);

//   // 🆕 Flow association state
//   const [useFlow, setUseFlow] = useState(false);
//   const [flows, setFlows] = useState([]);
//   const [loadingFlows, setLoadingFlows] = useState(false);
//   const [selectedFlowId, setSelectedFlowId] = useState("");

//   // 🆕 Sender selection (from WhatsAppPhoneNumbers)
//   const [senders, setSenders] = useState([]); // [{id, provider, phoneNumberId, whatsAppNumber}]
//   const [selectedSenderId, setSelectedSenderId] = useState("");

//   const businessId = useMemo(
//     () => ctxBusinessId || localStorage.getItem("businessId") || null,
//     [ctxBusinessId]
//   );
//   const hasValidBusiness = isGuid(businessId);

//   const createdBy = localStorage.getItem("userId");
//   const businessName = localStorage.getItem("businessName") || "Your Business";
//   const navigate = useNavigate();

//   // Load approved templates when businessId is ready
//   useEffect(() => {
//     const load = async () => {
//       if (!hasValidBusiness) return;
//       setLoadingTemplates(true);
//       try {
//         const res = await axiosClient.get(
//           `/templates/${businessId}?status=APPROVED`
//         );
//         if (res.data?.success) setTemplates(res.data.templates || []);
//         else toast.error("❌ Failed to load templates.");
//       } catch {
//         toast.error("❌ Error loading templates.");
//       } finally {
//         setLoadingTemplates(false);
//       }
//     };
//     load();
//   }, [businessId, hasValidBusiness]);

//   // 🔁 Load flows when "Attach Flow" is toggled
//   useEffect(() => {
//     if (!useFlow || !hasValidBusiness) return;

//     const loadFlows = async () => {
//       setLoadingFlows(true);
//       try {
//         const r = await axiosClient.get(
//           `/campaign/list/${businessId}?onlyPublished=true`
//         );

//         const items = Array.isArray(r.data?.items) ? r.data.items : [];
//         const mapped = items
//           .map(f => ({
//             id: f.id ?? f.Id,
//             name: f.flowName ?? f.FlowName,
//             isPublished: f.isPublished ?? f.IsPublished ?? true,
//           }))
//           .filter(x => x.id && x.name);

//         setFlows(mapped);
//         if (!mapped.length) {
//           toast.info(
//             "ℹ️ No published flows found. You can still create a campaign without a flow."
//           );
//         }
//       } catch {
//         toast.error("❌ Error loading flows.");
//         setFlows([]);
//       } finally {
//         setLoadingFlows(false);
//       }
//     };

//     loadFlows();
//   }, [useFlow, hasValidBusiness, businessId]);

//   // 🆕 Load available senders (WhatsAppPhoneNumbers) for this business
//   useEffect(() => {
//     if (!hasValidBusiness) return;
//     (async () => {
//       try {
//         const r = await axiosClient.get(
//           `/WhatsAppSettings/senders/${businessId}`
//         );

//         const raw = Array.isArray(r.data) ? r.data : r.data?.items || [];
//         const normalized = raw.map(x => {
//           const provider = String(x.provider || "").toUpperCase(); // "PINNACLE" | "META_CLOUD"
//           const phoneNumberId = x.phoneNumberId;
//           const whatsAppNumber =
//             x.whatsAppBusinessNumber ??
//             x.whatsappBusinessNumber ??
//             x.displayNumber ??
//             x.phoneNumber ??
//             x.phoneNumberId;

//           const id = x.id ?? `${provider}|${phoneNumberId}`;
//           return { id, provider, phoneNumberId, whatsAppNumber };
//         });

//         setSenders(normalized);
//         if (normalized.length === 1) setSelectedSenderId(normalized[0].id);
//       } catch {
//         toast.error("❌ Failed to load WhatsApp senders.");
//         setSenders([]);
//         setSelectedSenderId("");
//       }
//     })();
//   }, [hasValidBusiness, businessId]);

//   // 🔄 Sync Templates
//   const handleSyncTemplates = async () => {
//     if (!hasValidBusiness) {
//       toast.warn("⚠️ Business context missing. Please re-login.");
//       return;
//     }
//     setSyncing(true);
//     try {
//       const res = await axiosClient.post(SYNC_ENDPOINT(businessId));
//       const ok =
//         res?.data?.success === true ||
//         res?.status === 200 ||
//         res?.status === 204;
//       if (ok) {
//         toast.success("✅ Templates synced. Refreshing list…");
//         setLoadingTemplates(true);
//         try {
//           const r2 = await axiosClient.get(
//             `/templates/${businessId}?status=APPROVED`
//           );
//           if (r2.data?.success) setTemplates(r2.data.templates || []);
//         } finally {
//           setLoadingTemplates(false);
//         }
//       } else {
//         toast.error("❌ Sync failed.");
//       }
//     } catch (e) {
//       toast.error("❌ Error syncing templates.");
//     } finally {
//       setSyncing(false);
//     }
//   };

//   const normalizeHeaderKind = t => {
//     // Prefer new backend fields; fallback to image-only legacy flag
//     const raw = (t.headerKind || "").toString().toLowerCase();
//     if (
//       raw === HK.Image ||
//       raw === HK.Video ||
//       raw === HK.Document ||
//       raw === HK.Text ||
//       raw === HK.None
//     ) {
//       return raw;
//     }
//     // Legacy: only image known
//     return t.hasImageHeader ? HK.Image : HK.None;
//   };

//   const handleTemplateSelect = async name => {
//     if (!name) {
//       setSelectedTemplate(null);
//       setTemplateParams([]);
//       setButtonParams([]);
//       setHeaderMediaUrl("");
//       return;
//     }
//     try {
//       if (!hasValidBusiness) {
//         toast.error("Invalid or missing Business ID. Please re-login.");
//         return;
//       }
//       const res = await axiosClient.get(
//         `/templates/${businessId}/${encodeURIComponent(name)}`
//       );
//       const t = res.data;
//       if (!t?.name) {
//         toast.error("❌ Could not load template details.");
//         return;
//       }

//       let parsedButtons = [];
//       try {
//         parsedButtons = t.buttonsJson ? JSON.parse(t.buttonsJson) : [];
//       } catch {
//         parsedButtons = [];
//       }

//       const hk = normalizeHeaderKind(t);
//       const requiresHeaderMediaUrl =
//         t.requiresHeaderMediaUrl === true || isMediaHeader(hk);

//       const normalized = {
//         name: t.name,
//         language: t.language,
//         body: t.body || "",
//         headerKind: hk, // "image" | "video" | "document" | "text" | "none"
//         requiresHeaderMediaUrl,
//         // Legacy fields kept (not used for logic anymore)
//         hasImageHeader: !!t.hasImageHeader,
//         parametersCount: t.placeholderCount || 0, // legacy: total placeholder count; we’ll refine later
//         buttonParams: parsedButtons,
//       };

//       setSelectedTemplate(normalized);
//       setTemplateParams(Array(normalized.parametersCount).fill(""));

//       const dynSlots =
//         normalized.buttonParams?.map(btn => {
//           const originalUrl = btn?.ParameterValue || btn?.parameterValue || "";
//           const subtype = (btn?.SubType || btn?.subType || "").toLowerCase();
//           const isDynamic =
//             ["url", "copy_code", "flow"].includes(subtype) ||
//             originalUrl.includes("{{1}}");
//           return isDynamic ? "" : null;
//         }) || [];
//       setButtonParams(dynSlots);
//       setHeaderMediaUrl("");
//     } catch {
//       toast.error("❌ Error loading template details.");
//     }
//   };

//   // 📄 Create Campaign
//   const handleCreateCampaign = async () => {
//     if (!hasValidBusiness) {
//       toast.error("Invalid or missing Business ID. Please re-login.");
//       return;
//     }
//     if (!campaignName || !selectedTemplate) {
//       toast.warn("⚠️ Please fill campaign name and choose a template.");
//       return;
//     }
//     if (templateParams.some(p => p === "")) {
//       toast.warn("⚠️ Please fill all template parameters.");
//       return;
//     }
//     if (useFlow && !selectedFlowId) {
//       toast.warn("⚠️ Please select a flow or uncheck “Attach Flow”.");
//       return;
//     }

//     // 🧲 Resolve selected sender (required)
//     const selectedSender = senders.find(s => s.id === selectedSenderId);
//     if (!selectedSender || !selectedSender.phoneNumberId) {
//       toast.warn("⚠️ Please choose a Sender (number).");
//       return;
//     }

//     // Header media rules (campaign-level)
//     const hk = selectedTemplate?.headerKind || HK.None;
//     if (isMediaHeader(hk) && !headerMediaUrl) {
//       toast.warn(`⚠️ Please provide a ${mediaLabel(hk)}.`);
//       return;
//     }

//     setSubmitting(true);

//     const buttonPayload =
//       selectedTemplate.buttonParams?.map((btn, idx) => {
//         const originalUrl = btn?.ParameterValue || btn?.parameterValue || "";
//         const subtype = (btn?.SubType || btn?.subType || "").toLowerCase();
//         const isDynamic =
//           ["url", "copy_code", "flow"].includes(subtype) ||
//           originalUrl.includes("{{1}}");

//         return {
//           text: btn?.Text || btn?.text || "Button",
//           type: btn?.Type || btn?.type || "",
//           value: isDynamic ? buttonParams[idx] || "" : originalUrl,
//           position: idx + 1,
//         };
//       }) || [];

//     // For now (until backend supports video/document),
//     // keep campaignType = "image" only if image header, else "text"
//     const campaignType = hk === HK.Image ? "image" : "text";

//     const payload = {
//       name: campaignName,
//       messageTemplate: selectedTemplate.name,
//       templateId: selectedTemplate.name,
//       buttonParams: buttonPayload,

//       campaignType,
//       // Back-compat: old backend expects imageUrl when campaignType === "image"
//       imageUrl: hk === HK.Image ? headerMediaUrl : null,

//       // Future-friendly: always send headerMediaUrl + headerKind
//       headerMediaUrl: isMediaHeader(hk) ? headerMediaUrl : null,
//       headerKind: hk, // "image" | "video" | "document" | "text" | "none"

//       scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
//       createdBy,
//       businessId,
//       templateParameters: templateParams,

//       // Flow (optional)
//       ctaFlowConfigId: useFlow ? selectedFlowId : null,

//       // Sender
//       provider: String(selectedSender.provider || "").toUpperCase(), // "PINNACLE" | "META_CLOUD"
//       phoneNumberId: selectedSender.phoneNumberId,
//     };

//     try {
//       const res = await axiosClient.post(
//         "/campaign/create-text-campaign",
//         payload
//       );
//       if (res.data?.success && res.data?.campaignId) {
//         toast.success("✅ Campaign created successfully.");
//         navigate(
//           `/app/campaigns/image-campaigns/assign-contacts/${res.data.campaignId}`
//         );
//       } else {
//         toast.error("❌ Failed to create campaign.");
//       }
//     } catch (err) {
//       const errorMsg =
//         err.response?.data?.message || "❌ Error creating campaign.";
//       toast.error(errorMsg);
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   const templateOptions = useMemo(
//     () =>
//       templates.map(tpl => ({
//         key: `${tpl.name}-${tpl.language}`,
//         label: `${tpl.name} (${tpl.language}) — ${tpl.placeholderCount} param`,
//         value: tpl.name,
//       })),
//     [templates]
//   );

//   return (
//     <div className="mx-auto max-w-5xl px-4 py-6">
//       {/* Header */}
//       <div className="mb-4 flex items-end justify-between">
//         <div>
//           <h1 className="text-xl font-bold text-gray-900">
//             Create WhatsApp Campaign
//           </h1>
//           <p className="mt-0.5 text-xs text-gray-500">
//             Pick a template, preview, then schedule.
//           </p>
//         </div>

//         {/* 🔄 Sync Templates action */}
//         <div className="flex items-center gap-2">
//           <button
//             type="button"
//             onClick={handleSyncTemplates}
//             disabled={!hasValidBusiness || syncing}
//             className={`rounded-lg px-3 py-2 text-sm font-semibold text-white shadow-sm transition ${
//               !hasValidBusiness || syncing
//                 ? "bg-gray-400"
//                 : "bg-indigo-600 hover:bg-indigo-700"
//             }`}
//             title={
//               !hasValidBusiness ? "Login required to sync templates" : undefined
//             }
//           >
//             {syncing ? "Syncing…" : "Sync Templates"}
//           </button>
//         </div>
//       </div>

//       {/* Friendly fallback if businessId not available */}
//       {!hasValidBusiness && (
//         <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
//           <div className="flex items-start gap-3">
//             <span className="mt-0.5">⚠️</span>
//             <div>
//               <p className="font-medium">
//                 We’re loading your business context…
//               </p>
//               <p className="mt-1 text-amber-800/90">
//                 If this doesn’t resolve in a moment, please re-login so we can
//                 attach your Business ID to requests.
//               </p>
//               <div className="mt-3">
//                 <button
//                   onClick={() => navigate("/login")}
//                   className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
//                   type="button"
//                 >
//                   Go to Login
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Content grid */}
//       <div className="grid gap-4 md:grid-cols-[1fr_320px]">
//         {/* Left column – form */}
//         <div className="space-y-4">
//           {/* Campaign meta */}
//           <section className="rounded-xl border bg-white p-4 shadow-sm">
//             <div className="space-y-3 text-sm">
//               <div>
//                 <label className="mb-1 block font-medium text-gray-700">
//                   Campaign name
//                 </label>
//                 <input
//                   type="text"
//                   className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-purple-500"
//                   placeholder="e.g. Diwali Blast – Returning Customers"
//                   value={campaignName}
//                   onChange={e => setCampaignName(e.target.value)}
//                   disabled={!hasValidBusiness}
//                 />
//               </div>

//               <div>
//                 <label className="mb-1 block font-medium text-gray-700">
//                   Template <span className="text-gray-400">(approved)</span>
//                 </label>
//                 <select
//                   disabled={loadingTemplates || !hasValidBusiness}
//                   className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-purple-500 disabled:bg-gray-100"
//                   onChange={e => handleTemplateSelect(e.target.value)}
//                   value={selectedTemplate?.name || ""}
//                 >
//                   <option value="" disabled>
//                     {loadingTemplates
//                       ? "Loading templates…"
//                       : "-- Select Template --"}
//                   </option>
//                   {templateOptions.map(o => (
//                     <option key={o.key} value={o.value}>
//                       {o.label}
//                     </option>
//                   ))}
//                 </select>
//                 <p className="mt-1 text-[11px] text-gray-400">
//                   Only templates with status{" "}
//                   <span className="font-medium">APPROVED</span> are listed.
//                 </p>
//               </div>
//             </div>
//           </section>

//           {/* Flow (optional) */}
//           <section className="rounded-xl border bg-white p-4 shadow-sm">
//             <h2 className="mb-3 text-sm font-semibold text-gray-800">
//               Flow (optional)
//             </h2>
//             <div className="flex items-center gap-3 text-sm">
//               <input
//                 id="useFlow"
//                 type="checkbox"
//                 checked={useFlow}
//                 onChange={e => {
//                   setUseFlow(e.target.checked);
//                   if (!e.target.checked) setSelectedFlowId("");
//                 }}
//                 disabled={!hasValidBusiness}
//               />
//               <label htmlFor="useFlow" className="text-gray-700">
//                 Attach a Visual Flow to this campaign
//               </label>
//             </div>

//             {useFlow && (
//               <div className="mt-3">
//                 <label className="mb-1 block text-sm font-medium text-gray-700">
//                   Select Flow
//                 </label>
//                 <select
//                   className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-purple-500 disabled:bg-gray-100"
//                   disabled={loadingFlows || !hasValidBusiness}
//                   value={selectedFlowId}
//                   onChange={e => setSelectedFlowId(e.target.value)}
//                 >
//                   <option value="">
//                     {loadingFlows ? "Loading flows…" : "-- Select Flow --"}
//                   </option>
//                   {flows.map(f => (
//                     <option key={f.id} value={f.id}>
//                       {f.name}
//                     </option>
//                   ))}
//                 </select>
//                 <p className="mt-1 text-[11px] text-gray-400">
//                   If attached, the campaign will <strong>start</strong> from the
//                   flow’s entry step. The backend will align the starting
//                   template automatically.
//                 </p>
//               </div>
//             )}
//           </section>

//           {/* Parameters */}
//           {selectedTemplate && (
//             <section className="rounded-xl border bg-white p-4 shadow-sm">
//               <h2 className="mb-3 text-sm font-semibold text-gray-800">
//                 Personalization
//               </h2>

//               {templateParams.length > 0 && (
//                 <div className="mb-4 space-y-2 text-sm">
//                   <h3 className="text-xs font-semibold text-gray-700">
//                     Template parameters
//                   </h3>
//                   {templateParams.map((val, idx) => (
//                     <div key={`tp-${idx}`} className="flex items-center gap-2">
//                       <div className="w-20 shrink-0 text-xs text-gray-500">{`{{${
//                         idx + 1
//                       }}}`}</div>
//                       <input
//                         className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-purple-500"
//                         placeholder={`Value for {{${idx + 1}}}`}
//                         value={val}
//                         onChange={e => {
//                           const next = [...templateParams];
//                           next[idx] = e.target.value;
//                           setTemplateParams(next);
//                         }}
//                         disabled={!hasValidBusiness}
//                       />
//                     </div>
//                   ))}
//                 </div>
//               )}

//               {selectedTemplate?.buttonParams?.length > 0 && (
//                 <div className="space-y-2 text-sm">
//                   <h3 className="text-xs font-semibold text-gray-700">
//                     Button parameters
//                   </h3>
//                   {selectedTemplate.buttonParams.map((btn, idx) => {
//                     const originalUrl =
//                       btn?.ParameterValue || btn?.parameterValue || "";
//                     const subtype = (
//                       btn?.SubType ||
//                       btn?.subType ||
//                       ""
//                     ).toLowerCase();
//                     const dynamic =
//                       ["url", "copy_code", "flow"].includes(subtype) ||
//                       originalUrl.includes("{{1}}");
//                     const placeholders = {
//                       url: "Enter Redirect URL",
//                       copy_code: "Enter Coupon Code",
//                       flow: "Enter Flow ID",
//                     };
//                     return (
//                       <div key={`bp-${idx}`}>
//                         <label className="mb-1 block text-[11px] font-medium text-gray-500">
//                           {btn?.Text || btn?.text || "Button"} ·{" "}
//                           {subtype ? subtype.toUpperCase() : "STATIC"}
//                         </label>
//                         {dynamic ? (
//                           <input
//                             className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-purple-500"
//                             placeholder={placeholders[subtype] || "Enter value"}
//                             value={buttonParams[idx] || ""}
//                             onChange={e => {
//                               const next = [...buttonParams];
//                               next[idx] = e.target.value;
//                               setButtonParams(next);
//                             }}
//                             disabled={!hasValidBusiness}
//                           />
//                         ) : (
//                           <p className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-500">
//                             Static value:{" "}
//                             {btn?.ParameterValue ||
//                               btn?.parameterValue ||
//                               "N/A"}
//                           </p>
//                         )}
//                       </div>
//                     );
//                   })}
//                 </div>
//               )}
//             </section>
//           )}

//           {/* Media + sender + schedule */}
//           <section className="rounded-xl border bg-white p-4 shadow-sm">
//             <h2 className="mb-3 text-sm font-semibold text-gray-800">
//               Delivery
//             </h2>

//             {/* 🆕 Sender selection (Provider auto-derived) */}
//             <div className="mb-3 text-sm">
//               <label className="mb-1 block font-medium text-gray-700">
//                 Sender (WhatsApp Number • Provider)
//               </label>
//               <select
//                 className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-purple-500 disabled:bg-gray-100"
//                 disabled={!hasValidBusiness || !senders.length}
//                 value={selectedSenderId}
//                 onChange={e => setSelectedSenderId(e.target.value)}
//               >
//                 <option value="" disabled>
//                   {senders.length
//                     ? "-- Select Sender --"
//                     : "No active senders found"}
//                 </option>
//                 {senders.map(s => (
//                   <option key={s.id} value={s.id}>
//                     {s.whatsAppNumber} • {s.provider}
//                   </option>
//                 ))}
//               </select>
//               <p className="mt-1 text-[11px] text-gray-400">
//                 Only the number is shown for selection. We’ll save the sender’s
//                 phoneNumberId and provider.
//               </p>
//             </div>

//             {selectedTemplate?.requiresHeaderMediaUrl && (
//               <div className="mb-3 text-sm">
//                 <label className="mb-1 block font-medium text-gray-700">
//                   {mediaLabel(selectedTemplate.headerKind)}
//                 </label>
//                 <input
//                   type="text"
//                   className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-purple-500"
//                   placeholder="https://…"
//                   value={headerMediaUrl}
//                   onChange={e => setHeaderMediaUrl(e.target.value)}
//                   disabled={!hasValidBusiness}
//                 />
//                 <p className="mt-1 text-[11px] text-gray-400">
//                   This is set once per campaign (not in CSV). Must be a public
//                   HTTPS link.
//                 </p>
//               </div>
//             )}

//             <div className="text-sm">
//               <label className="mb-1 block font-medium text-gray-700">
//                 Schedule
//               </label>
//               <input
//                 type="datetime-local"
//                 className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-purple-500"
//                 value={scheduledAt}
//                 onChange={e => setScheduledAt(e.target.value)}
//                 disabled={!hasValidBusiness}
//               />
//               <p className="mt-1 text-[11px] text-gray-400">
//                 Leave empty to send immediately after assignment.
//               </p>
//             </div>
//           </section>

//           {/* Submit */}
//           <div className="sticky bottom-3 z-10">
//             <button
//               onClick={handleCreateCampaign}
//               disabled={submitting || !hasValidBusiness}
//               className={`w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition ${
//                 submitting || !hasValidBusiness
//                   ? "bg-gray-400"
//                   : "bg-green-600 hover:bg-green-700"
//               }`}
//               title={
//                 !hasValidBusiness
//                   ? "Login required to create a campaign"
//                   : undefined
//               }
//             >
//               {submitting ? "Creating…" : "Create Campaign"}
//             </button>
//           </div>
//         </div>

//         {/* Right column – sticky preview */}
//         <aside className="md:sticky md:top-4">
//           <div className="rounded-xl border bg-[#fafaf7] p-4 shadow-sm">
//             <div className="mb-2 flex items-center justify-between">
//               <h3 className="text-xs font-semibold text-gray-800">Preview</h3>
//               <span className="text-[11px] text-gray-400">Customer view</span>
//             </div>

//             {hasValidBusiness ? (
//               selectedTemplate ? (
//                 <div className="flex justify-center">
//                   <PhoneWhatsAppPreview
//                     businessName={businessName}
//                     templateBody={selectedTemplate.body}
//                     parameters={templateParams}
//                     // For now, only image preview is supported; others will come later.
//                     imageUrl={
//                       selectedTemplate.headerKind === HK.Image
//                         ? headerMediaUrl
//                         : ""
//                     }
//                     buttonParams={(selectedTemplate.buttonParams || []).map(
//                       (btn, idx) => {
//                         const originalUrl =
//                           btn?.ParameterValue || btn?.parameterValue || "";
//                         const subtype = (
//                           btn?.SubType ||
//                           btn?.subType ||
//                           ""
//                         ).toLowerCase();
//                         const dynamic =
//                           ["url", "copy_code", "flow"].includes(subtype) ||
//                           originalUrl.includes("{{1}}");
//                         return {
//                           text: btn?.Text || btn?.text || "Button",
//                           subType: btn?.SubType || btn?.subType || "",
//                           type: btn?.Type || btn?.type || "",
//                           value: dynamic
//                             ? buttonParams?.[idx] || ""
//                             : btn?.ParameterValue || btn?.parameterValue || "",
//                         };
//                       }
//                     )}
//                     width="clamp(330px, 42vw, 410px)"
//                   />
//                 </div>
//               ) : (
//                 <div className="flex h-[460px] items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white text-xs text-gray-400">
//                   Select a template to preview it here
//                 </div>
//               )
//             ) : (
//               <div className="flex h-[460px] items-center justify-center rounded-xl border border-dashed border-amber-200 bg-amber-50 text-xs text-amber-900">
//                 Waiting for Business ID…
//               </div>
//             )}
//           </div>
//         </aside>
//       </div>
//     </div>
//   );
// }

// export default CampaignBuilderPage;
