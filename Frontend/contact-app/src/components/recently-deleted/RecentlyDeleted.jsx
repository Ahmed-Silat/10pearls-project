import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import Button from "../button/Button";
import Pagination from "../pagination/Pagination";
import Spinner from "../ui/Spinner";
import PermanentDeleteModal from "../modals/PermanentDeleteModal";
import {
  deletePermanently,
  getRecentlyDeleted,
  restoreContact,
} from "../../service/ContactService";
import { getApiErrorMessage } from "../../service/Constants";
import { ChevronLeftIcon, MailIcon, PhoneIcon, TrashIcon } from "../icons/Icons";

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

  const restore = async (contact) => {
    setRestoringId(contact.id);
    try {
      await restoreContact(contact.id);
      toast.success("Contact restored");
      await load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Couldn't restore the contact."));
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
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 rounded text-sm font-semibold text-sky-700 transition-colors hover:text-sky-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
      >
        <ChevronLeftIcon className="h-3 w-3" />
        Back to contacts
      </Link>

      <div className="mt-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Recently deleted
          {data?.totalContacts > 0 && (
            <span className="ml-2 align-middle text-base font-semibold text-slate-400">
              ({data.totalContacts})
            </span>
          )}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Deleted contacts stay here for 30 days, then they&apos;re deleted permanently.
        </p>
      </div>

      <div className="mt-8">
        {isLoading && !data ? (
          <div role="status" className="flex flex-col items-center justify-center gap-3 py-20">
            <Spinner className="h-8 w-8 text-sky-600" />
            <p className="text-sm font-medium text-slate-500">Loading recently deleted contacts...</p>
          </div>
        ) : loadFailed && !data ? (
          <div className="flex flex-col items-center gap-4 rounded-3xl bg-white py-16 text-center shadow-card ring-1 ring-slate-200/70">
            <p className="text-sm text-slate-600">Couldn&apos;t load your recently deleted contacts.</p>
            <Button
              name="Try again"
              onClick={load}
              className="bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
            />
          </div>
        ) : contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white/60 py-20">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
              <TrashIcon className="h-7 w-7 text-slate-400" />
            </span>
            <h2 className="mt-4 text-lg font-semibold text-slate-700">Nothing here</h2>
            <p className="mt-1 max-w-sm text-center text-sm text-slate-500">
              Contacts you delete will appear here for 30 days.
            </p>
          </div>
        ) : (
          <ul
            aria-busy={isLoading}
            className="divide-y divide-slate-100 overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-slate-200/70"
          >
            {contacts.map((contact) => {
              const name = fullNameOf(contact);
              const initials = `${contact.firstName?.[0] || ""}${contact.lastName?.[0] || ""}`.toUpperCase();
              const timeLeft = timeLeftLabel(contact.deletesPermanentlyAt);
              const expiresSoon = new Date(contact.deletesPermanentlyAt).getTime() - Date.now() < 3 * DAY_MS;
              return (
                <li
                  key={contact.id}
                  data-testid="deleted-contact"
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4 sm:p-5"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-slate-200 text-base font-bold text-slate-500">
                      {initials}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold capitalize text-slate-800" title={name}>
                        {name}
                      </p>
                      <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
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
                      <p className={`mt-1 text-xs font-medium ${expiresSoon ? "text-amber-600" : "text-slate-400"}`}>
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
                      name={restoringId === contact.id ? "Restoring..." : "Restore"}
                      loading={restoringId === contact.id}
                      disabled={restoringId !== null}
                      onClick={() => restore(contact)}
                      className="flex-1 bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 sm:flex-none"
                    />
                    <Button
                      name="Delete forever"
                      disabled={restoringId !== null}
                      onClick={() => setConfirmingDelete(contact)}
                      className="flex-1 px-4 py-2 text-sm font-semibold text-red-600 ring-1 ring-red-200 hover:bg-red-50 sm:flex-none"
                    />
                  </div>
                </li>
              );
            })}
          </ul>
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
