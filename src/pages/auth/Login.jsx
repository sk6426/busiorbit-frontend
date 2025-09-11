// src/pages/auth/Login.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { login } from "./services/authService";
import { useAuth } from "./context/pld_AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { refreshAuthContext } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      await refreshAuthContext();
      // 🔁 Bust cached auth state across tabs/sessions
      try {
        localStorage.setItem("xb_session_stamp", String(Date.now()));
      } catch {}
      // Optional: clear any UI state that shouldn’t leak between users
      try {
        localStorage.removeItem("messaging-pinned");
        localStorage.removeItem("messaging-archived");
        localStorage.removeItem("messaging-order");
      } catch {}

      toast.success("✅ Login successful");

      // 🔒 Always land on /app (no previous user’s deep route)
      navigate("/app", { replace: true });
    } catch (err) {
      const message =
        err?.response?.data?.message || err?.message || "❌ Login failed.";
      const isWarning =
        message.toLowerCase().includes("pending") ||
        message.toLowerCase().includes("under review");

      (isWarning ? toast.warn : toast.error)(message);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const isWarning =
    error.toLowerCase().includes("pending") ||
    error.toLowerCase().includes("under review");

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center px-6 md:px-20 lg:px-36"
      data-test-id="login-page"
    >
      <div className="flex flex-col md:flex-row w-full max-w-6xl shadow-2xl rounded-3xl overflow-hidden bg-white">
        {/* Left Side Image */}
        <div className="md:w-1/2 hidden md:block">
          <img
            src="/loginpage_.png"
            alt="Visual"
            className="h-full w-full object-cover"
          />
        </div>

        {/* Right Side Form */}
        <div className="w-full md:w-1/2 flex flex-col justify-center px-8 sm:px-12 md:px-16 lg:px-20 py-12">
          <div className="flex justify-center mb-4">
            <img src="/logo_5.svg" alt="xByteChat Logo" className="h-10" />
          </div>

          <h2 className="text-2xl font-bold text-center text-purple-800 mb-6">
            Welcome to <span className="text-purple-900">xByteChat</span>
          </h2>

          {error && (
            <div
              className={`p-3 rounded-lg mb-4 text-sm text-center font-medium shadow ${
                isWarning
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-red-100 text-red-700"
              }`}
              role="alert"
              aria-live="polite"
              data-test-id="auth-error"
            >
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
            data-test-id="login-form"
            aria-busy={loading ? "true" : "false"}
          >
            <div>
              <label className="text-sm font-semibold text-gray-700">
                Email
              </label>
              <input
                type="email"
                className="mt-1 w-full p-2 px-4 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="username email"
                name="email"
                data-test-id="login-email"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="mt-1 w-full p-2 px-4 pr-10 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  name="password"
                  data-test-id="login-password"
                />
                <span
                  className="absolute right-3 top-3 cursor-pointer text-gray-400"
                  onClick={() => setShowPassword(prev => !prev)}
                  data-test-id="toggle-password-visibility"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  role="button"
                >
                  {showPassword ? "🙈" : "👁️"}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg font-medium transition disabled:opacity-60"
              data-test-id="login-submit"
            >
              {loading ? "🔐 Logging in..." : "Login"}
            </button>
          </form>

          <div className="text-center mt-5 text-sm text-gray-600">
            Don’t have an account?{" "}
            <Link
              to="/signup"
              className="text-purple-600 hover:underline font-medium"
              data-test-id="signup-link"
            >
              Create business profile
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

// import React, { useState } from "react";
// import { useNavigate, useLocation, Link } from "react-router-dom";
// import { toast } from "react-toastify";
// import { login } from "./services/authService";
// import { useAuth } from "./context/pld_AuthContext";

// const Login = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const params = new URLSearchParams(location.search);
//   const redirectTo = params.get("redirectTo");

//   const { refreshAuthContext } = useAuth();

//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [error, setError] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [showPassword, setShowPassword] = useState(false);

//   const handleSubmit = async e => {
//     e.preventDefault();
//     setError("");
//     setLoading(true);

//     try {
//       await login(email, password); // 🔐 Cookie is set by server
//       await refreshAuthContext(); // 🔄 Pull fresh role/plan/status

//       toast.success("✅ Login successful");
//       setTimeout(() => {
//         const target = redirectTo || "/app/campaign";
//         // const target = redirectTo || "/businesses/dashboard";
//         console.log("🚀 Navigating to:", target);
//         navigate(target);
//       }, 200); // ⏱️ Add delay to ensure context is ready
//     } catch (err) {
//       console.error(err);
//       const message =
//         err?.response?.data?.message || err?.message || "❌ Login failed.";

//       if (
//         message.toLowerCase().includes("pending") ||
//         message.toLowerCase().includes("under review")
//       ) {
//         toast.warn(message);
//       } else {
//         toast.error(message);
//       }

//       setError(message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const isWarning =
//     error.toLowerCase().includes("pending") ||
//     error.toLowerCase().includes("under review");

//   return (
//     <div
//       className="min-h-screen bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center px-6 md:px-20 lg:px-36"
//       data-test-id="login-page"
//     >
//       <div className="flex flex-col md:flex-row w-full max-w-6xl shadow-2xl rounded-3xl overflow-hidden bg-white">
//         {/* Left Side Image */}
//         <div className="md:w-1/2 hidden md:block">
//           <img
//             src="/loginpage_.png"
//             alt="Visual"
//             className="h-full w-full object-cover"
//           />
//         </div>

//         {/* Right Side Form */}
//         <div className="w-full md:w-1/2 flex flex-col justify-center px-8 sm:px-12 md:px-16 lg:px-20 py-12">
//           <div className="flex justify-center mb-4">
//             <img src="/logo_5.svg" alt="xByteChat Logo" className="h-10" />
//           </div>

//           <h2 className="text-2xl font-bold text-center text-purple-800 mb-6">
//             Welcome to <span className="text-purple-900">xByteChat</span>
//           </h2>

//           {error && (
//             <div
//               className={`p-3 rounded-lg mb-4 text-sm text-center font-medium shadow ${
//                 isWarning
//                   ? "bg-yellow-100 text-yellow-800"
//                   : "bg-red-100 text-red-700"
//               }`}
//               role="alert"
//               aria-live="polite"
//               data-test-id="auth-error"
//             >
//               {error}
//             </div>
//           )}

//           <form
//             onSubmit={handleSubmit}
//             className="space-y-5"
//             data-test-id="login-form"
//             aria-busy={loading ? "true" : "false"}
//           >
//             <div>
//               <label className="text-sm font-semibold text-gray-700">
//                 Email
//               </label>
//               <input
//                 type="email"
//                 className="mt-1 w-full p-2 px-4 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
//                 placeholder="you@example.com"
//                 value={email}
//                 onChange={e => setEmail(e.target.value)}
//                 required
//                 autoComplete="username email"
//                 name="email"
//                 data-test-id="login-email"
//               />
//             </div>

//             <div>
//               <label className="text-sm font-semibold text-gray-700">
//                 Password
//               </label>
//               <div className="relative">
//                 <input
//                   type={showPassword ? "text" : "password"}
//                   className="mt-1 w-full p-2 px-4 pr-10 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
//                   placeholder="••••••••"
//                   value={password}
//                   onChange={e => setPassword(e.target.value)}
//                   required
//                   autoComplete="current-password"
//                   name="password"
//                   data-test-id="login-password"
//                 />
//                 <span
//                   className="absolute right-3 top-3 cursor-pointer text-gray-400"
//                   onClick={() => setShowPassword(prev => !prev)}
//                   data-test-id="toggle-password-visibility"
//                   aria-label={showPassword ? "Hide password" : "Show password"}
//                   role="button"
//                 >
//                   {showPassword ? "🙈" : "👁️"}
//                 </span>
//               </div>
//             </div>

//             <button
//               type="submit"
//               disabled={loading}
//               className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg font-medium transition disabled:opacity-60"
//               data-test-id="login-submit"
//             >
//               {loading ? "🔐 Logging in..." : "Login"}
//             </button>
//           </form>

//           <div className="text-center mt-5 text-sm text-gray-600">
//             Don’t have an account?{" "}
//             <Link
//               to="/signup"
//               className="text-purple-600 hover:underline font-medium"
//               data-test-id="signup-link"
//             >
//               Create business profile
//             </Link>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Login;

// import React, { useState } from "react";
// import { useNavigate, useLocation, Link } from "react-router-dom";
// import { toast } from "react-toastify";
// import { login } from "./services/authService";
// import { useAuth } from "./context/AuthContext";

// const Login = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const params = new URLSearchParams(location.search);
//   const redirectTo = params.get("redirectTo");

//   const { refreshAuthContext } = useAuth();

//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [error, setError] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [showPassword, setShowPassword] = useState(false);

//   const handleSubmit = async e => {
//     e.preventDefault();
//     setError("");
//     setLoading(true);

//     try {
//       await login(email, password); // 🔐 Cookie is set by server
//       await refreshAuthContext(); // 🔄 Pull fresh role/plan/status

//       toast.success("✅ Login successful");
//       setTimeout(() => {
//         const target = redirectTo || "/app/crm";
//         // const target = redirectTo || "/businesses/dashboard";
//         console.log("🚀 Navigating to:", target);
//         navigate(target);
//       }, 200); // ⏱️ Add delay to ensure context is ready
//     } catch (err) {
//       console.error(err);
//       const message =
//         err?.response?.data?.message || err?.message || "❌ Login failed.";

//       if (
//         message.toLowerCase().includes("pending") ||
//         message.toLowerCase().includes("under review")
//       ) {
//         toast.warn(message);
//       } else {
//         toast.error(message);
//       }

//       setError(message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const isWarning =
//     error.toLowerCase().includes("pending") ||
//     error.toLowerCase().includes("under review");

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center px-6 md:px-20 lg:px-36">
//       <div className="flex flex-col md:flex-row w-full max-w-6xl shadow-2xl rounded-3xl overflow-hidden bg-white">
//         {/* Left Side Image */}
//         <div className="md:w-1/2 hidden md:block">
//           <img
//             src="/loginpage_.png"
//             alt="Visual"
//             className="h-full w-full object-cover"
//           />
//         </div>

//         {/* Right Side Form */}
//         <div className="w-full md:w-1/2 flex flex-col justify-center px-8 sm:px-12 md:px-16 lg:px-20 py-12">
//           <div className="flex justify-center mb-4">
//             <img src="/logo_5.svg" alt="xByteChat Logo" className="h-10" />
//           </div>

//           <h2 className="text-2xl font-bold text-center text-purple-800 mb-6">
//             Welcome to <span className="text-purple-900">xByteChat</span>
//           </h2>

//           {error && (
//             <div
//               className={`p-3 rounded-lg mb-4 text-sm text-center font-medium shadow ${
//                 isWarning
//                   ? "bg-yellow-100 text-yellow-800"
//                   : "bg-red-100 text-red-700"
//               }`}
//             >
//               {error}
//             </div>
//           )}

//           <form onSubmit={handleSubmit} className="space-y-5">
//             <div>
//               <label className="text-sm font-semibold text-gray-700">
//                 Email
//               </label>
//               <input
//                 type="email"
//                 className="mt-1 w-full p-2 px-4 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
//                 placeholder="you@example.com"
//                 value={email}
//                 onChange={e => setEmail(e.target.value)}
//                 required
//               />
//             </div>

//             <div>
//               <label className="text-sm font-semibold text-gray-700">
//                 Password
//               </label>
//               <div className="relative">
//                 <input
//                   type={showPassword ? "text" : "password"}
//                   className="mt-1 w-full p-2 px-4 pr-10 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
//                   placeholder="••••••••"
//                   value={password}
//                   onChange={e => setPassword(e.target.value)}
//                   required
//                 />
//                 <span
//                   className="absolute right-3 top-3 cursor-pointer text-gray-400"
//                   onClick={() => setShowPassword(prev => !prev)}
//                 >
//                   {showPassword ? "🙈" : "👁️"}
//                 </span>
//               </div>
//             </div>

//             <button
//               type="submit"
//               disabled={loading}
//               className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg font-medium transition disabled:opacity-60"
//             >
//               {loading ? "🔐 Logging in..." : "Login"}
//             </button>
//           </form>

//           <div className="text-center mt-5 text-sm text-gray-600">
//             Don’t have an account?{" "}
//             <Link
//               to="/signup"
//               className="text-purple-600 hover:underline font-medium"
//             >
//               Create business profile
//             </Link>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Login;
