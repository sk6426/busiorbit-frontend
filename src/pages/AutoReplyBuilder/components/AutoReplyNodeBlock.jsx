import React from "react";
import { Handle, Position } from "reactflow";

export default function AutoReplyNodeBlock({ data }) {
  const type = data.label;
  const config = data?.config || {};

  const labelMap = {
    message: "💬 Send Message",
    template: "🥰 Send Template",
    wait: "⏱ Wait",
    tag: "🏷 Set Tag",
  };

  const bgColorMap = {
    message: "border-blue-300 bg-blue-50",
    template: "border-purple-300 bg-purple-50",
    wait: "border-yellow-300 bg-yellow-50",
    tag: "border-pink-300 bg-pink-50",
  };

  const blockLabel = labelMap[type] || "🧱 Block";
  const blockStyle = bgColorMap[type] || "border-gray-300 bg-gray-50";

  const body = config.body || config.text || "";
  const buttons = Array.isArray(config.multiButtons) ? config.multiButtons : [];

  return (
    <div
      className={`relative group rounded-md border px-4 py-2 w-[280px] text-zinc-800 transition-all duration-200 ${blockStyle} hover:shadow-md hover:scale-[1.02]`}
    >
      {/* Connection handles */}
      {type !== "start" && (
        <Handle
          type="target"
          position={Position.Top}
          style={{ background: "#ccc" }}
        />
      )}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: "#ccc" }}
      />

      {/* Delete button */}
      {data?.onDelete && (
        <button
          onClick={e => {
            e.stopPropagation();
            data.onDelete(data.id);
          }}
          className="absolute top-1.5 right-2 text-xs text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition"
          title="Delete this block"
        >
          ✕
        </button>
      )}

      {/* Title + ID */}
      <div className="font-semibold text-base mb-1">{blockLabel}</div>
      <div className="text-xs text-purple-600 font-medium mb-1">
        {data.id || "Unnamed"}
      </div>

      {/* Body text - straight font */}
      {body && (
        <div className="text-xs text-zinc-700 mb-2 whitespace-pre-wrap">
          {body}
        </div>
      )}

      {/* Buttons */}
      {type === "template" && buttons.length > 0 && (
        <div className="flex flex-col gap-1">
          {buttons.map((btn, index) => (
            <div
              key={index}
              className="relative rounded bg-purple-100 px-2 py-1 text-xs text-purple-800 font-medium border border-purple-200 flex items-center justify-center text-center"
            >
              {btn.buttonText || btn.text || "(unnamed)"}

              <Handle
                type="source"
                position={Position.Right}
                id={`button-${index}`}
                style={{
                  top: "50%",
                  transform: "translateY(-50%)",
                  right: -6,
                  width: 8,
                  height: 8,
                  background: "#8b5cf6",
                  borderRadius: "50%",
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Tags */}
      {type === "tag" && config.tags?.length > 0 && (
        <div className="text-xs text-zinc-600 mt-1">
          Tags: {config.tags.join(", ")}
        </div>
      )}

      {/* Wait Time */}
      {type === "wait" && config.seconds && (
        <div className="text-xs text-zinc-600 mt-1">
          Wait for {config.seconds} seconds
        </div>
      )}
    </div>
  );
}
