import {
  ageOn,
  daysUntilBirthday,
  formatBirthday,
  isValidBirthday,
  todayIso,
  upcomingBirthdayText,
} from "./birthday";

// Local dates, as the helpers use them.
const TODAY = new Date(2026, 9, 26); // 26 October 2026

test("todayIso gives the local date", () => {
  expect(todayIso(TODAY)).toBe("2026-10-26");
});

test("isValidBirthday accepts real dates from 1900 up to today", () => {
  expect(isValidBirthday("1990-05-14", TODAY)).toBe(true);
  expect(isValidBirthday("2026-10-26", TODAY)).toBe(true);
  expect(isValidBirthday("2026-10-27", TODAY)).toBe(false);
  expect(isValidBirthday("1899-12-31", TODAY)).toBe(false);
  expect(isValidBirthday("2023-02-30", TODAY)).toBe(false);
  expect(isValidBirthday("14/05/1990", TODAY)).toBe(false);
});

test("formatBirthday spells the date out, without shifting it by a day", () => {
  expect(formatBirthday("1990-05-14")).toBe("14 May 1990");
  expect(formatBirthday("not a date")).toBeNull();
});

test("ageOn counts the birthday only once it has been reached this year", () => {
  expect(ageOn("1990-10-26", TODAY)).toBe(36);
  expect(ageOn("1990-10-27", TODAY)).toBe(35);
  expect(ageOn("1990-01-01", TODAY)).toBe(36);
});

test("daysUntilBirthday wraps round to next year", () => {
  expect(daysUntilBirthday("1990-10-26", TODAY)).toBe(0);
  expect(daysUntilBirthday("1990-10-27", TODAY)).toBe(1);
  expect(daysUntilBirthday("1990-10-25", TODAY)).toBe(364);
});

test("someone born on 29 February has their birthday on 1 March in other years", () => {
  expect(daysUntilBirthday("1992-02-29", new Date(2027, 1, 28))).toBe(1);
});

test("upcomingBirthdayText only speaks up within a week", () => {
  expect(upcomingBirthdayText("1990-10-26", TODAY)).toBe("Birthday today");
  expect(upcomingBirthdayText("1990-10-27", TODAY)).toBe("Birthday tomorrow");
  expect(upcomingBirthdayText("1990-11-02", TODAY)).toBe("Birthday in 7 days");
  expect(upcomingBirthdayText("1990-11-03", TODAY)).toBeNull();
  expect(upcomingBirthdayText(null, TODAY)).toBeNull();
});
