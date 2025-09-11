import { useEffect, useState } from "react";
import * as signalR from "@microsoft/signalr";
import { toast } from "react-toastify";

export default function useSignalR({
  onMessageReceived,
  onUnreadChanged,
} = {}) {
  const [connection, setConnection] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const hubUrl = "http://localhost:7113/hubs/inbox";

    // 1. Read the token from localStorage using the correct key.
    const token = localStorage.getItem("xbyte_token");

    // 2. Do not attempt to connect if the user is not logged in.
    if (!token) {
      console.error("SignalR connection skipped: No auth token found.");
      return;
    }

    // 3. Build the connection, appending the token to the URL as a query string.
    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${hubUrl}?access_token=${token}`)
      .withAutomaticReconnect()
      .build();

    // 4. Start the connection and handle the outcome.
    newConnection
      .start()
      .then(() => {
        console.log("✅ SignalR connected to /hubs/inbox");
        setConnection(newConnection);
        setIsConnected(true);

        // Register event listeners passed in as props
        if (onMessageReceived) {
          newConnection.on("ReceiveInboxMessage", onMessageReceived);
        }
        if (onUnreadChanged) {
          newConnection.on("UnreadCountChanged", onUnreadChanged);
        }
      })
      .catch(err => {
        console.error("❌ SignalR connection failed:", err);
        if (err.toString().includes("401")) {
          toast.error(
            "SignalR connection unauthorized. Your session may have expired."
          );
        } else {
          toast.error("Real-time connection failed.");
        }
      });

    // 5. Clean up the connection when the component unmounts.
    return () => {
      if (newConnection) {
        newConnection.stop();
      }
    };
  }, [onMessageReceived, onUnreadChanged]); // Dependencies for re-binding callbacks if they change

  return { connection, isConnected };
}
// // src/hooks/useSignalR.js
// import { useEffect, useRef, useState } from "react";
// import * as signalR from "@microsoft/signalr";
// import { TOKEN_KEY } from "../api/axiosClient";

// export default function useSignalR() {
//   const connectionRef = useRef(null);
//   const [connected, setConnected] = useState(false);

//   useEffect(() => {
//     const token = localStorage.getItem(TOKEN_KEY); // <-- unified
//     if (!token) return;

//     const apiBase = (process.env.REACT_APP_API_BASE_URL || "").replace(
//       /\/+$/,
//       ""
//     );
//     // If your API base ends with /api, drop it for the hub origin
//     const hubBase = apiBase.replace(/\/api$/, "");
//     const hubUrl = `${hubBase || ""}/hubs/inbox`;

//     const conn = new signalR.HubConnectionBuilder()
//       .withUrl(hubUrl, {
//         accessTokenFactory: () => token,
//         withCredentials: false, // <-- crucial for CORS preflight to pass
//       })
//       .withAutomaticReconnect()
//       .build();

//     connectionRef.current = conn;

//     conn
//       .start()
//       .then(() => setConnected(true))
//       .catch(err => {
//         console.error("SignalR start failed:", err);
//         setConnected(false);
//       });

//     return () => {
//       if (connectionRef.current) {
//         connectionRef.current.stop().catch(() => {});
//       }
//     };
//   }, []);

//   return { connected, connection: connectionRef.current };
// }

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
//   }, [onMessageReceived, onUnreadChanged]); // ✅ Added as dependencies

//   return { connection, isConnected };
// }

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
