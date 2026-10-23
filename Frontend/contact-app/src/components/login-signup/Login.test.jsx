import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Toaster, toast } from "sonner";
import Login from "./Login";
import { login } from "../../service/authService";

// axios ships as an ES module that Create React App's Jest setup can't load, and the
// Login page doesn't call the API in these tests, so a minimal stand-in is enough.
jest.mock("axios", () => ({
  create: () => ({
    interceptors: { request: { use: () => {} }, response: { use: () => {} } },
  }),
}));

jest.mock("../../service/authService", () => ({
  ...jest.requireActual("../../service/authService"),
  login: jest.fn(),
}));

const SESSION_EXPIRED_MESSAGE = "Your session has expired. Please log in again.";

beforeAll(() => {
  // jsdom doesn't implement matchMedia, which Sonner uses for its theme.
  window.matchMedia =
    window.matchMedia ||
    (() => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} }));
});

afterEach(() => sessionStorage.clear());

const renderLogin = () =>
  render(
    <MemoryRouter>
      <Toaster />
      <Login />
    </MemoryRouter>
  );

test("shows a session-expired toast once when redirected after the session expired", async () => {
  sessionStorage.setItem("sessionExpired", "1");

  renderLogin();

  expect(await screen.findByText(SESSION_EXPIRED_MESSAGE)).toBeInTheDocument();
  expect(sessionStorage.getItem("sessionExpired")).toBeNull();
});

test("shows no session-expired toast on a normal visit", () => {
  // Sonner keeps toasts in shared state across tests, so check that none is requested
  // rather than looking at the screen.
  const warningSpy = jest.spyOn(toast, "warning");

  renderLogin();

  expect(warningSpy).not.toHaveBeenCalled();
  warningSpy.mockRestore();
});

test("disables every input, button and link while the login request is in flight", async () => {
  // Never settles, so the page stays in its loading state.
  login.mockReturnValue(new Promise(() => {}));
  renderLogin();

  fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: "ali@example.com" } });
  fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: "secret" } });
  fireEvent.click(screen.getByRole("button", { name: "LOGIN" }));

  expect(await screen.findByRole("button", { name: /logging in/i })).toBeDisabled();
  expect(screen.getByLabelText(/email address/i)).toBeDisabled();
  expect(screen.getByLabelText(/^password/i)).toBeDisabled();
  expect(screen.getByRole("button", { name: /show password/i })).toBeDisabled();
  for (const name of ["Signup", "Forgot password?"]) {
    const link = screen.getByRole("link", { name });
    expect(link).toHaveAttribute("aria-disabled", "true");
    expect(link).toHaveAttribute("tabindex", "-1");
  }
});
