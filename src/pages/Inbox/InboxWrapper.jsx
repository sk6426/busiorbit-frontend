import React, { useState, useEffect } from "react";
import { InboxProvider, useInbox } from "./InboxContext";
import InboxSidebar from "./components/InboxSidebar";
import ChatWindow from "./components/ChatWindow";
import ChatInput from "./components/ChatInput";
import ContactSidebar from "./components/ContactSidebar";
import ChatHeader from "./components/ChatHeader";
import { ChevronLeft, ChevronRight, Bell } from "lucide-react";

// The layout component gets its data from our new hook
function InboxLayout() {
  const {
    selectedContactId,
    setSelectedContactId,
    currentUserId,
    playSound,
    toggleSound,
  } = useInbox();

  const [showRightPanel, setShowRightPanel] = useState(true);

  // Control body scrolling when inbox is mounted
  useEffect(() => {
    // Store original styles
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;

    // Add classes to prevent scrolling
    document.body.classList.add("inbox-active");
    document.documentElement.classList.add("inbox-active");

    // Force prevent scrolling
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    // Cleanup function to restore original styles
    return () => {
      document.body.classList.remove("inbox-active");
      document.documentElement.classList.remove("inbox-active");
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, []);

  return (
    <div className="inbox-fullscreen h-screen flex flex-col overflow-hidden">
      <header className="h-12 bg-white border-b shadow-sm px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 text-purple-600 font-semibold text-base">
          <span className="text-xl">📨</span>
          Inbox
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSound}
            className={`text-xs flex items-center gap-1 px-2 py-1 rounded-full border shadow-sm hover:bg-purple-50 ${
              playSound
                ? "bg-green-100 text-green-600 border-green-300"
                : "bg-gray-100 text-gray-500 border-gray-300"
            }`}
          >
            <Bell size={14} /> {playSound ? "Sound ON" : "Sound OFF"}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Always visible */}
        <div
          className="bg-white border-r overflow-y-auto"
          style={{
            width: "288px",
            minWidth: "288px",
            maxWidth: "288px",
            height: "100%",
          }}
        >
          <InboxSidebar
            onSelect={id => setSelectedContactId(id)}
            currentUserId={currentUserId}
          />
        </div>

        <div className="flex flex-col flex-1 bg-[#f0f0eb] overflow-hidden relative">
          <button
            className="absolute right-2 top-2 z-10 bg-white border shadow-sm rounded-full p-1 text-gray-500 hover:text-purple-600"
            onClick={() => setShowRightPanel(!showRightPanel)}
            title={showRightPanel ? "Hide contact info" : "Show contact info"}
          >
            {showRightPanel ? (
              <ChevronRight size={16} />
            ) : (
              <ChevronLeft size={16} />
            )}
          </button>

          {selectedContactId ? (
            <>
              {/* Chat Header - Fixed at top */}
              <div className="shrink-0">
                <ChatHeader contactId={selectedContactId} />
              </div>

              {/* Chat Window - Scrollable area that takes remaining space */}
              <div className="flex-1 overflow-hidden">
                <ChatWindow />
              </div>

              {/* Chat Input - Fixed at bottom */}
              <div className="shrink-0" style={{ flexShrink: 0 }}>
                <ChatInput />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              Please select a contact to start chatting.
            </div>
          )}
        </div>

        {showRightPanel && selectedContactId && (
          <div
            className="w-80 border-l bg-white overflow-y-auto"
            style={{ height: "100%", maxHeight: "100%" }}
          >
            <ContactSidebar contactId={selectedContactId} />
          </div>
        )}
      </div>
    </div>
  );
}

// The final export wraps our layout with the provider
export default function InboxWrapper() {
  return (
    <InboxProvider>
      <InboxLayout />
    </InboxProvider>
  );
}
// import React, { useEffect, useState } from "react";
// import useSignalR from "../../hooks/useSignalR";
// import InboxSidebar from "./components/InboxSidebar";
// import ChatWindow from "./components/ChatWindow";
// import ChatInput from "./components/ChatInput";
// import ContactSidebar from "./components/ContactSidebar";
// import ChatHeader from "./components/ChatHeader";
// import axiosClient from "../../api/axiosClient";
// import { toast } from "react-toastify";
// import { ChevronLeft, ChevronRight, Bell } from "lucide-react";
// import { InboxProvider, useInbox } from "./InboxContext";
// export default function InboxWrapper() {
//   const { connection, isConnected } = useSignalR();
//   const [messages, setMessages] = useState([]);
//   const [selectedContactId, setSelectedContactId] = useState(null);
//   const [newMessage, setNewMessage] = useState("");
//   const [contact, setContact] = useState(null);
//   const [showRightPanel, setShowRightPanel] = useState(true);
//   const [playSound, setPlaySound] = useState(
//     localStorage.getItem("playSound") === "true"
//   );
//   const [userHasInteracted, setUserHasInteracted] = useState(false);

//   const currentUserId = localStorage.getItem("userId");

//   // ✅ Track first user interaction to allow audio play
//   useEffect(() => {
//     const handleUserInteraction = () => setUserHasInteracted(true);
//     window.addEventListener("click", handleUserInteraction);
//     window.addEventListener("keydown", handleUserInteraction);
//     return () => {
//       window.removeEventListener("click", handleUserInteraction);
//       window.removeEventListener("keydown", handleUserInteraction);
//     };
//   }, []);

//   // 🔊 Sound toggle with permission
//   const toggleSound = async () => {
//     const newVal = !playSound;

//     if (newVal) {
//       try {
//         const audio = new Audio("/sounds/inbox_notify.mp3");
//         await audio.play();
//         audio.pause();
//         setPlaySound(true);
//         localStorage.setItem("playSound", "true");
//       } catch (err) {
//         toast.error("🔇 Browser blocked sound. Allow autoplay.");
//         console.warn("⚠️ Audio play blocked:", err);
//         setPlaySound(false);
//         localStorage.setItem("playSound", "false");
//       }
//     } else {
//       setPlaySound(false);
//       localStorage.setItem("playSound", "false");
//     }
//   };

//   // 📞 Fetch contact info on select
//   useEffect(() => {
//     if (!selectedContactId) {
//       setContact(null);
//       return;
//     }
//     axiosClient.get(`/contacts/${selectedContactId}`).then(res => {
//       setContact(res.data);
//     });
//   }, [selectedContactId]);

//   // 📩 Load message history
//   useEffect(() => {
//     if (!selectedContactId) return;
//     axiosClient
//       .get(`/inbox/messages?contactId=${selectedContactId}`)
//       .then(res => setMessages(res.data))
//       .catch(err => {
//         console.error("❌ Failed to load messages:", err);
//         toast.error("Failed to load messages.");
//       });
//   }, [selectedContactId]);

//   // 🚀 Send message
//   // const sendMessage = async () => {
//   //   if (!selectedContactId)
//   //     return toast.error("❗ Please select a contact first.");
//   //   if (!newMessage.trim()) return toast.warn("⚠️ Please type a message.");
//   //   if (!connection || !isConnected)
//   //     return toast.error("❌ SignalR not connected.");

