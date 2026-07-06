// src/pages/EmployeeOnboarding.jsx
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { fetchDepartments } from "../api/departmentApi";
import { getMappedDesignations } from "../api/deptDesigApi";
import { fetchDesignations } from "../api/designationApi";
import { fetchEmployeeTypes } from "../api/employeeTypeApi";
import { allocateEmployeeLeaves } from "../api/leaveApi";
import Stepper from "../components/employee_OB/onboarding/Stepper";
import BasicInfoStep from "../components/employee_OB/onboarding/BasicInfoStep";
import JobDetailsStep from "../components/employee_OB/onboarding/JobDetailsStep";
import IdentityStep from "../components/employee_OB/onboarding/IdentityStep";
import ReviewStep from "../components/employee_OB/onboarding/ReviewStep";
import SuccessModal from "../components/modals/SuccessModal";
import AssignLeaveModal from "../components/modals/AssignLeaveModal";
import { normalizeRole, ROLES } from "../config/roles.jsx";
import { getUserFromToken } from "../utils/auth.js";
import {
  employeeOnboardingSchema,
  employeeOnboardingStepSchemas,
} from "../schemas/employeeSchema";
import {
  useGetOnboarding,
  useSubmitOnboarding,
  useUpdateOnboarding,
} from "../hooks/queries/useEmployeeOnboarding";
import { getApiErrorMessage } from "../utils/leaveTransformers";

const STEPS = [
  { number: 1, label: "Basic Info" },
  { number: 2, label: "Job Details" },
  { number: 3, label: "Identity" },
  { number: 4, label: "Review" },
];

