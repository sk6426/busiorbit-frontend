import React, { useEffect, useState } from "react";
import axiosClient from "../../api/axiosClient";
import { Dialog } from "@headlessui/react";
import { Button } from "../../components/ui/button";

const FailedWebhookLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await axiosClient.get("/failed-webhooks");
        setLogs(res.data || []);
      } catch (error) {
        console.error("❌ Error fetching failed webhook logs", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">📉 Failed Webhook Logs</h2>

      {loading ? (
        <p>Loading logs...</p>
      ) : logs.length === 0 ? (
        <p className="text-gray-500">✅ No failed webhook logs found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white shadow rounded text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left">🧠 Error</th>
                <th className="px-4 py-2 text-left">📦 Module</th>
                <th className="px-4 py-2 text-left">⚠️ Type</th>
                <th className="px-4 py-2 text-left">⏱ Time</th>
                <th className="px-4 py-2 text-left">🔍 Raw</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} className="border-t">
                  <td className="px-4 py-2">{log.errorMessage}</td>
                  <td className="px-4 py-2">{log.sourceModule}</td>
                  <td className="px-4 py-2">{log.failureType}</td>
                  <td className="px-4 py-2 text-gray-700">
                    {new Date(log.createdAt || log.loggedAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-2">
                    <Button size="sm" onClick={() => setSelectedLog(log)}>
                      View JSON
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 🔍 Raw JSON Modal */}
      <Dialog
        open={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-3xl rounded bg-white p-6 shadow-xl">
            <Dialog.Title className="text-lg font-semibold mb-4">
              📦 Raw Webhook Payload
            </Dialog.Title>
            <pre className="overflow-auto max-h-[500px] bg-gray-100 text-sm p-4 rounded border border-gray-200">
              {(() => {
                try {
                  return JSON.stringify(
                    JSON.parse(selectedLog?.rawJson || "{}"),
                    null,
                    2
                  );
                } catch {
                  return "⚠️ Invalid JSON";
                }
              })()}
            </pre>
            <div className="mt-4 text-right">
              <Button variant="secondary" onClick={() => setSelectedLog(null)}>
                Close
              </Button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
};

export default FailedWebhookLogs;
