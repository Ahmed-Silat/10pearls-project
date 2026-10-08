import Button from "../button/Button";
import HeadingAndText from "../heading-and-text/HeadingAndText";
import LabelWithInput from "../label-and-inputs/LabelWithInput";
import { useState } from "react";
import { signup } from "../../service/authService";
import { useNavigate } from "react-router-dom";
import { UsersIcon } from "../icons/Icons";
import { signupSchema } from "../../validation/SignupSchema";
import { validateWith } from "../../validation/common";
import { getApiErrorMessage } from "../../service/Constants";

export default function SignUp() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNo, setPhoneNo] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [rePassword, setRePassword] = useState("");
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const navigate = useNavigate();

  const clearError = (field) =>
    setErrors((prev) => ({ ...prev, [field]: undefined }));

  const makeChangeHandler = (setter, field) => (event) => {
    setter(event.target.value);
    clearError(field);
  };

  const handleFirstNameChange = makeChangeHandler(setFirstName, "firstName");
  const handleLastNameChange = makeChangeHandler(setLastName, "lastName");
  const handleEmailChange = makeChangeHandler(setEmail, "email");
  const handlePhoneNoChange = makeChangeHandler(setPhoneNo, "phoneNo");
  const handleAddressChange = makeChangeHandler(setAddress, "address");
  const handlePasswordChange = makeChangeHandler(setPassword, "password");
  const handleRePasswordChange = makeChangeHandler(setRePassword, "rePassword");

  const sendSignupData = async (event) => {
    event.preventDefault();
    const validation = validateWith(signupSchema, {
      firstName,
      lastName,
      email,
      phoneNo,
      address,
      password,
      rePassword,
    });
    if (!validation.success) {
      setErrors(validation.errors);
      return;
    }
    try {
      const { rePassword: _rePassword, ...signupData } = validation.data;
      const auth = await signup(
        signupData.firstName,
        signupData.lastName,
        signupData.address,
        signupData.phoneNo,
        signupData.email,
        signupData.password
      );
      // Flatten { token, user } so the rest of the app keeps reading profile fields directly.
      localStorage.setItem(
        "userData",
        JSON.stringify({ ...auth.user, token: auth.token })
      );
      navigate("/");
    } catch (error) {
      setServerError(getApiErrorMessage(error, "Failed to sign up. Please try again."));
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-sky-50 to-slate-200 p-4">
      <div className="flex w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl md:min-h-[640px]">
        <div className="hidden w-1/2 flex-col justify-center bg-gradient-to-br from-sky-600 to-cyan-700 p-12 text-white md:flex">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
            <UsersIcon className="h-8 w-8" />
          </div>
          <h2 className="text-3xl font-bold leading-tight">
            Join us and gather
            <br />
            all your contacts.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-sky-100">
            Create an account to start building your personal address book.
          </p>
        </div>

        <div className="w-full bg-white p-8 md:w-1/2 md:overflow-y-auto sm:p-10">
          <HeadingAndText mainHeading="Signup" link="/login" pageName="Login" />

          <form onSubmit={sendSignupData} noValidate>
            <div className="sm:flex sm:gap-3">
              <div className="sm:w-1/2">
                <LabelWithInput
                  htmlFor="firstName"
                  labelName="First Name"
                  inputType="text"
                  inputId="firstName"
                  placeholder="Enter first name"
                  onChange={handleFirstNameChange}
                  error={errors.firstName}
                />
              </div>
              <div className="sm:w-1/2">
                <LabelWithInput
                  htmlFor="lastName"
                  labelName="Last Name"
                  inputType="text"
                  inputId="lastName"
                  placeholder="Enter last name"
                  onChange={handleLastNameChange}
                  error={errors.lastName}
                />
              </div>
            </div>

            <div className="sm:flex sm:gap-3">
              <div className="sm:w-1/2">
                <LabelWithInput
                  htmlFor="email"
                  labelName="Email Address"
                  inputType="text"
                  inputId="email"
                  placeholder="Enter your email"
                  onChange={handleEmailChange}
                  error={errors.email}
                />
              </div>
              <div className="sm:w-1/2">
                <LabelWithInput
                  htmlFor="phone"
                  labelName="Phone No"
                  inputType="text"
                  inputId="phone"
                  placeholder="Enter phone no"
                  onChange={handlePhoneNoChange}
                  error={errors.phoneNo}
                  optional
                />
              </div>
            </div>

            <LabelWithInput
              htmlFor="address"
              labelName="Address"
              inputType="text"
              inputId="address"
              placeholder="Enter your address"
              onChange={handleAddressChange}
              error={errors.address}
              optional
            />

            <div className="sm:flex sm:gap-3">
              <div className="sm:w-1/2">
                <LabelWithInput
                  htmlFor="password"
                  labelName="Password"
                  inputType="password"
                  inputId="password"
                  placeholder="Enter password"
                  onChange={handlePasswordChange}
                  error={errors.password}
                />
              </div>
              <div className="sm:w-1/2">
                <LabelWithInput
                  htmlFor="repassword"
                  labelName="Re-Enter Password"
                  inputType="password"
                  inputId="repassword"
                  placeholder="Re-enter password"
                  onChange={handleRePasswordChange}
                  error={errors.rePassword}
                />
              </div>
            </div>

            <Button
              type="submit"
              name="SIGNUP"
              className="mt-2 w-full bg-sky-600 py-2.5 text-sm font-bold uppercase tracking-wide text-white shadow-lg shadow-sky-600/25 hover:bg-sky-700"
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