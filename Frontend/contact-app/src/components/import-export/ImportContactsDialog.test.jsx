import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import ImportContactsDialog from "./ImportContactsDialog";
import { importContacts } from "../../service/TransferService";

vi.mock("../../service/TransferService", async (importOriginal) => ({
  ...(await importOriginal()),
  importContacts: vi.fn(),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const PREVIEW = {
  dryRun: true,
  found: 6,
  imported: 3,
  newTags: ["Family"],
  duplicates: [{ location: "Row 4", name: "Ali Khan", message: "Same phone number as Ali Khan" }],
  problems: [
    { location: "Row 5", name: "Bob", message: "Has no phone number" },
    { location: "Row 6", name: "", message: "Has no name" },
  ],
  warnings: [{ location: "Row 2", name: "Sara", message: "Left out the birthday \"--05-14\"" }],
};

const csv = (name = "contacts.csv") => new File(["First Name,Phone\nAli,0300 1234567\n"], name, { type: "text/csv" });

const renderDialog = (props = {}) => {
  const onClose = vi.fn();
  const onImported = vi.fn();
  render(<ImportContactsDialog onClose={onClose} onImported={onImported} {...props} />);
  return { onClose, onImported };
};

const fileInput = () => screen.getByLabelText(/choose a file/i);

test("choosing a file checks it and shows what will happen, without saving", async () => {
  importContacts.mockResolvedValue(PREVIEW);
  renderDialog();

  await userEvent.upload(fileInput(), csv());

  expect(await screen.findByText("3 contacts ready to import")).toBeInTheDocument();
  expect(importContacts).toHaveBeenCalledWith(expect.any(File), { dryRun: true });
  expect(screen.getByText(/Found 6 contacts in this file\. New tag will be created: Family\./)).toBeInTheDocument();
  expect(screen.getByText("1 looks like a contact you already have")).toBeInTheDocument();
  expect(screen.getByText("2 can't be imported")).toBeInTheDocument();
  expect(screen.getByText("Has no phone number")).toBeInTheDocument();
  expect(screen.getByText("Some details will be left out for 1 contact")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Import 3 contacts" })).toBeEnabled();
});

test("Import saves the contacts, then reloads the list and closes", async () => {
  importContacts
    .mockResolvedValueOnce(PREVIEW)
    .mockResolvedValueOnce({ ...PREVIEW, dryRun: false });
  const { onClose, onImported } = renderDialog();
  await userEvent.upload(fileInput(), csv());

  fireEvent.click(await screen.findByRole("button", { name: "Import 3 contacts" }));

  await waitFor(() => expect(onClose).toHaveBeenCalled());
  expect(importContacts).toHaveBeenLastCalledWith(expect.any(File), { allowDuplicates: false });
  expect(onImported).toHaveBeenCalled();
  expect(toast.success).toHaveBeenCalledWith("Imported 3 contacts", { description: "New tags: Family" });
});

test("ticking 'Import them anyway' counts the duplicates in, and sends that choice", async () => {
  importContacts.mockResolvedValueOnce(PREVIEW).mockResolvedValueOnce({ ...PREVIEW, imported: 4 });
  renderDialog();
  await userEvent.upload(fileInput(), csv());

  fireEvent.click(await screen.findByRole("checkbox", { name: "Import them anyway" }));
  fireEvent.click(screen.getByRole("button", { name: "Import 4 contacts" }));

  await waitFor(() =>
    expect(importContacts).toHaveBeenLastCalledWith(expect.any(File), { allowDuplicates: true })
  );
});

test("a file that isn't CSV or vCard is refused before uploading", () => {
  renderDialog();

  fireEvent.change(fileInput(), { target: { files: [new File(["x"], "photo.png", { type: "image/png" })] } });

  expect(screen.getByText("Choose a .csv or .vcf file.")).toBeInTheDocument();
  expect(importContacts).not.toHaveBeenCalled();
});

test("the server's reason is shown when the file can't be read, and another file can be chosen", async () => {
  importContacts.mockRejectedValue({
    response: { status: 400, data: { message: "This doesn't look like a contacts file." } },
  });
  renderDialog();

  await userEvent.upload(fileInput(), csv("prices.csv"));

  expect(await screen.findByText("This doesn't look like a contacts file.")).toBeInTheDocument();
  expect(fileInput()).toBeInTheDocument();
});

test("when nothing can be imported, the Import button is disabled", async () => {
  importContacts.mockResolvedValue({ ...PREVIEW, imported: 0, duplicates: [], newTags: [] });
  renderDialog();

  await userEvent.upload(fileInput(), csv());

  expect(await screen.findByText("No contacts in this file can be imported")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Import 0 contacts" })).toBeDisabled();
});

test("'Choose another file' goes back to choosing", async () => {
  importContacts.mockResolvedValue(PREVIEW);
  renderDialog();
  await userEvent.upload(fileInput(), csv());
  await screen.findByText("3 contacts ready to import");

  fireEvent.click(screen.getByRole("button", { name: "Choose another file" }));

  expect(fileInput()).toBeInTheDocument();
  expect(screen.queryByText("3 contacts ready to import")).not.toBeInTheDocument();
});
