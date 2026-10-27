import { z } from "zod";

export const emailField = z
  .string()
  .trim()
  .min(1, "Email is required")
  .email("Enter a valid email address");

/**
 * What a password needs. The checklist under password fields (`label`) and the form validation (`message`) both
 * use this list, so they always agree. (The backend only checks the length: 8 to 72 characters.)
 */
export const PASSWORD_RULES = [
  { id: "length", label: "At least 8 characters", message: "Password must be at least 8 characters", test: (v) => v.length >= 8 },
  { id: "upper", label: "An uppercase letter", message: "Password must contain an uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { id: "lower", label: "A lowercase letter", message: "Password must contain a lowercase letter", test: (v) => /[a-z]/.test(v) },
  { id: "number", label: "A number", message: "Password must contain a number", test: (v) => /[0-9]/.test(v) },
];

/** The backend's limit (bcrypt only reads the first 72 bytes). Too rare to list in the checklist. */
export const PASSWORD_MAX_LENGTH = 72;

export const passwordField = PASSWORD_RULES.reduce(
  (field, rule) => field.refine(rule.test, rule.message),
  z
    .string()
    .min(1, "Password is required")
    .max(PASSWORD_MAX_LENGTH, `Password must be at most ${PASSWORD_MAX_LENGTH} characters`)
);

/**
 * 7–15 digits, judged by the digits alone so spaces, dashes, dots and brackets don't count towards the length
 * ("+92 (300) 123-4567" is fine). Capped at 20 characters in total, the backend's limit.
 */
export const phoneField = z
  .string()
  .trim()
  .min(1, "Phone number is required")
  .max(20, "Phone number must be at most 20 characters")
  .regex(/^\+?[\d\s().-]+$/, "Enter a valid phone number")
  .refine((value) => {
    const digits = value.replace(/\D/g, "").length;
    return digits >= 7 && digits <= 15;
  }, "Enter a valid phone number");

/** Letters from any alphabet (Latin, Urdu, Arabic, ...) plus combining marks, spaces, apostrophes, dots and dashes. */
const NAME_PATTERN = /^[\p{L}\p{M}' .-]+$/u;

export const nameField = (label) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(50, `${label} must be at most 50 characters`)
    .regex(NAME_PATTERN, `${label} can only contain letters`);

export const optionalNameField = (label) =>
  z
    .string()
    .trim()
    .max(50, `${label} must be at most 50 characters`)
    .regex(NAME_PATTERN, `${label} can only contain letters`)
    .or(z.literal(""));

export const optionalEmailField = emailField.or(z.literal(""));

export const addressField = z
  .string()
  .trim()
  .min(1, "Address is required")
  .max(200, "Address must be at most 200 characters");

export const optionalAddressField = addressField.or(z.literal(""));

/**
 * Runs a zod schema and returns the first error message for each field. Errors inside lists are keyed by their
 * path, e.g. "additionalPhones.1.value" for the second extra phone number.
 */
export const validateWith = (schema, values) => {
  const result = schema.safeParse(values);
  if (result.success) {
    return { success: true, data: result.data, errors: {} };
  }
  const errors = {};
  for (const issue of result.error.issues) {
    const field = issue.path.join(".");
    if (field && !errors[field]) {
      errors[field] = issue.message;
    }
  }
  return { success: false, data: null, errors };
};