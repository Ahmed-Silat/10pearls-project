import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Outlet } from "react-router";
import {
  SearchIcon,
  MenuIcon,
  CloseIcon,
  ChevronDownIcon,
  UsersIcon,
  UserIcon,
  LogoutIcon,
} from "../icons/Icons";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpenMobile, setSearchOpenMobile] = useState(false);
  const profileRef = useRef(null);
  const desktopSearchRef = useRef(null);
  const mobileSearchRef = useRef(null);

  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get("search") || "";
  const [searchInput, setSearchInput] = useState(search);

  // Re-read the stored user when the profile is edited, so the initials stay in sync.
  const [, setUserDataVersion] = useState(0);
  useEffect(() => {
    const handleUserDataUpdated = () => setUserDataVersion((v) => v + 1);
    window.addEventListener("userDataUpdated", handleUserDataUpdated);
    return () => window.removeEventListener("userDataUpdated", handleUserDataUpdated);
  }, []);

  const userDetails = localStorage.getItem("userData");
  const currentUser = userDetails ? JSON.parse(userDetails) : null;
  const initials = `${currentUser?.firstName?.[0] || ""}${
    currentUser?.lastName?.[0] || ""
  }`.toUpperCase();

  const isProfilePage = location.pathname === "/user-profile";

  const logout = () => {
    localStorage.removeItem("userData");
    toast.success("Logged out");
    navigate("/login");
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

  const handleSearchKeyDown = (inputRef) => (event) => {
    if (event.key === "Escape" && searchInput) {
      event.preventDefault();
      clearSearch(inputRef);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navLinkClass = (active) =>
    `rounded-lg px-3.5 py-2 text-sm font-medium transition-colors duration-200 ${
      active
        ? "bg-white/10 text-white"
        : "text-slate-300 hover:bg-white/10 hover:text-white"
    }`;

  return (
    <div className="min-h-full">
      <nav className="sticky top-0 z-30 bg-gradient-to-r from-sky-700 to-cyan-800 shadow-lg">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative flex h-16 items-center justify-between gap-2">
            {/* min-w-0 lets this side shrink on narrow phones instead of pushing the row off-screen. */}
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <button
                type="button"
                className="inline-flex flex-shrink-0 items-center justify-center rounded-lg p-2 text-slate-200 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white md:hidden"
                onClick={() => setMenuOpen((open) => !open)}
              >
                <span className="sr-only">Open main menu</span>
                {menuOpen ? (
                  <CloseIcon className="block h-6 w-6" />
                ) : (
                  <MenuIcon className="block h-6 w-6" />
                )}
              </button>

              <Link to="/" aria-label="ContactHub home" className="flex min-w-0 items-center gap-2.5">
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
                  <UsersIcon className="h-5 w-5 text-white" />
                </span>
                {/* Hidden on very narrow screens (under 360px); just the logo shows there. */}
                <span className="hidden truncate text-lg font-bold tracking-tight text-white min-[360px]:block">
                  ContactHub
                </span>
              </Link>
            </div>

            {!isProfilePage && (
              <div className="hidden flex-1 justify-center px-6 lg:flex">
                <div className="relative w-full max-w-md">
                  <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-sky-200/70" />
                  <input
                    ref={desktopSearchRef}
                    type="text"
                    value={searchInput}
                    placeholder="Search contacts..."
                    aria-label="Search contacts"
                    onChange={handleSearchInputChange}
                    onKeyDown={handleSearchKeyDown(desktopSearchRef)}
                    className="w-full rounded-full border border-white/10 bg-white/10 py-2 pl-10 pr-10 text-sm text-white placeholder-sky-200/60 transition-colors focus:border-sky-300/50 focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
                  />
                  {searchInput && (
                    <button
                      type="button"
                      onClick={() => clearSearch(desktopSearchRef)}
                      aria-label="Clear search"
                      title="Clear search"
                      className="absolute right-2 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-sky-200/80 transition-colors hover:bg-white/15 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    >
                      <CloseIcon className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-shrink-0 items-center gap-1 sm:gap-2">
              {!isProfilePage && (
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-lg p-2 text-slate-200 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white lg:hidden"
                  onClick={() => setSearchOpenMobile((open) => !open)}
                >
                  <span className="sr-only">Search</span>
                  <SearchIcon className="h-6 w-6" />
                </button>
              )}

              <div className="relative" ref={profileRef}>
                <button
                  type="button"
                  className="flex items-center gap-1.5 rounded-full p-1.5 text-sm text-white transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  onClick={() => setProfileOpen((open) => !open)}
                >
                  <span className="sr-only">Open user menu</span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-xs font-bold uppercase text-white ring-1 ring-white/30">
                    {initials || <UserIcon className="h-5 w-5" />}
                  </span>
                  <ChevronDownIcon
                    className={`h-4 w-4 transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 z-10 mt-2 w-48 origin-top-right animate-[fadeIn_0.15s_ease-out] rounded-xl bg-white py-1.5 shadow-xl ring-1 ring-slate-200">
                    <Link
                      to="/user-profile"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-50"
                    >
                      <UserIcon className="h-4 w-4 text-slate-400" />
                      My Profile
                    </Link>
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        logout();
                      }}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50"
                    >
                      <LogoutIcon className="h-4 w-4 text-slate-400" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {searchOpenMobile && !isProfilePage && (
          <div className="animate-[fadeIn_0.15s_ease-out] px-4 pb-3 lg:hidden">
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-sky-200/70" />
              <input
                ref={mobileSearchRef}
                type="text"
                value={searchInput}
                placeholder="Search contacts..."
                aria-label="Search contacts"
                onChange={handleSearchInputChange}
                onKeyDown={handleSearchKeyDown(mobileSearchRef)}
                className="w-full rounded-full border border-white/10 bg-white/10 py-2 pl-10 pr-10 text-sm text-white placeholder-sky-200/60 focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => clearSearch(mobileSearchRef)}
                  aria-label="Clear search"
                  title="Clear search"
                  className="absolute right-2 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-sky-200/80 transition-colors hover:bg-white/15 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <CloseIcon className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {menuOpen && (
          <div className="animate-[fadeIn_0.15s_ease-out] space-y-1 border-t border-white/10 px-4 pb-3 pt-2 md:hidden">
            <Link
              to="/"
              onClick={() => setMenuOpen(false)}
              className={navLinkClass(false)}
            >
              Contacts
            </Link>
          </div>
        )}
      </nav>

      <Outlet />
    </div>
  );
}