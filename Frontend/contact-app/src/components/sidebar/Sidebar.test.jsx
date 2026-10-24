import "@testing-library/jest-dom";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Sidebar from "./Sidebar";
import { CONTACTS_CHANGED_EVENT, getContactCounts } from "../../service/ContactService";

// axios ships as an ES module that Create React App's Jest setup can't load; the API calls are mocked below.
jest.mock("axios", () => ({
  create: () => ({
    interceptors: { request: { use: () => {} }, response: { use: () => {} } },
  }),
}));

jest.mock("../../service/ContactService", () => ({
  ...jest.requireActual("../../service/ContactService"),
  getContactCounts: jest.fn(),
}));

afterEach(() => getContactCounts.mockReset());

const renderAt = (path) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Sidebar />
    </MemoryRouter>
  );

const link = (name) => screen.getByRole("link", { name: new RegExp(`^${name}`) });

test("links to every section with its count", async () => {
  getContactCounts.mockResolvedValue({ all: 24, favorites: 5, recentlyDeleted: 3 });
  renderAt("/");

  await waitFor(() => expect(within(link("All contacts")).getByText("24")).toBeInTheDocument());
  expect(link("All contacts")).toHaveAttribute("href", "/");
  expect(within(link("Favorites")).getByText("5")).toBeInTheDocument();
  expect(link("Favorites")).toHaveAttribute("href", "/favorites");
  expect(within(link("Recently deleted")).getByText("3")).toBeInTheDocument();
  expect(link("Recently deleted")).toHaveAttribute("href", "/recently-deleted");
});

test("highlights the section you're on", async () => {
  getContactCounts.mockResolvedValue({ all: 1, favorites: 1, recentlyDeleted: 0 });
  renderAt("/favorites");

  await waitFor(() => expect(link("Favorites")).toHaveAttribute("aria-current", "page"));
  expect(link("All contacts")).not.toHaveAttribute("aria-current");
});

test("refreshes the counts when contacts change", async () => {
  getContactCounts
    .mockResolvedValueOnce({ all: 2, favorites: 0, recentlyDeleted: 0 })
    .mockResolvedValueOnce({ all: 2, favorites: 1, recentlyDeleted: 0 });
  renderAt("/");
  await waitFor(() => expect(within(link("Favorites")).getByText("0")).toBeInTheDocument());

  act(() => {
    window.dispatchEvent(new Event(CONTACTS_CHANGED_EVENT));
  });

  await waitFor(() => expect(within(link("Favorites")).getByText("1")).toBeInTheDocument());
});

test("still shows the links if the counts can't be loaded", async () => {
  getContactCounts.mockRejectedValue(new Error("offline"));
  renderAt("/");

  await waitFor(() => expect(getContactCounts).toHaveBeenCalled());
  expect(link("All contacts")).toBeInTheDocument();
  expect(screen.queryByTestId("count-all")).not.toBeInTheDocument();
});
