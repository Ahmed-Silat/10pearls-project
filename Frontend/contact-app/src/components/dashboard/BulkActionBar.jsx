import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { CloseIcon, PlusIcon, RemoveTagIcon, TagIcon, TrashIcon } from "../icons/Icons";
import Hint from "../ui/Hint";
import ModalHeader from "../modals/ModalHeader";
import { UNDO_TOAST_MS } from "../modals/DeleteModal";
import { useTags } from "../tags/TagsProvider";
import { tagDotClass } from "../tags/tagColors";
import TagDialog from "../tags/TagDialog";
import { bulkDeleteContacts, bulkTagContacts, restoreContact } from "../../service/ContactService";
import { getApiErrorMessage } from "../../service/Constants";

const plural = (count, word) => `${count} ${word}${count === 1 ? "" : "s"}`;

/** Brings bulk-deleted contacts back (the toast's Undo). Some may fail, e.g. if a duplicate was added since. */
const undoBulkDelete = async (ids, reload) => {
  const toastId = toast.loading(`Restoring ${plural(ids.length, "contact")}...`);
  const results = await Promise.allSettled(ids.map((id) => restoreContact(id)));
  const failed = results.filter((result) => result.status === "rejected").length;
  await reload({ silent: true });
  if (failed === 0) toast.success(`Restored ${plural(ids.length, "contact")}`, { id: toastId });
  else
    toast.error(`Restored ${ids.length - failed} of ${ids.length}. The rest are still in Recently deleted.`, {
      id: toastId,
    });
};

/**
 * The bar that appears while contacts are selected on the dashboard: add or remove a tag on all of them, or
 * delete them all (to Recently deleted, with Undo). `contacts` are the selected contacts' data.
 */
export default function BulkActionBar({ contacts, allSelected, onSelectAll, onClear, reload }) {
  const { tags } = useTags();
  const [busy, setBusy] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [creatingTag, setCreatingTag] = useState(false);
  const ids = contacts.map((contact) => contact.id);
  const count = ids.length;

  // Only tags at least one selected contact has can be removed.
  const removableTags = tags.filter((tag) =>
    contacts.some((contact) => contact.tags?.some((contactTag) => contactTag.id === tag.id))
  );

  const applyTag = async (tag, action) => {
    setBusy(true);
    try {
      const changed = await bulkTagContacts(ids, tag.id, action);
      if (action === "ADD") {
        toast.success(
          changed > 0
            ? `Added "${tag.name}" to ${plural(changed, "contact")}`
            : `Every selected contact already has "${tag.name}"`
        );
      } else {
        toast.success(`Removed "${tag.name}" from ${plural(changed, "contact")}`);
      }
      await reload({ silent: true });
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Couldn't update the tags. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  const deleteAll = async () => {
    setBusy(true);
    try {
      const moved = await bulkDeleteContacts(ids);
      setConfirmingDelete(false);
      onClear();
      toast.success(`Moved ${plural(moved, "contact")} to Recently deleted`, {
        description: "You can restore them from there for 30 days.",
        duration: UNDO_TOAST_MS,
        action: { label: "Undo", onClick: () => undoBulkDelete(ids, reload) },
      });
      await reload({ silent: true });
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Couldn't delete the contacts. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  return (
    // Sticks to the bottom of the screen while the list scrolls under it.
    <div className="pointer-events-none sticky bottom-4 z-30 mt-6 flex justify-center">
      <div
        role="toolbar"
        aria-label="Selected contacts"
        className="pointer-events-auto flex max-w-full flex-wrap items-center gap-1 rounded-lg border bg-popover p-1.5 text-popover-foreground shadow-lg"
      >
        <span className="px-2 text-sm font-medium" aria-live="polite">
          {count} selected
        </span>
        {!allSelected && (
          <Button variant="ghost" size="sm" onClick={onSelectAll} disabled={busy}>
            Select all
          </Button>
        )}
        <Separator orientation="vertical" className="mx-1 h-5" />

        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" disabled={busy}>
              <TagIcon />
              Add tag
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="max-h-72 w-52">
            <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
              Add a tag to {plural(count, "contact")}
            </DropdownMenuLabel>
            {tags.map((tag) => (
              <DropdownMenuItem key={tag.id} onSelect={() => applyTag(tag, "ADD")}>
                <span aria-hidden="true" className={cn("h-2 w-2 rounded-full", tagDotClass(tag.color))} />
                <span className="truncate">{tag.name}</span>
              </DropdownMenuItem>
            ))}
            {tags.length > 0 && <DropdownMenuSeparator />}
            <DropdownMenuItem onSelect={() => setCreatingTag(true)}>
              <PlusIcon />
              New tag...
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" disabled={busy || removableTags.length === 0}>
              <RemoveTagIcon />
              Remove tag
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="max-h-72 w-52">
            <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
              Remove a tag from the selection
            </DropdownMenuLabel>
            {removableTags.map((tag) => (
              <DropdownMenuItem key={tag.id} onSelect={() => applyTag(tag, "REMOVE")}>
                <span aria-hidden="true" className={cn("h-2 w-2 rounded-full", tagDotClass(tag.color))} />
                <span className="truncate">{tag.name}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setConfirmingDelete(true)}
          disabled={busy}
          className="text-destructive hover:text-destructive"
        >
          <TrashIcon />
          Delete
        </Button>
        <Separator orientation="vertical" className="mx-1 h-5" />
        <Hint label="Clear selection (Esc)">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClear} aria-label="Clear selection">
            <CloseIcon />
          </Button>
        </Hint>
      </div>

      {confirmingDelete && (
        <AlertDialog open onOpenChange={(open) => !open && !busy && setConfirmingDelete(false)}>
          <AlertDialogContent className="sm:max-w-md">
            <ModalHeader
              alert
              title={`Delete ${plural(count, "contact")}?`}
              description="They'll move to Recently deleted, where you can restore them for 30 days."
            />
            <AlertDialogFooter className="gap-2 sm:gap-0">
              <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
              <Button variant="destructive" loading={busy} onClick={deleteAll}>
                {busy ? "Deleting..." : `Delete ${plural(count, "contact")}`}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {creatingTag && (
        <TagDialog onClose={() => setCreatingTag(false)} onSaved={(tag) => applyTag(tag, "ADD")} />
      )}
    </div>
  );
}
