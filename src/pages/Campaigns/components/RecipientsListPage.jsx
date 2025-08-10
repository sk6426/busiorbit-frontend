// ✅ File: src/pages/Campaigns/RecipientsListPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosClient from "../../../api/axiosClient";
import { toast } from "react-toastify";

function RecipientsListPage() {
  const { id } = useParams(); // campaignId
  const navigate = useNavigate();

  const [recipients, setRecipients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);

  // 🔁 Load recipients on mount
  useEffect(() => {
    const fetchRecipients = async () => {
      try {
        const res = await axiosClient.get(`/campaign/recipients/${id}`);
        setRecipients(res.data || []);
      } catch (err) {
        console.error("❌ Failed to load recipients:", err);
        toast.error("Failed to load assigned recipients");
      } finally {
        setLoading(false);
      }
    };
    fetchRecipients();
  }, [id]);

  // ❌ Handle contact removal
  const handleRemove = async contactId => {
    const confirm = window.confirm(
      "Are you sure you want to remove this contact?"
    );
    if (!confirm) return;

    setRemovingId(contactId);
    try {
      await axiosClient.delete(`/campaigns/${id}/recipients/${contactId}`);
      setRecipients(prev => prev.filter(r => r.id !== contactId));
      toast.success("Contact removed successfully");
    } catch (err) {
      console.error("❌ Remove contact failed:", err);
      toast.error("Failed to remove contact");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white rounded-xl shadow-xl">
      {/* 🔙 Back button */}
      <button
        onClick={() => navigate("/app/campaigns/template-campaigns-list")}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-purple-100 text-purple-700 font-medium shadow-sm hover:bg-purple-50 hover:text-purple-900 transition-all group"
      >
        {/* Left Arrow Icon (Lucide or Heroicons, inline SVG for copy-paste) */}
        <svg
          className="w-5 h-5 text-purple-500 group-hover:text-purple-700 transition"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.25 19l-7-7 7-7"
          />
        </svg>
        <span>Back</span>
      </button>

      <h2 className="text-2xl font-bold text-purple-700 mb-4">
        📋 Assigned Recipients
      </h2>

      {loading ? (
        <p>Loading...</p>
      ) : recipients.length === 0 ? (
        <div className="text-gray-500">
          <p>No contacts have been assigned to this campaign.</p>
          <button
            onClick={() =>
              navigate(`/app/campaigns/image-campaigns/assign-contacts/${id}`)
            }
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
          >
            ➕ Assign Contacts
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 text-sm">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-2">#</th>
                <th className="p-2">Name</th>
                <th className="p-2">Phone</th>
                <th className="p-2">Email</th>
                <th className="p-2">Lead Source</th>
                <th className="p-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {recipients.map((contact, idx) => (
                <tr
                  key={contact.id}
                  className={`border-t ${
                    idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                  }`}
                >
                  <td className="p-2">{idx + 1}</td>
                  <td className="p-2">{contact.name}</td>
                  <td className="p-2">{contact.phoneNumber}</td>
                  <td className="p-2">{contact.email || "-"}</td>
                  <td className="p-2">{contact.leadSource || "-"}</td>
                  <td className="p-2 text-right">
                    <button
                      onClick={() => handleRemove(contact.id)}
                      disabled={removingId === contact.id}
                      className={`text-red-600 hover:underline ${
                        removingId === contact.id
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                    >
                      {removingId === contact.id ? "Removing..." : "❌ Remove"}
                    </button>
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

export default RecipientsListPage;

// // ✅ File: src/pages/Campaigns/RecipientsListPage.jsx
// import React, { useEffect, useState } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import axiosClient from "../../../api/axiosClient";
// import { toast } from "react-toastify";

// function RecipientsListPage() {
//   const { id } = useParams(); // campaignId
//   const navigate = useNavigate();

//   const [recipients, setRecipients] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [removingId, setRemovingId] = useState(null);

//   // 🔁 Load recipients on mount
//   useEffect(() => {
//     const fetchRecipients = async () => {
//       try {
//         const res = await axiosClient.get(`/campaign/recipients/${id}`);
//         setRecipients(res.data || []);
//       } catch (err) {
//         console.error("❌ Failed to load recipients:", err);
//         toast.error("Failed to load assigned recipients");
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchRecipients();
//   }, [id]);

//   // ❌ Handle contact removal
//   const handleRemove = async contactId => {
//     const confirm = window.confirm(
//       "Are you sure you want to remove this contact?"
//     );
//     if (!confirm) return;

//     setRemovingId(contactId);
//     try {
//       await axiosClient.delete(`/campaigns/${id}/recipients/${contactId}`);
//       setRecipients(prev => prev.filter(r => r.id !== contactId));
//       toast.success("Contact removed successfully");
//     } catch (err) {
//       console.error("❌ Remove contact failed:", err);
//       toast.error("Failed to remove contact");
//     } finally {
//       setRemovingId(null);
//     }
//   };

//   return (
//     <div className="max-w-5xl mx-auto p-6 bg-white rounded-xl shadow-xl">
//       {/* 🔙 Back button */}
//       <button
//         onClick={() => navigate("/app/campaigns/image-campaign-list")}
//         className="text-sm text-purple-600 hover:underline mb-4"
//       >
//         ← Back to Campaigns
//       </button>

//       <h2 className="text-2xl font-bold text-purple-700 mb-4">
//         📋 Assigned Recipients
//       </h2>

//       {loading ? (
//         <p>Loading...</p>
//       ) : recipients.length === 0 ? (
//         <div className="text-gray-500">
//           <p>No contacts have been assigned to this campaign.</p>
//           <button
//             onClick={() =>
//               navigate(`/app/campaigns/image-campaigns/assign-contacts/${id}`)
//             }
//             className="mt-4 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
//           >
//             ➕ Assign Contacts
//           </button>
//         </div>
//       ) : (
//         <div className="overflow-x-auto">
//           <table className="min-w-full border border-gray-200 text-sm">
//             <thead>
//               <tr className="bg-gray-100 text-left">
//                 <th className="p-2">#</th>
//                 <th className="p-2">Name</th>
//                 <th className="p-2">Phone</th>
//                 <th className="p-2">Email</th>
//                 <th className="p-2">Lead Source</th>
//                 <th className="p-2 text-right">Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {recipients.map((contact, idx) => (
//                 <tr
//                   key={contact.id}
//                   className={`border-t ${
//                     idx % 2 === 0 ? "bg-white" : "bg-gray-50"
//                   }`}
//                 >
//                   <td className="p-2">{idx + 1}</td>
//                   <td className="p-2">{contact.name}</td>
//                   <td className="p-2">{contact.phoneNumber}</td>
//                   <td className="p-2">{contact.email || "-"}</td>
//                   <td className="p-2">{contact.leadSource || "-"}</td>
//                   <td className="p-2 text-right">
//                     <button
//                       onClick={() => handleRemove(contact.id)}
//                       disabled={removingId === contact.id}
//                       className={`text-red-600 hover:underline ${
//                         removingId === contact.id
//                           ? "opacity-50 cursor-not-allowed"
//                           : ""
//                       }`}
//                     >
//                       {removingId === contact.id ? "Removing..." : "❌ Remove"}
//                     </button>
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

// export default RecipientsListPage;
