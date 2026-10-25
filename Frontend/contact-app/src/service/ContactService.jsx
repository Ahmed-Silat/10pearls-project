import api, { getApiErrorMessage } from "./Constants";

/** Fired on `window` after anything that changes how many contacts are in each section (used by the sidebar). */
export const CONTACTS_CHANGED_EVENT = "contactsChanged";
const notifyContactsChanged = () => window.dispatchEvent(new Event(CONTACTS_CHANGED_EVENT));

/** One page of contacts. `filter` is the sidebar section: "all" (default) or "favorites". */
export const getContactsByUserId = async (userId, sortBy, search, page, size, filter = "all") => {
  const { data } = await api.get(`/contact/user/${userId}`, {
    params: { sortBy, search, page, size, filter },
  });
  return data;
};

/** `{ all, favorites, recentlyDeleted }`: the numbers shown in the sidebar. */
export const getContactCounts = async () => {
  const { data } = await api.get(`/contact/counts`);
  return data;
};

/**
 * The contacts listed in a "duplicate" 409 (`[{ id, firstName, lastName, field }]`), or null for any other error.
 * The caller can then ask "Save anyway?" and resend with `allowDuplicate`.
 */
export const getDuplicates = (error) =>
  error?.response?.status === 409 && Array.isArray(error.response.data?.duplicates)
    ? error.response.data.duplicates
    : null;

/** Contacts that already have this phone number or email, for warning while a form is filled in. */
export const checkDuplicates = async ({ phone, email, excludeId }) => {
  const { data } = await api.get(`/contact/duplicates`, {
    params: { phone: phone || undefined, email: email || undefined, excludeId },
  });
  return data;
};

/** `allowDuplicate` saves even if another contact has the same phone or email ("Save anyway"). */
export const createNewContact = async (
  firstName,
  lastName,
  email,
  address,
  phone,
  user_id,
  { allowDuplicate = false } = {}
) => {
  const { data } = await api.post(`/contact`, {
    firstName,
    lastName,
    email,
    phone,
    address,
    allowDuplicate,
  });
  notifyContactsChanged();
  return data;
};

export const getContactById = async (contactId) => {
  const { data } = await api.get(`/contact/${contactId}`);
  return data;
};

/** `allowDuplicate` saves even if another contact has the same phone or email ("Save anyway"). */
export const updateContact = async (
  contactId,
  firstName,
  lastName,
  email,
  phone,
  address,
  { allowDuplicate = false } = {}
) => {
  const { data } = await api.put(`/contact/${contactId}`, {
    firstName,
    lastName,
    email,
    phone,
    address,
    allowDuplicate,
  });
  return data;
};

/** Stars (`true`) or unstars (`false`) a contact. Returns the updated contact. */
export const setFavorite = async (contactId, favorite) => {
  const { data } = await api.patch(`/contact/${contactId}/favorite`, { favorite });
  notifyContactsChanged();
  return data;
};

/** The user's Recently deleted contacts, newest first. Each has `deletedAt` and `deletesPermanentlyAt`. */
export const getRecentlyDeleted = async (page = 1) => {
  const { data } = await api.get(`/contact/deleted`, { params: { page } });
  return data;
};

/** Deletes a contact from Recently deleted for good. */
export const deletePermanently = async (contactId) => {
  await api.delete(`/contact/deleted/${contactId}`);
  notifyContactsChanged();
};

/**
 * Moves a contact out of Recently deleted, back into the contact list. Returns the restored contact.
 * `allowDuplicate` restores it even if a contact with the same phone or email was added since.
 */
export const restoreContact = async (contactId, { allowDuplicate = false } = {}) => {
  const { data } = await api.post(`/contact/${contactId}/restore`, null, {
    params: allowDuplicate ? { allowDuplicate } : undefined,
  });
  notifyContactsChanged();
  return data;
};

export const deleteContact = async (contactId) => {
  await api.delete(`/contact/${contactId}`);
  notifyContactsChanged();
};

/** Returns `{ token, user }`: changing the password signs out every session, so the caller must store the new token. */
export const changePassword = async (userId, currentPassword, newPassword) => {
  const { data } = await api.put(`/user/changePassword/${userId}`, {
    currentPassword,
    newPassword,
  });
  return data;
};

export { getApiErrorMessage };
