import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getContactsByUserId } from "../../service/ContactService";
import ContactCard from "../ContactCard/ContactCard";
import AddContactModal from "../modals/AddContactModal";
import { Link, useSearchParams } from "react-router-dom";
import { useDebouncedValue } from "../../hooks/useDebounceHook";
import { useCardsPerPage } from "../../hooks/useCardsPerPage";
import Pagination from "../pagination/Pagination";
import Spinner from "../ui/Spinner";
import { toast } from "sonner";
import { getApiErrorMessage } from "../../service/Constants";
import { EmergencyIcon, PlusIcon, SortAZIcon, SortZAIcon, StarIcon, UsersIcon } from "../icons/Icons";

/** How long typing must pause before searching: short enough to feel instant, long enough to skip most keystrokes. */
export const SEARCH_DEBOUNCE_MS = 500;

const SORT_OPTIONS = [
  { value: "A-Z", label: "Name (A–Z)", icon: SortAZIcon },
  { value: "Z-A", label: "Name (Z–A)", icon: SortZAIcon },
];

/**
 * The text and icons for each section. `empty` is shown when the section has no contacts yet; the All contacts
 * page has its own empty state with an Add button instead.
 */
const VIEWS = {
  all: {
    title: "My Contacts",
    subtitle: "Manage, search and organize everyone you know.",
    noun: "contacts",
    Icon: UsersIcon,
  },
  favorites: {
    title: "Favorites",
    subtitle: "The contacts you've starred, all in one place.",
    noun: "favorites",
    Icon: StarIcon,
    empty: {
      title: "No favorites yet",
      text: "Tap the star on a contact to add it here, so the people you need most are one click away.",
    },
  },
  emergency: {
    title: "Emergency",
    subtitle: "The people to call first when something goes wrong.",
    noun: "emergency contacts",
    Icon: EmergencyIcon,
    empty: {
      title: "No emergency contacts yet",
      text: "Tap the siren button on a contact, or tick \"Emergency contact\" when adding one, so the people to call in a crisis are one click away.",
    },
  },
};

/** Reads a whole number > 0 from a URL value, or returns the fallback (e.g. for "abc" or "0"). */
const parsePositiveInt = (value, fallback) => {
  const number = Number.parseInt(value, 10);
  return Number.isInteger(number) && number > 0 ? number : fallback;
};

/**
 * A list of contacts. `view` is the sidebar section: "all" (every contact), "favorites" (starred only) or
 * "emergency" (emergency contacts only). They share the cards, search, sorting and paging.
 */
export default function Dashboard({ view = "all" }) {
  const section = VIEWS[view] ?? VIEWS.all;
  const EmptyIcon = section.Icon;
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
  const debouncedSearchTerm = useDebouncedValue(search, SEARCH_DEBOUNCE_MS, { immediateWhenEmpty: true });
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

  /** `silent` refreshes the list in place, without the full-page loader (e.g. after starring a contact). */
  const loadContacts = useCallback(async ({ silent = false } = {}) => {
    if (!isSizeReady) return; // wait until we know how many cards fit
    const requestId = ++latestRequestRef.current;
    if (!silent) setIsLoading(true);
    try {
      const data =
        (await getContactsByUserId(userId, sortBy, debouncedSearchTerm, page, size, view)) || {};
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
  }, [isSizeReady, userId, sortBy, debouncedSearchTerm, page, size, view]);

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

  /** The dashed "nothing here" box shared by the empty and no-results states. */
  const emptyState = (Icon, title, text, action) => (
    <div className="flex min-h-[360px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </span>
      <h2 className="mt-4 text-lg font-semibold">{title}</h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{text}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-7xl p-4 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{section.title}</h1>
          <p className="text-sm text-muted-foreground">{section.subtitle}</p>
        </div>

        {/* Stacked full-width on phones, side by side from the "sm" breakpoint up. */}
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <Select value={sortOrder} onValueChange={handleSortChange}>
            <SelectTrigger aria-label="Sort contacts" className="w-full sm:w-[200px]">
              {/* Kept inline so "Sort: Name (A–Z)" stays on one line (the trigger clamps it to one line). */}
              <span className="min-w-0 flex-1 text-left">
                <span className="mr-1 text-muted-foreground">Sort:</span>
                <SelectValue />
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel className="text-xs font-medium text-muted-foreground">Sort by</SelectLabel>
                {SORT_OPTIONS.map(({ value, label, icon: Icon }) => (
                  <SelectItem key={value} value={value}>
                    <span className="inline-flex items-center gap-2 align-middle">
                      <Icon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                      {label}
                    </span>
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Button onClick={openAddContactModal} className="w-full flex-shrink-0 sm:w-auto">
            <PlusIcon />
            Add Contact
          </Button>
        </div>
      </div>

      {/* The loader covers just the list, so the header, search box and sidebar stay usable. */}
      <div className="relative mt-6">
        {isBusy && (
          <div
            role="status"
            className="absolute inset-0 z-10 flex min-h-[200px] items-start justify-center bg-background/60 pt-24 backdrop-blur-[1px]"
          >
            <span className="inline-flex items-center gap-2 rounded-md border bg-popover px-4 py-2 text-sm font-medium text-popover-foreground shadow-md">
              <Spinner className="h-4 w-4 text-primary" />
              {loadingLabel}
            </span>
          </div>
        )}

        {/* Measured by useCardsPerPage to work out how many cards fit below this point. */}
        <div ref={gridRef}>
          {contact.length > 0 ? (
            <div
              aria-busy={isBusy}
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"
            >
              {contact.map((value) => (
                <ContactCard
                  key={value.id}
                  firstName={value.firstName}
                  lastName={value.lastName}
                  phone={value.phone}
                  email={value.email}
                  address={value.address}
                  favorite={value.favorite}
                  emergency={value.emergency}
                  highlight={debouncedSearchTerm}
                  userId={currentUser.id}
                  fetchContacts={loadContacts}
                  contactId={value.id}
                />
              ))}
            </div>
          ) : isBusy ? (
            // Nothing loaded yet: keep the space empty under the loader rather than flashing "No contacts".
            <div className="min-h-[360px]" />
          ) : search ? (
            emptyState(
              EmptyIcon,
              `No ${section.noun} found`,
              <>
                No {section.noun} match &ldquo;{search}&rdquo;. Try a different name, email or phone number.
              </>
            )
          ) : section.empty ? (
            emptyState(
              EmptyIcon,
              section.empty.title,
              section.empty.text,
              <Button asChild variant="outline">
                <Link to="/">Go to all contacts</Link>
              </Button>
            )
          ) : (
            emptyState(
              UsersIcon,
              "No contacts yet",
              "Get started by adding your first contact to your address book.",
              <Button onClick={openAddContactModal}>
                <PlusIcon />
                Add your first contact
              </Button>
            )
          )}
        </div>
      </div>

      {isAddContactModalOpen && (
        <AddContactModal
          onClose={closeAddContactModal}
          userId={currentUser.id}
          fetchContacts={loadContacts}
          // Added from the Emergency page: tick the box, so the new contact shows up on this page.
          defaultEmergency={view === "emergency"}
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
