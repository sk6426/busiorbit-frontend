import React, { useEffect, useState } from "react";
import axiosClient from "../../api/axiosClient";
import { Button } from "../../components/ui/button";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const WebhookSettings = () => {
  const [autoCleanup, setAutoCleanup] = useState(false);
  const [lastCleanup, setLastCleanup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [logsCount, setLogsCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchStatus = async () => {
    try {
      const [statusRes, countRes] = await Promise.all([
        axiosClient.get("/webhooks/settings"),
        axiosClient.get("/webhooks/failed/count"),
      ]);
      setAutoCleanup(statusRes.data.enabled); // 🔄 Make sure `enabled` matches backend key
      setLastCleanup(statusRes.data.lastCleanupAt);
      setLogsCount(countRes.data.count);
    } catch (err) {
      console.error("❌ Failed to load webhook settings", err);
      toast.error("❌ Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const toggleCleanup = async () => {
    setIsSubmitting(true);
    try {
      const endpoint = autoCleanup
        ? "/webhooks/disable-cleanup"
        : "/webhooks/enable-cleanup";
      await axiosClient.post(endpoint);
      toast.success(
        autoCleanup ? "🧹 Auto Cleanup Disabled" : "✅ Auto Cleanup Enabled"
      );
      await fetchStatus();
    } catch (err) {
      console.error("❌ Toggle failed", err);
      toast.error("❌ Failed to toggle auto cleanup");
    } finally {
      setIsSubmitting(false);
    }
  };

  const runManualCleanup = async () => {
    setIsSubmitting(true);
    try {
      const res = await axiosClient.post("/webhooks/cleanup-now");
      toast.success(res.data.message || "✅ Manual cleanup complete");
      await fetchStatus();
    } catch (err) {
      console.error("❌ Manual cleanup failed", err);
      toast.error("❌ Manual cleanup failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const injectTest = async () => {
    try {
      await axiosClient.post("/webhooks/inject-test-log");
      toast.success("🧪 Test failure log injected successfully.");
      await fetchStatus();
    } catch (err) {
      console.error("❌ Injection failed", err);
      toast.error("❌ Failed to inject test log");
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">⚙️ Webhook Settings</h2>

      {loading ? (
        <p>Loading settings...</p>
      ) : (
        <div className="space-y-4">
          <div className="bg-white p-4 shadow rounded space-y-1">
            <p>
              🧮 <strong>Total Failed Logs:</strong> {logsCount}
            </p>
            <p>
              🧹 <strong>Auto-Cleanup Enabled:</strong>{" "}
              <span className={autoCleanup ? "text-green-600" : "text-red-600"}>
                {autoCleanup ? "Yes" : "No"}
              </span>
            </p>
            <p>
              ⏱ <strong>Last Cleanup:</strong>{" "}
              {lastCleanup
                ? new Date(lastCleanup).toLocaleString()
                : "Never run"}
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <Button onClick={toggleCleanup} disabled={isSubmitting}>
              {autoCleanup ? "Disable Auto Cleanup" : "Enable Auto Cleanup"}
            </Button>

            <Button
              onClick={runManualCleanup}
              variant="secondary"
              disabled={isSubmitting}
            >
              🧹 Run Manual Cleanup
            </Button>

            <Button onClick={injectTest} variant="destructive">
              🧪 Inject Test Log
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebhookSettings;
