import React, { useEffect, useState } from "react";
import axios from "axios";

function StatusTracker() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const businessId = localStorage.getItem("businessId");
      const res = await axios.get(
        `/api/message-status?businessId=${businessId}`
      );
      if (res.data.success) {
        setLogs(res.data.data);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="bg-white p-6 shadow rounded">
      <h2 className="text-xl font-semibold mb-4">📩 Message Status Tracker</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full border text-sm">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-2">Recipient</th>
              <th className="p-2">Status</th>
              <th className="p-2">Sent</th>
              <th className="p-2">Delivered</th>
              <th className="p-2">Read</th>
              <th className="p-2">Error</th>
              <th className="p-2">Type</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, idx) => (
              <tr key={idx} className="border-t">
                <td className="p-2">{log.recipientNumber}</td>
                <td className="p-2 font-semibold text-purple-700">
                  {log.status}
                </td>
                <td className="p-2">
                  {log.sentAt ? new Date(log.sentAt).toLocaleString() : "-"}
                </td>
                <td className="p-2">
                  {log.deliveredAt
                    ? new Date(log.deliveredAt).toLocaleString()
                    : "-"}
                </td>
                <td className="p-2">
                  {log.readAt ? new Date(log.readAt).toLocaleString() : "-"}
                </td>
                <td className="p-2 text-red-500">{log.errorMessage || "-"}</td>
                <td className="p-2 text-gray-500">{log.messageType}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default StatusTracker;
