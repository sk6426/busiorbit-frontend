import React, { useEffect, useState } from "react";
import axios from "../../../api/axiosClient";
import { useParams } from "react-router-dom";
import StatCard from "../../../components/StatCard";

function CampaignDashboard() {
  const { campaignId } = useParams();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get(
          `/campaigns/analytics/${campaignId}/summary`
        );
        if (res.data.success) setStats(res.data.data);
      } catch (err) {
        console.error("❌ Failed to load campaign summary", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [campaignId]);

  if (loading)
    return <p className="text-gray-500">⏳ Loading campaign summary...</p>;
  if (!stats) return <p className="text-red-500">⚠️ No data found.</p>;

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">📊 Campaign Summary</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <StatCard title="Total Messages" value={stats.totalMessages} />
        <StatCard title="Sent" value={stats.sentCount} />
        <StatCard title="Delivered" value={stats.deliveredCount} />
        <StatCard title="Read" value={stats.readCount} />
        <StatCard title="Failed" value={stats.failedCount} />
      </div>
    </div>
  );
}

export default CampaignDashboard;
