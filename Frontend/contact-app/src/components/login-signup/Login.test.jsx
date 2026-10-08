import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Toaster, toast } from "sonner";
import Login from "./Login";

// axios ships as an ES module that Create React App's Jest setup can't load, and the
// Login page doesn't call the API in these tests, so a minimal stand-in is enough.
jest.mock("axios", () => ({
  create: () => ({
    interceptors: { request: { use: () => {} }, response: { use: () => {} } },
  }),
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
