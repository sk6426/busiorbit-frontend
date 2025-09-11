import React, {
  useCallback,
  useState,
  useEffect,
  useMemo,
  useRef,
} from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
  ConnectionMode,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Eye, Minus } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import TemplatePickerModal from "./components/TemplatePickerModal";
import FlowNodeBubble from "./components/FlowNodeBubble";
import { saveVisualFlow, getVisualFlowById } from "./ctaFlowVisualApi";
import { v4 as uuidv4 } from "uuid";
import { toast } from "react-toastify";
import dagre from "dagre";

// NEW: custom edge that flips label vertically when space is tight
import SmartLabeledEdge from "./components/edges/SmartLabeledEdge";

const GRID = 16;
const NODE_DEFAULT = { width: 260, height: 140 }; // safe defaults for dagre when sizes are unknown

function CTAFlowVisualBuilderInner() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const nodesRef = useRef([]);
  const [showPicker, setShowPicker] = useState(false);
  const [flowName, setFlowName] = useState("");
  const flowNameRef = useRef(null);
  const [showMiniMap, setShowMiniMap] = useState(false);
  const [readonly, setReadonly] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { fitView, zoomIn, zoomOut } = useReactFlow();
  const mode = searchParams.get("mode");
  const flowId = searchParams.get("id");
  const visualDebug = true;

  useEffect(() => {
    nodesRef.current = [...nodes];
  }, [nodes]);

  // -------- Node helpers --------
  const handleDeleteNode = useCallback(
    nodeId => {
      if (readonly) return;
      setNodes(nds => nds.filter(n => n.id !== nodeId));
      setEdges(eds =>
        eds.filter(e => e.source !== nodeId && e.target !== nodeId)
      );
    },
    [readonly, setNodes, setEdges]
  );

  const handleNodeDataChange = useCallback(
    (nodeId, newData) => {
      setNodes(nds =>
        nds.map(n =>
          n.id === nodeId ? { ...n, data: { ...n.data, ...newData } } : n
        )
      );
    },
    [setNodes]
  );

  const nodeTypes = useMemo(
    () => ({
      customBubble: props => (
        <FlowNodeBubble
          {...props}
          onDelete={handleDeleteNode}
          onDataChange={newData => handleNodeDataChange(props.id, newData)}
          readonly={readonly}
          visualDebug={visualDebug}
        />
      ),
    }),
    [handleDeleteNode, readonly, visualDebug, handleNodeDataChange]
  );

  // NEW: register custom edge
  const edgeTypes = useMemo(() => ({ smart: SmartLabeledEdge }), []);

  // -------- Load / Bootstrap --------
  useEffect(() => {
    const load = async () => {
      if (mode === "edit" || mode === "view") {
        try {
          const data = await getVisualFlowById(flowId);

          const builtNodes = (data.nodes || []).map((node, index) => ({
            id: node.id,
            type: "customBubble",
            position: {
              x: node.positionX ?? 120 + index * 120,
              y: node.positionY ?? 150 + (index % 5) * 60,
            },
            data: {
              templateName: node.templateName,
              templateType: node.templateType,
              messageBody: node.messageBody,
              triggerButtonText: node.triggerButtonText || "",
              triggerButtonType: node.triggerButtonType || "cta",
              requiredTag: node.requiredTag || "",
              requiredSource: node.requiredSource || "",
              buttons: (node.buttons || []).map((btn, i) => ({
                text: btn.text,
                type: btn.type,
                subType: btn.subType,
                value: btn.value,
                targetNodeId: btn.targetNodeId || null,
                index: typeof btn.index === "number" ? btn.index : i,
              })),
            },
          }));

          const builtEdges = (data.edges || []).map(edge => ({
            id: `e-${edge.fromNodeId}-${edge.toNodeId}-${
              edge.sourceHandle || "h"
            }`,
            source: edge.fromNodeId,
            target: edge.toNodeId,
            sourceHandle: edge.sourceHandle || null, // equals button text
            type: "smart", // <-- use custom edge
            animated: true,
            style: { stroke: "#9333ea" },
            markerEnd: { type: MarkerType.ArrowClosed, color: "#9333ea" },
            label: edge.sourceHandle || "", // show button text on edge
          }));

          const nodesWithIncoming = new Set(builtEdges.map(e => e.target));
          const nodesWithWarnings = builtNodes.map(node => ({
            ...node,
            data: {
              ...node.data,
              isUnreachable: false,
              hasNoIncoming: !nodesWithIncoming.has(node.id),
            },
          }));

          setNodes(nodesWithWarnings);
          setEdges(builtEdges);
          setFlowName(data.flowName || "Untitled Flow");
          if (mode === "view") setReadonly(true);

          setTimeout(() => fitView({ padding: 0.2 }), 50);
        } catch {
          toast.error("❌ Failed to load flow");
        }
      } else {
        setNodes([]);
        setEdges([]);
        setFlowName("Untitled Flow");
        setReadonly(false);
        setTimeout(() => fitView({ padding: 0.2 }), 50);
      }
    };

    load();
  }, [flowId, mode, setNodes, setEdges, fitView]);

  // -------- Template add --------
  const handleTemplateSelect = ({ name, type, body, buttons = [] }) => {
    const id = uuidv4();
    const newNode = {
      id,
      position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
      type: "customBubble",
      data: {
        templateName: name || "Untitled",
        templateType: type || "text_template",
        messageBody: body || "Message body preview...",
        triggerButtonText: buttons[0]?.text || "",
        triggerButtonType: "cta",
        buttons: buttons.map((btn, idx) => ({
          text: btn.text || "",
          type: btn.type || "QUICK_REPLY",
          subType: btn.subType || "",
          value: btn.parameterValue || "",
          targetNodeId: null,
          index: idx,
        })),
      },
    };
    setNodes(nds => [...nds, newNode]);
    setShowPicker(false);
    toast.success(
      `✅ Step added with ${type?.replace("_", " ") || "template"}`
    );
    setTimeout(() => fitView({ padding: 0.2 }), 50);
  };

  // -------- Connection policy (pro-grade) --------
  const isValidConnection = useCallback(
    params => {
      if (!params?.source || !params?.sourceHandle) return false; // require handle→handle
      // Only one edge per (source, sourceHandle)
      const duplicate = edges.some(
        e =>
          e.source === params.source && e.sourceHandle === params.sourceHandle
      );
      return !duplicate;
    },
    [edges]
  );

  const onConnect = useCallback(
    params => {
      if (readonly) return;

      const label = params.sourceHandle || "";

      // Visual edge (custom)
      setEdges(eds =>
        addEdge(
          {
            ...params,
            id: uuidv4(),
            type: "smart",
            animated: true,
            style: { stroke: "#9333ea" },
            markerEnd: { type: MarkerType.ArrowClosed, color: "#9333ea" },
            label,
          },
          eds
        )
      );

      // Semantic link: tie edge to the specific button on source node
      setNodes(nds =>
        nds.map(node => {
          if (node.id !== params.source) return node;

          const sourceHandle = params.sourceHandle || "";
          let updatedButtons = [...(node.data.buttons || [])];

          const idxByHandle = updatedButtons.findIndex(
            b =>
              (b.text || "").toLowerCase().trim() ===
              sourceHandle.toLowerCase().trim()
          );

          if (idxByHandle >= 0) {
            updatedButtons[idxByHandle] = {
              ...updatedButtons[idxByHandle],
              targetNodeId: params.target,
            };
          } else {
            const idxFirstUnlinked = updatedButtons.findIndex(
              b => !b.targetNodeId
            );
            if (idxFirstUnlinked >= 0) {
              updatedButtons[idxFirstUnlinked] = {
                ...updatedButtons[idxFirstUnlinked],
                targetNodeId: params.target,
              };
            }
          }
          return { ...node, data: { ...node.data, buttons: updatedButtons } };
        })
      );
    },
    [readonly, setEdges, setNodes]
  );

  // -------- Keyboard UX --------
  useEffect(() => {
    const onKey = e => {
      if (readonly) return;
      if (e.key === "Delete" || e.key === "Backspace") {
        setNodes(nds => nds.filter(n => !n.selected));
        setEdges(eds => eds.filter(ed => !ed.selected));
      }
      if (e.key === "Escape") {
        setNodes(nds => nds.map(n => ({ ...n, selected: false })));
        setEdges(eds => eds.map(ed => ({ ...ed, selected: false })));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [readonly, setNodes, setEdges]);

  // -------- Auto-layout (dagre) --------
  const applyLayout = useCallback(
    (direction = "LR") => {
      const g = new dagre.graphlib.Graph();
      g.setGraph({
        rankdir: direction, // LR (left->right) or TB (top->bottom)
        nodesep: 50,
        ranksep: 90,
        marginx: 20,
        marginy: 20,
      });
      g.setDefaultEdgeLabel(() => ({}));

      nodes.forEach(n => {
        const width = n?.measured?.width || NODE_DEFAULT.width;
        const height = n?.measured?.height || NODE_DEFAULT.height;
        g.setNode(n.id, { width, height });
      });
      edges.forEach(e => g.setEdge(e.source, e.target));

      dagre.layout(g);

      const laidOut = nodes.map(n => {
        const { x, y } = g.node(n.id);
        const width = n?.measured?.width || NODE_DEFAULT.width;
        const height = n?.measured?.height || NODE_DEFAULT.height;
        return {
          ...n,
          position: { x: x - width / 2, y: y - height / 2 },
        };
      });

      setNodes(laidOut);
      setTimeout(() => fitView({ padding: 0.2 }), 50);
    },
    [nodes, edges, setNodes, fitView]
  );

  // -------- Save --------
  const handleSave = async isPublished => {
    try {
      const transformedNodes = nodes
        .filter(n => n?.data?.templateName)
        .map(node => ({
          Id: node.id || uuidv4(),
          TemplateName: node?.data?.templateName || "Untitled",
          TemplateType: node?.data?.templateType || "text_template",
          MessageBody: node?.data?.messageBody || "",
          PositionX: node.position?.x || 0,
          PositionY: node.position?.y || 0,
          TriggerButtonText: node?.data?.triggerButtonText || "",
          TriggerButtonType: node?.data?.triggerButtonType || "cta",
          RequiredTag: node?.data?.requiredTag || "",
          RequiredSource: node?.data?.requiredSource || "",
          Buttons: (node?.data?.buttons || [])
            .filter(btn => (btn.text || "").trim().length > 0)
            .map((btn, idx) => ({
              Text: (btn.text || "").trim(),
              Type: btn.type || "QUICK_REPLY",
              SubType: btn.subType || "",
              Value: btn.value || "",
              TargetNodeId: btn.targetNodeId || null,
              Index: typeof btn.index === "number" ? btn.index : idx,
            })),
        }));

      const transformedEdges = edges.map(edge => ({
        FromNodeId: edge.source,
        ToNodeId: edge.target,
        SourceHandle: edge.sourceHandle || "",
      }));

      const payload = {
        FlowName: flowName || "Untitled",
        IsPublished: isPublished ?? false,
        Nodes: transformedNodes,
        Edges: transformedEdges,
      };

      console.log("📤 Final Payload to POST:", payload);
      await saveVisualFlow(payload);
      toast.success("✅ Flow saved successfully");
    } catch (error) {
      console.error("❌ Save flow failed: ", error);
      toast.error("❌ Failed to save flow");
    }
  };

  // -------- Default edge appearance --------
  const defaultEdgeOptions = useMemo(
    () => ({
      type: "smart", // <-- use custom smart edge by default
      animated: true,
      style: { stroke: "#9333ea" },
      markerEnd: { type: MarkerType.ArrowClosed, color: "#9333ea" },
    }),
    []
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-purple-700">
          🧠 CTA Flow Visual Builder
        </h2>

        {!readonly && (
          <div className="flex items-center gap-2 flex-wrap">
            <input
              id="flowName"
              name="flowName"
              ref={flowNameRef}
              value={flowName}
              onChange={e => setFlowName(e.target.value)}
              placeholder="Add flow name"
              className="border border-gray-300 px-3 py-2 rounded-md shadow-sm text-sm"
            />
            <button
              onClick={() => setShowPicker(true)}
              className="bg-purple-600 text-white px-4 py-2 rounded shadow hover:bg-purple-700 text-sm"
            >
              ➕ Add Step
            </button>
            <button
              onClick={() => navigate("/app/cta-flow/flow-manager")}
              className="bg-white border border-purple-600 text-purple-700 font-medium text-sm px-4 py-2 rounded-md shadow-sm hover:bg-purple-50"
            >
              ↩️ Manage All Flows
            </button>
          </div>
        )}
      </div>

      {/* Canvas */}
      <div className="h-[70vh] border rounded-xl bg-gray-50 relative">
        {/* Minimap + tools */}
        <div className="absolute bottom-5 right-4 z-50 flex gap-2">
          <button
            onClick={() => setShowMiniMap(prev => !prev)}
            className="bg-purple-600 text-white p-2 rounded-full shadow hover:bg-purple-700"
            title={showMiniMap ? "Hide MiniMap" : "Show MiniMap"}
          >
            {showMiniMap ? <Minus size={15} /> : <Eye size={15} />}
          </button>

          <div className="flex items-center gap-2 bg-white/90 px-2 py-1 rounded-full border">
            <button
              onClick={() => fitView({ padding: 0.2 })}
              className="text-xs px-2 py-1 rounded hover:bg-gray-100"
              title="Fit"
            >
              Fit
            </button>
            <button
              onClick={() => zoomIn()}
              className="text-xs px-2 py-1 rounded hover:bg-gray-100"
              title="Zoom In"
            >
              +
            </button>
            <button
              onClick={() => zoomOut()}
              className="text-xs px-2 py-1 rounded hover:bg-gray-100"
              title="Zoom Out"
            >
              −
            </button>
            {!readonly && (
              <>
                <button
                  onClick={() => applyLayout("LR")}
                  className="text-xs px-2 py-1 rounded hover:bg-gray-100"
                  title="Auto-layout (Left→Right)"
                >
                  Auto LR
                </button>
                <button
                  onClick={() => applyLayout("TB")}
                  className="text-xs px-2 py-1 rounded hover:bg-gray-100"
                  title="Auto-layout (Top→Bottom)"
                >
                  Auto TB
                </button>
              </>
            )}
          </div>
        </div>

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onEdgeClick={(e, edge) => {
            if (!readonly) setEdges(eds => eds.filter(ed => ed.id !== edge.id));
          }}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes} // <-- register custom edge
          fitView
          fitViewOptions={{ padding: 0.2 }}
          defaultEdgeOptions={defaultEdgeOptions}
          connectionMode={ConnectionMode.Strict}
          isValidConnection={isValidConnection}
          snapToGrid
          snapGrid={[GRID, GRID]}
          panOnScroll
          zoomOnPinch
          panOnDrag={[1, 2]}
          selectionOnDrag
          nodesDraggable={!readonly}
          nodesConnectable={!readonly}
          elementsSelectable={!readonly}
        >
          {showMiniMap && (
            <MiniMap
              nodeColor="#9333ea"
              nodeStrokeWidth={2}
              maskColor="rgba(255,255,255,0.6)"
            />
          )}
          <Controls />
          <Background variant="dots" gap={GRID} size={1} />
        </ReactFlow>
      </div>

      {/* Footer actions */}
      {!readonly && (
        <div className="mt-6 flex gap-4">
          <button
            onClick={() => handleSave(false)}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 text-sm"
          >
            💾 Save Draft
          </button>
          <button
            onClick={() => handleSave(true)}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm"
          >
            🚀 Publish Flow
          </button>
        </div>
      )}

      <TemplatePickerModal
        open={showPicker}
        onClose={() => setShowPicker(false)}
        onSelect={handleTemplateSelect}
      />
    </div>
  );
}

export default function CTAFlowVisualBuilder() {
  return (
    <ReactFlowProvider>
      <CTAFlowVisualBuilderInner />
    </ReactFlowProvider>
  );
}

// import React, {
//   useCallback,
//   useState,
//   useEffect,
//   useMemo,
//   useRef,
// } from "react";
// import {
//   ReactFlow,
//   ReactFlowProvider,
//   Background,
//   Controls,
//   MiniMap,
//   useNodesState,
//   useEdgesState,
//   addEdge,
//   MarkerType,
//   ConnectionMode,
//   useReactFlow,
// } from "@xyflow/react";
// import "@xyflow/react/dist/style.css";
// import { Eye, Minus } from "lucide-react";
// import { useSearchParams, useNavigate } from "react-router-dom";
// import TemplatePickerModal from "./components/TemplatePickerModal";
// import FlowNodeBubble from "./components/FlowNodeBubble";
// import { saveVisualFlow, getVisualFlowById } from "./ctaFlowVisualApi";
// import { v4 as uuidv4 } from "uuid";
// import { toast } from "react-toastify";
// import dagre from "dagre";

// const GRID = 16;
// const NODE_DEFAULT = { width: 260, height: 140 }; // safe defaults for dagre when sizes are unknown

// function CTAFlowVisualBuilderInner() {
//   const [nodes, setNodes, onNodesChange] = useNodesState([]);
//   const [edges, setEdges, onEdgesChange] = useEdgesState([]);
//   const nodesRef = useRef([]);
//   const [showPicker, setShowPicker] = useState(false);
//   const [flowName, setFlowName] = useState("");
//   const flowNameRef = useRef(null);
//   const [showMiniMap, setShowMiniMap] = useState(false);
//   const [readonly, setReadonly] = useState(false);
//   const [searchParams] = useSearchParams();
//   const navigate = useNavigate();
//   const { fitView, zoomIn, zoomOut } = useReactFlow();
//   const mode = searchParams.get("mode");
//   const flowId = searchParams.get("id");
//   const visualDebug = true;

//   useEffect(() => {
//     nodesRef.current = [...nodes];
//   }, [nodes]);

//   // -------- Node helpers --------
//   const handleDeleteNode = useCallback(
//     nodeId => {
//       if (readonly) return;
//       setNodes(nds => nds.filter(n => n.id !== nodeId));
//       setEdges(eds =>
//         eds.filter(e => e.source !== nodeId && e.target !== nodeId)
//       );
//     },
//     [readonly, setNodes, setEdges]
//   );

//   const handleNodeDataChange = useCallback(
//     (nodeId, newData) => {
//       setNodes(nds =>
//         nds.map(n =>
//           n.id === nodeId ? { ...n, data: { ...n.data, ...newData } } : n
//         )
//       );
//     },
//     [setNodes]
//   );

//   const nodeTypes = useMemo(
//     () => ({
//       customBubble: props => (
//         <FlowNodeBubble
//           {...props}
//           onDelete={handleDeleteNode}
//           onDataChange={newData => handleNodeDataChange(props.id, newData)}
//           readonly={readonly}
//           visualDebug={visualDebug}
//         />
//       ),
//     }),
//     [handleDeleteNode, readonly, visualDebug, handleNodeDataChange]
//   );

//   // -------- Load / Bootstrap --------
//   useEffect(() => {
//     const load = async () => {
//       if (mode === "edit" || mode === "view") {
//         try {
//           const data = await getVisualFlowById(flowId);

//           const builtNodes = (data.nodes || []).map((node, index) => ({
//             id: node.id,
//             type: "customBubble",
//             position: {
//               x: node.positionX ?? 120 + index * 120,
//               y: node.positionY ?? 150 + (index % 5) * 60,
//             },
//             data: {
//               templateName: node.templateName,
//               templateType: node.templateType,
//               messageBody: node.messageBody,
//               triggerButtonText: node.triggerButtonText || "",
//               triggerButtonType: node.triggerButtonType || "cta",
//               requiredTag: node.requiredTag || "",
//               requiredSource: node.requiredSource || "",
//               // keep button order and include index if backend returned one
//               buttons: (node.buttons || []).map((btn, i) => ({
//                 text: btn.text,
//                 type: btn.type,
//                 subType: btn.subType,
//                 value: btn.value,
//                 targetNodeId: btn.targetNodeId || null,
//                 index: typeof btn.index === "number" ? btn.index : i,
//               })),
//             },
//           }));

//           const builtEdges = (data.edges || []).map(edge => ({
//             id: `e-${edge.fromNodeId}-${edge.toNodeId}-${
//               edge.sourceHandle || "h"
//             }`,
//             source: edge.fromNodeId,
//             target: edge.toNodeId,
//             sourceHandle: edge.sourceHandle || null, // equals button text
//             type: "smoothstep",
//             animated: true,
//             style: { stroke: "#9333ea" },
//             markerEnd: { type: MarkerType.ArrowClosed, color: "#9333ea" },
//             label: edge.sourceHandle || "", // <— show button text on edge
//             labelStyle: { fontSize: 10, fill: "#4b5563" },
//             labelBgPadding: [4, 2],
//             labelBgBorderRadius: 4,
//             labelBgStyle: { fill: "#ffffff" },
//           }));

//           // Informational flag
//           const nodesWithIncoming = new Set(builtEdges.map(e => e.target));
//           const nodesWithWarnings = builtNodes.map(node => ({
//             ...node,
//             data: {
//               ...node.data,
//               isUnreachable: false,
//               hasNoIncoming: !nodesWithIncoming.has(node.id),
//             },
//           }));

//           setNodes(nodesWithWarnings);
//           setEdges(builtEdges);
//           setFlowName(data.flowName || "Untitled Flow");
//           if (mode === "view") setReadonly(true);

//           // Fit after initial load
//           setTimeout(() => fitView({ padding: 0.2 }), 50);
//         } catch {
//           toast.error("❌ Failed to load flow");
//         }
//       } else {
//         setNodes([]);
//         setEdges([]);
//         setFlowName("Untitled Flow");
//         setReadonly(false);
//         setTimeout(() => fitView({ padding: 0.2 }), 50);
//       }
//     };

//     load();
//   }, [flowId, mode, setNodes, setEdges, fitView]);

//   // -------- Template add --------
//   const handleTemplateSelect = ({ name, type, body, buttons = [] }) => {
//     const id = uuidv4();
//     const newNode = {
//       id,
//       position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
//       type: "customBubble",
//       data: {
//         templateName: name || "Untitled",
//         templateType: type || "text_template",
//         messageBody: body || "Message body preview...",
//         triggerButtonText: buttons[0]?.text || "",
//         triggerButtonType: "cta",
//         buttons: buttons.map((btn, idx) => ({
//           text: btn.text || "",
//           type: btn.type || "QUICK_REPLY",
//           subType: btn.subType || "",
//           value: btn.parameterValue || "",
//           targetNodeId: null,
//           index: idx,
//         })),
//       },
//     };
//     setNodes(nds => [...nds, newNode]);
//     setShowPicker(false);
//     toast.success(
//       `✅ Step added with ${type?.replace("_", " ") || "template"}`
//     );
//     setTimeout(() => fitView({ padding: 0.2 }), 50);
//   };

//   // -------- Connection policy (pro-grade) --------
//   const isValidConnection = useCallback(
//     params => {
//       // Only one edge per (source, sourceHandle)
//       if (!params?.source || !params?.sourceHandle) return false;
//       const duplicate = edges.some(
//         e =>
//           e.source === params.source && e.sourceHandle === params.sourceHandle
//       );
//       return !duplicate;
//     },
//     [edges]
//   );

//   const onConnect = useCallback(
//     params => {
//       if (readonly) return;

//       // Label the edge with the handle (button text)
//       const label = params.sourceHandle || "";

//       // Visual edge
//       setEdges(eds =>
//         addEdge(
//           {
//             ...params,
//             id: uuidv4(),
//             type: "smoothstep",
//             animated: true,
//             style: { stroke: "#9333ea" },
//             markerEnd: { type: MarkerType.ArrowClosed, color: "#9333ea" },
//             label,
//             labelStyle: { fontSize: 10, fill: "#4b5563" },
//             labelBgPadding: [4, 2],
//             labelBgBorderRadius: 4,
//             labelBgStyle: { fill: "#ffffff" },
//           },
//           eds
//         )
//       );

//       // Semantic link: tie edge to the specific button on source node
//       setNodes(nds =>
//         nds.map(node => {
//           if (node.id !== params.source) return node;

//           const sourceHandle = params.sourceHandle || "";
//           let updatedButtons = [...(node.data.buttons || [])];

//           // Find the button matching the handle (by text)
//           const idxByHandle = updatedButtons.findIndex(
//             b =>
//               (b.text || "").toLowerCase().trim() ===
//               sourceHandle.toLowerCase().trim()
//           );

//           if (idxByHandle >= 0) {
//             updatedButtons[idxByHandle] = {
//               ...updatedButtons[idxByHandle],
//               targetNodeId: params.target,
//             };
//           } else {
//             // Fallback: link the first unlinked button
//             const idxFirstUnlinked = updatedButtons.findIndex(
//               b => !b.targetNodeId
//             );
//             if (idxFirstUnlinked >= 0) {
//               updatedButtons[idxFirstUnlinked] = {
//                 ...updatedButtons[idxFirstUnlinked],
//                 targetNodeId: params.target,
//               };
//             }
//           }
//           return { ...node, data: { ...node.data, buttons: updatedButtons } };
//         })
//       );
//     },
//     [readonly, setEdges, setNodes]
//   );

//   // -------- Keyboard UX --------
//   useEffect(() => {
//     const onKey = e => {
//       if (readonly) return;
//       if (e.key === "Delete" || e.key === "Backspace") {
//         setNodes(nds => nds.filter(n => !n.selected));
//         setEdges(eds => eds.filter(ed => !ed.selected));
//       }
//       if (e.key === "Escape") {
//         setNodes(nds => nds.map(n => ({ ...n, selected: false })));
//         setEdges(eds => eds.map(ed => ({ ...ed, selected: false })));
//       }
//     };
//     window.addEventListener("keydown", onKey);
//     return () => window.removeEventListener("keydown", onKey);
//   }, [readonly, setNodes, setEdges]);

//   // -------- Auto-layout (dagre) --------
//   const applyLayout = useCallback(
//     (direction = "LR") => {
//       const g = new dagre.graphlib.Graph();
//       g.setGraph({
//         rankdir: direction, // LR (left->right) or TB (top->bottom)
//         nodesep: 50,
//         ranksep: 90,
//         marginx: 20,
//         marginy: 20,
//       });
//       g.setDefaultEdgeLabel(() => ({}));

//       // seed nodes with approx size
//       nodes.forEach(n => {
//         const width = n?.measured?.width || NODE_DEFAULT.width;
//         const height = n?.measured?.height || NODE_DEFAULT.height;
//         g.setNode(n.id, { width, height });
//       });
//       edges.forEach(e => g.setEdge(e.source, e.target));

//       dagre.layout(g);

//       const laidOut = nodes.map(n => {
//         const { x, y } = g.node(n.id);
//         const width = n?.measured?.width || NODE_DEFAULT.width;
//         const height = n?.measured?.height || NODE_DEFAULT.height;
//         return {
//           ...n,
//           position: { x: x - width / 2, y: y - height / 2 },
//         };
//       });

//       setNodes(laidOut);
//       setTimeout(() => fitView({ padding: 0.2 }), 50);
//     },
//     [nodes, edges, setNodes, fitView]
//   );

//   // -------- Save --------
//   const handleSave = async isPublished => {
//     try {
//       // Transform nodes with stable Index per button
//       const transformedNodes = nodes
//         .filter(n => n?.data?.templateName)
//         .map(node => ({
//           Id: node.id || uuidv4(),
//           TemplateName: node?.data?.templateName || "Untitled",
//           TemplateType: node?.data?.templateType || "text_template",
//           MessageBody: node?.data?.messageBody || "",
//           PositionX: node.position?.x || 0,
//           PositionY: node.position?.y || 0,
//           TriggerButtonText: node?.data?.triggerButtonText || "",
//           TriggerButtonType: node?.data?.triggerButtonType || "cta",
//           RequiredTag: node?.data?.requiredTag || "",
//           RequiredSource: node?.data?.requiredSource || "",
//           Buttons: (node?.data?.buttons || [])
//             .filter(btn => (btn.text || "").trim().length > 0)
//             .map((btn, idx) => ({
//               Text: (btn.text || "").trim(),
//               Type: btn.type || "QUICK_REPLY",
//               SubType: btn.subType || "",
//               Value: btn.value || "",
//               TargetNodeId: btn.targetNodeId || null,
//               Index: typeof btn.index === "number" ? btn.index : idx,
//             })),
//         }));

//       const transformedEdges = edges.map(edge => ({
//         FromNodeId: edge.source,
//         ToNodeId: edge.target,
//         SourceHandle: edge.sourceHandle || "", // should match Button Text
//       }));

//       const payload = {
//         FlowName: flowName || "Untitled",
//         IsPublished: isPublished ?? false,
//         Nodes: transformedNodes,
//         Edges: transformedEdges,
//       };

//       console.log("📤 Final Payload to POST:", payload);
//       await saveVisualFlow(payload);
//       toast.success("✅ Flow saved successfully");
//     } catch (error) {
//       console.error("❌ Save flow failed: ", error);
//       toast.error("❌ Failed to save flow");
//     }
//   };

//   // -------- Default edge appearance --------
//   const defaultEdgeOptions = useMemo(
//     () => ({
//       type: "smoothstep",
//       animated: true,
//       style: { stroke: "#9333ea" },
//       markerEnd: { type: MarkerType.ArrowClosed, color: "#9333ea" },
//     }),
//     []
//   );

//   return (
//     <div className="p-6">
//       {/* Header */}
//       <div className="flex justify-between items-center mb-4">
//         <h2 className="text-2xl font-bold text-purple-700">
//           🧠 CTA Flow Visual Builder
//         </h2>

//         {!readonly && (
//           <div className="flex items-center gap-2 flex-wrap">
//             <input
//               id="flowName"
//               name="flowName"
//               ref={flowNameRef}
//               value={flowName}
//               onChange={e => setFlowName(e.target.value)}
//               placeholder="Add flow name"
//               className="border border-gray-300 px-3 py-2 rounded-md shadow-sm text-sm"
//             />
//             <button
//               onClick={() => setShowPicker(true)}
//               className="bg-purple-600 text-white px-4 py-2 rounded shadow hover:bg-purple-700 text-sm"
//             >
//               ➕ Add Step
//             </button>
//             <button
//               onClick={() => navigate("/app/cta-flow/flow-manager")}
//               className="bg-white border border-purple-600 text-purple-700 font-medium text-sm px-4 py-2 rounded-md shadow-sm hover:bg-purple-50"
//             >
//               ↩️ Manage All Flows
//             </button>
//           </div>
//         )}
//       </div>

//       {/* Canvas */}
//       <div className="h-[70vh] border rounded-xl bg-gray-50 relative">
//         {/* Minimap toggle */}
//         <div className="absolute bottom-5 right-4 z-50 flex gap-2">
//           <button
//             onClick={() => setShowMiniMap(prev => !prev)}
//             className="bg-purple-600 text-white p-2 rounded-full shadow hover:bg-purple-700"
//             title={showMiniMap ? "Hide MiniMap" : "Show MiniMap"}
//           >
//             {showMiniMap ? <Minus size={15} /> : <Eye size={15} />}
//           </button>

//           {/* Fit / Zoom / Auto-layout */}
//           <div className="flex items-center gap-2 bg-white/90 px-2 py-1 rounded-full border">
//             <button
//               onClick={() => fitView({ padding: 0.2 })}
//               className="text-xs px-2 py-1 rounded hover:bg-gray-100"
//               title="Fit"
//             >
//               Fit
//             </button>
//             <button
//               onClick={() => zoomIn()}
//               className="text-xs px-2 py-1 rounded hover:bg-gray-100"
//               title="Zoom In"
//             >
//               +
//             </button>
//             <button
//               onClick={() => zoomOut()}
//               className="text-xs px-2 py-1 rounded hover:bg-gray-100"
//               title="Zoom Out"
//             >
//               −
//             </button>
//             {!readonly && (
//               <>
//                 <button
//                   onClick={() => applyLayout("LR")}
//                   className="text-xs px-2 py-1 rounded hover:bg-gray-100"
//                   title="Auto-layout (Left→Right)"
//                 >
//                   Auto LR
//                 </button>
//                 <button
//                   onClick={() => applyLayout("TB")}
//                   className="text-xs px-2 py-1 rounded hover:bg-gray-100"
//                   title="Auto-layout (Top→Bottom)"
//                 >
//                   Auto TB
//                 </button>
//               </>
//             )}
//           </div>
//         </div>

//         <ReactFlow
//           nodes={nodes}
//           edges={edges}
//           onNodesChange={onNodesChange}
//           onEdgesChange={onEdgesChange}
//           onConnect={onConnect}
//           onEdgeClick={(e, edge) => {
//             if (!readonly) setEdges(eds => eds.filter(ed => ed.id !== edge.id));
//           }}
//           nodeTypes={nodeTypes}
//           fitView
//           fitViewOptions={{ padding: 0.2 }}
//           defaultEdgeOptions={defaultEdgeOptions}
//           // ✨ Pro feel
//           connectionMode={ConnectionMode.Strict}
//           isValidConnection={isValidConnection}
//           snapToGrid
//           snapGrid={[GRID, GRID]}
//           panOnScroll
//           zoomOnPinch
//           panOnDrag={[1, 2]} // allow panning from empty space & ctrl/shift drag
//           selectionOnDrag
//           nodesDraggable={!readonly}
//           nodesConnectable={!readonly}
//           elementsSelectable={!readonly}
//           // keep sourceHandle label visible in edge labels
//         >
//           {showMiniMap && (
//             <MiniMap
//               nodeColor="#9333ea"
//               nodeStrokeWidth={2}
//               maskColor="rgba(255,255,255,0.6)"
//             />
//           )}
//           <Controls />
//           <Background variant="dots" gap={GRID} size={1} />
//         </ReactFlow>
//       </div>

//       {/* Footer actions */}
//       {!readonly && (
//         <div className="mt-6 flex gap-4">
//           <button
//             onClick={() => handleSave(false)}
//             className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 text-sm"
//           >
//             💾 Save Draft
//           </button>
//           <button
//             onClick={() => handleSave(true)}
//             className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm"
//           >
//             🚀 Publish Flow
//           </button>
//         </div>
//       )}

//       <TemplatePickerModal
//         open={showPicker}
//         onClose={() => setShowPicker(false)}
//         onSelect={handleTemplateSelect}
//       />
//     </div>
//   );
// }

// export default function CTAFlowVisualBuilder() {
//   return (
//     <ReactFlowProvider>
//       <CTAFlowVisualBuilderInner />
//     </ReactFlowProvider>
//   );
// }

// import React, {
//   useCallback,
//   useState,
//   useEffect,
//   useMemo,
//   useRef,
// } from "react";
// import {
//   ReactFlow,
//   ReactFlowProvider,
//   Background,
//   Controls,
//   MiniMap,
//   useNodesState,
//   useEdgesState,
//   addEdge,
//   MarkerType,
// } from "@xyflow/react";
// import "@xyflow/react/dist/style.css";
// import { Eye, Minus } from "lucide-react";
// import { useSearchParams, useNavigate } from "react-router-dom";
// import TemplatePickerModal from "./components/TemplatePickerModal";
// import FlowNodeBubble from "./components/FlowNodeBubble";
// import { saveVisualFlow, getVisualFlowById } from "./ctaFlowVisualApi";
// import { v4 as uuidv4 } from "uuid";
// import { toast } from "react-toastify";

// function CTAFlowVisualBuilderInner() {
//   const [nodes, setNodes, onNodesChange] = useNodesState([]);
//   const [edges, setEdges, onEdgesChange] = useEdgesState([]);
//   const nodesRef = useRef([]);
//   const [showPicker, setShowPicker] = useState(false);
//   const [flowName, setFlowName] = useState("");
//   const flowNameRef = useRef(null);
//   const [showMiniMap, setShowMiniMap] = useState(false);
//   const [readonly, setReadonly] = useState(false);
//   const [searchParams] = useSearchParams();
//   const navigate = useNavigate();
//   const mode = searchParams.get("mode");
//   const flowId = searchParams.get("id");
//   const visualDebug = true;

//   useEffect(() => {
//     nodesRef.current = [...nodes];
//   }, [nodes]);

//   const handleDeleteNode = useCallback(
//     nodeId => {
//       if (readonly) return;
//       setNodes(nds => nds.filter(n => n.id !== nodeId));
//       setEdges(eds =>
//         eds.filter(e => e.source !== nodeId && e.target !== nodeId)
//       );
//     },
//     [readonly, setNodes, setEdges]
//   );

//   const handleNodeDataChange = useCallback(
//     (nodeId, newData) => {
//       setNodes(nds =>
//         nds.map(n =>
//           n.id === nodeId ? { ...n, data: { ...n.data, ...newData } } : n
//         )
//       );
//     },
//     [setNodes]
//   );

//   const nodeTypes = useMemo(
//     () => ({
//       customBubble: props => (
//         <FlowNodeBubble
//           {...props}
//           onDelete={handleDeleteNode}
//           onDataChange={newData => handleNodeDataChange(props.id, newData)}
//           readonly={readonly}
//           visualDebug={visualDebug}
//         />
//       ),
//     }),
//     [handleDeleteNode, readonly, visualDebug, handleNodeDataChange]
//   );

//   useEffect(() => {
//     const load = async () => {
//       if (mode === "edit" || mode === "view") {
//         try {
//           const data = await getVisualFlowById(flowId);

//           const builtNodes = data.nodes.map((node, index) => ({
//             id: node.id,
//             type: "customBubble",
//             position: {
//               x: node.positionX ?? 120 + index * 120,
//               y: node.positionY ?? 150 + (index % 5) * 60,
//             },
//             data: {
//               templateName: node.templateName,
//               templateType: node.templateType,
//               messageBody: node.messageBody,
//               triggerButtonText: node.triggerButtonText || "",
//               triggerButtonType: node.triggerButtonType || "cta",
//               requiredTag: node.requiredTag || "",
//               requiredSource: node.requiredSource || "",
//               // keep button order and include index if backend returned one
//               buttons: (node.buttons || []).map((btn, i) => ({
//                 text: btn.text,
//                 type: btn.type,
//                 subType: btn.subType,
//                 value: btn.value,
//                 targetNodeId: btn.targetNodeId || null,
//                 index: typeof btn.index === "number" ? btn.index : i, // <-- include index in UI state
//               })),
//             },
//           }));

//           const builtEdges = data.edges.map(edge => ({
//             id: `e-${edge.fromNodeId}-${edge.toNodeId}-${
//               edge.sourceHandle || "h"
//             }`,
//             source: edge.fromNodeId,
//             target: edge.toNodeId,
//             sourceHandle: edge.sourceHandle || null, // this should equal the button text
//             type: "smoothstep",
//             animated: true,
//             style: { stroke: "#9333ea" },
//             markerEnd: { type: "arrowclosed", color: "#9333ea" },
//           }));

//           // 🔍 Detect nodes with no incoming edges (often entry nodes; this is informational)
//           const nodesWithIncoming = new Set(builtEdges.map(e => e.target));
//           const nodesWithWarnings = builtNodes.map(node => ({
//             ...node,
//             data: {
//               ...node.data,
//               isUnreachable: false, // we won't block save on this for now
//               hasNoIncoming: !nodesWithIncoming.has(node.id),
//             },
//           }));

//           setNodes(nodesWithWarnings);
//           setEdges(builtEdges);
//           setFlowName(data.flowName);
//           if (mode === "view") setReadonly(true);
//         } catch {
//           toast.error("❌ Failed to load flow");
//         }
//       } else {
//         setNodes([]);
//         setEdges([]);
//         setFlowName("Untitled Flow");
//         setReadonly(false);
//       }
//     };

//     load();
//   }, [flowId, mode, setNodes, setEdges]);

//   const handleTemplateSelect = ({ name, type, body, buttons = [] }) => {
//     const id = uuidv4();
//     const newNode = {
//       id,
//       position: {
//         x: Math.random() * 400 + 100,
//         y: Math.random() * 300 + 100,
//       },
//       type: "customBubble",
//       data: {
//         templateName: name || "Untitled",
//         templateType: type || "text_template",
//         messageBody: body || "Message body preview...",
//         triggerButtonText: buttons[0]?.text || "",
//         triggerButtonType: "cta",
//         // ensure we keep button order & store index for each
//         buttons: buttons.map((btn, idx) => ({
//           text: btn.text || "",
//           type: btn.type || "QUICK_REPLY",
//           subType: btn.subType || "",
//           value: btn.parameterValue || "",
//           targetNodeId: null,
//           index: idx, // <-- tracked in UI so we can send Index later
//         })),
//       },
//     };
//     setNodes(nds => [...nds, newNode]);
//     setShowPicker(false);
//     toast.success(
//       `✅ Step added with ${type?.replace("_", " ") || "template"}`
//     );
//   };

//   const onConnect = useCallback(
//     params => {
//       if (readonly) return;

//       // Add the visual edge
//       setEdges(eds =>
//         addEdge(
//           {
//             ...params,
//             id: uuidv4(),
//             type: "smoothstep",
//             animated: true,
//             style: { stroke: "#9333ea" },
//             markerEnd: { type: MarkerType.ArrowClosed, color: "#9333ea" },
//           },
//           eds
//         )
//       );

//       // IMPORTANT: tie the edge to the specific button on the source node
//       setNodes(nds =>
//         nds.map(node => {
//           if (node.id !== params.source) return node;

//           const sourceHandle = params.sourceHandle || ""; // should equal button text
//           let updatedButtons = [...(node.data.buttons || [])];

//           // Try to find the button that matches the handle (by text)
//           const idxByHandle = updatedButtons.findIndex(
//             b =>
//               (b.text || "").toLowerCase().trim() ===
//               sourceHandle.toLowerCase().trim()
//           );

//           if (idxByHandle >= 0) {
//             updatedButtons[idxByHandle] = {
//               ...updatedButtons[idxByHandle],
//               targetNodeId: params.target,
//             };
//           } else {
//             // Fallback: link the first unlinked button
//             const idxFirstUnlinked = updatedButtons.findIndex(
//               b => !b.targetNodeId
//             );
//             if (idxFirstUnlinked >= 0) {
//               updatedButtons[idxFirstUnlinked] = {
//                 ...updatedButtons[idxFirstUnlinked],
//                 targetNodeId: params.target,
//               };
//             }
//           }

//           return { ...node, data: { ...node.data, buttons: updatedButtons } };
//         })
//       );
//     },
//     [readonly, setEdges, setNodes]
//   );

//   // --- Save ---

//   const handleSave = async isPublished => {
//     try {
//       // ✅ Transform nodes with stable Index per button
//       const transformedNodes = nodes
//         .filter(n => n?.data?.templateName)
//         .map(node => ({
//           Id: node.id || uuidv4(),
//           TemplateName: node?.data?.templateName || "Untitled",
//           TemplateType: node?.data?.templateType || "text_template",
//           MessageBody: node?.data?.messageBody || "",
//           PositionX: node.position?.x || 0,
//           PositionY: node.position?.y || 0,
//           TriggerButtonText: node?.data?.triggerButtonText || "",
//           TriggerButtonType: node?.data?.triggerButtonType || "cta",
//           RequiredTag: node?.data?.requiredTag || "",
//           RequiredSource: node?.data?.requiredSource || "",
//           Buttons: (node?.data?.buttons || [])
//             .filter(btn => (btn.text || "").trim().length > 0)
//             .map((btn, idx) => ({
//               Text: (btn.text || "").trim(),
//               Type: btn.type || "QUICK_REPLY",
//               SubType: btn.subType || "",
//               Value: btn.value || "",
//               TargetNodeId: btn.targetNodeId || null,
//               Index: typeof btn.index === "number" ? btn.index : idx, // <-- send Index explicitly
//             })),
//         }));

//       const transformedEdges = edges.map(edge => ({
//         FromNodeId: edge.source,
//         ToNodeId: edge.target,
//         SourceHandle: edge.sourceHandle || "", // should match Button Text
//       }));

//       const payload = {
//         FlowName: flowName || "Untitled",
//         IsPublished: isPublished ?? false,
//         Nodes: transformedNodes,
//         Edges: transformedEdges,
//       };

//       console.log("📤 Final Payload to POST:", payload);
//       await saveVisualFlow(payload);
//       toast.success("✅ Flow saved successfully");
//     } catch (error) {
//       console.error("❌ Save flow failed: ", error);
//       toast.error("❌ Failed to save flow");
//     }
//   };

//   return (
//     <div className="p-6">
//       <div className="flex justify-between items-center mb-4">
//         <h2 className="text-2xl font-bold text-purple-700">
//           🧠 CTA Flow Visual Builder
//         </h2>
//         {!readonly && (
//           <div className="flex items-center gap-4">
//             <input
//               id="flowName"
//               name="flowName"
//               ref={flowNameRef}
//               value={flowName}
//               onChange={e => setFlowName(e.target.value)}
//               placeholder="Add flow name"
//               className="border border-gray-300 px-3 py-2 rounded-md shadow-sm text-sm"
//             />
//             <button
//               onClick={() => setShowPicker(true)}
//               className="bg-purple-600 text-white px-4 py-2 rounded shadow hover:bg-purple-700 text-sm"
//             >
//               ➕ Add Step
//             </button>
//             <button
//               onClick={() => navigate("/app/cta-flow/flow-manager")}
//               className="bg-white border border-purple-600 text-purple-700 font-medium text-sm px-4 py-2 rounded-md shadow-sm hover:bg-purple-50"
//             >
//               ↩️ Manage All Flows
//             </button>
//           </div>
//         )}
//       </div>

//       <div className="h-[70vh] border rounded-xl bg-gray-50 relative">
//         <div className="absolute bottom-5 right-4 z-50">
//           <button
//             onClick={() => setShowMiniMap(prev => !prev)}
//             className="bg-purple-600 text-white p-2 rounded-full shadow hover:bg-purple-700"
//             title={showMiniMap ? "Hide MiniMap" : "Show MiniMap"}
//           >
//             {showMiniMap ? <Minus size={15} /> : <Eye size={15} />}
//           </button>
//         </div>

//         <ReactFlow
//           nodes={nodes}
//           edges={edges}
//           onNodesChange={onNodesChange}
//           onEdgesChange={onEdgesChange}
//           onConnect={onConnect}
//           onEdgeClick={(e, edge) => {
//             if (!readonly) setEdges(eds => eds.filter(ed => ed.id !== edge.id));
//           }}
//           nodeTypes={nodeTypes}
//           fitView
//         >
//           {showMiniMap && (
//             <MiniMap
//               nodeColor="#9333ea"
//               nodeStrokeWidth={2}
//               maskColor="rgba(255,255,255,0.6)"
//             />
//           )}
//           <Controls />
//           <Background />
//         </ReactFlow>
//       </div>

//       {!readonly && (
//         <div className="mt-6 flex gap-4">
//           <button
//             onClick={() => handleSave(false)}
//             className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 text-sm"
//           >
//             💾 Save Draft
//           </button>
//           <button
//             onClick={() => handleSave(true)}
//             className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm"
//           >
//             🚀 Publish Flow
//           </button>
//         </div>
//       )}

//       <TemplatePickerModal
//         open={showPicker}
//         onClose={() => setShowPicker(false)}
//         onSelect={handleTemplateSelect}
//       />
//     </div>
//   );
// }

// export default function CTAFlowVisualBuilder() {
//   return (
//     <ReactFlowProvider>
//       <CTAFlowVisualBuilderInner />
//     </ReactFlowProvider>
//   );
// }
