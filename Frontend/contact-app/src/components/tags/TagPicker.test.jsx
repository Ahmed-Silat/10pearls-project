import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import TagPicker from "./TagPicker";
import { TagsProvider } from "./TagsProvider";
import { createTag, getTags } from "../../service/TagService";

vi.mock("../../service/TagService", async (importOriginal) => ({
  ...(await importOriginal()),
  getTags: vi.fn(),
  createTag: vi.fn(),
}));

const FAMILY = { id: 1, name: "Family", color: "green", contactCount: 2 };
const WORK = { id: 2, name: "Work", color: "blue", contactCount: 5 };

/** A form field holding the picked tag ids, so the picker behaves as it does in the real forms. */
function Field({ initial = [], onChange = () => {} }) {
  const [value, setValue] = useState(initial);
  return (
    <TagPicker
      id="tags"
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange(next);
      }}
    />
  );
}

const renderPicker = (props) =>
  render(
    <TagsProvider>
      <Field {...props} />
    </TagsProvider>
  );

beforeEach(() => getTags.mockResolvedValue([FAMILY, WORK]));

test("shows the picked tags on the button", async () => {
  renderPicker({ initial: [2] });
  expect(await screen.findByText("Work")).toBeInTheDocument();
  expect(screen.queryByText("Family")).not.toBeInTheDocument();
});

test("picking a tag adds it, and picking it again removes it", async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  renderPicker({ onChange });
  await waitFor(() => expect(getTags).toHaveBeenCalled());

  await user.click(screen.getByRole("combobox"));
  await user.click(await screen.findByRole("option", { name: /Family/ }));
  expect(onChange).toHaveBeenLastCalledWith([1]);

  await user.click(screen.getByRole("option", { name: /Family/ }));
  expect(onChange).toHaveBeenLastCalledWith([]);
});

test("typing a new name offers to create the tag, and picks it", async () => {
  const user = userEvent.setup();
  createTag.mockResolvedValue({ id: 9, name: "Gym buddies", color: "teal", contactCount: 0 });
  const onChange = vi.fn();
  renderPicker({ onChange });
  await waitFor(() => expect(getTags).toHaveBeenCalled());

  await user.click(screen.getByRole("combobox"));
  await user.type(screen.getByPlaceholderText("Search or create a tag..."), "Gym buddies");
  await user.click(await screen.findByRole("option", { name: /Create .Gym buddies./ }));

  await waitFor(() => expect(createTag).toHaveBeenCalledWith("Gym buddies", expect.any(String)));
  expect(onChange).toHaveBeenLastCalledWith([9]);
});

test("doesn't offer to create a tag that already exists (ignoring case)", async () => {
  const user = userEvent.setup();
  renderPicker();
  await waitFor(() => expect(getTags).toHaveBeenCalled());

  await user.click(screen.getByRole("combobox"));
  await user.type(screen.getByPlaceholderText("Search or create a tag..."), "family");

  expect(screen.queryByRole("option", { name: /Create/ })).not.toBeInTheDocument();
  expect(screen.getByRole("option", { name: /Family/ })).toBeInTheDocument();
});
