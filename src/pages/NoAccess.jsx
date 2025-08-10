import React from "react";
import { Link } from "react-router-dom";
import { ShieldOff } from "lucide-react";

function NoAccess() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="max-w-md bg-white shadow-lg rounded-lg p-8 text-center border border-red-200">
        <div className="text-red-500 mb-4 flex justify-center">
          <ShieldOff size={48} />
        </div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
          Access Denied
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          🚫 You do not have permission to view this page.
          <br />
          Please contact your admin if you believe this is a mistake.
        </p>
        <Link
          to="/login"
          className="inline-block bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-md text-sm transition"
        >
          Back to Login
        </Link>
      </div>
    </div>
  );
}

export default NoAccess;
