import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import ContactCard from "./ContactCard";
import { getContactById, setEmergency, setFavorite } from "../../service/ContactService";

vi.mock("../../service/ContactService");

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
      fetchContacts={vi.fn()}
      {...overrides}
    />
  );

test("hovering the name shows it in full in a tooltip", async () => {
  renderCard();

  await userEvent.hover(screen.getByRole("button", { name: LONG_NAME }));

  expect(await screen.findByRole("tooltip")).toHaveTextContent(LONG_NAME);
});

test("the icon buttons explain themselves in tooltips", async () => {
  renderCard();

  await userEvent.hover(screen.getByRole("button", { name: `Edit ${LONG_NAME}` }));

  expect(await screen.findByRole("tooltip")).toHaveTextContent("Edit");
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

describe("favorites", () => {
  afterEach(() => setFavorite.mockReset());

  const star = () => screen.getByRole("button", { name: /favorites$/ });

  test("an unstarred contact shows an empty star", () => {
    renderCard();
    expect(star()).toHaveAttribute("aria-pressed", "false");
    expect(star()).toHaveAccessibleName(`Add ${LONG_NAME} to favorites`);
  });

  test("clicking the star saves it and quietly reloads the list", async () => {
    setFavorite.mockResolvedValue({});
    const fetchContacts = vi.fn();
    renderCard({ fetchContacts });

    fireEvent.click(star());

    await waitFor(() => expect(star()).toHaveAttribute("aria-pressed", "true"));
    expect(fetchContacts).toHaveBeenCalledWith({ silent: true });
    expect(setFavorite).toHaveBeenCalledWith("c1", true);
  });

  test("while saving, the star shows a spinner and can't be clicked again", async () => {
    let finishSaving;
    setFavorite.mockReturnValue(new Promise((resolve) => (finishSaving = resolve)));
    renderCard();

    fireEvent.click(star());

    expect(star()).toHaveAttribute("aria-busy", "true");
    expect(star()).toBeDisabled();
    expect(star().querySelector("svg.animate-spin")).not.toBeNull();
    // Not shown as starred until the server has confirmed it.
    expect(star()).toHaveAttribute("aria-pressed", "false");

    await act(async () => finishSaving({}));

    await waitFor(() => expect(star()).not.toHaveAttribute("aria-busy"));
    expect(star()).toHaveAttribute("aria-pressed", "true");
    expect(star().querySelector("svg.animate-spin")).toBeNull();
  });

  test("a starred contact can be unstarred", async () => {
    setFavorite.mockResolvedValue({});
    renderCard({ favorite: true });
    expect(star()).toHaveAccessibleName(`Remove ${LONG_NAME} from favorites`);

    fireEvent.click(star());

    await waitFor(() => expect(setFavorite).toHaveBeenCalledWith("c1", false));
  });

  test("if saving fails, the star stays as it was", async () => {
    setFavorite.mockRejectedValue(new Error("offline"));
    const fetchContacts = vi.fn();
    renderCard({ fetchContacts });

    fireEvent.click(star());

    await waitFor(() => expect(star()).not.toHaveAttribute("aria-busy"));
    expect(star()).toHaveAttribute("aria-pressed", "false");
    expect(fetchContacts).not.toHaveBeenCalled();
  });
});

test("while searching, the matching start of each field is highlighted", () => {
  const { container } = renderCard({ highlight: "0300" });

  const marks = [...container.querySelectorAll("mark")].map((mark) => mark.textContent);
  expect(marks).toEqual(["0300"]);
  // The name still reads in full for screen readers and tests.
  expect(screen.getByRole("button", { name: LONG_NAME })).toBeInTheDocument();
});

describe("emergency contacts", () => {
  afterEach(() => setEmergency.mockReset());

  const toggle = () => screen.getByRole("button", { name: /emergency contacts?$/ });
  const badge = () => screen.queryByRole("img", { name: "Emergency contact" });

  test("a normal contact shows an unpressed button and no badge", () => {
    renderCard();
    expect(toggle()).toHaveAttribute("aria-pressed", "false");
    expect(toggle()).toHaveAccessibleName(`Mark ${LONG_NAME} as an emergency contact`);
    expect(badge()).not.toBeInTheDocument();
  });

  test("clicking it saves, shows the badge and quietly reloads the list", async () => {
    setEmergency.mockResolvedValue({});
    const fetchContacts = vi.fn();
    renderCard({ fetchContacts });

    fireEvent.click(toggle());

    await waitFor(() => expect(toggle()).toHaveAttribute("aria-pressed", "true"));
    expect(setEmergency).toHaveBeenCalledWith("c1", true);
    expect(fetchContacts).toHaveBeenCalledWith({ silent: true });
    expect(badge()).toBeInTheDocument();
  });

  test("while saving, it shows a spinner and can't be clicked again", async () => {
    let finishSaving;
    setEmergency.mockReturnValue(new Promise((resolve) => (finishSaving = resolve)));
    renderCard();

    fireEvent.click(toggle());

    expect(toggle()).toBeDisabled();
    expect(toggle()).toHaveAttribute("aria-busy", "true");
    expect(toggle().querySelector("svg.animate-spin")).not.toBeNull();

    await act(async () => finishSaving({}));
    await waitFor(() => expect(toggle()).not.toHaveAttribute("aria-busy"));
  });

  test("an emergency contact shows the badge and can be unmarked", async () => {
    setEmergency.mockResolvedValue({});
    renderCard({ emergency: true });
    expect(badge()).toBeInTheDocument();
    expect(toggle()).toHaveAccessibleName(`Remove ${LONG_NAME} from emergency contacts`);

    fireEvent.click(toggle());

    await waitFor(() => expect(setEmergency).toHaveBeenCalledWith("c1", false));
    await waitFor(() => expect(badge()).not.toBeInTheDocument());
  });

  test("if saving fails, it stays as it was", async () => {
    setEmergency.mockRejectedValue(new Error("offline"));
    const fetchContacts = vi.fn();
    renderCard({ fetchContacts });

    fireEvent.click(toggle());

    await waitFor(() => expect(toggle()).not.toHaveAttribute("aria-busy"));
    expect(toggle()).toHaveAttribute("aria-pressed", "false");
    expect(fetchContacts).not.toHaveBeenCalled();
  });

  test("the details say it's an emergency contact", () => {
    renderCard({ emergency: true });
    fireEvent.click(screen.getByRole("button", { name: `View ${LONG_NAME}` }));
    expect(within(screen.getByRole("dialog")).getByText("Emergency contact")).toBeInTheDocument();
  });
});

describe("tags and selecting", () => {
  const renderInRouter = (overrides = {}) =>
    render(
      <MemoryRouter>
        <ContactCard
          contactId="c1"
          firstName="ali"
          lastName="khan"
          phone="0300-1234567"
          email=""
          address=""
          fetchContacts={vi.fn()}
          {...overrides}
        />
      </MemoryRouter>
    );

  test("shows the contact's tags as links to each tag's page", () => {
    renderInRouter({ tags: [{ id: 4, name: "Family", color: "green" }] });
    expect(screen.getByRole("link", { name: "Show contacts tagged Family" })).toHaveAttribute("href", "/tags/4");
  });

  test("has no checkbox until the dashboard is selecting", () => {
    renderInRouter();
    expect(screen.queryByRole("checkbox", { name: "Select ali khan" })).not.toBeInTheDocument();
  });

  test("while selecting, ticking the checkbox reports it", () => {
    const onSelectedChange = vi.fn();
    renderInRouter({ selectable: true, selected: false, onSelectedChange });

    fireEvent.click(screen.getByRole("checkbox", { name: "Select ali khan" }));

    expect(onSelectedChange).toHaveBeenCalledWith(true);
  });
});
