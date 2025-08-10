import React from "react";
import { Edit2 } from "lucide-react";

/**
 * ChatHeader — Professional WhatsApp-style chat header
 * Props:
 * - contact: contact object
 * - onEdit: optional callback
 */
export default function ChatHeader({ contact, onEdit }) {
  if (!contact) return null;

  const { name, phoneNumber, tags = [], notes = "" } = contact;

  // 🧠 Extract initials from name
  const initials = name
    ?.split(" ")
    .map(part => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");

  return (
    <div className="sticky top-0 z-10 bg-white border-b shadow-sm px-4 py-3 flex items-center justify-between">
      {/* Left Section: Avatar + Info */}
      <div className="flex items-center gap-4">
        {/* Avatar with Initials */}
        <div className="w-10 h-10 rounded-full bg-green-600 text-white font-semibold text-sm flex items-center justify-center shadow-sm">
          {initials}
        </div>

        {/* Name, Phone, Notes */}
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-gray-800">{name}</h2>
            <button
              onClick={onEdit}
              className="text-gray-400 hover:text-purple-600"
              title="Edit Contact"
            >
              <Edit2 size={16} />
            </button>
          </div>
          {phoneNumber && (
            <div className="text-xs text-gray-500">{phoneNumber}</div>
          )}
          {notes && (
            <div className="text-xs text-gray-600">
              <span className="font-medium">Notes:</span> {notes}
            </div>
          )}
        </div>
      </div>

      {/* Tags on right (if any) */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 max-w-sm justify-end">
          {tags.slice(0, 2).map(tag => (
            <span
              key={tag.id}
              className="text-xs font-medium px-2 py-1 rounded-full"
              style={{
                backgroundColor: tag.colorHex || "#666",
                color: "#fff",
              }}
            >
              {tag.name}
            </span>
          ))}
          {tags.length > 2 && (
            <span className="text-xs text-gray-400">
              +{tags.length - 2} more
            </span>
          )}
        </div>
      )}
    </div>
  );
}
