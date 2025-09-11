// src/auth/guardLogger.ts
export function logGuard(event: {
  where: string; // "ProtectedRoute:/app/admin/plan-manager"
  role: string;
  plan?: string;
  required?: { role?: string[]; featureKeys?: string[] };
  availableFeatures?: Record<string, boolean>;
  allowed: boolean;
}) {
  if (process.env.NODE_ENV === "production") return;
  // eslint-disable-next-line no-console
  console.info("[guard]", event);
}
