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

describe("password checklist", () => {
  const renderSignUp = () =>
    render(
      <MemoryRouter>
        <SignUp />
      </MemoryRouter>
    );
  const rule = (label) => screen.getByText(label).closest("li");

  test("ticks each rule off while the password is typed", () => {
    renderSignUp();
    expect(rule("At least 8 characters")).toHaveTextContent("(missing)");

    fill(/^password/i, "abc1");
    expect(rule("A lowercase letter")).toHaveTextContent("(done)");
    expect(rule("A number")).toHaveTextContent("(done)");
    expect(rule("An uppercase letter")).toHaveTextContent("(missing)");
    expect(rule("At least 8 characters")).toHaveTextContent("(missing)");

    fill(/^password/i, "Abcdefg1");
    for (const label of ["At least 8 characters", "An uppercase letter", "A lowercase letter", "A number"]) {
      expect(rule(label)).toHaveTextContent("(done)");
    }
  });

  test("after a failed submit, the missing rules turn red instead of repeating the error under the field", () => {
    renderSignUp();
    fill(/first name/i, "Ali");
    fill(/email address/i, "ali@example.com");
    fill(/^password/i, "abcdefgh");
    fill(/confirm password/i, "abcdefgh");

    fireEvent.click(screen.getByRole("button", { name: "Sign up" }));

    expect(rule("An uppercase letter")).toHaveClass("text-destructive");
    expect(rule("A lowercase letter")).not.toHaveClass("text-destructive");
    expect(screen.queryByText("Password must contain an uppercase letter")).not.toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i)).toHaveAttribute("aria-invalid", "true");
    expect(signup).not.toHaveBeenCalled();
  });

  test("an empty password still says it's required", () => {
    renderSignUp();

    fireEvent.click(screen.getByRole("button", { name: "Sign up" }));

    expect(screen.getByText("Password is required")).toBeInTheDocument();
  });
});
