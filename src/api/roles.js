import api from "./_base"; // your axios instance

export const getRoles = () => api.get("/api/roles");
export const createRole = payload => api.post("/api/roles", payload);
export const updateRole = (id, payload) => api.put(`/api/roles/${id}`, payload);
export const deleteRole = id => api.delete(`/api/roles/${id}`);

// returns: array of permission objects OR codes
export const getRolePermissions = roleId =>
  api.get(`/api/roles/${roleId}/permissions`);

// body: array of permissionIds (GUIDs)
export const updateRolePermissions = (roleId, permissionIds) =>
  api.put(`/api/roles/${roleId}/permissions`, { permissionIds });
