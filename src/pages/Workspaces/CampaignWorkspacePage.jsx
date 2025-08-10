// 📄 src/pages/Workspaces/CampaignWorkspacePage.jsx

import {
  ListChecks,
  FolderKanban,
  PlusCircle,
  Archive,
  Pin,
  ArrowRightCircle,
  MoreVertical,
  FileBarChart,
  Image,
  ImagePlus,
  MessageSquareText,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";
import { useAuth } from "../auth/context/AuthContext";

// 🚨 Plan Upgrade Banner
function UpgradeBanner() {
  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 px-4 py-3 rounded-md mb-6 shadow-sm">
      <p className="font-medium">
        🚀 Unlock advanced campaign tools with a Smart or Advanced plan.
      </p>
      <p className="text-sm mt-1">
        Upgrade now to schedule campaigns, run bulk sends, and more.
      </p>
    </div>
  );
}

const campaignBlocks = [
  {
    id: "campaign-table",
    label: "Campaign List",
    description: "View all your scheduled and sent campaigns.",
    path: "/app/campaigns/list",
    icon: <FolderKanban className="text-purple-600" size={22} />,
    action: "Open Table",
    featureKey: "Campaigns",
  },
  {
    id: "template-single",
    label: "New Campaign",
    description: "Send one-time messages to individual or multiple contacts.",
    path: "/app/campaigns/template-single",
    icon: <ListChecks className="text-indigo-600" size={22} />,
    action: "Send Single",
    featureKey: "Campaigns",
  },
  {
    id: "status-logs",
    label: "Campaign Logs",
    description: "Track delivery status for all sent messages.",
    path: "/app/campaigns/logs/:campaignId",
    icon: <FileBarChart className="text-pink-500" size={22} />,
    action: "View Logs",
    featureKey: "Campaigns",
  },
  {
    id: "cta-management",
    label: "CTA Management",
    description: "Add, edit, or delete campaign CTA buttons as needed.",
    path: "/app/campaigns/cta-management",
    icon: <MessageSquareText className="text-purple-500" size={22} />,
    action: "Call-To-Action",
    featureKey: "Campaigns",
  },
  {
    id: "image-campaign-new",
    label: "New Image Campaign",
    description: "Create and send customise WhatsApp campaigns.",
    path: "/app/campaigns/create-image-campaign",
    icon: <ImagePlus className="text-purple-500" size={22} />,
    action: "Catalog Campaign",
    featureKey: "Campaigns",
  },
  {
    id: "image-campaign-list",
    label: "Image Campaigns List",
    description: "Manage, review, or duplicate your image campaigns.",
    path: "/app/campaigns/ImageCampaignListPage",
    icon: <Image className="text-purple-500" size={22} />,
    action: "Image Campign List",
    featureKey: "Campaigns",
  },
  {
    id: "image-assign-contact",
    label: "Campaigns Dashboard",
    description: "Assign or remove contacts for a selected campaign.",
    path: "/app/campaigns/dashboard/:campaignId",
    icon: <Image className="text-purple-500" size={22} />,
    action: "Open Dashboard",
    featureKey: "Campaigns",
  },
  {
    id: "campaign-builder",
    label: "Campaign Builder (New Flow)",
    description: "Launch a multi-step campaign using Meta templates.",
    path: "/app/campaigns/template-campaign-builder",
    icon: <PlusCircle className="text-green-600" size={22} />,
    action: "Create Campaign-Template",
    featureKey: "Campaigns",
  },
  {
    id: "template-campaign-list",
    label: "template Campaign (New Flow)",
    description: "View and manage Meta template-based campaigns.",
    path: "/app/campaigns/template-campaigns-list",
    icon: <PlusCircle className="text-green-600" size={22} />,
    action: "Template Campaign List",
    featureKey: "Campaigns",
  },
  {
    id: "CampaignWizard",
    label: "Campaign Wizard (New)",
    description:
      "Build a campaign using wizard steps: Text, Image, or Template.",
    path: "/app/campaigns/CampaignWizard",
    icon: <PlusCircle className="text-green-600" size={22} />,
    action: "Campaign Wizard",
    featureKey: "Campaigns",
  },
  {
    id: "TrackingViewer",
    label: "Tracking Logs",
    description: "See detailed logs for campaign interactions and events.",
    path: "/app/tracking/logs",
    icon: <PlusCircle className="text-green-600" size={22} />,
    action: "View Campaign Logs",
    featureKey: "Campaigns",
  },
];

