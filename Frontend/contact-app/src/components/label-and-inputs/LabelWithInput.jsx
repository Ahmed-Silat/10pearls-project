import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import Hint from "../ui/Hint";
import { EyeIcon, EyeOffIcon } from "../icons/Icons";

/**
 * A form field in shadcn/ui style: Label, Input and an error message underneath. Optional fields say so in the
 * label; password fields get a show/hide button. Place several in a `grid gap-4` (no outer margin here).
 * `inputProps` are passed on to the input (e.g. `max` for a date).
 */
export default function LabelWithInput(props) {
  const {
    htmlFor,
    labelName,
    inputType = "text",
    inputId,
    placeholder,
    onChange,
    onBlur,
    value,
    className = "",
    error,
    optional = false,
    inputProps = {},
  } = props;

  const isPassword = inputType === "password";
  const [visible, setVisible] = useState(false);
  const fieldType = isPassword && visible ? "text" : inputType;
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <div className={cn("grid gap-2", className)}>
      <Label htmlFor={htmlFor} className={cn(error && "text-destructive")}>
        {labelName}
        {optional && <span className="ml-1 font-normal text-muted-foreground">(optional)</span>}
      </Label>
      <div className="relative">
        <Input
          {...inputProps}
          type={fieldType}
          id={inputId}
          value={value}
          placeholder={placeholder}
          onChange={onChange}
          onBlur={onBlur}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          className={cn(error && "border-destructive focus-visible:ring-destructive", isPassword && "pr-10")}
        />
        {isPassword && (
          <Hint label={visible ? "Hide password" : "Show password"}>
            <button
              type="button"
              onClick={() => setVisible((v) => !v)}
              aria-label={visible ? "Hide password" : "Show password"}
              className="absolute right-0 top-0 flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none"
            >
              {visible ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
            </button>
          </Hint>
        )}
      </div>
      {error && (
        <p id={errorId} className="text-[0.8rem] font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
