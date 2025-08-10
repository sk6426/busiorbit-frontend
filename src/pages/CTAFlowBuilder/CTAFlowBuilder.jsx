// 📄 File: src/pages/CTAFlowBuilder/CTAFlowBuilder.jsx
import React, { useEffect, useState } from "react";
import FlowStepCard from "./FlowStepCard";
import ConfirmDeleteModal from "../../components/ui/ConfirmDeleteModal";
import { getCurrentFlow, getDraftFlow, createFlow } from "./api";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { toast } from "react-toastify";
import VisualFlowPreview from "./VisualFlowPreview";
import VisualFlowMap from "./VisualFlowMap";
import StepDrawer from "./StepDrawer";
import FlowArrowLayer from "./FlowArrowLayer";
import axiosClient from "../../api/axiosClient";

export default function CTAFlowBuilder() {
  // ❌ REMOVED: const [flow, setFlow] = useState(null);
  const [steps, setSteps] = useState([]);
  const [templates, setTemplates] = useState([]);
  // ❌ REMOVED: const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [flowName, setFlowName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [pendingDeleteIndex, setPendingDeleteIndex] = useState(null);
  const [selectedStepId, setSelectedStepId] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [activeStepId, setActiveStepId] = useState(null);
  const [showDrafts, setShowDrafts] = useState(false);

  const scrollToStep = id => {
    const el = document.getElementById(`step-card-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [flowRes, templateRes] = await Promise.all([
          showDrafts ? getDraftFlow() : getCurrentFlow(),
          axiosClient.get("/WhatsAppTemplateFetcher/get-template-all"),
        ]);

        if (!flowRes) {
          toast.info(
            "ℹ️ No published flow found. You can start by adding steps."
          );
          // ❌ REMOVED: setFlow(null);
          setSteps([]);
          setFlowName("");
          setIsActive(true);
        } else {
          // ❌ REMOVED: setFlow(flowRes);
          setSteps(flowRes.steps || []);
          setFlowName(flowRes.flowName || "");
          setIsActive(flowRes.isActive ?? true);
        }

        const tplList = templateRes.data.templates;
        setTemplates(Array.isArray(tplList) ? tplList : []);
      } catch (err) {
        console.error("Error loading flow/templates:", err);
        toast.error("Failed to load flow or templates");
      } finally {
        // ❌ REMOVED: setLoading(false);
      }
    };

    fetchData();
  }, [showDrafts]);

  const handleAddStep = () => {
    const newStep = {
      id: crypto.randomUUID(),
      buttonText: "",
      templateName: "",
      buttonLinks: [],
      stepOrder: steps.length + 1,
    };
    setSteps(prev => [...prev, newStep]);
    setSelectedStepId(newStep.id);
    setTimeout(() => scrollToStep(newStep.id), 200);
  };

  const handleEditStep = index => {
    setSelectedStepId(steps[index].id);
    setTimeout(() => scrollToStep(steps[index].id), 200);
  };

  const handleSaveEditedStep = updatedStep => {
    const updated = steps.map(step =>
      step.id === updatedStep.id ? updatedStep : step
    );
    setSteps(updated);
    toast.success("✅ Step updated");
    setTimeout(() => scrollToStep(updatedStep.id), 300);
  };

  const handleLinkStep = (fromId, toId, buttonText = "") => {
    const updated = steps.map(step => {
      if (step.id !== fromId) return step;
      const existing = step.buttonLinks || [];
      const updatedLinks = [
        ...existing.filter(link => link.ButtonText !== buttonText),
        { ButtonText: buttonText, NextStepId: toId },
      ];
      return { ...step, buttonLinks: updatedLinks };
    });
    setSteps(updated);
    toast.info("🔗 Step linked");
  };

  const handleDeleteStep = index => {
    const updated = steps
      .filter((_, i) => i !== index)
      .map((s, i) => ({ ...s, stepOrder: i + 1 }));
    setSteps(updated);
    toast.warn("❌ Step deleted");
  };

  const handleSaveFlow = async (isPublished = false) => {
    if (!flowName || steps.length === 0) {
      toast.warn("⚠️ Please enter a flow name and at least one step.");
      return;
    }

    setSaving(true);
    try {
      await createFlow(flowName, steps, isActive, isPublished);
      toast.success(isPublished ? "🚀 Flow published!" : "💾 Draft saved");
    } catch (err) {
      console.error("❌ Failed to save flow:", err);
      toast.error("❌ Failed to save flow.");
    } finally {
      setSaving(false);
    }
  };

  const handleDragEnd = result => {
    const { source, destination } = result;
    if (!destination) return;

    const reordered = Array.from(steps);
    const [removed] = reordered.splice(source.index, 1);
    reordered.splice(destination.index, 0, removed);

    const updated = reordered.map((s, i) => ({
      ...s,
      stepOrder: i + 1,
    }));
    setSteps(updated);
  };

  const runJourney = () => {
    if (steps.length === 0) return;
    setIsRunning(true);
    let step = steps[0];

    const simulate = currentStep => {
      setActiveStepId(currentStep.id);
      scrollToStep(currentStep.id);

      const nextId = currentStep.buttonLinks?.[0]?.NextStepId;
      const next = steps.find(s => s.id === nextId);

      if (next) {
        setTimeout(() => simulate(next), 1500);
      } else {
        setTimeout(() => {
          setActiveStepId(null);
          setIsRunning(false);
          if (nextId && !next) {
            toast.warn("❌ Next step not found: Broken chain detected.");
          }
        }, 2000);
      }
    };

    simulate(step);
  };

  const selectedStep = steps.find(s => s.id === selectedStepId);

  return (
    <div className="max-w-6xl mx-auto p-6 sm:p-8 relative">
      <h2 className="text-3xl font-bold text-purple-700 mb-4">
        🎯 CTA Flow Builder
      </h2>

      {/* 🔁 Draft toggle */}
      <div className="mb-4 flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showDrafts}
            onChange={e => setShowDrafts(e.target.checked)}
          />
          Show Drafts
        </label>
        {showDrafts && (
          <span className="text-yellow-700 text-sm font-medium bg-yellow-100 px-2 py-1 rounded">
            👷 Draft Preview Mode
          </span>
        )}
      </div>

      {/* 🧩 Inputs */}
      <div className="mb-6 space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Flow Name
          </label>
          <input
            type="text"
            value={flowName}
            onChange={e => setFlowName(e.target.value)}
            placeholder="e.g. LeadFollowupFlow"
            className="mt-1 w-full border border-gray-300 rounded-md shadow-sm px-3 py-2"
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">
            Flow Status:
          </span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={isActive}
              onChange={e => setIsActive(e.target.checked)}
            />
            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-green-500 transition-all duration-300" />
            <span className="ml-2 text-sm text-gray-700">
              {isActive ? "Active" : "Inactive"}
            </span>
          </label>
        </div>
      </div>

      {/* 🧪 Buttons */}
      <div className="mb-6 flex flex-wrap gap-3">
        <button
          onClick={handleAddStep}
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 text-sm"
        >
          ➕ Add Step
        </button>
        <button
          onClick={runJourney}
          disabled={isRunning || steps.length === 0}
          className={`bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm ${
            isRunning ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {isRunning ? "⏳ Running..." : "▶️ Run Journey"}
        </button>
        <button
          onClick={() => handleSaveFlow(false)}
          disabled={saving || steps.length === 0}
          className={`bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 text-sm ${
            saving ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {saving ? "Saving..." : "📝 Save Draft"}
        </button>
        <button
          onClick={() => handleSaveFlow(true)}
          disabled={saving || steps.length === 0}
          className={`bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm ${
            saving ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {saving ? "Publishing..." : "🚀 Publish Flow"}
        </button>
      </div>

      {/* 🔗 Step Flow List */}
      <div className="relative">
        <FlowArrowLayer steps={steps} />
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="steps">
            {provided => (
              <div
                className="space-y-4 relative z-10"
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                {steps.map((step, index) => (
                  <Draggable
                    key={`step-${index}`}
                    draggableId={`step-${index}`}
                    index={index}
                  >
                    {provided => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        id={`step-card-${step.id}`}
                      >
                        <FlowStepCard
                          step={step}
                          index={index + 1}
                          onEdit={() => handleEditStep(index)}
                          onRequestDelete={() => setPendingDeleteIndex(index)}
                          disabled={saving}
                          templates={templates}
                          isActiveStep={activeStepId === step.id}
                          isDraft={showDrafts} // ✅ (for Step 13.4 if needed)
                        />
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

      {steps.length > 0 && (
        <div className="pt-6 space-y-6">
          <VisualFlowPreview steps={steps} />
          <VisualFlowMap steps={steps} onLinkStep={handleLinkStep} />
        </div>
      )}

      {selectedStep && (
        <StepDrawer
          step={selectedStep}
          templates={templates}
          allSteps={steps}
          onSave={handleSaveEditedStep}
          onClose={() => setSelectedStepId(null)}
        />
      )}

      <ConfirmDeleteModal
        open={pendingDeleteIndex !== null}
        onClose={() => setPendingDeleteIndex(null)}
        onConfirm={() => {
          if (pendingDeleteIndex !== null) {
            handleDeleteStep(pendingDeleteIndex);
            setPendingDeleteIndex(null);
          }
        }}
      />
    </div>
  );
}

// // 📄 File: src/pages/CTAFlowBuilder/CTAFlowBuilder.jsx
// import React, { useEffect, useState } from "react";
// import FlowStepCard from "./FlowStepCard";
// import ConfirmDeleteModal from "../../components/ui/ConfirmDeleteModal";
// import { getCurrentFlow, getDraftFlow, createFlow } from "./api";
// import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
// import { toast } from "react-toastify";
// import VisualFlowPreview from "./VisualFlowPreview";
// import VisualFlowMap from "./VisualFlowMap";
// import StepDrawer from "./StepDrawer";
// import FlowArrowLayer from "./FlowArrowLayer";
// import axiosClient from "../../api/axiosClient";

// export default function CTAFlowBuilder() {
//   const [flow, setFlow] = useState(null);
//   const [steps, setSteps] = useState([]);
//   const [templates, setTemplates] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);
//   const [flowName, setFlowName] = useState("");
//   const [isActive, setIsActive] = useState(true);
//   const [pendingDeleteIndex, setPendingDeleteIndex] = useState(null);
//   const [selectedStepId, setSelectedStepId] = useState(null);
//   const [isRunning, setIsRunning] = useState(false);
//   const [activeStepId, setActiveStepId] = useState(null);
//   const [showDrafts, setShowDrafts] = useState(false);

//   const scrollToStep = id => {
//     const el = document.getElementById(`step-card-${id}`);
//     if (el) {
//       el.scrollIntoView({ behavior: "smooth", block: "center" });
//     }
//   };

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const [flowRes, templateRes] = await Promise.all([
//           showDrafts ? getDraftFlow() : getCurrentFlow(),
//           axiosClient.get("/WhatsAppTemplateFetcher/get-template-all"),
//         ]);

//         if (!flowRes) {
//           toast.info(
//             "ℹ️ No published flow found. You can start by adding steps."
//           );
//           setFlow(null);
//           setSteps([]);
//           setFlowName("");
//           setIsActive(true);
//         } else {
//           setFlow(flowRes);
//           setSteps(flowRes.steps || []);
//           setFlowName(flowRes.flowName || "");
//           setIsActive(flowRes.isActive ?? true);
//         }

//         const tplList = templateRes.data.templates;
//         setTemplates(Array.isArray(tplList) ? tplList : []);
//       } catch (err) {
//         console.error("Error loading flow/templates:", err);
//         toast.error("Failed to load flow or templates");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchData();
//   }, [showDrafts]);

//   const handleAddStep = () => {
//     const newStep = {
//       id: crypto.randomUUID(),
//       buttonText: "",
//       templateName: "",
//       buttonLinks: [],
//       stepOrder: steps.length + 1,
//     };
//     setSteps(prev => [...prev, newStep]);
//     setSelectedStepId(newStep.id);
//     setTimeout(() => scrollToStep(newStep.id), 200);
//   };

//   const handleEditStep = index => {
//     setSelectedStepId(steps[index].id);
//     setTimeout(() => scrollToStep(steps[index].id), 200);
//   };

//   const handleSaveEditedStep = updatedStep => {
//     const updated = steps.map(step =>
//       step.id === updatedStep.id ? updatedStep : step
//     );
//     setSteps(updated);
//     toast.success("✅ Step updated");
//     setTimeout(() => scrollToStep(updatedStep.id), 300);
//   };

//   const handleLinkStep = (fromId, toId, buttonText = "") => {
//     const updated = steps.map(step => {
//       if (step.id !== fromId) return step;
//       const existing = step.buttonLinks || [];
//       const updatedLinks = [
//         ...existing.filter(link => link.ButtonText !== buttonText),
//         { ButtonText: buttonText, NextStepId: toId },
//       ];
//       return { ...step, buttonLinks: updatedLinks };
//     });
//     setSteps(updated);
//     toast.info("🔗 Step linked");
//   };

//   const handleDeleteStep = index => {
//     const updated = steps
//       .filter((_, i) => i !== index)
//       .map((s, i) => ({ ...s, stepOrder: i + 1 }));
//     setSteps(updated);
//     toast.warn("❌ Step deleted");
//   };

//   const handleSaveFlow = async (isPublished = false) => {
//     if (!flowName || steps.length === 0) {
//       toast.warn("⚠️ Please enter a flow name and at least one step.");
//       return;
//     }

//     setSaving(true);
//     try {
//       await createFlow(flowName, steps, isActive, isPublished);
//       toast.success(isPublished ? "🚀 Flow published!" : "💾 Draft saved");
//     } catch (err) {
//       console.error("❌ Failed to save flow:", err);
//       toast.error("❌ Failed to save flow.");
//     } finally {
//       setSaving(false);
//     }
//   };

//   const handleDragEnd = result => {
//     const { source, destination } = result;
//     if (!destination) return;

//     const reordered = Array.from(steps);
//     const [removed] = reordered.splice(source.index, 1);
//     reordered.splice(destination.index, 0, removed);

//     const updated = reordered.map((s, i) => ({
//       ...s,
//       stepOrder: i + 1,
//     }));
//     setSteps(updated);
//   };

//   const runJourney = () => {
//     if (steps.length === 0) return;
//     setIsRunning(true);
//     let step = steps[0];

//     const simulate = currentStep => {
//       setActiveStepId(currentStep.id);
//       scrollToStep(currentStep.id);

//       const nextId = currentStep.buttonLinks?.[0]?.NextStepId;
//       const next = steps.find(s => s.id === nextId);

//       if (next) {
//         setTimeout(() => simulate(next), 1500);
//       } else {
//         setTimeout(() => {
//           setActiveStepId(null);
//           setIsRunning(false);
//           if (nextId && !next) {
//             toast.warn("❌ Next step not found: Broken chain detected.");
//           }
//         }, 2000);
//       }
//     };

//     simulate(step);
//   };

//   const selectedStep = steps.find(s => s.id === selectedStepId);

//   return (
//     <div className="max-w-6xl mx-auto p-6 sm:p-8 relative">
//       <h2 className="text-3xl font-bold text-purple-700 mb-4">
//         🎯 CTA Flow Builder
//       </h2>

//       {/* 🔁 Draft toggle */}
//       <div className="mb-4 flex items-center gap-4">
//         <label className="flex items-center gap-2 text-sm">
//           <input
//             type="checkbox"
//             checked={showDrafts}
//             onChange={e => setShowDrafts(e.target.checked)}
//           />
//           Show Drafts
//         </label>
//         {showDrafts && (
//           <span className="text-yellow-700 text-sm font-medium bg-yellow-100 px-2 py-1 rounded">
//             👷 Draft Preview Mode
//           </span>
//         )}
//       </div>

//       {/* 🧩 Inputs */}
//       <div className="mb-6 space-y-3">
//         <div>
//           <label className="block text-sm font-medium text-gray-700">
//             Flow Name
//           </label>
//           <input
//             type="text"
//             value={flowName}
//             onChange={e => setFlowName(e.target.value)}
//             placeholder="e.g. LeadFollowupFlow"
//             className="mt-1 w-full border border-gray-300 rounded-md shadow-sm px-3 py-2"
//           />
//         </div>

//         <div className="flex items-center justify-between">
//           <span className="text-sm font-medium text-gray-600">
//             Flow Status:
//           </span>
//           <label className="relative inline-flex items-center cursor-pointer">
//             <input
//               type="checkbox"
//               className="sr-only peer"
//               checked={isActive}
//               onChange={e => setIsActive(e.target.checked)}
//             />
//             <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-green-500 transition-all duration-300" />
//             <span className="ml-2 text-sm text-gray-700">
//               {isActive ? "Active" : "Inactive"}
//             </span>
//           </label>
//         </div>
//       </div>

//       {/* 🧪 Buttons */}
//       <div className="mb-6 flex flex-wrap gap-3">
//         <button
//           onClick={handleAddStep}
//           className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 text-sm"
//         >
//           ➕ Add Step
//         </button>
//         <button
//           onClick={runJourney}
//           disabled={isRunning || steps.length === 0}
//           className={`bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm ${
//             isRunning ? "opacity-50 cursor-not-allowed" : ""
//           }`}
//         >
//           {isRunning ? "⏳ Running..." : "▶️ Run Journey"}
//         </button>
//         <button
//           onClick={() => handleSaveFlow(false)}
//           disabled={saving || steps.length === 0}
//           className={`bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 text-sm ${
//             saving ? "opacity-50 cursor-not-allowed" : ""
//           }`}
//         >
//           {saving ? "Saving..." : "📝 Save Draft"}
//         </button>
//         <button
//           onClick={() => handleSaveFlow(true)}
//           disabled={saving || steps.length === 0}
//           className={`bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm ${
//             saving ? "opacity-50 cursor-not-allowed" : ""
//           }`}
//         >
//           {saving ? "Publishing..." : "🚀 Publish Flow"}
//         </button>
//       </div>

//       {/* 🔗 Step Flow List */}
//       <div className="relative">
//         <FlowArrowLayer steps={steps} />
//         <DragDropContext onDragEnd={handleDragEnd}>
//           <Droppable droppableId="steps">
//             {provided => (
//               <div
//                 className="space-y-4 relative z-10"
//                 ref={provided.innerRef}
//                 {...provided.droppableProps}
//               >
//                 {steps.map((step, index) => (
//                   <Draggable
//                     key={`step-${index}`}
//                     draggableId={`step-${index}`}
//                     index={index}
//                   >
//                     {provided => (
//                       <div
//                         ref={provided.innerRef}
//                         {...provided.draggableProps}
//                         {...provided.dragHandleProps}
//                         id={`step-card-${step.id}`}
//                       >
//                         <FlowStepCard
//                           step={step}
//                           index={index + 1}
//                           onEdit={() => handleEditStep(index)}
//                           onRequestDelete={() => setPendingDeleteIndex(index)}
//                           disabled={saving}
//                           templates={templates}
//                           isActiveStep={activeStepId === step.id}
//                           isDraft={showDrafts} // ✅ (for Step 13.4 if needed)
//                         />
//                       </div>
//                     )}
//                   </Draggable>
//                 ))}
//                 {provided.placeholder}
//               </div>
//             )}
//           </Droppable>
//         </DragDropContext>
//       </div>

//       {steps.length > 0 && (
//         <div className="pt-6 space-y-6">
//           <VisualFlowPreview steps={steps} />
//           <VisualFlowMap steps={steps} onLinkStep={handleLinkStep} />
//         </div>
//       )}

//       {selectedStep && (
//         <StepDrawer
//           step={selectedStep}
//           templates={templates}
//           allSteps={steps}
//           onSave={handleSaveEditedStep}
//           onClose={() => setSelectedStepId(null)}
//         />
//       )}

//       <ConfirmDeleteModal
//         open={pendingDeleteIndex !== null}
//         onClose={() => setPendingDeleteIndex(null)}
//         onConfirm={() => {
//           if (pendingDeleteIndex !== null) {
//             handleDeleteStep(pendingDeleteIndex);
//             setPendingDeleteIndex(null);
//           }
//         }}
//       />
//     </div>
//   );
// }
