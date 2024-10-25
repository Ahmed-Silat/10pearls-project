import Button from "../button/Button";
import HeadingAndText from "../heading-and-text/HeadingAndText";
import LabelWithInput from "../label-and-inputs/LabelWithInput";
import { useState } from "react";
import { signup } from "../../service/authService";
import { useNavigate } from "react-router-dom";
import TextWithHorizontalLine from "../text-with-horizontal-line/TextWithHorizontalLine";
import SocialMediaButtons from "../social-media-buttons/SocialMediaButtons";

export default function SignUp() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNo, setPhoneNo] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [rePassword, setRePassword] = useState("");
  const navigate = useNavigate();

  const handleFisrtNameChange = (event) => {
    setFirstName(event.target.value);
  };

  const handleLastNameChange = (event) => {
    setLastName(event.target.value);
  };

  const handleEmailChange = (event) => {
    setEmail(event.target.value);
  };

  const handlePhoneNoChange = (event) => {
    setPhoneNo(event.target.value);
  };

  const handleAddressChange = (event) => {
    setAddress(event.target.value);
  };

  const handlePasswordChange = (event) => {
    setPassword(event.target.value);
  };

  const handleRePasswordChange = (event) => {
    setRePassword(event.target.value);
  };

  const sendSignupData = async (event) => {
    event.preventDefault();
    const userData = await signup(
      firstName,
      lastName,
      address,
      phoneNo,
      email,
      password
    );
    localStorage.setItem("userData", JSON.stringify(userData));
    navigate("/");
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="bg-white-800 p-8 rounded-lg shadow-lg text-black flex text-lg font-sans">
        <form action="" onSubmit={sendSignupData}>
          <div>
            <HeadingAndText
              mainHeading="Signup"
              link="/login"
              pageName="Login"
            />

            <LabelWithInput
              htmlFor="firstName"
              labelName="First Name"
              inputType="text"
              inputId="firstName"
              placeholder="Enter Your First Name"
              onChange={handleFisrtNameChange}
            />

            <LabelWithInput
              htmlFor="lastName"
              labelName="Last Name"
              inputType="text"
              inputId="lastName"
              placeholder="Enter Your Last Name"
              onChange={handleLastNameChange}
            />

            <LabelWithInput
              htmlFor="email"
              labelName="Email Address"
              inputType="text"
              inputId="email"
              placeholder="Enter Your Email"
              onChange={handleEmailChange}
            />

            <LabelWithInput
              htmlFor="phone"
              labelName="Phone No"
              inputType="text"
              inputId="phone"
              placeholder="Enter Your Phone No"
              onChange={handlePhoneNoChange}
            />

            <LabelWithInput
              htmlFor="address"
              labelName="Address"
              inputType="text"
              inputId="address"
              placeholder="Enter Your Address"
              onChange={handleAddressChange}
            />

            <LabelWithInput
              htmlFor="password"
              labelName="Password"
              inputType="password"
              inputId="password"
              placeholder="Enter Your Password"
              onChange={handlePasswordChange}
            />

            <LabelWithInput
              htmlFor="repassword"
              labelName="Re-Enter Password"
              inputType="password"
              inputId="repassword"
              placeholder="Re-Enter Your Password"
              onChange={handleRePasswordChange}
            />

            <Button
              name="SIGNUP"
              className="bg-blue-400 py-2 px-36 flex justify-center transition duration-500 ease-in-out hover:bg-blue-500 font-bold"
            />

            <TextWithHorizontalLine />

            <SocialMediaButtons />
          </div>
        </form>
      </div>
    </div>
  );
}
