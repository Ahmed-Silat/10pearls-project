import api, { getApiErrorMessage } from "./Constants";

export const getContactsByUserId = async (userId, sortBy, search, page, size) => {
  const { data } = await api.get(`/contact/user/${userId}`, {
    params: { sortBy, search, page, size },
  });
  return data;
};

export const createNewContact = async (firstName, lastName, email, address, phone, user_id) => {
  const { data } = await api.post(`/contact`, {
    firstName,
    lastName,
    email,
    phone,
    address,
  });
  return data;
};

export const getContactById = async (contactId) => {
  const { data } = await api.get(`/contact/${contactId}`);
  return data;
};

export const updateContact = async (contactId, firstName, lastName, email, phone, address) => {
  const { data } = await api.put(`/contact/${contactId}`, {
    firstName,
    lastName,
    email,
    phone,
    address,
  });
  return data;
};

export const deleteContact = async (contactId) => {
  await api.delete(`/contact/${contactId}`);
};

export const changePassword = async (userId, currentPassword, newPassword) => {
  await api.put(`/user/changePassword/${userId}`, { currentPassword, newPassword });
};

export { getApiErrorMessage };