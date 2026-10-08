import { z } from "zod";

export const emailField = z
  .string()
  .trim()
  .min(1, "Email is required")
  .email("Enter a valid email address");

export const passwordField = z
  .string()
  .min(1, "Password is required")
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/[a-z]/, "Password must contain a lowercase letter")
  .regex(/[0-9]/, "Password must contain a number");

export const phoneField = z
  .string()
  .trim()
  .min(1, "Phone number is required")
  .regex(/^[+]?[\d\s()-]{7,15}$/, "Enter a valid phone number");

export const nameField = (label) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(50, `${label} must be at most 50 characters`)
    .regex(/^[A-Za-zÀ-ÿ' -]+$/, `${label} can only contain letters`);

export const optionalNameField = (label) =>
  z
    .string()
    .trim()
    .max(50, `${label} must be at most 50 characters`)
    .regex(/^[A-Za-zÀ-ÿ' -]+$/, `${label} can only contain letters`)
    .or(z.literal(""));

export const optionalEmailField = emailField.or(z.literal(""));

export const addressField = z
  .string()
  .trim()
  .min(1, "Address is required")
  .max(200, "Address must be at most 200 characters");

export const optionalAddressField = addressField.or(z.literal(""));

export const validateWith = (schema, values) => {
  const result = schema.safeParse(values);
  if (result.success) {
    return { success: true, data: result.data, errors: {} };
  }
  const errors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0];
    if (field && !errors[field]) {
      errors[field] = issue.message;
    }
  }
  return { success: false, data: null, errors };
};