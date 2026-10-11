import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Button from "../button/Button";
import LabelWithInput from "../label-and-inputs/LabelWithInput";
import { LockIcon } from "../icons/Icons";
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

const primaryButtonClass =
  "w-full bg-sky-600 py-2.5 text-sm font-bold uppercase tracking-wide text-white shadow-lg shadow-sky-600/25 hover:bg-sky-700";

export default function ForgotPassword() {
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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-sky-50 to-slate-200 p-4">
      <div className="flex w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl md:min-h-[560px]">
        <div className="hidden w-1/2 flex-col justify-center bg-gradient-to-br from-sky-600 to-cyan-700 p-12 text-white md:flex">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
            <LockIcon className="h-7 w-7" />
          </div>
          <h2 className="text-3xl font-bold leading-tight">
            Locked out?
            <br />
            We&apos;ll get you back in.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-sky-100">
            We&apos;ll email you a one-time code. Enter it here and choose a new
            password. The code expires after 10 minutes.
          </p>
        </div>

        <div className="flex w-full flex-col justify-center p-8 md:w-1/2 sm:p-12">
          {/* Step indicator */}
          <ol className="mb-6 flex items-center gap-2" aria-label="Progress">
            {STEPS.map((s, index) => (
              <li
                key={s.title}
                aria-current={index === step ? "step" : undefined}
                className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                  index <= step ? "bg-sky-600" : "bg-slate-200"
                }`}
              />
            ))}
          </ol>

          <div className="mb-6">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{title}</h1>
            <p className="mt-1.5 text-sm text-slate-500">
              {step === 1 ? (
                <>
                  If an account exists for{" "}
                  <span className="font-semibold text-slate-700">{email}</span>, we&apos;ve
                  sent it a 6-digit code.
                </>
              ) : (
                subtitle
              )}
            </p>
          </div>

          {step === 0 && (
            <form onSubmit={sendCode} noValidate>
              <fieldset disabled={submitting} className="min-w-0">
                <LabelWithInput
                  htmlFor="email"
                  labelName="Email Address"
                  inputType="text"
                  inputId="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={handleChange("email", setEmail)}
                  error={errors.email}
                />
                <Button
                  type="submit"
                  name={submitting ? "Sending..." : "Send code"}
                  loading={submitting}
                  className={primaryButtonClass}
                />
              </fieldset>
            </form>
          )}

          {step === 1 && (
            <form onSubmit={checkCode} noValidate>
              <fieldset disabled={submitting} className="min-w-0">
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
                <Button
                  type="submit"
                  name={submitting ? "Checking..." : "Verify code"}
                  loading={submitting}
                  className={primaryButtonClass}
                />
                <div className="mt-4 flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={startOver}
                    className="font-medium text-slate-500 transition-colors hover:text-slate-700 disabled:cursor-not-allowed disabled:text-slate-400"
                  >
                    Use a different email
                  </button>
                  <button
                    type="button"
                    onClick={resendCode}
                    disabled={resendIn > 0}
                    className="font-semibold text-sky-600 transition-colors hover:text-sky-700 disabled:cursor-not-allowed disabled:text-slate-400"
                  >
                    {resendIn > 0 ? `Resend code in ${resendIn}s` : "Resend code"}
                  </button>
                </div>
              </fieldset>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={saveNewPassword} noValidate>
              <fieldset disabled={submitting} className="min-w-0">
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
                  labelName="Re-Enter New Password"
                  inputType="password"
                  inputId="confirmPassword"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={handleChange("confirmPassword", setConfirmPassword)}
                  error={errors.confirmPassword}
                />
                <Button
                  type="submit"
                  name={submitting ? "Saving..." : "Reset password"}
                  loading={submitting}
                  className={primaryButtonClass}
                />
              </fieldset>
            </form>
          )}

          {serverError && (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{serverError}</p>
          )}

          <p className="mt-6 text-center text-sm text-slate-500">
            Remembered it?{" "}
            <Link
              to="/login"
              className="font-semibold text-sky-600 transition-colors duration-200 hover:text-sky-700 hover:underline"
            >
              Back to login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
