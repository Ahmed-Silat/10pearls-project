import axios from "axios";
import { API_URL } from "./Constants";

export const getContactsByUserId = async (userId) => {
  const { data } = await axios.get(
    `http://localhost:8080/contact/user/${userId}`
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

// export const markAsCompletedAndSortData = async (userId, completed, sortBy) => {
//   const { data } = await axios.get(`${API_URL}/todo/user/${userId}`, {
//     params: { completed, sortBy },
//   });
//   return data;
// };

// export const setTodoMarkAsCompleted = async (id, completed) => {
//   const { data } = await axios.put(`${API_URL}/todo/${id}`, {
//     completed,
//   });
// };
