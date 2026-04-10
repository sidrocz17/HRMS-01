// src/pages/EmployeeOnboarding.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createEmployee } from "../api/employeeApi";
import { fetchDepartments } from "../api/departmentApi";
import { fetchDesignations } from "../api/designationApi";
import Stepper from "../components/employee_OB/onboarding/Stepper";
import BasicInfoStep from "../components/employee_OB/onboarding/BasicInfoStep";
import JobDetailsStep from "../components/employee_OB/onboarding/JobDetailsStep";
import IdentityStep from "../components/employee_OB/onboarding/IdentityStep";
import PreviousEmploymentStep from "../components/employee_OB/onboarding/PreviousEmploymentStep";
import DocumentUploadStep from "../components/employee_OB/onboarding/DocumentUploadStep";
import ReviewStep from "../components/employee_OB/onboarding/ReviewStep";

const STEPS = [
  { number: 1, label: "Basic Info" },
  { number: 2, label: "Job Details" },
  { number: 3, label: "Identity" },
  { number: 4, label: "Previous Work" },
  { number: 5, label: "Documents" },
  { number: 6, label: "Review" },
];

const INITIAL_FORM_DATA = {
  basicInfo: {
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
  },
  jobDetails: {
    dept_id: "",
    desig_id: "",
    reporting_manager: "",
    join_date: "",
    offer_letter_num: "",
    notice_period: "",
  },
  identity: {
    pan_num: "",
    aadhar_num: "",
    passport_num: "",
  },
  previousEmployment: [
    {
      company_name: "",
      job_title: "",
      start_date: "",
      end_date: "",
      experience_months: 0,
      reason_for_leaving: "",
    },
  ],
  documents: {
    pan_card: null,
    aadhar_card: null,
    passport: null,
    offer_letter: null,
    resume: null,
  },
};

const decodeJwtPayload = (token) => {
  try {
    const [, payload = ""] = token.split(".");
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "="
    );

    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
};

const getStoredUserId = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const token = localStorage.getItem("token");
    const tokenPayload = token ? decodeJwtPayload(token) : null;

    return (
      user.id ||
      user.userId ||
      user.uuid ||
      user.employeeId ||
      user.empId ||
      user.user_id ||
      tokenPayload?.userId ||
      tokenPayload?.id ||
      tokenPayload?.sub ||
      tokenPayload?.uid ||
      localStorage.getItem("userId") ||
      localStorage.getItem("uuid") ||
      localStorage.getItem("employeeId") ||
      ""
    );
  } catch {
    return (
      localStorage.getItem("userId") ||
      localStorage.getItem("uuid") ||
      localStorage.getItem("employeeId") ||
      ""
    );
  }
};

const nullIfEmpty = (value) => {
  const normalized = String(value ?? "").trim();
  return normalized === "" ? null : normalized;
};

const transformPayload = (data, userId) => {
  return {
    firstName: data.basicInfo.first_name.trim(),
    lastName: data.basicInfo.last_name.trim(),
    email: data.basicInfo.email.trim(),
    phone: data.basicInfo.phone.trim(),
    address: data.basicInfo.address.trim(),
    deptId: data.jobDetails.dept_id,
    designationId: data.jobDetails.desig_id,
    panNum: data.identity.pan_num.trim(),
    aadharNum: data.identity.aadhar_num.trim(),
    passportNum: nullIfEmpty(data.identity.passport_num),
    joinDate: data.jobDetails.join_date,
    offerLetterNum: String(data.jobDetails.offer_letter_num || ""),
    noticePeriod: Number(data.jobDetails.notice_period),
    createdBy: userId,
    reportingManager: null,
  };
};

const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.items)) return value.items;
  return [];
};

const mapDepartmentOption = (item = {}) => ({
  id: item.id || item.deptId || item.departmentId || item.uuid || "",
  title: item.deptName || item.departmentName || item.title || item.name || "",
});

const mapDesignationOption = (item = {}) => ({
  id: item.id || item.designationId || item.uuid || "",
  title: item.title || item.designationName || item.name || "",
});

