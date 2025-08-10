import React, { useEffect, useState } from "react";
import axiosClient from "../../../api/axiosClient";

import { toast } from "react-toastify";

export default function BulkActionsBar({ selectedIds = [], onTagsAssigned }) {
  const [availableTags, setAvailableTags] = useState([]);
  const [selectedTagId, setSelectedTagId] = useState("");

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      const res = await axiosClient.get("/tags");
      setAvailableTags(res.data);
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
      onTagsAssigned?.(); // Trigger parent refresh
    } catch (error) {
      toast.error("❌ Failed to assign tag");
    }
  };

  if (selectedIds.length === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center bg-gray-50 border border-gray-300 rounded-md p-3 mb-4">
      <p className="text-sm text-gray-700 mb-2 sm:mb-0">
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
              {tag.tagName}
            </option>
          ))}
        </select>

        <button
          onClick={handleApplyTag}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-sm shadow"
        >
          ✅ Apply Tag
        </button>
      </div>
    </div>
  );
}