//   //   try {
//   //     await connection.invoke("SendMessageToContact", {
//   //       contactId: selectedContactId,
//   //       message: newMessage,
//   //     });
//   //     setNewMessage("");
//   //   } catch (err) {
//   //     console.error("❌ Send failed:", err);
//   //     toast.error("Failed to send message.");
//   //   }
//   // };
//   const sendMessage = async () => {
//     if (!selectedContactId || !newMessage.trim()) return;
//     if (!connection || !isConnected)
//       return toast.error("❌ SignalR not connected.");

//     // 1. Create a temporary message for optimistic UI
//     const tempId = `temp_${Date.now()}`;
//     const optimisticMessage = {
//       id: tempId,
//       contactId: selectedContactId,
//       messageContent: newMessage,
//       isIncoming: false,
//       sentAt: new Date().toISOString(),
//       status: "Sending", // Special status for the UI
//     };

//     // 2. Add to state immediately and clear input
//     setMessages(prevMessages => [...prevMessages, optimisticMessage]);
//     setNewMessage("");

//     try {
//       // 3. Send to server
//       await connection.invoke("SendMessageToContact", {
//         contactId: selectedContactId,
//         message: newMessage,
//         // Optional: send tempId to make replacement easier
//         // tempId: tempId
//       });
//     } catch (err) {
//       console.error("❌ Send failed:", err);
//       toast.error("Failed to send message.");
//       // Handle error: update the optimistic message to show a "Failed" status
//       setMessages(prev =>
//         prev.map(m => (m.id === tempId ? { ...m, status: "Failed" } : m))
//       );
//     }
//   };
//   // 🔔 Real-time message listener
//   // useEffect(() => {
//   //   if (!connection) return;

//   //   const handler = incoming => {
//   //     if (
//   //       incoming.contactId !== selectedContactId &&
//   //       playSound &&
//   //       userHasInteracted
//   //     ) {
//   //       try {
//   //         const audio = new Audio("/sounds/inbox_notify.mp3");
//   //         audio.play().catch(err => {
//   //           console.warn("🔇 Browser prevented sound playback:", err);
//   //         });
//   //       } catch (err) {
//   //         console.warn("❌ Sound error:", err);
//   //       }
//   //     }

//   //     if (incoming.contactId === selectedContactId) {
//   //       setMessages(prev =>
//   //         [...prev, incoming].sort(
//   //           (a, b) =>
//   //             new Date(a.sentAt || a.createdAt) -
//   //             new Date(b.sentAt || b.createdAt)
//   //         )
//   //       );
//   //     }
//   //   };
//   useEffect(() => {
//     if (!connection) return;

//     const handler = incoming => {
//       // ... sound playing logic ...

//       if (incoming.contactId === selectedContactId) {
//         setMessages(prev => {
//           // If the message is from the current user, replace the temp message
//           if (!incoming.isIncoming) {
//             return prev.map(m => (m.status === "Sending" ? incoming : m));
//           }
//           // Otherwise, just add the new incoming message
//           return [...prev, incoming];
//         });
//       }
//     };
//     connection.on("ReceiveInboxMessage", handler);
//     return () => connection.off("ReceiveInboxMessage", handler);
//   }, [connection, selectedContactId, playSound, userHasInteracted]);

//   return (
//     <div className="h-screen flex flex-col overflow-hidden">
//       {/* 🔒 Top App Bar */}
//       <header className="h-12 bg-white border-b shadow-sm px-6 flex items-center justify-between shrink-0">
//         <div className="flex items-center gap-2 text-purple-600 font-semibold text-base">
//           <span className="text-xl">📨</span> Inbox
//         </div>
//         <div className="flex items-center gap-4">
//           <button
//             onClick={toggleSound}
//             className={`text-xs flex items-center gap-1 px-2 py-1 rounded-full border shadow-sm hover:bg-purple-50 ${
//               playSound
//                 ? "bg-green-100 text-green-600 border-green-300"
//                 : "bg-gray-100 text-gray-500 border-gray-300"
//             }`}
//           >
//             <Bell size={14} /> {playSound ? "Sound ON" : "Sound OFF"}
//           </button>
//         </div>
//       </header>

//       {/* 💬 Main layout */}
//       <div className="flex flex-1 overflow-hidden">
//         {/* 📇 Left Sidebar */}
//         <div className="w-72 border-r bg-white overflow-y-auto">
//           <InboxSidebar
//             onSelect={id => setSelectedContactId(id)}
//             currentUserId={currentUserId}
//           />
//         </div>

//         {/* 💬 Chat Area */}
//         <div className="flex flex-col flex-1 bg-[#f0f0eb] overflow-hidden relative">
//           <button
//             className="absolute right-2 top-2 z-10 bg-white border shadow-sm rounded-full p-1 text-gray-500 hover:text-purple-600"
//             onClick={() => setShowRightPanel(!showRightPanel)}
//             title={showRightPanel ? "Hide contact info" : "Show contact info"}
//           >
//             {showRightPanel ? (
//               <ChevronRight size={16} />
//             ) : (
//               <ChevronLeft size={16} />
//             )}
//           </button>

//           {selectedContactId ? (
//             <>
//               <div className="shrink-0">
//                 <ChatHeader contact={contact} />
//               </div>
//               <div className="flex-1 overflow-y-auto">
//                 <ChatWindow
//                   messages={messages}
//                   currentUserId={currentUserId}
//                   selectedContactId={selectedContactId}
//                   connection={connection}
//                 />
//               </div>
//               <div className="shrink-0">
//                 <ChatInput
//                   value={newMessage}
//                   onChange={e => setNewMessage(e.target.value)}
//                   onSend={sendMessage}
//                   disabled={!isConnected}
//                 />
//               </div>
//             </>
//           ) : (
//             <div className="flex-1 flex items-center justify-center text-gray-400">
//               Please select a contact to start chatting.
//             </div>
//           )}
//         </div>

//         {/* 📇 Right Panel */}
//         {showRightPanel && selectedContactId && (
//           <div className="w-80 border-l bg-white overflow-y-auto">
//             <ContactSidebar contactId={selectedContactId} />
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// import React, { useEffect, useState } from "react";
// import useSignalR from "../../hooks/useSignalR";
// import InboxSidebar from "./components/InboxSidebar";
// import ChatWindow from "./components/ChatWindow";
// import ChatInput from "./components/ChatInput";
// import ContactSidebar from "./components/ContactSidebar";
// import ChatHeader from "./components/ChatHeader";
// import axiosClient from "../../api/axiosClient";
// import { toast } from "react-toastify";
// import { ChevronLeft, ChevronRight, Bell } from "lucide-react";

// export default function InboxWrapper() {
//   const { connection, isConnected } = useSignalR();
//   const [messages, setMessages] = useState([]);
//   const [selectedContactId, setSelectedContactId] = useState(null);
//   const [newMessage, setNewMessage] = useState("");
//   const [contact, setContact] = useState(null);
//   const [showRightPanel, setShowRightPanel] = useState(true);
//   const [playSound, setPlaySound] = useState(
//     localStorage.getItem("playSound") === "true"
//   );

