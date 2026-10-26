import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import EmptyValue from "../ui/EmptyValue";
import TagBadge from "../tags/TagBadge";
import {
  BirthdayIcon,
  CompanyIcon,
  EmergencyIcon,
  MailIcon,
  NotesIcon,
  PencilIcon,
  PhoneIcon,
  PinIcon,
} from "../icons/Icons";
import { DETAIL_LABELS } from "../../validation/createContactSchema";
import { ageOn, formatBirthday, upcomingBirthdayText } from "../../lib/birthday";

const telHref = (phone) => `tel:${phone.replace(/[^\d+]/g, "")}`;
const labelText = (label) => DETAIL_LABELS.find((option) => option.value === label)?.label ?? "Other";

/** "14 May 1990 · 36 years old · Birthday in 3 days" (the last part only when it's within a week). */
const birthdayText = (birthday) => {
  const age = ageOn(birthday);
  return [formatBirthday(birthday), age !== null && `${age} years old`, upcomingBirthdayText(birthday)]
    .filter(Boolean)
    .join(" · ");
};

/**
 * Read-only view of a contact, so long names and details can be seen in full. Phone, email and address are
 * always listed (N/A when empty); the extra phones and emails, company, birthday and notes only when set.
 */
export default function ViewContactModal({ contact, onClose, onEdit }) {
  const fullName = [contact.firstName, contact.lastName].filter(Boolean).join(" ");
  const initials = `${contact.firstName?.[0] || ""}${contact.lastName?.[0] || ""}`.toUpperCase();

  const details = [
    {
      key: "phone",
      label: "Phone",
      Icon: PhoneIcon,
      value: contact.phone,
      href: contact.phone ? telHref(contact.phone) : null,
    },
    ...(contact.additionalPhones ?? []).map((phone, index) => ({
      key: `phone-${index}`,
      label: `Phone · ${labelText(phone.label)}`,
      Icon: PhoneIcon,
      value: phone.value,
      href: telHref(phone.value),
    })),
    {
      key: "email",
      label: "Email",
      Icon: MailIcon,
      value: contact.email,
      href: contact.email ? `mailto:${contact.email}` : null,
    },
    ...(contact.additionalEmails ?? []).map((email, index) => ({
      key: `email-${index}`,
      label: `Email · ${labelText(email.label)}`,
      Icon: MailIcon,
      value: email.value,
      href: `mailto:${email.value}`,
    })),
    contact.company && { key: "company", label: "Company", Icon: CompanyIcon, value: contact.company },
    contact.birthday && {
      key: "birthday",
      label: "Birthday",
      Icon: BirthdayIcon,
      value: birthdayText(contact.birthday),
    },
    { key: "address", label: "Address", Icon: PinIcon, value: contact.address, href: null },
    contact.notes && { key: "notes", label: "Notes", Icon: NotesIcon, value: contact.notes, multiline: true },
  ].filter(Boolean);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      {/* The footer has its own Close button, so no corner ✕. */}
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader className="items-center text-center sm:text-center">
          <Avatar className="h-16 w-16 text-lg">
            <AvatarFallback className="font-semibold">{initials}</AvatarFallback>
          </Avatar>
          <DialogTitle className="break-words pt-2 text-xl capitalize [overflow-wrap:anywhere]">
            {fullName}
          </DialogTitle>
          <DialogDescription>Contact details</DialogDescription>
          {contact.emergency && (
            <Badge
              variant="outline"
              className="gap-1.5 border-red-500/50 text-red-600 dark:text-red-400"
            >
              <EmergencyIcon className="h-3 w-3" />
              Emergency contact
            </Badge>
          )}
          {contact.tags?.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1" aria-label="Tags">
              {contact.tags.map((tag) => (
                <TagBadge key={tag.id} tag={tag} />
              ))}
            </div>
          )}
        </DialogHeader>

        <dl className="divide-y rounded-md border">
          {details.map(({ key, label, Icon, value, href, multiline }) => (
            <div key={key} className="flex items-start gap-3 px-4 py-3">
              <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd
                  className={cn(
                    "text-sm font-medium [overflow-wrap:anywhere]",
                    multiline && "whitespace-pre-wrap font-normal"
                  )}
                >
                  {!value ? (
                    <EmptyValue />
                  ) : href ? (
                    <a href={href} className="text-primary underline-offset-4 hover:underline">
                      {value}
                    </a>
                  ) : (
                    value
                  )}
                </dd>
              </div>
            </div>
          ))}
        </dl>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" data-autofocus onClick={onClose}>
            Close
          </Button>
          <Button onClick={onEdit}>
            <PencilIcon />
            Edit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
