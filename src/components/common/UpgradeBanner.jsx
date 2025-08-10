// src/components/common/UpgradeBanner.jsx

import { useNavigate } from "react-router-dom";

export default function UpgradeBanner({
  required = "smart",
  current = "basic",
}) {
  const navigate = useNavigate();

  const plans = { basic: 0, smart: 1, advanced: 2 };

  if (plans[current] >= plans[required]) return null;

  return (
    <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 px-4 py-3 rounded mb-4 shadow-sm">
      <div className="flex justify-between items-center">
        <p className="text-sm">
          This feature requires{" "}
          <strong className="capitalize">{required}</strong> plan or higher.
        </p>
        <button
          onClick={() => navigate("/dashboard/upgrade")}
          className="ml-4 bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 text-xs rounded"
        >
          Upgrade Plan
        </button>
      </div>
    </div>
  );
}
