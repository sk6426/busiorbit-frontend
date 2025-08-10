import React, {
  useCallback,
  useState,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
} from "reactflow";
import "reactflow/dist/style.css";

import { toast } from "react-toastify";
import AutoReplyNodeStart from "./AutoReplyNodeStart";
import AutoReplyNodeBlock from "./AutoReplyNodeBlock";
import AutoReplyNodeEditor from "./AutoReplyNodeEditor";

const nodeTypes = {
  start: AutoReplyNodeStart,
  message: AutoReplyNodeBlock,
  template: AutoReplyNodeBlock,
  wait: AutoReplyNodeBlock,
  tag: AutoReplyNodeBlock,
};

let id = 1;
const getId = () => `node_${id++}`;

const AutoReplyCanvas = forwardRef((props, ref) => {
  const reactFlowWrapper = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  const [flowName, setFlowName] = useState("");
  const [triggerKeywords, setTriggerKeywords] = useState("");

  const [nodes, setNodes, onNodesChange] = useNodesState([
    {
      id: "start-1",
      type: "start",
      position: { x: 100, y: 100 },
      data: { label: "start" },
    },
  ]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  const handleDeleteNode = useCallback(
    nodeId => {
      setNodes(nds => nds.filter(n => n.id !== nodeId));
      setEdges(eds =>
        eds.filter(e => e.source !== nodeId && e.target !== nodeId)
      );
      setSelectedNode(null);
    },
    [setNodes, setEdges]
  );

  const confirmDeleteNode = useCallback(
    nodeId => {
      const node = nodes.find(n => n.id === nodeId);
      if (node?.type === "start") {
        setPendingDeleteId(nodeId);
      } else {
        handleDeleteNode(nodeId);
      }
    },
    [nodes, handleDeleteNode]
  );

  const onConnect = useCallback(
    params => {
      const customId = `reactflow__edge-${params.source}${
        params.sourceHandle ? params.sourceHandle : ""
      }-${params.target}`;
      setEdges(eds =>
        addEdge(
          {
            ...params,
            id: customId,
            type: "smoothstep",
          },
          eds
        )
      );
    },
    [setEdges]
  );

  const onEdgeClick = useCallback(
    (event, edge) => {
      event.stopPropagation();
      setEdges(eds => eds.filter(e => e.id !== edge.id));
    },
    [setEdges]
  );

  const onDrop = useCallback(
    event => {
      event.preventDefault();
      const type = event.dataTransfer.getData("application/reactflow");
      if (!type || !reactFlowInstance) return;

      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.project({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });

      const newId = getId();
      const newNode = {
        id: newId,
        type,
        position,
        data: {
          id: newId,
          label: type,
          config: {},
          onDelete: confirmDeleteNode,
        },
      };

      setNodes(nds => nds.concat(newNode));
    },
    [reactFlowInstance, confirmDeleteNode, setNodes]
  );

  const onDragOver = useCallback(event => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onNodeClick = useCallback((_, node) => {
    setSelectedNode(node);
  }, []);

  const handleNodeSave = updatedNode => {
    setNodes(prev =>
      prev.map(n => (n.id === updatedNode.id ? updatedNode : n))
    );
    setSelectedNode(null);
  };

  const handleSaveFlow = async () => {
    if (!reactFlowInstance) return;

    const flow = reactFlowInstance.toObject();
    const nodeMap = {};
    flow.nodes.forEach(node => {
      nodeMap[node.id] = node.data?.id || node.id;
    });

    const processedEdges = flow.edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceNodeId: nodeMap[edge.source],
      targetNodeId: nodeMap[edge.target],
      sourceHandle: edge.sourceHandle ?? "output",
      // fallback if undefined
      targetHandle: "input", // ✅ default required for all edges
    }));

    const processedNodes = flow.nodes.map(node => {
      const id = node.data?.id || node.id;
      const nodeConfig =
        typeof node.data?.config === "object"
          ? JSON.parse(JSON.stringify(node.data.config))
          : {};

      const buttonToNextMap = {};
      if (node.type === "template") {
        processedEdges.forEach(edge => {
          if (
            edge.source === node.id &&
            edge.sourceHandle?.startsWith("button-")
          ) {
            const btnIndex = edge.sourceHandle.split("-")[1];
            buttonToNextMap[btnIndex] = edge.target;
          }
        });
        nodeConfig.buttonToNextMap = buttonToNextMap;
      }

      return {
        id,
        type: node.type,
        position: { x: node.position.x, y: node.position.y },
        data: {
          label: node.data?.label || "",
          config: nodeConfig,
        },
      };
    });

    const payload = {
      name: flowName.trim() || props.flowName || "Untitled Flow",
      triggerKeyword: triggerKeywords.trim() || props.triggerKeywords || "",
      nodes: processedNodes,
      edges: processedEdges,
    };

    try {
      if (typeof props.onSave === "function") {
        await props.onSave(payload);
        toast.success("✅ Flow saved!");
      } else {
        toast.error("❌ Save function is not connected.");
      }
    } catch (error) {
      console.error("❌ Error during save:", error);
      toast.error("❌ Failed to save flow.");
    }
  };

  useImperativeHandle(ref, () => ({
    loadFlow: flowData => {
      const loadedNodes = flowData.nodes.map(node => ({
        id: node.id,
        type: node.nodeType,
        position: { x: node.positionX, y: node.positionY },
        data: {
          id: node.id,
          label: node.label || node.nodeType,
          config:
            typeof node.configJson === "string"
              ? JSON.parse(node.configJson)
              : node.configJson || {},
        },
      }));

      const loadedEdges = flowData.edges.map(edge => ({
        id: edge.id,
        source:
          loadedNodes.find(n => n.id === edge.sourceNodeId)?.id ||
          edge.sourceNodeId,
        target:
          loadedNodes.find(n => n.id === edge.targetNodeId)?.id ||
          edge.targetNodeId,
        sourceNodeId: edge.sourceNodeId,
        targetNodeId: edge.targetNodeId,
        sourceHandle: edge.sourceHandle || null,
        targetHandle: edge.targetHandle || null,
      }));

      setNodes(loadedNodes);
      setEdges(loadedEdges);
    },
    handleSaveFlow,
  }));

  return (
    <ReactFlowProvider>
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Flow Name
            </label>
            <input
              type="text"
              value={flowName}
              onChange={e => setFlowName(e.target.value)}
              placeholder="e.g. Welcome Flow"
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Trigger Keywords (comma separated)
            </label>
            <input
              type="text"
              value={triggerKeywords}
              onChange={e => setTriggerKeywords(e.target.value)}
              placeholder="hi, hello, hey"
              className="w-full border rounded px-3 py-2"
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleSaveFlow}
            className="bg-purple-600 text-white px-4 py-2 rounded shadow hover:bg-purple-700 transition"
          >
            Save Flow
          </button>
        </div>
      </div>

      <div
        ref={reactFlowWrapper}
        className="w-full h-[calc(100vh-10rem)]"
        onDrop={onDrop}
        onDragOver={onDragOver}
      >
        <ReactFlow
          nodes={nodes.map(n => ({
            ...n,
            data: { ...n.data, onDelete: confirmDeleteNode },
          }))}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onEdgeClick={onEdgeClick}
          onNodeClick={onNodeClick}
          onInit={setReactFlowInstance}
          fitView
          nodeTypes={nodeTypes}
        >
          <Background />
          <MiniMap />
          <Controls />
        </ReactFlow>

        <AutoReplyNodeEditor
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
          onSave={handleNodeSave}
        />

        {pendingDeleteId && (
          <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded shadow-xl max-w-sm w-full">
              <h2 className="text-lg font-bold text-red-600 mb-2">
                Delete Start Block?
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                This is the starting point of the flow. Deleting it may break
                connected logic.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  className="text-sm px-3 py-1 rounded bg-gray-200"
                  onClick={() => setPendingDeleteId(null)}
                >
                  Cancel
                </button>
                <button
                  className="text-sm px-3 py-1 rounded bg-red-600 text-white"
                  onClick={() => {
                    handleDeleteNode(pendingDeleteId);
                    setPendingDeleteId(null);
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ReactFlowProvider>
  );
});

export default AutoReplyCanvas;

// import React, {
//   useCallback,
//   useState,
//   useRef,
//   forwardRef,
//   useImperativeHandle,
// } from "react";
// import ReactFlow, {
//   Background,
//   Controls,
//   MiniMap,
//   addEdge,
//   useNodesState,
//   useEdgesState,
//   ReactFlowProvider,
// } from "reactflow";
// import "reactflow/dist/style.css";

// import { toast } from "react-toastify";
// import AutoReplyNodeStart from "./AutoReplyNodeStart";
// import AutoReplyNodeBlock from "./AutoReplyNodeBlock";
// import AutoReplyNodeEditor from "./AutoReplyNodeEditor";

// const nodeTypes = {
//   start: AutoReplyNodeStart,
//   message: AutoReplyNodeBlock,
//   template: AutoReplyNodeBlock,
//   wait: AutoReplyNodeBlock,
//   tag: AutoReplyNodeBlock,
// };

// let id = 1;
// const getId = () => `node_${id++}`;

// const AutoReplyCanvas = forwardRef((props, ref) => {
//   const reactFlowWrapper = useRef(null);
//   const [reactFlowInstance, setReactFlowInstance] = useState(null);

//   const [flowName, setFlowName] = useState("");
//   const [triggerKeywords, setTriggerKeywords] = useState("");

//   const [nodes, setNodes, onNodesChange] = useNodesState([
//     {
//       id: "start-1",
//       type: "start",
//       position: { x: 100, y: 100 },
//       data: { label: "start" },
//     },
//   ]);
//   const [edges, setEdges, onEdgesChange] = useEdgesState([]);
//   const [selectedNode, setSelectedNode] = useState(null);
//   const [pendingDeleteId, setPendingDeleteId] = useState(null);

//   const handleDeleteNode = useCallback(
//     nodeId => {
//       setNodes(nds => nds.filter(n => n.id !== nodeId));
//       setEdges(eds =>
//         eds.filter(e => e.source !== nodeId && e.target !== nodeId)
//       );
//       setSelectedNode(null);
//     },
//     [setNodes, setEdges]
//   );

//   const confirmDeleteNode = useCallback(
//     nodeId => {
//       const node = nodes.find(n => n.id === nodeId);
//       if (node?.type === "start") {
//         setPendingDeleteId(nodeId);
//       } else {
//         handleDeleteNode(nodeId);
//       }
//     },
//     [nodes, handleDeleteNode]
//   );

//   const onConnect = useCallback(
//     params => setEdges(eds => addEdge({ ...params, type: "smoothstep" }, eds)),
//     [setEdges]
//   );

//   const onEdgeClick = useCallback(
//     (event, edge) => {
//       event.stopPropagation();
//       setEdges(eds => eds.filter(e => e.id !== edge.id));
//     },
//     [setEdges]
//   );

//   const onDrop = useCallback(
//     event => {
//       event.preventDefault();
//       const type = event.dataTransfer.getData("application/reactflow");
//       if (!type || !reactFlowInstance) return;

//       const bounds = reactFlowWrapper.current.getBoundingClientRect();
//       const position = reactFlowInstance.project({
//         x: event.clientX - bounds.left,
//         y: event.clientY - bounds.top,
//       });

//       const newId = getId();
//       const newNode = {
//         id: newId,
//         type,
//         position,
//         data: {
//           id: newId,
//           label: type,
//           config: {},
//           onDelete: confirmDeleteNode,
//         },
//       };

//       setNodes(nds => nds.concat(newNode));
//     },
//     [reactFlowInstance, confirmDeleteNode, setNodes]
//   );

//   const onDragOver = useCallback(event => {
//     event.preventDefault();
//     event.dataTransfer.dropEffect = "move";
//   }, []);

//   const onNodeClick = useCallback((_, node) => {
//     setSelectedNode(node);
//   }, []);

//   const handleNodeSave = updatedNode => {
//     setNodes(prev =>
//       prev.map(n => (n.id === updatedNode.id ? updatedNode : n))
//     );
//     setSelectedNode(null);
//   };

//   const handleSaveFlow = async () => {
//     if (!reactFlowInstance) return;

//     const flow = reactFlowInstance.toObject();
//     const nodeMap = {};
//     flow.nodes.forEach(node => {
//       nodeMap[node.id] = node.data?.id || node.id;
//     });

//     // const processedEdges = flow.edges.map(edge => ({
//     //   id: edge.id,
//     //   source: edge.source,
//     //   target: edge.target,
//     //   sourceNodeId: nodeMap[edge.source],
//     //   targetNodeId: nodeMap[edge.target],
//     //   sourceHandle: edge.sourceHandle || null,
//     // }));
// const processedEdges = flow.edges.map(edge => ({
//   id: edge.id,
//   source: edge.source,
//   target: edge.target,
//   sourceNodeId: nodeMap[edge.source],
//   targetNodeId: nodeMap[edge.target],
//   sourceHandle: edge.sourceHandle || null, // ✅ ensure sourceHandle is saved
// }));
//     const processedNodes = flow.nodes.map(node => {
//       const id = node.data?.id || node.id;
//       const nodeConfig =
//         typeof node.data?.config === "object"
//           ? JSON.parse(JSON.stringify(node.data.config))
//           : {};

//       const buttonToNextMap = {};
//       if (node.type === "template") {
//         processedEdges.forEach(edge => {
//           if (
//             edge.source === node.id &&
//             edge.sourceHandle?.startsWith("button-")
//           ) {
//             const btnIndex = edge.sourceHandle.split("-")[1];
//             buttonToNextMap[btnIndex] = edge.target;
//           }
//         });
//         nodeConfig.buttonToNextMap = buttonToNextMap;
//       }

//       return {
//         id,
//         type: node.type,
//         position: { x: node.position.x, y: node.position.y },
//         data: {
//           label: node.data?.label || "",
//           config: nodeConfig,
//         },
//       };
//     });

//     const payload = {
//       name: flowName.trim() || props.flowName || "Untitled Flow",
//       triggerKeyword: triggerKeywords.trim() || props.triggerKeywords || "",
//       nodes: processedNodes,
//       edges: processedEdges,
//     };

//     try {
//       if (typeof props.onSave === "function") {
//         await props.onSave(payload);
//         toast.success("✅ Flow saved!");
//       } else {
//         toast.error("❌ Save function is not connected.");
//       }
//     } catch (error) {
//       console.error("❌ Error during save:", error);
//       toast.error("❌ Failed to save flow.");
//     }
//   };

//   useImperativeHandle(ref, () => ({
//     loadFlow: flowData => {
//       const loadedNodes = flowData.nodes.map(node => ({
//         id: node.id,
//         type: node.nodeType,
//         position: { x: node.positionX, y: node.positionY },
//         data: {
//           id: node.id,
//           label: node.label || node.nodeType,
//           config:
//             typeof node.configJson === "string"
//               ? JSON.parse(node.configJson)
//               : node.configJson || {},
//         },
//       }));

//       const loadedEdges = flowData.edges.map(edge => ({
//         id: edge.id,
//         source:
//           loadedNodes.find(n => n.id === edge.sourceNodeId)?.id ||
//           edge.sourceNodeId,
//         target:
//           loadedNodes.find(n => n.id === edge.targetNodeId)?.id ||
//           edge.targetNodeId,
//         sourceNodeId: edge.sourceNodeId,
//         targetNodeId: edge.targetNodeId,
//         sourceHandle: edge.sourceHandle || null,
//       }));

//       setNodes(loadedNodes);
//       setEdges(loadedEdges);
//     },
//     handleSaveFlow,
//   }));

//   return (
//     <ReactFlowProvider>
//       <div className="p-4 bg-white border-b border-gray-200">
//         <div className="flex flex-col md:flex-row gap-4">
//           <div className="flex-1">
//             <label className="block text-sm font-medium text-zinc-700 mb-1">
//               Flow Name
//             </label>
//             <input
//               type="text"
//               value={flowName}
//               onChange={e => setFlowName(e.target.value)}
//               placeholder="e.g. Welcome Flow"
//               className="w-full border rounded px-3 py-2"
//             />
//           </div>
//           <div className="flex-1">
//             <label className="block text-sm font-medium text-zinc-700 mb-1">
//               Trigger Keywords (comma separated)
//             </label>
//             <input
//               type="text"
//               value={triggerKeywords}
//               onChange={e => setTriggerKeywords(e.target.value)}
//               placeholder="hi, hello, hey"
//               className="w-full border rounded px-3 py-2"
//             />
//           </div>
//         </div>
//         <div className="mt-4 flex justify-end">
//           <button
//             onClick={handleSaveFlow}
//             className="bg-purple-600 text-white px-4 py-2 rounded shadow hover:bg-purple-700 transition"
//           >
//             Save Flow
//           </button>
//         </div>
//       </div>

//       <div
//         ref={reactFlowWrapper}
//         className="w-full h-[calc(100vh-10rem)]"
//         onDrop={onDrop}
//         onDragOver={onDragOver}
//       >
//         <ReactFlow
//           nodes={nodes.map(n => ({
//             ...n,
//             data: { ...n.data, onDelete: confirmDeleteNode },
//           }))}
//           edges={edges}
//           onNodesChange={onNodesChange}
//           onEdgesChange={onEdgesChange}
//           onConnect={onConnect}
//           onEdgeClick={onEdgeClick}
//           onNodeClick={onNodeClick}
//           onInit={setReactFlowInstance}
//           fitView
//           nodeTypes={nodeTypes}
//         >
//           <Background />
//           <MiniMap />
//           <Controls />
//         </ReactFlow>

//         <AutoReplyNodeEditor
//           node={selectedNode}
//           onClose={() => setSelectedNode(null)}
//           onSave={handleNodeSave}
//         />

//         {pendingDeleteId && (
//           <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
//             <div className="bg-white p-6 rounded shadow-xl max-w-sm w-full">
//               <h2 className="text-lg font-bold text-red-600 mb-2">
//                 Delete Start Block?
//               </h2>
//               <p className="text-sm text-gray-600 mb-4">
//                 This is the starting point of the flow. Deleting it may break
//                 connected logic.
//               </p>
//               <div className="flex justify-end gap-2">
//                 <button
//                   className="text-sm px-3 py-1 rounded bg-gray-200"
//                   onClick={() => setPendingDeleteId(null)}
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   className="text-sm px-3 py-1 rounded bg-red-600 text-white"
//                   onClick={() => {
//                     handleDeleteNode(pendingDeleteId);
//                     setPendingDeleteId(null);
//                   }}
//                 >
//                   Delete
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </ReactFlowProvider>
//   );
// });

// export default AutoReplyCanvas;

// import React, {
//   useCallback,
//   useState,
//   useRef,
//   forwardRef,
//   useImperativeHandle,
// } from "react";
// import ReactFlow, {
//   Background,
//   Controls,
//   MiniMap,
//   addEdge,
//   useNodesState,
//   useEdgesState,
//   ReactFlowProvider,
// } from "reactflow";
// import "reactflow/dist/style.css";

// import { toast } from "react-toastify";
// import AutoReplyNodeStart from "./AutoReplyNodeStart";
// import AutoReplyNodeBlock from "./AutoReplyNodeBlock";
// import AutoReplyNodeEditor from "./AutoReplyNodeEditor";

// const nodeTypes = {
//   start: AutoReplyNodeStart,
//   message: AutoReplyNodeBlock,
//   template: AutoReplyNodeBlock,
//   wait: AutoReplyNodeBlock,
//   tag: AutoReplyNodeBlock,
// };

// let id = 1;
// const getId = () => `node_${id++}`;

// const AutoReplyCanvas = forwardRef((props, ref) => {
//   const reactFlowWrapper = useRef(null);
//   const [reactFlowInstance, setReactFlowInstance] = useState(null);

//   const [flowName, setFlowName] = useState("");
//   const [triggerKeywords, setTriggerKeywords] = useState("");

//   const [nodes, setNodes, onNodesChange] = useNodesState([
//     {
//       id: "start-1",
//       type: "start",
//       position: { x: 100, y: 100 },
//       data: { label: "start" },
//     },
//   ]);
//   const [edges, setEdges, onEdgesChange] = useEdgesState([]);
//   const [selectedNode, setSelectedNode] = useState(null);
//   const [pendingDeleteId, setPendingDeleteId] = useState(null);

//   const handleDeleteNode = useCallback(
//     nodeId => {
//       setNodes(nds => nds.filter(n => n.id !== nodeId));
//       setEdges(eds =>
//         eds.filter(e => e.source !== nodeId && e.target !== nodeId)
//       );
//       setSelectedNode(null);
//     },
//     [setNodes, setEdges]
//   );

//   const confirmDeleteNode = useCallback(
//     nodeId => {
//       const node = nodes.find(n => n.id === nodeId);
//       if (node?.type === "start") {
//         setPendingDeleteId(nodeId);
//       } else {
//         handleDeleteNode(nodeId);
//       }
//     },
//     [nodes, handleDeleteNode]
//   );

//   const onConnect = useCallback(
//     params => {
//       setEdges(eds => addEdge({ ...params, type: "smoothstep" }, eds));
//     },
//     [setEdges]
//   );

//   const onEdgeClick = useCallback(
//     (event, edge) => {
//       event.stopPropagation();
//       setEdges(eds => eds.filter(e => e.id !== edge.id));
//     },
//     [setEdges]
//   );

//   const onDrop = useCallback(
//     event => {
//       event.preventDefault();
//       const type = event.dataTransfer.getData("application/reactflow");
//       if (!type || !reactFlowInstance) return;

//       const bounds = reactFlowWrapper.current.getBoundingClientRect();
//       const position = reactFlowInstance.project({
//         x: event.clientX - bounds.left,
//         y: event.clientY - bounds.top,
//       });

//       const newId = getId();
//       const newNode = {
//         id: newId,
//         type,
//         position,
//         data: {
//           id: newId,
//           label: type,
//           config: {},
//           onDelete: confirmDeleteNode,
//         },
//       };

//       setNodes(nds => nds.concat(newNode));
//     },
//     [reactFlowInstance, confirmDeleteNode, setNodes]
//   );

//   const onDragOver = useCallback(event => {
//     event.preventDefault();
//     event.dataTransfer.dropEffect = "move";
//   }, []);

//   const onNodeClick = useCallback((_, node) => {
//     setSelectedNode(node);
//   }, []);

//   const handleNodeSave = updatedNode => {
//     setNodes(prev =>
//       prev.map(n => (n.id === updatedNode.id ? updatedNode : n))
//     );
//     setSelectedNode(null);
//   };

//   const handleSaveFlow = async () => {
//     if (!reactFlowInstance) return;

//     const flow = reactFlowInstance.toObject();

//     const nodeMap = {};
//     flow.nodes.forEach(node => {
//       nodeMap[node.id] = node.data?.id || node.id;
//     });

//     const processedEdges = flow.edges.map(edge => ({
//       id: edge.id,
//       source: edge.source,
//       target: edge.target,
//       sourceHandle: edge.sourceHandle || null,
//       sourceNodeId: nodeMap[edge.source],
//       targetNodeId: nodeMap[edge.target],
//     }));

//     const processedNodes = flow.nodes.map(node => ({
//       id: node.data?.id || node.id,
//       type: node.type,
//       position: {
//         x: node.position.x,
//         y: node.position.y,
//       },
//       data: {
//         label: node.data?.label || "",
//         config:
//           typeof node.data?.config === "object"
//             ? JSON.parse(JSON.stringify(node.data.config))
//             : {},
//       },
//     }));

//     const payload = {
//       name: flowName.trim() || props.flowName || "Untitled Flow",
//       triggerKeyword: triggerKeywords.trim() || props.triggerKeywords || "",
//       nodes: processedNodes,
//       edges: processedEdges,
//     };

//     if (typeof props.onSave === "function") {
//       try {
//         await props.onSave(payload);
//         toast.success("✅ Flow saved!");
//       } catch (error) {
//         console.error("❌ Error during save:", error);
//         toast.error("❌ Failed to save flow.");
//       }
//     } else {
//       toast.error("❌ Save function is not connected.");
//     }
//   };

//   useImperativeHandle(ref, () => ({
//     loadFlow: flowData => {
//       const loadedNodes = flowData.nodes.map(node => ({
//         id: node.id,
//         type: node.nodeType,
//         position: { x: node.positionX, y: node.positionY },
//         data: {
//           id: node.id,
//           label: node.label || node.nodeType,
//           config:
//             typeof node.configJson === "string"
//               ? JSON.parse(node.configJson)
//               : node.configJson || {},
//         },
//       }));

//       const loadedEdges = flowData.edges.map(edge => ({
//         id: edge.id,
//         source:
//           loadedNodes.find(n => n.id === edge.sourceNodeId)?.id ||
//           edge.sourceNodeId,
//         target:
//           loadedNodes.find(n => n.id === edge.targetNodeId)?.id ||
//           edge.targetNodeId,
//         sourceHandle: edge.sourceHandle || null,
//         sourceNodeId: edge.sourceNodeId,
//         targetNodeId: edge.targetNodeId,
//       }));

//       setNodes(loadedNodes);
//       setEdges(loadedEdges);
//     },
//     handleSaveFlow,
//   }));

//   return (
//     <ReactFlowProvider>
//       <div className="p-4 bg-white border-b border-gray-200">
//         <div className="flex flex-col md:flex-row gap-4">
//           <div className="flex-1">
//             <label className="block text-sm font-medium text-zinc-700 mb-1">
//               Flow Name
//             </label>
//             <input
//               type="text"
//               value={flowName}
//               onChange={e => setFlowName(e.target.value)}
//               placeholder="e.g. Welcome Flow"
//               className="w-full border rounded px-3 py-2"
//             />
//           </div>
//           <div className="flex-1">
//             <label className="block text-sm font-medium text-zinc-700 mb-1">
//               Trigger Keywords (comma separated)
//             </label>
//             <input
//               type="text"
//               value={triggerKeywords}
//               onChange={e => setTriggerKeywords(e.target.value)}
//               placeholder="hi, hello, hey"
//               className="w-full border rounded px-3 py-2"
//             />
//           </div>
//         </div>
//         <div className="mt-4 flex justify-end">
//           <button
//             onClick={handleSaveFlow}
//             className="bg-purple-600 text-white px-4 py-2 rounded shadow hover:bg-purple-700 transition"
//           >
//             Save Flow
//           </button>
//         </div>
//       </div>

//       <div
//         ref={reactFlowWrapper}
//         className="w-full h-[calc(100vh-10rem)]"
//         onDrop={onDrop}
//         onDragOver={onDragOver}
//       >
//         <ReactFlow
//           nodes={nodes.map(n => ({
//             ...n,
//             data: { ...n.data, onDelete: confirmDeleteNode },
//           }))}
//           edges={edges}
//           onNodesChange={onNodesChange}
//           onEdgesChange={onEdgesChange}
//           onConnect={onConnect}
//           onEdgeClick={onEdgeClick}
//           onNodeClick={onNodeClick}
//           onInit={setReactFlowInstance}
//           fitView
//           nodeTypes={nodeTypes}
//         >
//           <Background />
//           <MiniMap />
//           <Controls />
//         </ReactFlow>

//         <AutoReplyNodeEditor
//           node={selectedNode}
//           onClose={() => setSelectedNode(null)}
//           onSave={handleNodeSave}
//         />

//         {pendingDeleteId && (
//           <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
//             <div className="bg-white p-6 rounded shadow-xl max-w-sm w-full">
//               <h2 className="text-lg font-bold text-red-600 mb-2">
//                 Delete Start Block?
//               </h2>
//               <p className="text-sm text-gray-600 mb-4">
//                 This is the starting point of the flow. Deleting it may break
//                 connected logic.
//               </p>
//               <div className="flex justify-end gap-2">
//                 <button
//                   className="text-sm px-3 py-1 rounded bg-gray-200"
//                   onClick={() => setPendingDeleteId(null)}
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   className="text-sm px-3 py-1 rounded bg-red-600 text-white"
//                   onClick={() => {
//                     handleDeleteNode(pendingDeleteId);
//                     setPendingDeleteId(null);
//                   }}
//                 >
//                   Delete
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </ReactFlowProvider>
//   );
// });

// export default AutoReplyCanvas;

// import React, {
//   useCallback,
//   useState,
//   useRef,
//   forwardRef,
//   useImperativeHandle,
// } from "react";
// import ReactFlow, {
//   Background,
//   Controls,
//   MiniMap,
//   addEdge,
//   useNodesState,
//   useEdgesState,
//   ReactFlowProvider,
// } from "reactflow";
// import "reactflow/dist/style.css";

// import { toast } from "react-toastify";
// import AutoReplyNodeStart from "./AutoReplyNodeStart";
// import AutoReplyNodeBlock from "./AutoReplyNodeBlock";
// import AutoReplyNodeEditor from "./AutoReplyNodeEditor";

// const nodeTypes = {
//   start: AutoReplyNodeStart,
//   message: AutoReplyNodeBlock,
//   template: AutoReplyNodeBlock,
//   wait: AutoReplyNodeBlock,
//   tag: AutoReplyNodeBlock,
// };

// let id = 1;
// const getId = () => `node_${id++}`;

// const AutoReplyCanvas = forwardRef((props, ref) => {
//   const reactFlowWrapper = useRef(null);
//   const [reactFlowInstance, setReactFlowInstance] = useState(null);

//   const [flowName, setFlowName] = useState("");
//   const [triggerKeywords, setTriggerKeywords] = useState("");

//   const [nodes, setNodes, onNodesChange] = useNodesState([
//     {
//       id: "start-1",
//       type: "start",
//       position: { x: 100, y: 100 },
//       data: { label: "start" },
//     },
//   ]);
//   const [edges, setEdges, onEdgesChange] = useEdgesState([]);
//   const [selectedNode, setSelectedNode] = useState(null);
//   const [pendingDeleteId, setPendingDeleteId] = useState(null);

//   const handleDeleteNode = useCallback(
//     nodeId => {
//       setNodes(nds => nds.filter(n => n.id !== nodeId));
//       setEdges(eds =>
//         eds.filter(e => e.source !== nodeId && e.target !== nodeId)
//       );
//       setSelectedNode(null);
//     },
//     [setNodes, setEdges]
//   );

//   const confirmDeleteNode = useCallback(
//     nodeId => {
//       const node = nodes.find(n => n.id === nodeId);
//       if (node?.type === "start") {
//         setPendingDeleteId(nodeId);
//       } else {
//         handleDeleteNode(nodeId);
//       }
//     },
//     [nodes, handleDeleteNode]
//   );

//   const onConnect = useCallback(
//     params => setEdges(eds => addEdge({ ...params, type: "smoothstep" }, eds)),
//     [setEdges]
//   );

//   const onEdgeClick = useCallback(
//     (event, edge) => {
//       event.stopPropagation();
//       setEdges(eds => eds.filter(e => e.id !== edge.id));
//     },
//     [setEdges]
//   );

//   const onDrop = useCallback(
//     event => {
//       event.preventDefault();
//       const type = event.dataTransfer.getData("application/reactflow");
//       if (!type || !reactFlowInstance) return;

//       const bounds = reactFlowWrapper.current.getBoundingClientRect();
//       const position = reactFlowInstance.project({
//         x: event.clientX - bounds.left,
//         y: event.clientY - bounds.top,
//       });

//       const newId = getId();
//       const newNode = {
//         id: newId,
//         type,
//         position,
//         data: {
//           id: newId,
//           label: type,
//           config: {},
//           onDelete: confirmDeleteNode,
//         },
//       };

//       setNodes(nds => nds.concat(newNode));
//     },
//     [reactFlowInstance, confirmDeleteNode, setNodes]
//   );

//   const onDragOver = useCallback(event => {
//     event.preventDefault();
//     event.dataTransfer.dropEffect = "move";
//   }, []);

//   const onNodeClick = useCallback((_, node) => {
//     setSelectedNode(node);
//   }, []);

//   const handleNodeSave = updatedNode => {
//     setNodes(prev =>
//       prev.map(n => (n.id === updatedNode.id ? updatedNode : n))
//     );
//     setSelectedNode(null);
//   };

//   const handleSaveFlow = async () => {
//     if (!reactFlowInstance) return;

//     const flow = reactFlowInstance.toObject();

//     const nodeMap = {};
//     flow.nodes.forEach(node => {
//       nodeMap[node.id] = node.data?.id || node.id;
//     });

//     const processedEdges = flow.edges.map(edge => ({
//       id: edge.id,
//       source: edge.source,
//       target: edge.target,
//       sourceNodeId: nodeMap[edge.source],
//       targetNodeId: nodeMap[edge.target],
//     }));

//     const processedNodes = flow.nodes.map(node => ({
//       id: node.data?.id || node.id,
//       type: node.type,
//       position: {
//         x: node.position.x,
//         y: node.position.y,
//       },
//       data: {
//         label: node.data?.label || "",
//         config:
//           typeof node.data?.config === "object"
//             ? JSON.parse(JSON.stringify(node.data.config))
//             : {},
//       },
//     }));

//     const payload = {
//       name: flowName.trim() || props.flowName || "Untitled Flow",
//       triggerKeyword: triggerKeywords.trim() || props.triggerKeywords || "",
//       nodes: processedNodes,
//       edges: processedEdges,
//     };

//     if (typeof props.onSave === "function") {
//       try {
//         await props.onSave(payload);
//         toast.success("✅ Flow saved!");
//       } catch (error) {
//         console.error("❌ Error during save:", error);
//         toast.error("❌ Failed to save flow.");
//       }
//     } else {
//       toast.error("❌ Save function is not connected.");
//     }
//   };

//   useImperativeHandle(ref, () => ({
//     loadFlow: flowData => {
//       const loadedNodes = flowData.nodes.map(node => ({
//         id: node.id,
//         type: node.nodeType,
//         position: { x: node.positionX, y: node.positionY },
//         data: {
//           id: node.id,
//           label: node.label || node.nodeType,
//           config:
//             typeof node.configJson === "string"
//               ? JSON.parse(node.configJson)
//               : node.configJson || {},
//         },
//       }));

//       const loadedEdges = flowData.edges.map(edge => ({
//         id: edge.id,
//         source:
//           loadedNodes.find(n => n.id === edge.sourceNodeId)?.id ||
//           edge.sourceNodeId,
//         target:
//           loadedNodes.find(n => n.id === edge.targetNodeId)?.id ||
//           edge.targetNodeId,
//         sourceNodeId: edge.sourceNodeId,
//         targetNodeId: edge.targetNodeId,
//       }));

//       setNodes(loadedNodes);
//       setEdges(loadedEdges);
//     },
//     handleSaveFlow,
//   }));

//   return (
//     <ReactFlowProvider>
//       <div className="p-4 bg-white border-b border-gray-200">
//         <div className="flex flex-col md:flex-row gap-4">
//           <div className="flex-1">
//             <label className="block text-sm font-medium text-zinc-700 mb-1">
//               Flow Name
//             </label>
//             <input
//               type="text"
//               value={flowName}
//               onChange={e => setFlowName(e.target.value)}
//               placeholder="e.g. Welcome Flow"
//               className="w-full border rounded px-3 py-2"
//             />
//           </div>
//           <div className="flex-1">
//             <label className="block text-sm font-medium text-zinc-700 mb-1">
//               Trigger Keywords (comma separated)
//             </label>
//             <input
//               type="text"
//               value={triggerKeywords}
//               onChange={e => setTriggerKeywords(e.target.value)}
//               placeholder="hi, hello, hey"
//               className="w-full border rounded px-3 py-2"
//             />
//           </div>
//         </div>
//         <div className="mt-4 flex justify-end">
//           <button
//             onClick={handleSaveFlow}
//             className="bg-purple-600 text-white px-4 py-2 rounded shadow hover:bg-purple-700 transition"
//           >
//             Save Flow
//           </button>
//         </div>
//       </div>

//       <div
//         ref={reactFlowWrapper}
//         className="w-full h-[calc(100vh-10rem)]"
//         onDrop={onDrop}
//         onDragOver={onDragOver}
//       >
//         <ReactFlow
//           nodes={nodes.map(n => ({
//             ...n,
//             data: { ...n.data, onDelete: confirmDeleteNode },
//           }))}
//           edges={edges}
//           onNodesChange={onNodesChange}
//           onEdgesChange={onEdgesChange}
//           onConnect={onConnect}
//           onEdgeClick={onEdgeClick}
//           onNodeClick={onNodeClick}
//           onInit={setReactFlowInstance}
//           fitView
//           nodeTypes={nodeTypes}
//         >
//           <Background />
//           <MiniMap />
//           <Controls />
//         </ReactFlow>

//         <AutoReplyNodeEditor
//           node={selectedNode}
//           onClose={() => setSelectedNode(null)}
//           onSave={handleNodeSave}
//         />

//         {pendingDeleteId && (
//           <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
//             <div className="bg-white p-6 rounded shadow-xl max-w-sm w-full">
//               <h2 className="text-lg font-bold text-red-600 mb-2">
//                 Delete Start Block?
//               </h2>
//               <p className="text-sm text-gray-600 mb-4">
//                 This is the starting point of the flow. Deleting it may break
//                 connected logic.
//               </p>
//               <div className="flex justify-end gap-2">
//                 <button
//                   className="text-sm px-3 py-1 rounded bg-gray-200"
//                   onClick={() => setPendingDeleteId(null)}
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   className="text-sm px-3 py-1 rounded bg-red-600 text-white"
//                   onClick={() => {
//                     handleDeleteNode(pendingDeleteId);
//                     setPendingDeleteId(null);
//                   }}
//                 >
//                   Delete
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </ReactFlowProvider>
//   );
// });

// export default AutoReplyCanvas;
