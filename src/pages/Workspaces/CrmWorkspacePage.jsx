// 📄 File: src/pages/Workspaces/CrmWorkspacePage.jsx

import {
  Archive,
  Pin,
  ArrowRightCircle,
  UserCircle2,
  Tags,
  BellRing,
  Clock4,
  GripVertical,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
// ✅ Use the new server-authoritative AuthProvider
import { useAuth } from "../../app/providers/AuthProvider";

/**
 * 🔐 Map CRM blocks to EXACT Permission.Code values from your back end.
 * Adjust these strings to match your seeded permissions.
 */
const PERM_BY_BLOCK = {
  contacts: "crm.contacts.view",
  tags: "crm.tags.view",
  reminders: "reminders.view", // change/remove if not seeded
  timeline: "crm.timeline", // change/remove if not seeded
};

const crmBlocks = [
  {
    id: "contacts",
    label: "Contacts",
    description: "Central place to manage leads, customers, and their details.",
    path: "/app/crm/contacts",
    icon: <UserCircle2 className="text-purple-600" size={26} />,
    action: "Open Contacts",
    statLabel: "Total Contacts",
    statValue: 245,
  },
  {
    id: "tags",
    label: "Tags",
    description: "Organize and filter contacts using color-coded tags.",
    path: "/app/crm/tags",
    icon: <Tags className="text-yellow-500" size={26} />,
    action: "Manage Tags",
    statLabel: "Total Tags",
    statValue: 12,
  },
  {
    id: "reminders",
    label: "Reminders",
    description: "Schedule follow-ups and set alerts to never miss a lead.",
    path: "/app/crm/reminders",
    icon: <BellRing className="text-blue-500" size={26} />,
    action: "View Reminders",
    statLabel: "Pending",
    statValue: 3,
  },
  {
    id: "timeline",
    label: "Timeline",
    description: "Track every interaction and touchpoint with each contact.",
    path: "/app/crm/timeline",
    icon: <Clock4 className="text-green-600" size={26} />,
    action: "View Timeline",
    statLabel: "Entries",
    statValue: 150,
  },
];

export default function CrmWorkspacePage() {
  const navigate = useNavigate();

  const { isLoading, hasAllAccess, can } = useAuth();

  const [pinned, setPinned] = useState(
    JSON.parse(localStorage.getItem("crm-pinned") || "[]")
  );
  const [archived, setArchived] = useState(
    JSON.parse(localStorage.getItem("crm-archived") || "[]")
  );
  const [order, setOrder] = useState(
    JSON.parse(localStorage.getItem("crm-order")) || crmBlocks.map(b => b.id)
  );

  const togglePin = id => {
    const updated = pinned.includes(id)
      ? pinned.filter(i => i !== id)
      : [...pinned, id];
    setPinned(updated);
    localStorage.setItem("crm-pinned", JSON.stringify(updated));
  };

  const toggleArchive = id => {
    const updated = archived.includes(id)
      ? archived.filter(i => i !== id)
      : [...archived, id];
    setArchived(updated);
    localStorage.setItem("crm-archived", JSON.stringify(updated));
  };

  const onDragEnd = result => {
    if (!result.destination) return;
    const newOrder = Array.from(order);
    const [moved] = newOrder.splice(result.source.index, 1);
    newOrder.splice(result.destination.index, 0, moved);
    setOrder(newOrder);
    localStorage.setItem("crm-order", JSON.stringify(newOrder));
  };

  // ✅ server-first permission check
  const isAllowedBlock = block => {
    if (hasAllAccess) return true;
    if (typeof can === "function") {
      const code = PERM_BY_BLOCK[block.id];
      // hide blocks with no mapped code until you seed them
      return !!code && can(code);
    }
    // If can() is missing for some reason, keep visible (safer for legacy)
    return true;
  };

  const visibleBlocks = order
    .filter(id => {
      const block = crmBlocks.find(b => b.id === id);
      if (!block || archived.includes(id)) return false;
      return isAllowedBlock(block);
    })
    .map(id => crmBlocks.find(b => b.id === id));

  if (isLoading) {
    return (
      <div className="p-10 text-center text-lg text-gray-500">
        Loading features…
      </div>
    );
  }

  return (
    <div
      className="p-6 space-y-6 bg-gray-50 min-h-screen"
      data-test-id="crm-root"
    >
      {/* Header */}
      <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
        🧠 CRM Workspace
      </h2>
      <p className="text-gray-600">
        Manage your contacts, organize them with tags, track interactions, and
        stay on top of reminders.
      </p>

      {/* Cards */}
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="crm-blocks" direction="horizontal">
          {provided => (
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              {visibleBlocks.map((block, index) => (
                <Draggable key={block.id} draggableId={block.id} index={index}>
                  {provided => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className="rounded-2xl border bg-white shadow-lg/5 hover:shadow-lg transition transform hover:-translate-y-1 hover:border-purple-300 duration-200 overflow-hidden cursor-pointer min-h-[220px] flex flex-col justify-between"
                      onClick={e => {
                        if (!e.target.closest("button,svg")) {
                          navigate(block.path);
                        }
                      }}
                    >
                      {/* Top */}
                      <div className="flex items-start gap-4 p-5 flex-1">
                        <div className="bg-gradient-to-br from-gray-100 to-white rounded-full p-3 flex-shrink-0">
                          {block.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {block.label}
                          </h3>
                          <p className="text-sm text-gray-500 mb-2 line-clamp-2">
                            {block.description}
                          </p>
                          <div>
                            <span className="text-2xl font-bold text-gray-900">
                              {block.statValue}
                            </span>
                            <span className="ml-1 text-xs text-gray-500">
                              {block.statLabel}
                            </span>
                          </div>
                        </div>
                        <div
                          {...provided.dragHandleProps}
                          className="cursor-grab text-gray-400 hover:text-gray-600"
                        >
                          <GripVertical size={16} />
                        </div>
                      </div>

                      {/* Bottom actions */}
                      <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50">
                        <button
                          onClick={() => navigate(block.path)}
                          className="text-sm text-purple-600 font-medium flex items-center gap-1 hover:bg-purple-50 px-3 py-1 rounded-md transition"
                        >
                          {block.action} <ArrowRightCircle size={18} />
                        </button>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => togglePin(block.id)}
                            title={pinned.includes(block.id) ? "Unpin" : "Pin"}
                          >
                            <Pin
                              size={18}
                              className={
                                pinned.includes(block.id)
                                  ? "text-red-500"
                                  : "text-gray-400 hover:text-red-500"
                              }
                            />
                          </button>
                          <button
                            onClick={() => toggleArchive(block.id)}
                            title="Archive"
                          >
                            <Archive
                              size={18}
                              className={
                                archived.includes(block.id)
                                  ? "text-indigo-500"
                                  : "text-gray-400 hover:text-indigo-500"
                              }
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}

// import {
//   Archive,
//   Pin,
//   ArrowRightCircle,
//   UserCircle2,
//   Tags,
//   BellRing,
//   Clock4,
//   GripVertical,
// } from "lucide-react";
// import { useNavigate } from "react-router-dom";
// import { useState } from "react";
// import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
// // import { useAuth } from "../auth/context/AuthContext";
// // import { useAuth } from "../../../pages/auth/context/AuthContext";
// import { useAuth } from "../auth/context/pld_AuthContext";
// /**
//  * 🔐 Map CRM blocks to EXACT Permission.Code values from your DB.
//  * Adjust these strings to match your seeded permissions.
//  */
// const PERM_BY_BLOCK = {
//   contacts: "contacts.view", // seen in your tables
//   tags: "tags.edit", // seen in your tables
//   reminders: "reminders.view", // TODO: change if your code differs or remove if not seeded
//   timeline: "crm.timeline", // TODO: change if your code differs or remove if not seeded
// };

// const crmBlocks = [
//   {
//     id: "contacts",
//     label: "Contacts",
//     description: "Central place to manage leads, customers, and their details.",
//     path: "/app/crm/contacts",
//     icon: <UserCircle2 className="text-purple-600" size={26} />,
//     action: "Open Contacts",
//     statLabel: "Total Contacts",
//     statValue: 245,
//   },
//   {
//     id: "tags",
//     label: "Tags",
//     description: "Organize and filter contacts using color-coded tags.",
//     path: "/app/crm/tags",
//     icon: <Tags className="text-yellow-500" size={26} />,
//     action: "Manage Tags",
//     statLabel: "Total Tags",
//     statValue: 12,
//   },
//   {
//     id: "reminders",
//     label: "Reminders",
//     description: "Schedule follow-ups and set alerts to never miss a lead.",
//     path: "/app/crm/reminders",
//     icon: <BellRing className="text-blue-500" size={26} />,
//     action: "View Reminders",
//     statLabel: "Pending",
//     statValue: 3,
//   },
//   {
//     id: "timeline",
//     label: "Timeline",
//     description: "Track every interaction and touchpoint with each contact.",
//     path: "/app/crm/timeline",
//     icon: <Clock4 className="text-green-600" size={26} />,
//     action: "View Timeline",
//     statLabel: "Entries",
//     statValue: 150,
//     // featureKey left here as legacy fallback only (not used if can() exists)
//     featureKey: "CRMInsights",
//   },
// ];

// export default function CrmWorkspacePage() {
//   const navigate = useNavigate();
//   // Pull can()/hasAllAccess if your AuthContext exposes them; keep legacy map for fallback.
//   const {
//     availableFeatures = {},
//     isLoading,
//     plan,
//     can,
//     hasAllAccess,
//   } = useAuth();

//   const [pinned, setPinned] = useState(
//     JSON.parse(localStorage.getItem("crm-pinned") || "[]")
//   );
//   const [archived, setArchived] = useState(
//     JSON.parse(localStorage.getItem("crm-archived") || "[]")
//   );
//   const [order, setOrder] = useState(
//     JSON.parse(localStorage.getItem("crm-order")) || crmBlocks.map(b => b.id)
//   );

//   const togglePin = id => {
//     const updated = pinned.includes(id)
//       ? pinned.filter(i => i !== id)
//       : [...pinned, id];
//     setPinned(updated);
//     localStorage.setItem("crm-pinned", JSON.stringify(updated));
//   };

//   const toggleArchive = id => {
//     const updated = archived.includes(id)
//       ? archived.filter(i => i !== id)
//       : [...archived, id];
//     setArchived(updated);
//     localStorage.setItem("crm-archived", JSON.stringify(updated));
//   };

//   const onDragEnd = result => {
//     if (!result.destination) return;
//     const newOrder = Array.from(order);
//     const [moved] = newOrder.splice(result.source.index, 1);
//     newOrder.splice(result.destination.index, 0, moved);
//     setOrder(newOrder);
//     localStorage.setItem("crm-order", JSON.stringify(newOrder));
//   };

//   // ✅ unified permission check (server-first, legacy fallback)
//   const isAllowedBlock = block => {
//     const code = PERM_BY_BLOCK[block.id];

//     // Prefer server-authorized check if available
//     if (typeof can === "function") {
//       if (hasAllAccess) return true;
//       // If no mapped code (temporary), default to hidden for safety
//       if (!code) return false;
//       return can(code);
//     }

//     // Legacy fallback: use your old availableFeatures and block.featureKey
//     if (block.featureKey) return availableFeatures[block.featureKey] === true;

//     // If no featureKey and no can(), default to visible to preserve current behavior
//     // (flip to false later once all codes exist)
//     return true;
//   };

//   const visibleBlocks = order
//     .filter(id => {
//       const block = crmBlocks.find(b => b.id === id);
//       if (!block || archived.includes(id)) return false;
//       return isAllowedBlock(block);
//     })
//     .map(id => crmBlocks.find(b => b.id === id));

//   if (isLoading) {
//     return (
//       <div className="p-10 text-center text-lg text-gray-500">
//         Loading features…
//       </div>
//     );
//   }

//   return (
//     <div
//       className="p-6 space-y-6 bg-gray-50 min-h-screen"
//       data-test-id="crm-root"
//     >
//       {/* Header */}
//       <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
//         🧠 CRM Workspace
//       </h2>
//       <p className="text-gray-600">
//         Manage your contacts, organize them with tags, track interactions, and
//         stay on top of reminders.
//       </p>

//       {/* Plan alert (UX only; access still enforced by permission) */}
//       {String(plan).toLowerCase() === "basic" && (
//         <div className="bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 p-4 rounded-sm shadow-sm">
//           You’re on the <strong>Basic</strong> plan. Upgrade to use CRM
//           timelines and get detailed history of contacts.
//           <button
//             onClick={() => navigate("/app/upgrade")}
//             className="ml-3 text-purple-700 underline hover:text-purple-900 font-medium"
//           >
//             Upgrade Now
//           </button>
//         </div>
//       )}

//       {/* Cards */}
//       <DragDropContext onDragEnd={onDragEnd}>
//         <Droppable droppableId="crm-blocks" direction="horizontal">
//           {provided => (
//             <div
//               className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
//               ref={provided.innerRef}
//               {...provided.droppableProps}
//             >
//               {visibleBlocks.map((block, index) => (
//                 <Draggable key={block.id} draggableId={block.id} index={index}>
//                   {provided => (
//                     <div
//                       ref={provided.innerRef}
//                       {...provided.draggableProps}
//                       className="rounded-2xl border bg-white shadow-lg/5 hover:shadow-lg transition transform hover:-translate-y-1 hover:border-purple-300 duration-200 overflow-hidden cursor-pointer min-h-[220px] flex flex-col justify-between"
//                       onClick={e => {
//                         if (!e.target.closest("button,svg")) {
//                           navigate(block.path);
//                         }
//                       }}
//                     >
//                       {/* Top */}
//                       <div className="flex items-start gap-4 p-5 flex-1">
//                         <div className="bg-gradient-to-br from-gray-100 to-white rounded-full p-3 flex-shrink-0">
//                           {block.icon}
//                         </div>
//                         <div className="flex-1">
//                           <h3 className="text-lg font-semibold text-gray-900">
//                             {block.label}
//                           </h3>
//                           <p className="text-sm text-gray-500 mb-2 line-clamp-2">
//                             {block.description}
//                           </p>
//                           <div>
//                             <span className="text-2xl font-bold text-gray-900">
//                               {block.statValue}
//                             </span>
//                             <span className="ml-1 text-xs text-gray-500">
//                               {block.statLabel}
//                             </span>
//                           </div>
//                         </div>
//                         <div
//                           {...provided.dragHandleProps}
//                           className="cursor-grab text-gray-400 hover:text-gray-600"
//                         >
//                           <GripVertical size={16} />
//                         </div>
//                       </div>

//                       {/* Bottom actions */}
//                       <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50">
//                         <button
//                           onClick={() => navigate(block.path)}
//                           className="text-sm text-purple-600 font-medium flex items-center gap-1 hover:bg-purple-50 px-3 py-1 rounded-md transition"
//                         >
//                           {block.action} <ArrowRightCircle size={18} />
//                         </button>
//                         <div className="flex items-center gap-3">
//                           <button
//                             onClick={() => togglePin(block.id)}
//                             title={pinned.includes(block.id) ? "Unpin" : "Pin"}
//                           >
//                             <Pin
//                               size={18}
//                               className={
//                                 pinned.includes(block.id)
//                                   ? "text-red-500"
//                                   : "text-gray-400 hover:text-red-500"
//                               }
//                             />
//                           </button>
//                           <button
//                             onClick={() => toggleArchive(block.id)}
//                             title="Archive"
//                           >
//                             <Archive
//                               size={18}
//                               className={
//                                 archived.includes(block.id)
//                                   ? "text-indigo-500"
//                                   : "text-gray-400 hover:text-indigo-500"
//                               }
//                             />
//                           </button>
//                         </div>
//                       </div>
//                     </div>
//                   )}
//                 </Draggable>
//               ))}
//               {provided.placeholder}
//             </div>
//           )}
//         </Droppable>
//       </DragDropContext>
//     </div>
//   );
// }

// import {
//   Archive,
//   Pin,
//   ArrowRightCircle,
//   UserCircle2,
//   Tags,
//   BellRing,
//   Clock4,
//   GripVertical,
// } from "lucide-react";
// import { useNavigate } from "react-router-dom";
// import { useState } from "react";
// import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
// import { useAuth } from "../auth/context/AuthContext";

// const crmBlocks = [
//   {
//     id: "contacts",
//     label: "Contacts",
//     description: "Central place to manage leads, customers, and their details.",
//     path: "/app/crm/contacts",
//     icon: <UserCircle2 className="text-purple-600" size={26} />,
//     action: "Open Contacts",
//     statLabel: "Total Contacts",
//     statValue: 245,
//   },
//   {
//     id: "tags",
//     label: "Tags",
//     description: "Organize and filter contacts using color-coded tags.",
//     path: "/app/crm/tags",
//     icon: <Tags className="text-yellow-500" size={26} />,
//     action: "Manage Tags",
//     statLabel: "Total Tags",
//     statValue: 12,
//   },
//   {
//     id: "reminders",
//     label: "Reminders",
//     description: "Schedule follow-ups and set alerts to never miss a lead.",
//     path: "/app/crm/reminders",
//     icon: <BellRing className="text-blue-500" size={26} />,
//     action: "View Reminders",
//     statLabel: "Pending",
//     statValue: 3,
//   },
//   {
//     id: "timeline",
//     label: "Timeline",
//     description: "Track every interaction and touchpoint with each contact.",
//     path: "/app/crm/timeline",
//     icon: <Clock4 className="text-green-600" size={26} />,
//     action: "View Timeline",
//     statLabel: "Entries",
//     statValue: 150,
//     featureKey: "CRMInsights",
//   },
// ];

// export default function CrmWorkspacePage() {
//   const navigate = useNavigate();
//   const { availableFeatures = {}, isLoading, plan } = useAuth();

//   const [pinned, setPinned] = useState(
//     JSON.parse(localStorage.getItem("crm-pinned") || "[]")
//   );
//   const [archived, setArchived] = useState(
//     JSON.parse(localStorage.getItem("crm-archived") || "[]")
//   );
//   const [order, setOrder] = useState(
//     JSON.parse(localStorage.getItem("crm-order")) || crmBlocks.map(b => b.id)
//   );

//   const togglePin = id => {
//     const updated = pinned.includes(id)
//       ? pinned.filter(i => i !== id)
//       : [...pinned, id];
//     setPinned(updated);
//     localStorage.setItem("crm-pinned", JSON.stringify(updated));
//   };

//   const toggleArchive = id => {
//     const updated = archived.includes(id)
//       ? archived.filter(i => i !== id)
//       : [...archived, id];
//     setArchived(updated);
//     localStorage.setItem("crm-archived", JSON.stringify(updated));
//   };

//   const onDragEnd = result => {
//     if (!result.destination) return;
//     const newOrder = Array.from(order);
//     const [moved] = newOrder.splice(result.source.index, 1);
//     newOrder.splice(result.destination.index, 0, moved);
//     setOrder(newOrder);
//     localStorage.setItem("crm-order", JSON.stringify(newOrder));
//   };

//   const visibleBlocks = order
//     .filter(id => {
//       const block = crmBlocks.find(b => b.id === id);
//       if (!block || archived.includes(id)) return false;
//       if (block.featureKey && !availableFeatures[block.featureKey])
//         return false;
//       return true;
//     })
//     .map(id => crmBlocks.find(b => b.id === id));

//   if (isLoading) {
//     return (
//       <div className="p-10 text-center text-lg text-gray-500">
//         Loading features…
//       </div>
//     );
//   }

//   return (
//     <div
//       className="p-6 space-y-6 bg-gray-50 min-h-screen"
//       data-test-id="crm-root"
//     >
//       {/* Header */}
//       <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
//         🧠 CRM Workspace
//       </h2>
//       <p className="text-gray-600">
//         Manage your contacts, organize them with tags, track interactions, and
//         stay on top of reminders.
//       </p>

//       {/* Plan alert */}
//       {plan === "basic" && (
//         <div className="bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 p-4 rounded-sm shadow-sm">
//           You’re on the <strong>Basic</strong> plan. Upgrade to use CRM
//           timelines and get detailed history of contacts.
//           <button
//             onClick={() => navigate("/app/upgrade")}
//             className="ml-3 text-purple-700 underline hover:text-purple-900 font-medium"
//           >
//             Upgrade Now
//           </button>
//         </div>
//       )}

//       {/* Cards */}
//       <DragDropContext onDragEnd={onDragEnd}>
//         <Droppable droppableId="crm-blocks" direction="horizontal">
//           {provided => (
//             <div
//               className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
//               ref={provided.innerRef}
//               {...provided.droppableProps}
//             >
//               {visibleBlocks.map((block, index) => (
//                 <Draggable key={block.id} draggableId={block.id} index={index}>
//                   {provided => (
//                     <div
//                       ref={provided.innerRef}
//                       {...provided.draggableProps}
//                       className="rounded-2xl border bg-white shadow-lg/5 hover:shadow-lg transition transform hover:-translate-y-1 hover:border-purple-300 duration-200 overflow-hidden cursor-pointer min-h-[220px] flex flex-col justify-between"
//                       onClick={e => {
//                         if (!e.target.closest("button,svg")) {
//                           navigate(block.path);
//                         }
//                       }}
//                     >
//                       {/* Top */}
//                       <div className="flex items-start gap-4 p-5 flex-1">
//                         <div className="bg-gradient-to-br from-gray-100 to-white rounded-full p-3 flex-shrink-0">
//                           {block.icon}
//                         </div>
//                         <div className="flex-1">
//                           <h3 className="text-lg font-semibold text-gray-900">
//                             {block.label}
//                           </h3>
//                           <p className="text-sm text-gray-500 mb-2 line-clamp-2">
//                             {block.description}
//                           </p>
//                           <div>
//                             <span className="text-2xl font-bold text-gray-900">
//                               {block.statValue}
//                             </span>
//                             <span className="ml-1 text-xs text-gray-500">
//                               {block.statLabel}
//                             </span>
//                           </div>
//                         </div>
//                         <div
//                           {...provided.dragHandleProps}
//                           className="cursor-grab text-gray-400 hover:text-gray-600"
//                         >
//                           <GripVertical size={16} />
//                         </div>
//                       </div>

//                       {/* Bottom actions */}
//                       <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50">
//                         <button
//                           onClick={() => navigate(block.path)}
//                           className="text-sm text-purple-600 font-medium flex items-center gap-1 hover:bg-purple-50 px-3 py-1 rounded-md transition"
//                         >
//                           {block.action} <ArrowRightCircle size={18} />
//                         </button>
//                         <div className="flex items-center gap-3">
//                           <button
//                             onClick={() => togglePin(block.id)}
//                             title={pinned.includes(block.id) ? "Unpin" : "Pin"}
//                           >
//                             <Pin
//                               size={18}
//                               className={
//                                 pinned.includes(block.id)
//                                   ? "text-red-500"
//                                   : "text-gray-400 hover:text-red-500"
//                               }
//                             />
//                           </button>
//                           <button
//                             onClick={() => toggleArchive(block.id)}
//                             title="Archive"
//                           >
//                             <Archive
//                               size={18}
//                               className={
//                                 archived.includes(block.id)
//                                   ? "text-indigo-500"
//                                   : "text-gray-400 hover:text-indigo-500"
//                               }
//                             />
//                           </button>
//                         </div>
//                       </div>
//                     </div>
//                   )}
//                 </Draggable>
//               ))}
//               {provided.placeholder}
//             </div>
//           )}
//         </Droppable>
//       </DragDropContext>
//     </div>
//   );
// }

// import {
//   Archive,
//   Pin,
//   ArrowRightCircle,
//   MoreVertical,
//   UserCircle2,
//   Tags,
//   BellRing,
//   Clock4,
//   GripVertical,
// } from "lucide-react";
// import { useNavigate } from "react-router-dom";
// import { useState } from "react";
// import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
// import { useAuth } from "../auth/context/AuthContext";

// const crmBlocks = [
//   {
//     id: "contacts",
//     label: "Contacts",
//     description: "Central place to manage leads, customers, and their details.",
//     path: "/app/crm/contacts",
//     icon: <UserCircle2 className="text-purple-600" size={26} />,
//     action: "Open Contacts",
//     statLabel: "Total Contacts",
//     statValue: 245,
//   },
//   {
//     id: "tags",
//     label: "Tags",
//     description: "Organize and filter contacts using color-coded tags.",
//     path: "/app/crm/tags",
//     icon: <Tags className="text-yellow-500" size={26} />,
//     action: "Manage Tags",
//     statLabel: "Total Tags",
//     statValue: 12,
//   },
//   {
//     id: "reminders",
//     label: "Reminders",
//     description: "Schedule follow-ups and set alerts to never miss a lead.",
//     path: "/app/crm/reminders",
//     icon: <BellRing className="text-blue-500" size={26} />,
//     action: "View Reminders",
//     statLabel: "Pending",
//     statValue: 3,
//   },
//   {
//     id: "timeline",
//     label: "Timeline",
//     description: "Track every interaction and touchpoint with each contact.",
//     path: "/app/crm/timeline",
//     icon: <Clock4 className="text-green-600" size={26} />,
//     action: "View Timeline",
//     statLabel: "Entries",
//     statValue: 150,
//     featureKey: "CRMInsights",
//   },
// ];

// export default function CrmWorkspacePage() {
//   const navigate = useNavigate();
//   const { availableFeatures = {}, isLoading, plan } = useAuth();

//   const [pinned, setPinned] = useState(
//     JSON.parse(localStorage.getItem("crm-pinned") || "[]")
//   );
//   const [archived, setArchived] = useState(
//     JSON.parse(localStorage.getItem("crm-archived") || "[]")
//   );
//   const [order, setOrder] = useState(
//     JSON.parse(localStorage.getItem("crm-order")) || crmBlocks.map(b => b.id)
//   );

//   const togglePin = id => {
//     const updated = pinned.includes(id)
//       ? pinned.filter(i => i !== id)
//       : [...pinned, id];
//     setPinned(updated);
//     localStorage.setItem("crm-pinned", JSON.stringify(updated));
//   };

//   const toggleArchive = id => {
//     const updated = archived.includes(id)
//       ? archived.filter(i => i !== id)
//       : [...archived, id];
//     setArchived(updated);
//     localStorage.setItem("crm-archived", JSON.stringify(updated));
//   };

//   const onDragEnd = result => {
//     if (!result.destination) return;
//     const newOrder = Array.from(order);
//     const [moved] = newOrder.splice(result.source.index, 1);
//     newOrder.splice(result.destination.index, 0, moved);
//     setOrder(newOrder);
//     localStorage.setItem("crm-order", JSON.stringify(newOrder));
//   };

//   const visibleBlocks = order
//     .filter(id => {
//       const block = crmBlocks.find(b => b.id === id);
//       if (!block || archived.includes(id)) return false;
//       if (block.featureKey && !availableFeatures[block.featureKey])
//         return false;
//       return true;
//     })
//     .map(id => crmBlocks.find(b => b.id === id));

//   if (isLoading) {
//     return (
//       <div className="p-10 text-center text-lg text-gray-500">
//         Loading features…
//       </div>
//     );
//   }

//   return (
//     <div
//       className="p-6 space-y-6 bg-gray-50 min-h-screen"
//       data-test-id="crm-root"
//     >
//       {/* Header */}
//       <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
//         🧠 CRM Workspace
//       </h2>
//       <p className="text-gray-600">
//         Manage your contacts, organize them with tags, track interactions, and
//         stay on top of reminders.
//       </p>

//       {/* Plan alert */}
//       {plan === "basic" && (
//         <div className="bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 p-4 rounded-md shadow-sm">
//           You’re on the <strong>Basic</strong> plan. Upgrade to use CRM
//           timelines and get detailed history of contacts.
//           <button
//             onClick={() => navigate("/app/upgrade")}
//             className="ml-3 text-purple-700 underline hover:text-purple-900 font-medium"
//           >
//             Upgrade Now
//           </button>
//         </div>
//       )}

//       {/* Cards */}
//       <DragDropContext onDragEnd={onDragEnd}>
//         <Droppable droppableId="crm-blocks" direction="horizontal">
//           {provided => (
//             <div
//               className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
//               ref={provided.innerRef}
//               {...provided.droppableProps}
//             >
//               {visibleBlocks.map((block, index) => (
//                 <Draggable key={block.id} draggableId={block.id} index={index}>
//                   {provided => (
//                     <div
//                       ref={provided.innerRef}
//                       {...provided.draggableProps}
//                       className={`rounded-2xl border bg-white shadow-lg/5 hover:shadow-lg transition transform hover:-translate-y-1 hover:border-purple-300 duration-200 overflow-hidden cursor-pointer`}
//                       onClick={e => {
//                         // prevent clicks on actions from triggering nav
//                         if (!e.target.closest("button,svg")) {
//                           navigate(block.path);
//                         }
//                       }}
//                     >
//                       {/* Top */}
//                       <div className="flex items-start gap-4 p-5">
//                         <div className="bg-gradient-to-br from-gray-100 to-white rounded-full p-3">
//                           {block.icon}
//                         </div>
//                         <div className="flex-1">
//                           <h3 className="text-lg font-semibold text-gray-900">
//                             {block.label}
//                           </h3>
//                           <p className="text-sm text-gray-500 mb-2">
//                             {block.description}
//                           </p>
//                           <div>
//                             <span className="text-2xl font-bold text-gray-900">
//                               {block.statValue}
//                             </span>
//                             <span className="ml-1 text-xs text-gray-500">
//                               {block.statLabel}
//                             </span>
//                           </div>
//                         </div>
//                         <div
//                           {...provided.dragHandleProps}
//                           className="cursor-grab text-gray-400 hover:text-gray-600"
//                         >
//                           <GripVertical size={16} />
//                         </div>
//                       </div>

//                       {/* Bottom actions */}
//                       <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50">
//                         <button
//                           onClick={() => navigate(block.path)}
//                           className="text-sm text-purple-600 font-medium flex items-center gap-1 hover:bg-purple-50 px-3 py-1 rounded-md transition"
//                         >
//                           {block.action} <ArrowRightCircle size={18} />
//                         </button>
//                         <div className="flex items-center gap-3">
//                           <button
//                             onClick={() => togglePin(block.id)}
//                             title={pinned.includes(block.id) ? "Unpin" : "Pin"}
//                           >
//                             <Pin
//                               size={18}
//                               className={
//                                 pinned.includes(block.id)
//                                   ? "text-red-500"
//                                   : "text-gray-400 hover:text-red-500"
//                               }
//                             />
//                           </button>
//                           <button
//                             onClick={() => toggleArchive(block.id)}
//                             title="Archive"
//                           >
//                             <Archive
//                               size={18}
//                               className={
//                                 archived.includes(block.id)
//                                   ? "text-indigo-500"
//                                   : "text-gray-400 hover:text-indigo-500"
//                               }
//                             />
//                           </button>
//                         </div>
//                       </div>
//                     </div>
//                   )}
//                 </Draggable>
//               ))}
//               {provided.placeholder}
//             </div>
//           )}
//         </Droppable>
//       </DragDropContext>
//     </div>
//   );
// }

// import {
//   Archive,
//   Pin,
//   ArrowRightCircle,
//   MoreVertical,
//   UserCircle2,
//   Tags,
//   BellRing,
//   Clock4,
// } from "lucide-react";
// import { useNavigate } from "react-router-dom";
// import { useState } from "react";
// import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
// import { useAuth } from "../auth/context/AuthContext";

// const crmBlocks = [
//   {
//     id: "contacts",
//     label: "Contacts",
//     description: "Central place to manage leads, customers, and their details.",
//     path: "/app/crm/contacts",
//     icon: <UserCircle2 className="text-purple-600" size={26} />,
//     action: "Open Contacts",
//     statLabel: "Total Contacts",
//     statValue: 245,
//   },
//   {
//     id: "tags",
//     label: "Tags",
//     description: "Organize and filter contacts using color-coded tags.",
//     path: "/app/crm/tags",
//     icon: <Tags className="text-yellow-500" size={26} />,
//     action: "Manage Tags",
//     statLabel: "Total Tags",
//     statValue: 12,
//   },
//   {
//     id: "reminders",
//     label: "Reminders",
//     description: "Schedule follow-ups and set alerts to never miss a lead.",
//     path: "/app/crm/reminders",
//     icon: <BellRing className="text-blue-500" size={26} />,
//     action: "View Reminders",
//     statLabel: "Pending",
//     statValue: 3,
//   },
//   {
//     id: "timeline",
//     label: "Timeline",
//     description: "Track every interaction and touchpoint with each contact.",
//     path: "/app/crm/timeline",
//     icon: <Clock4 className="text-green-600" size={26} />,
//     action: "View Timeline",
//     statLabel: "Entries",
//     statValue: 150,
//     featureKey: "CRMInsights",
//   },
// ];

// export default function CrmWorkspacePage() {
//   const navigate = useNavigate();
//   const { availableFeatures = {}, isLoading, plan } = useAuth();

//   const [pinned, setPinned] = useState(
//     JSON.parse(localStorage.getItem("crm-pinned") || "[]")
//   );
//   const [archived, setArchived] = useState(
//     JSON.parse(localStorage.getItem("crm-archived") || "[]")
//   );
//   const [order, setOrder] = useState(
//     JSON.parse(localStorage.getItem("crm-order")) || crmBlocks.map(b => b.id)
//   );

//   const togglePin = id => {
//     const updated = pinned.includes(id)
//       ? pinned.filter(i => i !== id)
//       : [...pinned, id];
//     setPinned(updated);
//     localStorage.setItem("crm-pinned", JSON.stringify(updated));
//   };

//   const toggleArchive = id => {
//     const updated = archived.includes(id)
//       ? archived.filter(i => i !== id)
//       : [...archived, id];
//     setArchived(updated);
//     localStorage.setItem("crm-archived", JSON.stringify(updated));
//   };

//   const onDragEnd = result => {
//     if (!result.destination) return;
//     const newOrder = Array.from(order);
//     const [moved] = newOrder.splice(result.source.index, 1);
//     newOrder.splice(result.destination.index, 0, moved);
//     setOrder(newOrder);
//     localStorage.setItem("crm-order", JSON.stringify(newOrder));
//   };

//   const visibleBlocks = order
//     .filter(id => {
//       const block = crmBlocks.find(b => b.id === id);
//       if (!block || archived.includes(id)) return false;
//       if (block.featureKey && !availableFeatures[block.featureKey])
//         return false;
//       return true;
//     })
//     .map(id => crmBlocks.find(b => b.id === id));

//   if (isLoading) {
//     return (
//       <div className="p-10 text-center text-lg text-gray-500">
//         Loading features…
//       </div>
//     );
//   }

//   return (
//     <div className="p-6 space-y-6" data-test-id="crm-root">
//       {/* Header */}
//       <h2 className="text-3xl font-bold text-purple-800 mb-1">
//         🧠 CRM Workspace
//       </h2>
//       <p className="text-gray-600 mb-4">
//         Manage your contacts, organize them with tags, track interactions, and
//         stay on top of reminders.
//       </p>

//       {/* Plan alert */}
//       {plan === "basic" && (
//         <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 rounded-md shadow-sm">
//           You’re on the <strong>Basic</strong> plan. Upgrade to use CRM
//           timelines and get detailed history of contacts.
//           <button
//             onClick={() => navigate("/app/upgrade")}
//             className="ml-3 text-purple-700 underline hover:text-purple-900 font-medium"
//           >
//             Upgrade Now
//           </button>
//         </div>
//       )}

//       {/* Cards */}
//       <DragDropContext onDragEnd={onDragEnd}>
//         <Droppable droppableId="crm-blocks" direction="horizontal">
//           {provided => (
//             <div
//               className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 overflow-x-auto pb-2"
//               ref={provided.innerRef}
//               {...provided.droppableProps}
//             >
//               {visibleBlocks.map((block, index) => (
//                 <Draggable key={block.id} draggableId={block.id} index={index}>
//                   {provided => (
//                     <div
//                       ref={provided.innerRef}
//                       {...provided.draggableProps}
//                       {...provided.dragHandleProps}
//                       className={`rounded-xl border shadow-sm transition transform hover:-translate-y-1 hover:shadow-lg duration-200 overflow-hidden cursor-pointer ${
//                         pinned.includes(block.id)
//                           ? "border-purple-500"
//                           : "border-gray-200"
//                       } ${
//                         index % 2 === 0
//                           ? "bg-gradient-to-br from-purple-50 to-white"
//                           : "bg-white"
//                       }`}
//                     >
//                       {/* Top */}
//                       <div className="flex items-start gap-4 p-5">
//                         <div className="bg-gray-100 rounded-lg p-3">
//                           {block.icon}
//                         </div>
//                         <div className="flex-1">
//                           <h3 className="text-md font-semibold text-purple-700">
//                             {block.label}
//                           </h3>
//                           <p className="text-sm text-gray-600 mb-2">
//                             {block.description}
//                           </p>
//                           <div>
//                             <span className="text-xl font-bold text-gray-900">
//                               {block.statValue}
//                             </span>
//                             <span className="ml-1 text-xs text-gray-500">
//                               {block.statLabel}
//                             </span>
//                           </div>
//                         </div>
//                         <MoreVertical
//                           size={16}
//                           className="text-gray-400 hover:text-gray-600"
//                         />
//                       </div>

//                       {/* Bottom actions */}
//                       <div className="px-5 py-3 border-t border-gray-200 flex items-center justify-between">
//                         <button
//                           onClick={() => navigate(block.path)}
//                           className="text-sm text-purple-600 font-medium flex items-center gap-1 hover:text-purple-800"
//                         >
//                           {block.action} <ArrowRightCircle size={18} />
//                         </button>
//                         <div className="flex items-center gap-3">
//                           <button
//                             onClick={() => togglePin(block.id)}
//                             title={pinned.includes(block.id) ? "Unpin" : "Pin"}
//                           >
//                             <Pin
//                               size={18}
//                               className={
//                                 pinned.includes(block.id)
//                                   ? "text-red-600"
//                                   : "text-gray-400 hover:text-red-500"
//                               }
//                             />
//                           </button>
//                           <button
//                             onClick={() => toggleArchive(block.id)}
//                             title="Archive"
//                           >
//                             <Archive
//                               size={18}
//                               className={
//                                 archived.includes(block.id)
//                                   ? "text-indigo-600"
//                                   : "text-gray-400 hover:text-indigo-500"
//                               }
//                             />
//                           </button>
//                         </div>
//                       </div>
//                     </div>
//                   )}
//                 </Draggable>
//               ))}
//               {provided.placeholder}
//             </div>
//           )}
//         </Droppable>
//       </DragDropContext>
//     </div>
//   );
// }
// import React, { useState } from "react";
// import {
//   Archive,
//   Pin,
//   ArrowRightCircle,
//   MoreVertical,
//   UserCircle2,
//   Tags,
//   BellRing,
//   Clock4,
// } from "lucide-react";
// import { useNavigate } from "react-router-dom";
// import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
// import { motion } from "framer-motion";
// import { useAuth } from "../auth/context/AuthContext";

// // Hook for count-up animation
// function useCountUp(target, duration = 1000) {
//   const [count, setCount] = useState(0);

//   React.useEffect(() => {
//     let start = 0;
//     const increment = target / (duration / 16);
//     const timer = setInterval(() => {
//       start += increment;
//       if (start >= target) {
//         setCount(target);
//         clearInterval(timer);
//       } else {
//         setCount(Math.floor(start));
//       }
//     }, 16);
//     return () => clearInterval(timer);
//   }, [target, duration]);

//   return count;
// }

// const crmBlocks = [
//   {
//     id: "contacts",
//     label: "Contacts",
//     description: "Central place to manage leads, customers, and their details.",
//     path: "/app/crm/contacts",
//     icon: <UserCircle2 className="text-purple-400" size={22} />,
//     action: "Open Contacts",
//     statLabel: "Total Contacts",
//     statValue: 245,
//   },
//   {
//     id: "tags",
//     label: "Tags",
//     description: "Organize and filter contacts using color-coded tags.",
//     path: "/app/crm/tags",
//     icon: <Tags className="text-yellow-400" size={22} />,
//     action: "Manage Tags",
//     statLabel: "Total Tags",
//     statValue: 12,
//   },
//   {
//     id: "reminders",
//     label: "Reminders",
//     description: "Schedule follow-ups and set alerts to never miss a lead.",
//     path: "/app/crm/reminders",
//     icon: <BellRing className="text-blue-400" size={22} />,
//     action: "View Reminders",
//     statLabel: "Pending",
//     statValue: 3,
//   },
//   {
//     id: "timeline",
//     label: "Timeline",
//     description: "Track every interaction and touchpoint with each contact.",
//     path: "/app/crm/timeline",
//     icon: <Clock4 className="text-green-400" size={22} />,
//     action: "View Timeline",
//     statLabel: "Entries",
//     statValue: 150,
//     featureKey: "CRMInsights",
//   },
// ];

// // Separate Card Component
// function StatCard({
//   block,
//   index,
//   navigate,
//   pinned,
//   togglePin,
//   archived,
//   toggleArchive,
// }) {
//   const count = useCountUp(block.statValue, 1200);

//   return (
//     <motion.div
//       initial={{ opacity: 0, y: 15 }}
//       animate={{ opacity: 1, y: 0 }}
//       transition={{ delay: index * 0.1 }}
//       className="rounded-xl bg-gray-900 border border-gray-800 hover:border-green-400 shadow-md hover:shadow-lg transition duration-300 flex flex-col justify-between"
//     >
//       <div className="flex items-start gap-4 p-5">
//         <div className="bg-gray-800 rounded-md p-2">{block.icon}</div>
//         <div className="flex-1">
//           <h3 className="text-md font-semibold text-white">{block.label}</h3>
//           <p className="text-sm text-gray-400 mb-2">{block.description}</p>
//           <div className="text-xs font-medium text-gray-500">
//             {block.statLabel}: <span className="text-white">{count}</span>
//           </div>
//         </div>
//         <MoreVertical size={16} className="text-gray-500" />
//       </div>
//       <div className="px-5 py-3 border-t border-gray-800 flex items-center justify-between">
//         <button
//           onClick={() => navigate(block.path)}
//           className="text-sm text-green-400 font-medium flex items-center gap-1 hover:text-green-300"
//         >
//           {block.action} <ArrowRightCircle size={18} />
//         </button>
//         <div className="flex items-center gap-3">
//           <button onClick={() => togglePin(block.id)} title="Pin this">
//             <Pin
//               size={18}
//               className={
//                 pinned.includes(block.id)
//                   ? "text-red-500"
//                   : "text-gray-500 hover:text-red-400"
//               }
//             />
//           </button>
//           <button onClick={() => toggleArchive(block.id)} title="Archive this">
//             <Archive
//               size={18}
//               className={
//                 archived.includes(block.id)
//                   ? "text-indigo-400"
//                   : "text-gray-500 hover:text-indigo-300"
//               }
//             />
//           </button>
//         </div>
//       </div>
//     </motion.div>
//   );
// }

// export default function CrmWorkspacePage() {
//   const navigate = useNavigate();
//   const { availableFeatures = {}, isLoading, plan } = useAuth();

//   const [pinned, setPinned] = useState(
//     JSON.parse(localStorage.getItem("crm-pinned") || "[]")
//   );
//   const [archived, setArchived] = useState(
//     JSON.parse(localStorage.getItem("crm-archived") || "[]")
//   );
//   const [order, setOrder] = useState(
//     JSON.parse(localStorage.getItem("crm-order")) || crmBlocks.map(b => b.id)
//   );

//   const togglePin = id => {
//     const updated = pinned.includes(id)
//       ? pinned.filter(i => i !== id)
//       : [...pinned, id];
//     setPinned(updated);
//     localStorage.setItem("crm-pinned", JSON.stringify(updated));
//   };

//   const toggleArchive = id => {
//     const updated = archived.includes(id)
//       ? archived.filter(i => i !== id)
//       : [...archived, id];
//     setArchived(updated);
//     localStorage.setItem("crm-archived", JSON.stringify(updated));
//   };

//   const onDragEnd = result => {
//     if (!result.destination) return;
//     const newOrder = Array.from(order);
//     const [moved] = newOrder.splice(result.source.index, 1);
//     newOrder.splice(result.destination.index, 0, moved);
//     setOrder(newOrder);
//     localStorage.setItem("crm-order", JSON.stringify(newOrder));
//   };

//   const visibleBlocks = order
//     .filter(id => {
//       const block = crmBlocks.find(b => b.id === id);
//       if (!block || archived.includes(id)) return false;
//       if (block.featureKey && !availableFeatures[block.featureKey])
//         return false;
//       return true;
//     })
//     .map(id => crmBlocks.find(b => b.id === id));

//   if (isLoading) {
//     return (
//       <div className="p-10 text-center text-lg text-gray-400">
//         Loading features…
//       </div>
//     );
//   }

//   return (
//     <div className="p-6 space-y-6 bg-gray-950 min-h-full">
//       <h2 className="text-3xl font-bold text-green-400">🧠 CRM Workspace</h2>
//       <p className="text-gray-400">
//         Manage your contacts, organize them with tags, track interactions, and
//         stay on top of reminders.
//       </p>

//       {plan === "basic" && (
//         <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 rounded-md shadow-sm">
//           You’re on the <strong>Basic</strong> plan. Upgrade to use CRM
//           timelines and get detailed history of contacts.
//           <button
//             onClick={() => navigate("/app/upgrade")}
//             className="ml-3 text-green-600 underline hover:text-green-800 font-medium"
//           >
//             Upgrade Now
//           </button>
//         </div>
//       )}

//       <DragDropContext onDragEnd={onDragEnd}>
//         <Droppable droppableId="crm-blocks" direction="horizontal">
//           {provided => (
//             <div
//               className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
//               ref={provided.innerRef}
//               {...provided.droppableProps}
//             >
//               {visibleBlocks.map((block, index) => (
//                 <Draggable key={block.id} draggableId={block.id} index={index}>
//                   {provided => (
//                     <div
//                       ref={provided.innerRef}
//                       {...provided.draggableProps}
//                       {...provided.dragHandleProps}
//                     >
//                       <StatCard
//                         block={block}
//                         index={index}
//                         navigate={navigate}
//                         pinned={pinned}
//                         togglePin={togglePin}
//                         archived={archived}
//                         toggleArchive={toggleArchive}
//                       />
//                     </div>
//                   )}
//                 </Draggable>
//               ))}
//               {provided.placeholder}
//             </div>
//           )}
//         </Droppable>
//       </DragDropContext>
//     </div>
//   );
// }

// 📄 src/pages/Workspaces/CrmWorkspacePage.jsx

// below code is dark withour border effect
// import {
//   Archive,
//   Pin,
//   ArrowRightCircle,
//   MoreVertical,
//   UserCircle2,
//   Tags,
//   BellRing,
//   Clock4,
// } from "lucide-react";
// import { useNavigate } from "react-router-dom";
// import { useState } from "react";
// import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
// import { useAuth } from "../auth/context/AuthContext";

// const crmBlocks = [
//   {
//     id: "contacts",
//     label: "Contacts",
//     description: "Central place to manage leads, customers, and their details.",
//     path: "/app/crm/contacts",
//     icon: <UserCircle2 className="text-purple-400" size={28} />,
//     action: "Open Contacts",
//   },
//   {
//     id: "tags",
//     label: "Tags",
//     description: "Organize and filter contacts using color-coded tags.",
//     path: "/app/crm/tags",
//     icon: <Tags className="text-yellow-400" size={28} />,
//     action: "Manage Tags",
//   },
//   {
//     id: "reminders",
//     label: "Reminders",
//     description: "Schedule follow-ups and set alerts to never miss a lead.",
//     path: "/app/crm/reminders",
//     icon: <BellRing className="text-blue-400" size={28} />,
//     action: "View Reminders",
//   },
//   {
//     id: "timeline",
//     label: "Timeline",
//     description: "Track every interaction and touchpoint with each contact.",
//     path: "/app/crm/timeline",
//     icon: <Clock4 className="text-green-400" size={28} />,
//     action: "View Timeline",
//     featureKey: "CRMInsights",
//   },
// ];

// export default function CrmWorkspacePage() {
//   const navigate = useNavigate();
//   const { availableFeatures = {}, isLoading, plan } = useAuth();

//   const [pinned, setPinned] = useState(
//     JSON.parse(localStorage.getItem("crm-pinned") || "[]")
//   );
//   const [archived, setArchived] = useState(
//     JSON.parse(localStorage.getItem("crm-archived") || "[]")
//   );
//   const [order, setOrder] = useState(
//     JSON.parse(localStorage.getItem("crm-order")) || crmBlocks.map(b => b.id)
//   );

//   const togglePin = id => {
//     const updated = pinned.includes(id)
//       ? pinned.filter(i => i !== id)
//       : [...pinned, id];
//     setPinned(updated);
//     localStorage.setItem("crm-pinned", JSON.stringify(updated));
//   };

//   const toggleArchive = id => {
//     const updated = archived.includes(id)
//       ? archived.filter(i => i !== id)
//       : [...archived, id];
//     setArchived(updated);
//     localStorage.setItem("crm-archived", JSON.stringify(updated));
//   };

//   const onDragEnd = result => {
//     if (!result.destination) return;
//     const newOrder = Array.from(order);
//     const [moved] = newOrder.splice(result.source.index, 1);
//     newOrder.splice(result.destination.index, 0, moved);
//     setOrder(newOrder);
//     localStorage.setItem("crm-order", JSON.stringify(newOrder));
//   };

//   const visibleBlocks = order
//     .filter(id => {
//       const block = crmBlocks.find(b => b.id === id);
//       if (!block || archived.includes(id)) return false;
//       if (block.featureKey && !availableFeatures[block.featureKey])
//         return false;
//       return true;
//     })
//     .map(id => crmBlocks.find(b => b.id === id));

//   if (isLoading) {
//     return (
//       <div className="p-10 text-center text-lg text-gray-400">
//         Loading workspace…
//       </div>
//     );
//   }

//   return (
//     <div className="p-6 space-y-6">
//       <div>
//         <h2 className="text-2xl font-bold text-white mb-1">🧠 CRM Workspace</h2>
//         <p className="text-gray-400">
//           Quick access to manage contacts, tags, reminders, and timelines.
//         </p>
//       </div>

//       {plan === "basic" && (
//         <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 rounded-md shadow-sm">
//           You’re on the <strong>Basic</strong> plan. Upgrade to use CRM
//           timelines and get detailed history of contacts.
//           <button
//             onClick={() => navigate("/app/upgrade")}
//             className="ml-3 text-purple-700 underline hover:text-purple-900 font-medium"
//           >
//             Upgrade Now
//           </button>
//         </div>
//       )}

//       <DragDropContext onDragEnd={onDragEnd}>
//         <Droppable droppableId="crm-blocks" direction="horizontal">
//           {provided => (
//             <div
//               className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
//               ref={provided.innerRef}
//               {...provided.droppableProps}
//             >
//               {visibleBlocks.map((block, index) => (
//                 <Draggable key={block.id} draggableId={block.id} index={index}>
//                   {provided => (
//                     <div
//                       ref={provided.innerRef}
//                       {...provided.draggableProps}
//                       {...provided.dragHandleProps}
//                       className="bg-[#1e293b] rounded-xl p-5 flex flex-col justify-between shadow-md hover:shadow-lg hover:-translate-y-0.5 transition transform duration-200"
//                     >
//                       <div className="flex items-start justify-between">
//                         <div className="bg-gray-800 p-3 rounded-lg">
//                           {block.icon}
//                         </div>
//                         <MoreVertical size={16} className="text-gray-500" />
//                       </div>
//                       <div className="mt-4 flex-1">
//                         <h3 className="text-lg font-semibold text-white">
//                           {block.label}
//                         </h3>
//                         <p className="text-gray-400 text-sm mt-1">
//                           {block.description}
//                         </p>
//                       </div>
//                       <div className="mt-5 flex items-center justify-between">
//                         <button
//                           onClick={() => navigate(block.path)}
//                           className="text-sm text-green-400 font-medium flex items-center gap-1 hover:text-green-300"
//                         >
//                           {block.action} <ArrowRightCircle size={18} />
//                         </button>
//                         <div className="flex items-center gap-3">
//                           <button onClick={() => togglePin(block.id)}>
//                             <Pin
//                               size={18}
//                               className={
//                                 pinned.includes(block.id)
//                                   ? "text-red-400"
//                                   : "text-gray-500 hover:text-red-400"
//                               }
//                             />
//                           </button>
//                           <button onClick={() => toggleArchive(block.id)}>
//                             <Archive
//                               size={18}
//                               className={
//                                 archived.includes(block.id)
//                                   ? "text-indigo-400"
//                                   : "text-gray-500 hover:text-indigo-400"
//                               }
//                             />
//                           </button>
//                         </div>
//                       </div>
//                     </div>
//                   )}
//                 </Draggable>
//               ))}
//               {provided.placeholder}
//             </div>
//           )}
//         </Droppable>
//       </DragDropContext>
//     </div>
//   );
// }

// import {
//   Archive,
//   Pin,
//   ArrowRightCircle,
//   MoreVertical,
//   TrendingUp,
//   TrendingDown,
//   UserCircle2,
//   Tags,
//   BellRing,
//   Clock4,
// } from "lucide-react";
// import { useNavigate } from "react-router-dom";
// import { useState } from "react";
// import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
// import { useAuth } from "../auth/context/AuthContext";

// const crmBlocks = [
//   {
//     id: "contacts",
//     label: "Contacts",
//     description: "Central place to manage leads, customers, and their details.",
//     path: "/app/crm/contacts",
//     icon: <UserCircle2 className="text-emerald-400" size={28} />,
//     action: "Open Contacts",
//     statLabel: "Total Contacts",
//     statValue: 245,
//     trend: { type: "up", value: "+12 this week" },
//   },
//   {
//     id: "tags",
//     label: "Tags",
//     description: "Organize and filter contacts using color-coded tags.",
//     path: "/app/crm/tags",
//     icon: <Tags className="text-yellow-400" size={28} />,
//     action: "Manage Tags",
//     statLabel: "Total Tags",
//     statValue: 12,
//     trend: { type: "up", value: "+3" },
//   },
//   {
//     id: "reminders",
//     label: "Reminders",
//     description: "Schedule follow-ups and set alerts to never miss a lead.",
//     path: "/app/crm/reminders",
//     icon: <BellRing className="text-blue-400" size={28} />,
//     action: "View Reminders",
//     statLabel: "Pending",
//     statValue: 3,
//     trend: { type: "down", value: "-1 overdue" },
//   },
//   {
//     id: "timeline",
//     label: "Timeline",
//     description: "Track every interaction and touchpoint with each contact.",
//     path: "/app/crm/timeline",
//     icon: <Clock4 className="text-purple-400" size={28} />,
//     action: "View Timeline",
//     statLabel: "Entries",
//     statValue: 150,
//     trend: { type: "up", value: "+20" },
//     featureKey: "CRMInsights",
//   },
// ];

// export default function CrmWorkspacePage() {
//   const navigate = useNavigate();
//   const { availableFeatures = {}, isLoading, plan } = useAuth();

//   const [pinned, setPinned] = useState(
//     JSON.parse(localStorage.getItem("crm-pinned") || "[]")
//   );
//   const [archived, setArchived] = useState(
//     JSON.parse(localStorage.getItem("crm-archived") || "[]")
//   );
//   const [order, setOrder] = useState(
//     JSON.parse(localStorage.getItem("crm-order")) || crmBlocks.map(b => b.id)
//   );

//   const togglePin = id => {
//     const updated = pinned.includes(id)
//       ? pinned.filter(i => i !== id)
//       : [...pinned, id];
//     setPinned(updated);
//     localStorage.setItem("crm-pinned", JSON.stringify(updated));
//   };

//   const toggleArchive = id => {
//     const updated = archived.includes(id)
//       ? archived.filter(i => i !== id)
//       : [...archived, id];
//     setArchived(updated);
//     localStorage.setItem("crm-archived", JSON.stringify(updated));
//   };

//   const onDragEnd = result => {
//     if (!result.destination) return;
//     const newOrder = Array.from(order);
//     const [moved] = newOrder.splice(result.source.index, 1);
//     newOrder.splice(result.destination.index, 0, moved);
//     setOrder(newOrder);
//     localStorage.setItem("crm-order", JSON.stringify(newOrder));
//   };

//   const visibleBlocks = order
//     .filter(id => {
//       const block = crmBlocks.find(b => b.id === id);
//       if (!block || archived.includes(id)) return false;
//       if (block.featureKey && !availableFeatures[block.featureKey])
//         return false;
//       return true;
//     })
//     .map(id => crmBlocks.find(b => b.id === id));

//   const pinnedBlocks = visibleBlocks.filter(b => pinned.includes(b.id));
//   const mainBlocks = visibleBlocks.filter(b => !pinned.includes(b.id));

//   if (isLoading) {
//     return (
//       <div className="p-10 text-center text-lg text-gray-400">
//         Loading features…
//       </div>
//     );
//   }

//   return (
//     <div
//       className="p-6 space-y-6 bg-[#0f172a] min-h-screen text-white"
//       data-test-id="crm-root"
//     >
//       {/* Header */}
//       <h2 className="text-3xl font-bold mb-1">
//         🧠 <span className="text-white">CRM</span>{" "}
//         <span className="text-emerald-400">Workspace</span>
//       </h2>
//       <p className="text-gray-400 mb-4">
//         Manage your contacts, organize them with tags, track interactions, and
//         stay on top of reminders.
//       </p>

//       {/* Plan alert */}
//       {plan === "basic" && (
//         <div className="bg-yellow-900/30 border-l-4 border-yellow-500 text-yellow-300 p-4 rounded-md shadow-sm">
//           You’re on the <strong>Basic</strong> plan. Upgrade to use CRM
//           timelines and get detailed history of contacts.
//           <button
//             onClick={() => navigate("/app/upgrade")}
//             className="ml-3 text-emerald-400 underline hover:text-emerald-300 font-medium"
//           >
//             Upgrade Now
//           </button>
//         </div>
//       )}

//       {/* Pinned Favorites */}
//       {pinnedBlocks.length > 0 && (
//         <div>
//           <h3 className="text-lg font-semibold text-gray-300 mb-2">
//             ⭐ Favorites
//           </h3>
//           <div className="flex gap-4 overflow-x-auto pb-2">
//             {pinnedBlocks.map(block => (
//               <Card
//                 key={block.id}
//                 block={block}
//                 pinned
//                 togglePin={togglePin}
//                 toggleArchive={toggleArchive}
//                 navigate={navigate}
//               />
//             ))}
//           </div>
//         </div>
//       )}

//       {/* Main Cards */}
//       <DragDropContext onDragEnd={onDragEnd}>
//         <Droppable droppableId="crm-blocks" direction="horizontal">
//           {provided => (
//             <div
//               className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
//               ref={provided.innerRef}
//               {...provided.droppableProps}
//             >
//               {mainBlocks.map((block, index) => (
//                 <Draggable key={block.id} draggableId={block.id} index={index}>
//                   {provided => (
//                     <div
//                       ref={provided.innerRef}
//                       {...provided.draggableProps}
//                       {...provided.dragHandleProps}
//                     >
//                       <Card
//                         block={block}
//                         pinned={false}
//                         togglePin={togglePin}
//                         toggleArchive={toggleArchive}
//                         navigate={navigate}
//                       />
//                     </div>
//                   )}
//                 </Draggable>
//               ))}
//               {provided.placeholder}
//             </div>
//           )}
//         </Droppable>
//       </DragDropContext>
//     </div>
//   );
// }

// /* Card Component */
// function Card({ block, pinned, togglePin, toggleArchive, navigate }) {
//   return (
//     <div className="rounded-xl border border-gray-700 bg-[#1e293b] shadow-md transition transform hover:-translate-y-1 hover:shadow-lg hover:border-emerald-400/50 duration-200 overflow-hidden">
//       {/* Top */}
//       <div className="flex items-start gap-4 p-5">
//         <div className="rounded-full p-3 bg-[#0f172a] border border-gray-600">
//           {block.icon}
//         </div>
//         <div className="flex-1">
//           <h3 className="text-md font-semibold text-white">{block.label}</h3>
//           <p className="text-sm text-gray-400 mb-1">{block.description}</p>

//           {/* Stat + Trend */}
//           {block.statValue > 0 ? (
//             <div className="flex items-center gap-2">
//               <span className="text-xl font-bold text-white">
//                 {block.statValue}
//               </span>
//               <span className="text-xs text-gray-400">{block.statLabel}</span>
//               {block.trend && (
//                 <span
//                   className={`flex items-center text-xs font-medium ${
//                     block.trend.type === "up"
//                       ? "text-emerald-400"
//                       : "text-red-400"
//                   }`}
//                 >
//                   {block.trend.type === "up" ? (
//                     <TrendingUp size={14} />
//                   ) : (
//                     <TrendingDown size={14} />
//                   )}
//                   {block.trend.value}
//                 </span>
//               )}
//             </div>
//           ) : (
//             <span className="text-xs text-gray-500 italic">
//               No data yet — get started!
//             </span>
//           )}
//         </div>
//         <MoreVertical size={16} className="text-gray-500 hover:text-gray-300" />
//       </div>

//       {/* Bottom actions */}
//       <div className="px-5 py-3 border-t border-gray-700 flex items-center justify-between">
//         <button
//           onClick={() => navigate(block.path)}
//           className="text-sm text-emerald-400 font-medium flex items-center gap-1 hover:text-emerald-300"
//         >
//           {block.action} <ArrowRightCircle size={18} />
//         </button>
//         <div className="flex items-center gap-3">
//           <button
//             onClick={() => togglePin(block.id)}
//             title={pinned ? "Unpin" : "Pin"}
//           >
//             <Pin
//               size={18}
//               className={
//                 pinned ? "text-red-400" : "text-gray-500 hover:text-red-300"
//               }
//             />
//           </button>
//           <button onClick={() => toggleArchive(block.id)} title="Archive">
//             <Archive
//               size={18}
//               className="text-gray-500 hover:text-emerald-300"
//             />
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// import {
//   Archive,
//   Pin,
//   ArrowRightCircle,
//   MoreVertical,
//   UserCircle2,
//   Tags,
//   BellRing,
//   Clock4,
// } from "lucide-react";
// import { useNavigate } from "react-router-dom";
// import { useState } from "react";
// import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
// import { useAuth } from "../auth/context/AuthContext";

// const crmBlocks = [
//   {
//     id: "contacts",
//     label: "Contacts",
//     description: "Central place to manage leads, customers, and their details.",
//     path: "/app/crm/contacts",
//     icon: <UserCircle2 className="text-purple-600" size={22} />,
//     action: "Open Contacts",
//     statLabel: "Total Contacts",
//     statValue: 245, // placeholder
//   },
//   {
//     id: "tags",
//     label: "Tags",
//     description: "Organize and filter contacts using color-coded tags.",
//     path: "/app/crm/tags",
//     icon: <Tags className="text-yellow-500" size={22} />,
//     action: "Manage Tags",
//     statLabel: "Total Tags",
//     statValue: 12, // placeholder
//   },
//   {
//     id: "reminders",
//     label: "Reminders",
//     description: "Schedule follow-ups and set alerts to never miss a lead.",
//     path: "/app/crm/reminders",
//     icon: <BellRing className="text-blue-500" size={22} />,
//     action: "View Reminders",
//     statLabel: "Pending",
//     statValue: 3, // placeholder
//   },
//   {
//     id: "timeline",
//     label: "Timeline",
//     description: "Track every interaction and touchpoint with each contact.",
//     path: "/app/crm/timeline",
//     icon: <Clock4 className="text-green-600" size={22} />,
//     action: "View Timeline",
//     statLabel: "Entries",
//     statValue: 150, // placeholder
//     featureKey: "CRMInsights",
//   },
// ];

// export default function CrmWorkspacePage() {
//   const navigate = useNavigate();
//   const { availableFeatures = {}, isLoading, plan } = useAuth();

//   const [pinned, setPinned] = useState(
//     JSON.parse(localStorage.getItem("crm-pinned") || "[]")
//   );
//   const [archived, setArchived] = useState(
//     JSON.parse(localStorage.getItem("crm-archived") || "[]")
//   );
//   const [order, setOrder] = useState(
//     JSON.parse(localStorage.getItem("crm-order")) || crmBlocks.map(b => b.id)
//   );

//   const togglePin = id => {
//     const updated = pinned.includes(id)
//       ? pinned.filter(i => i !== id)
//       : [...pinned, id];
//     setPinned(updated);
//     localStorage.setItem("crm-pinned", JSON.stringify(updated));
//   };

//   const toggleArchive = id => {
//     const updated = archived.includes(id)
//       ? archived.filter(i => i !== id)
//       : [...archived, id];
//     setArchived(updated);
//     localStorage.setItem("crm-archived", JSON.stringify(updated));
//   };

//   const onDragEnd = result => {
//     if (!result.destination) return;
//     const newOrder = Array.from(order);
//     const [moved] = newOrder.splice(result.source.index, 1);
//     newOrder.splice(result.destination.index, 0, moved);
//     setOrder(newOrder);
//     localStorage.setItem("crm-order", JSON.stringify(newOrder));
//   };

//   const visibleBlocks = order
//     .filter(id => {
//       const block = crmBlocks.find(b => b.id === id);
//       if (!block || archived.includes(id)) return false;
//       if (block.featureKey && !availableFeatures[block.featureKey])
//         return false;
//       return true;
//     })
//     .map(id => crmBlocks.find(b => b.id === id));

//   if (isLoading) {
//     return (
//       <div className="p-10 text-center text-lg text-gray-500">
//         Loading features…
//       </div>
//     );
//   }

//   return (
//     <div className="p-6 space-y-6" data-test-id="crm-root">
//       <h2 className="text-3xl font-bold text-purple-800 mb-2">
//         🧠 CRM Workspace
//       </h2>
//       <p className="text-gray-600 mb-6">
//         Manage your contacts, organize them with tags, track interactions, and
//         stay on top of reminders.
//       </p>

//       {plan === "basic" && (
//         <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 rounded-md shadow-sm">
//           You’re on the <strong>Basic</strong> plan. Upgrade to use CRM
//           timelines and get detailed history of contacts.
//           <button
//             onClick={() => navigate("/app/upgrade")}
//             className="ml-3 text-purple-700 underline hover:text-purple-900 font-medium"
//           >
//             Upgrade Now
//           </button>
//         </div>
//       )}

//       <DragDropContext onDragEnd={onDragEnd}>
//         <Droppable droppableId="crm-blocks" direction="horizontal">
//           {provided => (
//             <div
//               className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
//               ref={provided.innerRef}
//               {...provided.droppableProps}
//             >
//               {visibleBlocks.map((block, index) => (
//                 <Draggable key={block.id} draggableId={block.id} index={index}>
//                   {provided => (
//                     <div
//                       ref={provided.innerRef}
//                       {...provided.draggableProps}
//                       {...provided.dragHandleProps}
//                       className={`rounded-xl border shadow-sm hover:shadow-md transition transform hover:-translate-y-0.5 duration-200 overflow-hidden ${
//                         index === 0
//                           ? "bg-gradient-to-br from-purple-50 to-white"
//                           : "bg-white"
//                       }`}
//                     >
//                       <div className="flex items-start gap-4 p-5">
//                         <div className="bg-gray-100 rounded-md p-2">
//                           {block.icon}
//                         </div>
//                         <div className="flex-1">
//                           <h3 className="text-md font-semibold text-purple-700">
//                             {block.label}
//                           </h3>
//                           <p className="text-sm text-gray-600 mb-2">
//                             {block.description}
//                           </p>
//                           <div className="text-xs font-medium text-gray-500">
//                             {block.statLabel}:{" "}
//                             <span className="text-gray-900">
//                               {block.statValue}
//                             </span>
//                           </div>
//                         </div>
//                         <MoreVertical size={16} className="text-gray-400" />
//                       </div>
//                       <div className="px-5 py-3 border-t border-gray-200 flex items-center justify-between">
//                         <button
//                           onClick={() => navigate(block.path)}
//                           className="text-sm text-purple-600 font-medium flex items-center gap-1 hover:text-purple-800"
//                         >
//                           {block.action} <ArrowRightCircle size={18} />
//                         </button>
//                         <div className="flex items-center gap-3">
//                           <button
//                             onClick={() => togglePin(block.id)}
//                             title="Pin this"
//                           >
//                             <Pin
//                               size={18}
//                               className={
//                                 pinned.includes(block.id)
//                                   ? "text-red-600"
//                                   : "text-gray-400 hover:text-red-500"
//                               }
//                             />
//                           </button>
//                           <button
//                             onClick={() => toggleArchive(block.id)}
//                             title="Archive this"
//                           >
//                             <Archive
//                               size={18}
//                               className={
//                                 archived.includes(block.id)
//                                   ? "text-indigo-600"
//                                   : "text-gray-400 hover:text-indigo-500"
//                               }
//                             />
//                           </button>
//                         </div>
//                       </div>
//                     </div>
//                   )}
//                 </Draggable>
//               ))}
//               {provided.placeholder}
//             </div>
//           )}
//         </Droppable>
//       </DragDropContext>
//     </div>
//   );
// }

// 📄 src/pages/Workspaces/CrmWorkspacePage.jsx
// import {
//   Archive,
//   Pin,
//   ArrowRightCircle,
//   MoreVertical,
//   UserCircle2,
//   Tags,
//   BellRing,
//   Clock4,
// } from "lucide-react";
// import { useNavigate } from "react-router-dom";
// import { useState } from "react";
// import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
// import { useAuth } from "../auth/context/AuthContext";

// const crmBlocks = [
//   {
//     id: "contacts",
//     label: "Contacts",
//     description: "Central place to manage leads, customers, and their details.",
//     path: "/app/crm/contacts",
//     icon: <UserCircle2 className="text-purple-600" size={22} />,
//     action: "Open Contacts",
//   },
//   {
//     id: "tags",
//     label: "Tags",
//     description: "Organize and filter contacts using color-coded tags.",
//     path: "/app/crm/tags",
//     icon: <Tags className="text-yellow-500" size={22} />,
//     action: "Manage Tags",
//   },
//   {
//     id: "reminders",
//     label: "Reminders",
//     description: "Schedule follow-ups and set alerts to never miss a lead.",
//     path: "/app/crm/reminders",
//     icon: <BellRing className="text-blue-500" size={22} />,
//     action: "View Reminders",
//   },
//   {
//     id: "timeline",
//     label: "Timeline",
//     description: "Track every interaction and touchpoint with each contact.",
//     path: "/app/crm/timeline",
//     icon: <Clock4 className="text-green-600" size={22} />,
//     action: "View Timeline",
//     featureKey: "CRMInsights", // This must match backend
//   },
// ];

// export default function CrmWorkspacePage() {
//   const navigate = useNavigate();
//   const { availableFeatures = {}, isLoading, plan } = useAuth();

//   const [pinned, setPinned] = useState(() =>
//     JSON.parse(localStorage.getItem("crm-pinned") || "[]")
//   );
//   const [archived, setArchived] = useState(() =>
//     JSON.parse(localStorage.getItem("crm-archived") || "[]")
//   );
//   const [order, setOrder] = useState(
//     () =>
//       JSON.parse(localStorage.getItem("crm-order")) || crmBlocks.map(b => b.id)
//   );

//   const togglePin = id => {
//     const updated = pinned.includes(id)
//       ? pinned.filter(i => i !== id)
//       : [...pinned, id];
//     setPinned(updated);
//     localStorage.setItem("crm-pinned", JSON.stringify(updated));
//   };

//   const toggleArchive = id => {
//     const updated = archived.includes(id)
//       ? archived.filter(i => i !== id)
//       : [...archived, id];
//     setArchived(updated);
//     localStorage.setItem("crm-archived", JSON.stringify(updated));
//   };

//   const onDragEnd = result => {
//     if (!result.destination) return;
//     const newOrder = Array.from(order);
//     const [moved] = newOrder.splice(result.source.index, 1);
//     newOrder.splice(result.destination.index, 0, moved);
//     setOrder(newOrder);
//     localStorage.setItem("crm-order", JSON.stringify(newOrder));
//   };

//   // 🚩 Use featureKey to gate feature blocks
//   const visibleBlocks = order
//     .filter(id => {
//       const block = crmBlocks.find(b => b.id === id);
//       if (!block || archived.includes(id)) return false;
//       if (block.featureKey && !availableFeatures[block.featureKey])
//         return false;
//       return true;
//     })
//     .map(id => crmBlocks.find(b => b.id === id));

//   if (isLoading)
//     return (
//       <div className="p-10 text-center text-lg text-gray-500">
//         Loading features…
//       </div>
//     );

//   return (
//     <div className="p-6" data-test-id="crm-root">
//       <h2 className="text-2xl font-bold text-purple-800 mb-4">
//         🧠 CRM Workspace
//       </h2>

//       {plan === "basic" && (
//         <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 mb-6 rounded-md shadow-sm">
//           You’re on the <strong>Basic</strong> plan. Upgrade to use CRM
//           timelines and get detailed history of contacts.{" "}
//           <button
//             onClick={() => navigate("/app/upgrade")}
//             className="ml-3 text-purple-700 underline hover:text-purple-900 font-medium"
//           >
//             Upgrade Now
//           </button>
//         </div>
//       )}

//       <DragDropContext onDragEnd={onDragEnd}>
//         <Droppable droppableId="crm-blocks" direction="horizontal">
//           {provided => (
//             <div
//               className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6"
//               ref={provided.innerRef}
//               {...provided.droppableProps}
//             >
//               {visibleBlocks.map((block, index) => (
//                 <Draggable key={block.id} draggableId={block.id} index={index}>
//                   {provided => (
//                     <div
//                       ref={provided.innerRef}
//                       {...provided.draggableProps}
//                       {...provided.dragHandleProps}
//                       className="bg-white rounded-md border shadow-sm hover:shadow-md transition transform hover:-translate-y-0.5 duration-200"
//                     >
//                       <div className="flex items-start gap-4 p-5">
//                         <div className="bg-gray-100 rounded-md p-2">
//                           {block.icon}
//                         </div>
//                         <div className="flex-1">
//                           <h3 className="text-md font-semibold text-purple-700">
//                             {block.label}
//                           </h3>
//                           <p className="text-sm text-gray-600">
//                             {block.description}
//                           </p>
//                         </div>
//                         <MoreVertical size={16} className="text-gray-400" />
//                       </div>
//                       <div className="px-5 py-3 border-t border-gray-200 flex items-center justify-between">
//                         <button
//                           onClick={() => navigate(block.path)}
//                           className="text-sm text-purple-600 font-medium flex items-center gap-1 hover:text-purple-800"
//                         >
//                           {block.action} <ArrowRightCircle size={18} />
//                         </button>
//                         <div className="flex items-center gap-3">
//                           <button
//                             onClick={() => togglePin(block.id)}
//                             title="Pin this"
//                           >
//                             <Pin
//                               size={18}
//                               className={
//                                 pinned.includes(block.id)
//                                   ? "text-red-600"
//                                   : "text-gray-400 hover:text-red-500"
//                               }
//                             />
//                           </button>
//                           <button
//                             onClick={() => toggleArchive(block.id)}
//                             title="Archive this"
//                           >
//                             <Archive
//                               size={18}
//                               className={
//                                 archived.includes(block.id)
//                                   ? "text-indigo-600"
//                                   : "text-gray-400 hover:text-indigo-500"
//                               }
//                             />
//                           </button>
//                         </div>
//                       </div>
//                     </div>
//                   )}
//                 </Draggable>
//               ))}
//               {provided.placeholder}
//             </div>
//           )}
//         </Droppable>
//       </DragDropContext>
//     </div>
//   );
// }

// // 📄 src/pages/Workspaces/CrmWorkspacePage.jsx

// import {
//   Archive,
//   Pin,
//   ArrowRightCircle,
//   MoreVertical,
//   UserCircle2,
//   Tags,
//   BellRing,
//   Clock4,
// } from "lucide-react";
// import { useNavigate } from "react-router-dom";
// import { useState } from "react";
// import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
// import { useAuth } from "../auth/context/AuthContext";

// const crmBlocks = [
//   {
//     id: "contacts",
//     label: "Contacts",
//     description: "Central place to manage leads, customers, and their details.",
//     path: "/app/crm/contacts",
//     icon: <UserCircle2 className="text-purple-600" size={22} />,
//     action: "Open Contacts",
//   },
//   {
//     id: "tags",
//     label: "Tags",
//     description: "Organize and filter contacts using color-coded tags.",
//     path: "/app/crm/tags",
//     icon: <Tags className="text-yellow-500" size={22} />,
//     action: "Manage Tags",
//   },
//   {
//     id: "reminders",
//     label: "Reminders",
//     description: "Schedule follow-ups and set alerts to never miss a lead.",
//     path: "/app/crm/reminders",
//     icon: <BellRing className="text-blue-500" size={22} />,
//     action: "View Reminders",
//   },
//   {
//     id: "timeline",
//     label: "Timeline",
//     description: "Track every interaction and touchpoint with each contact.",
//     path: "/app/crm/timeline",
//     icon: <Clock4 className="text-green-600" size={22} />,
//     action: "View Timeline",
//     featureKey: "CRMInsights", // This must match backend
//   },
// ];

// export default function CrmWorkspacePage() {
//   const navigate = useNavigate();
//   const { availableFeatures = {}, isLoading, plan } = useAuth();

//   const [pinned, setPinned] = useState(() =>
//     JSON.parse(localStorage.getItem("crm-pinned") || "[]")
//   );
//   const [archived, setArchived] = useState(() =>
//     JSON.parse(localStorage.getItem("crm-archived") || "[]")
//   );
//   const [order, setOrder] = useState(
//     () =>
//       JSON.parse(localStorage.getItem("crm-order")) || crmBlocks.map(b => b.id)
//   );

//   const togglePin = id => {
//     const updated = pinned.includes(id)
//       ? pinned.filter(i => i !== id)
//       : [...pinned, id];
//     setPinned(updated);
//     localStorage.setItem("crm-pinned", JSON.stringify(updated));
//   };

//   const toggleArchive = id => {
//     const updated = archived.includes(id)
//       ? archived.filter(i => i !== id)
//       : [...archived, id];
//     setArchived(updated);
//     localStorage.setItem("crm-archived", JSON.stringify(updated));
//   };

//   const onDragEnd = result => {
//     if (!result.destination) return;
//     const newOrder = Array.from(order);
//     const [moved] = newOrder.splice(result.source.index, 1);
//     newOrder.splice(result.destination.index, 0, moved);
//     setOrder(newOrder);
//     localStorage.setItem("crm-order", JSON.stringify(newOrder));
//   };

//   // 🚩 Use featureKey to gate feature blocks
//   const visibleBlocks = order
//     .filter(id => {
//       const block = crmBlocks.find(b => b.id === id);
//       if (!block || archived.includes(id)) return false;
//       if (block.featureKey && !availableFeatures[block.featureKey])
//         return false;
//       return true;
//     })
//     .map(id => crmBlocks.find(b => b.id === id));

//   if (isLoading)
//     return (
//       <div className="p-10 text-center text-lg text-gray-500">
//         Loading features…
//       </div>
//     );

//   return (
//     <div className="p-6">
//       <h2 className="text-2xl font-bold text-purple-800 mb-4">
//         🧠 CRM Workspace
//       </h2>

//       {plan === "basic" && (
//         <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 mb-6 rounded-md shadow-sm">
//           You’re on the <strong>Basic</strong> plan. Upgrade to use CRM
//           timelines and get detailed history of contacts.{" "}
//           <button
//             onClick={() => navigate("/app/upgrade")}
//             className="ml-3 text-purple-700 underline hover:text-purple-900 font-medium"
//           >
//             Upgrade Now
//           </button>
//         </div>
//       )}

//       <DragDropContext onDragEnd={onDragEnd}>
//         <Droppable droppableId="crm-blocks" direction="horizontal">
//           {provided => (
//             <div
//               className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6"
//               ref={provided.innerRef}
//               {...provided.droppableProps}
//             >
//               {visibleBlocks.map((block, index) => (
//                 <Draggable key={block.id} draggableId={block.id} index={index}>
//                   {provided => (
//                     <div
//                       ref={provided.innerRef}
//                       {...provided.draggableProps}
//                       {...provided.dragHandleProps}
//                       className="bg-white rounded-md border shadow-sm hover:shadow-md transition transform hover:-translate-y-0.5 duration-200"
//                     >
//                       <div className="flex items-start gap-4 p-5">
//                         <div className="bg-gray-100 rounded-md p-2">
//                           {block.icon}
//                         </div>
//                         <div className="flex-1">
//                           <h3 className="text-md font-semibold text-purple-700">
//                             {block.label}
//                           </h3>
//                           <p className="text-sm text-gray-600">
//                             {block.description}
//                           </p>
//                         </div>
//                         <MoreVertical size={16} className="text-gray-400" />
//                       </div>
//                       <div className="px-5 py-3 border-t border-gray-200 flex items-center justify-between">
//                         <button
//                           onClick={() => navigate(block.path)}
//                           className="text-sm text-purple-600 font-medium flex items-center gap-1 hover:text-purple-800"
//                         >
//                           {block.action} <ArrowRightCircle size={18} />
//                         </button>
//                         <div className="flex items-center gap-3">
//                           <button
//                             onClick={() => togglePin(block.id)}
//                             title="Pin this"
//                           >
//                             <Pin
//                               size={18}
//                               className={
//                                 pinned.includes(block.id)
//                                   ? "text-red-600"
//                                   : "text-gray-400 hover:text-red-500"
//                               }
//                             />
//                           </button>
//                           <button
//                             onClick={() => toggleArchive(block.id)}
//                             title="Archive this"
//                           >
//                             <Archive
//                               size={18}
//                               className={
//                                 archived.includes(block.id)
//                                   ? "text-indigo-600"
//                                   : "text-gray-400 hover:text-indigo-500"
//                               }
//                             />
//                           </button>
//                         </div>
//                       </div>
//                     </div>
//                   )}
//                 </Draggable>
//               ))}
//               {provided.placeholder}
//             </div>
//           )}
//         </Droppable>
//       </DragDropContext>
//     </div>
//   );
// }
