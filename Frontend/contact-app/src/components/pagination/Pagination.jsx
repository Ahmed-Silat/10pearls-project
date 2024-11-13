import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import { Outlet } from "react-router";
import { useSearchParams } from "react-router-dom";
import { getContactById } from "../../service/ContactService";
import { useEffect, useState } from "react";

export default function Pagination(props) {
  const [totalContacts, setTotalContacts] = useState();
  const [totalPages, setTotalPages] = useState();
  const [contactsPerPage, setContactsPerPage] = useState();
  const [searchParams, setSearchParams] = useSearchParams();
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
    if (currentPage > 1) setCurrentPage(currentPage - 1);
    handlePageChange(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    handlePageChange(currentPage + 1);
  };

  const handlePageSizeChange = (event) => {
    setContactsPerPage(Number(event.target.value));
    setCurrentPage(1);
    handleSizeChange(event);
  };

  useEffect(() => {
    console.log("pagination component: " + props.paginationObject);
    if (props.paginationObject) {
      setContactsPerPage(props.paginationObject.contactsPerPage);
      setCurrentPage(props.paginationObject.currentPage);
      setTotalContacts(props.paginationObject.totalContacts);
      setTotalPages(props.paginationObject.totalPages);
    }
  }, [props.paginationObject]);

  return (
    <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          onClick={handlePrevious}
          disabled={currentPage === 1}
          className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Previous
        </button>
        <button
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Next
        </button>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            Showing{" "}
            <span className="font-medium">
              {(currentPage - 1) * contactsPerPage + 1}
            </span>{" "}
            to{" "}
            <span className="font-medium">
              {Math.min(currentPage * contactsPerPage, totalContacts)}
            </span>{" "}
            of <span className="font-medium">{totalContacts}</span> contacts
          </p>
        </div>
        <div>
          <select
            value={contactsPerPage}
            onChange={handlePageSizeChange}
            className="mr-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
          >
            {[3, 5, 10, 15].map((size) => (
              <option key={size} value={size}>
                {size} / page
              </option>
            ))}
          </select>
          <nav
            aria-label="Pagination"
            className="isolate inline-flex -space-x-px rounded-md shadow-sm"
          >
            <button
              onClick={handlePrevious}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 disabled:opacity-50"
            >
              <span className="sr-only">Previous</span>
              <ChevronLeftIcon aria-hidden="true" className="h-5 w-5" />
            </button>
            {Array.from({ length: Math.min(totalPages) }, (_, i) => i + 1).map(
              (page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                    page === currentPage
                      ? "z-10 bg-indigo-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                      : "text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {page}
                </button>
              )
            )}
            <button
              onClick={handleNext}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 disabled:opacity-50"
            >
              <span className="sr-only">Next</span>
              <ChevronRightIcon aria-hidden="true" className="h-5 w-5" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}
