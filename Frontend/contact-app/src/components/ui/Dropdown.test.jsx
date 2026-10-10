import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import Dropdown from "./Dropdown";

const OPTIONS = [
  { value: "A-Z", label: "Name (A–Z)" },
  { value: "Z-A", label: "Name (Z–A)" },
];

const renderDropdown = (value = "A-Z") => {
  const onChange = jest.fn();
  render(
    <div>
      <Dropdown label="Sort contacts" prefix="Sort:" value={value} options={OPTIONS} onChange={onChange} />
      <p>Somewhere else</p>
    </div>
  );
  return onChange;
};

const trigger = () => screen.getByRole("button", { name: "Sort contacts" });

test("shows the selected option on the button and starts closed", () => {
  renderDropdown("Z-A");
  expect(trigger()).toHaveTextContent("Sort:Name (Z–A)");
  expect(trigger()).toHaveAttribute("aria-expanded", "false");
  expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
});

test("opens on click and marks the selected option", () => {
  renderDropdown("A-Z");
  fireEvent.click(trigger());

  expect(trigger()).toHaveAttribute("aria-expanded", "true");
  expect(screen.getByRole("option", { name: "Name (A–Z)" })).toHaveAttribute("aria-selected", "true");
  expect(screen.getByRole("option", { name: "Name (Z–A)" })).toHaveAttribute("aria-selected", "false");
});

test("clicking an option reports it and closes the menu", () => {
  const onChange = renderDropdown("A-Z");
  fireEvent.click(trigger());
  fireEvent.click(screen.getByRole("option", { name: "Name (Z–A)" }));

  expect(onChange).toHaveBeenCalledWith("Z-A");
  expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  expect(trigger()).toHaveFocus();
});

test("choosing the already-selected option doesn't report a change", () => {
  const onChange = renderDropdown("A-Z");
  fireEvent.click(trigger());
  fireEvent.click(screen.getByRole("option", { name: "Name (A–Z)" }));
  expect(onChange).not.toHaveBeenCalled();
});

test("works with the keyboard: arrow down, then Enter", () => {
  const onChange = renderDropdown("A-Z");
  fireEvent.keyDown(trigger(), { key: "ArrowDown" });

  const list = screen.getByRole("listbox");
  expect(list).toHaveFocus();
  fireEvent.keyDown(list, { key: "ArrowDown" });
  fireEvent.keyDown(list, { key: "Enter" });

  expect(onChange).toHaveBeenCalledWith("Z-A");
});

test("Escape closes the menu without changing anything", () => {
  const onChange = renderDropdown();
  fireEvent.click(trigger());
  fireEvent.keyDown(screen.getByRole("listbox"), { key: "Escape" });

  expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  expect(onChange).not.toHaveBeenCalled();
});

test("clicking outside closes the menu", () => {
  renderDropdown();
  fireEvent.click(trigger());
  fireEvent.mouseDown(screen.getByText("Somewhere else"));

  expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
});
