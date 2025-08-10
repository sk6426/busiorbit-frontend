import React from "react";

function Spinner({ message = "Loading...", className = "" }) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-6 ${className}`}
    >
      <div className="animate-spin rounded-full h-8 w-8 border-4 border-purple-600 border-t-transparent mb-2"></div>
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  );
}

export default Spinner;
