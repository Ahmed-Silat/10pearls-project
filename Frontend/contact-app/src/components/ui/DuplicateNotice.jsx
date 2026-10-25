const FIELD_LABELS = { phone: "phone number", email: "email" };

/**
 * One line per matching contact, combining fields: a contact matching both shows as
 * "the same phone number and email".
 */
export const describeDuplicates = (matches) => {
  const byContact = new Map();
  for (const match of matches) {
    const entry = byContact.get(match.id) ?? {
      name: [match.firstName, match.lastName].filter(Boolean).join(" "),
      fields: [],
    };
    if (!entry.fields.includes(match.field)) entry.fields.push(match.field);
    byContact.set(match.id, entry);
  }
  return [...byContact.entries()].map(([id, { name, fields }]) => ({
    id,
    name,
    sameWhat: fields.map((field) => FIELD_LABELS[field] ?? field).join(" and "),
  }));
};

/**
 * Amber box naming the contacts that already have this phone number or email. With `confirm`, it also asks
 * whether to save anyway (the modal swaps its buttons for "Save anyway" / "Go back").
 */
export default function DuplicateNotice({ matches, confirm = false }) {
  if (!matches?.length) return null;
  const lines = describeDuplicates(matches);
  return (
    <div
      role={confirm ? "alert" : "status"}
      className="mt-3 rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-800 ring-1 ring-amber-200"
    >
      <p className="font-semibold">{confirm ? "This looks like a duplicate" : "Possible duplicate"}</p>
      <ul className="mt-1 space-y-0.5">
        {lines.map(({ id, name, sameWhat }) => (
          <li key={id}>
            <span className="font-semibold capitalize">{name}</span> already has the same {sameWhat}.
          </li>
        ))}
      </ul>
      {confirm && <p className="mt-1.5">Save it anyway?</p>}
    </div>
  );
}
