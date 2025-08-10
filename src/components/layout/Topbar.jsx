// 📄 src/components/layout/Topbar.jsx
import { Menu, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../pages/auth/context/AuthContext";
import { usePlan } from "../../pages/auth/hooks/usePlan";
import { useEffect } from "react";

export default function Topbar({ collapsed, setCollapsed }) {
  const navigate = useNavigate();
  const { userName } = useAuth();
  const { plan } = usePlan();

  const showUpgrade = plan === "basic";

  useEffect(() => {
    // remove old dev overrides if you had any
    localStorage.removeItem("role");
    localStorage.removeItem("userName");
  }, []);

  return (
    <header className="bg-white shadow-sm px-6 py-3 flex items-center justify-between border-b border-gray-200 sticky top-0 z-50">
      <div className="flex items-center gap-3 text-purple-700 font-bold text-xl">
        <button
          onClick={() => setCollapsed(prev => !prev)}
          className="text-purple-600 hover:text-purple-800 transition"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <Menu size={22} />
        </button>
        <span className="select-none">xByteChat</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:flex flex-col items-end mr-2 text-gray-600 text-sm">
          <span>Welcome,</span>
          <span className="font-semibold text-gray-800">
            {userName || "User"}
          </span>
        </div>

        <button
          title="Notifications"
          className="text-gray-600 hover:text-purple-600"
        >
          <Bell size={20} />
        </button>

        {showUpgrade && (
          <button
            onClick={() => navigate("/app/upgrade")}
            className="bg-yellow-400 text-sm text-white px-3 py-1.5 rounded-full font-semibold shadow hover:bg-yellow-500 transition hidden sm:inline"
            title="Upgrade your plan"
          >
            🚀 Upgrade Plan
          </button>
        )}
      </div>
    </header>
  );
}

// import { Menu, Bell } from "lucide-react";
// import { useNavigate } from "react-router-dom";
// import { usePlan } from "../../pages/auth/hooks/usePlan";
// import UserMenuDropdown from "../common/UserMenuDropdown";
// import { useEffect, useState } from "react";

// export default function Topbar({ collapsed, setCollapsed }) {
//   const navigate = useNavigate();
//   const { plan } = usePlan();
//   const [userName, setUserName] = useState("");

//   useEffect(() => {
//     const storedName = localStorage.getItem("userName") || "User";
//     setUserName(storedName);
//   }, []);

//   const showUpgrade = plan === "basic";

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
//         <span className="select-none">xByteChat</span>
//       </div>

//       {/* ➡️ Right Side */}
//       <div className="flex items-center gap-4">
//         <div className="hidden md:flex flex-col items-end mr-2 text-gray-600 text-sm">
//           <span>Welcome,</span>
//           <span className="font-semibold text-gray-800">{userName}</span>
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

//         {process.env.NODE_ENV === "development" && (
//           <select
//             title="Switch Role (Dev Only)"
//             value={localStorage.getItem("role") || "business"}
//             onChange={e => {
//               localStorage.setItem("role", e.target.value);
//               window.location.reload();
//             }}
//             className="text-xs border rounded px-2 py-1 bg-gray-100 text-gray-700 shadow-sm"
//           >
//             <option value="admin">Admin</option>
//             <option value="partner">Partner</option>
//             <option value="business">Business</option>
//           </select>
//         )}

//         <UserMenuDropdown />
//       </div>
//     </header>
//   );
// }
