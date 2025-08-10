// ✅ CampaignInfoTab.jsx
import React from "react";

function CampaignInfoTab({ formData, setFormData }) {
  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div>
      <h3 className="text-2xl font-semibold mb-4">Campaign Info</h3>

      {/* Campaign Name */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Campaign Name</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="w-full border rounded px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="Enter a campaign name"
        />
      </div>

      {/* Campaign Description */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">
          Description (optional)
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          className="w-full border rounded px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          rows={3}
          placeholder="Add some notes about this campaign"
        />
      </div>
    </div>
  );
}

export default CampaignInfoTab;
