import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from "../icons/Icons";

export default function Pagination(props) {
  const [totalContacts, setTotalContacts] = useState();
  const [totalPages, setTotalPages] = useState();
  const [contactsPerPage, setContactsPerPage] = useState();
  const searchParams = useSearchParams()[0];
  const setSearchParams = useSearchParams()[1];
  const page = searchParams.get("page") || "1";
  const [currentPage, setCurrentPage] = useState(page);

  const handlePageChange = (pageNo) => {
    setCurrentPage(pageNo);
    setSearchParams((prevParams) => {
      const newParams = new URLSearchParams(prevParams);
      newParams.set("page", pageNo);
      props.fetchContacts(
        newParams.get("sortBy"),
        newParams.get("search"),
        newParams.get("page"),
        newParams.get("size")
      );
      return newParams;
    });
  };

  const handleSizeChange = (event) => {
    const size = event.target.value;
    setContactsPerPage(size);
    setSearchParams((prevParams) => {
      const newParams = new URLSearchParams(prevParams);
      newParams.set("size", size);
      props.fetchContacts(
        newParams.get("sortBy"),
        newParams.get("search"),
        newParams.get("page"),
        newParams.get("size")
      );
      return newParams;
    });
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      handlePageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      handlePageChange(currentPage + 1);
    }
  };

  const handlePageSizeChange = (event) => {
    setContactsPerPage(Number(event.target.value));
    setCurrentPage(1);
    handleSizeChange(event);
  };

  useEffect(() => {
    if (props.paginationObject) {
      setContactsPerPage(props.paginationObject.contactsPerPage);
      setCurrentPage(props.paginationObject.currentPage);
      setTotalContacts(props.paginationObject.totalContacts);
      setTotalPages(props.paginationObject.totalPages);
    }
  }, [props.paginationObject]);

  const btnBase =
    "relative inline-flex items-center justify-center min-w-[2.5rem] h-10 px-3 text-sm font-medium transition-colors focus:z-10 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed";

  return (
    <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl bg-white px-4 py-4 shadow-card ring-1 ring-slate-200/70 sm:flex-row sm:px-6">
      <div className="flex w-full justify-between sm:hidden">
        <button
          onClick={handlePrevious}
          disabled={currentPage === 1}
          className={`${btnBase} rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50`}
        >
          Previous
        </button>
        <button
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className={`${btnBase} ml-3 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50`}
        >
          Next
        </button>
      </div>

      <div className="hidden w-full sm:flex sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          Showing{" "}
          <span className="font-semibold text-slate-700">
            {(currentPage - 1) * contactsPerPage + 1}
          </span>{" "}
          –{" "}
          <span className="font-semibold text-slate-700">
            {Math.min(currentPage * contactsPerPage, totalContacts)}
          </span>{" "}
          of <span className="font-semibold text-slate-700">{totalContacts}</span>{" "}
          contacts
        </p>

        <div className="flex items-center gap-4">
          <div className="relative">
            <select
              value={contactsPerPage}
              onChange={handlePageSizeChange}
              className="appearance-none rounded-xl border border-slate-300 bg-white py-2 pl-4 pr-9 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            >
              {[3, 5, 10, 15].map((size) => (
                <option key={size} value={size}>
                  {size} / page
                </option>
              ))}
            </select>
            <ChevronDownIcon className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>

          <nav aria-label="Pagination" className="isolate inline-flex gap-1">
            <button
              onClick={handlePrevious}
              disabled={currentPage === 1}
              aria-label="Previous page"
              className={`${btnBase} rounded-xl border border-slate-300 bg-white text-slate-500 hover:bg-slate-50`}
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            {Array.from({ length: totalPages || 0 }, (_, i) => i + 1).map(
              (pageNo) => (
                <button
                  key={pageNo}
                  onClick={() => handlePageChange(pageNo)}
                  aria-current={pageNo === currentPage ? "page" : undefined}
                  className={`${btnBase} rounded-xl ${
                    pageNo === Number(currentPage)
                      ? "bg-sky-600 font-semibold text-white shadow-md shadow-sky-600/25"
                      : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {pageNo}
                </button>
              )
            )}
            <button
              onClick={handleNext}
              disabled={currentPage === totalPages}
              aria-label="Next page"
              className={`${btnBase} rounded-xl border border-slate-300 bg-white text-slate-500 hover:bg-slate-50`}
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}