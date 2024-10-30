import { useEffect, useState } from "react";
import LabelWithInput from "../label-and-inputs/LabelWithInput";
import Button from "../button/Button";
import {
  deleteContact,
  deleteData,
  getContactsByUserId,
  postData,
  updateContact,
} from "../../service/ContactService";
import { useNavigate } from "react-router-dom";
import CheckboxWithInput from "../checkbox-and-input/CheckboxWithInput";
import ContactCard from "../ContactCard/ContactCard";

export default function Dashboard() {
  const [contact, setContact] = useState([]);
  // const [inputValue, setInputValue] = useState("");
  // const [toggleButton, setToggleButton] = useState(false);
  // const [id, setId] = useState();
  // const [markCompleted, setMarkCompleted] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (event) => {
    // setInputValue(event.target.value);
  };

  const userDetails = localStorage.getItem("userData");
  const currentUser = JSON.parse(userDetails);

  const fetchData = async () => {
    const data = (await getContactsByUserId(currentUser.id)) || [];
    setContact(data);
    console.log(data);
  };

  const addTodo = async () => {
    // await postData(inputValue, currentUser.id);
    // await fetchData();
    // setInputValue("");
  };

  const editTodo = async (id, text) => {
    // setInputValue(text);
    // setId(id);
    // setToggleButton(true);
  };

  const updateTodo = async () => {
    // await updateContact(id, inputValue, currentUser.id);
    // await fetchData();
    // setToggleButton(false);
    // setInputValue("");
  };

  const deleteCurrentContact = async (contactId) => {
    console.log("contact with id " + contactId + " is deleted");
    await deleteContact(contactId);
    await fetchData();
  };

  const logout = () => {
    localStorage.removeItem("userData");
    navigate("/login");
  };

  const toggleMarkAsCompleted = (value) => {
    // setMarkCompleted(value);
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div>
      <div className="flex justify-end mr-6 mt-1">
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
                onDelete={() => deleteCurrentContact(value.id)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
