import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from "../icons/Icons";

/**
 * Which page buttons to show. With many pages this keeps the list to 7 items,
 * e.g. [1, "…", 4, 5, 6, "…", 12].
 */
const getPageItems = (current, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "end-gap", total];
  if (current >= total - 3) {
    return [1, "start-gap", total - 4, total - 3, total - 2, total - 1, total];
  }
  return [1, "start-gap", current - 1, current, current + 1, "end-gap", total];
};

const btnBase =
  "relative inline-flex h-10 min-w-[2.5rem] items-center justify-center px-3 text-sm font-medium transition-colors focus:z-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:cursor-not-allowed disabled:opacity-40";

/**
 * Display-only pagination bar. The dashboard owns the page state (in the URL) and passes it in.
 */
export default function Pagination({
  currentPage,
  totalPages,
  totalContacts,
  pageSize,
  pageSizeOptions,
  onPageChange,
  onPageSizeChange,
}) {
  if (!totalContacts) return null;

  const from = (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, totalContacts);
  const isFirst = currentPage <= 1;
  const isLast = currentPage >= totalPages;

  return (
    <div className="mt-8 flex flex-col gap-4 rounded-2xl bg-white px-4 py-4 shadow-card ring-1 ring-slate-200/70 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <p className="text-center text-sm text-slate-500 sm:text-left">
        Showing <span className="font-semibold text-slate-700">{from}</span>–
        <span className="font-semibold text-slate-700">{to}</span> of{" "}
        <span className="font-semibold text-slate-700">{totalContacts}</span>{" "}
        {totalContacts === 1 ? "contact" : "contacts"}
      </p>

      <div className="flex flex-col-reverse items-center gap-3 sm:flex-row sm:gap-4">
        {/* Optional: only shown when the page lets the user choose the page size. */}
        {pageSizeOptions && onPageSizeChange && (
          <div className="relative">
            <select
              value={pageSize}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
              aria-label="Contacts per page"
              className="appearance-none rounded-xl border border-slate-300 bg-white py-2 pl-4 pr-9 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size} / page
                </option>
              ))}
            </select>
            <ChevronDownIcon className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
        )}

        {totalPages > 1 && (
          <nav aria-label="Pagination" className="isolate inline-flex items-center gap-1">
            <button
              type="button"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={isFirst}
              aria-label="Previous page"
              className={`${btnBase} rounded-xl border border-slate-300 bg-white text-slate-500 hover:bg-slate-50`}
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>

            {/* Small screens: compact "Page X of Y" instead of every page number. */}
            <span className="px-3 text-sm font-medium text-slate-600 sm:hidden">
              Page {currentPage} of {totalPages}
            </span>

            <span className="hidden items-center gap-1 sm:inline-flex">
              {getPageItems(currentPage, totalPages).map((item) =>
                typeof item === "number" ? (
                  <button
                    type="button"
                    key={item}
                    onClick={() => onPageChange(item)}
                    aria-label={`Page ${item}`}
                    aria-current={item === currentPage ? "page" : undefined}
                    className={`${btnBase} rounded-xl ${
                      item === currentPage
                        ? "bg-sky-600 font-semibold text-white shadow-md shadow-sky-600/25"
                        : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {item}
                  </button>
                ) : (
                  <span key={item} aria-hidden="true" className="px-1 text-sm text-slate-400">
                    …
                  </span>
                )
              )}
            </span>

            <button
              type="button"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={isLast}
              aria-label="Next page"
              className={`${btnBase} rounded-xl border border-slate-300 bg-white text-slate-500 hover:bg-slate-50`}
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </nav>
        )}
      </div>
    </div>
  );
}
