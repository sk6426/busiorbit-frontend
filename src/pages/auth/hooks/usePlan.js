// 📄 src/pages/auth/hooks/usePlan.js
import { useAuth } from "../context/AuthContext";
export function usePlan() {
  const { plan } = useAuth();
  const hasPlan = required => {
    if (!plan) return false;
    const tiers = ["trial", "basic", "smart", "advanced"];
    return (
      tiers.indexOf(plan.toLowerCase()) >= tiers.indexOf(required.toLowerCase())
    );
  };
  return { plan, hasPlan };
}

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
