import React, { useEffect, useState } from "react";
import axiosClient from "../../api/axiosClient";
import { toast } from "react-toastify";
import WhatsAppBubblePreview from "../../components/WhatsAppBubblePreview";
import { useNavigate } from "react-router-dom";
import { FaRocket } from "react-icons/fa";

function TemplateCampaignList() {
  const [campaigns, setCampaigns] = useState([]);
  const [sendingId, setSendingId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        const res = await axiosClient.get("/campaign/get-image-campaign");
        setCampaigns(res.data || []);
      } catch (err) {
        console.error(err);
        toast.error("❌ Failed to load template campaigns");
      }
    };
    loadCampaigns();
  }, []);

  const handleSend = async campaignId => {
    setSendingId(campaignId);
    try {
      await axiosClient.post(`/campaign/send-campaign/${campaignId}`);
      toast.success("🚀 Campaign sent successfully!");
    } catch (err) {
      console.error("❌ Sending failed:", err);
      toast.error("❌ Failed to send campaign");
    } finally {
      setSendingId(null);
    }
  };

  // Utility: Get the message body from all likely fields
  function getMessageBody(campaign) {
    return (
      campaign.messageBody ||
      campaign.templateBody ||
      campaign.sampleBody ||
      campaign.messageTemplate ||
      campaign.body ||
      ""
    );
  }

  // Utility: Get buttons (array) from all likely fields
  function getButtons(campaign) {
    return (
      campaign.multiButtons || campaign.buttonParams || campaign.buttons || []
    );
  }

  // Utility: Get caption from all likely fields
  function getCaption(campaign) {
    return campaign.imageCaption || campaign.caption || "";
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold text-purple-700 mb-8 flex items-center gap-2">
        <FaRocket className="text-green-500" />
        Template Campaigns
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
        {campaigns.length === 0 ? (
          <div className="col-span-full text-gray-500 text-lg mt-8">
            No template campaigns available.
          </div>
        ) : (
          campaigns.map(campaign => (
            <div
              key={campaign.id}
              className="flex flex-col bg-white rounded-xl shadow border px-6 py-4 min-h-[540px] relative"
              style={{ minWidth: 340, maxWidth: 410 }}
            >
              {/* Gradient Bar */}
              <div className="absolute left-0 top-0 h-2 w-full rounded-t-xl bg-gradient-to-r from-purple-500 via-purple-400 to-green-400"></div>
              {/* Header Row */}
              <div className="flex items-center justify-between mt-2 mb-2">
                <h3 className="text-lg font-semibold text-purple-800">
                  {campaign.name}
                </h3>
                <span className="text-xs flex items-center gap-1 px-2 py-1 bg-gray-100 rounded font-medium">
                  <svg
                    width={18}
                    height={18}
                    className="inline-block text-gray-500"
                    fill="none"
                    stroke="currentColor"
                  >
                    <rect x="2" y="2" width="14" height="14" rx="2" />
                    <path d="M2 12l4-4a2 2 0 012.8 0l5.2 5.2" />
                    <path d="M14 6h.01" />
                  </svg>
                  Image
                </span>
              </div>
              {/* Image Preview */}
              <div className="bg-gray-100 rounded-lg flex items-center justify-center min-h-[180px] mb-3 border border-gray-200">
                {campaign.imageUrl ? (
                  <img
                    src={campaign.imageUrl}
                    alt="Campaign"
                    className="object-contain max-h-44 max-w-full rounded"
                  />
                ) : (
                  <div className="flex flex-col items-center text-gray-400 py-10">
                    <svg
                      width={54}
                      height={54}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 48 48"
                    >
                      <rect
                        x="7"
                        y="11"
                        width="34"
                        height="26"
                        rx="2"
                        strokeWidth={2}
                      />
                      <path
                        d="M7 32l8.4-8.8c1.1-1.1 2.9-1.1 4 0L31 32M21.5 20.5a2.5 2.5 0 115 0 2.5 2.5 0 01-5 0z"
                        strokeWidth={2}
                      />
                    </svg>
                    <span className="mt-2 text-sm">No Image</span>
                  </div>
                )}
              </div>
              {/* Recipients Badge */}
              <div className="mb-2">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium
      ${
        campaign.recipientCount > 0
          ? "bg-green-100 text-green-700"
          : "bg-gray-100 text-gray-500"
      }`}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM5 13a7 7 0 0110 0" />
                  </svg>
                  {campaign.recipientCount || 0} Recipients
                </span>
              </div>

              {/* WhatsApp Bubble Preview */}
              <div className="mb-2">
                <WhatsAppBubblePreview
                  messageTemplate={getMessageBody(campaign)}
                  multiButtons={getButtons(campaign)}
                  imageUrl={campaign.imageUrl}
                  caption={getCaption(campaign)}
                  campaignId={campaign.id}
                />
              </div>

              {/* Spacer to push buttons to bottom */}
              <div className="flex-1"></div>
              {/* Action Buttons */}
              <div className="flex gap-2 mt-3 pt-1 w-full">
                <button
                  disabled={
                    !campaign.recipientCount || sendingId === campaign.id
                  }
                  onClick={() => handleSend(campaign.id)}
                  className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg font-semibold shadow-sm transition
        ${
          !campaign.recipientCount
            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
            : "bg-green-600 text-white hover:bg-green-700"
        }
      `}
                >
                  <span role="img" aria-label="Send">
                    🚀
                  </span>{" "}
                  Send
                </button>
                <button
                  onClick={() =>
                    navigate(
                      `/app/campaigns/image-campaigns/assign-contacts/${campaign.id}`
                    )
                  }
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg font-semibold bg-purple-100 text-purple-800 hover:bg-purple-200 transition"
                >
                  <span role="img" aria-label="Assign">
                    📇
                  </span>{" "}
                  Assign
                </button>
                <button
                  onClick={() =>
                    navigate(
                      `/app/campaigns/image-campaigns/assigned-contacts/${campaign.id}`
                    )
                  }
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg font-semibold bg-blue-100 text-blue-700 hover:bg-blue-200 transition"
                >
                  <span role="img" aria-label="Recipients">
                    👁️
                  </span>{" "}
                  Recipients
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default TemplateCampaignList;

// import React, { useEffect, useState } from "react";
// import axiosClient from "../../api/axiosClient";
// import { toast } from "react-toastify";
// import WhatsAppBubblePreview from "../../components/WhatsAppBubblePreview";
// import { useNavigate } from "react-router-dom";
// import { FaRocket } from "react-icons/fa";

// function TemplateCampaignList() {
//   const [campaigns, setCampaigns] = useState([]);
//   const [sendingId, setSendingId] = useState(null);
//   const navigate = useNavigate();

//   useEffect(() => {
//     const loadCampaigns = async () => {
//       try {
//         const res = await axiosClient.get("/campaign/get-image-campaign");
//         setCampaigns(res.data || []);
//       } catch (err) {
//         console.error(err);
//         toast.error("❌ Failed to load template campaigns");
//       }
//     };
//     loadCampaigns();
//   }, []);

//   const handleSend = async campaignId => {
//     setSendingId(campaignId);
//     try {
//       await axiosClient.post(`/campaign/send-campaign/${campaignId}`);
//       toast.success("🚀 Campaign sent successfully!");
//     } catch (err) {
//       console.error("❌ Sending failed:", err);
//       toast.error("❌ Failed to send campaign");
//     } finally {
//       setSendingId(null);
//     }
//   };

//   return (
//     <div className="max-w-7xl mx-auto px-4 py-8">
//       <h2 className="text-3xl font-bold text-purple-700 mb-8 flex items-center gap-2">
//         <FaRocket className="text-green-500" />
//         Template Campaigns
//       </h2>

//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
//         {campaigns.length === 0 ? (
//           <div className="col-span-full text-gray-500 text-lg mt-8">
//             No template campaigns available.
//           </div>
//         ) : (
//           campaigns.map(campaign => (
//             <div
//               key={campaign.id}
//               className="flex flex-col bg-white rounded-xl shadow border px-6 py-4 min-h-[540px] relative"
//               style={{ minWidth: 340, maxWidth: 410 }}
//             >
//               {/* Gradient Bar */}
//               <div className="absolute left-0 top-0 h-2 w-full rounded-t-xl bg-gradient-to-r from-purple-500 via-purple-400 to-green-400"></div>
//               {/* Header Row */}
//               <div className="flex items-center justify-between mt-2 mb-2">
//                 <h3 className="text-lg font-semibold text-purple-800">
//                   {campaign.name}
//                 </h3>
//                 <span className="text-xs flex items-center gap-1 px-2 py-1 bg-gray-100 rounded font-medium">
//                   <svg
//                     width={18}
//                     height={18}
//                     className="inline-block text-gray-500"
//                     fill="none"
//                     stroke="currentColor"
//                   >
//                     <rect x="2" y="2" width="14" height="14" rx="2" />
//                     <path d="M2 12l4-4a2 2 0 012.8 0l5.2 5.2" />
//                     <path d="M14 6h.01" />
//                   </svg>
//                   Image
//                 </span>
//               </div>
//               {/* Image Preview */}
//               <div className="bg-gray-100 rounded-lg flex items-center justify-center min-h-[180px] mb-3 border border-gray-200">
//                 {campaign.imageUrl ? (
//                   <img
//                     src={campaign.imageUrl}
//                     alt="Campaign"
//                     className="object-contain max-h-44 max-w-full rounded"
//                   />
//                 ) : (
//                   <div className="flex flex-col items-center text-gray-400 py-10">
//                     <svg
//                       width={54}
//                       height={54}
//                       fill="none"
//                       stroke="currentColor"
//                       viewBox="0 0 48 48"
//                     >
//                       <rect
//                         x="7"
//                         y="11"
//                         width="34"
//                         height="26"
//                         rx="2"
//                         strokeWidth={2}
//                       />
//                       <path
//                         d="M7 32l8.4-8.8c1.1-1.1 2.9-1.1 4 0L31 32M21.5 20.5a2.5 2.5 0 115 0 2.5 2.5 0 01-5 0z"
//                         strokeWidth={2}
//                       />
//                     </svg>
//                     <span className="mt-2 text-sm">No Image</span>
//                   </div>
//                 )}
//               </div>
//               {/* Recipients Badge */}
//               <div className="mb-2">
//                 <span
//                   className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium
//       ${
//         campaign.recipientCount > 0
//           ? "bg-green-100 text-green-700"
//           : "bg-gray-100 text-gray-500"
//       }`}
//                 >
//                   <svg
//                     className="w-4 h-4"
//                     fill="none"
//                     stroke="currentColor"
//                     viewBox="0 0 20 20"
//                   >
//                     <path d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM5 13a7 7 0 0110 0" />
//                   </svg>
//                   {campaign.recipientCount || 0} Recipients
//                 </span>
//               </div>

//               {/* WhatsApp Bubble Preview */}
//               <div className="mb-2">
//                 <WhatsAppBubblePreview
//                   messageTemplate={
//                     campaign.messageBody ||
//                     campaign.templateBody ||
//                     campaign.sampleBody ||
//                     campaign.messageTemplate ||
//                     "No message body"
//                   }
//                   multiButtons={
//                     campaign.multiButtons ||
//                     campaign.buttonParams ||
//                     campaign.buttons ||
//                     []
//                   }
//                   imageUrl={campaign.imageUrl}
//                   caption={campaign.imageCaption || ""}
//                   campaignId={campaign.id}
//                 />
//               </div>

//               {/* Spacer to push buttons to bottom */}
//               <div className="flex-1"></div>
//               {/* Action Buttons */}
//               <div className="flex gap-2 mt-3 pt-1 w-full">
//                 <button
//                   disabled={
//                     !campaign.recipientCount || sendingId === campaign.id
//                   }
//                   onClick={() => handleSend(campaign.id)}
//                   className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg font-semibold shadow-sm transition
//         ${
//           !campaign.recipientCount
//             ? "bg-gray-200 text-gray-400 cursor-not-allowed"
//             : "bg-green-600 text-white hover:bg-green-700"
//         }
//       `}
//                 >
//                   <span role="img" aria-label="Send">
//                     🚀
//                   </span>{" "}
//                   Send
//                 </button>
//                 <button
//                   onClick={() =>
//                     navigate(
//                       `/app/campaigns/image-campaigns/assign-contacts/${campaign.id}`
//                     )
//                   }
//                   className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg font-semibold bg-purple-100 text-purple-800 hover:bg-purple-200 transition"
//                 >
//                   <span role="img" aria-label="Assign">
//                     📇
//                   </span>{" "}
//                   Assign
//                 </button>
//                 <button
//                   onClick={() =>
//                     navigate(
//                       `/app/campaigns/image-campaigns/assigned-contacts/${campaign.id}`
//                     )
//                   }
//                   className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg font-semibold bg-blue-100 text-blue-700 hover:bg-blue-200 transition"
//                 >
//                   <span role="img" aria-label="Recipients">
//                     👁️
//                   </span>{" "}
//                   Recipients
//                 </button>
//               </div>
//             </div>
//           ))
//         )}
//       </div>
//     </div>
//   );
// }

// export default TemplateCampaignList;

// // ✅ File: src/pages/Campaigns/TemplateCampaignList.jsx

// import React, { useEffect, useState } from "react";
// import axiosClient from "../../api/axiosClient";
// import { toast } from "react-toastify";
// import { useNavigate } from "react-router-dom";
// import WhatsAppBubblePreview from "../../components/WhatsAppBubblePreview";
// import {
//   FaRocket,
//   FaAddressBook,
//   FaEye,
//   FaImage,
//   FaUsers,
// } from "react-icons/fa";

// function TemplateCampaignList() {
//   const [campaigns, setCampaigns] = useState([]);
//   const [sendingId, setSendingId] = useState(null);
//   const navigate = useNavigate();

//   useEffect(() => {
//     const loadCampaigns = async () => {
//       try {
//         const res = await axiosClient.get("/campaign/get-image-campaign");
//         setCampaigns(res.data || []);
//       } catch (err) {
//         console.error(err);
//         toast.error("❌ Failed to load template campaigns");
//       }
//     };
//     loadCampaigns();
//   }, []);

//   const handleSend = async campaignId => {
//     setSendingId(campaignId);
//     try {
//       await axiosClient.post(`/campaign/send-campaign/${campaignId}`);
//       toast.success("🚀 Campaign sent successfully!");
//     } catch (err) {
//       console.error("❌ Sending failed:", err);
//       toast.error("❌ Failed to send campaign");
//     } finally {
//       setSendingId(null);
//     }
//   };

//   return (
//     <div className="max-w-7xl mx-auto px-4 py-8">
//       <h2 className="text-3xl font-bold text-purple-700 mb-8 flex items-center gap-2">
//         <FaRocket className="text-green-500" />
//         Template Campaigns
//       </h2>

//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
//         {campaigns.length === 0 ? (
//           <div className="col-span-full text-gray-500 text-lg mt-8">
//             No template campaigns available.
//           </div>
//         ) : (
//           campaigns.map(campaign => (
//             <div
//               key={campaign.id}
//               className="flex flex-col bg-white rounded-xl shadow border px-6 py-4 min-h-[540px] relative"
//               style={{ minWidth: 340, maxWidth: 410 }}
//             >
//               {/* Gradient Bar */}
//               <div className="absolute left-0 top-0 h-2 w-full rounded-t-xl bg-gradient-to-r from-purple-500 via-purple-400 to-green-400"></div>
//               {/* Header Row */}
//               <div className="flex items-center justify-between mt-2 mb-2">
//                 <h3 className="text-lg font-semibold text-purple-800">
//                   {campaign.name}
//                 </h3>
//                 <span className="text-xs flex items-center gap-1 px-2 py-1 bg-gray-100 rounded font-medium">
//                   <svg
//                     width={18}
//                     height={18}
//                     className="inline-block text-gray-500"
//                     fill="none"
//                     stroke="currentColor"
//                   >
//                     <rect x="2" y="2" width="14" height="14" rx="2" />
//                     <path d="M2 12l4-4a2 2 0 012.8 0l5.2 5.2" />
//                     <path d="M14 6h.01" />
//                   </svg>
//                   Image
//                 </span>
//               </div>
//               {/* Image Preview */}
//               <div className="bg-gray-100 rounded-lg flex items-center justify-center min-h-[180px] mb-3 border border-gray-200">
//                 {campaign.imageUrl ? (
//                   <img
//                     src={campaign.imageUrl}
//                     alt="Campaign"
//                     className="object-contain max-h-44 max-w-full rounded"
//                   />
//                 ) : (
//                   <div className="flex flex-col items-center text-gray-400 py-10">
//                     <svg
//                       width={54}
//                       height={54}
//                       fill="none"
//                       stroke="currentColor"
//                       viewBox="0 0 48 48"
//                     >
//                       <rect
//                         x="7"
//                         y="11"
//                         width="34"
//                         height="26"
//                         rx="2"
//                         strokeWidth={2}
//                       />
//                       <path
//                         d="M7 32l8.4-8.8c1.1-1.1 2.9-1.1 4 0L31 32M21.5 20.5a2.5 2.5 0 115 0 2.5 2.5 0 01-5 0z"
//                         strokeWidth={2}
//                       />
//                     </svg>
//                     <span className="mt-2 text-sm">No Image</span>
//                   </div>
//                 )}
//               </div>
//               {/* Recipients Badge */}
//               <div className="mb-2">
//                 <span
//                   className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium
//       ${
//         campaign.recipientCount > 0
//           ? "bg-green-100 text-green-700"
//           : "bg-gray-100 text-gray-500"
//       }`}
//                 >
//                   <svg
//                     className="w-4 h-4"
//                     fill="none"
//                     stroke="currentColor"
//                     viewBox="0 0 20 20"
//                   >
//                     <path d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM5 13a7 7 0 0110 0" />
//                   </svg>
//                   {campaign.recipientCount || 0} Recipients
//                 </span>
//               </div>
//               {/* Template Preview */}
//               <div className="bg-gray-50 rounded-lg p-3 min-h-[84px] mb-2 border border-gray-100">
//                 <div className="font-mono text-xs text-gray-700 break-all">
//                   {campaign.messageTemplate || "Template Preview"}
//                 </div>
//               </div>
//               {/* Spacer to push buttons to bottom */}
//               <div className="flex-1"></div>
//               {/* Action Buttons */}
//               <div className="flex gap-2 mt-3 pt-1 w-full">
//                 <button
//                   disabled={
//                     !campaign.recipientCount || sendingId === campaign.id
//                   }
//                   onClick={() => handleSend(campaign.id)}
//                   className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg font-semibold shadow-sm transition
//         ${
//           !campaign.recipientCount
//             ? "bg-gray-200 text-gray-400 cursor-not-allowed"
//             : "bg-green-600 text-white hover:bg-green-700"
//         }
//       `}
//                 >
//                   <span role="img" aria-label="Send">
//                     🚀
//                   </span>{" "}
//                   Send
//                 </button>
//                 <button
//                   onClick={() =>
//                     navigate(
//                       `/app/campaigns/image-campaigns/assign-contacts/${campaign.id}`
//                     )
//                   }
//                   className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg font-semibold bg-purple-100 text-purple-800 hover:bg-purple-200 transition"
//                 >
//                   <span role="img" aria-label="Assign">
//                     📇
//                   </span>{" "}
//                   Assign
//                 </button>
//                 <button
//                   onClick={() =>
//                     navigate(
//                       `/app/campaigns/image-campaigns/assigned-contacts/${campaign.id}`
//                     )
//                   }
//                   className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg font-semibold bg-blue-100 text-blue-700 hover:bg-blue-200 transition"
//                 >
//                   <span role="img" aria-label="Recipients">
//                     👁️
//                   </span>{" "}
//                   Recipients
//                 </button>
//               </div>
//             </div>
//           ))
//         )}
//       </div>
//     </div>
//   );
// }

// export default TemplateCampaignList;

// ✅ File: src/pages/Campaigns/TemplateCampaignList.jsx
// import React, { useEffect, useState } from "react";
// import axiosClient from "../../api/axiosClient";
// import { toast } from "react-toastify";
// import { useNavigate } from "react-router-dom";
// import WhatsAppBubblePreview from "../../components/WhatsAppBubblePreview";

// function TemplateCampaignList() {
//   const [campaigns, setCampaigns] = useState([]);
//   const [sendingId, setSendingId] = useState(null);
//   const navigate = useNavigate();

//   useEffect(() => {
//     const loadCampaigns = async () => {
//       try {
//         const res = await axiosClient.get("/campaign/get-image-campaign");
//         setCampaigns(res.data || []);
//       } catch (err) {
//         console.error(err);
//         toast.error("❌ Failed to load template campaigns");
//       }
//     };
//     loadCampaigns();
//   }, []);

//   const handleSend = async campaignId => {
//     setSendingId(campaignId);
//     try {
//       // await axiosClient.post(`/campaign/send-template-campaign/${campaignId}`);
//       await axiosClient.post(`/campaign/send-campaign/${campaignId}`);
//       toast.success("🚀 Campaign sent +1 successfully!");
//     } catch (err) {
//       console.error("❌ Sending failed:", err);
//       toast.error("❌ Failed to send campaign");
//     } finally {
//       setSendingId(null);
//     }
//   };

//   return (
//     <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
//       <h2 className="text-2xl font-bold text-purple-700">
//         📄 Template Campaigns
//       </h2>

//       {campaigns.length === 0 ? (
//         <p className="text-gray-500">No template campaigns available.</p>
//       ) : (
//         campaigns.map(campaign => (
//           <div
//             key={campaign.id}
//             className="bg-white rounded-xl shadow border p-4 space-y-3"
//           >
//             <h3 className="text-lg font-semibold text-purple-800">
//               {campaign.name}
//             </h3>
//             <p className="text-sm text-gray-500">
//               Template: <strong>{campaign.messageTemplate}</strong>
//             </p>
//             <p className="text-sm text-gray-400">
//               Recipients: <strong>{campaign.recipientCount || 0}</strong>
//             </p>

//             <WhatsAppBubblePreview
//               templateBody={campaign.messageTemplate}
//               parameters={campaign.templateParameters || []}
//               imageUrl={campaign.imageUrl}
//               buttonParams={campaign.multiButtons?.map(btn => ({
//                 title: btn.title,
//                 type: btn.type,
//                 value: btn.value,
//               }))}
//             />

//             <div className="flex justify-end gap-4">
//               <button
//                 disabled={!campaign.recipientCount || sendingId === campaign.id}
//                 onClick={() => handleSend(campaign.id)}
//                 className={`px-4 py-2 rounded font-medium ${
//                   !campaign.recipientCount
//                     ? "bg-gray-300 text-gray-500 cursor-not-allowed"
//                     : "bg-green-600 text-white hover:bg-green-700"
//                 }`}
//               >
//                 {sendingId === campaign.id ? "Sending..." : "🚀 Send"}
//               </button>

//               <button
//                 onClick={() =>
//                   navigate(
//                     `/app/campaigns/image-campaigns/assign-contacts/${campaign.id}`
//                   )
//                 }
//                 className="px-4 py-2 rounded text-sm text-purple-600 hover:underline"
//               >
//                 🧩 Assign Contacts
//               </button>

//               <button
//                 onClick={() =>
//                   navigate(
//                     `/app/campaigns/image-campaigns/assigned-contacts/${campaign.id}`
//                   )
//                 }
//                 className="px-4 py-2 rounded text-sm text-blue-600 hover:underline"
//               >
//                 View Recipients
//               </button>
//             </div>
//           </div>
//         ))
//       )}
//     </div>
//   );
// }

// export default TemplateCampaignList;
