import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import AuthLayout from "./AuthLayout";
import LabelWithInput from "../label-and-inputs/LabelWithInput";
import { cn } from "@/lib/utils";
import {
  forgotPassword,
  resetPassword,
  verifyOtp,
} from "../../service/authService";
import { getApiErrorMessage } from "../../service/Constants";
import { validateWith } from "../../validation/common";
import {
  forgotPasswordEmailSchema,
  otpSchema,
  resetPasswordSchema,
} from "../../validation/ForgotPasswordSchema";

const RESEND_COOLDOWN_SECONDS = 60;

const STEPS = [
  { title: "Forgot Password", subtitle: "Enter the email you signed up with and we'll send you a code." },
  { title: "Enter Code", subtitle: null },
  { title: "New Password", subtitle: "Choose a strong password you haven't used before." },
];

export default function ForgotPassword() {
  useDocumentTitle("Forgot password");
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return undefined;
    const timer = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  const handleChange = (field, setter) => (event) => {
    setter(event.target.value);
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setServerError("");
  };

  const handleOtpChange = (event) => {
    // Keep digits only, max 6.
    setOtp(event.target.value.replace(/\D/g, "").slice(0, 6));
    setErrors((prev) => ({ ...prev, otp: undefined }));
    setServerError("");
  };

  const run = async (action) => {
    setSubmitting(true);
    setServerError("");
    try {
      await action();
    } catch (error) {
      setServerError(getApiErrorMessage(error, "Something went wrong. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  const sendCode = async (event) => {
    event?.preventDefault();
    const validation = validateWith(forgotPasswordEmailSchema, { email });
    if (!validation.success) {
      setErrors(validation.errors);
      return;
    }
    await run(async () => {
      await forgotPassword(validation.data.email);
      setEmail(validation.data.email);
      setOtp("");
      setResendIn(RESEND_COOLDOWN_SECONDS);
      setStep(1);
      toast.success("Code sent. Check your inbox.");
    });
  };

  const resendCode = async () => {
    await run(async () => {
      await forgotPassword(email);
      setOtp("");
      setResendIn(RESEND_COOLDOWN_SECONDS);
      toast.success("A new code is on its way. Check your inbox.");
    });
  };

  const checkCode = async (event) => {
    event.preventDefault();
    const validation = validateWith(otpSchema, { otp });
    if (!validation.success) {
      setErrors(validation.errors);
      return;
    }
    await run(async () => {
      const response = await verifyOtp(email, validation.data.otp);
      setResetToken(response.resetToken);
      setStep(2);
      toast.success("Code verified");
    });
  };

  const saveNewPassword = async (event) => {
    event.preventDefault();
    const validation = validateWith(resetPasswordSchema, { newPassword, confirmPassword });
    if (!validation.success) {
      setErrors(validation.errors);
      return;
    }
    await run(async () => {
      await resetPassword(email, resetToken, validation.data.newPassword);
      toast.success("Password reset successfully. Please log in with your new password.");
      navigate("/login");
    });
  };

  const startOver = () => {
    setStep(0);
    setOtp("");
    setResetToken("");
    setErrors({});
    setServerError("");
  };

  const { title, subtitle } = STEPS[step];

  return (
    <AuthLayout>
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-4">
          {/* Step indicator */}
          <ol className="flex items-center gap-2" aria-label="Progress">
            {STEPS.map((s, index) => (
              <li
                key={s.title}
                aria-current={index === step ? "step" : undefined}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors duration-300",
                  index <= step ? "bg-primary" : "bg-muted"
                )}
              />
            ))}
          </ol>

          <div className="grid gap-1.5">
            <h1 className="text-xl font-semibold leading-none tracking-tight">{title}</h1>
            <p className="text-sm text-muted-foreground">
              {step === 1 ? (
                <>
                  If an account exists for <span className="font-medium text-foreground">{email}</span>,
                  we&apos;ve sent it a 6-digit code.
                </>
              ) : (
                subtitle
              )}
            </p>
          </div>
        </CardHeader>

        <CardContent className="grid gap-4">
          {step === 0 && (
            <form onSubmit={sendCode} noValidate>
              <fieldset disabled={submitting} className="grid min-w-0 gap-4">
                <LabelWithInput
                  htmlFor="email"
                  labelName="Email Address"
                  inputType="text"
                  inputId="email"
                  placeholder="m@example.com"
                  value={email}
                  onChange={handleChange("email", setEmail)}
                  error={errors.email}
                />
                <Button type="submit" loading={submitting} className="w-full">
                  {submitting ? "Sending..." : "Send code"}
                </Button>
              </fieldset>
            </form>
          )}

          {step === 1 && (
            <form onSubmit={checkCode} noValidate>
              <fieldset disabled={submitting} className="grid min-w-0 gap-4">
                <LabelWithInput
                  htmlFor="otp"
                  labelName="6-digit code"
                  inputType="text"
                  inputId="otp"
                  placeholder="000000"
                  value={otp}
                  onChange={handleOtpChange}
                  error={errors.otp}
                />
                <Button type="submit" loading={submitting} className="w-full">
                  {submitting ? "Checking..." : "Verify code"}
                </Button>
                <div className="flex items-center justify-between text-sm">
                  <Button
                    variant="link"
                    onClick={startOver}
                    className="h-auto p-0 text-muted-foreground hover:text-foreground"
                  >
                    Use a different email
                  </Button>
                  <Button variant="link" onClick={resendCode} disabled={resendIn > 0} className="h-auto p-0">
                    {resendIn > 0 ? `Resend code in ${resendIn}s` : "Resend code"}
                  </Button>
                </div>
              </fieldset>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={saveNewPassword} noValidate>
              <fieldset disabled={submitting} className="grid min-w-0 gap-4">
                <LabelWithInput
                  htmlFor="newPassword"
                  labelName="New Password"
                  inputType="password"
                  inputId="newPassword"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={handleChange("newPassword", setNewPassword)}
                  error={errors.newPassword}
                />
                <LabelWithInput
                  htmlFor="confirmPassword"
                  labelName="Confirm New Password"
                  inputType="password"
                  inputId="confirmPassword"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={handleChange("confirmPassword", setConfirmPassword)}
                  error={errors.confirmPassword}
                />
                <Button type="submit" loading={submitting} className="w-full">
                  {submitting ? "Saving..." : "Reset password"}
                </Button>
              </fieldset>
            </form>
          )}

          {serverError && (
            <Alert variant="destructive">
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          <p className="text-center text-sm text-muted-foreground">
            Remembered it?{" "}
            <Button asChild variant="link" className="h-auto p-0">
              <Link to="/login">Back to login</Link>
            </Button>
          </p>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
