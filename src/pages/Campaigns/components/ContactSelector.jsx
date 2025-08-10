import React, { useEffect, useState, useCallback } from "react";
import axiosClient from "../../../api/axiosClient";
import { toast } from "react-toastify";
import Papa from "papaparse";
import TagFilterDropdown from "./TagFilterDropdown";

function ContactSelector({ selectedIds, onChange }) {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tagFilter, setTagFilter] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [importedContacts, setImportedContacts] = useState([]);
  const [showImportModal, setShowImportModal] = useState(false);

  // 1. Wrap loadContacts in useCallback so its reference is stable
  const loadContacts = useCallback(async () => {
    setLoading(true);
    try {
      let res;
      if (tagFilter.length > 0) {
        res = await axiosClient.post("/contacts/filter-by-tags", tagFilter);
        setContacts(res.data?.data || []);
      } else {
        res = await axiosClient.get("/contacts", {
          params: {
            tab: "all",
            page: 1,
            pageSize: 1000,
          },
        });
        setContacts(res.data?.data?.items || []);
      }
    } catch (err) {
      toast.error("Failed to load contacts");
    } finally {
      setLoading(false);
    }
  }, [tagFilter]); // Add tagFilter as dependency (it's used inside)

  // 2. Add loadContacts to dependency array
  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  const handleToggle = id => {
    const newSelected = selectedIds.includes(id)
      ? selectedIds.filter(cid => cid !== id)
      : [...selectedIds, id];
    onChange(newSelected);
  };

  const handleFileUpload = e => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: function (results) {
        const parsed = results.data.map(row => ({
          id: crypto.randomUUID(),
          name: row.name || "Unnamed",
          phone: row.phone || "",
        }));
        setImportedContacts(parsed);
        setShowImportModal(true);
      },
      error: function () {
        toast.error("CSV Parsing Failed");
      },
    });
  };

  const confirmImport = () => {
    setContacts(prev => [...prev, ...importedContacts]);
    const allIds = importedContacts.map(c => c.id);
    onChange([...selectedIds, ...allIds]);
    setShowImportModal(false);
    toast.success("Contacts imported successfully");
  };

  const filteredContacts = contacts.filter(
    c =>
      c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone?.includes(searchTerm)
  );

  if (loading) return <p>⏳ Loading contacts...</p>;

  return (
    <div className="space-y-4">
      {/* 🔍 Search + Tag Filter + CSV Import */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="text"
          placeholder="Search by name or phone"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full sm:w-1/2 px-3 py-2 rounded-md border"
        />

        <TagFilterDropdown
          selectedTags={tagFilter}
          onChange={setTagFilter}
          category="Interest"
        />

        <label className="cursor-pointer text-purple-600 hover:underline text-sm sm:ml-4">
          Import CSV
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>

      {/* 🔘 Contact List */}
      {filteredContacts.length === 0 ? (
        <p className="text-gray-500">⚠️ No matching contacts found.</p>
      ) : (
        filteredContacts.map(contact => (
          <label
            key={contact.id}
            className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2 text-sm text-gray-700 border-b py-1"
          >
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedIds.includes(contact.id)}
                onChange={() => handleToggle(contact.id)}
              />
              <span>
                {contact.name} —{" "}
                <span className="text-gray-500">
                  {contact.phoneNumber || contact.phone || "—"}
                </span>
              </span>
            </div>
            {/* 🎨 Tag Chips */}
            <div className="flex flex-wrap gap-1 ml-6">
              {contact.tags?.map(tag => (
                <span
                  key={tag.tagId}
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: tag.colorHex || "#E5E7EB",
                    color: "#000",
                  }}
                >
                  {tag.tagName}
                </span>
              ))}
            </div>
          </label>
        ))
      )}

      {/* 📦 Preview Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">
              Preview Imported Contacts
            </h2>
            <div className="max-h-60 overflow-auto space-y-2">
              {importedContacts.map((c, idx) => (
                <div key={idx} className="text-sm border-b py-1">
                  <strong>{c.name}</strong> — {c.phone}
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-4 gap-4">
              <button
                className="text-gray-600 hover:underline"
                onClick={() => setShowImportModal(false)}
              >
                Cancel
              </button>
              <button
                className="bg-purple-600 text-white px-4 py-2 rounded-md"
                onClick={confirmImport}
              >
                Import & Select
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ContactSelector;

// import React, { useEffect, useState } from "react";
// import axiosClient from "../../../api/axiosClient";
// import { toast } from "react-toastify";
// import Papa from "papaparse";
// import TagFilterDropdown from "./TagFilterDropdown";

// function ContactSelector({ selectedIds, onChange }) {
//   const [contacts, setContacts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [tagFilter, setTagFilter] = useState([]);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [importedContacts, setImportedContacts] = useState([]);
//   const [showImportModal, setShowImportModal] = useState(false);

//   useEffect(() => {
//     loadContacts();
//   }, [tagFilter]);

//   const loadContacts = async () => {
//     setLoading(true);
//     try {
//       let res;
//       if (tagFilter.length > 0) {
//         res = await axiosClient.post("/contacts/filter-by-tags", tagFilter);
//         setContacts(res.data?.data || []);
//       } else {
//         res = await axiosClient.get("/contacts", {
//           params: {
//             tab: "all",
//             page: 1,
//             pageSize: 1000,
//           },
//         });
//         setContacts(res.data?.data?.items || []);
//       }
//     } catch (err) {
//       toast.error("Failed to load contacts");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleToggle = id => {
//     const newSelected = selectedIds.includes(id)
//       ? selectedIds.filter(cid => cid !== id)
//       : [...selectedIds, id];
//     onChange(newSelected);
//   };

//   const handleFileUpload = e => {
//     const file = e.target.files[0];
//     if (!file) return;

//     Papa.parse(file, {
//       header: true,
//       skipEmptyLines: true,
//       complete: function (results) {
//         const parsed = results.data.map(row => ({
//           id: crypto.randomUUID(),
//           name: row.name || "Unnamed",
//           phone: row.phone || "",
//         }));
//         setImportedContacts(parsed);
//         setShowImportModal(true);
//       },
//       error: function () {
//         toast.error("CSV Parsing Failed");
//       },
//     });
//   };

//   const confirmImport = () => {
//     setContacts(prev => [...prev, ...importedContacts]);
//     const allIds = importedContacts.map(c => c.id);
//     onChange([...selectedIds, ...allIds]);
//     setShowImportModal(false);
//     toast.success("Contacts imported successfully");
//   };

//   const filteredContacts = contacts.filter(
//     c =>
//       c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       c.phone?.includes(searchTerm)
//   );

//   if (loading) return <p>⏳ Loading contacts...</p>;

//   return (
//     <div className="space-y-4">
//       {/* 🔍 Search + Tag Filter + CSV Import */}
//       <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
//         <input
//           type="text"
//           placeholder="Search by name or phone"
//           value={searchTerm}
//           onChange={e => setSearchTerm(e.target.value)}
//           className="w-full sm:w-1/2 px-3 py-2 rounded-md border"
//         />

