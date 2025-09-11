// 📄 File: src/pages/Messaging/MessagingWorkspacePage.jsx

import {
  MessageSquareText,
  Clock4,
  ArrowRightCircle,
  MoreVertical,
  Archive,
  Pin,
  Send,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

// ✅ server-authoritative permissions (can/hasAllAccess)
import { useAuth } from "../../app/providers/AuthProvider";
// ✅ centralized permission codes (FK) – falls back to string literals if missing
import { FK } from "../../capabilities/featureKeys";

// --- Permission map for each block (add/update codes here) ---
const PERM_BY_BLOCK = {
  "message-history": [FK?.MESSAGING_REPORT_VIEW ?? "messaging.report.view"],
  "status-logs": [FK?.MESSAGING_STATUS_VIEW ?? "messaging.status.view"],
  "open-chat": [FK?.MESSAGING_INBOX_VIEW ?? "messaging.inbox.view"],
  "send-direct-text": [FK?.MESSAGING_SEND_TEXT ?? "messaging.send.text"],

  "send-message": [FK?.MESSAGING_SEND ?? "messaging.send"],
  // ⬇️ this was missing; without it the card never renders
};

// --- Cards (unchanged visuals) ---
const messageBlocks = [
  {
    id: "message-history",
    label: "Message History",
    description: "View all sent messages, delivery status, and logs.",
    path: "/app/messaging/reporting/direct-message-history",
    icon: <MessageSquareText className="text-purple-600" size={22} />,
    action: "View Logs",
  },
  {
    id: "status-logs",
    label: "Status Logs",
    description: "Track webhook delivery and read receipts from WhatsApp.",
    path: "/app/tracking/logs",
    icon: <Clock4 className="text-yellow-600" size={22} />,
    action: "Open Status",
  },

  {
    id: "send-direct-text",
    label: "Send Direct Message",
    description: "Send plain text messages to one or multiple contacts.",
    path: "/app/messaging/send-direct-text",
    icon: <MessageSquareText className="text-purple-500" size={22} />,
    action: "Send-Direct-Text",
  },

  {
    id: "send-message",
    label: "Send Message",
    description: "Send a WhatsApp message directly to a contact or lead.",
    path: "/app/messaging/whatsapp-message",
    icon: <Send className="text-indigo-600" size={22} />,
    action: "Send Now",
  },
];

export default function MessagingWorkspacePage() {
  const navigate = useNavigate();
  const { isLoading, can, hasAllAccess } = useAuth();

  const [pinned, setPinned] = useState(
    JSON.parse(localStorage.getItem("messaging-pinned") || "[]")
  );
  const [archived, setArchived] = useState(
    JSON.parse(localStorage.getItem("messaging-archived") || "[]")
  );
  const [order, setOrder] = useState(
    JSON.parse(localStorage.getItem("messaging-order")) ||
      messageBlocks.map(b => b.id)
  );
  const [showArchived, setShowArchived] = useState(false);

  const togglePin = id => {
    const updated = pinned.includes(id)
      ? pinned.filter(i => i !== id)
      : [...pinned, id];
    setPinned(updated);
    localStorage.setItem("messaging-pinned", JSON.stringify(updated));
  };

  const toggleArchive = id => {
    const updated = archived.includes(id)
      ? archived.filter(i => i !== id)
      : [...archived, id];
    setArchived(updated);
    localStorage.setItem("messaging-archived", JSON.stringify(updated));
  };

  const onDragEnd = result => {
    if (!result.destination) return;
    const newOrder = Array.from(order);
    const [moved] = newOrder.splice(result.source.index, 1);
    newOrder.splice(result.destination.index, 0, moved);
    setOrder(newOrder);
    localStorage.setItem("messaging-order", JSON.stringify(newOrder));
  };

  const canAny = codes =>
    hasAllAccess || (Array.isArray(codes) && codes.some(code => can(code)));

  const visibleBlocks = order
    .map(id => messageBlocks.find(b => b.id === id))
    .filter(Boolean)
    .filter(b => (showArchived ? true : !archived.includes(b.id)))
    .filter(b => canAny(PERM_BY_BLOCK[b.id] || []));

  if (isLoading)
    return (
      <div className="p-10 text-center text-lg text-gray-500">
        Loading features…
      </div>
    );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-purple-800">
          💬 Messaging Workspace
        </h2>
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={() => setShowArchived(!showArchived)}
            className="accent-purple-600"
          />
          Show Archived
        </label>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="messaging-blocks" direction="horizontal">
          {provided => (
            <div
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6"
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              {visibleBlocks.map((block, index) => (
                <Draggable key={block.id} draggableId={block.id} index={index}>
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
    </div>
  );
}

// // 📄 File: src/pages/Messaging/MessagingWorkspacePage.jsx

// import {
//   MessageSquareText,
//   Clock4,
//   ArrowRightCircle,
//   MoreVertical,
//   Archive,
//   Pin,
//   Send,
// } from "lucide-react";
// import { useNavigate } from "react-router-dom";
// import { useState } from "react";
// import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

// // ✅ use new AuthProvider (server-authoritative permissions)
// import { useAuth } from "../../app/providers/AuthProvider";
// // (Optional) centralized capability keys; falls back to literals if undefined
// import { FK } from "../../capabilities/featureKeys";
// import { FaWhatsapp } from "react-icons/fa6";

// // Map each block to one or more capability codes
// const PERM_BY_BLOCK = {
//   "message-history": [FK?.MESSAGING_REPORT_VIEW ?? "messaging.report.view"],
//   "status-logs": [FK?.MESSAGING_STATUS_VIEW ?? "messaging.status.view"],
//   "open-chat": [FK?.MESSAGING_INBOX_VIEW ?? "messaging.inbox.view"],
//   "send-direct-text": [FK?.MESSAGING_SEND_TEXT ?? "messaging.send.text"],
//   "send-template-message": [
//     FK?.MESSAGING_SEND_TEMPLATE ?? "messaging.send.template",
//   ],
//   "send-message": [FK?.MESSAGING_SEND ?? "messaging.send"],
// };

// // Cards (design preserved). Paths aligned with your App.jsx routes.
// const messageBlocks = [
//   {
//     id: "message-history",
//     label: "Message History",
//     description: "View all sent messages, delivery status, and logs.",
//     path: "/app/messaging/reporting/direct-message-history",
//     icon: <MessageSquareText className="text-purple-600" size={22} />,
//     action: "View Logs",
//   },
//   {
//     id: "status-logs",
//     label: "Status Logs",
//     description: "Track webhook delivery and read receipts from WhatsApp.",
//     // You don't have /app/messaging/status-logs; you DO have /app/tracking/logs
//     path: "/app/tracking/logs",
//     icon: <Clock4 className="text-yellow-600" size={22} />,
//     action: "Open Status",
//   },
//   {
//     id: "open-chat",
//     label: "Live Chat Inbox",
//     description:
//       "Switch to a real-time inbox to manage and respond to conversations instantly.",
//     // Keep legacy typo route since it exists in App.jsx
//     path: "/app/messaging/inboxwarpper",
//     icon: <MessageSquareText className="text-green-600" size={22} />,
//     action: "Live Chat",
//   },
//   {
//     id: "send-direct-text",
//     label: "Send Direct Message",
//     description: "Send plain text messages to one or multiple contacts.",
//     path: "/app/messaging/send-direct-text",
//     icon: <MessageSquareText className="text-purple-500" size={22} />,
//     action: "Send-Direct-Text",
//   },
//   {
//     id: "send-template-message",
//     label: "Send Template Message",
//     description:
//       "Send approved WhatsApp  (Text + button + Image) messages to contacts.",
//     path: "/app/messaging/send-template-simple",
//     icon: <MessageSquareText className="text-purple-500" size={22} />,
//     action: "Send-Template-Message",
//   },
//   {
//     id: "send-message",
//     label: "Send Message",
//     description: "Send a WhatsApp message directly to a contact or lead.",
//     // Your real route is /app/messaging/whatsapp-message
//     path: "/app/messaging/whatsapp-message",
//     icon: <Send className="text-indigo-600" size={22} />,
//     action: "Send Now",
//   },
//   {
//     id: "whatsapp-settings",
//     label: "WhatsApp Settings",
//     description: "Configure API credentials for WhatsApp Messaging.",
//     // ⬇️ must match your router path exactly (case-sensitive)
//     path: "/app/messaging/whatsapp-settings",
//     icon: <FaWhatsapp className="text-yellow-500" size={22} />,
//     action: "Configure WhatsApp",
//     // Make Business Owner work too; OR omit roles to allow by permission only
//     // roles: [
//     //   "superadmin",
//     //   "partner",
//     //   "reseller",
//     //   "admin",
//     //   "business",
//     //   "business owner",
//     // ],
//   },
// ];

// export default function MessagingWorkspacePage() {
//   const navigate = useNavigate();
//   const { isLoading, can, hasAllAccess } = useAuth();

//   const [pinned, setPinned] = useState(
//     JSON.parse(localStorage.getItem("messaging-pinned") || "[]")
//   );
//   const [archived, setArchived] = useState(
//     JSON.parse(localStorage.getItem("messaging-archived") || "[]")
//   );
//   const [order, setOrder] = useState(
//     JSON.parse(localStorage.getItem("messaging-order")) ||
//       messageBlocks.map(b => b.id)
//   );
//   const [showArchived, setShowArchived] = useState(false);

//   const togglePin = id => {
//     const updated = pinned.includes(id)
//       ? pinned.filter(i => i !== id)
//       : [...pinned, id];
//     setPinned(updated);
//     localStorage.setItem("messaging-pinned", JSON.stringify(updated));
//   };

//   const toggleArchive = id => {
//     const updated = archived.includes(id)
//       ? archived.filter(i => i !== id)
//       : [...archived, id];
//     setArchived(updated);
//     localStorage.setItem("messaging-archived", JSON.stringify(updated));
//   };

//   const onDragEnd = result => {
//     if (!result.destination) return;
//     const newOrder = Array.from(order);
//     const [moved] = newOrder.splice(result.source.index, 1);
//     newOrder.splice(result.destination.index, 0, moved);
//     setOrder(newOrder);
//     localStorage.setItem("messaging-order", JSON.stringify(newOrder));
//   };

//   const canAny = codes =>
//     hasAllAccess || (Array.isArray(codes) && codes.some(code => can(code)));

//   const visibleBlocks = order
//     .map(id => messageBlocks.find(b => b.id === id))
//     .filter(Boolean)
//     .filter(b => (showArchived ? true : !archived.includes(b.id)))
//     .filter(b => canAny(PERM_BY_BLOCK[b.id] || []));

//   if (isLoading)
//     return (
//       <div className="p-10 text-center text-lg text-gray-500">
//         Loading features…
//       </div>
//     );

//   return (
//     <div className="p-6">
//       <div className="flex items-center justify-between mb-4">
//         <h2 className="text-2xl font-bold text-purple-800">
//           💬 Messaging Workspace
//         </h2>
//         <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
//           <input
//             type="checkbox"
//             checked={showArchived}
//             onChange={() => setShowArchived(!showArchived)}
//             className="accent-purple-600"
//           />
//           Show Archived
//         </label>
//       </div>

//       <DragDropContext onDragEnd={onDragEnd}>
//         <Droppable droppableId="messaging-blocks" direction="horizontal">
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

// // 📄 File: src/pages/Messaging/MessagingWorkspacePage.jsx

// import {
//   MessageSquareText,
//   Clock4,
//   ArrowRightCircle,
//   MoreVertical,
//   Archive,
//   Pin,
//   Send,
// } from "lucide-react";
// import { useNavigate } from "react-router-dom";
// import { useState } from "react";
// import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
// import { useAuth } from "../auth/context/pld_AuthContext";

// // 📦 All blocks with required feature keys
// const messageBlocks = [
//   {
//     id: "message-history",
//     label: "Message History",
//     description: "View all sent messages, delivery status, and logs.",
//     path: "/app/messaging/reporting/direct-message-history",
//     icon: <MessageSquareText className="text-purple-600" size={22} />,
//     action: "View Logs",
//     featureKey: "Messaging",
//   },
//   {
//     id: "status-logs",
//     label: "Status Logs",
//     description: "Track webhook delivery and read receipts from WhatsApp.",
//     path: "/app/messaging/status-logs",
//     icon: <Clock4 className="text-yellow-600" size={22} />,
//     action: "Open Status",
//     featureKey: "Messaging",
//   },
//   {
//     id: "open-chat",
//     label: "Live Chat Inbox",
//     description:
//       "Switch to a real-time inbox to manage and respond to conversations instantly.",
//     path: "/app/messaging/inboxwarpper",
//     icon: <MessageSquareText className="text-green-600" size={22} />,
//     action: "Live Chat",
//     featureKey: "Messaging",
//   },
//   {
//     id: "send-direct-text",
//     label: "Send Direct Message",
//     description: "Send plain text messages to one or multiple contacts.",
//     path: "/app/messaging/send-direct-text",
//     icon: <MessageSquareText className="text-purple-500" size={22} />,
//     action: "Send-Direct-Text",
//     featureKey: "Messaging",
//   },
//   {
//     id: "send-template-message",
//     label: "Send Template Message",
//     description:
//       "Send approved WhatsApp  (Text + button + Image) messages to contacts.",
//     path: "/app/messaging/send-template-simple",
//     icon: <MessageSquareText className="text-purple-500" size={22} />,
//     action: "Send-Template-Message",
//     featureKey: "Messaging",
//   },
//   {
//     id: "send-message",
//     label: "Send Message",
//     description: "Send a WhatsApp message directly to a contact or lead.",
//     path: "/app/messaging/send",
//     icon: <Send className="text-indigo-600" size={22} />,
//     action: "Send Now",
//     featureKey: "Messaging",
//   },
// ];

// export default function MessagingWorkspacePage() {
//   const navigate = useNavigate();
//   const { availableFeatures = {}, isLoading } = useAuth();

//   const [pinned, setPinned] = useState(
//     JSON.parse(localStorage.getItem("messaging-pinned") || "[]")
//   );
//   const [archived, setArchived] = useState(
//     JSON.parse(localStorage.getItem("messaging-archived") || "[]")
//   );
//   const [order, setOrder] = useState(
//     JSON.parse(localStorage.getItem("messaging-order")) ||
//       messageBlocks.map(b => b.id)
//   );
//   const [showArchived, setShowArchived] = useState(false);

//   const togglePin = id => {
//     const updated = pinned.includes(id)
//       ? pinned.filter(i => i !== id)
//       : [...pinned, id];
//     setPinned(updated);
//     localStorage.setItem("messaging-pinned", JSON.stringify(updated));
//   };

//   const toggleArchive = id => {
//     const updated = archived.includes(id)
//       ? archived.filter(i => i !== id)
//       : [...archived, id];
//     setArchived(updated);
//     localStorage.setItem("messaging-archived", JSON.stringify(updated));
//   };

//   const onDragEnd = result => {
//     if (!result.destination) return;
//     const newOrder = Array.from(order);
//     const [moved] = newOrder.splice(result.source.index, 1);
//     newOrder.splice(result.destination.index, 0, moved);
//     setOrder(newOrder);
//     localStorage.setItem("messaging-order", JSON.stringify(newOrder));
//   };

//   // 🟢 Only show blocks if Messaging is allowed (featureKey = Messaging)
//   const hasFeature = key => availableFeatures[key];

//   const visibleBlocks = order
//     .filter(id => {
//       const block = messageBlocks.find(b => b.id === id);
//       if (!block) return false;
//       if (!showArchived && archived.includes(id)) return false;
//       if (block.featureKey && !hasFeature(block.featureKey)) return false;
//       return true;
//     })
//     .map(id => messageBlocks.find(b => b.id === id));

//   if (isLoading)
//     return (
//       <div className="p-10 text-center text-lg text-gray-500">
//         Loading features…
//       </div>
//     );

//   return (
//     <div className="p-6">
//       <div className="flex items-center justify-between mb-4">
//         <h2 className="text-2xl font-bold text-purple-800">
//           💬 Messaging Workspace
//         </h2>
//         <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
//           <input
//             type="checkbox"
//             checked={showArchived}
//             onChange={() => setShowArchived(!showArchived)}
//             className="toggle toggle-sm toggle-purple"
//           />
//           Show Archived
//         </label>
//       </div>

//       <DragDropContext onDragEnd={onDragEnd}>
//         <Droppable droppableId="messaging-blocks" direction="horizontal">
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
