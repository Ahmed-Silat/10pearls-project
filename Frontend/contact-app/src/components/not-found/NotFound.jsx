import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { HomeIcon } from "../icons/Icons";

/** Shown for any URL that doesn't match a route. Points signed-in users home and everyone else to login. */
export default function NotFound() {
  const isLoggedIn = Boolean(localStorage.getItem("userData"));

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 text-center">
      <p className="text-6xl font-bold tracking-tight">404</p>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">Page not found</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or may have been moved.
      </p>
      <Button asChild className="mt-6">
        <Link to={isLoggedIn ? "/" : "/login"} replace>
          <HomeIcon />
          {isLoggedIn ? "Back to contacts" : "Go to login"}
        </Link>
      </Button>
    </div>
  );
}
