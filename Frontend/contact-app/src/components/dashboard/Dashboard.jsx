import { useCallback, useEffect, useRef, useState } from "react";
import Button from "../button/Button";
import { getContactsByUserId } from "../../service/ContactService";
import ContactCard from "../ContactCard/ContactCard";
import AddContactModal from "../modals/AddContactModal";
import { useSearchParams } from "react-router-dom";
import { useDebouncedValue } from "../../hooks/useDebounceHook";
import { useCardsPerPage } from "../../hooks/useCardsPerPage";
import Pagination from "../pagination/Pagination";
import Spinner from "../ui/Spinner";
import { toast } from "sonner";
import { getApiErrorMessage } from "../../service/Constants";
import Dropdown from "../ui/Dropdown";
import { PlusIcon, SortAZIcon, SortZAIcon, UsersIcon } from "../icons/Icons";

const SORT_OPTIONS = [
  { value: "A-Z", label: "Name (A–Z)", icon: SortAZIcon },
  { value: "Z-A", label: "Name (Z–A)", icon: SortZAIcon },
];

/** Reads a whole number > 0 from a URL value, or returns the fallback (e.g. for "abc" or "0"). */
const parsePositiveInt = (value, fallback) => {
  const number = Number.parseInt(value, 10);
  return Number.isInteger(number) && number > 0 ? number : fallback;
};

export default function Dashboard() {
  const [contact, setContact] = useState([]);
  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false);
  const [paginationData, setPaginationData] = useState();
  const [isLoading, setIsLoading] = useState(true);

  // The URL is the single source of truth for sort, search and page.
  const [searchParams, setSearchParams] = useSearchParams();
  const sortBy = searchParams.get("sortBy") || "";
  // Only two orders exist; anything else in the URL means the default A–Z.
  const sortOrder = sortBy === "Z-A" ? "Z-A" : "A-Z";
  const search = searchParams.get("search") || "";
  const page = parsePositiveInt(searchParams.get("page"), 1);

  // Page size = as many cards as fit the screen (4 per row on large screens).
  const gridRef = useRef(null);
  const { pageSize: size, ready: isSizeReady, remeasure } = useCardsPerPage(gridRef);

  // Wait for typing to pause before searching, but show all contacts straight away when cleared.
  const debouncedSearchTerm = useDebouncedValue(search, 2000, { immediateWhenEmpty: true });
  // Show the loader while waiting for the user to stop typing, and while the request runs.
  const isSearchPending = search !== debouncedSearchTerm;
  const isBusy = isLoading || isSearchPending;
  const loadingLabel = search ? "Searching..." : "Loading contacts...";

  const openAddContactModal = () => setIsAddContactModalOpen(true);
  const closeAddContactModal = () => setIsAddContactModalOpen(false);

  const userDetails = localStorage.getItem("userData");
  const currentUser = JSON.parse(userDetails);
  const userId = currentUser?.id;

  // Each load gets a number; a response is ignored if a newer load has started since.
  const latestRequestRef = useRef(0);
  // setSearchParams changes identity on every URL change, so read it through a ref
  // instead of making it a dependency (that would reload on every keystroke).
  const setSearchParamsRef = useRef(setSearchParams);
  setSearchParamsRef.current = setSearchParams;

  /** Changes URL params; the effect below then loads the matching contacts. */
  const updateParams = (changes, { resetPage = false } = {}) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      Object.entries(changes).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "") next.delete(key);
        else next.set(key, String(value));
      });
      if (resetPage) next.delete("page");
      return next;
    });
  };

  const loadContacts = useCallback(async () => {
    if (!isSizeReady) return; // wait until we know how many cards fit
    const requestId = ++latestRequestRef.current;
    setIsLoading(true);
    try {
      const data =
        (await getContactsByUserId(userId, sortBy, debouncedSearchTerm, page, size)) || {};
      if (requestId !== latestRequestRef.current) return;

      const { contacts = [], ...pagination } = data;
      // This page no longer exists (e.g. its last contact was deleted): go to the last page that does.
      if (contacts.length === 0 && page > 1 && pagination.totalPages > 0) {
        setSearchParamsRef.current(
          (prev) => {
            const next = new URLSearchParams(prev);
            next.set("page", String(pagination.totalPages));
            return next;
          },
          { replace: true }
        );
        return;
      }
      setContact(contacts);
      setPaginationData(pagination);
    } catch (error) {
      if (requestId === latestRequestRef.current) {
        toast.error(getApiErrorMessage(error, "Couldn't load your contacts. Please try again."));
      }
    } finally {
      if (requestId === latestRequestRef.current) setIsLoading(false);
    }
  }, [isSizeReady, userId, sortBy, debouncedSearchTerm, page, size]);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  // Once real cards are on screen, measure them (the first size uses an estimated card height).
  useEffect(() => {
    if (contact.length > 0) remeasure();
  }, [contact, remeasure]);

  // When the number of cards per page changes (e.g. the window is resized), stay on the page
  // that contains the first contact you were looking at, instead of an unrelated one.
  const previousSizeRef = useRef(size);
  useEffect(() => {
    const previousSize = previousSizeRef.current;
    previousSizeRef.current = size;
    if (!previousSize || previousSize === size || page <= 1) return;
    const firstVisibleIndex = (page - 1) * previousSize;
    const newPage = Math.floor(firstVisibleIndex / size) + 1;
    setSearchParamsRef.current(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (newPage > 1) next.set("page", String(newPage));
        else next.delete("page");
        return next;
      },
      { replace: true }
    );
    // Only when the size changes; `page` is read at that moment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size]);

  const handleSortChange = (value) => {
    // A–Z is the default, so it doesn't need to be in the URL.
    updateParams({ sortBy: value === "Z-A" ? value : undefined }, { resetPage: true });
  };

  const handlePageChange = (newPage) => {
    updateParams({ page: newPage > 1 ? newPage : undefined });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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

        {/* Stacked full-width on phones, side by side from the "sm" breakpoint up. */}
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <Dropdown
            label="Sort contacts"
            prefix="Sort:"
            menuTitle="Sort by"
            value={sortOrder}
            options={SORT_OPTIONS}
            onChange={handleSortChange}
            className="w-full sm:w-56"
          />

          <Button
            name="Add Contact"
            onClick={openAddContactModal}
            image={<PlusIcon className="h-4 w-4" />}
            className="h-10 w-full flex-shrink-0 bg-sky-600 px-4 text-sm font-semibold text-white shadow-lg shadow-sky-600/25 hover:bg-sky-700 sm:w-auto"
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

      {/* Measured by useCardsPerPage to work out how many cards fit below this point. */}
      <div ref={gridRef} className="mt-8">
        {contact.length > 0 ? (
          <div
            aria-busy={isBusy}
            className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
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
                fetchContacts={loadContacts}
                contactId={value.id}
              />
            ))}
          </div>
        ) : isBusy ? (
          // Nothing loaded yet: keep the space empty under the loader rather than flashing "No contacts".
          <div className="py-20" />
        ) : search ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white/60 py-20">
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
          <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white/60 py-20">
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
      </div>

      {isAddContactModalOpen && (
        <AddContactModal
          onClose={closeAddContactModal}
          userId={currentUser.id}
          fetchContacts={loadContacts}
        />
      )}
      {/* Only needed when the contacts don't fit on one page. */}
      {paginationData && paginationData.totalPages > 1 && (
        <Pagination
          currentPage={paginationData.currentPage}
          totalPages={paginationData.totalPages}
          totalContacts={paginationData.totalContacts}
          pageSize={paginationData.contactsPerPage}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}