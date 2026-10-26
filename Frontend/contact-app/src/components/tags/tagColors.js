/** The coloured dot shown for each tag colour (the keys are the colours the API accepts, see TAG_COLORS). */
const TAG_DOT_CLASSES = {
  gray: "bg-zinc-400",
  red: "bg-red-500",
  orange: "bg-orange-500",
  amber: "bg-amber-400",
  green: "bg-green-500",
  teal: "bg-teal-500",
  blue: "bg-blue-500",
  violet: "bg-violet-500",
  pink: "bg-pink-500",
};

/** Tailwind class for a tag colour's dot; unknown colours fall back to gray. */
export const tagDotClass = (color) => TAG_DOT_CLASSES[color] ?? TAG_DOT_CLASSES.gray;

/** A readable name for a colour key, for screen readers ("green" → "Green"). */
export const colorLabel = (color) => color.charAt(0).toUpperCase() + color.slice(1);
