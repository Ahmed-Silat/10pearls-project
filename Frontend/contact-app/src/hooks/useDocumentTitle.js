import { useEffect } from "react";

export const APP_NAME = "ContactHub";

/** "Favorites · ContactHub", or just "ContactHub" without a page title. */
export const pageTitle = (title) => (title ? `${title} · ${APP_NAME}` : APP_NAME);

/**
 * Sets the browser tab's title while the calling page is open, so several open tabs can be told apart. The
 * previous title comes back when the page closes.
 */
export function useDocumentTitle(title) {
  useEffect(() => {
    const previous = document.title;
    document.title = pageTitle(title);
    return () => {
      document.title = previous;
    };
  }, [title]);
}
