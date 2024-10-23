import Button from "../button/Button";
import HeadingAndText from "../heading-and-text/HeadingAndText";
import LabelWithInput from "../label-and-inputs/LabelWithInput";
import { useState } from "react";
import { signup } from "../service/authService";
import { useNavigate } from "react-router-dom";
import TextWithHorizontalLine from "../text-with-horizontal-line/TextWithHorizontalLine";
import SocialMediaButtons from "../social-media-buttons/SocialMediaButtons";

export default function SignUp() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rePassword, setRePassword] = useState("");
  const navigate = useNavigate();

  const handleUsernameChange = (event) => {
    setUsername(event.target.value);
  };

  const handleEmailChange = (event) => {
    setEmail(event.target.value);
  };

  const handlePasswordChange = (event) => {
    setPassword(event.target.value);
  };

  const handleRePasswordChange = (event) => {
    setRePassword(event.target.value);
  };

  const sendSingupData = async (event) => {
    event.preventDefault();
    // const userData = await signup(username, email, password);
    // localStorage.setItem("userData", JSON.stringify(userData));
    // navigate("/");
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="bg-white-800 p-8 rounded-lg shadow-lg text-black flex text-lg font-sans">
        <form action="" onSubmit={sendSingupData}>
          <div>
            <HeadingAndText
              mainHeading="Signup"
              link="/login"
              pageName="Login"
            />

            <LabelWithInput
              htmlFor="username"
              labelName="UserName"
              inputType="text"
              inputId="username"
              placeholder="Enter Your Name"
              onChange={handleUsernameChange}
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
