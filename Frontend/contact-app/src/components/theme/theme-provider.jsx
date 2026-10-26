import { createContext, useContext, useEffect, useState } from "react";

/** localStorage key for the chosen theme. index.html reads the same key to avoid a flash on load. */
export const THEME_STORAGE_KEY = "contacthub-theme";

const ThemeContext = createContext({ theme: "system", resolvedTheme: "light", setTheme: () => {} });

const readStoredTheme = () => {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return ["light", "dark", "system"].includes(stored) ? stored : null;
  } catch {
    return null; // storage blocked (e.g. private mode): fall back to the default
  }
};

const systemPrefersDark = () => window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;

/**
 * Light / dark / system theme, as in shadcn/ui's Vite guide. Puts the `light` or `dark` class on <html>, which
 * switches the CSS variables in index.css, and remembers the choice in localStorage.
 */
export function ThemeProvider({ children, defaultTheme = "system" }) {
  const [theme, setThemeState] = useState(() => readStoredTheme() ?? defaultTheme);
  const [systemDark, setSystemDark] = useState(systemPrefersDark);

  // Follow the operating system when the theme is "system".
  useEffect(() => {
    const query = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!query) return undefined;
    const onChange = (event) => setSystemDark(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  const resolvedTheme = theme === "system" ? (systemDark ? "dark" : "light") : theme;

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(resolvedTheme);
    root.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);

  const setTheme = (next) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Not remembered across visits, but still applied now.
    }
    setThemeState(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>{children}</ThemeContext.Provider>
  );
}

/** `{ theme, resolvedTheme, setTheme }`: theme is "light" | "dark" | "system"; resolvedTheme is what's showing. */
export const useTheme = () => useContext(ThemeContext);
