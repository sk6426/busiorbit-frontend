import React, { useEffect, useState } from "react";
import axiosClient from "../../../api/axiosClient";

/**
 * ChatHeader — Professional WhatsApp-style chat header
 * Props:
 * - contactId: contact ID to fetch data
 */
export default function ChatHeader({ contactId }) {
  const [contact, setContact] = useState(null);

  // Fetch contact data when contactId changes
  useEffect(() => {
    if (!contactId) {
      setContact(null);
      return;
    }

    const fetchContact = async () => {
      try {
        const res = await axiosClient.get(`/contacts/${contactId}`);
        // Handle different API response structures
        if (res?.data?.data) {
          setContact(res.data.data);
        } else if (res?.data) {
          setContact(res.data);
        } else {
          setContact(res);
        }
      } catch (err) {
        console.error("❌ [ChatHeader] Failed to load contact:", err);
      }
    };

    fetchContact();
  }, [contactId]);

  if (!contact) return null;

  const { name, phoneNumber } = contact;

  // 🧠 Extract initials from name or phone number
  const initials =
    name
      ?.split(" ")
      .map(part => part.charAt(0).toUpperCase())
      .slice(0, 2)
      .join("") ||
    phoneNumber?.slice(-2) ||
    "??";

  // Display name if present, otherwise phone number
  const displayName = name || phoneNumber || "Unknown Contact";

  return (
    <div className="bg-white border-b shadow-sm px-4 py-3 flex items-center justify-between">
      {/* Left Section: Avatar + Info */}
      <div className="flex items-center gap-4">
        {/* Avatar with Initials */}
        <div className="w-10 h-10 rounded-full bg-green-600 text-white font-semibold text-sm flex items-center justify-center shadow-sm">
          {initials}
        </div>

        {/* Name, Phone */}
        <div className="space-y-0.5">
          <h2 className="text-base font-semibold text-gray-800">
            {displayName}
          </h2>
          {name && phoneNumber && (
            <div className="text-xs text-gray-500">{phoneNumber}</div>
          )}
        </div>
      </div>
    </div>
  );
}
