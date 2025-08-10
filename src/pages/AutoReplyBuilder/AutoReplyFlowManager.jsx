import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Button } from "../../components/ui/button";

export default function AutoReplyFlowManager() {
  const [flows, setFlows] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [newName, setNewName] = useState("");
  const navigate = useNavigate();

  const fetchFlows = async () => {
    try {
      const res = await fetch(
        "/AutoReplyFlows/business/" + localStorage.getItem("businessId")
      );
      const data = await res.json();
      setFlows(data);
    } catch (err) {
      toast.error("❌ Failed to load flows");
    }
  };

  useEffect(() => {
    fetchFlows();
  }, []);

  const handleOpen = flowId => {
    navigate(`/app/auto-reply-builder?flowId=${flowId}`);
  };

  const handleRename = async id => {
    if (!newName.trim()) return;

    try {
      const res = await fetch(`/AutoReplyFlows/${id}/rename`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newName }),
      });

      if (!res.ok) throw new Error();
      toast.success("✅ Flow renamed");
      setEditingId(null);
      fetchFlows();
    } catch {
      toast.error("❌ Failed to rename");
    }
  };

  const handleDelete = async id => {
    const confirm = window.confirm(
      "Are you sure you want to delete this flow?"
    );
    if (!confirm) return;

    try {
      const res = await fetch(`/AutoReplyFlows/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("🗑️ Flow deleted");
      fetchFlows();
    } catch {
      toast.error("❌ Failed to delete flow");
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-bold mb-6 text-zinc-800">
        📄 Saved Auto-Reply Flows
      </h2>

      {flows.length === 0 ? (
        <p className="text-gray-500 text-sm">No flows found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {flows.map(flow => (
            <div
              key={flow.id}
              className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col justify-between"
            >
              <div className="mb-4">
                {editingId === flow.id ? (
                  <input
                    className="w-full border px-2 py-1 rounded text-sm"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    onBlur={() => handleRename(flow.id)}
                    onKeyDown={e => {
                      if (e.key === "Enter") handleRename(flow.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    autoFocus
                  />
                ) : (
                  <div className="flex justify-between items-start gap-2">
                    <div className="text-lg font-medium text-zinc-800">
                      {flow.name}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingId(flow.id);
                          setNewName(flow.name);
                        }}
                        className="text-blue-600 text-sm"
                        title="Rename"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(flow.id)}
                        className="text-red-500 text-sm"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                )}
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(flow.createdAt).toLocaleString()}
                </div>
              </div>

              <Button onClick={() => handleOpen(flow.id)} className="w-full">
                🧠 Open Flow
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
