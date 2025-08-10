// 📄 File: src/pages/CTAFlowBuilder/FlowArrowLayer.jsx
import React, { useEffect, useRef, useState } from "react";

export default function FlowArrowLayer({ steps }) {
  const containerRef = useRef(null);
  const [positions, setPositions] = useState({});

  useEffect(() => {
    const pos = {};
    steps.forEach(step => {
      const el = document.getElementById(`step-card-${step.id}`);
      if (el) {
        const rect = el.getBoundingClientRect();
        const containerRect = containerRef.current?.getBoundingClientRect();
        pos[step.id] = {
          x: rect.right - containerRect.left,
          y: rect.top + rect.height / 2 - containerRect.top,
        };
      }
    });
    setPositions(pos);
  }, [steps]);

  const arrows = steps.flatMap(step => {
    const from = positions[step.id];
    if (!from || !step.buttonLinks) return [];
    return step.buttonLinks
      .filter(link => link.NextStepId && positions[link.NextStepId])
      .map(link => {
        const to = positions[link.NextStepId];
        return (
          <line
            key={`${step.id}-${link.ButtonText}`}
            x1={from.x}
            y1={from.y}
            x2={to.x - 20}
            y2={to.y}
            stroke="#4B5563"
            strokeWidth="2"
            markerEnd="url(#arrowhead)"
            className="pulse"
            style={{
              strokeDasharray: 100,
              strokeDashoffset: 100,
              animation:
                "drawArrow 0.6s ease forwards, pulseArrow 1.6s ease-in-out infinite",
            }}
          >
            <title>{`Button: ${link.ButtonText}`}</title>
          </line>
        );
      });
  });

  return (
    <div
      ref={containerRef}
      className="absolute top-0 left-0 w-full h-full pointer-events-none z-0"
    >
      <style>{`
        @keyframes drawArrow {
          to {
            stroke-dashoffset: 0;
          }
        }
        @keyframes pulseArrow {
          0% { stroke-opacity: 1; }
          50% { stroke-opacity: 0.6; }
          100% { stroke-opacity: 1; }
        }
        svg line:hover {
          stroke: #3b82f6;
          stroke-width: 3;
        }
      `}</style>
      <svg className="w-full h-full">
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="0"
            refY="3.5"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#4B5563" />
          </marker>
        </defs>
        {arrows}
      </svg>
    </div>
  );
}
