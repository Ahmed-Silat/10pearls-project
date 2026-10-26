import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Pagination from "../pagination/Pagination";
import Spinner from "../ui/Spinner";
import Hint from "../ui/Hint";
import PermanentDeleteModal from "../modals/PermanentDeleteModal";
import {
  deletePermanently,
  getDuplicates,
  getRecentlyDeleted,
  restoreContact,
} from "../../service/ContactService";
import { getApiErrorMessage } from "../../service/Constants";
import { ArrowLeftIcon, MailIcon, PhoneIcon, TrashIcon } from "../icons/Icons";

const DAY_MS = 24 * 60 * 60 * 1000;

/** "12 days left", "1 day left", or "Less than a day left", counted to the moment it's deleted for good. */
export const timeLeftLabel = (deletesPermanentlyAt, now = Date.now()) => {
  const days = Math.floor((new Date(deletesPermanentlyAt).getTime() - now) / DAY_MS);
  if (days < 1) return "Less than a day left";
  return days === 1 ? "1 day left" : `${days} days left`;
};

const fullNameOf = (contact) => [contact.firstName, contact.lastName].filter(Boolean).join(" ");

/** Deleted contacts, kept for 30 days. Each can be restored or deleted for good. */
export default function RecentlyDeleted() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [restoringId, setRestoringId] = useState(null);
  const [confirmingDelete, setConfirmingDelete] = useState(null);

  // A response is ignored if a newer load has started since.
  const latestRequestRef = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++latestRequestRef.current;
    setIsLoading(true);
    setLoadFailed(false);
    try {
      const result = await getRecentlyDeleted(page);
      if (requestId !== latestRequestRef.current) return;
      // The last contact on this page was restored or deleted: show the last page that still exists.
      if (result.contacts.length === 0 && page > 1 && result.totalPages > 0) {
        setPage(result.totalPages);
        return;
      }
      setData(result);
    } catch {
      if (requestId === latestRequestRef.current) setLoadFailed(true);
    } finally {
      if (requestId === latestRequestRef.current) setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  const restore = async (contact, { allowDuplicate = false } = {}) => {
    setRestoringId(contact.id);
    try {
      await restoreContact(contact.id, { allowDuplicate });
      toast.success("Contact restored");
      await load();
    } catch (error) {
      // A contact with the same phone or email was added since the delete: let the user decide.
      const duplicates = getDuplicates(error);
      toast.error(getApiErrorMessage(error, "Couldn't restore the contact."), {
        ...(duplicates && {
          action: { label: "Restore anyway", onClick: () => restore(contact, { allowDuplicate: true }) },
          duration: 8000,
        }),
      });
    } finally {
      setRestoringId(null);
    }
  };

  /** Called by the confirm dialog; a thrown message is shown inside the dialog. */
  const deleteForever = async () => {
    try {
      await deletePermanently(confirmingDelete.id);
    } catch (error) {
      throw getApiErrorMessage(error, "Couldn't delete the contact.");
    }
    setConfirmingDelete(null);
    toast.success("Contact deleted permanently");
    await load();
  };

  const contacts = data?.contacts ?? [];

  return (
    <div className="mx-auto w-full max-w-4xl p-4 md:p-6">
      <Button asChild variant="ghost" size="sm" className="-ml-3 text-muted-foreground">
        <Link to="/">
          <ArrowLeftIcon />
          Back to contacts
        </Link>
      </Button>

      <div className="mt-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Recently deleted
          {data?.totalContacts > 0 && (
            <span className="ml-2 align-middle text-base font-normal text-muted-foreground">
              ({data.totalContacts})
            </span>
          )}
        </h1>
        <p className="text-sm text-muted-foreground">
          Deleted contacts stay here for 30 days, then they&apos;re deleted permanently.
        </p>
      </div>

      <div className="mt-6">
        {isLoading && !data ? (
          <div role="status" className="flex flex-col items-center justify-center gap-3 py-20">
            <Spinner className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading recently deleted contacts...</p>
          </div>
        ) : loadFailed && !data ? (
          <Card className="flex flex-col items-center gap-4 p-10 text-center">
            <p className="text-sm text-muted-foreground">Couldn&apos;t load your recently deleted contacts.</p>
            <Button variant="outline" onClick={load}>
              Try again
            </Button>
          </Card>
        ) : contacts.length === 0 ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <TrashIcon className="h-6 w-6 text-muted-foreground" />
            </span>
            <h2 className="mt-4 text-lg font-semibold">Nothing here</h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Contacts you delete will appear here for 30 days.
            </p>
          </div>
        ) : (
          <Card className="overflow-hidden">
            <ul aria-busy={isLoading} className="divide-y">
              {contacts.map((contact) => {
                const name = fullNameOf(contact);
                const initials = `${contact.firstName?.[0] || ""}${contact.lastName?.[0] || ""}`.toUpperCase();
                const timeLeft = timeLeftLabel(contact.deletesPermanentlyAt);
                const expiresSoon = new Date(contact.deletesPermanentlyAt).getTime() - Date.now() < 3 * DAY_MS;
                return (
                  <li
                    key={contact.id}
                    data-testid="deleted-contact"
                    className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="text-sm font-medium text-muted-foreground">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <Hint label={name} align="start">
                          <p className="truncate text-sm font-medium capitalize">{name}</p>
                        </Hint>
                        <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                          {contact.phone && (
                            <span className="inline-flex items-center gap-1">
                              <PhoneIcon className="h-3 w-3" />
                              {contact.phone}
                            </span>
                          )}
                          {contact.email && (
                            <span className="inline-flex min-w-0 items-center gap-1">
                              <MailIcon className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{contact.email}</span>
                            </span>
                          )}
                        </p>
                        <p
                          className={cn(
                            "mt-1 text-xs",
                            expiresSoon ? "font-medium text-amber-600 dark:text-amber-400" : "text-muted-foreground"
                          )}
                        >
                          Deleted{" "}
                          {new Date(contact.deletedAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}{" "}
                          · {timeLeft}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-shrink-0 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        loading={restoringId === contact.id}
                        disabled={restoringId !== null}
                        onClick={() => restore(contact)}
                        className="flex-1 sm:flex-none"
                      >
                        {restoringId === contact.id ? "Restoring..." : "Restore"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={restoringId !== null}
                        onClick={() => setConfirmingDelete(contact)}
                        className="flex-1 text-destructive hover:bg-destructive/10 hover:text-destructive sm:flex-none"
                      >
                        Delete forever
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
        )}
      </div>

      {data && data.totalPages > 1 && (
        <Pagination
          currentPage={data.currentPage}
          totalPages={data.totalPages}
          totalContacts={data.totalContacts}
          pageSize={data.contactsPerPage}
          onPageChange={(newPage) => {
            setPage(newPage);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      )}

      {confirmingDelete && (
        <PermanentDeleteModal
          name={fullNameOf(confirmingDelete)}
          onConfirm={deleteForever}
          onClose={() => setConfirmingDelete(null)}
        />
      )}
    </div>
  );
}
