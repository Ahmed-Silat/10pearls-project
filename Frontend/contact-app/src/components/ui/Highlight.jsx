/**
 * Marks the start of `text` when it begins with `query` (ignoring case). Search matches the start of each
 * field, so that is the part worth highlighting. Anything else renders the text unchanged.
 */
export default function Highlight({ text, query }) {
  const value = text ?? "";
  const term = (query ?? "").trim();
  if (!term || !value.toLowerCase().startsWith(term.toLowerCase())) {
    return value;
  }
  return (
    <>
      {/* Highlighter yellow, so matches stand out in the greyscale theme (light and dark). */}
      <mark className="rounded-sm bg-yellow-200 px-0.5 text-inherit dark:bg-yellow-500/30">
        {value.slice(0, term.length)}
      </mark>
      {value.slice(term.length)}
    </>
  );
}
