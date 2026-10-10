import { useEffect, useId, useRef, useState } from "react";
import { CheckIcon, ChevronDownIcon } from "../icons/Icons";

/**
 * Styled replacement for a native <select>, whose open list can't be styled.
 * Keyboard: Enter / Space / ↑ / ↓ open it; ↑ ↓ Home End move; Enter / Space pick; Escape / Tab close.
 *
 * options: [{ value, label, icon? }]
 */
export default function Dropdown({
  label,
  prefix,
  menuTitle,
  value,
  options,
  onChange,
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const listRef = useRef(null);
  const id = useId();

  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value)
  );
  const selected = options[selectedIndex];
  const SelectedIcon = selected?.icon;

  const openMenu = () => {
    setActiveIndex(selectedIndex);
    setOpen(true);
  };

  const closeMenu = ({ focusButton = true } = {}) => {
    setOpen(false);
    if (focusButton) buttonRef.current?.focus();
  };

  const choose = (index) => {
    const option = options[index];
    if (option && option.value !== value) onChange(option.value);
    closeMenu();
  };

  // Close when clicking anywhere outside the dropdown.
  useEffect(() => {
    if (!open) return undefined;
    const handleMouseDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [open]);

  // Move keyboard focus into the list when it opens.
  useEffect(() => {
    if (open) listRef.current?.focus();
  }, [open]);

  const handleButtonKeyDown = (event) => {
    if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
      event.preventDefault();
      openMenu();
    }
  };

  const handleListKeyDown = (event) => {
    const last = options.length - 1;
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setActiveIndex((index) => Math.min(last, index + 1));
        break;
      case "ArrowUp":
        event.preventDefault();
        setActiveIndex((index) => Math.max(0, index - 1));
        break;
      case "Home":
        event.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        event.preventDefault();
        setActiveIndex(last);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        choose(activeIndex);
        break;
      case "Escape":
        event.preventDefault();
        closeMenu();
        break;
      case "Tab":
        closeMenu({ focusButton: false });
        break;
      default:
        break;
    }
  };

  const optionId = (index) => `${id}-option-${index}`;

  return (
    // min-w-0 lets the dropdown shrink inside a flex row instead of forcing the row wider.
    <div ref={rootRef} className={`relative min-w-0 ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        onClick={() => (open ? closeMenu({ focusButton: false }) : openMenu())}
        onKeyDown={handleButtonKeyDown}
        className={`flex h-10 w-full items-center gap-2.5 rounded-xl border bg-white pl-3.5 pr-3 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/30 ${
          open ? "border-sky-500 ring-2 ring-sky-500/20" : "border-slate-300"
        }`}
      >
        {SelectedIcon && <SelectedIcon className="h-4 w-4 flex-shrink-0 text-sky-600" />}
        <span className="flex-1 truncate text-left">
          {prefix && <span className="mr-1 font-normal text-slate-400">{prefix}</span>}
          {selected?.label}
        </span>
        <ChevronDownIcon
          className={`h-3.5 w-3.5 flex-shrink-0 text-slate-400 transition-transform duration-200 ${
            open ? "rotate-180 text-sky-600" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 z-30 mt-2 w-full min-w-[13rem] max-w-[calc(100vw-2rem)] origin-top-left animate-[fadeIn_0.15s_ease-out] overflow-hidden rounded-xl bg-white p-1.5 shadow-xl ring-1 ring-slate-200">
          {menuTitle && (
            <p className="px-3 pb-1.5 pt-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              {menuTitle}
            </p>
          )}
          <ul
            ref={listRef}
            role="listbox"
            tabIndex={-1}
            aria-label={label}
            aria-activedescendant={optionId(activeIndex)}
            onKeyDown={handleListKeyDown}
            className="focus:outline-none"
          >
            {options.map((option, index) => {
              const isSelected = index === selectedIndex;
              const isActive = index === activeIndex;
              const Icon = option.icon;
              return (
                <li
                  key={option.value}
                  id={optionId(index)}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setActiveIndex(index)}
                  // Keep focus in the list so the click isn't treated as "outside".
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => choose(index)}
                  className={`flex cursor-pointer select-none items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                    isActive ? "bg-sky-50 text-sky-700" : "text-slate-700"
                  } ${isSelected ? "font-semibold" : "font-medium"}`}
                >
                  {Icon && (
                    <Icon
                      className={`h-4 w-4 flex-shrink-0 ${
                        isSelected || isActive ? "text-sky-600" : "text-slate-400"
                      }`}
                    />
                  )}
                  <span className="flex-1">{option.label}</span>
                  {isSelected && <CheckIcon className="h-3.5 w-3.5 flex-shrink-0 text-sky-600" />}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
