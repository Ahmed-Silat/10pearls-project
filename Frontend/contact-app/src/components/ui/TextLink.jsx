import { Link } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Router link styled as a shadcn/ui link button, which can be disabled (e.g. while a form is submitting).
 * Anchors have no native `disabled`, so it is taken out of the tab order, made unclickable and marked aria-disabled.
 */
export default function TextLink({ to, disabled = false, className = "", children }) {
  return (
    <Link
      to={to}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : undefined}
      onClick={disabled ? (event) => event.preventDefault() : undefined}
      className={cn(
        buttonVariants({ variant: "link" }),
        "h-auto p-0",
        disabled && "pointer-events-none cursor-not-allowed opacity-50",
        className
      )}
    >
      {children}
    </Link>
  );
}
