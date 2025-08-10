// src/hooks/usePermission.js

export function usePermission(requiredPermission) {
  const authData = localStorage.getItem("xbytechat-auth-data");
  if (!authData) return false;

  try {
    const parsed = JSON.parse(authData);
    const permissions = parsed?.permissions || [];

    return permissions.includes(requiredPermission);
  } catch (err) {
    console.error("❌ Failed to parse permissions from localStorage:", err);
    return false;
  }
}
