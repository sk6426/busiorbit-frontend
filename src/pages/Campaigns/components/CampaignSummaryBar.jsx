import React from "react";

function CampaignSummaryBar({ summary }) {
  if (!summary) return null;

  const formatDate = datetime =>
    datetime ? new Date(datetime).toLocaleString() : "-";

  return (
    <div className="bg-white border rounded-md shadow p-4 mb-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-800">
      <div>
        <p className="font-semibold text-purple-700">📬 Total Sent</p>
        <p>{summary.totalSent}</p>
      </div>
      <div>
        <p className="font-semibold text-red-600">❌ Failed</p>
        <p>{summary.failedCount}</p>
      </div>
      <div>
        <p className="font-semibold text-green-700">✅ Clicked</p>
        <p>{summary.clickedCount}</p>
      </div>
      <div>
        <p className="font-semibold text-blue-600">🕒 Last Sent</p>
        <p>{formatDate(summary.lastSentAt)}</p>
      </div>
    </div>
  );
}

export default CampaignSummaryBar;
