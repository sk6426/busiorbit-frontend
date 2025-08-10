import {
  MessageCircleHeart,
  UserCog,
  Bot,
  ArrowRightCircle,
  MoreVertical,
  Archive,
  Pin,
  FileBarChart,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { useAuth } from "../auth/context/AuthContext";

// 🟢 Cards for the Automation (AutoReply) Workspace
const automationBlocks = [
  {
    id: "auto-reply-flows",
    label: "Auto Reply Flows",
    description:
      "View and manage all auto-reply flows (bots) for incoming WhatsApp messages.",
    path: "/app/automation/auto-reply-flows", // Dummy path, update later
    icon: <Bot className="text-indigo-600" size={22} />,
    action: "Manage Flows",
    featureKey: "Automation", // Use proper feature key if you want to protect
  },
  {
    id: "create-auto-reply",
    label: "Create Auto Reply Bot",
    description:
      "Design an automated bot to reply to specific keywords, triggers or contacts.",
    path: "/app/automation/auto-reply-builder", // Dummy path
    icon: <MessageCircleHeart className="text-purple-600" size={22} />,
    action: "Create Bot",
    featureKey: "Automation",
  },
  {
    id: "user-bot-assignments",
    label: "User–Bot Assignments",
    description: "Assign bots to specific users, teams, or business hours.",
    path: "/app/automation/bot-assignments", // Dummy path
    icon: <UserCog className="text-green-600" size={22} />,
    action: "Assign",
    featureKey: "Automation",
  },
  {
    id: "automation-analytics",
    label: "Automation Analytics",
    description: "Analyze response rates and auto-reply effectiveness.",
    path: "/app/automation/analytics", // Dummy path
    icon: <FileBarChart className="text-teal-600" size={22} />,
    action: "View Analytics",
    featureKey: "Automation",
  },
];

export default function AutomationWorkspace() {
  const navigate = useNavigate();
  const { availableFeatures = {}, isLoading } = useAuth();

  const [pinned, setPinned] = useState(() =>
    JSON.parse(localStorage.getItem("automation-pinned") || "[]")
  );
  const [archived, setArchived] = useState(() =>
    JSON.parse(localStorage.getItem("automation-archived") || "[]")
  );
  const [order, setOrder] = useState(
    () =>
      JSON.parse(localStorage.getItem("automation-order")) ||
      automationBlocks.map(b => b.id)
  );
  const [showArchived, setShowArchived] = useState(false);

  const togglePin = id => {
    const updated = pinned.includes(id)
      ? pinned.filter(i => i !== id)
      : [...pinned, id];
    setPinned(updated);
    localStorage.setItem("automation-pinned", JSON.stringify(updated));
  };

  const toggleArchive = id => {
    const updated = archived.includes(id)
      ? archived.filter(i => i !== id)
      : [...archived, id];
    setArchived(updated);
    localStorage.setItem("automation-archived", JSON.stringify(updated));
  };

  const onDragEnd = result => {
    if (!result.destination) return;
    const newOrder = Array.from(order);
    const [moved] = newOrder.splice(result.source.index, 1);
    newOrder.splice(result.destination.index, 0, moved);
    setOrder(newOrder);
    localStorage.setItem("automation-order", JSON.stringify(newOrder));
  };

  const hasFeature = key => availableFeatures[key];

  const visibleBlocks = order
    .filter(id => {
      const block = automationBlocks.find(b => b.id === id);
      if (!block) return false;
      if (!showArchived && archived.includes(id)) return false;
      if (block.featureKey && !hasFeature(block.featureKey)) return false;
      return true;
    })
    .map(id => automationBlocks.find(b => b.id === id));

  if (isLoading)
    return (
      <div className="p-10 text-center text-lg text-gray-500">
        Loading features…
      </div>
    );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-purple-800">
          🤖 Automation Workspace
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
        <Droppable droppableId="automation-blocks" direction="horizontal">
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
