import axiosClient from "./axiosClient";

/**
 * Fetches the main campaign status dashboard data.
 */
export const getCampaignStatusDashboard = () => {
  return axiosClient.get("/CampaignAnalytics/status-dashboard");
};

/**
 * Fetches the top performing campaigns.
 * @param {number} count The number of top campaigns to fetch.
 */
export const getTopCampaigns = (count = 5) => {
  return axiosClient.get(`/CampaignAnalytics/top-campaigns?count=${count}`);
};
export const getCrmSummary = () => {
  return axiosClient.get("/CrmAnalytics/summary");
};

/**
 * Fetches the daily new contact trend data for the last 30 days.
 */
export const getCrmContactTrends = () => {
  return axiosClient.get("/CrmAnalytics/contact-trends");
};
