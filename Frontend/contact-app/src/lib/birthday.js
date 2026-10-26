/**
 * Birthdays are plain dates ("1990-05-14"), with no time zone. They are always read as local dates here, because
 * `new Date("1990-05-14")` would be midnight UTC and show as the 13th west of Greenwich.
 */

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_MS = 24 * 60 * 60 * 1000;

/** The earliest birthday year accepted, to catch typos like "0199". */
export const MIN_BIRTHDAY_YEAR = 1900;

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

/** `{ year, month, day }` (month 1–12) for a real "yyyy-mm-dd" date, otherwise null. */
const parse = (value) => {
  const match = ISO_DATE.exec(value ?? "");
  if (!match) return null;
  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(year, month - 1, day);
  // Rejects dates that don't exist, such as 2023-02-30 (which Date would roll over to 2 March).
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return { year, month, day, date };
};

/** Today's date as "yyyy-mm-dd" (local time), for the date input's `max`. */
export const todayIso = (today = new Date()) => {
  const pad = (n) => String(n).padStart(2, "0");
  return `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
};

/** A real date from 1900 up to today. */
export const isValidBirthday = (value, today = new Date()) => {
  const parsed = parse(value);
  return Boolean(parsed) && parsed.year >= MIN_BIRTHDAY_YEAR && parsed.date <= startOfDay(today);
};

/** "14 May 1990", or null if it isn't a date. */
export const formatBirthday = (value) => {
  const parsed = parse(value);
  if (!parsed) return null;
  return parsed.date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
};

/** How old someone born on `value` is today, or null. */
export const ageOn = (value, today = new Date()) => {
  const parsed = parse(value);
  if (!parsed) return null;
  const hadBirthdayThisYear =
    today.getMonth() + 1 > parsed.month || (today.getMonth() + 1 === parsed.month && today.getDate() >= parsed.day);
  const age = today.getFullYear() - parsed.year - (hadBirthdayThisYear ? 0 : 1);
  return age >= 0 ? age : null;
};

/**
 * Days until the next birthday: 0 if it's today, 1 if tomorrow, and so on. Someone born on 29 February has
 * their birthday on 1 March in other years. Null if it isn't a date.
 */
export const daysUntilBirthday = (value, today = new Date()) => {
  const parsed = parse(value);
  if (!parsed) return null;
  const start = startOfDay(today);
  let next = new Date(start.getFullYear(), parsed.month - 1, parsed.day);
  if (next < start) next = new Date(start.getFullYear() + 1, parsed.month - 1, parsed.day);
  return Math.round((next - start) / DAY_MS);
};

/** "Birthday today", "Birthday tomorrow" or "Birthday in 3 days" when it is at most `withinDays` away, else null. */
export const upcomingBirthdayText = (value, today = new Date(), withinDays = 7) => {
  const days = daysUntilBirthday(value, today);
  if (days === null || days > withinDays) return null;
  if (days === 0) return "Birthday today";
  if (days === 1) return "Birthday tomorrow";
  return `Birthday in ${days} days`;
};
