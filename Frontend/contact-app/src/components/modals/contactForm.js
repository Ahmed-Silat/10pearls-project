import { createContactSchema } from "../../validation/createContactSchema";
import { validateWith } from "../../validation/common";

/**
 * The Add and Edit Contact forms share their state shape and rules here. Extra phone numbers and emails are
 * rows of `{ key, label, value }`; `key` only keeps React's list stable and is never sent.
 */

export const EMPTY_CONTACT_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  phoneNo: "",
  address: "",
  company: "",
  birthday: "",
  notes: "",
  additionalPhones: [],
  additionalEmails: [],
  emergency: false,
  tagIds: [],
};

let nextRowKey = 0;

/** A new extra phone or email row. Phones start as "mobile", emails as "work", the most common second ones. */
export const newDetailRow = (label, value = "") => ({ key: `row-${++nextRowKey}`, label, value });

const toRows = (details) => (details ?? []).map((detail) => newDetailRow(detail.label, detail.value));

/** The form's starting values for an existing contact (as the API returns it). */
export const contactToForm = (contact) => ({
  ...EMPTY_CONTACT_FORM,
  firstName: contact.firstName ?? "",
  lastName: contact.lastName ?? "",
  email: contact.email ?? "",
  phoneNo: contact.phone ?? "",
  address: contact.address ?? "",
  company: contact.company ?? "",
  birthday: contact.birthday ?? "",
  notes: contact.notes ?? "",
  additionalPhones: toRows(contact.additionalPhones),
  additionalEmails: toRows(contact.additionalEmails),
  emergency: Boolean(contact.emergency),
  tagIds: (contact.tags ?? []).map((tag) => tag.id),
});

const withoutBlankRows = (rows) =>
  rows.filter((row) => row.value !== "").map(({ label, value }) => ({ label, value }));

/**
 * Checks the form. On success `data` holds the cleaned values (trimmed, empty extra rows dropped, blank
 * birthday as null); on failure `errors` is keyed by field, and by "additionalPhones.1.value" for a row.
 */
export const validateContactForm = (form) => {
  const result = validateWith(createContactSchema, form);
  if (!result.success) return result;
  const data = result.data;
  return {
    ...result,
    data: {
      ...data,
      birthday: data.birthday || null,
      additionalPhones: withoutBlankRows(data.additionalPhones),
      additionalEmails: withoutBlankRows(data.additionalEmails),
    },
  };
};

/** `errors` without the ones for `field` (for a list such as additionalPhones, also those of its rows). */
export const withoutErrorsFor = (errors, field) =>
  Object.fromEntries(
    Object.entries(errors).filter(([key]) => key !== field && !key.startsWith(`${field}.`))
  );

/** The extra fields sent along with the name, phone, email and address. */
export const richerFields = (data) => ({
  company: data.company,
  birthday: data.birthday,
  notes: data.notes,
  additionalPhones: data.additionalPhones,
  additionalEmails: data.additionalEmails,
});
