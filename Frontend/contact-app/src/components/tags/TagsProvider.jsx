import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { CONTACTS_CHANGED_EVENT } from "../../service/ContactService";
import { getTags, TAGS_CHANGED_EVENT } from "../../service/TagService";

const TagsContext = createContext({ tags: [], loaded: false, reload: () => {} });

/**
 * Loads the signed-in user's tags once for the whole signed-in area (sidebar, top bar, forms, filters), and
 * reloads them when tags change or contacts change (which changes each tag's contact count).
 */
export function TagsProvider({ children }) {
  const [tags, setTags] = useState([]);
  const [loaded, setLoaded] = useState(false);
  // A response is ignored if a newer load has started since.
  const latestRequestRef = useRef(0);

  const reload = useCallback(async () => {
    const requestId = ++latestRequestRef.current;
    try {
      const result = await getTags();
      if (requestId === latestRequestRef.current) setTags(result ?? []);
    } catch {
      // Tags are extra: the app works without them, and the next change retries.
    } finally {
      if (requestId === latestRequestRef.current) setLoaded(true);
    }
  }, []);

  useEffect(() => {
    reload();
    window.addEventListener(TAGS_CHANGED_EVENT, reload);
    window.addEventListener(CONTACTS_CHANGED_EVENT, reload);
    return () => {
      window.removeEventListener(TAGS_CHANGED_EVENT, reload);
      window.removeEventListener(CONTACTS_CHANGED_EVENT, reload);
    };
  }, [reload]);

  return <TagsContext.Provider value={{ tags, loaded, reload }}>{children}</TagsContext.Provider>;
}

/** `{ tags, loaded, reload }`: tags are `[{ id, name, color, contactCount }]`, sorted by name. */
export const useTags = () => useContext(TagsContext);
