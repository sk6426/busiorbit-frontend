// 📄 src/pages/CTAFlowBuilder/VisualFlowPreview.jsx
import React from "react";
import { ReactFlow, Background, Controls } from "@xyflow/react";
import "@xyflow/react/dist/style.css"; // ✅ keep this

const VisualFlowPreview = ({ steps }) => {
  if (!steps || steps.length === 0) return null;

  const nodes = steps.map((step, index) => ({
    id: step.stepOrder.toString(),
    data: {
      label: `${step.buttonText || "Step"} → ${step.templateName}`,
    },
    position: { x: 150, y: index * 120 },
    style: {
      border: "1px solid #9333ea",
      borderRadius: "12px",
      padding: "8px",
      background: "#f3f4f6",
      color: "#111827",
    },
  }));

  const nodeMap = Object.fromEntries(
    steps.map((s, i) => [
      s.id || `step-${i + 1}`,
      (s.stepOrder || i + 1).toString(),
    ])
  );

  const edges = steps
    .filter(s => s.nextStepId)
    .map(s => {
      const sourceId = nodeMap[s.id];
      const targetId = nodeMap[s.nextStepId];
      return {
        id: `e-${sourceId}-${targetId}`,
        source: sourceId,
        target: targetId,
        animated: true,
        style: { stroke: "#6366f1" },
      };
    });

  return (
    <div className="h-[400px] border rounded-md shadow mt-6">
      <ReactFlow nodes={nodes} edges={edges} fitView>
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
};

export default VisualFlowPreview;
