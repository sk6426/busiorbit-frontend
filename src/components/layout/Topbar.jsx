// import { Menu, Bell } from "lucide-react";
// import { useNavigate } from "react-router-dom";
// import UserMenuDropdown from "../common/UserMenuDropdown";
// import { useAuth } from "../../pages/auth/context/pld_AuthContext"; // ensure correct path
// import { usePlan } from "../../pages/auth/hooks/usePlan";

// // map your five roles
// const ROLE_LABELS = {
//   superadmin: "Super Admin",
//   partner: "Business Partner",
//   reseller: "Reseller Partner",
//   business: "Business Owner",
//   staff: "Staff",
// };
// const ROLE_STYLES = {
//   superadmin: "bg-red-50 text-red-700 ring-1 ring-red-200",
//   partner: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
//   reseller: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200",
//   business: "bg-green-50 text-green-700 ring-1 ring-green-200",
//   staff: "bg-gray-50 text-gray-700 ring-1 ring-gray-200",
//   default: "bg-gray-100 text-gray-600 ring-1 ring-gray-200",
// };

// export default function Topbar({ collapsed, setCollapsed }) {
//   const navigate = useNavigate();
//   const { userName, role } = useAuth(); // name & role straight from JWT via provider
//   const { plan, loading: planLoading } = usePlan(); // plan tier via planId→API

//   // keep your existing “Upgrade Plan” logic but now it’s driven by real plan tier
//   const showUpgrade = plan === "basic"; // or: !planLoading && plan === "basic"
//   const roleKey = (role || "").toLowerCase();
//   const roleLabel = ROLE_LABELS[roleKey] || roleKey || "Unknown";
//   const roleClass = ROLE_STYLES[roleKey] || ROLE_STYLES.default;

//   // ✨ No layout changes; just a better tooltip that also includes plan info
//   const badgeTitle = `Role: ${roleLabel}` + (plan ? ` • Plan: ${plan}` : "");

//   return (
//     <header className="bg-white shadow-sm px-6 py-3 flex items-center justify-between border-b border-gray-200 sticky top-0 z-50">
//       {/* ⬅️ Logo + Collapse Button */}
//       <div className="flex items-center gap-3 text-purple-700 font-bold text-xl">
//         <button
//           onClick={() => setCollapsed(prev => !prev)}
//           className="text-purple-600 hover:text-purple-800 transition"
//           title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
//         >
//           <Menu size={22} />
//         </button>
//         <span className="select-none">BusiOrbit</span>
//       </div>

//       {/* ➡️ Right Side (unchanged structure) */}
//       <div className="flex items-center gap-4">
//         <div className="hidden md:flex items-center gap-2 mr-2">
//           <span
//             className="font-semibold text-gray-800 truncate max-w-[200px]"
//             title={userName}
//           >
//             {userName || "User"}
//           </span>
//           <span
//             className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${roleClass}`}
//             title={badgeTitle}
//           >
//             {roleLabel}
//           </span>
//         </div>

//         <button
//           title="Notifications"
//           className="text-gray-600 hover:text-purple-600"
//         >
//           <Bell size={20} />
//         </button>

//         {showUpgrade && (
//           <button
//             onClick={() => navigate("/app/upgrade")}
//             className="bg-yellow-400 text-sm text-white px-3 py-1.5 rounded-full font-semibold shadow hover:bg-yellow-500 transition hidden sm:inline"
//             title="Upgrade your plan"
//           >
//             🚀 Upgrade Plan
//           </button>
//         )}

//         <UserMenuDropdown />
//       </div>
//     </header>
//   );
// // }
// import { Menu, Bell } from "lucide-react";
// import { useNavigate } from "react-router-dom";
// import UserMenuDropdown from "../common/UserMenuDropdown";
// import { useAuth } from "../../pages/auth/context/pld_AuthContext";
// import { usePlan } from "../../pages/auth/hooks/usePlan";

