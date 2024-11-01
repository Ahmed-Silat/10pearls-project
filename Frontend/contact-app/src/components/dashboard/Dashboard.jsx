import { useEffect, useState } from "react";
import Button from "../button/Button";
import { getContactsByUserId } from "../../service/ContactService";
import { useNavigate } from "react-router-dom";
import ContactCard from "../ContactCard/ContactCard";
import AddContactModal from "../modals/AddContactModal";

export default function Dashboard() {
  const [contact, setContact] = useState([]);
  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false);
  const navigate = useNavigate();

  const openAddContactModal = () => setIsAddContactModalOpen(true);
  const closeAddContactModal = () => setIsAddContactModalOpen(false);

  const userDetails = localStorage.getItem("userData");
  const currentUser = JSON.parse(userDetails);

  const fetchContacts = async () => {
    const data = (await getContactsByUserId(currentUser.id)) || [];
    setContact(data);
    console.log(data);
  };

  const logout = () => {
    localStorage.removeItem("userData");
    navigate("/login");
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  return (
    <div>
      <div className="flex justify-end mr-6 mt-1">
        <Button
          name="Add Contact"
          className="bg-blue-600 ml-2 my-3 px-5 py-2 flex justify-center items-center transition duration-500 ease-in-out hover:bg-blue-500 rounded-2xl font-semibold text-sm"
          onClick={openAddContactModal}
        />
        <Button
          name="LOGOUT"
          className="bg-red-600 ml-2 my-3 px-5 py-2 flex justify-center items-center transition duration-500 ease-in-out hover:bg-red-500 rounded-2xl font-semibold text-sm"
          onClick={logout}
        />
      </div>

      <div>
        <h1 className="text-center font-bold text-3xl text-cyan-950">
          MY CONTACTS
        </h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 p-6">
          {contact.map((value) => {
            return (
              <ContactCard
                firstName={value.firstName}
                lastName={value.lastName}
                phone={value.phone}
                email={value.email}
                address={value.address}
                userId={value.user.id}
                fetchContacts={() => fetchContacts()}
                contactId={value.id}
              />
            );
          })}
        </div>
      </div>

      {isAddContactModalOpen && (
        <AddContactModal
          onClose={closeAddContactModal}
          userId={currentUser.id}
          fetchContacts={() => fetchContacts()}
        />
      )}
    </div>
  );
}
