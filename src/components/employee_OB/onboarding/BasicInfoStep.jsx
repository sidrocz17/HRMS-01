// src/components/employee/onboarding/BasicInfoStep.jsx
export default function BasicInfoStep({ data, errors, onChange }) {
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
          Personal Information
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. John"
              value={data.first_name}
              onChange={(e) => onChange("basicInfo", "first_name", e.target.value)}
              className={inputClass("first_name")}
            />
            <ErrorMsg field="first_name" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Doe"
              value={data.last_name}
              onChange={(e) => onChange("basicInfo", "last_name", e.target.value)}
              className={inputClass("last_name")}
            />
            <ErrorMsg field="last_name" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              placeholder="john@company.com"
              value={data.email}
              onChange={(e) => onChange("basicInfo", "email", e.target.value)}
              className={inputClass("email")}
            />
            <ErrorMsg field="email" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Phone <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              placeholder="10-digit number"
              value={data.phone}
              onChange={(e) => onChange("basicInfo", "phone", e.target.value)}
              className={inputClass("phone")}
            />
            <ErrorMsg field="phone" />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Address <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={3}
            placeholder="Enter complete address..."
            value={data.address}
            onChange={(e) => onChange("basicInfo", "address", e.target.value)}
            className={`w-full px-4 py-2.5 text-sm border rounded-xl outline-none transition-all
              placeholder:text-gray-300 resize-none
              ${errors.address
                ? "border-red-300 bg-red-50 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                : "border-gray-200 focus:border-[#1a2240] focus:ring-2 focus:ring-[#1a2240]/10"
              }`}
          />
          <ErrorMsg field="address" />
        </div>
      </div>
    </div>
  );
}
