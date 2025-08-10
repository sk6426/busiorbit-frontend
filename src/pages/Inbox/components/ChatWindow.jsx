import React, { useRef, useEffect } from "react";
import dayjs from "dayjs";
import isToday from "dayjs/plugin/isToday";
import isYesterday from "dayjs/plugin/isYesterday";
import ChatBubble from "./ChatBubble";

// ✅ Extend dayjs with plugins
dayjs.extend(isToday);
dayjs.extend(isYesterday);

// 🧠 Get display label for date
function getDateLabel(date) {
  const d = dayjs(date);
  if (d.isToday()) return "Today";
  if (d.isYesterday()) return "Yesterday";
  return d.format("D MMM YYYY");
}

export default function ChatWindow({
  messages,
  currentUserId,
  selectedContactId,
  connection,
}) {
  const bottomRef = useRef(null);

  // ✅ Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ✅ Trigger read-tracking via SignalR
  useEffect(() => {
    if (!connection || !selectedContactId) return;
    const timeout = setTimeout(() => {
      connection.invoke("MarkAsRead", selectedContactId).catch(err => {
        console.warn("⚠️ MarkAsRead SignalR call failed:", err);
      });
    }, 800);
    return () => clearTimeout(timeout);
  }, [connection, selectedContactId]);

  if (!messages || messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        No messages yet.
      </div>
    );
  }

  // ✅ Group messages by date
  const grouped = messages.reduce((acc, msg) => {
    const dateKey = getDateLabel(msg.sentAt || msg.createdAt);
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(msg);
    return acc;
  }, {});

  return (
    <div className="p-4 space-y-6 overflow-y-auto h-full">
      {Object.entries(grouped).map(([date, msgs]) => {
        const shownCampaigns = new Set();

        return (
          <div key={date}>
            {/* 🏷️ Date Label */}
            <div className="text-center text-xs text-gray-500 mb-2">{date}</div>

            {/* 💬 Messages with optional Campaign Labels */}
            <div className="space-y-1">
              {msgs.map((msg, idx) => {
                const showCampaignLabel =
                  msg.campaignName && !shownCampaigns.has(msg.campaignName);

                if (showCampaignLabel) shownCampaigns.add(msg.campaignName);

                return (
                  <React.Fragment
                    key={msg.id || msg.messageId || msg._id || idx}
                  >
                    {showCampaignLabel && (
                      <div className="text-center text-[11px] italic text-gray-500 mb-1">
                        📢 Campaign: {msg.campaignName}
                      </div>
                    )}
                    <ChatBubble message={msg} isOwn={!msg.isIncoming} />
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Scroll Anchor */}
      <div ref={bottomRef} />
    </div>
  );
}

// import React, { useRef, useEffect } from "react";
// import dayjs from "dayjs";
// import isToday from "dayjs/plugin/isToday";
// import isYesterday from "dayjs/plugin/isYesterday";
// import ChatBubble from "./ChatBubble";

// // ✅ Extend dayjs with plugins
// dayjs.extend(isToday);
// dayjs.extend(isYesterday);

// /**
//  * 🔤 Returns a readable label like "Today", "Yesterday", or "D MMM YYYY"
//  */
// function getDateLabel(date) {
//   const d = dayjs(date);
//   if (d.isToday()) return "Today";
//   if (d.isYesterday()) return "Yesterday";
//   return d.format("D MMM YYYY");
// }

// /**
//  * 📄 ChatWindow — shows messages grouped by date (e.g., Today, Yesterday)
//  */
// export default function ChatWindow({
//   messages,
//   currentUserId,
//   selectedContactId,
//   connection,
// }) {
//   const bottomRef = useRef(null);

//   useEffect(() => {
//     bottomRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

//   // ✅ Trigger read-tracking via SignalR when contact is viewed
//   useEffect(() => {
//     if (!connection || !selectedContactId) return;

//     const timeout = setTimeout(() => {
//       connection.invoke("MarkAsRead", selectedContactId).catch(err => {
//         console.warn("⚠️ MarkAsRead SignalR call failed:", err);
//       });
//     }, 800);

//     return () => clearTimeout(timeout);
//   }, [connection, selectedContactId]);

//   if (!messages || messages.length === 0) {
//     return (
//       <div className="flex-1 flex items-center justify-center text-gray-400">
//         No messages yet.
//       </div>
//     );
//   }

//   // ✅ Group messages by date
//   const grouped = messages.reduce((acc, msg) => {
//     const dateKey = getDateLabel(msg.sentAt || msg.createdAt);
//     if (!acc[dateKey]) acc[dateKey] = [];
//     acc[dateKey].push(msg);
//     return acc;
//   }, {});

//   return (
//     <div className="p-4 space-y-6 overflow-y-auto h-full">
//       {Object.entries(grouped).map(([date, msgs]) => {
//         const shownCampaigns = new Set();

//         return (
//           <div key={date}>
//             {/* 🏷️ Date Label */}
//             <div className="text-center text-xs text-gray-500 mb-2">{date}</div>

//             {/* 💬 Messages with Campaign Label (only once per campaign per date) */}
//             <div className="space-y-1">
//               {msgs.map((msg, index) => {
//                 const showCampaignName =
//                   msg.campaignName && !shownCampaigns.has(msg.campaignName);

//                 if (showCampaignName) {
//                   shownCampaigns.add(msg.campaignName);
//                 }

//                 return (
//                   <div key={msg.id || index}>
//                     {showCampaignName && (
//                       <div className="mb-1 text-[11px] text-gray-500 italic pl-1">
//                         📢 Sent via campaign:{" "}
//                         <span className="font-semibold">
//                           {msg.campaignName}
//                         </span>
//                       </div>
//                     )}

//                     <ChatBubble message={msg} isOwn={!msg.isIncoming} />
//                   </div>
//                 );
//               })}
//             </div>
//           </div>
//         );
//       })}

//       {/* ✅ Scroll anchor */}
//       <div ref={bottomRef} />
//     </div>
//   );
// }

// import React, { useRef, useEffect } from "react";
// import dayjs from "dayjs";
// import isToday from "dayjs/plugin/isToday";
// import isYesterday from "dayjs/plugin/isYesterday";
// import ChatBubble from "./ChatBubble";

// // ✅ Extend dayjs with plugins
// dayjs.extend(isToday);
// dayjs.extend(isYesterday);

// /**
//  * 🔤 Returns a readable label like "Today", "Yesterday", or "D MMM YYYY"
//  */
// function getDateLabel(date) {
//   const d = dayjs(date);
//   if (d.isToday()) return "Today";
//   if (d.isYesterday()) return "Yesterday";
//   return d.format("D MMM YYYY");
// }

// /**
//  * 📄 ChatWindow — shows messages grouped by date (e.g., Today, Yesterday)
//  */
// export default function ChatWindow({
//   messages,
//   currentUserId,
//   selectedContactId,
//   connection,
// }) {
//   const bottomRef = useRef(null); // ✅ Ref for scroll

//   useEffect(() => {
//     bottomRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

//   // ✅ Trigger read-tracking via SignalR when contact is viewed
//   useEffect(() => {
//     if (!connection || !selectedContactId) return;

//     const timeout = setTimeout(() => {
//       connection.invoke("MarkAsRead", selectedContactId).catch(err => {
//         console.warn("⚠️ MarkAsRead SignalR call failed:", err);
//       });
//     }, 800); // Delay avoids conflict on rapid contact switching

//     return () => clearTimeout(timeout);
//   }, [connection, selectedContactId]);

//   if (!messages || messages.length === 0) {
//     return (
//       <div className="flex-1 flex items-center justify-center text-gray-400">
//         No messages yet.
//       </div>
//     );
//   }

//   // ✅ Group messages by date
//   const grouped = messages.reduce((acc, msg) => {
//     const dateKey = getDateLabel(msg.sentAt || msg.createdAt);
//     if (!acc[dateKey]) acc[dateKey] = [];
//     acc[dateKey].push(msg);
//     return acc;
//   }, {});

//   return (
//     <div className="p-4 space-y-6 overflow-y-auto h-full">
//       {Object.entries(grouped).map(([date, msgs]) => (
//         <div key={date}>
//           {/* 🏷️ Date Label */}
//           <div className="text-center text-xs text-gray-500 mb-2">{date}</div>

//           {/* 💬 Messages for this date */}
//           <div className="space-y-1">
//             {msgs.map(msg => (
//               <ChatBubble
//                 key={msg.id || msg.messageId || msg._id}
//                 // message={msg}
//                 // isOwn={
//                 //   msg.senderId === currentUserId || msg.isIncoming === false
//                 // }
//                 message={msg}
//                 isOwn={!msg.isIncoming}
//               />
//             ))}
//           </div>
//         </div>
//       ))}

//       {/* ✅ Scroll anchor */}
//       <div ref={bottomRef} />
//     </div>
//   );
// }

// import React, { useRef, useEffect } from "react";
// import dayjs from "dayjs";
// import isToday from "dayjs/plugin/isToday";
// import isYesterday from "dayjs/plugin/isYesterday";
// import ChatBubble from "./ChatBubble";

// // ✅ Extend dayjs with plugins
// dayjs.extend(isToday);
// dayjs.extend(isYesterday);

// /**
//  * 🔤 Returns a readable label like "Today", "Yesterday", or "D MMM YYYY"
//  */
// function getDateLabel(date) {
//   const d = dayjs(date);
//   if (d.isToday()) return "Today";
//   if (d.isYesterday()) return "Yesterday";
//   return d.format("D MMM YYYY");
// }

// /**
//  * 📄 ChatWindow — shows messages grouped by date (e.g., Today, Yesterday)
//  */
// export default function ChatWindow({ messages, currentUserId }) {
//   const bottomRef = useRef(null); // ✅ Ref for scroll

//   useEffect(() => {
//     bottomRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

//   if (!messages || messages.length === 0) {
//     return (
//       <div className="flex-1 flex items-center justify-center text-gray-400">
//         No messages yet.
//       </div>
//     );
//   }

//   // ✅ Group messages by date
//   const grouped = messages.reduce((acc, msg) => {
//     const dateKey = getDateLabel(msg.sentAt || msg.createdAt);
//     if (!acc[dateKey]) acc[dateKey] = [];
//     acc[dateKey].push(msg);
//     return acc;
//   }, {});

//   return (
//     <div className="p-4 space-y-6 overflow-y-auto h-full">
//       {Object.entries(grouped).map(([date, msgs]) => (
//         <div key={date}>
//           {/* 🏷️ Date Label */}
//           <div className="text-center text-xs text-gray-500 mb-2">{date}</div>

//           {/* 💬 Messages for this date */}
//           <div className="space-y-1">
//             {msgs.map(msg => (
//               <ChatBubble
//                 key={msg.id || msg.messageId || msg._id}
//                 message={msg}
//                 isOwn={
//                   msg.senderId === currentUserId || msg.isIncoming === false
//                 }
//               />
//             ))}
//           </div>
//         </div>
//       ))}

//       {/* ✅ Scroll anchor */}
//       <div ref={bottomRef} />
//     </div>
//   );
// }

// import React from "react";
// import dayjs from "dayjs";
// import isToday from "dayjs/plugin/isToday";
// import isYesterday from "dayjs/plugin/isYesterday";
// import ChatBubble from "./ChatBubble";

// // ✅ Extend dayjs with plugins
// dayjs.extend(isToday);
// dayjs.extend(isYesterday);

// /**
//  * 🔤 Returns a readable label like "Today", "Yesterday", or "D MMM YYYY"
//  */
// function getDateLabel(date) {
//   const d = dayjs(date);
//   if (d.isToday()) return "Today";
//   if (d.isYesterday()) return "Yesterday";
//   return d.format("D MMM YYYY");
// }

// /**
//  * 📄 ChatWindow — shows messages grouped by date (e.g., Today, Yesterday)
//  */
// export default function ChatWindow({ messages, currentUserId }) {
//   if (!messages || messages.length === 0) {
//     return (
//       <div className="flex-1 flex items-center justify-center text-gray-400">
//         No messages yet.
//       </div>
//     );
//   }

//   // ✅ Group messages by date
//   const grouped = messages.reduce((acc, msg) => {
//     const dateKey = getDateLabel(msg.sentAt || msg.createdAt);
//     if (!acc[dateKey]) acc[dateKey] = [];
//     acc[dateKey].push(msg);
//     return acc;
//   }, {});

//   return (
//     <div className="p-4 space-y-6">
//       {Object.entries(grouped).map(([date, msgs]) => (
//         <div key={date}>
//           {/* 🏷️ Date Label */}
//           <div className="text-center text-xs text-gray-500 mb-2">{date}</div>

//           {/* 💬 Messages for this date */}
//           <div className="space-y-1">
//             {msgs.map(msg => (
//               <ChatBubble
//                 key={msg.id || msg.messageId || msg._id}
//                 message={msg}
//                 isOwn={
//                   msg.senderId === currentUserId || msg.isIncoming === false
//                 }
//               />
//             ))}
//           </div>
//         </div>
//       ))}
//     </div>
//   );
// }

// import React from "react";
// import dayjs from "dayjs";
// import isToday from "dayjs/plugin/isToday";
// import isYesterday from "dayjs/plugin/isYesterday";
// import ChatBubble from "./ChatBubble";

// // ✅ Extend dayjs with plugins
// dayjs.extend(isToday);
// dayjs.extend(isYesterday);

// /**
//  * 🔤 Returns a readable label like "Today", "Yesterday", or "D MMM YYYY"
//  */
// function getDateLabel(date) {
//   const d = dayjs(date);
//   if (d.isToday()) return "Today";
//   if (d.isYesterday()) return "Yesterday";
//   return d.format("D MMM YYYY");
// }

// /**
//  * 📄 ChatWindow — shows messages grouped by date (e.g., Today, Yesterday)
//  */
// export default function ChatWindow({ messages, currentUserId }) {
//   if (!messages || messages.length === 0) {
//     return (
//       <div className="flex-1 flex items-center justify-center text-gray-400">
//         No messages yet.
//       </div>
//     );
//   }

//   // ✅ Group messages by date
//   const grouped = messages.reduce((acc, msg) => {
//     const dateKey = getDateLabel(msg.sentAt || msg.createdAt);
//     if (!acc[dateKey]) acc[dateKey] = [];
//     acc[dateKey].push(msg);
//     return acc;
//   }, {});

//   return (
//     <div className="p-4 space-y-6">
//       {Object.entries(grouped).map(([date, msgs]) => (
//         <div key={date}>
//           {/* 🏷️ Date Label */}
//           <div className="text-center text-xs text-gray-500 mb-2">{date}</div>

//           {/* 💬 Messages for this date */}
//           <div className="space-y-1">
//             {/* {msgs.map(message => (
//               <ChatBubble
//                 key={message.id}
//                 message={message}
//                 isOwn={message.senderId === currentUserId}
//               />
//             ))} */}

//             {messages.map(msg => (
//               <ChatBubble
//                 key={msg.id || msg._id || msg.messageId}
//                 message={msg}
//                 isOwn={msg.isIncoming === false}
//               />
//             ))}
//           </div>
//         </div>
//       ))}
//     </div>
//   );
// }

// import React, { useEffect, useRef } from "react";
// import dayjs from "dayjs";
// import isToday from "dayjs/plugin/isToday";
// import isYesterday from "dayjs/plugin/isYesterday";
// import ChatBubble from "./ChatBubble";

// dayjs.extend(isToday);
// dayjs.extend(isYesterday);

// // ✅ Group messages by date (Today, Yesterday, etc.)
// function groupMessagesByDate(messages) {
//   const groups = {};

//   messages.forEach(msg => {
//     const date = dayjs(msg.createdAt || msg.sentAt);
//     let label = date.format("DD MMM");

//     if (date.isToday()) label = "Today";
//     else if (date.isYesterday()) label = "Yesterday";

//     if (!groups[label]) groups[label] = [];
//     groups[label].push(msg);
//   });

//   return groups;
// }

// /**
//  * ✅ ChatWindow
//  * Displays scrollable message area with grouped dates.
//  * Props:
//  * - messages: array
//  * - currentUserId: string
//  */
// export default function ChatWindow({ messages = [], currentUserId }) {
//   const chatEndRef = useRef(null);

//   // ✅ Auto-scroll to bottom on new message
//   useEffect(() => {
//     if (chatEndRef.current) {
//       chatEndRef.current.scrollIntoView({ behavior: "smooth" });
//     }
//   }, [messages]);

//   const grouped = groupMessagesByDate(messages);

//   return (
//     <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
//       {Object.entries(grouped).map(([dateLabel, msgs]) => (
//         <div key={dateLabel}>
//           {/* 🗓️ Date Label */}
//           <div className="flex items-center gap-2 my-4">
//             <div className="flex-grow border-t border-gray-300" />
//             <span className="text-xs text-gray-500">{dateLabel}</span>
//             <div className="flex-grow border-t border-gray-300" />
//           </div>

//           {/* 💬 Messages under this date */}
//           {msgs.map((msg, index) => {
//             const isOwn =
//               msg.senderId !== undefined
//                 ? msg.senderId?.toString() === currentUserId?.toString()
//                 : !msg.isIncoming;

//             return (
//               <ChatBubble key={msg.id || index} message={msg} isOwn={isOwn} />
//             );
//           })}
//         </div>
//       ))}

//       {/* Anchor to always scroll bottom */}
//       <div ref={chatEndRef} />
//     </div>
//   );
// }
