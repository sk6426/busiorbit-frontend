import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import { toast } from "react-toastify";
import WhatsAppBubblePreview from "./components/WhatsAppBubblePreview";
import CampaignButtonsForm from "./components/CampaignButtonsForm";

function ImageCampaignPage() {
  const navigate = useNavigate();

  const [campaign, setCampaign] = useState({
    name: "",
    messageTemplate: "",
    imageUrl: "",
    imageCaption: "",
    multiButtons: [], // ✅ Only buttons now
  });

  const [submitting, setSubmitting] = useState(false);

  const handleChange = e => {
    const { name, value } = e.target;
    setCampaign(prev => ({ ...prev, [name]: value }));
  };

  const handleButtonsChange = updatedButtons => {
    setCampaign(prev => ({ ...prev, multiButtons: updatedButtons }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await axiosClient.post(
        "/campaign/create-image-campaign",
        campaign
      );
      toast.success("✅ Campaign created successfully");

      const newCampaignId = res?.data?.campaignId || res?.data?.id;
      if (newCampaignId) {
        // 🔁 Auto-redirect to Assign Contacts page
        navigate(
          `/app/campaigns/image-campaigns/assign-contacts/${newCampaignId}`
        );
      }

      setCampaign({
        name: "",
        messageTemplate: "",
        imageUrl: "",
        imageCaption: "",
        multiButtons: [],
      });
    } catch (err) {
      toast.error("❌ Error creating campaign");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow-xl rounded-2xl">
      <h2 className="text-2xl font-bold mb-6 text-purple-600">
        📷 Create Image Campaign
      </h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        <input
          type="text"
          name="name"
          placeholder="Campaign Name"
          value={campaign.name}
          onChange={handleChange}
          className="w-full p-3 border border-gray-300 rounded-xl"
          required
        />

        <textarea
          name="messageTemplate"
          placeholder="Message Template"
          rows={3}
          value={campaign.messageTemplate}
          onChange={handleChange}
          className="w-full p-3 border border-gray-300 rounded-xl"
          required
        />

        <input
          type="text"
          name="imageUrl"
          placeholder="Image URL"
          value={campaign.imageUrl}
          onChange={handleChange}
          className="w-full p-3 border border-gray-300 rounded-xl"
        />

        <input
          type="text"
          name="imageCaption"
          placeholder="Image Caption (optional)"
          value={campaign.imageCaption}
          onChange={handleChange}
          className="w-full p-3 border border-gray-300 rounded-xl"
        />

        {/* 🔘 Multi-Button Config Only */}
        <CampaignButtonsForm
          buttons={campaign.multiButtons}
          onChange={handleButtonsChange}
        />

        {/* 🟢 Live Preview */}
        {campaign.messageTemplate && (
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Preview:</label>
            <WhatsAppBubblePreview
              messageTemplate={campaign.messageTemplate}
              imageUrl={campaign.imageUrl}
              caption={campaign.imageCaption}
              multiButtons={campaign.multiButtons}
            />
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="bg-purple-600 text-white py-3 px-6 rounded-xl hover:bg-purple-700 transition"
        >
          {submitting ? "Creating..." : "Create Campaign"}
        </button>
      </form>
    </div>
  );
}

export default ImageCampaignPage;
