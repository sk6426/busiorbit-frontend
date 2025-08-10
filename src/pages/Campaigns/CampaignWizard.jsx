// ✅ CampaignWizard.jsx
import React, { useState } from "react";
import CampaignInfoTab from "./tabs/CampaignInfoTab";
import MessageTypeTab from "./tabs/MessageTypeTab";
import MessageBuilderTab from "./tabs/MessageBuilderTab";
import CTAButtonsTab from "./tabs/CTAButtonsTab";
import RecipientsTab from "./tabs/RecipientsTab";
import PreviewSendTab from "./tabs/PreviewSendTab";

const tabs = [
  { key: "campaign-info", label: "Campaign Info" },
  { key: "message-type", label: "Message Type" },
  { key: "message-builder", label: "Message Builder" },
  { key: "cta-buttons", label: "CTA Buttons" },
  { key: "targeting", label: "Recipients" },
  { key: "preview-send", label: "Preview & Send" },
];

function CampaignWizard() {
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    messageType: "template",
    templateId: "",
    imageUrl: "",
    messageText: "",
    templateParams: [],
    multiButtons: [],
    recipientIds: [],
  });

  const activeTabKey = tabs[activeTabIndex].key;

  const renderTabContent = () => {
    switch (activeTabKey) {
      case "campaign-info":
        return (
          <CampaignInfoTab formData={formData} setFormData={setFormData} />
        );
      case "message-type":
        return <MessageTypeTab formData={formData} setFormData={setFormData} />;
      case "message-builder":
        return (
          <MessageBuilderTab formData={formData} setFormData={setFormData} />
        );
      case "cta-buttons":
        return <CTAButtonsTab formData={formData} setFormData={setFormData} />;
      case "targeting":
        return <RecipientsTab formData={formData} setFormData={setFormData} />;
      case "preview-send":
        return <PreviewSendTab formData={formData} setFormData={setFormData} />;
      default:
        return null;
    }
  };

  const goNext = () => {
    if (activeTabIndex < tabs.length - 1) setActiveTabIndex(activeTabIndex + 1);
  };

  const goBack = () => {
    if (activeTabIndex > 0) setActiveTabIndex(activeTabIndex - 1);
  };

  return (
    <div className="flex min-h-screen">
      {/* Left vertical tab menu */}
      <div className="w-64 border-r p-4 bg-gray-50">
        <h2 className="text-xl font-bold mb-4">Create Campaign</h2>
        <ul className="space-y-2">
          {tabs.map((tab, index) => (
            <li
              key={tab.key}
              className={`cursor-pointer px-3 py-2 rounded ${
                index === activeTabIndex
                  ? "bg-purple-600 text-white"
                  : "hover:bg-purple-100 text-gray-800"
              }`}
              onClick={() => setActiveTabIndex(index)}
            >
              {tab.label}
            </li>
          ))}
        </ul>
      </div>

      {/* Right content area */}
      <div className="flex-1 p-6">
        {renderTabContent()}
        <div className="mt-6 flex justify-between">
          <button
            onClick={goBack}
            disabled={activeTabIndex === 0}
            className="px-4 py-2 bg-gray-300 text-black rounded disabled:opacity-50"
          >
            Back
          </button>
          <button
            onClick={goNext}
            disabled={activeTabIndex === tabs.length - 1}
            className="px-4 py-2 bg-purple-600 text-white rounded"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

export default CampaignWizard;
