import React, { useState } from "react";
import axiosClient from "../../../api/axiosClient"; // ✅ Adjust path if needed
import { toast } from "react-toastify";

function PreviewSendTab({ formData }) {
  const [loading, setLoading] = useState(false);

  const {
    templateId,
    templateParams = [],
    multiButtons = [],
    recipientIds = [],
  } = formData;

  // ✅ Check if form is valid
  const isValid =
    templateId &&
    templateParams.some(p => p && p.trim() !== "") &&
    recipientIds.length > 0;

  // 🔁 Sample template message for preview (can be dynamic in future)
  const sampleBody = "Hi {{1}}, your order {{2}} has been confirmed.";
  const previewBody = sampleBody.replace(/{{(\d+)}}/g, (_, i) => {
    return templateParams[i - 1] || `{{${i}}}`;
  });

  const handleSend = async () => {
    try {
      setLoading(true);
      const payload = {
        templateId,
        templateParams,
        multiButtons,
        contactIds: recipientIds,
      };

      // FIX: Remove 'res' if unused
      await axiosClient.post("/api/messageengine/send-text-template", payload);
      toast.success("✅ Campaign sent successfully!");
    } catch (err) {
      console.error(err);
      toast.error("❌ Failed to send campaign.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3 className="text-2xl font-semibold mb-4">Preview & Send</h3>

      <div className="bg-gray-100 border p-4 rounded shadow-md max-w-lg space-y-4">
        <div className="bg-white p-3 rounded-md shadow-sm border">
          <p className="text-sm whitespace-pre-line">{previewBody}</p>
        </div>

        {multiButtons.length > 0 && (
          <div className="flex flex-col gap-2">
            {multiButtons.map((btn, i) => (
              <button
                key={i}
                className="bg-green-500 text-white px-4 py-2 rounded text-sm text-left"
              >
                {btn.buttonText}
              </button>
            ))}
          </div>
        )}
      </div>

      {!isValid && (
        <div className="text-red-500 mt-4">
          ❌ Please select a template, fill parameters, and choose at least one
          recipient.
        </div>
      )}

      <div className="mt-6">
        <button
          disabled={!isValid || loading}
          onClick={handleSend}
          className={`px-6 py-2 rounded text-white ${
            isValid
              ? "bg-purple-600 hover:bg-purple-700"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          {loading ? "Sending..." : "Send Campaign"}
        </button>
      </div>
    </div>
  );
}

export default PreviewSendTab;

// import React, { useState } from "react";
// import axiosClient from "../../../api/axiosClient"; // ✅ Adjust path if needed
// import { toast } from "react-toastify";

// function PreviewSendTab({ formData }) {
//   const [loading, setLoading] = useState(false);

//   const {
//     templateId,
//     templateParams = [],
//     multiButtons = [],
//     recipientIds = [],
//   } = formData;

//   // ✅ Check if form is valid
//   const isValid =
//     templateId &&
//     templateParams.some(p => p && p.trim() !== "") &&
//     recipientIds.length > 0;

//   // 🔁 Sample template message for preview (can be dynamic in future)
//   const sampleBody = "Hi {{1}}, your order {{2}} has been confirmed.";
//   const previewBody = sampleBody.replace(/{{(\d+)}}/g, (_, i) => {
//     return templateParams[i - 1] || `{{${i}}}`;
//   });

//   const handleSend = async () => {
//     try {
//       setLoading(true);
//       const payload = {
//         templateId,
//         templateParams,
//         multiButtons,
//         contactIds: recipientIds,
//       };

//       const res = await axiosClient.post(
//         "/api/messageengine/send-text-template",
//         payload
//       );
//       toast.success("✅ Campaign sent successfully!");
//     } catch (err) {
//       console.error(err);
//       toast.error("❌ Failed to send campaign.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div>
//       <h3 className="text-2xl font-semibold mb-4">Preview & Send</h3>

//       <div className="bg-gray-100 border p-4 rounded shadow-md max-w-lg space-y-4">
//         <div className="bg-white p-3 rounded-md shadow-sm border">
//           <p className="text-sm whitespace-pre-line">{previewBody}</p>
//         </div>

//         {multiButtons.length > 0 && (
//           <div className="flex flex-col gap-2">
//             {multiButtons.map((btn, i) => (
//               <button
//                 key={i}
//                 className="bg-green-500 text-white px-4 py-2 rounded text-sm text-left"
//               >
//                 {btn.buttonText}
//               </button>
//             ))}
//           </div>
//         )}
//       </div>

//       {!isValid && (
//         <div className="text-red-500 mt-4">
//           ❌ Please select a template, fill parameters, and choose at least one
//           recipient.
//         </div>
//       )}

//       <div className="mt-6">
//         <button
//           disabled={!isValid || loading}
//           onClick={handleSend}
//           className={`px-6 py-2 rounded text-white ${
//             isValid
//               ? "bg-purple-600 hover:bg-purple-700"
//               : "bg-gray-400 cursor-not-allowed"
//           }`}
//         >
//           {loading ? "Sending..." : "Send Campaign"}
//         </button>
//       </div>
//     </div>
//   );
// }

// export default PreviewSendTab;
