import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import Header from "./Header";

// axios ships as an ES module that Create React App's Jest setup can't load; no API calls happen here.
jest.mock("axios", () => ({
  create: () => ({
    interceptors: { request: { use: () => {} }, response: { use: () => {} } },
  }),
}));

/** Prints the current URL query so tests can check what the header changed. */
function CurrentQuery() {
  return <div data-testid="query">{useLocation().search}</div>;
}

const renderHeader = (url) =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <Header />
      <CurrentQuery />
    </MemoryRouter>
  );

beforeEach(() => {
  localStorage.setItem("userData", JSON.stringify({ id: "user-1", firstName: "ali", token: "t" }));
});

const desktopSearch = () => screen.getAllByLabelText("Search contacts")[0];

test("shows no clear button when the search box is empty", () => {
  renderHeader("/");
  expect(screen.queryByRole("button", { name: "Clear search" })).not.toBeInTheDocument();
});

test("the clear button empties the search and removes it from the URL", () => {
  renderHeader("/?search=ali&page=2&size=5");
  expect(desktopSearch()).toHaveValue("ali");

  fireEvent.click(screen.getByRole("button", { name: "Clear search" }));

  expect(desktopSearch()).toHaveValue("");
  expect(desktopSearch()).toHaveFocus();
  expect(screen.getByTestId("query")).toHaveTextContent("?size=5");
  expect(screen.queryByRole("button", { name: "Clear search" })).not.toBeInTheDocument();
});

test("pressing Escape in the search box clears it", () => {
  renderHeader("/?search=ali");

  fireEvent.keyDown(desktopSearch(), { key: "Escape" });

  expect(desktopSearch()).toHaveValue("");
  expect(screen.getByTestId("query")).toHaveTextContent(/^$/);
});

test("typing a new search goes back to page 1", () => {
  renderHeader("/?page=3");

  fireEvent.change(desktopSearch(), { target: { value: "sa" } });

  expect(screen.getByTestId("query")).toHaveTextContent("?search=sa");
});
