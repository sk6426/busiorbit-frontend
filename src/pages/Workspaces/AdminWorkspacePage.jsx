// 📄 File: src/pages/Workspaces/AdminWorkspacePage.jsx
import {
  ShieldCheck,
  SquareStack,
  Archive,
  Pin,
  ArrowRightCircle,
  MoreVertical,
  AlertTriangle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

import { useAuth } from "../../app/providers/AuthProvider";
import { FK } from "../../capabilities/featureKeys";

// map blocks → permission codes (empty = no extra perm check)
const PERM_BY_BLOCK = {
  "business-approvals": [FK.ADMIN_BUSINESS_APPROVE],
  "feature-toggles": [], // add FK.* here later if you need
  "plan-manager": [FK.ADMIN_PLANS_VIEW],
  "plan-feature-mapping": [FK.ADMIN_PLANS_VIEW],
};

const allAdminBlocks = [
  {
    id: "business-approvals",
    label: "Business Approvals",
    description: "Approve or reject pending business signups.",
    path: "/app/admin/approvals",
    icon: <ShieldCheck className="text-green-600" size={22} />,
    action: "Review Requests",
    roles: ["superadmin", "partner", "reseller", "admin"],
  },
  {
    id: "feature-toggles",
    label: "Feature Toggles",
    description: "Enable or disable features for your platform.",
    path: "/app/admin/features",
    icon: <SquareStack className="text-blue-500" size={22} />,
    action: "Open Toggles",
    roles: ["superadmin", "admin", "business", "business owner"],
  },
  {
    id: "plan-manager",
    label: "Plan Manager",
    description: "Define feature limits for each plan tier.",
    path: "/app/admin/plans",
    icon: <SquareStack className="text-purple-500" size={22} />,
    action: "Manage Plans",
    roles: ["superadmin", "admin"],
  },
  {
    id: "plan-feature-mapping",
    label: "Plan → Feature Mapping",
    description: "Assign features (permissions) to each subscription plan.",
    path: "/app/admin/plan-feature-mapping",
    icon: <SquareStack className="text-purple-500" size={22} />,
    action: "Manage Mapping",
    roles: ["superadmin", "admin"],
  },
];

export default function AdminWorkspacePage() {
  const navigate = useNavigate();
  const { role, hasAllAccess, can, isLoading } = useAuth();
  const userRole = String(role || "").toLowerCase();

  const [pinned, setPinned] = useState(
    JSON.parse(localStorage.getItem("admin-pinned") || "[]")
  );
  const [archived, setArchived] = useState(
    JSON.parse(localStorage.getItem("admin-archived") || "[]")
  );
  const [order, setOrder] = useState(
    JSON.parse(localStorage.getItem("admin-order")) ||
      allAdminBlocks.map(b => b.id)
  );

  const togglePin = id => {
    const updated = pinned.includes(id)
      ? pinned.filter(i => i !== id)
      : [...pinned, id];
    setPinned(updated);
    localStorage.setItem("admin-pinned", JSON.stringify(updated));
  };

  const toggleArchive = id => {
    const updated = archived.includes(id)
      ? archived.filter(i => i !== id)
      : [...archived, id];
    setArchived(updated);
    localStorage.setItem("admin-archived", JSON.stringify(updated));
  };

  const onDragEnd = result => {
    if (!result.destination) return;
    const newOrder = Array.from(order);
    const [moved] = newOrder.splice(result.source.index, 1);
    newOrder.splice(result.destination.index, 0, moved);
    setOrder(newOrder);
    localStorage.setItem("admin-order", JSON.stringify(newOrder));
  };

  const canAny = codes =>
    hasAllAccess ||
    (codes || []).length === 0 ||
    (codes || []).some(code => can(code));

  // Role is optional: if a block provides roles, require it; if not, allow by perm only
  const roleOk = block =>
    hasAllAccess ||
    !Array.isArray(block.roles) ||
    block.roles.map(r => String(r).toLowerCase()).includes(userRole);

  const isAllowed = block => roleOk(block) && canAny(PERM_BY_BLOCK[block.id]);

  const visibleBlocks = order
    .map(id => allAdminBlocks.find(b => b.id === id))
    .filter(Boolean)
    .filter(b => !archived.includes(b.id))
    .filter(isAllowed);

  if (isLoading) {
    return (
      <div className="p-10 text-center text-lg text-gray-500">
        Loading admin tools…
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-purple-800 mb-4">
        🛡 Admin Workspace
      </h2>

      {!visibleBlocks.length && (
        <div className="bg-red-100 text-red-700 p-4 border-l-4 border-red-500 rounded-md mb-6 shadow-sm flex items-start gap-3">
          <AlertTriangle size={22} className="mt-1" />
          <div>
            <strong>Restricted:</strong> You don’t have admin permissions to
            access these tools.
            <div className="text-sm mt-1 text-gray-600">
              Contact your administrator if this is a mistake.
            </div>
          </div>
        </div>
      )}

      {visibleBlocks.length > 0 && (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="admin-blocks" direction="horizontal">
            {provided => (
              <div
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6"
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                {visibleBlocks.map((block, index) => (
                  <Draggable
                    key={block.id}
                    draggableId={block.id}
                    index={index}
                  >
                    {provided => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="bg-white rounded-md border shadow-sm hover:shadow-md transition transform hover:-translate-y-0.5 duration-200"
                      >
                        <div className="flex items-start gap-4 p-5">
                          <div className="bg-gray-100 rounded-md p-2">
                            {block.icon}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-md font-semibold text-purple-700">
                              {block.label}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {block.description}
                            </p>
                          </div>
                          <MoreVertical size={16} className="text-gray-400" />
                        </div>
                        <div className="px-5 py-3 border-t border-gray-200 flex items-center justify-between">
                          <button
                            onClick={() => navigate(block.path)}
                            className="text-sm text-purple-600 font-medium flex items-center gap-1 hover:text-purple-800"
                          >
                            {block.action} <ArrowRightCircle size={18} />
                          </button>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => togglePin(block.id)}
                              title="Pin this"
                            >
                              <Pin
                                size={18}
                                className={
                                  pinned.includes(block.id)
                                    ? "text-red-600"
                                    : "text-gray-400 hover:text-red-500"
                                }
                              />
                            </button>
                            <button
                              onClick={() => toggleArchive(block.id)}
                              title="Archive this"
                            >
                              <Archive
                                size={18}
                                className={
                                  archived.includes(block.id)
                                    ? "text-indigo-600"
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
      )}
    </div>
  );
}

// // 📄 File: src/pages/Workspaces/AdminWorkspacePage.jsx

// import {
//   ShieldCheck,
//   SquareStack,
//   Archive,
//   Pin,
//   ArrowRightCircle,
//   MoreVertical,
//   AlertTriangle,
// } from "lucide-react";
// import { useNavigate } from "react-router-dom";
// import { useState } from "react";
// import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

// import { useAuth } from "../../app/providers/AuthProvider";
// import { FK } from "../../capabilities/featureKeys";

// // ✅ Optional capability checks per block (leave empty [] to skip)
// const PERM_BY_BLOCK = {
//   "business-approvals": [FK.ADMIN_BUSINESS_APPROVE],
//   "feature-toggles": [], // add FK.* if you later gate this
//   "plan-manager": [FK.ADMIN_PLANS_VIEW],
//   "plan-feature-mapping": [FK.ADMIN_PLANS_VIEW], // or your own mapping permission
//   "whatsapp-settings": [FK.WHATSAPP_SETTINGS_VIEW], // open to listed roles; add perms if you wire it
// };

// const allAdminBlocks = [
//   {
//     id: "business-approvals",
//     label: "Business Approvals",
//     description: "Approve or reject pending business signups.",
//     path: "/app/admin/approvals",
//     icon: <ShieldCheck className="text-green-600" size={22} />,
//     action: "Review Requests",
//     roles: ["superadmin", "partner", "reseller", "admin"],
//   },
//   {
//     id: "feature-toggles",
//     label: "Feature Toggles",
//     description: "Enable or disable features for your platform.",
//     path: "/app/admin/features",
//     icon: <SquareStack className="text-blue-500" size={22} />,
//     action: "Open Toggles",
//     roles: ["superadmin", "admin", "business"],
//   },
//   {
//     id: "plan-manager",
//     label: "Plan Manager",
//     description: "Define feature limits for each plan tier.",
//     path: "/app/admin/plans",
//     icon: <SquareStack className="text-purple-500" size={22} />,
//     action: "Manage Plans",
//     roles: ["superadmin", "admin"],
//   },
//   {
//     id: "plan-feature-mapping",
//     label: "Plan → Feature Mapping",
//     description: "Assign features (permissions) to each subscription plan.",
//     path: "/app/admin/plan-feature-mapping",
//     icon: <SquareStack className="text-purple-500" size={22} />,
//     action: "Manage Mapping",
//     roles: ["superadmin", "admin"],
//   },
//   {
//     id: "whatsapp-settings",
//     label: "WhatsApp Settings",
//     description: "Configure API credentials for WhatsApp Messaging.",
//     // 🔧 match router casing exactly:
//     path: "/app/WhatsAppSettings/whatsapp-settings",
//     icon: <ShieldCheck className="text-yellow-500" size={22} />,
//     action: "Configure WhatsApp",
//     //roles: ["superadmin", "partner", "reseller", "admin", "business"],
//   },
// ];

// export default function AdminWorkspacePage() {
//   const navigate = useNavigate();
//   const { role, hasAllAccess, can, isLoading } = useAuth();
//   const userRole = (role || "").toLowerCase();

//   const [pinned, setPinned] = useState(
//     JSON.parse(localStorage.getItem("admin-pinned") || "[]")
//   );
//   const [archived, setArchived] = useState(
//     JSON.parse(localStorage.getItem("admin-archived") || "[]")
//   );
//   const [order, setOrder] = useState(
//     JSON.parse(localStorage.getItem("admin-order")) ||
//       allAdminBlocks.map(b => b.id)
//   );

//   const togglePin = id => {
//     const updated = pinned.includes(id)
//       ? pinned.filter(i => i !== id)
//       : [...pinned, id];
//     setPinned(updated);
//     localStorage.setItem("admin-pinned", JSON.stringify(updated));
//   };

//   const toggleArchive = id => {
//     const updated = archived.includes(id)
//       ? archived.filter(i => i !== id)
//       : [...archived, id];
//     setArchived(updated);
//     localStorage.setItem("admin-archived", JSON.stringify(updated));
//   };

//   const onDragEnd = result => {
//     if (!result.destination) return;
//     const newOrder = Array.from(order);
//     const [moved] = newOrder.splice(result.source.index, 1);
//     newOrder.splice(result.destination.index, 0, moved);
//     setOrder(newOrder);
//     localStorage.setItem("admin-order", JSON.stringify(newOrder));
//   };

//   const canAny = codes =>
//     hasAllAccess ||
//     (codes || []).length === 0 ||
//     (codes || []).some(code => can(code));

//   // Visible if role allowed (or hasAllAccess) AND (passes capability checks if provided)
//   const isAllowed = block =>
//     (hasAllAccess || block.roles.includes(userRole)) &&
//     canAny(PERM_BY_BLOCK[block.id]);

//   const visibleBlocks = order
//     .map(id => allAdminBlocks.find(b => b.id === id))
//     .filter(Boolean)
//     .filter(b => !archived.includes(b.id))
//     .filter(isAllowed);

//   if (isLoading) {
//     return (
//       <div className="p-10 text-center text-lg text-gray-500">
//         Loading admin tools…
//       </div>
//     );
//   }

//   return (
//     <div className="p-6">
//       <h2 className="text-2xl font-bold text-purple-800 mb-4">
//         🛡 Admin Workspace
//       </h2>

//       {!visibleBlocks.length && (
//         <div className="bg-red-100 text-red-700 p-4 border-l-4 border-red-500 rounded-md mb-6 shadow-sm flex items-start gap-3">
//           <AlertTriangle size={22} className="mt-1" />
//           <div>
//             <strong>Restricted:</strong> You don’t have admin permissions to
//             access these tools.
//             <div className="text-sm mt-1 text-gray-600">
//               Contact your administrator if this is a mistake.
//             </div>
//           </div>
//         </div>
//       )}

//       {visibleBlocks.length > 0 && (
//         <DragDropContext onDragEnd={onDragEnd}>
//           <Droppable droppableId="admin-blocks" direction="horizontal">
//             {provided => (
//               <div
//                 className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6"
//                 ref={provided.innerRef}
//                 {...provided.droppableProps}
//               >
//                 {visibleBlocks.map((block, index) => (
//                   <Draggable
//                     key={block.id}
//                     draggableId={block.id}
//                     index={index}
//                   >
//                     {provided => (
//                       <div
//                         ref={provided.innerRef}
//                         {...provided.draggableProps}
//                         {...provided.dragHandleProps}
//                         className="bg-white rounded-md border shadow-sm hover:shadow-md transition transform hover:-translate-y-0.5 duration-200"
//                       >
//                         <div className="flex items-start gap-4 p-5">
//                           <div className="bg-gray-100 rounded-md p-2">
//                             {block.icon}
//                           </div>
//                           <div className="flex-1">
//                             <h3 className="text-md font-semibold text-purple-700">
//                               {block.label}
//                             </h3>
//                             <p className="text-sm text-gray-600">
//                               {block.description}
//                             </p>
//                           </div>
//                           <MoreVertical size={16} className="text-gray-400" />
//                         </div>
//                         <div className="px-5 py-3 border-t border-gray-200 flex items-center justify-between">
//                           <button
//                             onClick={() => navigate(block.path)}
//                             className="text-sm text-purple-600 font-medium flex items-center gap-1 hover:text-purple-800"
//                           >
//                             {block.action} <ArrowRightCircle size={18} />
//                           </button>
//                           <div className="flex items-center gap-3">
//                             <button
//                               onClick={() => togglePin(block.id)}
//                               title="Pin this"
//                             >
//                               <Pin
//                                 size={18}
//                                 className={
//                                   pinned.includes(block.id)
//                                     ? "text-red-600"
//                                     : "text-gray-400 hover:text-red-500"
//                                 }
//                               />
//                             </button>
//                             <button
//                               onClick={() => toggleArchive(block.id)}
//                               title="Archive this"
//                             >
//                               <Archive
//                                 size={18}
//                                 className={
//                                   archived.includes(block.id)
//                                     ? "text-indigo-600"
//                                     : "text-gray-400 hover:text-indigo-500"
//                                 }
//                               />
//                             </button>
//                           </div>
//                         </div>
//                       </div>
//                     )}
//                   </Draggable>
//                 ))}
//                 {provided.placeholder}
//               </div>
//             )}
//           </Droppable>
//         </DragDropContext>
//       )}
//     </div>
//   );
// }

// 📄 File: src/pages/Admin/AdminWorkspacePage.jsx

// import {
//   ShieldCheck,
//   SquareStack,
//   Archive,
//   Pin,
//   ArrowRightCircle,
//   MoreVertical,
//   AlertTriangle,
// } from "lucide-react";
// import { useNavigate } from "react-router-dom";
// import { useState } from "react";
// import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

// // ✅ use server-authoritative auth (role, hasAllAccess, can)
// import { useAuth } from "../../app/providers/AuthProvider";

// // (Optional) capability keys if you wire can() later for admin features
// // import { FK } from "../../capabilities/featureKeys";

// const allAdminBlocks = [
//   {
//     id: "business-approvals",
//     label: "Business Approvals",
//     description: "Approve or reject pending business signups.",
//     path: "/app/admin/approvals",
//     icon: <ShieldCheck className="text-green-600" size={22} />,
//     action: "Review Requests",
//     roles: ["superadmin", "partner", "reseller", "admin"],
//     // perms: [FK?.ADMIN_BUSINESS_APPROVE ?? "admin.business.approve"],
//   },
//   {
//     id: "feature-toggles",
//     label: "Feature Toggles",
//     description: "Enable or disable features for your platform.",
//     path: "/app/admin/features",
//     icon: <SquareStack className="text-blue-500" size={22} />,
//     action: "Open Toggles",
//     roles: ["superadmin", "admin", "business"],
//   },
//   {
//     id: "plan-manager",
//     label: "Plan Manager",
//     description: "Define feature limits for each plan tier.",
//     path: "/app/admin/plans",
//     icon: <SquareStack className="text-purple-500" size={22} />,
//     action: "Manage Plans",
//     roles: ["superadmin", "admin"],
//     // perms: [FK?.ADMIN_PLANS_VIEW ?? "admin.plans.view"],
//   },
//   {
//     id: "plan-feature-mapping",
//     label: "Plan → Feature Mapping",
//     description: "Assign features (permissions) to each subscription plan.",
//     path: "/app/admin/plan-feature-mapping",
//     icon: <SquareStack className="text-purple-500" size={22} />,
//     action: "Manage Mapping",
//     roles: ["superadmin", "admin"],
//   },
//   {
//     id: "whatsapp-settings",
//     label: "WhatsApp Settings",
//     description: "Configure API credentials for WhatsApp Messaging.",
//     // 🔧 align to router casing: /app/WhatsAppSettings/whatsapp-settings
//     path: "/app/WhatsAppSettings/whatsapp-settings",
//     icon: <ShieldCheck className="text-yellow-500" size={22} />,
//     action: "Configure WhatsApp",
//     roles: ["superadmin", "partner", "reseller", "admin", "business"],
//   },
// ];

// export default function AdminWorkspacePage() {
//   const navigate = useNavigate();
//   const { role, hasAllAccess, isLoading /*, can*/ } = useAuth();
//   const userRole = (role || "").toLowerCase();

//   const [pinned, setPinned] = useState(
//     JSON.parse(localStorage.getItem("admin-pinned") || "[]")
//   );
//   const [archived, setArchived] = useState(
//     JSON.parse(localStorage.getItem("admin-archived") || "[]")
//   );
//   const [order, setOrder] = useState(
//     JSON.parse(localStorage.getItem("admin-order")) ||
//       allAdminBlocks.map(b => b.id)
//   );

//   const togglePin = id => {
//     const updated = pinned.includes(id)
//       ? pinned.filter(i => i !== id)
//       : [...pinned, id];
//     setPinned(updated);
//     localStorage.setItem("admin-pinned", JSON.stringify(updated));
//   };

//   const toggleArchive = id => {
//     const updated = archived.includes(id)
//       ? archived.filter(i => i !== id)
//       : [...archived, id];
//     setArchived(updated);
//     localStorage.setItem("admin-archived", JSON.stringify(updated));
//   };

//   const onDragEnd = result => {
//     if (!result.destination) return;
//     const newOrder = Array.from(order);
//     const [moved] = newOrder.splice(result.source.index, 1);
//     newOrder.splice(result.destination.index, 0, moved);
//     setOrder(newOrder);
//     localStorage.setItem("admin-order", JSON.stringify(newOrder));
//   };

//   // allow if superadmin OR block.roles includes userRole
//   // (Optional) you can AND this with capability checks via can(), if you wish.
//   const isAllowed = block =>
//     hasAllAccess || block.roles.includes(userRole); /* &&
//     (!block.perms || block.perms.some(code => can(code))) */

//   const visibleBlocks = order
//     .map(id => allAdminBlocks.find(b => b.id === id))
//     .filter(Boolean)
//     .filter(b => !archived.includes(b.id))
//     .filter(isAllowed);

//   if (isLoading) {
//     return (
//       <div className="p-10 text-center text-lg text-gray-500">
//         Loading admin tools…
//       </div>
//     );
//   }

//   return (
//     <div className="p-6">
//       <h2 className="text-2xl font-bold text-purple-800 mb-4">
//         🛡 Admin Workspace
//       </h2>

//       {!visibleBlocks.length && (
//         <div className="bg-red-100 text-red-700 p-4 border-l-4 border-red-500 rounded-md mb-6 shadow-sm flex items-start gap-3">
//           <AlertTriangle size={22} className="mt-1" />
//           <div>
//             <strong>Restricted:</strong> You don’t have admin permissions to
//             access these tools.
//             <div className="text-sm mt-1 text-gray-600">
//               Contact your administrator if this is a mistake.
//             </div>
//           </div>
//         </div>
//       )}

//       {visibleBlocks.length > 0 && (
//         <DragDropContext onDragEnd={onDragEnd}>
//           <Droppable droppableId="admin-blocks" direction="horizontal">
//             {provided => (
//               <div
//                 className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6"
//                 ref={provided.innerRef}
//                 {...provided.droppableProps}
//               >
//                 {visibleBlocks.map((block, index) => (
//                   <Draggable
//                     key={block.id}
//                     draggableId={block.id}
//                     index={index}
//                   >
//                     {provided => (
//                       <div
//                         ref={provided.innerRef}
//                         {...provided.draggableProps}
//                         {...provided.dragHandleProps}
//                         className="bg-white rounded-md border shadow-sm hover:shadow-md transition transform hover:-translate-y-0.5 duration-200"
//                       >
//                         <div className="flex items-start gap-4 p-5">
//                           <div className="bg-gray-100 rounded-md p-2">
//                             {block.icon}
//                           </div>
//                           <div className="flex-1">
//                             <h3 className="text-md font-semibold text-purple-700">
//                               {block.label}
//                             </h3>
//                             <p className="text-sm text-gray-600">
//                               {block.description}
//                             </p>
//                           </div>
//                           <MoreVertical size={16} className="text-gray-400" />
//                         </div>
//                         <div className="px-5 py-3 border-t border-gray-200 flex items-center justify-between">
//                           <button
//                             onClick={() => navigate(block.path)}
//                             className="text-sm text-purple-600 font-medium flex items-center gap-1 hover:text-purple-800"
//                           >
//                             {block.action} <ArrowRightCircle size={18} />
//                           </button>
//                           <div className="flex items-center gap-3">
//                             <button
//                               onClick={() => togglePin(block.id)}
//                               title="Pin this"
//                             >
//                               <Pin
//                                 size={18}
//                                 className={
//                                   pinned.includes(block.id)
//                                     ? "text-red-600"
//                                     : "text-gray-400 hover:text-red-500"
//                                 }
//                               />
//                             </button>
//                             <button
//                               onClick={() => toggleArchive(block.id)}
//                               title="Archive this"
//                             >
//                               <Archive
//                                 size={18}
//                                 className={
//                                   archived.includes(block.id)
//                                     ? "text-indigo-600"
//                                     : "text-gray-400 hover:text-indigo-500"
//                                 }
//                               />
//                             </button>
//                           </div>
//                         </div>
//                       </div>
//                     )}
//                   </Draggable>
//                 ))}
//                 {provided.placeholder}
//               </div>
//             )}
//           </Droppable>
//         </DragDropContext>
//       )}
//     </div>
//   );
// }

// // 📄 File: src/pages/Admin/AdminWorkspacePage.jsx

// import {
//   ShieldCheck,
//   SquareStack,
//   Archive,
//   Pin,
//   ArrowRightCircle,
//   MoreVertical,
//   AlertTriangle,
// } from "lucide-react";
// import { useNavigate } from "react-router-dom";
// import { useState } from "react";
// import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

// const allAdminBlocks = [
//   {
//     id: "business-approvals",
//     label: "Business Approvals",
//     description: "Approve or reject pending business signups.",
//     path: "/app/admin/approvals",
//     icon: <ShieldCheck className="text-green-600" size={22} />,
//     action: "Review Requests",
//     roles: ["superadmin", "partner", "reseller", "admin"],
//   },
//   {
//     id: "feature-toggles",
//     label: "Feature Toggles",
//     description: "Enable or disable features for your platform.",
//     path: "/app/admin/features",
//     icon: <SquareStack className="text-blue-500" size={22} />,
//     action: "Open Toggles",
//     roles: ["superadmin", "admin", "business"],
//   },
//   {
//     id: "plan-manager",
//     label: "Plan Manager",
//     description: "Define feature limits for each plan tier.",
//     path: "/app/admin/plans",
//     icon: <SquareStack className="text-purple-500" size={22} />,
//     action: "Manage Plans",
//     roles: ["superadmin", "admin"], // could use hasFeature check for plan-based control later
//   },
//   {
//     id: "plan-feature-mapping",
//     label: "Plan → Feature Mapping",
//     description: "Assign features (permissions) to each subscription plan.",
//     path: "/app/admin/plan-feature-mapping",
//     icon: <SquareStack className="text-purple-500" size={22} />,
//     action: "Manage Mapping",
//     roles: ["superadmin", "admin"],
//   },
//   // {
//   //   id: "plan-manager",
//   //   label: "Plan Manager",
//   //   description: "Define feature limits for each plan tier.",
//   //   path: "/app/admin/plans",
//   //   icon: <SquareStack className="text-purple-500" size={22} />,
//   //   action: "Manage Plans",
//   //   roles: ["superadmin"],
//   // },

//   {
//     id: "whatsapp-settings",
//     label: "WhatsApp Settings",
//     description: "Configure API credentials for WhatsApp Messaging.",
//     path: "/app/whatsappsettings/whatsapp-settings",
//     icon: <ShieldCheck className="text-yellow-500" size={22} />,
//     action: "Configure WhatsApp",
//     roles: ["superadmin", "partner", "reseller", "admin", "business"],
//   },
// ];

// export default function AdminWorkspacePage() {
//   const navigate = useNavigate();
//   const userRole = (localStorage.getItem("role") || "").toLowerCase();

//   const [pinned, setPinned] = useState(() =>
//     JSON.parse(localStorage.getItem("admin-pinned") || "[]")
//   );
//   const [archived, setArchived] = useState(() =>
//     JSON.parse(localStorage.getItem("admin-archived") || "[]")
//   );
//   const [order, setOrder] = useState(
//     () =>
//       JSON.parse(localStorage.getItem("admin-order")) ||
//       allAdminBlocks.map(b => b.id)
//   );

//   const togglePin = id => {
//     const updated = pinned.includes(id)
//       ? pinned.filter(i => i !== id)
//       : [...pinned, id];
//     setPinned(updated);
//     localStorage.setItem("admin-pinned", JSON.stringify(updated));
//   };

//   const toggleArchive = id => {
//     const updated = archived.includes(id)
//       ? archived.filter(i => i !== id)
//       : [...archived, id];
//     setArchived(updated);
//     localStorage.setItem("admin-archived", JSON.stringify(updated));
//   };

//   const onDragEnd = result => {
//     if (!result.destination) return;
//     const newOrder = Array.from(order);
//     const [moved] = newOrder.splice(result.source.index, 1);
//     newOrder.splice(result.destination.index, 0, moved);
//     setOrder(newOrder);
//     localStorage.setItem("admin-order", JSON.stringify(newOrder));
//   };

//   const visibleBlocks = order
//     .filter(id =>
//       allAdminBlocks.find(b => b.id === id && !archived.includes(id))
//     )
//     .map(id => allAdminBlocks.find(b => b.id === id))
//     .filter(block => block.roles.includes(userRole));

//   return (
//     <div className="p-6">
//       <h2 className="text-2xl font-bold text-purple-800 mb-4">
//         🛡 Admin Workspace
//       </h2>

//       {!visibleBlocks.length && (
//         <div className="bg-red-100 text-red-700 p-4 border-l-4 border-red-500 rounded-md mb-6 shadow-sm flex items-start gap-3">
//           <AlertTriangle size={22} className="mt-1" />
//           <div>
//             <strong>Restricted:</strong> You don’t have admin permissions to
//             access these tools.
//             <div className="text-sm mt-1 text-gray-600">
//               Contact your administrator if this is a mistake.
//             </div>
//           </div>
//         </div>
//       )}

//       {visibleBlocks.length > 0 && (
//         <DragDropContext onDragEnd={onDragEnd}>
//           <Droppable droppableId="admin-blocks" direction="horizontal">
//             {provided => (
//               <div
//                 className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6"
//                 ref={provided.innerRef}
//                 {...provided.droppableProps}
//               >
//                 {visibleBlocks.map((block, index) => (
//                   <Draggable
//                     key={block.id}
//                     draggableId={block.id}
//                     index={index}
//                   >
//                     {provided => (
//                       <div
//                         ref={provided.innerRef}
//                         {...provided.draggableProps}
//                         {...provided.dragHandleProps}
//                         className="bg-white rounded-md border shadow-sm hover:shadow-md transition transform hover:-translate-y-0.5 duration-200"
//                       >
//                         <div className="flex items-start gap-4 p-5">
//                           <div className="bg-gray-100 rounded-md p-2">
//                             {block.icon}
//                           </div>
//                           <div className="flex-1">
//                             <h3 className="text-md font-semibold text-purple-700">
//                               {block.label}
//                             </h3>
//                             <p className="text-sm text-gray-600">
//                               {block.description}
//                             </p>
//                           </div>
//                           <MoreVertical size={16} className="text-gray-400" />
//                         </div>
//                         <div className="px-5 py-3 border-t border-gray-200 flex items-center justify-between">
//                           <button
//                             onClick={() => navigate(block.path)}
//                             className="text-sm text-purple-600 font-medium flex items-center gap-1 hover:text-purple-800"
//                           >
//                             {block.action} <ArrowRightCircle size={18} />
//                           </button>
//                           <div className="flex items-center gap-3">
//                             <button
//                               onClick={() => togglePin(block.id)}
//                               title="Pin this"
//                             >
//                               <Pin
//                                 size={18}
//                                 className={
//                                   pinned.includes(block.id)
//                                     ? "text-red-600"
//                                     : "text-gray-400 hover:text-red-500"
//                                 }
//                               />
//                             </button>
//                             <button
//                               onClick={() => toggleArchive(block.id)}
//                               title="Archive this"
//                             >
//                               <Archive
//                                 size={18}
//                                 className={
//                                   archived.includes(block.id)
//                                     ? "text-indigo-600"
//                                     : "text-gray-400 hover:text-indigo-500"
//                                 }
//                               />
//                             </button>
//                           </div>
//                         </div>
//                       </div>
//                     )}
//                   </Draggable>
//                 ))}
//                 {provided.placeholder}
//               </div>
//             )}
//           </Droppable>
//         </DragDropContext>
//       )}
//     </div>
//   );
// }

// import {
//   ShieldCheck,
//   SquareStack,
//   Archive,
//   Pin,
//   ArrowRightCircle,
//   MoreVertical,
//   AlertTriangle,
// } from "lucide-react";
// import { useNavigate } from "react-router-dom";
// import { useState } from "react";
// import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

// // 🛡️ Workspace Blocks
// const adminBlocks = [
//   {
//     id: "business-approvals",
//     label: "Business Approvals",
//     description: "Approve or reject pending business signups.",
//     path: "/app/admin/approvals",
//     icon: <ShieldCheck className="text-green-600" size={22} />,
//     action: "Review Requests",
//   },
//   {
//     id: "feature-toggles",
//     label: "Feature Toggles",
//     description: "Enable or disable features for your platform.",
//     path: "/app/admin/features",
//     icon: <SquareStack className="text-blue-500" size={22} />,
//     action: "Open Toggles",
//   },
//   {
//     id: "plan-manager",
//     label: "Plan Manager",
//     description: "Define feature limits for each plan tier.",
//     path: "/app/admin/plans",
//     icon: <SquareStack className="text-purple-500" size={22} />,
//     action: "Manage Plans",
//   },
//   {
//     id: "whatsapp-settings",
//     label: "WhatsApp Settings",
//     description: "Configure API credentials for WhatsApp Messaging.",
//     path: "/app/whatsappsettings/whatsapp-settings", // 📌 Path must match the React route you defined earlier
//     icon: <ShieldCheck className="text-yellow-500" size={22} />, // You can change icon if you want
//     action: "Configure WhatsApp",
//   },
// ];

// export default function AdminWorkspacePage() {
//   const navigate = useNavigate();
//   const userRole = localStorage.getItem("role");

//   const [pinned, setPinned] = useState(() =>
//     JSON.parse(localStorage.getItem("admin-pinned") || "[]")
//   );
//   const [archived, setArchived] = useState(() =>
//     JSON.parse(localStorage.getItem("admin-archived") || "[]")
//   );
//   const [order, setOrder] = useState(
//     () =>
//       JSON.parse(localStorage.getItem("admin-order")) ||
//       adminBlocks.map(b => b.id)
//   );

//   const togglePin = id => {
//     const updated = pinned.includes(id)
//       ? pinned.filter(i => i !== id)
//       : [...pinned, id];
//     setPinned(updated);
//     localStorage.setItem("admin-pinned", JSON.stringify(updated));
//   };

//   const toggleArchive = id => {
//     const updated = archived.includes(id)
//       ? archived.filter(i => i !== id)
//       : [...archived, id];
//     setArchived(updated);
//     localStorage.setItem("admin-archived", JSON.stringify(updated));
//   };

//   const onDragEnd = result => {
//     if (!result.destination) return;
//     const newOrder = Array.from(order);
//     const [moved] = newOrder.splice(result.source.index, 1);
//     newOrder.splice(result.destination.index, 0, moved);
//     setOrder(newOrder);
//     localStorage.setItem("admin-order", JSON.stringify(newOrder));
//   };

//   const visibleBlocks = order
//     .filter(id => adminBlocks.find(b => b.id === id && !archived.includes(id)))
//     .map(id => adminBlocks.find(b => b.id === id));

//   return (
//     <div className="p-6">
//       <h2 className="text-2xl font-bold text-purple-800 mb-4">
//         🛡 Admin Workspace
//       </h2>

//       {/* 🔒 Restriction Banner */}
//       {!["admin", "superadmin", "partner"].includes(userRole) && (
//         <div className="bg-red-100 text-red-700 p-4 border-l-4 border-red-500 rounded-md mb-6 shadow-sm flex items-start gap-3">
//           <AlertTriangle size={22} className="mt-1" />
//           <div>
//             <strong>Restricted:</strong> You don’t have admin permissions to
//             access these tools.
//             <div className="text-sm mt-1 text-gray-600">
//               Contact your administrator if this is a mistake.
//             </div>
//           </div>
//         </div>
//       )}

//       {/* ✅ Admin Tools Grid */}
//       {["admin", "superadmin", "partner"].includes(userRole) && (
//         <DragDropContext onDragEnd={onDragEnd}>
//           <Droppable droppableId="admin-blocks" direction="horizontal">
//             {provided => (
//               <div
//                 className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6"
//                 ref={provided.innerRef}
//                 {...provided.droppableProps}
//               >
//                 {visibleBlocks.map((block, index) => (
//                   <Draggable
//                     key={block.id}
//                     draggableId={block.id}
//                     index={index}
//                   >
//                     {provided => (
//                       <div
//                         ref={provided.innerRef}
//                         {...provided.draggableProps}
//                         {...provided.dragHandleProps}
//                         className="bg-white rounded-md border shadow-sm hover:shadow-md transition transform hover:-translate-y-0.5 duration-200"
//                       >
//                         <div className="flex items-start gap-4 p-5">
//                           <div className="bg-gray-100 rounded-md p-2">
//                             {block.icon}
//                           </div>
//                           <div className="flex-1">
//                             <h3 className="text-md font-semibold text-purple-700">
//                               {block.label}
//                             </h3>
//                             <p className="text-sm text-gray-600">
//                               {block.description}
//                             </p>
//                           </div>
//                           <MoreVertical size={16} className="text-gray-400" />
//                         </div>
//                         <div className="px-5 py-3 border-t border-gray-200 flex items-center justify-between">
//                           <button
//                             onClick={() => navigate(block.path)}
//                             className="text-sm text-purple-600 font-medium flex items-center gap-1 hover:text-purple-800"
//                           >
//                             {block.action} <ArrowRightCircle size={18} />
//                           </button>
//                           <div className="flex items-center gap-3">
//                             <button
//                               onClick={() => togglePin(block.id)}
//                               title="Pin this"
//                             >
//                               <Pin
//                                 size={18}
//                                 className={
//                                   pinned.includes(block.id)
//                                     ? "text-red-600"
//                                     : "text-gray-400 hover:text-red-500"
//                                 }
//                               />
//                             </button>
//                             <button
//                               onClick={() => toggleArchive(block.id)}
//                               title="Archive this"
//                             >
//                               <Archive
//                                 size={18}
//                                 className={
//                                   archived.includes(block.id)
//                                     ? "text-indigo-600"
//                                     : "text-gray-400 hover:text-indigo-500"
//                                 }
//                               />
//                             </button>
//                           </div>
//                         </div>
//                       </div>
//                     )}
//                   </Draggable>
//                 ))}
//                 {provided.placeholder}
//               </div>
//             )}
//           </Droppable>
//         </DragDropContext>
//       )}
//     </div>
//   );
// }
