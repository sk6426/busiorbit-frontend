import React from "react";
import { MessageSquareText, FileText, Clock3, Tag } from "lucide-react"; // ✅ Icons

const nodeTypes = [
  { type: "message", label: "Send Message", icon: MessageSquareText },
  { type: "template", label: "Send Template", icon: FileText },
  { type: "wait", label: "Wait", icon: Clock3 },
  { type: "tag", label: "Set Tag", icon: Tag },
];

export default function AutoReplySidebar() {
  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <div className="space-y-3">
      {nodeTypes.map(node => {
        const Icon = node.icon;
        return (
          <div
            key={node.type}
            onDragStart={e => onDragStart(e, node.type)}
            draggable
            className="cursor-move flex items-center gap-3 px-4 py-2 rounded-lg border border-gray-300 bg-white hover:shadow-md hover:border-purple-500 transition-all"
          >
            <Icon size={18} className="text-purple-600" />
            <span className="text-sm font-medium text-gray-800">
              {node.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
