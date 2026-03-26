import { useState } from "react";

export default function Navbar({ onMenuToggle }) {
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <header className="fixed top-0 left-64 right-0 h-16 bg-white shadow-sm z-20 flex items-center px-6 gap-4">
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

      {/* Notification bell */}
      <button className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
      </button>

      {/* User Avatar + Info */}
      <div className="flex items-center gap-3 pl-3 border-l border-gray-100">
        <div className="relative">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-amber-400 flex items-center justify-center ring-2 ring-amber-200">
            <svg className="w-7 h-7 text-amber-900" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-white rounded-full"></span>
        </div>
        <div className="hidden sm:block">
          <p className="text-sm font-semibold text-gray-800 leading-tight">Aman admin</p>
          <p className="text-xs text-gray-400 leading-tight">Admin</p>
        </div>
        <svg className="w-4 h-4 text-gray-400 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </header>
  );
}
