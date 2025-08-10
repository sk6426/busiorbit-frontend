import React, { useEffect, useState, useCallback } from "react";
import axiosClient from "../../api/axiosClient";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { saveAs } from "file-saver";

function CampaignList() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0); // fixed useState syntax
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const navigate = useNavigate();

  // Wrap in useCallback!
  const fetchCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get(
        `/Campaign/paginated?page=${page}&pageSize=${pageSize}&status=${statusFilter}`
      );
      setCampaigns(res.data.items);
      setTotalCount(res.data.totalCount);
    } catch (err) {
      toast.error("❌ Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusFilter]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const handleDelete = async id => {
    if (!window.confirm("Are you sure you want to delete this campaign?"))
      return;
    try {
      await axiosClient.delete(`/Campaign/${id}`);
      toast.success("🗑️ Campaign deleted");
      fetchCampaigns();
    } catch {
      toast.error("❌ Delete failed");
    }
  };

  const handleSendCampaign = async id => {
    try {
      await axiosClient.post(`/campaign/send/${id}`);
      toast.success("✅ Campaign sent successfully");
      fetchCampaigns();
    } catch {
      toast.error("❌ Sending campaign failed");
    }
  };

  const filteredCampaigns = campaigns.filter(c =>
    (c.name || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleExport = () => {
    const csvRows = [
      ["Name", "Status", "ScheduledAt", "CreatedAt"],
      ...filteredCampaigns.map(c => [
        c.name,
        c.status,
        c.scheduledAt || "-",
        new Date(c.createdAt).toLocaleString(),
      ]),
    ];
    const blob = new Blob([csvRows.map(r => r.join(",")).join("\n")], {
      type: "text/csv",
    });
    saveAs(blob, "campaigns.csv");
  };

  const getStatusBadge = status => {
    const color =
      status === "Draft"
        ? "bg-yellow-100 text-yellow-800"
        : status === "Sent"
        ? "bg-green-100 text-green-800"
        : "bg-gray-200 text-gray-800";
    return (
      <span className={`px-2 py-1 rounded text-xs font-semibold ${color}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="bg-white rounded-md shadow border">
        {/* Header */}
        <div className="flex justify-between items-center px-5 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-700">
            📋 Campaigns List
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => navigate("/app/campaigns/template-single")}
              className="px-3 py-1.5 text-sm border rounded-md text-gray-700 hover:bg-gray-100"
            >
              ➕ New Campaign
            </button>
            <button
              onClick={handleExport}
              className="px-3 py-1.5 text-sm border rounded-md text-gray-700 hover:bg-gray-100"
            >
              ⬇ Export CSV
            </button>
          </div>
        </div>

        {/* Show total count */}
        <div className="flex justify-between items-center px-5 py-2">
          <span className="text-sm text-gray-600">
            Showing {filteredCampaigns.length} of {totalCount} campaigns
          </span>
        </div>

        {/* Filters */}
        <div className="px-5 py-4 grid grid-cols-1 md:grid-cols-3 gap-4 border-b bg-gray-50">
          <input
            type="text"
            placeholder="Search by name..."
            className="border rounded px-3 py-2 text-sm"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select
            className="border rounded px-3 py-2 text-sm"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Sent">Sent</option>
          </select>
          <select
            className="border rounded px-3 py-2 text-sm"
            value={pageSize}
            onChange={e => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
          >
            {[10, 25, 50].map(size => (
              <option key={size} value={size}>
                Show {size}
              </option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-md">
          {loading ? (
            <div className="p-5 text-gray-500 text-sm">
              ⏳ Loading campaigns...
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <p className="text-md">😕 No campaigns found</p>
              <p className="text-sm">Try adjusting filters or create one.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-100 text-gray-600 font-semibold">
                <tr>
                  <th className="p-3 text-left">Name</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Scheduled</th>
                  <th className="p-3 text-left">Created</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCampaigns.map(c => (
                  <tr key={c.id} className="border-t hover:bg-gray-50">
                    <td className="p-3">{c.name}</td>
                    <td className="p-3">{getStatusBadge(c.status)}</td>
                    <td className="p-3">
                      {c.scheduledAt
                        ? new Date(c.scheduledAt).toLocaleString()
                        : "-"}
                    </td>
                    <td className="p-3">
                      {new Date(c.createdAt).toLocaleString()}
                    </td>
                    <td className="p-3 space-x-1">
                      <button
                        onClick={() => navigate(`/app/campaigns/edit/${c.id}`)}
                        className="bg-blue-500 text-white px-2 py-1 text-xs rounded hover:bg-blue-600"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => navigate(`/app/campaigns/logs/${c.id}`)}
                        className="bg-purple-600 text-white px-2 py-1 text-xs rounded hover:bg-purple-700"
                      >
                        📊 Logs
                      </button>
                      <button
                        onClick={() =>
                          navigate(`/app/campaigns/dashboard/${c.id}`)
                        }
                        className="bg-indigo-600 text-white px-2 py-1 text-xs rounded hover:bg-indigo-700"
                      >
                        📈 Stats
                      </button>
                      {c.status?.toLowerCase() === "draft" && (
                        <button
                          onClick={() => handleSendCampaign(c.id)}
                          className="bg-green-600 text-white px-2 py-1 text-xs rounded hover:bg-green-700"
                        >
                          🚀 Send
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="bg-red-500 text-white px-2 py-1 text-xs rounded hover:bg-red-600"
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default CampaignList;

// import React, { useEffect, useState } from "react";
// import axiosClient from "../../api/axiosClient";
// import { useNavigate } from "react-router-dom";
// import { toast } from "react-toastify";
// import { saveAs } from "file-saver";

// function CampaignList() {
//   const [campaigns, setCampaigns] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [page, setPage] = useState(1);
//   const [pageSize, setPageSize] = useState(10);
//   const [setTotalCount] = useState(0);
//   const [search, setSearch] = useState("");
//   const [statusFilter, setStatusFilter] = useState("");

//   const navigate = useNavigate();

//   const fetchCampaigns = async () => {
//     try {
//       setLoading(true);
//       const res = await axiosClient.get(
//         `/Campaign/paginated?page=${page}&pageSize=${pageSize}&status=${statusFilter}`
//       );
//       setCampaigns(res.data.items);
//       setTotalCount(res.data.totalCount);
//     } catch (err) {
//       toast.error("❌ Failed to load campaigns");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchCampaigns();
//   }, [page, pageSize, statusFilter]);

//   const handleDelete = async id => {
//     if (!window.confirm("Are you sure you want to delete this campaign?"))
//       return;
//     try {
//       await axiosClient.delete(`/Campaign/${id}`);
//       toast.success("🗑️ Campaign deleted");
//       fetchCampaigns();
//     } catch {
//       toast.error("❌ Delete failed");
//     }
//   };

//   const handleSendCampaign = async id => {
//     try {
//       // await axiosClient.post(`/campaign/send-template-simple`);
//       await axiosClient.post(`/campaign/send/${id}`);
//       toast.success("✅ Campaign sent successfully");
//       fetchCampaigns();
//     } catch {
//       toast.error("❌ Sending campaign failed");
//     }
//   };

//   const filteredCampaigns = campaigns.filter(c =>
//     (c.name || "").toLowerCase().includes(search.toLowerCase())
//   );

//   const handleExport = () => {
//     const csvRows = [
//       ["Name", "Status", "ScheduledAt", "CreatedAt"],
//       ...filteredCampaigns.map(c => [
//         c.name,
//         c.status,
//         c.scheduledAt || "-",
//         new Date(c.createdAt).toLocaleString(),
//       ]),
//     ];
//     const blob = new Blob([csvRows.map(r => r.join(",")).join("\n")], {
//       type: "text/csv",
//     });
//     saveAs(blob, "campaigns.csv");
//   };

//   const getStatusBadge = status => {
//     const color =
//       status === "Draft"
//         ? "bg-yellow-100 text-yellow-800"
//         : status === "Sent"
//         ? "bg-green-100 text-green-800"
//         : "bg-gray-200 text-gray-800";
//     return (
//       <span className={`px-2 py-1 rounded text-xs font-semibold ${color}`}>
//         {status}
//       </span>
//     );
//   };

//   return (
//     <div className="p-6 max-w-7xl mx-auto space-y-6">
//       <div className="bg-white rounded-md shadow border">
//         {/* Header */}
//         <div className="flex justify-between items-center px-5 py-4 border-b">
//           <h2 className="text-lg font-semibold text-gray-700">
//             📋 Campaigns List
//           </h2>
//           <div className="flex gap-2">
//             <button
//               onClick={() => navigate("/app/campaigns/template-single")}
//               className="px-3 py-1.5 text-sm border rounded-md text-gray-700 hover:bg-gray-100"
//             >
//               ➕ New Campaign
//             </button>
//             <button
//               onClick={handleExport}
//               className="px-3 py-1.5 text-sm border rounded-md text-gray-700 hover:bg-gray-100"
//             >
//               ⬇ Export CSV
//             </button>
//           </div>
//         </div>

//         {/* Filters */}
//         <div className="px-5 py-4 grid grid-cols-1 md:grid-cols-3 gap-4 border-b bg-gray-50">
//           <input
//             type="text"
//             placeholder="Search by name..."
//             className="border rounded px-3 py-2 text-sm"
//             value={search}
//             onChange={e => setSearch(e.target.value)}
//           />
//           <select
//             className="border rounded px-3 py-2 text-sm"
//             value={statusFilter}
//             onChange={e => setStatusFilter(e.target.value)}
//           >
//             <option value="">All Statuses</option>
//             <option value="Draft">Draft</option>
//             <option value="Sent">Sent</option>
//           </select>
//           <select
//             className="border rounded px-3 py-2 text-sm"
//             value={pageSize}
//             onChange={e => {
//               setPageSize(Number(e.target.value));
//               setPage(1);
//             }}
//           >
//             {[10, 25, 50].map(size => (
//               <option key={size} value={size}>
//                 Show {size}
//               </option>
//             ))}
//           </select>
//         </div>

//         {/* Table */}
//         <div className="overflow-x-auto rounded-md">
//           {loading ? (
//             <div className="p-5 text-gray-500 text-sm">
//               ⏳ Loading campaigns...
//             </div>
//           ) : filteredCampaigns.length === 0 ? (
//             <div className="p-6 text-center text-gray-500">
//               <p className="text-md">😕 No campaigns found</p>
//               <p className="text-sm">Try adjusting filters or create one.</p>
//             </div>
//           ) : (
//             <table className="w-full text-sm">
//               <thead className="bg-gray-100 text-gray-600 font-semibold">
//                 <tr>
//                   <th className="p-3 text-left">Name</th>
//                   <th className="p-3 text-left">Status</th>
//                   <th className="p-3 text-left">Scheduled</th>
//                   <th className="p-3 text-left">Created</th>
//                   <th className="p-3 text-left">Actions</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {filteredCampaigns.map(c => (
//                   <tr key={c.id} className="border-t hover:bg-gray-50">
//                     <td className="p-3">{c.name}</td>
//                     <td className="p-3">{getStatusBadge(c.status)}</td>
//                     <td className="p-3">
//                       {c.scheduledAt
//                         ? new Date(c.scheduledAt).toLocaleString()
//                         : "-"}
//                     </td>
//                     <td className="p-3">
//                       {new Date(c.createdAt).toLocaleString()}
//                     </td>
//                     <td className="p-3 space-x-1">
//                       <button
//                         onClick={() => navigate(`/app/campaigns/edit/${c.id}`)}
//                         className="bg-blue-500 text-white px-2 py-1 text-xs rounded hover:bg-blue-600"
//                       >
//                         ✏️ Edit
//                       </button>
//                       <button
//                         onClick={() => navigate(`/app/campaigns/logs/${c.id}`)}
//                         className="bg-purple-600 text-white px-2 py-1 text-xs rounded hover:bg-purple-700"
//                       >
//                         📊 Logs
//                       </button>
//                       <button
//                         onClick={
//                           () => navigate(`/app/campaigns/dashboard/${c.id}`)
//                           //  navigate(`/app/campaigns/analytics/${c.id}/summary`)
//                           //campaigns/analytics/${id}/summary
//                           // /campaigns/analytics/${id}/summary
//                         }
//                         className="bg-indigo-600 text-white px-2 py-1 text-xs rounded hover:bg-indigo-700"
//                       >
//                         📈 Stats
//                       </button>
//                       {c.status?.toLowerCase() === "draft" && (
//                         <button
//                           onClick={() => handleSendCampaign(c.id)}
//                           className="bg-green-600 text-white px-2 py-1 text-xs rounded hover:bg-green-700"
//                         >
//                           🚀 Send
//                         </button>
//                       )}
//                       <button
//                         onClick={() => handleDelete(c.id)}
//                         className="bg-red-500 text-white px-2 py-1 text-xs rounded hover:bg-red-600"
//                       >
//                         🗑️ Delete
//                       </button>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// export default CampaignList;
