import { useRef, useState } from "react";
import { toast } from "sonner";
import { EyeIcon, MailIcon, PencilIcon, PhoneIcon, PinIcon, TrashIcon } from "../icons/Icons";
import DeleteModal from "../modals/DeleteModal";
import EditModal from "../modals/EditModal";
import ViewContactModal from "../modals/ViewContactModal";
import EmptyValue from "../ui/EmptyValue";
import { getContactById } from "../../service/ContactService";
import { getApiErrorMessage } from "../../service/Constants";

const ContactCard = (props) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentContactData, setCurrentContactData] = useState();

  const openDeleteModal = () => setIsDeleteModalOpen(true);
  const closeDeleteModal = () => setIsDeleteModalOpen(false);

  const openViewModal = () => setIsViewModalOpen(true);
  const closeViewModal = () => setIsViewModalOpen(false);

  // Each edit-open gets a number, so a late response for a modal that was already closed is ignored.
  const editRequestRef = useRef(0);

  /** Opens the edit modal straight away (it shows a loader) and fetches the latest contact. */
  const openEditModal = async () => {
    const requestId = ++editRequestRef.current;
    setCurrentContactData(undefined);
    setIsEditModalOpen(true);
    try {
      const data = await getContactById(props.contactId);
      if (requestId === editRequestRef.current) setCurrentContactData(data);
    } catch (error) {
      if (requestId === editRequestRef.current) {
        setIsEditModalOpen(false);
        toast.error(getApiErrorMessage(error, "Couldn't load this contact. Please try again."));
      }
    }
  };
  const closeEditModal = () => {
    editRequestRef.current += 1;
    setIsEditModalOpen(false);
    setCurrentContactData(undefined);
  };

  const initials = `${props.firstName?.[0] || ""}${props.lastName?.[0] || ""}`.toUpperCase();
  const fullName = [props.firstName, props.lastName].filter(Boolean).join(" ");

  return (
    <div data-contact-card className="group my-2 flex flex-col rounded-2xl bg-white shadow-card ring-1 ring-slate-200/70 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="flex items-center gap-3 border-b border-slate-100 bg-gradient-to-r from-sky-50 to-cyan-50 p-5">
        <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-cyan-600 text-base font-bold text-white shadow-md shadow-sky-600/30">
          {initials}
        </span>
        {/* The name gets the full width; clicking it opens the details, hovering shows it in full. */}
        <h2 className="min-w-0 flex-1">
          <button
            type="button"
            onClick={openViewModal}
            title={fullName}
            className="block w-full truncate rounded text-left text-lg font-bold capitalize text-slate-900 transition-colors hover:text-sky-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
          >
            {fullName}
          </button>
        </h2>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5 text-sm text-slate-600">
        <p className="flex items-center gap-3 min-w-0">
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
            <PhoneIcon className="h-4 w-4" />
          </span>
          <span className="truncate">{props.phone || <EmptyValue />}</span>
        </p>
        <p className="flex items-center gap-3 min-w-0">
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
            <MailIcon className="h-4 w-4" />
          </span>
          <span className="truncate">{props.email || <EmptyValue />}</span>
        </p>
        <p className="flex items-center gap-3 min-w-0">
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
            <PinIcon className="h-4 w-4" />
          </span>
          <span className="truncate">{props.address || <EmptyValue />}</span>
        </p>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-3 py-2">
        <button
          type="button"
          onClick={openViewModal}
          aria-label={`View ${fullName}`}
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-sky-700 transition-colors hover:bg-sky-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
        >
          <EyeIcon className="h-4 w-4" />
          View details
        </button>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={openEditModal}
            aria-label={`Edit ${fullName}`}
            title="Edit"
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-sky-100 hover:text-sky-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={openDeleteModal}
            aria-label={`Delete ${fullName}`}
            title="Delete"
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-100 hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isViewModalOpen && (
        <ViewContactModal
          contact={props}
          onClose={closeViewModal}
          onEdit={() => {
            closeViewModal();
            openEditModal();
          }}
        />
      )}

      {isDeleteModalOpen && (
        <DeleteModal
          onClose={closeDeleteModal}
          contactId={props.contactId}
          getContacts={props.fetchContacts}
        />
      )}

      {isEditModalOpen && (
        <EditModal
          onClose={closeEditModal}
          contactData={currentContactData}
          getContacts={props.fetchContacts}
        />
      )}
    </div>
  );
};

export default ContactCard;
