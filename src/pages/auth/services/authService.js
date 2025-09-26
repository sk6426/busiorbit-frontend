import axiosClient, { TOKEN_KEY } from "../../../api/axiosClient";
import { getAuthFromToken } from "../../../utils/jwt";

function toArray(csv) {
  return String(csv || "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);
}

export const login = async (email, password) => {
  try {
    const { data } = await axiosClient.post("/login", { email, password });

    const token = data?.token;
    if (!token) {
      const msg = data?.message || "❌ Login failed.";
      const e = new Error(msg);
      e.isCustom = true;
      throw e;
    }

    // Store token
    localStorage.setItem(TOKEN_KEY, token);

    // Decode & normalize auth info from JWT
    const auth = getAuthFromToken(); // { isAuth, role, name, planId, businessId, hasAllAccess, permissionsCsv, featuresCsv, ... }

    // 🔧 Back-compat keys used in a few places
    if (auth?.role) localStorage.setItem("role", auth.role); // used by some admin pages
    localStorage.setItem(
      "xbytechat-auth-data",
      JSON.stringify({
        role: auth?.role ?? "business",
        name: auth?.name ?? "",
        planId: auth?.planId ?? null,
        businessId: auth?.businessId ?? null,
        hasAllAccess: !!auth?.hasAllAccess,
        // convert CSV in token → arrays for hooks like usePermission()
        permissions: toArray(auth?.permissionsCsv),
        features: toArray(auth?.featuresCsv),
        status: auth?.status ?? "active",
      })
    );

    // Hand back detail so the UI can decide where to route
    return {
      success: true,
      role: auth?.role ?? "business",
      status: (auth?.status || "active").toLowerCase(), // e.g. "profilepending"
      hasAllAccess: !!auth?.hasAllAccess,
      planId: auth?.planId ?? null,
      businessId: auth?.businessId ?? null,
    };
  } catch (err) {
    const msg =
      err?.response?.data?.message || err?.message || "❌ Login failed.";
    const e = new Error(msg);
    e.code = err?.response?.status;
    e.isCustom = true;
    throw e;
  }
};

export const logout = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem("role");
    localStorage.removeItem("xbytechat-auth-data");
  } catch {
    /* no-op */
  }
};
