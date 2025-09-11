import React, { createContext, useContext, useState, useEffect } from "react";
import useSignalR from "../../hooks/useSignalR";
import axiosClient from "../../api/axiosClient";
import { toast } from "react-toastify";

const InboxContext = createContext();

export const useInbox = () => useContext(InboxContext);

export const InboxProvider = ({ children }) => {
  // All state is managed here
  const { connection, isConnected } = useSignalR();
  const [messages, setMessages] = useState([]);
  const [selectedContactId, setSelectedContactId] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [contact, setContact] = useState(null);
  const [playSound, setPlaySound] = useState(
    localStorage.getItem("playSound") === "true"
  );
  const [userHasInteracted, setUserHasInteracted] = useState(false);

  const currentUserId = localStorage.getItem("userId");

  // Track user interaction for sound autoplay
  useEffect(() => {
    const handleUserInteraction = () => setUserHasInteracted(true);
    window.addEventListener("click", handleUserInteraction);
    window.addEventListener("keydown", handleUserInteraction);
    return () => {
      window.removeEventListener("click", handleUserInteraction);
      window.removeEventListener("keydown", handleUserInteraction);
    };
  }, []);

  // Fetch contact details when a contact is selected
  useEffect(() => {
    if (!selectedContactId) {
      setContact(null);
      return;
    }
    axiosClient.get(`/contacts/${selectedContactId}`).then(res => {
      setContact(res.data);
    });
  }, [selectedContactId]);

  // Load message history with robust clearing logic
  useEffect(() => {
    if (!selectedContactId) {
      setMessages([]);
      return;
    }
    setMessages([]); // Instantly clear old messages for better UX
    axiosClient
      .get(`/inbox/messages?contactId=${selectedContactId}`)
      .then(res => {
        const normalized = (res.data || []).map(m => ({
          ...m,
          messageContent: m.messageContent ?? m.message, // ✅ normalize
        }));
        setMessages(normalized);
      })
      .catch(err => {
        console.error("❌ Failed to load messages:", err);
        toast.error("Failed to load messages.");
      });
  }, [selectedContactId]);

  // SignalR listener for incoming messages
  useEffect(() => {
    if (!connection) return;

    const handler = incoming => {
      const normalized = {
        ...incoming,
        messageContent: incoming.messageContent ?? incoming.message, // ✅ normalize
      };

      if (
        normalized.contactId !== selectedContactId &&
        playSound &&
        userHasInteracted
      ) {
        new Audio("/sounds/inbox_notify.mp3").play().catch(() => {});
      }

      if (normalized.contactId === selectedContactId) {
        setMessages(prev => {
          if (!normalized.isIncoming) {
            // This is our own message coming back from the server; replace the temp one
            return prev.map(m => (m.status === "Sending" ? normalized : m));
          }
          // This is a new message from the contact; add it to the end
          return [...prev, normalized];
        });
      }
    };

    connection.on("ReceiveInboxMessage", handler);
    return () => connection.off("ReceiveInboxMessage", handler);
  }, [connection, selectedContactId, playSound, userHasInteracted]);

  // Function to toggle notification sound
  const toggleSound = async () => {
    const newVal = !playSound;
    if (newVal) {
      try {
        await new Audio("/sounds/inbox_notify.mp3").play();
        setPlaySound(true);
        localStorage.setItem("playSound", "true");
      } catch (err) {
        toast.error("🔇 Browser blocked sound. Please enable autoplay.");
        setPlaySound(false);
        localStorage.setItem("playSound", "false");
      }
    } else {
      setPlaySound(false);
      localStorage.setItem("playSound", "false");
    }
  };

  // Function to send a message with optimistic UI
  const sendMessage = async () => {
    if (!selectedContactId || !newMessage.trim() || !isConnected) return;

    const tempId = `temp_${Date.now()}`;
    const optimisticMessage = {
      id: tempId,
      contactId: selectedContactId,
      messageContent: newMessage, // ✅ consistent
      isIncoming: false,
      sentAt: new Date().toISOString(),
      status: "Sending",
    };

    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage("");

    try {
      await connection.invoke("SendMessageToContact", {
        contactId: selectedContactId,
        message: newMessage, // backend DTO expects "message"
      });
    } catch (err) {
      console.error("❌ Send failed:", err);
      toast.error("Failed to send message.");
      setMessages(prev =>
        prev.map(m => (m.id === tempId ? { ...m, status: "Failed" } : m))
      );
    }
  };

  // The value provided to all consumer components
  const value = {
    connection,
    isConnected,
    messages,
    selectedContactId,
    setSelectedContactId,
    newMessage,
    setNewMessage,
    contact,
    playSound,
    toggleSound,
    sendMessage,
    currentUserId,
  };

  return (
    <InboxContext.Provider value={value}>{children}</InboxContext.Provider>
  );
};

