import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import EditProfileModal from "./EditProfileModal";
import { updateUser } from "../../service/authService";

vi.mock("../../service/authService", async (importOriginal) => ({
  ...(await importOriginal()),
  updateUser: vi.fn(),
}));

const user = { id: 1, firstName: "Ali", lastName: "Khan", email: "ali@example.com" };

const renderModal = () =>
  render(<EditProfileModal user={user} onClose={() => {}} onSaved={() => {}} />);

const emailInput = () => screen.getByLabelText(/email address/i);
const passwordInput = () => screen.queryByLabelText(/current password/i);

afterEach(() => {
  localStorage.clear();
  updateUser.mockReset();
});

test("asks for the current password only when the email changes", () => {
  renderModal();
  expect(passwordInput()).not.toBeInTheDocument();

  fireEvent.change(emailInput(), { target: { value: "new@example.com" } });
  expect(passwordInput()).toBeInTheDocument();

  // Same address, different case: not a change.
  fireEvent.change(emailInput(), { target: { value: "ALI@example.com" } });
  expect(passwordInput()).not.toBeInTheDocument();
});

test("won't save a new email without the current password", () => {
  renderModal();
  fireEvent.change(emailInput(), { target: { value: "new@example.com" } });

  fireEvent.click(screen.getByRole("button", { name: "Update" }));

  expect(screen.getByText("Enter your current password to change your email")).toBeInTheDocument();
  expect(updateUser).not.toHaveBeenCalled();
});

test("sends the current password along with the new email", async () => {
  updateUser.mockResolvedValue({ ...user, email: "new@example.com" });
  renderModal();
  fireEvent.change(emailInput(), { target: { value: "new@example.com" } });
  fireEvent.change(passwordInput(), { target: { value: "Secret123" } });

  fireEvent.click(screen.getByRole("button", { name: "Update" }));

  await waitFor(() =>
    expect(updateUser).toHaveBeenCalledWith(
      1, "Ali", "Khan", "new@example.com", "", "", "Secret123"
    )
  );
});

test("shows a wrong password next to the password box", async () => {
  updateUser.mockRejectedValue({
    response: { data: { message: "Current password is incorrect" } },
  });
  renderModal();
  fireEvent.change(emailInput(), { target: { value: "new@example.com" } });
  fireEvent.change(passwordInput(), { target: { value: "wrong" } });

  fireEvent.click(screen.getByRole("button", { name: "Update" }));

  expect(await screen.findByText("Current password is incorrect")).toBeInTheDocument();
});
