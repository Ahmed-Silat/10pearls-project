import { cn } from "@/lib/utils";
import { CheckIcon, CloseIcon } from "../icons/Icons";
import { PASSWORD_RULES } from "../../validation/common";

/**
 * The password rules under a new-password field, each ticked off as it's met while the user types. With
 * `showErrors` (after a failed submit), the rules still missing turn red.
 */
export default function PasswordChecklist({ id, password, showErrors = false }) {
  return (
    <ul id={id} aria-label="What the password needs" className="grid gap-1 text-[0.8rem]">
      {PASSWORD_RULES.map((rule) => {
        const met = rule.test(password);
        const Icon = met ? CheckIcon : CloseIcon;
        return (
          <li
            key={rule.id}
            className={cn(
              "flex items-center gap-1.5 transition-colors",
              met ? "text-green-600 dark:text-green-500" : showErrors ? "text-destructive" : "text-muted-foreground"
            )}
          >
            <Icon aria-hidden="true" className="h-3.5 w-3.5 flex-shrink-0" />
            {rule.label}
            <span className="sr-only">{met ? " (done)" : " (missing)"}</span>
          </li>
        );
      })}
    </ul>
  );
}
