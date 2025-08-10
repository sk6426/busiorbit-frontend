import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import ContactSelector from "./ContactSelector";
import MessageComposer from "./MessageComposer";
import FilterBar from "./SendMessagePage-Filter";
import axiosClient from "../../api/axiosClient";
import { toast } from "react-toastify";

const allowedRoles = ["admin", "superadmin", "partner", "reviewer"];

function SendMessagePage() {
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [messagePayload, setMessagePayload] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSource, setSelectedSource] = useState("");
  const [selectedTags, setSelectedTags] = useState("");

  const role = localStorage.getItem("role");
  const businessId = localStorage.getItem("businessId");

  if (!allowedRoles.includes(role)) {
    return <Navigate to="/login" />;
  }

  const handleSend = async () => {
    if (!messagePayload || selectedContacts.length === 0) {
      toast.warn("⚠️ Please select contacts and compose a message.");
      return;
    }

    setSubmitting(true);
    let success = 0;
    let failed = 0;

    for (const contact of selectedContacts) {
      // Dynamically create template parameter dictionary for WhatsApp API
      const templateParamsDict =
        messagePayload.templateParams?.reduce((acc, val, idx) => {
          if (val?.trim()) {
            acc[`{{${idx + 1}}}`] = val.trim();
          }
          return acc;
        }, {}) ?? {};

      const dto = {
        businessId,
        recipientNumber: contact.phoneNumber,
        templateName: messagePayload.templateName,
        templateParameters: templateParamsDict,
        buttonParams: messagePayload.buttonParams ?? [],
      };

      console.log("📦 Sending Template DTO:", dto);

      try {
        const res = await axiosClient.post("/messageengine/send-template", dto);
        console.log(
          `✅ Sent to ${contact.name} (${contact.phoneNumber})`,
          res.data
        );
        success++;
      } catch (err) {
        console.error(
          "❌ Failed to send to",
          contact.name,
          err?.response?.data ?? err
        );
        failed++;
      }
    }

    toast.success(`✅ Sent: ${success}, ❌ Failed: ${failed}`);
    setSelectedContacts([]);
    setMessagePayload(null);
    setSubmitting(false);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-bold text-purple-700 mb-4">
        Send WhatsApp Template Messages
      </h2>

      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedSource={selectedSource}
        onSourceChange={setSelectedSource}
        selectedTags={selectedTags}
        onTagsChange={setSelectedTags}
      />

      <ContactSelector
        onSelectionChange={setSelectedContacts}
        searchQuery={searchQuery}
        selectedSource={selectedSource}
        selectedTags={selectedTags}
      />

      <div className="text-sm text-gray-600">
        {selectedContacts.length} contacts selected.
      </div>

      <MessageComposer onMessageReady={setMessagePayload} />

      <button
        onClick={handleSend}
        disabled={!selectedContacts.length || !messagePayload || submitting}
        className={`w-full py-3 font-semibold rounded transition ${
          submitting
            ? "bg-gray-400 text-white"
            : "bg-green-600 text-white hover:bg-green-700"
        }`}
      >
        {submitting ? "Sending..." : "Send Template Message"}
      </button>
    </div>
  );
}

export default SendMessagePage;

// import React, { useState } from "react";
// import { Navigate } from "react-router-dom";
// import ContactSelector from "./ContactSelector";
// import MessageComposer from "./MessageComposer";
// import FilterBar from "./SendMessagePage-Filter";
// import axiosClient from "../../api/axiosClient";
// import { toast } from "react-toastify";

// const allowedRoles = ["admin", "superadmin", "partner", "reviewer"];

// function SendMessagePage() {
//   const [selectedContacts, setSelectedContacts] = useState([]);
//   const [messagePayload, setMessagePayload] = useState(null);
//   const [submitting, setSubmitting] = useState(false);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [selectedSource, setSelectedSource] = useState("");
//   const [selectedTags, setSelectedTags] = useState("");

//   const role = localStorage.getItem("role");
//   const businessId = localStorage.getItem("businessId");

//   if (!allowedRoles.includes(role)) {
//     return <Navigate to="/login" />;
//   }

//   // const handleSend = async () => {
//   //   if (!messagePayload || selectedContacts.length === 0) {
//   //     toast.warn("⚠️ Please select contacts and compose a message.");
//   //     return;
//   //   }

//   //   setSubmitting(true);
//   //   let success = 0;
//   //   let failed = 0;

