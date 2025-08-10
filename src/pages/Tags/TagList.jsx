import { useEffect, useState } from "react";
import { Trash2, Pencil } from "lucide-react";
import { toast } from "react-toastify";

export default function TagList({ onEditTag, refreshTrigger }) {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchTags = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tags");
      const result = await res.json();

      // ✅ Extract actual array from result.data
      if (Array.isArray(result.data)) {
        setTags(result.data);
      } else {
        setTags([]);
        console.error(
          "Invalid response from /api/tags. Expected result.data to be array:",
          result
        );
        toast.error("❌ Invalid tag data received");
      }
    } catch (err) {
      console.error("Failed to fetch tags", err);
      toast.error("❌ Failed to load tags");
      setTags([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, [refreshTrigger]);

  const handleDelete = async id => {
    if (!window.confirm("Are you sure you want to delete this tag?")) return;

    try {
      const res = await fetch(`/api/tags/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error();

      toast.success("✅ Tag deleted");
      fetchTags();
    } catch (err) {
      toast.error("❌ Failed to delete tag");
    }
  };

  return (
    <div className="mt-6 bg-white rounded-md border shadow-sm p-6 transition hover:shadow-md">
      <h2 className="text-lg font-bold text-gray-800 mb-3">🗂️ All Tags</h2>

      {loading ? (
        <p className="text-sm text-gray-500">Loading tags...</p>
      ) : tags.length === 0 ? (
        <p className="text-sm text-gray-500">No tags found.</p>
      ) : (
        <div className="space-y-3">
          {tags.map(tag => (
            <div
              key={tag.id}
              className="flex items-center justify-between border-b pb-2"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full border"
                  style={{ backgroundColor: tag.colorHex || "#ccc" }}
                ></div>
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {tag.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {tag.category || "Uncategorized"}{" "}
                    {tag.isSystemTag && "· System"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => onEditTag(tag)}
                  className="text-gray-600 hover:text-purple-600"
                  title="Edit"
                >
                  <Pencil size={18} />
                </button>
                <button
                  onClick={() => handleDelete(tag.id)}
                  className="text-gray-600 hover:text-red-600"
                  title="Delete"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
