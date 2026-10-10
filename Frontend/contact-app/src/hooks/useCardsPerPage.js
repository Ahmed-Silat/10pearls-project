import { useCallback, useLayoutEffect, useState } from "react";

// Must match the contact grid's Tailwind classes:
// grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5, and each card's my-2.
const COLUMN_BREAKPOINTS = [
  { minWidth: 1024, columns: 4 }, // lg
  { minWidth: 768, columns: 3 }, // md
  { minWidth: 640, columns: 2 }, // sm
];
const ROW_GAP = 20; // gap-5
const CARD_MARGIN_Y = 16; // my-2 above + below each card
const CARD_HEIGHT_ESTIMATE = 295; // used until a real card can be measured
const SPACE_BELOW_GRID = 136; // pagination footer (mt-8 + bar) + page bottom padding
const MIN_CARDS_ON_PHONES = 4; // a phone screen fits ~1–2 cards; that many pages would be unusable

export const getColumns = (width) =>
  COLUMN_BREAKPOINTS.find((bp) => width >= bp.minWidth)?.columns ?? 1;

/**
 * How many cards fit on screen: columns for this width × complete rows that fit
 * between the top of the grid and the pagination footer.
 */
export const calculatePageSize = ({ width, height, gridTop, cardHeight = CARD_HEIGHT_ESTIMATE }) => {
  const columns = getColumns(width);
  const rowHeight = cardHeight + CARD_MARGIN_Y + ROW_GAP;
  const available = height - gridTop - SPACE_BELOW_GRID + ROW_GAP; // the last row needs no gap below
  const rows = Math.max(1, Math.floor(available / rowHeight));
  const pageSize = columns * rows;
  return columns === 1 ? Math.max(pageSize, MIN_CARDS_ON_PHONES) : pageSize;
};

/**
 * Number of contact cards that fit the screen, recalculated when the window is resized.
 * `gridRef` points at the element where the card grid starts; its first card is measured
 * for the real card height. `ready` turns true once the first measurement is done.
 */
export function useCardsPerPage(gridRef) {
  const [pageSize, setPageSize] = useState(null);

  const measure = useCallback(() => {
    const grid = gridRef.current;
    const firstCard = grid?.querySelector("[data-contact-card]");
    const next = calculatePageSize({
      width: window.innerWidth,
      height: window.innerHeight,
      // Position from the top of the page, so the result doesn't depend on the scroll position.
      gridTop: grid ? grid.getBoundingClientRect().top + window.scrollY : 0,
      cardHeight: firstCard?.offsetHeight || CARD_HEIGHT_ESTIMATE,
    });
    setPageSize((current) => (current === next ? current : next));
  }, [gridRef]);

  // Measure before the first paint, so the first request already uses the right size.
  useLayoutEffect(() => {
    measure();
    let timer;
    const handleResize = () => {
      clearTimeout(timer);
      timer = setTimeout(measure, 150);
    };
    window.addEventListener("resize", handleResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", handleResize);
    };
  }, [measure]);

  return { pageSize: pageSize ?? 0, ready: pageSize !== null, remeasure: measure };
}
