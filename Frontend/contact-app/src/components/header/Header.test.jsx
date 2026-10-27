import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import Header, { LOGOUT_DELAY_MS } from "./Header";

// The header includes the sidebar, which loads its counts from the API; keep the tests off the network.
vi.mock("../../service/ContactService", async (importOriginal) => ({
  ...(await importOriginal()),
  getContactCounts: vi.fn(() => Promise.resolve({ all: 0, favorites: 0, emergency: 0, recentlyDeleted: 0 })),
}));

/** Prints the current URL query so tests can check what the header changed. */
function CurrentQuery() {
  return <div data-testid="query">{useLocation().search}</div>;
}

const renderHeader = (url) =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <Header />
      <CurrentQuery />
    </MemoryRouter>
  );

beforeEach(() => {
  localStorage.setItem("userData", JSON.stringify({ id: "user-1", firstName: "ali", token: "t" }));
});

const desktopSearch = () => screen.getAllByLabelText("Search contacts")[0];

test("shows no clear button when the search box is empty", () => {
  renderHeader("/");
  expect(screen.queryByRole("button", { name: "Clear search" })).not.toBeInTheDocument();
});

test("the clear button empties the search and removes it from the URL", () => {
  renderHeader("/?search=ali&page=2&size=5");
  expect(desktopSearch()).toHaveValue("ali");

  fireEvent.click(screen.getByRole("button", { name: "Clear search" }));

  expect(desktopSearch()).toHaveValue("");
  expect(desktopSearch()).toHaveFocus();
  expect(screen.getByTestId("query")).toHaveTextContent("?size=5");
  expect(screen.queryByRole("button", { name: "Clear search" })).not.toBeInTheDocument();
});

test("pressing Escape in the search box clears it", () => {
  renderHeader("/?search=ali");

  fireEvent.keyDown(desktopSearch(), { key: "Escape" });

  expect(desktopSearch()).toHaveValue("");
  expect(screen.getByTestId("query")).toHaveTextContent(/^$/);
});

test("typing a new search goes back to page 1", () => {
  renderHeader("/?page=3");

  fireEvent.change(desktopSearch(), { target: { value: "sa" } });

  expect(screen.getByTestId("query")).toHaveTextContent("?search=sa");
});

describe("signing out", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  // The account menu opens on a real pointer press, so drive it with user-event (on the fake clock).
  const signOut = async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await user.click(screen.getByRole("button", { name: /open user menu/i }));
    // jsdom treats the open menu as "pointer-events: none" (Radix sets it on the page behind), so click directly.
    fireEvent.click(screen.getByRole("menuitem", { name: /sign out/i }));
  };

  test("shows the loader, then clears the session and goes to login", async () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Header />
        <CurrentPath />
      </MemoryRouter>
    );

    await signOut();

    expect(screen.getByRole("status")).toHaveTextContent("Signing you out...");
    expect(localStorage.getItem("userData")).not.toBeNull();
    expect(screen.getByTestId("path")).toHaveTextContent("/");

    act(() => vi.advanceTimersByTime(LOGOUT_DELAY_MS));

    expect(localStorage.getItem("userData")).toBeNull();
    expect(screen.getByTestId("path")).toHaveTextContent("/login");
  });
});

function CurrentPath() {
  return <div data-testid="path">{useLocation().pathname}</div>;
}

test("the account menu shows the signed-in user's full name and email", async () => {
  localStorage.setItem(
    "userData",
    JSON.stringify({ id: "user-1", firstName: "ali", lastName: "khan", email: "ali.khan@example.com", token: "t" })
  );
  renderHeader("/");
  // Found before opening: while the menu is open, the rest of the page is hidden from screen readers.
  const trigger = screen.getByRole("button", { name: /open user menu/i });

  await userEvent.click(trigger);

  expect(screen.getByTestId("menu-user-name")).toHaveTextContent("ali khan");
  expect(screen.getByTestId("menu-user-email")).toHaveTextContent("ali.khan@example.com");
  // The menu button itself also shows who is signed in.
  expect(trigger).toHaveTextContent("ali khan");
});

