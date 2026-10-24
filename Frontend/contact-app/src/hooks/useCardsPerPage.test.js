import { calculatePageSize, getColumns } from "./useCardsPerPage";

describe("getColumns", () => {
  test.each([
    [1920, 4],
    [1536, 4], // very wide screens: 4 cards per row next to the sidebar
    [1535, 3],
    [1280, 3],
    [1024, 3],
    [1023, 2],
    [768, 2], // the sidebar appears from here, leaving room for 2
    [640, 2],
    [639, 1],
    [375, 1],
  ])("width %ipx -> %i columns", (width, columns) => {
    expect(getColumns(width)).toBe(columns);
  });
});

describe("calculatePageSize", () => {
  // Card 245px tall; each row also has 16px card margin + 20px gap = 281px.
  const card = { cardHeight: 245 };

  test("full HD desktop fits 3 rows of 4 (pagination footer not reserved)", () => {
    expect(calculatePageSize({ width: 1920, height: 1080, gridTop: 200, ...card })).toBe(12);
  });

  test("short laptop screen fits 1 row of 3", () => {
    expect(calculatePageSize({ width: 1366, height: 657, gridTop: 200, ...card })).toBe(3);
  });

  test("tall 1440p monitor fits 4 rows of 4", () => {
    expect(calculatePageSize({ width: 2560, height: 1440, gridTop: 200, ...card })).toBe(16);
  });

  test("portrait tablet fits 3 rows of 2", () => {
    expect(calculatePageSize({ width: 800, height: 1280, gridTop: 250, ...card })).toBe(6);
  });

  test("always shows at least one full row", () => {
    expect(calculatePageSize({ width: 1440, height: 400, gridTop: 200, ...card })).toBe(3);
  });

  test("phones get at least 4 cards per page", () => {
    expect(calculatePageSize({ width: 375, height: 667, gridTop: 300, ...card })).toBe(4);
  });

  test("taller cards mean fewer rows", () => {
    expect(calculatePageSize({ width: 1920, height: 1080, gridTop: 200, cardHeight: 400 })).toBe(4);
  });
});
