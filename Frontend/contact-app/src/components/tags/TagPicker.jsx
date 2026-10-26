import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CheckIcon, ChevronsUpDownIcon, PlusIcon } from "../icons/Icons";
import { createTag, TAG_COLORS } from "../../service/TagService";
import { getApiErrorMessage } from "../../service/Constants";
import { useTags } from "./TagsProvider";
import { tagDotClass } from "./tagColors";
import TagBadge from "./TagBadge";

const MAX_TAGS = 20;

/**
 * Picks a contact's tags (shadcn/ui combobox: Popover + Command). Type to filter; if no tag has that name,
 * "Create …" makes one and selects it. `value` and `onChange` work with tag ids.
 */
export default function TagPicker({ id, value, onChange, disabled = false }) {
  const { tags } = useTags();
  // Tags created here, shown straight away (the shared list reloads a moment later).
  const [createdTags, setCreatedTags] = useState([]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);

  const allTags = [...tags, ...createdTags.filter((created) => !tags.some((tag) => tag.id === created.id))];
  const selectedTags = value.map((tagId) => allTags.find((tag) => tag.id === tagId)).filter(Boolean);
  const name = query.trim().replace(/\s+/g, " ");
  const canCreate =
    name.length > 0 && name.length <= 30 && !allTags.some((tag) => tag.name.toLowerCase() === name.toLowerCase());

  const toggle = (tagId) => {
    if (value.includes(tagId)) onChange(value.filter((selectedId) => selectedId !== tagId));
    else if (value.length < MAX_TAGS) onChange([...value, tagId]);
    else toast.error(`A contact can have up to ${MAX_TAGS} tags.`);
  };

  const create = async () => {
    if (creating) return;
    setCreating(true);
    try {
      // New tags take the next colour in turn, so neighbours look different.
      const color = TAG_COLORS[(allTags.length + 6) % TAG_COLORS.length];
      const tag = await createTag(name, color);
      setCreatedTags((prev) => [...prev, tag]);
      onChange([...value, tag.id]);
      setQuery("");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Couldn't create the tag."));
    } finally {
      setCreating(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="h-auto min-h-9 w-full justify-between px-3 py-1.5 font-normal"
        >
          {selectedTags.length > 0 ? (
            <span className="flex min-w-0 flex-wrap gap-1">
              {selectedTags.map((tag) => (
                <TagBadge key={tag.id} tag={tag} />
              ))}
            </span>
          ) : (
            <span className="text-muted-foreground">Add tags...</span>
          )}
          <ChevronsUpDownIcon className="ml-2 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] min-w-[16rem] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search or create a tag..." value={query} onValueChange={setQuery} />
          <CommandList>
            {/* When "Create …" is offered it says it all, so no "nothing matches" line above it. */}
            {!canCreate && (
              <CommandEmpty>{name ? "No tags match." : "No tags yet. Type a name to create one."}</CommandEmpty>
            )}
            {allTags.length > 0 && (
              <CommandGroup>
                {allTags.map((tag) => {
                  const selected = value.includes(tag.id);
                  return (
                    <CommandItem key={tag.id} value={`${tag.name} ${tag.id}`} onSelect={() => toggle(tag.id)}>
                      <span aria-hidden="true" className={cn("h-2 w-2 rounded-full", tagDotClass(tag.color))} />
                      <span className="truncate">{tag.name}</span>
                      <CheckIcon className={cn("ml-auto", selected ? "opacity-100" : "opacity-0")} />
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
            {canCreate && (
              // forceMount (group and item): always offered, even though "Create" doesn't match the typed text.
              <CommandGroup forceMount>
                <CommandItem forceMount value={`create-new-tag ${name}`} onSelect={create} disabled={creating}>
                  <PlusIcon />
                  Create &ldquo;{name}&rdquo;
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
