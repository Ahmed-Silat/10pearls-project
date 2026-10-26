import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import AddContactModal from "./AddContactModal";
import { checkDuplicates, createNewContact } from "../../service/ContactService";

vi.mock("../../service/ContactService", async (importOriginal) => ({
  ...(await importOriginal()),
  createNewContact: vi.fn(),
  checkDuplicates: vi.fn(),
}));

const ALI = { id: 5, firstName: "ali", lastName: "khan", field: "phone" };
const duplicateError = (duplicates) => ({
  response: {
    status: 409,
    data: { message: "You already have a contact with this phone number", duplicates },
  },
});

const renderModal = () =>
  render(<AddContactModal userId="user-1" onClose={vi.fn()} fetchContacts={vi.fn()} />);

const fill = (label, value) => fireEvent.change(screen.getByLabelText(label), { target: { value } });

const fillValidContact = () => {
  fill(/first name/i, "Zed");
  fill(/phone no/i, "0300 1234567");
};

/** The richer details as an empty form sends them. */
const NO_DETAILS = { company: "", birthday: null, notes: "", additionalPhones: [], additionalEmails: [] };

const addRow = (kind) => fireEvent.click(screen.getByRole("button", { name: `Add another ${kind}` }));
const save = () => fireEvent.click(screen.getByRole("button", { name: "Add Contact" }));

