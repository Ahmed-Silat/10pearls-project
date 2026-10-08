import { z } from "zod";
import {
  emailField,
  nameField,
  optionalAddressField,
  optionalEmailField,
  optionalNameField,
  phoneField,
  validateWith,
} from "./common";

export const createContactSchema = z.object({
  firstName: nameField("First name"),
  lastName: optionalNameField("Last name"),
  email: optionalEmailField,
  phoneNo: phoneField,
  address: optionalAddressField,
});

export const validateContact = (values) =>
  validateWith(createContactSchema, values);