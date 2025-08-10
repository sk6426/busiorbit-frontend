import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { getCampaignStatusDashboard } from "@/api/dashboardService";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import StatCard from "@/components/StatCard";
import Spinner from "@/components/Spinner";

// A small utility to prevent labels from cluttering the chart on small slices
const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  // Don't render a label if the slice is less than 5%
  if (percent < 0.05) {
    return null;
  }

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      className="text-xs font-bold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function CampaignStatsWidget() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await getCampaignStatusDashboard();
        setStats(response.data);
      } catch (err) {
        setError("Failed to load campaign stats.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-60">
          <Spinner />
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex justify-center items-center h-60">
          <p className="text-red-500">{error}</p>
        </div>
      );
    }

    if (!stats || stats.totalSent === 0) {
      return (
        <div className="flex justify-center items-center h-60">
          <p className="text-gray-500">
            Send your first campaign to see stats here.
          </p>
        </div>
      );
    }

    const chartData = [
      { name: "Read", value: stats.totalRead },
      {
        name: "Delivered (Not Read)",
        value: stats.totalDelivered - stats.totalRead,
      },
    ];

    const COLORS = ["#0088FE", "#FFBB28"];

    return (
      <div>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <StatCard title="Total Sent" value={stats.totalSent} />
          <StatCard
            title="Failed"
            value={stats.totalFailed}
            valueClassName="text-red-500"
          />
        </div>
        <div style={{ width: "100%", height: 200 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={90}
                fill="#8884d8"
                dataKey="value"
                stroke="none"
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [value, name]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Campaign Performance</CardTitle>
        <CardDescription>Stats from all campaigns sent.</CardDescription>
      </CardHeader>
      <CardContent>{renderContent()}</CardContent>
    </Card>
  );
}
