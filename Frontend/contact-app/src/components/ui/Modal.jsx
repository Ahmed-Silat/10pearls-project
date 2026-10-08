import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export default function Modal(props) {
  const { onClose } = props;
  const panelRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
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