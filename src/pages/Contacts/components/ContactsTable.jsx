import React, { useEffect, useState, useCallback } from "react";
import axiosClient from "../../../api/axiosClient";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Checkbox } from "./checkbox";
import { MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "./dropdown-menu";

function getInitials(name) {
  if (!name) return "";
  return name
    .split(" ")
    .slice(0, 2)
    .map(w => w[0])
    .join(" ")
    .toUpperCase();
}

export default function ContactsTable({
  onEdit,
  refreshTrigger,
  activeTab,
  onSelectionChange,
  searchTerm,
  currentPage,
  setCurrentPage,
}) {
  const [contacts, setContacts] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const pageSize = 20;
  const navigate = useNavigate();

  // 🟢 useCallback so it's safe to add as dependency
  const fetchContacts = useCallback(async () => {
    try {
      const res = await axiosClient.get("/contacts", {
        params: { tab: activeTab, search: searchTerm },
      });
      const result = res.data;
      const records = Array.isArray(result?.records) ? result.records : [];
      setContacts(records);
    } catch {
      toast.error("❌ Failed to load contacts");
    }
  }, [activeTab, searchTerm]);

  useEffect(() => {
    fetchContacts();
  }, [refreshTrigger, activeTab, searchTerm, fetchContacts]);

  const handleSelectAll = checked => {
    const ids = checked ? pagedContacts.map(c => c.id) : [];
    setSelectedIds(ids);
    onSelectionChange?.(ids);
  };

  const handleRowCheckbox = (checked, id) => {
    const updated = checked
      ? [...selectedIds, id]
      : selectedIds.filter(i => i !== id);
    setSelectedIds(updated);
    onSelectionChange?.(updated);
  };

  const handleDelete = async id => {
    if (!window.confirm("Are you sure you want to delete this contact?"))
      return;
    try {
      await axiosClient.delete(`/contacts/${id}`);
      toast.success("✅ Contact deleted");
      fetchContacts();
    } catch {
      toast.error("❌ Failed to delete contact");
    }
  };

  const filtered = contacts.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const sorted = [...filtered].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pagedContacts = sorted.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="overflow-x-auto rounded-lg border shadow-sm">
      <table className="w-full text-sm text-gray-700">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 text-center w-6 border-b border-gray-200">
              <Checkbox
                checked={
                  pagedContacts.length > 0 &&
                  selectedIds.length === pagedContacts.length
                }
                onCheckedChange={handleSelectAll}
                className="w-4 h-4"
              />
            </th>
            <th className="px-4 py-2 text-left border-b border-gray-200 font-medium">
              Name
            </th>
            <th className="px-4 py-2 text-left border-b border-gray-200 font-medium hidden md:table-cell">
              Email
            </th>
            <th className="px-4 py-2 text-left border-b border-gray-200 font-medium">
              Phone
            </th>
            <th className="px-4 py-2 text-left border-b border-gray-200 font-medium hidden lg:table-cell">
              Created
            </th>
            <th className="px-4 py-2 text-center w-8 border-b border-gray-200 font-medium">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {pagedContacts.map(contact => (
            <tr key={contact.id} className="hover:bg-gray-50">
              <td className="px-4 py-2 text-center">
                <Checkbox
                  checked={selectedIds.includes(contact.id)}
                  onCheckedChange={checked =>
                    handleRowCheckbox(checked, contact.id)
                  }
                  className="w-4 h-4"
                />
              </td>
              <td className="px-4 py-2 flex items-center gap-4">
                <div className="h-6 w-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs">
                  {getInitials(contact.name)}
                </div>
                <span className="font-medium truncate">{contact.name}</span>
              </td>
              <td className="px-4 py-2 hidden md:table-cell truncate">
                {contact.email || "—"}
              </td>
              <td className="px-4 py-2 truncate">{contact.phoneNumber}</td>
              <td className="px-4 py-2 hidden lg:table-cell truncate">
                {new Date(contact.createdAt).toLocaleDateString()}
              </td>
              <td className="px-4 py-2 text-center">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-1 rounded hover:bg-gray-200 focus:outline-none">
                      <MoreVertical size={16} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-36 rounded shadow-lg border bg-white">
                    <DropdownMenuItem
                      onClick={() => onEdit(contact)}
                      className="px-3 py-2 hover:bg-gray-100 text-xs"
                    >
                      ✏️ Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(contact.id)}
                      className="px-3 py-2 hover:bg-red-50 text-red-600 text-xs"
                    >
                      🗑️ Delete
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        navigate(`/dashboard/contacts/${contact.id}/notes`)
                      }
                      className="px-3 py-2 hover:bg-gray-100 text-xs"
                    >
                      📝 Notes
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination Controls */}
      <div className="flex justify-end items-center gap-3 px-4 py-3 text-sm text-gray-700">
        <button
          onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
        >
          Prev
        </button>
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}

// import React, { useEffect, useState } from "react";
// import axiosClient from "../../../api/axiosClient";
// import { useNavigate } from "react-router-dom";
// import { toast } from "react-toastify";
// import { Checkbox } from "./checkbox";
// import { MoreVertical } from "lucide-react";
// import {
//   DropdownMenu,
//   DropdownMenuTrigger,
//   DropdownMenuContent,
//   DropdownMenuItem,
// } from "./dropdown-menu";

// function getInitials(name) {
//   if (!name) return "";
//   return name
//     .split(" ")
//     .slice(0, 2)
//     .map(w => w[0])
//     .join(" ")
//     .toUpperCase();
// }

// export default function ContactsTable({
//   onEdit,
//   refreshTrigger,
//   activeTab,
//   onSelectionChange,
//   searchTerm,
//   currentPage,
//   setCurrentPage,
// }) {
//   const [contacts, setContacts] = useState([]);
//   const [selectedIds, setSelectedIds] = useState([]);
//   const pageSize = 20;
//   const navigate = useNavigate();

//   useEffect(() => {
//     fetchContacts();
//   }, [refreshTrigger, activeTab, searchTerm]);

//   const fetchContacts = async () => {
//     try {
//       const res = await axiosClient.get("/contacts", {
//         params: { tab: activeTab, search: searchTerm },
//       });
//       const result = res.data;
//       const records = Array.isArray(result?.records) ? result.records : [];
//       setContacts(records);
//     } catch {
//       toast.error("❌ Failed to load contacts");
//     }
//   };

//   const handleSelectAll = checked => {
//     const ids = checked ? pagedContacts.map(c => c.id) : [];
//     setSelectedIds(ids);
//     onSelectionChange?.(ids);
//   };

//   const handleRowCheckbox = (checked, id) => {
//     const updated = checked
//       ? [...selectedIds, id]
//       : selectedIds.filter(i => i !== id);
//     setSelectedIds(updated);
//     onSelectionChange?.(updated);
//   };

//   const handleDelete = async id => {
//     if (!window.confirm("Are you sure you want to delete this contact?"))
//       return;
//     try {
//       await axiosClient.delete(`/contacts/${id}`);
//       toast.success("✅ Contact deleted");
//       fetchContacts();
//     } catch {
//       toast.error("❌ Failed to delete contact");
//     }
//   };

//   const filtered = contacts.filter(c =>
//     c.name.toLowerCase().includes(searchTerm.toLowerCase())
//   );
//   const sorted = [...filtered].sort(
//     (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
//   );
//   const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
//   const pagedContacts = sorted.slice(
//     (currentPage - 1) * pageSize,
//     currentPage * pageSize
//   );

//   return (
//     <div className="overflow-x-auto rounded-lg border shadow-sm">
//       <table className="w-full text-sm text-gray-700">
//         <thead className="bg-gray-100">
//           <tr>
//             <th className="px-4 py-2 text-center w-6 border-b border-gray-200">
//               <Checkbox
//                 checked={
//                   pagedContacts.length > 0 &&
//                   selectedIds.length === pagedContacts.length
//                 }
//                 onCheckedChange={handleSelectAll}
//                 className="w-4 h-4"
//               />
//             </th>
//             <th className="px-4 py-2 text-left border-b border-gray-200 font-medium">
//               Name
//             </th>
//             <th className="px-4 py-2 text-left border-b border-gray-200 font-medium hidden md:table-cell">
//               Email
//             </th>
//             <th className="px-4 py-2 text-left border-b border-gray-200 font-medium">
//               Phone
//             </th>
//             <th className="px-4 py-2 text-left border-b border-gray-200 font-medium hidden lg:table-cell">
//               Created
//             </th>
//             <th className="px-4 py-2 text-center w-8 border-b border-gray-200 font-medium">
//               Actions
//             </th>
//           </tr>
//         </thead>
//         <tbody className="bg-white divide-y divide-gray-200">
//           {pagedContacts.map(contact => (
//             <tr key={contact.id} className="hover:bg-gray-50">
//               <td className="px-4 py-2 text-center">
//                 <Checkbox
//                   checked={selectedIds.includes(contact.id)}
//                   onCheckedChange={checked =>
//                     handleRowCheckbox(checked, contact.id)
//                   }
//                   className="w-4 h-4"
//                 />
//               </td>
//               <td className="px-4 py-2 flex items-center gap-4">
//                 <div className="h-6 w-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs">
//                   {getInitials(contact.name)}
//                 </div>
//                 <span className="font-medium truncate">{contact.name}</span>
//               </td>
//               <td className="px-4 py-2 hidden md:table-cell truncate">
//                 {contact.email || "—"}
//               </td>
//               <td className="px-4 py-2 truncate">{contact.phoneNumber}</td>
//               <td className="px-4 py-2 hidden lg:table-cell truncate">
//                 {new Date(contact.createdAt).toLocaleDateString()}
//               </td>
//               <td className="px-4 py-2 text-center">
//                 <DropdownMenu>
//                   <DropdownMenuTrigger asChild>
//                     <button className="p-1 rounded hover:bg-gray-200 focus:outline-none">
//                       <MoreVertical size={16} />
//                     </button>
//                   </DropdownMenuTrigger>
//                   <DropdownMenuContent className="w-36 rounded shadow-lg border bg-white">
//                     <DropdownMenuItem
//                       onClick={() => onEdit(contact)}
//                       className="px-3 py-2 hover:bg-gray-100 text-xs"
//                     >
//                       ✏️ Edit
//                     </DropdownMenuItem>
//                     <DropdownMenuItem
//                       onClick={() => handleDelete(contact.id)}
//                       className="px-3 py-2 hover:bg-red-50 text-red-600 text-xs"
//                     >
//                       🗑️ Delete
//                     </DropdownMenuItem>
//                     <DropdownMenuItem
//                       onClick={() =>
//                         navigate(`/dashboard/contacts/${contact.id}/notes`)
//                       }
//                       className="px-3 py-2 hover:bg-gray-100 text-xs"
//                     >
//                       📝 Notes
//                     </DropdownMenuItem>
//                   </DropdownMenuContent>
//                 </DropdownMenu>
//               </td>
//             </tr>
//           ))}
//         </tbody>
//       </table>

//       {/* Pagination Controls */}
//       <div className="flex justify-end items-center gap-3 px-4 py-3 text-sm text-gray-700">
//         <button
//           onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
//           disabled={currentPage === 1}
//           className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
//         >
//           Prev
//         </button>
//         <span>
//           Page {currentPage} of {totalPages}
//         </span>
//         <button
//           onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
//           disabled={currentPage === totalPages}
//           className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
//         >
//           Next
//         </button>
//       </div>
//     </div>
//   );
// }
