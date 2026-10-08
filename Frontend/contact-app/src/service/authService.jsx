import api, { getApiErrorMessage } from "../service/Constants";

export const login = async (email, password) => {
  const { data } = await api.post(`/user/login`, { email, password });
  return data;
};

export const signup = async (firstName, lastName, address, phoneNo, email, password) => {
  const { data } = await api.post(`/user/signup`, {
    firstName,
    lastName,
    address,
    phone: phoneNo,
    email,
    password,
  });
  return data;
};

export const updateUser = async (userId, firstName, lastName, email, phoneNo, address) => {
  const { data } = await api.put(`/user/${userId}`, {
    firstName,
    lastName,
    email,
    phone: phoneNo,
    address,
  });
  return data;
};

export { getApiErrorMessage };