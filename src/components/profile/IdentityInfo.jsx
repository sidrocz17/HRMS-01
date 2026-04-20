// src/components/profile/IdentityInfo.jsx
// ─────────────────────────────────────────────
//  Identity Details card
//  PAN and Aadhaar are masked by default
//  Toggle individual fields to reveal
// ─────────────────────────────────────────────

import { useState } from "react";

// ── Masking helpers ────────────────────────────
const maskPAN = (value) => {
  if (!value) return "—";
  const s = String(value).trim();
  // ABCDE1234F → XXXXX1234X  (show digits, mask alpha)
  return s.replace(/./g, (c, i) => ([5, 6, 7, 8].includes(i) ? c : "X"));
};

const maskAadhaar = (value) => {
  if (!value) return "—";
  const s = String(value).replace(/\s/g, "").trim();
  // keep last 4 digits
  return "XXXX XXXX " + s.slice(-4);
};

// ── Single field row with eye toggle ──────────
function IdentityField({ label, raw, masked, icon }) {
  const [visible, setVisible] = useState(false);

  const hasValue = raw && String(raw).trim().length > 0;

  return (
    <div className="flex items-start gap-3">
      {/* Icon box */}
      <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0 text-gray-400 mt-0.5">
        {icon}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-sm font-semibold text-gray-800 font-mono tracking-wide break-all">
            {hasValue ? (visible ? String(raw).trim() : masked) : "—"}
          </p>
          {hasValue && (
            <button
              onClick={() => setVisible((v) => !v)}
              className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
              title={visible ? "Hide" : "Reveal"}
            >
              {visible ? (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
export default function IdentityInfo({ data }) {
  if (!data) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Card header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-[#1a2240]/10 flex items-center justify-center">
          <svg className="w-4 h-4 text-[#1a2240]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
              d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
          </svg>
        </div>
        <h2 className="text-sm font-bold text-gray-900">Identity Details</h2>
        <span className="ml-auto text-xs text-gray-400 italic">Sensitive — click eye to reveal</span>
      </div>

      {/* Fields */}
      <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-5">

        <IdentityField
          label="PAN Number"
          raw={data.panNum}
          masked={maskPAN(data.panNum)}
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          }
        />

        <IdentityField
          label="Aadhaar Number"
          raw={data.aadharNum}
          masked={maskAadhaar(data.aadharNum)}
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M15 9a2 2 0 10-4 0v5a2 2 0 01-2 2h6m-6-4h4m8 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />

        <IdentityField
          label="Passport Number"
          raw={data.passportNum}
          masked={data.passportNum ? `${data.passportNum[0]}XXXXXXX` : "—"}
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />

      </div>
    </div>
  );
}
