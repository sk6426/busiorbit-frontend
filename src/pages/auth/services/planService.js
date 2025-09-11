// // src/pages/auth/services/planService.js
// import axiosClient from "../../../api/axiosClient";

// // simple in-memory cache for plan lookups
// const planCache = new Map();

// /**
//  * Normalize a backend plan name/code to one of: trial | basic | smart | advanced
//  * Tweak this mapping to match your DB values exactly.
//  */
// function normalizePlanTier(plan) {
//   if (!plan) return "";
//   const raw = (plan.tier || plan.code || plan.name || "")
//     .toString()
//     .trim()
//     .toLowerCase();

//   if (["trial", "free"].includes(raw)) return "trial";
//   if (["basic", "starter"].includes(raw)) return "basic";
//   if (["smart", "pro", "standard"].includes(raw)) return "smart";
//   if (["advanced", "enterprise"].includes(raw)) return "advanced";
//   // fallback: try partial matches
//   if (raw.includes("trial")) return "trial";
//   if (raw.includes("basic") || raw.includes("start")) return "basic";
//   if (raw.includes("smart") || raw.includes("pro")) return "smart";
//   if (raw.includes("advanced") || raw.includes("enter")) return "advanced";
//   return raw; // unknown tier, return as-is
// }

// /**
//  * Fetch plan by id (cached). Expects API to return something like:
//  * { id, name, code, tier, description }
//  */
// export async function getPlanById(planId) {
//   if (!planId) return null;
//   if (planCache.has(planId)) return planCache.get(planId);

//   // Adjust endpoint to your backend route if different:
//   const { data } = await axiosClient.get(`/plans/${planId}`);
//   const plan = data?.data || data || null;

//   const normalized = plan
//     ? {
//         id: plan.id || planId,
//         name: plan.name || "",
//         code: plan.code || "",
//         tier: normalizePlanTier(plan),
//         description: plan.description || "",
//       }
//     : null;

//   planCache.set(planId, normalized);
//   return normalized;
// }

// src/pages/auth/services/planService.js
import axiosClient from "../../../api/axiosClient";

const planCache = new Map();

function normalizePlanTier(plan) {
  if (!plan) return "";
  const raw = (plan.tier || plan.code || plan.name || "")
    .toString()
    .trim()
    .toLowerCase();

  if (["trial", "free"].includes(raw)) return "trial";
  if (["basic", "starter"].includes(raw)) return "basic";
  if (["smart", "pro", "standard"].includes(raw)) return "smart";
  if (["advanced", "enterprise"].includes(raw)) return "advanced";
  if (raw.includes("trial")) return "trial";
  if (raw.includes("basic") || raw.includes("start")) return "basic";
  if (raw.includes("smart") || raw.includes("pro")) return "smart";
  if (raw.includes("advanced") || raw.includes("enter")) return "advanced";
  return raw;
}

function pickPayload(data) {
  // handle {data:{...}}, {success, data:{...}}, or raw object
  if (!data) return null;
  if (data.data && typeof data.data === "object") return data.data;
  return data;
}

export async function getPlanById(planId) {
  if (!planId) return null;

  const id = encodeURIComponent(String(planId).trim());
  if (planCache.has(id)) return planCache.get(id);

  let payload = null;
  let lastErr;

  // Try RESTful style: /plans/{id}
  try {
    const res1 = await axiosClient.get(`/plans/${id}`);
    payload = pickPayload(res1.data);
  } catch (e) {
    lastErr = e;
  }

  // Fallback to query style: /plans?id={id}
  if (!payload) {
    try {
      const res2 = await axiosClient.get(`/plans`, { params: { id } });
      payload = pickPayload(res2.data);
    } catch (e) {
      lastErr = e;
    }
  }

  if (!payload) {
    // bubble up a useful message
    const status = lastErr?.response?.status;
    const msg =
      lastErr?.response?.data?.message ||
      lastErr?.message ||
      `Failed to fetch plan (${status || "no response"})`;
    throw new Error(msg);
  }

  const normalized = {
    id: payload.id || planId,
    name: payload.name || "",
    code: payload.code || "",
    tier: normalizePlanTier(payload),
    description: payload.description || "",
  };

  planCache.set(id, normalized);
  return normalized;
}
