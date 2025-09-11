import React, { useState, useRef, useEffect } from "react";
import dayjs from "dayjs";
import {
  FaCheck,
  FaCheckDouble,
  FaClock,
  FaExclamationCircle,
} from "react-icons/fa";

export default function ChatBubble({ message, isOwn }) {
  const [expanded, setExpanded] = useState(false);
  const messageRef = useRef(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  const time = dayjs(message.sentAt || message.createdAt).format("h:mm A");
  const messageText =
    message.renderedBody ||
    message.message ||
    message.messageContent ||
    "[no message]";

  useEffect(() => {
    const el = messageRef.current;
    if (el && el.scrollHeight > el.clientHeight + 10) {
      setIsOverflowing(true);
    }
  }, []);

  const baseStyle =
    "px-4 py-2 max-w-[75%] text-sm leading-snug shadow-md whitespace-pre-wrap";

  const ownStyle = "bg-green-600 text-white rounded-2xl rounded-br-sm";
  const incomingStyle = "bg-purple-100 text-gray-900 rounded-2xl rounded-bl-sm";

  const tickColor = isOwn ? "text-white/70" : "text-gray-500";

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-2`}>
      <div
        ref={messageRef}
        onClick={() => isOverflowing && setExpanded(!expanded)}
        className={`${baseStyle} ${isOwn ? ownStyle : incomingStyle} ${
          expanded ? "cursor-zoom-out" : isOverflowing ? "cursor-zoom-in" : ""
        }`}
        style={{
          overflow: "hidden",
          whiteSpace: expanded ? "normal" : "pre-wrap",
        }}
      >
        <div className="flex items-end justify-between gap-2">
          <span className="flex-1">{messageText}</span>
          <span className={`text-[11px] flex items-center gap-1 ${tickColor}`}>
            {time}
            {isOwn && (
              <>
                {/* {message.status === "Sent" && <FaCheck />}
                {message.status === "Delivered" && <FaCheckDouble />}
                {message.status === "Read" && (
                  <FaCheckDouble className="text-blue-400" />
                )} */}
                {message.status === "Sending" && <FaClock />}
                {message.status === "Failed" && (
                  <FaExclamationCircle className="text-red-400" />
                )}
                {message.status === "Sent" && <FaCheck />}
                {message.status === "Delivered" && <FaCheckDouble />}
                {message.status === "Read" && (
                  <FaCheckDouble className="text-blue-400" />
                )}
              </>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}

// import React, { useState, useRef, useEffect } from "react";
// import dayjs from "dayjs";
// import { FaCheck, FaCheckDouble } from "react-icons/fa";

// export default function ChatBubble({ message, isOwn }) {
//   const [expanded, setExpanded] = useState(false);
//   const messageRef = useRef(null);
//   const [isOverflowing, setIsOverflowing] = useState(false);

//   const time = dayjs(message.sentAt || message.createdAt).format("h:mm A");
//   const messageText =
//     message.renderedBody ||
//     message.message ||
//     message.messageContent ||
//     "[no message]";

//   useEffect(() => {
//     const el = messageRef.current;
//     if (el && el.scrollHeight > el.clientHeight + 10) {
//       setIsOverflowing(true);
//     }
//   }, []);

//   const baseStyle =
//     "px-4 py-2 max-w-[75%] text-sm leading-snug shadow-md whitespace-pre-wrap";

//   const ownStyle = "bg-green-600 text-white rounded-2xl rounded-br-sm";
//   const incomingStyle = "bg-purple-100 text-gray-900 rounded-2xl rounded-bl-sm";

//   const tickColor = isOwn ? "text-white/70" : "text-gray-500";

//   return (
//     <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-2`}>
//       <div
//         ref={messageRef}
//         onClick={() => isOverflowing && setExpanded(!expanded)}
//         className={`${baseStyle} ${isOwn ? ownStyle : incomingStyle} ${
//           expanded ? "cursor-zoom-out" : isOverflowing ? "cursor-zoom-in" : ""
//         }`}
//         style={{
//           overflow: "hidden",
//           whiteSpace: expanded ? "normal" : "pre-wrap",
//         }}
//       >
//         <div className="flex items-end justify-between gap-2">
//           <span className="flex-1">
//             {messageText}
//             {message.campaignName && (
//               <div className="mt-1 text-[10px] italic text-white/80">
//                 📢 Sent via campaign: {message.campaignName}
//               </div>
//             )}
//           </span>

//           <span className={`text-[11px] flex items-center gap-1 ${tickColor}`}>
//             {time}
//             {isOwn && (
//               <>
//                 {message.status === "Sent" && <FaCheck />}
//                 {message.status === "Delivered" && <FaCheckDouble />}
//                 {message.status === "Read" && (
//                   <FaCheckDouble className="text-blue-400" />
//                 )}
//               </>
//             )}
//           </span>
//         </div>
//       </div>
//     </div>
//   );
// }
