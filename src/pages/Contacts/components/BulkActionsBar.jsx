import React, { useEffect, useState } from "react";
import axiosClient from "../../../api/axiosClient";
import { toast } from "react-toastify";

function BulkActionsBar({ selectedIds = [], onClearSelection, onRefresh }) {
  const [availableTags, setAvailableTags] = useState([]);
  const [selectedTagId, setSelectedTagId] = useState("");

  useEffect(() => {
    if (selectedIds.length > 0) {
      fetchTags();
    }
  }, [selectedIds.length]);

  const fetchTags = async () => {
    try {
      const res = await axiosClient.get("/tags/get-tags");
      setAvailableTags(res.data.data || []);
    } catch (error) {
      toast.error("❌ Failed to load tags");
    }
  };

  const handleApplyTag = async () => {
    if (!selectedTagId) {
      toast.warn("Please select a tag first");
      return;
    }

    try {
      await axiosClient.post("/contacts/bulk-assign-tag", {
        contactIds: selectedIds,
        tagId: selectedTagId,
      });

      toast.success("✅ Tag assigned to selected contacts");
      onClearSelection?.();
      onRefresh?.();
    } catch (error) {
      const message =
        error.response?.data?.message || "❌ Failed to assign tag";
      toast.error(message);
    }
  };

  if (selectedIds.length === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center bg-blue-50 border border-blue-200 rounded-md p-3 mb-4 space-y-2 sm:space-y-0">
      <p className="text-sm text-gray-700 font-medium">
        {selectedIds.length} contact(s) selected
      </p>

      <div className="flex items-center gap-3 w-full sm:w-auto">
        <select
          value={selectedTagId}
          onChange={e => setSelectedTagId(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full sm:w-56"
        >
          <option value="">-- Select Tag --</option>
          {availableTags.map(tag => (
            <option key={tag.id} value={tag.id}>
              {tag.name}
            </option>
          ))}
        </select>

        <button
          onClick={handleApplyTag}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-sm shadow-sm"
        >
          Apply Tag
        </button>

        <button
          onClick={onClearSelection}
          className="text-sm text-gray-600 hover:underline"
        >
          Clear
        </button>
      </div>
    </div>
  );
}

export default BulkActionsBar;
