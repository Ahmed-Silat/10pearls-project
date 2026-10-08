import { useState } from "react";
import { MailIcon, PencilIcon, PhoneIcon, PinIcon, TrashIcon } from "../icons/Icons";
import DeleteModal from "../modals/DeleteModal";
import EditModal from "../modals/EditModal";
import EmptyValue from "../ui/EmptyValue";
import { getContactById } from "../../service/ContactService";

const ContactCard = (props) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentContactData, setCurrentContactData] = useState();

  const openDeleteModal = () => setIsDeleteModalOpen(true);
  const closeDeleteModal = () => setIsDeleteModalOpen(false);

  const openEditModal = () => setIsEditModalOpen(true);
  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setCurrentContactData(undefined);
  };

  const getContactByContactId = async () => {
    const data = await getContactById(props.contactId);
    setCurrentContactData(data);
  };

  const initials = `${props.firstName?.[0] || ""}${props.lastName?.[0] || ""}`.toUpperCase();
  const fullName = [props.firstName, props.lastName].filter(Boolean).join(" ");

  return (
    <div className="group my-2 flex flex-col rounded-2xl bg-white shadow-card ring-1 ring-slate-200/70 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="flex items-center gap-4 border-b border-slate-100 bg-gradient-to-r from-sky-50 to-cyan-50 p-5">
        <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-cyan-600 text-base font-bold text-white shadow-md shadow-sky-600/30">
          {initials}
        </span>
        <h2 className="min-w-0 flex-1 truncate text-lg font-bold capitalize text-slate-900">
          {fullName}
        </h2>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              getContactByContactId();
              openEditModal();
            }}
            aria-label={`Edit ${fullName}`}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-sky-100 hover:text-sky-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={openDeleteModal}
            aria-label={`Delete ${fullName}`}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-100 hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
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

      {isDeleteModalOpen && (
        <DeleteModal
          onClose={closeDeleteModal}
          contactId={props.contactId}
          getContacts={props.fetchContacts}
        />
      )}

      {isEditModalOpen && currentContactData && (
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