//   const currentUserId = localStorage.getItem("userId");

//   // 🔊 Sound toggle with permission
//   const toggleSound = async () => {
//     const newVal = !playSound;

//     if (newVal) {
//       try {
//         const audio = new Audio("/sounds/inbox_notify.mp3");
//         await audio.play();
//         audio.pause();
//         setPlaySound(true);
//         localStorage.setItem("playSound", "true");
//       } catch (err) {
//         toast.error("🔇 Browser blocked sound. Allow autoplay.");
//         console.warn("⚠️ Audio play blocked:", err);
//         setPlaySound(false);
//         localStorage.setItem("playSound", "false");
//       }
//     } else {
//       setPlaySound(false);
//       localStorage.setItem("playSound", "false");
//     }
//   };

//   // 📞 Fetch contact info on select
//   useEffect(() => {
//     if (!selectedContactId) {
//       setContact(null);
//       return;
//     }
//     axiosClient.get(`/contacts/${selectedContactId}`).then(res => {
//       setContact(res.data);
//     });
//   }, [selectedContactId]);

//   // 📩 Load message history
//   useEffect(() => {
//     if (!selectedContactId) return;
//     axiosClient
//       .get(`/inbox/messages?contactId=${selectedContactId}`)
//       .then(res => setMessages(res.data))
//       .catch(err => {
//         console.error("❌ Failed to load messages:", err);
//         toast.error("Failed to load messages.");
//       });
//   }, [selectedContactId]);

//   // 🚀 Send message
//   const sendMessage = async () => {
//     if (!selectedContactId)
//       return toast.error("❗ Please select a contact first.");
//     if (!newMessage.trim()) return toast.warn("⚠️ Please type a message.");
//     if (!connection || !isConnected)
//       return toast.error("❌ SignalR not connected.");

//     try {
//       await connection.invoke("SendMessageToContact", {
//         contactId: selectedContactId,
//         message: newMessage,
//       });
//       setNewMessage("");
//     } catch (err) {
//       console.error("❌ Send failed:", err);
//       toast.error("Failed to send message.");
//     }
//   };

//   // 🔔 Real-time message listener
//   useEffect(() => {
//     if (!connection) return;

//     const handler = incoming => {
//       if (incoming.contactId !== selectedContactId && playSound) {
//         const audio = new Audio("/sounds/inbox_notify.mp3");
//         audio.play();
//       }

//       if (incoming.contactId === selectedContactId) {
//         setMessages(prev =>
//           [...prev, incoming].sort(
//             (a, b) =>
//               new Date(a.sentAt || a.createdAt) -
//               new Date(b.sentAt || b.createdAt)
//           )
//         );
//       }
//     };

//     connection.on("ReceiveInboxMessage", handler);
//     return () => connection.off("ReceiveInboxMessage", handler);
//   }, [connection, selectedContactId, playSound]);

//   return (
//     <div className="h-screen flex flex-col overflow-hidden">
//       {/* 🔒 Top App Bar */}
//       <header className="h-12 bg-white border-b shadow-sm px-6 flex items-center justify-between shrink-0">
//         <div className="flex items-center gap-2 text-purple-600 font-semibold text-base">
//           <span className="text-xl">📨</span> Inbox
//         </div>
//         <div className="flex items-center gap-4">
//           <button
//             onClick={toggleSound}
//             className={`text-xs flex items-center gap-1 px-2 py-1 rounded-full border shadow-sm hover:bg-purple-50 ${
//               playSound
//                 ? "bg-green-100 text-green-600 border-green-300"
//                 : "bg-gray-100 text-gray-500 border-gray-300"
//             }`}
//           >
//             <Bell size={14} /> {playSound ? "Sound ON" : "Sound OFF"}
//           </button>
//           <div className="text-sm text-gray-500">xByteChat</div>
//         </div>
//       </header>

//       {/* 💬 Main layout */}
//       <div className="flex flex-1 overflow-hidden">
//         {/* 📇 Left Sidebar */}
//         <div className="w-72 border-r bg-white overflow-y-auto">
//           <InboxSidebar
//             onSelect={id => setSelectedContactId(id)}
//             currentUserId={currentUserId}
//           />
//         </div>

//         {/* 💬 Chat Area */}
//         <div className="flex flex-col flex-1 bg-[#f0f0eb] overflow-hidden relative">
//           <button
//             className="absolute right-2 top-2 z-10 bg-white border shadow-sm rounded-full p-1 text-gray-500 hover:text-purple-600"
//             onClick={() => setShowRightPanel(!showRightPanel)}
//             title={showRightPanel ? "Hide contact info" : "Show contact info"}
//           >
//             {showRightPanel ? (
//               <ChevronRight size={16} />
//             ) : (
//               <ChevronLeft size={16} />
//             )}
//           </button>

//           {selectedContactId ? (
//             <>
//               <div className="shrink-0">
//                 <ChatHeader contact={contact} />
//               </div>
//               <div className="flex-1 overflow-y-auto">
//                 <ChatWindow
//                   messages={messages}
//                   currentUserId={currentUserId}
//                   selectedContactId={selectedContactId}
//                   connection={connection}
//                 />
//               </div>
//               <div className="shrink-0">
//                 <ChatInput
//                   value={newMessage}
//                   onChange={e => setNewMessage(e.target.value)}
//                   onSend={sendMessage}
//                   disabled={!isConnected}
//                 />
//               </div>
//             </>
//           ) : (
//             <div className="flex-1 flex items-center justify-center text-gray-400">
//               Please select a contact to start chatting.
//             </div>
//           )}
//         </div>

//         {/* 📇 Right Panel */}
//         {showRightPanel && selectedContactId && (
//           <div className="w-80 border-l bg-white overflow-y-auto">
//             <ContactSidebar contactId={selectedContactId} />
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// import React, { useEffect, useState } from "react";
// import useSignalR from "../../hooks/useSignalR";
// import InboxSidebar from "./components/InboxSidebar";
// import ChatWindow from "./components/ChatWindow";
// import ChatInput from "./components/ChatInput";
// import ContactSidebar from "./components/ContactSidebar";
// import ChatHeader from "./components/ChatHeader";
// import axiosClient from "../../api/axiosClient";
// import { toast } from "react-toastify";
// import { ChevronLeft, ChevronRight, Bell } from "lucide-react";

// export default function InboxWrapper() {
//   const { connection, isConnected } = useSignalR();
//   const [messages, setMessages] = useState([]);
//   const [selectedContactId, setSelectedContactId] = useState(null);
//   const [newMessage, setNewMessage] = useState("");
//   const [contact, setContact] = useState(null);
//   const [showRightPanel, setShowRightPanel] = useState(true);
//   const [playSound, setPlaySound] = useState(
//     localStorage.getItem("playSound") === "true"
//   );

//   const currentUserId = localStorage.getItem("userId");

//   const toggleSound = async () => {
//     const newVal = !playSound;

