import api from "./Constants";
import { CONTACTS_CHANGED_EVENT } from "./ContactService";
import { todayIso } from "../lib/birthday";

/** Largest file the backend accepts, and most contacts per file. */
export const MAX_IMPORT_BYTES = 5 * 1024 * 1024;
export const MAX_IMPORT_CONTACTS = 1000;

/** File endings import understands: CSV, and vCard from phones and email apps. */
export const IMPORT_EXTENSIONS = [".csv", ".vcf", ".vcard"];

/** The CSV columns the app exports and reads back (the same as the backend's ContactExportService). */
export const CSV_COLUMNS = [
  "First Name",
  "Last Name",
  "Phone",
  "Email",
  "Other Phones",
  "Other Emails",
  "Company",
  "Birthday",
  "Address",
  "Notes",
  "Tags",
  "Favorite",
  "Emergency",
];

/** Saves a Blob as a file through the browser's normal download. */
export const downloadBlob = (blob, fileName) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Give the browser a moment to start the download before the URL goes away.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

/** A Blob's contents as text (FileReader rather than blob.text(), which older browsers and jsdom lack). */
const readText = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });

/**
 * An error response requested as a Blob still holds the backend's JSON message; turn it back into an object so
 * getApiErrorMessage can read it.
 */
const withReadableError = async (error) => {
  const data = error?.response?.data;
  if (data instanceof Blob) {
    try {
      error.response.data = JSON.parse(await readText(data));
    } catch {
      // Not JSON: the caller's fallback message is used.
    }
  }
  return error;
};

/** Downloads all of the user's contacts as "csv" (spreadsheets) or "vcf" (vCard: phones and email apps). */
export const exportContacts = async (format) => {
  try {
    const { data } = await api.get(`/contact/export`, {
      params: { format },
      responseType: "blob",
      headers: { Accept: "*/*" },
    });
    downloadBlob(data, `contacts-${todayIso()}.${format}`);
  } catch (error) {
    throw await withReadableError(error);
  }
};

/**
 * Sends a CSV or vCard file to import. With `dryRun` nothing is saved: the result says what would happen, for
 * the preview. `allowDuplicates` also imports contacts that look like ones the user already has. Resolves to
 * `{ dryRun, found, imported, newTags, duplicates, problems, warnings }`; each issue is
 * `{ location, name, message }`.
 */
export const importContacts = async (file, { dryRun = false, allowDuplicates = false } = {}) => {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post(`/contact/import`, form, { params: { dryRun, allowDuplicates } });
  // Contacts, sidebar counts and tags (an import can create tags) all reload.
  if (!dryRun) window.dispatchEvent(new Event(CONTACTS_CHANGED_EVENT));
  return data;
};

/** A CSV with the app's columns and one example row, to fill in by hand. */
export const downloadTemplate = () => {
  const example = [
    "Ali",
    "Khan",
    "0300 1234567",
    "ali@example.com",
    "work: 021 111 2222",
    "home: ali@home.com",
    "10Pearls",
    "1990-05-14",
    "Karachi",
    "Met at the conference",
    "Family; Work",
    "Yes",
    "",
  ];
  const quote = (value) => (/[",;\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);
  const csv = [CSV_COLUMNS, example].map((row) => row.map(quote).join(",")).join("\r\n") + "\r\n";
  // The byte order mark tells Excel the file is UTF-8.
  downloadBlob(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }), "contacts-template.csv");
};
