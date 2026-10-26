import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { Toaster } from "sonner";
import Dashboard from "./Dashboard";
import { TagsProvider } from "../tags/TagsProvider";
import {
  bulkDeleteContacts,
  bulkTagContacts,
  getContactsByUserId,
  restoreContact,
} from "../../service/ContactService";
import { getTags } from "../../service/TagService";

vi.mock("../../service/ContactService");
vi.mock("../../service/TagService", async (importOriginal) => ({
  ...(await importOriginal()),
  getTags: vi.fn(),
}));
vi.mock("../../hooks/useCardsPerPage", () => ({
  useCardsPerPage: () => ({ pageSize: 10, ready: true, remeasure: () => {} }),
}));

const FAMILY = { id: 1, name: "Family", color: "green" };
const WORK = { id: 2, name: "Work", color: "blue" };

const person = (id, firstName, tags = []) => ({
  id,
  firstName,
  lastName: "",
  email: "",
  phone: "0300",
  address: "",
  tags,
});
const pageOf = (contacts) => ({
  contacts,
  currentPage: 1,
  totalPages: 1,
  totalContacts: contacts.length,
  contactsPerPage: 10,
});

const renderDashboard = (props = {}) =>
  render(
    <MemoryRouter>
      <TagsProvider>
        <Toaster />
        <Dashboard {...props} />
      </TagsProvider>
    </MemoryRouter>
  );

const waitForList = () => waitFor(() => expect(screen.queryByRole("status")).not.toBeInTheDocument());
const checkbox = (name) => screen.getByRole("checkbox", { name: `Select ${name}` });
const bar = () => screen.getByRole("toolbar", { name: "Selected contacts" });

beforeEach(() => {
  localStorage.setItem("userData", JSON.stringify({ id: "user-1", token: "t" }));
  getTags.mockResolvedValue([FAMILY, WORK]);
  getContactsByUserId.mockResolvedValue(
    pageOf([person(1, "ali", [FAMILY]), person(2, "sara"), person(3, "zain", [WORK])])
  );
});

test("Select shows a checkbox on each card; ticking some shows the bar with the count", async () => {
  renderDashboard();
  await screen.findByText("ali");
  await waitForList();
  expect(screen.queryByRole("checkbox", { name: "Select ali" })).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Select" }));
  fireEvent.click(checkbox("ali"));
  fireEvent.click(checkbox("sara"));

  expect(within(bar()).getByText("2 selected")).toBeInTheDocument();
  expect(checkbox("ali")).toBeChecked();
});

test("Select all picks every contact on the page, and Esc clears the selection", async () => {
  renderDashboard();
  await screen.findByText("ali");
  await waitForList();

  fireEvent.click(screen.getByRole("button", { name: "Select" }));
  fireEvent.click(checkbox("ali"));
  fireEvent.click(within(bar()).getByRole("button", { name: "Select all" }));
  expect(within(bar()).getByText("3 selected")).toBeInTheDocument();

  fireEvent.keyDown(document, { key: "Escape" });

  expect(screen.queryByRole("toolbar", { name: "Selected contacts" })).not.toBeInTheDocument();
  expect(screen.queryByRole("checkbox", { name: "Select ali" })).not.toBeInTheDocument();
});

test("Delete asks first, moves the selected contacts to Recently deleted, and Undo brings them back", async () => {
  bulkDeleteContacts.mockResolvedValue(2);
  restoreContact.mockResolvedValue({});
  renderDashboard();
  await screen.findByText("ali");
  await waitForList();

  fireEvent.click(screen.getByRole("button", { name: "Select" }));
  fireEvent.click(checkbox("ali"));
  fireEvent.click(checkbox("sara"));
  fireEvent.click(within(bar()).getByRole("button", { name: "Delete" }));

  const dialog = screen.getByRole("alertdialog");
  expect(within(dialog).getByText("Delete 2 contacts?")).toBeInTheDocument();
  expect(bulkDeleteContacts).not.toHaveBeenCalled();
  fireEvent.click(within(dialog).getByRole("button", { name: "Delete 2 contacts" }));

  await waitFor(() => expect(bulkDeleteContacts).toHaveBeenCalledWith([1, 2]));
  expect(await screen.findByText("Moved 2 contacts to Recently deleted")).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Undo" }));

  await waitFor(() => expect(restoreContact).toHaveBeenCalledTimes(2));
  expect(restoreContact).toHaveBeenCalledWith(1);
  expect(restoreContact).toHaveBeenCalledWith(2);
  expect(await screen.findByText("Restored 2 contacts")).toBeInTheDocument();
});

test("Add tag puts the chosen tag on every selected contact", async () => {
  const user = userEvent.setup();
  bulkTagContacts.mockResolvedValue(2);
  renderDashboard();
  await screen.findByText("ali");
  await waitForList();

  fireEvent.click(screen.getByRole("button", { name: "Select" }));
  fireEvent.click(checkbox("ali"));
  fireEvent.click(checkbox("sara"));
  await user.click(within(bar()).getByRole("button", { name: "Add tag" }));
  fireEvent.click(await screen.findByRole("menuitem", { name: "Work" }));

  await waitFor(() => expect(bulkTagContacts).toHaveBeenCalledWith([1, 2], WORK.id, "ADD"));
  expect(await screen.findByText('Added "Work" to 2 contacts')).toBeInTheDocument();
});

test("Remove tag only offers tags the selected contacts have", async () => {
  const user = userEvent.setup();
  bulkTagContacts.mockResolvedValue(1);
  renderDashboard();
  await screen.findByText("ali");
  await waitForList();

  fireEvent.click(screen.getByRole("button", { name: "Select" }));
  fireEvent.click(checkbox("ali"));
  fireEvent.click(checkbox("sara"));
  await user.click(within(bar()).getByRole("button", { name: "Remove tag" }));

  expect(await screen.findByRole("menuitem", { name: "Family" })).toBeInTheDocument();
  expect(screen.queryByRole("menuitem", { name: "Work" })).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole("menuitem", { name: "Family" }));
  await waitFor(() => expect(bulkTagContacts).toHaveBeenCalledWith([1, 2], FAMILY.id, "REMOVE"));
});

test("Remove tag is unavailable when none of the selected contacts has a tag", async () => {
  renderDashboard();
  await screen.findByText("ali");
  await waitForList();

  fireEvent.click(screen.getByRole("button", { name: "Select" }));
  fireEvent.click(checkbox("sara"));

  expect(within(bar()).getByRole("button", { name: "Remove tag" })).toBeDisabled();
});

describe("a tag's page", () => {
  test("lists only contacts with that tag, under the tag's name", async () => {
    getContactsByUserId.mockResolvedValue(pageOf([person(3, "zain", [WORK])]));
    renderDashboard({ view: "tag", tag: WORK });

    await screen.findByText("zain");
    await waitForList();
    expect(getContactsByUserId).toHaveBeenCalledWith("user-1", "", "", 1, 10, "all", WORK.id);
    expect(screen.getByRole("heading", { level: 1, name: "Work" })).toBeInTheDocument();
  });

  test("with no contacts yet, explains how to tag some", async () => {
    getContactsByUserId.mockResolvedValue(pageOf([]));
    renderDashboard({ view: "tag", tag: WORK });

    expect(await screen.findByText("No contacts with this tag yet")).toBeInTheDocument();
  });
});
