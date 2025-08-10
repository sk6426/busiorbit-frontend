import React, { useState, useEffect } from "react";
import axiosClient from "../../api/axiosClient";
import { toast } from "react-toastify";

export default function WhatsAppSettings() {
  const [formData, setFormData] = useState({
    apiUrl: "",
    apiToken: "",
    phoneNumberId: "",
    whatsAppBusinessNumber: "",
    senderDisplayName: "",
    wabaId: "",
    isActive: true,
  });

  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [testResult, setTestResult] = useState("");

  useEffect(() => {
    loadSettings(); // 🔄 Load settings on mount
  }, []);

  const loadSettings = async () => {
    try {
      const response = await axiosClient.get("/whatsappsettings/me");
      if (response.data) {
        setFormData({
          apiUrl: response.data.apiUrl || "",
          apiToken: response.data.apiToken || "",
          phoneNumberId: response.data.phoneNumberId || "",
          whatsAppBusinessNumber: response.data.whatsAppBusinessNumber || "",
          senderDisplayName: response.data.senderDisplayName || "",
          wabaId: response.data.wabaId || "",
          isActive: response.data.isActive ?? true,
        });
      }
    } catch (error) {
      console.error(error);
      toast.info("ℹ️ No WhatsApp settings found. You can create now.");
    }
  };

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSave = async () => {
    const payload = formData;
    if (
      !payload.apiUrl.trim() ||
      !payload.apiToken.trim() ||
      !payload.phoneNumberId.trim() ||
      !payload.whatsAppBusinessNumber.trim()
    ) {
      toast.warn("⚠️ Please fill all required fields.");
      return;
    }

    setLoading(true);
    try {
      await axiosClient.put("/whatsappsettings/update", payload);
      toast.success("✅ WhatsApp Settings saved successfully!");
      setTestResult("");
    } catch (error) {
      console.error("❌ Save failed:", error);
      toast.error("❌ Failed to save settings.");
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    const payload = formData;
    if (!payload.apiUrl.trim() || !payload.apiToken.trim()) {
      toast.warn("⚠️ API URL and Token must be filled first.");
      return;
    }

    setTesting(true);
    setTestResult("");
    try {
      const response = await axiosClient.post(
        "/whatsappsettings/test-connection",
        payload
      );
      toast.success(response.data.message || "✅ Connection successful!");
      setTestResult(
        "✅ " + (response.data.message || "Connection successful!")
      );
    } catch (error) {
      console.error(error);
      const message =
        error.response?.data?.message || "❌ Connection test failed.";
      toast.error(message);
      setTestResult("❌ " + message);
    } finally {
      setTesting(false);
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        "⚠️ Are you sure you want to delete your WhatsApp settings?"
      )
    )
      return;

    setDeleting(true);
    try {
      await axiosClient.delete(`/whatsappsettings/delete-current`);
      toast.success("🗑️ WhatsApp Settings deleted successfully!");
      setFormData({
        apiUrl: "",
        apiToken: "",
        phoneNumberId: "",
        whatsAppBusinessNumber: "",
        senderDisplayName: "",
        wabaId: "",
        isActive: true,
      });
      setTestResult("");
    } catch (error) {
      console.error(error);
      toast.error("❌ Failed to delete WhatsApp settings.");
    } finally {
      setDeleting(false);
    }
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          {[
            "apiUrl",
            "apiToken",
            "phoneNumberId",
            "wabaId",
            "whatsAppBusinessNumber",
            "senderDisplayName",
          ].map(key => {
            const placeholders = {
              apiUrl: "https://graph.facebook.com/v18.0/",
              apiToken: "Paste your API token",
              phoneNumberId: "e.g. 1234567890",
              wabaId: "e.g. 123456789012345",
              whatsAppBusinessNumber: "+14150000001",
              senderDisplayName: "MyShop Support",
            };
            const labels = {
              apiUrl: "API URL",
              apiToken: "API Token",
              phoneNumberId: "Phone Number ID",
              wabaId: "WABA ID",
              whatsAppBusinessNumber: "WhatsApp Business Number",
              senderDisplayName: "Sender Display Name",
            };
            return (
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
                    onChange={handleChange}
                    placeholder={placeholders[key]}
                    className="w-full px-3 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 border-gray-300 resize-none"
                  />
                ) : (
                  <input
                    id={key}
                    type="text"
                    name={key}
                    value={formData[key] || ""}
                    onChange={handleChange}
                    placeholder={placeholders[key]}
                    className="w-full px-3 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 border-gray-300"
                  />
                )}
              </div>
            );
          })}

          <div className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              className="w-4 h-4"
            />
            <label className="text-sm font-medium text-gray-700">
              Is Active
            </label>
          </div>
        </div>

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

          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className={`px-4 py-2 rounded-md text-white text-sm font-medium ${
              deleting ? "bg-gray-400" : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {deleting ? "Deleting..." : "🗑 Delete Settings"}
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
