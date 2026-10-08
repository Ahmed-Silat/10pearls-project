import { z } from "zod";
import { passwordField, validateWith } from "./common";

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordField,
    recheckPassword: z.string().min(1, "Please re-enter your new password"),
  })
  .refine((data) => data.newPassword === data.recheckPassword, {
    message: "Passwords do not match",
    path: ["recheckPassword"],
  });

export const validateChangePassword = (values) =>
  validateWith(changePasswordSchema, values);