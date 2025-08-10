// 📄 File: src/components/layout/SidebarMenu.jsx
import { NavLink } from "react-router-dom";
import { useAuth } from "../../pages/auth/context/AuthContext";
import { FEATURE_KEYS } from "../FeatureAccess/featureKeyConfig";

import {
  UsersRound,
  Megaphone,
  Package,
  GitBranch,
  ShieldCheck,
  ActivitySquare,
  UserCog,
  SquareStack,
  FlaskConical,
  Settings2,
  BarChartBig,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Bot,
} from "lucide-react";

export default function SidebarMenu({ collapsed, setCollapsed }) {
  const { role, isLoading, availableFeatures } = useAuth();
  const safeRole = (role || "").toLowerCase();
  const iconSize = collapsed ? 22 : 18;

  const hasFeature = key => {
    if (safeRole === "superadmin") return true;
    return availableFeatures?.[key] === true;
  };

  const sidebarSections = [
    {
      title: "Workspaces",
      items: [
        {
          label: "CRM Workspace",
          short: FEATURE_KEYS.CRM,
          path: "/app/crm",
          icon: <UsersRound size={iconSize} />,
          show: hasFeature(FEATURE_KEYS.CRM),
        },
        {
          label: "Campaigns",
          short: FEATURE_KEYS.Campaigns,
          path: "/app/campaigns",
          icon: <Megaphone size={iconSize} />,
          show: hasFeature(FEATURE_KEYS.Campaigns),
        },
        {
          label: "Catalog",
          short: FEATURE_KEYS.Catalog,
          path: "/app/catalog",
          icon: <Package size={iconSize} />,
          show: hasFeature(FEATURE_KEYS.Catalog),
        },
        {
          label: "Bulk Messgae",
          short: FEATURE_KEYS.Messaging,
          path: "/app/messaging",
          icon: <MessageSquare size={iconSize} />, // You can choose a suitable icon
          show: hasFeature(FEATURE_KEYS.Messaging),
        },
        {
          label: "Flow",
          short: FEATURE_KEYS.CTAFlow,
          path: "/app/cta-flow",
          icon: <GitBranch size={iconSize} />,
          show: hasFeature(FEATURE_KEYS.CTAFlow),
        },
        {
          label: "Automation",
          short: FEATURE_KEYS.Automation,
          path: "/app/automation",
          icon: <Bot size={iconSize} />,
          show: hasFeature(FEATURE_KEYS.Automation),
        },

        {
          label: safeRole === "admin" ? "Admin Panel" : "Admin",
          short: FEATURE_KEYS.AdminPanel,
          path: "/app/admin",
          icon: <ShieldCheck size={iconSize} />,
          show: ["superadmin", "admin", "partner", "reseller"].includes(
            safeRole
          ),
        },
      ],
    },
    {
      title: "Insights",
      items: [
        {
          label: "Insights Hub",
          short: FEATURE_KEYS.CRMInsights,
          path: "/app/insights",
          icon: <BarChartBig size={iconSize} />,
          show: hasFeature(FEATURE_KEYS.CRMInsights),
        },
        {
          label: "Catalog Insights",
          short: FEATURE_KEYS.CatalogInsights,
          path: "/app/insights/catalog",
          icon: <BarChartBig size={iconSize} />,
          show: hasFeature(FEATURE_KEYS.CatalogInsights),
        },
        {
          label: "CRM Insights",
          short: FEATURE_KEYS.CRMInsights,
          path: "/app/insights/crm",
          icon: <ActivitySquare size={iconSize} />,
          show: hasFeature(FEATURE_KEYS.CRMInsights),
        },
        {
          label: "Flow Insights",
          short: FEATURE_KEYS.FlowInsights,
          path: "/app/insights/flow",
          icon: <ActivitySquare size={iconSize} />,
          show: hasFeature(FEATURE_KEYS.FlowInsights),
        },
      ],
    },
    {
      title: "Developer Tools",
      items: [
        {
          label: "CTA Tester",
          short: FEATURE_KEYS.Tester,
          path: "/app/devtools/cta-tester",
          icon: <FlaskConical size={iconSize} />,
          show: ["admin", "superadmin", "partner"].includes(safeRole),
        },
        {
          label: "Webhook Logs",
          short: FEATURE_KEYS.WebhookLogs,
          path: "/app/webhooks/failed",
          icon: <FlaskConical size={iconSize} />,
          show: ["admin", "superadmin", "partner"].includes(safeRole),
        },
        {
          label: "Webhook Settings",
          short: FEATURE_KEYS.WebhookSettings,
          path: "/app/webhooks/settings",
          icon: <Settings2 size={iconSize} />,
          show: ["admin", "superadmin", "partner"].includes(safeRole),
        },
      ],
    },
    {
      title: "My Account",
      items: [
        {
          label: "Profile Completion",
          short: FEATURE_KEYS.Profile,
          path: "/app/profile-completion",
          icon: <UserCog size={iconSize} />,
          show: hasFeature(FEATURE_KEYS.Profile),
        },
        {
          label: "WhatsApp Settings",
          short: FEATURE_KEYS.WhatsAppSettings,
          path: "/app/WhatsAppSettings/whatsapp-settings",
          icon: <Settings2 size={iconSize} />,
          show: hasFeature(FEATURE_KEYS.WhatsAppSettings),
        },
        {
          label: "User Permissions",
          short: FEATURE_KEYS.UserPermissions,
          path: "/app/admin/user-permissions",
          icon: <ShieldCheck size={iconSize} />,
          show: hasFeature(FEATURE_KEYS.UserPermissions),
        },
        {
          label: "Upgrade Plan",
          short: FEATURE_KEYS.Upgrade,
          path: "/app/upgrade",
          icon: <SquareStack size={iconSize} />,
          show: hasFeature(FEATURE_KEYS.Upgrade),
        },
      ],
    },
  ];

  if (isLoading) return null;

  return (
    <aside
      className={`${
        collapsed ? "w-20" : "w-64"
      } bg-white shadow border-r flex flex-col transition-all duration-300 h-screen`}
    >
      <div className="p-4 flex items-center justify-center">
        {collapsed ? (
          <img src="/logo-icon.png" alt="Logo Icon" className="h-10 w-10" />
        ) : (
          <img src="/logo_5.svg" alt="Full Logo" className="h-10 mx-auto" />
        )}
      </div>

      <div className="flex-1 overflow-y-auto pr-1">
        <nav>
          {sidebarSections.map(section => {
            const visibleItems = section.items.filter(item => item.show);
            if (visibleItems.length === 0) return null;

            return (
              <div key={section.title} className="mb-4">
                {!collapsed && (
                  <div className="text-xs font-semibold text-purple-300 px-4 mb-2 uppercase">
                    {section.title}
                  </div>
                )}
                <ul className={`space-y-1 ${collapsed ? "px-2" : "px-3"}`}>
                  {visibleItems.map(item => (
                    <li key={item.path}>
                      <NavLink
                        to={item.path}
                        className={({ isActive }) =>
                          `flex items-center ${
                            collapsed ? "justify-center" : "gap-3"
                          } px-4 py-2 rounded-md text-sm font-medium ${
                            isActive
                              ? "bg-purple-100 text-purple-800 border-l-4 border-purple-600"
                              : "text-gray-700 hover:bg-gray-100"
                          }`
                        }
                      >
                        <div
                          className="flex flex-col items-center"
                          title={collapsed ? item.label : undefined}
                        >
                          <span className="text-purple-700">{item.icon}</span>
                          {collapsed && (
                            <span className="text-[10px] text-gray-600 mt-1 leading-tight">
                              {item.short}
                            </span>
                          )}
                        </div>
                        {!collapsed && (
                          <div className="flex justify-between items-center w-full pr-2">
                            <span>{item.label}</span>
                          </div>
                        )}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </nav>
      </div>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="mx-3 mb-2 mt-auto flex items-center justify-center gap-2 text-gray-500 hover:text-purple-600 text-sm font-medium transition"
      >
        {collapsed ? (
          <ChevronRight size={18} className="text-purple-600" />
        ) : (
          <>
            <ChevronLeft size={18} className="text-purple-600" />
            <span className="text-sm">Collapse</span>
          </>
        )}
      </button>

      <div className="text-center text-xs text-gray-400 border-t p-3">
        {!collapsed && "Powered by xByteChat"}
      </div>
    </aside>
  );
}

// // 📄 File: src/components/layout/SidebarMenu.jsx
// import { NavLink } from "react-router-dom";
// import { useAuth } from "../../pages/auth/context/AuthContext";
// import useFeatureStatus from "../../pages/auth/hooks/useFeatureStatus";

// import FeatureBadge from "../FeatureAccess/FeatureBadge";

// import {
//   UsersRound,
//   Megaphone,
//   Package,
//   GitBranch,
//   ShieldCheck,
//   ActivitySquare,
//   UserCog,
//   SquareStack,
//   FlaskConical,
//   Settings2,
//   BarChartBig,
//   ChevronLeft,
//   ChevronRight,
// } from "lucide-react";

// export default function SidebarMenu({ collapsed, setCollapsed }) {
//   const { role, plan, isLoading, availableFeatures } = useAuth();
//   const safeRole = (role || "").toLowerCase();
//   const iconSize = collapsed ? 22 : 18;

//   // ✅ Feature badge status for each feature
//   const featureStatusMap = {
//     CRM: useFeatureStatus("CRM"),
//     Campaigns: useFeatureStatus("Campaigns"),
//     Catalog: useFeatureStatus("Catalog"),
//     CTAFlow: useFeatureStatus("CTAFlow"),
//     CRMInsights: useFeatureStatus("CRMInsights"),
//     CatalogInsights: useFeatureStatus("CatalogInsights"),
//     FlowInsights: useFeatureStatus("FlowInsights"),
//   };

//   // ✅ Secure feature access check
//   const hasFeature = key => {
//     if (safeRole === "superadmin") return true;
//     if (availableFeatures && key in availableFeatures) {
//       return availableFeatures[key] === true;
//     }
//     return plan !== "basic"; // fallback if not listed
//   };

//   const sidebarSections = [
//     {
//       title: "Workspaces",
//       items: [
//         {
//           label: "CRM Workspace",
//           short: "CRM",
//           path: "/app/crm",
//           icon: <UsersRound size={iconSize} />,
//           show: hasFeature("CRM"),
//         },
//         {
//           label: "Campaigns",
//           short: "Campaigns",
//           path: "/app/campaigns",
//           icon: <Megaphone size={iconSize} />,
//           show: hasFeature("Campaigns"),
//         },
//         {
//           label: "Catalog",
//           short: "Catalog",
//           path: "/app/catalog",
//           icon: <Package size={iconSize} />,
//           show: hasFeature("Catalog"),
//         },
//         {
//           label: "Automation",
//           short: "CTAFlow",
//           path: "/app/cta-flow",
//           icon: <GitBranch size={iconSize} />,
//           show: hasFeature("CTAFlow"),
//         },
//         {
//           label: safeRole === "admin" ? "Admin Panel" : "Admin",
//           short: "Admin",
//           path: "/app/admin",
//           icon: <ShieldCheck size={iconSize} />,
//           show: ["superadmin", "admin", "partner", "reseller"].includes(
//             safeRole
//           ),
//         },
//       ],
//     },
//     {
//       title: "Insights",
//       items: [
//         {
//           label: "Insights Hub",
//           short: "CRMInsights",
//           path: "/app/insights",
//           icon: <BarChartBig size={iconSize} />,
//           show: hasFeature("CRMInsights"),
//         },
//         {
//           label: "Catalog Insights",
//           short: "CatalogInsights",
//           path: "/app/insights/catalog",
//           icon: <BarChartBig size={iconSize} />,
//           show: hasFeature("CatalogInsights"),
//         },
//         {
//           label: "CRM Insights",
//           short: "CRMInsights",
//           path: "/app/insights/crm",
//           icon: <ActivitySquare size={iconSize} />,
//           show: hasFeature("CRMInsights"),
//         },
//         {
//           label: "Flow Insights",
//           short: "FlowInsights",
//           path: "/app/insights/flow",
//           icon: <ActivitySquare size={iconSize} />,
//           show: hasFeature("FlowInsights"),
//         },
//       ],
//     },
//     {
//       title: "Developer Tools",
//       items: [
//         {
//           label: "CTA Tester",
//           short: "Tester",
//           path: "/app/devtools/cta-tester",
//           icon: <FlaskConical size={iconSize} />,
//           show: ["admin", "superadmin", "partner"].includes(safeRole),
//         },
//         {
//           label: "Webhook Logs",
//           short: "WebhookLogs",
//           path: "/app/webhooks/failed",
//           icon: <FlaskConical size={iconSize} />,
//           show: ["admin", "superadmin", "partner"].includes(safeRole),
//         },
//         {
//           label: "Webhook Settings",
//           short: "WebhookSettings",
//           path: "/app/webhooks/settings",
//           icon: <Settings2 size={iconSize} />,
//           show: ["admin", "superadmin", "partner"].includes(safeRole),
//         },
//       ],
//     },
//     {
//       title: "My Account",
//       items: [
//         {
//           label: "Profile Completion",
//           short: "Profile",
//           path: "/app/profile-completion",
//           icon: <UserCog size={iconSize} />,
//           show: safeRole === "business",
//         },
//         {
//           label: "WhatsApp Settings",
//           short: "WhatsApp",
//           path: "/app/WhatsAppSettings/whatsapp-settings",
//           icon: <Settings2 size={iconSize} />,
//           show: safeRole === "business",
//         },
//         {
//           label: "User Permissions",
//           short: "UserPermissions",
//           path: "/app/admin/user-permissions",
//           icon: <ShieldCheck size={iconSize} />,
//           show: safeRole === "business",
//         },
//         {
//           label: "Upgrade Plan",
//           short: "Upgrade",
//           path: "/app/upgrade",
//           icon: <SquareStack size={iconSize} />,
//           show: true,
//         },
//       ],
//     },
//   ];

//   if (isLoading) return null;

//   return (
//     <aside
//       className={`${
//         collapsed ? "w-20" : "w-64"
//       } bg-white shadow border-r flex flex-col transition-all duration-300 h-screen`}
//     >
//       <div className="p-4 flex items-center justify-center">
//         {collapsed ? (
//           <img src="/logo-icon.png" alt="Logo Icon" className="h-10 w-10" />
//         ) : (
//           <img src="/logo_5.svg" alt="Full Logo" className="h-10 mx-auto" />
//         )}
//       </div>

//       <div className="flex-1 overflow-y-auto pr-1">
//         <nav>
//           {sidebarSections.map(section => {
//             const visibleItems = section.items.filter(item => item.show);
//             if (visibleItems.length === 0) return null;

//             return (
//               <div key={section.title} className="mb-4">
//                 {!collapsed && (
//                   <div className="text-xs font-semibold text-purple-300 px-4 mb-2 uppercase">
//                     {section.title}
//                   </div>
//                 )}
//                 <ul className={`space-y-1 ${collapsed ? "px-2" : "px-3"}`}>
//                   {visibleItems.map(item => {
//                     const badge =
//                       featureStatusMap[item.short]?.isActive !== undefined
//                         ? featureStatusMap[item.short]
//                         : null;

//                     return (
//                       <li key={item.path}>
//                         <NavLink
//                           to={item.path}
//                           className={({ isActive }) =>
//                             `flex items-center ${
//                               collapsed ? "justify-center" : "gap-3"
//                             } px-4 py-2 rounded-md text-sm font-medium ${
//                               isActive
//                                 ? "bg-purple-100 text-purple-800 border-l-4 border-purple-600"
//                                 : "text-gray-700 hover:bg-gray-100"
//                             }`
//                           }
//                         >
//                           <div
//                             className="flex flex-col items-center"
//                             title={collapsed ? item.label : undefined}
//                           >
//                             <span className="text-purple-700">{item.icon}</span>
//                             {collapsed && (
//                               <span className="text-[10px] text-gray-600 mt-1 leading-tight">
//                                 {item.short}
//                               </span>
//                             )}
//                           </div>
//                           {!collapsed && (
//                             <div className="flex justify-between items-center w-full pr-2">
//                               <span>{item.label}</span>
//                               {badge && <FeatureBadge {...badge} />}
//                             </div>
//                           )}
//                         </NavLink>
//                       </li>
//                     );
//                   })}
//                 </ul>
//               </div>
//             );
//           })}
//         </nav>
//       </div>

//       <button
//         onClick={() => setCollapsed(!collapsed)}
//         className="mx-3 mb-2 mt-auto flex items-center justify-center gap-2 text-gray-500 hover:text-purple-600 text-sm font-medium transition"
//       >
//         {collapsed ? (
//           <ChevronRight size={18} className="text-purple-600" />
//         ) : (
//           <>
//             <ChevronLeft size={18} className="text-purple-600" />
//             <span className="text-sm">Collapse</span>
//           </>
//         )}
//       </button>

//       <div className="text-center text-xs text-gray-400 border-t p-3">
//         {!collapsed && "Powered by xByteChat"}
//       </div>
//     </aside>
//   );
// }
