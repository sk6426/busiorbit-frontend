import React, { useState } from "react";
import { FaGlobe, FaPhone, FaReply } from "react-icons/fa6";
import { buildTrackingUrl } from "../../../utils/buildTrackingUrl";

// ✅ Icon Renderer
const getIconForType = type => {
  const normalized = type?.toLowerCase();
  switch (normalized) {
    case "url":
    case "web":
      return <FaGlobe />;
    case "voice_call":
    case "phone_number":
    case "call":
      return <FaPhone />;
    case "quick_reply":
    case "reply":
      return <FaReply />;
    default:
      return <FaGlobe />;
  }
};

function WhatsAppBubblePreview({
  messageTemplate,
  cta,
  multiButtons = [],
  campaignId,
  messageId,
  contact,
  imageUrl,
  caption,
}) {
  const [imgError, setImgError] = useState(false);

  const getTrackingUrl = button => {
    return buildTrackingUrl({
      businessId: localStorage.getItem("businessId"),
      sourceType: "campaign",
      sourceId: campaignId,
      buttonText: button?.title || button?.buttonText || "Click",
      redirectUrl: button?.value || button?.targetUrl || "",
      messageId,
      contactId: contact?.id,
      contactPhone: contact?.phone,
    });
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-md p-4">
      <div className="relative bg-green-50 text-gray-800 rounded-lg p-4 shadow-md w-fit max-w-full">
        {/* ✅ Tail Arrow */}
        <div className="absolute -left-3 top-4 w-0 h-0 border-t-[12px] border-t-transparent border-r-[16px] border-r-green-50 border-b-[12px] border-b-transparent"></div>

        {/* 📷 Image Preview */}
        {imageUrl && !imgError ? (
          <img
            src={imageUrl}
            alt="Campaign"
            onError={() => setImgError(true)}
            className="rounded-md mb-2 max-h-48 object-cover border"
          />
        ) : imageUrl ? (
          <div className="bg-gray-200 text-gray-500 text-xs h-32 flex items-center justify-center mb-2 rounded-md">
            Image not available
          </div>
        ) : null}

        {/* 📝 Message Text */}
        {caption && <p className="mb-1">{caption}</p>}
        <p className="whitespace-pre-line">{messageTemplate}</p>

        {/* 🔘 Multi-CTA Buttons */}
        {multiButtons?.length > 0 && (
          <div className="mt-4 space-y-2">
            {multiButtons.slice(0, 3).map((btn, idx) => (
              <a
                key={idx}
                href={getTrackingUrl(btn)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded shadow hover:bg-green-600 text-sm"
              >
                {getIconForType(btn.type || btn.buttonType)}
                {btn.title || btn.buttonText || "Untitled"}
              </a>
            ))}
          </div>
        )}

        {/* 🔘 Single CTA fallback */}
        {!multiButtons?.length && cta && (
          <a
            href={getTrackingUrl({
              title: cta.buttonText,
              value: cta.targetUrl,
              type: cta.ctaType,
            })}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded shadow hover:bg-green-600 text-sm"
          >
            {getIconForType(cta.ctaType)}
            {cta.buttonText}
          </a>
        )}
      </div>
    </div>
  );
}

export default WhatsAppBubblePreview;

// import React, { useState } from "react";
// import { buildTrackingUrl } from "../../../utils/buildTrackingUrl";
// import { FaGlobe, FaPhone, FaReply } from "react-icons/fa6";

// // ✅ Icon helper
// const getIconForType = type => {
//   const normalized = type?.toLowerCase();
//   switch (normalized) {
//     case "web":
//     case "url":
//       return <FaGlobe />;
//     case "call":
//       return <FaPhone />;
//     case "reply":
//     case "quick_reply":
//       return <FaReply />;
//     default:
//       return <FaGlobe />;
//   }
// };

// function WhatsAppBubblePreview({
//   messageTemplate,
//   cta,
//   multiButtons = [],
//   campaignId,
//   messageId,
//   contact,
//   imageUrl,
//   caption,
// }) {
//   const [imgError, setImgError] = useState(false);

//   // 🧠 Build tracking URL
//   const getTrackingUrl = button => {
//     return buildTrackingUrl({
//       businessId: localStorage.getItem("businessId"),
//       sourceType: "campaign",
//       sourceId: campaignId,
//       buttonText: button.title || button.buttonText,
//       redirectUrl: button.value || button.targetUrl,
//       messageId,
//       contactId: contact?.id,
//       contactPhone: contact?.phone,
//     });
//   };

//   return (
//     <div className="max-w-md mx-auto bg-white rounded-xl shadow-md p-4">
//       <div className="relative bg-green-50 text-gray-800 rounded-lg p-4 shadow-md w-fit max-w-full">
//         {/* 🟢 Tail */}
//         <div className="absolute -left-3 top-4 w-0 h-0 border-t-[12px] border-t-transparent border-r-[16px] border-r-green-50 border-b-[12px] border-b-transparent"></div>

//         {/* 📷 Image */}
//         {imageUrl && !imgError ? (
//           <img
//             src={imageUrl}
//             alt="Campaign"
//             onError={() => setImgError(true)}
//             className="rounded-md mb-2 max-h-48 object-cover border"
//           />
//         ) : imageUrl ? (
//           <div className="bg-gray-200 text-gray-500 text-xs h-32 flex items-center justify-center mb-2 rounded-md">
//             Image not available
//           </div>
//         ) : null}

//         {/* 📝 Text */}
//         {caption && <p className="mb-1">{caption}</p>}
//         <p className="whitespace-pre-line">{messageTemplate}</p>

//         {/* 🔘 Multiple CTA Buttons */}
//         {multiButtons?.length > 0 && (
//           <div className="mt-4 space-y-2">
//             {multiButtons.slice(0, 3).map((btn, idx) => (
//               <a
//                 key={idx}
//                 href={getTrackingUrl(btn)}
//                 target="_blank"
//                 rel="noopener noreferrer"
//                 className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded shadow hover:bg-green-600 text-sm"
//               >
//                 {getIconForType(btn.type || btn.buttonType)}
//                 {btn.title || btn.buttonText || "Untitled"}
//               </a>
//             ))}
//           </div>
//         )}

//         {/* 🔘 Fallback Single CTA */}
//         {!multiButtons?.length && cta && (
//           <a
//             href={getTrackingUrl({
//               title: cta.buttonText,
//               value: cta.targetUrl,
//               type: cta.ctaType,
//             })}
//             target="_blank"
//             rel="noopener noreferrer"
//             className="mt-3 inline-flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded shadow hover:bg-green-600 text-sm"
//           >
//             {getIconForType(cta.ctaType)}
//             {cta.buttonText}
//           </a>
//         )}
//       </div>
//     </div>
//   );
// }

// export default WhatsAppBubblePreview;

// import React, { useState } from "react";
// import { buildTrackingUrl } from "../../../utils/buildTrackingUrl";
// import { FaGlobe, FaPhone, FaReply } from "react-icons/fa6";

// // ✅ Icon helper
// const getIconForType = type => {
//   switch (type?.toLowerCase()) {
//     case "web":
//     case "url":
//       return <FaGlobe />;
//     case "call":
//       return <FaPhone />;
//     case "reply":
//     case "quick_reply":
//       return <FaReply />;
//     default:
//       return <FaGlobe />;
//   }
// };

// function WhatsAppBubblePreview({
//   messageTemplate,
//   cta,
//   multiButtons = [], // ✅ Accepts multiple buttons
//   campaignId,
//   messageId,
//   contact,
//   imageUrl,
//   caption,
// }) {
//   const [imgError, setImgError] = useState(false);

//   // 🧠 Build tracking URL for each button
//   const getTrackingUrl = button => {
//     return buildTrackingUrl({
//       businessId: localStorage.getItem("businessId"),
//       sourceType: "campaign",
//       sourceId: campaignId,
//       buttonText: button.title,
//       redirectUrl: button.value,
//       messageId,
//       contactId: contact?.id,
//       contactPhone: contact?.phone,
//     });
//   };

//   return (
//     <div className="max-w-md mx-auto bg-white rounded-xl shadow-md p-4">
//       {/* 🧾 WhatsApp-like bubble */}
//       <div className="relative bg-green-50 text-gray-800 rounded-lg p-4 shadow-md w-fit max-w-full">
//         {/* 🟢 Tail */}
//         <div className="absolute -left-3 top-4 w-0 h-0 border-t-[12px] border-t-transparent border-r-[16px] border-r-green-50 border-b-[12px] border-b-transparent"></div>

//         {/* 📷 Image Preview */}
//         {imageUrl && !imgError ? (
//           <img
//             src={imageUrl}
//             alt="Campaign"
//             onError={() => setImgError(true)}
//             className="rounded-md mb-2 max-h-48 object-cover border"
//           />
//         ) : imageUrl ? (
//           <div className="bg-gray-200 text-gray-500 text-xs h-32 flex items-center justify-center mb-2 rounded-md">
//             Image not available
//           </div>
//         ) : null}

//         {/* 📝 Message */}
//         {caption && <p className="mb-1">{caption}</p>}
//         <p className="whitespace-pre-line">{messageTemplate}</p>

//         {/* 🔘 Multiple CTA Buttons */}
//         {multiButtons?.length > 0 && (
//           <div className="mt-4 space-y-2">
//             {multiButtons.slice(0, 3).map((btn, idx) => (
//               <a
//                 key={idx}
//                 href={getTrackingUrl(btn)}
//                 target="_blank"
//                 rel="noopener noreferrer"
//                 className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded shadow hover:bg-green-600 text-sm"
//               >
//                 {getIconForType(btn.type)}
//                 {btn.title}
//               </a>
//             ))}
//           </div>
//         )}

//         {/* 🔘 Fallback single CTA (optional) */}
//         {!multiButtons?.length && cta && (
//           <a
//             href={getTrackingUrl({
//               title: cta.buttonText,
//               value: cta.targetUrl,
//               type: cta.ctaType,
//             })}
//             target="_blank"
//             rel="noopener noreferrer"
//             className="mt-3 inline-flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded shadow hover:bg-green-600 text-sm"
//           >
//             {getIconForType(cta.ctaType)}
//             {cta.buttonText}
//           </a>
//         )}
//       </div>
//     </div>
//   );
// }

// export default WhatsAppBubblePreview;
