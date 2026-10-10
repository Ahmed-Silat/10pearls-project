import "@testing-library/jest-dom";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import ContactCard from "./ContactCard";
import { getContactById } from "../../service/ContactService";

jest.mock("../../service/ContactService");

// axios ships as an ES module that Create React App's Jest setup can't load; the API is mocked anyway.
jest.mock("axios", () => ({
  create: () => ({
    interceptors: { request: { use: () => {} }, response: { use: () => {} } },
  }),
}));

const LONG_NAME = "muhammad abdullah bin abdul rehman qureshi";

const renderCard = (overrides = {}) =>
  render(
    <ContactCard
      contactId="c1"
      firstName="muhammad abdullah bin abdul rehman"
      lastName="qureshi"
      phone="0300-1234567"
      email="m.qureshi@example.com"
      address=""
      fetchContacts={jest.fn()}
      {...overrides}
    />
  );

test("the name shows its full text on hover", () => {
  renderCard();
  expect(screen.getByRole("button", { name: LONG_NAME })).toHaveAttribute("title", LONG_NAME);
});

test("'View details' opens the full contact details", () => {
  renderCard();

  fireEvent.click(screen.getByRole("button", { name: `View ${LONG_NAME}` }));

  const dialog = screen.getByRole("dialog");
  expect(within(dialog).getByRole("heading", { name: LONG_NAME })).toBeInTheDocument();
  expect(within(dialog).getByRole("link", { name: "0300-1234567" })).toHaveAttribute("href", "tel:03001234567");
  expect(within(dialog).getByRole("link", { name: "m.qureshi@example.com" })).toHaveAttribute(
    "href",
    "mailto:m.qureshi@example.com"
  );
  // The empty address shows N/A.
  expect(within(dialog).getByText("N/A")).toBeInTheDocument();
});

test("clicking the name also opens the details", () => {
  renderCard();
  fireEvent.click(screen.getByRole("button", { name: LONG_NAME }));
  expect(screen.getByRole("dialog")).toBeInTheDocument();
});

test("Close closes the details", () => {
  renderCard();
  fireEvent.click(screen.getByRole("button", { name: `View ${LONG_NAME}` }));
  fireEvent.click(screen.getByRole("button", { name: "Close" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("Edit in the details switches to the Update Contact form", async () => {
  getContactById.mockResolvedValue({
    id: "c1",
    firstName: "muhammad abdullah bin abdul rehman",
    lastName: "qureshi",
    email: "m.qureshi@example.com",
    phone: "0300-1234567",
    address: null,
  });
  renderCard();

  fireEvent.click(screen.getByRole("button", { name: `View ${LONG_NAME}` }));
  fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Edit" }));

  expect(await screen.findByRole("heading", { name: "Update Contact" })).toBeInTheDocument();
  expect(getContactById).toHaveBeenCalledWith("c1");
  expect(screen.queryByText("Contact details")).not.toBeInTheDocument();
  // Wait for the fetched contact to fill the form.
  expect(await screen.findByDisplayValue("m.qureshi@example.com")).toBeInTheDocument();
});

/** A promise the test resolves or rejects by hand, to simulate a slow network. */
const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

const CONTACT = {
  id: "c1",
  firstName: "muhammad abdullah bin abdul rehman",
  lastName: "qureshi",
  email: "m.qureshi@example.com",
  phone: "0300-1234567",
  address: null,
};

test("on a slow connection the edit modal opens straight away with a loader", async () => {
  const request = deferred();
  getContactById.mockReturnValue(request.promise);
  renderCard();

  fireEvent.click(screen.getByRole("button", { name: `Edit ${LONG_NAME}` }));

  // Before the data arrives: modal open, loader showing, Update disabled, no fields yet.
  expect(screen.getByRole("heading", { name: "Update Contact" })).toBeInTheDocument();
  expect(screen.getByText("Loading contact details...")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Update" })).toBeDisabled();
  expect(screen.queryByLabelText(/First Name/)).not.toBeInTheDocument();

  request.resolve(CONTACT);

  // After: the form is filled in and can be submitted.
  expect(await screen.findByDisplayValue("m.qureshi@example.com")).toBeInTheDocument();
  expect(screen.queryByText("Loading contact details...")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Update" })).toBeEnabled();
});

test("if loading the contact fails, the edit modal closes", async () => {
  getContactById.mockRejectedValue(new Error("Network Error"));
  renderCard();

  fireEvent.click(screen.getByRole("button", { name: `Edit ${LONG_NAME}` }));

  await waitFor(() =>
    expect(screen.queryByRole("heading", { name: "Update Contact" })).not.toBeInTheDocument()
  );
});

test("a response that arrives after the edit modal was closed is ignored", async () => {
  const request = deferred();
  getContactById.mockReturnValue(request.promise);
  renderCard();

  fireEvent.click(screen.getByRole("button", { name: `Edit ${LONG_NAME}` }));
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  request.resolve(CONTACT);
  await act(async () => {});

  expect(screen.queryByRole("heading", { name: "Update Contact" })).not.toBeInTheDocument();
});
