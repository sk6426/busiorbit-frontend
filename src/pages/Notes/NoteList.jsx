import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";

function NoteList({ contactId, onEdit, refreshKey }) {
  const [notes, setNotes] = useState([]);

  // 🟢 Wrap fetchNotes in useCallback so its identity is stable across renders
  const fetchNotes = useCallback(async () => {
    if (!contactId) return;
    try {
      const res = await axios.get(`/api/notes/contact/${contactId}`);
      setNotes(res.data);
    } catch (err) {
      console.error("❌ Failed to fetch notes:", err);
    }
  }, [contactId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes, refreshKey]); // useCallback ensures fetchNotes is stable

  const handleDelete = async id => {
    if (!window.confirm("Delete this note?")) return;
    try {
      await axios.delete(`/api/notes/${id}`);
      fetchNotes();
    } catch (err) {
      console.error("❌ Failed to delete note:", err);
    }
  };

  return (
    <div className="grid gap-4">
      {notes.length === 0 && (
        <div className="text-gray-500 text-center py-6">
          No notes found for this contact.
        </div>
      )}

      {notes.map(note => (
        <div
          key={note.id}
          className={`border p-4 rounded-xl shadow-sm relative bg-white hover:shadow-md transition-all ${
            note.isPinned ? "border-purple-500" : "border-gray-200"
          }`}
        >
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-lg text-purple-700 flex gap-2 items-center">
              {note.title || "Untitled"}
              {note.isPinned && (
                <span title="Pinned" className="text-purple-500">
                  📌
                </span>
              )}
              {note.isInternal && (
                <span title="Internal Note" className="text-gray-400">
                  🔒
                </span>
              )}
            </h3>
            <div className="flex gap-2 text-sm">
              <button
                onClick={() => onEdit(note)}
                className="text-blue-600 hover:underline"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(note.id)}
                className="text-red-500 hover:underline"
              >
                Delete
              </button>
            </div>
          </div>
          <p className="text-sm text-gray-800 mt-2 whitespace-pre-line">
            {note.content}
          </p>
          <div className="text-xs text-gray-500 mt-3">
            Created by <b>{note.createdBy}</b> ·{" "}
            {new Date(note.createdAt).toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}

export default NoteList;