//   //   for (const contact of selectedContacts) {
//   //     const dto = {
//   //       businessId,
//   //       recipientNumber: contact.phoneNumber,
//   //       templateName: messagePayload.templateName,
//   //       templateParameters: messagePayload.templateParams ?? [],
//   //       buttons: (messagePayload.buttonParams ?? []).map((param, idx) => ({
//   //         subType: "url",
//   //         index: `${idx}`,
//   //         param: param,
//   //       })),
//   //       languageCode: "en_US", // required by TemplateMessageDto
//   //     };

//   //     try {
//   //       const res = await axiosClient.post("/messageengine/send-template", dto);
//   //       console.log(`✅ Sent to ${contact.name}`, res.data);
//   //       success++;
//   //     } catch (err) {
//   //       console.error(
//   //         "❌ Failed to send to",
//   //         contact.name,
//   //         err?.response?.data ?? err
//   //       );
//   //       failed++;
//   //     }
//   //   }

//   //   toast.success(`✅ Sent: ${success}, ❌ Failed: ${failed}`);
//   //   setSelectedContacts([]);
//   //   setMessagePayload(null);
//   //   setSubmitting(false);
//   // };
//   const handleSend = async () => {
//     if (!messagePayload || selectedContacts.length === 0) {
//       toast.warn("⚠️ Please select contacts and compose a message.");
//       return;
//     }

//     setSubmitting(true);
//     let success = 0;
//     let failed = 0;

//     for (const contact of selectedContacts) {
//       const templateParamsDict =
//         messagePayload.templateParams?.reduce((acc, val, idx) => {
//           if (val?.trim()) {
//             acc[`{{${idx + 1}}}`] = val.trim();
//           }
//           return acc;
//         }, {}) ?? {};

//       // const dto = {
//       //   businessId,
//       //   recipientNumber: contact.phoneNumber,
//       //   templateName: messagePayload.templateName,
//       //   templateParameters: templateParamsDict, // ✅ FIXED: now a dictionary
//       //   buttonParams: messagePayload.buttonParams ?? [],
//       // };
//       const dto = {
//         businessId,
//         recipientNumber: contact.phoneNumber,
//         templateName: "verify_account",
//         templateParameters: {
//           "{{1}}": "John",
//           "{{2}}": "123456",
//         },
//         buttonParams: [],
//       };

//       console.log("📦 Sending Template DTO:", dto);

//       try {
//         const res = await axiosClient.post("/messageengine/send-template", dto);
//         console.log(
//           `✅ Sent to ${contact.name} (${contact.phoneNumber})`,
//           res.data
//         );
//         success++;
//       } catch (err) {
//         console.error(
//           "❌ Failed to send to",
//           contact.name,
//           err?.response?.data ?? err
//         );
//         failed++;
//       }
//     }

//     toast.success(`✅ Sent: ${success}, ❌ Failed: ${failed}`);
//     setSelectedContacts([]);
//     setMessagePayload(null);
//     setSubmitting(false);
//   };

//   return (
//     <div className="max-w-6xl mx-auto p-6 space-y-6">
//       <h2 className="text-2xl font-bold text-purple-700 mb-4">
//         Send WhatsApp Template Messages
//       </h2>

//       <FilterBar
//         searchQuery={searchQuery}
//         onSearchChange={setSearchQuery}
//         selectedSource={selectedSource}
//         onSourceChange={setSelectedSource}
//         selectedTags={selectedTags}
//         onTagsChange={setSelectedTags}
//       />

//       <ContactSelector
//         onSelectionChange={setSelectedContacts}
//         searchQuery={searchQuery}
//         selectedSource={selectedSource}
//         selectedTags={selectedTags}
//       />

//       <div className="text-sm text-gray-600">
//         {selectedContacts.length} contacts selected.
//       </div>

//       <MessageComposer onMessageReady={setMessagePayload} />

//       <button
//         onClick={handleSend}
//         disabled={!selectedContacts.length || !messagePayload || submitting}
//         className={`w-full py-3 font-semibold rounded transition ${
//           submitting
//             ? "bg-gray-400 text-white"
//             : "bg-green-600 text-white hover:bg-green-700"
//         }`}
//       >
//         {submitting ? "Sending..." : "Send Template Message"}
//       </button>
//     </div>
//   );
// }

// export default SendMessagePage;
