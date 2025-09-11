// 📄 src/components/layout/SidebarMenu.jsx
import { NavLink } from "react-router-dom";
import { useAuth } from "../../app/providers/AuthProvider";
import {
  UsersRound,
  Megaphone,
  Package,
  Inbox,
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
  ChartArea,
} from "lucide-react";

export default function SidebarMenu({ collapsed, setCollapsed }) {
  const {
    role,
    isLoading,
    availableFeatures = {}, // { Dashboard:true, Messaging:true, ... }
    can, // (permCode) => boolean
    hasAllAccess, // true if "*" or super on server
  } = useAuth();

  if (isLoading) return null;

  const safeRole = String(role || "").toLowerCase();
  const isSuper = safeRole === "superadmin";
  const superAccess = isSuper || !!hasAllAccess;
  const iconSize = collapsed ? 22 : 18;

  // ---------- helpers ----------
  const hasFeature = key => !!availableFeatures[key];
  const anyPerm = (codes = []) =>
    superAccess
      ? true
      : codes.some(c => (typeof can === "function" ? can(c) : false));

  // CRM shows if flag OR any CRM child permission
  const CRM_CHILD_PERMS = ["crm.contacts.view"];
  const showCRM = superAccess || hasFeature("CRM") || anyPerm(CRM_CHILD_PERMS);

  // Workspaces – make superAccess always show
  const showDashboard = superAccess || hasFeature("Dashboard");
  const showCampaigns = superAccess || hasFeature("Campaigns");
  const showCatalog = superAccess || hasFeature("Catalog");
  // const showInbox = superAccess || hasFeature("inbox");
  // Messaging: allow by feature OR by any messaging permission
  const MESSAGING_PERMS = [
    "messaging.report.view",
    "messaging.status.view",
    "messaging.send",
    "messaging.send.text",
    "messaging.send.template",
  ];
  const showMessaging =
    superAccess || hasFeature("Messaging") || anyPerm(MESSAGING_PERMS);

  // Optional flags you might emit later
  // const showAutomation = superAccess || hasFeature("Automation");
  const showAutomation = anyPerm(["automation.menu"]);
  //const showInbox = superAccess || hasFeature("inbox.view");
  const showInbox = anyPerm(["automation.menu"]);

  // ✅ Settings workspace: show if user has settings.* or whatsappsettings, or a Settings feature flag
  const SETTINGS_PERMS = [
    "settings.view",
    "settings.theme.update",
    "settings.password.update",
    "messaging.whatsappsettings.view",
  ];
  const showSettings =
    superAccess || hasFeature("Settings") || anyPerm(SETTINGS_PERMS);

  const UPDATE_PROFILEe = ["settings.profile.view"];

  const showProfileUpdate =
    superAccess || hasFeature("profileUpdaue") || anyPerm(UPDATE_PROFILEe);

  // ✅ Admin workspace: admin-like roles OR AdminPanel feature OR ANY *admin* permission (NOT whatsappsettings)
  const ADMIN_ANY_PERMS = [
    "admin.plans.view",
    "admin.logs.view",
    "user.permissions.view",
    "plan.manager.view",
    "admin.business.approve",
    "admin.whatsappsettings.view",
  ];
  const showAdminPanel =
    superAccess ||
    ["admin", "partner", "reseller"].includes(safeRole) ||
    hasFeature("AdminPanel") ||
    anyPerm(ADMIN_ANY_PERMS);

  const sections = [
    {
      title: "Workspaces",
      items: [
        {
          label: "Dashboard",
          short: "Dashboard",
          path: "/app/dashboard",
          icon: <ChartArea size={iconSize} />,
          show: showDashboard,
        },
        {
          label: "CRM",
          short: "CRM",
          path: "/app/crm",
          icon: <UsersRound size={iconSize} />,
          show: showCRM,
        },
        {
          label: "Campaigns",
          short: "Campaigns",
          path: "/app/campaigns",
          icon: <Megaphone size={iconSize} />,
          show: showCampaigns,
        },
        {
          label: "Catalog",
          short: "Catalog",
          path: "/app/catalog",
          icon: <Package size={iconSize} />,
          show: showCatalog,
        },
        {
          label: "Message",
          short: "Messaging",
          path: "/app/messaging",
          icon: <MessageSquare size={iconSize} />,
          show: showMessaging,
        },
        {
          label: "Automation",
          short: "Automation",
          path: "/app/automation",
          icon: <Bot size={iconSize} />,
          show: showAutomation,
        },
        {
          label: "Inbox",
          short: "Inbox",
          path: "/app/inbox",
          icon: <Inbox size={iconSize} />,
          show: showInbox,
        },

        {
          label: "Admin",
          short: "Admin",
          path: "/app/admin",
          icon: <ShieldCheck size={iconSize} />,
          show: showAdminPanel,
        },
      ],
    },

    {
      title: "Insights",
      items: [
        {
          label: "Insights Hub",
          short: "CRMInsights",
          path: "/app/insights",
          icon: <BarChartBig size={iconSize} />,
          show: superAccess || hasFeature("CRMInsights"),
        },
        {
          label: "Catalog Insights",
          short: "CatalogInsights",
          path: "/app/insights/catalog",
          icon: <BarChartBig size={iconSize} />,
          show: superAccess || hasFeature("CatalogInsights"),
        },
        {
          label: "CRM Insights",
          short: "CRMInsights",
          path: "/app/insights/crm",
          icon: <ActivitySquare size={iconSize} />,
          show: superAccess || hasFeature("CRMInsights"),
        },
        {
          label: "Flow Insights",
          short: "FlowInsights",
          path: "/app/insights/flow",
          icon: <ActivitySquare size={iconSize} />,
          show: superAccess || hasFeature("FlowInsights"),
        },
      ],
    },

    {
      title: "Developer Tools",
      items: [
        {
          label: "CTA Tester",
          short: "Tester",
          path: "/app/devtools/cta-tester",
          icon: <FlaskConical size={iconSize} />,
          show: superAccess || ["admin", "partner"].includes(safeRole),
        },
        {
          label: "Webhook Logs",
          short: "WebhookLogs",
          path: "/app/webhooks/failed",
          icon: <FlaskConical size={iconSize} />,
          show: superAccess || ["admin", "partner"].includes(safeRole),
        },
        {
          label: "Webhook Settings",
          short: "WebhookSettings",
          path: "/app/webhooks/settings",
          icon: <Settings2 size={iconSize} />,
          show: superAccess || ["admin", "partner"].includes(safeRole),
        },
        {
          label: "Plan Manager",
          short: "PlanManager",
          path: "/app/admin/plans",
          icon: <SquareStack size={iconSize} />,
          show: superAccess || anyPerm(["plan.manager.view"]),
        },
      ],
    },

    {
      title: "My Account",
      items: [
        {
          label: "Settings",
          short: "Settings",
          path: "/app/settings",
          icon: <Settings2 size={iconSize} />,
          show: showSettings,
        },
        {
          label: "Profile Completion",
          short: "Profile",
          path: "/app/profile-completion",
          icon: <UserCog size={iconSize} />,
          // show: superAccess || hasFeature("Profile"),
          show: showProfileUpdate,
        },
        // {
        //   label: "WhatsApp Settings",
        //   short: "WhatsAppSettings",
        //   // Keep path consistent with App routes:
        //   path: "/app/messaging/whatsapp-settings",
        //   icon: <Settings2 size={iconSize} />,
        //   show:
        //     superAccess ||
        //     anyPerm([
        //       "messaging.whatsappsettings.view",
        //       "admin.whatsappsettings.view",
        //     ]) ||
        //     hasFeature("WhatsAppSettings"),
        // },
        {
          label: "WhatsApp Settings",
          short: "WhatsAppSettings",
          path: "/app/settings/whatsapp",
          icon: <Settings2 size={iconSize} />,
          show: superAccess || ["admin", "partner"].includes(safeRole),
        },

        {
          label: "User Permissions",
          short: "UserPermissions",
          path: "/app/admin/user-permissions",
          icon: <ShieldCheck size={iconSize} />,
          show: superAccess || anyPerm(["user.permissions.view"]),
        },
        {
          label: "Upgrade Plan",
          short: "Upgrade",
          path: "/app/upgrade",
          icon: <SquareStack size={iconSize} />,
          show: superAccess || hasFeature("Upgrade"),
        },
      ],
    },
  ];

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
          {sections.map(section => {
            const visibleItems = section.items.filter(i => i.show);
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
            <span className="text-sm">Minimise</span>
          </>
        )}
      </button>

      <div className="text-center text-xs text-gray-400 border-t p-3">
        {!collapsed && "Powered by XploreByte"}
      </div>
    </aside>
  );
}

