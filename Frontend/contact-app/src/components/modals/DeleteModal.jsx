import Modal from "../ui/Modal";
import { deleteContact } from "../../service/ContactService";
import { TrashIcon } from "../icons/Icons";

export default function DeleteModal(props) {
  const deleteCurrentContact = async () => {
    await deleteContact(props.contactId);
    props.getContacts();
  };

  return (
    <Modal onClose={props.onClose} titleId="delete-contact-title" panelClassName="sm:max-w-md">
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
      </div>
      <div className="mt-4 flex flex-col-reverse gap-2 rounded-b-2xl border-t border-slate-100 bg-slate-50 px-6 py-4 sm:flex-row-reverse">
        <button
          type="button"
          onClick={() => {
            props.onClose();
            deleteCurrentContact();
          }}
          className="inline-flex w-full justify-center rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700 sm:w-auto"
        >
          Delete
        </button>
        <button
          type="button"
          data-autofocus
          onClick={props.onClose}
          className="inline-flex w-full justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 transition-colors hover:bg-slate-50 sm:w-auto"
        >
          Cancel
        </button>
      </div>
    </Modal>
  );
}