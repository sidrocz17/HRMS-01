import { useEffect, useMemo, useRef, useState } from "react";
import { getLoggedInEmpId, getProfile } from "../api/profileApi";
import { logoutUser } from "../api/authApi";
import { getUserFromToken } from "../utils/auth";
import { ROLE_META, ROLES } from "../config/roles.jsx";

const getInitials = (firstName, lastName, fallback = "") => {
  const first = String(firstName || "").trim().charAt(0);
  const last = String(lastName || "").trim().charAt(0);
  const pair = `${first}${last}`.toUpperCase();

  if (pair) return pair;

  return String(fallback || "")
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase() || "NA";
};

export default function Navbar({ onMenuToggle, isSidebarOpen = true }) {
  const [searchFocused, setSearchFocused] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [profile, setProfile] = useState(null);
  const menuRef = useRef(null);

  const user = getUserFromToken();

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      try {
        const empId = getLoggedInEmpId();
        if (!empId) return;

        const data = await getProfile(empId);
        if (isMounted) {
          setProfile(data);
        }
      } catch (error) {
        console.error("Failed to load navbar profile:", error);
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setShowResetModal(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const firstName =
    profile?.firstName ||
    profile?.first_name ||
    user.claims?.firstName ||
    user.claims?.first_name ||
    "";
  const lastName =
    profile?.lastName ||
    profile?.last_name ||
    user.claims?.lastName ||
    user.claims?.last_name ||
    "";
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim()
    || profile?.fullName
    || profile?.name
    || user.claims?.name
    || "User";
  const role = profile?.designation?.title
    || profile?.designationTitle
    || profile?.designation
    || ROLE_META[user.role || ROLES.EMPLOYEE]?.label
    || "Employee";

  const initials = useMemo(
    () => getInitials(firstName, lastName, fullName),
    [firstName, lastName, fullName]
  );

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      await logoutUser();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoggingOut(false);
      setMenuOpen(false);
    }
  };

  const openResetModal = () => {
    setMenuOpen(false);
    setShowResetModal(true);
  };

  return (
    <>
      <header
        className={`fixed top-0 right-0 h-16 bg-white shadow-sm z-20 flex items-center px-6 gap-4 transition-all duration-300 ${
          isSidebarOpen ? "left-64" : "left-0"
        }`}
      >
        {/* Menu Toggle */}
        <button
          onClick={onMenuToggle}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          aria-label="Toggle menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Search Bar + Dropdown */}
        <div className="flex-1 flex items-center gap-0 max-w-xl">
          <div className="flex items-center">
            <button className="flex items-center gap-1.5 bg-[#1a2240] text-white text-sm font-medium px-4 py-2.5 rounded-l-xl hover:bg-[#243055] transition-colors whitespace-nowrap">
              All Candidates
              <svg className="w-4 h-4 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
          <div
            className={`flex items-center flex-1 bg-gray-50 border border-l-0 rounded-r-xl px-4 py-2.5 transition-all ${
              searchFocused ? "border-[#1a2240] bg-white ring-2 ring-[#1a2240]/10" : "border-gray-200"
            }`}
          >
            <input
              type="text"
              placeholder="Search..."
              className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
            <button className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* User Menu */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="flex items-center gap-3 pl-3 border-l border-gray-100 rounded-xl px-2 py-1.5 hover:bg-gray-50 transition-colors"
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-amber-400 text-amber-900 flex items-center justify-center ring-2 ring-amber-200 text-sm font-bold">
                {initials}
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-white rounded-full"></span>
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-semibold text-gray-800 leading-tight">{fullName}</p>
              <p className="text-xs text-gray-400 leading-tight">{role}</p>
            </div>
            <svg
              className={`w-4 h-4 text-gray-400 hidden sm:block transition-transform ${menuOpen ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-gray-100 bg-white shadow-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/60">
                <p className="text-sm font-semibold text-gray-800">{fullName}</p>
                <p className="text-xs text-gray-500">{role}</p>
              </div>

              <button
                type="button"
                onClick={openResetModal}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 .552-.224 1.052-.586 1.414A1.994 1.994 0 0110 13v1m2-9a4 4 0 00-4 4v1H7a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2h-1V9a4 4 0 00-4-4z" />
                </svg>
                Reset Password
              </button>

              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-60"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z"
                    clipRule="evenodd"
                  />
                </svg>
                {isLoggingOut ? "Logging out..." : "Log Out"}
              </button>
            </div>
          )}
        </div>
      </header>

      {showResetModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Reset Password</h2>
              <p className="text-sm text-gray-500 mt-1">
                Password reset UI is ready to be connected when the backend/API is available.
              </p>
            </div>

            <div className="px-6 py-5">
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                This action is not connected yet. Once you have a reset password API or page, we can wire this button directly to it.
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 text-sm font-semibold text-white bg-[#1a2240] rounded-xl hover:bg-[#243055] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
