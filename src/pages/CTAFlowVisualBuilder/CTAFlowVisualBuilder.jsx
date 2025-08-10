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
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Eye, Minus } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import TemplatePickerModal from "./components/TemplatePickerModal";
import FlowNodeBubble from "./components/FlowNodeBubble";
import { saveVisualFlow, getVisualFlowById } from "./ctaFlowVisualApi";
import { v4 as uuidv4 } from "uuid";
import { toast } from "react-toastify";
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
  const mode = searchParams.get("mode");
  const flowId = searchParams.get("id");
  const visualDebug = true;

  useEffect(() => {
    nodesRef.current = [...nodes];
  }, [nodes]);

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

  useEffect(() => {
    const load = async () => {
      if (mode === "edit" || mode === "view") {
        try {
          const data = await getVisualFlowById(flowId);
          const builtNodes = data.nodes.map((node, index) => ({
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
              buttons: (node.buttons || []).map(btn => ({
                text: btn.text,
                type: btn.type,
                subType: btn.subType,
                value: btn.value,
                targetNodeId: btn.targetNodeId || null,
              })),
            },
          }));

          const builtEdges = data.edges.map(edge => ({
            id: `e-${edge.fromNodeId}-${edge.toNodeId}`,
            source: edge.fromNodeId,
            target: edge.toNodeId,
            sourceHandle: edge.sourceHandle || null,
            type: "smoothstep",
            animated: true,
            style: { stroke: "#9333ea" },
            markerEnd: { type: "arrowclosed", color: "#9333ea" },
          }));

          // 🔍 Detect unreachable nodes
          const reachableNodeIds = new Set(builtEdges.map(edge => edge.target));
          const nodesWithWarnings = builtNodes.map(node => ({
            ...node,
            data: {
              ...node.data,
              isUnreachable: !reachableNodeIds.has(node.id),
            },
          }));

          setNodes(nodesWithWarnings);
          setEdges(builtEdges);
          setFlowName(data.flowName);
          if (mode === "view") setReadonly(true);
        } catch {
          toast.error("❌ Failed to load flow");
        }
      } else {
        setNodes([]);
        setEdges([]);
        setFlowName("Untitled Flow");
        setReadonly(false);
      }
    };

    load();
  }, [flowId, mode, setNodes, setEdges]);

  const handleTemplateSelect = ({ name, type, body, buttons = [] }) => {
    const id = uuidv4();
    const newNode = {
      id,
      position: {
        x: Math.random() * 400 + 100,
        y: Math.random() * 300 + 100,
      },
      type: "customBubble",
      data: {
        templateName: name || "Untitled",
        templateType: type || "text_template",
        messageBody: body || "Message body preview...",
        triggerButtonText: buttons[0]?.text || "",
        triggerButtonType: "cta",
        buttons: buttons.map(btn => ({
          text: btn.text || "",
          type: btn.type || "QUICK_REPLY",
          subType: btn.subType || "",
          value: btn.parameterValue || "",
          targetNodeId: null,
        })),
      },
    };
    setNodes(nds => [...nds, newNode]);
    setShowPicker(false);
    toast.success(
      `✅ Step added with ${type?.replace("_", " ") || "template"}`
    );
  };

  const onConnect = useCallback(
    params => {
      if (readonly) return;

      setEdges(eds =>
        addEdge(
          {
            ...params,
            id: uuidv4(),
            type: "smoothstep",
            animated: true,
            style: { stroke: "#9333ea" },
            markerEnd: { type: MarkerType.ArrowClosed, color: "#9333ea" },
          },
          eds
        )
      );

      setNodes(nds =>
        nds.map(node => {
          if (node.id !== params.source) return node;
          const updatedButtons = (node.data.buttons || []).map(btn => {
            if (!btn.targetNodeId)
              return { ...btn, targetNodeId: params.target };
            return btn;
          });
          return { ...node, data: { ...node.data, buttons: updatedButtons } };
        })
      );
    },
    [readonly, setEdges, setNodes]
  );

  // 🔧 Inside CTAFlowVisualBuilder.jsx

  const handleSave = async isPublished => {
    try {
      // 🧠 Detect unreachable steps before saving
      const unreachableNodes = nodes.filter(
        n => n?.data?.isUnreachable && !!n?.data?.templateName
      );

      if (unreachableNodes.length > 0) {
        const stepNames = unreachableNodes
          .map(n => `• ${n.data.templateName}`)
          .join("\n");

        const confirmSave = window.confirm(
          `⚠️ ${unreachableNodes.length} unreachable step(s) detected:\n\n${stepNames}\n\nDo you still want to continue saving?`
        );

        if (!confirmSave) {
          toast.warn("🚫 Save cancelled. Please fix unreachable steps.");
          return;
        }
      }

      // ✅ Proceed with transformation
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
          Buttons: (node?.data?.buttons || []).map(btn => ({
            Text: btn.text || "",
            Type: btn.type || "QUICK_REPLY",
            SubType: btn.subType || "",
            Value: btn.value || "",
            TargetNodeId: btn.targetNodeId || null,
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

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-purple-700">
          🧠 CTA Flow Visual Builder
        </h2>
        {!readonly && (
          <div className="flex items-center gap-4">
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

      <div className="h-[70vh] border rounded-xl bg-gray-50 relative">
        <div className="absolute bottom-5 right-4 z-50">
          <button
            onClick={() => setShowMiniMap(prev => !prev)}
            className="bg-purple-600 text-white p-2 rounded-full shadow hover:bg-purple-700"
            title={showMiniMap ? "Hide MiniMap" : "Show MiniMap"}
          >
            {showMiniMap ? <Minus size={15} /> : <Eye size={15} />}
          </button>
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
          fitView
        >
          {showMiniMap && (
            <MiniMap
              nodeColor="#9333ea"
              nodeStrokeWidth={2}
              maskColor="rgba(255,255,255,0.6)"
            />
          )}
          <Controls />
          <Background />
        </ReactFlow>
      </div>

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
