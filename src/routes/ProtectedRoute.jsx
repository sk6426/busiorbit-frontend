// src/routes/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../pages/auth/context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { isLoading, isAuthenticated, role, plan, status, businessId } =
    useAuth();

  // 🚩 Always log the current context state!
  console.log("🟣 [ProtectedRoute] Render:", {
    isLoading,
    isAuthenticated,
    role,
    plan,
    status,
    businessId,
    path: window.location.pathname,
  });

  // Spinner while checking session
  if (isLoading) {
    console.log("🔄 [ProtectedRoute] Loading spinner shown.");
    return (
      <div className="flex justify-center items-center min-h-screen text-lg text-gray-600">
        Loading...
      </div>
    );
  }

  // 🚩 Main fix: Only check isAuthenticated, NOT businessId directly!
  if (!isAuthenticated) {
    console.log("⛔ [ProtectedRoute] Not authenticated! Redirecting to /login");
    return <Navigate to="/login" replace />;
  }

  console.log("✅ [ProtectedRoute] Authenticated, rendering children:", {
    path: window.location.pathname,
  });

  return children;
};

export default ProtectedRoute;
