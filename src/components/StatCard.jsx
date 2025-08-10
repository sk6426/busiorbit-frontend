import React from "react";

function StatCard({ title, value }) {
  return (
    <div className="bg-white rounded-xl shadow p-4 border border-gray-200">
      <h4 className="text-sm font-medium text-gray-500 mb-1">{title}</h4>
      <p className="text-2xl font-bold text-purple-700">{value}</p>
    </div>
  );
}

export default StatCard;
