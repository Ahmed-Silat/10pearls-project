import { Link } from "react-router-dom";
import ModeToggle from "../theme/ModeToggle";
import { LogoIcon } from "../icons/Icons";

/** The frame around the signed-out pages (login, signup, password reset): brand, theme toggle and a centred card. */
export default function AuthLayout({ children }) {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="absolute right-4 top-4">
        <ModeToggle />
      </div>
      <Link to="/login" className="flex items-center gap-2 self-center font-medium">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <LogoIcon className="h-4 w-4" />
        </span>
        ContactHub
      </Link>
      {children}
    </div>
  );
}
