// import axios from "axios";
// import { API_URL } from "./Constants";

// export const getData = async (userId) => {
//   const { data } = await axios.get(`${API_URL}/todo/user/${userId}`);
//   console.log("Data fetched successfully");
//   return data;
// };

// export const postData = async (value, userId) => {
//   const { data } = await axios.post(`${API_URL}/todo`, {
//     title: value,
//     userId: userId,
//   });
//   console.log("Todo added successfully:", data);
// };

// export const deleteData = async (id) => {
//   const { data } = await axios.delete(`${API_URL}/todo/${id}`);
// };

// export const updateExistingTodo = async (id, text, userId) => {
//   const { data } = await axios.put(`${API_URL}/todo/${id}`, {
//     title: text,
//     userId: userId,
//   });
// };

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
