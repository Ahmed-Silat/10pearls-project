import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ImportExportIcon, SpreadsheetIcon, UploadIcon, VCardIcon } from "../icons/Icons";
import { exportContacts } from "../../service/TransferService";
import { getApiErrorMessage } from "../../service/Constants";

const EXPORTS = [
  { format: "csv", label: "As CSV", hint: "Excel, Google Sheets", Icon: SpreadsheetIcon },
  { format: "vcf", label: "As vCard (.vcf)", hint: "Phones, Gmail, Outlook", Icon: VCardIcon },
];

/** The dashboard's "Import / Export" button: import from a file (`onImport` opens the dialog), or export all. */
export default function ImportExportMenu({ onImport, className }) {
  const [exporting, setExporting] = useState(null);

  const runExport = async (format) => {
    setExporting(format);
    try {
      await exportContacts(format);
      toast.success(format === "csv" ? "Contacts exported as CSV" : "Contacts exported as vCard");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Couldn't export your contacts. Please try again."));
    } finally {
      setExporting(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" loading={Boolean(exporting)} className={className}>
          <ImportExportIcon />
          {exporting ? "Exporting..." : "Import / Export"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuItem onSelect={onImport}>
          <UploadIcon />
          Import contacts...
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">Export all contacts</DropdownMenuLabel>
        {EXPORTS.map(({ format, label, hint, Icon }) => (
          <DropdownMenuItem key={format} onSelect={() => runExport(format)} disabled={Boolean(exporting)}>
            <Icon />
            <span className="flex flex-col">
              <span>{label}</span>
              <span className="text-xs text-muted-foreground">{hint}</span>
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
