import { useState } from "react";
import Modal from "../ui/Modal";
import Button from "../button/Button";
import { TrashIcon } from "../icons/Icons";

/** Confirms deleting a contact from Recently deleted for good. `onConfirm` does the delete and may throw. */
export default function PermanentDeleteModal({ name, onConfirm, onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // The modal cannot be closed while the delete is in progress.
  const close = () => {
    if (!loading) onClose();
  };

  const confirm = async () => {
    setLoading(true);
    setError("");
    try {
      await onConfirm();
    } catch (message) {
      setError(String(message));
      setLoading(false);
    }
  };

  return (
    <Modal onClose={close} titleId="permanent-delete-title" panelClassName="sm:max-w-md">
      <fieldset disabled={loading} className="min-w-0">
        <div className="px-6 pt-6">
          <div className="flex items-center gap-4">
            <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
              <TrashIcon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h3 id="permanent-delete-title" className="text-lg font-semibold text-slate-900">
                Delete permanently?
              </h3>
              <p className="text-xs text-slate-500">This can&apos;t be undone.</p>
            </div>
          </div>
          <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-600 ring-1 ring-slate-200">
            <span className="font-semibold capitalize text-slate-800">{name}</span> will be deleted
            for good and can no longer be restored.
          </p>
          {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        </div>
        <div className="mt-4 flex flex-col-reverse gap-2 rounded-b-2xl border-t border-slate-100 bg-slate-50 px-6 py-4 sm:flex-row-reverse">
          <Button
            name={loading ? "Deleting..." : "Delete forever"}
            loading={loading}
            onClick={confirm}
            className="bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700"
          />
          <button
            type="button"
            data-autofocus
            onClick={close}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 ring-1 ring-slate-300 transition-colors hover:bg-white"
          >
            Cancel
          </button>
        </div>
      </fieldset>
    </Modal>
  );
}
