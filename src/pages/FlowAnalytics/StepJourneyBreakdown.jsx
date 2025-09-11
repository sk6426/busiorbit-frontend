import React, { useEffect, useState, useCallback } from "react";
import axiosClient from "../../api/axiosClient";
import { toast } from "react-toastify";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";

export default function StepJourneyBreakdown() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    // Data fetching function is inside the effect for dependency safety
    const fetchBreakdown = async () => {
      setLoading(true);
      try {
        let url = "/api/flow-analytics/step-journey-breakdown";
        const params = [];
        if (startDate) params.push(`startDate=${startDate}`);
        if (endDate) params.push(`endDate=${endDate}`);
        if (params.length > 0) url += `?${params.join("&")}`;

        const res = await axiosClient.get(url);
        setData(res.data);
      } catch (err) {
        toast.error("❌ Failed to load step journey breakdown");
      } finally {
        setLoading(false);
      }
    };

    fetchBreakdown();
  }, [startDate, endDate]);

  // Only depends on data (for ESLint, useCallback ensures stable reference)
  const handleExport = useCallback(() => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Journey Breakdown");
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const fileData = new Blob([excelBuffer], {
      type: "application/octet-stream",
    });
    saveAs(fileData, "step_journey_breakdown.xlsx");
  }, [data]);

  const filteredData = data.filter(step =>
    step.templateName?.toLowerCase().includes(search.toLowerCase())
  );

  // Stable callback for row click
  const handleRowClick = useCallback(
    step => {
      console.log("📂 Logs for Step:", step.stepId, step.templateName);
      toast.info(`Open logs for "${step.templateName}"`);
    },
    [] // no dependencies
  );

  if (loading) return <div className="p-4">Loading journey breakdown...</div>;
  if (!data.length)
    return <div className="p-4">No flow journey data available.</div>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-purple-700 mb-4">
        🔍 Step-by-Step Journey Breakdown
      </h2>

      <div className="flex flex-wrap gap-4 mb-4">
        <input
          type="text"
          placeholder="🔍 Search by step name..."
          className="border p-2 rounded w-full sm:w-64"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <input
          type="date"
          className="border p-2 rounded"
          value={startDate}
          onChange={e => setStartDate(e.target.value)}
        />
        <input
          type="date"
          className="border p-2 rounded"
          value={endDate}
          onChange={e => setEndDate(e.target.value)}
        />
        <button
          onClick={handleExport}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          📤 Export Excel
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white shadow rounded-lg">
          <thead>
            <tr className="bg-gray-100 text-gray-600 text-sm uppercase text-left">
              <th className="p-3">Step</th>
              <th className="p-3">Total Reached</th>
              <th className="p-3">Clicked Next</th>
              <th className="p-3">Drop-Off</th>
              <th className="p-3">Conversion %</th>
              <th className="p-3">Drop-Off %</th>
              <th className="p-3">Next Step</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((step, idx) => (
              <tr
                key={idx}
                className="border-t hover:bg-gray-50 text-sm cursor-pointer"
                onClick={() => handleRowClick(step)}
              >
                <td className="p-3 font-medium text-purple-700">
                  {step.templateName}
                </td>
                <td className="p-3">{step.totalReached}</td>
                <td className="p-3">{step.clickedNext}</td>
                <td className="p-3 text-red-600">{step.dropOff}</td>
                <td className="p-3 text-green-600">
                  {step.conversionRate?.toFixed(1) ?? "0.0"}%
                </td>
                <td className="p-3 text-orange-600">
                  {step.dropOffRate?.toFixed(1) ?? "0.0"}%
                </td>
                <td className="p-3 text-gray-500">{step.nextStepId || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
