import { render } from "@testing-library/react";
import { pageTitle, useDocumentTitle } from "./useDocumentTitle";

function Page({ title }) {
  useDocumentTitle(title);
  return null;
}

test("pageTitle adds the app name", () => {
  expect(pageTitle("Profile")).toBe("Profile · ContactHub");
  expect(pageTitle()).toBe("ContactHub");
});

test("sets the tab title while the page is open, follows changes, and puts the old one back after", () => {
  document.title = "ContactHub";

  const { rerender, unmount } = render(<Page title="Tag" />);
  expect(document.title).toBe("Tag · ContactHub");

  rerender(<Page title="Family" />);
  expect(document.title).toBe("Family · ContactHub");

  unmount();
  expect(document.title).toBe("ContactHub");
});
