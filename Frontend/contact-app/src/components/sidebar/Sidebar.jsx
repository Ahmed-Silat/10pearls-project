import { useCallback, useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { StarIcon, TrashIcon, UsersIcon } from "../icons/Icons";
import { CONTACTS_CHANGED_EVENT, getContactCounts } from "../../service/ContactService";

/**
 * The sections of the app. `count` is the key in the counts response. Recently deleted sits apart at the bottom.
 * To add a section (e.g. Emergency): add an entry here, a route in App.jsx, and a filter in the backend.
 */
export const NAV_SECTIONS = [
  { to: "/", label: "All contacts", Icon: UsersIcon, count: "all" },
  { to: "/favorites", label: "Favorites", Icon: StarIcon, count: "favorites" },
];
export const RECENTLY_DELETED_SECTION = {
  to: "/recently-deleted",
  label: "Recently deleted",
  Icon: TrashIcon,
  count: "recentlyDeleted",
};

/** Loads the sidebar counts, and reloads them when the page changes or contacts are added, deleted or starred. */
function useContactCounts() {
  const location = useLocation();
  const [counts, setCounts] = useState(null);

  const load = useCallback(async () => {
    try {
      setCounts(await getContactCounts());
    } catch {
      // Counts are a nice-to-have; the links work without them.
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, location.pathname]);

  useEffect(() => {
    window.addEventListener(CONTACTS_CHANGED_EVENT, load);
    return () => window.removeEventListener(CONTACTS_CHANGED_EVENT, load);
  }, [load]);

  return counts;
}

const TONES = {
  // White sidebar on desktop.
  light: {
    link: (active) =>
      active
        ? "bg-sky-50 text-sky-700 font-semibold"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
    icon: (active) => (active ? "text-sky-600" : "text-slate-400"),
    count: (active) => (active ? "text-sky-700" : "text-slate-400"),
    divider: "border-slate-200",
  },
  // Inside the blue header's mobile menu.
  dark: {
    link: (active) =>
      active ? "bg-white/15 text-white font-semibold" : "text-slate-200 hover:bg-white/10 hover:text-white",
    icon: (active) => (active ? "text-white" : "text-sky-200"),
    count: () => "text-sky-100/80",
    divider: "border-white/10",
  },
};

/** The section links. Used by the desktop sidebar and by the header's mobile menu. */
export function SidebarNav({ tone = "light", onNavigate }) {
  const counts = useContactCounts();
  const styles = TONES[tone];

  const renderLink = ({ to, label, Icon, count }) => (
    <li key={to}>
      <NavLink
        to={to}
        end
        onClick={onNavigate}
        className={({ isActive }) =>
          `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${styles.link(isActive)}`
        }
      >
        {({ isActive }) => (
          <>
            <Icon className={`h-4 w-4 flex-shrink-0 ${styles.icon(isActive)}`} />
            <span className="flex-1 truncate">{label}</span>
            {counts && (
              <span className={`text-xs tabular-nums ${styles.count(isActive)}`} data-testid={`count-${count}`}>
                {counts[count]}
              </span>
            )}
          </>
        )}
      </NavLink>
    </li>
  );

  return (
    <nav aria-label="Sections">
      <ul className="space-y-1">{NAV_SECTIONS.map(renderLink)}</ul>
      <ul className={`mt-3 space-y-1 border-t pt-3 ${styles.divider}`}>
        {renderLink(RECENTLY_DELETED_SECTION)}
      </ul>
    </nav>
  );
}

/** Left-hand navigation on tablets and up. On phones the same links are in the header's ☰ menu. */
export default function Sidebar() {
  return (
    <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-60 flex-shrink-0 overflow-y-auto border-r border-slate-200 bg-white px-3 py-6 md:block">
      <SidebarNav />
    </aside>
  );
}
