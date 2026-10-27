import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import EditModal from "./EditModal";
import { checkDuplicates, updateContact } from "../../service/ContactService";

vi.mock("../../service/ContactService", async (importOriginal) => ({
  ...(await importOriginal()),
  updateContact: vi.fn(),
  checkDuplicates: vi.fn(),
}));

/** The richer details as a contact without any sends them back. */
const NO_DETAILS = { company: "", birthday: null, notes: "", additionalPhones: [], additionalEmails: [] };

test("shows the contact's richer details and saves the changes", async () => {
  updateContact.mockResolvedValue({});
  render(
    <EditModal
      contactData={{
        id: 7,
        firstName: "zed",
        phone: "0300 1234567",
        company: "10Pearls",
        birthday: "1990-05-14",
        notes: "Likes tea",
        additionalPhones: [{ label: "work", value: "021 111 2222" }],
        additionalEmails: [{ label: "home", value: "zed@home.com" }],
      }}
      onClose={vi.fn()}
      getContacts={vi.fn()}
    />
  );

  expect(screen.getByLabelText(/company/i)).toHaveValue("10Pearls");
  expect(screen.getByLabelText(/birthday/i)).toHaveValue("1990-05-14");
  expect(screen.getByLabelText(/notes/i)).toHaveValue("Likes tea");
  expect(screen.getByLabelText("Other phone number 1")).toHaveValue("021 111 2222");
  expect(screen.getByLabelText("Label for other phone number 1")).toHaveValue("work");
  expect(screen.getByLabelText("Other email 1")).toHaveValue("zed@home.com");

  fireEvent.change(screen.getByLabelText(/birthday/i), { target: { value: "" } });
  fireEvent.click(screen.getByRole("button", { name: "Remove other email 1" }));
  fireEvent.click(screen.getByRole("button", { name: "Update" }));

  await waitFor(() => expect(updateContact).toHaveBeenCalledTimes(1));
  expect(updateContact.mock.calls[0][6]).toMatchObject({
    company: "10Pearls",
    birthday: null,
    notes: "Likes tea",
    additionalPhones: [{ label: "work", value: "021 111 2222" }],
    additionalEmails: [],
  });
});

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
  expect(updateContact.mock.calls[0][6]).toEqual({ allowDuplicate: false, emergency: false, tagIds: [], ...NO_DETAILS });
});

test("closing without edits doesn't ask; after an edit it asks before discarding", async () => {
  const onClose = vi.fn();
  render(
    <EditModal contactData={{ id: 7, firstName: "zed", phone: "0300 1234567" }} onClose={onClose} getContacts={vi.fn()} />
  );

  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(onClose).toHaveBeenCalledTimes(1);
  expect(screen.queryByText("Discard your changes?")).not.toBeInTheDocument();

  fireEvent.change(screen.getByLabelText(/phone no/i), { target: { value: "0311 7654321" } });
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

  expect(await screen.findByText("Discard your changes?")).toBeInTheDocument();
  expect(onClose).toHaveBeenCalledTimes(1);
});
