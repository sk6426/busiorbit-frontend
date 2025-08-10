import React from "react";
import { FaEllipsisV } from "react-icons/fa";

function getInitials(name) {
  if (!name) return "";
  const parts = name.trim().split(" ");
  return parts
    .slice(0, 2)
    .map(word => word[0])
    .join("")
    .toUpperCase();
}

export default function ContactList({
  contacts,
  onEdit,
  onDelete,
  onNotes,
  onTimeline,
}) {
  return (
    <div className="overflow-x-auto mt-4 rounded-xl border shadow-sm">
      <table className="min-w-full bg-white">
        <thead className="text-left bg-gray-100 text-sm font-medium">
          <tr>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Phone</th>
            <th className="px-4 py-3">Tags</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {contacts.map(contact => (
            <tr key={contact.id} className="border-t hover:bg-gray-50">
              <td className="px-4 py-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm shadow-sm">
                  {getInitials(contact.name)}
                </div>
                <span className="font-semibold">{contact.name}</span>
              </td>

              <td className="px-4 py-3 text-gray-700">
                {contact.phoneNumber || (
                  <span className="text-gray-400 italic">No number</span>
                )}
              </td>

              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {(contact.tags ?? contact.contactTags ?? []).length > 0 ? (
                    (contact.tags ?? contact.contactTags).map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-0.5 text-xs rounded-full font-medium"
                        style={{
                          backgroundColor: tag.colorHex || "#EEE",
                          color: "#1F2937",
                        }}
                      >
                        {tag.tagName || tag.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-400 text-xs italic">
                      No tags
                    </span>
                  )}
                </div>
              </td>

              <td className="px-4 py-3 text-right relative">
                <DropdownMenu
                  onEdit={() => onEdit(contact)}
                  onDelete={() => onDelete(contact)}
                  onNotes={() => onNotes(contact)}
                  onTimeline={() => onTimeline(contact)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DropdownMenu({ onEdit, onDelete, onNotes, onTimeline }) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setOpen(prev => !prev)}
        className="p-2 rounded-full hover:bg-gray-100"
      >
        <FaEllipsisV size={14} />
      </button>

      {open && (
        <div className="absolute right-0 z-10 mt-2 w-40 origin-top-right rounded-md bg-white shadow-lg border">
          <div className="py-1 text-sm text-gray-700">
            <button
              onClick={onEdit}
              className="block w-full px-4 py-2 hover:bg-gray-100 text-left"
            >
              ✏️ Edit
            </button>
            <button
              onClick={onNotes}
              className="block w-full px-4 py-2 hover:bg-gray-100 text-left"
            >
              📝 Notes
            </button>
            <button
              onClick={onTimeline}
              className="block w-full px-4 py-2 hover:bg-gray-100 text-left"
            >
              🕒 Timeline
            </button>
            <button
              onClick={onDelete}
              className="block w-full px-4 py-2 text-red-600 hover:bg-red-50 text-left"
            >
              🗑 Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
