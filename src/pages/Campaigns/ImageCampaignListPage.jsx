// ✅ File: src/pages/Campaigns/ImageCampaignListPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import { toast } from "react-toastify";

function ImageCampaignListPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingId, setSendingId] = useState(null); // ✅ Track sending status
  const navigate = useNavigate();

  // ✅ Load campaigns on mount
  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const res = await axiosClient.get(
          "Campaign/get-image-campaign?type=image"
        );
        setCampaigns(res.data || []);
      } catch (err) {
        toast.error("Failed to load campaigns");
      } finally {
        setLoading(false);
      }
    };
    fetchCampaigns();
  }, []);

  const handleEdit = id => navigate(`/app/campaign/image-campaigns/${id}/edit`);

  const handleDelete = async id => {
    if (!window.confirm("Are you sure you want to delete this campaign?"))
      return;
    try {
      await axiosClient.delete(`/campaign/${id}`);
      setCampaigns(prev => prev.filter(c => c.id !== id));
      toast.success("Campaign deleted");
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  // ✅ Use MessageEngine API
  const handleSend = async id => {
    setSendingId(id);
    try {
      await axiosClient.post(`/messageengine/send-image-campaign/${id}`);
      toast.success("🚀 Campaign sent successfully!");
    } catch (err) {
      console.error("❌ Failed to send image campaign:", err);
      toast.error("❌ Sending campaign failed");
    } finally {
      setSendingId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h2 className="text-2xl font-bold mb-4 text-purple-700">
        🖼️ Image Campaigns
      </h2>

      {loading ? (
        <p className="text-gray-500">Loading campaigns...</p>
      ) : campaigns.length === 0 ? (
        <div className="bg-yellow-100 text-yellow-700 p-4 rounded-lg shadow-sm">
          No image campaigns found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {campaigns.map(campaign => (
            <div
              key={campaign.id}
              className="bg-white border rounded-xl shadow hover:shadow-lg transition"
            >
              <img
                src={campaign.imageUrl}
                onError={e => {
                  e.target.onerror = null;
                  e.target.src = "/placeholder.jpg";
                }}
                alt={campaign.name}
                className="w-full h-48 object-contain rounded-t-xl bg-gray-50"
              />

              <div className="p-4 space-y-2">
                <h3 className="text-lg font-semibold">{campaign.name}</h3>
                <p className="text-sm text-gray-600">
                  {campaign.imageCaption || "No caption"}
                </p>
                <p className="text-sm text-gray-500 italic">
                  CTA: {campaign.ctaTitle || "—"}
                </p>
                <p className="text-sm text-gray-400 whitespace-pre-wrap">
                  📄 {campaign.messageTemplate?.slice(0, 200) || "No message"}
                </p>
                <p className="text-sm text-gray-400">
                  🎯 Recipients:{" "}
                  <span
                    className={
                      campaign.recipientCount === 0
                        ? "text-red-600 font-semibold"
                        : ""
                    }
                  >
                    {campaign.recipientCount || 0}
                  </span>
                </p>

                <div className="flex justify-end gap-4 pt-2 flex-wrap">
                  {campaign.recipientCount === 0 && (
                    <button
                      onClick={() =>
                        navigate(
                          `/app/campaigns/image-campaigns/contact-assignto-camapign/${campaign.id}`
                        )
                      }
                      className="text-sm text-purple-600 hover:underline font-semibold"
                    >
                      🎯 Assign Contacts
                    </button>
                  )}

                  <button
                    onClick={() =>
                      navigate(
                        `/app/campaigns/image-campaigns/assigned-contacts/${campaign.id}`
                      )
                    }
                    className="text-sm text-indigo-600 hover:underline"
                  >
                    View Recipients
                  </button>

                  <button
                    onClick={() => handleEdit(campaign.id)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => handleDelete(campaign.id)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Delete
                  </button>

                  <button
                    disabled={
                      !campaign.recipientCount || sendingId === campaign.id
                    }
                    title={
                      campaign.recipientCount
                        ? "Send this campaign now"
                        : "Assign contacts first"
                    }
                    onClick={() => handleSend(campaign.id)}
                    className={`text-sm font-medium ${
                      campaign.recipientCount
                        ? "text-green-600 hover:underline"
                        : "text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    {sendingId === campaign.id ? "Sending..." : "🚀 Send"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ImageCampaignListPage;
