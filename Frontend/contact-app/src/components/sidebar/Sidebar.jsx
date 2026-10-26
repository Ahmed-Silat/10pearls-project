import { useCallback, useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  ChevronsUpDownIcon,
  EmergencyIcon,
  LogoIcon,
  LogoutIcon,
  StarIcon,
  TrashIcon,
  UserIcon,
  UsersIcon,
} from "../icons/Icons";
import { CONTACTS_CHANGED_EVENT, getContactCounts } from "../../service/ContactService";

/**
 * The contact sections. `count` is the key in the counts response. Recently deleted sits in its own group.
 * To add a section: add an entry here, a route in App.jsx, and a filter in the backend.
 */
export const NAV_SECTIONS = [
  { to: "/", label: "All contacts", Icon: UsersIcon, count: "all" },
  { to: "/favorites", label: "Favorites", Icon: StarIcon, count: "favorites" },
  { to: "/emergency", label: "Emergency", Icon: EmergencyIcon, count: "emergency" },
];
export const RECENTLY_DELETED_SECTION = {
  to: "/recently-deleted",
  label: "Recently deleted",
  Icon: TrashIcon,
  count: "recentlyDeleted",
};

/** Loads the sidebar counts, and reloads them when the page changes or contacts are added, edited, deleted or starred. */
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

/** The signed-in user from localStorage, re-read whenever the profile is edited. */
function useCurrentUser() {
  const [, setVersion] = useState(0);
  useEffect(() => {
    const refresh = () => setVersion((v) => v + 1);
    window.addEventListener("userDataUpdated", refresh);
    return () => window.removeEventListener("userDataUpdated", refresh);
  }, []);

  const stored = localStorage.getItem("userData");
  const user = stored ? JSON.parse(stored) : null;
  return {
    fullName: [user?.firstName, user?.lastName].filter(Boolean).join(" "),
    email: user?.email || "",
    initials: `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`.toUpperCase(),
  };
}

function NavItem({ to, label, Icon, count, counts }) {
  const { isMobile, setOpenMobile } = useSidebar();
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild tooltip={label}>
        {/* NavLink marks the current page with aria-current, which the button styles as active. */}
        <NavLink
          to={to}
          end
          onClick={() => isMobile && setOpenMobile(false)}
          className="aria-[current=page]:bg-sidebar-accent aria-[current=page]:font-medium aria-[current=page]:text-sidebar-accent-foreground"
        >
          <Icon />
          <span>{label}</span>
        </NavLink>
      </SidebarMenuButton>
      {counts && <SidebarMenuBadge data-testid={`count-${count}`}>{counts[count]}</SidebarMenuBadge>}
    </SidebarMenuItem>
  );
}

/** The signed-in user at the bottom of the sidebar, with the account menu (profile, sign out). */
function NavUser({ onSignOut }) {
  const { isMobile, setOpenMobile } = useSidebar();
  const { fullName, email, initials } = useCurrentUser();
  const avatar = (
    <Avatar className="h-8 w-8 rounded-lg">
      <AvatarFallback className="rounded-lg bg-primary/10 text-xs font-medium uppercase text-primary">
        {initials || <UserIcon className="h-4 w-4" />}
      </AvatarFallback>
    </Avatar>
  );

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              // Shown only while the sidebar is collapsed to icons, when the name is hidden.
              tooltip={fullName || "Your account"}
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <span className="sr-only">Open user menu</span>
              {avatar}
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold capitalize">{fullName || "Your account"}</span>
                <span className="truncate text-xs text-muted-foreground">{email}</span>
              </div>
              <ChevronsUpDownIcon className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            {/* Who is signed in. Long names and emails are cut short; hovering shows them in full. */}
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                {avatar}
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold capitalize" data-testid="menu-user-name">
                    {fullName || "Your account"}
                  </span>
                  {email && (
                    <span className="truncate text-xs text-muted-foreground" data-testid="menu-user-email">
                      {email}
                    </span>
                  )}
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/user-profile" onClick={() => isMobile && setOpenMobile(false)}>
                <UserIcon />
                My Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onSignOut}>
              <LogoutIcon />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

/**
 * The app's sidebar (shadcn/ui Sidebar block): brand, the contact sections with their counts, Recently deleted,
 * and the account menu at the bottom. Collapses to icons on desktop; on phones it opens as a slide-in sheet.
 */
export default function AppSidebar({ onSignOut }) {
  const counts = useContactCounts();
  const { isMobile, setOpenMobile } = useSidebar();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/" aria-label="ContactHub home" onClick={() => isMobile && setOpenMobile(false)}>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <LogoIcon className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">ContactHub</span>
                  <span className="truncate text-xs text-muted-foreground">Address book</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <nav aria-label="Sections">
          <SidebarGroup>
            <SidebarGroupLabel>Contacts</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {NAV_SECTIONS.map((section) => (
                  <NavItem key={section.to} {...section} counts={counts} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>Manage</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <NavItem {...RECENTLY_DELETED_SECTION} counts={counts} />
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </nav>
      </SidebarContent>

      <SidebarFooter>
        <NavUser onSignOut={onSignOut} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
