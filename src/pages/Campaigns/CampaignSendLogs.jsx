import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import { toast } from "react-toastify";
import { saveAs } from "file-saver";
import { confirmAlert } from "react-confirm-alert";
import "react-confirm-alert/src/react-confirm-alert.css";
import MessagePreviewModal from "./components/MessagePreviewModal";
import CampaignSummaryBar from "./components/CampaignSummaryBar";
import ContactJourneyModal from "./components/ContactJourneyModal";

function CampaignSendLogs() {
  const { campaignId } = useParams();
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [channelFilter, setChannelFilter] = useState("");
  const [clickTypeFilter, setClickTypeFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [summary, setSummary] = useState(null);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [isJourneyOpen, setIsJourneyOpen] = useState(false);
  const [journeyLog, setJourneyLog] = useState(null);

  // 🟣 Wrap in useCallback, dependencies: [campaignId]
  const fetchLogs = useCallback(async () => {
    try {
      const res = await axiosClient.get(
        `/campaign-logs/campaign/${campaignId}`
      );
      setLogs(res.data || []);
      setFilteredLogs(res.data || []);
    } catch {
      toast.error("❌ Failed to load send logs");
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await axiosClient.get(
        `/campaign-logs/campaign/${campaignId}/summary`
      );
      setSummary(res.data);
    } catch {
      console.error("❌ Failed to fetch summary");
    }
  }, [campaignId]);

  useEffect(() => {
    fetchLogs();
    fetchSummary();
    // Add both functions as dependencies!
  }, [fetchLogs, fetchSummary]);

  useEffect(() => {
    let result = logs;
    if (statusFilter)
      result = result.filter(log => log.sendStatus === statusFilter);
    if (channelFilter)
      result = result.filter(log => log.sourceChannel === channelFilter);
    if (clickTypeFilter)
      result = result.filter(log => log.clickType === clickTypeFilter);
    if (search.trim()) {
      const keyword = search.toLowerCase();
      result = result.filter(
        log =>
          log.contactName?.toLowerCase().includes(keyword) ||
          log.contactPhone?.includes(keyword)
      );
    }
    setFilteredLogs(result);
    setPage(1);
  }, [statusFilter, channelFilter, clickTypeFilter, search, logs]);

  const handleExport = () => {
    const headers = [
      "Contact Name",
      "Phone",
      "Status",
      "Channel",
      "Sent At",
      "Delivered",
      "Read",
      "Clicked",
      "Click Type",
    ];
    const csvRows = [
      headers,
      ...filteredLogs.map(log => [
        log.contactName,
        log.contactPhone,
        log.sendStatus,
        log.sourceChannel,
        log.sentAt ? new Date(log.sentAt).toLocaleString() : "-",
        log.deliveredAt ? new Date(log.deliveredAt).toLocaleString() : "-",
        log.readAt ? new Date(log.readAt).toLocaleString() : "-",
        log.isClicked ? "Yes" : "No",
        log.clickType || "-",
      ]),
    ];
    const blob = new Blob([csvRows.map(r => r.join(",")).join("\n")], {
      type: "text/csv",
    });
    saveAs(blob, `CampaignLogs-${campaignId}.csv`);
  };

  const handleRetrySingle = logId => {
    confirmAlert({
      title: "Retry This Message?",
      message: "Are you sure you want to retry this failed message?",
      buttons: [
        {
          label: "Yes",
          onClick: async () => {
            try {
              await axiosClient.post(`/campaign-logs/${logId}/retry`);
              toast.success("✅ Retry triggered");
              fetchLogs();
              fetchSummary();
            } catch {
              toast.error("❌ Retry failed");
            }
          },
        },
        { label: "Cancel" },
      ],
    });
  };

  const handleRetryAll = () => {
    confirmAlert({
      title: "Retry All Failed Messages?",
      message:
        "This will retry all failed messages in this campaign. Continue?",
      buttons: [
        {
          label: "Yes",
          onClick: async () => {
            try {
              const res = await axiosClient.post(
                `/campaign-logs/campaign/${campaignId}/retry-all`
              );
              toast.success(`✅ Retried ${res.data.retried} messages`);
              fetchLogs();
              fetchSummary();
            } catch {
              toast.error("❌ Retry failed");
            }
          },
        },
        { label: "Cancel" },
      ],
    });
  };

  const paginatedLogs = filteredLogs.slice(
    (page - 1) * pageSize,
    page * pageSize
  );
  const totalPages = Math.ceil(filteredLogs.length / pageSize);

  const openPreview = log => {
    setSelectedLog(log);
    setPreviewOpen(true);
  };

  const closePreview = () => {
    setPreviewOpen(false);
    setSelectedLog(null);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-purple-700">
          📨 Send Logs for Campaign
        </h1>
        <Link to="/app/campaigns" className="text-sm text-blue-600 underline">
          ← Back to Campaigns
        </Link>
      </div>

      <CampaignSummaryBar summary={summary} />

      <div className="grid md:grid-cols-4 gap-4 mb-4">
        <input
          className="border px-3 py-2 rounded"
          placeholder="🔍 Search by name or phone"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="border px-3 py-2 rounded"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="Sent">Sent</option>
          <option value="Queued">Queued</option>
          <option value="Failed">Failed</option>
        </select>
        <select
          className="border px-3 py-2 rounded"
          value={channelFilter}
          onChange={e => setChannelFilter(e.target.value)}
        >
          <option value="">All Channels</option>
          <option value="WhatsApp">WhatsApp</option>
          <option value="API">API</option>
          <option value="Manual">Manual</option>
        </select>
        <select
          className="border px-3 py-2 rounded"
          value={clickTypeFilter}
          onChange={e => setClickTypeFilter(e.target.value)}
        >
          <option value="">All Click Types</option>
          <option value="BuyNow">Buy Now</option>
          <option value="ViewDetails">View Details</option>
        </select>
      </div>

      <div className="mb-4 flex justify-between">
        <p className="text-sm text-gray-500">
          Showing {paginatedLogs.length} of {filteredLogs.length} logs
        </p>
        <div className="space-x-2">
          <button
            onClick={handleExport}
            className="bg-emerald-600 text-white text-sm px-3 py-1 rounded hover:bg-emerald-700"
          >
            ⬇ Export CSV
          </button>
          <button
            onClick={handleRetryAll}
            className="bg-purple-600 text-white text-sm px-3 py-1 rounded hover:bg-purple-700"
          >
            🔁 Retry All Failed
          </button>
        </div>
      </div>

      {loading ? (
        <p>Loading logs...</p>
      ) : filteredLogs.length === 0 ? (
        <p className="text-gray-500">No logs found with current filters.</p>
      ) : (
        <div className="overflow-x-auto bg-white shadow rounded">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="p-2">Contact</th>
                <th className="p-2">Status</th>
                <th className="p-2">Channel</th>
                <th className="p-2">Sent</th>
                <th className="p-2">Clicked</th>
                <th className="p-2">Click Type</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLogs.map(log => (
                <tr key={log.id} className="border-t hover:bg-gray-50">
                  <td className="p-2">
                    {log.contactName} ({log.contactPhone})
                  </td>
                  <td className="p-2">{log.sendStatus || "-"}</td>
                  <td className="p-2">{log.sourceChannel || "-"}</td>
                  <td className="p-2">
                    {log.sentAt ? new Date(log.sentAt).toLocaleString() : "-"}
                  </td>
                  <td className="p-2">{log.isClicked ? "✅ Yes" : "❌ No"}</td>
                  <td className="p-2">{log.clickType || "-"}</td>
                  <td className="p-2 space-x-2">
                    <button
                      onClick={() => openPreview(log)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Preview
                    </button>
                    <button
                      onClick={() => {
                        setJourneyLog(log);
                        setIsJourneyOpen(true);
                      }}
                      className="text-xs text-indigo-600 hover:underline"
                    >
                      🧭 Journey
                    </button>
                    {log.sendStatus === "Failed" ? (
                      <button
                        onClick={() => handleRetrySingle(log.id)}
                        className="text-xs text-white bg-red-500 hover:bg-red-600 px-2 py-1 rounded"
                      >
                        Retry
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">N/A</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-end items-center mt-4 space-x-2">
          <button
            className="px-2 py-1 text-sm border rounded"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            ⬅ Prev
          </button>
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <button
            className="px-2 py-1 text-sm border rounded"
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next ➡
          </button>
        </div>
      )}

      <MessagePreviewModal
        isOpen={previewOpen}
        onClose={closePreview}
        messageLog={selectedLog}
      />
      <ContactJourneyModal
        isOpen={isJourneyOpen}
        onClose={() => setIsJourneyOpen(false)}
        log={journeyLog}
      />
    </div>
  );
}

export default CampaignSendLogs;

// import React, { useEffect, useState } from "react";
// import { useParams, Link } from "react-router-dom";
// import axiosClient from "../../api/axiosClient";
// import { toast } from "react-toastify";
// import { saveAs } from "file-saver";
// import { confirmAlert } from "react-confirm-alert";
// import "react-confirm-alert/src/react-confirm-alert.css";
// import MessagePreviewModal from "./components/MessagePreviewModal";
// import CampaignSummaryBar from "./components/CampaignSummaryBar";
// import ContactJourneyModal from "./components/ContactJourneyModal";

// function CampaignSendLogs() {
//   const { campaignId } = useParams();
//   const [logs, setLogs] = useState([]);
//   const [filteredLogs, setFilteredLogs] = useState([]);
//   const [search, setSearch] = useState("");
//   const [statusFilter, setStatusFilter] = useState("");
//   const [channelFilter, setChannelFilter] = useState("");
//   const [clickTypeFilter, setClickTypeFilter] = useState("");
//   const [loading, setLoading] = useState(true);
//   const [page, setPage] = useState(1);
//   const [pageSize] = useState(10);
//   const [summary, setSummary] = useState(null);

//   const [previewOpen, setPreviewOpen] = useState(false);
//   const [selectedLog, setSelectedLog] = useState(null);
//   const [isJourneyOpen, setIsJourneyOpen] = useState(false);
//   const [journeyLog, setJourneyLog] = useState(null);

//   const fetchLogs = async () => {
//     try {
//       const res = await axiosClient.get(
//         `/campaign-logs/campaign/${campaignId}`
//       );
//       setLogs(res.data || []);
//       setFilteredLogs(res.data || []);
//     } catch {
//       toast.error("❌ Failed to load send logs");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchSummary = async () => {
//     try {
//       const res = await axiosClient.get(
//         `/campaign-logs/campaign/${campaignId}/summary`
//       );
//       setSummary(res.data);
//     } catch {
//       console.error("❌ Failed to fetch summary");
//     }
//   };

//   useEffect(() => {
//     fetchLogs();
//     fetchSummary();
//   }, [campaignId]);

//   useEffect(() => {
//     let result = logs;
//     if (statusFilter)
//       result = result.filter(log => log.sendStatus === statusFilter);
//     if (channelFilter)
//       result = result.filter(log => log.sourceChannel === channelFilter);
//     if (clickTypeFilter)
//       result = result.filter(log => log.clickType === clickTypeFilter);
//     if (search.trim()) {
//       const keyword = search.toLowerCase();
//       result = result.filter(
//         log =>
//           log.contactName?.toLowerCase().includes(keyword) ||
//           log.contactPhone?.includes(keyword)
//       );
//     }
//     setFilteredLogs(result);
//     setPage(1);
//   }, [statusFilter, channelFilter, clickTypeFilter, search, logs]);

//   const handleExport = () => {
//     const headers = [
//       "Contact Name",
//       "Phone",
//       "Status",
//       "Channel",
//       "Sent At",
//       "Delivered",
//       "Read",
//       "Clicked",
//       "Click Type",
//     ];
//     const csvRows = [
//       headers,
//       ...filteredLogs.map(log => [
//         log.contactName,
//         log.contactPhone,
//         log.sendStatus,
//         log.sourceChannel,
//         log.sentAt ? new Date(log.sentAt).toLocaleString() : "-",
//         log.deliveredAt ? new Date(log.deliveredAt).toLocaleString() : "-",
//         log.readAt ? new Date(log.readAt).toLocaleString() : "-",
//         log.isClicked ? "Yes" : "No",
//         log.clickType || "-",
//       ]),
//     ];
//     const blob = new Blob([csvRows.map(r => r.join(",")).join("\n")], {
//       type: "text/csv",
//     });
//     saveAs(blob, `CampaignLogs-${campaignId}.csv`);
//   };

//   const handleRetrySingle = logId => {
//     confirmAlert({
//       title: "Retry This Message?",
//       message: "Are you sure you want to retry this failed message?",
//       buttons: [
//         {
//           label: "Yes",
//           onClick: async () => {
//             try {
//               await axiosClient.post(`/campaign-logs/${logId}/retry`);
//               toast.success("✅ Retry triggered");
//               fetchLogs();
//               fetchSummary();
//             } catch {
//               toast.error("❌ Retry failed");
//             }
//           },
//         },
//         { label: "Cancel" },
//       ],
//     });
//   };

//   const handleRetryAll = () => {
//     confirmAlert({
//       title: "Retry All Failed Messages?",
//       message:
//         "This will retry all failed messages in this campaign. Continue?",
//       buttons: [
//         {
//           label: "Yes",
//           onClick: async () => {
//             try {
//               const res = await axiosClient.post(
//                 `/campaign-logs/campaign/${campaignId}/retry-all`
//               );
//               toast.success(`✅ Retried ${res.data.retried} messages`);
//               fetchLogs();
//               fetchSummary();
//             } catch {
//               toast.error("❌ Retry failed");
//             }
//           },
//         },
//         { label: "Cancel" },
//       ],
//     });
//   };

//   const paginatedLogs = filteredLogs.slice(
//     (page - 1) * pageSize,
//     page * pageSize
//   );
//   const totalPages = Math.ceil(filteredLogs.length / pageSize);

//   const openPreview = log => {
//     setSelectedLog(log);
//     setPreviewOpen(true);
//   };

//   const closePreview = () => {
//     setPreviewOpen(false);
//     setSelectedLog(null);
//   };

//   return (
//     <div className="p-6 bg-gray-50 min-h-screen">
//       <div className="flex justify-between items-center mb-4">
//         <h1 className="text-2xl font-bold text-purple-700">
//           📨 Send Logs for Campaign
//         </h1>
//         <Link to="/app/campaigns" className="text-sm text-blue-600 underline">
//           ← Back to Campaigns
//         </Link>
//       </div>

//       <CampaignSummaryBar summary={summary} />

//       <div className="grid md:grid-cols-4 gap-4 mb-4">
//         <input
//           className="border px-3 py-2 rounded"
//           placeholder="🔍 Search by name or phone"
//           value={search}
//           onChange={e => setSearch(e.target.value)}
//         />
//         <select
//           className="border px-3 py-2 rounded"
//           value={statusFilter}
//           onChange={e => setStatusFilter(e.target.value)}
//         >
//           <option value="">All Statuses</option>
//           <option value="Sent">Sent</option>
//           <option value="Queued">Queued</option>
//           <option value="Failed">Failed</option>
//         </select>
//         <select
//           className="border px-3 py-2 rounded"
//           value={channelFilter}
//           onChange={e => setChannelFilter(e.target.value)}
//         >
//           <option value="">All Channels</option>
//           <option value="WhatsApp">WhatsApp</option>
//           <option value="API">API</option>
//           <option value="Manual">Manual</option>
//         </select>
//         <select
//           className="border px-3 py-2 rounded"
//           value={clickTypeFilter}
//           onChange={e => setClickTypeFilter(e.target.value)}
//         >
//           <option value="">All Click Types</option>
//           <option value="BuyNow">Buy Now</option>
//           <option value="ViewDetails">View Details</option>
//         </select>
//       </div>

//       <div className="mb-4 flex justify-between">
//         <p className="text-sm text-gray-500">
//           Showing {paginatedLogs.length} of {filteredLogs.length} logs
//         </p>
//         <div className="space-x-2">
//           <button
//             onClick={handleExport}
//             className="bg-emerald-600 text-white text-sm px-3 py-1 rounded hover:bg-emerald-700"
//           >
//             ⬇ Export CSV
//           </button>
//           <button
//             onClick={handleRetryAll}
//             className="bg-purple-600 text-white text-sm px-3 py-1 rounded hover:bg-purple-700"
//           >
//             🔁 Retry All Failed
//           </button>
//         </div>
//       </div>

//       {loading ? (
//         <p>Loading logs...</p>
//       ) : filteredLogs.length === 0 ? (
//         <p className="text-gray-500">No logs found with current filters.</p>
//       ) : (
//         <div className="overflow-x-auto bg-white shadow rounded">
//           <table className="w-full text-sm">
//             <thead className="bg-gray-100 text-left">
//               <tr>
//                 <th className="p-2">Contact</th>
//                 <th className="p-2">Status</th>
//                 <th className="p-2">Channel</th>
//                 <th className="p-2">Sent</th>
//                 <th className="p-2">Clicked</th>
//                 <th className="p-2">Click Type</th>
//                 <th className="p-2">Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {paginatedLogs.map(log => (
//                 <tr key={log.id} className="border-t hover:bg-gray-50">
//                   <td className="p-2">
//                     {log.contactName} ({log.contactPhone})
//                   </td>
//                   <td className="p-2">{log.sendStatus || "-"}</td>
//                   <td className="p-2">{log.sourceChannel || "-"}</td>
//                   <td className="p-2">
//                     {log.sentAt ? new Date(log.sentAt).toLocaleString() : "-"}
//                   </td>
//                   <td className="p-2">{log.isClicked ? "✅ Yes" : "❌ No"}</td>
//                   <td className="p-2">{log.clickType || "-"}</td>
//                   <td className="p-2 space-x-2">
//                     <button
//                       onClick={() => openPreview(log)}
//                       className="text-xs text-blue-600 hover:underline"
//                     >
//                       Preview
//                     </button>
//                     <button
//                       onClick={() => {
//                         setJourneyLog(log);
//                         setIsJourneyOpen(true);
//                       }}
//                       className="text-xs text-indigo-600 hover:underline"
//                     >
//                       🧭 Journey
//                     </button>
//                     {log.sendStatus === "Failed" ? (
//                       <button
//                         onClick={() => handleRetrySingle(log.id)}
//                         className="text-xs text-white bg-red-500 hover:bg-red-600 px-2 py-1 rounded"
//                       >
//                         Retry
//                       </button>
//                     ) : (
//                       <span className="text-xs text-gray-400">N/A</span>
//                     )}
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       )}

//       {totalPages > 1 && (
//         <div className="flex justify-end items-center mt-4 space-x-2">
//           <button
//             className="px-2 py-1 text-sm border rounded"
//             disabled={page === 1}
//             onClick={() => setPage(page - 1)}
//           >
//             ⬅ Prev
//           </button>
//           <span className="text-sm text-gray-600">
//             Page {page} of {totalPages}
//           </span>
//           <button
//             className="px-2 py-1 text-sm border rounded"
//             disabled={page === totalPages}
//             onClick={() => setPage(page + 1)}
//           >
//             Next ➡
//           </button>
//         </div>
//       )}

//       <MessagePreviewModal
//         isOpen={previewOpen}
//         onClose={closePreview}
//         messageLog={selectedLog}
//       />
//       <ContactJourneyModal
//         isOpen={isJourneyOpen}
//         onClose={() => setIsJourneyOpen(false)}
//         log={journeyLog}
//       />
//     </div>
//   );
// }

// export default CampaignSendLogs;
