import React, { useEffect, useState } from "react";
import { FaGlobe, FaPhone, FaReply } from "react-icons/fa6";

// ✅ Utility to render matching icons by subtype
const getButtonIcon = subtype => {
  switch ((subtype || "").toLowerCase()) {
    case "url":
      return <FaGlobe className="text-green-500" />;
    case "phone_number":
      return <FaPhone className="text-green-500" />;
    case "quick_reply":
    default:
      return <FaReply className="text-green-500" />;
  }
};

function WhatsAppBubblePreview({
  templateBody = "",
  parameters = [],
  buttonParams = [],
  imageUrl = "",
}) {
  const [imgError, setImgError] = useState(false);

  // ✅ Format template body with parameter values
  const getFormattedBody = () => {
    let text = templateBody || "";
    parameters.forEach((val, idx) => {
      const regex = new RegExp(`{{\\s*${idx + 1}\\s*}}`, "g");
      text = text.replace(regex, val?.trim() || `{{${idx + 1}}}`);
    });
    return text;
  };

  const formattedBody = getFormattedBody();

  // ✅ Reset error state when imageUrl changes
  useEffect(() => {
    setImgError(false);
  }, [imageUrl]);

  return (
    <div className="p-5 bg-[#f7f6f3] rounded-lg shadow-inner max-w-sm">
      <div className="relative bg-white shadow-sm text-sm overflow-hidden border border-gray-200 rounded-tr-lg rounded-br-lg rounded-tl-lg rounded-bl-none">
        {/* 🧷 Corner Tail */}
        <div className="absolute -left-[6px] top-3 w-0 h-0 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-r-[10px] border-r-white" />

        <div className="p-4 text-gray-800 whitespace-pre-wrap">
          {/* 🖼️ Image Preview */}
          {imageUrl && (
            <div className="mb-3">
              {!imgError ? (
                <img
                  src={imageUrl}
                  alt="Template Header"
                  onError={() => setImgError(true)}
                  className="w-full max-h-60 object-cover rounded-md border"
                />
              ) : (
                <div className="text-red-500 text-xs">
                  ⚠️ Failed to load image preview.
                </div>
              )}
            </div>
          )}

          {/* 📝 Body */}
          {formattedBody.split("\n").map((line, idx) => (
            <p key={idx} className="mb-1">
              {line}
            </p>
          ))}
        </div>

        {/* 🔘 Buttons */}
        {buttonParams.length > 0 && (
          <div className="border-t px-4 divide-y text-center">
            {buttonParams.map((btn, idx) => (
              <div
                key={idx}
                className="inline-flex items-center gap-2 py-3 text-green-600 font-medium justify-center w-full"
              >
                {getButtonIcon(btn.subType)}
                <span>{btn.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="text-xs text-gray-500 mt-2 text-left">
        Template Preview
      </div>
    </div>
  );
}

export default WhatsAppBubblePreview;

// import React, { useState } from "react";
// import { FaGlobe, FaPhone, FaReply } from "react-icons/fa6";

// // ✅ Utility to render matching icons by subtype
// const getButtonIcon = subtype => {
//   switch ((subtype || "").toLowerCase()) {
//     case "url":
//       return <FaGlobe className="text-green-500" />;
//     case "phone_number":
//       return <FaPhone className="text-green-500" />;
//     case "quick_reply":
//     default:
//       return <FaReply className="text-green-500" />;
//   }
// };

// function WhatsAppBubblePreview({
//   templateBody = "",
//   parameters = [],
//   buttonParams = [],
//   imageUrl = "",
// }) {
//   const [imgError, setImgError] = useState(false);

//   const getFormattedBody = () => {
//     let text = templateBody || "";
//     parameters.forEach((val, idx) => {
//       const regex = new RegExp(`{{\\s*${idx + 1}\\s*}}`, "g");
//       text = text.replace(regex, val?.trim() || `{{${idx + 1}}}`);
//     });
//     return text;
//   };

//   const formattedBody = getFormattedBody();

//   return (
//     <div className="p-5 bg-[#f7f6f3] rounded-lg shadow-inner max-w-sm">
//       <div className="relative bg-white shadow-sm text-sm overflow-hidden border border-gray-200 rounded-tr-lg rounded-br-lg rounded-tl-lg rounded-bl-none">
//         {/* 🧷 Corner Tail */}
//         <div className="absolute -left-[6px] top-3 w-0 h-0 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-r-[10px] border-r-white" />

//         <div className="p-4 text-gray-800 whitespace-pre-wrap">
//           {/* 🖼️ Full-width Image Header */}
//           {imageUrl && !imgError && (
//             <img
//               src={imageUrl}
//               alt="Template Header"
//               onError={() => setImgError(true)}
//               className="w-full max-h-60 object-cover rounded-md border mb-3"
//             />
//           )}

//           {/* 📝 Body */}
//           {formattedBody.split("\n").map((line, idx) => (
//             <p key={idx} className="mb-1">
//               {line}
//             </p>
//           ))}
//         </div>

//         {/* 🔘 Buttons */}
//         {buttonParams.length > 0 && (
//           <div className="border-t px-4 divide-y text-center">
//             {buttonParams.map((btn, idx) => (
//               <div
//                 key={idx}
//                 className="inline-flex items-center gap-2 py-3 text-green-600 font-medium justify-center w-full"
//               >
//                 {getButtonIcon(btn.subType)}
//                 <span>{btn.text}</span>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>

//       <div className="text-xs text-gray-500 mt-2 text-left">
//         Template Preview
//       </div>
//     </div>
//   );
// }

// export default WhatsAppBubblePreview;

// import React, { useState } from "react";
// import { FaGlobe, FaPhone, FaReply } from "react-icons/fa6";

// // ✅ Utility to render matching icons by subtype
// const getButtonIcon = subtype => {
//   switch ((subtype || "").toLowerCase()) {
//     case "url":
//       return <FaGlobe className="text-green-500" />;
//     case "phone_number":
//       return <FaPhone className="text-green-500" />;
//     case "quick_reply":
//     default:
//       return <FaReply className="text-green-500" />;
//   }
// };

// function WhatsAppBubblePreview({
//   templateBody = "",
//   parameters = [],
//   buttonParams = [],
//   imageUrl = "",
// }) {
//   const [imgError, setImgError] = useState(false);

//   // ✅ Replace placeholders {{1}}, {{2}}...
//   const getFormattedBody = () => {
//     let text = templateBody || "";
//     parameters.forEach((val, idx) => {
//       const regex = new RegExp(`{{\\s*${idx + 1}\\s*}}`, "g");
//       text = text.replace(regex, val?.trim() || `{{${idx + 1}}}`);
//     });
//     return text;
//   };

//   const formattedBody = getFormattedBody();

//   return (
//     <div className="p-5 bg-[#f7f6f3] rounded-lg shadow-inner max-w-sm">
//       <div className="relative bg-white shadow-sm text-sm overflow-hidden border border-gray-200 rounded-tr-lg rounded-br-lg rounded-tl-lg rounded-bl-none">
//         {/* 🧷 Perfectly aligned left-corner tail */}
//         <div className="absolute -left-[6px] top-3 w-0 h-0 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-r-[10px] border-r-white" />

//         <div className="p-4 text-gray-800 whitespace-pre-wrap">
//           {/* 🖼️ Image Header */}
//           {imageUrl && !imgError && (
//             <img
//               src={imageUrl}
//               alt="Template Header"
//               onError={() => setImgError(true)}
//               className="mb-3 max-h-40 object-cover rounded-md border"
//             />
//           )}

//           {/* 📝 Message Text */}
//           {formattedBody.split("\n").map((line, idx) => (
//             <p key={idx} className="mb-1">
//               {line}
//             </p>
//           ))}
//         </div>

//         {/* 🔘 Buttons (centered) */}
//         {buttonParams.length > 0 && (
//           <div className="border-t px-4 divide-y text-center">
//             {buttonParams.map((btn, idx) => (
//               <div
//                 key={idx}
//                 className="inline-flex items-center gap-2 py-3 text-green-600 font-medium justify-center w-full"
//               >
//                 {getButtonIcon(btn.subType)}
//                 <span>{btn.text}</span>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* 📎 Footer */}
//       <div className="text-xs text-gray-500 mt-2 text-left">
//         Template Preview
//       </div>
//     </div>
//   );
// }

// export default WhatsAppBubblePreview;

// import React from "react";
// import { FaGlobe, FaPhone, FaReply } from "react-icons/fa6";

// // ✅ Utility to render matching icons by subtype
// const getButtonIcon = subtype => {
//   switch ((subtype || "").toLowerCase()) {
//     case "url":
//       return <FaGlobe className="text-green-500" />;
//     case "phone_number":
//       return <FaPhone className="text-green-500" />;
//     case "quick_reply":
//     default:
//       return <FaReply className="text-green-500" />;
//   }
// };

// function WhatsAppBubblePreview({
//   templateBody = "",
//   parameters = [],
//   buttonParams = [],
// }) {
//   // ✅ Replace placeholders {{1}}, {{2}}...
//   const getFormattedBody = () => {
//     let text = templateBody || "";
//     parameters.forEach((val, idx) => {
//       const regex = new RegExp(`{{\\s*${idx + 1}\\s*}}`, "g");
//       text = text.replace(regex, val?.trim() || `{{${idx + 1}}}`);
//     });
//     return text;
//   };

//   const formattedBody = getFormattedBody();

//   return (
//     <div className="p-5 bg-[#f7f6f3] rounded-lg shadow-inner max-w-sm">
//       <div className="relative bg-white shadow-sm text-sm overflow-hidden border border-gray-200 rounded-tr-lg rounded-br-lg rounded-tl-lg rounded-bl-none">
//         {/* 🧷 Perfectly aligned left-corner tail */}
//         <div className="absolute -left-[6px] top-3 w-0 h-0 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-r-[10px] border-r-white" />

//         {/* 🧾 Message content */}
//         <div className="p-4 text-gray-800 whitespace-pre-wrap">
//           {formattedBody.split("\n").map((line, idx) => (
//             <p key={idx} className="mb-1">
//               {line}
//             </p>
//           ))}
//         </div>

//         {/* 🔘 Buttons (centered) */}
//         {buttonParams.length > 0 && (
//           <div className="border-t px-4 divide-y text-center">
//             {buttonParams.map((btn, idx) => (
//               <div
//                 key={idx}
//                 className="inline-flex items-center gap-2 py-3 text-green-600 font-medium   justify-center w-full"
//               >
//                 {getButtonIcon(btn.subType)}
//                 <span>{btn.text}</span>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* 📎 Footer */}
//       <div className="text-xs text-gray-500 mt-2 text-left">
//         Template Perview
//       </div>
//     </div>
//   );
// }

// export default WhatsAppBubblePreview;