test("the page layout includes the sidebar's section links", () => {
  renderHeader("/");

  const sections = screen.getByRole("navigation", { name: "Sections" });
  expect(within(sections).getByRole("link", { name: /^Favorites/ })).toHaveAttribute("href", "/favorites");
  expect(within(sections).getByRole("link", { name: /^Emergency/ })).toHaveAttribute("href", "/emergency");
  expect(within(sections).getByRole("link", { name: /^Recently deleted/ })).toHaveAttribute(
    "href",
    "/recently-deleted"
  );
});

test("the sidebar toggle collapses the sidebar to icons and back", () => {
  renderHeader("/");
  const sidebar = () => document.querySelector("[data-variant=sidebar]");
  // The top-bar button (the sidebar edge "rail" has the same label, for mouse users).
  const toggle = () =>
    screen.getAllByRole("button", { name: "Toggle Sidebar" }).find((b) => b.dataset.sidebar === "trigger");
  expect(sidebar()).toHaveAttribute("data-state", "expanded");

  fireEvent.click(toggle());
  expect(sidebar()).toHaveAttribute("data-state", "collapsed");

  fireEvent.click(toggle());
  expect(sidebar()).toHaveAttribute("data-state", "expanded");
});

test("the top bar names the current page", () => {
  renderHeader("/emergency");
  expect(screen.getByText("Emergency", { selector: "[aria-current=page]:not(a)" })).toBeInTheDocument();
});

test("search also appears on the Favorites page", () => {
  renderHeader("/favorites");
  expect(screen.getAllByLabelText("Search contacts").length).toBeGreaterThan(0);
});

test("the search box only appears on the contacts page", () => {
  renderHeader("/recently-deleted");
  expect(screen.queryByLabelText("Search contacts")).not.toBeInTheDocument();
});

describe("the / shortcut for search", () => {
  /** jsdom lays nothing out, so every element looks hidden; this makes the top-bar box count as visible. */
  const showDesktopBox = () =>
    Object.defineProperty(desktopSearch(), "offsetParent", { configurable: true, get: () => document.body });

  test("jumps to the search box, without typing the /", () => {
    renderHeader("/");
    showDesktopBox();

    const typed = fireEvent.keyDown(document.body, { key: "/" });

    expect(desktopSearch()).toHaveFocus();
    expect(typed).toBe(false); // the key press was swallowed
  });

  test("the empty box shows the shortcut, and hides it once there's text", () => {
    renderHeader("/");
    expect(desktopSearch()).toHaveAttribute("aria-keyshortcuts", "/");
    expect(screen.getByText("/", { selector: "kbd" })).toBeInTheDocument();

    fireEvent.change(desktopSearch(), { target: { value: "ali" } });

    expect(screen.queryByText("/", { selector: "kbd" })).not.toBeInTheDocument();
  });

  test("is just a / while typing in another field", () => {
    renderHeader("/");
    showDesktopBox();
    const otherField = document.createElement("input");
    document.body.appendChild(otherField);
    otherField.focus();

    fireEvent.keyDown(otherField, { key: "/" });

    expect(otherField).toHaveFocus();
    otherField.remove();
  });

  test("on phones, opens the search row and puts the cursor in it", () => {
    renderHeader("/");

    fireEvent.keyDown(document.body, { key: "/" });

    const boxes = screen.getAllByLabelText("Search contacts");
    expect(boxes).toHaveLength(2);
    expect(boxes[1]).toHaveFocus();
  });

  test("does nothing on pages without search", () => {
    renderHeader("/user-profile");

    fireEvent.keyDown(document.body, { key: "/" });

    expect(screen.queryByLabelText("Search contacts")).not.toBeInTheDocument();
  });

  test("Escape in the empty box leaves it", () => {
    renderHeader("/");
    showDesktopBox();
    fireEvent.keyDown(document.body, { key: "/" });

    fireEvent.keyDown(desktopSearch(), { key: "Escape" });

    expect(desktopSearch()).not.toHaveFocus();
  });
});
