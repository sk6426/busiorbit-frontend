// src/app/providers/AuthProvider.jsx
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import axiosClient from "../../../api/axiosClient";
// import { getAuthFromToken } from "../../utils/jwt";
import { getAuthFromToken } from "../../../utils/jwt";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [role, setRole] = useState("");
  const [planId, setPlanId] = useState(null);
  const [businessId, setBusinessId] = useState(null);
  const [userName, setUserName] = useState("User");
  const [isLoading, setIsLoading] = useState(true);

  // authoritative permissions from server (array of strings) or ["*"]
  const [perms, setPerms] = useState([]);

  const hasAllAccess = useMemo(
    () => perms.includes("*") || role === "superadmin",
    [perms, role]
  );
  const isAuthenticated = useMemo(() => !!role, [role]);

  const clearAuthData = () => {
    setRole("");
    setPlanId(null);
    setBusinessId(null);
    setUserName("User");
    setPerms([]);
  };

  const can = useCallback(
    code => (hasAllAccess ? true : perms.includes(code)),
    [perms, hasAllAccess]
  );

  const loadSession = useCallback(async () => {
    setIsLoading(true);
    try {
      const auth = getAuthFromToken(); // reads JWT; enforces exp
      if (!auth.isAuth) {
        clearAuthData();
        return;
      }
      setRole(auth.role);
      setPlanId(auth.planId || null);
      setBusinessId(auth.businessId || null);
      setUserName(auth.name || "User");

      // pull permissions from server (authoritative)
      const { data } = await axiosClient.get("/plan/me/permissions"); // returns string[] or ["*"]
      setPerms(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn("[Auth] loadSession failed:", err?.message);
      clearAuthData();
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const refreshAuthContext = async () => {
    await loadSession();
  };

  const value = {
    role,
    planId,
    businessId,
    userName,
    isAuthenticated,
    isLoading,
    hasAllAccess,
    can,
    refreshAuthContext,
    clearAuthData,
  };

  return (
    <AuthContext.Provider value={value}>
      {isLoading ? (
        <div className="min-h-screen flex items-center justify-center text-purple-700 font-semibold text-lg">
          🔐 Authenticating...
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside an AuthProvider");
  return ctx;
}

// // 📄 src/pages/auth/context/AuthContext.jsx
// import {
//   createContext,
//   useContext,
//   useState,
//   useEffect,
//   useMemo,
//   useCallback,
// } from "react";
// import axiosClient, { TOKEN_KEY } from "../../../api/axiosClient";
// import { getAuthFromToken } from "../../../utils/jwt";

// const AuthContext = createContext(null);

// export function AuthProvider({ children }) {
//   const [role, setRole] = useState("");
//   const [planId, setPlanId] = useState(null);
//   const [businessId, setBusinessId] = useState(null);
//   const [userName, setUserName] = useState("User");
//   const [isLoading, setIsLoading] = useState(true);

//   // permissions map for UX (server is still the source of truth)
//   const [availableFeatures, setAvailableFeatures] = useState({}); // { "messages.send": true }
//   const [hasAllAccess, setHasAllAccess] = useState(false); // wildcard for admins

//   const isAuthenticated = useMemo(() => !!role, [role]);

//   const clearAuthData = () => {
//     // remove token to avoid stuck loops with a bad token
//     try {
//       localStorage.removeItem(TOKEN_KEY);
//     } catch {}
//     setRole("");
//     setPlanId(null);
//     setBusinessId(null);
//     setUserName("User");
//     setAvailableFeatures({});
//     setHasAllAccess(false);
//   };

//   const loadSession = useCallback(async () => {
//     setIsLoading(true);
//     try {
//       // 1) Read from JWT (just enough to know who we are)
//       const auth = getAuthFromToken();
//       if (!auth.isAuth) {
//         clearAuthData();
//         return;
//       }

//       setRole(auth.role);
//       setPlanId(auth.planId ?? null); // <-- expects 'plan_id' in JWT
//       setBusinessId(auth.businessId ?? null);
//       setUserName(auth.name || "User");

//       // 2) Admin bypass (wildcard, no FE enumeration)
//       if (auth.role === "superadmin" || auth.role === "admin") {
//         setHasAllAccess(true);
//         return;
//       }

//       // 3) Fetch authoritative permissions from backend
//       const { data } = await axiosClient.get("/plan/me/permissions");
//       // expected: { planId: "...", permissions: ["messages.send", ...] } or ["*"]
//       const codes = Array.isArray(data?.permissions) ? data.permissions : [];

//       if (codes.includes("*")) {
//         setHasAllAccess(true);
//         return;
//       }

//       const map = {};
//       codes.forEach(code => {
//         map[code] = true;
//       });
//       setAvailableFeatures(map);
//     } catch (err) {
//       console.warn("❌ [Auth] loadSession failed:", err?.message);
//       clearAuthData();
//     } finally {
//       setIsLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     loadSession();
//   }, [loadSession]);

//   const refreshAuthContext = async () => {
//     await loadSession();
//   };

//   // single helper for UI checks; backend still enforces on endpoints
//   const can = useCallback(
//     code => {
//       return hasAllAccess || !!availableFeatures[code];
//     },
//     [hasAllAccess, availableFeatures]
//   );

//   return (
//     <AuthContext.Provider
//       value={{
//         role,
//         planId,
//         businessId,
//         userName,
//         availableFeatures,
//         hasAllAccess,
//         can,
//         isAuthenticated,
//         isLoading,
//         refreshAuthContext,
//         clearAuthData,
//         // setRole kept for dev tools if you want
//         setRole,
//       }}
//     >
//       {isLoading ? (
//         <div className="min-h-screen flex items-center justify-center text-purple-700 font-semibold text-lg">
//           🔐 Authenticating...
//         </div>
//       ) : (
//         children
//       )}
//     </AuthContext.Provider>
//   );
// }

// export function useAuth() {
//   const ctx = useContext(AuthContext);
//   if (!ctx) throw new Error("useAuth must be used inside an AuthProvider");
//   return ctx;
// }

// Below code we have comented for harden teh security
// // 📄 src/pages/auth/context/AuthContext.jsx
// import {
//   createContext,
//   useContext,
//   useState,
//   useEffect,
//   useMemo,
//   useCallback,
// } from "react";
// import axiosClient from "../../../api/axiosClient";

// import { getAuthFromToken } from "../../../utils/jwt";
// import { FEATURE_KEYS as featureKeys } from "../../../components/FeatureAccess/featureKeyConfig";

// const AuthContext = createContext(null);

// export function AuthProvider({ children }) {
//   const [role, setRole] = useState("");
//   const [plan, setPlan] = useState("");
//   const [businessId, setBusinessId] = useState(null);
//   const [userName, setUserName] = useState("User");
//   const [isLoading, setIsLoading] = useState(true);
//   const [availableFeatures, setAvailableFeatures] = useState({});

//   const isAuthenticated = useMemo(() => !!role, [role]);

//   const clearAuthData = () => {
//     setRole("");
//     setPlan("");
//     setBusinessId(null);
//     setAvailableFeatures({});
//   };

//   const loadSession = useCallback(async () => {
//     setIsLoading(true);
//     try {
//       // 1) Read from JWT (source of truth on client)
//       const auth = getAuthFromToken();
//       if (!auth.isAuth) {
//         clearAuthData();
//         return;
//       }
//       setRole(auth.role);
//       setPlan(auth.plan);
//       setBusinessId(auth.businessId);
//       setUserName(auth.name);

//       // 2) Superadmin: grant all
//       if (auth.role === "superadmin") {
//         const all = {};
//         Object.values(featureKeys).forEach(k => (all[k] = true));
//         setAvailableFeatures(all);
//         return;
//       }

//       // 3) Fetch feature map from API (Bearer via axiosClient)
//       const { data } = await axiosClient.get("/feature-access/me");
//       const map = {};
//       (data || []).forEach(f => {
//         const allowed = f.isOverridden ?? f.isAvailableInPlan;
//         map[f.featureCode] = allowed;
//       });
//       setAvailableFeatures(map);
//     } catch (err) {
//       console.warn("❌ [Auth] loadSession failed:", err?.message);
//       clearAuthData();
//     } finally {
//       setIsLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     loadSession();
//   }, [loadSession]);

//   const refreshAuthContext = async () => {
//     await loadSession();
//   };

//   return (
//     <AuthContext.Provider
//       value={{
//         role,
//         plan,
//         businessId,
//         userName,
//         availableFeatures,
//         isAuthenticated,
//         isLoading,
//         refreshAuthContext,
//         clearAuthData,
//         setRole, // dev helpers
//       }}
//     >
//       {isLoading ? (
//         <div className="min-h-screen flex items-center justify-center text-purple-700 font-semibold text-lg">
//           🔐 Authenticating...
//         </div>
//       ) : (
//         children
//       )}
//     </AuthContext.Provider>
//   );
// }

// export function useAuth() {
//   const ctx = useContext(AuthContext);
//   if (!ctx) throw new Error("useAuth must be used inside an AuthProvider");
//   return ctx;
// }

// import {
//   createContext,
//   useContext,
//   useState,
//   useEffect,
//   useMemo,
//   useCallback,
// } from "react";
// import axios from "axios";
// import { FEATURE_KEYS as featureKeys } from "../../../components/FeatureAccess/featureKeyConfig";

// const AuthContext = createContext(null);

// export function AuthProvider({ children }) {
//   const [role, setRole] = useState("");
//   const [businessId, setBusinessId] = useState(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [availableFeatures, setAvailableFeatures] = useState({});

//   const isAuthenticated = useMemo(() => !!role, [role]);

//   const clearAuthData = () => {
//     setRole("");
//     setBusinessId(null);
//     setAvailableFeatures({});
//     console.log("🧹 [Auth] Auth data cleared.");
//   };

//   // ✅ Wrap loadSession in useCallback to avoid linter warning
//   const loadSession = useCallback(async () => {
//     setIsLoading(true);
//     try {
//       const { data: session } = await axios.get("/api/auth/session", {
//         withCredentials: true,
//       });

//       const { role: rawRole, businessId: sessionBusinessId } = session;

//       const safeRole = (rawRole || "").toLowerCase();
//       setRole(safeRole);
//       setBusinessId(sessionBusinessId || null);

//       if (safeRole === "superadmin") {
//         // 🟢 Enable all features for superadmin
//         const all = {};
//         Object.values(featureKeys).forEach(key => {
//           all[key] = true;
//         });
//         setAvailableFeatures(all);
//       } else {
//         // ✅ Business user: Fetch plan + override aware feature list
//         const { data } = await axios.get("/api/feature-access/me", {
//           withCredentials: true,
//         });

//         const map = {};
//         (data || []).forEach(f => {
//           const isAllowed = f.isOverridden ?? f.isAvailableInPlan;
//           map[f.featureCode] = isAllowed;
//         });
//         console.log("✅ [Available Features]", map);
//         setAvailableFeatures(map);
//       }
//     } catch (error) {
//       console.warn("❌ [Auth] Session failed:", error?.message);
//       clearAuthData();
//     } finally {
//       setIsLoading(false);
//     }
//   }, []); // 👈 NO dependencies needed here

//   useEffect(() => {
//     loadSession();
//   }, [loadSession]); // 👈 Dependency fixed

//   const refreshAuthContext = async () => {
//     console.log("🔁 [Auth] Manual refresh triggered...");
//     await loadSession();
//   };

//   useEffect(() => {
//     console.log("🔔 [Auth State]", {
//       role,
//       businessId,
//       isAuthenticated,
//       availableFeatures,
//     });
//   }, [role, businessId, isAuthenticated, availableFeatures]);

//   return (
//     <AuthContext.Provider
//       value={{
//         role,
//         businessId,
//         availableFeatures,
//         isAuthenticated,
//         isLoading,
//         refreshAuthContext,
//         clearAuthData,
//         setRole,
//       }}
//     >
//       {isLoading ? (
//         <div className="min-h-screen flex items-center justify-center text-purple-700 font-semibold text-lg">
//           🔐 Authenticating...
//         </div>
//       ) : (
//         children
//       )}
//     </AuthContext.Provider>
//   );
// }

// export function useAuth() {
//   const context = useContext(AuthContext);
//   if (!context) {
//     throw new Error("useAuth must be used inside an AuthProvider");
//   }
//   return context;
// }

// import { createContext, useContext, useState, useEffect, useMemo } from "react";
// import axios from "axios";
// import { FEATURE_KEYS as featureKeys } from "../../../components/FeatureAccess/featureKeyConfig";

// const AuthContext = createContext(null);

// export function AuthProvider({ children }) {
//   const [role, setRole] = useState("");
//   const [businessId, setBusinessId] = useState(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [availableFeatures, setAvailableFeatures] = useState({});

//   const isAuthenticated = useMemo(() => !!role, [role]);

//   const clearAuthData = () => {
//     setRole("");
//     setBusinessId(null);
//     setAvailableFeatures({});
//     console.log("🧹 [Auth] Auth data cleared.");
//   };

//   const loadSession = async () => {
//     setIsLoading(true);
//     try {
//       const { data: session } = await axios.get("/api/auth/session", {
//         withCredentials: true,
//       });

//       const { role: rawRole, businessId: sessionBusinessId } = session;

//       const safeRole = (rawRole || "").toLowerCase();
//       setRole(safeRole);
//       setBusinessId(sessionBusinessId || null);

//       if (safeRole === "superadmin") {
//         // 🟢 Enable all features for superadmin
//         const all = {};
//         // featureKeys.forEach(key => (all[key] = true));
//         Object.values(featureKeys).forEach(key => {
//           all[key] = true;
//         });

//         setAvailableFeatures(all);
//       } else {
//         // ✅ Business user: Fetch plan + override aware feature list
//         const { data } = await axios.get("/api/feature-access/me", {
//           withCredentials: true,
//         });

//         const map = {};
//         (data || []).forEach(f => {
//           const isAllowed = f.isOverridden ?? f.isAvailableInPlan;
//           map[f.featureCode] = isAllowed;
//         });
//         console.log("✅ [Available Features]", map);
//         setAvailableFeatures(map);
//       }
//     } catch (error) {
//       console.warn("❌ [Auth] Session failed:", error?.message);
//       clearAuthData();
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   useEffect(() => {
//     loadSession();
//   }, []);

//   const refreshAuthContext = async () => {
//     console.log("🔁 [Auth] Manual refresh triggered...");
//     await loadSession();
//   };

//   useEffect(() => {
//     console.log("🔔 [Auth State]", {
//       role,
//       businessId,
//       isAuthenticated,
//       availableFeatures,
//     });
//   }, [role, businessId, isAuthenticated, availableFeatures]);

//   return (
//     <AuthContext.Provider
//       value={{
//         role,
//         businessId,
//         availableFeatures,
//         isAuthenticated,
//         isLoading,
//         refreshAuthContext,
//         clearAuthData,
//         setRole,
//       }}
//     >
//       {isLoading ? (
//         <div className="min-h-screen flex items-center justify-center text-purple-700 font-semibold text-lg">
//           🔐 Authenticating...
//         </div>
//       ) : (
//         children
//       )}
//     </AuthContext.Provider>
//   );
// }

// export function useAuth() {
//   const context = useContext(AuthContext);
//   if (!context) {
//     throw new Error("useAuth must be used inside an AuthProvider");
//   }
//   return context;
// }
