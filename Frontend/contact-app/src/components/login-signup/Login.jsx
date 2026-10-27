import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import AuthLayout from "./AuthLayout";
import { login } from "../../service/authService";
import HeadingAndText from "../heading-and-text/HeadingAndText";
import { useNavigate } from "react-router-dom";
import TextLink from "../ui/TextLink";
import LabelWithInput from "../label-and-inputs/LabelWithInput";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { loginSchema } from "../../validation/LoginSchema";
import { validateWith } from "../../validation/common";
import { getApiErrorMessage, SESSION_EXPIRED_KEY } from "../../service/Constants";

export default function Login() {
  useDocumentTitle("Login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Show a one-time notice if the user was sent here because their session expired.
  useEffect(() => {
    try {
      if (sessionStorage.getItem(SESSION_EXPIRED_KEY)) {
        sessionStorage.removeItem(SESSION_EXPIRED_KEY);
        toast.warning("Your session has expired. Please log in again.", {
          id: "session-expired",
        });
      }
    } catch {
      // Storage unavailable: nothing to show.
    }
  }, []);

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
    setLoading(true);
    setServerError("");
    try {
      const auth = await login(validation.data.email, validation.data.password);
      // Flatten { token, user } so the rest of the app keeps reading profile fields directly.
      localStorage.setItem(
        "userData",
        JSON.stringify({ ...auth.user, token: auth.token })
      );
      toast.success("Logged in successfully");
      navigate("/");
    } catch (error) {
      setServerError(getApiErrorMessage(error, "Failed to login. Check your credentials."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <HeadingAndText
            mainHeading="Login"
            prompt="Don't have an account yet?"
            link="/signup"
            pageName="Signup"
            disabled={loading}
          />
        </CardHeader>
        <CardContent>
          <form onSubmit={sendLoginData} noValidate>
            <fieldset disabled={loading} className="grid min-w-0 gap-4">
              <LabelWithInput
                htmlFor="email"
                labelName="Email Address"
                inputType="text"
                inputId="email"
                placeholder="m@example.com"
                onChange={handleEmailChange}
                error={errors.email}
              />

              <div className="grid gap-2">
                <LabelWithInput
                  htmlFor="password"
                  labelName="Password"
                  inputType="password"
                  inputId="password"
                  placeholder="Enter your password"
                  onChange={handlePasswordChange}
                  error={errors.password}
                />
                <TextLink to="/forgot-password" disabled={loading} className="ml-auto text-sm">
                  Forgot password?
                </TextLink>
              </div>

              <Button type="submit" loading={loading} className="w-full">
                {loading ? "Logging in..." : "Log in"}
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
