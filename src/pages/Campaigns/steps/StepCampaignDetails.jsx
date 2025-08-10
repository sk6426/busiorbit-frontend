import React, { useState } from "react";
import axiosClient from "../../../api/axiosClient";
import { toast } from "react-toastify";

function StepCampaignDetails({
  templateId,
  message,
  contactIds,
  campaignName,
  scheduledAt,
  onChange,
  onBack,
  onSubmitSuccess,
}) {
  const [submitting, setSubmitting] = useState(false);

  const handleLaunch = async () => {
    if (!campaignName || !templateId || !message || contactIds.length === 0) {
      toast.warn("⚠️ All fields are required (template, contacts, name).");
      return;
    }

    const payload = {
      name: campaignName,
      messageTemplate: message,
      templateId,
      contactIds,
      scheduledAt: scheduledAt || null,
    };

    try {
      setSubmitting(true);
      await axiosClient.post("/campaign", payload); // <-- Removed unused `res`
      toast.success("🚀 Campaign launched successfully!");
      onSubmitSuccess(); // Redirect or reset parent
    } catch (err) {
      toast.error("❌ Failed to launch campaign");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded shadow space-y-4">
      <h2 className="text-xl font-semibold text-purple-700">
        🚀 Step 3: Campaign Details
      </h2>

      {/* Campaign Name */}
      <label className="block text-sm font-medium text-gray-700">
        Campaign Name
      </label>
      <input
        type="text"
        value={campaignName}
        onChange={e => onChange({ campaignName: e.target.value })}
        className="border rounded px-3 py-2 w-full"
        placeholder="Diwali Promotion Blast"
      />

      {/* Schedule Date */}
      <label className="block text-sm font-medium text-gray-700">
        Schedule (Optional)
      </label>
      <input
        type="datetime-local"
        value={scheduledAt}
        onChange={e => onChange({ scheduledAt: e.target.value })}
        className="border rounded px-3 py-2 w-full"
      />
      <div className="text-xs text-gray-500">
        If not set, the campaign will be sent immediately.
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between mt-4">
        <button
          onClick={onBack}
          className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
        >
          ← Back
        </button>
        <button
          disabled={submitting}
          onClick={handleLaunch}
          className={`px-4 py-2 text-sm text-white rounded ${
            submitting
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-purple-600 hover:bg-purple-700"
          }`}
        >
          🚀 Launch Campaign
        </button>
      </div>
    </div>
  );
}

export default StepCampaignDetails;

// import React, { useState } from "react";
// import axiosClient from "../../../api/axiosClient";
// import { toast } from "react-toastify";

// function StepCampaignDetails({
//   templateId,
//   message,
//   contactIds,
//   campaignName,
//   scheduledAt,
//   onChange,
//   onBack,
//   onSubmitSuccess,
// }) {
//   const [submitting, setSubmitting] = useState(false);

//   const handleLaunch = async () => {
//     if (!campaignName || !templateId || !message || contactIds.length === 0) {
//       toast.warn("⚠️ All fields are required (template, contacts, name).");
//       return;
//     }

//     const payload = {
//       name: campaignName,
//       messageTemplate: message,
//       templateId,
//       contactIds,
//       scheduledAt: scheduledAt || null,
//     };

//     try {
//       setSubmitting(true);
//       const res = await axiosClient.post("/campaign", payload);
//       toast.success("🚀 Campaign launched successfully!");
//       onSubmitSuccess(); // Redirect or reset parent
//     } catch (err) {
//       toast.error("❌ Failed to launch campaign");
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   return (
//     <div className="bg-white p-6 rounded shadow space-y-4">
//       <h2 className="text-xl font-semibold text-purple-700">
//         🚀 Step 3: Campaign Details
//       </h2>

//       {/* Campaign Name */}
//       <label className="block text-sm font-medium text-gray-700">
//         Campaign Name
//       </label>
//       <input
//         type="text"
//         value={campaignName}
//         onChange={e => onChange({ campaignName: e.target.value })}
//         className="border rounded px-3 py-2 w-full"
//         placeholder="Diwali Promotion Blast"
//       />

//       {/* Schedule Date */}
//       <label className="block text-sm font-medium text-gray-700">
//         Schedule (Optional)
//       </label>
//       <input
//         type="datetime-local"
//         value={scheduledAt}
//         onChange={e => onChange({ scheduledAt: e.target.value })}
//         className="border rounded px-3 py-2 w-full"
//       />
//       <div className="text-xs text-gray-500">
//         If not set, the campaign will be sent immediately.
//       </div>

//       {/* Action Buttons */}
//       <div className="flex justify-between mt-4">
//         <button
//           onClick={onBack}
//           className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
//         >
//           ← Back
//         </button>
//         <button
//           disabled={submitting}
//           onClick={handleLaunch}
//           className={`px-4 py-2 text-sm text-white rounded ${
//             submitting
//               ? "bg-gray-400 cursor-not-allowed"
//               : "bg-purple-600 hover:bg-purple-700"
//           }`}
//         >
//           🚀 Launch Campaign
//         </button>
//       </div>
//     </div>
//   );
// }

// export default StepCampaignDetails;