// // Exact role labels (from your DB)
// const ROLE_LABELS = {
//   superadmin: "Super Admin",
//   partner: "Business Partner",
//   reseller: "Reseller Partner",
//   business: "Business Owner",
//   staff: "Staff",
// };
// const ROLE_STYLES = {
//   superadmin: "bg-red-50 text-red-700 ring-1 ring-red-200",
//   partner: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
//   reseller: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200",
//   business: "bg-green-50 text-green-700 ring-1 ring-green-200",
//   staff: "bg-gray-50 text-gray-700 ring-1 ring-gray-200",
//   default: "bg-gray-100 text-gray-600 ring-1 ring-gray-200",
// };

// export default function Topbar({ collapsed, setCollapsed }) {
//   const navigate = useNavigate();
//   const { userName, role } = useAuth(); // from JWT via provider
//   const { plan, planId, loading: planLoading, error: planError } = usePlan(); // from DB via planId

//   const roleKey = (role || "").toLowerCase();
//   const roleLabel = ROLE_LABELS[roleKey] || roleKey || "Unknown";
//   const roleClass = ROLE_STYLES[roleKey] || ROLE_STYLES.default;

//   // ---- Strict plan handling (NO FALLBACKS) ----
//   // "Missing" means: no planId OR fetch failed OR API returned no normalized tier
//   const planMissing = !planLoading && (!planId || !plan);
//   const showUpgrade = !planLoading && !planMissing && plan === "basic";

//   // Tooltip always tells you what we think the plan is (or that it's missing)
//   const badgeTitle =
//     `Role: ${roleLabel}` +
//     (planLoading
//       ? " • Plan: loading…"
//       : planMissing
//       ? " • Plan: MISSING"
//       : ` • Plan: ${plan}`);

//   // Optional: log in console so QA/devs see it immediately
//   if (planMissing && typeof window !== "undefined") {
//     // eslint-disable-next-line no-console
//     console.warn("[Topbar] Plan is missing for current user.", {
//       planId,
//       planError,
//       role: roleKey,
//       userName,
//     });
//   }

//   return (
//     <header className="bg-white shadow-sm px-6 py-3 flex items-center justify-between border-b border-gray-200 sticky top-0 z-50">
//       {/* ⬅️ Logo + Collapse Button */}
//       <div className="flex items-center gap-3 text-purple-700 font-bold text-xl">
//         <button
//           onClick={() => setCollapsed(prev => !prev)}
//           className="text-purple-600 hover:text-purple-800 transition"
//           title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
//         >
//           <Menu size={22} />
//         </button>
//         <span className="select-none">BusiOrbit</span>
//       </div>

//       {/* ➡️ Right Side (layout unchanged) */}
//       <div className="flex items-center gap-4">
//         <div className="hidden md:flex items-center gap-2 mr-2">
//           <span
//             className="font-semibold text-gray-800 truncate max-w-[200px]"
//             title={userName}
//           >
//             {userName || "User"}
//           </span>

//           {/* Role badge (as before) */}
//           <span
//             className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${roleClass}`}
//             title={badgeTitle}
//           >
//             {roleLabel}
//           </span>

//           {/* Minimal indicator if plan is missing (no layout overhaul) */}
//           {!planLoading && planMissing && (
//             <span
//               className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] ring-1 ring-red-300 text-red-700 bg-red-50"
//               title="Plan is missing for this user. Please assign a plan."
//             >
//               Plan Missing
//             </span>
//           )}
//         </div>

//         <button
//           title="Notifications"
//           className="text-gray-600 hover:text-purple-600"
//         >
//           <Bell size={20} />
//         </button>

//         {/* Only show Upgrade when we definitively know the plan and it is 'basic' */}
//         {showUpgrade && (
//           <button
//             onClick={() => navigate("/app/upgrade")}
//             className="bg-yellow-400 text-sm text-white px-3 py-1.5 rounded-full font-semibold shadow hover:bg-yellow-500 transition hidden sm:inline"
//             title="Upgrade your plan"
//           >
//             🚀 Upgrade Plan
//           </button>
//         )}

