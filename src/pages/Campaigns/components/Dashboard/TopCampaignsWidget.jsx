import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { getTopCampaigns } from "@/api/dashboardService";
import Spinner from "@/components/Spinner";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge"; // A standard ShadCN UI component

export default function TopCampaignsWidget() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTopCampaigns = async () => {
      try {
        setLoading(true);
        // We already created this service function in a previous step
        const response = await getTopCampaigns(5); // Fetch top 5
        setCampaigns(response.data);
      } catch (err) {
        setError("Failed to load top campaigns.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTopCampaigns();
  }, []);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-48">
          <Spinner />
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex justify-center items-center h-48">
          <p className="text-red-500">{error}</p>
        </div>
      );
    }

    if (campaigns.length === 0) {
      return (
        <div className="flex justify-center items-center h-48">
          <p className="text-gray-500">
            Send a few campaigns to see your top performers here.
          </p>
        </div>
      );
    }

    return (
      <ul className="space-y-3">
        {campaigns.map((campaign, index) => (
          <li key={campaign.campaignId}>
            <Link
              to={`/campaigns/${campaign.campaignId}`}
              className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="flex items-center justify-center w-7 h-7 mr-4 bg-gray-200 rounded-full font-bold text-gray-600 text-sm">
                    {index + 1}
                  </span>
                  <p className="font-semibold text-gray-800">
                    {campaign.campaignName}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <Badge variant="outline">
                    Read: {campaign.readRate.toFixed(1)}%
                  </Badge>
                  <Badge>CTR: {campaign.clickThroughRate.toFixed(1)}%</Badge>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle>Top Performing Campaigns</CardTitle>
        <CardDescription>
          Ranked by Click-Through Rate (CTR) from all sent campaigns.
        </CardDescription>
      </CardHeader>
      <CardContent>{renderContent()}</CardContent>
    </Card>
  );
}
