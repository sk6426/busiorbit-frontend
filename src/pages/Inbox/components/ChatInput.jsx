import React, { useRef, useState, useCallback, useEffect } from "react";
import { useInbox } from "../InboxContext";
import { Smile, Paperclip, Send, X as CloseIcon } from "lucide-react";
import QuickReplyPicker from "./QuickReplyPicker";
import EmojiPicker from "./EmojiPicker";

export default function ChatInput() {
  const { newMessage, setNewMessage, sendMessage, isConnected } = useInbox();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const textareaRef = useRef(null);

  const clearMessage = () => setNewMessage("");

  const handleSend = () => {
    if (!isConnected || !newMessage?.trim()) return;
    setPickerOpen(false);
    setEmojiOpen(false);
    sendMessage();
    // ✅ force the message list to scroll to bottom after sending
    window.dispatchEvent(new CustomEvent("xbc:scrollToBottom"));
  };

  const handleKeyDown = e => {
    if (e.key === "/" && !pickerOpen) {
      e.preventDefault();
      setPickerOpen(true);
      return;
    }
    if (e.key === "Escape" && (pickerOpen || emojiOpen)) {
      e.preventDefault();
      setPickerOpen(false);
      setEmojiOpen(false);
      return;
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const insertAtCursor = useCallback(
    snippet => {
      const el = textareaRef.current;
      if (!el) {
        setNewMessage(prev => (prev ? `${prev} ${snippet}` : snippet));
        return;
      }
      const start = el.selectionStart ?? newMessage?.length ?? 0;
      const end = el.selectionEnd ?? newMessage?.length ?? 0;
      const base = newMessage ?? "";
      const next = base.slice(0, start) + snippet + base.slice(end);
      setNewMessage(next);
      requestAnimationFrame(() => {
        el.focus();
        const pos = start + snippet.length;
        el.setSelectionRange(pos, pos);
      });
    },
    [newMessage, setNewMessage]
  );

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const max = 160; // ~4 lines
    el.style.height = Math.min(el.scrollHeight, max) + "px";
  }, []);

  useEffect(() => {
    autoResize();
  }, [newMessage, autoResize]);

  return (
    <div className="p-3 border-t bg-white overflow-visible">
      <div className="flex items-center gap-2">
        {/* Quick Reply */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setPickerOpen(v => !v)}
            className="h-9 px-3 text-sm rounded-lg border bg-white hover:bg-gray-50"
            title="Saved replies"
            disabled={!isConnected}
            aria-expanded={pickerOpen}
          >
            Quick Reply
          </button>
          {pickerOpen && (
            <div className="absolute left-0 bottom-full mb-2 z-[100]">
              <QuickReplyPicker
                onInsert={text => {
                  insertAtCursor(text);
                  setPickerOpen(false);
                }}
                onClose={() => setPickerOpen(false)}
              />
            </div>
          )}
        </div>

        {/* Emoji */}
        <div className="relative">
          <button
            type="button"
            className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-gray-100"
            title="Emoji"
            disabled={!isConnected}
            aria-expanded={emojiOpen}
            onClick={() => setEmojiOpen(v => !v)}
          >
            <Smile size={16} />
          </button>
          {emojiOpen && (
            <div className="absolute left-0 bottom-full mb-2 z-[100]">
              <EmojiPicker
                onPick={emoji => {
                  insertAtCursor(emoji);
                  setEmojiOpen(false);
                }}
                onClose={() => setEmojiOpen(false)}
              />
            </div>
          )}
        </div>

        {/* Attach (placeholder) */}
        <button
          className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-gray-100"
          title="Attach"
          disabled
        >
          <Paperclip size={16} />
        </button>

        {/* Textarea + Clear X */}
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            rows={1}
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={autoResize}
            disabled={!isConnected}
            placeholder={
              !isConnected
                ? "Connecting..."
                : "Type your message… (Enter to send • Shift+Enter for new line)"
            }
            className="w-full text-sm px-4 py-2 pr-12 rounded-xl border shadow-sm focus:outline-none focus:ring-1 bg-white focus:border-purple-500 resize-none min-h-[40px] max-h-40 overflow-y-auto leading-relaxed"
          />
          {!!(newMessage || "").length && (
            <button
              type="button"
              onClick={clearMessage}
              title="Clear"
              aria-label="Clear message"
              className="absolute right-2 inset-y-0 my-auto h-6 w-6 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500"
            >
              <CloseIcon size={16} />
            </button>
          )}
        </div>

        {/* Send */}
        <button
          onClick={handleSend}
          disabled={!isConnected || !newMessage?.trim()}
          className="h-9 w-9 flex items-center justify-center rounded-full text-white bg-green-600 hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed"
          title="Send"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}

// import React, { useRef, useState, useCallback, useEffect } from "react";
// import { useInbox } from "../InboxContext";
// import { Smile, Paperclip, Send, X as CloseIcon } from "lucide-react";
// import QuickReplyPicker from "./QuickReplyPicker";
// import EmojiPicker from "./EmojiPicker";

// export default function ChatInput() {
//   const { newMessage, setNewMessage, sendMessage, isConnected } = useInbox();
//   const [pickerOpen, setPickerOpen] = useState(false);
//   const [emojiOpen, setEmojiOpen] = useState(false);
//   const textareaRef = useRef(null);

//   const clearMessage = () => setNewMessage("");

//   const handleSend = () => {
//     if (!isConnected || !newMessage?.trim()) return;
//     setPickerOpen(false);
//     setEmojiOpen(false);
//     sendMessage();
//   };

//   const handleKeyDown = e => {
//     if (e.key === "/" && !pickerOpen) {
//       e.preventDefault();
//       setPickerOpen(true);
//       return;
//     }
//     if (e.key === "Escape" && (pickerOpen || emojiOpen)) {
//       e.preventDefault();
//       setPickerOpen(false);
//       setEmojiOpen(false);
//       return;
//     }
//     if (e.key === "Enter" && !e.shiftKey) {
//       e.preventDefault();
//       handleSend();
//     }
//   };

//   const insertAtCursor = useCallback(
//     snippet => {
//       const el = textareaRef.current;
//       if (!el) {
//         setNewMessage(prev => (prev ? `${prev} ${snippet}` : snippet));
//         return;
//       }
//       const start = el.selectionStart ?? newMessage?.length ?? 0;
//       const end = el.selectionEnd ?? newMessage?.length ?? 0;
//       const base = newMessage ?? "";
//       const next = base.slice(0, start) + snippet + base.slice(end);
//       setNewMessage(next);
//       requestAnimationFrame(() => {
//         el.focus();
//         const pos = start + snippet.length;
//         el.setSelectionRange(pos, pos);
//       });
//     },
//     [newMessage, setNewMessage]
//   );

//   const autoResize = useCallback(() => {
//     const el = textareaRef.current;
//     if (!el) return;
//     el.style.height = "auto";
//     const max = 160; // ~4 lines
//     el.style.height = Math.min(el.scrollHeight, max) + "px";
//   }, []);

//   useEffect(() => {
//     autoResize();
//   }, [newMessage, autoResize]);

//   return (
//     <div className="p-3 border-t bg-white overflow-visible">
//       <div className="flex items-center gap-2">
//         {/* Quick Reply */}
//         <div className="relative">
//           <button
//             type="button"
//             onClick={() => setPickerOpen(v => !v)}
//             className="h-9 px-3 text-sm rounded-lg border bg-white hover:bg-gray-50"
//             title="Saved replies"
//             disabled={!isConnected}
//             aria-expanded={pickerOpen}
//           >
//             Quick Reply
//           </button>
//           {pickerOpen && (
//             <div className="absolute left-0 bottom-full mb-2 z-[100]">
//               <QuickReplyPicker
//                 onInsert={text => {
//                   insertAtCursor(text);
//                   setPickerOpen(false);
//                 }}
//                 onClose={() => setPickerOpen(false)}
//               />
//             </div>
//           )}
//         </div>

//         {/* Emoji */}
//         <div className="relative">
//           <button
//             type="button"
//             className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-gray-100"
//             title="Emoji"
//             disabled={!isConnected}
//             aria-expanded={emojiOpen}
//             onClick={() => setEmojiOpen(v => !v)}
//           >
//             <Smile size={16} />
//           </button>
//           {emojiOpen && (
//             <div className="absolute left-0 bottom-full mb-2 z-[100]">
//               <EmojiPicker
//                 onPick={emoji => {
//                   insertAtCursor(emoji);
//                   setEmojiOpen(false);
//                 }}
//                 onClose={() => setEmojiOpen(false)}
//               />
//             </div>
//           )}
//         </div>

//         {/* Attach (placeholder) */}
//         <button
//           className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-gray-100"
//           title="Attach"
//           disabled
//         >
//           <Paperclip size={16} />
//         </button>

//         {/* Textarea + Clear X */}
//         <div className="relative flex-1">
//           <textarea
//             ref={textareaRef}
//             rows={1}
//             value={newMessage}
//             onChange={e => setNewMessage(e.target.value)}
//             onKeyDown={handleKeyDown}
//             onInput={autoResize}
//             disabled={!isConnected}
//             placeholder={
//               !isConnected
//                 ? "Connecting..."
//                 : "Type your message… (Enter to send • Shift+Enter for new line)"
//             }
//             className="w-full text-sm px-4 py-2 pr-12 rounded-xl border shadow-sm focus:outline-none focus:ring-1 bg-white focus:border-purple-500 resize-none min-h-[40px] max-h-40 overflow-y-auto leading-relaxed"
//           />
//           {!!(newMessage || "").length && (
//             <button
//               type="button"
//               onClick={clearMessage}
//               title="Clear"
//               aria-label="Clear message"
//               className="absolute right-2 inset-y-0 my-auto h-6 w-6 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500"
//             >
//               <CloseIcon size={16} />
//             </button>
//           )}
//         </div>

//         {/* Send */}
//         <button
//           onClick={handleSend}
//           disabled={!isConnected || !newMessage?.trim()}
//           className="h-9 w-9 flex items-center justify-center rounded-full text-white bg-green-600 hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed"
//           title="Send"
//         >
//           <Send size={16} />
//         </button>
//       </div>
//     </div>
//   );
// }
