import React, { useRef, useEffect, useCallback } from "react";
import { useInbox } from "../InboxContext";
import ChatBubble from "./ChatBubble";
import dayjs from "dayjs";
import isToday from "dayjs/plugin/isToday";
import isYesterday from "dayjs/plugin/isYesterday";

dayjs.extend(isToday);
dayjs.extend(isYesterday);

function getDateLabel(date) {
  const d = dayjs(date);
  if (d.isToday()) return "Today";
  if (d.isYesterday()) return "Yesterday";
  return d.format("D MMM YYYY");
}

export default function ChatWindow() {
  const { messages = [], connection, selectedContactId } = useInbox();

  // The ONLY scroll container + a bottom anchor
  const scrollContainerRef = useRef(null);
  const bottomRef = useRef(null);

  // Track if user is already at/near bottom
  const atBottomRef = useRef(true);
  const NEAR_BOTTOM_PX = 120;

  const isNearBottom = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return true;
    const distance = el.scrollHeight - (el.scrollTop + el.clientHeight);
    return distance <= NEAR_BOTTOM_PX;
  }, []);

  const handleScroll = useCallback(() => {
    atBottomRef.current = isNearBottom();
  }, [isNearBottom]);

  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({
      behavior: smooth ? "smooth" : "auto",
      block: "end",
    });
  }, []);

  // 1) On first mount -> jump to bottom
  useEffect(() => {
    scrollToBottom(false);
    // initialize bottom state
    atBottomRef.current = true;
  }, [scrollToBottom]);

  // 2) On contact change -> jump to bottom after DOM paints
  useEffect(() => {
    const t = setTimeout(() => scrollToBottom(false), 0);
    return () => clearTimeout(t);
  }, [selectedContactId, scrollToBottom]);

  // 3) On new messages -> only scroll if already near bottom
  useEffect(() => {
    if (atBottomRef.current) scrollToBottom(true);
  }, [messages.length, scrollToBottom]);

  // 4) Allow imperative force scroll (e.g., right after Send)
  useEffect(() => {
    const onForce = () => scrollToBottom(true);
    window.addEventListener("xbc:scrollToBottom", onForce);
    return () => window.removeEventListener("xbc:scrollToBottom", onForce);
  }, [scrollToBottom]);

  // 5) Gentle auto mark-as-read shortly after switching
  useEffect(() => {
    if (!connection || !selectedContactId) return;
    const timeout = setTimeout(() => {
      connection.invoke("MarkAsRead", selectedContactId).catch(err => {
        console.warn("⚠️ MarkAsRead SignalR call failed:", err);
      });
    }, 800);
    return () => clearTimeout(timeout);
  }, [connection, selectedContactId]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        Loading messages…
      </div>
    );
  }

  // Group by date
  const grouped = messages.reduce((acc, msg) => {
    const dateKey = getDateLabel(msg.sentAt || msg.createdAt);
    (acc[dateKey] ||= []).push(msg);
    return acc;
  }, {});

  return (
    <div
      ref={scrollContainerRef}
      onScroll={handleScroll}
      className="p-4 space-y-6 overflow-y-auto h-full"
    >
      {Object.entries(grouped).map(([date, msgs]) => (
        <div key={date}>
          <div className="text-center text-xs text-gray-500 mb-2">{date}</div>
          <div className="space-y-1">
            {msgs.map((msg, idx) => (
              <ChatBubble
                key={msg.id || idx}
                message={msg}
                isOwn={!msg.isIncoming}
              />
            ))}
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}

// import React, { useRef, useEffect } from "react";
// import { useInbox } from "../InboxContext";
// import ChatBubble from "./ChatBubble";
// import dayjs from "dayjs";
// import isToday from "dayjs/plugin/isToday";
// import isYesterday from "dayjs/plugin/isYesterday";

// dayjs.extend(isToday);
// dayjs.extend(isYesterday);

// function getDateLabel(date) {
//   const d = dayjs(date);
//   if (d.isToday()) return "Today";
//   if (d.isYesterday()) return "Yesterday";
//   return d.format("D MMM YYYY");
// }

// export default function ChatWindow() {
//   const { messages, connection, selectedContactId } = useInbox();
//   const bottomRef = useRef(null);
//   const scrollContainerRef = useRef(null);

//   // Smart scrolling
//   useEffect(() => {
//     if (!scrollContainerRef.current) return;
//     const { scrollHeight, scrollTop, clientHeight } =
//       scrollContainerRef.current;
//     if (scrollHeight - scrollTop <= clientHeight + 100) {
//       bottomRef.current?.scrollIntoView({ behavior: "smooth" });
//     }
//   }, [messages]);

//   // Mark messages as read
//   useEffect(() => {
//     if (!connection || !selectedContactId) return;
//     const timeout = setTimeout(() => {
//       connection.invoke("MarkAsRead", selectedContactId).catch(err => {
//         console.warn("⚠️ MarkAsRead SignalR call failed:", err);
//       });
//     }, 800);
//     return () => clearTimeout(timeout);
//   }, [connection, selectedContactId]);

//   if (messages.length === 0) {
//     return (
//       <div className="flex-1 flex items-center justify-center text-gray-400">
//         Loading messages...
//       </div>
//     );
//   }

//   const grouped = messages.reduce((acc, msg) => {
//     const dateKey = getDateLabel(msg.sentAt || msg.createdAt);
//     if (!acc[dateKey]) acc[dateKey] = [];
//     acc[dateKey].push(msg);
//     return acc;
//   }, {});

//   return (
//     <div
//       ref={scrollContainerRef}
//       className="p-4 space-y-6 overflow-y-auto h-full"
//     >
//       {Object.entries(grouped).map(([date, msgs]) => (
//         <div key={date}>
//           <div className="text-center text-xs text-gray-500 mb-2">{date}</div>
//           <div className="space-y-1">
//             {msgs.map((msg, idx) => (
//               <ChatBubble
//                 key={msg.id || idx}
//                 message={msg}
//                 isOwn={!msg.isIncoming}
//               />
//             ))}
//           </div>
//         </div>
//       ))}
//       <div ref={bottomRef} />
//     </div>
//   );
// }
