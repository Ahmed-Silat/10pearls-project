import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ChangePasswordModal from "./ChangePasswordModal";
import { changePassword } from "../../service/ContactService";

vi.mock("../../service/ContactService", async (importOriginal) => ({
  ...(await importOriginal()),
  changePassword: vi.fn(),
}));

afterEach(() => localStorage.clear());

test("stores the fresh token so this session stays signed in", async () => {
  localStorage.setItem("userData", JSON.stringify({ id: 1, firstName: "ali", token: "old-token" }));
  changePassword.mockResolvedValue({ token: "fresh-token", user: { id: 1 } });
  const onClose = vi.fn();
  render(<ChangePasswordModal userId={1} onClose={onClose} />);

  const [current, next, again] = screen.getAllByPlaceholderText(/password/i);
  fireEvent.change(current, { target: { value: "OldPassword1" } });
  fireEvent.change(next, { target: { value: "NewPassword1" } });
  fireEvent.change(again, { target: { value: "NewPassword1" } });
  fireEvent.click(screen.getByRole("button", { name: "Save" }));

  await waitFor(() => expect(onClose).toHaveBeenCalled());
  const stored = JSON.parse(localStorage.getItem("userData"));
  expect(stored.token).toBe("fresh-token");
  expect(stored.firstName).toBe("ali");
});
