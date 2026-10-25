import "@testing-library/jest-dom";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Toaster, toast } from "sonner";
import DeleteModal from "./DeleteModal";
import { deleteContact, restoreContact } from "../../service/ContactService";

// axios ships as an ES module that Create React App's Jest setup can't load; the API calls are mocked below.
jest.mock("axios", () => ({
  create: () => ({
    interceptors: { request: { use: () => {} }, response: { use: () => {} } },
  }),
}));

jest.mock("../../service/ContactService", () => ({
  ...jest.requireActual("../../service/ContactService"),
  deleteContact: jest.fn(),
  restoreContact: jest.fn(),
}));

beforeAll(() => {
  // jsdom doesn't implement matchMedia, which Sonner uses for its theme.
  window.matchMedia =
    window.matchMedia ||
    (() => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} }));
});

const deleteAndGetUndo = async (getContacts) => {
  deleteContact.mockResolvedValue();
  render(
    <>
      <Toaster />
      <DeleteModal contactId={10} onClose={jest.fn()} getContacts={getContacts} />
    </>
  );
  fireEvent.click(screen.getByRole("button", { name: "Delete" }));
  return screen.findByRole("button", { name: "Undo" });
};

test("after deleting, the toast offers Undo, which restores the contact", async () => {
  restoreContact.mockResolvedValue({ id: 10 });
  const getContacts = jest.fn();

  const undo = await deleteAndGetUndo(getContacts);
  expect(deleteContact).toHaveBeenCalledWith(10);

  fireEvent.click(undo);

  await waitFor(() => expect(restoreContact).toHaveBeenCalledWith(10, { allowDuplicate: false }));
  await waitFor(() => expect(getContacts).toHaveBeenCalledWith({ silent: true }));
  expect(await screen.findByText("Contact restored")).toBeInTheDocument();
});

test("while undoing, the toast shows a loader until the contact is back", async () => {
  // Sonner keeps toasts from earlier tests in a shared store, so on-screen Undo buttons may belong to
  // another test. This test takes the Undo action from its own toast call and watches the toast calls.
  const success = jest.spyOn(toast, "success");
  const loading = jest.spyOn(toast, "loading");
  let finishRestoring;
  restoreContact.mockReturnValue(new Promise((resolve) => (finishRestoring = resolve)));
  deleteContact.mockResolvedValue();
  const getContacts = jest.fn();
  render(<DeleteModal contactId={10} onClose={jest.fn()} getContacts={getContacts} />);

  fireEvent.click(screen.getByRole("button", { name: "Delete" }));
  await waitFor(() => expect(success).toHaveBeenCalledWith("Moved to Recently deleted", expect.anything()));
  const undo = success.mock.calls.find(([message]) => message === "Moved to Recently deleted")[1].action;

  act(() => {
    undo.onClick();
  });

  // A loading toast straight away; nothing restored or reloaded yet.
  expect(loading).toHaveBeenCalledWith("Restoring contact...");
  const loadingToastId = loading.mock.results[0].value;
  expect(success).not.toHaveBeenCalledWith("Contact restored", expect.anything());
  expect(getContacts).not.toHaveBeenCalledWith({ silent: true });

  await act(async () => finishRestoring({ id: 10 }));

  // The list is reloaded, then the same toast turns into the result.
  await waitFor(() =>
    expect(success).toHaveBeenCalledWith("Contact restored", { id: loadingToastId })
  );
  expect(getContacts).toHaveBeenCalledWith({ silent: true });
});

test("if restoring fails, the user is told why", async () => {
  restoreContact.mockRejectedValue({
    response: { data: { message: "This contact can no longer be restored" } },
  });

  fireEvent.click(await deleteAndGetUndo(jest.fn()));

  expect(await screen.findByText("This contact can no longer be restored")).toBeInTheDocument();
});

test("if undoing would duplicate a newer contact, the error toast offers Restore anyway", async () => {
  // Watches the toast calls rather than the screen: Sonner keeps toasts from earlier tests around.
  const success = jest.spyOn(toast, "success");
  const error = jest.spyOn(toast, "error");
  deleteContact.mockResolvedValue();
  restoreContact
    .mockRejectedValueOnce({
      response: {
        status: 409,
        data: {
          message: "You already have a contact with this phone number",
          duplicates: [{ id: 9, firstName: "zed", lastName: "", field: "phone" }],
        },
      },
    })
    .mockResolvedValueOnce({ id: 10 });
  const getContacts = jest.fn();
  render(<DeleteModal contactId={10} onClose={jest.fn()} getContacts={getContacts} />);

  fireEvent.click(screen.getByRole("button", { name: "Delete" }));
  await waitFor(() => expect(success).toHaveBeenCalledWith("Moved to Recently deleted", expect.anything()));
  const undo = success.mock.calls.find(([message]) => message === "Moved to Recently deleted")[1].action;
  await act(async () => undo.onClick());

  await waitFor(() =>
    expect(error).toHaveBeenCalledWith(
      "You already have a contact with this phone number",
      expect.objectContaining({ action: expect.objectContaining({ label: "Restore anyway" }) })
    )
  );
  const restoreAnyway = error.mock.calls.at(-1)[1].action;
  await act(async () => restoreAnyway.onClick());

  expect(restoreContact).toHaveBeenLastCalledWith(10, { allowDuplicate: true });
  await waitFor(() => expect(getContacts).toHaveBeenCalledWith({ silent: true }));
});