const INITIAL_FORM_DATA = {
  basicInfo: {
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
    date_of_birth: "",
  },
  jobDetails: {
    dept_id: "",
    desig_id: "",
    employee_type_id: "",
    role: ROLES.EMPLOYEE,
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
};

const getStoredUserId = () => {
  return getUserFromToken().userId || "";
};

const nullIfEmpty = (value) => {
  const normalized = String(value ?? "").trim();
  return normalized === "" ? null : normalized;
};

const transformPayload = (data, userId) => {
  const employeeTypeId = data.jobDetails.employee_type_id || null;
  const normalizedRole = normalizeRole(data.jobDetails.role);

  return {
    firstName: data.basicInfo.first_name.trim(),
    lastName: data.basicInfo.last_name.trim(),
    email: data.basicInfo.email.trim(),
    phone: data.basicInfo.phone.trim(),
    address: data.basicInfo.address.trim(),
    dateOfBirth: data.basicInfo.date_of_birth,
    deptId: data.jobDetails.dept_id,
    designationId: data.jobDetails.desig_id,
    employmentTypeId: employeeTypeId,
    panNum: data.identity.pan_num.trim(),
    aadharNum: data.identity.aadhar_num.trim(),
    passportNum: nullIfEmpty(data.identity.passport_num),
    joinDate: data.jobDetails.join_date,
    offerLetterNum: String(data.jobDetails.offer_letter_num || ""),
    noticePeriod: Number(data.jobDetails.notice_period),
    createdBy: userId,
    reportingManager: null,
    role: normalizedRole.toUpperCase(),
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

const getMappedDesignationOptions = (payload) => {
  const items = toArray(payload);

  return items
    .map((item) =>
      mapDesignationOption(
        item?.designation && typeof item.designation === "object"
          ? item.designation
          : item,
      ),
    )
    .filter((item) => item.id && item.title);
};

const getMappedDesignationIds = (payload) => {
  const items = toArray(payload);

  return items
    .map((item) =>
      firstFilledValue(
        item?.designationId,
        item?.desigId,
        item?.desig_id,
        item?.id,
        item?.designation?.id,
        item?.designation?.designationId,
        item?.designation?.desig_id,
      ),
    )
    .filter(Boolean)
    .map((value) => String(value).trim());
};

const mapEmployeeTypeOption = (item = {}) => ({
  id:
    item.id ||
    item.employeeTypeId ||
    item.employee_type_id ||
    item.employmentTypeId ||
    item.employment_type_id ||
    "",
  title: item.name || item.typeName || item.title || item.employeeType || "",
  isActive:
    item.isActive ??
    item.active ??
    item.is_active ??
    item.is_active_flag ??
    true,
});

const resolveOptionId = (value, options = []) => {
  const normalizedValue = String(value || "").trim();
  if (!normalizedValue) return "";

  const matchedById = options.find(
    (option) => String(option.id || "").trim() === normalizedValue
  );
  if (matchedById) return matchedById.id;

  const loweredValue = normalizedValue.toLowerCase();
  const matchedByTitle = options.find(
    (option) => String(option.title || "").trim().toLowerCase() === loweredValue
  );

  return matchedByTitle?.id || normalizedValue;
};

const toInputDate = (value) => {
  if (!value) return "";
  const asString = String(value);
  return asString.length >= 10 ? asString.slice(0, 10) : asString;
};

const asObject = (value) =>
  value && typeof value === "object" && !Array.isArray(value) ? value : {};


const isUuid = (value) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value || "").trim(),
  );

const mapEmployeeToFormData = (employee = {}) => {
  const department = employee.department || employee.department_details || {};
  const designation =
    employee.designation || employee.designation_details || {};
  const employeeType =
    employee.employeeType ||
    employee.employee_type ||
    employee.employmentType ||
    employee.employment_type ||
    employee.employeeTypeDetails ||
    {};

  const mapped = {
    basicInfo: {
      first_name: firstFilledValue(
        employee.first_name,
        employee.firstName,
        employee.firstname,
      ),
      last_name: firstFilledValue(
        employee.last_name,
        employee.lastName,
        employee.lastname,
      ),
      email: firstFilledValue(
        employee.email,
        employee.email_id,
        employee.work_email,
      ),
      phone: firstFilledValue(
        employee.phone,
        employee.phone_num,
        employee.mobile,
        employee.mobile_num,
      ),
      address: firstFilledValue(employee.address, employee.current_address),
      date_of_birth: toInputDate(
        firstFilledValue(
          employee.date_of_birth,
          employee.dateOfBirth,
          employee.dob,
        ),
      ),
    },
    jobDetails: {
      dept_id: firstFilledValue(
        employee.dept_id,
        employee.department_id,
        employee.departmentId,
        department.id,
        department.dept_id,
        department.department_id,
      ),
      desig_id: firstFilledValue(
        employee.desig_id,
        employee.designation_id,
        employee.designationId,
        designation.id,
        designation.desig_id,
        designation.designation_id,
      ),
      employee_type_id: firstFilledValue(
        employee.employee_type_id,
        employee.employeeTypeId,
        employee.employmentTypeId,
        employee.employment_type_id,
        employee.empTypeId,
        employee.emp_type_id,
        employeeType.id,
        employeeType.employeeTypeId,
        employeeType.employee_type_id,
        employeeType.employmentTypeId,
        employeeType.employment_type_id,
      ),
      role: normalizeRole(
        firstFilledValue(employee.role, employee.user_role, employee.userRole),
      ),
      reporting_manager: firstFilledValue(
        employee.reporting_manager,
        employee.reportingManager,
        employee.manager_id,
      ),
      join_date: toInputDate(
        firstFilledValue(
          employee.join_date,
          employee.joinDate,
          employee.joining_date,
          employee.date_of_joining,
        ),
      ),
      offer_letter_num: firstFilledValue(
        employee.offer_letter_num,
        employee.offerLetterNum,
      ),
      notice_period: firstFilledValue(
        employee.notice_period,
        employee.noticePeriod,
      ),
    },
    identity: {
      pan_num: firstFilledValue(employee.pan_num, employee.panNum),
      aadhar_num: firstFilledValue(
        employee.aadhar_num,
        employee.aadharNum,
        employee.aadhaar_num,
        employee.aadhaarNum,
      ),
      passport_num: firstFilledValue(
        employee.passport_num,
        employee.passportNum,
      ),
    },
  };

  return mapped;
};

export default function EmployeeOnboarding() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [stepErrors, setStepErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [departments, setDepartments] = useState([]);
  const [allDesignations, setAllDesignations] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [employeeTypes, setEmployeeTypes] = useState([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [employeeCredentials, setEmployeeCredentials] = useState(null);
  const [createdEmployeeId, setCreatedEmployeeId] = useState(null);
  const [leaveAllocationResult, setLeaveAllocationResult] = useState([]);
  const [leaveAllocationMessage, setLeaveAllocationMessage] = useState("");
  const [leaveAllocationError, setLeaveAllocationError] = useState("");
  const [showAssignLeaveModal, setShowAssignLeaveModal] = useState(false);
  const [assignLeaveTypes] = useState([]);
  const [assignLeaveTypesLoading, setAssignLeaveTypesLoading] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode");
  const employeeId = searchParams.get("id");
  const isEditMode = mode === "edit";
  const routeEmployee = location.state?.employee;
  const {
    data: onboardingEmployee,
    isError: isOnboardingEmployeeError,
    error: onboardingEmployeeError,
  } = useGetOnboarding(employeeId, {
    enabled: isEditMode && Boolean(employeeId) && !routeEmployee,
  });
  const submitOnboardingMutation = useSubmitOnboarding();
  const updateOnboardingMutation = useUpdateOnboarding();
  const loading =
    submitOnboardingMutation.isPending || updateOnboardingMutation.isPending;

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [departmentsData, designationsData, employeeTypesData] =
          await Promise.all([
            fetchDepartments(),
            fetchDesignations(),
            fetchEmployeeTypes(),
          ]);

        setDepartments(
          toArray(departmentsData)
            .map(mapDepartmentOption)
            .filter((item) => item.id && item.title),
        );

        setDesignations(
          toArray(designationsData)
            .map(mapDesignationOption)
            .filter((item) => item.id && item.title),
        );

        setAllDesignations(
          toArray(designationsData)
            .map(mapDesignationOption)
            .filter((item) => item.id && item.title),
        );

        setEmployeeTypes(
          toArray(employeeTypesData)
            .map(mapEmployeeTypeOption)
            .filter((item) => item.id && item.title)
            .filter((item) => String(item.isActive) !== "false")
            .map(({ id, title }) => ({ id, title })),
        );
      } catch (error) {
        console.error("❌ Failed to load onboarding dropdowns:", error);
      }
    };

    loadOptions();
  }, []);

  useEffect(() => {
    const selectedDepartmentId = String(formData.jobDetails.dept_id || "").trim();

    if (!selectedDepartmentId) {
      setDesignations([]);
      setFormData((prev) => {
        if (!prev.jobDetails.desig_id) return prev;

        return {
          ...prev,
          jobDetails: {
            ...prev.jobDetails,
            desig_id: "",
          },
        };
      });
      return;
    }

    if (!allDesignations.length) return;

    let isMounted = true;

    const loadMappedDesignations = async () => {
      try {
        const response = await getMappedDesignations(selectedDepartmentId);
        if (!isMounted) return;

        const mappedIds = new Set(getMappedDesignationIds(response));
        const mappedOptions = getMappedDesignationOptions(response);
        const selectedDesignationId = String(formData.jobDetails.desig_id || "").trim();

        const filteredDesignations = mappedOptions.length
          ? mappedOptions
          : mappedIds.size > 0
            ? allDesignations.filter((designation) =>
                mappedIds.has(String(designation.id).trim())
              )
            : [];

        const selectedDesignationOption = allDesignations.find(
          (designation) => String(designation.id).trim() === selectedDesignationId
        );

        const nextDesignations =
          selectedDesignationOption &&
          selectedDesignationId &&
          !filteredDesignations.some(
            (designation) =>
              String(designation.id).trim() === selectedDesignationId
          )
            ? [...filteredDesignations, selectedDesignationOption]
            : filteredDesignations;

        setDesignations(nextDesignations);

        const selectedStillValid = nextDesignations.some(
          (designation) =>
            String(designation.id).trim() === selectedDesignationId
        );

        if (!selectedStillValid && selectedDesignationId) {
          setFormData((prev) => ({
            ...prev,
            jobDetails: {
              ...prev.jobDetails,
              desig_id: "",
            },
          }));
        }
      } catch (error) {
        console.error("❌ Failed to load mapped designations:", error);
        if (isMounted) setDesignations(allDesignations);
      }
    };

    loadMappedDesignations();

    return () => {
      isMounted = false;
    };
  }, [allDesignations, formData.jobDetails.dept_id, formData.jobDetails.desig_id]);

  useEffect(() => {
    if (!isEditMode) {
      setFormData(INITIAL_FORM_DATA);
      return;
    }

    if (routeEmployee) {
      setFormData(mapEmployeeToFormData(routeEmployee));
    }
  }, [isEditMode, routeEmployee]);

  useEffect(() => {
    if (!isEditMode || routeEmployee || !onboardingEmployee) return;

    const employeeData = onboardingEmployee?.data || onboardingEmployee || {};
    setFormData(mapEmployeeToFormData(employeeData));
  }, [isEditMode, onboardingEmployee, routeEmployee]);

  useEffect(() => {
    if (!isOnboardingEmployeeError) return;

    setApiError(
      getApiErrorMessage(onboardingEmployeeError, "Failed to load employee details")
    );
  }, [isOnboardingEmployeeError, onboardingEmployeeError]);

  useEffect(() => {
    if (!employeeTypes.length) return;

    setFormData((prev) => {
      const resolvedEmployeeTypeId = resolveOptionId(
        prev.jobDetails.employee_type_id,
        employeeTypes
      );

      if (resolvedEmployeeTypeId === prev.jobDetails.employee_type_id) {
        return prev;
      }

      return {
        ...prev,
        jobDetails: {
          ...prev.jobDetails,
          employee_type_id: resolvedEmployeeTypeId,
        },
      };
    });
  }, [employeeTypes]);

  const handleFieldChange = (section, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
    setStepErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    setEmployeeCredentials(null);
    setCreatedEmployeeId(null);
    setLeaveAllocationResult([]);
    setLeaveAllocationMessage("");
    setLeaveAllocationError("");
    setShowAssignLeaveModal(false);
    setFormData(INITIAL_FORM_DATA);
    setStep(1);
    navigate("/employee-management");
  };

  const handleAddLeaveClick = async () => {
    setLeaveAllocationError("");
    setLeaveAllocationMessage("");

    if (!createdEmployeeId) {
      setLeaveAllocationError("Employee ID is missing. Cannot post leave.");
      return;
    }

    const joiningDate = String(formData.jobDetails.join_date || "").trim();
    if (!joiningDate) {
      setLeaveAllocationError("Joining date is required to post leave.");
      return;
    }

    const year = Number(new Date(joiningDate).getFullYear());
    if (!Number.isFinite(year) || year <= 0) {
      setLeaveAllocationError("Invalid joining date for leave allocation.");
      return;
    }

    const createdBy = getStoredUserId();
    if (!createdBy) {
      setLeaveAllocationError("Unable to identify the current user.");
      return;
    }

    try {
      setAssignLeaveTypesLoading(true);
      const payload = {
        empId: createdEmployeeId,
        joiningDate,
        year,
        createdBy,
      };

      const response = await allocateEmployeeLeaves(payload);
      const message = response?.message || "Leave posted successfully";
      const data = Array.isArray(response?.data) ? response.data : [];

      setLeaveAllocationMessage(message);
      setLeaveAllocationResult(data);
    } catch (error) {
      console.error("❌ Post leave failed:", error);
      setLeaveAllocationError(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Failed to post leave",
      );
    } finally {
      setAssignLeaveTypesLoading(false);
    }
  };

  const handleAssignLeave = async ({
    employeeId,
    leaveTypeId,
    totalLeaves,
  }) => {
    setLeaveAllocationError("");
    try {
      const payload = { leaveTypeId, totalLeaves };
      const response = await allocateEmployeeLeaves(employeeId, payload);
      const message = response?.message || "Leave allocated successfully";
      const data = Array.isArray(response?.data) ? response.data : [];

      setLeaveAllocationMessage(message);
      setLeaveAllocationResult(data);
      setShowAssignLeaveModal(false);
    } catch (error) {
      console.error("❌ Assign leave failed:", error);
      setLeaveAllocationError(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Failed to assign leave",
      );
      throw error;
    }
  };

  const zodIssuesToFieldErrors = (issues = []) =>
    issues.reduce((acc, issue) => {
      const field = issue.path[issue.path.length - 1];
      if (field && !acc[field]) acc[field] = issue.message;
      return acc;
    }, {});

  const getStepValidationData = (stepNum) => {
    if (stepNum === 1) return formData.basicInfo;
    if (stepNum === 2) return formData.jobDetails;
    if (stepNum === 3) return formData.identity;
    return formData;
  };

  const validateStep = (stepNum) => {
    const schema = employeeOnboardingStepSchemas[stepNum];
    if (!schema) return true;

    const result = schema.safeParse(getStepValidationData(stepNum));
    const errors = result.success ? {} : zodIssuesToFieldErrors(result.error.issues);

    setStepErrors(errors);
    return result.success;
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
    const validation = employeeOnboardingSchema.safeParse(formData);

    if (!validation.success) {
      const firstSection = validation.error.issues[0]?.path?.[0];
      const sectionStep = {
        basicInfo: 1,
        jobDetails: 2,
        identity: 3,
      }[firstSection];

      if (sectionStep) setStep(sectionStep);
      setStepErrors(zodIssuesToFieldErrors(validation.error.issues));
      return;
    }

    setApiError("");

    try {
      const userId = getStoredUserId();
      const payload = transformPayload(formData, userId);
      const response =
        isEditMode && employeeId
          ? await updateOnboardingMutation.mutateAsync({ employeeId, payload })
          : await submitOnboardingMutation.mutateAsync({ payload });
      const responseSources = getResponseSources(response);
      const employeeMessage = firstFilledValue(
        ...responseSources.map((item) => item.message),
        "Employee added successfully",
      );
      const extractedUserId = firstFilledValue(
        ...responseSources.flatMap((item) => [
          item.username,
          item.userId,
          item.user_id,
          item.loginId,
          item.login_id,
          item.emp_id,
          item.empId,
          item.employeeId,
          item.employee_id,
          item.id,
        ]),
        "-",
      );
      const extractedPassword = firstFilledValue(
        ...responseSources.flatMap((item) => [
          item.temporaryPassword,
          item.temporary_password,
          item.password,
          item.tempPassword,
        ]),
        "-",
      );

      if (isEditMode) {
        navigate("/employee-management");
        return;
      }

      const empIdCandidates = responseSources.flatMap((item) => [
        item.emp_uuid,
        item.empUuid,
        item.employee_uuid,
        item.employeeUuid,
        item.uuid,
        item.emp_id,
        item.empId,
        item.employeeId,
        item.employee_id,
        item.id,
      ]);
      const newEmpId =
        empIdCandidates.find((value) => isUuid(value)) ||
        empIdCandidates.find(
          (value) =>
            value !== undefined &&
            value !== null &&
            String(value).trim() !== "",
        ) ||
        null;

      setEmployeeCredentials({
        message: employeeMessage,
        userId: extractedUserId,
        password: extractedPassword,
      });
      setCreatedEmployeeId(newEmpId ? String(newEmpId) : null);
      setLeaveAllocationMessage(newEmpId ? "No leaves assigned yet" : "");
      setLeaveAllocationResult([]);
      setLeaveAllocationError(
        newEmpId
          ? ""
          : "Employee created, but employee ID was not returned for leave assignment",
      );
      setShowSuccessModal(true);
    } catch (error) {
      console.error("❌ Error:", error);
      setApiError(getApiErrorMessage(error, "Failed to create employee"));
    }
  };

  const handleCancel = () => {
    const hasUnsavedChanges =
      Object.values(formData).some(
        (section) =>
          (Array.isArray(section) &&
            section.some((item) =>
              Object.values(item).some((val) => val !== "" && val !== 0),
            )) ||
          (typeof section === "object" &&
            !Array.isArray(section) &&
            Object.values(section).some(
              (val) => val !== "" && val !== 0 && val !== null,
            )),
      );

    if (hasUnsavedChanges) {
      setShowCancelConfirm(true);
      return;
    }

    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Employee Onboarding
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {isEditMode
            ? "Update employee details"
            : "Complete the onboarding process step by step"}
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
                employeeTypes={employeeTypes}
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
                      handleFieldChange(
                        "jobDetails",
                        "offer_letter_num",
                        e.target.value,
                      )
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
            <ReviewStep
              formData={formData}
              employeeTypes={employeeTypes}
              departments={departments}
              designations={designations}
            />
          )}
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

            {step < STEPS.length ? (
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
                ) : isEditMode ? (
                  "Update"
                ) : (
                  "Submit"
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={handleSuccessModalClose}
        credentials={employeeCredentials}
        employeeId={createdEmployeeId}
        onAddLeave={createdEmployeeId ? handleAddLeaveClick : null}
        addLeaveLoading={assignLeaveTypesLoading}
        leaveAllocationMessage={leaveAllocationMessage}
        leaveAllocationData={leaveAllocationResult}
        leaveAllocationError={leaveAllocationError}
      />

      <AssignLeaveModal
        isOpen={showAssignLeaveModal}
        onClose={() => setShowAssignLeaveModal(false)}
        employeeId={createdEmployeeId || "-"}
        leaveTypes={assignLeaveTypes}
        onSubmit={handleAssignLeave}
      />

      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">
                Discard unsaved changes?
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Your onboarding form has unsaved changes. If you leave now,
                they will be lost.
              </p>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowCancelConfirm(false)}
                className="px-4 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
              >
                Continue Editing
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-4 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all"
              >
                Discard Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