// // 📄 src/components/layout/SidebarMenu.jsx
// import { NavLink } from "react-router-dom";
// import { useAuth } from "../../app/providers/AuthProvider";
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
//   MessageSquare,
//   Bot,
//   ChartArea,
// } from "lucide-react";

// export default function SidebarMenu({ collapsed, setCollapsed }) {
//   const {
//     role,
//     isLoading,
//     availableFeatures = {}, // { Dashboard:true, Messaging:true, ... }
//     can, // (permCode) => boolean
//     hasAllAccess, // true if "*" or super on server
//   } = useAuth();

//   if (isLoading) return null;

//   const safeRole = String(role || "").toLowerCase();
//   const isSuper = safeRole === "superadmin";
//   const superAccess = isSuper || !!hasAllAccess;
//   const iconSize = collapsed ? 22 : 18;

//   // ---------- helpers ----------
//   const hasFeature = key => !!availableFeatures[key];
//   const anyPerm = (codes = []) =>
//     superAccess
//       ? true
//       : codes.some(c => (typeof can === "function" ? can(c) : false));

//   // CRM shows if flag OR any CRM child permission
//   const CRM_CHILD_PERMS = ["contacts.view"];
//   const showCRM = superAccess || hasFeature("CRM") || anyPerm(CRM_CHILD_PERMS);

