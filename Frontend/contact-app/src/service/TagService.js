import api from "./Constants";

/** Fired on `window` after a tag is created, renamed, recoloured or deleted (the tags list reloads). */
export const TAGS_CHANGED_EVENT = "tagsChanged";
const notifyTagsChanged = () => window.dispatchEvent(new Event(TAGS_CHANGED_EVENT));

/** The colours a tag can have. The keys are what the API stores; tagColors.js maps them to styles. */
export const TAG_COLORS = ["gray", "red", "orange", "amber", "green", "teal", "blue", "violet", "pink"];

/** The signed-in user's tags, sorted by name: `[{ id, name, color, contactCount }]`. */
export const getTags = async () => {
  const { data } = await api.get(`/tag`);
  return data;
};

/** Creates a tag. A name the user already has (ignoring case) is rejected with a 409. Returns the new tag. */
export const createTag = async (name, color) => {
  const { data } = await api.post(`/tag`, { name, color });
  notifyTagsChanged();
  return data;
};

/** Renames and/or recolours a tag. Returns the updated tag. */
export const updateTag = async (tagId, name, color) => {
  const { data } = await api.put(`/tag/${tagId}`, { name, color });
  notifyTagsChanged();
  return data;
};

/** Deletes a tag. Its contacts stay; they just lose the tag. */
export const deleteTag = async (tagId) => {
  await api.delete(`/tag/${tagId}`);
  notifyTagsChanged();
};
