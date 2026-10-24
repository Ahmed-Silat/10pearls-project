import "@testing-library/jest-dom";
import { render } from "@testing-library/react";
import Highlight from "./Highlight";

const marked = (text, query) => {
  const { container } = render(<Highlight text={text} query={query} />);
  return { mark: container.querySelector("mark")?.textContent ?? null, all: container.textContent };
};

test("marks the matching start of the text, ignoring case", () => {
  expect(marked("Ali Khan", "al")).toEqual({ mark: "Al", all: "Ali Khan" });
  expect(marked("0300-1234567", "0300")).toEqual({ mark: "0300", all: "0300-1234567" });
});

test("leaves the text alone when it doesn't start with the search", () => {
  expect(marked("Ali Khan", "khan")).toEqual({ mark: null, all: "Ali Khan" });
  expect(marked("Ali Khan", "")).toEqual({ mark: null, all: "Ali Khan" });
  expect(marked("Ali Khan", undefined)).toEqual({ mark: null, all: "Ali Khan" });
});
