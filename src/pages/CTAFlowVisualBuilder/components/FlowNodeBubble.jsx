import React, { useEffect } from "react";
import { Handle, Position } from "@xyflow/react";
import { X } from "lucide-react";

export default function FlowNodeBubble({
  id,
  data,
  onDelete,
  readonly,
  onDataChange,
  visualDebug = false,
}) {
  const {
    templateName,
    messageBody,
    buttons = [],
    requiredTag,
    requiredSource,
    isUnreachable,
  } = data;

  useEffect(() => {
    if (buttons.length > 0 && onDataChange) {
      const triggerText = buttons[0]?.text || "";
      onDataChange({
        ...data,
        triggerButtonText: triggerText,
        triggerButtonType: "cta",
      });
    }
  }, [buttons, onDataChange, data]);

  return (
    <div className="bg-white shadow-md rounded-xl border border-purple-200 w-72 p-4 relative">
      {/* ❌ Delete button */}
      {!readonly && (
        <button
          onClick={() => onDelete(id)}
          className="absolute top-1.5 right-1.5 text-red-500 hover:text-red-700"
          title="Delete this step"
        >
          <X size={16} />
        </button>
      )}

      {/* ⚠️ Visual Warning */}
      {isUnreachable && (
        <div
          className="text-xs text-red-600 bg-red-100 px-2 py-0.5 rounded-full font-semibold mb-2 inline-block"
          title="This step has no incoming trigger. It may never run."
        >
          ⚠️ Unreachable Step
        </div>
      )}

      {/* 🧾 Node Header */}
      <div className="font-bold text-purple-700 mb-2">
        📦 {templateName || "Untitled Step"}
      </div>

      {/* 💬 Message Body */}
      <div className="text-sm text-gray-700 whitespace-pre-wrap mb-3">
        💬 {messageBody || "Message body preview..."}
      </div>

      {/* 🎯 Conditional badges */}
      <div className="flex flex-wrap gap-2 mb-2">
        {requiredTag && (
          <span
            className="bg-yellow-100 text-yellow-800 text-[10px] px-2 py-0.5 rounded-full font-semibold"
            title={`Only contacts with tag "${requiredTag}" will receive this step.`}
          >
            🎯 Tag: {requiredTag}
          </span>
        )}
        {requiredSource && (
          <span
            className="bg-purple-100 text-purple-800 text-[10px] px-2 py-0.5 rounded-full font-semibold"
            title={`This step runs only if Source = "${requiredSource}"`}
          >
            🔗 Source: {requiredSource}
          </span>
        )}
      </div>

      {/* 🔘 Buttons with output handles */}
      <div className="flex flex-col gap-2">
        {buttons.map((btn, index) => (
          <div
            key={index}
            className="bg-purple-100 text-purple-800 text-xs px-3 py-1 rounded shadow-sm text-center relative"
          >
            🔘 {btn.text || "Untitled Button"}
            <Handle
              type="source"
              position={Position.Right}
              id={btn.text}
              title={`Drag from: ${btn.text}`}
              style={{
                background: "#9333ea",
                top: "50%",
                transform: "translateY(-50%)",
                right: "-8px",
              }}
            />
          </div>
        ))}
      </div>

      {/* 🟣 Fallback output handle if no buttons */}
      {buttons.length === 0 && (
        <Handle
          type="source"
          position={Position.Bottom}
          id="default"
          style={{ background: "#9333ea" }}
        />
      )}

      {/* 🔵 Incoming connection target */}
      <Handle
        type="target"
        position={Position.Top}
        id="incoming"
        style={{ background: "#9333ea" }}
      />

      {/* 🧪 Visual Debug Info (no node ID) */}
      {visualDebug && (
        <div className="mt-3 text-[10px] text-gray-500">
          🔗 Connections:
          <ul className="list-disc ml-4">
            {buttons.map((btn, i) => (
              <li key={i}>
                {btn.text || "Unnamed"} →{" "}
                <strong>{btn.targetNodeId || "Not Connected"}</strong>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
