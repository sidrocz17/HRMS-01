// src/components/employee/onboarding/IdentityStep.jsx
export default function IdentityStep({ data, errors, onChange }) {
  const inputClass = (fieldName) =>
    `w-full px-4 py-2.5 text-sm border rounded-xl outline-none transition-all
    placeholder:text-gray-300
    ${errors[fieldName]
      ? "border-red-300 bg-red-50 focus:border-red-400 focus:ring-2 focus:ring-red-100"
      : "border-gray-200 focus:border-[#1a2240] focus:ring-2 focus:ring-[#1a2240]/10"
    }`;

  const ErrorMsg = ({ field }) =>
    errors[field] ? (
      <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
        {errors[field]}
      </p>
    ) : null;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Identity Details
        </h3>
        <p className="text-sm text-gray-500 mb-6"></p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              PAN Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. AAAPA1234A"
              value={data.pan_num}
              onChange={(e) => onChange("identity", "pan_num", e.target.value.toUpperCase())}
              maxLength="10"
              className={inputClass("pan_num")}
            />
            <p className="mt-1 text-xs text-gray-400">10 characters</p>
            <ErrorMsg field="pan_num" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Aadhaar Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. 1234 5678 9012"
              value={data.aadhar_num}
              onChange={(e) => onChange("identity", "aadhar_num", e.target.value)}
              maxLength="14"
              className={inputClass("aadhar_num")}
            />
            <p className="mt-1 text-xs text-gray-400">12 digits</p>
            <ErrorMsg field="aadhar_num" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Passport Number
            </label>
            <input
              type="text"
              placeholder="e.g. A12345678"
              value={data.passport_num}
              onChange={(e) => onChange("identity", "passport_num", e.target.value.toUpperCase())}
              maxLength="10"
              className={inputClass("passport_num")}
            />
            <p className="mt-1 text-xs text-gray-400">Alphanumeric</p>
            <ErrorMsg field="passport_num" />
          </div>
        </div>
      </div>
    </div>
  );
}
