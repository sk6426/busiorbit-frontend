import { useEffect, useState } from "react";
import * as signalR from "@microsoft/signalr";
import { toast } from "react-toastify";

/**
 * ✅ SignalR hook to connect with backend's InboxHub.
 * Now supports multiple event handlers.
 *
 * @param {Object} callbacks
 * @param {Function} callbacks.onMessageReceived - fires on new message
 * @param {Function} callbacks.onUnreadChanged - fires on unread badge update
 */
export default function useSignalR({
  onMessageReceived,
  onUnreadChanged,
} = {}) {
  const [connection, setConnection] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const hubUrl = "http://localhost:7113/hubs/inbox";

    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, { withCredentials: true })
      .withAutomaticReconnect()
      .build();

    newConnection
      .start()
      .then(() => {
        console.log("✅ SignalR connected to /hubs/inbox");
        setConnection(newConnection);
        setIsConnected(true);

        // 📨 New message
        if (onMessageReceived) {
          newConnection.on("ReceiveInboxMessage", message => {
            console.log("📩 Message received:", message);
            onMessageReceived(message);
          });
        }

        // 🔔 Unread count changed
        if (onUnreadChanged) {
          newConnection.on("UnreadCountChanged", data => {
            console.log("🔔 Unread count changed:", data);
            onUnreadChanged(data);
          });
        }
      })
      .catch(err => {
        console.error("❌ SignalR connection failed:", err);
        toast.error("SignalR connection failed.");
      });

    return () => {
      newConnection.stop();
    };
  }, [onMessageReceived, onUnreadChanged]); // ✅ Added as dependencies

  return { connection, isConnected };
}

// import { useEffect, useState } from "react";
// import * as signalR from "@microsoft/signalr";
// import { toast } from "react-toastify";

// /**
//  * ✅ SignalR hook to connect with backend's InboxHub.
//  * Now supports multiple event handlers.
//  *
//  * @param {Object} callbacks
//  * @param {Function} callbacks.onMessageReceived - fires on new message
//  * @param {Function} callbacks.onUnreadChanged - fires on unread badge update
//  */
// export default function useSignalR({
//   onMessageReceived,
//   onUnreadChanged,
// } = {}) {
//   const [connection, setConnection] = useState(null);
//   const [isConnected, setIsConnected] = useState(false);

//   useEffect(() => {
//     const hubUrl = "http://localhost:7113/hubs/inbox";

//     const newConnection = new signalR.HubConnectionBuilder()
//       .withUrl(hubUrl, { withCredentials: true })
//       .withAutomaticReconnect()
//       .build();

//     newConnection
//       .start()
//       .then(() => {
//         console.log("✅ SignalR connected to /hubs/inbox");
//         setConnection(newConnection);
//         setIsConnected(true);

//         // 📨 New message
//         if (onMessageReceived) {
//           newConnection.on("ReceiveInboxMessage", message => {
//             console.log("📩 Message received:", message);
//             onMessageReceived(message);
//           });
//         }

//         // 🔔 Unread count changed
//         if (onUnreadChanged) {
//           newConnection.on("UnreadCountChanged", data => {
//             console.log("🔔 Unread count changed:", data);
//             onUnreadChanged(data);
//           });
//         }
//       })
//       .catch(err => {
//         console.error("❌ SignalR connection failed:", err);
//         toast.error("SignalR connection failed.");
//       });

//     return () => {
//       newConnection.stop();
//     };
//   }, []);

//   return { connection, isConnected };
// }
