import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import Modal from "./Modal";

const renderModal = () =>
  render(
    <>
      <button>Behind the modal</button>
      <Modal onClose={() => {}} titleId="t">
        <h2 id="t">Title</h2>
        <button>First</button>
        <button>Last</button>
      </Modal>
    </>
  );

test("Tab on the last control wraps to the first", () => {
  renderModal();
  screen.getByText("Last").focus();

  fireEvent.keyDown(document, { key: "Tab" });

  expect(screen.getByText("First")).toHaveFocus();
});

test("Shift+Tab on the first control wraps to the last", () => {
  renderModal();
  screen.getByText("First").focus();

  fireEvent.keyDown(document, { key: "Tab", shiftKey: true });

  expect(screen.getByText("Last")).toHaveFocus();
});

test("focus that escaped to the page is pulled back into the modal", () => {
  renderModal();
  screen.getByText("Behind the modal").focus();

  fireEvent.keyDown(document, { key: "Tab" });

  expect(screen.getByText("First")).toHaveFocus();
});
