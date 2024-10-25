import Button from "../button/Button";
import { login } from "../../service/authService";
import HeadingAndText from "../heading-and-text/HeadingAndText";
import { useNavigate } from "react-router-dom";
import LabelWithInput from "../label-and-inputs/LabelWithInput";
import { useState } from "react";
import CheckboxWithInput from "../checkbox-and-input/CheckboxWithInput";
import TextWithHorizontalLine from "../text-with-horizontal-line/TextWithHorizontalLine";
import SocialMediaButtons from "../social-media-buttons/SocialMediaButtons";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleEmailChange = (event) => {
    setEmail(event.target.value);
  };

  const handlePasswordChange = (event) => {
    setPassword(event.target.value);
  };

  const sendLoginData = async (event) => {
    event.preventDefault();
    const userData = await login(email, password);
    // localStorage.setItem("token", true);
    localStorage.setItem("userData", JSON.stringify(userData));
    navigate("/");
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="bg-white-800 p-8 rounded-lg shadow-lg text-black flex  text-lg font-sans">
        <form action="" onSubmit={sendLoginData}>
          <div>
            <HeadingAndText
              mainHeading="Login"
              link="/signup"
              pageName="Signup"
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

            <CheckboxWithInput
              inputId="rememberMe"
              htmlFor="rememberMe"
              labelName="Remember me"
            />

            <Button
              name="LOGIN"
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
