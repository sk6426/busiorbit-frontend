import React, { useEffect, useState } from "react";
import axiosClient from "../../../api/axiosClient";
import { toast } from "react-toastify";

const leadSources = [
  "Manual",
  "Website Form",
  "Google Search",
  "Facebook Ad",
  "LinkedIn",
  "Referral",
  "Trade Show",
  "Cold Call",
  "Other",
];

function ContactFormModal({ isOpen, onClose, contact, onSaveComplete }) {
  const [formData, setFormData] = useState({
    name: "",
    phoneNumber: "",
    email: "",
    leadSource: "Manual",
    notes: "",
    tagId: "",
  });
  const [allTags, setAllTags] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const res = await axiosClient.get("/tags/get-tags");
        setAllTags(res.data.data || []);
      } catch (error) {
        console.error("Failed to load tags:", error);
        toast.error("❌ Failed to load tags");
      }
    };

    if (isOpen) {
      fetchTags();
    }
  }, [isOpen]);

  useEffect(() => {
    if (contact) {
      setFormData({
        name: contact.name || "",
        phoneNumber: contact.phoneNumber || "",
        email: contact.email || "",
        leadSource: contact.leadSource || "Manual",
        notes: contact.notes || "",
        tagId: contact.tags?.[0]?.tagId || "",
      });
    } else {
      setFormData({
        name: "",
        phoneNumber: "",
        email: "",
        leadSource: "Manual",
        notes: "",
        tagId: "",
      });
    }
  }, [contact, isOpen]);

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setIsSaving(true);

    const payload = {
      ...formData,
      tagIds: formData.tagId ? [formData.tagId] : [],
    };
    delete payload.tagId;

    try {
      if (contact?.id) {
        await axiosClient.put(`/contacts/${contact.id}`, payload); // Assuming PUT doesn't need "add"
        toast.success("✅ Contact updated successfully!");
      } else {
        // 👇 FIX #1: Using the correct endpoint for creating a contact.
        await axiosClient.post("/contacts/create", payload);
        toast.success("✅ Contact created successfully!");
      }
      onSaveComplete?.();
      onClose();
    } catch (err) {
      // 👇 FIX #2: Specific error handling for duplicate contacts.
      if (err.response && err.response.status === 409) {
        // 409 Conflict status means the contact already exists.
        toast.warn(
          err.response.data.message ||
            "Contact with this phone number already exists."
        );
      } else {
        // Handle all other errors (like 404 Not Found, 500 Server Error, etc.)
        const errorMessage =
          err.response?.data?.message || "❌ Failed to save contact.";
        toast.error(errorMessage);
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-gray-500 hover:text-gray-800 text-2xl"
        >
          &times;
        </button>

        <h2 className="text-xl font-bold mb-4">
          {contact?.id ? "Edit Contact" : "Add New Contact"}
        </h2>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Full Name *"
            required
            className="border px-3 py-2 rounded w-full"
          />
          <input
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            placeholder="Phone Number *"
            required
            className="border px-3 py-2 rounded w-full"
          />
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email"
            className="border px-3 py-2 rounded w-full"
          />
          <select
            name="leadSource"
            value={formData.leadSource}
            onChange={handleChange}
            className="border px-3 py-2 rounded w-full"
          >
            {leadSources.map(source => (
              <option key={source} value={source}>
                {source}
              </option>
            ))}
          </select>
          <select
            name="tagId"
            value={formData.tagId}
            onChange={handleChange}
            className="md:col-span-2 border px-3 py-2 rounded w-full"
          >
            <option value="">-- No Tag --</option>
            {allTags.map(tag => (
              <option key={tag.id} value={tag.id}>
                {tag.name}
              </option>
            ))}
          </select>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Notes..."
            className="md:col-span-2 border px-3 py-2 rounded w-full min-h-[80px]"
          ></textarea>
          <div className="md:col-span-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-200 text-gray-800 px-6 py-2 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700 disabled:bg-purple-300"
            >
              {isSaving
                ? "Saving..."
                : contact?.id
                ? "Update Contact"
                : "Add Contact"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ContactFormModal;

// import React, { useEffect, useState } from "react";
// import axiosClient from "../../../api/axiosClient";
// import { toast } from "react-toastify";

// // 👇 FIX #1: Define the list of lead sources.
// const leadSources = [
//   "Manual",
//   "Website Form",
//   "Google Search",
//   "Facebook Ad",
//   "LinkedIn",
//   "Referral",
//   "Trade Show",
//   "Cold Call",
//   "Other",
// ];

// function ContactFormModal({ isOpen, onClose, contact, onSaveComplete }) {
//   const [formData, setFormData] = useState({
//     name: "",
//     phoneNumber: "",
//     email: "",
//     // 👇 FIX #2: Set the default leadSource to "Manual".
//     leadSource: "Manual",
//     notes: "",
//     tagId: "",
//   });
//   const [allTags, setAllTags] = useState([]);
//   const [isSaving, setIsSaving] = useState(false);

//   useEffect(() => {
//     const fetchTags = async () => {
//       try {
//         const res = await axiosClient.get("/tags/get-tags");
//         setAllTags(res.data.data || []);
//       } catch (error) {
//         console.error("Failed to load tags:", error);
//         toast.error("❌ Failed to load tags");
//       }
//     };

//     if (isOpen) {
//       fetchTags();
//     }
//   }, [isOpen]);

//   useEffect(() => {
//     if (contact) {
//       setFormData({
//         name: contact.name || "",
//         phoneNumber: contact.phoneNumber || "",
//         email: contact.email || "",
//         leadSource: contact.leadSource || "Manual",
//         notes: contact.notes || "",
//         tagId: contact.tags?.[0]?.tagId || "",
//       });
//     } else {
//       // Reset form for a new contact
//       setFormData({
//         name: "",
//         phoneNumber: "",
//         email: "",
//         leadSource: "Manual",
//         notes: "",
//         tagId: "",
//       });
//     }
//   }, [contact, isOpen]);

//   const handleChange = e => {
//     const { name, value } = e.target;
//     setFormData(prev => ({ ...prev, [name]: value }));
//   };

//   const handleSubmit = async e => {
//     e.preventDefault();
//     setIsSaving(true);

//     const payload = {
//       ...formData,
//       tagIds: formData.tagId ? [formData.tagId] : [],
//     };
//     delete payload.tagId;

//     try {
//       if (contact?.id) {
//         await axiosClient.put(`/contacts/add/${contact.id}`, payload);
//         toast.success("✅ Contact updated successfully!");
//       } else {
//         await axiosClient.post("/contacts", payload);
//         toast.success("✅ Contact created successfully!");
//       }
//       onSaveComplete?.();
//       onClose();
//     } catch (err) {
//       const errorMessage =
//         err.response?.data?.message || "❌ Failed to save contact.";
//       toast.error(errorMessage);
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-4">
//       <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-2xl relative">
//         <button
//           onClick={onClose}
//           className="absolute top-3 right-4 text-gray-500 hover:text-gray-800 text-2xl"
//         >
//           &times;
//         </button>

//         <h2 className="text-xl font-bold mb-4">
//           {contact?.id ? "Edit Contact" : "Add New Contact"}
//         </h2>

//         <form
//           onSubmit={handleSubmit}
//           className="grid grid-cols-1 md:grid-cols-2 gap-4"
//         >
//           <input
//             name="name"
//             value={formData.name}
//             onChange={handleChange}
//             placeholder="Full Name *"
//             required
//             className="border px-3 py-2 rounded w-full"
//           />
//           <input
//             name="phoneNumber"
//             value={formData.phoneNumber}
//             onChange={handleChange}
//             placeholder="Phone Number *"
//             required
//             className="border px-3 py-2 rounded w-full"
//           />
//           <input
//             type="email"
//             name="email"
//             value={formData.email}
//             onChange={handleChange}
//             placeholder="Email"
//             className="border px-3 py-2 rounded w-full"
//           />

//           {/* 👇 FIX #3: Replaced the text input with a select dropdown. */}
//           <select
//             name="leadSource"
//             value={formData.leadSource}
//             onChange={handleChange}
//             className="border px-3 py-2 rounded w-full"
//           >
//             {leadSources.map(source => (
//               <option key={source} value={source}>
//                 {source}
//               </option>
//             ))}
//           </select>

//           <select
//             name="tagId"
//             value={formData.tagId}
//             onChange={handleChange}
//             className="md:col-span-2 border px-3 py-2 rounded w-full"
//           >
//             <option value="">-- No Tag --</option>
//             {allTags.map(tag => (
//               <option key={tag.id} value={tag.id}>
//                 {tag.name}
//               </option>
//             ))}
//           </select>

//           <textarea
//             name="notes"
//             value={formData.notes}
//             onChange={handleChange}
//             placeholder="Notes..."
//             className="md:col-span-2 border px-3 py-2 rounded w-full min-h-[80px]"
//           ></textarea>

//           <div className="md:col-span-2 flex justify-end gap-3">
//             <button
//               type="button"
//               onClick={onClose}
//               className="bg-gray-200 text-gray-800 px-6 py-2 rounded hover:bg-gray-300"
//             >
//               Cancel
//             </button>
//             <button
//               type="submit"
//               disabled={isSaving}
//               className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700 disabled:bg-purple-300"
//             >
//               {isSaving
//                 ? "Saving..."
//                 : contact?.id
//                 ? "Update Contact"
//                 : "Add Contact"}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }

// export default ContactFormModal;
