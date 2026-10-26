import { Link } from "react-router-dom";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { tagDotClass } from "./tagColors";

/** A tag as a small outline badge with its coloured dot. With `link`, it opens the tag's page. */
export default function TagBadge({ tag, link = false, className = "" }) {
  const content = (
    <>
      <span aria-hidden="true" className={cn("h-2 w-2 flex-shrink-0 rounded-full", tagDotClass(tag.color))} />
      <span className="truncate">{tag.name}</span>
    </>
  );
  const badgeClass = cn("max-w-[10rem] gap-1.5 px-2 font-normal", className);

  if (!link) {
    return (
      <Badge variant="outline" className={badgeClass}>
        {content}
      </Badge>
    );
  }
  return (
    <Link
      to={`/tags/${tag.id}`}
      aria-label={`Show contacts tagged ${tag.name}`}
      className={cn(badgeVariants({ variant: "outline" }), badgeClass, "hover:bg-accent")}
    >
      {content}
    </Link>
  );
}
