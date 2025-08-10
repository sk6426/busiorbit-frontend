// 📄 src/pages/Workspaces/CrmWorkspacePage.jsx

import {
  Archive,
  Pin,
  ArrowRightCircle,
  MoreVertical,
  UserCircle2,
  Tags,
  BellRing,
  Clock4,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { useAuth } from "../auth/context/AuthContext";

const crmBlocks = [
  {
    id: "contacts",
    label: "Contacts",
    description: "Central place to manage leads, customers, and their details.",
    path: "/app/crm/contacts",
    icon: <UserCircle2 className="text-purple-600" size={22} />,
    action: "Open Contacts",
  },
  {
    id: "tags",
    label: "Tags",
    description: "Organize and filter contacts using color-coded tags.",
    path: "/app/crm/tags",
    icon: <Tags className="text-yellow-500" size={22} />,
    action: "Manage Tags",
  },
  {
    id: "reminders",
    label: "Reminders",
    description: "Schedule follow-ups and set alerts to never miss a lead.",
    path: "/app/crm/reminders",
    icon: <BellRing className="text-blue-500" size={22} />,
    action: "View Reminders",
  },
  {
    id: "timeline",
    label: "Timeline",
    description: "Track every interaction and touchpoint with each contact.",
    path: "/app/crm/timeline",
    icon: <Clock4 className="text-green-600" size={22} />,
    action: "View Timeline",
    featureKey: "CRMInsights", // This must match backend
  },
];

export default function CrmWorkspacePage() {
  const navigate = useNavigate();
  const { availableFeatures = {}, isLoading, plan } = useAuth();

  const [pinned, setPinned] = useState(() =>
    JSON.parse(localStorage.getItem("crm-pinned") || "[]")
  );
  const [archived, setArchived] = useState(() =>
    JSON.parse(localStorage.getItem("crm-archived") || "[]")
  );
  const [order, setOrder] = useState(
    () =>
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

  // 🚩 Use featureKey to gate feature blocks
  const visibleBlocks = order
    .filter(id => {
      const block = crmBlocks.find(b => b.id === id);
      if (!block || archived.includes(id)) return false;
      if (block.featureKey && !availableFeatures[block.featureKey])
        return false;
      return true;
    })
    .map(id => crmBlocks.find(b => b.id === id));

  if (isLoading)
    return (
      <div className="p-10 text-center text-lg text-gray-500">
        Loading features…
      </div>
    );

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-purple-800 mb-4">
        🧠 CRM Workspace
      </h2>

      {plan === "basic" && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 mb-6 rounded-md shadow-sm">
          You’re on the <strong>Basic</strong> plan. Upgrade to use CRM
          timelines and get detailed history of contacts.{" "}
          <button
            onClick={() => navigate("/app/upgrade")}
            className="ml-3 text-purple-700 underline hover:text-purple-900 font-medium"
          >
            Upgrade Now
          </button>
        </div>
      )}

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="crm-blocks" direction="horizontal">
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
