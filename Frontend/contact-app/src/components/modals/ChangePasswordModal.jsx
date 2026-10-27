import { useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import LabelWithInput from "../label-and-inputs/LabelWithInput";
import ModalHeader from "./ModalHeader";
import { changePassword } from "../../service/ContactService";
import { changePasswordSchema } from "../../validation/ChangePasswordSchema";
import { validateWith } from "../../validation/common";
import { getApiErrorMessage } from "../../service/Constants";

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
      const { token } = await changePassword(
        props.userId,
        validation.data.currentPassword,
        validation.data.newPassword
      );
      // The old token stopped working the moment the password changed; keep this session signed in.
      const stored = JSON.parse(localStorage.getItem("userData")) || {};
      localStorage.setItem("userData", JSON.stringify({ ...stored, token }));
      toast.success("Password changed. Other devices have been signed out.");
      props.onClose();
    } catch (error) {
      setServerError(getApiErrorMessage(error, "Failed to change password."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && close()}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={changeCurrentPassword} noValidate>
          <fieldset disabled={loading} className="grid min-w-0 gap-4">
            <ModalHeader
              title="Change Password"
              description="Choose a strong, unique password."
            />

            <div className="grid gap-4">
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
                showPasswordRules
              />

              <LabelWithInput
                htmlFor="confirmNewPassword"
                labelName="Confirm New Password"
                inputType="password"
                inputId="confirmNewPassword"
                placeholder="Confirm new password"
                value={recheckPassword}
                onChange={handleRecheckPassword}
                error={errors.recheckPassword}
              />
            </div>
            {serverError && (
              <Alert variant="destructive">
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" data-autofocus onClick={close}>
                Cancel
              </Button>
              <Button type="submit" loading={loading}>
                {loading ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </fieldset>
        </form>
      </DialogContent>
    </Dialog>
  );
}