//     if (newVal) {
//       // Try to play dummy sound to get permission
//       try {
//         const audio = new Audio("/sounds/inbox_notify.mp3");
//         await audio.play();
//         audio.pause();
//         setPlaySound(true);
//         localStorage.setItem("playSound", "true");
//       } catch (err) {
//         toast.error("🔇 Your browser blocked sound. Please allow autoplay.");
//         console.warn("⚠️ Audio play blocked:", err);
//         setPlaySound(false);
//         localStorage.setItem("playSound", "false");
//       }
//     } else {
//       setPlaySound(false);
//       localStorage.setItem("playSound", "false");
//     }
//   };

//   useEffect(() => {
//     if (!selectedContactId) {
//       setContact(null);
//       return;
//     }
//     axiosClient.get(`/contacts/${selectedContactId}`).then(res => {
//       setContact(res.data);
//     });
//   }, [selectedContactId]);

//   useEffect(() => {
//     if (!selectedContactId) return;
//     axiosClient
//       .get(`/inbox/messages?contactId=${selectedContactId}`)
//       .then(res => setMessages(res.data))
//       .catch(err => {
//         console.error("❌ Failed to load messages:", err);
//         toast.error("Failed to load messages.");
//       });
//   }, [selectedContactId]);

//   const sendMessage = async () => {
//     if (!selectedContactId)
//       return toast.error("❗ Please select a contact first.");
//     if (!newMessage.trim()) return toast.warn("⚠️ Please type a message.");
//     if (!connection || !isConnected)
//       return toast.error("❌ SignalR not connected.");

//     try {
//       await connection.invoke("SendMessageToContact", {
//         contactId: selectedContactId,
//         message: newMessage,
//       });
//       setNewMessage("");
//     } catch (err) {
//       console.error("❌ Send failed:", err);
//       toast.error("Failed to send message.");
//     }
//   };

//   useEffect(() => {
//     if (!connection) return;
//     const handler = incoming => {
//       // ✅ Play sound only if it's from another contact
//       if (incoming.contactId !== selectedContactId && playSound) {
//         const audio = new Audio("/sounds/inbox_notify.mp3");
//         audio.play();
//       }
//       if (incoming.contactId === selectedContactId) {
//         setMessages(prev =>
//           [...prev, incoming].sort(
//             (a, b) =>
//               new Date(a.sentAt || a.createdAt) -
//               new Date(b.sentAt || b.createdAt)
//           )
//         );
//       }
//     };
//     connection.on("ReceiveInboxMessage", handler);
//     return () => connection.off("ReceiveInboxMessage", handler);
//   }, [connection, selectedContactId, playSound]);

//   return (
//     <div className="h-screen flex flex-col overflow-hidden">
//       {/* 🔒 Top App Bar */}
//       <header className="h-12 bg-white border-b shadow-sm px-6 flex items-center justify-between shrink-0">
//         <div className="flex items-center gap-2 text-purple-600 font-semibold text-base">
//           <span className="text-xl">📨</span> Inbox
//         </div>
//         <div className="flex items-center gap-4">
//           <button
//             onClick={toggleSound}
//             className={`text-xs flex items-center gap-1 px-2 py-1 rounded-full border shadow-sm hover:bg-purple-50 ${
//               playSound
//                 ? "bg-green-100 text-green-600 border-green-300"
//                 : "bg-gray-100 text-gray-500 border-gray-300"
//             }`}
//           >
//             <Bell size={14} /> {playSound ? "Sound ON" : "Sound OFF"}
//           </button>
//           <div className="text-sm text-gray-500">xByteChat</div>
//         </div>
//       </header>

//       {/* 💬 Main 3-column layout */}
//       <div className="flex flex-1 overflow-hidden">
//         {/* 📇 Left Sidebar */}
//         <div className="w-72 border-r bg-white overflow-y-auto">
//           <InboxSidebar onSelect={id => setSelectedContactId(id)} />
//         </div>

//         {/* 💬 Chat column */}
//         <div className="flex flex-col flex-1 bg-[#f0f0eb] overflow-hidden relative">
//           <button
//             className="absolute right-2 top-2 z-10 bg-white border shadow-sm rounded-full p-1 text-gray-500 hover:text-purple-600"
//             onClick={() => setShowRightPanel(!showRightPanel)}
//             title={showRightPanel ? "Hide contact info" : "Show contact info"}
//           >
//             {showRightPanel ? (
//               <ChevronRight size={16} />
//             ) : (
//               <ChevronLeft size={16} />
//             )}
//           </button>

//           {selectedContactId ? (
//             <>
//               <div className="shrink-0">
//                 <ChatHeader contact={contact} />
//               </div>
//               <div className="flex-1 overflow-y-auto">
//                 <ChatWindow
//                   messages={messages}
//                   currentUserId={currentUserId}
//                   selectedContactId={selectedContactId}
//                   connection={connection}
//                 />
//               </div>
//               <div className="shrink-0">
//                 <ChatInput
//                   value={newMessage}
//                   onChange={e => setNewMessage(e.target.value)}
//                   onSend={sendMessage}
//                   disabled={!isConnected}
//                 />
//               </div>
//             </>
//           ) : (
//             <div className="flex-1 flex items-center justify-center text-gray-400">
//               Please select a contact to start chatting.
//             </div>
//           )}
//         </div>

//         {/* 📇 Right Contact Info */}
//         {showRightPanel && selectedContactId && (
//           <div className="w-80 border-l bg-white overflow-y-auto">
//             <ContactSidebar contactId={selectedContactId} />
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// import React, { useEffect, useState } from "react";
// import useSignalR from "../../hooks/useSignalR";
// import InboxSidebar from "./components/InboxSidebar";
// import ChatWindow from "./components/ChatWindow";
// import ChatInput from "./components/ChatInput";
// import ContactSidebar from "./components/ContactSidebar";
// import ChatHeader from "./components/ChatHeader";
// import axiosClient from "../../api/axiosClient";
// import { toast } from "react-toastify";
// import { ChevronLeft, ChevronRight, Bell } from "lucide-react";

// export default function InboxWrapper() {
//   const { connection, isConnected } = useSignalR();
//   const [messages, setMessages] = useState([]);
//   const [selectedContactId, setSelectedContactId] = useState(null);
//   const [newMessage, setNewMessage] = useState("");
//   const [contact, setContact] = useState(null);
//   const [showRightPanel, setShowRightPanel] = useState(true);
//   const [playSound, setPlaySound] = useState(
//     localStorage.getItem("playSound") === "true"
//   );

//   const currentUserId = localStorage.getItem("userId");

//   const toggleSound = async () => {
//     const newVal = !playSound;

//     if (newVal) {
//       try {
//         const audio = new Audio("/sounds/inbox_notify.mp3");
//         await audio.play();
//         audio.pause();
//         setPlaySound(true);
//         localStorage.setItem("playSound", "true");
//       } catch (err) {
//         toast.error("🔇 Your browser blocked sound. Please allow autoplay.");
//         console.warn("⚠️ Audio play blocked:", err);
//         setPlaySound(false);
//         localStorage.setItem("playSound", "false");
//       }
//     } else {
//       setPlaySound(false);
//       localStorage.setItem("playSound", "false");
//     }
//   };

