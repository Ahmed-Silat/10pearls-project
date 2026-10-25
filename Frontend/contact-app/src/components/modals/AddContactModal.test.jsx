import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import AddContactModal from "./AddContactModal";
import { checkDuplicates, createNewContact } from "../../service/ContactService";

// axios ships as an ES module that Create React App's Jest setup can't load; the API calls are mocked below.
jest.mock("axios", () => ({
  create: () => ({
    interceptors: { request: { use: () => {} }, response: { use: () => {} } },
  }),
}));

jest.mock("../../service/ContactService", () => ({
  ...jest.requireActual("../../service/ContactService"),
  createNewContact: jest.fn(),
  checkDuplicates: jest.fn(),
}));

const ALI = { id: 5, firstName: "ali", lastName: "khan", field: "phone" };
const duplicateError = (duplicates) => ({
  response: {
    status: 409,
    data: { message: "You already have a contact with this phone number", duplicates },
  },
});

const renderModal = () =>
  render(<AddContactModal userId="user-1" onClose={jest.fn()} fetchContacts={jest.fn()} />);

const fill = (label, value) => fireEvent.change(screen.getByLabelText(label), { target: { value } });

const fillValidContact = () => {
  fill(/first name/i, "Zed");
  fill(/phone no/i, "0300 1234567");
};

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
  expect(createNewContact.mock.calls[0][6]).toEqual({ allowDuplicate: false });
  expect(createNewContact.mock.calls[1][6]).toEqual({ allowDuplicate: true });
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