//         <TagFilterDropdown
//           selectedTags={tagFilter}
//           onChange={setTagFilter}
//           category="Interest"
//         />

//         <label className="cursor-pointer text-purple-600 hover:underline text-sm sm:ml-4">
//           Import CSV
//           <input
//             type="file"
//             accept=".csv"
//             onChange={handleFileUpload}
//             className="hidden"
//           />
//         </label>
//       </div>

//       {/* 🔘 Contact List */}
//       {filteredContacts.length === 0 ? (
//         <p className="text-gray-500">⚠️ No matching contacts found.</p>
//       ) : (
//         filteredContacts.map(contact => (
//           <label
//             key={contact.id}
//             className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2 text-sm text-gray-700 border-b py-1"
//           >
//             <div className="flex items-center gap-2">
//               <input
//                 type="checkbox"
//                 checked={selectedIds.includes(contact.id)}
//                 onChange={() => handleToggle(contact.id)}
//               />
//               <span>
//                 {contact.name} —{" "}
//                 <span className="text-gray-500">
//                   {contact.phoneNumber || contact.phone || "—"}
//                 </span>
//               </span>
//             </div>
//             {/* 🎨 Tag Chips */}
//             <div className="flex flex-wrap gap-1 ml-6">
//               {contact.tags?.map(tag => (
//                 <span
//                   key={tag.tagId}
//                   className="text-xs px-2 py-0.5 rounded-full"
//                   style={{
//                     backgroundColor: tag.colorHex || "#E5E7EB",
//                     color: "#000",
//                   }}
//                 >
//                   {tag.tagName}
//                 </span>
//               ))}
//             </div>
//           </label>
//         ))
//       )}

//       {/* 📦 Preview Import Modal */}
//       {showImportModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
//           <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
//             <h2 className="text-lg font-bold mb-4">
//               Preview Imported Contacts
//             </h2>
//             <div className="max-h-60 overflow-auto space-y-2">
//               {importedContacts.map((c, idx) => (
//                 <div key={idx} className="text-sm border-b py-1">
//                   <strong>{c.name}</strong> — {c.phone}
//                 </div>
//               ))}
//             </div>
//             <div className="flex justify-end mt-4 gap-4">
//               <button
//                 className="text-gray-600 hover:underline"
//                 onClick={() => setShowImportModal(false)}
//               >
//                 Cancel
//               </button>
//               <button
//                 className="bg-purple-600 text-white px-4 py-2 rounded-md"
//                 onClick={confirmImport}
//               >
//                 Import & Select
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// export default ContactSelector;