//   useEffect(() => {
//     if (!selectedContactId) {
//       setContact(null);
//       return;
//     }
//     axiosClient.get(`/contacts/${selectedContactId}`).then(res => {
//       setContact(res.data);
//     });
//   }, [selectedContactId]);

//   useEffect(() => {
//     if (!selectedContactId) return;
//     axiosClient
//       .get(`/inbox/messages?contactId=${selectedContactId}`)
//       .then(res => setMessages(res.data))
//       .catch(err => {
//         console.error("❌ Failed to load messages:", err);
//         toast.error("Failed to load messages.");
//       });
//   }, [selectedContactId]);

//   const sendMessage = async () => {
//     if (!selectedContactId)
//       return toast.error("❗ Please select a contact first.");
//     if (!newMessage.trim()) return toast.warn("⚠️ Please type a message.");
//     if (!connection || !isConnected)
//       return toast.error("❌ SignalR not connected.");

//     try {
//       await connection.invoke("SendMessageToContact", {
//         contactId: selectedContactId,
//         message: newMessage,
//       });
//       setNewMessage("");
//     } catch (err) {
//       console.error("❌ Send failed:", err);
//       toast.error("Failed to send message.");
//     }
//   };

//   useEffect(() => {
//     if (!connection) return;

//     const handler = incoming => {
//       if (incoming.contactId !== selectedContactId && playSound) {
//         const audio = new Audio("/sounds/inbox_notify.mp3");
//         audio.play();
//       }

//       if (incoming.contactId === selectedContactId) {
//         setMessages(prev =>
//           [...prev, incoming].sort(
//             (a, b) =>
//               new Date(a.sentAt || a.createdAt) -
//               new Date(b.sentAt || b.createdAt)
//           )
//         );
//       }
//     };

//     connection.on("ReceiveInboxMessage", handler);
//     return () => connection.off("ReceiveInboxMessage", handler);
//   }, [connection, selectedContactId, playSound]);

//   return (
//     <div className="h-screen flex flex-col overflow-hidden">
//       {/* 🔒 Top App Bar */}
//       <header className="h-12 bg-white border-b shadow-sm px-6 flex items-center justify-between shrink-0">
//         <div className="flex items-center gap-2 text-purple-600 font-semibold text-base">
//           📨 Inbox
//         </div>
//         <div className="flex items-center gap-4">
//           <button
//             onClick={toggleSound}
//             className={`text-xs flex items-center gap-1 px-2 py-1 rounded-full border shadow-sm hover:bg-purple-50 ${
//               playSound
//                 ? "bg-green-100 text-green-600 border-green-300"
//                 : "bg-gray-100 text-gray-500 border-gray-300"
//             }`}
//           >
//             <Bell size={14} /> {playSound ? "Sound ON" : "Sound OFF"}
//           </button>
//           <div className="text-sm text-gray-500">xByteChat</div>
//         </div>
//       </header>

//       {/* 💬 Main 3-column layout */}
//       <div className="flex flex-1 overflow-hidden">
//         {/* 📇 Left Sidebar */}
//         <div className="w-72 border-r bg-white overflow-y-auto">
//           <InboxSidebar onSelect={id => setSelectedContactId(id)} />
//         </div>

//         {/* 💬 Chat column */}
//         <div className="flex flex-col flex-1 bg-[#f0f0eb] overflow-hidden relative">
//           <button
//             className="absolute right-2 top-2 z-10 bg-white border shadow-sm rounded-full p-1 text-gray-500 hover:text-purple-600"
//             onClick={() => setShowRightPanel(!showRightPanel)}
//             title={showRightPanel ? "Hide contact info" : "Show contact info"}
//           >
//             {showRightPanel ? (
//               <ChevronRight size={16} />
//             ) : (
//               <ChevronLeft size={16} />
//             )}
//           </button>

//           {selectedContactId ? (
//             <>
//               <div className="shrink-0">
//                 <ChatHeader contact={contact} />
//               </div>
//               <div className="flex-1 overflow-y-auto">
//                 <ChatWindow messages={messages} currentUserId={currentUserId} />
//               </div>
//               <div className="shrink-0">
//                 <ChatInput
//                   value={newMessage}
//                   onChange={e => setNewMessage(e.target.value)}
//                   onSend={sendMessage}
//                   disabled={!isConnected}
//                 />
//               </div>
//             </>
//           ) : (
//             <div className="flex-1 flex items-center justify-center text-gray-400">
//               Please select a contact to start chatting.
//             </div>
//           )}
//         </div>

//         {/* 📇 Right Contact Info */}
//         {showRightPanel && selectedContactId && (
//           <div className="w-80 border-l bg-white overflow-y-auto">
//             <ContactSidebar contactId={selectedContactId} />
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// // ✅ Updated InboxWrapper.jsx with stable notification sound toggle via useNotificationSound
// import React, { useEffect, useState } from "react";
// import useSignalR from "../../hooks/useSignalR";
// import useNotificationSound from "../../hooks/useNotificationSound";
// import InboxSidebar from "./components/InboxSidebar";
// import ChatWindow from "./components/ChatWindow";
// import ChatInput from "./components/ChatInput";
// import ContactSidebar from "./components/ContactSidebar";
// import ChatHeader from "./components/ChatHeader";
// import axiosClient from "../../api/axiosClient";
// import { toast } from "react-toastify";
// import { ChevronLeft, ChevronRight, Bell } from "lucide-react";

// export default function InboxWrapper() {
//   const { connection, isConnected } = useSignalR();
//   const [messages, setMessages] = useState([]);
//   const [selectedContactId, setSelectedContactId] = useState(null);
//   const [newMessage, setNewMessage] = useState("");
//   const [contact, setContact] = useState(null);
//   const [showRightPanel, setShowRightPanel] = useState(true);
//   const currentUserId = localStorage.getItem("userId");

//   const { isSoundOn, toggleSound, soundRef } = useNotificationSound();

//   useEffect(() => {
//     if (!selectedContactId) {
//       setContact(null);
//       return;
//     }
//     axiosClient.get(`/contacts/${selectedContactId}`).then(res => {
//       setContact(res.data);
//     });
//   }, [selectedContactId]);

//   useEffect(() => {
//     if (!selectedContactId) return;
//     axiosClient
//       .get(`/inbox/messages?contactId=${selectedContactId}`)
//       .then(res => setMessages(res.data))
//       .catch(err => {
//         console.error("❌ Failed to load messages:", err);
//         toast.error("Failed to load messages.");
//       });
//   }, [selectedContactId]);

//   const sendMessage = async () => {
//     if (!selectedContactId)
//       return toast.error("❗ Please select a contact first.");
//     if (!newMessage.trim()) return toast.warn("⚠️ Please type a message.");
//     if (!connection || !isConnected)
//       return toast.error("❌ SignalR not connected.");

