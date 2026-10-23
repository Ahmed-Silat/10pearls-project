import { Link } from "react-router-dom";
import { HomeIcon, LostIcon } from "../icons/Icons";

/** Shown for any URL that doesn't match a route. Points signed-in users home and everyone else to login. */
export default function NotFound() {
  const isLoggedIn = Boolean(localStorage.getItem("userData"));

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-sky-50 to-slate-200 p-4">
      <div className="w-full max-w-md animate-[popIn_0.25s_ease-out] rounded-3xl bg-white p-8 text-center shadow-2xl sm:p-12">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-600 to-cyan-700 text-white shadow-lg shadow-sky-600/25">
          <LostIcon className="h-8 w-8" />
        </div>
        <p className="bg-gradient-to-r from-sky-600 to-cyan-700 bg-clip-text text-6xl font-extrabold tracking-tight text-transparent">
          404
        </p>
        <h1 className="mt-3 text-2xl font-bold text-slate-800">Page not found</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          The page you're looking for doesn't exist or may have been moved.
        </p>
        <Link
          to={isLoggedIn ? "/" : "/login"}
          replace
          className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 py-2.5 text-sm font-bold uppercase tracking-wide text-white shadow-lg shadow-sky-600/25 transition-all duration-200 hover:bg-sky-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
        >
          <HomeIcon className="h-4 w-4" />
          {isLoggedIn ? "Back to contacts" : "Go to login"}
        </Link>
      </div>
    </div>
  );
}
