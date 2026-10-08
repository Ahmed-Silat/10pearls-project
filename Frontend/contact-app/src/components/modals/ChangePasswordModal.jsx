import { useState } from "react";
import { toast } from "sonner";
import Modal from "../ui/Modal";
import LabelWithInput from "../label-and-inputs/LabelWithInput";
import { changePassword } from "../../service/ContactService";
import { LockIcon } from "../icons/Icons";
import { changePasswordSchema } from "../../validation/ChangePasswordSchema";
import { validateWith } from "../../validation/common";
import { getApiErrorMessage } from "../../service/Constants";
import Button from "../button/Button";

export default function ChangePasswordModal(props) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [recheckPassword, setRecheckPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  // The modal cannot be closed while a save is in progress.
  const close = () => {
    if (!loading) props.onClose();
  };

  const handleChange = (field, setter) => (event) => {
    setter(event.target.value);
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleCurrentPasswordChange = handleChange(
    "currentPassword",
    setCurrentPassword
  );
  const handleNewPasswordChange = handleChange("newPassword", setNewPassword);
  const handleRecheckPassword = handleChange(
    "recheckPassword",
    setRecheckPassword
  );

  const changeCurrentPassword = async (event) => {
    event.preventDefault();
    const validation = validateWith(changePasswordSchema, {
      currentPassword,
      newPassword,
      recheckPassword,
    });
    if (!validation.success) {
      setErrors(validation.errors);
      return;
    }
    setLoading(true);
    setServerError("");
    try {
      await changePassword(
        props.userId,
        validation.data.currentPassword,
        validation.data.newPassword
      );
      toast.success("Password changed successfully");
      props.onClose();
    } catch (error) {
      setServerError(getApiErrorMessage(error, "Failed to change password."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal onClose={close} titleId="change-password-title" panelClassName="sm:max-w-md">
      <form onSubmit={changeCurrentPassword} noValidate>
        <fieldset disabled={loading} className="min-w-0">
          <div className="px-6 pt-6">
            <div className="flex items-center gap-4">
              <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
                <LockIcon className="h-5 w-5" />
              </span>
              <div>
                <h3 id="change-password-title" className="text-lg font-semibold text-slate-900">
                  Change Password
                </h3>
                <p className="text-xs text-slate-500">
                  Choose a strong, unique password.
                </p>
              </div>
            </div>

            <div className="mt-4">
              <LabelWithInput
                htmlFor="currentPassword"
                labelName="Current Password"
                inputType="password"
                inputId="currentPassword"
                placeholder="Enter current password"
                value={currentPassword}
                onChange={handleCurrentPasswordChange}
                error={errors.currentPassword}
              />

              <LabelWithInput
                htmlFor="newPassword"
                labelName="New Password"
                inputType="password"
                inputId="newPassword"
                placeholder="Enter new password"
                value={newPassword}
                onChange={handleNewPasswordChange}
                error={errors.newPassword}
              />

              <LabelWithInput
                htmlFor="reEnterNewPassword"
                labelName="Re-Enter New Password"
                inputType="password"
                inputId="reEnterNewPassword"
                placeholder="Re-enter new password"
                value={recheckPassword}
                onChange={handleRecheckPassword}
                error={errors.recheckPassword}
              />
            </div>
            {serverError && (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{serverError}</p>
            )}
          </div>

          <div className="mt-2 flex flex-col-reverse gap-2 rounded-b-2xl border-t border-slate-100 bg-slate-50 px-6 py-4 sm:flex-row-reverse">
            <Button
              type="submit"
              name={loading ? "Saving..." : "Save"}
              loading={loading}
              className="w-full bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 sm:w-auto"
            />
            <button
              type="button"
              data-autofocus
              onClick={close}
              className="inline-flex w-full justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              Cancel
            </button>
          </div>
        </fieldset>
      </form>
    </Modal>
  );
}