//   // Workspaces – make superAccess always show
//   const showDashboard = superAccess || hasFeature("Dashboard");
//   const showCampaigns = superAccess || hasFeature("Campaigns");
//   const showCatalog = superAccess || hasFeature("Catalog");

//   // Messaging: allow by feature OR by any messaging permission
//   const MESSAGING_PERMS = [
//     "messaging.inbox.view",
//     "messaging.report.view",
//     "messaging.status.view",
//     "messaging.send",
//     "messaging.send.text",
//     "messaging.send.template",
//   ];
//   const showMessaging =
//     superAccess || hasFeature("Messaging") || anyPerm(MESSAGING_PERMS);

//   // Optional flags you might emit later
//   const showAutomation = superAccess || hasFeature("Automation");
//   const showFlow = superAccess || hasFeature("CTAFlow");

//   // ✅ Admin workspace: show if role is admin-like OR feature flag present OR ANY admin permission present
//   const ADMIN_ANY_PERMS = [
//     "admin.plans.view",
//     "admin.logs.view",
//     "user.permissions.view",
//     "plan.manager.view",
//     "admin.business.approve",
//     "admin.whatsappsettings.view",
//   ];
//   const showAdminPanel =
//     superAccess ||
//     ["admin", "partner", "reseller"].includes(safeRole) ||
//     hasFeature("AdminPanel") ||
//     anyPerm(ADMIN_ANY_PERMS);

