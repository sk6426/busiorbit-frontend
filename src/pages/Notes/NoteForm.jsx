import React, { useEffect, useState } from "react";
import axios from "axios";
import axiosClient from "../../api/axiosClient"; // ✅ Add this for timeline entry
import { toast } from "react-toastify";

function NoteForm({ contactId, selectedNote, onSaveComplete }) {
  const [formData, setFormData] = useState({
    contactId: contactId,
    title: "",
    content: "",
    source: "Manual",
    createdBy: "Admin", // Later: pull from auth
    isPinned: false,
    isInternal: false,
  });

  useEffect(() => {
    if (selectedNote) {
      setFormData({ ...selectedNote });
    } else {
      setFormData({
        contactId: contactId,
        title: "",
        content: "",
        source: "Manual",
        createdBy: "Admin",
        isPinned: false,
        isInternal: false,
      });
    }
  }, [selectedNote, contactId]);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const payload = { ...formData, contactId };

      if (selectedNote?.id) {
        await axios.put(`/api/notes/${selectedNote.id}`, payload);
        toast.info("📝 Note updated.");
      } else {
        await axios.post("/api/notes", payload);
        toast.success("✅ Note added.");
      }

      // ✅ Auto-log to timeline
      try {
        await axiosClient.post("/leadtimeline", {
          contactId,
          eventType: "NoteAdded",
          description: `Note titled '${payload.title}' was ${
            selectedNote ? "updated" : "added"
          }.`,
          createdBy: payload.createdBy,
          source: "Note",
          category: "Manual",
          isSystemGenerated: true,
        });
      } catch (timelineErr) {
        console.warn("Timeline log failed:", timelineErr);
      }

      onSaveComplete();
    } catch (err) {
      console.error("❌ Failed to save note:", err);
      toast.error("Failed to save note.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        name="title"
        value={formData.title}
        onChange={handleChange}
        placeholder="Note Title"
        className="w-full border rounded-lg px-3 py-2"
      />
      <textarea
        name="content"
        value={formData.content}
        onChange={handleChange}
        placeholder="Write your note here..."
        rows={5}
        className="w-full border rounded-lg px-3 py-2"
      />
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            name="isPinned"
            checked={formData.isPinned}
            onChange={handleChange}
            className="mr-2"
          />
          Pin Note
        </label>
        <label className="flex items-center">
          <input
            type="checkbox"
            name="isInternal"
            checked={formData.isInternal}
            onChange={handleChange}
            className="mr-2"
          />
          Internal Only
        </label>
      </div>
      <button
        type="submit"
        className="bg-purple-600 text-white px-4 py-2 rounded-lg"
      >
        {selectedNote ? "Update Note" : "Add Note"}
      </button>
    </form>
  );
}

export default NoteForm;
