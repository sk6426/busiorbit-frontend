// 📄 src/pages/Workspaces/InboxWorkspace.jsx

import {
  MessageSquareText,
  MoreVertical,
  Archive,
  Pin,
  ArrowRightCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

import { useAuth } from "../../app/providers/AuthProvider";
import { FK } from "../../capabilities/featureKeys";

// Map tiles → required permission(s)
const PERM_BY_BLOCK = {
  "inbox-view": [FK.INBOX_VIEW],
};

// Workspace tiles
const inboxBlocks = [
  {
    id: "inbox-view",
    label: "Live Chat Inbox",
    description:
      "Switch to a real-time inbox to manage and respond to conversations instantly.",
    path: "/app/inbox/inboxwarpper",
    icon: <MessageSquareText className="text-green-600" size={22} />,
    action: "Live Chat",
  },
];

export default function InboxWorkspace() {
  const navigate = useNavigate();
  const { isLoading, can, hasAllAccess } = useAuth();

  const [pinned, setPinned] = useState(
    JSON.parse(localStorage.getItem("inbox-pinned") || "[]")
  );
  const [archived, setArchived] = useState(
    JSON.parse(localStorage.getItem("inbox-archived") || "[]")
  );

  // Reconcile saved order with current block ids
  const allIds = useMemo(() => inboxBlocks.map(b => b.id), []);
  const storedOrder =
    JSON.parse(localStorage.getItem("inbox-order") || "null") || [];
  const initialOrder = useMemo(() => {
    if (!Array.isArray(storedOrder) || storedOrder.length === 0) return allIds;
    const known = storedOrder.filter(id => allIds.includes(id));
    const missing = allIds.filter(id => !known.includes(id));
    return [...known, ...missing];
  }, [allIds]); // eslint-disable-line react-hooks/exhaustive-deps

  const [order, setOrder] = useState(initialOrder);
  const [showArchived, setShowArchived] = useState(false);

  const togglePin = (e, id) => {
    e.stopPropagation();
    const updated = pinned.includes(id)
      ? pinned.filter(i => i !== id)
      : [...pinned, id];
    setPinned(updated);
    localStorage.setItem("inbox-pinned", JSON.stringify(updated));
  };

  const toggleArchive = (e, id) => {
    e.stopPropagation();
    const updated = archived.includes(id)
      ? archived.filter(i => i !== id)
      : [...archived, id];
    setArchived(updated);
    localStorage.setItem("inbox-archived", JSON.stringify(updated));
  };

  const onDragEnd = result => {
    if (!result.destination) return;
    const newOrder = Array.from(order);
    const [moved] = newOrder.splice(result.source.index, 1);
    newOrder.splice(result.destination.index, 0, moved);
    setOrder(newOrder);
    localStorage.setItem("inbox-order", JSON.stringify(newOrder));
  };

  const canAny = codes =>
    hasAllAccess || (codes || []).filter(Boolean).some(code => can(code));

  const visibleBlocks = order
    .map(id => inboxBlocks.find(b => b.id === id))
    .filter(Boolean)
    .filter(b => (showArchived ? true : !archived.includes(b.id)))
    .filter(b => canAny(PERM_BY_BLOCK[b.id]));

  if (isLoading)
    return (
      <div className="p-10 text-center text-lg text-gray-500">
        Loading inbox…
      </div>
    );

  return (
    <div className="p-6">
      {/* Sequential border animation (top→right→bottom→left) with gradient */}
      <style>{`
        @keyframes drawRight { from { transform: scaleX(0) } to { transform: scaleX(1) } }
        @keyframes drawDown  { from { transform: scaleY(0) } to { transform: scaleY(1) } }
        @keyframes drawLeft  { from { transform: scaleX(0) } to { transform: scaleX(1) } }
        @keyframes drawUp    { from { transform: scaleY(0) } to { transform: scaleY(1) } }

        .tile:hover .topline    { animation: drawRight .9s ease forwards; }
        .tile:hover .rightline  { animation: drawDown  .9s ease .18s forwards; }
        .tile:hover .bottomline { animation: drawLeft  .9s ease .36s forwards; }
        .tile:hover .leftline   { animation: drawUp    .9s ease .54s forwards; }
      `}</style>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-purple-800">
          📨 Inbox Workspace
        </h2>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={() => setShowArchived(!showArchived)}
            className="accent-purple-600"
          />
          Show Archived Tools
        </label>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="inbox-blocks" direction="horizontal">
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
                      role="button"
                      tabIndex={0}
                      aria-label={`${block.label}: ${block.action}`}
                      onKeyDown={e => {
                        if (e.key === "Enter") navigate(block.path);
                      }}
                      onClick={() => navigate(block.path)}
                      className="tile group relative overflow-hidden cursor-pointer bg-white rounded-md border shadow-sm hover:shadow-md transition transform hover:-translate-y-0.5 duration-200 focus:outline-none focus:ring-2 focus:ring-purple-300"
                      style={{ userSelect: "none" }}
                    >
                      {/* Animated border segments (gray → dark gray → very-light purple) */}
                      <span
                        aria-hidden
                        className="topline pointer-events-none absolute left-0 -top-[2px] h-[2px] w-full origin-left rounded opacity-0 group-hover:opacity-100"
                        style={{
                          background:
                            "linear-gradient(90deg, #6B7280, #374151, #F3E8FF)",
                          transform: "scaleX(0)",
                        }}
                      />
                      <span
                        aria-hidden
                        className="rightline pointer-events-none absolute right-0 -top-[2px] h-[calc(100%+4px)] w-[2px] origin-top rounded opacity-0 group-hover:opacity-100"
                        style={{
                          background:
                            "linear-gradient(180deg, #6B7280, #374151, #F3E8FF)",
                          transform: "scaleY(0)",
                        }}
                      />
                      <span
                        aria-hidden
                        className="bottomline pointer-events-none absolute left-0 -bottom-[2px] h-[2px] w-full origin-right rounded opacity-0 group-hover:opacity-100"
                        style={{
                          background:
                            "linear-gradient(270deg, #6B7280, #374151, #F3E8FF)",
                          transform: "scaleX(0)",
                        }}
                      />
                      <span
                        aria-hidden
                        className="leftline pointer-events-none absolute left-0 -top-[2px] h-[calc(100%+4px)] w-[2px] origin-bottom rounded opacity-0 group-hover:opacity-100"
                        style={{
                          background:
                            "linear-gradient(0deg, #6B7280, #374151, #F3E8FF)",
                          transform: "scaleY(0)",
                        }}
                      />

                      {/* Card content */}
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

                        {/* Kebab = drag handle (doesn't navigate) */}
                        <div
                          {...provided.dragHandleProps}
                          title="Drag to re-order"
                          className="ml-2 rounded p-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
                          onClick={e => e.stopPropagation()}
                        >
                          <MoreVertical size={16} />
                        </div>
                      </div>

                      <div className="px-5 py-3 border-t border-gray-200 flex items-center justify-between">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            navigate(block.path);
                          }}
                          className="text-sm text-purple-600 font-medium flex items-center gap-1 hover:text-purple-800"
                        >
                          {block.action} <ArrowRightCircle size={18} />
                        </button>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={e => togglePin(e, block.id)}
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
                            onClick={e => toggleArchive(e, block.id)}
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

// // 📄 src/pages/Workspaces/InboxWorkspace.jsx

// import {
//   MessageSquareText,
//   MoreVertical,
//   Archive,
//   Pin,
//   ArrowRightCircle,
// } from "lucide-react";
// import { useNavigate } from "react-router-dom";
// import { useMemo, useState } from "react";
// import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

// import { useAuth } from "../../app/providers/AuthProvider";
// import { FK } from "../../capabilities/featureKeys";

// // Map tiles → required permission(s)
// const PERM_BY_BLOCK = {
//   "inbox-view": [FK.INBOX_VIEW],
//   // open shared inbox
// };

// // Define the tiles in this workspace
// const inboxBlocks = [
//   // {
//   //   id: "open-inbox",
//   //   label: "Open Inbox",
//   //   description: "Shared WhatsApp inbox for your whole team.",
//   //   path: "/app/inbox", // your existing inbox route
//   //   icon: <Inbox className="text-purple-600" size={22} />,
//   //   action: "Go to Inbox",
//   // },

//   {
//     id: "inbox-view",
//     label: "Live Chat Inbox",
//     description:
//       "Switch to a real-time inbox to manage and respond to conversations instantly.",
//     // keep legacy typo route to match App.jsx
//     path: "/app/inbox/inboxwarpper",
//     icon: <MessageSquareText className="text-green-600" size={22} />,

//     action: "Live Chat",
//   },
// ];

// export default function InboxWorkspace() {
//   const navigate = useNavigate();
//   const { isLoading, can, hasAllAccess } = useAuth();

//   const [pinned, setPinned] = useState(
//     JSON.parse(localStorage.getItem("inbox-pinned") || "[]")
//   );
//   const [archived, setArchived] = useState(
//     JSON.parse(localStorage.getItem("inbox-archived") || "[]")
//   );

//   // Reconcile saved order with current block ids (so new tiles appear)
//   const allIds = useMemo(() => inboxBlocks.map(b => b.id), []);
//   const storedOrder =
//     JSON.parse(localStorage.getItem("inbox-order") || "null") || [];
//   const initialOrder = useMemo(() => {
//     if (!Array.isArray(storedOrder) || storedOrder.length === 0) return allIds;
//     const known = storedOrder.filter(id => allIds.includes(id));
//     const missing = allIds.filter(id => !known.includes(id));
//     return [...known, ...missing];
//   }, [allIds]); // eslint-disable-line react-hooks/exhaustive-deps

//   const [order, setOrder] = useState(initialOrder);
//   const [showArchived, setShowArchived] = useState(false);

//   const togglePin = id => {
//     const updated = pinned.includes(id)
//       ? pinned.filter(i => i !== id)
//       : [...pinned, id];
//     setPinned(updated);
//     localStorage.setItem("inbox-pinned", JSON.stringify(updated));
//   };

//   const toggleArchive = id => {
//     const updated = archived.includes(id)
//       ? archived.filter(i => i !== id)
//       : [...archived, id];
//     setArchived(updated);
//     localStorage.setItem("inbox-archived", JSON.stringify(updated));
//   };

//   const onDragEnd = result => {
//     if (!result.destination) return;
//     const newOrder = Array.from(order);
//     const [moved] = newOrder.splice(result.source.index, 1);
//     newOrder.splice(result.destination.index, 0, moved);
//     setOrder(newOrder);
//     localStorage.setItem("inbox-order", JSON.stringify(newOrder));
//   };

//   const canAny = codes =>
//     hasAllAccess || (codes || []).filter(Boolean).some(code => can(code));

//   const visibleBlocks = order
//     .map(id => inboxBlocks.find(b => b.id === id))
//     .filter(Boolean)
//     .filter(b => (showArchived ? true : !archived.includes(b.id)))
//     .filter(b => canAny(PERM_BY_BLOCK[b.id]));

//   if (isLoading)
//     return (
//       <div className="p-10 text-center text-lg text-gray-500">
//         Loading inbox…
//       </div>
//     );

//   return (
//     <div className="p-6">
//       <div className="flex justify-between items-center mb-4">
//         <h2 className="text-2xl font-bold text-purple-800">
//           📨 Inbox Workspace
//         </h2>
//         <label className="flex items-center gap-2 text-sm text-gray-700">
//           <input
//             type="checkbox"
//             checked={showArchived}
//             onChange={() => setShowArchived(!showArchived)}
//             className="accent-purple-600"
//           />
//           Show Archived Tools
//         </label>
//       </div>

//       <DragDropContext onDragEnd={onDragEnd}>
//         <Droppable droppableId="inbox-blocks" direction="horizontal">
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
