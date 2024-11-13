import { useEffect, useState } from "react";
import Button from "../button/Button";
import { getContactsByUserId } from "../../service/ContactService";
import ContactCard from "../ContactCard/ContactCard";
import AddContactModal from "../modals/AddContactModal";
import { useSearchParams } from "react-router-dom";
import { useDebouncedValue } from "../../hooks/useDebounceHook";
import Pagination from "../pagination/Pagination";

export default function Dashboard() {
  const [contact, setContact] = useState([]);
  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false);
  const [paginationData, setPaginationData] = useState();
  const [searchParams, setSearchParams] = useSearchParams();
  const sortBy = searchParams.get("sortBy") || "";
  const search = searchParams.get("search") || "";
  const page = searchParams.get("page") || "";
  const size = searchParams.get("size") || "";
  const debouncedSearchTerm = useDebouncedValue(search, 2000);

  const [filter, setFilter] = useState(sortBy);

  const openAddContactModal = () => setIsAddContactModalOpen(true);
  const closeAddContactModal = () => setIsAddContactModalOpen(false);

  const userDetails = localStorage.getItem("userData");
  const currentUser = JSON.parse(userDetails);

  const fetchContacts = async (sortBy, search, page, size) => {
    const data =
      (await getContactsByUserId(currentUser.id, sortBy, search, page, size)) ||
      [];
    setContact(data.contact);
    delete data.contact;
    setPaginationData(data);
    console.log(data);
  };

  const handleFilterChange = async (event) => {
    const selectedFilter = event.target.value;
    setFilter(selectedFilter);
    setSearchParams((prevParams) => {
      const newParams = new URLSearchParams(prevParams);
      newParams.set("sortBy", selectedFilter);
      fetchContacts(
        newParams.get("sortBy"),
        newParams.get("search"),
        newParams.get("page"),
        newParams.get("size")
      );
      return newParams;
    });
  };

  useEffect(() => {
    fetchContacts(sortBy, search, page, size);
  }, [debouncedSearchTerm]);

  return (
    <div>
      <div className="flex justify-end mr-6 mt-1">
        <Button
          name="Add Contact"
          className="bg-blue-600 ml-2 my-3 px-5 py-2 flex justify-center items-center transition duration-500 
          ease-in-out hover:bg-blue-500 rounded-2xl font-semibold text-sm"
          onClick={openAddContactModal}
        />
        <select
          defaultValue=""
          className="bg-blue-400"
          value={filter}
          onChange={handleFilterChange}
        >
          <option value="" disabled hidden>
            Filter
          </option>
          <option value="A-Z">From A-Z</option>
          <option value="Z-A">From Z-A</option>
          <option value="oldDate">Date Old</option>
          <option value="newDate">Date New</option>
        </select>
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
                fetchContacts={() => fetchContacts(sortBy, search, page, size)}
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
          fetchContacts={() => fetchContacts(sortBy, search, page, size)}
        />
      )}
      <Pagination
        paginationObject={paginationData}
        fetchContacts={fetchContacts}
      />
    </div>
  );
}
