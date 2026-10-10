import { act, renderHook } from "@testing-library/react";
import { useDebouncedValue } from "./useDebounceHook";

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

test("waits for the delay before returning a new value", () => {
  const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 2000), {
    initialProps: { value: "a" },
  });

  rerender({ value: "ab" });
  expect(result.current).toBe("a");

  act(() => jest.advanceTimersByTime(2000));
  expect(result.current).toBe("ab");
});

test("with immediateWhenEmpty, clearing the value applies straight away", () => {
  const { result, rerender } = renderHook(
    ({ value }) => useDebouncedValue(value, 2000, { immediateWhenEmpty: true }),
    { initialProps: { value: "ali" } }
  );

  rerender({ value: "" });
  expect(result.current).toBe("");
});

test("with immediateWhenEmpty, typing still waits for the delay", () => {
  const { result, rerender } = renderHook(
    ({ value }) => useDebouncedValue(value, 2000, { immediateWhenEmpty: true }),
    { initialProps: { value: "" } }
  );

  rerender({ value: "s" });
  expect(result.current).toBe("");

  act(() => jest.advanceTimersByTime(2000));
  expect(result.current).toBe("s");
});
