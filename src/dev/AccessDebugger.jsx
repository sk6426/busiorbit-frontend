// src/dev/AccessDebugger.jsx
import { useEffect, useState } from "react";
import { useAuth } from "../pages/auth/context/pld_AuthContext";

export default function AccessDebugger() {
  const { role, plan, isAuthenticated, availableFeatures = {} } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = e => {
      // Ctrl+Alt+A toggles
      if (e.ctrlKey && e.altKey && e.code === "KeyA") setOpen(v => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        right: 16,
        bottom: 16,
        zIndex: 9999,
        background: "#111",
        color: "#fff",
        padding: 12,
        borderRadius: 12,
        boxShadow: "0 6px 24px rgba(0,0,0,.4)",
        fontSize: 12,
        maxWidth: 420,
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 8 }}>Access Debugger</div>
      <div>auth: {String(isAuthenticated)}</div>
      <div>role: {role || "-"}</div>
      <div>plan: {plan || "-"}</div>
      <div style={{ marginTop: 8 }}>features:</div>
      <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>
        {JSON.stringify(availableFeatures, null, 2)}
      </pre>
      <div style={{ opacity: 0.7, marginTop: 8 }}>
        Tip: press Ctrl+Alt+A to toggle
      </div>
    </div>
  );
}
