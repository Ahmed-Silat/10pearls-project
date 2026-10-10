import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Dashboard from "./Dashboard";
import { getContactsByUserId } from "../../service/ContactService";

jest.mock("../../service/ContactService");

// The real hook measures the screen, which jsdom does not have; use a fixed size per test.
let mockCardsPerPage = 10;
jest.mock("../../hooks/useCardsPerPage", () => ({
  useCardsPerPage: () => ({ pageSize: mockCardsPerPage, ready: true, remeasure: () => {} }),
}));

// axios ships as an ES module that Create React App's Jest setup can't load; the API is mocked anyway.
jest.mock("axios", () => ({
  create: () => ({
    interceptors: { request: { use: () => {} }, response: { use: () => {} } },
  }),
}));

const page = ({ contacts = [], currentPage = 1, totalPages = 1, totalContacts = 0, size = 10 }) => ({
  contacts,
  currentPage,
  totalPages,
  totalContacts,
  contactsPerPage: size,
});

const contact = (id, firstName) => ({ id, firstName, lastName: "", email: "", phone: "0300", address: "" });

const dashboardAt = (url) => (
  <MemoryRouter initialEntries={[url]}>
    <Dashboard />
  </MemoryRouter>
);

const renderDashboard = (url) => render(dashboardAt(url));

beforeEach(() => {
  mockCardsPerPage = 10;
  localStorage.setItem("userData", JSON.stringify({ id: "user-1", token: "t" }));
  getContactsByUserId.mockReset();
});

// Waits until the loading overlay is gone, so no state updates happen after the test ends.
const waitForIdle = () =>
  waitFor(() => expect(screen.queryByRole("status")).not.toBeInTheDocument());

// getContactsByUserId(userId, sortBy, search, page, size)
const requestedPages = () => getContactsByUserId.mock.calls.map((call) => call[3]);

test("treats an invalid page in the URL as page 1", async () => {
  getContactsByUserId.mockResolvedValue(page({ contacts: [contact("c1", "ali")], totalContacts: 1 }));

  renderDashboard("/?page=abc");

  await screen.findByText("ali");
  await waitForIdle();
  expect(getContactsByUserId).toHaveBeenCalledWith("user-1", "", "", 1, 10);
});

test("goes to the last existing page when the current page is empty", async () => {
  getContactsByUserId
    .mockResolvedValueOnce(page({ currentPage: 3, totalPages: 2, totalContacts: 12 }))
    .mockResolvedValueOnce(
      page({ contacts: [contact("c11", "zara")], currentPage: 2, totalPages: 2, totalContacts: 12 })
    );

  renderDashboard("/?page=3");

  expect(await screen.findByText("zara")).toBeInTheDocument();
  await waitForIdle();
  expect(requestedPages()).toEqual([3, 2]);
  expect(screen.queryByText("No contacts yet")).not.toBeInTheDocument();
});

test("changing the sort order goes back to page 1", async () => {
  getContactsByUserId.mockResolvedValue(
    page({ contacts: [contact("c1", "ali")], currentPage: 2, totalPages: 3, totalContacts: 25 })
  );

  renderDashboard("/?page=2");
  await screen.findByText("ali");

  fireEvent.click(screen.getByRole("button", { name: "Sort contacts" }));
  fireEvent.click(screen.getByRole("option", { name: "Name (Z–A)" }));

  await waitFor(() =>
    expect(getContactsByUserId).toHaveBeenLastCalledWith("user-1", "Z-A", "", 1, 10)
  );
  await waitForIdle();
});

test("hides the pagination footer when all contacts fit on one page", async () => {
  getContactsByUserId.mockResolvedValue(page({ contacts: [contact("c1", "ali")], totalContacts: 1 }));

  renderDashboard("/");
  await screen.findByText("ali");
  await waitForIdle();

  expect(screen.queryByText(/Showing/)).not.toBeInTheDocument();
  expect(screen.queryByRole("navigation", { name: "Pagination" })).not.toBeInTheDocument();
});

test("shows the pagination footer when contacts span more than one page", async () => {
  getContactsByUserId.mockResolvedValue(
    page({ contacts: [contact("c1", "ali")], totalPages: 2, totalContacts: 12 })
  );

  renderDashboard("/");
  await screen.findByText("ali");
  await waitForIdle();

  expect(screen.getByText(/Showing/)).toHaveTextContent("Showing 1–10 of 12 contacts");
});

test("clicking a page number loads that page", async () => {
  window.scrollTo = jest.fn();
  getContactsByUserId.mockResolvedValue(
    page({ contacts: [contact("c1", "ali")], currentPage: 1, totalPages: 3, totalContacts: 25 })
  );

  renderDashboard("/");
  await screen.findByText("ali");

  fireEvent.click(screen.getByRole("button", { name: "Page 3" }));

  await waitFor(() => expect(getContactsByUserId).toHaveBeenLastCalledWith("user-1", "", "", 3, 10));
  await waitForIdle();
  expect(window.scrollTo).toHaveBeenCalled();
});

test("uses the number of cards that fit the screen as the page size", async () => {
  mockCardsPerPage = 8;
  getContactsByUserId.mockResolvedValue(page({ contacts: [contact("c1", "ali")], totalContacts: 1, size: 8 }));

  renderDashboard("/");
  await screen.findByText("ali");
  await waitForIdle();

  expect(getContactsByUserId).toHaveBeenCalledWith("user-1", "", "", 1, 8);
});

test("when the cards per page change, stays near the contacts being viewed", async () => {
  getContactsByUserId.mockResolvedValue(
    page({ contacts: [contact("c21", "omar")], currentPage: 3, totalPages: 11, totalContacts: 105 })
  );

  // Page 3 at 10 per page starts at contact #21.
  const { rerender } = renderDashboard("/?page=3");
  await screen.findByText("omar");
  await waitForIdle();

  // The window gets smaller: now 4 per page, so contact #21 is on page 6.
  mockCardsPerPage = 4;
  rerender(dashboardAt("/?page=3"));

  await waitFor(() => expect(getContactsByUserId).toHaveBeenLastCalledWith("user-1", "", "", 6, 4));
  await waitForIdle();
});
