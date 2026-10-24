import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Tab from the last control goes back to the first, and Shift+Tab from the first goes to the last, so keyboard
 * focus never wanders onto the page behind the modal.
 */
function keepFocusInside(event, panel) {
  if (!panel) return;
  const focusable = [...panel.querySelectorAll(FOCUSABLE)];
  if (focusable.length === 0) {
    event.preventDefault();
    return;
  }
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const active = document.activeElement;
  if (event.shiftKey && (active === first || !panel.contains(active))) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && (active === last || !panel.contains(active))) {
    event.preventDefault();
    first.focus();
  }
}

export default function Modal(props) {
  const { onClose } = props;
  const panelRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
      if (event.key === "Tab") keepFocusInside(event, panelRef.current);
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const panel = panelRef.current;
      const autofocus = panel?.querySelector("[data-autofocus]");
      (autofocus || panel?.querySelector("input, select, textarea, button"))?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  return createPortal(
    <div
      className="fixed inset-0 z-40 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby={props.titleId}
    >
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
        onClick={props.onClose}
      />
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div
          ref={panelRef}
          className={`relative inline-block w-full align-bottom bg-white rounded-2xl shadow-2xl text-left transition-all transform animate-[popIn_0.25s_ease-out] sm:my-8 ${props.panelClassName || "sm:max-w-lg"}`}
        >
          {props.children}
        </div>
      </div>
    </div>,
    document.body
  );
}