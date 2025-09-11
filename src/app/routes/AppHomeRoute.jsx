// src/app/routes/AppHomeRoute.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";

export default function AppHomeRoute() {
  const { isLoading, hasAllAccess, can } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;

    // pick landing by capabilities
    const go = path => navigate(path, { replace: true });

    if (hasAllAccess) return go("/app/dashboard");

    // Messaging first if they have any messaging perm
    const messagingPerms = [
      "messaging.inbox.view",
      "messaging.report.view",
      "messaging.status.view",
      "messaging.send",
      "messaging.send.text",
      "messaging.send.template",
    ];
    if (messagingPerms.some(can)) return go("/app/messaging");

    if (can("dashboard.view")) return go("/app/dashboard");
    if (can("campaign.view")) return go("/app/campaigns");
    if (can("product.view")) return go("/app/catalog");

    // fallback
    return go("/no-access");
  }, [isLoading, hasAllAccess, can, navigate]);

  return null; // shows nothing during the instant redirect
}
