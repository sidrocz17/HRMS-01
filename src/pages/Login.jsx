import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ROLE_REDIRECT, normalizeRole } from "../config/roles.jsx";

const API_BASE_URL = (
  import.meta.env.DEV
    ? ""
    : (import.meta.env.VITE_API_BASE_URL || "http://172.16.219.107:8080")
).replace(/\/+$/, "");

const NetworkIcon = () => (
  <svg width="32" height="32" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="18" cy="18" r="3.5" fill="white" />
    <circle cx="6" cy="10" r="2.5" fill="white" />
    <circle cx="30" cy="10" r="2.5" fill="white" />
    <circle cx="6" cy="26" r="2.5" fill="white" />
    <circle cx="30" cy="26" r="2.5" fill="white" />
    <line x1="18" y1="18" x2="6" y2="10" stroke="white" strokeWidth="1.4" />
    <line x1="18" y1="18" x2="30" y2="10" stroke="white" strokeWidth="1.4" />
    <line x1="18" y1="18" x2="6" y2="26" stroke="white" strokeWidth="1.4" />
    <line x1="18" y1="18" x2="30" y2="26" stroke="white" strokeWidth="1.4" />
    <line x1="6" y1="10" x2="6" y2="26" stroke="white" strokeWidth="1" strokeDasharray="2 2" />
    <line x1="30" y1="10" x2="30" y2="26" stroke="white" strokeWidth="1" strokeDasharray="2 2" />
  </svg>
);

const EmailIcon = () => (
  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const EyeIcon = ({ open }) => open ? (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
) : (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
);

export default function XcelTechSplitLogin() {
  const [email, setEmail]                   = useState("");
  const [password, setPassword]             = useState("");
  const [remember, setRemember]             = useState(false);
  const [showPassword, setShowPassword]     = useState(false);
  const [loading, setLoading]               = useState(false);
  const [emailFocused, setEmailFocused]     = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role  = normalizeRole(localStorage.getItem("role"));
    if (token && role) {
      navigate(ROLE_REDIRECT[role] || "/dashboard", { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    const username = email.trim();

    if (!username || !password) {
      alert("Please enter both username and password.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/auth/login`,
        { username, password },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = response.data;
      console.log("Login response:", data);

      const token = data.accessToken || data.token;
      if (!token) {
        throw new Error("Token missing in login response");
      }
      localStorage.setItem("token", token);

      const userRole = normalizeRole(data.role || data.user?.role || "admin");
        localStorage.setItem("role", userRole);

      localStorage.setItem("user", JSON.stringify({
        id:        data.id || data.user?.id || data.userId || data.user?.userId || data.uuid || data.user?.uuid || data.employeeId || data.user?.employeeId || data.empId || data.user?.empId,
        userId:    data.userId || data.user?.userId || data.id || data.user?.id,
        uuid:      data.uuid || data.user?.uuid,
        employeeId: data.employeeId || data.user?.employeeId || data.empId || data.user?.empId,
        firstName: data.firstName || data.user?.firstName,
        lastName:  data.lastName || data.user?.lastName,
        email:     data.email || data.user?.email,
        image:     data.image || data.user?.image,
        role:      userRole,
      }));

      const redirectPath = ROLE_REDIRECT[userRole] || "/dashboard";
      navigate(redirectPath, { replace: true });

    } catch (error) {
      const status = error.response?.status;
      const errorData = error.response?.data;
      const message =
        errorData?.message ||
        error.message ||
        "Login failed ❌";

      console.error("Login error:", {
        url: `${API_BASE_URL}/auth/login`,
        status,
        data: errorData,
        message: error.message,
      });

      if (status === 400) {
        alert(`${message}\nAPI: ${API_BASE_URL}/auth/login`);
      } else {
        alert(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <div className="hidden md:flex md:w-3/4 relative flex-col">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/src/assets/Honest.jpg')",
          }}
        />

        <div className="relative z-10 p-8">
          <div className="flex items-center gap-2.5">
            <NetworkIcon />
            <span className="text-white font-black text-lg tracking-widest" style={{ letterSpacing: "0.18em" }}>
              XCEL<span style={{ color: "#FFC107" }}>TECH</span>
            </span>
          </div>
        </div>

        <div className="relative z-10 mt-auto p-10 pb-12">
          <div className="w-10 h-1 mb-5 rounded-full" style={{ background: "#FFC107" }} />
          <h2 className="text-white font-bold text-3xl leading-snug mb-3" style={{ maxWidth: 340 }}>
            Smart Workforce<br />Management
          </h2>
          <p className="text-gray-300 text-sm leading-relaxed" style={{ maxWidth: 320 }}>
            Manage employees, attendance, and performance efficiently — all in one platform.
          </p>
          <div className="flex gap-8 mt-8">
            {[["10K+", "Employees"], ["99.9%", "Uptime"], ["150+", "Companies"]].map(([val, label]) => (
              <div key={label}>
                <div className="text-white font-bold text-xl" style={{ color: "#FFC107" }}>{val}</div>
                <div className="text-gray-400 text-xs mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full md:w-1/4 flex flex-col items-center justify-between py-8 px-6" style={{ background: "#F5F6FA" }}>
        <div className="md:hidden flex items-center gap-2 mb-6 self-start">
          <span className="font-black text-lg" style={{ color: "#1a2240" }}>
            XCEL<span style={{ color: "#FFC107" }}>TECH</span>
          </span>
        </div>

        <form onSubmit={handleSubmit} className="w-full flex flex-col justify-center flex-1">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h2>
          <p className="text-sm text-gray-400 mb-8">Sign in to your account</p>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
            <div className={`flex items-center border rounded-xl px-3 py-2.5 transition-all ${
              emailFocused ? "border-[#1a2240] ring-2 ring-[#1a2240]/10 bg-white" : "border-gray-200 bg-gray-50"
            }`}>
              <EmailIcon />
              <input
                type="text"
                placeholder="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                className="flex-1 ml-2.5 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-300"
              />
            </div>
          </div>

          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
            <div className={`flex items-center border rounded-xl px-3 py-2.5 transition-all ${
              passwordFocused ? "border-[#1a2240] ring-2 ring-[#1a2240]/10 bg-white" : "border-gray-200 bg-gray-50"
            }`}>
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                className="flex-1 mx-2.5 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-300"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <EyeIcon open={showPassword} />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between mb-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 accent-[#1a2240]" />
              <span className="text-gray-600 text-xs font-medium">Remember me</span>
            </label>
            <button type="button" className="text-xs font-semibold" style={{ color: "#E6A800" }}>
              Reset Password?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg font-bold text-sm tracking-wider transition-all duration-150 ${
              loading ? "opacity-70 cursor-not-allowed" : "hover:brightness-95 active:scale-[0.98]"
            }`}
            style={{ background: "#FFC107", color: "#1C1C1C", boxShadow: "0 4px 16px rgba(255,193,7,0.3)" }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Signing In...
              </span>
            ) : "Sign In"}
          </button>

          {/* <p className="text-center text-xs text-gray-400 mt-4">
            Test: <span className="font-medium text-gray-600">emilys</span> / <span className="font-medium text-gray-600">emilyspass</span>
          </p> */}
        </form>

        <p className="text-gray-400 text-xs text-center mt-4">© 2026 XcelTech. All rights reserved.</p>
      </div>

    </div>
  );
}
