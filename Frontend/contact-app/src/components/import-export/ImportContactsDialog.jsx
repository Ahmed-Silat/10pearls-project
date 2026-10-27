import { useRef, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import ModalHeader from "../modals/ModalHeader";
import Spinner from "../ui/Spinner";
import {
  DownloadIcon,
  ErrorIcon,
  FileUploadIcon,
  SuccessIcon,
  WarningIcon,
} from "../icons/Icons";
import {
  downloadTemplate,
  IMPORT_EXTENSIONS,
  importContacts,
  MAX_IMPORT_BYTES,
  MAX_IMPORT_CONTACTS,
} from "../../service/TransferService";
import { getApiErrorMessage } from "../../service/Constants";

const plural = (count, word) => `${count.toLocaleString()} ${word}${count === 1 ? "" : "s"}`;

const fileSize = (bytes) =>
  bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

/** Why this file can't be sent, or null. The backend checks again; this just saves a pointless upload. */
const fileProblem = (file) => {
  const name = file.name.toLowerCase();
  if (!IMPORT_EXTENSIONS.some((extension) => name.endsWith(extension))) return "Choose a .csv or .vcf file.";
  if (file.size === 0) return "This file is empty.";
  if (file.size > MAX_IMPORT_BYTES) return "That file is too big. Choose a file under 5 MB.";
  return null;
};

/** One part of the preview (duplicates, problems, left-out details), with its list folded away underneath. */
function IssueSection({ Icon, iconClass, title, issues, children }) {
  return (
    <div className="grid gap-2 rounded-md border p-3">
      <p className="flex items-start gap-2 text-sm font-medium">
        <Icon className={cn("mt-0.5 h-4 w-4 flex-shrink-0", iconClass)} />
        {title}
      </p>
      {children}
      <details className="text-sm">
        <summary className="cursor-pointer select-none text-muted-foreground hover:text-foreground">
          Show which
        </summary>
        <ul className="mt-2 max-h-48 space-y-1.5 overflow-y-auto pr-1">
          {issues.map((issue, index) => (
            <li key={`${issue.location}-${index}`} className="[overflow-wrap:anywhere]">
              <span className="font-medium">{issue.location}</span>
              {issue.name && <span className="text-muted-foreground"> · {issue.name}</span>}
              <span className="block text-muted-foreground">{issue.message}</span>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}

/**
 * Imports contacts from a CSV or vCard file. Choosing a file checks it straight away (a dry run on the server)
 * and shows what will happen: how many contacts will be added, which look like duplicates (with the option to
 * import them anyway), which can't be imported and why. Nothing is saved until "Import" is pressed.
 */
export default function ImportContactsDialog({ onClose, onImported }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [allowDuplicates, setAllowDuplicates] = useState(false);
  const [checking, setChecking] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);
  // Only the latest file's check counts, if the user picks another while one is running.
  const checkRef = useRef(0);

  const close = () => {
    if (!importing) onClose();
  };

  const choose = async (picked) => {
    if (!picked) return;
    const checkId = ++checkRef.current;
    setPreview(null);
    setAllowDuplicates(false);
    const problem = fileProblem(picked);
    setError(problem ?? "");
    if (problem) {
      setFile(null);
      setChecking(false);
      return;
    }
    setFile(picked);
    setChecking(true);
    try {
      const result = await importContacts(picked, { dryRun: true });
      if (checkId === checkRef.current) setPreview(result);
    } catch (err) {
      if (checkId === checkRef.current) {
        setFile(null);
        setError(getApiErrorMessage(err, "Couldn't read this file. Please try again."));
      }
    } finally {
      if (checkId === checkRef.current) setChecking(false);
    }
  };

  const chooseAnother = () => {
    if (inputRef.current) inputRef.current.value = "";
    checkRef.current += 1;
    setFile(null);
    setPreview(null);
    setError("");
    setChecking(false);
  };

  const toImport = preview ? preview.imported + (allowDuplicates ? preview.duplicates.length : 0) : 0;

  const runImport = async () => {
    setImporting(true);
    setError("");
    try {
      const result = await importContacts(file, { allowDuplicates });
      toast.success(`Imported ${plural(result.imported, "contact")}`, {
        description: result.newTags.length > 0 ? `New tags: ${result.newTags.join(", ")}` : undefined,
      });
      onImported?.();
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err, "Couldn't import the contacts. Please try again."));
      setImporting(false);
    }
  };

  const onDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    if (!importing) choose(event.dataTransfer.files?.[0]);
  };

  const warnedContacts = preview ? new Set(preview.warnings.map((warning) => warning.location)).size : 0;

  return (
    <Dialog open onOpenChange={(open) => !open && close()}>
      <DialogContent className="sm:max-w-lg">
        <div className="grid min-w-0 gap-4">
          <ModalHeader
            title="Import contacts"
            description="Add contacts from a CSV file (Google Contacts, Outlook, Excel) or a vCard (.vcf) file from your phone."
          />

          {!file ? (
            <>
              <label
                htmlFor="import-file"
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                className={cn(
                  "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 text-center transition-colors hover:bg-accent/40 focus-within:ring-2 focus-within:ring-ring",
                  dragging && "border-primary bg-accent/40"
                )}
              >
                <FileUploadIcon className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm font-medium">Choose a file, or drag it here</span>
                <span className="text-xs text-muted-foreground">
                  .csv or .vcf · up to {MAX_IMPORT_CONTACTS.toLocaleString()} contacts and 5 MB
                </span>
                <input
                  ref={inputRef}
                  id="import-file"
                  type="file"
                  accept={[...IMPORT_EXTENSIONS, "text/csv", "text/vcard", "text/x-vcard"].join(",")}
                  className="sr-only"
                  onChange={(event) => choose(event.target.files?.[0])}
                />
              </label>
              <p className="text-sm text-muted-foreground">
                Each contact needs a name and a phone number. Columns such as First Name, Phone and Email are
                recognised automatically.{" "}
                <Button variant="link" className="h-auto p-0 align-baseline" onClick={downloadTemplate}>
                  <DownloadIcon />
                  Download a CSV template
                </Button>
              </p>
            </>
          ) : (
            <div className="flex items-center gap-3 rounded-md border px-3 py-2">
              <FileUploadIcon className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">{fileSize(file.size)}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={chooseAnother} disabled={importing}>
                Choose another file
              </Button>
            </div>
          )}

          {checking && (
            <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner className="h-4 w-4" />
              Checking the file...
            </p>
          )}

          {preview && (
            <div className="grid gap-3" aria-live="polite">
              <div className="flex items-start gap-2">
                {toImport > 0 ? (
                  <SuccessIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-500" />
                ) : (
                  <ErrorIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-destructive" />
                )}
                <div>
                  <p className="font-medium">
                    {toImport > 0
                      ? `${plural(toImport, "contact")} ready to import`
                      : "No contacts in this file can be imported"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Found {plural(preview.found, "contact")} in this file.
                    {preview.newTags.length > 0 &&
                      ` New ${preview.newTags.length === 1 ? "tag" : "tags"} will be created: ${preview.newTags.join(", ")}.`}
                  </p>
                </div>
              </div>

              {preview.duplicates.length > 0 && (
                <IssueSection
                  Icon={WarningIcon}
                  iconClass="text-amber-500"
                  title={
                    preview.duplicates.length === 1
                      ? "1 looks like a contact you already have"
                      : `${preview.duplicates.length.toLocaleString()} look like contacts you already have`
                  }
                  issues={preview.duplicates}
                >
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="import-duplicates"
                      checked={allowDuplicates}
                      onCheckedChange={(value) => setAllowDuplicates(value === true)}
                      disabled={importing}
                    />
                    <Label htmlFor="import-duplicates" className="cursor-pointer font-normal">
                      Import them anyway
                    </Label>
                  </div>
                </IssueSection>
              )}

              {preview.problems.length > 0 && (
                <IssueSection
                  Icon={ErrorIcon}
                  iconClass="text-destructive"
                  title={`${preview.problems.length.toLocaleString()} can't be imported`}
                  issues={preview.problems}
                />
              )}

              {preview.warnings.length > 0 && (
                <IssueSection
                  Icon={WarningIcon}
                  iconClass="text-muted-foreground"
                  title={`Some details will be left out for ${plural(warnedContacts, "contact")}`}
                  issues={preview.warnings}
                />
              )}
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" data-autofocus onClick={close} disabled={importing}>
              Cancel
            </Button>
            {preview && (
              <Button onClick={runImport} loading={importing} disabled={toImport === 0 || checking}>
                {importing ? "Importing..." : `Import ${plural(toImport, "contact")}`}
              </Button>
            )}
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
