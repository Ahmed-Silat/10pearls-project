import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import EditModal from "./EditModal";
import { checkDuplicates } from "../../service/ContactService";

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
