import React, { useEffect, useState } from "react";
import axios from "axios";

/**
 * TagSelector - A dropdown/select box to choose one or more tags.
 * Props:
 * - selected: array of selected tag IDs
 * - onChange: callback with updated tag array
 * - multi: boolean (allow multi-select or not)
 */
export default function TagSelector({ selected = [], onChange, multi = true }) {
  const [tags, setTags] = useState([]);

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      const res = await axios.get("/api/tags");
      setTags(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("❌ Failed to load tags", err);
      setTags([]); // fallback to empty
    }
  };

  const handleToggle = tagId => {
    if (multi) {
      const isSelected = selected.includes(tagId);
      const updated = isSelected
        ? selected.filter(id => id !== tagId)
        : [...selected, tagId];
      onChange(updated);
    } else {
      onChange([tagId]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {(Array.isArray(tags) ? tags : []).map(tag => {
        const isSelected = selected.includes(tag.id);
        return (
          <button
            key={tag.id}
            onClick={() => handleToggle(tag.id)}
            className={`px-3 py-1 rounded-full text-sm border transition-all duration-150 ${
              isSelected
                ? "bg-purple-600 text-white border-purple-600"
                : "bg-gray-100 text-gray-700 border-gray-300"
            }`}
            title={tag.notes || tag.name}
          >
            <span
              className="inline-block w-2 h-2 rounded-full mr-2"
              style={{ backgroundColor: tag.colorHex || "#999" }}
            ></span>
            {tag.name}
          </button>
        );
      })}
    </div>
  );
}
