import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import NotFound from "./NotFound";

const renderNotFound = () =>
  render(
    <MemoryRouter>
      <NotFound />
    </MemoryRouter>
  );

afterEach(() => localStorage.clear());

test("sends signed-in users back to their contacts", () => {
  localStorage.setItem("userData", JSON.stringify({ token: "t" }));
  renderNotFound();

  expect(screen.getByRole("heading", { name: "Page not found" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /back to contacts/i })).toHaveAttribute("href", "/");
});

test("sends signed-out users to the login page", () => {
  renderNotFound();

  expect(screen.getByRole("link", { name: /go to login/i })).toHaveAttribute("href", "/login");
});
