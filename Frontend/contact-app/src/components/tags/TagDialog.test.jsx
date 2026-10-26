import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import TagDialog from "./TagDialog";
import { createTag, updateTag } from "../../service/TagService";

vi.mock("../../service/TagService", async (importOriginal) => ({
  ...(await importOriginal()),
  createTag: vi.fn(),
  updateTag: vi.fn(),
}));

const nameField = () => screen.getByLabelText(/^Name/);

test("creates a tag with the chosen name and colour", async () => {
  createTag.mockResolvedValue({ id: 3, name: "Work", color: "violet" });
  const onSaved = vi.fn();
  const onClose = vi.fn();
  render(<TagDialog onClose={onClose} onSaved={onSaved} />);

  fireEvent.change(nameField(), { target: { value: "  Work  " } });
  fireEvent.click(screen.getByRole("radio", { name: "Violet" }));
  fireEvent.click(screen.getByRole("button", { name: "Create tag" }));

  await waitFor(() => expect(createTag).toHaveBeenCalledWith("Work", "violet"));
  expect(onSaved).toHaveBeenCalledWith({ id: 3, name: "Work", color: "violet" });
  expect(onClose).toHaveBeenCalled();
});

test("asks for a name before saving", () => {
  render(<TagDialog onClose={vi.fn()} />);

  fireEvent.click(screen.getByRole("button", { name: "Create tag" }));

  expect(screen.getByText("Give the tag a name")).toBeInTheDocument();
  expect(createTag).not.toHaveBeenCalled();
});

test("editing starts from the tag's name and colour, and saves the changes", async () => {
  updateTag.mockResolvedValue({ id: 1, name: "Close family", color: "green" });
  render(<TagDialog tag={{ id: 1, name: "Family", color: "green" }} onClose={vi.fn()} />);

  expect(nameField()).toHaveValue("Family");
  expect(screen.getByRole("radio", { name: "Green" })).toHaveAttribute("aria-checked", "true");

  fireEvent.change(nameField(), { target: { value: "Close family" } });
  fireEvent.click(screen.getByRole("button", { name: "Save" }));

  await waitFor(() => expect(updateTag).toHaveBeenCalledWith(1, "Close family", "green"));
});

test("shows the server's message when the name is taken", async () => {
  createTag.mockRejectedValue({ response: { status: 409, data: { message: 'You already have a tag called "Work"' } } });
  render(<TagDialog onClose={vi.fn()} />);

  fireEvent.change(nameField(), { target: { value: "work" } });
  fireEvent.click(screen.getByRole("button", { name: "Create tag" }));

  expect(await screen.findByText('You already have a tag called "Work"')).toBeInTheDocument();
});
