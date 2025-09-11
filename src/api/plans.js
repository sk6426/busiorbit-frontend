import axiosClient from "./axiosClient";

export const getPlans = () => axiosClient.get("/Plan");

export const createPlan = data => axiosClient.post("/Plan/Create", data);
export async function updatePlan(planId, updatedData) {
  return axiosClient.put(`/plan/${planId}`, updatedData);
}

export const getPlanPermissions = planId =>
  axiosClient.get(`/Plan/${planId}/permissions`);

// export const updatePlanPermissions = (planId, permissionIds) =>
//   axiosClient.post(`/Plan/${planId}/permissions`, permissionIds);

export const deletePlan = planId => axiosClient.delete(`/Plan/${planId}`);

export const getGroupedPermissions = () =>
  axiosClient.get("/Permission/grouped");

export const updatePlanPermissions = async (planId, permissionIds) => {
  const res = await axiosClient.post(
    `/Plan/${planId}/permissions`,
    permissionIds
  );
  // ✅ Immediately fetch updated permissions from cache
  const updatedPermissions = await getPlanPermissions(planId);

  return {
    message: res.data?.message || "Permissions updated successfully",
    permissions: updatedPermissions.data || [],
  };
};
