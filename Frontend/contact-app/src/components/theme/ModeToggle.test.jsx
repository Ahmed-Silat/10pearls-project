import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider, THEME_STORAGE_KEY } from "./theme-provider";
import ModeToggle from "./ModeToggle";

afterEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove("light", "dark");
});

const renderToggle = () =>
  render(
    <ThemeProvider>
      <ModeToggle />
    </ThemeProvider>
  );

const choose = async (user, label) => {
  await user.click(screen.getByRole("button", { name: "Change theme" }));
  await user.click(screen.getByRole("menuitemradio", { name: label }));
};

test("follows the system theme by default", () => {
  renderToggle();
  // The test browser reports a light system theme.
  expect(document.documentElement).toHaveClass("light");
});

test("switching to dark puts the dark class on the page and remembers it", async () => {
  const user = userEvent.setup();
  renderToggle();

  await choose(user, "Dark");

  expect(document.documentElement).toHaveClass("dark");
  expect(document.documentElement).not.toHaveClass("light");
  expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
});

test("a remembered choice is used on the next visit", () => {
  localStorage.setItem(THEME_STORAGE_KEY, "dark");
  renderToggle();
  expect(document.documentElement).toHaveClass("dark");
});
