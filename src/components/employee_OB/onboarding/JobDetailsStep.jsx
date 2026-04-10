// src/components/employee/onboarding/JobDetailsStep.jsx
const DEPARTMENTS = [
  { id: "1", title: "Engineering" },
  { id: "2", title: "Sales" },
  { id: "3", title: "Marketing" },
  { id: "4", title: "HR" },
  { id: "5", title: "Finance" },
];

const DESIGNATIONS = [
  { id: "1", title: "Junior Engineer" },
  { id: "2", title: "Senior Engineer" },
  { id: "3", title: "Sales Executive" },
  { id: "4", title: "Manager" },
  { id: "5", title: "Director" },
];

const MANAGERS = [
  { id: "1", name: "Rajesh Kumar" },
  { id: "2", name: "Priya Singh" },
  { id: "3", name: "Amit Patel" },
  { id: "4", name: "Neha Sharma" },
];

export default function JobDetailsStep({
  data,
  errors,
  onChange,
  departments = DEPARTMENTS,
  designations = DESIGNATIONS,
  managers = MANAGERS,
}) {
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
          Job Details
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Department <span className="text-red-500">*</span>
            </label>
            <select
              value={data.dept_id}
              onChange={(e) => onChange("jobDetails", "dept_id", e.target.value)}
              className={inputClass("dept_id")}
            >
              <option value="">Select department</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.title}
                </option>
              ))}
            </select>
            <ErrorMsg field="dept_id" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Designation <span className="text-red-500">*</span>
            </label>
            <select
              value={data.desig_id}
              onChange={(e) => onChange("jobDetails", "desig_id", e.target.value)}
              className={inputClass("desig_id")}
            >
              <option value="">Select designation</option>
              {designations.map((desig) => (
                <option key={desig.id} value={desig.id}>
                  {desig.title}
                </option>
              ))}
            </select>
            <ErrorMsg field="desig_id" />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Reporting Manager <span className="text-red-500">*</span>
            </label>
            <select
              value={data.reporting_manager}
              onChange={(e) => onChange("jobDetails", "reporting_manager", e.target.value)}
              className={inputClass("reporting_manager")}
            >
              <option value="">Select manager</option>
              {managers.map((mgr) => (
                <option key={mgr.id} value={mgr.id}>
                  {mgr.name}
                </option>
              ))}
            </select>
            <ErrorMsg field="reporting_manager" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Joining Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={data.join_date}
              onChange={(e) => onChange("jobDetails", "join_date", e.target.value)}
              className={inputClass("join_date")}
            />
            <ErrorMsg field="join_date" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Notice Period (Days) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              placeholder="e.g. 30"
              value={data.notice_period}
              onChange={(e) => onChange("jobDetails", "notice_period", e.target.value)}
              className={inputClass("notice_period")}
            />
            <ErrorMsg field="notice_period" />
          </div>
        </div>
      </div>
    </div>
  );
}