//     try {
//       await connection.invoke("SendMessageToContact", {
//         contactId: selectedContactId,
//         message: newMessage,
//       });
//       setNewMessage("");
//     } catch (err) {
//       console.error("❌ Send failed:", err);
//       toast.error("Failed to send message.");
//     }
//   };

//   useEffect(() => {
//     if (!connection) return;

//     const handler = incoming => {
//       // ✅ Use soundRef for latest value
//       if (incoming.contactId !== selectedContactId && soundRef.current) {
//         const audio = new Audio("/sounds/inbox_notify.mp3");
//         audio.play();
//       }

//       if (incoming.contactId === selectedContactId) {
//         setMessages(prev =>
//           [...prev, incoming].sort(
//             (a, b) =>
//               new Date(a.sentAt || a.createdAt) -
//               new Date(b.sentAt || b.createdAt)
//           )
//         );
//       }
//     };

//     connection.on("ReceiveInboxMessage", handler);
//     return () => connection.off("ReceiveInboxMessage", handler);
//   }, [connection, selectedContactId, soundRef]);

//   return (
//     <div className="h-screen flex flex-col overflow-hidden">
//       {/* 🔒 Top App Bar */}
//       <header className="h-12 bg-white border-b shadow-sm px-6 flex items-center justify-between shrink-0">
//         <div className="flex items-center gap-2 text-purple-600 font-semibold text-base">
//           📨 Inbox
//         </div>
//         <div className="flex items-center gap-4">
//           <button
//             onClick={toggleSound}
//             className={`text-xs flex items-center gap-1 px-2 py-1 rounded-full border shadow-sm hover:bg-purple-50 ${
//               isSoundOn
//                 ? "bg-green-100 text-green-600 border-green-300"
//                 : "bg-gray-100 text-gray-500 border-gray-300"
//             }`}
//           >
//             <Bell size={14} /> {isSoundOn ? "Sound ON" : "Sound OFF"}
//           </button>
//           <div className="text-sm text-gray-500">xByteChat</div>
//         </div>
//       </header>

//       {/* 💬 Main 3-column layout */}
//       <div className="flex flex-1 overflow-hidden">
//         {/* 📇 Left Sidebar */}
//         <div className="w-72 border-r bg-white overflow-y-auto">
//           <InboxSidebar onSelect={id => setSelectedContactId(id)} />
//         </div>

//         {/* 💬 Chat column */}
//         <div className="flex flex-col flex-1 bg-[#f0f0eb] overflow-hidden relative">
//           <button
//             className="absolute right-2 top-2 z-10 bg-white border shadow-sm rounded-full p-1 text-gray-500 hover:text-purple-600"
//             onClick={() => setShowRightPanel(!showRightPanel)}
//             title={showRightPanel ? "Hide contact info" : "Show contact info"}
//           >
//             {showRightPanel ? (
//               <ChevronRight size={16} />
//             ) : (
//               <ChevronLeft size={16} />
//             )}
//           </button>

//           {selectedContactId ? (
//             <>
//               <div className="shrink-0">
//                 <ChatHeader contact={contact} />
//               </div>
//               <div className="flex-1 overflow-y-auto">
//                 <ChatWindow messages={messages} currentUserId={currentUserId} />
//               </div>
//               <div className="shrink-0">
//                 <ChatInput
//                   value={newMessage}
//                   onChange={e => setNewMessage(e.target.value)}
//                   onSend={sendMessage}
//                   disabled={!isConnected}
//                 />
//               </div>
//             </>
//           ) : (
//             <div className="flex-1 flex items-center justify-center text-gray-400">
//               Please select a contact to start chatting.
//             </div>
//           )}
//         </div>

//         {/* 📇 Right Contact Info */}
//         {showRightPanel && selectedContactId && (
//           <div className="w-80 border-l bg-white overflow-y-auto">
//             <ContactSidebar contactId={selectedContactId} />
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// ✅ Updated InboxWrapper.jsx with Notification Sound Toggle + Play Logic
// import React, { useEffect, useState } from "react";
// import useSignalR from "../../hooks/useSignalR";
// import InboxSidebar from "./components/InboxSidebar";
// import ChatWindow from "./components/ChatWindow";
// import ChatInput from "./components/ChatInput";
// import ContactSidebar from "./components/ContactSidebar";
// import ChatHeader from "./components/ChatHeader";
// import axiosClient from "../../api/axiosClient";
// import { toast } from "react-toastify";
// import { ChevronLeft, ChevronRight, Bell } from "lucide-react";

// export default function InboxWrapper() {
//   const { connection, isConnected } = useSignalR();
//   const [messages, setMessages] = useState([]);
//   const [selectedContactId, setSelectedContactId] = useState(null);
//   const [newMessage, setNewMessage] = useState("");
//   const [contact, setContact] = useState(null);
//   const [showRightPanel, setShowRightPanel] = useState(true);
//   const [playSound, setPlaySound] = useState(
//     localStorage.getItem("playSound") === "true"
//   );

//   const currentUserId = localStorage.getItem("userId");

//   // const toggleSound = () => {
//   //   const newVal = !playSound;
//   //   setPlaySound(newVal);
//   //   localStorage.setItem("playSound", newVal);
//   // };
//   const toggleSound = async () => {
//     const newVal = !playSound;

//     if (newVal) {
//       // Try to play dummy sound to get permission
//       try {
//         const audio = new Audio("/sounds/inbox_notify.mp3");
//         await audio.play();
//         audio.pause();
//         setPlaySound(true);
//         localStorage.setItem("playSound", "true");
//       } catch (err) {
//         toast.error("🔇 Your browser blocked sound. Please allow autoplay.");
//         console.warn("⚠️ Audio play blocked:", err);
//         setPlaySound(false);
//         localStorage.setItem("playSound", "false");
//       }
//     } else {
//       setPlaySound(false);
//       localStorage.setItem("playSound", "false");
//     }
//   };

//   useEffect(() => {
//     if (!selectedContactId) {
//       setContact(null);
//       return;
//     }
//     axiosClient.get(`/contacts/${selectedContactId}`).then(res => {
//       setContact(res.data);
//     });
//   }, [selectedContactId]);

//   useEffect(() => {
//     if (!selectedContactId) return;
//     axiosClient
//       .get(`/inbox/messages?contactId=${selectedContactId}`)
//       .then(res => setMessages(res.data))
//       .catch(err => {
//         console.error("❌ Failed to load messages:", err);
//         toast.error("Failed to load messages.");
//       });
//   }, [selectedContactId]);

//   const sendMessage = async () => {
//     if (!selectedContactId)
//       return toast.error("❗ Please select a contact first.");
//     if (!newMessage.trim()) return toast.warn("⚠️ Please type a message.");
//     if (!connection || !isConnected)
//       return toast.error("❌ SignalR not connected.");

//     try {
//       await connection.invoke("SendMessageToContact", {
//         contactId: selectedContactId,
//         message: newMessage,
//       });
//       setNewMessage("");
//     } catch (err) {
//       console.error("❌ Send failed:", err);
//       toast.error("Failed to send message.");
//     }
//   };

