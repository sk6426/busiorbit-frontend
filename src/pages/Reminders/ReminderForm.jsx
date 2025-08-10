import React, { useEffect, useState } from "react";
import axios from "axios";
import axiosClient from "../../api/axiosClient"; // ✅ for timeline logging
import { toast } from "react-toastify";

function ReminderForm({ selectedReminder, onSaveComplete }) {
  const [formData, setFormData] = useState({
    contactId: "3fa85f64-5717-4562-b3fc-2c963f66afa6", // Will be dynamic later
    title: "",
    description: "",
    dueAt: "",
    reminderType: "",
    priority: 2,
    isRecurring: false,
    recurrencePattern: "",
    sendWhatsappNotification: false,
    linkedCampaign: "",
    status: "Pending",
  });

  useEffect(() => {
    if (selectedReminder) {
      setFormData({ ...selectedReminder });
    } else {
      setFormData({
        contactId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        title: "",
        description: "",
        dueAt: "",
        reminderType: "",
        priority: 2,
        isRecurring: false,
        recurrencePattern: "",
        sendWhatsappNotification: false,
        linkedCampaign: "",
        status: "Pending",
      });
    }
  }, [selectedReminder]);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    const val = type === "checkbox" ? checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleSubmit = async e => {
    e.preventDefault();

    try {
      let isNew = false;

      if (selectedReminder?.id) {
        await axios.put(`/api/reminders/${selectedReminder.id}`, formData);
        toast.info("🔄 Reminder updated.");
      } else {
        await axios.post("/api/reminders", formData);
        toast.success("✅ Reminder added.");
        isNew = true;
      }

      // ✅ Auto-log to timeline
      try {
        const { title, dueAt, priority, contactId } = formData;

        const priorityLabel =
          {
            1: "High",
            2: "Medium",
            3: "Low",
          }[priority] || "Medium";

        const formattedDate = new Date(dueAt).toLocaleString();

        await axiosClient.post("/leadtimeline", {
          contactId,
          eventType: "ReminderSet",
          description: `Reminder titled '${title}' ${
            isNew ? "added" : "updated"
          } for ${formattedDate} with priority ${priorityLabel}.`,
          createdBy: "System",
          source: "Reminder",
          category: "Auto",
          isSystemGenerated: true,
        });
      } catch (timelineErr) {
        console.warn("⚠️ Timeline log failed:", timelineErr);
      }

      onSaveComplete();
    } catch (err) {
      if (err.response) {
        console.error("📦 Backend error response:", err.response.data);
      } else {
        console.error("❌ Unknown error while saving reminder:", err);
      }
      toast.error("❌ Failed to save reminder.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        name="title"
        value={formData.title}
        onChange={handleChange}
        placeholder="Reminder Title"
        className="w-full border rounded-lg px-3 py-2"
        required
      />
      <textarea
        name="description"
        value={formData.description}
        onChange={handleChange}
        placeholder="Description"
        className="w-full border rounded-lg px-3 py-2"
      />
      <input
        type="datetime-local"
        name="dueAt"
        value={formData.dueAt}
        onChange={handleChange}
        className="w-full border rounded-lg px-3 py-2"
        required
      />
      <input
        name="reminderType"
        value={formData.reminderType}
        onChange={handleChange}
        placeholder="Type (e.g., Call, Email)"
        className="w-full border rounded-lg px-3 py-2"
      />
      <select
        name="priority"
        value={formData.priority}
        onChange={handleChange}
        className="w-full border rounded-lg px-3 py-2"
      >
        <option value={1}>High</option>
        <option value={2}>Medium</option>
        <option value={3}>Low</option>
      </select>
      <div className="flex gap-4 flex-wrap">
        <label className="flex items-center">
          <input
            type="checkbox"
            name="isRecurring"
            checked={formData.isRecurring}
            onChange={handleChange}
            className="mr-2"
          />
          Recurring
        </label>
        <input
          name="recurrencePattern"
          value={formData.recurrencePattern}
          onChange={handleChange}
          placeholder="e.g., Weekly"
          className="flex-1 border rounded-lg px-3 py-2"
        />
      </div>
      <label className="flex items-center">
        <input
          type="checkbox"
          name="sendWhatsappNotification"
          checked={formData.sendWhatsappNotification}
          onChange={handleChange}
          className="mr-2"
        />
        Send WhatsApp Notification
      </label>
      <button
        type="submit"
        className="bg-purple-600 text-white px-4 py-2 rounded-lg"
      >
        {selectedReminder ? "Update Reminder" : "Add Reminder"}
      </button>
    </form>
  );
}

export default ReminderForm;
