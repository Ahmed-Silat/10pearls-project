import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeftIcon, ChevronRightIcon } from "../icons/Icons";

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
    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-center text-sm text-muted-foreground sm:text-left">
        Showing <span className="font-medium text-foreground">{from}</span>–
        <span className="font-medium text-foreground">{to}</span> of{" "}
        <span className="font-medium text-foreground">{totalContacts}</span>{" "}
        {totalContacts === 1 ? "contact" : "contacts"}
      </p>

      <div className="flex flex-col-reverse items-center gap-3 sm:flex-row sm:gap-4">
        {/* Optional: only shown when the page lets the user choose the page size. */}
        {pageSizeOptions && onPageSizeChange && (
          <Select value={String(pageSize)} onValueChange={(value) => onPageSizeChange(Number(value))}>
            <SelectTrigger aria-label="Contacts per page" className="h-9 w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size} / page
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {totalPages > 1 && (
          <nav aria-label="Pagination" className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={isFirst}
              aria-label="Previous page"
            >
              <ChevronLeftIcon />
            </Button>

            {/* Small screens: compact "Page X of Y" instead of every page number. */}
            <span className="px-3 text-sm font-medium sm:hidden">
              Page {currentPage} of {totalPages}
            </span>

            <span className="hidden items-center gap-1 sm:inline-flex">
              {getPageItems(currentPage, totalPages).map((item) =>
                typeof item === "number" ? (
                  <Button
                    key={item}
                    variant={item === currentPage ? "outline" : "ghost"}
                    size="icon"
                    onClick={() => onPageChange(item)}
                    aria-label={`Page ${item}`}
                    aria-current={item === currentPage ? "page" : undefined}
                  >
                    {item}
                  </Button>
                ) : (
                  <span
                    key={item}
                    aria-hidden="true"
                    className="flex h-9 w-9 items-center justify-center text-muted-foreground"
                  >
                    …
                  </span>
                )
              )}
            </span>

            <Button
              variant="outline"
              size="icon"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={isLast}
              aria-label="Next page"
            >
              <ChevronRightIcon />
            </Button>
          </nav>
        )}
      </div>
    </div>
  );
}
