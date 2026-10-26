import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { EllipsisIcon, PencilIcon, PlusIcon, TrashIcon } from "../icons/Icons";
import Hint from "../ui/Hint";
import { useTags } from "./TagsProvider";
import { tagDotClass } from "./tagColors";
import TagDialog from "./TagDialog";
import DeleteTagDialog from "./DeleteTagDialog";

/**
 * The "Tags" group in the sidebar: one link per tag (its page lists the contacts with that tag) with the contact
 * count, a ＋ to create a tag, and a ⋯ menu on each tag to edit or delete it.
 */
export default function SidebarTags() {
  const { tags } = useTags();
  const { isMobile, setOpenMobile } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  // null = closed; {} = create; { tag } = edit / delete that tag.
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const closeMobile = () => isMobile && setOpenMobile(false);

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Tags</SidebarGroupLabel>
      <Hint label="New tag" side="right">
        <SidebarGroupAction onClick={() => setEditing({})}>
          <PlusIcon />
          <span className="sr-only">New tag</span>
        </SidebarGroupAction>
      </Hint>
      <SidebarGroupContent>
        <SidebarMenu>
          {tags.map((tag) => (
            <SidebarMenuItem key={tag.id}>
              <SidebarMenuButton asChild tooltip={tag.name}>
                <NavLink
                  to={`/tags/${tag.id}`}
                  end
                  onClick={closeMobile}
                  className="aria-[current=page]:bg-sidebar-accent aria-[current=page]:font-medium aria-[current=page]:text-sidebar-accent-foreground"
                >
                  {/* Same width as the other sections' icons, so the names line up. */}
                  <span aria-hidden="true" className="flex size-4 shrink-0 items-center justify-center">
                    <span className={cn("h-2.5 w-2.5 rounded-full", tagDotClass(tag.color))} />
                  </span>
                  <span>{tag.name}</span>
                </NavLink>
              </SidebarMenuButton>
              {/* The count makes way for the ⋯ button while the row is hovered or focused. */}
              <SidebarMenuBadge className="transition-opacity group-focus-within/menu-item:opacity-0 group-hover/menu-item:opacity-0">
                {tag.contactCount}
              </SidebarMenuBadge>
              {/* modal={false}: the edit/delete dialogs open right after this menu closes. */}
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuAction showOnHover>
                    <EllipsisIcon />
                    <span className="sr-only">Options for {tag.name}</span>
                  </SidebarMenuAction>
                </DropdownMenuTrigger>
                <DropdownMenuContent side={isMobile ? "bottom" : "right"} align="start" className="w-44">
                  <DropdownMenuItem onSelect={() => setEditing({ tag })}>
                    <PencilIcon className="text-muted-foreground" />
                    Edit tag
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => setDeleting(tag)}
                    className="text-destructive focus:text-destructive"
                  >
                    <TrashIcon />
                    Delete tag
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          ))}
          {tags.length === 0 && (
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => setEditing({})} className="text-muted-foreground">
                <PlusIcon />
                <span>Create a tag</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarGroupContent>

      {editing && (
        <TagDialog
          tag={editing.tag}
          onClose={() => setEditing(null)}
          onSaved={(saved) => {
            // A new tag opens straight away, so it can be filled.
            if (!editing.tag) {
              closeMobile();
              navigate(`/tags/${saved.id}`);
            }
          }}
        />
      )}
      {deleting && (
        <DeleteTagDialog
          tag={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={() => {
            // Its page no longer exists.
            if (location.pathname === `/tags/${deleting.id}`) navigate("/", { replace: true });
          }}
        />
      )}
    </SidebarGroup>
  );
}
