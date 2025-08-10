import React, { useEffect, useState } from "react";
import axiosClient from "../../api/axiosClient";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { toast } from "react-toastify";
import Spinner from "../../components/Spinner";

const FILTERS = [
  { label: "Today", value: 1 },
  { label: "7 Days", value: 7 },
  { label: "30 Days", value: 30 },
];

function ContactTrendsChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState(7); // Default: last 7 days

  useEffect(() => {
    const fetchTrends = async () => {
      setLoading(true);
      try {
        const response = await axiosClient.get(
          `/api/crm/trends/contacts?range=${range}`
        );
        setData(response.data.result || []);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load contact trends.");
      } finally {
        setLoading(false);
      }
    };

    fetchTrends();
  }, [range]);

  return (
    <div className="bg-white rounded-xl shadow p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">📈 Contacts Added Over Time</h2>
        <div className="flex space-x-2">
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setRange(f.value)}
              className={`px-3 py-1 text-sm rounded-full border 
                ${
                  range === f.value
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-purple-100"
                }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <Spinner message="Loading contact trends..." />
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#8a2be2"
              strokeWidth={3}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export default ContactTrendsChart;