//   const sections = [
//     {
//       title: "Workspaces",
//       items: [
//         {
//           label: "Dashboard",
//           short: "Dashboard",
//           path: "/app/dashboard",
//           icon: <ChartArea size={iconSize} />,
//           show: showDashboard,
//         },
//         {
//           label: "CRM",
//           short: "CRM",
//           path: "/app/crm",
//           icon: <UsersRound size={iconSize} />,
//           show: showCRM,
//         },
//         {
//           label: "Campaigns",
//           short: "Campaigns",
//           path: "/app/campaigns",
//           icon: <Megaphone size={iconSize} />,
//           show: showCampaigns,
//         },
//         {
//           label: "Catalog",
//           short: "Catalog",
//           path: "/app/catalog",
//           icon: <Package size={iconSize} />,
//           show: showCatalog,
//         },
//         {
//           label: "Bulk Message",
//           short: "Messaging",
//           path: "/app/messaging",
//           icon: <MessageSquare size={iconSize} />,
//           show: showMessaging,
//         },
//         {
//           label: "Automation",
//           short: "Automation",
//           path: "/app/automation",
//           icon: <Bot size={iconSize} />,
//           show: showAutomation,
//         },
//         {
//           label: "Flow",
//           short: "Flow",
//           path: "/app/cta-flow",
//           icon: <GitBranch size={iconSize} />,
//           show: showFlow,
//         },
//         {
//           label: "Admin",
//           short: "Admin",
//           path: "/app/admin",
//           icon: <ShieldCheck size={iconSize} />,
//           show: showAdminPanel,
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
//           show: superAccess || hasFeature("CRMInsights"),
//         },
//         {
//           label: "Catalog Insights",
//           short: "CatalogInsights",
//           path: "/app/insights/catalog",
//           icon: <BarChartBig size={iconSize} />,
//           show: superAccess || hasFeature("CatalogInsights"),
//         },
//         {
//           label: "CRM Insights",
//           short: "CRMInsights",
//           path: "/app/insights/crm",
//           icon: <ActivitySquare size={iconSize} />,
//           show: superAccess || hasFeature("CRMInsights"),
//         },
//         {
//           label: "Flow Insights",
//           short: "FlowInsights",
//           path: "/app/insights/flow",
//           icon: <ActivitySquare size={iconSize} />,
//           show: superAccess || hasFeature("FlowInsights"),
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
//           show: superAccess || ["admin", "partner"].includes(safeRole),
//         },
//         {
//           label: "Webhook Logs",
//           short: "WebhookLogs",
//           path: "/app/webhooks/failed",
//           icon: <FlaskConical size={iconSize} />,
//           show: superAccess || ["admin", "partner"].includes(safeRole),
//         },
//         {
//           label: "Webhook Settings",
//           short: "WebhookSettings",
//           path: "/app/webhooks/settings",
//           icon: <Settings2 size={iconSize} />,
//           show: superAccess || ["admin", "partner"].includes(safeRole),
//         },
//         {
//           label: "Plan Manager",
//           short: "PlanManager",
//           path: "/app/admin/plans",
//           icon: <SquareStack size={iconSize} />,
//           show: superAccess || anyPerm(["plan.manager.view"]),
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
//           show: superAccess || hasFeature("Profile"),
//         },
//         {
//           label: "WhatsApp Settings",
//           short: "WhatsAppSettings",
//           // NOTE: keep path in sidebar consistent with App routes:
//           // your route is /app/messaging/whatsapp-settings (not /app/WhatsAppSettings/whatsapp-settings)
//           path: "/app/messaging/whatsapp-settings",
//           icon: <Settings2 size={iconSize} />,
//           show:
//             superAccess ||
//             anyPerm([
//               "admin.whatsappsettings.view",
//               "messaging.whatsappsettings.view",
//             ]) ||
//             hasFeature("WhatsAppSettings"),
//         },
//         {
//           label: "User Permissions",
//           short: "UserPermissions",
//           path: "/app/admin/user-permissions",
//           icon: <ShieldCheck size={iconSize} />,
//           show: superAccess || anyPerm(["user.permissions.view"]),
//         },
//         {
//           label: "Upgrade Plan",
//           short: "Upgrade",
//           path: "/app/upgrade",
//           icon: <SquareStack size={iconSize} />,
//           show: superAccess || hasFeature("Upgrade"),
//         },
//       ],
//     },
//   ];

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
//           {sections.map(section => {
//             const visibleItems = section.items.filter(i => i.show);
//             if (visibleItems.length === 0) return null;

//             return (
//               <div key={section.title} className="mb-4">
//                 {!collapsed && (
//                   <div className="text-xs font-semibold text-purple-300 px-4 mb-2 uppercase">
//                     {section.title}
//                   </div>
//                 )}
//                 <ul className={`space-y-1 ${collapsed ? "px-2" : "px-3"}`}>
//                   {visibleItems.map(item => (
//                     <li key={item.path}>
//                       <NavLink
//                         to={item.path}
//                         className={({ isActive }) =>
//                           `flex items-center ${
//                             collapsed ? "justify-center" : "gap-3"
//                           } px-4 py-2 rounded-md text-sm font-medium ${
//                             isActive
//                               ? "bg-purple-100 text-purple-800 border-l-4 border-purple-600"
//                               : "text-gray-700 hover:bg-gray-100"
//                           }`
//                         }
//                       >
//                         <div
//                           className="flex flex-col items-center"
//                           title={collapsed ? item.label : undefined}
//                         >
//                           <span className="text-purple-700">{item.icon}</span>
//                           {collapsed && (
//                             <span className="text-[10px] text-gray-600 mt-1 leading-tight">
//                               {item.short}
//                             </span>
//                           )}
//                         </div>
//                         {!collapsed && (
//                           <div className="flex justify-between items-center w-full pr-2">
//                             <span>{item.label}</span>
//                           </div>
//                         )}
//                       </NavLink>
//                     </li>
//                   ))}
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
//             <span className="text-sm">Minimise</span>
//           </>
//         )}
//       </button>

//       <div className="text-center text-xs text-gray-400 border-t p-3">
//         {!collapsed && "Powered by XploreByte"}
//       </div>
//     </aside>
//   );
// }
