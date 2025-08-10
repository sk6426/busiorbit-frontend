import { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Legend,
} from "recharts";

const COLORS = ["#10B981", "#EF4444"];

function Dashboard() {
  const [stats, setStats] = useState({
    totalMessages: 0,
    successCount: 0,
    failCount: 0,
  });

  const [logs, setLogs] = useState([]);

  useEffect(() => {
    // Simulated API data fetch
    setTimeout(() => {
      setStats({
        totalMessages: 120,
        successCount: 100,
        failCount: 20,
      });

      setLogs([
        {
          name: "Rahul",
          phone: "+919876543210",
          message: "Hello",
          status: "Success",
          createdAt: "2025-04-03 12:00",
        },
        {
          name: "Anjali",
          phone: "+919812345678",
          message: "Test",
          status: "Failed",
          createdAt: "2025-04-03 12:10",
        },
      ]);
    }, 500);
  }, []);

  const chartData = [
    { name: "Success", value: stats.successCount },
    { name: "Failed", value: stats.failCount },
  ];

  const lineData = logs.map((log, index) => ({
    name: log.createdAt,
    Success: log.status === "Success" ? 1 : 0,
    Failed: log.status === "Failed" ? 1 : 0,
  }));

  return (
    <div className="space-y-10">
      {/* Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-sm text-gray-500 mb-1">Total Messages</h3>
          <p className="text-3xl font-bold text-purple-600">
            {stats.totalMessages}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-sm text-gray-500 mb-1">Successful</h3>
          <p className="text-3xl font-bold text-green-500">
            {stats.successCount}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-sm text-gray-500 mb-1">Failed</h3>
          <p className="text-3xl font-bold text-red-500">{stats.failCount}</p>
        </div>
      </div>

      {/* Pie Chart */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Message Success Rate</h3>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              outerRadius={80}
              label
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Line Chart */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold mb-4">
          Success vs Failed Over Time
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={lineData}>
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="Success"
              stroke="#10B981"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="Failed"
              stroke="#EF4444"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Message Log Table */}
      <div className="bg-white rounded-xl shadow p-6 overflow-auto">
        <h3 className="text-lg font-semibold mb-4">Recent Message Logs</h3>
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="text-gray-600 border-b">
              <th className="p-2">Name</th>
              <th className="p-2">Phone</th>
              <th className="p-2">Message</th>
              <th className="p-2">Status</th>
              <th className="p-2">Time</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, index) => (
              <tr key={index} className="border-t">
                <td className="p-2">{log.name}</td>
                <td className="p-2">{log.phone}</td>
                <td className="p-2">{log.message}</td>
                <td
                  className={`p-2 font-medium ${
                    log.status === "Success" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {log.status}
                </td>
                <td className="p-2">{log.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Dashboard;
