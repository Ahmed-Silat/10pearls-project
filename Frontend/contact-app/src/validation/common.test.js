import { z } from "zod";
import { nameField, PASSWORD_RULES, passwordField, phoneField, validateWith } from "./common";

const isValidName = (value) => nameField("Name").safeParse(value).success;
const isValidPhone = (value) => phoneField.safeParse(value).success;

test("accepts names in any alphabet", () => {
  expect(isValidName("Ali")).toBe(true);
  expect(isValidName("محمد علی")).toBe(true);
  expect(isValidName("José O'Brien-Smith")).toBe(true);
  expect(isValidName("Muhammad Jr.")).toBe(true);
});

test("still rejects digits and symbols in names", () => {
  expect(isValidName("Ali123")).toBe(false);
  expect(isValidName("Ali@home")).toBe(false);
});

test("accepts common phone formats, judging length by digits", () => {
  expect(isValidPhone("03001234567")).toBe(true);
  expect(isValidPhone("+92 300 1234567")).toBe(true);
  expect(isValidPhone("+92 (300) 123-4567")).toBe(true);
  expect(isValidPhone("0300.123.4567")).toBe(true);
});

test("rejects phone numbers with too few or too many digits, or letters", () => {
  expect(isValidPhone("12345")).toBe(false);
  expect(isValidPhone("1234567890123456")).toBe(false);
  expect(isValidPhone("0300-CALL-NOW")).toBe(false);
  expect(isValidPhone("(((((((((()))))))))")).toBe(false);
});

describe("passwords", () => {
  const firstError = (value) => validateWith(z.object({ password: passwordField }), { password: value }).errors.password;

  test("each rule gives its own message, in the checklist's order", () => {
    expect(firstError("")).toBe("Password is required");
    expect(firstError("abc")).toBe("Password must be at least 8 characters");
    expect(firstError("abcdefgh")).toBe("Password must contain an uppercase letter");
    expect(firstError("ABCDEFGH")).toBe("Password must contain a lowercase letter");
    expect(firstError("Abcdefgh")).toBe("Password must contain a number");
    expect(firstError("Abcdefg1")).toBeUndefined();
  });

  test("passwords longer than the backend accepts are refused", () => {
    expect(firstError(`Aa1${"x".repeat(70)}`)).toBe("Password must be at most 72 characters");
  });

  test("the checklist rules match", () => {
    expect(PASSWORD_RULES.filter((rule) => rule.test("abcdefgh")).map((rule) => rule.id)).toEqual(["length", "lower"]);
  });
});
