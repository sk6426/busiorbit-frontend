// 📄 File: src/routes/AdminRouteGuard.jsx

import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../pages/auth/context/AuthContext";

export default function AdminRouteGuard({ children }) {
  const { role, isLoading } = useAuth();
  const location = useLocation();
  const safeRole = (role || "").toLowerCase();

  if (isLoading) return null;

  const path = location.pathname.toLowerCase();

  // ✅ Full access roles
  const fullAdmins = ["superadmin", "partner", "reseller", "admin"];

  // ✅ Allow if role is full-admin
  if (fullAdmins.includes(safeRole)) {
    return children;
  }

  // ✅ Partial access for business role
  if (safeRole === "business") {
    const allowedPaths = [
      "/app/admin/user-permissions",
      "/app/whatsappsettings/whatsapp-settings",
    ];
    const matched = allowedPaths.some(p => path.startsWith(p));
    if (matched) return children;
  }

  // ❌ Otherwise, block
  return <Navigate to="/no-access" replace />;
}