//   useEffect(() => {
//     if (!connection) return;
//     const handler = incoming => {
//       // ✅ Play sound only if it's from another contact
//       if (incoming.contactId !== selectedContactId && playSound) {
//         const audio = new Audio("/sounds/inbox_notify.mp3");
//         audio.play();
//       }
//       if (incoming.contactId === selectedContactId) {
//         setMessages(prev =>
//           [...prev, incoming].sort(
//             (a, b) =>
//               new Date(a.sentAt || a.createdAt) -
//               new Date(b.sentAt || b.createdAt)
//           )
//         );
//       }
//     };
//     connection.on("ReceiveInboxMessage", handler);
//     return () => connection.off("ReceiveInboxMessage", handler);
//   }, [connection, selectedContactId, playSound]);

//   return (
//     <div className="h-screen flex flex-col overflow-hidden">
//       {/* 🔒 Top App Bar */}
//       <header className="h-12 bg-white border-b shadow-sm px-6 flex items-center justify-between shrink-0">
//         <div className="flex items-center gap-2 text-purple-600 font-semibold text-base">
//           📨 Inbox
//         </div>
//         <div className="flex items-center gap-4">
//           <button
//             onClick={toggleSound}
//             className={`text-xs flex items-center gap-1 px-2 py-1 rounded-full border shadow-sm hover:bg-purple-50 ${
//               playSound
//                 ? "bg-green-100 text-green-600 border-green-300"
//                 : "bg-gray-100 text-gray-500 border-gray-300"
//             }`}
//           >
//             <Bell size={14} /> {playSound ? "Sound ON" : "Sound OFF"}
//           </button>
//           <div className="text-sm text-gray-500">xByteChat</div>
//         </div>
//       </header>

//       {/* 💬 Main 3-column layout */}
//       <div className="flex flex-1 overflow-hidden">
//         {/* 📇 Left Sidebar */}
//         <div className="w-72 border-r bg-white overflow-y-auto">
//           <InboxSidebar onSelect={id => setSelectedContactId(id)} />
//         </div>

//         {/* 💬 Chat column */}
//         <div className="flex flex-col flex-1 bg-[#f0f0eb] overflow-hidden relative">
//           <button
//             className="absolute right-2 top-2 z-10 bg-white border shadow-sm rounded-full p-1 text-gray-500 hover:text-purple-600"
//             onClick={() => setShowRightPanel(!showRightPanel)}
//             title={showRightPanel ? "Hide contact info" : "Show contact info"}
//           >
//             {showRightPanel ? (
//               <ChevronRight size={16} />
//             ) : (
//               <ChevronLeft size={16} />
//             )}
//           </button>

//           {selectedContactId ? (
//             <>
//               <div className="shrink-0">
//                 <ChatHeader contact={contact} />
//               </div>
//               <div className="flex-1 overflow-y-auto">
//                 <ChatWindow messages={messages} currentUserId={currentUserId} />
//               </div>
//               <div className="shrink-0">
//                 <ChatInput
//                   value={newMessage}
//                   onChange={e => setNewMessage(e.target.value)}
//                   onSend={sendMessage}
//                   disabled={!isConnected}
//                 />
//               </div>
//             </>
//           ) : (
//             <div className="flex-1 flex items-center justify-center text-gray-400">
//               Please select a contact to start chatting.
//             </div>
//           )}
//         </div>

//         {/* 📇 Right Contact Info */}
//         {showRightPanel && selectedContactId && (
//           <div className="w-80 border-l bg-white overflow-y-auto">
//             <ContactSidebar contactId={selectedContactId} />
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// import React, { useEffect, useState } from "react";
// import useSignalR from "../../hooks/useSignalR";
// import InboxSidebar from "./components/InboxSidebar";
// import ChatWindow from "./components/ChatWindow";
// import ChatInput from "./components/ChatInput";
// import ContactSidebar from "./components/ContactSidebar";
// import ChatHeader from "./components/ChatHeader";
// import axiosClient from "../../api/axiosClient";
// import { toast } from "react-toastify";
// import { ChevronLeft, ChevronRight } from "lucide-react";

// export default function InboxWrapper() {
//   const { connection, isConnected } = useSignalR();
//   const [messages, setMessages] = useState([]);
//   const [selectedContactId, setSelectedContactId] = useState(null);
//   const [newMessage, setNewMessage] = useState("");
//   const [contact, setContact] = useState(null);
//   const [showRightPanel, setShowRightPanel] = useState(true);

//   const currentUserId = localStorage.getItem("userId");

//   useEffect(() => {
//     if (!selectedContactId) {
//       setContact(null);
//       return;
//     }
//     axiosClient.get(`/contacts/${selectedContactId}`).then(res => {
//       setContact(res.data);
//     });
//   }, [selectedContactId]);

//   useEffect(() => {
//     if (!selectedContactId) return;
//     axiosClient
//       .get(`/inbox/messages?contactId=${selectedContactId}`)
//       .then(res => setMessages(res.data))
//       .catch(err => {
//         console.error("❌ Failed to load messages:", err);
//         toast.error("Failed to load messages.");
//       });
//   }, [selectedContactId]);

//   const sendMessage = async () => {
//     if (!selectedContactId)
//       return toast.error("❗ Please select a contact first.");
//     if (!newMessage.trim()) return toast.warn("⚠️ Please type a message.");
//     if (!connection || !isConnected)
//       return toast.error("❌ SignalR not connected.");

//     try {
//       await connection.invoke("SendMessageToContact", {
//         contactId: selectedContactId,
//         message: newMessage,
//       });
//       setNewMessage("");
//     } catch (err) {
//       console.error("❌ Send failed:", err);
//       toast.error("Failed to send message.");
//     }
//   };

//   useEffect(() => {
//     if (!connection) return;
//     const handler = incoming => {
//       if (incoming.contactId === selectedContactId) {
//         setMessages(prev =>
//           [...prev, incoming].sort(
//             (a, b) =>
//               new Date(a.sentAt || a.createdAt) -
//               new Date(b.sentAt || b.createdAt)
//           )
//         );
//       }
//     };
//     connection.on("ReceiveInboxMessage", handler);
//     return () => connection.off("ReceiveInboxMessage", handler);
//   }, [connection, selectedContactId]);

//   return (
//     <div className="h-screen flex flex-col overflow-hidden">
//       {/* 🔒 Top App Bar */}
//       <header className="h-12 bg-white border-b shadow-sm px-6 flex items-center justify-between shrink-0">
//         <div className="flex items-center gap-2 text-purple-600 font-semibold text-base">
//           📨 Inbox
//         </div>
//         <div className="text-sm text-gray-500">xByteChat</div>
//       </header>

//       {/* 💬 Main 3-column layout */}
//       <div className="flex flex-1 overflow-hidden">
//         {/* 📇 Left Sidebar */}
//         <div className="w-72 border-r bg-white overflow-y-auto">
//           <InboxSidebar onSelect={id => setSelectedContactId(id)} />
//         </div>

