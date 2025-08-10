import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import { toast } from "react-toastify";
import {
  Clipboard,
  ClipboardCheck,
  ExternalLink,
  Download,
} from "lucide-react";

export default function TrackingLogDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [log, setLog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(null); // For icon toggle

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await axiosClient.get(`/tracking/logs/${id}/details`);
        setLog(res.data);
      } catch (err) {
        toast.error("Failed to load tracking detail.");
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  const copyToClipboard = async (value, key) => {
    await navigator.clipboard.writeText(value);
    setCopied(key);
    toast.success("Copied!");
    setTimeout(() => setCopied(null), 1000);
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(log, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    triggerDownload(url, `tracking-log-${log.id}.json`);
  };

  const exportCSV = () => {
    const flat = Object.entries(log)
      .map(([key, val]) => `${key},${JSON.stringify(val)}`)
      .join("\n");
    const blob = new Blob([flat], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    triggerDownload(url, `tracking-log-${log.id}.csv`);
  };

  const triggerDownload = (url, filename) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="p-4 text-gray-600">Loading...</div>;
  if (!log)
    return <div className="p-4 text-red-600">Tracking Log not found.</div>;

  return (
    <div className="p-6">
      <button
        className="mb-4 text-sm text-purple-600 hover:underline"
        onClick={() => navigate(-1)}
      >
        ← Back to Tracking Logs
      </button>

      <div className="bg-white shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 rounded-2xl p-6 border space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-purple-800">
            🧠 CTA Tracking Details
          </h2>

          <div className="flex gap-3">
            <button
              onClick={exportJSON}
              className="text-sm text-gray-600 hover:text-purple-700 flex items-center gap-1"
            >
              <Download size={16} /> JSON
            </button>
            <button
              onClick={exportCSV}
              className="text-sm text-gray-600 hover:text-purple-700 flex items-center gap-1"
            >
              <Download size={16} /> CSV
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-800">
          <Info
            label="📌 Button"
            value={`${log.buttonText} (${log.ctaType})`}
          />
          <Info label="📍 Source" value={log.sourceType} />
          <Info label="🧠 Clicked Via" value={log.clickedVia} />
          <Info
            label="🕒 Clicked At"
            value={new Date(log.clickedAt).toLocaleString()}
          />
          <Info label="🌐 IP Address" value={log.ipAddress} />
          <Info
            label="📱 Device"
            value={`${log.deviceType} (${log.browser})`}
          />
          <Info label="📍 Location" value={log.country || "?"} />

          {log.message && (
            <>
              <Info label="📩 Message" value={log.message.messageContent} />
              <CopyableInfo
                label="📨 Message ID"
                value={log.message.messageId}
                copied={copied === "msg"}
                onCopy={() => copyToClipboard(log.message.messageId, "msg")}
              />
              <Info label="✅ Status" value={log.message.status} />
              <Info
                label="⚠️ Error"
                value={log.message.errorMessage || "None"}
              />
            </>
          )}

          {log.contact && (
            <>
              <Info label="👤 Contact" value={log.contact.name} />
              <CopyableInfo
                label="📞 Phone"
                value={log.contact.phoneNumber}
                copied={copied === "phone"}
                onCopy={() => copyToClipboard(log.contact.phoneNumber, "phone")}
              />
              <div className="col-span-2">
                <button
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                  onClick={() =>
                    navigate(`/app/crm/contacts/${log.contact.id}`)
                  }
                >
                  <ExternalLink size={14} /> Open Contact Profile
                </button>
              </div>
            </>
          )}

          {log.campaign && (
            <>
              <Info label="📣 Campaign" value={log.campaign.name} />
              <Info label="📄 Type" value={log.campaign.campaignType} />
              <div className="col-span-2">
                <button
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                  onClick={() =>
                    navigate(`/app/campaigns/view/${log.campaign.id}`)
                  }
                >
                  <ExternalLink size={14} /> View Campaign Details
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// 🧩 Reusable info box
function Info({ label, value }) {
  return (
    <div className="bg-gray-50 px-4 py-2 rounded-md shadow-sm hover:bg-purple-50 transition-all duration-200">
      <div className="text-xs text-gray-500 uppercase font-medium">{label}</div>
      <div className="text-sm text-gray-700 mt-1">{value}</div>
    </div>
  );
}

// 📋 Copyable Field
function CopyableInfo({ label, value, onCopy, copied }) {
  return (
    <div
      className="bg-gray-50 px-4 py-2 rounded-md shadow-sm hover:bg-purple-50 transition-all duration-200 flex justify-between items-center"
      title="Click to copy"
    >
      <div>
        <div className="text-xs text-gray-500 uppercase font-medium">
          {label}
        </div>
        <div className="text-sm text-gray-700 mt-1">{value}</div>
      </div>
      <button
        onClick={onCopy}
        className="text-gray-400 hover:text-purple-600 ml-2"
      >
        {copied ? <ClipboardCheck size={16} /> : <Clipboard size={16} />}
      </button>
    </div>
  );
}
