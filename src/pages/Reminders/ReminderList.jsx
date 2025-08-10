import React, { useEffect, useState } from "react";
import axios from "axios";

function ReminderList({ onEdit, refreshKey }) {
  const [reminders, setReminders] = useState([]);

  useEffect(() => {
    fetchReminders();
  }, [refreshKey]);

  const fetchReminders = async () => {
    try {
      const res = await axios.get("/api/reminders");
      setReminders(res.data);
    } catch (err) {
      console.error("❌ Failed to fetch reminders:", err);
    }
  };

  const handleDelete = async id => {
    const confirmDelete = window.confirm("Delete this reminder?");
    if (!confirmDelete) return;

    try {
      await axios.delete(`/api/reminders/${id}`);
      fetchReminders();
    } catch (err) {
      console.error("❌ Failed to delete reminder:", err);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border text-left rounded-lg">
        <thead className="bg-gray-100 text-sm font-semibold">
          <tr>
            <th className="p-2">Title</th>
            <th className="p-2">Due At</th>
            <th className="p-2">Status</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {reminders.map(reminder => (
            <tr key={reminder.id} className="border-t">
              <td className="p-2">{reminder.title}</td>
              <td className="p-2">
                {new Date(reminder.dueAt).toLocaleString()}
              </td>
              <td className="p-2">{reminder.status}</td>
              <td className="p-2 flex gap-2">
                <button
                  onClick={() => onEdit(reminder)}
                  className="px-2 py-1 text-sm bg-blue-500 text-white rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(reminder.id)}
                  className="px-2 py-1 text-sm bg-red-500 text-white rounded"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {reminders.length === 0 && (
            <tr>
              <td colSpan="4" className="text-center py-4 text-gray-500">
                No reminders found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default ReminderList;
