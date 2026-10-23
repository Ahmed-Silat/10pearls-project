import { z } from "zod";
import { emailField, passwordField } from "./common";

export const forgotPasswordEmailSchema = z.object({
  email: emailField,
});

export const otpSchema = z.object({
  otp: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter the 6-digit code from your email"),
});

export const resetPasswordSchema = z
  .object({
    newPassword: passwordField,
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
