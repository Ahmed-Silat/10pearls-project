import { z } from "zod";
import {
  emailField,
  nameField,
  optionalAddressField,
  phoneField,
  validateWith,
} from "./common";

export const updateUserSchema = z.object({
  firstName: nameField("First name"),
  lastName: nameField("Last name"),
  email: emailField,
  phoneNo: phoneField.or(z.literal("")),
  address: optionalAddressField,
});

export const validateUpdateUser = (values) =>
  validateWith(updateUserSchema, values);
