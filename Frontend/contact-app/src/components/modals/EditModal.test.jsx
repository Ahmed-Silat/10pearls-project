import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import EditModal from "./EditModal";
import { checkDuplicates, updateContact } from "../../service/ContactService";

vi.mock("../../service/ContactService", async (importOriginal) => ({
  ...(await importOriginal()),
  updateContact: vi.fn(),
  checkDuplicates: vi.fn(),
}));

test("the duplicate check leaves out the contact being edited", async () => {
  checkDuplicates.mockResolvedValue([]);
  render(
    <EditModal
      contactData={{ id: 7, firstName: "zed", phone: "0300 1234567", email: "zed@example.com" }}
      onClose={vi.fn()}
      getContacts={vi.fn()}
    />
  );

  fireEvent.blur(screen.getByLabelText(/email address/i));

  expect(checkDuplicates).toHaveBeenCalledWith({
    phone: "0300 1234567",
    email: "zed@example.com",
    excludeId: 7,
  });
  expect(screen.queryByText("Possible duplicate")).not.toBeInTheDocument();
});

test("shows whether it's an emergency contact, and saves the change", async () => {
  updateContact.mockResolvedValue({});
  render(
    <EditModal
      contactData={{ id: 7, firstName: "mom", phone: "0300 1234567", emergency: true }}
      onClose={vi.fn()}
      getContacts={vi.fn()}
    />
  );
  const checkbox = screen.getByRole("checkbox", { name: "Emergency contact" });
  expect(checkbox).toBeChecked();

  fireEvent.click(checkbox);
  fireEvent.click(screen.getByRole("button", { name: "Update" }));

  await waitFor(() => expect(updateContact).toHaveBeenCalledTimes(1));
  expect(updateContact.mock.calls[0][6]).toEqual({ allowDuplicate: false, emergency: false });
});
