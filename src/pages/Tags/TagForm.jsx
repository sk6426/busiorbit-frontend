import { useState, useEffect } from "react";
import { Tag, PlusCircle } from "lucide-react";
import { toast } from "react-toastify";

export default function TagForm({ selectedTag, onSaveComplete }) {
  const [tag, setTag] = useState({
    name: "",
    colorHex: "",
    category: "",
    notes: "",
    isSystemTag: false,
    isActive: true,
  });

  useEffect(() => {
    if (selectedTag) {
      setTag(selectedTag);
    }
  }, [selectedTag]);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setTag(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();

    if (!tag.name.trim()) return;

    try {
      const method = selectedTag ? "PUT" : "POST";
      const url = selectedTag ? `/api/tags/${selectedTag.id}` : "/api/tags";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tag),
      });

      if (!res.ok) throw new Error("Failed to save tag");

      toast.success(
        `✅ Tag ${selectedTag ? "updated" : "added"} successfully!`
      );
      onSaveComplete();
    } catch (err) {
      console.error("❌ Failed to save tag:", err);
      toast.error("❌ Failed to save tag");
    }
  };

  const isFormValid = tag.name.trim().length > 0;

  return (
    <div className="bg-white rounded-md border shadow-sm p-6 w-full transition hover:shadow-md">
      {/* 🏷️ Form Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="bg-purple-100 text-purple-700 rounded-xl p-2">
          <Tag size={22} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-800">
            {selectedTag ? "Edit Tag" : "Add New Tag"}
          </h2>
          <p className="text-sm text-gray-600">
            Create custom tags with color, category, and notes.
          </p>
        </div>
      </div>

      {/* 📝 Form Fields */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">
            Tag Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={tag.name}
            onChange={handleChange}
            placeholder="e.g. High Priority"
            className="w-full px-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">
            Tag Color (Hex)
          </label>
          <input
            type="text"
            name="colorHex"
            value={tag.colorHex}
            onChange={handleChange}
            placeholder="#FF5733"
            className="w-full px-4 py-2 border rounded-md text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">
            Category
          </label>
          <input
            type="text"
            name="category"
            value={tag.category}
            onChange={handleChange}
            placeholder="e.g. Priority"
            className="w-full px-4 py-2 border rounded-md text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">
            Notes
          </label>
          <textarea
            name="notes"
            value={tag.notes}
            onChange={handleChange}
            placeholder="Optional description..."
            rows={3}
            className="w-full px-4 py-2 border rounded-md text-sm resize-none"
          />
        </div>

        <div className="flex items-center gap-6 mt-1">
          <label className="flex items-center text-sm gap-2">
            <input
              type="checkbox"
              name="isSystemTag"
              checked={tag.isSystemTag}
              onChange={handleChange}
            />
            System Tag
          </label>

          <label className="flex items-center text-sm gap-2">
            <input
              type="checkbox"
              name="isActive"
              checked={tag.isActive}
              onChange={handleChange}
            />
            Active
          </label>
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t flex justify-end">
          <button
            type="submit"
            disabled={!isFormValid}
            className={`inline-flex items-center gap-2 px-5 py-2 rounded-md text-white text-sm font-medium transition ${
              isFormValid
                ? "bg-purple-600 hover:bg-purple-700"
                : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            <PlusCircle size={18} />
            {selectedTag ? "Update Tag" : "Add Tag"}
          </button>
        </div>
      </form>
    </div>
  );
}
