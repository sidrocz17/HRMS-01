// src/components/employee/onboarding/PreviousEmploymentStep.jsx
export default function PreviousEmploymentStep({
  data,
  errors,
  onChange,
  onAdd,
  onRemove,
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

  const calculateExperience = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.round(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Previous Employment
          </h3>
          <span className="text-xs text-gray-500">All fields optional</span>
        </div>

        <div className="space-y-6">
          {data.map((employment, index) => (
            <div
              key={index}
              className="p-4 border border-gray-200 rounded-xl bg-gray-50"
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-900">
                  Job #{index + 1}
                </h4>
                {data.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onRemove(index)}
                    className="text-xs font-medium text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Company Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ABC Corporation"
                    value={employment.company_name}
                    onChange={(e) =>
                      onChange(
                        "previousEmployment",
                        index,
                        "company_name",
                        e.target.value
                      )
                    }
                    className={inputClass(`company_name_${index}`)}
                  />
                  <ErrorMsg field={`company_name_${index}`} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Job Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Developer"
                    value={employment.job_title}
                    onChange={(e) =>
                      onChange(
                        "previousEmployment",
                        index,
                        "job_title",
                        e.target.value
                      )
                    }
                    className={inputClass(`job_title_${index}`)}
                  />
                  <ErrorMsg field={`job_title_${index}`} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={employment.start_date}
                    onChange={(e) =>
                      onChange(
                        "previousEmployment",
                        index,
                        "start_date",
                        e.target.value
                      )
                    }
                    className={inputClass(`start_date_${index}`)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={employment.end_date}
                    onChange={(e) =>
                      onChange(
                        "previousEmployment",
                        index,
                        "end_date",
                        e.target.value
                      )
                    }
                    className={inputClass(`end_date_${index}`)}
                  />
                  <ErrorMsg field={`end_date_${index}`} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Experience (Months)
                  </label>
                  <input
                    type="number"
                    placeholder="Auto-calculated"
                    value={
                      employment.start_date && employment.end_date
                        ? calculateExperience(employment.start_date, employment.end_date)
                        : employment.experience_months || ""
                    }
                    onChange={(e) =>
                      onChange(
                        "previousEmployment",
                        index,
                        "experience_months",
                        parseInt(e.target.value) || 0
                      )
                    }
                    className={`w-full px-4 py-2.5 text-sm border rounded-xl outline-none transition-all
                      placeholder:text-gray-300 border-gray-200 focus:border-[#1a2240] focus:ring-2 focus:ring-[#1a2240]/10`}
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    {employment.start_date && employment.end_date
                      ? `(Auto-calculated: ${calculateExperience(
                          employment.start_date,
                          employment.end_date
                        )} months)`
                      : "Auto-calculated from dates"}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Reason for Leaving
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Career growth"
                    value={employment.reason_for_leaving}
                    onChange={(e) =>
                      onChange(
                        "previousEmployment",
                        index,
                        "reason_for_leaving",
                        e.target.value
                      )
                    }
                    className={inputClass(`reason_${index}`)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onAdd}
          className="mt-4 px-4 py-2.5 text-sm font-medium text-[#1a2240] bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-all"
        >
          + Add More Experience
        </button>
      </div>
    </div>
  );
}
