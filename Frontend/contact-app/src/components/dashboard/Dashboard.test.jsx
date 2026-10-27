import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Dashboard from "./Dashboard";
import { getContactsByUserId } from "../../service/ContactService";

vi.mock("../../service/ContactService");

// The real hook measures the screen, which jsdom does not have; use a fixed size per test.
let mockCardsPerPage = 10;
vi.mock("../../hooks/useCardsPerPage", () => ({
  useCardsPerPage: () => ({ pageSize: mockCardsPerPage, ready: true, remeasure: () => {} }),
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

// getContactsByUserId(userId, sortBy, search, page, size, filter)
const requestedPages = () => getContactsByUserId.mock.calls.map((call) => call[3]);

test("treats an invalid page in the URL as page 1", async () => {
  getContactsByUserId.mockResolvedValue(page({ contacts: [contact("c1", "ali")], totalContacts: 1 }));

  renderDashboard("/?page=abc");

  await screen.findByText("ali");
  await waitForIdle();
  expect(getContactsByUserId).toHaveBeenCalledWith("user-1", "", "", 1, 10, "all");
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

  const user = userEvent.setup();
  await user.click(screen.getByRole("combobox", { name: "Sort contacts" }));
  await user.click(screen.getByRole("option", { name: "Name (Z–A)" }));

  await waitFor(() =>
    expect(getContactsByUserId).toHaveBeenLastCalledWith("user-1", "Z-A", "", 1, 10, "all")
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
  window.scrollTo = vi.fn();
  getContactsByUserId.mockResolvedValue(
    page({ contacts: [contact("c1", "ali")], currentPage: 1, totalPages: 3, totalContacts: 25 })
  );

  renderDashboard("/");
  await screen.findByText("ali");

  fireEvent.click(screen.getByRole("button", { name: "Page 3" }));

  await waitFor(() => expect(getContactsByUserId).toHaveBeenLastCalledWith("user-1", "", "", 3, 10, "all"));
  await waitForIdle();
  expect(window.scrollTo).toHaveBeenCalled();
});

test("uses the number of cards that fit the screen as the page size", async () => {
  mockCardsPerPage = 8;
  getContactsByUserId.mockResolvedValue(page({ contacts: [contact("c1", "ali")], totalContacts: 1, size: 8 }));

  renderDashboard("/");
  await screen.findByText("ali");
  await waitForIdle();

  expect(getContactsByUserId).toHaveBeenCalledWith("user-1", "", "", 1, 8, "all");
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

  await waitFor(() => expect(getContactsByUserId).toHaveBeenLastCalledWith("user-1", "", "", 6, 4, "all"));
  await waitForIdle();
});

describe("Favorites page", () => {
  const renderFavorites = () =>
    render(
      <MemoryRouter initialEntries={["/favorites"]}>
        <Dashboard view="favorites" />
      </MemoryRouter>
    );

  test("asks only for starred contacts and says it's the Favorites page", async () => {
    getContactsByUserId.mockResolvedValue(page({ contacts: [contact("c1", "ali")], totalContacts: 1 }));
    renderFavorites();

    await waitForIdle();
    expect(getContactsByUserId).toHaveBeenCalledWith("user-1", "", "", 1, 10, "favorites");
    expect(screen.getByRole("heading", { level: 1, name: "Favorites" })).toBeInTheDocument();
  });

  test("with nothing starred, explains how to add favorites", async () => {
    getContactsByUserId.mockResolvedValue(page({ contacts: [], totalContacts: 0, totalPages: 0 }));
    renderFavorites();

    expect(await screen.findByText("No favorites yet")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go to all contacts" })).toHaveAttribute("href", "/");
  });
});

describe("Emergency page", () => {
  const renderEmergency = () =>
    render(
      <MemoryRouter initialEntries={["/emergency"]}>
        <Dashboard view="emergency" />
      </MemoryRouter>
    );

  test("asks only for emergency contacts and says it's the Emergency page", async () => {
    getContactsByUserId.mockResolvedValue(page({ contacts: [contact("c1", "mom")], totalContacts: 1 }));
    renderEmergency();

    await waitForIdle();
    expect(getContactsByUserId).toHaveBeenCalledWith("user-1", "", "", 1, 10, "emergency");
    expect(screen.getByRole("heading", { level: 1, name: "Emergency" })).toBeInTheDocument();
  });

  test("with no emergency contacts, explains how to add them", async () => {
    getContactsByUserId.mockResolvedValue(page({ contacts: [], totalContacts: 0, totalPages: 0 }));
    renderEmergency();

    expect(await screen.findByText("No emergency contacts yet")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go to all contacts" })).toHaveAttribute("href", "/");
  });

  test("a search with no matches says no emergency contacts were found", async () => {
    getContactsByUserId.mockResolvedValue(page({ contacts: [], totalContacts: 0, totalPages: 0 }));
    render(
      <MemoryRouter initialEntries={["/emergency?search=zz"]}>
        <Dashboard view="emergency" />
      </MemoryRouter>
    );

    expect(await screen.findByText("No emergency contacts found")).toBeInTheDocument();
  });

  test("Add Contact here starts with Emergency contact ticked", async () => {
    getContactsByUserId.mockResolvedValue(page({ contacts: [], totalContacts: 0, totalPages: 0 }));
    renderEmergency();
    await waitForIdle();

    fireEvent.click(screen.getByRole("button", { name: "Add Contact" }));

    expect(screen.getByRole("checkbox", { name: "Emergency contact" })).toBeChecked();
  });
});

describe("the number of contacts", () => {
  test("shows how many contacts there are in all, next to the heading", async () => {
    getContactsByUserId.mockResolvedValue(
      page({ contacts: [contact("c1", "ali")], totalContacts: 1234, totalPages: 124 })
    );

    renderDashboard("/");

    // Beside the heading, which still reads just "My Contacts"; screen readers hear "1,234 contacts".
    expect(await screen.findByText("1,234")).toHaveTextContent("1,234 contacts");
    expect(screen.getByRole("heading", { name: "My Contacts" })).toBeInTheDocument();
    await waitForIdle();
  });

  test("while searching, says how many match", async () => {
    getContactsByUserId.mockResolvedValue(page({ contacts: [contact("c1", "ali")], totalContacts: 1 }));

    renderDashboard("/?search=ali");

    expect(await screen.findByText("1 result")).toBeInTheDocument();
    await waitForIdle();
  });

  test("is hidden until the contacts have loaded", () => {
    getContactsByUserId.mockReturnValue(new Promise(() => {}));

    renderDashboard("/");

    expect(screen.getByRole("heading", { name: "My Contacts" })).toBeInTheDocument();
  });
});

test("the browser tab is titled after the section", async () => {
  getContactsByUserId.mockResolvedValue(page({}));

  const { unmount } = render(
    <MemoryRouter initialEntries={["/emergency"]}>
      <Dashboard view="emergency" />
    </MemoryRouter>
  );

  expect(document.title).toBe("Emergency contacts · ContactHub");
  await waitForIdle();
  unmount();

  renderDashboard("/");
  expect(document.title).toBe("Contacts · ContactHub");
  await waitForIdle();
});