//         {/* 💬 Chat column */}
//         <div className="flex flex-col flex-1 bg-[#f0f0eb] overflow-hidden relative">
//           {/* ↔️ Toggle Right Panel */}
//           <button
//             className="absolute right-2 top-2 z-10 bg-white border shadow-sm rounded-full p-1 text-gray-500 hover:text-purple-600"
//             onClick={() => setShowRightPanel(!showRightPanel)}
//             title={showRightPanel ? "Hide contact info" : "Show contact info"}
//           >
//             {showRightPanel ? (
//               <ChevronRight size={16} />
//             ) : (
//               <ChevronLeft size={16} />
//             )}
//           </button>

//           {selectedContactId ? (
//             <>
//               {/* 🧑 Contact Header */}
//               <div className="shrink-0">
//                 <ChatHeader contact={contact} />
//               </div>

//               {/* 📜 Message Scroll Area */}
//               <div className="flex-1 overflow-y-auto">
//                 <ChatWindow messages={messages} currentUserId={currentUserId} />
//               </div>

//               {/* ✏️ Chat Input (Fixed at bottom) */}
//               <div className="shrink-0">
//                 <ChatInput
//                   value={newMessage}
//                   onChange={e => setNewMessage(e.target.value)}
//                   onSend={sendMessage}
//                   disabled={!isConnected}
//                 />
//               </div>
//             </>
//           ) : (
//             <div className="flex-1 flex items-center justify-center text-gray-400">
//               Please select a contact to start chatting.
//             </div>
//           )}
//         </div>

//         {/* 📇 Right Contact Info */}
//         {showRightPanel && selectedContactId && (
//           <div className="w-80 border-l bg-white overflow-y-auto">
//             <ContactSidebar contactId={selectedContactId} />
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// import React, { useEffect, useState } from "react";
// import useSignalR from "../../hooks/useSignalR";
// import InboxSidebar from "./components/InboxSidebar";
// import ChatWindow from "./components/ChatWindow";
// import ChatInput from "./components/ChatInput";
// import ContactSidebar from "./components/ContactSidebar";
// import ChatHeader from "./components/ChatHeader";
// import axiosClient from "../../api/axiosClient";
// import { toast } from "react-toastify";
// import { ChevronLeft, ChevronRight } from "lucide-react";
// import { Inbox } from "lucide-react"; // ✅ Add this at top
// export default function InboxWrapper() {
//   const { connection, isConnected } = useSignalR();
//   const [messages, setMessages] = useState([]);
//   const [selectedContactId, setSelectedContactId] = useState(null);
//   const [newMessage, setNewMessage] = useState("");
//   const [contact, setContact] = useState(null);
//   const [showRightPanel, setShowRightPanel] = useState(true);

//   const currentUserId = localStorage.getItem("userId");

//   useEffect(() => {
//     if (!selectedContactId) {
//       setContact(null);
//       return;
//     }
//     const loadContact = async () => {
//       try {
//         const res = await axiosClient.get(`/contacts/${selectedContactId}`);
//         setContact(res.data);
//       } catch (err) {
//         console.error("❌ Failed to load contact:", err);
//       }
//     };
//     loadContact();
//   }, [selectedContactId]);

//   useEffect(() => {
//     if (!selectedContactId) return;
//     const loadMessages = async () => {
//       try {
//         const res = await axiosClient.get(
//           `/inbox/messages?contactId=${selectedContactId}`
//         );
//         setMessages(res.data);
//       } catch (err) {
//         console.error("❌ Failed to load messages:", err);
//         toast.error("Failed to load messages.");
//       }
//     };
//     loadMessages();
//   }, [selectedContactId]);

//   const sendMessage = async () => {
//     if (!selectedContactId)
//       return toast.error("❗ Please select a contact first.");
//     if (!newMessage.trim()) return toast.warn("⚠️ Please type a message.");
//     if (!connection || !isConnected)
//       return toast.error("❌ SignalR not connected.");

//     const payload = {
//       contactId: selectedContactId,
//       message: newMessage,
//     };

//     try {
//       await connection.invoke("SendMessageToContact", payload);
//       setNewMessage("");
//     } catch (err) {
//       console.error("❌ Send failed:", err);
//       toast.error("Failed to send message.");
//     }
//   };

//   useEffect(() => {
//     if (!connection) return;
//     const handler = incoming => {
//       if (incoming.contactId === selectedContactId) {
//         setMessages(prev =>
//           [...prev, incoming].sort(
//             (a, b) =>
//               new Date(a.sentAt || a.createdAt) -
//               new Date(b.sentAt || b.createdAt)
//           )
//         );
//       }
//     };
//     connection.on("ReceiveInboxMessage", handler);
//     return () => connection.off("ReceiveInboxMessage", handler);
//   }, [connection, selectedContactId]);

//   return (
//     <div className="flex flex-col h-screen bg-white">
//       {/* 🟣 Top App Bar */}
//       <header className="h-12 bg-white border-b shadow-sm px-6 flex items-center justify-between">
//         <div className="flex items-center gap-2 text-purple-600 font-semibold text-base">
//           <Inbox size={18} className="text-purple-600" />
//           Inbox
//         </div>
//         <div className="text-sm text-gray-500">xByteChat</div>
//       </header>

//       {/* 💬 Main Body Layout */}
//       <div className="flex flex-1 overflow-hidden">
//         {/* Sidebar */}
//         <div className="w-72 border-r bg-white overflow-y-auto">
//           <InboxSidebar onSelect={id => setSelectedContactId(id)} />
//         </div>

//         {/* Chat Column */}
//         <div className="flex flex-col flex-1 bg-[#f0f0eb] relative">
//           {/* Toggle Right Panel Button */}
//           <button
//             className="absolute right-2 top-2 z-10 bg-white border shadow-sm rounded-full p-1 text-gray-500 hover:text-purple-600"
//             onClick={() => setShowRightPanel(!showRightPanel)}
//             title={showRightPanel ? "Hide contact info" : "Show contact info"}
//           >
//             {showRightPanel ? (
//               <ChevronRight size={16} />
//             ) : (
//               <ChevronLeft size={16} />
//             )}
//           </button>

//           {selectedContactId ? (
//             <>
//               {/* Chat Header (Not Sticky) */}
//               <div className="shrink-0">
//                 <ChatHeader contact={contact} />
//               </div>

//               {/* Scrollable Chat Window */}
//               <div className="flex-1 overflow-y-auto">
//                 <ChatWindow
//                   messages={messages}
//                   currentUserId={currentUserId}
//                   contact={contact}
//                 />
//               </div>

//               {/* Input */}
//               <ChatInput
//                 value={newMessage}
//                 onChange={e => setNewMessage(e.target.value)}
//                 onSend={sendMessage}
//                 disabled={!isConnected}
//               />
//             </>
//           ) : (
//             <div className="flex-1 flex items-center justify-center text-gray-400">
//               Please select a contact to start chatting.
//             </div>
//           )}
//         </div>

//         {/* Right Panel */}
//         {showRightPanel && selectedContactId && (
//           <div className="w-80 border-l bg-white overflow-y-auto">
//             <ContactSidebar contactId={selectedContactId} />
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }
