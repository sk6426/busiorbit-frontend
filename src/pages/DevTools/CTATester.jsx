import React, { useState, useEffect } from "react";
import axiosClient from "../../api/axiosClient";
import { toast } from "react-toastify";

function CTATester() {
  const [form, setForm] = useState({
    templateId: "",
    userPhone: "",
    refMessageId: "",
    buttonText: "",
    ctaJourney: "",
  });

  const [logs, setLogs] = useState([]);

  const updateField = (key, value) => {
    setForm(f => ({ ...f, [key]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();

    try {
      const payload = {
        businessId: form.businessId.trim(),
        templateId: form.templateId.trim(),
        userPhone: form.userPhone.trim(),
        refMessageId: form.refMessageId.trim(),
        buttonText: form.buttonText.trim(),
        ctaJourney: form.ctaJourney.trim() || form.buttonText.trim(),
      };

      const res = await axiosClient.post(
        "/catalog-tracking/log-click",
        payload
      );
      if (res.data.success) {
        toast.success("✅ Click simulated successfully!");
        fetchRecentLogs();
      } else {
        toast.error("⚠️ API responded but not successful.");
      }
    } catch (err) {
      console.error(err);
      toast.error("❌ Failed to simulate CTA click.");
    }
  };

  const fetchRecentLogs = async () => {
    try {
      const res = await axiosClient.get("/catalog-tracking/recent?limit=10");
      setLogs(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to load logs", err);
    }
  };

  useEffect(() => {
    fetchRecentLogs();
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-6 py-6 bg-white shadow-lg rounded-2xl mt-6 space-y-6">
      {/* 🧪 CTA Simulation Form */}
      <div>
        <h2 className="text-2xl font-bold text-purple-700 mb-4">
          🧪 CTA Tester (Simulate Clicks)
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Template ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Business ID
            </label>
            <input
              type="text"
              value={form.businessId}
              onChange={e => updateField("businessId", e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-400"
              placeholder="Business ID"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Template ID
            </label>
            <input
              type="text"
              value={form.templateId}
              onChange={e => updateField("templateId", e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-400"
              placeholder="Template GUID"
            />
          </div>

          {/* User Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              User Phone
            </label>
            <input
              type="text"
              value={form.userPhone}
              onChange={e => updateField("userPhone", e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-400"
              placeholder="+91..."
            />
          </div>

          {/* Ref Message ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ref Message ID
            </label>
            <input
              type="text"
              value={form.refMessageId}
              onChange={e => updateField("refMessageId", e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-400"
              placeholder="wamid.HBgMT..."
            />
          </div>

          {/* Button Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Button Text
            </label>
            <input
              type="text"
              value={form.buttonText}
              onChange={e => updateField("buttonText", e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-400"
              placeholder="Buy Now"
            />
          </div>

          {/* CTA Journey */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CTA Journey (Optional)
            </label>
            <input
              type="text"
              value={form.ctaJourney}
              onChange={e => updateField("ctaJourney", e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-400"
              placeholder="BuyNow | HowToUse | Ingredients"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-purple-600 text-white py-2 rounded-lg font-semibold hover:bg-purple-700 transition"
          >
            🚀 Simulate Click
          </button>
        </form>
      </div>

      {/* 📜 Recent Logs Section */}
      <div className="bg-gray-50 p-4 rounded-xl shadow-inner">
        <h2 className="text-lg font-semibold text-purple-700 mb-3">
          🕵️ Recent Simulated Clicks
        </h2>

        {logs.length === 0 ? (
          <p className="text-sm text-gray-500">No simulated clicks yet.</p>
        ) : (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {logs.map((log, idx) => (
              <div
                key={idx}
                className="border p-3 rounded-md text-sm bg-white flex flex-col"
              >
                <span>
                  <strong>📞 Phone:</strong> {log.userPhone}
                </span>
                <span>
                  <strong>🔘 CTA:</strong> {log.buttonText || log.ctaJourney}
                </span>
                <span>
                  <strong>🆔 Template:</strong> {log.templateId || "—"}
                </span>
                <span>
                  <strong>🕒 Time:</strong>{" "}
                  {new Date(log.clickedAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CTATester;
