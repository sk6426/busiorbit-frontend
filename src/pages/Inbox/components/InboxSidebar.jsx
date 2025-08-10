// ✅ Final Updated InboxSidebar.jsx
import React, { useEffect, useState } from "react";
import axiosClient from "../../../api/axiosClient";
import useSignalR from "../../../hooks/useSignalR";

export default function InboxSidebar({ onSelect, currentUserId }) {
  const [contacts, setContacts] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [search, setSearch] = useState("");
  const { connection } = useSignalR();

  useEffect(() => {
    console.log("📥 InboxSidebar mounted | currentUserId:", currentUserId);
  }, [currentUserId]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [contactRes, countRes] = await Promise.all([
          axiosClient.get("/contacts/all"),
          axiosClient.get("/inbox/unread-counts"),
        ]);
        setContacts(contactRes.data);
        setUnreadCounts(countRes.data || {});
        console.log("✅ Contacts and unread counts loaded");
      } catch (err) {
        console.error("❌ Failed to load inbox data:", err);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!connection) {
      console.warn("⚠️ SignalR not connected yet");
      return;
    }

    const handleUnread = payload => {
      console.log("🔔 [SignalR] UnreadCountChanged:", payload);
      setUnreadCounts(payload);
    };

    connection.on("UnreadCountChanged", handleUnread);
    return () => connection.off("UnreadCountChanged", handleUnread);
  }, [connection]);

  useEffect(() => {
    if (!connection) return;

    const handleMessage = msg => {
      console.log("📩 [SignalR] Received message:", msg);

      if (!msg?.contactId || !msg.isIncoming) return;
      console.log("[SignalR] Received message:", msg);
      console.log(
        "🧪 Check senderId:",
        msg.senderId,
        "vs currentUserId:",
        currentUserId
      );
      console.log("🧪 isIncoming:", msg.isIncoming);
      console.log("🧪 contactId:", msg.contactId, "vs selectedId:", selectedId);
      // if (msg.senderId === currentUserId) {

      if (!msg.isIncoming && msg.senderId === currentUserId) {
        console.log("↩️ Skipping self-sent message");
        return;
      }
      if (msg.contactId === selectedId) {
        console.log("👁️ Contact already open, skipping increment");
        return;
      }

      setUnreadCounts(prev => ({
        ...prev,
        [msg.contactId]: (prev[msg.contactId] || 0) + 1,
      }));
    };

    connection.on("ReceiveInboxMessage", handleMessage);
    return () => connection.off("ReceiveInboxMessage", handleMessage);
  }, [connection, selectedId, currentUserId]);

  const handleSelect = async id => {
    setSelectedId(id);
    onSelect(id);

    try {
      await axiosClient.post(`/inbox/mark-read?contactId=${id}`);
      console.log("✅ Marked messages as read for contact:", id);
    } catch (err) {
      console.error("❌ Failed to mark as read:", err);
    }

    setUnreadCounts(prev => ({ ...prev, [id]: 0 }));
  };

  const getInitials = name =>
    name
      ?.split(" ")
      .map(n => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();

  // const filtered = contacts.filter(c =>
  //   (c.name || c.phoneNumber || "").toLowerCase().includes(search.toLowerCase())
  // );
  const safeContacts = Array.isArray(contacts) ? contacts : [];
  const filtered = safeContacts.filter(c =>
    (c.name || c.phoneNumber || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-72 h-full flex flex-col border-r bg-white">
      <div className="p-3 border-b">
        <input
          type="text"
          placeholder="Search"
          className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="text-sm font-semibold text-gray-700 px-4 py-2">
          Contacts
        </div>
        {filtered.map(contact => {
          const unread = unreadCounts[contact.id] || 0;
          console.log(`🔍 Rendering ${contact.id} | unread: ${unread}`);
          return (
            <div
              key={contact.id}
              onClick={() => handleSelect(contact.id)}
              className={`flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-100 ${
                selectedId === contact.id ? "bg-gray-200" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-purple-600 text-xs font-semibold flex items-center justify-center text-white">
                  {getInitials(contact.name || contact.phoneNumber)}
                </div>
                <div className="flex flex-col">
                  <div className="font-medium text-sm text-gray-800 truncate">
                    {contact.name || contact.phoneNumber || "Unknown"}
                  </div>
                  {contact.name && (
                    <div className="text-xs text-gray-500">
                      {contact.phoneNumber}
                    </div>
                  )}
                </div>
              </div>
              {unread > 0 && (
                <div className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full min-w-[20px] text-center">
                  {unread}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
