import React, { useState } from "react";
import { toast } from "react-toastify";
import axios from "axios";

// Props: isOpen (bool), onClose (fn), onUploadComplete (contacts, skipSaving)
export default function CsvUploadModal({ isOpen, onClose, onUploadComplete }) {
  const [file, setFile] = useState(null);
  const [skipSaving, setSkipSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = e => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      toast.warn("⚠️ Please select a CSV file.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    try {
      const res = await axios.post("/api/contacts/parse-csv", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const contacts = res.data;
      if (!Array.isArray(contacts) || contacts.length === 0) {
        toast.error("❌ No valid contacts parsed from file.");
        return;
      }

      toast.success("✅ CSV parsed successfully!");
      onUploadComplete(contacts, skipSaving);
      setFile(null); // 🔁 Reset file after success
      onClose();
    } catch (err) {
      console.error("❌ Upload error:", err);
      toast.error("❌ Failed to parse CSV. Please check format.");
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-md w-full max-w-md space-y-4">
        <h2 className="text-xl font-bold text-purple-700">
          📥 Upload CSV File
        </h2>

        <input type="file" accept=".csv" onChange={handleFileChange} />

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={skipSaving}
            onChange={e => setSkipSaving(e.target.checked)}
          />
          <label className="text-sm">
            Don't save contacts to CRM (temporary)
          </label>
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="px-4 py-2 rounded bg-purple-600 text-white hover:bg-purple-700 text-sm"
          >
            {uploading ? "⏳ Uploading..." : "🚀 Upload"}
          </button>
        </div>
      </div>
    </div>
  );
}
