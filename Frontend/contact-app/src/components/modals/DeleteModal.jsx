import { useState } from "react";
import { toast } from "sonner";
import Modal from "../ui/Modal";
import Button from "../button/Button";
import { deleteContact } from "../../service/ContactService";
import { getApiErrorMessage } from "../../service/Constants";
import { TrashIcon } from "../icons/Icons";

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
      toast.success("Contact deleted");
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
              <p className="text-xs text-slate-500">This action cannot be undone.</p>
            </div>
          </div>
          <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-600 ring-1 ring-slate-200">
            Are you sure you want to delete this contact? All of its data will be
            permanently removed.
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