//         <UserMenuDropdown />
//       </div>
//     </header>
//   );
// }
import { Menu, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import UserMenuDropdown from "../common/UserMenuDropdown";
import { useAuth } from "../../pages/auth/context/pld_AuthContext";
import { usePlan } from "../../pages/auth/hooks/usePlan";

const ROLE_LABELS = {
  superadmin: "Super Admin",
  partner: "Business Partner",
  reseller: "Reseller Partner",
  business: "Business Owner",
  staff: "Staff",
};
const ROLE_STYLES = {
  superadmin: "bg-red-50 text-red-700 ring-1 ring-red-200",
  partner: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
  reseller: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200",
  business: "bg-green-50 text-green-700 ring-1 ring-green-200",
  staff: "bg-gray-50 text-gray-700 ring-1 ring-gray-200",
  default: "bg-gray-100 text-gray-600 ring-1 ring-gray-200",
};

export default function Topbar({ collapsed, setCollapsed }) {
  const navigate = useNavigate();
  const { userName, role } = useAuth();
  const { plan, planId, loading: planLoading, error: planError } = usePlan();

  const roleKey = (role || "").toLowerCase();
  const roleLabel = ROLE_LABELS[roleKey] || roleKey || "Unknown";
  const roleClass = ROLE_STYLES[roleKey] || ROLE_STYLES.default;

  // Roles that do NOT require a plan
  const isAdminRole =
    roleKey === "superadmin" ||
    roleKey === "admin" ||
    roleKey === "partner" ||
    roleKey === "reseller";

  // Only enforce plan presence for business/staff (or any non-admin)
  const planRelevant = !isAdminRole;

  // Missing only matters for relevant roles
  const planMissing = planRelevant && !planLoading && (!planId || !plan);

  // Upgrade button only for relevant roles with a known 'basic' plan
  const showUpgrade =
    planRelevant && !planLoading && !planMissing && plan === "basic";

  // Tooltip: only mention plan for relevant roles
  const badgeTitle = planRelevant
    ? `Role: ${roleLabel}` +
      (planLoading
        ? " • Plan: loading…"
        : planMissing
        ? " • Plan: MISSING"
        : ` • Plan: ${plan}`)
    : `Role: ${roleLabel}`;

  // Optional console note only when relevant
  if (planRelevant && planMissing && typeof window !== "undefined") {
    // eslint-disable-next-line no-console
    console.warn("[Topbar] Plan is missing for current user.", {
      planId,
      planError,
      role: roleKey,
      userName,
    });
  }

  return (
    <header className="bg-white shadow-sm px-6 py-3 flex items-center justify-between border-b border-gray-200 sticky top-0 z-50">
      {/* ⬅️ Logo + Collapse Button */}
      <div className="flex items-center gap-3 text-purple-700 font-bold text-xl">
        <button
          onClick={() => setCollapsed(prev => !prev)}
          className="text-purple-600 hover:text-purple-800 transition"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <Menu size={22} />
        </button>
        <span className="select-none">BusiOrbit</span>
      </div>

      {/* ➡️ Right Side */}
      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-2 mr-2">
          <span
            className="font-semibold text-gray-800 truncate max-w-[200px]"
            title={userName}
          >
            {userName || "User"}
          </span>

          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${roleClass}`}
            title={badgeTitle}
            aria-label={badgeTitle}
          >
            {roleLabel}
          </span>

          {/* Show "Plan Missing" ONLY for relevant (non-admin) roles */}
          {planRelevant && !planLoading && planMissing && (
            <span
              className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] ring-1 ring-red-300 text-red-700 bg-red-50"
              title="Plan is missing for this user. Please assign a plan."
              aria-label="Plan is missing for this user. Please assign a plan."
            >
              Plan Missing
            </span>
          )}
        </div>

        <button
          title="Notifications"
          className="text-gray-600 hover:text-purple-600"
        >
          <Bell size={20} />
        </button>

        {/* Only for business/staff with Basic */}
        {showUpgrade && (
          <button
            onClick={() => navigate("/app/upgrade")}
            className="bg-yellow-400 text-sm text-white px-3 py-1.5 rounded-full font-semibold shadow hover:bg-yellow-500 transition hidden sm:inline"
            title="Upgrade your plan"
          >
            🚀 Upgrade Plan
          </button>
        )}

        <UserMenuDropdown />
      </div>
    </header>
  );
}
