import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { EmergencyIcon, MailIcon, PencilIcon, PhoneIcon, PinIcon } from "../icons/Icons";

/** Read-only view of a contact, so long names and details can be seen in full. */
export default function ViewContactModal({ contact, onClose, onEdit }) {
  const fullName = [contact.firstName, contact.lastName].filter(Boolean).join(" ");
  const initials = `${contact.firstName?.[0] || ""}${contact.lastName?.[0] || ""}`.toUpperCase();

  const details = [
    {
      label: "Phone",
      Icon: PhoneIcon,
      value: contact.phone,
      href: contact.phone ? `tel:${contact.phone.replace(/[^\d+]/g, "")}` : null,
    },
    {
      label: "Email",
      Icon: MailIcon,
      value: contact.email,
      href: contact.email ? `mailto:${contact.email}` : null,
    },
    { label: "Address", Icon: PinIcon, value: contact.address, href: null },
  ];

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
          {details.map(({ label, Icon, value, href }) => (
            <div key={label} className="flex items-start gap-3 px-4 py-3">
              <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="text-sm font-medium [overflow-wrap:anywhere]">
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
