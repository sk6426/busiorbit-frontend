import React from "react";
import { Handle, Position } from "reactflow";

export default function AutoReplyNodeStart({ data }) {
  return (
    <div className="rounded-md border border-green-400 bg-green-100 px-4 py-2 w-60 shadow-sm text-zinc-800">
      {/* 🔗 Only Source Handle (no input for Start) */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: "#22c55e" }}
      />

      <div className="font-medium text-sm">✅ {data.label || "Start"}</div>
      <div className="text-xs text-zinc-600 mt-1">Flow begins here</div>
    </div>
  );
}
