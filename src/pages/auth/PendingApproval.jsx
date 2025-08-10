// src/pages/auth/PendingApproval.jsx
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Clock } from "lucide-react";
import { toast } from "react-toastify";

export default function PendingApproval() {
  const navigate = useNavigate();

  useEffect(() => {
    const hasSeen = sessionStorage.getItem("seen-pending-toast");
    if (!hasSeen) {
      toast.info(
        "⏳ Your business is still under review. Please wait for admin approval."
      );
      sessionStorage.setItem("seen-pending-toast", "true");
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-purple-50 px-4">
      <div className="bg-white max-w-md w-full p-8 rounded-2xl shadow-xl text-center">
        <div className="bg-purple-100 text-purple-700 inline-block p-4 rounded-full mb-4">
          <Clock size={40} />
        </div>
        <h2 className="text-2xl font-bold text-purple-800 mb-2">
          Business Approval Pending
        </h2>
        <p className="text-sm text-gray-700 mb-4">
          Your account has been created successfully, but your business profile
          is under review. You will be notified once it is approved.
        </p>
        <button
          onClick={() => navigate("/login")}
          className="mt-4 bg-purple-600 text-white px-5 py-2 rounded-lg hover:bg-purple-700 transition"
        >
          🔙 Back to Login
        </button>
      </div>
    </div>
  );
}
