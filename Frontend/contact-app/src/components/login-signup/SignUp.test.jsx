import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import SignUp from "./SignUp";
import { signup } from "../../service/authService";

vi.mock("../../service/authService", async (importOriginal) => ({
  ...(await importOriginal()),
  signup: vi.fn(),
}));

const fill = (label, value) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

test("disables every input, button and link while the signup request is in flight", async () => {
  // Never settles, so the page stays in its loading state.
  signup.mockReturnValue(new Promise(() => {}));
  render(
    <MemoryRouter>
      <SignUp />
    </MemoryRouter>
  );

  fill(/first name/i, "Ali");
  fill(/email address/i, "ali@example.com");
  fill(/^password/i, "Secret123");
  fill(/confirm password/i, "Secret123");
  fireEvent.click(screen.getByRole("button", { name: "Sign up" }));

  expect(await screen.findByRole("button", { name: /signing up/i })).toBeDisabled();
  for (const input of screen.getAllByRole("textbox")) expect(input).toBeDisabled();
  for (const toggle of screen.getAllByRole("button", { name: /show password/i })) {
    expect(toggle).toBeDisabled();
  }
  const loginLink = screen.getByRole("link", { name: "Login" });
  expect(loginLink).toHaveAttribute("aria-disabled", "true");
  expect(loginLink).toHaveAttribute("tabindex", "-1");
});

test("tells visitors who already have an account to log in", () => {
  render(
    <MemoryRouter>
      <SignUp />
    </MemoryRouter>
  );
  expect(screen.getByText(/already have an account\?/i)).toBeInTheDocument();
  expect(screen.queryByText(/doesn't have an account/i)).not.toBeInTheDocument();
});
