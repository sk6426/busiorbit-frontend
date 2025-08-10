// ✅ AppLayout.jsx (Final with Auto-Collapse + LocalStorage Persistence)

import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import SidebarMenu from "./SidebarMenu";
import Topbar from "./Topbar";

export default function AppLayout() {
  const location = useLocation();

  // ✅ Load collapse state from localStorage on first render
  const [collapsed, setCollapsed] = useState(() => {
    const stored = localStorage.getItem("sidebarCollapsed");
    return stored === "true";
  });

  // ✅ Auto-collapse for specific pages
  useEffect(() => {
    const autoCollapsePaths = [
      "/app/chat",
      "/app/reports",
      "/app/messaging/session",
    ];
    const shouldAutoCollapse = autoCollapsePaths.some(path =>
      location.pathname.startsWith(path)
    );

    if (shouldAutoCollapse && !collapsed) {
      setCollapsed(true);
      localStorage.setItem("sidebarCollapsed", "true");
    }
  }, [location.pathname, collapsed]); // ✅ Added 'collapsed' to dependency array

  // ✅ Manual toggle also saves to localStorage
  const handleToggleCollapse = value => {
    setCollapsed(value);
    localStorage.setItem("sidebarCollapsed", value.toString());
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-100">
      {/* ✅ Sidebar */}
      <div
        className={`${
          collapsed ? "w-20" : "w-64"
        } flex-shrink-0 bg-white border-r h-full fixed z-30 transition-all duration-300`}
      >
        <SidebarMenu
          collapsed={collapsed}
          setCollapsed={handleToggleCollapse}
        />
      </div>

      {/* ✅ Main Content */}
      <div
        className={`flex flex-col flex-1 ${
          collapsed ? "ml-20" : "ml-64"
        } h-full overflow-hidden transition-all duration-300`}
      >
        <Topbar collapsed={collapsed} setCollapsed={handleToggleCollapse} />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

// // ✅ AppLayout.jsx (Final with Auto-Collapse + LocalStorage Persistence)

// import { useEffect, useState } from "react";
// import { Outlet, useLocation } from "react-router-dom";
// import SidebarMenu from "./SidebarMenu";
// import Topbar from "./Topbar";

// export default function AppLayout() {
//   const location = useLocation();

//   // ✅ Load collapse state from localStorage on first render
//   const [collapsed, setCollapsed] = useState(() => {
//     const stored = localStorage.getItem("sidebarCollapsed");
//     return stored === "true";
//   });

//   // ✅ Auto-collapse for specific pages
//   useEffect(() => {
//     const autoCollapsePaths = [
//       "/app/chat",
//       "/app/reports",
//       "/app/messaging/session",
//     ];
//     const shouldAutoCollapse = autoCollapsePaths.some(path =>
//       location.pathname.startsWith(path)
//     );

//     if (shouldAutoCollapse && !collapsed) {
//       setCollapsed(true);
//       localStorage.setItem("sidebarCollapsed", "true");
//     }
//   }, [location.pathname]);

//   // ✅ Manual toggle also saves to localStorage
//   const handleToggleCollapse = value => {
//     setCollapsed(value);
//     localStorage.setItem("sidebarCollapsed", value.toString());
//   };

//   return (
//     <div className="flex h-screen w-full overflow-hidden bg-gray-100">
//       {/* ✅ Sidebar */}
//       <div
//         className={`${
//           collapsed ? "w-20" : "w-64"
//         } flex-shrink-0 bg-white border-r h-full fixed z-30 transition-all duration-300`}
//       >
//         <SidebarMenu
//           collapsed={collapsed}
//           setCollapsed={handleToggleCollapse}
//         />
//       </div>

//       {/* ✅ Main Content */}
//       <div
//         className={`flex flex-col flex-1 ${
//           collapsed ? "ml-20" : "ml-64"
//         } h-full overflow-hidden transition-all duration-300`}
//       >
//         <Topbar collapsed={collapsed} setCollapsed={handleToggleCollapse} />
//         <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
//           <Outlet />
//         </main>
//       </div>
//     </div>
//   );
// }
