// 📄 src/pages/Send/SendTemplateMessagePage.jsx
import React, { useEffect, useMemo, useState } from "react";
import axiosClient from "../../api/axiosClient";
import { toast } from "react-toastify";
import WhatsAppBubblePreview from "../../components/WhatsAppBubblePreview";

// === Canonical providers (MUST match backend exactly) ===
const PROVIDERS = [
  { value: "PINNACLE", label: "Pinnacle (Official)" },
  { value: "META_CLOUD", label: "Meta Cloud API" },
];

// --- BusinessId helper (optional header) ---
const TOKEN_KEY = "xbyte_token";
const GUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function getBusinessId() {
  try {
    const saved = localStorage.getItem("business_id");
    if (saved && GUID_RE.test(saved)) return saved;

    const jwt = localStorage.getItem(TOKEN_KEY);
    if (!jwt) return null;
    const [, payloadB64] = jwt.split(".");
    if (!payloadB64) return null;
    const payload = JSON.parse(
      atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/"))
    );
    const bid =
      payload?.BusinessId ||
      payload?.businessId ||
      payload?.biz ||
      payload?.bid ||
      null;
    return typeof bid === "string" && GUID_RE.test(bid) ? bid : null;
  } catch {
    return null;
  }
}

// Normalize to the two uppercase values the backend accepts
const normalizeProvider = p => {
  const up = (p ?? "").toString().trim().toUpperCase();
  if (up === "PINNACLE") return "PINNACLE";
  if (
    up === "META_CLOUD" ||
    up === "META" ||
    up === "METACLOUD" ||
    up === "META-CLOUD"
  )
    return "META_CLOUD";
  return "PINNACLE";
};