// import React, { createContext, useContext, useState, useEffect } from "react";
// import useSignalR from "../../hooks/useSignalR";
// import axiosClient from "../../api/axiosClient";
// import { toast } from "react-toastify";

// const InboxContext = createContext();

// export const useInbox = () => useContext(InboxContext);

// export const InboxProvider = ({ children }) => {
//   // All state is managed here
//   const { connection, isConnected } = useSignalR();
//   const [messages, setMessages] = useState([]);
//   const [selectedContactId, setSelectedContactId] = useState(null);
//   const [newMessage, setNewMessage] = useState("");
//   const [contact, setContact] = useState(null);
//   const [playSound, setPlaySound] = useState(
//     localStorage.getItem("playSound") === "true"
//   );
//   const [userHasInteracted, setUserHasInteracted] = useState(false);

//   const currentUserId = localStorage.getItem("userId");

//   // Track user interaction for sound autoplay
//   useEffect(() => {
//     const handleUserInteraction = () => setUserHasInteracted(true);
//     window.addEventListener("click", handleUserInteraction);
//     window.addEventListener("keydown", handleUserInteraction);
//     return () => {
//       window.removeEventListener("click", handleUserInteraction);
//       window.removeEventListener("keydown", handleUserInteraction);
//     };
//   }, []);

//   // Fetch contact details when a contact is selected
//   useEffect(() => {
//     if (!selectedContactId) {
//       setContact(null);
//       return;
//     }
//     axiosClient.get(`/contacts/${selectedContactId}`).then(res => {
//       setContact(res.data);
//     });
//   }, [selectedContactId]);

//   // Load message history with robust clearing logic
//   useEffect(() => {
//     if (!selectedContactId) {
//       setMessages([]);
//       return;
//     }
//     setMessages([]); // Instantly clear old messages for better UX
//     axiosClient
//       .get(`/inbox/messages?contactId=${selectedContactId}`)
//       .then(res => setMessages(res.data))
//       .catch(err => {
//         console.error("❌ Failed to load messages:", err);
//         toast.error("Failed to load messages.");
//       });
//   }, [selectedContactId]);

//   // SignalR listener for incoming messages
//   useEffect(() => {
//     if (!connection) return;
//     const handler = incoming => {
//       if (
//         incoming.contactId !== selectedContactId &&
//         playSound &&
//         userHasInteracted
//       ) {
//         new Audio("/sounds/inbox_notify.mp3").play().catch(() => {});
//       }

//       if (incoming.contactId === selectedContactId) {
//         setMessages(prev => {
//           if (!incoming.isIncoming) {
//             // This is our own message coming back from the server; replace the temp one
//             return prev.map(m => (m.status === "Sending" ? incoming : m));
//           }
//           // This is a new message from the contact; add it to the end
//           return [...prev, incoming];
//         });
//       }
//     };

//     connection.on("ReceiveInboxMessage", handler);
//     return () => connection.off("ReceiveInboxMessage", handler);
//   }, [connection, selectedContactId, playSound, userHasInteracted]);

//   // Function to toggle notification sound
//   const toggleSound = async () => {
//     const newVal = !playSound;
//     if (newVal) {
//       try {
//         await new Audio("/sounds/inbox_notify.mp3").play();
//         setPlaySound(true);
//         localStorage.setItem("playSound", "true");
//       } catch (err) {
//         toast.error("🔇 Browser blocked sound. Please enable autoplay.");
//         setPlaySound(false);
//         localStorage.setItem("playSound", "false");
//       }
//     } else {
//       setPlaySound(false);
//       localStorage.setItem("playSound", "false");
//     }
//   };

//   // Function to send a message with optimistic UI
//   const sendMessage = async () => {
//     if (!selectedContactId || !newMessage.trim() || !isConnected) return;

//     const tempId = `temp_${Date.now()}`;
//     const optimisticMessage = {
//       id: tempId,
//       contactId: selectedContactId,
//       messageContent: newMessage,
//       isIncoming: false,
//       sentAt: new Date().toISOString(),
//       status: "Sending",
//     };

//     setMessages(prev => [...prev, optimisticMessage]);
//     setNewMessage("");

//     try {
//       await connection.invoke("SendMessageToContact", {
//         contactId: selectedContactId,
//         message: newMessage,
//       });
//     } catch (err) {
//       console.error("❌ Send failed:", err);
//       toast.error("Failed to send message.");
//       setMessages(prev =>
//         prev.map(m => (m.id === tempId ? { ...m, status: "Failed" } : m))
//       );
//     }
//   };

//   // The value provided to all consumer components
//   const value = {
//     connection,
//     isConnected,
//     messages,
//     selectedContactId,
//     setSelectedContactId,
//     newMessage,
//     setNewMessage,
//     contact,
//     playSound,
//     toggleSound,
//     sendMessage,
//     currentUserId,
//   };

//   return (
//     <InboxContext.Provider value={value}>{children}</InboxContext.Provider>
//   );
// };
