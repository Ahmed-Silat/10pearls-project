import { act, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import Sidebar from "./Sidebar";
import { CONTACTS_CHANGED_EVENT, getContactCounts } from "../../service/ContactService";

vi.mock("../../service/ContactService", async (importOriginal) => ({
  ...(await importOriginal()),
  getContactCounts: vi.fn(),
}));

afterEach(() => getContactCounts.mockReset());

const renderAt = (path) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <SidebarProvider>
        <Sidebar onSignOut={() => {}} />
      </SidebarProvider>
    </MemoryRouter>
  );

const link = (name) => screen.getByRole("link", { name: new RegExp(`^${name}`) });
const count = (key) => screen.getByTestId(`count-${key}`);

test("links to every section with its count", async () => {
  getContactCounts.mockResolvedValue({ all: 24, favorites: 5, emergency: 2, recentlyDeleted: 3 });
  renderAt("/");

  await waitFor(() => expect(count("all")).toHaveTextContent("24"));
  expect(link("All contacts")).toHaveAttribute("href", "/");
  expect(count("favorites")).toHaveTextContent("5");
  expect(link("Favorites")).toHaveAttribute("href", "/favorites");
  expect(count("emergency")).toHaveTextContent("2");
  expect(link("Emergency")).toHaveAttribute("href", "/emergency");
  expect(count("recentlyDeleted")).toHaveTextContent("3");
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
  await waitFor(() => expect(count("favorites")).toHaveTextContent("0"));

  act(() => {
    window.dispatchEvent(new Event(CONTACTS_CHANGED_EVENT));
  });

  await waitFor(() => expect(count("favorites")).toHaveTextContent("1"));
});

test("still shows the links if the counts can't be loaded", async () => {
  getContactCounts.mockRejectedValue(new Error("offline"));
  renderAt("/");

  await waitFor(() => expect(getContactCounts).toHaveBeenCalled());
  expect(link("All contacts")).toBeInTheDocument();
  expect(screen.queryByTestId("count-all")).not.toBeInTheDocument();
});
