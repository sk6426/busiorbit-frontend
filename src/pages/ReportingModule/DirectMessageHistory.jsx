import React, { useEffect, useState, useCallback } from "react";
import axiosClient from "../../api/axiosClient";
import { toast } from "react-toastify";
import { Loader2 } from "lucide-react";

export default function DirectMessageHistory() {
  const [messageLogs, setMessageLogs] = useState([]);
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);

  // 🟢 Wrap fetchLogs in useCallback to avoid ESLint dependency warning
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get("/reporting/messages/history", {
        params: {
          page,
          pageSize,
          status: statusFilter === "All" ? null : statusFilter,
          search: searchQuery || null,
        },
      });

      const newLogs = res.data?.data?.items || [];
      const total = res.data?.data?.totalCount || 0;

      if (page === 1) {
        setMessageLogs(newLogs);
      } else {
        setMessageLogs(prev => [...prev, ...newLogs]);
      }

      setHasMore(page * pageSize < total);
    } catch (err) {
      console.error("Failed to load logs", err);
      toast.error("⚠️ Error fetching message history");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusFilter, searchQuery]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]); // Only re-run when fetchLogs identity changes

  const handleStatusChange = e => {
    setStatusFilter(e.target.value);
    setPage(1);
  };

  const handleSearch = e => {
    e.preventDefault();
    setPage(1);
    // 🔵 Also search with updated value
    fetchLogs();
  };

  const handleShowMore = () => {
    if (hasMore) {
      setPage(prev => prev + 1);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-bold text-purple-700">📜 Message History</h2>

      {/* 🔍 Filters */}
      <form
        onSubmit={handleSearch}
        className="flex flex-wrap gap-4 items-end bg-white p-4 rounded-xl shadow"
      >
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700">Status</label>
          <select
            value={statusFilter}
            onChange={handleStatusChange}
            className="border rounded-lg px-3 py-2"
          >
            <option>All</option>
            <option>Success</option>
            <option>Failed</option>
          </select>
        </div>

        <div className="flex flex-col flex-1">
          <label className="text-sm font-medium text-gray-700">Search</label>
          <input
            type="text"
            placeholder="Search by number or name"
            className="border rounded-lg px-3 py-2 w-full"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          🔍 Search
        </button>
      </form>

      {/* 📊 Table */}
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-sm text-left border">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="px-3 py-2">Recipient</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Sent At</th>
              <th className="px-3 py-2">Message</th>
            </tr>
          </thead>
          <tbody>
            {loading && page === 1 ? (
              <tr>
                <td colSpan="4" className="text-center py-6">
                  <Loader2 className="animate-spin inline w-6 h-6 text-purple-600" />
                </td>
              </tr>
            ) : messageLogs.length > 0 ? (
              messageLogs.map(log => (
                <tr key={log.id} className="border-b">
                  <td className="px-3 py-2">{log.recipientNumber}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        log.status === "Success"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    {log.sentAt ? new Date(log.sentAt).toLocaleString() : "—"}
                  </td>
                  <td
                    className="px-3 py-2 max-w-[300px] truncate"
                    title={log.messageContent}
                  >
                    {log.messageContent || "(empty)"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="text-center text-gray-500 py-6">
                  No messages found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 🔽 Show More */}
      {hasMore && !loading && (
        <div className="text-center mt-4">
          <button
            onClick={handleShowMore}
            className="px-6 py-2 text-sm font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Show More
          </button>
        </div>
      )}

      {hasMore && loading && page > 1 && (
        <div className="text-center mt-4 text-purple-600">
          <Loader2 className="animate-spin inline w-5 h-5 mr-2" />
          Loading more...
        </div>
      )}
    </div>
  );
}

// import React, { useEffect, useState } from "react";
// import axiosClient from "../../api/axiosClient";
// import { toast } from "react-toastify";
// import { Loader2 } from "lucide-react";

// export default function DirectMessageHistory() {
//   const [messageLogs, setMessageLogs] = useState([]);
//   const [statusFilter, setStatusFilter] = useState("All");
//   const [searchQuery, setSearchQuery] = useState("");
//   const [page, setPage] = useState(1);
//   const [pageSize] = useState(10);
//   const [hasMore, setHasMore] = useState(false);
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     fetchLogs();
//   }, [page, statusFilter]);

//   const fetchLogs = async () => {
//     setLoading(true);
//     try {
//       const res = await axiosClient.get("/reporting/messages/history", {
//         params: {
//           page,
//           pageSize,
//           status: statusFilter === "All" ? null : statusFilter,
//           search: searchQuery || null,
//         },
//       });

//       const newLogs = res.data?.data?.items || [];
//       const total = res.data?.data?.totalCount || 0;

//       if (page === 1) {
//         setMessageLogs(newLogs);
//       } else {
//         setMessageLogs(prev => [...prev, ...newLogs]);
//       }

//       setHasMore(page * pageSize < total);
//     } catch (err) {
//       console.error("Failed to load logs", err);
//       toast.error("⚠️ Error fetching message history");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleStatusChange = e => {
//     setStatusFilter(e.target.value);
//     setPage(1);
//   };

//   const handleSearch = e => {
//     e.preventDefault();
//     setPage(1);
//     fetchLogs();
//   };

//   const handleShowMore = () => {
//     if (hasMore) {
//       setPage(prev => prev + 1);
//     }
//   };

//   return (
//     <div className="max-w-6xl mx-auto p-6 space-y-6">
//       <h2 className="text-2xl font-bold text-purple-700">📜 Message History</h2>

//       {/* 🔍 Filters */}
//       <form
//         onSubmit={handleSearch}
//         className="flex flex-wrap gap-4 items-end bg-white p-4 rounded-xl shadow"
//       >
//         <div className="flex flex-col">
//           <label className="text-sm font-medium text-gray-700">Status</label>
//           <select
//             value={statusFilter}
//             onChange={handleStatusChange}
//             className="border rounded-lg px-3 py-2"
//           >
//             <option>All</option>
//             <option>Success</option>
//             <option>Failed</option>
//           </select>
//         </div>

//         <div className="flex flex-col flex-1">
//           <label className="text-sm font-medium text-gray-700">Search</label>
//           <input
//             type="text"
//             placeholder="Search by number or name"
//             className="border rounded-lg px-3 py-2 w-full"
//             value={searchQuery}
//             onChange={e => setSearchQuery(e.target.value)}
//           />
//         </div>

//         <button
//           type="submit"
//           className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
//         >
//           🔍 Search
//         </button>
//       </form>

//       {/* 📊 Table */}
//       <div className="bg-white rounded-xl shadow overflow-x-auto">
//         <table className="w-full text-sm text-left border">
//           <thead className="bg-gray-100 text-gray-700">
//             <tr>
//               <th className="px-3 py-2">Recipient</th>
//               <th className="px-3 py-2">Status</th>
//               <th className="px-3 py-2">Sent At</th>
//               <th className="px-3 py-2">Message</th>
//             </tr>
//           </thead>
//           <tbody>
//             {loading && page === 1 ? (
//               <tr>
//                 <td colSpan="4" className="text-center py-6">
//                   <Loader2 className="animate-spin inline w-6 h-6 text-purple-600" />
//                 </td>
//               </tr>
//             ) : messageLogs.length > 0 ? (
//               messageLogs.map(log => (
//                 <tr key={log.id} className="border-b">
//                   <td className="px-3 py-2">{log.recipientNumber}</td>
//                   <td className="px-3 py-2">
//                     <span
//                       className={`px-2 py-1 rounded-full text-xs font-medium ${
//                         log.status === "Success"
//                           ? "bg-green-100 text-green-700"
//                           : "bg-red-100 text-red-600"
//                       }`}
//                     >
//                       {log.status}
//                     </span>
//                   </td>
//                   <td className="px-3 py-2">
//                     {log.sentAt ? new Date(log.sentAt).toLocaleString() : "—"}
//                   </td>
//                   <td
//                     className="px-3 py-2 max-w-[300px] truncate"
//                     title={log.messageContent}
//                   >
//                     {log.messageContent || "(empty)"}
//                   </td>
//                 </tr>
//               ))
//             ) : (
//               <tr>
//                 <td colSpan="4" className="text-center text-gray-500 py-6">
//                   No messages found.
//                 </td>
//               </tr>
//             )}
//           </tbody>
//         </table>
//       </div>

//       {/* 🔽 Show More */}
//       {hasMore && !loading && (
//         <div className="text-center mt-4">
//           <button
//             onClick={handleShowMore}
//             className="px-6 py-2 text-sm font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700"
//           >
//             Show More
//           </button>
//         </div>
//       )}

//       {hasMore && loading && page > 1 && (
//         <div className="text-center mt-4 text-purple-600">
//           <Loader2 className="animate-spin inline w-5 h-5 mr-2" />
//           Loading more...
//         </div>
//       )}
//     </div>
//   );
// }
