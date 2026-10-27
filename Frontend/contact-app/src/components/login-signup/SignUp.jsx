import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import AuthLayout from "./AuthLayout";
import HeadingAndText from "../heading-and-text/HeadingAndText";
import LabelWithInput from "../label-and-inputs/LabelWithInput";
import { useState } from "react";
import { toast } from "sonner";
import { signup } from "../../service/authService";
import { useNavigate } from "react-router-dom";
import { signupSchema } from "../../validation/SignupSchema";
import { validateWith } from "../../validation/common";
import { getApiErrorMessage } from "../../service/Constants";

export default function SignUp() {
  useDocumentTitle("Sign up");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNo, setPhoneNo] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [rePassword, setRePassword] = useState("");
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
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
    setLoading(true);
    setServerError("");
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
      toast.success("Account created successfully");
      navigate("/");
    } catch (error) {
      setServerError(getApiErrorMessage(error, "Failed to sign up. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Card className="w-full max-w-lg">
        <CardHeader>
          <HeadingAndText
            mainHeading="Signup"
            prompt="Already have an account?"
            link="/login"
            pageName="Login"
            disabled={loading}
          />
        </CardHeader>
        <CardContent>
          <form onSubmit={sendSignupData} noValidate>
            <fieldset disabled={loading} className="grid min-w-0 gap-4 sm:grid-cols-2">
              <LabelWithInput
                htmlFor="firstName"
                labelName="First Name"
                inputType="text"
                inputId="firstName"
                placeholder="Enter first name"
                onChange={handleFirstNameChange}
                error={errors.firstName}
              />
              <LabelWithInput
                htmlFor="lastName"
                labelName="Last Name"
                inputType="text"
                inputId="lastName"
                placeholder="Enter last name"
                onChange={handleLastNameChange}
                error={errors.lastName}
              />
              <LabelWithInput
                htmlFor="email"
                labelName="Email Address"
                inputType="text"
                inputId="email"
                placeholder="m@example.com"
                onChange={handleEmailChange}
                error={errors.email}
              />
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
              <LabelWithInput
                htmlFor="address"
                labelName="Address"
                inputType="text"
                inputId="address"
                placeholder="Enter your address"
                onChange={handleAddressChange}
                error={errors.address}
                optional
                className="sm:col-span-2"
              />
              <LabelWithInput
                htmlFor="password"
                labelName="Password"
                inputType="password"
                inputId="password"
                placeholder="Enter password"
                value={password}
                onChange={handlePasswordChange}
                error={errors.password}
                showPasswordRules
              />
              <LabelWithInput
                htmlFor="confirmPassword"
                labelName="Confirm Password"
                inputType="password"
                inputId="confirmPassword"
                placeholder="Confirm password"
                onChange={handleRePasswordChange}
                error={errors.rePassword}
              />

              <Button type="submit" loading={loading} className="w-full sm:col-span-2">
                {loading ? "Signing up..." : "Sign up"}
              </Button>
            </fieldset>
            {serverError && (
              <Alert variant="destructive" className="mt-4">
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            )}
          </form>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
