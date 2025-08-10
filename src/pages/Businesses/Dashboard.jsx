import React from "react";

// We will create and import these widgets in the upcoming steps
// import QuickActionsWidget from '@/components/Dashboard/QuickActionsWidget';
// import CampaignStatsWidget from '@/components/Dashboard/CampaignStatsWidget';
// import CrmGrowthWidget from '@/components/Dashboard/CrmGrowthWidget';
// import TopCampaignsWidget from '@/components/Dashboard/TopCampaignsWidget';

export default function Dashboard() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        {/* Placeholder for a future Date Range Picker */}
      </div>

      {/* Placeholder for Quick Actions */}
      <div className="bg-white p-4 rounded-lg shadow">
        <p className="text-center text-gray-500">
          Quick Actions Widget will be here.
        </p>
      </div>

      {/* Main grid for stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-center text-gray-500">
            Campaign Stats Widget will be here.
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-center text-gray-500">
            CRM Growth Widget will be here.
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow col-span-1 lg:col-span-2">
          <p className="text-center text-gray-500">
            Top Campaigns Widget will be here.
          </p>
        </div>
      </div>
    </div>
  );
}
