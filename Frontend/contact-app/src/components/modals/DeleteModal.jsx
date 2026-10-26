import { useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import ModalHeader from "./ModalHeader";
import { deleteContact, getDuplicates, restoreContact } from "../../service/ContactService";
import { getApiErrorMessage } from "../../service/Constants";

/** How long the "Contact deleted" toast, and its Undo button, stays on screen. */
export const UNDO_TOAST_MS = 8000;

/**
 * Brings a just-deleted contact back. Runs from the toast, after this modal (and often the contact's card)
 * has gone, so it only uses values passed in, not component state.
 */
const undoDelete = async (contactId, reloadContacts, { allowDuplicate = false } = {}) => {
  // One toast that shows a spinner while restoring, then turns into the result.
  const toastId = toast.loading("Restoring contact...");
  try {
    await restoreContact(contactId, { allowDuplicate });
    // Keep the spinner until the contact is back on screen.
    await reloadContacts({ silent: true });
    toast.success("Contact restored", { id: toastId });
  } catch (error) {
    // A contact with the same phone or email was added since the delete: let the user decide.
    const restoreAnyway = getDuplicates(error) && {
      label: "Restore anyway",
      onClick: () => undoDelete(contactId, reloadContacts, { allowDuplicate: true }),
    };
    toast.error(getApiErrorMessage(error, "Couldn't restore the contact."), {
      id: toastId,
      ...(restoreAnyway && { action: restoreAnyway, duration: UNDO_TOAST_MS }),
    });
  }
};

export default function DeleteModal(props) {
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  // The modal cannot be closed while the delete is in progress.
  const close = () => {
    if (!loading) props.onClose();
  };

  const deleteCurrentContact = async () => {
    setLoading(true);
    setServerError("");
    try {
      await deleteContact(props.contactId);
      const { contactId, getContacts } = props;
      toast.success("Moved to Recently deleted", {
        description: "You can restore it from there for 30 days.",
        duration: UNDO_TOAST_MS,
        action: { label: "Undo", onClick: () => undoDelete(contactId, getContacts) },
      });
      props.getContacts();
      props.onClose();
    } catch (error) {
      setServerError(getApiErrorMessage(error, "Failed to delete contact."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open onOpenChange={(open) => !open && close()}>
      <AlertDialogContent className="sm:max-w-md">
        <fieldset disabled={loading} className="grid min-w-0 gap-4">
          <ModalHeader alert title="Delete Contact" description="You can restore it for 30 days." />
          <p className="text-sm text-muted-foreground">
            This contact will move to <span className="font-medium text-foreground">Recently deleted</span>,
            where you can restore it for 30 days. After that it&apos;s deleted permanently.
          </p>
          {serverError && (
            <Alert variant="destructive">
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="mt-0">Cancel</AlertDialogCancel>
            <Button variant="destructive" loading={loading} onClick={deleteCurrentContact}>
              {loading ? "Deleting..." : "Delete"}
            </Button>
          </AlertDialogFooter>
        </fieldset>
      </AlertDialogContent>
    </AlertDialog>
  );
}
