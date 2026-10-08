import { z } from "zod";
import {
  emailField,
  nameField,
  optionalAddressField,
  optionalNameField,
  passwordField,
  phoneField,
  validateWith,
} from "./common";

export const signupSchema = z
  .object({
    firstName: nameField("First name"),
    lastName: optionalNameField("Last name"),
    email: emailField,
    phoneNo: phoneField.or(z.literal("")),
    address: optionalAddressField,
    password: passwordField,
    rePassword: z.string().min(1, "Please re-enter your password"),
  })
  .refine((data) => data.password === data.rePassword, {
    message: "Passwords do not match",
    path: ["rePassword"],
  });

export const validateSignup = (values) => validateWith(signupSchema, values);