export default function EmployeeOnboarding() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [stepErrors, setStepErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [departmentsData, designationsData] = await Promise.all([
          fetchDepartments(),
          fetchDesignations(),
        ]);

        setDepartments(
          toArray(departmentsData)
            .map(mapDepartmentOption)
            .filter((item) => item.id && item.title)
        );

        setDesignations(
          toArray(designationsData)
            .map(mapDesignationOption)
            .filter((item) => item.id && item.title)
        );
      } catch (error) {
        console.error("❌ Failed to load onboarding dropdowns:", error);
      }
    };

    loadOptions();
  }, []);

  const handleFieldChange = (section, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleArrayFieldChange = (section, index, field, value) => {
    setFormData((prev) => {
      const newArray = [...prev[section]];
      newArray[index] = {
        ...newArray[index],
        [field]: value,
      };
      return {
        ...prev,
        [section]: newArray,
      };
    });
  };

  const handleAddEmployment = () => {
    setFormData((prev) => ({
      ...prev,
      previousEmployment: [
        ...prev.previousEmployment,
        {
          company_name: "",
          job_title: "",
          start_date: "",
          end_date: "",
          experience_months: 0,
          reason_for_leaving: "",
        },
      ],
    }));
  };

  const handleRemoveEmployment = (index) => {
    setFormData((prev) => ({
      ...prev,
      previousEmployment: prev.previousEmployment.filter((_, i) => i !== index),
    }));
  };

  const handleFileUpload = (field, file) => {
    setFormData((prev) => ({
      ...prev,
      documents: {
        ...prev.documents,
        [field]: file,
      },
    }));
  };

  const validateStep = (stepNum) => {
    const errors = {};

    switch (stepNum) {
      case 1: // Basic Info
        if (!formData.basicInfo.first_name.trim())
          errors.first_name = "First name required";
        if (!formData.basicInfo.last_name.trim())
          errors.last_name = "Last name required";
        if (!formData.basicInfo.email.trim())
          errors.email = "Email required";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.basicInfo.email))
          errors.email = "Invalid email";
        if (!formData.basicInfo.phone.trim())
          errors.phone = "Phone required";
        else if (!/^\d{10}$/.test(formData.basicInfo.phone.replace(/\D/g, "")))
          errors.phone = "Invalid phone (10 digits)";
        if (!formData.basicInfo.address.trim())
          errors.address = "Address required";
        break;

      case 2: // Job Details
        if (!formData.jobDetails.dept_id)
          errors.dept_id = "Department required";
        if (!formData.jobDetails.desig_id)
          errors.desig_id = "Designation required";
        if (!formData.jobDetails.join_date)
          errors.join_date = "Joining date required";
        if (!formData.jobDetails.notice_period)
          errors.notice_period = "Notice period required";
        break;

      case 3: // Identity
        if (!formData.identity.pan_num.trim())
          errors.pan_num = "PAN number required";
        else if (formData.identity.pan_num.length !== 10)
          errors.pan_num = "PAN must be 10 characters";

        if (!formData.identity.aadhar_num.trim())
          errors.aadhar_num = "Aadhaar number required";
        else if (formData.identity.aadhar_num.replace(/\D/g, "").length !== 12)
          errors.aadhar_num = "Aadhaar must be 12 digits";
        break;

      case 4: // Previous Employment (optional but validate if filled)
        formData.previousEmployment.forEach((emp, idx) => {
          if (emp.company_name && !emp.job_title)
            errors[`job_title_${idx}`] = "Job title required";
          if (emp.start_date && emp.end_date && emp.start_date > emp.end_date)
            errors[`end_date_${idx}`] = "End date must be after start date";
        });
        break;

      case 5: // Documents (optional)
        break;

      case 6: // Review (no validation needed)
        break;

      default:
        break;
    }

    setStepErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
      window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
    window.scrollTo(0, 0);
  };

  const handleSubmit = async () => {
    if (!validateStep(step)) return;

    setLoading(true);
    setApiError("");

    try {
      const userId = getStoredUserId();
      const payload = transformPayload(formData, userId);

      await createEmployee(payload);
      console.log("📤 Employee data:", payload);
      alert("Employee onboarded successfully!");
      setFormData(INITIAL_FORM_DATA);
      setStep(1);
      navigate("/dashboard");
    } catch (error) {
      console.error("❌ Error:", error);
      setApiError(
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Failed to create employee"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (
      Object.values(formData).some(
        (section) =>
          (Array.isArray(section) &&
            section.some((item) =>
              Object.values(item).some((val) => val !== "" && val !== 0)
            )) ||
          (typeof section === "object" &&
            !Array.isArray(section) &&
            Object.values(section).some((val) => val !== "" && val !== 0 && val !== null))
      )
    ) {
      if (window.confirm("Discard unsaved changes?")) {
        navigate(-1);
      }
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Employee Onboarding</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Complete the onboarding process step by step
        </p>
      </div>

      {/* API Error */}
      {apiError && (
        <div className="mb-6 flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
          <svg
            className="w-5 h-5 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {apiError}
        </div>
      )}

      {/* Stepper */}
      <Stepper steps={STEPS} currentStep={step} />

      {/* Step Content */}
      <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-8">
          {step === 1 && (
            <BasicInfoStep
              data={formData.basicInfo}
              errors={stepErrors}
              onChange={handleFieldChange}
            />
          )}

          {step === 2 && (
            <div className="space-y-6">
              <JobDetailsStep
                data={formData.jobDetails}
                errors={stepErrors}
                onChange={handleFieldChange}
                departments={departments}
                designations={designations}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Offer Letter Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. OL-2026-001"
                    value={formData.jobDetails.offer_letter_num}
                    onChange={(e) =>
                      handleFieldChange("jobDetails", "offer_letter_num", e.target.value)
                    }
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl outline-none transition-all placeholder:text-gray-300 focus:border-[#1a2240] focus:ring-2 focus:ring-[#1a2240]/10"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <IdentityStep
              data={formData.identity}
              errors={stepErrors}
              onChange={handleFieldChange}
            />
          )}

          {step === 4 && (
            <PreviousEmploymentStep
              data={formData.previousEmployment}
              errors={stepErrors}
              onChange={handleArrayFieldChange}
              onAdd={handleAddEmployment}
              onRemove={handleRemoveEmployment}
            />
          )}

          {step === 5 && (
            <DocumentUploadStep
              data={formData.documents}
              errors={stepErrors}
              onFileUpload={handleFileUpload}
            />
          )}

          {step === 6 && <ReviewStep formData={formData} />}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-100">
          <button
            onClick={handleCancel}
            className="px-4 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            {step > 1 && (
              <button
                onClick={handleBack}
                className="px-4 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
              >
                Back
              </button>
            )}

            {step < 6 ? (
              <button
                onClick={handleNext}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-[#1a2240] hover:bg-[#243055] active:scale-95 rounded-xl transition-all shadow-sm"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className={`px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition-all shadow-sm ${
                  loading
                    ? "bg-[#1a2240]/60 cursor-not-allowed"
                    : "bg-[#1a2240] hover:bg-[#243055] active:scale-95"
                }`}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Submitting...
                  </span>
                ) : (
                  "Submit"
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
