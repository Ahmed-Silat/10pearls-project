import { useParams } from "react-router-dom";
import NotFound from "../not-found/NotFound";
import { useTags } from "../tags/TagsProvider";
import Dashboard from "./Dashboard";

/** /tags/:tagId: the contacts with one tag, on the same dashboard as the other sections. */
export default function TagPage() {
  const { tagId } = useParams();
  const { tags } = useTags();
  const id = Number(tagId);
  if (!Number.isInteger(id) || id <= 0) return <NotFound />;

  // Until the tags have loaded (or if this one was just deleted) the name isn't known yet.
  const tag = tags.find((candidate) => candidate.id === id) ?? { id, name: "Tag", color: "gray" };
  // Keyed so switching tags starts fresh instead of briefly showing the other tag's contacts.
  return <Dashboard key={id} view="tag" tag={tag} />;
}
