// 📄 File: src/pages/PublishedFlowView.jsx

import React, { useEffect, useState } from "react";
import axiosClient from "../../api/axiosClient";
import { useNavigate } from "react-router-dom";

const PublishedFlowView = () => {
  const [flow, setFlow] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPublishedFlow = async () => {
      try {
        const res = await axiosClient.get("/cta-flow/drafts");
        setFlow(res.data);
      } catch (err) {
        console.error("❌ Error fetching published flow", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPublishedFlow();
  }, []);

  if (loading) return <p className="p-4">Loading published flow...</p>;

  if (!flow)
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-700 mb-2">
          Published Flow
        </h2>
        <p className="text-gray-500">No published flow available.</p>
      </div>
    );

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-purple-700 mb-4">
        🌐 Published Flow: {flow.flowName}
      </h2>

      <div className="space-y-4">
        {flow.steps.map((step, index) => (
          <div
            key={step.id}
            className="border border-purple-300 rounded-lg p-4 shadow-sm bg-white"
          >
            <div className="font-bold text-purple-800">
              Step {index + 1}: {step.templateToSend}
            </div>
            {step.triggerButtonText && (
              <div className="text-sm text-gray-600 mt-1">
                🔘 Triggered by: <b>{step.triggerButtonText}</b> (
                {step.triggerButtonType})
              </div>
            )}
            {step.buttonLinks?.length > 0 && (
              <div className="mt-2 text-sm">
                ➡️ Next Buttons:
                <ul className="list-disc list-inside text-gray-700">
                  {step.buttonLinks.map((btn, i) => (
                    <li key={i}>
                      <b>{btn.buttonText}</b> → Next Step: {btn.nextStepId}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6">
        <button
          onClick={() => navigate("/cta-flow-builder?mode=view&id=" + flow.id)}
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
        >
          👁️ View in Builder
        </button>
      </div>
    </div>
  );
};

export default PublishedFlowView;
