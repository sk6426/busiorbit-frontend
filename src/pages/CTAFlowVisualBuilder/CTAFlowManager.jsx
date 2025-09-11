import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import { toast } from "react-toastify";

export default function CTAFlowManager() {
  const [flows, setFlows] = useState([]);
  const [activeTab, setActiveTab] = useState("draft");
  const [loading, setLoading] = useState(true); // start true so spinner shows on first load
  const navigate = useNavigate();

  const fetchFlows = async (tab = "draft") => {
    setLoading(true);
    try {
      const endpoint =
        tab === "published" ? "/cta-flow/all-published" : "/cta-flow/all-draft";
      const res = await axiosClient.get(endpoint);
      setFlows(Array.isArray(res.data) ? res.data : [res.data]);
    } catch (err) {
      setFlows([]);
      toast.error("❌ Failed to load flows");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlows("draft");
  }, []);

  const handleDelete = async id => {
    const confirm = window.confirm(
      "Are you sure you want to delete this flow?"
    );
    if (!confirm) return;

    setLoading(true);
    try {
      await axiosClient.delete(`/cta-flow/delete/${id}`);
      toast.success("✅ Flow deleted successfully");
      await fetchFlows(activeTab);
    } catch (err) {
      toast.error("❌ Failed to delete flow");
      console.error(err);
      setLoading(false);
    }
  };

  const formatDate = date => {
    const d = new Date(date);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="p-6 relative">
      {/* Spinner overlay (independent of Tailwind animate-spin) */}
      {loading && (
        <>
          <div className="absolute inset-0 z-40 bg-white/60 backdrop-blur-[1px] flex items-center justify-center">
            <div className="flex items-center gap-3 text-gray-700">
              <svg
                className="xafb-spin h-6 w-6 text-purple-600"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  opacity="0.25"
                />
                <path
                  d="M4 12a8 8 0 018-8"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  opacity="0.85"
                />
              </svg>
              <span className="text-sm">Loading flows…</span>
            </div>
          </div>
          <style>{`
            @keyframes xafb-spin { to { transform: rotate(360deg); } }
            .xafb-spin { animation: xafb-spin 1s linear infinite; }
          `}</style>
        </>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            🧩 CTA Flow Manager
          </h1>
          <p className="text-sm text-gray-500">
            Create, edit, and manage your visual flows.
          </p>
        </div>
        <button
          onClick={() => navigate("/app/cta-flow/visual-builder")}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md shadow disabled:opacity-50"
          disabled={loading}
        >
          ➕ New Flow
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b mb-4 text-sm font-medium">
        {["draft", "published"].map(tab => (
          <button
            key={tab}
            className={`pb-2 transition-all ${
              activeTab === tab
                ? "text-purple-600 border-b-2 border-purple-600"
                : "text-gray-500 hover:text-purple-600"
            }`}
            onClick={() => {
              setActiveTab(tab);
              fetchFlows(tab);
            }}
            disabled={loading}
          >
            {tab === "draft" ? "📝 Draft Flows" : "✅ Published Flows"}
          </button>
        ))}
      </div>

      {/* Table / Empty state */}
      {flows.length === 0 ? (
        <div className="text-gray-500 text-center py-10">
          No {activeTab} flows found.
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b text-gray-500 uppercase text-xs tracking-wide">
              <tr>
                <th className="px-4 py-3">Flow Name</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Last Modified</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {flows.map(flow => (
                <tr
                  key={flow.id}
                  className="hover:bg-gray-50 transition-all duration-150"
                >
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {flow.flowName}
                  </td>
                  <td className="px-4 py-3">
                    {flow.isPublished ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        ✅ Published
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                        📝 Draft
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {formatDate(flow.updatedAt || flow.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() =>
                          navigate(
                            `/app/cta-flow/visual-builder?id=${flow.id}&mode=view`
                          )
                        }
                        className="text-blue-600 hover:underline text-xs disabled:opacity-50"
                        disabled={loading}
                      >
                        👁️ View
                      </button>
                      {!flow.isPublished && (
                        <button
                          onClick={() =>
                            navigate(
                              `/app/cta-flow/visual-builder?id=${flow.id}&mode=edit`
                            )
                          }
                          className="text-yellow-600 hover:underline text-xs disabled:opacity-50"
                          disabled={loading}
                        >
                          ✏️ Edit
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(flow.id)}
                        className="text-red-600 hover:underline text-xs disabled:opacity-50"
                        disabled={loading}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// import React, { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import axiosClient from "../../api/axiosClient";
// import { toast } from "react-toastify";

// export default function CTAFlowManager() {
//   const [flows, setFlows] = useState([]);
//   const [activeTab, setActiveTab] = useState("draft");
//   const navigate = useNavigate();

//   const fetchFlows = async (tab = "draft") => {
//     try {
//       const endpoint =
//         tab === "published" ? "/cta-flow/all-published" : "/cta-flow/all-draft";

//       const res = await axiosClient.get(endpoint);
//       setFlows(Array.isArray(res.data) ? res.data : [res.data]);
//     } catch (err) {
//       toast.error("❌ Failed to load flows");
//       console.error(err);
//     }
//   };

//   useEffect(() => {
//     fetchFlows("draft");
//   }, []);

//   const handleDelete = async id => {
//     const confirm = window.confirm(
//       "Are you sure you want to delete this flow?"
//     );
//     if (!confirm) return;

//     try {
//       await axiosClient.delete(`/cta-flow/delete/${id}`);
//       toast.success("✅ Flow deleted successfully");
//       fetchFlows(activeTab);
//     } catch (err) {
//       toast.error("❌ Failed to delete flow");
//       console.error(err);
//     }
//   };

//   const formatDate = date => {
//     const d = new Date(date);
//     return d.toLocaleDateString("en-IN", {
//       day: "2-digit",
//       month: "short",
//       year: "numeric",
//       hour: "2-digit",
//       minute: "2-digit",
//     });
//   };

//   return (
//     <div className="p-6">
//       {/* Header */}
//       <div className="flex justify-between items-center mb-6">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900">
//             🧩 CTA Flow Manager
//           </h1>
//           <p className="text-sm text-gray-500">
//             Create, edit, and manage your visual flows.
//           </p>
//         </div>
//         <button
//           onClick={() => navigate("/app/cta-flow/visual-builder")}
//           className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md shadow"
//         >
//           ➕ New Flow
//         </button>
//       </div>

//       {/* Tabs */}
//       <div className="flex gap-6 border-b mb-4 text-sm font-medium">
//         {["draft", "published"].map(tab => (
//           <button
//             key={tab}
//             className={`pb-2 transition-all ${
//               activeTab === tab
//                 ? "text-purple-600 border-b-2 border-purple-600"
//                 : "text-gray-500 hover:text-purple-600"
//             }`}
//             onClick={() => {
//               setActiveTab(tab);
//               fetchFlows(tab);
//             }}
//           >
//             {tab === "draft" ? "📝 Draft Flows" : "✅ Published Flows"}
//           </button>
//         ))}
//       </div>

//       {/* Table */}
//       {flows.length === 0 ? (
//         <div className="text-gray-500 text-center py-10">
//           No {activeTab} flows found.
//         </div>
//       ) : (
//         <div className="bg-white rounded-xl shadow overflow-hidden">
//           <table className="w-full text-sm text-left">
//             <thead className="bg-gray-50 border-b text-gray-500 uppercase text-xs tracking-wide">
//               <tr>
//                 <th className="px-4 py-3">Flow Name</th>
//                 <th className="px-4 py-3">Status</th>
//                 <th className="px-4 py-3">Last Modified</th>
//                 <th className="px-4 py-3 text-right">Actions</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-gray-100">
//               {flows.map(flow => (
//                 <tr
//                   key={flow.id}
//                   className="hover:bg-gray-50 transition-all duration-150"
//                 >
//                   <td className="px-4 py-3 font-medium text-gray-800">
//                     {flow.flowName}
//                   </td>
//                   <td className="px-4 py-3">
//                     {flow.isPublished ? (
//                       <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
//                         ✅ Published
//                       </span>
//                     ) : (
//                       <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
//                         📝 Draft
//                       </span>
//                     )}
//                   </td>
//                   <td className="px-4 py-3 text-gray-600">
//                     {formatDate(flow.updatedAt || flow.createdAt)}
//                   </td>
//                   <td className="px-4 py-3">
//                     <div className="flex justify-end gap-2">
//                       <button
//                         onClick={() =>
//                           navigate(
//                             `/app/cta-flow/visual-builder?id=${flow.id}&mode=view`
//                           )
//                         }
//                         className="text-blue-600 hover:underline text-xs"
//                       >
//                         👁️ View
//                       </button>
//                       {!flow.isPublished && (
//                         <button
//                           onClick={() =>
//                             navigate(
//                               `/app/cta-flow/visual-builder?id=${flow.id}&mode=edit`
//                             )
//                           }
//                           className="text-yellow-600 hover:underline text-xs"
//                         >
//                           ✏️ Edit
//                         </button>
//                       )}
//                       <button
//                         onClick={() => handleDelete(flow.id)}
//                         className="text-red-600 hover:underline text-xs"
//                       >
//                         🗑️ Delete
//                       </button>
//                     </div>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       )}
//     </div>
//   );
// }

// import React, { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import axiosClient from "../../api/axiosClient";
// import { toast } from "react-toastify";

// export default function CTAFlowManager() {
//   const [flows, setFlows] = useState([]);
//   const [activeTab, setActiveTab] = useState("draft");
//   const navigate = useNavigate();

//   const fetchFlows = async (tab = "draft") => {
//     try {
//       const endpoint =
//         tab === "published" ? "/cta-flow/all-published" : "/cta-flow/all-draft";

//       const res = await axiosClient.get(endpoint);
//       setFlows(Array.isArray(res.data) ? res.data : [res.data]);
//     } catch (err) {
//       toast.error("❌ Failed to load flows");
//       console.error(err);
//     }
//   };

//   useEffect(() => {
//     fetchFlows("draft");
//   }, []);

//   const handleDelete = async id => {
//     const confirm = window.confirm(
//       "Are you sure you want to delete this flow?"
//     );
//     if (!confirm) return;

//     try {
//       await axiosClient.delete(`/cta-flow/delete/${id}`);
//       toast.success("✅ Flow deleted successfully");
//       fetchFlows(activeTab);
//     } catch (err) {
//       toast.error("❌ Failed to delete flow");
//       console.error(err);
//     }
//   };

//   const formatDate = date => {
//     const d = new Date(date);
//     return d.toLocaleDateString("en-IN", {
//       day: "2-digit",
//       month: "short",
//       year: "numeric",
//       hour: "2-digit",
//       minute: "2-digit",
//     });
//   };

//   return (
//     <div className="p-6">
//       {/* Header */}
//       <div className="flex justify-between items-center mb-6">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900">
//             🧩 CTA Flow Manager
//           </h1>
//           <p className="text-sm text-gray-500">
//             Create, edit, and manage your visual flows.
//           </p>
//         </div>
//         <button
//           onClick={() => navigate("/app/cta-flow/visual-builder")}
//           className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md shadow"
//         >
//           ➕ New Flow
//         </button>
//       </div>

//       {/* Tabs */}
//       <div className="flex gap-6 border-b mb-4 text-sm font-medium">
//         {["draft", "published"].map(tab => (
//           <button
//             key={tab}
//             className={`pb-2 transition-all ${
//               activeTab === tab
//                 ? "text-purple-600 border-b-2 border-purple-600"
//                 : "text-gray-500 hover:text-purple-600"
//             }`}
//             onClick={() => {
//               setActiveTab(tab);
//               fetchFlows(tab);
//             }}
//           >
//             {tab === "draft" ? "📝 Draft Flows" : "✅ Published Flows"}
//           </button>
//         ))}
//       </div>

//       {/* Table */}
//       {flows.length === 0 ? (
//         <div className="text-gray-500 text-center py-10">
//           No {activeTab} flows found.
//         </div>
//       ) : (
//         <div className="bg-white rounded-xl shadow overflow-hidden">
//           <table className="w-full text-sm text-left">
//             <thead className="bg-gray-50 border-b text-gray-500 uppercase text-xs tracking-wide">
//               <tr>
//                 <th className="px-4 py-3">Flow Name</th>
//                 <th className="px-4 py-3">Status</th>
//                 <th className="px-4 py-3">Last Modified</th>
//                 <th className="px-4 py-3 text-right">Actions</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-gray-100">
//               {flows.map(flow => (
//                 <tr
//                   key={flow.id}
//                   className="hover:bg-gray-50 transition-all duration-150"
//                 >
//                   <td className="px-4 py-3 font-medium text-gray-800">
//                     {flow.flowName}
//                   </td>
//                   <td className="px-4 py-3">
//                     {flow.isPublished ? (
//                       <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
//                         ✅ Published
//                       </span>
//                     ) : (
//                       <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
//                         📝 Draft
//                       </span>
//                     )}
//                   </td>
//                   <td className="px-4 py-3 text-gray-600">
//                     {formatDate(flow.updatedAt || flow.createdAt)}
//                   </td>
//                   <td className="px-4 py-3">
//                     <div className="flex justify-end gap-2">
//                       <button
//                         onClick={() =>
//                           navigate(
//                             `/app/cta-flow-builder?id=${flow.id}&mode=view`
//                           )
//                         }
//                         className="text-blue-600 hover:underline text-xs"
//                       >
//                         👁️ View
//                       </button>
//                       {!flow.isPublished && (
//                         <button
//                           onClick={() =>
//                             navigate(
//                               `/app/cta-flow-builder?id=${flow.id}&mode=edit`
//                             )
//                           }
//                           className="text-yellow-600 hover:underline text-xs"
//                         >
//                           ✏️ Edit
//                         </button>
//                       )}
//                       <button
//                         onClick={() => handleDelete(flow.id)}
//                         className="text-red-600 hover:underline text-xs"
//                       >
//                         🗑️ Delete
//                       </button>
//                     </div>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       )}
//     </div>
//   );
// }
