// 📄 src/pages/Workspaces/SettingsWorkspace.jsx
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../app/providers/AuthProvider";
import { FK } from "../../capabilities/featureKeys";
import { Phone, Palette, Lock } from "lucide-react";

function Card({ icon, title, desc, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-xl border p-5 transition hover:shadow-md bg-white"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-md bg-purple-50 text-purple-600">
          {icon}
        </div>
        <div>
          <div className="text-purple-700 font-semibold">{title}</div>
          <div className="text-sm text-gray-600">{desc}</div>
        </div>
      </div>
    </button>
  );
}

export default function SettingsWorkspace() {
  const nav = useNavigate();
  const { can, hasAllAccess, isLoading } = useAuth();

  if (isLoading) return null;

  const allow = perm => hasAllAccess || can(perm);

  // Define tiles with their required permission and where they go
  const tiles = [
    {
      key: "whatsapp",
      perm: FK.SETTINGS_WHATSAPP_VIEW,
      icon: <Phone size={20} />,
      title: "WhatsApp Settings",
      desc: "Configure WhatsApp credentials and integration.",
      onClick: () => nav("/app/settings/whatsapp"),
    },
    {
      key: "theme",
      perm: FK.SETTINGS_THEME_UPDATE,
      icon: <Palette size={20} />,
      title: "Theme & Colors",
      desc: "Choose light/dark mode and accent colors.",
      onClick: () => nav("/app/settings/theme"),
    },
    {
      key: "password",
      perm: FK.SETTINGS_PASSWORD_UPDATE,
      icon: <Lock size={20} />,
      title: "Change Password",
      desc: "Update your account password.",
      onClick: () => nav("/app/settings/password"),
    },
  ];

  const visibleTiles = tiles.filter(t => allow(t.perm));

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-purple-800 mb-4">Settings</h1>

      {visibleTiles.length === 0 ? (
        <div className="text-sm text-gray-500">
          You don’t have access to any settings here.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {visibleTiles.map(t => (
            <Card
              key={t.key}
              icon={t.icon}
              title={t.title}
              desc={t.desc}
              onClick={t.onClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// // 📄 src/pages/Workspaces/SettingsWorkspace.jsx
// import { useNavigate } from "react-router-dom";
// import { useAuth } from "../../app/providers/AuthProvider";
// import { FK } from "../../capabilities/featureKeys";
// import { Phone, Palette, Lock } from "lucide-react";

// function Card({ icon, title, desc, onClick, disabled }) {
//   return (
//     <button
//       type="button"
//       onClick={disabled ? undefined : onClick}
//       className={
//         "w-full text-left rounded-xl border p-5 transition " +
//         (disabled
//           ? "opacity-50 cursor-not-allowed bg-white"
//           : "hover:shadow-md bg-white")
//       }
//       aria-disabled={disabled}
//     >
//       <div className="flex items-start gap-3">
//         <div className="p-2 rounded-md bg-purple-50 text-purple-600">
//           {icon}
//         </div>
//         <div>
//           <div className="text-purple-700 font-semibold">{title}</div>
//           <div className="text-sm text-gray-600">{desc}</div>
//         </div>
//       </div>
//     </button>
//   );
// }

// export default function SettingsWorkspace() {
//   const nav = useNavigate();
//   const { can, hasAllAccess, isLoading } = useAuth();

//   if (isLoading) return null;

//   const canWhatsApp = hasAllAccess || can(FK.SETTINGS_WHATSAPP_VIEW);
//   const canTheme = hasAllAccess || can(FK.SETTINGS_THEME_UPDATE);
//   const canPassword = hasAllAccess || can(FK.SETTINGS_PASSWORD_UPDATE);

//   return (
//     <div className="p-6">
//       <h1 className="text-2xl font-bold text-purple-800 mb-4">Settings</h1>

//       <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
//         <Card
//           icon={<Phone size={20} />}
//           title="WhatsApp Settings"
//           desc="Configure WhatsApp credentials and integration."
//           onClick={() => nav("/app/settings/whatsapp")}
//           disabled={!canWhatsApp}
//         />
//         <Card
//           icon={<Palette size={20} />}
//           title="Theme & Colors"
//           desc="Choose light/dark mode and accent colors."
//           onClick={() => nav("/app/settings/theme")}
//           disabled={!canTheme}
//         />
//         <Card
//           icon={<Lock size={20} />}
//           title="Change Password"
//           desc="Update your account password."
//           onClick={() => nav("/app/settings/password")}
//           disabled={!canPassword}
//         />
//       </div>

//       <p className="text-xs text-gray-500 mt-4">
//         (Theme/Password pages are placeholders — wire them as you build.)
//       </p>
//     </div>
//   );
// }

// // 📄 src/pages/Workspaces/SettingsWorkspacePage.jsx
// import { useNavigate } from "react-router-dom";
// import { useAuth } from "../../app/providers/AuthProvider";
// import { FK } from "../../capabilities/featureKeys";
// import { Settings2, Palette, Lock, Phone } from "lucide-react";

// const Card = ({ icon, title, desc, onClick, disabled }) => (
//   <button
//     onClick={onClick}
//     disabled={disabled}
//     className={`w-full text-left bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition ${
//       disabled ? "opacity-50 cursor-not-allowed" : ""
//     }`}
//   >
//     <div className="flex items-start gap-3">
//       <div className="p-2 rounded-md bg-gray-100 text-purple-600">{icon}</div>
//       <div>
//         <div className="font-semibold text-purple-800">{title}</div>
//         <div className="text-sm text-gray-600">{desc}</div>
//       </div>
//     </div>
//   </button>
// );

// export default function SettingsWorkspacePage() {
//   const navigate = useNavigate();
//   const { isLoading, can, hasAllAccess } = useAuth();

//   const allow = perm => hasAllAccess || can(perm);

//   const canOpenWhatsApp = allow(FK.MESSAGING_WHATSAPPSETTINGS_UPDATE);
//   const canTheme = allow(FK.SETTINGS_THEME_UPDATE) || allow(FK.SETTINGS_VIEW);
//   const canPassword =
//     allow(FK.SETTINGS_PASSWORD_UPDATE) || allow(FK.SETTINGS_VIEW);

//   if (isLoading) {
//     return <div className="p-6 text-gray-500">Loading…</div>;
//   }

//   return (
//     <div className="p-6 space-y-6">
//       <h1 className="text-2xl font-bold text-purple-800">Settings</h1>

//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
//         <Card
//           icon={<Phone size={20} />}
//           title="WhatsApp Settings"
//           desc="Configure WhatsApp credentials and integration."
//           onClick={() => navigate("/app/messaging/whatsapp-settings")}
//           disabled={!canOpenWhatsApp}
//         />

//         <Card
//           icon={<Palette size={20} />}
//           title="Theme & Colors"
//           desc="Choose light/dark mode and accent colors."
//           onClick={() => navigate("/app/settings/theme")}
//           disabled={!canTheme}
//         />

//         <Card
//           icon={<Lock size={20} />}
//           title="Change Password"
//           desc="Update your account password."
//           onClick={() => navigate("/app/settings/password")}
//           disabled={!canPassword}
//         />
//       </div>

//       {/* Stub routes you can wire later */}
//       <div className="text-xs text-gray-400">
//         (Theme/Password pages are placeholders — wire them as you build.)
//       </div>
//     </div>
//   );
// }
