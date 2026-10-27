import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Outlet } from "react-router";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { CloseIcon, SearchIcon } from "../icons/Icons";
import Spinner from "../ui/Spinner";
import Hint from "../ui/Hint";
import ModeToggle from "../theme/ModeToggle";
import AppSidebar from "../sidebar/Sidebar";
import { TagsProvider, useTags } from "../tags/TagsProvider";

/** Pages showing a contact list (plus every tag page); the header search filters whichever one is open. */
const SEARCHABLE_PAGES = ["/", "/favorites", "/emergency"];
const TAG_PAGE = /^\/tags\/(\d+)$/;

/** The current page's name in the top bar breadcrumb. */
const PAGE_TITLES = {
  "/": "All contacts",
  "/favorites": "Favorites",
  "/emergency": "Emergency",
  "/recently-deleted": "Recently deleted",
  "/user-profile": "Profile",
};

export const LOGOUT_DELAY_MS = 800;

/** The key that jumps to the search box from anywhere on a list page. */
export const SEARCH_SHORTCUT = "/";

/** Whether a key press is going into a text field (or other control) rather than the page. */
const isTypingInto = (target) =>
  target instanceof Element &&
  (target.isContentEditable || Boolean(target.closest("input, textarea, select, [contenteditable='true']")));

/**
 * The contact search box in the top bar (and in the extra row under it on phones). `showShortcut` shows a small
 * "/" key inside the empty box, as a reminder of the shortcut; it hides while the box has focus or text.
 */
function SearchBox({ inputRef, value, onChange, onKeyDown, onClear, showShortcut = false, autoFocus = false }) {
  return (
    <div className="relative w-full">
      <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        ref={inputRef}
        type="search"
        value={value}
        placeholder="Search contacts..."
        aria-label="Search contacts"
        aria-keyshortcuts={showShortcut ? SEARCH_SHORTCUT : undefined}
        autoFocus={autoFocus}
        onChange={onChange}
        onKeyDown={onKeyDown}
        className="peer pl-8 pr-8 [&::-webkit-search-cancel-button]:hidden"
      />
      {showShortcut && !value && (
        <kbd
          aria-hidden="true"
          title={`Press ${SEARCH_SHORTCUT} to search`}
          className="pointer-events-none absolute right-2 top-1/2 flex h-5 -translate-y-1/2 select-none items-center rounded border bg-muted px-1.5 font-mono text-[11px] font-medium text-muted-foreground peer-focus:hidden"
        >
          {SEARCH_SHORTCUT}
        </kbd>
      )}
      {value && (
        <Hint label="Clear search">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClear}
            aria-label="Clear search"
            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground"
          >
            <CloseIcon />
          </Button>
        </Hint>
      )}
    </div>
  );
}

/**
 * The signed-in layout (shadcn/ui dashboard shell): the sidebar, a slim top bar with the sidebar toggle,
 * breadcrumb, search and theme toggle, and the current page below. Loads the user's tags for all of it.
 */
export default function Header() {
  return (
    <TagsProvider>
      <AppLayout />
    </TagsProvider>
  );
}