describe("richer contact fields", () => {
  test("company, birthday and notes are saved", async () => {
    createNewContact.mockResolvedValue({ id: 9 });
    renderModal();
    fillValidContact();

    fill(/company/i, " 10Pearls ");
    fill(/birthday/i, "1990-05-14");
    fill(/notes/i, "Met at the conference");
    save();

    await waitFor(() => expect(createNewContact).toHaveBeenCalledTimes(1));
    expect(createNewContact.mock.calls[0][6]).toMatchObject({
      company: "10Pearls",
      birthday: "1990-05-14",
      notes: "Met at the conference",
    });
  });

  test("a birthday in the future is rejected", () => {
    renderModal();
    fillValidContact();

    fill(/birthday/i, "2999-01-01");
    save();

    expect(screen.getByText("Enter a date that isn't in the future")).toBeInTheDocument();
    expect(createNewContact).not.toHaveBeenCalled();
  });

  test("extra phone numbers and emails are saved with their labels, and empty rows are left out", async () => {
    createNewContact.mockResolvedValue({ id: 9 });
    renderModal();
    fillValidContact();

    addRow("phone number");
    // The new row gets the focus, ready to type in.
    expect(screen.getByLabelText("Other phone number 1")).toHaveFocus();
    fill("Other phone number 1", "021 111 2222");
    fireEvent.change(screen.getByLabelText("Label for other phone number 1"), { target: { value: "work" } });
    addRow("phone number"); // left empty
    addRow("email");
    fill("Other email 1", "zed@home.com");
    fireEvent.change(screen.getByLabelText("Label for other email 1"), { target: { value: "home" } });
    save();

    await waitFor(() => expect(createNewContact).toHaveBeenCalledTimes(1));
    expect(createNewContact.mock.calls[0][6]).toMatchObject({
      additionalPhones: [{ label: "work", value: "021 111 2222" }],
      additionalEmails: [{ label: "home", value: "zed@home.com" }],
    });
  });

  test("an invalid extra phone number is flagged on its own row", () => {
    renderModal();
    fillValidContact();

    addRow("phone number");
    addRow("phone number");
    fill("Other phone number 2", "12");
    save();

    expect(screen.getByLabelText("Other phone number 2")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("Other phone number 1")).not.toHaveAttribute("aria-invalid");
    expect(createNewContact).not.toHaveBeenCalled();
  });

  test("a row can be removed, and no more than five can be added", () => {
    renderModal();

    for (let i = 0; i < 5; i++) addRow("email");
    expect(screen.queryByRole("button", { name: "Add another email" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Remove other email 3" }));

    expect(screen.queryByLabelText("Other email 5")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add another email" })).toBeInTheDocument();
  });
});

test("warns about a possible duplicate as soon as the phone field is left", async () => {
  checkDuplicates.mockResolvedValue([ALI]);
  renderModal();

  fill(/phone no/i, "0300-1234567");
  fireEvent.blur(screen.getByLabelText(/phone no/i));

  expect(await screen.findByText("Possible duplicate")).toBeInTheDocument();
  expect(screen.getByText(/already has the same phone number/)).toHaveTextContent(
    "ali khan already has the same phone number."
  );
  expect(checkDuplicates).toHaveBeenCalledWith({ phone: "0300-1234567", email: "", excludeId: undefined });
  // Only a warning: the normal button is still there.
  expect(screen.getByRole("button", { name: "Add Contact" })).toBeInTheDocument();
});

test("doesn't check half-typed phone numbers", () => {
  renderModal();

  fill(/phone no/i, "0300");
  fireEvent.blur(screen.getByLabelText(/phone no/i));

  expect(checkDuplicates).not.toHaveBeenCalled();
});

test("a duplicate on save asks whether to save anyway, and does so", async () => {
  createNewContact.mockRejectedValueOnce(duplicateError([ALI])).mockResolvedValueOnce({ id: 9 });
  renderModal();
  fillValidContact();

  fireEvent.click(screen.getByRole("button", { name: "Add Contact" }));

  expect(await screen.findByText("This looks like a duplicate")).toBeInTheDocument();
  expect(screen.getByText("Save it anyway?")).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Save anyway" }));

  await waitFor(() => expect(createNewContact).toHaveBeenCalledTimes(2));
  expect(createNewContact.mock.calls[0][6]).toEqual({ allowDuplicate: false, emergency: false, tagIds: [], ...NO_DETAILS });
  expect(createNewContact.mock.calls[1][6]).toEqual({ allowDuplicate: true, emergency: false, tagIds: [], ...NO_DETAILS });
});

test("Go back returns to the form without saving", async () => {
  createNewContact.mockRejectedValueOnce(duplicateError([ALI]));
  renderModal();
  fillValidContact();
  fireEvent.click(screen.getByRole("button", { name: "Add Contact" }));
  await screen.findByText("This looks like a duplicate");

  fireEvent.click(screen.getByRole("button", { name: "Go back" }));

  expect(screen.getByRole("button", { name: "Add Contact" })).toBeInTheDocument();
  expect(screen.queryByText("This looks like a duplicate")).not.toBeInTheDocument();
  expect(createNewContact).toHaveBeenCalledTimes(1);
});

test("editing a field after the warning goes back to a normal save", async () => {
  createNewContact.mockRejectedValueOnce(duplicateError([ALI]));
  renderModal();
  fillValidContact();
  fireEvent.click(screen.getByRole("button", { name: "Add Contact" }));
  await screen.findByText("Save it anyway?");

  fill(/phone no/i, "0311 7654321");

  expect(screen.getByRole("button", { name: "Add Contact" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Save anyway" })).not.toBeInTheDocument();
});

describe("emergency contact", () => {
  afterEach(() => createNewContact.mockReset());

  const checkbox = () => screen.getByRole("checkbox", { name: "Emergency contact" });

  test("starts unticked", () => {
    renderModal();
    expect(checkbox()).not.toBeChecked();
  });

  test("ticking it saves the new contact as an emergency contact", async () => {
    createNewContact.mockResolvedValue({ id: 9 });
    renderModal();
    fillValidContact();

    fireEvent.click(checkbox());
    fireEvent.click(screen.getByRole("button", { name: "Add Contact" }));

    await waitFor(() => expect(createNewContact).toHaveBeenCalledTimes(1));
    expect(createNewContact.mock.calls[0][6]).toEqual({ allowDuplicate: false, emergency: true, tagIds: [], ...NO_DETAILS });
  });

  test("opened from the Emergency page, it starts ticked", () => {
    render(<AddContactModal userId="user-1" onClose={vi.fn()} fetchContacts={vi.fn()} defaultEmergency />);
    expect(checkbox()).toBeChecked();
  });
});
