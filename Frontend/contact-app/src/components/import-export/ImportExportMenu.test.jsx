import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import ImportExportMenu from "./ImportExportMenu";
import { exportContacts } from "../../service/TransferService";

vi.mock("../../service/TransferService", async (importOriginal) => ({
  ...(await importOriginal()),
  exportContacts: vi.fn(),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const openMenu = () => userEvent.click(screen.getByRole("button", { name: "Import / Export" }));

test("'Import contacts...' opens the import dialog", async () => {
  const onImport = vi.fn();
  render(<ImportExportMenu onImport={onImport} />);

  await openMenu();
  await userEvent.click(screen.getByRole("menuitem", { name: /import contacts/i }));

  expect(onImport).toHaveBeenCalled();
});

test.each([
  ["csv", /as csv/i, "Contacts exported as CSV"],
  ["vcf", /as vcard/i, "Contacts exported as vCard"],
])("exports as %s", async (format, item, message) => {
  exportContacts.mockResolvedValue();
  render(<ImportExportMenu onImport={vi.fn()} />);

  await openMenu();
  await userEvent.click(screen.getByRole("menuitem", { name: item }));

  await waitFor(() => expect(toast.success).toHaveBeenCalledWith(message));
  expect(exportContacts).toHaveBeenCalledWith(format);
});

test("a failed export says so", async () => {
  exportContacts.mockRejectedValue({ response: { data: { message: "format must be csv or vcf" } } });
  render(<ImportExportMenu onImport={vi.fn()} />);

  await openMenu();
  await userEvent.click(screen.getByRole("menuitem", { name: /as csv/i }));

  await waitFor(() => expect(toast.error).toHaveBeenCalledWith("format must be csv or vcf"));
});
