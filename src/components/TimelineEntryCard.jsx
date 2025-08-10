import React from "react";

const TimelineEntryCard = ({ entry }) => {
  const formattedDate = new Date(entry.createdAt).toLocaleString();

  const contactLabel = entry.contactName
    ? `${entry.contactName} (${entry.contactNumber || ""})`
    : entry.contactNumber || null;

  // 🧠 Event type with emoji/icon
  const getEventLabel = type => {
    switch (type) {
      case "PhoneCall":
        return "📞 Phone Call";
      case "ReminderSet":
        return "⏰ Reminder Set";
      case "NoteAdded":
        return "📝 Note Added";
      case "CustomActivity":
        return "⚙️ Custom Activity";
      default:
        return `📌 ${type || "Unknown Event"}`;
    }
  };

  return (
    <div className="border rounded p-4 mb-4 shadow-sm bg-white">
      <div className="flex justify-between items-center">
        <span className="text-sm font-semibold text-purple-800 bg-purple-100 px-3 py-1 rounded-full">
          {getEventLabel(entry.eventType)}
        </span>
        <span className="text-sm text-gray-600">{formattedDate}</span>
      </div>

      <p className="mt-2 text-gray-800">{entry.description}</p>

      {contactLabel && (
        <p className="mt-1 text-xs text-purple-700">
          📞 Contact: {contactLabel}
        </p>
      )}

      {entry.createdBy && (
        <p className="mt-1 text-xs text-gray-500">By: {entry.createdBy}</p>
      )}

      {entry.category && (
        <p className="mt-1 text-xs text-blue-600">Category: {entry.category}</p>
      )}
    </div>
  );
};

export default TimelineEntryCard;
