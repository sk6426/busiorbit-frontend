import axiosClient from "../utils/axiosClient";

export const getAllPermissions = () => axiosClient.get("/permissions");
export const getGroupedPermissions = async () => {
  const response = await axiosClient.get("/api/Permission/grouped");
  return response.data.data; // <- this ensures you're extracting the nested `data` key
};
