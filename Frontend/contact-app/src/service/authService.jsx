import { data } from "autoprefixer";
import axios from "axios";

export const login = async (email, password) => {
  const { data } = await axios.post("http://localhost:8080/user/login", {
    email: email,
    password: password,
  });
  console.log("user login successful");
  return data;
};

export const signup = async (
  firstName,
  lastName,
  address,
  phoneNo,
  email,
  password
) => {
  const { data } = await axios.post("http://localhost:8080/user", {
    firstName: firstName,
    lastName: lastName,
    address: address,
    phone: phoneNo,
    email: email,
    password: password,
  });
  console.log("user signup successful");
  return data;
};
