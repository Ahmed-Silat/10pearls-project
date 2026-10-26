import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import LabelWithInput from "../label-and-inputs/LabelWithInput";
import TagPicker from "../tags/TagPicker";
import ContactDetailRows from "./ContactDetailRows";
import EmergencyField from "./EmergencyField";
import { todayIso } from "../../lib/birthday";

const NOTES_MAX = 2000;
/** The notes counter only appears near the limit, so it doesn't clutter the form. */
const NOTES_COUNTER_FROM = 1500;

const Optional = () => <span className="ml-1 font-normal text-muted-foreground">(optional)</span>;

/**
 * Every field of the Add and Edit Contact forms (the form state is described in ./contactForm.js). `onChange`
 * gets the field name and its new value; `onPhoneOrEmailBlur` runs the duplicate check.
 */
export default function ContactFormFields({ form, errors, onChange, onPhoneOrEmailBlur, disabled = false }) {
  const set = (field) => (event) => onChange(field, event.target.value);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <LabelWithInput
        htmlFor="firstName"
        labelName="First Name"
        inputType="text"
        inputId="firstName"
        placeholder="Enter first name"
        value={form.firstName}
        onChange={set("firstName")}
        error={errors.firstName}
      />

      <LabelWithInput
        htmlFor="lastName"
        labelName="Last Name"
        optional
        inputType="text"
        inputId="lastName"
        placeholder="Enter last name"
        value={form.lastName}
        onChange={set("lastName")}
        error={errors.lastName}
      />

      <div className="grid gap-2 sm:col-span-2">
        <LabelWithInput
          htmlFor="phone"
          labelName="Phone No"
          inputType="text"
          inputId="phone"
          placeholder="Enter phone no"
          value={form.phoneNo}
          onChange={set("phoneNo")}
          onBlur={onPhoneOrEmailBlur}
          error={errors.phoneNo}
        />
        <ContactDetailRows
          kind="phone"
          rows={form.additionalPhones}
          onChange={(rows) => onChange("additionalPhones", rows)}
          errors={errors}
          disabled={disabled}
        />
      </div>

      <div className="grid gap-2 sm:col-span-2">
        <LabelWithInput
          htmlFor="email"
          labelName="Email Address"
          optional
          inputType="text"
          inputId="email"
          placeholder="Enter email"
          value={form.email}
          onChange={set("email")}
          onBlur={onPhoneOrEmailBlur}
          error={errors.email}
        />
        <ContactDetailRows
          kind="email"
          rows={form.additionalEmails}
          onChange={(rows) => onChange("additionalEmails", rows)}
          errors={errors}
          disabled={disabled}
        />
      </div>

      <LabelWithInput
        htmlFor="company"
        labelName="Company"
        optional
        inputType="text"
        inputId="company"
        placeholder="Enter company"
        value={form.company}
        onChange={set("company")}
        error={errors.company}
      />

      <LabelWithInput
        htmlFor="birthday"
        labelName="Birthday"
        optional
        inputType="date"
        inputId="birthday"
        value={form.birthday}
        onChange={set("birthday")}
        error={errors.birthday}
        inputProps={{ min: "1900-01-01", max: todayIso() }}
      />

      <LabelWithInput
        htmlFor="address"
        labelName="Address"
        optional
        inputType="text"
        inputId="address"
        placeholder="Enter address"
        value={form.address}
        onChange={set("address")}
        error={errors.address}
        className="sm:col-span-2"
      />

      <div className="grid gap-2 sm:col-span-2">
        <Label htmlFor="notes" className={cn(errors.notes && "text-destructive")}>
          Notes <Optional />
        </Label>
        <Textarea
          id="notes"
          rows={3}
          placeholder="Anything worth remembering: how you met, their kids' names..."
          value={form.notes}
          onChange={set("notes")}
          maxLength={NOTES_MAX}
          aria-invalid={errors.notes ? true : undefined}
          aria-describedby={errors.notes ? "notes-error" : undefined}
          className={cn("resize-y", errors.notes && "border-destructive focus-visible:ring-destructive")}
        />
        {form.notes.length >= NOTES_COUNTER_FROM && (
          <p className="text-right text-xs text-muted-foreground">
            {form.notes.length} / {NOTES_MAX}
          </p>
        )}
        {errors.notes && (
          <p id="notes-error" className="text-[0.8rem] font-medium text-destructive">
            {errors.notes}
          </p>
        )}
      </div>

      <div className="grid gap-2 sm:col-span-2">
        <Label htmlFor="tags">
          Tags <Optional />
        </Label>
        <TagPicker id="tags" value={form.tagIds} onChange={(tagIds) => onChange("tagIds", tagIds)} disabled={disabled} />
      </div>

      <EmergencyField
        checked={form.emergency}
        onChange={(checked) => onChange("emergency", checked)}
        className="sm:col-span-2"
      />
    </div>
  );
}
