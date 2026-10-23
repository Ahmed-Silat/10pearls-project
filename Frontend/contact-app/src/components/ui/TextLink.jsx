import { Link } from "react-router-dom";

/**
 * Router link that can be disabled (e.g. while a form is submitting). Anchors have no native
 * `disabled`, so it is taken out of the tab order, made unclickable and marked aria-disabled.
 */
export default function TextLink({ to, disabled = false, className = "", children }) {
  return (
    <Link
      to={to}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : undefined}
      onClick={disabled ? (event) => event.preventDefault() : undefined}
      className={`font-semibold text-sky-600 transition-colors duration-200 ${
        disabled ? "pointer-events-none cursor-not-allowed opacity-50" : "hover:text-sky-700 hover:underline"
      } ${className}`}
    >
      {children}
    </Link>
  );
}
