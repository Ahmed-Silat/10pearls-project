import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import PublicOnlyRoutes from "./PublicOnlyRoutes";

const renderAt = (path) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<PublicOnlyRoutes />}>
          <Route path="/login" element={<p>Login page</p>} />
        </Route>
        <Route path="/" element={<p>Contacts page</p>} />
      </Routes>
    </MemoryRouter>
  );

afterEach(() => localStorage.clear());

test("shows the login page to signed-out visitors", () => {
  renderAt("/login");
  expect(screen.getByText("Login page")).toBeInTheDocument();
});

test("sends signed-in users to their contacts", () => {
  localStorage.setItem("userData", JSON.stringify({ token: "t" }));
  renderAt("/login");
  expect(screen.getByText("Contacts page")).toBeInTheDocument();
});
