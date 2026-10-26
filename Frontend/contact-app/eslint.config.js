import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

export default [
  { ignores: ["build", "node_modules"] },
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { "react-hooks": reactHooks, "react-refresh": reactRefresh },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      // Capitalised names are JSX components (e.g. { Icon } in a .map), which this rule can't see being used.
      "no-unused-vars": ["warn", { varsIgnorePattern: "^[A-Z_]", argsIgnorePattern: "^(_|[A-Z])" }],
      // Off, as under Create React App: several files (and the shadcn/ui ones) export helpers next to components.
      "react-refresh/only-export-components": "off",
    },
  },
  {
    // Tests use Vitest's globals (test, expect, vi, ...).
    files: ["**/*.test.{js,jsx}", "src/setupTests.js"],
    languageOptions: { globals: { ...globals.vitest } },
  },
];
