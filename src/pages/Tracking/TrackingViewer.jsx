import React, { useEffect, useState } from "react";
import axiosClient from "../../api/axiosClient";
import { Card } from "../../components/ui/card";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const TrackingViewer = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // 🔁 Fetch CTA logs on mount
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await axiosClient.get("/tracking/logs");
        setLogs(res.data.data);
      } catch (err) {
        toast.error("❌ Failed to load CTA tracking logs");
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">📊 CTA Tracking Logs</h2>

      <Card className="overflow-x-auto shadow-md">
        <table className="min-w-full table-auto text-sm text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2">Contact</th>
              <th className="px-3 py-2">Phone</th>
              <th className="px-3 py-2">Button</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Source</th>
              <th className="px-3 py-2">Campaign</th>
              <th className="px-3 py-2">Device</th>
              <th className="px-3 py-2">Country</th>
              <th className="px-3 py-2">Clicked At</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9" className="text-center py-4">
                  ⏳ Loading...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan="9" className="text-center py-4">
                  🙁 No tracking logs found.
                </td>
              </tr>
            ) : (
              logs.map(log => (
                <tr
                  key={log.id}
                  className="border-b hover:bg-gray-50 cursor-pointer transition"
                  onClick={() =>
                    // navigate(`/api/tracking/logs/${log.id}/details`)
                    navigate(`/app/tracking/logs/${log.id}`)
                  }
                >
                  <td className="px-3 py-2">{log.contactName || "(N/A)"}</td>
                  <td className="px-3 py-2">{log.contactPhone}</td>
                  <td className="px-3 py-2 font-medium text-purple-700 underline">
                    {log.buttonText}
                  </td>
                  <td className="px-3 py-2">{log.ctaType}</td>
                  <td className="px-3 py-2">{log.sourceType}</td>
                  <td className="px-3 py-2">{log.campaignName}</td>
                  <td className="px-3 py-2">{log.deviceType}</td>
                  <td className="px-3 py-2">{log.country}</td>
                  <td className="px-3 py-2">
                    {new Date(log.clickedAt).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

export default TrackingViewer;
