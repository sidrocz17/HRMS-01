import { z } from "zod";
import { ROLES } from "../config/roles.jsx";

const requiredTrimmedString = (message) =>
  z.string().trim().min(1, { message });

const optionalTrimmedString = z.string().trim().optional().or(z.literal(""));

const phoneSchema = requiredTrimmedString("Phone is required.").refine(
  (value) => value.replace(/\D/g, "").length === 10,
  "Phone must be a 10-digit number."
);

const dateStringSchema = (message) => requiredTrimmedString(message);

export const employeeProfileSchema = z.object({
  name: requiredTrimmedString("Name is required."),
  email: requiredTrimmedString("Email is required.").email({
    message: "Enter a valid email address.",
  }),
  role: z.enum([ROLES.ADMIN, ROLES.HR, ROLES.EMPLOYEE]),
  department: requiredTrimmedString("Department is required."),
  phone: optionalTrimmedString,
});

export const personalDetailsSchema = z.object({
  first_name: requiredTrimmedString("First name required."),
  last_name: requiredTrimmedString("Last name required."),
  email: requiredTrimmedString("Email required.").email({
    message: "Invalid email.",
  }),
  phone: phoneSchema,
  address: requiredTrimmedString("Address required."),
  date_of_birth: dateStringSchema("Date of birth required."),
});

export const contactInfoSchema = z.object({
  email: personalDetailsSchema.shape.email,
  phone: phoneSchema,
  address: personalDetailsSchema.shape.address,
});

export const employmentDetailsSchema = z
  .object({
    dept_id: requiredTrimmedString("Department required."),
    desig_id: requiredTrimmedString("Designation required."),
    employee_type_id: requiredTrimmedString("Employee type required."),
    role: z.enum([ROLES.ADMIN, ROLES.HR, ROLES.EMPLOYEE], {
      message: "Role required.",
    }),
    reporting_manager: optionalTrimmedString,
    join_date: dateStringSchema("Joining date required."),
    offer_letter_num: optionalTrimmedString,
    notice_period: requiredTrimmedString("Notice period required.").refine(
      (value) => Number.isFinite(Number(value)) && Number(value) >= 0,
      "Notice period must be a valid number."
    ),
  })
  .superRefine((values, ctx) => {
    if (values.role === ROLES.EMPLOYEE && !values.reporting_manager) {
      ctx.addIssue({
        code: "custom",
        path: ["reporting_manager"],
        message: "Reporting manager required.",
      });
    }
  });

export const addressSchema = z.object({
  address: personalDetailsSchema.shape.address,
});

export const emergencyContactSchema = z
  .object({
    name: optionalTrimmedString,
    relationship: optionalTrimmedString,
    phone: z.string().trim().optional().or(z.literal("")),
  })
  .superRefine((values, ctx) => {
    const hasAnyValue = Object.values(values).some((value) =>
      String(value || "").trim()
    );

    if (!hasAnyValue) return;

    ["name", "relationship", "phone"].forEach((field) => {
      if (!String(values[field] || "").trim()) {
        ctx.addIssue({
          code: "custom",
          path: [field],
          message: "Required when emergency contact is provided.",
        });
      }
    });

    if (values.phone && values.phone.replace(/\D/g, "").length !== 10) {
      ctx.addIssue({
        code: "custom",
        path: ["phone"],
        message: "Emergency contact phone must be a 10-digit number.",
      });
    }
  });

export const identitySchema = z.object({
  pan_num: requiredTrimmedString("PAN number required.").regex(
    /^[A-Z]{5}[0-9]{4}[A-Z]$/,
    "PAN must be in valid format."
  ),
  aadhar_num: requiredTrimmedString("Aadhaar number required.").refine(
    (value) => value.replace(/\D/g, "").length === 12,
    "Aadhaar must be 12 digits."
  ),
  passport_num: optionalTrimmedString.refine(
    (value) => !value || /^[A-Z0-9]{6,10}$/.test(value),
    "Passport must be 6-10 alphanumeric characters."
  ),
});

export const documentsSchema = z
  .object({
    pan_card: z.any().optional(),
    aadhar_card: z.any().optional(),
    passport: z.any().optional(),
    offer_letter: z.any().optional(),
    resume: z.any().optional(),
  })
  .partial();

export const bankDetailsSchema = z
  .object({
    bank_name: optionalTrimmedString,
    account_number: optionalTrimmedString,
    ifsc_code: optionalTrimmedString,
  })
  .superRefine((values, ctx) => {
    const hasAnyValue = Object.values(values).some((value) =>
      String(value || "").trim()
    );

    if (!hasAnyValue) return;

    ["bank_name", "account_number", "ifsc_code"].forEach((field) => {
      if (!String(values[field] || "").trim()) {
        ctx.addIssue({
          code: "custom",
          path: [field],
          message: "Required when bank details are provided.",
        });
      }
    });

    if (values.ifsc_code && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(values.ifsc_code)) {
      ctx.addIssue({
        code: "custom",
        path: ["ifsc_code"],
        message: "Enter a valid IFSC code.",
      });
    }
  });

export const employeeOnboardingSchema = z.object({
  basicInfo: personalDetailsSchema,
  jobDetails: employmentDetailsSchema,
  identity: identitySchema,
  emergencyContact: emergencyContactSchema.optional(),
  documents: documentsSchema.optional(),
  bankDetails: bankDetailsSchema.optional(),
});

export const employeeOnboardingStepSchemas = {
  1: personalDetailsSchema,
  2: employmentDetailsSchema,
  3: identitySchema,
  4: employeeOnboardingSchema,
};

export const employeeSchema = employeeOnboardingSchema;

/**
 * @typedef {z.infer<typeof employeeProfileSchema>} EmployeeFormValues
 * @typedef {z.infer<typeof employeeOnboardingSchema>} EmployeeOnboardingValues
 */
