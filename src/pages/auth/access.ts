// Shared helpers so tests/guards use identical logic

export function canUseFeature({
  role,
  hasAllAccess = false,
  availableFeatures = {},
  required,
}: {
  role?: string;
  hasAllAccess?: boolean;
  availableFeatures?: Record<string, boolean>;
  required?: { role?: string[]; featureKeys?: string[] };
}): boolean {
  if (!required) return true;
  if (hasAllAccess || role === "superadmin") return true;

  if (required.role && !required.role.includes(role ?? "")) return false;

  if (required.featureKeys?.length) {
    return required.featureKeys.every(k => !!availableFeatures[k]);
  }
  return true;
}

export function hasRequiredPerms({
  can,
  perms,
  requireAll = false,
  hasAllAccess = false,
}: {
  can?: (perm: string) => boolean;
  perms?: string[]; // e.g. ["messaging.inbox.view"]
  requireAll?: boolean;
  hasAllAccess?: boolean;
}): boolean {
  if (!perms?.length) return true;
  if (hasAllAccess) return true;
  if (!can) return false;
  return requireAll ? perms.every(p => can(p)) : perms.some(p => can(p));
}
