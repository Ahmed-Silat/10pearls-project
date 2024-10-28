import React, { useState } from "react";
import { FaUserCircle } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { FaEdit } from "react-icons/fa";
import DeleteModal from "../modals/DeleteModal";
import EditModal from "../modals/EditModal";

const ContactCard = (props) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const openDeleteModal = () => setIsDeleteModalOpen(true);
  const closeDeleteModal = () => setIsDeleteModalOpen(false);

  const openEditModal = () => setIsEditModalOpen(true);
  const closeEditModal = () => setIsEditModalOpen(false);

  return (
    <div className="flex justify-center my-4">
      <div className="bg-cyan-950 w-full max-w-md rounded-3xl shadow-lg overflow-hidden">
        <div className="bg-cyan-700 p-6 flex justify-center">
          <FaUserCircle className="text-6xl text-white" />
        </div>
        <div className="p-6 text-white">
          <div className="flex">
            <div className="flex justify-center items-center w-full">
              <h1 className="text-center text-2xl font-bold text-white mb-4">
                {props.firstName} {props.lastName}
              </h1>
            </div>
            <div className="flex space-x-2 items-center">
              <button onClick={openDeleteModal}>
                <MdDelete />
              </button>
              <button onClick={openEditModal}>
                <FaEdit />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <p>
              <span className="font-bold">Phone:</span> {props.phone}
            </p>
            <p>
              <span className="font-bold">Email:</span> {props.email}
            </p>
            <p>
              <span className="font-bold">Address:</span> {props.address}
            </p>
          </div>
        </div>
      </div>
      {isDeleteModalOpen && (
        <DeleteModal
          onClose={closeDeleteModal}
          deleteContact={props.onDelete}
        />
      )}

      {isEditModalOpen && <EditModal onClose={closeEditModal} />}
    </div>
  );
};

export default ContactCard;
