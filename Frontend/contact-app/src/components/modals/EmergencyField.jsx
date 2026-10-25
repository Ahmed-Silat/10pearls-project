import { EmergencyIcon } from "../icons/Icons";

/** The "Emergency contact" checkbox in the Add and Edit Contact forms. `onChange` gets true or false. */
export default function EmergencyField({ checked, onChange, className = "" }) {
  return (
    <div
      className={`my-3 flex items-start gap-3 rounded-lg border px-3.5 py-3 transition-colors ${
        checked ? "border-red-200 bg-red-50" : "border-slate-200 bg-white"
      } ${className}`}
    >
      <input
        id="emergency"
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        aria-describedby="emergency-hint"
        className="mt-0.5 h-4 w-4 flex-shrink-0 cursor-pointer rounded border-slate-300 text-red-600 accent-red-600 focus:ring-red-500"
      />
      <div className="min-w-0">
        <label
          htmlFor="emergency"
          className="flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-slate-800"
        >
          <EmergencyIcon className="h-3.5 w-3.5 text-red-500" aria-hidden="true" />
          Emergency contact
        </label>
        <p id="emergency-hint" className="mt-0.5 text-xs text-slate-500">
          Listed on the Emergency page, so they're quick to find when you need them.
        </p>
      </div>
    </div>
  );
}
