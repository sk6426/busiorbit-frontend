// ✅ Final Updated InboxSidebar.jsx (auto-mark-read + refresh + sound on new unread)
import React, { useEffect, useState, useCallback } from "react";
import axiosClient from "../../../api/axiosClient";
import useSignalR from "../../../hooks/useSignalR";
import useNotificationSound from "../../../hooks/useNotificationSound"; // ⬅️ NEW

export default function InboxSidebar({ onSelect, currentUserId }) {
  const [contacts, setContacts] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [search, setSearch] = useState("");
  const { connection } = useSignalR();

  // 🔔 Sound (autoplay-safe + throttled; uses /sounds/inbox_notify.mp3 by default)
  const { play } = useNotificationSound({
    // src: "/sounds/inbox_notify.mp3", // optional (default already this)
    volume: 0.6,
    throttleMs: 800,
  });

  const fetchUnreadCounts = useCallback(async () => {
    try {
      const res = await axiosClient.get("/inbox/unread-counts");
      setUnreadCounts(res.data || {});
      console.log("✅ Unread counts refreshed");
    } catch (err) {
      console.error("❌ Failed to refresh unread counts:", err);
    }
  }, []);

  const loadContactsAndUnread = useCallback(async () => {
    try {
      const [contactRes, countRes] = await Promise.all([
        axiosClient.get("/contacts/all"),
        axiosClient.get("/inbox/unread-counts"),
      ]);
      setContacts(contactRes.data || []);
      setUnreadCounts(countRes.data || {});
      console.log("✅ Contacts and unread counts loaded");
    } catch (err) {
      console.error("❌ Failed to load inbox data:", err);
    }
  }, []);

  useEffect(() => {
    console.log("📥 InboxSidebar mounted | currentUserId:", currentUserId);
    loadContactsAndUnread();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]);

  useEffect(() => {
    if (!connection) return;

    const handleUnread = payload => {
      console.log("🔔 [SignalR] UnreadCountChanged:", payload);

      // server says "refresh your snapshot"
      if (payload && typeof payload === "object" && payload.refresh) {
        fetchUnreadCounts();
        return;
      }

      if (payload && typeof payload === "object") {
        setUnreadCounts(payload);
      }
    };

    connection.on("UnreadCountChanged", handleUnread);
    return () => connection.off("UnreadCountChanged", handleUnread);
  }, [connection, fetchUnreadCounts]);

  useEffect(() => {
    if (!connection) return;

    const handleMessage = async msg => {
      const cid = msg?.contactId ?? msg?.ContactId ?? null;
      if (!cid) return;

      const isIncoming =
        typeof msg?.isIncoming !== "undefined"
          ? !!msg.isIncoming
          : msg?.senderId
          ? false
          : true;

      console.log(
        "📩 [SignalR] Message:",
        msg,
        "| parsed contactId:",
        cid,
        "| isIncoming:",
        isIncoming
      );

      // Never badge on ANY outbound message
      if (!isIncoming) return;

      // If the active chat → mark as read immediately
      if (String(cid) === String(selectedId)) {
        try {
          if (connection?.invoke) {
            await connection.invoke("MarkAsRead", cid);
            console.log("✅ MarkAsRead via SignalR for", cid);
          } else {
            await axiosClient.post(`/inbox/mark-read?contactId=${cid}`);
            console.log("✅ MarkAsRead fallback HTTP for", cid);
          }
        } catch (err) {
          console.error("❌ Failed to mark as read in active chat:", err);
        }
        return; // do not increment badge or play sound
      }

      // Otherwise, increment unread count for that contact
      setUnreadCounts(prev => ({
        ...(prev || {}),
        [cid]: (prev?.[cid] || 0) + 1,
      }));

      // 🔔 Play sound only when a new unread is created (non-active chat)
      try {
        play();
      } catch {}
    };

    connection.on("ReceiveInboxMessage", handleMessage);
    return () => connection.off("ReceiveInboxMessage", handleMessage);
  }, [connection, selectedId, currentUserId, play]); // include play in deps

  useEffect(() => {
    if (!connection) return;
    if (typeof connection.onreconnected === "function") {
      connection.onreconnected(() => {
        console.log("🔁 SignalR reconnected — reloading unread counts");
        loadContactsAndUnread();
      });
    }
  }, [connection, loadContactsAndUnread]);

  const handleSelect = async id => {
    setSelectedId(id);
    onSelect(id);

    // Optimistic reset
    setUnreadCounts(prev => ({ ...(prev || {}), [id]: 0 }));

    try {
      if (connection?.invoke) {
        await connection.invoke("MarkAsRead", id);
        console.log("✅ MarkAsRead via SignalR for", id);
        return;
      }
    } catch (err) {
      console.warn("⚠️ SignalR MarkAsRead failed, fallback:", err);
    }

    try {
      await axiosClient.post(`/inbox/mark-read?contactId=${id}`);
      console.log("✅ MarkAsRead fallback HTTP for", id);
    } catch (err) {
      console.error("❌ Failed to mark as read via HTTP:", err);
    }
  };

  const getInitials = name =>
    name
      ?.split(" ")
      .map(n => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();

  const safeContacts = Array.isArray(contacts) ? contacts : [];
  const filtered = safeContacts.filter(c =>
    (c.name || c.phoneNumber || "")
      .toString()
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
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
          const cid = String(contact.id);
          const unread = Number(unreadCounts[cid] || 0);
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

// // ✅ Final Updated InboxSidebar.jsx (active chat auto-mark-read + refresh support)
// import React, { useEffect, useState, useCallback } from "react";
// import axiosClient from "../../../api/axiosClient";
// import useSignalR from "../../../hooks/useSignalR";

// export default function InboxSidebar({ onSelect, currentUserId }) {
//   const [contacts, setContacts] = useState([]);
//   const [selectedId, setSelectedId] = useState(null);
//   const [unreadCounts, setUnreadCounts] = useState({});
//   const [search, setSearch] = useState("");
//   const { connection } = useSignalR();

//   const fetchUnreadCounts = useCallback(async () => {
//     try {
//       const res = await axiosClient.get("/inbox/unread-counts");
//       setUnreadCounts(res.data || {});
//       console.log("✅ Unread counts refreshed");
//     } catch (err) {
//       console.error("❌ Failed to refresh unread counts:", err);
//     }
//   }, []);

//   const loadContactsAndUnread = useCallback(async () => {
//     try {
//       const [contactRes, countRes] = await Promise.all([
//         axiosClient.get("/contacts/all"),
//         axiosClient.get("/inbox/unread-counts"),
//       ]);
//       setContacts(contactRes.data || []);
//       setUnreadCounts(countRes.data || {});
//       console.log("✅ Contacts and unread counts loaded");
//     } catch (err) {
//       console.error("❌ Failed to load inbox data:", err);
//     }
//   }, []);

//   useEffect(() => {
//     console.log("📥 InboxSidebar mounted | currentUserId:", currentUserId);
//     loadContactsAndUnread();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [currentUserId]);

//   useEffect(() => {
//     if (!connection) return;

//     const handleUnread = payload => {
//       console.log("🔔 [SignalR] UnreadCountChanged:", payload);

//       // server says "refresh your snapshot"
//       if (payload && typeof payload === "object" && payload.refresh) {
//         fetchUnreadCounts();
//         return;
//       }

//       if (payload && typeof payload === "object") {
//         setUnreadCounts(payload);
//       }
//     };

//     connection.on("UnreadCountChanged", handleUnread);
//     return () => connection.off("UnreadCountChanged", handleUnread);
//   }, [connection, fetchUnreadCounts]);

//   useEffect(() => {
//     if (!connection) return;

//     const handleMessage = async msg => {
//       const cid = msg?.contactId ?? msg?.ContactId ?? null;
//       if (!cid) return;

//       const isIncoming =
//         typeof msg?.isIncoming !== "undefined"
//           ? !!msg.isIncoming
//           : msg?.senderId
//           ? false
//           : true;

//       console.log(
//         "📩 [SignalR] Message:",
//         msg,
//         "| parsed contactId:",
//         cid,
//         "| isIncoming:",
//         isIncoming
//       );

//       // Never badge on ANY outbound message
//       if (!isIncoming) return;

//       // If the active chat → mark as read immediately
//       if (String(cid) === String(selectedId)) {
//         try {
//           if (connection?.invoke) {
//             await connection.invoke("MarkAsRead", cid);
//             console.log("✅ MarkAsRead via SignalR for", cid);
//           } else {
//             await axiosClient.post(`/inbox/mark-read?contactId=${cid}`);
//             console.log("✅ MarkAsRead fallback HTTP for", cid);
//           }
//         } catch (err) {
//           console.error("❌ Failed to mark as read in active chat:", err);
//         }
//         return; // do not increment badge
//       }

//       // Otherwise, increment unread count for that contact
//       setUnreadCounts(prev => ({
//         ...(prev || {}),
//         [cid]: (prev?.[cid] || 0) + 1,
//       }));
//     };

//     connection.on("ReceiveInboxMessage", handleMessage);
//     return () => connection.off("ReceiveInboxMessage", handleMessage);
//   }, [connection, selectedId, currentUserId]);

//   useEffect(() => {
//     if (!connection) return;
//     if (typeof connection.onreconnected === "function") {
//       connection.onreconnected(() => {
//         console.log("🔁 SignalR reconnected — reloading unread counts");
//         loadContactsAndUnread();
//       });
//     }
//   }, [connection, loadContactsAndUnread]);

//   const handleSelect = async id => {
//     setSelectedId(id);
//     onSelect(id);

//     // Optimistic reset
//     setUnreadCounts(prev => ({ ...(prev || {}), [id]: 0 }));

//     try {
//       if (connection?.invoke) {
//         await connection.invoke("MarkAsRead", id);
//         console.log("✅ MarkAsRead via SignalR for", id);
//         return;
//       }
//     } catch (err) {
//       console.warn("⚠️ SignalR MarkAsRead failed, fallback:", err);
//     }

//     try {
//       await axiosClient.post(`/inbox/mark-read?contactId=${id}`);
//       console.log("✅ MarkAsRead fallback HTTP for", id);
//     } catch (err) {
//       console.error("❌ Failed to mark as read via HTTP:", err);
//     }
//   };

//   const getInitials = name =>
//     name
//       ?.split(" ")
//       .map(n => n[0])
//       .join("")
//       .substring(0, 2)
//       .toUpperCase();

//   const safeContacts = Array.isArray(contacts) ? contacts : [];
//   const filtered = safeContacts.filter(c =>
//     (c.name || c.phoneNumber || "")
//       .toString()
//       .toLowerCase()
//       .includes(search.toLowerCase())
//   );

//   return (
//     <div className="w-72 h-full flex flex-col border-r bg-white">
//       <div className="p-3 border-b">
//         <input
//           type="text"
//           placeholder="Search"
//           className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring"
//           value={search}
//           onChange={e => setSearch(e.target.value)}
//         />
//       </div>

//       <div className="flex-1 overflow-y-auto">
//         <div className="text-sm font-semibold text-gray-700 px-4 py-2">
//           Contacts
//         </div>
//         {filtered.map(contact => {
//           const cid = String(contact.id);
//           const unread = Number(unreadCounts[cid] || 0);
//           return (
//             <div
//               key={contact.id}
//               onClick={() => handleSelect(contact.id)}
//               className={`flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-100 ${
//                 selectedId === contact.id ? "bg-gray-200" : ""
//               }`}
//             >
//               <div className="flex items-center gap-3">
//                 <div className="w-9 h-9 rounded-full bg-purple-600 text-xs font-semibold flex items-center justify-center text-white">
//                   {getInitials(contact.name || contact.phoneNumber)}
//                 </div>
//                 <div className="flex flex-col">
//                   <div className="font-medium text-sm text-gray-800 truncate">
//                     {contact.name || contact.phoneNumber || "Unknown"}
//                   </div>
//                   {contact.name && (
//                     <div className="text-xs text-gray-500">
//                       {contact.phoneNumber}
//                     </div>
//                   )}
//                 </div>
//               </div>
//               {unread > 0 && (
//                 <div className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full min-w-[20px] text-center">
//                   {unread}
//                 </div>
//               )}
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// }

// // ✅ Final Updated InboxSidebar.jsx (active chat auto-mark-read + refresh support)
// import React, { useEffect, useState, useCallback } from "react";
// import axiosClient from "../../../api/axiosClient";
// import useSignalR from "../../../hooks/useSignalR";

// export default function InboxSidebar({ onSelect, currentUserId }) {
//   const [contacts, setContacts] = useState([]);
//   const [selectedId, setSelectedId] = useState(null);
//   const [unreadCounts, setUnreadCounts] = useState({});
//   const [search, setSearch] = useState("");
//   const { connection } = useSignalR();

//   // 🔄 Helper to fetch ONLY unread counts (used by refresh signal)
//   const fetchUnreadCounts = useCallback(async () => {
//     try {
//       const res = await axiosClient.get("/inbox/unread-counts");
//       setUnreadCounts(res.data || {});
//       console.log("✅ Unread counts refreshed");
//     } catch (err) {
//       console.error("❌ Failed to refresh unread counts:", err);
//     }
//   }, []);

//   // 🔄 Helper to fetch contacts & unread counts (initial load / reconnect)
//   const loadContactsAndUnread = useCallback(async () => {
//     try {
//       const [contactRes, countRes] = await Promise.all([
//         axiosClient.get("/contacts/all"),
//         axiosClient.get("/inbox/unread-counts"),
//       ]);
//       setContacts(contactRes.data || []);
//       setUnreadCounts(countRes.data || {});
//       console.log("✅ Contacts and unread counts loaded");
//     } catch (err) {
//       console.error("❌ Failed to load inbox data:", err);
//     }
//   }, []);

//   useEffect(() => {
//     console.log("📥 InboxSidebar mounted | currentUserId:", currentUserId);
//     loadContactsAndUnread();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [currentUserId]);

//   // 📡 Listen for server "UnreadCountChanged"
//   useEffect(() => {
//     if (!connection) return;

//     const handleUnread = payload => {
//       console.log("🔔 [SignalR] UnreadCountChanged:", payload);

//       // 🚦 Refresh signal from server: { refresh: true }
//       if (payload && typeof payload === "object" && payload.refresh) {
//         fetchUnreadCounts();
//         return;
//       }

//       // Otherwise, payload is a map { [contactId]: count }
//       if (payload && typeof payload === "object") {
//         setUnreadCounts(payload);
//       }
//     };

//     connection.on("UnreadCountChanged", handleUnread);
//     return () => connection.off("UnreadCountChanged", handleUnread);
//   }, [connection, fetchUnreadCounts]);

//   // 📡 Listen for incoming messages
//   useEffect(() => {
//     if (!connection) return;

//     const handleMessage = async msg => {
//       const cid = msg?.contactId ?? msg?.ContactId ?? null;
//       if (!cid) return;

//       const isIncoming =
//         typeof msg?.isIncoming !== "undefined"
//           ? !!msg.isIncoming
//           : msg?.senderId
//           ? false
//           : true;

//       console.log(
//         "📩 [SignalR] Message:",
//         msg,
//         "| parsed contactId:",
//         cid,
//         "| isIncoming:",
//         isIncoming
//       );

//       // 🔕 Never badge on ANY outbound message (self or other agents)
//       if (!isIncoming) {
//         return;
//       }

//       // 🟢 If message is for the currently open chat → mark as read immediately
//       if (String(cid) === String(selectedId)) {
//         console.log(
//           "👁️ Message received in active chat, marking as read immediately"
//         );

//         try {
//           if (connection?.invoke) {
//             await connection.invoke("MarkAsRead", cid);
//             console.log("✅ MarkAsRead invoked via SignalR for", cid);
//           } else {
//             await axiosClient.post(`/inbox/mark-read?contactId=${cid}`);
//             console.log("✅ MarkAsRead fallback HTTP for", cid);
//           }
//         } catch (err) {
//           console.error("❌ Failed to mark as read in active chat:", err);
//         }

//         return; // don't increment badge
//       }

//       // Otherwise, increment unread count for that contact
//       setUnreadCounts(prev => ({
//         ...(prev || {}),
//         [cid]: (prev?.[cid] || 0) + 1,
//       }));
//     };

//     connection.on("ReceiveInboxMessage", handleMessage);
//     return () => connection.off("ReceiveInboxMessage", handleMessage);
//   }, [connection, selectedId, currentUserId]);

//   // 🔁 Handle reconnects → reload contacts + counts (covers missed events)
//   useEffect(() => {
//     if (!connection) return;
//     if (typeof connection.onreconnected === "function") {
//       connection.onreconnected(() => {
//         console.log("🔁 SignalR reconnected — reloading unread counts");
//         loadContactsAndUnread();
//       });
//     }
//   }, [connection, loadContactsAndUnread]);

//   // ✅ Selecting a contact
//   const handleSelect = async id => {
//     setSelectedId(id);
//     onSelect(id);

//     // Optimistic reset
//     setUnreadCounts(prev => ({ ...(prev || {}), [id]: 0 }));

//     try {
//       if (connection?.invoke) {
//         await connection.invoke("MarkAsRead", id);
//         console.log("✅ MarkAsRead invoked via SignalR for", id);
//         return;
//       }
//     } catch (err) {
//       console.warn("⚠️ SignalR MarkAsRead failed, fallback:", err);
//     }

//     try {
//       await axiosClient.post(`/inbox/mark-read?contactId=${id}`);
//       console.log("✅ MarkAsRead fallback HTTP for", id);
//     } catch (err) {
//       console.error("❌ Failed to mark as read via HTTP:", err);
//     }
//   };

//   const getInitials = name =>
//     name
//       ?.split(" ")
//       .map(n => n[0])
//       .join("")
//       .substring(0, 2)
//       .toUpperCase();

//   const safeContacts = Array.isArray(contacts) ? contacts : [];
//   const filtered = safeContacts.filter(c =>
//     (c.name || c.phoneNumber || "")
//       .toString()
//       .toLowerCase()
//       .includes(search.toLowerCase())
//   );

//   return (
//     <div className="w-72 h-full flex flex-col border-r bg-white">
//       <div className="p-3 border-b">
//         <input
//           type="text"
//           placeholder="Search"
//           className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring"
//           value={search}
//           onChange={e => setSearch(e.target.value)}
//         />
//       </div>

//       <div className="flex-1 overflow-y-auto">
//         <div className="text-sm font-semibold text-gray-700 px-4 py-2">
//           Contacts
//         </div>
//         {filtered.map(contact => {
//           const cid = String(contact.id);
//           const unread = Number(unreadCounts[cid] || 0);
//           return (
//             <div
//               key={contact.id}
//               onClick={() => handleSelect(contact.id)}
//               className={`flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-100 ${
//                 selectedId === contact.id ? "bg-gray-200" : ""
//               }`}
//             >
//               <div className="flex items-center gap-3">
//                 <div className="w-9 h-9 rounded-full bg-purple-600 text-xs font-semibold flex items-center justify-center text-white">
//                   {getInitials(contact.name || contact.phoneNumber)}
//                 </div>
//                 <div className="flex flex-col">
//                   <div className="font-medium text-sm text-gray-800 truncate">
//                     {contact.name || contact.phoneNumber || "Unknown"}
//                   </div>
//                   {contact.name && (
//                     <div className="text-xs text-gray-500">
//                       {contact.phoneNumber}
//                     </div>
//                   )}
//                 </div>
//               </div>
//               {unread > 0 && (
//                 <div className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full min-w-[20px] text-center">
//                   {unread}
//                 </div>
//               )}
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// }

// // ✅ Final Updated InboxSidebar.jsx (active chat auto-mark-read)
// import React, { useEffect, useState, useCallback } from "react";
// import axiosClient from "../../../api/axiosClient";
// import useSignalR from "../../../hooks/useSignalR";

// export default function InboxSidebar({ onSelect, currentUserId }) {
//   const [contacts, setContacts] = useState([]);
//   const [selectedId, setSelectedId] = useState(null);
//   const [unreadCounts, setUnreadCounts] = useState({});
//   const [search, setSearch] = useState("");
//   const { connection } = useSignalR();

//   // 🔄 Helper to fetch contacts & unread counts
//   const loadContactsAndUnread = useCallback(async () => {
//     try {
//       const [contactRes, countRes] = await Promise.all([
//         axiosClient.get("/contacts/all"),
//         axiosClient.get("/inbox/unread-counts"),
//       ]);
//       setContacts(contactRes.data || []);
//       setUnreadCounts(countRes.data || {});
//       console.log("✅ Contacts and unread counts loaded");
//     } catch (err) {
//       console.error("❌ Failed to load inbox data:", err);
//     }
//   }, []);

//   useEffect(() => {
//     console.log("📥 InboxSidebar mounted | currentUserId:", currentUserId);
//     loadContactsAndUnread();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [currentUserId]);

//   // 📡 Listen for server "UnreadCountChanged"
//   useEffect(() => {
//     if (!connection) return;

//     const handleUnread = payload => {
//       console.log("🔔 [SignalR] UnreadCountChanged:", payload);
//       if (payload && typeof payload === "object") {
//         setUnreadCounts(payload);
//       }
//     };

//     connection.on("UnreadCountChanged", handleUnread);
//     return () => connection.off("UnreadCountChanged", handleUnread);
//   }, [connection]);

//   // 📡 Listen for incoming messages
//   useEffect(() => {
//     if (!connection) return;

//     const handleMessage = async msg => {
//       const cid = msg?.contactId ?? msg?.ContactId ?? null;
//       if (!cid) return;

//       const isIncoming =
//         typeof msg?.isIncoming !== "undefined"
//           ? !!msg.isIncoming
//           : msg?.senderId
//           ? false
//           : true;

//       console.log(
//         "📩 [SignalR] Message:",
//         msg,
//         "| parsed contactId:",
//         cid,
//         "| isIncoming:",
//         isIncoming
//       );

//       // Skip self/outgoing messages
//       if (
//         !isIncoming &&
//         msg.senderId &&
//         String(msg.senderId) === String(currentUserId)
//       ) {
//         console.log("↩️ Skipping self-sent message");
//         return;
//       }

//       // 🟢 If message is for the currently open chat → mark as read immediately
//       if (String(cid) === String(selectedId)) {
//         console.log(
//           "👁️ Message received in active chat, marking as read immediately"
//         );

//         try {
//           if (connection?.invoke) {
//             await connection.invoke("MarkAsRead", cid);
//             console.log("✅ MarkAsRead invoked via SignalR for", cid);
//           } else {
//             await axiosClient.post(`/inbox/mark-read?contactId=${cid}`);
//             console.log("✅ MarkAsRead fallback HTTP for", cid);
//           }
//         } catch (err) {
//           console.error("❌ Failed to mark as read in active chat:", err);
//         }

//         return; // don't increment badge
//       }

//       // Otherwise, increment unread count for that contact
//       setUnreadCounts(prev => ({
//         ...prev,
//         [cid]: (prev?.[cid] || 0) + 1,
//       }));
//     };

//     connection.on("ReceiveInboxMessage", handleMessage);
//     return () => connection.off("ReceiveInboxMessage", handleMessage);
//   }, [connection, selectedId, currentUserId]);

//   // 🔁 Handle reconnects → reload counts
//   useEffect(() => {
//     if (!connection) return;
//     if (typeof connection.onreconnected === "function") {
//       connection.onreconnected(() => {
//         console.log("🔁 SignalR reconnected — reloading unread counts");
//         loadContactsAndUnread();
//       });
//     }
//   }, [connection, loadContactsAndUnread]);

//   // ✅ Selecting a contact
//   const handleSelect = async id => {
//     setSelectedId(id);
//     onSelect(id);

//     // Optimistic reset
//     setUnreadCounts(prev => ({ ...prev, [id]: 0 }));

//     try {
//       if (connection?.invoke) {
//         await connection.invoke("MarkAsRead", id);
//         console.log("✅ MarkAsRead invoked via SignalR for", id);
//         return;
//       }
//     } catch (err) {
//       console.warn("⚠️ SignalR MarkAsRead failed, fallback:", err);
//     }

//     try {
//       await axiosClient.post(`/inbox/mark-read?contactId=${id}`);
//       console.log("✅ MarkAsRead fallback HTTP for", id);
//     } catch (err) {
//       console.error("❌ Failed to mark as read via HTTP:", err);
//     }
//   };

//   const getInitials = name =>
//     name
//       ?.split(" ")
//       .map(n => n[0])
//       .join("")
//       .substring(0, 2)
//       .toUpperCase();

//   const safeContacts = Array.isArray(contacts) ? contacts : [];
//   const filtered = safeContacts.filter(c =>
//     (c.name || c.phoneNumber || "")
//       .toString()
//       .toLowerCase()
//       .includes(search.toLowerCase())
//   );

//   return (
//     <div className="w-72 h-full flex flex-col border-r bg-white">
//       <div className="p-3 border-b">
//         <input
//           type="text"
//           placeholder="Search"
//           className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring"
//           value={search}
//           onChange={e => setSearch(e.target.value)}
//         />
//       </div>

//       <div className="flex-1 overflow-y-auto">
//         <div className="text-sm font-semibold text-gray-700 px-4 py-2">
//           Contacts
//         </div>
//         {filtered.map(contact => {
//           const cid = String(contact.id);
//           const unread = Number(unreadCounts[cid] || 0);
//           return (
//             <div
//               key={contact.id}
//               onClick={() => handleSelect(contact.id)}
//               className={`flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-100 ${
//                 selectedId === contact.id ? "bg-gray-200" : ""
//               }`}
//             >
//               <div className="flex items-center gap-3">
//                 <div className="w-9 h-9 rounded-full bg-purple-600 text-xs font-semibold flex items-center justify-center text-white">
//                   {getInitials(contact.name || contact.phoneNumber)}
//                 </div>
//                 <div className="flex flex-col">
//                   <div className="font-medium text-sm text-gray-800 truncate">
//                     {contact.name || contact.phoneNumber || "Unknown"}
//                   </div>
//                   {contact.name && (
//                     <div className="text-xs text-gray-500">
//                       {contact.phoneNumber}
//                     </div>
//                   )}
//                 </div>
//               </div>
//               {unread > 0 && (
//                 <div className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full min-w-[20px] text-center">
//                   {unread}
//                 </div>
//               )}
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// }

// // ✅ Final Updated InboxSidebar.jsx
// import React, { useEffect, useState, useCallback } from "react";
// import axiosClient from "../../../api/axiosClient";
// import useSignalR from "../../../hooks/useSignalR";

// export default function InboxSidebar({ onSelect, currentUserId }) {
//   const [contacts, setContacts] = useState([]);
//   const [selectedId, setSelectedId] = useState(null);
//   const [unreadCounts, setUnreadCounts] = useState({});
//   const [search, setSearch] = useState("");
//   const { connection } = useSignalR();

//   // Helper to load contacts + unread counts (used on mount & reconnect)
//   const loadContactsAndUnread = useCallback(async () => {
//     try {
//       const [contactRes, countRes] = await Promise.all([
//         axiosClient.get("/contacts/all"),
//         axiosClient.get("/inbox/unread-counts"),
//       ]);
//       setContacts(contactRes.data || []);
//       setUnreadCounts(countRes.data || {});
//       console.log("✅ Contacts and unread counts loaded");
//     } catch (err) {
//       console.error("❌ Failed to load inbox data:", err);
//     }
//   }, []);

//   useEffect(() => {
//     console.log("📥 InboxSidebar mounted | currentUserId:", currentUserId);
//     loadContactsAndUnread();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [currentUserId]); // run on mount or when currentUserId changes

//   // Listen for server-side UnreadCountChanged pushes (authoritative state)
//   useEffect(() => {
//     if (!connection) return;

//     const handleUnread = payload => {
//       // payload expected to be a dictionary: { "<contactId>": <count>, ... }
//       console.log("🔔 [SignalR] UnreadCountChanged:", payload);
//       if (payload && typeof payload === "object") {
//         setUnreadCounts(payload);
//       }
//     };

//     connection.on("UnreadCountChanged", handleUnread);

//     return () => {
//       connection.off("UnreadCountChanged", handleUnread);
//     };
//   }, [connection]);

//   // Listen for incoming messages and increment unread for the specific contact (optimistic)
//   useEffect(() => {
//     if (!connection) return;

//     const handleMessage = msg => {
//       // Normalize incoming payload fields safely
//       const contactId = msg?.contactId ?? msg?.ContactId ?? null;
//       const isIncoming = (() => {
//         if (typeof msg?.isIncoming !== "undefined") return !!msg.isIncoming;
//         if (typeof msg?.IsIncoming !== "undefined") return !!msg.IsIncoming;
//         // fallback: treat presence of senderId or message from contact as incoming
//         return msg?.senderId ? false : true;
//       })();

//       // choose a stable identifier (string)
//       const cid = contactId ? String(contactId) : null;
//       if (!cid) return;

//       console.log(
//         "📩 [SignalR] Received message:",
//         msg,
//         "parsed contactId:",
//         cid,
//         "isIncoming:",
//         isIncoming
//       );

//       // Don't increment for outgoing / self-sent messages
//       // (some payloads set isIncoming=false for messages sent by this user)
//       if (!isIncoming) {
//         // if the hub sends senderId for outgoing messages, we can check it too:
//         if (msg.senderId && String(msg.senderId) === String(currentUserId)) {
//           console.log("↩️ Skipping self-sent message");
//           return;
//         }
//         // otherwise skip any non-incoming message
//         return;
//       }

//       // If the contact is currently open, do not bump unread (they see it)
//       if (cid === selectedId) {
//         console.log("👁️ Contact already open, skipping increment for", cid);
//         return;
//       }

//       // Increment unread for that contact
//       setUnreadCounts(prev => {
//         const prevCount = Number(prev?.[cid] || 0);
//         const next = { ...(prev || {}) };
//         next[cid] = prevCount + 1;
//         console.log(`🔺 Unread for ${cid} => ${next[cid]}`);
//         return next;
//       });
//     };

//     connection.on("ReceiveInboxMessage", handleMessage);

//     return () => {
//       connection.off("ReceiveInboxMessage", handleMessage);
//     };
//   }, [connection, selectedId, currentUserId]);

//   // On SignalR reconnect, reload authoritative unread counts to avoid missed events
//   useEffect(() => {
//     if (!connection) return;

//     // Some HubConnection implementations provide onreconnected
//     if (typeof connection.onreconnected === "function") {
//       connection.onreconnected(() => {
//         console.log(
//           "🔁 SignalR reconnected — reloading contacts & unread counts"
//         );
//         loadContactsAndUnread();
//       });
//     }

//     // Also handle general reconnect detection if available
//     if (typeof connection.onreconnecting === "function") {
//       connection.onreconnecting(() => {
//         console.log("⚠️ SignalR reconnecting...");
//       });
//     }

//     return () => {
//       try {
//         if (typeof connection.onreconnected === "function") {
//           // no off for onreconnected in some implementations - ignore if unavailable
//         }
//       } catch (e) {}
//     };
//   }, [connection, loadContactsAndUnread]);

//   // Handler when user selects a contact
//   // const handleSelect = async id => {
//   //   setSelectedId(id);
//   //   onSelect(id);

//   //   // Optimistically clear unread badge
//   //   setUnreadCounts(prev => ({ ...(prev || {}), [id]: 0 }));

//   //   // Tell server this user has read messages (preferred: SignalR)
//   //   try {
//   //     if (connection && typeof connection.invoke === "function") {
//   //       await connection.invoke("MarkAsRead", id);
//   //       console.log("✅ MarkAsRead invoked via SignalR for", id);
//   //       return;
//   //     }
//   //   } catch (err) {
//   //     console.warn("⚠️ SignalR MarkAsRead failed, falling back to HTTP:", err);
//   //   }

//   //   // Fallback: HTTP endpoint (keeps backward compatibility)
//   //   try {
//   //     await axiosClient.post(`/inbox/mark-read?contactId=${id}`);
//   //     console.log("✅ Marked messages as read (HTTP) for contact:", id);
//   //   } catch (err) {
//   //     console.error("❌ Failed to mark as read via HTTP:", err);
//   //   }
//   // };
//   const handleSelect = async id => {
//     setSelectedId(id);
//     onSelect(id);

//     setUnreadCounts(prev => ({ ...prev, [id]: 0 }));

//     try {
//       if (connection?.invoke) {
//         await connection.invoke("MarkAsRead", id);
//       }
//     } catch {
//       await axiosClient.post(`/inbox/mark-read?contactId=${id}`);
//     }
//   };

//   const getInitials = name =>
//     name
//       ?.split(" ")
//       .map(n => n[0])
//       .join("")
//       .substring(0, 2)
//       .toUpperCase();

//   const safeContacts = Array.isArray(contacts) ? contacts : [];
//   const filtered = safeContacts.filter(c =>
//     (c.name || c.phoneNumber || "")
//       .toString()
//       .toLowerCase()
//       .includes(search.toLowerCase())
//   );

//   return (
//     <div className="w-72 h-full flex flex-col border-r bg-white">
//       <div className="p-3 border-b">
//         <input
//           type="text"
//           placeholder="Search"
//           className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring"
//           value={search}
//           onChange={e => setSearch(e.target.value)}
//         />
//       </div>

//       <div className="flex-1 overflow-y-auto">
//         <div className="text-sm font-semibold text-gray-700 px-4 py-2">
//           Contacts
//         </div>
//         {filtered.map(contact => {
//           const cid = String(contact.id);
//           const unread = Number(unreadCounts[cid] || 0);
//           // debug log (can remove later)
//           // console.log(`🔍 Rendering ${contact.id} | unread: ${unread}`);
//           return (
//             <div
//               key={contact.id}
//               onClick={() => handleSelect(contact.id)}
//               className={`flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-100 ${
//                 selectedId === contact.id ? "bg-gray-200" : ""
//               }`}
//             >
//               <div className="flex items-center gap-3">
//                 <div className="w-9 h-9 rounded-full bg-purple-600 text-xs font-semibold flex items-center justify-center text-white">
//                   {getInitials(contact.name || contact.phoneNumber)}
//                 </div>
//                 <div className="flex flex-col">
//                   <div className="font-medium text-sm text-gray-800 truncate">
//                     {contact.name || contact.phoneNumber || "Unknown"}
//                   </div>
//                   {contact.name && (
//                     <div className="text-xs text-gray-500">
//                       {contact.phoneNumber}
//                     </div>
//                   )}
//                 </div>
//               </div>
//               {unread > 0 && (
//                 <div className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full min-w-[20px] text-center">
//                   {unread}
//                 </div>
//               )}
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// }
