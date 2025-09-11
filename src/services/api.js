import axios from "axios";

// Use a global variable or hardcoded fallback instead of import.meta.env
const API_BASE = // window.API_BASE_URL ||
(process.env.REACT_APP_API_BASE_URL || "http://localhost:7113/api").replace(
  /\/$/,
  ""
);

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

// Plans API
export const getPlans = () => api.get("/plans");
export const getPlanPermissions = planId =>
  api.get(`/plans/${planId}/permissions`);
export const updatePlanPermissions = (planId, permissions) =>
  api.put(`/plans/${planId}/permissions`, permissions);

// Permissions API
export const getAllPermissions = () => api.get("/permissions");
