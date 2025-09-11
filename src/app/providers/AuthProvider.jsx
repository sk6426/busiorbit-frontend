import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { getAuthFromToken } from "../../utils/jwt";
import axiosClient from "../../api/axiosClient"; // ✅ use your axios client

const ACCESS_TOKEN_KEY = "accessToken";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [role, setRole] = useState("");
  const [planId, setPlanId] = useState(null);
  const [businessId, setBusinessId] = useState(null);
  const [userName, setUserName] = useState("User");
  const [isLoading, setIsLoading] = useState(true);

  // permissions & features visible to the app
  const [permissions, setPermissions] = useState(new Set()); // <-- union of JWT + plan
  const [availableFeatures, setAvailableFeatures] = useState({}); // { Settings:true, Messaging:true, ... }
  const [hasAllAccess, setHasAllAccess] = useState(false);

  const isAuthenticated = useMemo(() => !!role, [role]);

  const clearAuthData = useCallback(() => {
    setRole("");
    setPlanId(null);
    setBusinessId(null);
    setUserName("User");
    setPermissions(new Set());
    setAvailableFeatures({});
    setHasAllAccess(false);
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
    } catch {}
    clearAuthData();
    window.location.replace("/login");
  }, [clearAuthData]);

  const can = useCallback(
    code => (hasAllAccess ? true : permissions.has(code)),
    [permissions, hasAllAccess]
  );

  const loadSession = useCallback(async () => {
    setIsLoading(true);
    try {
      const auth = getAuthFromToken();

      if (!auth?.isAuth) {
        clearAuthData();
        return;
      }

      setRole(auth.role || "");
      setPlanId(auth.planId || null);
      setBusinessId(auth.businessId || null);
      setUserName(auth.name || "User");

      // 1) permissions from JWT
      const jwtPerms = new Set(
        (auth.permissionsCsv || "")
          .split(",")
          .map(s => s.trim())
          .filter(Boolean)
      );

      // 2) features from JWT (flags for UI buckets like “Settings”, “Messaging”, etc.)
      const feats = (auth.featuresCsv || "")
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);
      const featsMap = Object.fromEntries(feats.map(f => [f, true]));

      // 3) if not superadmin and we have a plan, merge plan permissions from API
      let merged = new Set(jwtPerms);
      const isSuper = (auth.role || "").toLowerCase() === "superadmin";
      if (!isSuper) {
        try {
          const res = await axiosClient.get("/plan/me/permissions");
          // shape: { planId, plan: {id,code,name,...} , permissions: [ "code", ... ] }
          const planCodes = Array.isArray(res?.data?.permissions)
            ? res.data.permissions
            : [];
          for (const c of planCodes) merged.add(c);

          // (optional) you can also flip on some feature flags based on plan if you want
          // e.g. if planCodes include "settings.whatsapp.view", expose Settings section too
          if (planCodes.includes("settings.whatsapp.view")) {
            featsMap.Settings = true;
          }
        } catch (e) {
          // non-fatal; just log
          if (process.env.NODE_ENV !== "production") {
            // eslint-disable-next-line no-console
            console.warn(
              "[AuthProvider] /plan/me/permissions failed:",
              e?.message || e
            );
          }
        }
      }

      setPermissions(merged);
      setAvailableFeatures(featsMap);

      setHasAllAccess(
        auth.hasAllAccess === true || auth.hasAllAccess === "true" || isSuper
      );
    } catch (err) {
      console.warn("[Auth] loadSession failed:", err?.message || err);
      clearAuthData();
    } finally {
      setIsLoading(false);
    }
  }, [clearAuthData]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  useEffect(() => {
    const onStorage = e => {
      if (e.key === "xb_session_stamp") {
        loadSession();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [loadSession]);

  const refreshAuthContext = async () => {
    await loadSession();
  };

  const value = {
    // identity
    role,
    planId,
    businessId,
    userName,

    // session state
    isAuthenticated,
    isLoading,

    // access control
    hasAllAccess,
    can,
    availableFeatures,

    // helpers
    refreshAuthContext,
    clearAuthData,
    logout,
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

// // src/app/providers/AuthProvider.jsx
// import {
//   createContext,
//   useContext,
//   useState,
//   useEffect,
//   useMemo,
//   useCallback,
// } from "react";
// import { getAuthFromToken } from "../../utils/jwt";

// // ⛳️ If your token is stored under a different key, change this:
// const ACCESS_TOKEN_KEY = "accessToken";

// const AuthContext = createContext(null);

// export function AuthProvider({ children }) {
//   const [role, setRole] = useState("");
//   const [planId, setPlanId] = useState(null);
//   const [businessId, setBusinessId] = useState(null);
//   const [userName, setUserName] = useState("User");
//   const [isLoading, setIsLoading] = useState(true);

//   // from token
//   const [permissions, setPermissions] = useState(new Set());
//   const [availableFeatures, setAvailableFeatures] = useState({}); // { Messaging: true, ... }
//   const [hasAllAccess, setHasAllAccess] = useState(false);

//   const isAuthenticated = useMemo(() => !!role, [role]);

//   const clearAuthData = useCallback(() => {
//     setRole("");
//     setPlanId(null);
//     setBusinessId(null);
//     setUserName("User");
//     setPermissions(new Set());
//     setAvailableFeatures({});
//     setHasAllAccess(false);
//   }, []);

//   const logout = useCallback(() => {
//     try {
//       localStorage.removeItem(ACCESS_TOKEN_KEY);
//     } catch {}
//     clearAuthData();
//     // Do not preserve deep path on logout
//     window.location.replace("/login");
//   }, [clearAuthData]);

//   const can = useCallback(
//     code => (hasAllAccess ? true : permissions.has(code)),
//     [permissions, hasAllAccess]
//   );

//   const loadSession = useCallback(async () => {
//     setIsLoading(true);
//     try {
//       // getAuthFromToken should read localStorage/sessionStorage,
//       // decode the JWT, verify exp (if you implement it), and return decoded claims.
//       // Expected shape:
//       // { isAuth, role, planId, businessId, name, permissionsCsv, featuresCsv, hasAllAccess }
//       const auth = getAuthFromToken();

//       if (!auth?.isAuth) {
//         clearAuthData();
//         return;
//       }

//       setRole(auth.role || "");
//       setPlanId(auth.planId || null);
//       setBusinessId(auth.businessId || null);
//       setUserName(auth.name || "User");

//       // Parse permissions CSV from token
//       const permSet = new Set(
//         (auth.permissionsCsv || "")
//           .split(",")
//           .map(s => s.trim())
//           .filter(Boolean)
//       );
//       setPermissions(permSet);

//       // Parse features CSV from token → to { key: true }
//       const feats = (auth.featuresCsv || "")
//         .split(",")
//         .map(s => s.trim())
//         .filter(Boolean);
//       setAvailableFeatures(Object.fromEntries(feats.map(f => [f, true])));

//       setHasAllAccess(
//         auth.hasAllAccess === true ||
//           auth.hasAllAccess === "true" ||
//           auth.role === "superadmin"
//       );
//     } catch (err) {
//       console.warn("[Auth] loadSession failed:", err?.message || err);
//       clearAuthData();
//     } finally {
//       setIsLoading(false);
//     }
//   }, [clearAuthData]);

//   useEffect(() => {
//     loadSession();
//   }, [loadSession]);

//   // 🔁 Re-hydrate when another tab/session updates the session stamp
//   useEffect(() => {
//     const onStorage = e => {
//       if (e.key === "xb_session_stamp") {
//         loadSession();
//       }
//     };
//     window.addEventListener("storage", onStorage);
//     return () => window.removeEventListener("storage", onStorage);
//   }, [loadSession]);

//   // ⤴️ Optional: re-read on tab focus during QA (comment out if not desired)
//   useEffect(() => {
//     const onFocus = () => {
//       // If you want an eager refresh on tab focus, uncomment:
//       // loadSession();
//     };
//     window.addEventListener("focus", onFocus);
//     return () => window.removeEventListener("focus", onFocus);
//   }, [loadSession]);

//   const refreshAuthContext = async () => {
//     await loadSession();
//   };

//   const value = {
//     // identity
//     role,
//     planId,
//     businessId,
//     userName,

//     // session state
//     isAuthenticated,
//     isLoading,

//     // access control
//     hasAllAccess,
//     can,
//     availableFeatures, // <-- use this in sidebar/workspaces

//     // helpers
//     refreshAuthContext,
//     clearAuthData,
//     logout, // new helper
//   };

//   return (
//     <AuthContext.Provider value={value}>
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

// // src/app/providers/AuthProvider.jsx
// import {
//   createContext,
//   useContext,
//   useState,
//   useEffect,
//   useMemo,
//   useCallback,
// } from "react";
// import { getAuthFromToken } from "../../utils/jwt";

// const AuthContext = createContext(null);

// export function AuthProvider({ children }) {
//   const [role, setRole] = useState("");
//   const [planId, setPlanId] = useState(null);
//   const [businessId, setBusinessId] = useState(null);
//   const [userName, setUserName] = useState("User");
//   const [isLoading, setIsLoading] = useState(true);

//   // from token
//   const [permissions, setPermissions] = useState(new Set());
//   const [availableFeatures, setAvailableFeatures] = useState({}); // { Messaging: true, ... }
//   const [hasAllAccess, setHasAllAccess] = useState(false);

//   const isAuthenticated = useMemo(() => !!role, [role]);

//   const clearAuthData = useCallback(() => {
//     setRole("");
//     setPlanId(null);
//     setBusinessId(null);
//     setUserName("User");
//     setPermissions(new Set());
//     setAvailableFeatures({});
//     setHasAllAccess(false);
//   }, []);

//   const can = useCallback(
//     code => (hasAllAccess ? true : permissions.has(code)),
//     [permissions, hasAllAccess]
//   );

//   const loadSession = useCallback(async () => {
//     setIsLoading(true);
//     try {
//       // getAuthFromToken should read localStorage/sessionStorage,
//       // decode the JWT, verify exp, and return decoded claims.
//       const auth = getAuthFromToken(); // { isAuth, role, planId, businessId, name, permissionsCsv, featuresCsv, hasAllAccess }

//       if (!auth?.isAuth) {
//         clearAuthData();
//         return;
//       }

//       setRole(auth.role || "");
//       setPlanId(auth.planId || null);
//       setBusinessId(auth.businessId || null);
//       setUserName(auth.name || "User");

//       // Parse permissions CSV from token
//       const permSet = new Set(
//         (auth.permissionsCsv || "")
//           .split(",")
//           .map(s => s.trim())
//           .filter(Boolean)
//       );
//       setPermissions(permSet);

//       // Parse features CSV from token → to { key: true }
//       const feats = (auth.featuresCsv || "")
//         .split(",")
//         .map(s => s.trim())
//         .filter(Boolean);
//       setAvailableFeatures(Object.fromEntries(feats.map(f => [f, true])));

//       setHasAllAccess(
//         auth.hasAllAccess === true ||
//           auth.hasAllAccess === "true" ||
//           auth.role === "superadmin"
//       );
//     } catch (err) {
//       console.warn("[Auth] loadSession failed:", err?.message || err);
//       clearAuthData();
//     } finally {
//       setIsLoading(false);
//     }
//   }, [clearAuthData]);

//   useEffect(() => {
//     loadSession();
//   }, [loadSession]);

//   const refreshAuthContext = async () => {
//     await loadSession();
//   };

//   const value = {
//     // identity
//     role,
//     planId,
//     businessId,
//     userName,

//     // session state
//     isAuthenticated,
//     isLoading,

//     // access control
//     hasAllAccess,
//     can,
//     availableFeatures, // <-- use this in sidebar/workspaces

//     // helpers
//     refreshAuthContext,
//     clearAuthData,
//   };

//   return (
//     <AuthContext.Provider value={value}>
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

// // src/app/providers/AuthProvider.jsx
// import {
//   createContext,
//   useContext,
//   useState,
//   useEffect,
//   useMemo,
//   useCallback,
// } from "react";
// import axiosClient from "../../api/axiosClient";
// import { getAuthFromToken } from "../../utils/jwt";

// const AuthContext = createContext(null);

// export function AuthProvider({ children }) {
//   const [role, setRole] = useState("");
//   const [planId, setPlanId] = useState(null);
//   const [businessId, setBusinessId] = useState(null);
//   const [userName, setUserName] = useState("User");
//   const [isLoading, setIsLoading] = useState(true);

//   // authoritative permissions from server (array of strings) or ["*"]
//   const [perms, setPerms] = useState([]);

//   const hasAllAccess = useMemo(
//     () => perms.includes("*") || role === "superadmin",
//     [perms, role]
//   );
//   const isAuthenticated = useMemo(() => !!role, [role]);

//   const clearAuthData = () => {
//     setRole("");
//     setPlanId(null);
//     setBusinessId(null);
//     setUserName("User");
//     setPerms([]);
//   };

//   const can = useCallback(
//     code => (hasAllAccess ? true : perms.includes(code)),
//     [perms, hasAllAccess]
//   );

//   const loadSession = useCallback(async () => {
//     setIsLoading(true);
//     try {
//       const auth = getAuthFromToken(); // reads JWT; enforces exp
//       if (!auth.isAuth) {
//         clearAuthData();
//         return;
//       }
//       setRole(auth.role);
//       setPlanId(auth.planId || null);
//       setBusinessId(auth.businessId || null);
//       setUserName(auth.name || "User");

//       // pull permissions from server (authoritative)
//       const { data } = await axiosClient.get("/plan/me/permissions"); // returns string[] or ["*"]
//       setPerms(Array.isArray(data) ? data : []);
//     } catch (err) {
//       console.warn("[Auth] loadSession failed:", err?.message);
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

//   const value = {
//     role,
//     planId,
//     businessId,
//     userName,
//     isAuthenticated,
//     isLoading,
//     hasAllAccess,
//     can,
//     refreshAuthContext,
//     clearAuthData,
//   };

//   return (
//     <AuthContext.Provider value={value}>
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
