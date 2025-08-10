import React, { useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import AutoReplyCanvas from "./components/AutoReplyCanvas";
import AutoReplySidebar from "./components/AutoReplySidebar";
import { Button } from "../../components/ui/button";
import { toast } from "react-toastify";

export default function AutoReplyBuilder() {
  const canvasRef = useRef();
  const [searchParams] = useSearchParams();
  const flowId = searchParams.get("flowId");

  // ✅ SAVE FLOW handler (connected to <AutoReplyCanvas />)
  const handleSaveFlow = async payload => {
    try {
      const response = await fetch("/api/autoreplyflows/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // Only send the payload fields - do NOT include businessId!
        body: JSON.stringify({
          ...payload,
          // Optionally include flowId if you are updating (if backend expects it)
          // flowId, // UNCOMMENT ONLY IF backend requires this for updates
        }),
      });

      if (!response.ok) throw new Error("Save failed");
      toast.success("✅ Flow saved successfully!");
    } catch (err) {
      toast.error("❌ Failed to save flow");
      console.error("Save error:", err);
    }
  };

  const loadFlowById = async flowId => {
    try {
      const res = await fetch(`/AutoReplyFlows/${flowId}`);
      if (!res.ok) throw new Error("Failed to fetch flow");

      const data = await res.json();
      canvasRef.current?.loadFlow(data);
      toast.success("✅ Flow loaded");
    } catch (err) {
      toast.error("❌ Error loading flow");
    }
  };

  useEffect(() => {
    if (flowId) {
      loadFlowById(flowId);
    }
  }, [flowId]);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar (left) */}
      <div className="w-72 border-r border-gray-200 bg-white p-4">
        <h2 className="text-lg font-semibold mb-4 text-zinc-800">
          🧠 Auto-Reply Blocks
        </h2>
        <AutoReplySidebar />
      </div>

      {/* Main Area (right) */}
      <div className="flex-1 flex flex-col">
        {/* Topbar */}
        <div className="flex justify-between items-center px-6 py-3 border-b bg-white shadow-sm">
          <h2 className="text-md font-medium text-zinc-800">🔀 Flow Canvas</h2>
          <Button onClick={() => canvasRef.current?.saveFlow?.()}>
            💾 Save Flow
          </Button>
        </div>

        {/* Canvas */}
        <div className="flex-1 bg-white relative">
          <AutoReplyCanvas
            ref={canvasRef}
            flowName=""
            triggerKeywords=""
            onSave={handleSaveFlow} // ✅ Connected here
          />
        </div>
      </div>
    </div>
  );
}
