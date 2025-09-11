// src/context/AuthContext.jsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { getAuthFromToken } from "../../utils/authUtils";
import axiosClient from "../../api/axiosClient";
import { toast } from "react-toastify";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(() => {
    const initial = getAuthFromToken();
    return {
      ...initial,
      permissions: new Set(initial?.permissions || []), // always Set
    };
  });

  // 🔄 Refresh permissions from backend
  const fetchPermissions = useCallback(async () => {
    try {
      const { data } = await axiosClient.get("/plan/me/permissions");
      if (data?.permissions?.length) {
        setAuth(prev => ({
          ...prev,
          permissions: new Set(data.permissions),
        }));
      }
    } catch (err) {
      console.warn("⚠️ Could not fetch permissions", err);
      toast.error("Failed to load permissions");
    }
  }, []);

  // Load once at mount
  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const hasPermission = useCallback(
    perm => auth.permissions?.has("*") || auth.permissions?.has(perm),
    [auth.permissions]
  );

  const value = {
    auth,
    setAuth,
    hasPermission,
    hasAllAccess: auth.permissions?.has("*"),
    refreshPermissions: fetchPermissions,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
