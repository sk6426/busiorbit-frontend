// 📄 src/pages/Settings/WhatsAppSettings.jsx
import React, { useState, useEffect, useMemo } from "react";
import axiosClient from "../../api/axiosClient";
import { toast } from "react-toastify";

// Canonical provider values (MUST match backend)
const PROVIDERS = [
  { value: "Pinnacle", label: "Pinnacle (Official)" },
  { value: "Meta_cloud", label: "Meta Cloud API" },
];

// Map legacy/lowercase to canonical
const normalizeProvider = p => {
  if (!p) return "Pinnacle";
  const raw = String(p).trim();
  if (raw === "Pinnacle" || raw === "Meta_cloud") return raw;
  const lower = raw.toLowerCase();
  if (["pinnacle", "pinbot", "pinnacle (official)"].includes(lower))
    return "Pinnacle";
  if (["meta_cloud", "meta cloud", "meta", "meta-cloud"].includes(lower))
    return "Meta_cloud";
  return "Pinnacle";
};

export default function WhatsAppSettings() {
  const [formData, setFormData] = useState({
    provider: "Pinnacle",
    apiUrl: "",
    apiKey: "",
    apiToken: "",
    phoneNumberId: "",
    wabaId: "",
    whatsAppBusinessNumber: "",
    senderDisplayName: "",
    webhookSecret: "",
    webhookVerifyToken: "",
    webhookCallbackUrl: "",
    isActive: true,
  });

  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axiosClient.get("/whatsappsettings/me");
        if (data) {
          const provider = normalizeProvider(data.provider);
          // If coming from DB with only ApiKey column populated for Meta_cloud, mirror it into apiToken for UI
          const apiKeyFromDb = data.apiKey ?? "";
          const apiTokenFromDb =
            provider === "Meta_cloud" && !data.apiToken
              ? apiKeyFromDb
              : data.apiToken ?? "";

          setFormData(prev => ({
            ...prev,
            provider,
            apiUrl: data.apiUrl || "",
            apiKey: apiKeyFromDb,
            apiToken: apiTokenFromDb,
            phoneNumberId: data.phoneNumberId || "",
            wabaId: data.wabaId || "",
            whatsAppBusinessNumber: data.whatsAppBusinessNumber || "",
            senderDisplayName: data.senderDisplayName || "",
            webhookSecret: data.webhookSecret || "",
            webhookVerifyToken: data.webhookVerifyToken || "",
            webhookCallbackUrl: data.webhookCallbackUrl || "",
            isActive: data.isActive ?? true,
          }));
        }
      } catch {
        toast.info("ℹ️ No WhatsApp settings found. You can create them now.");
      }
    })();
  }, []);

  const onChange = e => {
    const { name, value, type, checked } = e.target;
    setFormData(f => ({
      ...f,
      [name]:
        name === "provider"
          ? normalizeProvider(value)
          : type === "checkbox"
          ? checked
          : value,
    }));
  };

  // Validation
  const validationErrors = useMemo(() => {
    const f = Object.fromEntries(
      Object.entries(formData).map(([k, v]) => [
        k,
        typeof v === "string" ? v.trim() : v,
      ])
    );
    const errors = [];

    if (!f.apiUrl) errors.push("API URL is required.");

    if (f.provider === "Meta_cloud") {
      if (!f.apiToken) errors.push("Token is required for Meta Cloud.");
      if (!f.phoneNumberId)
        errors.push("Phone Number ID is required for Meta Cloud.");
    }

    if (f.provider === "Pinnacle") {
      if (!f.apiKey) errors.push("API Key is required for Pinnacle.");
      if (!f.phoneNumberId && !f.wabaId) {
        errors.push("Provide Phone Number ID or WABA ID for Pinnacle.");
      }
      if (!f.whatsAppBusinessNumber) {
        errors.push("WhatsApp Business Number is required for Pinnacle.");
      }
      if (!f.webhookCallbackUrl) {
        errors.push("Webhook Callback URL is required for Pinnacle.");
      } else if (!/^https:\/\/.+/i.test(f.webhookCallbackUrl)) {
        errors.push("Webhook Callback URL must be a valid HTTPS URL.");
      }
    }

    // Global rule: At least one credential required (defensive)
    if (!f.apiKey && !f.apiToken) {
      errors.push("Either API Key or Token must be provided.");
    }

    return errors;
  }, [formData]);

  const handleTestConnection = async () => {
    if (validationErrors.length) {
      toast.warn("⚠️ Please fix the form: " + validationErrors[0]);
      return;
    }
    setTesting(true);
    try {
      const provider = normalizeProvider(formData.provider);
      const payload = {
        provider,
        apiUrl: (formData.apiUrl ?? "").trim().replace(/\/+$/, ""),
        // For testing we can still send both, backend can choose what it uses
        apiKey: (formData.apiKey ?? "").trim(),
        apiToken: (formData.apiToken ?? "").trim(),
        phoneNumberId: (formData.phoneNumberId ?? "").trim(),
        wabaId: (formData.wabaId ?? "").trim(),
        whatsAppBusinessNumber: (formData.whatsAppBusinessNumber ?? "").trim(),
      };

      const { data } = await axiosClient.post(
        "/whatsappsettings/test-connection",
        payload
      );
      setTestResult(data?.message || "✅ Connection successful.");
      toast.success("✅ Test connection succeeded.");
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Test connection failed:", err);
      const msg = err?.response?.data?.message || "❌ Test connection failed.";
      setTestResult(msg);
      toast.error(msg);
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (validationErrors.length) {
      toast.warn("⚠️ Please fix the form: " + validationErrors[0]);
      return;
    }
    setLoading(true);
    try {
      const provider = normalizeProvider(formData.provider);

      // 🔑 IMPORTANT:
      // DB has ONLY ApiKey column (NOT NULL). For Meta_cloud we must store the TOKEN into ApiKey.
      const apiKeyForDb =
        provider === "Meta_cloud"
          ? (formData.apiToken ?? "").trim() // map token -> ApiKey
          : (formData.apiKey ?? "").trim(); // normal API key

      const payload = {
        provider,
        apiUrl: (formData.apiUrl ?? "").trim().replace(/\/+$/, ""),
        apiKey: apiKeyForDb, // <-- always filled to satisfy NOT NULL
        apiToken: (formData.apiToken ?? "").trim(), // still send token for backend convenience
        phoneNumberId: (formData.phoneNumberId ?? "").trim(),
        wabaId: (formData.wabaId ?? "").trim(),
        whatsAppBusinessNumber: (formData.whatsAppBusinessNumber ?? "").trim(),
        senderDisplayName: (formData.senderDisplayName ?? "").trim(),
        webhookSecret: (formData.webhookSecret ?? "").trim(),
        webhookVerifyToken: (formData.webhookVerifyToken ?? "").trim(),
        webhookCallbackUrl: (formData.webhookCallbackUrl ?? "").trim(),
        isActive: !!formData.isActive,
      };

      await axiosClient.put("/whatsappsettings/update", payload);
      toast.success("✅ WhatsApp settings saved.");
      setTestResult("");
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Save failed:", err);
      toast.error(
        err?.response?.data?.message || "❌ Failed to save settings."
      );
    } finally {
      setLoading(false);
    }
  };

  // UI config
  const showField = key => {
    const p = formData.provider;
    const common = [
      "apiUrl",
      "senderDisplayName",
      "whatsAppBusinessNumber",
      "webhookSecret",
      "webhookVerifyToken",
      "webhookCallbackUrl",
      "wabaId",
      "isActive",
    ];
    const pinnacleOnly = ["apiKey", "phoneNumberId"];
    const metaOnly = ["apiToken", "phoneNumberId"];

    if (common.includes(key)) return true;
    if (p === "Pinnacle" && pinnacleOnly.includes(key)) return true;
    if (p === "Meta_cloud" && metaOnly.includes(key)) return true;
    return false;
  };

  const placeholders = {
    apiUrl: "https://graph.facebook.com/v18.0",
    apiKey: "API Key",
    apiToken: "Token (Meta Cloud)",
    phoneNumberId: "Phone Number ID",
    wabaId: "WABA ID",
    whatsAppBusinessNumber: "+919012345678",
    senderDisplayName: "Display name shown to recipients",
    webhookSecret: "Optional signing secret (if provider supports)",
    webhookVerifyToken: "Optional verify token for webhook setup",
    webhookCallbackUrl: "Public HTTPS endpoint for webhook callbacks",
  };

  const labels = {
    provider: "Provider",
    apiUrl: "API URL",
    apiKey: "API Key",
    apiToken: "API Token",
    phoneNumberId: "Phone Number ID",
    wabaId: "WABA ID",
    whatsAppBusinessNumber: "WhatsApp Business Number",
    senderDisplayName: "Sender Display Name",
    webhookSecret: "Webhook Secret (optional)",
    webhookVerifyToken: "Webhook Verify Token (optional)",
    webhookCallbackUrl: "Webhook Callback URL",
    isActive: "Is Active",
  };

  return (
    <div className="min-h-screen flex items-start justify-center bg-gray-50 px-0 pt-2">
      <form
        onSubmit={e => {
          e.preventDefault();
          handleSave();
        }}
        className="bg-white shadow-sm border rounded-md w-full max-w-4xl p-4 md:p-6 hover:shadow-md transition"
      >
        <div className="flex items-center gap-2 mb-6">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
            alt="WhatsApp"
            className="w-6 h-6"
          />
          <h2 className="text-lg font-bold text-green-600">
            WhatsApp API Settings
          </h2>
        </div>

        <p className="text-xs text-gray-500 mb-4">
          ⚠️ Either <strong>API Key</strong> (Pinnacle) or{" "}
          <strong>Token</strong> (Meta Cloud) must be provided.
        </p>

        {/* Provider */}
        <div className="mb-4">
          <label
            className="text-xs font-medium text-gray-600 block mb-1"
            htmlFor="provider"
          >
            {labels.provider}
          </label>
          <select
            id="provider"
            name="provider"
            value={formData.provider}
            onChange={onChange}
            className="w-full px-3 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 border-gray-300"
          >
            {PROVIDERS.map(p => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        {/* Dynamic fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          {[
            "apiUrl",
            "apiKey",
            "apiToken",
            "phoneNumberId",
            "wabaId",
            "whatsAppBusinessNumber",
            "senderDisplayName",
            "webhookSecret",
            "webhookVerifyToken",
            "webhookCallbackUrl",
          ]
            .filter(showField)
            .map(key => (
              <div key={key}>
                <label
                  htmlFor={key}
                  className="text-xs font-medium text-gray-600 block mb-1"
                >
                  {labels[key]}
                </label>
                {key === "apiToken" ? (
                  <textarea
                    id={key}
                    name={key}
                    rows={3}
                    value={formData[key] || ""}
                    onChange={onChange}
                    placeholder={placeholders[key]}
                    className="w-full px-3 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 border-gray-300 resize-none"
                  />
                ) : (
                  <input
                    id={key}
                    type="text"
                    name={key}
                    value={formData[key] || ""}
                    onChange={onChange}
                    placeholder={placeholders[key]}
                    className="w-full px-3 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 border-gray-300"
                  />
                )}
              </div>
            ))}

          <div className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={onChange}
              className="w-4 h-4"
            />
            <label className="text-sm font-medium text-gray-700">
              {labels.isActive}
            </label>
          </div>
        </div>

        {validationErrors.length > 0 && (
          <div className="mt-4 text-sm text-red-600">
            ⚠️ {validationErrors[0]}
          </div>
        )}

        <div className="pt-6 border-t mt-6 flex flex-col md:flex-row gap-4 justify-end">
          <button
            type="submit"
            disabled={loading}
            className={`px-4 py-2 rounded-md text-white text-sm font-medium ${
              loading ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {loading ? "Saving..." : "💾 Save Settings"}
          </button>

          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testing}
            className={`px-4 py-2 rounded-md text-white text-sm font-medium ${
              testing ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {testing ? "Testing..." : "🔄 Test Connection"}
          </button>
        </div>

        {testResult && (
          <div
            className={`mt-4 text-center font-semibold ${
              testResult.startsWith("✅") ? "text-green-600" : "text-red-600"
            }`}
          >
            {testResult}
          </div>
        )}
      </form>
    </div>
  );
}

// // src/pages/Settings/WhatsAppSettings.jsx
// import React, { useState, useEffect, useMemo } from "react";
// import axiosClient from "../../api/axiosClient";
// import { toast } from "react-toastify";

// // Canonical provider values (MUST match backend)
// const PROVIDERS = [
//   { value: "Pinnacle", label: "Pinnacle (Official)" },
//   { value: "Meta_cloud", label: "Meta Cloud API" },
// ];

// // Map legacy/lowercase to canonical
// const normalizeProvider = p => {
//   if (!p) return "Pinnacle";
//   const raw = String(p).trim();
//   if (raw === "Pinnacle" || raw === "Meta_cloud") return raw;

//   const lower = raw.toLowerCase();
//   if (["pinnacle", "pinbot", "pinnacle (official)"].includes(lower))
//     return "Pinnacle";
//   if (["meta_cloud", "meta cloud", "meta", "meta-cloud"].includes(lower))
//     return "Meta_cloud";
//   return "Pinnacle";
// };

// export default function WhatsAppSettings() {
//   const [formData, setFormData] = useState({
//     provider: "Pinnacle",
//     apiUrl: "",
//     apiKey: "",
//     apiToken: "",
//     phoneNumberId: "",
//     wabaId: "",
//     whatsAppBusinessNumber: "",
//     senderDisplayName: "",
//     webhookSecret: "",
//     webhookVerifyToken: "",
//     webhookCallbackUrl: "",
//     isActive: true,
//   });

//   const [loading, setLoading] = useState(false);
//   const [testing, setTesting] = useState(false);
//   const [testResult, setTestResult] = useState("");

//   useEffect(() => {
//     (async () => {
//       try {
//         const { data } = await axiosClient.get("/whatsappsettings/me");
//         if (data) {
//           setFormData(prev => ({
//             ...prev,
//             provider: normalizeProvider(data.provider) || prev.provider,
//             apiUrl: data.apiUrl || "",
//             apiKey: data.apiKey || "",
//             apiToken: data.apiToken || "",
//             phoneNumberId: data.phoneNumberId || "",
//             wabaId: data.wabaId || "",
//             whatsAppBusinessNumber: data.whatsAppBusinessNumber || "",
//             senderDisplayName: data.senderDisplayName || "",
//             webhookSecret: data.webhookSecret || "",
//             webhookVerifyToken: data.webhookVerifyToken || "",
//             webhookCallbackUrl: data.webhookCallbackUrl || "",
//             isActive: data.isActive ?? true,
//           }));
//         }
//       } catch {
//         toast.info("ℹ️ No WhatsApp settings found. You can create them now.");
//       }
//     })();
//   }, []);

//   const onChange = e => {
//     const { name, value, type, checked } = e.target;
//     setFormData(f => ({
//       ...f,
//       [name]:
//         name === "provider"
//           ? normalizeProvider(value)
//           : type === "checkbox"
//           ? checked
//           : value,
//     }));
//   };

//   // Validation
//   const validationErrors = useMemo(() => {
//     const f = formData;
//     const errors = [];

//     if (!f.apiUrl.trim()) errors.push("API URL is required.");

//     if (f.provider === "Meta_cloud") {
//       if (!f.apiToken.trim())
//         errors.push("API Token is required for Meta Cloud.");
//       if (!f.phoneNumberId.trim())
//         errors.push("Phone Number ID is required for Meta Cloud.");
//     }

//     if (f.provider === "Pinnacle") {
//       if (!f.apiKey.trim()) errors.push("API Key is required for Pinnacle.");
//       if (!f.phoneNumberId.trim() && !f.wabaId.trim()) {
//         errors.push("Provide Phone Number ID or WABA ID for Pinnacle.");
//       }
//       if (!f.whatsAppBusinessNumber.trim()) {
//         errors.push("WhatsApp Business Number is required for Pinnacle.");
//       }
//       if (!f.webhookCallbackUrl.trim()) {
//         errors.push("Webhook Callback URL is required for Pinnacle.");
//       } else if (!/^https:\/\/.+/i.test(f.webhookCallbackUrl.trim())) {
//         errors.push("Webhook Callback URL must be a valid HTTPS URL.");
//       }
//     }

//     // Global rule: At least one credential required
//     if (!f.apiKey.trim() && !f.apiToken.trim()) {
//       errors.push("Either API Key or API Token must be provided.");
//     }

//     return errors;
//   }, [formData]);

//   const handleTestConnection = async () => {
//     if (validationErrors.length) {
//       toast.warn("⚠️ Please fix the form: " + validationErrors[0]);
//       return;
//     }
//     setTesting(true);
//     try {
//       const { data } = await axiosClient.post(
//         "/whatsappsettings/test-connection",
//         {
//           provider: formData.provider,
//           apiUrl: formData.apiUrl,
//           apiKey: formData.apiKey,
//           apiToken: formData.apiToken,
//           phoneNumberId: formData.phoneNumberId,
//           wabaId: formData.wabaId,
//           whatsAppBusinessNumber: formData.whatsAppBusinessNumber,
//         }
//       );
//       setTestResult(data?.message || "✅ Connection successful.");
//       toast.success("✅ Test connection succeeded.");
//     } catch (err) {
//       console.error("Test connection failed:", err);
//       const msg = err.response?.data?.message || "❌ Test connection failed.";
//       setTestResult(msg);
//       toast.error(msg);
//     } finally {
//       setTesting(false);
//     }
//   };

//   const handleSave = async () => {
//     if (validationErrors.length) {
//       toast.warn("⚠️ Please fix the form: " + validationErrors[0]);
//       return;
//     }
//     setLoading(true);
//     try {
//       const tokenToSend =
//         formData.provider === "Pinnacle" && !formData.apiToken?.trim()
//           ? "-"
//           : formData.apiToken;

//       await axiosClient.put("/whatsappsettings/update", {
//         provider: formData.provider,
//         apiUrl: formData.apiUrl,
//         apiKey: formData.apiKey,
//         apiToken: tokenToSend,
//         phoneNumberId: formData.phoneNumberId,
//         wabaId: formData.wabaId,
//         whatsAppBusinessNumber: formData.whatsAppBusinessNumber,
//         senderDisplayName: formData.senderDisplayName,
//         webhookSecret: formData.webhookSecret,
//         webhookVerifyToken: formData.webhookVerifyToken,
//         webhookCallbackUrl: formData.webhookCallbackUrl,
//         isActive: formData.isActive,
//       });
//       toast.success("✅ WhatsApp settings saved.");
//       setTestResult("");
//     } catch (err) {
//       console.error("Save failed:", err);
//       toast.error(err.response?.data?.message || "❌ Failed to save settings.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // UI config
//   const showField = key => {
//     const p = formData.provider;
//     const common = [
//       "apiUrl",
//       "senderDisplayName",
//       "whatsAppBusinessNumber",
//       "webhookSecret",
//       "webhookVerifyToken",
//       "webhookCallbackUrl",
//       "wabaId", // 👈 ALWAYS visible now
//       "isActive",
//     ];
//     const pinnacleOnly = ["apiKey", "phoneNumberId"]; // 👈 removed wabaId here
//     const metaOnly = ["apiToken", "phoneNumberId"];

//     if (common.includes(key)) return true;
//     if (p === "Pinnacle" && pinnacleOnly.includes(key)) return true;
//     if (p === "Meta_cloud" && metaOnly.includes(key)) return true;
//     return false;
//   };

//   const placeholders = {
//     apiUrl: " https://graph.facebook.com/v18.0",
//     apiKey: "API Key (fill this OR API Token)",
//     apiToken: "API Token (fill this OR API Key)",
//     phoneNumberId: "Phone Number ID",
//     wabaId: "WABA ID",
//     whatsAppBusinessNumber: "+919012345678",
//     senderDisplayName: "Display name shown to recipients",
//     webhookSecret: "Optional signing secret (if provider supports)",
//     webhookVerifyToken: "Optional verify token for webhook setup",
//     webhookCallbackUrl: "Public HTTPS endpoint for webhook callbacks",
//   };

//   const labels = {
//     provider: "Provider",
//     apiUrl: "API URL",
//     apiKey: "API Key",
//     apiToken: "API Token",
//     phoneNumberId: "Phone Number ID",
//     wabaId: "WABA ID",
//     whatsAppBusinessNumber: "WhatsApp Business Number",
//     senderDisplayName: "Sender Display Name",
//     webhookSecret: "Webhook Secret (optional)",
//     webhookVerifyToken: "Webhook Verify Token (optional)",
//     webhookCallbackUrl: "Webhook Callback URL",
//     isActive: "Is Active",
//   };

//   return (
//     <div className="min-h-screen flex items-start justify-center bg-gray-50 px-0 pt-2">
//       <form
//         onSubmit={e => {
//           e.preventDefault();
//           handleSave();
//         }}
//         className="bg-white shadow-sm border rounded-md w-full max-w-4xl p-4 md:p-6 hover:shadow-md transition"
//       >
//         <div className="flex items-center gap-2 mb-6">
//           <img
//             src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
//             alt="WhatsApp"
//             className="w-6 h-6"
//           />
//           <h2 className="text-lg font-bold text-green-600">
//             WhatsApp API Settings
//           </h2>
//         </div>

//         <p className="text-xs text-gray-500 mb-4">
//           ⚠️ Either <strong>API Key</strong> or <strong>API Token</strong> must
//           be provided. Both cannot be empty.
//         </p>

//         {/* Provider */}
//         <div className="mb-4">
//           <label
//             className="text-xs font-medium text-gray-600 block mb-1"
//             htmlFor="provider"
//           >
//             {labels.provider}
//           </label>
//           <select
//             id="provider"
//             name="provider"
//             value={formData.provider}
//             onChange={onChange}
//             className="w-full px-3 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 border-gray-300"
//           >
//             {PROVIDERS.map(p => (
//               <option key={p.value} value={p.value}>
//                 {p.label}
//               </option>
//             ))}
//           </select>
//         </div>

//         {/* Dynamic fields */}
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
//           {[
//             "apiUrl",
//             "apiKey",
//             "apiToken",
//             "phoneNumberId",
//             "wabaId",
//             "whatsAppBusinessNumber",
//             "senderDisplayName",
//             "webhookSecret",
//             "webhookVerifyToken",
//             "webhookCallbackUrl",
//           ]
//             .filter(showField)
//             .map(key => (
//               <div key={key}>
//                 <label
//                   htmlFor={key}
//                   className="text-xs font-medium text-gray-600 block mb-1"
//                 >
//                   {labels[key]}
//                 </label>
//                 {key === "apiToken" ? (
//                   <textarea
//                     id={key}
//                     name={key}
//                     rows={3}
//                     value={formData[key] || ""}
//                     onChange={onChange}
//                     placeholder={placeholders[key]}
//                     className="w-full px-3 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 border-gray-300 resize-none"
//                   />
//                 ) : (
//                   <input
//                     id={key}
//                     type="text"
//                     name={key}
//                     value={formData[key] || ""}
//                     onChange={onChange}
//                     placeholder={placeholders[key]}
//                     className="w-full px-3 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 border-gray-300"
//                   />
//                 )}
//               </div>
//             ))}

//           <div className="flex items-center gap-2 mt-2">
//             <input
//               type="checkbox"
//               name="isActive"
//               checked={formData.isActive}
//               onChange={onChange}
//               className="w-4 h-4"
//             />
//             <label className="text-sm font-medium text-gray-700">
//               {labels.isActive}
//             </label>
//           </div>
//         </div>

//         {validationErrors.length > 0 && (
//           <div className="mt-4 text-sm text-red-600">
//             ⚠️ {validationErrors[0]}
//           </div>
//         )}

//         <div className="pt-6 border-t mt-6 flex flex-col md:flex-row gap-4 justify-end">
//           <button
//             type="submit"
//             disabled={loading}
//             className={`px-4 py-2 rounded-md text-white text-sm font-medium ${
//               loading ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"
//             }`}
//           >
//             {loading ? "Saving..." : "💾 Save Settings"}
//           </button>

//           <button
//             type="button"
//             onClick={handleTestConnection}
//             disabled={testing}
//             className={`px-4 py-2 rounded-md text-white text-sm font-medium ${
//               testing ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
//             }`}
//           >
//             {testing ? "Testing..." : "🔄 Test Connection"}
//           </button>
//         </div>

//         {testResult && (
//           <div
//             className={`mt-4 text-center font-semibold ${
//               testResult.startsWith("✅") ? "text-green-600" : "text-red-600"
//             }`}
//           >
//             {testResult}
//           </div>
//         )}
//       </form>
//     </div>
//   );
// }

// // src/pages/Settings/WhatsAppSettings.jsx
// import React, { useState, useEffect, useMemo } from "react";
// import axiosClient from "../../api/axiosClient";
// import { toast } from "react-toastify";

// // Canonical provider values (MUST match backend)
// const PROVIDERS = [
//   { value: "Pinnacle", label: "Pinnacle (Official)" },
//   { value: "Meta_cloud", label: "Meta Cloud API" },
// ];

// // Map legacy/lowercase to canonical
// const normalizeProvider = p => {
//   if (!p) return "Pinnacle";
//   const raw = String(p).trim();
//   if (raw === "Pinnacle" || raw === "Meta_cloud") return raw;

//   const lower = raw.toLowerCase();
//   if (["pinnacle", "pinbot", "pinnacle (official)"].includes(lower))
//     return "Pinnacle";
//   if (["meta_cloud", "meta cloud", "meta", "meta-cloud"].includes(lower))
//     return "Meta_cloud";
//   return "Pinnacle";
// };

// export default function WhatsAppSettings() {
//   const [formData, setFormData] = useState({
//     provider: "Pinnacle",
//     apiUrl: "",
//     apiKey: "",
//     apiToken: "",
//     phoneNumberId: "",
//     wabaId: "",
//     whatsAppBusinessNumber: "",
//     senderDisplayName: "",
//     webhookSecret: "",
//     webhookVerifyToken: "",
//     webhookCallbackUrl: "",
//     isActive: true,
//   });

//   const [loading, setLoading] = useState(false);
//   const [testing, setTesting] = useState(false);
//   const [deleting, setDeleting] = useState(false);
//   const [testResult, setTestResult] = useState("");

//   useEffect(() => {
//     (async () => {
//       try {
//         const { data } = await axiosClient.get("/whatsappsettings/me");
//         if (data) {
//           setFormData(prev => ({
//             ...prev,
//             provider: normalizeProvider(data.provider) || prev.provider,
//             apiUrl: data.apiUrl || "",
//             apiKey: data.apiKey || "",
//             apiToken: data.apiToken || "",
//             phoneNumberId: data.phoneNumberId || "",
//             wabaId: data.wabaId || "",
//             whatsAppBusinessNumber: data.whatsAppBusinessNumber || "",
//             senderDisplayName: data.senderDisplayName || "",
//             webhookSecret: data.webhookSecret || "",
//             webhookVerifyToken: data.webhookVerifyToken || "",
//             webhookCallbackUrl: data.webhookCallbackUrl || "",
//             isActive: data.isActive ?? true,
//           }));
//         }
//       } catch {
//         toast.info("ℹ️ No WhatsApp settings found. You can create them now.");
//       }
//     })();
//   }, []);

//   const onChange = e => {
//     const { name, value, type, checked } = e.target;
//     setFormData(f => ({
//       ...f,
//       [name]:
//         name === "provider"
//           ? normalizeProvider(value)
//           : type === "checkbox"
//           ? checked
//           : value,
//     }));
//   };

//   // Validation
//   const validationErrors = useMemo(() => {
//     const f = formData;
//     const errors = [];

//     if (!f.apiUrl.trim()) errors.push("API URL is required.");

//     if (f.provider === "Meta_cloud") {
//       if (!f.apiToken.trim())
//         errors.push("API Token is required for Meta Cloud.");
//       if (!f.phoneNumberId.trim())
//         errors.push("Phone Number ID is required for Meta Cloud.");
//     }

//     if (f.provider === "Pinnacle") {
//       if (!f.apiKey.trim()) errors.push("API Key is required for Pinnacle.");
//       if (!f.phoneNumberId.trim() && !f.wabaId.trim()) {
//         errors.push("Provide Phone Number ID or WABA ID for Pinnacle.");
//       }
//       if (!f.whatsAppBusinessNumber.trim()) {
//         errors.push("WhatsApp Business Number is required for Pinnacle.");
//       }
//       if (!f.webhookCallbackUrl.trim()) {
//         errors.push("Webhook Callback URL is required for Pinnacle.");
//       } else if (!/^https:\/\/.+/i.test(f.webhookCallbackUrl.trim())) {
//         errors.push("Webhook Callback URL must be a valid HTTPS URL.");
//       }
//     }

//     // Global rule: At least one credential required
//     if (!f.apiKey.trim() && !f.apiToken.trim()) {
//       errors.push("Either API Key or API Token must be provided.");
//     }

//     return errors;
//   }, [formData]);

//   const handleSave = async () => {
//     if (validationErrors.length) {
//       toast.warn("⚠️ Please fix the form: " + validationErrors[0]);
//       return;
//     }
//     setLoading(true);
//     try {
//       const tokenToSend =
//         formData.provider === "Pinnacle" && !formData.apiToken?.trim()
//           ? "-"
//           : formData.apiToken;

//       await axiosClient.put("/whatsappsettings/update", {
//         provider: formData.provider,
//         apiUrl: formData.apiUrl,
//         apiKey: formData.apiKey,
//         apiToken: tokenToSend,
//         phoneNumberId: formData.phoneNumberId,
//         wabaId: formData.wabaId,
//         whatsAppBusinessNumber: formData.whatsAppBusinessNumber,
//         senderDisplayName: formData.senderDisplayName,
//         webhookSecret: formData.webhookSecret,
//         webhookVerifyToken: formData.webhookVerifyToken,
//         webhookCallbackUrl: formData.webhookCallbackUrl,
//         isActive: formData.isActive,
//       });
//       toast.success("✅ WhatsApp settings saved.");
//       setTestResult("");
//     } catch (err) {
//       console.error("Save failed:", err);
//       toast.error(err.response?.data?.message || "❌ Failed to save settings.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // UI config
//   const showField = key => {
//     const p = formData.provider;
//     const common = [
//       "apiUrl",
//       "senderDisplayName",
//       "whatsAppBusinessNumber",
//       "webhookSecret",
//       "webhookVerifyToken",
//       "webhookCallbackUrl",
//       "wabaId", // 👈 ALWAYS visible now
//       "isActive",
//     ];
//     const pinnacleOnly = ["apiKey", "phoneNumberId"]; // 👈 removed wabaId here
//     const metaOnly = ["apiToken", "phoneNumberId"];

//     if (common.includes(key)) return true;
//     if (p === "Pinnacle" && pinnacleOnly.includes(key)) return true;
//     if (p === "Meta_cloud" && metaOnly.includes(key)) return true;
//     return false;
//   };

//   const placeholders = {
//     apiUrl: " https://graph.facebook.com/v18.0",
//     apiKey: "API Key (fill this OR API Token)",
//     apiToken: "API Token (fill this OR API Key)",
//     phoneNumberId: "Phone Number ID",
//     wabaId: "WABA ID",
//     whatsAppBusinessNumber: "+919012345678",
//     senderDisplayName: "Display name shown to recipients",
//     webhookSecret: "Optional signing secret (if provider supports)",
//     webhookVerifyToken: "Optional verify token for webhook setup",
//     webhookCallbackUrl: "Public HTTPS endpoint for webhook callbacks",
//   };

//   const labels = {
//     provider: "Provider",
//     apiUrl: "API URL",
//     apiKey: "API Key",
//     apiToken: "API Token",
//     phoneNumberId: "Phone Number ID",
//     wabaId: "WABA ID",
//     whatsAppBusinessNumber: "WhatsApp Business Number",
//     senderDisplayName: "Sender Display Name",
//     webhookSecret: "Webhook Secret (optional)",
//     webhookVerifyToken: "Webhook Verify Token (optional)",
//     webhookCallbackUrl: "Webhook Callback URL",
//     isActive: "Is Active",
//   };

//   return (
//     <div className="min-h-screen flex items-start justify-center bg-gray-50 px-0 pt-2">
//       <form
//         onSubmit={e => {
//           e.preventDefault();
//           handleSave();
//         }}
//         className="bg-white shadow-sm border rounded-md w-full max-w-4xl p-4 md:p-6 hover:shadow-md transition"
//       >
//         <div className="flex items-center gap-2 mb-6">
//           <img
//             src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
//             alt="WhatsApp"
//             className="w-6 h-6"
//           />
//           <h2 className="text-lg font-bold text-green-600">
//             WhatsApp API Settings
//           </h2>
//         </div>

//         <p className="text-xs text-gray-500 mb-4">
//           ⚠️ Either <strong>API Key</strong> or <strong>API Token</strong> must
//           be provided. Both cannot be empty.
//         </p>

//         {/* Provider */}
//         <div className="mb-4">
//           <label
//             className="text-xs font-medium text-gray-600 block mb-1"
//             htmlFor="provider"
//           >
//             {labels.provider}
//           </label>
//           <select
//             id="provider"
//             name="provider"
//             value={formData.provider}
//             onChange={onChange}
//             className="w-full px-3 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 border-gray-300"
//           >
//             {PROVIDERS.map(p => (
//               <option key={p.value} value={p.value}>
//                 {p.label}
//               </option>
//             ))}
//           </select>
//         </div>

//         {/* Dynamic fields */}
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
//           {[
//             "apiUrl",
//             "apiKey",
//             "apiToken",
//             "phoneNumberId",
//             "wabaId",
//             "whatsAppBusinessNumber",
//             "senderDisplayName",
//             "webhookSecret",
//             "webhookVerifyToken",
//             "webhookCallbackUrl",
//           ]
//             .filter(showField)
//             .map(key => (
//               <div key={key}>
//                 <label
//                   htmlFor={key}
//                   className="text-xs font-medium text-gray-600 block mb-1"
//                 >
//                   {labels[key]}
//                 </label>
//                 {key === "apiToken" ? (
//                   <textarea
//                     id={key}
//                     name={key}
//                     rows={3}
//                     value={formData[key] || ""}
//                     onChange={onChange}
//                     placeholder={placeholders[key]}
//                     className="w-full px-3 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 border-gray-300 resize-none"
//                   />
//                 ) : (
//                   <input
//                     id={key}
//                     type="text"
//                     name={key}
//                     value={formData[key] || ""}
//                     onChange={onChange}
//                     placeholder={placeholders[key]}
//                     className="w-full px-3 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 border-gray-300"
//                   />
//                 )}
//               </div>
//             ))}

//           <div className="flex items-center gap-2 mt-2">
//             <input
//               type="checkbox"
//               name="isActive"
//               checked={formData.isActive}
//               onChange={onChange}
//               className="w-4 h-4"
//             />
//             <label className="text-sm font-medium text-gray-700">
//               {labels.isActive}
//             </label>
//           </div>
//         </div>

//         {validationErrors.length > 0 && (
//           <div className="mt-4 text-sm text-red-600">
//             ⚠️ {validationErrors[0]}
//           </div>
//         )}

//         {/* <div className="pt-6 border-t mt-6 flex flex-col md:flex-row gap-4 justify-end">
//           <button
//             type="submit"
//             disabled={loading}
//             className={`px-4 py-2 rounded-md text-white text-sm font-medium ${
//               loading ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"
//             }`}
//           >
//             {loading ? "Saving..." : "💾 Save Settings"}
//           </button>
//         </div> */}

//         {testResult && (
//           <div
//             className={`mt-4 text-center font-semibold ${
//               testResult.startsWith("✅") ? "text-green-600" : "text-red-600"
//             }`}
//           >
//             {testResult}
//           </div>
//         )}
//       </form>
//     </div>
//   );
// }

// // src/pages/Settings/WhatsAppSettings.jsx
// import React, { useState, useEffect, useMemo } from "react";
// import axiosClient from "../../api/axiosClient";
// import { toast } from "react-toastify";

// // Canonical provider values (MUST match backend)
// const PROVIDERS = [
//   { value: "Pinnacle", label: "Pinnacle (Official)" },
//   { value: "Meta_cloud", label: "Meta Cloud API" },
// ];

// // Map legacy/lowercase to canonical
// const normalizeProvider = p => {
//   if (!p) return "Pinnacle";
//   const raw = String(p).trim();
//   if (raw === "Pinnacle" || raw === "Meta_cloud") return raw;

//   const lower = raw.toLowerCase();
//   if (["pinnacle", "pinbot", "pinnacle (official)"].includes(lower))
//     return "Pinnacle";
//   if (["meta_cloud", "meta cloud", "meta", "meta-cloud"].includes(lower))
//     return "Meta_cloud";
//   return "Pinnacle";
// };

// export default function WhatsAppSettings() {
//   const [formData, setFormData] = useState({
//     provider: "Pinnacle",
//     apiUrl: "",
//     apiKey: "",
//     apiToken: "",
//     phoneNumberId: "",
//     wabaId: "",
//     whatsAppBusinessNumber: "",
//     senderDisplayName: "",
//     webhookSecret: "",
//     webhookVerifyToken: "",
//     webhookCallbackUrl: "",
//     isActive: true,
//   });

//   const [loading, setLoading] = useState(false);
//   const [testing, setTesting] = useState(false);
//   const [deleting, setDeleting] = useState(false);
//   const [testResult, setTestResult] = useState("");

//   useEffect(() => {
//     (async () => {
//       try {
//         const { data } = await axiosClient.get("/whatsappsettings/me");
//         if (data) {
//           setFormData(prev => ({
//             ...prev,
//             provider: normalizeProvider(data.provider) || prev.provider,
//             apiUrl: data.apiUrl || "",
//             apiKey: data.apiKey || "",
//             apiToken: data.apiToken || "",
//             phoneNumberId: data.phoneNumberId || "",
//             wabaId: data.wabaId || "",
//             whatsAppBusinessNumber: data.whatsAppBusinessNumber || "",
//             senderDisplayName: data.senderDisplayName || "",
//             webhookSecret: data.webhookSecret || "",
//             webhookVerifyToken: data.webhookVerifyToken || "",
//             webhookCallbackUrl: data.webhookCallbackUrl || "",
//             isActive: data.isActive ?? true,
//           }));
//         }
//       } catch {
//         toast.info("ℹ️ No WhatsApp settings found. You can create them now.");
//       }
//     })();
//   }, []);

//   const onChange = e => {
//     const { name, value, type, checked } = e.target;
//     setFormData(f => ({
//       ...f,
//       [name]:
//         name === "provider"
//           ? normalizeProvider(value)
//           : type === "checkbox"
//           ? checked
//           : value,
//     }));
//   };

//   // Validation
//   const validationErrors = useMemo(() => {
//     const f = formData;
//     const errors = [];

//     if (!f.apiUrl.trim()) errors.push("API URL is required.");

//     if (f.provider === "Meta_cloud") {
//       if (!f.apiToken.trim())
//         errors.push("API Token is required for Meta Cloud.");
//       if (!f.phoneNumberId.trim())
//         errors.push("Phone Number ID is required for Meta Cloud.");
//     }

//     if (f.provider === "Pinnacle") {
//       if (!f.apiKey.trim()) errors.push("API Key is required for Pinnacle.");
//       if (!f.phoneNumberId.trim() && !f.wabaId.trim()) {
//         errors.push("Provide Phone Number ID or WABA ID for Pinnacle.");
//       }
//       if (!f.whatsAppBusinessNumber.trim()) {
//         errors.push("WhatsApp Business Number is required for Pinnacle.");
//       }
//       if (!f.webhookCallbackUrl.trim()) {
//         errors.push("Webhook Callback URL is required for Pinnacle.");
//       } else if (!/^https:\/\/.+/i.test(f.webhookCallbackUrl.trim())) {
//         errors.push("Webhook Callback URL must be a valid HTTPS URL.");
//       }
//     }

//     // 👇 NEW RULE: At least one credential required
//     if (!f.apiKey.trim() && !f.apiToken.trim()) {
//       errors.push("Either API Key or API Token must be provided.");
//     }

//     return errors;
//   }, [formData]);

//   const handleSave = async () => {
//     if (validationErrors.length) {
//       toast.warn("⚠️ Please fix the form: " + validationErrors[0]);
//       return;
//     }
//     setLoading(true);
//     try {
//       const tokenToSend =
//         formData.provider === "Pinnacle" && !formData.apiToken?.trim()
//           ? "-"
//           : formData.apiToken;

//       await axiosClient.put("/whatsappsettings/update", {
//         provider: formData.provider,
//         apiUrl: formData.apiUrl,
//         apiKey: formData.apiKey,
//         apiToken: tokenToSend,
//         phoneNumberId: formData.phoneNumberId,
//         wabaId: formData.wabaId,
//         whatsAppBusinessNumber: formData.whatsAppBusinessNumber,
//         senderDisplayName: formData.senderDisplayName,
//         webhookSecret: formData.webhookSecret,
//         webhookVerifyToken: formData.webhookVerifyToken,
//         webhookCallbackUrl: formData.webhookCallbackUrl,
//         isActive: formData.isActive,
//       });
//       toast.success("✅ WhatsApp settings saved.");
//       setTestResult("");
//     } catch (err) {
//       console.error("Save failed:", err);
//       toast.error(err.response?.data?.message || "❌ Failed to save settings.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // UI config
//   const showField = key => {
//     const p = formData.provider;
//     const common = [
//       "apiUrl",
//       "senderDisplayName",
//       "whatsAppBusinessNumber",
//       "webhookSecret",
//       "webhookVerifyToken",
//       "webhookCallbackUrl",
//       "isActive",
//     ];
//     const pinnacleOnly = ["apiKey", "phoneNumberId", "wabaId"];
//     const metaOnly = ["apiToken", "phoneNumberId"];

//     if (common.includes(key)) return true;
//     if (p === "Pinnacle" && pinnacleOnly.includes(key)) return true;
//     if (p === "Meta_cloud" && metaOnly.includes(key)) return true;
//     return false;
//   };

//   const placeholders = {
//     apiUrl: " https://graph.facebook.com/v18.0",
//     apiKey: "API Key (fill this OR API Token)",
//     apiToken: "API Token (fill this OR API Key)",
//     phoneNumberId: "Phone Number ID",
//     wabaId: "WABA ID",
//     whatsAppBusinessNumber: "+919012345678",
//     senderDisplayName: "Display name shown to recipients",
//     webhookSecret: "Optional signing secret (if provider supports)",
//     webhookVerifyToken: "Optional verify token for webhook setup",
//     webhookCallbackUrl: "Public HTTPS endpoint for webhook callbacks",
//   };

//   const labels = {
//     provider: "Provider",
//     apiUrl: "API URL",
//     apiKey: "API Key",
//     apiToken: "API Token",
//     phoneNumberId: "Phone Number ID",
//     wabaId: "WABA ID",
//     whatsAppBusinessNumber: "WhatsApp Business Number",
//     senderDisplayName: "Sender Display Name",
//     webhookSecret: "Webhook Secret (optional)",
//     webhookVerifyToken: "Webhook Verify Token (optional)",
//     webhookCallbackUrl: "Webhook Callback URL",
//     isActive: "Is Active",
//   };

//   return (
//     <div className="min-h-screen flex items-start justify-center bg-gray-50 px-0 pt-2">
//       <form
//         onSubmit={e => {
//           e.preventDefault();
//           handleSave();
//         }}
//         className="bg-white shadow-sm border rounded-md w-full max-w-4xl p-4 md:p-6 hover:shadow-md transition"
//       >
//         <div className="flex items-center gap-2 mb-6">
//           <img
//             src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
//             alt="WhatsApp"
//             className="w-6 h-6"
//           />
//           <h2 className="text-lg font-bold text-green-600">
//             WhatsApp API Settings
//           </h2>
//         </div>

//         <p className="text-xs text-gray-500 mb-4">
//           ⚠️ Either <strong>API Key</strong> or <strong>API Token</strong> must
//           be provided. Both cannot be empty.
//         </p>

//         {/* Provider */}
//         <div className="mb-4">
//           <label
//             className="text-xs font-medium text-gray-600 block mb-1"
//             htmlFor="provider"
//           >
//             {labels.provider}
//           </label>
//           <select
//             id="provider"
//             name="provider"
//             value={formData.provider}
//             onChange={onChange}
//             className="w-full px-3 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 border-gray-300"
//           >
//             {PROVIDERS.map(p => (
//               <option key={p.value} value={p.value}>
//                 {p.label}
//               </option>
//             ))}
//           </select>
//         </div>

//         {/* Dynamic fields */}
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
//           {[
//             "apiUrl",
//             "apiKey",
//             "apiToken",
//             "phoneNumberId",
//             "wabaId",
//             "whatsAppBusinessNumber",
//             "senderDisplayName",
//             "webhookSecret",
//             "webhookVerifyToken",
//             "webhookCallbackUrl",
//           ]
//             .filter(showField)
//             .map(key => (
//               <div key={key}>
//                 <label
//                   htmlFor={key}
//                   className="text-xs font-medium text-gray-600 block mb-1"
//                 >
//                   {labels[key]}
//                 </label>
//                 {key === "apiToken" ? (
//                   <textarea
//                     id={key}
//                     name={key}
//                     rows={3}
//                     value={formData[key] || ""}
//                     onChange={onChange}
//                     placeholder={placeholders[key]}
//                     className="w-full px-3 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 border-gray-300 resize-none"
//                   />
//                 ) : (
//                   <input
//                     id={key}
//                     type="text"
//                     name={key}
//                     value={formData[key] || ""}
//                     onChange={onChange}
//                     placeholder={placeholders[key]}
//                     className="w-full px-3 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 border-gray-300"
//                   />
//                 )}
//               </div>
//             ))}

//           <div className="flex items-center gap-2 mt-2">
//             <input
//               type="checkbox"
//               name="isActive"
//               checked={formData.isActive}
//               onChange={onChange}
//               className="w-4 h-4"
//             />
//             <label className="text-sm font-medium text-gray-700">
//               {labels.isActive}
//             </label>
//           </div>
//         </div>

//         {validationErrors.length > 0 && (
//           <div className="mt-4 text-sm text-red-600">
//             ⚠️ {validationErrors[0]}
//           </div>
//         )}

//         <div className="pt-6 border-t mt-6 flex flex-col md:flex-row gap-4 justify-end">
//           <button
//             type="submit"
//             disabled={loading}
//             className={`px-4 py-2 rounded-md text-white text-sm font-medium ${
//               loading ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"
//             }`}
//           >
//             {loading ? "Saving..." : "💾 Save Settings"}
//           </button>
//         </div>

//         {testResult && (
//           <div
//             className={`mt-4 text-center font-semibold ${
//               testResult.startsWith("✅") ? "text-green-600" : "text-red-600"
//             }`}
//           >
//             {testResult}
//           </div>
//         )}
//       </form>
//     </div>
//   );
// }

// src/pages/Settings/WhatsAppSettings.jsx
// import React, { useState, useEffect, useMemo } from "react";
// import axiosClient from "../../api/axiosClient";
// import { toast } from "react-toastify";

// // Canonical provider values (MUST match backend)
// const PROVIDERS = [
//   { value: "Pinnacle", label: "Pinnacle (Official)" },
//   { value: "Meta_cloud", label: "Meta Cloud API" },
// ];

// // Map legacy/lowercase to canonical
// const normalizeProvider = p => {
//   if (!p) return "Pinnacle";
//   const raw = String(p).trim();
//   if (raw === "Pinnacle" || raw === "Meta_cloud") return raw;

//   const lower = raw.toLowerCase();
//   if (["pinnacle", "pinbot", "pinnacle (official)"].includes(lower))
//     return "Pinnacle";
//   if (["meta_cloud", "meta cloud", "meta", "meta-cloud"].includes(lower))
//     return "Meta_cloud";
//   return "Pinnacle";
// };

// export default function WhatsAppSettings() {
//   const [formData, setFormData] = useState({
//     provider: "Pinnacle", // default canonical
//     apiUrl: "",
//     apiKey: "",
//     apiToken: "",
//     phoneNumberId: "",
//     wabaId: "",
//     whatsAppBusinessNumber: "",
//     senderDisplayName: "",
//     webhookSecret: "",
//     webhookVerifyToken: "",
//     isActive: true,
//   });

//   const [loading, setLoading] = useState(false);
//   const [testing, setTesting] = useState(false);
//   const [deleting, setDeleting] = useState(false);
//   const [testResult, setTestResult] = useState("");

//   useEffect(() => {
//     (async () => {
//       try {
//         const { data } = await axiosClient.get("/whatsappsettings/me");
//         if (data) {
//           setFormData(prev => ({
//             ...prev,
//             provider: normalizeProvider(data.provider) || prev.provider,
//             apiUrl: data.apiUrl || "",
//             apiKey: data.apiKey || "",
//             apiToken: data.apiToken || "",
//             phoneNumberId: data.phoneNumberId || "",
//             wabaId: data.wabaId || "",
//             whatsAppBusinessNumber: data.whatsAppBusinessNumber || "",
//             senderDisplayName: data.senderDisplayName || "",
//             webhookSecret: data.webhookSecret || "",
//             webhookVerifyToken: data.webhookVerifyToken || "",
//             isActive: data.isActive ?? true,
//           }));
//         }
//       } catch {
//         toast.info("ℹ️ No WhatsApp settings found. You can create them now.");
//       }
//     })();
//   }, []);

//   const onChange = e => {
//     const { name, value, type, checked } = e.target;
//     setFormData(f => ({
//       ...f,
//       [name]:
//         name === "provider"
//           ? normalizeProvider(value)
//           : type === "checkbox"
//           ? checked
//           : value,
//     }));
//   };

//   // Provider-aware validation
//   const validationErrors = useMemo(() => {
//     const f = formData;
//     const errors = [];
//     if (!f.apiUrl.trim()) errors.push("API URL is required.");

//     if (f.provider === "Meta_cloud") {
//       if (!f.apiToken.trim())
//         errors.push("API Token is required for Meta Cloud.");
//       if (!f.phoneNumberId.trim())
//         errors.push("Phone Number ID is required for Meta Cloud.");
//     }

//     if (f.provider === "Pinnacle") {
//       if (!f.apiKey.trim()) errors.push("API Key is required for Pinnacle.");
//       if (!f.phoneNumberId.trim() && !f.wabaId.trim()) {
//         errors.push("Provide Phone Number ID or WABA ID for Pinnacle.");
//       }
//       if (!f.whatsAppBusinessNumber.trim()) {
//         errors.push("WhatsApp Business Number is required for Pinnacle.");
//       }
//     }
//     return errors;
//   }, [formData]);

//   const handleSave = async () => {
//     if (validationErrors.length) {
//       toast.warn("⚠️ Please fix the form: " + validationErrors[0]);
//       return;
//     }
//     setLoading(true);
//     try {
//       // If backend still has [Required] on ApiToken, send a safe placeholder for Pinnacle
//       const tokenToSend =
//         formData.provider === "Pinnacle" && !formData.apiToken?.trim()
//           ? "-"
//           : formData.apiToken;

//       await axiosClient.put("/whatsappsettings/update", {
//         provider: formData.provider, // canonical
//         apiUrl: formData.apiUrl,
//         apiKey: formData.apiKey,
//         apiToken: tokenToSend,
//         phoneNumberId: formData.phoneNumberId,
//         wabaId: formData.wabaId,
//         whatsAppBusinessNumber: formData.whatsAppBusinessNumber,
//         senderDisplayName: formData.senderDisplayName,
//         webhookSecret: formData.webhookSecret,
//         webhookVerifyToken: formData.webhookVerifyToken,
//         isActive: formData.isActive,
//       });
//       toast.success("✅ WhatsApp settings saved.");
//       setTestResult("");
//     } catch (err) {
//       console.error("Save failed:", err);
//       toast.error(err.response?.data?.message || "❌ Failed to save settings.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleTestConnection = async () => {
//     const p = formData.provider; // already canonical
//     setTesting(true);
//     setTestResult("");

//     try {
//       if (p === "Meta_cloud") {
//         if (
//           !formData.apiUrl.trim() ||
//           !formData.apiToken.trim() ||
//           !formData.phoneNumberId.trim()
//         ) {
//           toast.warn(
//             "⚠️ API URL, Token, and Phone Number ID are required for Meta Cloud."
//           );
//           return;
//         }

//         const { data } = await axiosClient.post(
//           "/whatsappsettings/test-connection",
//           {
//             provider: "Meta_cloud",
//             apiUrl: formData.apiUrl,
//             apiToken: formData.apiToken,
//             phoneNumberId: formData.phoneNumberId,
//           }
//         );

//         toast.success(data?.message || "✅ Connection successful!");
//         setTestResult("✅ " + (data?.message || "Connection successful!"));
//         return;
//       }

//       if (p === "Pinnacle") {
//         if (!formData.apiUrl.trim() || !formData.apiKey.trim()) {
//           toast.warn("⚠️ API URL and API Key are required for Pinnacle.");
//           return;
//         }
//         if (!formData.phoneNumberId.trim() && !formData.wabaId.trim()) {
//           toast.warn("⚠️ Provide Phone Number ID or WABA ID for Pinnacle.");
//           return;
//         }
//         if (!formData.whatsAppBusinessNumber.trim()) {
//           toast.warn("⚠️ WhatsApp Business Number is required.");
//           return;
//         }

//         const { data } = await axiosClient.post(
//           "/whatsappsettings/test-connection",
//           {
//             provider: "Pinnacle",
//             apiUrl: formData.apiUrl,
//             apiKey: formData.apiKey,
//             // server resolves path with phoneNumberId if present, else wabaId
//             phoneNumberId: formData.phoneNumberId || undefined,
//             wabaId: formData.wabaId || undefined,
//             // used by server to send a small probe text
//             whatsAppBusinessNumber: formData.whatsAppBusinessNumber,
//           }
//         );

//         toast.success(data?.message || "✅ Connection successful!");
//         setTestResult("✅ " + (data?.message || "Connection successful!"));
//         return;
//       }

//       toast.info("ℹ️ Unsupported provider.");
//     } catch (err) {
//       const msg = err.response?.data?.message || "❌ Connection test failed.";
//       toast.error(msg);
//       setTestResult("❌ " + msg);
//     } finally {
//       setTesting(false);
//     }
//   };

//   const handleDelete = async () => {
//     if (
//       !window.confirm(
//         "⚠️ Are you sure you want to delete your WhatsApp settings?"
//       )
//     )
//       return;
//     setDeleting(true);
//     try {
//       await axiosClient.delete("/whatsappsettings/delete");
//       toast.success("🗑️ WhatsApp settings deleted.");
//       setFormData({
//         provider: "Pinnacle",
//         apiUrl: "",
//         apiKey: "",
//         apiToken: "",
//         phoneNumberId: "",
//         wabaId: "",
//         whatsAppBusinessNumber: "",
//         senderDisplayName: "",
//         webhookSecret: "",
//         webhookVerifyToken: "",
//         isActive: true,
//       });
//       setTestResult("");
//     } catch (err) {
//       toast.error(
//         err.response?.data?.message || "❌ Failed to delete settings."
//       );
//     } finally {
//       setDeleting(false);
//     }
//   };

//   const showField = key => {
//     const p = formData.provider;
//     const common = [
//       "apiUrl",
//       "senderDisplayName",
//       "whatsAppBusinessNumber",
//       "webhookSecret",
//       "webhookVerifyToken",
//       "isActive",
//     ];
//     const pinnacleOnly = ["apiKey", "phoneNumberId", "wabaId"];
//     const metaOnly = ["apiToken", "phoneNumberId"];

//     if (common.includes(key)) return true;
//     if (p === "Pinnacle" && pinnacleOnly.includes(key)) return true;
//     if (p === "Meta_cloud" && metaOnly.includes(key)) return true;
//     return false;
//   };

//   const placeholders = {
//     apiUrl:
//       "https://partnersv1.pinbot.ai  or  https://graph.facebook.com/v18.0",
//     apiKey: "Pinnacle API Key (e.g. 68bd0be4-... )",
//     apiToken: "Meta Cloud permanent/long-lived access token",
//     phoneNumberId: "Phone Number ID (Meta/Pinnacle) e.g. 1234567890",
//     wabaId: "WABA ID (Meta/Pinnacle) e.g. 123456789012345",
//     whatsAppBusinessNumber: "+14150000001",
//     senderDisplayName: "Display name shown to recipients",
//     webhookSecret: "Optional signing secret (if provider supports)",
//     webhookVerifyToken: "Optional verify token for webhook setup",
//   };

//   const labels = {
//     provider: "Provider",
//     apiUrl: "API URL",
//     apiKey: "API Key",
//     apiToken: "API Token",
//     phoneNumberId: "Phone Number ID",
//     wabaId: "WABA ID",
//     whatsAppBusinessNumber: "WhatsApp Business Number",
//     senderDisplayName: "Sender Display Name",
//     webhookSecret: "Webhook Secret (optional)",
//     webhookVerifyToken: "Webhook Verify Token (optional)",
//     isActive: "Is Active",
//   };

//   return (
//     <div className="min-h-screen flex items-start justify-center bg-gray-50 px-0 pt-2">
//       <form
//         onSubmit={e => {
//           e.preventDefault();
//           handleSave();
//         }}
//         className="bg-white shadow-sm border rounded-md w-full max-w-4xl p-4 md:p-6 hover:shadow-md transition"
//       >
//         <div className="flex items-center gap-2 mb-6">
//           <img
//             src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
//             alt="WhatsApp"
//             className="w-6 h-6"
//           />
//           <h2 className="text-lg font-bold text-green-600">
//             WhatsApp API Settings
//           </h2>
//         </div>

//         {/* Provider */}
//         <div className="mb-4">
//           <label
//             className="text-xs font-medium text-gray-600 block mb-1"
//             htmlFor="provider"
//           >
//             {labels.provider}
//           </label>
//           <select
//             id="provider"
//             name="provider"
//             value={formData.provider}
//             onChange={onChange}
//             className="w-full px-3 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 border-gray-300"
//           >
//             {PROVIDERS.map(p => (
//               <option key={p.value} value={p.value}>
//                 {p.label}
//               </option>
//             ))}
//           </select>
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
//           {[
//             "apiUrl",
//             "apiKey",
//             "apiToken",
//             "phoneNumberId",
//             "wabaId",
//             "whatsAppBusinessNumber",
//             "senderDisplayName",
//             "webhookSecret",
//             "webhookVerifyToken",
//           ]
//             .filter(showField)
//             .map(key => (
//               <div key={key}>
//                 <label
//                   htmlFor={key}
//                   className="text-xs font-medium text-gray-600 block mb-1"
//                 >
//                   {labels[key]}
//                 </label>
//                 {key === "apiToken" ? (
//                   <textarea
//                     id={key}
//                     name={key}
//                     rows={3}
//                     value={formData[key] || ""}
//                     onChange={onChange}
//                     placeholder={placeholders[key]}
//                     className="w-full px-3 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 border-gray-300 resize-none"
//                   />
//                 ) : (
//                   <input
//                     id={key}
//                     type="text"
//                     name={key}
//                     value={formData[key] || ""}
//                     onChange={onChange}
//                     placeholder={placeholders[key]}
//                     className="w-full px-3 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 border-gray-300"
//                   />
//                 )}
//               </div>
//             ))}

//           <div className="flex items-center gap-2 mt-2">
//             <input
//               type="checkbox"
//               name="isActive"
//               checked={formData.isActive}
//               onChange={onChange}
//               className="w-4 h-4"
//             />
//             <label className="text-sm font-medium text-gray-700">
//               {labels.isActive}
//             </label>
//           </div>
//         </div>

//         {validationErrors.length > 0 && (
//           <div className="mt-4 text-sm text-red-600">
//             ⚠️ {validationErrors[0]}
//           </div>
//         )}

//         <div className="pt-6 border-t mt-6 flex flex-col md:flex-row gap-4 justify-end">
//           <button
//             type="submit"
//             disabled={loading}
//             className={`px-4 py-2 rounded-md text-white text-sm font-medium ${
//               loading ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"
//             }`}
//           >
//             {loading ? "Saving..." : "💾 Save Settings"}
//           </button>

//           <button
//             type="button"
//             onClick={handleTestConnection}
//             disabled={testing}
//             className={`px-4 py-2 rounded-md text-white text-sm font-medium ${
//               testing ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
//             }`}
//           >
//             {testing ? "Testing..." : "🔄 Test Connection"}
//           </button>

//           <button
//             type="button"
//             onClick={handleDelete}
//             disabled={deleting}
//             className={`px-4 py-2 rounded-md text-white text-sm font-medium ${
//               deleting ? "bg-gray-400" : "bg-red-600 hover:bg-red-700"
//             }`}
//           >
//             {deleting ? "Deleting..." : "🗑 Delete Settings"}
//           </button>
//         </div>

//         {testResult && (
//           <div
//             className={`mt-4 text-center font-semibold ${
//               testResult.startsWith("✅") ? "text-green-600" : "text-red-600"
//             }`}
//           >
//             {testResult}
//           </div>
//         )}
//       </form>
//     </div>
//   );
// }

// // src/pages/Settings/WhatsAppSettings.jsx
// import React, { useState, useEffect, useMemo } from "react";
// import axiosClient from "../../api/axiosClient";
// import { toast } from "react-toastify";

// const PROVIDERS = [
//   { value: "pinbot", label: "Pinbot (Pinnacle)" },
//   { value: "meta_cloud", label: "Meta Cloud API" },
// ];

// export default function WhatsAppSettings() {
//   const [formData, setFormData] = useState({
//     provider: "pinbot",
//     apiUrl: "",
//     apiKey: "",
//     apiToken: "",
//     phoneNumberId: "",
//     wabaId: "",
//     whatsAppBusinessNumber: "",
//     senderDisplayName: "",
//     webhookSecret: "",
//     webhookVerifyToken: "",
//     isActive: true,
//   });

//   const [loading, setLoading] = useState(false);
//   const [testing, setTesting] = useState(false);
//   const [deleting, setDeleting] = useState(false);
//   const [testResult, setTestResult] = useState("");

//   useEffect(() => {
//     (async () => {
//       try {
//         const { data } = await axiosClient.get("/whatsappsettings/me");
//         if (data) {
//           setFormData(prev => ({
//             ...prev,
//             provider: data.provider || prev.provider,
//             apiUrl: data.apiUrl || "",
//             apiKey: data.apiKey || "",
//             apiToken: data.apiToken || "",
//             phoneNumberId: data.phoneNumberId || "",
//             wabaId: data.wabaId || "",
//             whatsAppBusinessNumber: data.whatsAppBusinessNumber || "",
//             senderDisplayName: data.senderDisplayName || "",
//             webhookSecret: data.webhookSecret || "",
//             webhookVerifyToken: data.webhookVerifyToken || "",
//             isActive: data.isActive ?? true,
//           }));
//         }
//       } catch {
//         toast.info("ℹ️ No WhatsApp settings found. You can create them now.");
//       }
//     })();
//   }, []);

//   const onChange = e => {
//     const { name, value, type, checked } = e.target;
//     setFormData(f => ({ ...f, [name]: type === "checkbox" ? checked : value }));
//   };

//   // Provider-aware validation
//   const validationErrors = useMemo(() => {
//     const f = formData;
//     const errors = [];
//     if (!f.apiUrl.trim()) errors.push("API URL is required.");

//     if (f.provider === "meta_cloud") {
//       if (!f.apiToken.trim())
//         errors.push("API Token is required for Meta Cloud.");
//       if (!f.phoneNumberId.trim())
//         errors.push("Phone Number ID is required for Meta Cloud.");
//     }

//     if (f.provider === "pinbot") {
//       if (!f.apiKey.trim()) errors.push("API Key is required for Pinbot.");
//       if (!f.phoneNumberId.trim() && !f.wabaId.trim()) {
//         errors.push("Provide Phone Number ID or WABA ID for Pinbot.");
//       }
//       // Business number is strongly recommended for Pinbot send/test flows
//       if (!f.whatsAppBusinessNumber.trim()) {
//         errors.push("WhatsApp Business Number is recommended for Pinbot.");
//       }
//     }
//     return errors;
//   }, [formData]);

//   const handleSave = async () => {
//     if (validationErrors.length) {
//       toast.warn("⚠️ Please fix the form: " + validationErrors[0]);
//       return;
//     }
//     setLoading(true);
//     try {
//       await axiosClient.put("/whatsappsettings/update", {
//         provider: formData.provider,
//         apiUrl: formData.apiUrl,
//         apiKey: formData.apiKey,
//         apiToken: formData.apiToken,
//         phoneNumberId: formData.phoneNumberId,
//         wabaId: formData.wabaId,
//         whatsAppBusinessNumber: formData.whatsAppBusinessNumber,
//         senderDisplayName: formData.senderDisplayName,
//         webhookSecret: formData.webhookSecret,
//         webhookVerifyToken: formData.webhookVerifyToken,
//         isActive: formData.isActive,
//       });
//       toast.success("✅ WhatsApp settings saved.");
//       setTestResult("");
//     } catch (err) {
//       console.error("Save failed:", err);
//       toast.error(err.response?.data?.message || "❌ Failed to save settings.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleTestConnection = async () => {
//     const p = formData.provider;
//     setTesting(true);
//     setTestResult("");

//     try {
//       if (p === "meta_cloud") {
//         // Validate
//         if (
//           !formData.apiUrl.trim() ||
//           !formData.apiToken.trim() ||
//           !formData.phoneNumberId.trim()
//         ) {
//           toast.warn(
//             "⚠️ API URL, Token, and Phone Number ID are required for Meta Cloud."
//           );
//           return;
//         }

//         const { data } = await axiosClient.post(
//           "/whatsappsettings/test-connection",
//           {
//             provider: "meta_cloud",
//             apiUrl: formData.apiUrl,
//             apiToken: formData.apiToken,
//             phoneNumberId: formData.phoneNumberId,
//           }
//         );

//         toast.success(data?.message || "✅ Connection successful!");
//         setTestResult("✅ " + (data?.message || "Connection successful!"));
//         return;
//       }

//       if (p === "pinbot") {
//         // Validate
//         if (!formData.apiUrl.trim() || !formData.apiKey.trim()) {
//           toast.warn("⚠️ API URL and API Key are required for Pinbot.");
//           return;
//         }
//         if (!formData.phoneNumberId.trim() && !formData.wabaId.trim()) {
//           toast.warn("⚠️ Provide Phone Number ID or WABA ID for Pinbot.");
//           return;
//         }
//         if (!formData.whatsAppBusinessNumber.trim()) {
//           toast.warn(
//             "⚠️ WhatsApp Business Number is required to send a probe message for Pinbot."
//           );
//           return;
//         }

//         const { data } = await axiosClient.post(
//           "/whatsappsettings/test-connection",
//           {
//             provider: "pinbot",
//             apiUrl: formData.apiUrl,
//             apiKey: formData.apiKey,
//             // Server will resolve path with phoneNumberId if present, else wabaId
//             phoneNumberId: formData.phoneNumberId || undefined,
//             wabaId: formData.wabaId || undefined,
//             // 👇 used by the server to send a small probe text ("Test message")
//             whatsAppBusinessNumber: formData.whatsAppBusinessNumber,
//           }
//         );

//         toast.success(data?.message || "✅ Connection successful!");
//         setTestResult("✅ " + (data?.message || "Connection successful!"));
//         return;
//       }

//       toast.info("ℹ️ Unsupported provider.");
//     } catch (err) {
//       const msg = err.response?.data?.message || "❌ Connection test failed.";
//       toast.error(msg);
//       setTestResult("❌ " + msg);
//     } finally {
//       setTesting(false);
//     }
//   };

//   const handleDelete = async () => {
//     if (
//       !window.confirm(
//         "⚠️ Are you sure you want to delete your WhatsApp settings?"
//       )
//     )
//       return;
//     setDeleting(true);
//     try {
//       await axiosClient.delete("/whatsappsettings/delete");
//       toast.success("🗑️ WhatsApp settings deleted.");
//       setFormData({
//         provider: "pinbot",
//         apiUrl: "",
//         apiKey: "",
//         apiToken: "",
//         phoneNumberId: "",
//         wabaId: "",
//         whatsAppBusinessNumber: "",
//         senderDisplayName: "",
//         webhookSecret: "",
//         webhookVerifyToken: "",
//         isActive: true,
//       });
//       setTestResult("");
//     } catch (err) {
//       toast.error(
//         err.response?.data?.message || "❌ Failed to delete settings."
//       );
//     } finally {
//       setDeleting(false);
//     }
//   };

//   const showField = key => {
//     const p = formData.provider;
//     const common = [
//       "apiUrl",
//       "senderDisplayName",
//       "whatsAppBusinessNumber",
//       "webhookSecret",
//       "webhookVerifyToken",
//       "isActive",
//     ];
//     const pinbotOnly = ["apiKey", "wabaId"];
//     const metaOnly = ["apiToken", "phoneNumberId"];
//     if (common.includes(key)) return true;
//     if (p === "pinbot" && pinbotOnly.includes(key)) return true;
//     if (p === "meta_cloud" && metaOnly.includes(key)) return true;
//     return false;
//   };

//   const placeholders = {
//     apiUrl:
//       "https://partnersv1.pinbot.ai  or  https://graph.facebook.com/v18.0",
//     apiKey: "Pinbot API Key (e.g. 68bd0be4-... )",
//     apiToken: "Meta Cloud permanent/long-lived access token",
//     phoneNumberId: "Meta phone number ID (e.g. 1234567890)",
//     wabaId: "WABA ID (Pinbot/Meta) e.g. 123456789012345",
//     whatsAppBusinessNumber: "+14150000001",
//     senderDisplayName: "Display name shown to recipients",
//     webhookSecret: "Optional signing secret (if provider supports)",
//     webhookVerifyToken: "Optional verify token for webhook setup",
//   };

//   const labels = {
//     provider: "Provider",
//     apiUrl: "API URL",
//     apiKey: "API Key",
//     apiToken: "API Token",
//     phoneNumberId: "Phone Number ID",
//     wabaId: "WABA ID",
//     whatsAppBusinessNumber: "WhatsApp Business Number",
//     senderDisplayName: "Sender Display Name",
//     webhookSecret: "Webhook Secret (optional)",
//     webhookVerifyToken: "Webhook Verify Token (optional)",
//     isActive: "Is Active",
//   };

//   return (
//     <div className="min-h-screen flex items-start justify-center bg-gray-50 px-0 pt-2">
//       <form
//         onSubmit={e => {
//           e.preventDefault();
//           handleSave();
//         }}
//         className="bg-white shadow-sm border rounded-md w-full max-w-4xl p-4 md:p-6 hover:shadow-md transition"
//       >
//         <div className="flex items-center gap-2 mb-6">
//           <img
//             src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
//             alt="WhatsApp"
//             className="w-6 h-6"
//           />
//           <h2 className="text-lg font-bold text-green-600">
//             WhatsApp API Settings
//           </h2>
//         </div>

//         {/* Provider */}
//         <div className="mb-4">
//           <label
//             className="text-xs font-medium text-gray-600 block mb-1"
//             htmlFor="provider"
//           >
//             {labels.provider}
//           </label>
//           <select
//             id="provider"
//             name="provider"
//             value={formData.provider}
//             onChange={onChange}
//             className="w-full px-3 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 border-gray-300"
//           >
//             {PROVIDERS.map(p => (
//               <option key={p.value} value={p.value}>
//                 {p.label}
//               </option>
//             ))}
//           </select>
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
//           {[
//             "apiUrl",
//             "apiKey",
//             "apiToken",
//             "phoneNumberId",
//             "wabaId",
//             "whatsAppBusinessNumber",
//             "senderDisplayName",
//             "webhookSecret",
//             "webhookVerifyToken",
//           ]
//             .filter(showField)
//             .map(key => (
//               <div key={key}>
//                 <label
//                   htmlFor={key}
//                   className="text-xs font-medium text-gray-600 block mb-1"
//                 >
//                   {labels[key]}
//                 </label>
//                 {key === "apiToken" ? (
//                   <textarea
//                     id={key}
//                     name={key}
//                     rows={3}
//                     value={formData[key] || ""}
//                     onChange={onChange}
//                     placeholder={placeholders[key]}
//                     className="w-full px-3 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 border-gray-300 resize-none"
//                   />
//                 ) : (
//                   <input
//                     id={key}
//                     type="text"
//                     name={key}
//                     value={formData[key] || ""}
//                     onChange={onChange}
//                     placeholder={placeholders[key]}
//                     className="w-full px-3 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 border-gray-300"
//                   />
//                 )}
//               </div>
//             ))}

//           <div className="flex items-center gap-2 mt-2">
//             <input
//               type="checkbox"
//               name="isActive"
//               checked={formData.isActive}
//               onChange={onChange}
//               className="w-4 h-4"
//             />
//             <label className="text-sm font-medium text-gray-700">
//               {labels.isActive}
//             </label>
//           </div>
//         </div>

//         {validationErrors.length > 0 && (
//           <div className="mt-4 text-sm text-red-600">
//             ⚠️ {validationErrors[0]}
//           </div>
//         )}

//         <div className="pt-6 border-t mt-6 flex flex-col md:flex-row gap-4 justify-end">
//           <button
//             type="submit"
//             disabled={loading}
//             className={`px-4 py-2 rounded-md text-white text-sm font-medium ${
//               loading ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"
//             }`}
//           >
//             {loading ? "Saving..." : "💾 Save Settings"}
//           </button>

//           <button
//             type="button"
//             onClick={handleTestConnection}
//             disabled={testing}
//             className={`px-4 py-2 rounded-md text-white text-sm font-medium ${
//               testing ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
//             }`}
//           >
//             {testing ? "Testing..." : "🔄 Test Connection"}
//           </button>

//           <button
//             type="button"
//             onClick={handleDelete}
//             disabled={deleting}
//             className={`px-4 py-2 rounded-md text-white text-sm font-medium ${
//               deleting ? "bg-gray-400" : "bg-red-600 hover:bg-red-700"
//             }`}
//           >
//             {deleting ? "Deleting..." : "🗑 Delete Settings"}
//           </button>
//         </div>

//         {testResult && (
//           <div
//             className={`mt-4 text-center font-semibold ${
//               testResult.startsWith("✅") ? "text-green-600" : "text-red-600"
//             }`}
//           >
//             {testResult}
//           </div>
//         )}
//       </form>
//     </div>
//   );
// }

// // src/pages/Settings/WhatsAppSettings.jsx
// import React, { useState, useEffect, useMemo } from "react";
// import axiosClient from "../../api/axiosClient";
// import { toast } from "react-toastify";

// const PROVIDERS = [
//   { value: "pinbot", label: "Pinbot (Pinnacle)" },
//   { value: "meta_cloud", label: "Meta Cloud API" },
// ];

// export default function WhatsAppSettings() {
//   const [formData, setFormData] = useState({
//     provider: "pinbot",
//     apiUrl: "",
//     apiKey: "",
//     apiToken: "",
//     phoneNumberId: "",
//     wabaId: "",
//     whatsAppBusinessNumber: "",
//     senderDisplayName: "",
//     webhookSecret: "",
//     webhookVerifyToken: "",
//     isActive: true,
//   });

//   const [loading, setLoading] = useState(false);
//   const [testing, setTesting] = useState(false);
//   const [deleting, setDeleting] = useState(false);
//   const [testResult, setTestResult] = useState("");

//   useEffect(() => {
//     (async () => {
//       try {
//         const { data } = await axiosClient.get("/whatsappsettings/me");
//         if (data) {
//           setFormData(prev => ({
//             ...prev,
//             provider: data.provider || prev.provider,
//             apiUrl: data.apiUrl || "",
//             apiKey: data.apiKey || "",
//             apiToken: data.apiToken || "",
//             phoneNumberId: data.phoneNumberId || "",
//             wabaId: data.wabaId || "",
//             whatsAppBusinessNumber: data.whatsAppBusinessNumber || "",
//             senderDisplayName: data.senderDisplayName || "",
//             webhookSecret: data.webhookSecret || "",
//             webhookVerifyToken: data.webhookVerifyToken || "",
//             isActive: data.isActive ?? true,
//           }));
//         }
//       } catch {
//         toast.info("ℹ️ No WhatsApp settings found. You can create them now.");
//       }
//     })();
//   }, []);

//   const onChange = e => {
//     const { name, value, type, checked } = e.target;
//     setFormData(f => ({ ...f, [name]: type === "checkbox" ? checked : value }));
//   };

//   // --- Provider-aware validation rules ---
//   const validationErrors = useMemo(() => {
//     const f = formData;
//     const errors = [];

//     if (!f.apiUrl.trim()) errors.push("API URL is required.");

//     if (f.provider === "meta_cloud") {
//       if (!f.apiToken.trim())
//         errors.push("API Token is required for Meta Cloud.");
//       if (!f.phoneNumberId.trim())
//         errors.push("Phone Number ID is required for Meta Cloud.");
//     }

//     if (f.provider === "pinbot") {
//       if (!f.apiKey.trim()) errors.push("API Key is required for Pinbot.");
//       if (!f.whatsAppBusinessNumber.trim())
//         errors.push("WhatsApp Business Number is recommended for Pinbot.");
//       if (!f.phoneNumberId.trim() && !f.wabaId.trim())
//         errors.push("Provide Phone Number ID or WABA ID for Pinbot.");
//     }

//     return errors;
//   }, [formData]);

//   const handleSave = async () => {
//     if (validationErrors.length) {
//       toast.warn("⚠️ Please fix the form: " + validationErrors[0]);
//       return;
//     }
//     setLoading(true);
//     try {
//       await axiosClient.put("/whatsappsettings/update", {
//         provider: formData.provider,
//         apiUrl: formData.apiUrl,
//         apiKey: formData.apiKey,
//         apiToken: formData.apiToken,
//         phoneNumberId: formData.phoneNumberId,
//         wabaId: formData.wabaId,
//         whatsAppBusinessNumber: formData.whatsAppBusinessNumber,
//         senderDisplayName: formData.senderDisplayName,
//         webhookSecret: formData.webhookSecret,
//         webhookVerifyToken: formData.webhookVerifyToken,
//         isActive: formData.isActive,
//       });
//       toast.success("✅ WhatsApp settings saved.");
//       setTestResult("");
//     } catch (err) {
//       console.error("Save failed:", err);
//       toast.error(err.response?.data?.message || "❌ Failed to save settings.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleTestConnection = async () => {
//     if (formData.provider !== "meta_cloud") {
//       toast.info(
//         "ℹ️ Test Connection currently targets Meta Cloud token/phone check."
//       );
//       return;
//     }
//     if (
//       !formData.apiUrl.trim() ||
//       !formData.apiToken.trim() ||
//       !formData.phoneNumberId.trim()
//     ) {
//       toast.warn(
//         "⚠️ API URL, Token, and Phone Number ID are required to test Meta Cloud."
//       );
//       return;
//     }
//     setTesting(true);
//     setTestResult("");
//     try {
//       const { data } = await axiosClient.post(
//         "/whatsappsettings/test-connection",
//         {
//           apiUrl: formData.apiUrl,
//           apiToken: formData.apiToken,
//           phoneNumberId: formData.phoneNumberId,
//         }
//       );
//       toast.success(data?.message || "✅ Connection successful!");
//       setTestResult("✅ " + (data?.message || "Connection successful!"));
//     } catch (err) {
//       const msg = err.response?.data?.message || "❌ Connection test failed.";
//       toast.error(msg);
//       setTestResult("❌ " + msg);
//     } finally {
//       setTesting(false);
//     }
//   };

//   const handleDelete = async () => {
//     if (
//       !window.confirm(
//         "⚠️ Are you sure you want to delete your WhatsApp settings?"
//       )
//     )
//       return;
//     setDeleting(true);
//     try {
//       // If your API route is different, update here.
//       await axiosClient.delete("/whatsappsettings/delete");
//       toast.success("🗑️ WhatsApp settings deleted.");
//       setFormData({
//         provider: "pinbot",
//         apiUrl: "",
//         apiKey: "",
//         apiToken: "",
//         phoneNumberId: "",
//         wabaId: "",
//         whatsAppBusinessNumber: "",
//         senderDisplayName: "",
//         webhookSecret: "",
//         webhookVerifyToken: "",
//         isActive: true,
//       });
//       setTestResult("");
//     } catch (err) {
//       toast.error(
//         err.response?.data?.message || "❌ Failed to delete settings."
//       );
//     } finally {
//       setDeleting(false);
//     }
//   };

//   const showField = key => {
//     const p = formData.provider;
//     const common = [
//       "apiUrl",
//       "senderDisplayName",
//       "whatsAppBusinessNumber",
//       "isActive",
//     ];
//     const pinbotOnly = ["apiKey", "wabaId"];
//     const metaOnly = ["apiToken", "phoneNumberId"];
//     const webhook = ["webhookSecret", "webhookVerifyToken"];

//     if (common.includes(key)) return true;
//     if (p === "pinbot" && pinbotOnly.includes(key)) return true;
//     if (p === "meta_cloud" && metaOnly.includes(key)) return true;
//     if (webhook.includes(key)) return true; // optional for both (if provider supports)
//     return false;
//   };

//   const placeholders = {
//     apiUrl:
//       "https://partnersv1.pinbot.ai  or  https://graph.facebook.com/v18.0",
//     apiKey: "Pinbot API Key (e.g. 68bd0be4-... )",
//     apiToken: "Meta Cloud permanent/long-lived access token",
//     phoneNumberId: "Meta phone number ID (e.g. 1234567890)",
//     wabaId: "WABA ID (Pinbot/Meta) e.g. 123456789012345",
//     whatsAppBusinessNumber: "+14150000001",
//     senderDisplayName: "Display name shown to recipients",
//     webhookSecret: "Optional signing secret (if provider supports)",
//     webhookVerifyToken: "Optional verify token for webhook setup",
//   };

//   const labels = {
//     provider: "Provider",
//     apiUrl: "API URL",
//     apiKey: "API Key",
//     apiToken: "API Token",
//     phoneNumberId: "Phone Number ID",
//     wabaId: "WABA ID",
//     whatsAppBusinessNumber: "WhatsApp Business Number",
//     senderDisplayName: "Sender Display Name",
//     webhookSecret: "Webhook Secret (optional)",
//     webhookVerifyToken: "Webhook Verify Token (optional)",
//     isActive: "Is Active",
//   };

//   return (
//     <div className="min-h-screen flex items-start justify-center bg-gray-50 px-0 pt-2">
//       <form
//         onSubmit={e => {
//           e.preventDefault();
//           handleSave();
//         }}
//         className="bg-white shadow-sm border rounded-md w-full max-w-4xl p-4 md:p-6 hover:shadow-md transition"
//       >
//         <div className="flex items-center gap-2 mb-6">
//           <img
//             src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
//             alt="WhatsApp"
//             className="w-6 h-6"
//           />
//           <h2 className="text-lg font-bold text-green-600">
//             WhatsApp API Settings
//           </h2>
//         </div>

//         {/* Provider */}
//         <div className="mb-4">
//           <label
//             className="text-xs font-medium text-gray-600 block mb-1"
//             htmlFor="provider"
//           >
//             {labels.provider}
//           </label>
//           <select
//             id="provider"
//             name="provider"
//             value={formData.provider}
//             onChange={onChange}
//             className="w-full px-3 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 border-gray-300"
//           >
//             {PROVIDERS.map(p => (
//               <option key={p.value} value={p.value}>
//                 {p.label}
//               </option>
//             ))}
//           </select>
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
//           {[
//             "apiUrl",
//             "apiKey",
//             "apiToken",
//             "phoneNumberId",
//             "wabaId",
//             "whatsAppBusinessNumber",
//             "senderDisplayName",
//             "webhookSecret",
//             "webhookVerifyToken",
//           ]
//             .filter(showField)
//             .map(key => (
//               <div key={key}>
//                 <label
//                   htmlFor={key}
//                   className="text-xs font-medium text-gray-600 block mb-1"
//                 >
//                   {labels[key]}
//                 </label>
//                 {key === "apiToken" ? (
//                   <textarea
//                     id={key}
//                     name={key}
//                     rows={3}
//                     value={formData[key] || ""}
//                     onChange={onChange}
//                     placeholder={placeholders[key]}
//                     className="w-full px-3 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 border-gray-300 resize-none"
//                   />
//                 ) : (
//                   <input
//                     id={key}
//                     type="text"
//                     name={key}
//                     value={formData[key] || ""}
//                     onChange={onChange}
//                     placeholder={placeholders[key]}
//                     className="w-full px-3 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 border-gray-300"
//                   />
//                 )}
//               </div>
//             ))}

//           <div className="flex items-center gap-2 mt-2">
//             <input
//               type="checkbox"
//               name="isActive"
//               checked={formData.isActive}
//               onChange={onChange}
//               className="w-4 h-4"
//             />
//             <label className="text-sm font-medium text-gray-700">
//               {labels.isActive}
//             </label>
//           </div>
//         </div>

//         {/* validation hint */}
//         {validationErrors.length > 0 && (
//           <div className="mt-4 text-sm text-red-600">
//             ⚠️ {validationErrors[0]}
//           </div>
//         )}

//         <div className="pt-6 border-t mt-6 flex flex-col md:flex-row gap-4 justify-end">
//           <button
//             type="submit"
//             disabled={loading}
//             className={`px-4 py-2 rounded-md text-white text-sm font-medium ${
//               loading ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"
//             }`}
//           >
//             {loading ? "Saving..." : "💾 Save Settings"}
//           </button>

//           <button
//             type="button"
//             onClick={handleTestConnection}
//             disabled={testing}
//             className={`px-4 py-2 rounded-md text-white text-sm font-medium ${
//               testing ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
//             }`}
//           >
//             {testing ? "Testing..." : "🔄 Test Connection"}
//           </button>

//           <button
//             type="button"
//             onClick={handleDelete}
//             disabled={deleting}
//             className={`px-4 py-2 rounded-md text-white text-sm font-medium ${
//               deleting ? "bg-gray-400" : "bg-red-600 hover:bg-red-700"
//             }`}
//           >
//             {deleting ? "Deleting..." : "🗑 Delete Settings"}
//           </button>
//         </div>

//         {testResult && (
//           <div
//             className={`mt-4 text-center font-semibold ${
//               testResult.startsWith("✅") ? "text-green-600" : "text-red-600"
//             }`}
//           >
//             {testResult}
//           </div>
//         )}
//       </form>
//     </div>
//   );
// }

// import React, { useState, useEffect } from "react";
// import axiosClient from "../../api/axiosClient";
// import { toast } from "react-toastify";

// export default function WhatsAppSettings() {
//   const [formData, setFormData] = useState({
//     apiUrl: "",
//     apiToken: "",
//     phoneNumberId: "",
//     whatsAppBusinessNumber: "",
//     senderDisplayName: "",
//     wabaId: "",
//     isActive: true,
//   });

//   const [loading, setLoading] = useState(false);
//   const [testing, setTesting] = useState(false);
//   const [deleting, setDeleting] = useState(false);
//   const [testResult, setTestResult] = useState("");

//   useEffect(() => {
//     loadSettings(); // 🔄 Load settings on mount
//   }, []);

//   const loadSettings = async () => {
//     try {
//       const response = await axiosClient.get("/whatsappsettings/me");
//       if (response.data) {
//         setFormData({
//           apiUrl: response.data.apiUrl || "",
//           apiToken: response.data.apiToken || "",
//           phoneNumberId: response.data.phoneNumberId || "",
//           whatsAppBusinessNumber: response.data.whatsAppBusinessNumber || "",
//           senderDisplayName: response.data.senderDisplayName || "",
//           wabaId: response.data.wabaId || "",
//           isActive: response.data.isActive ?? true,
//         });
//       }
//     } catch (error) {
//       console.error(error);
//       toast.info("ℹ️ No WhatsApp settings found. You can create now.");
//     }
//   };

//   const handleChange = e => {
//     const { name, value, type, checked } = e.target;
//     setFormData(prev => ({
//       ...prev,
//       [name]: type === "checkbox" ? checked : value,
//     }));
//   };

//   const handleSave = async () => {
//     const payload = formData;
//     if (
//       !payload.apiUrl.trim() ||
//       !payload.apiToken.trim() ||
//       !payload.phoneNumberId.trim() ||
//       !payload.whatsAppBusinessNumber.trim()
//     ) {
//       toast.warn("⚠️ Please fill all required fields.");
//       return;
//     }

//     setLoading(true);
//     try {
//       await axiosClient.put("/whatsappsettings/update", payload);
//       toast.success("✅ WhatsApp Settings saved successfully!");
//       setTestResult("");
//     } catch (error) {
//       console.error("❌ Save failed:", error);
//       toast.error("❌ Failed to save settings.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleTestConnection = async () => {
//     const payload = formData;
//     if (!payload.apiUrl.trim() || !payload.apiToken.trim()) {
//       toast.warn("⚠️ API URL and Token must be filled first.");
//       return;
//     }

//     setTesting(true);
//     setTestResult("");
//     try {
//       const response = await axiosClient.post(
//         "/whatsappsettings/test-connection",
//         payload
//       );
//       toast.success(response.data.message || "✅ Connection successful!");
//       setTestResult(
//         "✅ " + (response.data.message || "Connection successful!")
//       );
//     } catch (error) {
//       console.error(error);
//       const message =
//         error.response?.data?.message || "❌ Connection test failed.";
//       toast.error(message);
//       setTestResult("❌ " + message);
//     } finally {
//       setTesting(false);
//     }
//   };

//   const handleDelete = async () => {
//     if (
//       !window.confirm(
//         "⚠️ Are you sure you want to delete your WhatsApp settings?"
//       )
//     )
//       return;

//     setDeleting(true);
//     try {
//       await axiosClient.delete(`/whatsappsettings/delete-current`);
//       toast.success("🗑️ WhatsApp Settings deleted successfully!");
//       setFormData({
//         apiUrl: "",
//         apiToken: "",
//         phoneNumberId: "",
//         whatsAppBusinessNumber: "",
//         senderDisplayName: "",
//         wabaId: "",
//         isActive: true,
//       });
//       setTestResult("");
//     } catch (error) {
//       console.error(error);
//       toast.error("❌ Failed to delete WhatsApp settings.");
//     } finally {
//       setDeleting(false);
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-start justify-center bg-gray-50 px-0 pt-2">
//       <form
//         onSubmit={e => {
//           e.preventDefault();
//           handleSave();
//         }}
//         className="bg-white shadow-sm border rounded-md w-full max-w-4xl p-4 md:p-6 hover:shadow-md transition"
//       >
//         <div className="flex items-center gap-2 mb-6">
//           <img
//             src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
//             alt="WhatsApp"
//             className="w-6 h-6"
//           />
//           <h2 className="text-lg font-bold text-green-600">
//             WhatsApp API Settings
//           </h2>
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
//           {[
//             "apiUrl",
//             "apiToken",
//             "phoneNumberId",
//             "wabaId",
//             "whatsAppBusinessNumber",
//             "senderDisplayName",
//           ].map(key => {
//             const placeholders = {
//               apiUrl: "https://graph.facebook.com/v18.0/",
//               apiToken: "Paste your API token",
//               phoneNumberId: "e.g. 1234567890",
//               wabaId: "e.g. 123456789012345",
//               whatsAppBusinessNumber: "+14150000001",
//               senderDisplayName: "MyShop Support",
//             };
//             const labels = {
//               apiUrl: "API URL",
//               apiToken: "API Token",
//               phoneNumberId: "Phone Number ID",
//               wabaId: "WABA ID",
//               whatsAppBusinessNumber: "WhatsApp Business Number",
//               senderDisplayName: "Sender Display Name",
//             };
//             return (
//               <div key={key}>
//                 <label
//                   htmlFor={key}
//                   className="text-xs font-medium text-gray-600 block mb-1"
//                 >
//                   {labels[key]}
//                 </label>
//                 {key === "apiToken" ? (
//                   <textarea
//                     id={key}
//                     name={key}
//                     rows={3}
//                     value={formData[key] || ""}
//                     onChange={handleChange}
//                     placeholder={placeholders[key]}
//                     className="w-full px-3 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 border-gray-300 resize-none"
//                   />
//                 ) : (
//                   <input
//                     id={key}
//                     type="text"
//                     name={key}
//                     value={formData[key] || ""}
//                     onChange={handleChange}
//                     placeholder={placeholders[key]}
//                     className="w-full px-3 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 border-gray-300"
//                   />
//                 )}
//               </div>
//             );
//           })}

//           <div className="flex items-center gap-2 mt-2">
//             <input
//               type="checkbox"
//               name="isActive"
//               checked={formData.isActive}
//               onChange={handleChange}
//               className="w-4 h-4"
//             />
//             <label className="text-sm font-medium text-gray-700">
//               Is Active
//             </label>
//           </div>
//         </div>

//         <div className="pt-6 border-t mt-6 flex flex-col md:flex-row gap-4 justify-end">
//           <button
//             type="submit"
//             disabled={loading}
//             className={`px-4 py-2 rounded-md text-white text-sm font-medium ${
//               loading ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"
//             }`}
//           >
//             {loading ? "Saving..." : "💾 Save Settings"}
//           </button>

//           <button
//             type="button"
//             onClick={handleTestConnection}
//             disabled={testing}
//             className={`px-4 py-2 rounded-md text-white text-sm font-medium ${
//               testing ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
//             }`}
//           >
//             {testing ? "Testing..." : "🔄 Test Connection"}
//           </button>

//           <button
//             type="button"
//             onClick={handleDelete}
//             disabled={deleting}
//             className={`px-4 py-2 rounded-md text-white text-sm font-medium ${
//               deleting ? "bg-gray-400" : "bg-red-600 hover:bg-red-700"
//             }`}
//           >
//             {deleting ? "Deleting..." : "🗑 Delete Settings"}
//           </button>
//         </div>

//         {testResult && (
//           <div
//             className={`mt-4 text-center font-semibold ${
//               testResult.startsWith("✅") ? "text-green-600" : "text-red-600"
//             }`}
//           >
//             {testResult}
//           </div>
//         )}
//       </form>
//     </div>
//   );
// }

// import React, { useState, useEffect } from "react";
// import axiosClient from "../../api/axiosClient";
// import { toast } from "react-toastify";

// export default function WhatsAppSettings() {
//   const [formData, setFormData] = useState({
//     apiUrl: "",
//     apiToken: "",
//     phoneNumberId: "",
//     whatsAppBusinessNumber: "",
//     senderDisplayName: "",
//     wabaId: "",
//     isActive: true,
//   });

//   const [loading, setLoading] = useState(false);
//   const [testing, setTesting] = useState(false);
//   const [deleting, setDeleting] = useState(false);
//   const [testResult, setTestResult] = useState("");

//   useEffect(() => {
//     loadSettings(); // 🔄 Load settings on mount
//   }, []);

//   const loadSettings = async () => {
//     try {
//       const response = await axiosClient.get("/whatsappsettings/me");
//       if (response.data) {
//         setFormData({
//           apiUrl: response.data.apiUrl || "",
//           apiToken: response.data.apiToken || "",
//           phoneNumberId: response.data.phoneNumberId || "",
//           whatsAppBusinessNumber: response.data.whatsAppBusinessNumber || "",
//           senderDisplayName: response.data.senderDisplayName || "",
//           wabaId: response.data.wabaId || "",
//           isActive: response.data.isActive ?? true,
//         });
//       }
//     } catch (error) {
//       console.error(error);
//       toast.info("ℹ️ No WhatsApp settings found. You can create now.");
//     }
//   };

//   const handleChange = e => {
//     const { name, value, type, checked } = e.target;
//     setFormData(prev => ({
//       ...prev,
//       [name]: type === "checkbox" ? checked : value,
//     }));
//   };

//   const handleSave = async () => {
//     const payload = formData;
//     if (
//       !payload.apiUrl.trim() ||
//       !payload.apiToken.trim() ||
//       !payload.phoneNumberId.trim() ||
//       !payload.whatsAppBusinessNumber.trim()
//     ) {
//       toast.warn("⚠️ Please fill all required fields.");
//       return;
//     }

//     setLoading(true);
//     try {
//       await axiosClient.put("/whatsappsettings/update", payload);
//       toast.success("✅ WhatsApp Settings saved successfully!");
//       setTestResult("");
//     } catch (error) {
//       console.error("❌ Save failed:", error);
//       toast.error("❌ Failed to save settings.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleTestConnection = async () => {
//     const payload = formData;
//     if (!payload.apiUrl.trim() || !payload.apiToken.trim()) {
//       toast.warn("⚠️ API URL and Token must be filled first.");
//       return;
//     }

//     setTesting(true);
//     setTestResult("");
//     try {
//       const response = await axiosClient.post(
//         "/whatsappsettings/test-connection",
//         payload
//       );
//       toast.success(response.data.message || "✅ Connection successful!");
//       setTestResult(
//         "✅ " + (response.data.message || "Connection successful!")
//       );
//     } catch (error) {
//       console.error(error);
//       const message =
//         error.response?.data?.message || "❌ Connection test failed.";
//       toast.error(message);
//       setTestResult("❌ " + message);
//     } finally {
//       setTesting(false);
//     }
//   };

//   const handleDelete = async () => {
//     if (
//       !window.confirm(
//         "⚠️ Are you sure you want to delete your WhatsApp settings?"
//       )
//     )
//       return;

//     setDeleting(true);
//     try {
//       await axiosClient.delete(`/whatsappsettings/delete-current`);
//       toast.success("🗑️ WhatsApp Settings deleted successfully!");
//       setFormData({
//         apiUrl: "",
//         apiToken: "",
//         phoneNumberId: "",
//         whatsAppBusinessNumber: "",
//         senderDisplayName: "",
//         wabaId: "",
//         isActive: true,
//       });
//       setTestResult("");
//     } catch (error) {
//       console.error(error);
//       toast.error("❌ Failed to delete WhatsApp settings.");
//     } finally {
//       setDeleting(false);
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-start justify-center bg-gray-50 px-0 pt-2">
//       <form
//         onSubmit={e => {
//           e.preventDefault();
//           handleSave();
//         }}
//         className="bg-white shadow-sm border rounded-md w-full max-w-4xl p-4 md:p-6 hover:shadow-md transition"
//       >
//         <div className="flex items-center gap-2 mb-6">
//           <img
//             src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
//             alt="WhatsApp"
//             className="w-6 h-6"
//           />
//           <h2 className="text-lg font-bold text-green-600">
//             WhatsApp API Settings
//           </h2>
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
//           {[
//             "apiUrl",
//             "apiToken",
//             "phoneNumberId",
//             "wabaId",
//             "whatsAppBusinessNumber",
//             "senderDisplayName",
//           ].map(key => {
//             const placeholders = {
//               apiUrl: "https://graph.facebook.com/v18.0/",
//               apiToken: "Paste your API token",
//               phoneNumberId: "e.g. 1234567890",
//               wabaId: "e.g. 123456789012345",
//               whatsAppBusinessNumber: "+14150000001",
//               senderDisplayName: "MyShop Support",
//             };
//             const labels = {
//               apiUrl: "API URL",
//               apiToken: "API Token",
//               phoneNumberId: "Phone Number ID",
//               wabaId: "WABA ID",
//               whatsAppBusinessNumber: "WhatsApp Business Number",
//               senderDisplayName: "Sender Display Name",
//             };
//             return (
//               <div key={key}>
//                 <label
//                   htmlFor={key}
//                   className="text-xs font-medium text-gray-600 block mb-1"
//                 >
//                   {labels[key]}
//                 </label>
//                 <input
//                   id={key}
//                   type="text"
//                   name={key}
//                   value={formData[key] || ""}
//                   onChange={handleChange}
//                   placeholder={placeholders[key]}
//                   className="w-full px-3 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 border-gray-300"
//                 />
//               </div>
//             );
//           })}

//           <div className="flex items-center gap-2 mt-2">
//             <input
//               type="checkbox"
//               name="isActive"
//               checked={formData.isActive}
//               onChange={handleChange}
//               className="w-4 h-4"
//             />
//             <label className="text-sm font-medium text-gray-700">
//               Is Active
//             </label>
//           </div>
//         </div>

//         <div className="pt-6 border-t mt-6 flex flex-col md:flex-row gap-4 justify-end">
//           <button
//             type="submit"
//             disabled={loading}
//             className={`px-4 py-2 rounded-md text-white text-sm font-medium ${
//               loading ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"
//             }`}
//           >
//             {loading ? "Saving..." : "💾 Save Settings"}
//           </button>

//           <button
//             type="button"
//             onClick={handleTestConnection}
//             disabled={testing}
//             className={`px-4 py-2 rounded-md text-white text-sm font-medium ${
//               testing ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
//             }`}
//           >
//             {testing ? "Testing..." : "🔄 Test Connection"}
//           </button>

//           <button
//             type="button"
//             onClick={handleDelete}
//             disabled={deleting}
//             className={`px-4 py-2 rounded-md text-white text-sm font-medium ${
//               deleting ? "bg-gray-400" : "bg-red-600 hover:bg-red-700"
//             }`}
//           >
//             {deleting ? "Deleting..." : "🗑 Delete Settings"}
//           </button>
//         </div>

//         {testResult && (
//           <div
//             className={`mt-4 text-center font-semibold ${
//               testResult.startsWith("✅") ? "text-green-600" : "text-red-600"
//             }`}
//           >
//             {testResult}
//           </div>
//         )}
//       </form>
//     </div>
//   );
// }

// // 📄 File: src/pages/Settings/WhatsAppSettings.jsx
// import React, { useState, useEffect } from "react";
// import axiosClient from "../../api/axiosClient";
// import { toast } from "react-toastify";
// import { useAuth } from "../auth/context/AuthContext";

// export default function WhatsAppSettings() {
//   const { businessId } = useAuth();

//   const [formData, setFormData] = useState({
//     businessId: "",
//     apiUrl: "",
//     apiToken: "",
//     phoneNumberId: "",
//     whatsAppBusinessNumber: "",
//     senderDisplayName: "",
//     wabaId: "",
//     isActive: true,
//   });

//   const [loading, setLoading] = useState(false);
//   const [testing, setTesting] = useState(false);
//   const [deleting, setDeleting] = useState(false);
//   const [testResult, setTestResult] = useState("");

//   useEffect(() => {
//     if (businessId) {
//       setFormData(prev => ({ ...prev, businessId }));
//       loadSettings();
//     }
//   }, [businessId]);

//   const loadSettings = async () => {
//     try {
//       const response = await axiosClient.get("/whatsappsettings/me");
//       if (response.data) {
//         setFormData({
//           businessId: response.data.businessId,
//           apiUrl: response.data.apiUrl || "",
//           apiToken: response.data.apiToken || "",
//           phoneNumberId: response.data.phoneNumberId || "",
//           whatsAppBusinessNumber: response.data.whatsAppBusinessNumber || "",
//           senderDisplayName: response.data.senderDisplayName || "",
//           wabaId: response.data.wabaId || "",
//           isActive: response.data.isActive ?? true,
//         });
//       }
//     } catch (error) {
//       console.error(error);
//       toast.info("ℹ️ No WhatsApp settings found. You can create now.");
//     }
//   };

//   const handleChange = e => {
//     const { name, value, type, checked } = e.target;
//     setFormData(prev => ({
//       ...prev,
//       [name]: type === "checkbox" ? checked : value,
//     }));
//   };

//   const handleSave = async () => {
//     const { businessId, ...payload } = formData;
//     if (
//       !payload.apiUrl.trim() ||
//       !payload.apiToken.trim() ||
//       !payload.phoneNumberId.trim() ||
//       !payload.whatsAppBusinessNumber.trim()
//     ) {
//       toast.warn("⚠️ Please fill all required fields.");
//       return;
//     }

//     setLoading(true);
//     try {
//       await axiosClient.put("/whatsappsettings/update", payload);
//       toast.success("✅ WhatsApp Settings saved successfully!");
//       setTestResult("");
//     } catch (error) {
//       console.error("❌ Save failed:", error);
//       toast.error("❌ Failed to save settings.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleTestConnection = async () => {
//     const { businessId, ...payload } = formData;
//     if (!payload.apiUrl.trim() || !payload.apiToken.trim()) {
//       toast.warn("⚠️ API URL and Token must be filled first.");
//       return;
//     }

//     setTesting(true);
//     setTestResult("");
//     try {
//       const response = await axiosClient.post(
//         "/whatsappsettings/test-connection",
//         payload
//       );
//       toast.success(response.data.message || "✅ Connection successful!");
//       setTestResult(
//         "✅ " + (response.data.message || "Connection successful!")
//       );
//     } catch (error) {
//       console.error(error);
//       const message =
//         error.response?.data?.message || "❌ Connection test failed.";
//       toast.error(message);
//       setTestResult("❌ " + message);
//     } finally {
//       setTesting(false);
//     }
//   };

//   const handleDelete = async () => {
//     if (
//       !window.confirm(
//         "⚠️ Are you sure you want to delete your WhatsApp settings?"
//       )
//     )
//       return;

//     setDeleting(true);
//     try {
//       await axiosClient.delete(`/whatsappsettings/delete/${businessId}`);
//       toast.success("🗑️ WhatsApp Settings deleted successfully!");
//       setFormData(prev => ({
//         ...prev,
//         apiUrl: "",
//         apiToken: "",
//         phoneNumberId: "",
//         whatsAppBusinessNumber: "",
//         senderDisplayName: "",
//         wabaId: "",
//         isActive: true,
//       }));
//       setTestResult("");
//     } catch (error) {
//       console.error(error);
//       toast.error("❌ Failed to delete WhatsApp settings.");
//     } finally {
//       setDeleting(false);
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-start justify-center bg-gray-50 px-0 pt-2">
//       <form
//         onSubmit={e => {
//           e.preventDefault();
//           handleSave();
//         }}
//         className="bg-white shadow-sm border rounded-md w-full max-w-4xl p-4 md:p-6 hover:shadow-md transition"
//       >
//         <div className="flex items-center gap-2 mb-6">
//           <img
//             src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
//             alt="WhatsApp"
//             className="w-6 h-6"
//           />
//           <h2 className="text-lg font-bold text-green-600">
//             WhatsApp API Settings
//           </h2>
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
//           {[
//             "apiUrl",
//             "apiToken",
//             "phoneNumberId",
//             "wabaId",
//             "whatsAppBusinessNumber",
//             "senderDisplayName",
//           ].map((key, idx) => {
//             const placeholders = {
//               apiUrl: "https://graph.facebook.com/v18.0/",
//               apiToken: "Paste your API token",
//               phoneNumberId: "e.g. 1234567890",
//               wabaId: "e.g. 123456789012345",
//               whatsAppBusinessNumber: "+14150000001",
//               senderDisplayName: "MyShop Support",
//             };
//             const labels = {
//               apiUrl: "API URL",
//               apiToken: "API Token",
//               phoneNumberId: "Phone Number ID",
//               wabaId: "WABA ID",
//               whatsAppBusinessNumber: "WhatsApp Business Number",
//               senderDisplayName: "Sender Display Name",
//             };
//             return (
//               <div key={key}>
//                 <label
//                   htmlFor={key}
//                   className="text-xs font-medium text-gray-600 block mb-1"
//                 >
//                   {labels[key]}
//                 </label>
//                 <input
//                   id={key}
//                   type="text"
//                   name={key}
//                   value={formData[key] || ""}
//                   onChange={handleChange}
//                   placeholder={placeholders[key]}
//                   className="w-full px-3 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 border-gray-300"
//                 />
//               </div>
//             );
//           })}

//           <div className="flex items-center gap-2 mt-2">
//             <input
//               type="checkbox"
//               name="isActive"
//               checked={formData.isActive}
//               onChange={handleChange}
//               className="w-4 h-4"
//             />
//             <label className="text-sm font-medium text-gray-700">
//               Is Active
//             </label>
//           </div>
//         </div>

//         <div className="pt-6 border-t mt-6 flex flex-col md:flex-row gap-4 justify-end">
//           <button
//             type="submit"
//             disabled={loading}
//             className={`px-4 py-2 rounded-md text-white text-sm font-medium ${
//               loading ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"
//             }`}
//           >
//             {loading ? "Saving..." : "💾 Save Settings"}
//           </button>

//           <button
//             type="button"
//             onClick={handleTestConnection}
//             disabled={testing}
//             className={`px-4 py-2 rounded-md text-white text-sm font-medium ${
//               testing ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
//             }`}
//           >
//             {testing ? "Testing..." : "🔄 Test Connection"}
//           </button>

//           <button
//             type="button"
//             onClick={handleDelete}
//             disabled={deleting}
//             className={`px-4 py-2 rounded-md text-white text-sm font-medium ${
//               deleting ? "bg-gray-400" : "bg-red-600 hover:bg-red-700"
//             }`}
//           >
//             {deleting ? "Deleting..." : "🗑 Delete Settings"}
//           </button>
//         </div>

//         {testResult && (
//           <div
//             className={`mt-4 text-center font-semibold ${
//               testResult.startsWith("✅") ? "text-green-600" : "text-red-600"
//             }`}
//           >
//             {testResult}
//           </div>
//         )}
//       </form>
//     </div>
//   );
// }

// import React, { useState, useEffect } from "react";
// import axiosClient from "../../api/axiosClient";
// import { toast } from "react-toastify";
// import { useAuth } from "../auth/context/AuthContext";

// export default function WhatsAppSettings() {
//   const { businessId } = useAuth();

//   const [formData, setFormData] = useState({
//     businessId: "",
//     apiUrl: "",
//     apiToken: "",
//     phoneNumberId: "",
//     whatsAppBusinessNumber: "",
//     senderDisplayName: "",
//     wabaId: "",
//     isActive: true,
//   });

//   const [loading, setLoading] = useState(false);
//   const [testing, setTesting] = useState(false);
//   const [deleting, setDeleting] = useState(false);
//   const [testResult, setTestResult] = useState("");

//   useEffect(() => {
//     if (businessId) {
//       setFormData(prev => ({ ...prev, businessId }));
//       loadSettings();
//     }
//   }, [businessId]);

//   const loadSettings = async () => {
//     try {
//       // const response = await axiosClient.get(`/whatsappsettings/${businessId}`);
//       const response = await axiosClient.get(`/whatsappsettings/me`);
//       if (response.data) {
//         setFormData({
//           businessId: response.data.businessId,
//           apiUrl: response.data.apiUrl ?? "",
//           apiToken: response.data.apiToken ?? "",
//           phoneNumberId: response.data.phoneNumberId ?? "",
//           whatsAppBusinessNumber: response.data.whatsAppBusinessNumber ?? "",
//           senderDisplayName: response.data.senderDisplayName ?? "",
//           wabaId: response.data.wabaId ?? "",
//           isActive: response.data.isActive ?? true,
//         });
//       }
//     } catch (error) {
//       console.error(error);
//       toast.info("ℹ️ No WhatsApp settings found. You can create now.");
//     }
//   };

//   const handleChange = e => {
//     const { name, value, type, checked } = e.target;
//     setFormData(prev => ({
//       ...prev,
//       [name]: type === "checkbox" ? checked : value,
//     }));
//   };

//   const handleSave = async () => {
//     const { businessId, ...payload } = formData;
//     if (
//       !payload.apiUrl.trim() ||
//       !payload.apiToken.trim() ||
//       !payload.phoneNumberId.trim() ||
//       !payload.whatsAppBusinessNumber.trim()
//     ) {
//       toast.warn("⚠️ Please fill all required fields.");
//       return;
//     }

//     setLoading(true);
//     try {
//       await axiosClient.put("/whatsappsettings/update", payload);
//       toast.success("✅ WhatsApp Settings saved successfully!");
//       setTestResult("");
//     } catch (error) {
//       console.error("❌ Save failed:", error);
//       toast.error("❌ Failed to save settings.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleTestConnection = async () => {
//     const { businessId, ...payload } = formData;
//     if (!payload.apiUrl.trim() || !payload.apiToken.trim()) {
//       toast.warn("⚠️ API URL and Token must be filled first.");
//       return;
//     }

//     setTesting(true);
//     setTestResult("");
//     try {
//       const response = await axiosClient.post(
//         "/whatsappsettings/test-connection",
//         payload
//       );
//       toast.success(response.data.message || "✅ Connection successful!");
//       setTestResult(
//         "✅ " + (response.data.message || "Connection successful!")
//       );
//     } catch (error) {
//       console.error(error);
//       const message =
//         error.response?.data?.message || "❌ Connection test failed.";
//       toast.error(message);
//       setTestResult("❌ " + message);
//     } finally {
//       setTesting(false);
//     }
//   };

//   const handleDelete = async () => {
//     if (
//       !window.confirm(
//         "⚠️ Are you sure you want to delete your WhatsApp settings?"
//       )
//     )
//       return;

//     setDeleting(true);
//     try {
//       await axiosClient.delete(`/whatsappsettings/delete/${businessId}`);
//       toast.success("🗑️ WhatsApp Settings deleted successfully!");
//       setFormData(prev => ({
//         ...prev,
//         apiUrl: "",
//         apiToken: "",
//         phoneNumberId: "",
//         whatsAppBusinessNumber: "",
//         senderDisplayName: "",
//         wabaId: "",
//         isActive: true,
//       }));
//       setTestResult("");
//     } catch (error) {
//       console.error(error);
//       toast.error("❌ Failed to delete WhatsApp settings.");
//     } finally {
//       setDeleting(false);
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-start justify-center bg-gray-50 px-0 pt-2">
//       <form
//         onSubmit={e => {
//           e.preventDefault();
//           handleSave();
//         }}
//         className="bg-white shadow-sm border rounded-md w-full max-w-4xl p-4 md:p-6 hover:shadow-md transition"
//       >
//         {/* Header with Logo */}
//         <div className="flex items-center gap-2 mb-6">
//           <img
//             src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
//             alt="WhatsApp"
//             className="w-6 h-6"
//           />
//           <h2 className="text-lg font-bold text-green-600">
//             WhatsApp API Settings
//           </h2>
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
//           {[
//             ["API URL", "apiUrl", "text", "https://graph.facebook.com/v18.0/"],
//             ["API Token", "apiToken", "text", "Paste your API token"],
//             ["Phone Number ID", "phoneNumberId", "text", "e.g. 1234567890"],
//             ["WABA ID", "wabaId", "text", "e.g. 123456789012345"],
//             [
//               "WhatsApp Business Number",
//               "whatsAppBusinessNumber",
//               "text",
//               "+14150000001",
//             ],
//             [
//               "Sender Display Name",
//               "senderDisplayName",
//               "text",
//               "MyShop Support",
//             ],
//           ].map(([label, name, type, placeholder]) => (
//             <div key={name}>
//               <label
//                 htmlFor={name}
//                 className="text-xs font-medium text-gray-600 block mb-1"
//               >
//                 {label}
//               </label>
//               <input
//                 id={name}
//                 type={type}
//                 name={name}
//                 value={formData[name]}
//                 onChange={handleChange}
//                 placeholder={placeholder}
//                 className="w-full px-3 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 border-gray-300"
//               />
//             </div>
//           ))}

//           <div className="flex items-center gap-2 mt-2">
//             <input
//               type="checkbox"
//               name="isActive"
//               checked={formData.isActive}
//               onChange={handleChange}
//               className="w-4 h-4"
//             />
//             <label className="text-sm font-medium text-gray-700">
//               Is Active
//             </label>
//           </div>
//         </div>

//         <div className="pt-6 border-t mt-6 flex flex-col md:flex-row gap-4 justify-end">
//           <button
//             type="submit"
//             disabled={loading}
//             className={`px-4 py-2 rounded-md text-white text-sm font-medium ${
//               loading ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"
//             }`}
//           >
//             {loading ? "Saving..." : "💾 Save Settings"}
//           </button>

//           <button
//             type="button"
//             onClick={handleTestConnection}
//             disabled={testing}
//             className={`px-4 py-2 rounded-md text-white text-sm font-medium ${
//               testing ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
//             }`}
//           >
//             {testing ? "Testing..." : "🔄 Test Connection"}
//           </button>

//           <button
//             type="button"
//             onClick={handleDelete}
//             disabled={deleting}
//             className={`px-4 py-2 rounded-md text-white text-sm font-medium ${
//               deleting ? "bg-gray-400" : "bg-red-600 hover:bg-red-700"
//             }`}
//           >
//             {deleting ? "Deleting..." : "🗑 Delete Settings"}
//           </button>
//         </div>

//         {testResult && (
//           <div
//             className={`mt-4 text-center font-semibold ${
//               testResult.startsWith("✅") ? "text-green-600" : "text-red-600"
//             }`}
//           >
//             {testResult}
//           </div>
//         )}
//       </form>
//     </div>
//   );
// }

// import React, { useState, useEffect } from "react";
// import axiosClient from "../../api/axiosClient";
// import { toast } from "react-toastify";
// import { useAuth } from "../auth/context/AuthContext";

// export default function WhatsAppSettings() {
//   const { businessId } = useAuth();

//   const [formData, setFormData] = useState({
//     businessId: "",
//     apiUrl: "",
//     apiToken: "",
//     phoneNumberId: "",
//     whatsAppBusinessNumber: "",
//     senderDisplayName: "",
//     wabaId: "",
//     isActive: true,
//   });

//   const [loading, setLoading] = useState(false);
//   const [testing, setTesting] = useState(false);
//   const [deleting, setDeleting] = useState(false);
//   const [testResult, setTestResult] = useState("");

//   useEffect(() => {
//     if (businessId) {
//       loadSettings();
//     }
//   }, [businessId]);

//   const loadSettings = async () => {
//     try {
//       setFormData(prev => ({ ...prev, businessId }));
//       const response = await axiosClient.get(`/whatsappsettings/${businessId}`);
//       if (response.data) {
//         setFormData({
//           businessId: response.data.businessId,
//           apiUrl: response.data.apiUrl || "",
//           apiToken: response.data.apiToken || "",
//           phoneNumberId: response.data.phoneNumberId || "",
//           whatsAppBusinessNumber: response.data.whatsAppBusinessNumber || "",
//           senderDisplayName: response.data.senderDisplayName || "",
//           wabaId: response.data.wabaId || "",
//           isActive: response.data.isActive ?? true,
//         });
//       }
//     } catch (error) {
//       console.error(error);
//       toast.info("ℹ️ No WhatsApp settings found. You can create now.");
//     }
//   };

//   const handleChange = e => {
//     const { name, value, type, checked } = e.target;
//     setFormData(prev => ({
//       ...prev,
//       [name]: type === "checkbox" ? checked : value,
//     }));
//   };

//   const handleSave = async () => {
//     const { businessId, ...payload } = formData;
//     if (
//       !payload.apiUrl.trim() ||
//       !payload.apiToken.trim() ||
//       !payload.phoneNumberId.trim() ||
//       !payload.whatsAppBusinessNumber.trim()
//     ) {
//       toast.warn("⚠️ Please fill all required fields.");
//       return;
//     }

//     setLoading(true);
//     try {
//       await axiosClient.put("/whatsappsettings/update", payload);
//       toast.success("✅ WhatsApp Settings saved successfully!");
//       setTestResult("");
//     } catch (error) {
//       console.error("❌ Save failed:", error);
//       toast.error("❌ Failed to save settings.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleTestConnection = async () => {
//     const { businessId, ...payload } = formData;
//     if (!payload.apiUrl.trim() || !payload.apiToken.trim()) {
//       toast.warn("⚠️ API URL and Token must be filled first.");
//       return;
//     }

//     setTesting(true);
//     setTestResult("");
//     try {
//       const response = await axiosClient.post(
//         "/whatsappsettings/test-connection",
//         payload
//       );
//       toast.success(response.data.message || "✅ Connection successful!");
//       setTestResult(
//         "✅ " + (response.data.message || "Connection successful!")
//       );
//     } catch (error) {
//       console.error(error);
//       const message =
//         error.response?.data?.message || "❌ Connection test failed.";
//       toast.error(message);
//       setTestResult("❌ " + message);
//     } finally {
//       setTesting(false);
//     }
//   };

//   const handleDelete = async () => {
//     if (
//       !window.confirm(
//         "⚠️ Are you sure you want to delete your WhatsApp settings?"
//       )
//     )
//       return;

//     setDeleting(true);
//     try {
//       await axiosClient.delete(`/whatsappsettings/delete/${businessId}`);
//       toast.success("🗑️ WhatsApp Settings deleted successfully!");
//       setFormData(prev => ({
//         ...prev,
//         apiUrl: "",
//         apiToken: "",
//         phoneNumberId: "",
//         whatsAppBusinessNumber: "",
//         senderDisplayName: "",
//         wabaId: "",
//         isActive: true,
//       }));
//       setTestResult("");
//     } catch (error) {
//       console.error(error);
//       toast.error("❌ Failed to delete WhatsApp settings.");
//     } finally {
//       setDeleting(false);
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-start justify-center bg-gray-50 px-0 pt-2">
//       <form
//         onSubmit={e => {
//           e.preventDefault();
//           handleSave();
//         }}
//         className="bg-white shadow-sm border rounded-md w-full max-w-4xl p-4 md:p-6 hover:shadow-md transition"
//       >
//         {/* Header with Logo */}
//         <div className="flex items-center gap-2 mb-6">
//           <img
//             src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
//             alt="WhatsApp"
//             className="w-6 h-6"
//           />
//           <h2 className="text-lg font-bold text-green-600">
//             WhatsApp API Settings
//           </h2>
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
//           {[
//             ["API URL", "apiUrl", "text", "https://graph.facebook.com/v18.0/"],
//             ["API Token", "apiToken", "text", "Paste your API token"],
//             ["Phone Number ID", "phoneNumberId", "text", "e.g. 1234567890"],
//             ["WABA ID", "wabaId", "text", "e.g. 123456789012345"],
//             [
//               "WhatsApp Business Number",
//               "whatsAppBusinessNumber",
//               "text",
//               "+14150000001",
//             ],
//             [
//               "Sender Display Name",
//               "senderDisplayName",
//               "text",
//               "MyShop Support",
//             ],
//           ].map(([label, name, type, placeholder]) => (
//             <div key={name}>
//               <label
//                 htmlFor={name}
//                 className="text-xs font-medium text-gray-600 block mb-1"
//               >
//                 {label}
//               </label>
//               <input
//                 id={name}
//                 type={type}
//                 name={name}
//                 value={formData[name]}
//                 onChange={handleChange}
//                 placeholder={placeholder}
//                 className="w-full px-3 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 border-gray-300"
//               />
//             </div>
//           ))}

//           {/* IsActive Toggle */}
//           <div className="flex items-center gap-2 mt-2">
//             <input
//               type="checkbox"
//               name="isActive"
//               checked={formData.isActive}
//               onChange={handleChange}
//               className="w-4 h-4"
//             />
//             <label className="text-sm font-medium text-gray-700">
//               Is Active
//             </label>
//           </div>
//         </div>

//         {/* Action Buttons */}
//         <div className="pt-6 border-t mt-6 flex flex-col md:flex-row gap-4 justify-end">
//           <button
//             type="submit"
//             disabled={loading}
//             className={`px-4 py-2 rounded-md text-white text-sm font-medium ${
//               loading ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"
//             }`}
//           >
//             {loading ? "Saving..." : "💾 Save Settings"}
//           </button>

//           <button
//             type="button"
//             onClick={handleTestConnection}
//             disabled={testing}
//             className={`px-4 py-2 rounded-md text-white text-sm font-medium ${
//               testing ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
//             }`}
//           >
//             {testing ? "Testing..." : "🔄 Test Connection"}
//           </button>

//           <button
//             type="button"
//             onClick={handleDelete}
//             disabled={deleting}
//             className={`px-4 py-2 rounded-md text-white text-sm font-medium ${
//               deleting ? "bg-gray-400" : "bg-red-600 hover:bg-red-700"
//             }`}
//           >
//             {deleting ? "Deleting..." : "🗑 Delete Settings"}
//           </button>
//         </div>

//         {/* Test Result */}
//         {testResult && (
//           <div
//             className={`mt-4 text-center font-semibold ${
//               testResult.startsWith("✅") ? "text-green-600" : "text-red-600"
//             }`}
//           >
//             {testResult}
//           </div>
//         )}
//       </form>
//     </div>
//   );
// }
