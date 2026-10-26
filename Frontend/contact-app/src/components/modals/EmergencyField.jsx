import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/** The "Emergency contact" checkbox in the Add and Edit Contact forms. `onChange` gets true or false. */
export default function EmergencyField({ checked, onChange, className = "" }) {
  return (
    <div className={cn("flex items-start gap-3 rounded-md border p-4", className)}>
      <Checkbox
        id="emergency"
        checked={checked}
        onCheckedChange={(value) => onChange(value === true)}
        aria-describedby="emergency-hint"
      />
      <div className="grid gap-1.5 leading-none">
        <Label htmlFor="emergency" className="cursor-pointer">
          Emergency contact
        </Label>
        <p id="emergency-hint" className="text-sm text-muted-foreground">
          Listed on the Emergency page, so they&apos;re quick to find when you need them.
        </p>
      </div>
    </div>
  );
}
