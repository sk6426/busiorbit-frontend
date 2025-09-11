import React, { useEffect, useState } from "react";
import axiosClient from "../../../api/axiosClient";
// Removed Edit2 as it was unused
import { Info, StickyNote } from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

export default function ContactSidebar({ contactId }) {
  const [contact, setContact] = useState(null);
  const [newNote, setNewNote] = useState("");
  const [activeTab, setActiveTab] = useState("details");

  // 🟣 LOG: Incoming contactId
  useEffect(() => {
    console.log("[ContactSidebar] Rendered with contactId:", contactId);
  }, [contactId]);

  useEffect(() => {
    if (!contactId) {
      console.warn("[ContactSidebar] No contactId provided");
      return;
    }

    const fetchContact = async () => {
      try {
        console.log("[ContactSidebar] Fetching contact:", contactId);
        const res = await axiosClient.get(`/contacts/${contactId}`);
        console.log("[ContactSidebar] API response:", res);

        // 🟣 Some APIs wrap data in a .data.data shape!
        if (res?.data?.data) {
          setContact(res.data.data);
          console.log("[ContactSidebar] Set contact with res.data.data");
        } else if (res?.data) {
          setContact(res.data);
          console.log("[ContactSidebar] Set contact with res.data");
        } else {
          setContact(res);
          console.log("[ContactSidebar] Set contact with res");
        }
      } catch (err) {
        console.error("❌ [ContactSidebar] Failed to load contact:", err);
      }
    };

    fetchContact();
  }, [contactId]);

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    try {
      console.log(
        "[ContactSidebar] Adding note for contactId:",
        contactId,
        newNote
      );
      await axiosClient.post(`/notes`, {
        contactId,
        content: newNote,
      });
      setNewNote("");
      // Refetch after adding note
      const updated = await axiosClient.get(`/contacts/${contactId}`);
      if (updated?.data?.data) {
        setContact(updated.data.data);
      } else if (updated?.data) {
        setContact(updated.data);
      } else {
        setContact(updated);
      }
    } catch (err) {
      console.error("❌ [ContactSidebar] Failed to add note:", err);
    }
  };

  // 🟣 LOG: Current contact state
  useEffect(() => {
    console.log("[ContactSidebar] Current contact state:", contact);
  }, [contact]);

  if (!contact) return <div className="p-4 text-gray-500">Loading...</div>;

  const {
    createdAt,
    tags = [],
    notes = [],
    list = "Default",
    chatWindowStatus = "Open",
    sessionStatus = "Active",
  } = contact;

  return (
    <div
      className="p-4 text-sm overflow-y-auto"
      style={{ height: "100%", maxHeight: "100%" }}
    >
      {/* 🧱 Tab Switcher */}
      <div className="flex mb-4 border rounded-md overflow-hidden text-sm">
        <button
          onClick={() => setActiveTab("details")}
          className={`flex-1 px-3 py-2 flex items-center justify-center gap-1 ${
            activeTab === "details"
              ? "bg-gray-200 font-semibold"
              : "bg-gray-100 hover:bg-gray-200"
          }`}
        >
          <Info size={14} /> Details
        </button>
        <button
          onClick={() => setActiveTab("notes")}
          className={`flex-1 px-3 py-2 flex items-center justify-center gap-1 ${
            activeTab === "notes"
              ? "bg-gray-200 font-semibold"
              : "bg-gray-100 hover:bg-gray-200"
          }`}
        >
          <StickyNote size={14} /> Notes
        </button>
      </div>

      {/* 📄 Details Tab */}
      {activeTab === "details" && (
        <div className="space-y-4">
          <div className="bg-gray-50 border rounded-md p-3">
            <h4 className="text-xs font-semibold text-gray-700 mb-1">
              Conversation
            </h4>
            <div className="flex justify-between text-xs text-gray-600">
              <span>24-hour window:</span>
              <span className="text-green-600 font-medium">
                {chatWindowStatus}
              </span>
            </div>
            <div className="flex justify-between text-xs text-gray-600">
              <span>Chat session:</span>
              <span className="text-green-600 font-medium">
                {sessionStatus}
              </span>
            </div>
            <div className="flex justify-between text-xs text-gray-600">
              <span>Window ends:</span>
              <span>—</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-gray-700 mb-1">
              Contact data
            </h4>
            <div className="text-xs text-gray-600">
              Created: {createdAt?.slice(0, 10)}
            </div>
            <div className="text-xs text-gray-600">List: {list}</div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-gray-700 mb-1">Tags</h4>
            {tags.length === 0 ? (
              <div className="text-gray-400 italic text-xs">No tags</div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <span
                    key={tag.id}
                    className="text-xs font-medium px-2 py-1 rounded-full"
                    style={{
                      backgroundColor: tag.colorHex || "#999",
                      color:
                        tag.colorHex && tag.colorHex.toLowerCase() === "#ffffe0"
                          ? "#000"
                          : "#fff",
                    }}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 📝 Notes Tab */}
      {activeTab === "notes" && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              className="flex-1 px-2 py-1 text-xs border rounded-md"
              placeholder="Add note..."
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
            />
            <button
              onClick={handleAddNote}
              className="bg-blue-600 text-white text-xs px-3 py-1 rounded-md hover:bg-blue-700"
            >
              Add
            </button>
          </div>

          {Array.isArray(notes) && notes.length > 0 ? (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {notes.map(n => (
                <div
                  key={n.id}
                  className="text-xs text-gray-700 bg-gray-100 rounded-md px-2 py-1"
                >
                  <div>{n.content}</div>
                  <div className="text-[10px] text-gray-400 mt-1">
                    {dayjs(n.createdAt).fromNow()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-400 italic text-xs">No notes yet</div>
          )}
        </div>
      )}
    </div>
  );
}

// import React, { useEffect, useState } from "react";
// import axiosClient from "../../../api/axiosClient";
// import { Edit2, Info, StickyNote } from "lucide-react";
// import dayjs from "dayjs";
// import relativeTime from "dayjs/plugin/relativeTime";
// dayjs.extend(relativeTime);

// export default function ContactSidebar({ contactId }) {
//   const [contact, setContact] = useState(null);
//   const [newNote, setNewNote] = useState("");
//   const [activeTab, setActiveTab] = useState("details");

//   // 🟣 LOG: Incoming contactId
//   useEffect(() => {
//     console.log("[ContactSidebar] Rendered with contactId:", contactId);
//   }, [contactId]);

//   useEffect(() => {
//     if (!contactId) {
//       console.warn("[ContactSidebar] No contactId provided");
//       return;
//     }

//     const fetchContact = async () => {
//       try {
//         console.log("[ContactSidebar] Fetching contact:", contactId);
//         const res = await axiosClient.get(`/contacts/${contactId}`);
//         console.log("[ContactSidebar] API response:", res);

//         // 🟣 Some APIs wrap data in a .data.data shape!
//         if (res?.data?.data) {
//           setContact(res.data.data);
//           console.log("[ContactSidebar] Set contact with res.data.data");
//         } else if (res?.data) {
//           setContact(res.data);
//           console.log("[ContactSidebar] Set contact with res.data");
//         } else {
//           setContact(res);
//           console.log("[ContactSidebar] Set contact with res");
//         }
//       } catch (err) {
//         console.error("❌ [ContactSidebar] Failed to load contact:", err);
//       }
//     };

//     fetchContact();
//   }, [contactId]);

//   const handleAddNote = async () => {
//     if (!newNote.trim()) return;

//     try {
//       console.log(
//         "[ContactSidebar] Adding note for contactId:",
//         contactId,
//         newNote
//       );
//       await axiosClient.post(`/notes`, {
//         contactId,
//         content: newNote,
//       });
//       setNewNote("");
//       // Refetch after adding note
//       const updated = await axiosClient.get(`/contacts/${contactId}`);
//       if (updated?.data?.data) {
//         setContact(updated.data.data);
//       } else if (updated?.data) {
//         setContact(updated.data);
//       } else {
//         setContact(updated);
//       }
//     } catch (err) {
//       console.error("❌ [ContactSidebar] Failed to add note:", err);
//     }
//   };

//   // 🟣 LOG: Current contact state
//   useEffect(() => {
//     console.log("[ContactSidebar] Current contact state:", contact);
//   }, [contact]);

//   if (!contact) return <div className="p-4 text-gray-500">Loading...</div>;

//   const {
//     name,
//     phoneNumber,
//     createdAt,
//     tags = [],
//     notes = [],
//     list = "Default",
//     chatWindowStatus = "Open",
//     sessionStatus = "Active",
//   } = contact;

//   const initials = name
//     ?.split(" ")
//     .map(n => n[0])
//     .join("")
//     .substring(0, 2)
//     .toUpperCase();

//   return (
//     <div className="p-4 text-sm overflow-y-auto h-full">
//       {/* 🔹 Top Header */}
//       <div className="flex items-center gap-4 mb-4">
//         <div className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center font-semibold text-sm">
//           {initials}
//         </div>
//         <div>
//           <h2 className="font-semibold text-gray-800 flex items-center gap-2">
//             {name}
//             {sessionStatus === "Active" && (
//               <span
//                 className="ml-1 inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"
//                 title="Active session"
//               ></span>
//             )}
//           </h2>
//           <div className="text-xs text-gray-500">{phoneNumber}</div>
//         </div>
//       </div>

//       {/* 🧱 Tab Switcher */}
//       <div className="flex mb-4 border rounded-md overflow-hidden text-sm">
//         <button
//           onClick={() => setActiveTab("details")}
//           className={`flex-1 px-3 py-2 flex items-center justify-center gap-1 ${
//             activeTab === "details"
//               ? "bg-gray-200 font-semibold"
//               : "bg-gray-100 hover:bg-gray-200"
//           }`}
//         >
//           <Info size={14} /> Details
//         </button>
//         <button
//           onClick={() => setActiveTab("notes")}
//           className={`flex-1 px-3 py-2 flex items-center justify-center gap-1 ${
//             activeTab === "notes"
//               ? "bg-gray-200 font-semibold"
//               : "bg-gray-100 hover:bg-gray-200"
//           }`}
//         >
//           <StickyNote size={14} /> Notes
//         </button>
//       </div>

//       {/* 📄 Details Tab */}
//       {activeTab === "details" && (
//         <div className="space-y-4">
//           <div className="bg-gray-50 border rounded-md p-3">
//             <h4 className="text-xs font-semibold text-gray-700 mb-1">
//               Conversation
//             </h4>
//             <div className="flex justify-between text-xs text-gray-600">
//               <span>24-hour window:</span>
//               <span className="text-green-600 font-medium">
//                 {chatWindowStatus}
//               </span>
//             </div>
//             <div className="flex justify-between text-xs text-gray-600">
//               <span>Chat session:</span>
//               <span className="text-green-600 font-medium">
//                 {sessionStatus}
//               </span>
//             </div>
//             <div className="flex justify-between text-xs text-gray-600">
//               <span>Window ends:</span>
//               <span>—</span>
//             </div>
//           </div>

//           <div>
//             <h4 className="text-xs font-semibold text-gray-700 mb-1">
//               Contact data
//             </h4>
//             <div className="text-xs text-gray-600">
//               Created: {createdAt?.slice(0, 10)}
//             </div>
//             <div className="text-xs text-gray-600">List: {list}</div>
//           </div>

//           <div>
//             <h4 className="text-xs font-semibold text-gray-700 mb-1">Tags</h4>
//             {tags.length === 0 ? (
//               <div className="text-gray-400 italic text-xs">No tags</div>
//             ) : (
//               <div className="flex flex-wrap gap-2">
//                 {tags.map(tag => (
//                   <span
//                     key={tag.id}
//                     className="text-xs font-medium px-2 py-1 rounded-full"
//                     style={{
//                       backgroundColor: tag.colorHex || "#999",
//                       color:
//                         tag.colorHex && tag.colorHex.toLowerCase() === "#ffffe0"
//                           ? "#000"
//                           : "#fff",
//                     }}
//                   >
//                     {tag.name}
//                   </span>
//                 ))}
//               </div>
//             )}
//           </div>
//         </div>
//       )}

//       {/* 📝 Notes Tab */}
//       {activeTab === "notes" && (
//         <div className="space-y-3">
//           <div className="flex gap-2">
//             <input
//               className="flex-1 px-2 py-1 text-xs border rounded-md"
//               placeholder="Add note..."
//               value={newNote}
//               onChange={e => setNewNote(e.target.value)}
//             />
//             <button
//               onClick={handleAddNote}
//               className="bg-blue-600 text-white text-xs px-3 py-1 rounded-md hover:bg-blue-700"
//             >
//               Add
//             </button>
//           </div>

//           {Array.isArray(notes) && notes.length > 0 ? (
//             <div className="space-y-2 max-h-40 overflow-y-auto">
//               {notes.map(n => (
//                 <div
//                   key={n.id}
//                   className="text-xs text-gray-700 bg-gray-100 rounded-md px-2 py-1"
//                 >
//                   <div>{n.content}</div>
//                   <div className="text-[10px] text-gray-400 mt-1">
//                     {dayjs(n.createdAt).fromNow()}
//                   </div>
//                 </div>
//               ))}
//             </div>
//           ) : (
//             <div className="text-gray-400 italic text-xs">No notes yet</div>
//           )}
//         </div>
//       )}
//     </div>
//   );
// }
