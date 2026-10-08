import { useEffect, useState } from "react";
import Button from "../button/Button";
import { getContactsByUserId } from "../../service/ContactService";
import ContactCard from "../ContactCard/ContactCard";
import AddContactModal from "../modals/AddContactModal";
import { useSearchParams } from "react-router-dom";
import { useDebouncedValue } from "../../hooks/useDebounceHook";
import Pagination from "../pagination/Pagination";
import Spinner from "../ui/Spinner";
import { toast } from "sonner";
import { getApiErrorMessage } from "../../service/Constants";
import { ChevronDownIcon, PlusIcon, UsersIcon } from "../icons/Icons";

export default function Dashboard() {
  const [contact, setContact] = useState([]);
  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false);
  const [paginationData, setPaginationData] = useState();
  const [isLoading, setIsLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const sortBy = searchParams.get("sortBy") || "";
  const search = searchParams.get("search") || "";
  const page = searchParams.get("page") || "";
  const size = searchParams.get("size") || "";
  const debouncedSearchTerm = useDebouncedValue(search, 2000);
  // Show the loader while waiting for the user to stop typing, and while the request runs.
  const isSearchPending = search !== debouncedSearchTerm;
  const isBusy = isLoading || isSearchPending;
  const loadingLabel = search ? "Searching..." : "Loading contacts...";

  const [filter, setFilter] = useState(sortBy);

  const openAddContactModal = () => setIsAddContactModalOpen(true);
  const closeAddContactModal = () => setIsAddContactModalOpen(false);

  const userDetails = localStorage.getItem("userData");
  const currentUser = JSON.parse(userDetails);

  const fetchContacts = async (sortBy, search, page, size) => {
    setIsLoading(true);
    try {
      const data =
        (await getContactsByUserId(currentUser.id, sortBy, search, page, size)) ||
        {};
      const { contacts = [], ...pagination } = data;
      setContact(contacts);
      setPaginationData(pagination);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Couldn't load your contacts. Please try again."));
    } finally {
      setIsLoading(false);
    }
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
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            My Contacts
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage, search and organize everyone you know.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={filter}
              onChange={handleFilterChange}
              className="w-full appearance-none rounded-xl border border-slate-300 bg-white py-2.5 pl-4 pr-10 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            >
              <option value="" disabled hidden>
                Sort by
              </option>
              <option value="A-Z">Name A-Z</option>
              <option value="Z-A">Name Z-A</option>
              <option value="oldDate">Oldest first</option>
              <option value="newDate">Newest first</option>
            </select>
            <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>

          <Button
            name="Add Contact"
            onClick={openAddContactModal}
            image={<PlusIcon className="h-4 w-4" />}
            className="bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-600/25 hover:bg-sky-700"
          />
        </div>
      </div>

      {/* Full-page loader: covers everything below the header, so the search box stays usable. */}
      {isBusy && (
        <div
          role="status"
          className="fixed inset-x-0 bottom-0 top-16 z-20 flex items-center justify-center bg-white/60 backdrop-blur-[2px]"
        >
          <span className="inline-flex items-center gap-3 rounded-2xl bg-white px-6 py-4 text-sm font-semibold text-sky-700 shadow-xl ring-1 ring-slate-200">
            <Spinner className="h-5 w-5" />
            {loadingLabel}
          </span>
        </div>
      )}

      {contact.length > 0 ? (
        <div
          aria-busy={isBusy}
          className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {contact.map((value) => (
            <ContactCard
              key={value.id}
              firstName={value.firstName}
              lastName={value.lastName}
              phone={value.phone}
              email={value.email}
              address={value.address}
              userId={currentUser.id}
              fetchContacts={() => fetchContacts(sortBy, search, page, size)}
              contactId={value.id}
            />
          ))}
        </div>
      ) : isBusy ? (
        // Nothing loaded yet: keep the space empty under the loader rather than flashing "No contacts".
        <div className="mt-8 py-20" />
      ) : search ? (
        <div className="mt-8 flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white/60 py-20">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
            <UsersIcon className="h-8 w-8 text-slate-400" />
          </span>
          <h2 className="mt-4 text-lg font-semibold text-slate-700">
            No contacts found
          </h2>
          <p className="mt-1 max-w-sm text-center text-sm text-slate-500">
            No contacts match &ldquo;{search}&rdquo;. Try a different name, email or phone number.
          </p>
        </div>
      ) : (
        <div className="mt-8 flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white/60 py-20">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
            <UsersIcon className="h-8 w-8 text-slate-400" />
          </span>
          <h2 className="mt-4 text-lg font-semibold text-slate-700">
            No contacts yet
          </h2>
          <p className="mt-1 max-w-sm text-center text-sm text-slate-500">
            Get started by adding your first contact to your address book.
          </p>
          <Button
            name="Add your first contact"
            onClick={openAddContactModal}
            image={<PlusIcon className="h-4 w-4" />}
            className="mt-6 bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-600/25 hover:bg-sky-700"
          />
        </div>
      )}

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