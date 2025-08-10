// src/components/common/UserMenuDropdown.jsx

import { useState, useRef, useEffect } from "react";
import { ChevronDown, LogOut, Rocket, ShieldCheck } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

export default function UserMenuDropdown() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef();
  const navigate = useNavigate();
  const location = useLocation(); // ✅ Current page path

  const userName = localStorage.getItem("userName") || "User";
  const userAvatar =
    localStorage.getItem("userAvatar") ||
    "https://randomuser.me/api/portraits/men/75.jpg";
  const plan = localStorage.getItem("plan") || "basic";

  // ✅ Close dropdown when clicked outside
  useEffect(() => {
    const handleClickOutside = e => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ Smart Logout with redirectTo param
  const handleLogout = () => {
    const currentPath = location.pathname + location.search;

    // 🔐 Only clear auth-related keys, not app preferences
    localStorage.removeItem("xbytechat-auth");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("role");
    localStorage.removeItem("plan");
    localStorage.removeItem("businessId");
    localStorage.removeItem("companyName");
    localStorage.removeItem("xbytechat-auth-data");

    // Redirect with preserved target
    navigate(`/login?redirectTo=${encodeURIComponent(currentPath)}`);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(prev => !prev)}
        className="flex items-center gap-2"
      >
        <img
          src={userAvatar}
          alt="User Avatar"
          className="w-9 h-9 rounded-full border border-gray-300 shadow-sm"
        />
        <ChevronDown size={16} className="text-gray-600 hidden sm:block" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-white border rounded-lg shadow-lg z-50 animate-fadeIn">
          <div className="px-4 py-3 border-b">
            <p className="text-sm font-medium text-gray-800">{userName}</p>
            <p className="text-xs text-gray-400">Plan: {plan}</p>
          </div>
          <ul className="py-1 text-sm text-gray-700">
            <li>
              <button
                onClick={() => navigate("/plans/upgrade")}
                className="w-full flex items-center px-4 py-2 hover:bg-purple-50"
              >
                <Rocket size={16} className="mr-2 text-purple-600" />
                Upgrade Plan
              </button>
            </li>
            <li>
              <button
                onClick={() => navigate("/dashboard/profile-completion")}
                className="w-full flex items-center px-4 py-2 hover:bg-purple-50"
              >
                <ShieldCheck size={16} className="mr-2 text-indigo-500" />
                Profile Settings
              </button>
            </li>
            <li>
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-4 py-2 hover:bg-red-50 text-red-600"
              >
                <LogOut size={16} className="mr-2" />
                Logout
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
