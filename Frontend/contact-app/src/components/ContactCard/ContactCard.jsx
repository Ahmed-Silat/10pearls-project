import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  BirthdayIcon,
  EmergencyIcon,
  EyeIcon,
  MailIcon,
  PencilIcon,
  PhoneIcon,
  PinIcon,
  StarIcon,
  StarOutlineIcon,
  TrashIcon,
} from "../icons/Icons";
import DeleteModal from "../modals/DeleteModal";
import EditModal from "../modals/EditModal";
import ViewContactModal from "../modals/ViewContactModal";
import EmptyValue from "../ui/EmptyValue";
import Highlight from "../ui/Highlight";
import Hint from "../ui/Hint";
import TagBadge from "../tags/TagBadge";
import { getContactById, setEmergency, setFavorite } from "../../service/ContactService";
import { getApiErrorMessage } from "../../service/Constants";
import { upcomingBirthdayText } from "../../lib/birthday";

const plural = (count, noun) => `${count} more ${noun}${count === 1 ? "" : "s"}`;

const ContactCard = (props) => {
  const [isFavorite, setIsFavorite] = useState(Boolean(props.favorite));
  const [isSavingFavorite, setIsSavingFavorite] = useState(false);
  useEffect(() => setIsFavorite(Boolean(props.favorite)), [props.favorite]);

  const [isEmergency, setIsEmergency] = useState(Boolean(props.emergency));
  const [isSavingEmergency, setIsSavingEmergency] = useState(false);
  useEffect(() => setIsEmergency(Boolean(props.emergency)), [props.emergency]);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentContactData, setCurrentContactData] = useState();

  const openDeleteModal = () => setIsDeleteModalOpen(true);
  const closeDeleteModal = () => setIsDeleteModalOpen(false);

  const openViewModal = () => setIsViewModalOpen(true);
  const closeViewModal = () => setIsViewModalOpen(false);

  // Each edit-open gets a number, so a late response for a modal that was already closed is ignored.
  const editRequestRef = useRef(0);

  /** Opens the edit modal straight away (it shows a loader) and fetches the latest contact. */
  const openEditModal = async () => {
    const requestId = ++editRequestRef.current;
    setCurrentContactData(undefined);
    setIsEditModalOpen(true);
    try {
      const data = await getContactById(props.contactId);
      if (requestId === editRequestRef.current) setCurrentContactData(data);
    } catch (error) {
      if (requestId === editRequestRef.current) {
        setIsEditModalOpen(false);
        toast.error(getApiErrorMessage(error, "Couldn't load this contact. Please try again."));
      }
    }
  };
  const closeEditModal = () => {
    editRequestRef.current += 1;
    setIsEditModalOpen(false);
    setCurrentContactData(undefined);
  };

  const initials = `${props.firstName?.[0] || ""}${props.lastName?.[0] || ""}`.toUpperCase();
  const fullName = [props.firstName, props.lastName].filter(Boolean).join(" ");
  const favoriteLabel = isFavorite
    ? `Remove ${fullName} from favorites`
    : `Add ${fullName} to favorites`;

  /** The star shows a spinner until the change is saved and the list has caught up. */
  const toggleFavorite = async () => {
    if (isSavingFavorite) return;
    const next = !isFavorite;
    setIsSavingFavorite(true);
    try {
      await setFavorite(props.contactId, next);
      setIsFavorite(next);
      toast.success(next ? "Added to favorites" : "Removed from favorites");
      // Reload quietly (no full-page loader), so on the Favorites page an unstarred contact drops off the list.
      await props.fetchContacts({ silent: true });
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Couldn't update favorites. Please try again."));
    } finally {
      setIsSavingFavorite(false);
    }
  };

  const emergencyLabel = isEmergency
    ? `Remove ${fullName} from emergency contacts`
    : `Mark ${fullName} as an emergency contact`;

  /** Same as the star: a spinner until it's saved, then a quiet reload so the Emergency page stays in step. */
  const toggleEmergency = async () => {
    if (isSavingEmergency) return;
    const next = !isEmergency;
    setIsSavingEmergency(true);
    try {
      await setEmergency(props.contactId, next);
      setIsEmergency(next);
      toast.success(next ? "Marked as an emergency contact" : "Removed from emergency contacts");
      await props.fetchContacts({ silent: true });
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Couldn't update emergency contacts. Please try again."));
    } finally {
      setIsSavingEmergency(false);
    }
  };

  // Emergency outranks the star for the outline colour, as it's the more urgent one to spot.
  const borderColor = isEmergency ? "border-red-500/50" : isFavorite ? "border-amber-400/60" : "";
  const tags = props.tags ?? [];
  const birthdaySoon = upcomingBirthdayText(props.birthday);

  /**
   * One line of contact details: a muted icon and the value (or N/A). `others` are the contact's extra phone
   * numbers or emails: the card shows how many, and hovering lists them.
   */
  const detail = (Icon, value, others = [], noun = "") => (
    <p className="flex min-w-0 items-center gap-3">
      <Icon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
      <span className="truncate">
        {value ? <Highlight text={value} query={props.highlight} /> : <EmptyValue />}
      </span>
      {others.length > 0 && (
        <Hint label={others.map((other) => other.value).join(", ")}>
          <span
            tabIndex={0}
            aria-label={plural(others.length, noun)}
            className="flex-shrink-0 rounded-sm bg-muted px-1.5 text-xs font-medium text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            +{others.length}
          </span>
        </Hint>
      )}
    </p>
  );

  return (
    <Card
      data-contact-card
      data-selected={props.selected || undefined}
      className={cn(
        "flex flex-col transition-colors hover:bg-accent/30",
        borderColor,
        props.selected && "bg-accent/40 ring-2 ring-ring"
      )}
    >
      <CardHeader className="flex-row items-center gap-3 space-y-0 p-4">
        {/* Shown while selecting contacts for bulk actions (the dashboard's "Select"). */}
        {props.selectable && (
          <Checkbox
            checked={Boolean(props.selected)}
            onCheckedChange={(checked) => props.onSelectedChange?.(checked === true)}
            aria-label={`Select ${fullName}`}
            className="flex-shrink-0"
          />
        )}
        <div className="relative flex-shrink-0">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/10 text-sm font-medium text-primary">{initials}</AvatarFallback>
          </Avatar>
          {/* A badge on the avatar rather than a label, so emergency cards are the same height as the rest. */}
          {isEmergency && (
            <Hint label="Emergency contact">
              <span
                role="img"
                aria-label="Emergency contact"
                className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white ring-2 ring-card"
              >
                <EmergencyIcon className="h-2.5 w-2.5" />
              </span>
            </Hint>
          )}
        </div>
        {/* The name gets the full width; clicking it opens the details, hovering shows it in full. */}
        <div className="min-w-0 flex-1">
          <h2>
            <Hint label={fullName} align="start">
              <button
                type="button"
                onClick={openViewModal}
                className="block w-full truncate rounded-sm text-left text-base font-semibold capitalize leading-tight hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <Highlight text={props.firstName} query={props.highlight} />
                {props.lastName && (
                  <>
                    {" "}
                    <Highlight text={props.lastName} query={props.highlight} />
                  </>
                )}
              </button>
            </Hint>
          </h2>
          {props.company && (
            <p className="truncate pt-0.5 text-xs text-muted-foreground" title={props.company}>
              <Highlight text={props.company} query={props.highlight} />
            </p>
          )}
        </div>
        <Hint label={isFavorite ? "Remove from favorites" : "Add to favorites"}>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFavorite}
            loading={isSavingFavorite}
            aria-pressed={isFavorite}
            aria-label={favoriteLabel}
            className={cn(
              "h-8 w-8 flex-shrink-0",
              isFavorite || isSavingFavorite
                ? "text-amber-400 hover:text-amber-500"
                : "text-muted-foreground hover:text-amber-400"
            )}
          >
            {isFavorite ? <StarIcon /> : <StarOutlineIcon />}
          </Button>
        </Hint>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-2.5 px-4 pb-4 pt-0 text-sm">
        {detail(PhoneIcon, props.phone, props.additionalPhones, "phone number")}
        {detail(MailIcon, props.email, props.additionalEmails, "email")}
        {detail(PinIcon, props.address)}
        {birthdaySoon && (
          <p className="flex min-w-0 items-center gap-3 font-medium text-pink-600 dark:text-pink-400">
            <BirthdayIcon className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{birthdaySoon}</span>
          </p>
        )}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-0.5" aria-label="Tags">
            {tags.map((tag) => (
              <TagBadge key={tag.id} tag={tag} link />
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="justify-between gap-2 border-t px-2 py-2">
        <Button variant="ghost" size="sm" onClick={openViewModal} aria-label={`View ${fullName}`}>
          <EyeIcon />
          View details
        </Button>
        <div className="flex items-center">
          <Hint label={isEmergency ? "Remove from emergency contacts" : "Mark as emergency contact"}>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleEmergency}
              loading={isSavingEmergency}
              aria-pressed={isEmergency}
              aria-label={emergencyLabel}
              className={cn(
                "h-8 w-8",
                isEmergency || isSavingEmergency
                  ? "text-red-500 hover:text-red-600 dark:text-red-400"
                  : "text-muted-foreground hover:text-red-500"
              )}
            >
              <EmergencyIcon />
            </Button>
          </Hint>
          <Hint label="Edit">
            <Button
              variant="ghost"
              size="icon"
              onClick={openEditModal}
              aria-label={`Edit ${fullName}`}
              className="h-8 w-8 text-muted-foreground"
            >
              <PencilIcon />
            </Button>
          </Hint>
          <Hint label="Delete">
            <Button
              variant="ghost"
              size="icon"
              onClick={openDeleteModal}
              aria-label={`Delete ${fullName}`}
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
            >
              <TrashIcon />
            </Button>
          </Hint>
        </div>
      </CardFooter>

      {isViewModalOpen && (
        <ViewContactModal
          contact={{ ...props, favorite: isFavorite, emergency: isEmergency }}
          onClose={closeViewModal}
          onEdit={() => {
            closeViewModal();
            openEditModal();
          }}
        />
      )}

      {isDeleteModalOpen && (
        <DeleteModal
          onClose={closeDeleteModal}
          contactId={props.contactId}
          contactName={fullName}
          getContacts={props.fetchContacts}
        />
      )}

      {isEditModalOpen && (
        <EditModal
          onClose={closeEditModal}
          contactData={currentContactData}
          getContacts={props.fetchContacts}
        />
      )}
    </Card>
  );
};

export default ContactCard;
