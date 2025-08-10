import React, { useEffect, useState } from "react";
import axios from "axios";
// import Spinner from "../../components/common/Spinner";
import { toast } from "react-toastify";

function StatusTable() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const businessId = localStorage.getItem("businessId");

  useEffect(() => {
    if (!businessId) {
      toast.error("Business ID not found!");
      return;
    }

    axios
      .get(`/api/message-status?businessId=${businessId}`)
      .then(res => {
        setLogs(res.data);
        setLoading(false);
      })
      .catch(err => {
        toast.error("❌ Failed to fetch status logs");
        setLoading(false);
      });
  }, [businessId]);

  const getStatusPill = status => {
    switch (status?.toLowerCase()) {
      case "sent":
        return (
          <span className="px-2 py-1 text-yellow-800 bg-yellow-100 rounded-full text-xs">
            Sent
          </span>
        );
      case "delivered":
        return (
          <span className="px-2 py-1 text-green-800 bg-green-100 rounded-full text-xs">
            Delivered
          </span>
        );
      case "read":
        return (
          <span className="px-2 py-1 text-blue-800 bg-blue-100 rounded-full text-xs">
            Read
          </span>
        );
      case "failed":
        return (
          <span className="px-2 py-1 text-red-800 bg-red-100 rounded-full text-xs">
            Failed
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-gray-800 bg-gray-100 rounded-full text-xs">
            Unknown
          </span>
        );
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">📬 Message Delivery Status</h2>
      <div className="overflow-x-auto rounded shadow bg-white">
        <table className="min-w-full text-sm table-auto">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3">WAMID</th>
              <th className="p-3">Recipient</th>
              <th className="p-3">Status</th>
              <th className="p-3">Sent</th>
              <th className="p-3">Delivered</th>
              <th className="p-3">Read</th>
              <th className="p-3">Error</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-purple-600">
                  Loading message statuses...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-gray-400">
                  No status logs found.
                </td>
              </tr>
            ) : (
              logs.map(log => (
                <tr key={log.messageId} className="border-b">
                  <td className="p-3 font-mono text-xs">{log.messageId}</td>
                  <td className="p-3">{log.recipientNumber}</td>
                  <td className="p-3">{getStatusPill(log.status)}</td>
                  <td className="p-3">{log.sentAt || "-"}</td>
                  <td className="p-3">{log.deliveredAt || "-"}</td>
                  <td className="p-3">{log.readAt || "-"}</td>
                  <td className="p-3 text-red-600 text-xs">
                    {log.errorMessage || "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default StatusTable;

// import React, { useEffect, useState } from "react";
// import axios from "axios";
// // import Spinner from "../../components/common/Spinner";

// import { toast } from "react-toastify";

// function StatusTable() {
//   const [logs, setLogs] = useState([]);
//   const [loading, setLoading] = useState(true);

//   const businessId = localStorage.getItem("businessId");

//   useEffect(() => {
//     if (!businessId) {
//       toast.error("Business ID not found!");
//       return;
//     }

//     axios
//       .get(`/api/message-status?businessId=${businessId}`)
//       .then(res => {
//         setLogs(res.data);
//         setLoading(false);
//       })
//       .catch(err => {
//         toast.error("❌ Failed to fetch status logs");
//         setLoading(false);
//       });
//   }, [businessId]);

//   const getStatusPill = status => {
//     switch (status?.toLowerCase()) {
//       case "sent":
//         return (
//           <span className="px-2 py-1 text-yellow-800 bg-yellow-100 rounded-full text-xs">
//             Sent
//           </span>
//         );
//       case "delivered":
//         return (
//           <span className="px-2 py-1 text-green-800 bg-green-100 rounded-full text-xs">
//             Delivered
//           </span>
//         );
//       case "read":
//         return (
//           <span className="px-2 py-1 text-blue-800 bg-blue-100 rounded-full text-xs">
//             Read
//           </span>
//         );
//       case "failed":
//         return (
//           <span className="px-2 py-1 text-red-800 bg-red-100 rounded-full text-xs">
//             Failed
//           </span>
//         );
//       default:
//         return (
//           <span className="px-2 py-1 text-gray-800 bg-gray-100 rounded-full text-xs">
//             Unknown
//           </span>
//         );
//     }
//   };

//   // if (loading) return <Spinner text="Loading message statuses..." />;

//   return (
//     <div className="p-6">
//       <h2 className="text-xl font-semibold mb-4">📬 Message Delivery Status</h2>
//       <div className="overflow-x-auto rounded shadow bg-white">
//         <table className="min-w-full text-sm table-auto">
//           <thead className="bg-gray-100 text-left">
//             <tr>
//               <th className="p-3">WAMID</th>
//               <th className="p-3">Recipient</th>
//               <th className="p-3">Status</th>
//               <th className="p-3">Sent</th>
//               <th className="p-3">Delivered</th>
//               <th className="p-3">Read</th>
//               <th className="p-3">Error</th>
//             </tr>
//           </thead>
//           <tbody>
//             {logs.map(log => (
//               <tr key={log.messageId} className="border-b">
//                 <td className="p-3 font-mono text-xs">{log.messageId}</td>
//                 <td className="p-3">{log.recipientNumber}</td>
//                 <td className="p-3">{getStatusPill(log.status)}</td>
//                 <td className="p-3">{log.sentAt || "-"}</td>
//                 <td className="p-3">{log.deliveredAt || "-"}</td>
//                 <td className="p-3">{log.readAt || "-"}</td>
//                 <td className="p-3 text-red-600 text-xs">
//                   {log.errorMessage || "-"}
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }

// export default StatusTable;
