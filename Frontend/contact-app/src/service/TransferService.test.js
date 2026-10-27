import api, { getApiErrorMessage } from "./Constants";
import { CONTACTS_CHANGED_EVENT } from "./ContactService";
import { exportContacts, importContacts } from "./TransferService";

beforeEach(() => {
  URL.createObjectURL = vi.fn(() => "blob:fake");
  URL.revokeObjectURL = vi.fn();
});
afterEach(() => vi.restoreAllMocks());

test("importContacts uploads the file with the options, and only a real import refreshes the app", async () => {
  const post = vi.spyOn(api, "post").mockResolvedValue({ data: { imported: 2 } });
  const changed = vi.fn();
  window.addEventListener(CONTACTS_CHANGED_EVENT, changed);
  const file = new File(["First Name,Phone"], "contacts.csv");

  await importContacts(file, { dryRun: true });
  expect(changed).not.toHaveBeenCalled();
  const result = await importContacts(file, { allowDuplicates: true });

  expect(result).toEqual({ imported: 2 });
  const [url, form, config] = post.mock.calls[1];
  expect(url).toBe("/contact/import");
  expect(form.get("file")).toBe(file);
  expect(config.params).toEqual({ dryRun: false, allowDuplicates: true });
  expect(changed).toHaveBeenCalledTimes(1);
  window.removeEventListener(CONTACTS_CHANGED_EVENT, changed);
});

test("exportContacts downloads the file under today's date", async () => {
  vi.spyOn(api, "get").mockResolvedValue({ data: new Blob(["x"]) });
  const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

  await exportContacts("vcf");

  expect(api.get).toHaveBeenCalledWith("/contact/export", expect.objectContaining({ params: { format: "vcf" } }));
  expect(click).toHaveBeenCalled();
  expect(click.mock.contexts[0].download).toMatch(/^contacts-\d{4}-\d{2}-\d{2}\.vcf$/);
});

test("an export error's message is readable even though the response was a file", async () => {
  vi.spyOn(api, "get").mockRejectedValue({
    response: { status: 400, data: new Blob([JSON.stringify({ message: "format must be csv or vcf" })]) },
  });

  const error = await exportContacts("pdf").catch((err) => err);

  expect(getApiErrorMessage(error)).toBe("format must be csv or vcf");
});
