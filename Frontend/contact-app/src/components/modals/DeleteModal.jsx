import { useState } from "react";
import { toast } from "sonner";
import Modal from "../ui/Modal";
import Button from "../button/Button";
import { deleteContact, getDuplicates, restoreContact } from "../../service/ContactService";
import { getApiErrorMessage } from "../../service/Constants";
import { TrashIcon } from "../icons/Icons";

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
    <Modal onClose={close} titleId="delete-contact-title" panelClassName="sm:max-w-md">
      <fieldset disabled={loading} className="min-w-0">
        <div className="px-6 pt-6">
          <div className="flex items-center gap-4">
            <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
              <TrashIcon className="h-5 w-5" />
            </span>
            <div>
              <h3 id="delete-contact-title" className="text-lg font-semibold text-slate-900">
                Delete Contact
              </h3>
              <p className="text-xs text-slate-500">You can restore it for 30 days.</p>
            </div>
          </div>
          <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-600 ring-1 ring-slate-200">
            This contact will move to <span className="font-semibold">Recently deleted</span>, where
            you can restore it for 30 days. After that it&apos;s deleted permanently.
          </p>
          {serverError && (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{serverError}</p>
          )}
        </div>
        <div className="mt-4 flex flex-col-reverse gap-2 rounded-b-2xl border-t border-slate-100 bg-slate-50 px-6 py-4 sm:flex-row-reverse">
          <Button
            name={loading ? "Deleting..." : "Delete"}
            loading={loading}
            onClick={deleteCurrentContact}
            className="w-full bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700 sm:w-auto"
          />
          <button
            type="button"
            data-autofocus
            onClick={close}
            className="inline-flex w-full justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            Cancel
          </button>
        </div>
      </fieldset>
    </Modal>
  );
}