export default function CampaignWorkspacePage() {
  const navigate = useNavigate();
  const { plan, availableFeatures = {}, isLoading } = useAuth();

  const [pinned, setPinned] = useState(() =>
    JSON.parse(localStorage.getItem("campaign-pinned") || "[]")
  );
  const [archived, setArchived] = useState(() =>
    JSON.parse(localStorage.getItem("campaign-archived") || "[]")
  );
  const [order, setOrder] = useState(
    () =>
      JSON.parse(localStorage.getItem("campaign-order")) ||
      campaignBlocks.map(b => b.id)
  );

  const togglePin = id => {
    const updated = pinned.includes(id)
      ? pinned.filter(i => i !== id)
      : [...pinned, id];
    setPinned(updated);
    localStorage.setItem("campaign-pinned", JSON.stringify(updated));
  };

  const toggleArchive = id => {
    const updated = archived.includes(id)
      ? archived.filter(i => i !== id)
      : [...archived, id];
    setArchived(updated);
    localStorage.setItem("campaign-archived", JSON.stringify(updated));
  };

  const onDragEnd = result => {
    if (!result.destination) return;
    const newOrder = Array.from(order);
    const [moved] = newOrder.splice(result.source.index, 1);
    newOrder.splice(result.destination.index, 0, moved);
    setOrder(newOrder);
    localStorage.setItem("campaign-order", JSON.stringify(newOrder));
  };

  const hasFeature = key => availableFeatures[key];

  const hasPlan = requiredPlan => {
    const tiers = ["trial", "basic", "smart", "advanced"];
    const userTier = tiers.indexOf(plan?.toLowerCase() || "basic");
    const requiredTier = tiers.indexOf(requiredPlan?.toLowerCase() || "basic");
    return userTier >= requiredTier;
  };

  const visibleBlocks = order
    .filter(id => {
      const block = campaignBlocks.find(b => b.id === id);
      if (!block || archived.includes(id)) return false;
      if (block.featureKey && !hasFeature(block.featureKey)) return false;
      if (block.requiredPlan && !hasPlan(block.requiredPlan)) return false;
      return true;
    })
    .map(id => campaignBlocks.find(b => b.id === id));

  if (isLoading)
    return (
      <div className="p-10 text-center text-lg text-gray-500">
        Loading features…
      </div>
    );

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-purple-800 mb-4">
        📦 Campaign Workspace
      </h2>

      {/* 🚨 Plan Banner */}
      {plan === "basic" && <UpgradeBanner />}

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="campaign-blocks" direction="horizontal">
          {provided => (
            <div
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6"
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              {visibleBlocks.map((block, index) => (
                <Draggable key={block.id} draggableId={block.id} index={index}>
                  {provided => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className="bg-white rounded-md border shadow-sm hover:shadow-md transition transform hover:-translate-y-0.5 duration-200"
                    >
                      <div className="flex items-start gap-4 p-5">
                        <div className="bg-gray-100 rounded-md p-2">
                          {block.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-md font-semibold text-purple-700">
                            {block.label}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {block.description}
                          </p>
                        </div>
                        <MoreVertical size={16} className="text-gray-400" />
                      </div>
                      <div className="px-5 py-3 border-t border-gray-200 flex items-center justify-between">
                        <button
                          onClick={() => navigate(block.path)}
                          className="text-sm text-purple-600 font-medium flex items-center gap-1 hover:text-purple-800"
                        >
                          {block.action} <ArrowRightCircle size={18} />
                        </button>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => togglePin(block.id)}
                            title="Pin this"
                          >
                            <Pin
                              size={18}
                              className={
                                pinned.includes(block.id)
                                  ? "text-red-600"
                                  : "text-gray-400 hover:text-red-500"
                              }
                            />
                          </button>
                          <button
                            onClick={() => toggleArchive(block.id)}
                            title="Archive this"
                          >
                            <Archive
                              size={18}
                              className={
                                archived.includes(block.id)
                                  ? "text-indigo-600"
                                  : "text-gray-400 hover:text-indigo-500"
                              }
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}
