// src/pages/auth/hooks/usePlan.js
import { useEffect, useState } from "react";
import axiosClient from "../../../api/axiosClient";
import { useAuth } from "../context/pld_AuthContext";

export function usePlan() {
  const { role } = useAuth();
  const [plan, setPlan] = useState(""); // normalized lowercase tier (from DB name)
  const [planObj, setPlanObj] = useState(null); // full DB object { id, name, code, description, ... }
  const [planId, setPlanId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancel = false;

    async function load() {
      setLoading(true);
      setError("");
      setPlan("");
      setPlanObj(null);
      setPlanId(null);

      try {
        const res = await axiosClient.get("/plan/me/permissions");
        const data = res?.data || {};
        const p = data.plan || null;

        if (!cancel) {
          setPlanId(data.planId ?? null);

          if (p) {
            const tier = (p.name || "").trim().toLowerCase(); // ← directly from DB
            setPlan(tier);
            setPlanObj(p); // keep full object from backend
          }
        }
      } catch (e) {
        if (!cancel) {
          const msg =
            e?.response?.data?.message || e?.message || "Failed to load plan";
          setError(msg);
        }
      } finally {
        if (!cancel) setLoading(false);
      }
    }

    load();
    return () => {
      cancel = true;
    };
  }, []);

  return { plan, planObj, planId, loading, error, role };
}

// // src/pages/auth/hooks/usePlan.js
// import { useEffect, useMemo, useState } from "react";
// import axiosClient from "../../../api/axiosClient";
// import { useAuth } from "../context/pld_AuthContext";

// // normalize backend plan name/code to: trial | basic | smart | advanced
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

//   if (raw.includes("trial")) return "trial";
//   if (raw.includes("basic") || raw.includes("start")) return "basic";
//   if (raw.includes("smart") || raw.includes("pro")) return "smart";
//   if (raw.includes("advanced") || raw.includes("enter")) return "advanced";
//   return raw; // unknown → pass through
// }

// export function usePlan() {
//   const { role } = useAuth(); // useful if you want to special-case admins
//   const [plan, setPlan] = useState(""); // normalized tier
//   const [planObj, setPlanObj] = useState(null); // { id, name, code, description }
//   const [planId, setPlanId] = useState(null); // GUID from response
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   useEffect(() => {
//     let cancel = false;

//     async function load() {
//       setLoading(true);
//       setError("");
//       setPlan("");
//       setPlanObj(null);
//       setPlanId(null);

//       try {
//         const res = await axiosClient.get("/plan/me/permissions"); // baseURL already has /api
//         const data = res?.data || {};
//         const p = data.plan || null;

//         if (!cancel) {
//           setPlanId(data.planId ?? null);

//           if (p) {
//             const tier = normalizePlanTier(p);
//             setPlan(tier);
//             setPlanObj({
//               id: p.id,
//               name: p.name,
//               code: p.code,
//               description: p.description || "",
//               tier,
//             });
//           } else {
//             // strict: no fallback; surface missing plan
//             setPlan("");
//             setPlanObj(null);
//           }
//         }
//       } catch (e) {
//         if (!cancel) {
//           const msg =
//             e?.response?.data?.message || e?.message || "Failed to load plan";
//           setError(msg);
//           // Keep plan empty to enforce “no fallback” policy
//         }
//       } finally {
//         if (!cancel) setLoading(false);
//       }
//     }

//     load();
//     return () => {
//       cancel = true;
//     };
//   }, []);

//   const hasPlan = useMemo(() => {
//     const order = ["trial", "basic", "smart", "advanced"];
//     return required => {
//       if (!plan) return false;
//       const a = order.indexOf(plan.toLowerCase());
//       const b = order.indexOf((required || "").toLowerCase());
//       if (a === -1 || b === -1) return false;
//       return a >= b;
//     };
//   }, [plan]);

//   return { plan, planObj, planId, loading, error, hasPlan, role };
// }

// // src/pages/auth/hooks/usePlan.js
// import { useEffect, useMemo, useState } from "react";
// import { useAuth } from "../context/pld_AuthContext";
// import { getPlanById } from "../services/planService";

// export function usePlan() {
//   const { planId, role } = useAuth(); // role is handy if you want to bypass admins
//   const [plan, setPlan] = useState(""); // normalized tier: trial|basic|smart|advanced|unknown
//   const [planObj, setPlanObj] = useState(null); // full plan object from API
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   useEffect(() => {
//     let cancel = false;

//     async function run() {
//       setError("");
//       setPlan("");
//       setPlanObj(null);

//       // If no planId (e.g., superadmin/partner/reseller), nothing to fetch
//       if (!planId) return;

//       setLoading(true);
//       try {
//         const p = await getPlanById(planId);
//         if (!cancel) {
//           setPlan(p?.tier || ""); // normalized tier
//           setPlanObj(p || null); // keep full plan data if you need description/name
//         }
//       } catch (e) {
//         if (!cancel) {
//           setError(e?.message || "Failed to fetch plan");
//         }
//       } finally {
//         if (!cancel) setLoading(false);
//       }
//     }

//     run();
//     return () => {
//       cancel = true;
//     };
//   }, [planId]);

//   const hasPlan = useMemo(() => {
//     const order = ["trial", "basic", "smart", "advanced"];
//     return required => {
//       if (!plan) return false;
//       const a = order.indexOf(plan.toLowerCase());
//       const b = order.indexOf((required || "").toLowerCase());
//       if (a === -1 || b === -1) return false;
//       return a >= b;
//     };
//   }, [plan]);

//   return { plan, planObj, planId, loading, error, hasPlan, role };
// }

// // 📄 src/pages/auth/hooks/usePlan.js
// import { useAuth } from "../context/AuthContext";

// export function usePlan() {
//   const { plan } = useAuth();

//   const hasPlan = requiredPlan => {
//     if (!plan) return false;

//     const tiers = ["trial", "basic", "smart", "advanced"];
//     const userTier = tiers.indexOf(plan.toLowerCase());
//     const requiredTier = tiers.indexOf(requiredPlan.toLowerCase());

//     return userTier >= requiredTier;
//   };

//   return { plan, hasPlan };
// }
