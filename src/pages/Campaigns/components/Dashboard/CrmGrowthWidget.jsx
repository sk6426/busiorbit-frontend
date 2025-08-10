import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { getCrmSummary, getCrmContactTrends } from "@/api/dashboardService";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import StatCard from "@/components/StatCard";
import Spinner from "@/components/Spinner";

export default function CrmGrowthWidget() {
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        // Fetch summary and trends data concurrently for better performance
        const [summaryResponse, trendsResponse] = await Promise.all([
          getCrmSummary(),
          getCrmContactTrends(),
        ]);

        setSummary(summaryResponse.data);

        // Format the date for the chart to be more readable
        const formattedTrends = trendsResponse.data.map(item => ({
          ...item,
          date: new Date(item.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
        }));
        setTrends(formattedTrends);
      } catch (err) {
        setError("Failed to load CRM stats.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
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

    if (!summary || summary.totalContacts === 0) {
      return (
        <div className="flex justify-center items-center h-60">
          <p className="text-gray-500">
            Add your first contact to see stats here.
          </p>
        </div>
      );
    }

    return (
      <div>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <StatCard title="Total Contacts" value={summary.totalContacts} />
          <StatCard
            title="New (Last 30d)"
            value={summary.newContactsLast30Days}
            valueClassName="text-green-600"
          />
        </div>
        <div style={{ width: "100%", height: 200 }}>
          <ResponsiveContainer>
            <LineChart
              data={trends}
              margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#666" />
              <YAxis allowDecimals={false} stroke="#666" />
              <Tooltip
                contentStyle={{
                  borderRadius: "0.5rem",
                  boxShadow:
                    "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
                  border: "1px solid #e2e8f0",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="newContacts"
                name="New Contacts"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contact Growth</CardTitle>
        <CardDescription>
          Audience growth over the last 30 days.
        </CardDescription>
      </CardHeader>
      <CardContent>{renderContent()}</CardContent>
    </Card>
  );
}
