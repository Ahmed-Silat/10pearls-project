import axios from "axios";
import { API_URL } from "./Constants";

export const getContactsByUserId = async (userId, sortBy, search) => {
  const { data } = await axios.get(
    `http://localhost:8080/contact/user/${userId}`,
    {
      params: { sortBy, search },
    }
  );
  console.log("Data fetched successfully");
  return data;
};

export const createNewContact = async (
  firstName,
  lastName,
  email,
  address,
  phone,
  user_id
) => {
  const { data } = await axios.post(`http://localhost:8080/contact`, {
    firstName,
    lastName,
    email,
    phone,
    address,
    user_id,
  });
  return data;
};

export const getContactById = async (contactId) => {
  const { data } = await axios.get(
    `http://localhost:8080/contact/${contactId}`
  );
  return data;
};

export const updateContact = async (
  contactId,
  firstName,
  lastName,
  email,
  phone,
  address,
  user_id
) => {
  const { data } = await axios.put(
    `http://localhost:8080/contact/${contactId}`,
    {
      firstName,
      lastName,
      email,
      phone,
      address,
      user_id,
    }
  );
};

export const deleteContact = async (contactId) => {
  const { data } = await axios.delete(
    `http://localhost:8080/contact/${contactId}`
  );
};

export const changePassword = async (userId, currentPassword, newPassword) => {
  const { data } = await axios.put(
    `http://localhost:8080/user/changePassword/${userId}`,
    { currentPassword, newPassword }
  );
};
