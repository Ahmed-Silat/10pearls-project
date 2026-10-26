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
import { isValidBirthday } from "../lib/birthday";

/** Most phone numbers, and most emails, a contact can have besides the main one (the backend's limit). */
export const MAX_ADDITIONAL = 5;

/** The labels an extra phone number or email can have. */
export const DETAIL_LABELS = [
  { value: "mobile", label: "Mobile" },
  { value: "work", label: "Work" },
  { value: "home", label: "Home" },
  { value: "other", label: "Other" },
];

const labelField = z.enum(DETAIL_LABELS.map((option) => option.value));

// An empty row is allowed here (it's dropped before saving); anything typed must be valid.
const detailRow = (valueField) =>
  z.object({
    label: labelField,
    value: z
      .string()
      .trim()
      .pipe(valueField.or(z.literal(""))),
  });

export const createContactSchema = z.object({
  firstName: nameField("First name"),
  lastName: optionalNameField("Last name"),
  email: optionalEmailField,
  phoneNo: phoneField,
  address: optionalAddressField,
  company: z.string().trim().max(100, "Company must be at most 100 characters"),
  birthday: z
    .string()
    .refine((value) => value === "" || isValidBirthday(value), "Enter a date that isn't in the future"),
  notes: z.string().trim().max(2000, "Notes must be at most 2000 characters"),
  additionalPhones: z.array(detailRow(phoneField)).max(MAX_ADDITIONAL),
  additionalEmails: z.array(detailRow(emailField)).max(MAX_ADDITIONAL),
});

export const validateContact = (values) =>
  validateWith(createContactSchema, values);
