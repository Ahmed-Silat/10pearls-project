import { useState } from "react";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa6";

export default function LabelWithInput(props) {
  const {
    htmlFor,
    labelName,
    inputType = "text",
    inputId,
    placeholder,
    onChange,
    value,
    className = "",
    error,
    optional = false,
  } = props;

  const isPassword = inputType === "password";
  const [visible, setVisible] = useState(false);
  const fieldType = isPassword && visible ? "text" : inputType;

  return (
    <div className={`my-3 ${className}`}>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
      >
        {labelName}
        {!optional && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      <div className="relative">
        <input
          type={fieldType}
          id={inputId}
          value={value}
          placeholder={placeholder}
          onChange={onChange}
          className={`w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 ${
            error
              ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
              : "border-slate-300 focus:border-sky-500 focus:ring-sky-500/20"
          } ${isPassword ? "pr-10" : ""}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Hide password" : "Show password"}
            title={visible ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors duration-200 hover:text-sky-600 focus:outline-none disabled:cursor-not-allowed disabled:hover:text-slate-400"
          >
            {visible ? (
              <FaRegEyeSlash className="h-4 w-4" />
            ) : (
              <FaRegEye className="h-4 w-4" />
            )}
          </button>
        )}
      </div>
      {error && (
        <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-600">
          <span
            aria-hidden="true"
            className="inline-block h-1 w-1 flex-shrink-0 rounded-full bg-red-500"
          />
          {error}
        </p>
      )}
    </div>
  );
}