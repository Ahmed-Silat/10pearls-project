import Button from "../button/Button";
import { login } from "../../service/authService";
import HeadingAndText from "../heading-and-text/HeadingAndText";
import { useNavigate } from "react-router-dom";
import LabelWithInput from "../label-and-inputs/LabelWithInput";
import { useState } from "react";
import { UsersIcon } from "../icons/Icons";
import { loginSchema } from "../../validation/LoginSchema";
import { validateWith } from "../../validation/common";
import { getApiErrorMessage } from "../../service/Constants";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const navigate = useNavigate();

  const handleEmailChange = (event) => {
    setEmail(event.target.value);
    setErrors((prev) => ({ ...prev, email: undefined }));
  };

  const handlePasswordChange = (event) => {
    setPassword(event.target.value);
    setErrors((prev) => ({ ...prev, password: undefined }));
  };

  const sendLoginData = async (event) => {
    event.preventDefault();
    const validation = validateWith(loginSchema, { email, password });
    if (!validation.success) {
      setErrors(validation.errors);
      return;
    }
    try {
      const auth = await login(validation.data.email, validation.data.password);
      // Flatten { token, user } so the rest of the app keeps reading profile fields directly.
      localStorage.setItem(
        "userData",
        JSON.stringify({ ...auth.user, token: auth.token })
      );
      navigate("/");
    } catch (error) {
      setServerError(getApiErrorMessage(error, "Failed to login. Check your credentials."));
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-sky-50 to-slate-200 p-4">
      <div className="flex w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl md:min-h-[560px]">
        <div className="hidden w-1/2 flex-col justify-center bg-gradient-to-br from-sky-600 to-cyan-700 p-12 text-white md:flex">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
            <UsersIcon className="h-8 w-8" />
          </div>
          <h2 className="text-3xl font-bold leading-tight">
            Your contacts,
            <br />
            beautifully organized.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-sky-100">
            Keep everyone you know in one place. Search, sort and manage your
            contacts in seconds.
          </p>
        </div>

        <div className="flex w-full flex-col justify-center p-8 md:w-1/2 sm:p-12">
          <HeadingAndText mainHeading="Login" link="/signup" pageName="Signup" />

          <form onSubmit={sendLoginData} noValidate>
            <LabelWithInput
              htmlFor="email"
              labelName="Email Address"
              inputType="text"
              inputId="email"
              placeholder="Enter your email"
              onChange={handleEmailChange}
              error={errors.email}
            />

            <LabelWithInput
              htmlFor="password"
              labelName="Password"
              inputType="password"
              inputId="password"
              placeholder="Enter your password"
              onChange={handlePasswordChange}
              error={errors.password}
            />

            <Button
              type="submit"
              name="LOGIN"
              className="w-full bg-sky-600 py-2.5 text-sm font-bold uppercase tracking-wide text-white shadow-lg shadow-sky-600/25 hover:bg-sky-700"
            />
            {serverError && (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{serverError}</p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}