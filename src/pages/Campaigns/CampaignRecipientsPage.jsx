import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import { toast } from "react-toastify";

function CampaignRecipientsPage() {
  const { id } = useParams(); // campaignId
  const [recipients, setRecipients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    const loadRecipients = async () => {
      try {
        const res = await axiosClient.get(`/campaigns/${id}/recipients`);
        setRecipients(res.data || []);
      } catch (err) {
        toast.error("Failed to load recipients");
      } finally {
        setLoading(false);
      }
    };
    loadRecipients();
  }, [id]);

  const filteredRecipients = recipients.filter(r =>
    filter === "All" ? true : r.status === filter
  );

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-xl rounded-2xl">
      <h2 className="text-2xl font-bold text-purple-600 mb-4">
        📋 Assigned Contacts
      </h2>

      {/* 🔍 Filter Dropdown */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Filter by Status
        </label>
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 text-sm w-60"
        >
          <option value="All">All</option>
          <option value="Pending">Pending</option>
          <option value="Sent">Sent</option>
          <option value="Delivered">Delivered</option>
          <option value="Failed">Failed</option>
          <option value="Replied">Replied</option>
        </select>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : filteredRecipients.length === 0 ? (
        <p className="text-yellow-600">No contacts match this filter.</p>
      ) : (
        <table className="w-full text-sm border border-gray-300 rounded-xl overflow-hidden">
          <thead className="bg-purple-100 text-gray-700">
            <tr>
              <th className="p-3 text-left">Contact</th>
              <th className="p-3 text-left">Phone</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Sent At</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecipients.map(r => (
              <tr key={r.id} className="border-t">
                <td className="p-3">{r.contactName}</td>
                <td className="p-3 text-gray-600">{r.contactPhone}</td>
                <td className="p-3 flex items-center gap-1">
                  {r.status === "Pending" && <span>✉️</span>}
                  {r.status === "Sent" && <span>✅</span>}
                  {r.status === "Delivered" && <span>📬</span>}
                  {r.status === "Failed" && <span>❌</span>}
                  {r.status === "Replied" && <span>💬</span>}
                  <span>{r.status}</span>
                </td>
                <td className="p-3 text-gray-500">
                  {r.sentAt ? new Date(r.sentAt).toLocaleString() : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default CampaignRecipientsPage;
