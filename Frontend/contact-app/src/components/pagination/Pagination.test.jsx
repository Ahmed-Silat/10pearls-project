import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import Pagination from "./Pagination";

const renderPagination = (props = {}) => {
  const handlers = { onPageChange: jest.fn(), onPageSizeChange: jest.fn() };
  render(
    <Pagination
      currentPage={1}
      totalPages={5}
      totalContacts={42}
      pageSize={10}
      pageSizeOptions={[3, 5, 10, 15]}
      {...handlers}
      {...props}
    />
  );
  return handlers;
};

const pageButtons = () =>
  screen.queryAllByRole("button", { name: /^Page \d+$/ }).map((b) => b.textContent);

test("shows the range of contacts on the current page", () => {
  renderPagination({ currentPage: 2 });
  expect(screen.getByText(/Showing/)).toHaveTextContent("Showing 11–20 of 42 contacts");
});

test("shows the last page's range correctly", () => {
  renderPagination({ currentPage: 5 });
  expect(screen.getByText(/Showing/)).toHaveTextContent("Showing 41–42 of 42 contacts");
});

test("renders nothing when there are no contacts", () => {
  const { container } = render(
    <Pagination
      currentPage={1}
      totalPages={0}
      totalContacts={0}
      pageSize={10}
      pageSizeOptions={[10]}
      onPageChange={() => {}}
      onPageSizeChange={() => {}}
    />
  );
  expect(container).toBeEmptyDOMElement();
});

test("hides the page buttons when everything fits on one page", () => {
  renderPagination({ totalPages: 1, totalContacts: 4 });
  expect(screen.queryByRole("navigation", { name: "Pagination" })).not.toBeInTheDocument();
  expect(screen.getByText(/Showing/)).toHaveTextContent("Showing 1–4 of 4 contacts");
});

test("keeps long page lists short with gaps", () => {
  renderPagination({ currentPage: 6, totalPages: 12, totalContacts: 120 });
  expect(pageButtons()).toEqual(["1", "5", "6", "7", "12"]);
  expect(screen.getByRole("button", { name: "Page 6" })).toHaveAttribute("aria-current", "page");
});

test("shows the first five pages when near the start", () => {
  renderPagination({ currentPage: 2, totalPages: 12, totalContacts: 120 });
  expect(pageButtons()).toEqual(["1", "2", "3", "4", "5", "12"]);
});

test("disables Previous on the first page and Next on the last page", () => {
  renderPagination({ currentPage: 1 });
  expect(screen.getByRole("button", { name: "Previous page" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Next page" })).toBeEnabled();
});

test("Next and page buttons report the page number as a number", () => {
  const { onPageChange } = renderPagination({ currentPage: 2 });

  fireEvent.click(screen.getByRole("button", { name: "Next page" }));
  expect(onPageChange).toHaveBeenLastCalledWith(3);

  fireEvent.click(screen.getByRole("button", { name: "Page 5" }));
  expect(onPageChange).toHaveBeenLastCalledWith(5);
});

test("changing the page size reports the new size as a number", () => {
  const { onPageSizeChange } = renderPagination();
  fireEvent.change(screen.getByLabelText("Contacts per page"), { target: { value: "5" } });
  expect(onPageSizeChange).toHaveBeenCalledWith(5);
});
