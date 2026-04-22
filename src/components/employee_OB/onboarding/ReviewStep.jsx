// src/components/employee/onboarding/ReviewStep.jsx
import { ROLES } from "../../../config/roles.jsx";

export default function ReviewStep({
  formData,
  employeeTypes = [],
  departments = [],
  designations = [],
}) {
  const departmentLabel =
    departments.find((dept) => String(dept.id) === String(formData.jobDetails.dept_id))
      ?.title || "-";
  const designationLabel =
    designations.find(
      (desig) => String(desig.id) === String(formData.jobDetails.desig_id)
    )?.title || "-";
  const employeeTypeLabel =
    employeeTypes.find((t) => String(t.id) === String(formData.jobDetails.employee_type_id))
      ?.title || "-";
  const roleLabel =
    {
      [ROLES.ADMIN]: "ADMIN",
      [ROLES.EMPLOYEE]: "EMPLOYEE",
      [ROLES.HR]: "HR",
    }[formData.jobDetails.role] || "-";

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const Section = ({ title, children }) => (
    <div className="mb-6 p-4 bg-gray-50 rounded-xl">
      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <span className="w-8 h-8 rounded-full bg-[#1a2240] text-white text-sm flex items-center justify-center">
          ✓
        </span>
        {title}
      </h4>
      <div className="ml-10 space-y-2">{children}</div>
    </div>
  );

  const Field = ({ label, value }) => (
    <div className="flex items-start justify-between py-2">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value || "-"}</span>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Review Your Information
        </h3>
        <p className="text-sm text-gray-500 mb-6">
          Please verify all details before submitting
        </p>
      </div>

      {/* Basic Information */}
      <Section title="Basic Information">
        <Field
          label="Full Name"
          value={`${formData.basicInfo.first_name} ${formData.basicInfo.last_name}`}
        />
        <Field label="Email" value={formData.basicInfo.email} />
        <Field label="Phone" value={formData.basicInfo.phone} />
        <Field
          label="Date of Birth"
          value={formatDate(formData.basicInfo.date_of_birth)}
        />
        <Field label="Address" value={formData.basicInfo.address} />
      </Section>

      {/* Job Details */}
      <Section title="Job Details">
        <Field label="Department" value={departmentLabel} />
        <Field label="Designation" value={designationLabel} />
        <Field label="Employee Type" value={employeeTypeLabel} />
        <Field
          label="Reporting Manager"
          value="-"
        />
        <Field label="Role" value={roleLabel} />
        <Field
          label="Joining Date"
          value={formatDate(formData.jobDetails.join_date)}
        />
        <Field
          label="Notice Period"
          value={`${formData.jobDetails.notice_period} days`}
        />
      </Section>

      {/* Identity Details */}
      {(formData.identity.pan_num ||
        formData.identity.aadhar_num ||
        formData.identity.passport_num) && (
        <Section title="Identity Details">
          {formData.identity.pan_num && (
            <Field label="PAN" value={formData.identity.pan_num} />
          )}
          {formData.identity.aadhar_num && (
            <Field label="Aadhaar" value={formData.identity.aadhar_num} />
          )}
          {formData.identity.passport_num && (
            <Field label="Passport" value={formData.identity.passport_num} />
          )}
        </Section>
      )}

      <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
        <p className="font-medium mb-1">✓ All information looks correct</p>
        <p>Click the Submit button below to complete onboarding</p>
      </div>
    </div>
  );
}
