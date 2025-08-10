// 📄 File: src/pages/Tags/Tags.jsx
import React, { useState } from "react";
import { Tag } from "lucide-react";
import TagForm from "./TagForm";
import TagList from "./TagList";
import { toast } from "react-toastify";

export default function Tags() {
  const [selectedTag, setSelectedTag] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleEdit = tag => {
    setSelectedTag(tag);
  };

  const handleSaveComplete = (success = true, message = "") => {
    setSelectedTag(null);
    setRefreshKey(prev => prev + 1);

    if (success) {
      toast.success(message || "✅ Tag saved successfully");
    } else {
      toast.error(message || "❌ Failed to save tag");
    }
  };

  const handleDeleteComplete = (success = true, message = "") => {
    setRefreshKey(prev => prev + 1);

    if (success) {
      toast.success(message || "🗑️ Tag deleted successfully");
    } else {
      toast.error(message || "❌ Failed to delete tag");
    }
  };

  return (
    <div className="p-6 space-y-8">
      {/* 🟣 Smart Banner */}
      <div className="bg-gradient-to-br from-purple-50 to-white border border-purple-200 rounded-md shadow-sm p-5 flex items-start gap-4">
        <div className="bg-purple-100 text-purple-700 rounded-md p-2 shadow-sm">
          <Tag size={24} />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-purple-800 mb-1">
            Organise Smartly with Tags
          </h2>
          <p className="text-sm text-gray-700 leading-relaxed">
            Tags help you <strong>segment, prioritise</strong>, and manage your
            contacts effectively. Add labels like{" "}
            <span className="text-purple-700 font-medium">"Leads"</span>,{" "}
            <span className="text-purple-700 font-medium">"Follow Up"</span>, or{" "}
            <span className="text-purple-700 font-medium">"VIP"</span> to group
            and target the right audience. It’s the fastest way to personalise
            campaigns and automate your CRM flow.
          </p>
        </div>
      </div>

      {/* 🧱 Form + Tag List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ➕ Add/Edit Tag Form */}
        <TagForm
          selectedTag={selectedTag}
          onSaveComplete={handleSaveComplete}
        />

        {/* 🏷️ Tag List */}
        <div className="space-y-3">
          <h2 className="text-md font-semibold text-gray-700 px-1">
            🏷️ Tag List
          </h2>
          <TagList
            onEdit={handleEdit}
            refreshKey={refreshKey}
            onDeleteComplete={handleDeleteComplete}
          />
        </div>
      </div>
    </div>
  );
}
