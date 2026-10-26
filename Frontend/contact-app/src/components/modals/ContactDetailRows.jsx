import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { CloseIcon, PlusIcon } from "../icons/Icons";
import Hint from "../ui/Hint";
import { DETAIL_LABELS, MAX_ADDITIONAL } from "../../validation/createContactSchema";
import { newDetailRow } from "./contactForm";

const KINDS = {
  phone: { noun: "phone number", field: "additionalPhones", newLabel: "mobile", placeholder: "Enter phone no" },
  email: { noun: "email", field: "additionalEmails", newLabel: "work", placeholder: "Enter email" },
};

/**
 * The extra phone numbers or emails under the main one: each row has a label (Mobile, Work, ...), the value and
 * a remove button, followed by an "Add another" button (up to five). `onChange` gets the new list of rows;
 * errors are read from `errors["additionalPhones.<index>.value"]`.
 */
export default function ContactDetailRows({ kind, rows, onChange, errors = {}, disabled = false }) {
  const { noun, field, newLabel, placeholder } = KINDS[kind];
  // The row just added gets the focus, so the user can type straight away.
  const [focusKey, setFocusKey] = useState(null);

  const update = (index, changes) => onChange(rows.map((row, i) => (i === index ? { ...row, ...changes } : row)));
  const remove = (index) => onChange(rows.filter((_, i) => i !== index));
  const add = () => {
    const row = newDetailRow(newLabel);
    setFocusKey(row.key);
    onChange([...rows, row]);
  };

  return (
    <>
      {rows.map((row, index) => {
        const name = `Other ${noun} ${index + 1}`;
        const inputId = `${field}-${index}`;
        const error = errors[`${field}.${index}.value`];
        const errorId = error ? `${inputId}-error` : undefined;
        return (
          <div key={row.key} className="grid gap-2">
            <div className="flex gap-2">
              <select
                aria-label={`Label for ${name.toLowerCase()}`}
                value={row.label}
                onChange={(event) => update(index, { label: event.target.value })}
                className="h-9 w-28 flex-shrink-0 rounded-md border border-input bg-background px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                {DETAIL_LABELS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <Input
                id={inputId}
                aria-label={name}
                autoFocus={row.key === focusKey}
                placeholder={placeholder}
                value={row.value}
                onChange={(event) => update(index, { value: event.target.value })}
                aria-invalid={error ? true : undefined}
                aria-describedby={errorId}
                className={cn(error && "border-destructive focus-visible:ring-destructive")}
              />
              <Hint label={`Remove this ${noun}`}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(index)}
                  aria-label={`Remove ${name.toLowerCase()}`}
                  className="h-9 w-9 flex-shrink-0 text-muted-foreground hover:text-destructive"
                >
                  <CloseIcon />
                </Button>
              </Hint>
            </div>
            {error && (
              <p id={errorId} className="text-[0.8rem] font-medium text-destructive">
                {error}
              </p>
            )}
          </div>
        );
      })}
      {rows.length < MAX_ADDITIONAL && (
        <Button
          variant="ghost"
          size="sm"
          onClick={add}
          disabled={disabled}
          className="justify-self-start px-2 text-muted-foreground"
        >
          <PlusIcon />
          Add another {noun}
        </Button>
      )}
    </>
  );
}