function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchOpenMobile, setSearchOpenMobile] = useState(false);
  const desktopSearchRef = useRef(null);
  const mobileSearchRef = useRef(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("search") || "";
  const [searchInput, setSearchInput] = useState(search);

  const { tags } = useTags();
  const tagMatch = location.pathname.match(TAG_PAGE);
  const currentTag = tagMatch && tags.find((tag) => tag.id === Number(tagMatch[1]));

  // Search filters the contact list, so it only appears on the list pages.
  const showSearch = SEARCHABLE_PAGES.includes(location.pathname) || Boolean(tagMatch);
  const pageTitle = tagMatch ? currentTag?.name ?? "Tag" : PAGE_TITLES[location.pathname] ?? "ContactHub";

  const [loggingOut, setLoggingOut] = useState(false);
  const logoutTimerRef = useRef(null);
  useEffect(() => () => clearTimeout(logoutTimerRef.current), []);

  // Logout is client-side only, so hold the "Signing you out" overlay briefly before leaving.
  const logout = () => {
    if (loggingOut) return;
    setLoggingOut(true);
    logoutTimerRef.current = setTimeout(() => {
      localStorage.removeItem("userData");
      toast.success("Logged out");
      navigate("/login", { replace: true });
    }, LOGOUT_DELAY_MS);
  };

  const handleSearchInputChange = (event) => {
    const searchValue = event.target.value;
    setSearchInput(searchValue);
    setSearchParams((prevParams) => {
      const newParams = new URLSearchParams(prevParams);
      if (searchValue) newParams.set("search", searchValue);
      else newParams.delete("search");
      // A new search starts from the first page of results.
      newParams.delete("page");
      return newParams;
    });
  };

  /** Empties the search box (and the search in the URL), keeping the cursor in the box. */
  const clearSearch = (inputRef) => {
    setSearchInput("");
    setSearchParams((prevParams) => {
      const newParams = new URLSearchParams(prevParams);
      newParams.delete("search");
      newParams.delete("page");
      return newParams;
    });
    inputRef.current?.focus();
  };

  // "/" jumps to the search box, unless the user is typing somewhere or a dialog or menu is open. On phones
  // (no top-bar box) it opens the search row, whose box takes the focus as it appears.
  useEffect(() => {
    if (!showSearch) return undefined;
    const handleKeyDown = (event) => {
      if (event.key !== SEARCH_SHORTCUT || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.defaultPrevented || isTypingInto(event.target)) return;
      if (document.querySelector("[role=dialog], [role=alertdialog], [role=menu]")) return;
      event.preventDefault();
      const desktopBox = desktopSearchRef.current;
      // offsetParent is null when the box is hidden (the phone layout).
      if (desktopBox && desktopBox.offsetParent !== null) {
        desktopBox.focus();
        desktopBox.select();
      } else if (mobileSearchRef.current) {
        mobileSearchRef.current.focus();
      } else {
        setSearchOpenMobile(true);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showSearch]);

  /** Escape clears the search; pressed again (box empty), it leaves the box. */
  const handleSearchKeyDown = (inputRef) => (event) => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    if (searchInput) clearSearch(inputRef);
    else inputRef.current?.blur();
  };

  return (
    <SidebarProvider>
      <AppSidebar onSignOut={logout} />
      <SidebarInset>
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <Hint label="Toggle sidebar (Ctrl+B)" side="bottom" align="start">
            <SidebarTrigger className="-ml-1" />
          </Hint>
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb className="min-w-0">
            <BreadcrumbList className="flex-nowrap">
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink asChild>
                  <Link to="/">ContactHub</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem className="min-w-0">
                <BreadcrumbPage className="truncate">{pageTitle}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="ml-auto flex items-center gap-2">
            {showSearch && (
              <>
                <div className="hidden w-64 sm:block lg:w-80">
                  <SearchBox
                    inputRef={desktopSearchRef}
                    value={searchInput}
                    onChange={handleSearchInputChange}
                    onKeyDown={handleSearchKeyDown(desktopSearchRef)}
                    onClear={() => clearSearch(desktopSearchRef)}
                    showShortcut
                  />
                </div>
                <Hint label="Search" side="bottom">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="sm:hidden"
                    aria-expanded={searchOpenMobile}
                    onClick={() => setSearchOpenMobile((open) => !open)}
                  >
                    <span className="sr-only">Search</span>
                    <SearchIcon />
                  </Button>
                </Hint>
              </>
            )}
            <ModeToggle />
          </div>
        </header>

        {searchOpenMobile && showSearch && (
          <div className="border-b px-4 py-2 sm:hidden">
            <SearchBox
              inputRef={mobileSearchRef}
              value={searchInput}
              onChange={handleSearchInputChange}
              onKeyDown={handleSearchKeyDown(mobileSearchRef)}
              onClear={() => clearSearch(mobileSearchRef)}
              autoFocus
            />
          </div>
        )}

        <div className="flex flex-1 flex-col">
          <Outlet />
        </div>
      </SidebarInset>

      {loggingOut && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
        >
          <div className="flex items-center gap-3 rounded-lg border bg-popover px-5 py-3 text-sm font-medium shadow-lg">
            <Spinner className="h-4 w-4 text-primary" />
            Signing you out...
          </div>
        </div>
      )}
    </SidebarProvider>
  );
}
