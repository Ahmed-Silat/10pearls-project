import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Toaster } from "sonner";
import RecentlyDeleted, { timeLeftLabel } from "./RecentlyDeleted";
import {
  deletePermanently,
  getRecentlyDeleted,
  restoreContact,
} from "../../service/ContactService";

// axios ships as an ES module that Create React App's Jest setup can't load; the API calls are mocked below.
jest.mock("axios", () => ({
  create: () => ({
    interceptors: { request: { use: () => {} }, response: { use: () => {} } },
  }),
}));

jest.mock("../../service/ContactService", () => ({
  getRecentlyDeleted: jest.fn(),
  restoreContact: jest.fn(),
  deletePermanently: jest.fn(),
}));

beforeAll(() => {
  // jsdom doesn't implement matchMedia, which Sonner uses for its theme.
  window.matchMedia =
    window.matchMedia ||
    (() => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} }));
});

afterEach(() => jest.resetAllMocks());

const DAY = 24 * 60 * 60 * 1000;
const deletedContact = (id, firstName, daysAgo) => ({
  id,
  firstName,
  lastName: "khan",
  phone: "0300 1234567",
  email: `${firstName}@example.com`,
  deletedAt: new Date(Date.now() - daysAgo * DAY).toISOString(),
  deletesPermanentlyAt: new Date(Date.now() + (30 - daysAgo) * DAY).toISOString(),
});
const pageOf = (contacts) => ({
  contacts,
  totalContacts: contacts.length,
  totalPages: contacts.length ? 1 : 0,
  currentPage: 1,
  contactsPerPage: 20,
});

const renderPage = () =>
  render(
    <MemoryRouter>
      <Toaster />
      <RecentlyDeleted />
    </MemoryRouter>
  );

const rowFor = async (name) =>
  (await screen.findAllByTestId("deleted-contact")).find((row) => within(row).queryByText(name));

test("lists deleted contacts with how long they have left", async () => {
  getRecentlyDeleted.mockResolvedValue(pageOf([deletedContact(1, "ali", 2), deletedContact(2, "sara", 28)]));
  renderPage();

  expect(within(await rowFor("ali khan")).getByText(/27 days left/)).toBeInTheDocument();
  expect(within(await rowFor("sara khan")).getByText(/1 day left/)).toBeInTheDocument();
  expect(screen.getByText("(2)")).toBeInTheDocument();
});

test("shows an empty state when nothing has been deleted", async () => {
  getRecentlyDeleted.mockResolvedValue(pageOf([]));
  renderPage();

  expect(await screen.findByText("Nothing here")).toBeInTheDocument();
});

test("Restore brings the contact back and refreshes the list", async () => {
  getRecentlyDeleted
    .mockResolvedValueOnce(pageOf([deletedContact(1, "ali", 2)]))
    .mockResolvedValueOnce(pageOf([]));
  restoreContact.mockResolvedValue({ id: 1 });
  renderPage();

  fireEvent.click(within(await rowFor("ali khan")).getByRole("button", { name: "Restore" }));

  await waitFor(() => expect(restoreContact).toHaveBeenCalledWith(1));
  expect(await screen.findByText("Contact restored")).toBeInTheDocument();
  expect(await screen.findByText("Nothing here")).toBeInTheDocument();
});

test("a failed restore explains why, e.g. a duplicate phone number", async () => {
  getRecentlyDeleted.mockResolvedValue(pageOf([deletedContact(1, "ali", 2)]));
  restoreContact.mockRejectedValue({
    response: { data: { message: "You already have a contact with this phone number" } },
  });
  renderPage();

  fireEvent.click(within(await rowFor("ali khan")).getByRole("button", { name: "Restore" }));

  expect(await screen.findByText("You already have a contact with this phone number")).toBeInTheDocument();
});

test("Delete forever asks first, and only deletes once confirmed", async () => {
  getRecentlyDeleted
    .mockResolvedValueOnce(pageOf([deletedContact(1, "ali", 2)]))
    .mockResolvedValueOnce(pageOf([]));
  deletePermanently.mockResolvedValue();
  renderPage();

  fireEvent.click(within(await rowFor("ali khan")).getByRole("button", { name: "Delete forever" }));
  const dialog = await screen.findByRole("dialog");
  expect(within(dialog).getByText("Delete permanently?")).toBeInTheDocument();
  expect(deletePermanently).not.toHaveBeenCalled();

  fireEvent.click(within(dialog).getByRole("button", { name: "Delete forever" }));

  await waitFor(() => expect(deletePermanently).toHaveBeenCalledWith(1));
  expect(await screen.findByText("Contact deleted permanently")).toBeInTheDocument();
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
});

test("cancelling Delete forever keeps the contact", async () => {
  getRecentlyDeleted.mockResolvedValue(pageOf([deletedContact(1, "ali", 2)]));
  renderPage();

  fireEvent.click(within(await rowFor("ali khan")).getByRole("button", { name: "Delete forever" }));
  fireEvent.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Cancel" }));

  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(deletePermanently).not.toHaveBeenCalled();
});

test("timeLeftLabel counts whole days left", () => {
  const now = Date.parse("2026-10-24T12:00:00Z");
  expect(timeLeftLabel("2026-11-23T12:00:00Z", now)).toBe("30 days left");
  expect(timeLeftLabel("2026-10-25T18:00:00Z", now)).toBe("1 day left");
  expect(timeLeftLabel("2026-10-25T06:00:00Z", now)).toBe("Less than a day left");
});
