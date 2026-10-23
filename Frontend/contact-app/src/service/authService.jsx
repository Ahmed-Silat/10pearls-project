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

export const getUser = async (userId) => {
  const { data } = await api.get(`/user/${userId}`);
  return data;
};

/** `currentPassword` is only needed (and only sent) when the email changes. */
export const updateUser = async (
  userId,
  firstName,
  lastName,
  email,
  phoneNo,
  address,
  currentPassword
) => {
  const { data } = await api.put(`/user/${userId}`, {
    firstName,
    lastName,
    email,
    phone: phoneNo,
    address,
    ...(currentPassword && { currentPassword }),
  });
  return data;
};

export const forgotPassword = async (email) => {
  const { data } = await api.post(`/user/forgot-password`, { email });
  return data;
};

export const verifyOtp = async (email, otp) => {
  const { data } = await api.post(`/user/verify-otp`, { email, otp });
  return data;
};

export const resetPassword = async (email, resetToken, newPassword) => {
  const { data } = await api.post(`/user/reset-password`, {
    email,
    resetToken,
    newPassword,
  });
  return data;
};

export { getApiErrorMessage };