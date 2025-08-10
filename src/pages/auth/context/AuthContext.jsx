// 📄 src/pages/auth/context/AuthContext.jsx
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import axiosClient from "../../../api/axiosClient";

import { getAuthFromToken } from "../../../utils/jwt";
import { FEATURE_KEYS as featureKeys } from "../../../components/FeatureAccess/featureKeyConfig";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [role, setRole] = useState("");
  const [plan, setPlan] = useState("");
  const [businessId, setBusinessId] = useState(null);
  const [userName, setUserName] = useState("User");
  const [isLoading, setIsLoading] = useState(true);
  const [availableFeatures, setAvailableFeatures] = useState({});

  const isAuthenticated = useMemo(() => !!role, [role]);

  const clearAuthData = () => {
    setRole("");
    setPlan("");
    setBusinessId(null);
    setAvailableFeatures({});
  };

  const loadSession = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1) Read from JWT (source of truth on client)
      const auth = getAuthFromToken();
      if (!auth.isAuth) {
        clearAuthData();
        return;
      }
      setRole(auth.role);
      setPlan(auth.plan);
      setBusinessId(auth.businessId);
      setUserName(auth.name);

      // 2) Superadmin: grant all
      if (auth.role === "superadmin") {
        const all = {};
        Object.values(featureKeys).forEach(k => (all[k] = true));
        setAvailableFeatures(all);
        return;
      }

      // 3) Fetch feature map from API (Bearer via axiosClient)
      const { data } = await axiosClient.get("/feature-access/me");
      const map = {};
      (data || []).forEach(f => {
        const allowed = f.isOverridden ?? f.isAvailableInPlan;
        map[f.featureCode] = allowed;
      });
      setAvailableFeatures(map);
    } catch (err) {
      console.warn("❌ [Auth] loadSession failed:", err?.message);
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

  return (
    <AuthContext.Provider
      value={{
        role,
        plan,
        businessId,
        userName,
        availableFeatures,
        isAuthenticated,
        isLoading,
        refreshAuthContext,
        clearAuthData,
        setRole, // dev helpers
      }}
    >
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
