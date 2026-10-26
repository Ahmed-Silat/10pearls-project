# ContactHub frontend

React app for ContactHub, built with [Vite](https://vite.dev), [Tailwind CSS](https://tailwindcss.com) and
[shadcn/ui](https://ui.shadcn.com) components.

## Getting started

```bash
npm install
npm start          # dev server on http://localhost:3000 (the port the backend allows for CORS)
```

The app talks to the backend at `http://localhost:8080` by default. To use another URL, set it in a `.env`
file in this folder:

```bash
VITE_API_URL=https://api.example.com
```

## Scripts

| Command | What it does |
|---|---|
| `npm start` / `npm run dev` | Starts the dev server on port 3000 |
| `npm test` | Runs the tests with Vitest in watch mode (`npx vitest run` for a single run) |
| `npm run build` | Builds the app into `build/` |
| `npm run preview` | Serves the production build locally |
| `npm run lint` | Checks the code with ESLint |

## UI components

The shared components in `src/components/ui/` with lower-case file names (`button.jsx`, `dialog.jsx`, ...) come
from shadcn/ui. They are part of this codebase, so they can be edited freely. A few already have small changes
for this app, such as the `loading` prop on `Button` and the `warning` style on `Alert`.

To add another component (this project uses Tailwind CSS v3, so use shadcn CLI 2.3.0):

```bash
npx shadcn@2.3.0 add tooltip
```

The theme colours (shadcn's neutral zinc palette, in light and dark versions) are CSS variables in
`src/index.css`. The light/dark/system toggle is `src/components/theme/ModeToggle.jsx`; the choice is saved in
the browser. The signed-in layout uses shadcn's Sidebar (`src/components/sidebar/Sidebar.jsx`, collapses with
<kbd>Ctrl</kbd>+<kbd>B</kbd>) and the top bar in `src/components/header/Header.jsx`.
