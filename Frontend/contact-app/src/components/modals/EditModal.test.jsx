import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import EditModal from "./EditModal";
import { checkDuplicates, updateContact } from "../../service/ContactService";

// axios ships as an ES module that Create React App's Jest setup can't load; the API calls are mocked below.
jest.mock("axios", () => ({
  create: () => ({
    interceptors: { request: { use: () => {} }, response: { use: () => {} } },
  }),
}));

jest.mock("../../service/ContactService", () => ({
  ...jest.requireActual("../../service/ContactService"),
  updateContact: jest.fn(),
  checkDuplicates: jest.fn(),
}));

test("the duplicate check leaves out the contact being edited", async () => {
  checkDuplicates.mockResolvedValue([]);
  render(
    <EditModal
      contactData={{ id: 7, firstName: "zed", phone: "0300 1234567", email: "zed@example.com" }}
      onClose={jest.fn()}
      getContacts={jest.fn()}
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
      onClose={jest.fn()}
      getContacts={jest.fn()}
    />
  );
  const checkbox = screen.getByRole("checkbox", { name: "Emergency contact" });
  expect(checkbox).toBeChecked();

  fireEvent.click(checkbox);
  fireEvent.click(screen.getByRole("button", { name: "Update" }));

  await waitFor(() => expect(updateContact).toHaveBeenCalledTimes(1));
  expect(updateContact.mock.calls[0][6]).toEqual({ allowDuplicate: false, emergency: false });
});