export default function SendTemplateMessagePage() {
  const [contacts, setContacts] = useState([]);
  const [selectedNumbers, setSelectedNumbers] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templateParams, setTemplateParams] = useState([]);
  const [imageUrl, setImageUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Provider + senders
  const [provider, setProvider] = useState("PINNACLE");
  const [senders, setSenders] = useState([]); // [{id, phoneNumberId, wbn, isDefault}]
  const [selectedPhoneNumberId, setSelectedPhoneNumberId] = useState("");

  const businessId = useMemo(getBusinessId, []);
  const withBiz = (cfg = {}) =>
    businessId
      ? {
          ...cfg,
          headers: { ...(cfg.headers || {}), "X-Business-Id": businessId },
        }
      : cfg;

  // === Data loading ===
  useEffect(() => {
    axiosClient
      .get("/contacts", withBiz())
      .then(res => setContacts(res.data?.data?.items || []))
      .catch(() => toast.error("❌ Failed to load contacts"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    axiosClient
      // If your route is actually mixed-case, revert to that. Lowercase is typical.
      .get("/whatsapptemplatefetcher/get-template-all", withBiz())
      .then(res => {
        if (res.data?.success && res.data?.templates) {
          setTemplates(res.data.templates);
        } else {
          toast.error("❌ Template fetch failed");
        }
      })
      .catch(() => toast.error("❌ Error loading templates"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load numbers for current provider
  async function loadSenders(p) {
    try {
      const P = normalizeProvider(p);
      const { data } = await axiosClient.get(
        `/whatsappsettings/${P}/numbers`,
        withBiz()
      );
      const rows = Array.isArray(data) ? data : [];
      setSenders(
        rows.map(n => ({
          id: n.id,
          phoneNumberId: n.phoneNumberId || "",
          wbn: n.whatsAppBusinessNumber || "",
          isDefault: !!n.isDefault,
        }))
      );

      // pick default if current selection is not present anymore
      const stillThere = rows.some(
        n => n.phoneNumberId === selectedPhoneNumberId
      );
      if (!stillThere) {
        const def = rows.find(n => n.isDefault);
        setSelectedPhoneNumberId(def?.phoneNumberId || "");
      }
    } catch {
      setSenders([]);
      setSelectedPhoneNumberId("");
    }
  }

  useEffect(() => {
    loadSenders(provider);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider]);

  // === Template helpers ===
  const isImageTemplate = tpl => tpl?.hasImageHeader === true;

  const handleTemplateSelect = name => {
    const tpl = templates.find(t => t.name === name);
    setSelectedTemplate(tpl || null);
    setTemplateParams(Array(tpl?.parametersCount || 0).fill(""));
    setImageUrl("");
  };

  // === Send ===
  const handleSend = async () => {
    if (!selectedTemplate) {
      toast.warn("⚠️ Choose a template");
      return;
    }
    if (templateParams.some(p => !p)) {
      toast.warn("⚠️ Fill all template variables");
      return;
    }
    if (selectedNumbers.length === 0) {
      toast.warn("⚠️ Select at least one recipient");
      return;
    }

    const P = normalizeProvider(provider); // MUST be PINNACLE or META_CLOUD
    const phoneNumberId = (selectedPhoneNumberId || "").trim() || null;

    const wantsImage = selectedTemplate && isImageTemplate(selectedTemplate);
    if (wantsImage && !imageUrl.trim()) {
      toast.warn("⚠️ This template expects an image header URL");
      return;
    }

    setSubmitting(true);
    let success = 0,
      failed = 0;

    for (const number of selectedNumbers) {
      const basePayload = {
        RecipientNumber: number,
        TemplateName: selectedTemplate.name,
        LanguageCode: selectedTemplate.language || "en_US",
        TemplateParameters: templateParams,
        Provider: P, // ✅ server expects exact uppercase
        PhoneNumberId: phoneNumberId, // optional sender override
      };

      const buttonParams = (selectedTemplate?.buttonParams || []).map(b => ({
        buttonText: b.text,
        buttonType: b.type || "quick_reply",
        targetUrl: b.payload || "",
      }));

      try {
        if (wantsImage) {
          const payload = {
            ...basePayload,
            HeaderImageUrl: imageUrl,
            ButtonParameters: buttonParams,
          };
          const res = await axiosClient.post(
            "/messageengine/send-image-template",
            payload,
            withBiz()
          );
          const ok =
            res?.data?.success === true ||
            res?.data?.isSuccess === true ||
            `${res?.data?.message || ""}`.toLowerCase().includes("success");
          ok ? success++ : failed++;
        } else {
          const payload = {
            ...basePayload,
            ButtonParameters: buttonParams, // harmless; BE can ignore for simple body-only templates
          };
          const res = await axiosClient.post(
            "/messageengine/send-template-simple",
            payload,
            withBiz()
          );
          const ok =
            res?.data?.success === true ||
            res?.data?.isSuccess === true ||
            `${res?.data?.message || ""}`.toLowerCase().includes("success");
          ok ? success++ : failed++;
        }
      } catch {
        failed++;
      }
    }

    toast.success(`✅ Sent: ${success}, ❌ Failed: ${failed}`);
    setSubmitting(false);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <h2 className="text-2xl font-bold text-purple-700">
        Send WhatsApp Template
      </h2>

      {/* Provider + Sender selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block font-medium mb-1 text-sm">Provider</label>
          <select
            className="w-full border p-2 rounded"
            value={provider}
            onChange={e => {
              const p = normalizeProvider(e.target.value);
              setProvider(p);
              setSelectedPhoneNumberId(""); // reset; will auto-pick default after load
            }}
          >
            {PROVIDERS.map(p => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block font-medium mb-1 text-sm">
            Sender (Phone Number ID)
          </label>
          <div className="flex gap-2">
            <select
              className="w-full border p-2 rounded"
              value={selectedPhoneNumberId}
              onChange={e => setSelectedPhoneNumberId(e.target.value)}
            >
              <option value="">— Use default (if configured) —</option>
              {senders.map(s => (
                <option key={s.id} value={s.phoneNumberId}>
                  {s.wbn || s.phoneNumberId}
                  {s.isDefault ? " — Default" : ""}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="px-3 py-2 text-sm rounded bg-gray-100"
              onClick={() => loadSenders(provider)}
              title="Refresh senders"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Main Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Template Selection & Inputs */}
        <div className="space-y-4">
          <div>
            <label className="block font-medium mb-1 text-sm">
              Select Template
            </label>
            <select
              className="w-full border p-2 rounded"
              onChange={e => handleTemplateSelect(e.target.value)}
            >
              <option value="">-- Choose Template --</option>
              {templates.map(tpl => (
                <option key={tpl.name} value={tpl.name}>
                  {tpl.name} ({tpl.language}) — {tpl.parametersCount} param
                </option>
              ))}
            </select>
          </div>

          {templateParams.length > 0 && (
            <div className="space-y-2">
              <label className="block font-medium text-sm text-gray-700">
                Template Parameters
              </label>
              {templateParams.map((val, idx) => (
                <input
                  key={idx}
                  className="w-full border p-2 rounded"
                  placeholder={`Enter value for {{${idx + 1}}}`}
                  value={val}
                  onChange={e => {
                    const copy = [...templateParams];
                    copy[idx] = e.target.value;
                    setTemplateParams(copy);
                  }}
                />
              ))}
            </div>
          )}

          {selectedTemplate && isImageTemplate(selectedTemplate) && (
            <div>
              <label className="block font-medium text-sm">Image URL</label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                placeholder="https://example.com/image.jpg"
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Preview Card */}
        <div className="p-4 border rounded shadow-sm bg-white">
          <h3 className="text-sm font-semibold mb-2 text-gray-700">
            Message Preview
          </h3>
          {selectedTemplate ? (
            <WhatsAppBubblePreview
              templateBody={selectedTemplate.body}
              parameters={templateParams}
              buttonParams={selectedTemplate?.buttonParams}
              imageUrl={imageUrl}
            />
          ) : (
            <p className="text-gray-500 text-sm">No template selected</p>
          )}
        </div>
      </div>

      {/* Recipients */}
      <div className="p-4 border rounded bg-gray-50 shadow-sm">
        <h3 className="font-semibold mb-2 text-gray-700">
          Select Recipients ({selectedNumbers.length} selected)
        </h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
          {contacts.map(c => (
            <label key={c.id} className="flex items-center text-sm gap-2">
              <input
                type="checkbox"
                value={c.phoneNumber}
                checked={selectedNumbers.includes(c.phoneNumber)}
                onChange={e => {
                  const value = e.target.value;
                  setSelectedNumbers(prev =>
                    e.target.checked
                      ? [...prev, value]
                      : prev.filter(n => n !== value)
                  );
                }}
              />
              {c.name} ({c.phoneNumber})
            </label>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-center">
        <button
          onClick={handleSend}
          disabled={submitting}
          className={`px-6 py-3 font-semibold rounded-xl transition duration-200 shadow-md ${
            submitting
              ? "bg-gray-400 text-white cursor-not-allowed"
              : "bg-purple-600 text-white hover:bg-purple-700"
          }`}
        >
          {submitting ? "Sending..." : "Send Template Message"}
        </button>
      </div>
    </div>
  );
}

// import React, { useEffect, useState } from "react";
// import axiosClient from "../../api/axiosClient";
// import { toast } from "react-toastify";
// import WhatsAppBubblePreview from "../../components/WhatsAppBubblePreview";

// export default function SendTemplateMessagePage() {
//   const [contacts, setContacts] = useState([]);
//   const [selectedNumbers, setSelectedNumbers] = useState([]);
//   const [templates, setTemplates] = useState([]);
//   const [selectedTemplate, setSelectedTemplate] = useState(null);
//   const [templateParams, setTemplateParams] = useState([]);
//   const [imageUrl, setImageUrl] = useState("");
//   const [submitting, setSubmitting] = useState(false);

//   useEffect(() => {
//     axiosClient
//       .get("/contacts")
//       .then(res => {
//         setContacts(res.data?.data?.items || []);
//       })
//       .catch(() => toast.error("❌ Failed to load contacts"));
//   }, []);

//   useEffect(() => {
//     axiosClient
//       .get("/WhatsAppTemplateFetcher/get-template-all")
//       .then(res => {
//         if (res.data.success && res.data.templates) {
//           setTemplates(res.data.templates);
//         } else {
//           toast.error("❌ Template fetch failed");
//         }
//       })
//       .catch(() => toast.error("❌ Error loading templates"));
//   }, []);

//   const isImageTemplate = tpl => tpl?.hasImageHeader === true;

//   const handleTemplateSelect = name => {
//     const tpl = templates.find(t => t.name === name);
//     setSelectedTemplate(tpl);
//     setTemplateParams(Array(tpl?.parametersCount || 0).fill(""));
//     setImageUrl("");
//   };

//   const handleSend = async () => {
//     if (!selectedTemplate || templateParams.some(p => !p)) {
//       toast.warn("⚠️ Fill all template variables");
//       return;
//     }
//     if (selectedNumbers.length === 0) {
//       toast.warn("⚠️ Select at least one recipient");
//       return;
//     }

//     setSubmitting(true);
//     let success = 0,
//       failed = 0;
//     const isImage = isImageTemplate(selectedTemplate);

//     for (const number of selectedNumbers) {
//       const payload = {
//         RecipientNumber: number,
//         TemplateName: selectedTemplate.name,
//         LanguageCode: selectedTemplate.language || "en_US",
//         HeaderImageUrl: isImage ? imageUrl : null,
//         TemplateParameters: templateParams,
//         ButtonParameters: (selectedTemplate?.buttonParams || []).map(b => ({
//           buttonText: b.text,
//           buttonType: b.type || "quick_reply",
//           targetUrl: b.payload || "",
//         })),
//       };

//       try {
//         const res = await axiosClient.post(
//           isImage
//             ? "/messageengine/send-image-template"
//             : "/messageengine/send-template-simple",
//           payload
//         );

//         const raw = res?.data;
//         const isSuccess =
//           raw?.isSuccess === true ||
//           raw?.success === true ||
//           raw?.message?.toLowerCase()?.includes("successfully");

//         isSuccess ? success++ : failed++;
//       } catch {
//         failed++;
//       }
//     }

//     toast.success(`✅ Sent: ${success}, ❌ Failed: ${failed}`);
//     setSubmitting(false);
//   };

//   return (
//     <div className="p-6 max-w-6xl mx-auto space-y-8">
//       <h2 className="text-2xl font-bold text-purple-700">
//         Send WhatsApp Template
//       </h2>

//       {/* Main Section */}
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//         {/* Template Selection & Inputs */}
//         <div className="space-y-4">
//           <div>
//             <label className="block font-medium mb-1 text-sm">
//               Select Template
//             </label>
//             <select
//               className="w-full border p-2 rounded"
//               onChange={e => handleTemplateSelect(e.target.value)}
//             >
//               <option value="">-- Choose Template --</option>
//               {templates.map(tpl => (
//                 <option key={tpl.name} value={tpl.name}>
//                   {tpl.name} ({tpl.language}) — {tpl.parametersCount} param
//                 </option>
//               ))}
//             </select>
//           </div>

//           {templateParams.length > 0 && (
//             <div className="space-y-2">
//               <label className="block font-medium text-sm text-gray-700">
//                 Template Parameters
//               </label>
//               {templateParams.map((val, idx) => (
//                 <input
//                   key={idx}
//                   className="w-full border p-2 rounded"
//                   placeholder={`Enter value for {{${idx + 1}}}`}
//                   value={val}
//                   onChange={e => {
//                     const copy = [...templateParams];
//                     copy[idx] = e.target.value;
//                     setTemplateParams(copy);
//                   }}
//                 />
//               ))}
//             </div>
//           )}

//           {selectedTemplate && isImageTemplate(selectedTemplate) && (
//             <div>
//               <label className="block font-medium text-sm">Image URL</label>
//               <input
//                 type="text"
//                 className="w-full p-2 border rounded"
//                 placeholder="https://example.com/image.jpg"
//                 value={imageUrl}
//                 onChange={e => setImageUrl(e.target.value)}
//               />
//             </div>
//           )}
//         </div>

//         {/* Preview Card */}
//         <div className="p-4 border rounded shadow-sm bg-white">
//           <h3 className="text-sm font-semibold mb-2 text-gray-700">
//             Message Preview
//           </h3>
//           {selectedTemplate ? (
//             <WhatsAppBubblePreview
//               templateBody={selectedTemplate.body}
//               parameters={templateParams}
//               buttonParams={selectedTemplate?.buttonParams}
//               imageUrl={imageUrl}
//             />
//           ) : (
//             <p className="text-gray-500 text-sm">No template selected</p>
//           )}
//         </div>
//       </div>

//       {/* Recipients */}
//       <div className="p-4 border rounded bg-gray-50 shadow-sm">
//         <h3 className="font-semibold mb-2 text-gray-700">
//           Select Recipients ({selectedNumbers.length} selected)
//         </h3>
//         <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
//           {contacts.map(c => (
//             <label key={c.id} className="flex items-center text-sm gap-2">
//               <input
//                 type="checkbox"
//                 value={c.phoneNumber}
//                 checked={selectedNumbers.includes(c.phoneNumber)}
//                 onChange={e => {
//                   const value = e.target.value;
//                   setSelectedNumbers(prev =>
//                     e.target.checked
//                       ? [...prev, value]
//                       : prev.filter(n => n !== value)
//                   );
//                 }}
//               />
//               {c.name} ({c.phoneNumber})
//             </label>
//           ))}
//         </div>
//       </div>

//       {/* Submit Button */}
//       <div className="flex justify-center">
//         <button
//           onClick={handleSend}
//           disabled={submitting}
//           className={`px-6 py-3 font-semibold rounded-xl transition duration-200 shadow-md ${
//             submitting
//               ? "bg-gray-400 text-white cursor-not-allowed"
//               : "bg-purple-600 text-white hover:bg-purple-700"
//           }`}
//         >
//           {submitting ? "Sending..." : "Send Template Message"}
//         </button>
//       </div>
//     </div>
//   );
// }

// import React, { useEffect, useState } from "react";
// import axiosClient from "../../api/axiosClient";
// import { toast } from "react-toastify";
// import WhatsAppBubblePreview from "../../components/WhatsAppBubblePreview";

// function SendTemplateMessagePage() {
//   const [contacts, setContacts] = useState([]);
//   const [selectedNumbers, setSelectedNumbers] = useState([]);
//   const [templates, setTemplates] = useState([]);
//   const [selectedTemplate, setSelectedTemplate] = useState(null);
//   const [templateParams, setTemplateParams] = useState([]);
//   const [imageUrl, setImageUrl] = useState("");
//   const [submitting, setSubmitting] = useState(false);

//   const businessId = localStorage.getItem("businessId");

//   // 🔁 Load contacts
//   useEffect(() => {
//     const loadContacts = async () => {
//       try {
//         const res = await axiosClient.get("/contacts");
//         const contactList = res.data?.data?.items;
//         if (Array.isArray(contactList)) {
//           setContacts(contactList);
//         } else {
//           console.error("Unexpected contact response:", res.data);
//           toast.error("⚠️ Invalid contact data format.");
//         }
//       } catch (err) {
//         toast.error("❌ Failed to load contacts.");
//         console.error("Contact fetch error:", err);
//       }
//     };
//     loadContacts();
//   }, []);

//   // 🔁 Load templates
//   useEffect(() => {
//     const loadTemplates = async () => {
//       try {
//         const res = await axiosClient.get(
//           "/WhatsAppTemplateFetcher/get-template-all"
//         );
//         if (res.data.success && res.data.templates) {
//           setTemplates(res.data.templates);
//         } else {
//           toast.error("❌ Template fetch failed.");
//         }
//       } catch {
//         toast.error("❌ Error fetching templates.");
//       }
//     };
//     loadTemplates();
//   }, []);

//   // ✅ Image header logic
//   const isImageTemplate = tpl => tpl?.hasImageHeader === true;

//   const handleTemplateSelect = name => {
//     const tpl = templates.find(t => t.name === name);
//     setSelectedTemplate(tpl);
//     setTemplateParams(Array(tpl?.parametersCount || 0).fill(""));
//     setImageUrl(""); // reset
//   };

//   const handleSend = async () => {
//     if (!selectedTemplate || templateParams.some(p => !p)) {
//       toast.warn("⚠️ Please select a template and fill all variables.");
//       return;
//     }

//     if (selectedNumbers.length === 0) {
//       toast.warn("⚠️ Select at least one recipient.");
//       return;
//     }

//     setSubmitting(true);
//     let success = 0;
//     let failed = 0;
//     const imageTemplate = isImageTemplate(selectedTemplate);

//     for (const number of selectedNumbers) {
//       const payload = {
//         RecipientNumber: number,
//         TemplateName: selectedTemplate.name,
//         LanguageCode: selectedTemplate?.language || "en_US",
//         HeaderImageUrl: imageTemplate ? imageUrl : null,
//         TemplateParameters: templateParams,
//         ButtonParameters: (selectedTemplate?.buttonParams || []).map(b => ({
//           buttonText: b.text,
//           buttonType: b.type || "quick_reply",
//           targetUrl: b.payload || "",
//         })),
//       };

//       try {
//         const res = await axiosClient.post(
//           imageTemplate
//             ? "/messageengine/send-image-template"
//             : "/messageengine/send-template-simple",
//           payload
//         );

//         const raw = res?.data;
//         const isSuccess =
//           raw?.isSuccess === true ||
//           raw?.success === true ||
//           raw?.message?.toLowerCase()?.includes("successfully");

//         if (isSuccess) {
//           success++;
//         } else {
//           failed++;
//           console.warn("⚠️ Unexpected response:", raw);
//         }
//       } catch (err) {
//         failed++;
//         console.error("❌ Axios error:", err);
//       }
//     }

//     toast.success(`✅ Sent: ${success}, ❌ Failed: ${failed}`);
//     setSubmitting(false);
//   };

//   return (
//     <div className="max-w-3xl mx-auto p-6 space-y-6">
//       <h2 className="text-xl font-bold text-purple-700">
//         Send WhatsApp Template Message
//       </h2>

//       <div>
//         <label className="font-semibold">Select Template</label>
//         <select
//           className="w-full border p-2 rounded"
//           onChange={e => handleTemplateSelect(e.target.value)}
//         >
//           <option value="">-- Choose Template --</option>
//           {templates.map(tpl => (
//             <option key={tpl.name} value={tpl.name}>
//               {tpl.name} ({tpl.language}) — {tpl.parametersCount} param
//             </option>
//           ))}
//         </select>
//       </div>

//       {templateParams.length > 0 && (
//         <div className="space-y-3 border p-4 rounded bg-gray-50">
//           <h3 className="font-semibold text-sm text-gray-700">
//             Template Parameters
//           </h3>
//           {templateParams.map((val, idx) => (
//             <input
//               key={idx}
//               className="w-full p-2 border rounded"
//               placeholder={`Enter value for {{${idx + 1}}}`}
//               value={val}
//               onChange={e => {
//                 const updated = [...templateParams];
//                 updated[idx] = e.target.value;
//                 setTemplateParams(updated);
//               }}
//             />
//           ))}
//         </div>
//       )}

//       {selectedTemplate && isImageTemplate(selectedTemplate) && (
//         <div>
//           <label className="font-semibold text-sm text-gray-700">
//             Image URL
//           </label>
//           <input
//             type="text"
//             className="w-full p-2 border rounded mt-1"
//             placeholder="https://example.com/image.jpg"
//             value={imageUrl}
//             onChange={e => setImageUrl(e.target.value)}
//           />
//         </div>
//       )}

//       {selectedTemplate && (
//         <WhatsAppBubblePreview
//           templateBody={selectedTemplate?.body}
//           parameters={templateParams}
//           buttonParams={selectedTemplate?.buttonParams}
//           imageUrl={imageUrl}
//         />
//       )}

//       <div className="border rounded p-3">
//         <label className="block font-semibold text-gray-700 mb-2">
//           Select Recipients:
//         </label>
//         <div className="max-h-52 overflow-y-auto space-y-1">
//           {contacts.map(contact => (
//             <div key={contact.id} className="flex items-center gap-2">
//               <input
//                 type="checkbox"
//                 value={contact.phoneNumber}
//                 checked={selectedNumbers.includes(contact.phoneNumber)}
//                 onChange={e => {
//                   const val = e.target.value;
//                   setSelectedNumbers(prev =>
//                     e.target.checked
//                       ? [...prev, val]
//                       : prev.filter(n => n !== val)
//                   );
//                 }}
//               />
//               <label className="text-sm">
//                 {contact.name} ({contact.phoneNumber})
//               </label>
//             </div>
//           ))}
//         </div>
//       </div>

//       <button
//         onClick={handleSend}
//         disabled={submitting}
//         className={`w-full py-3 font-semibold rounded transition ${
//           submitting
//             ? "bg-gray-400 text-white"
//             : "bg-purple-600 text-white hover:bg-purple-700"
//         }`}
//       >
//         {submitting ? "Sending..." : "Send Template Message"}
//       </button>
//     </div>
//   );
// }

// export default SendTemplateMessagePage;
