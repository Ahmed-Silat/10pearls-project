import { useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import LabelWithInput from "../label-and-inputs/LabelWithInput";
import ModalHeader from "./ModalHeader";
import { updateUser } from "../../service/authService";
import { getApiErrorMessage } from "../../service/Constants";
import { updateUserSchema } from "../../validation/updateUserSchema";
import { validateWith } from "../../validation/common";
import { useUnsavedChangesGuard } from "../../hooks/useUnsavedChangesGuard";

export default function EditProfileModal(props) {
  const [initialForm] = useState(() => ({
    firstName: props.user.firstName ?? "",
    lastName: props.user.lastName ?? "",
    email: props.user.email ?? "",
    phoneNo: props.user.phone ?? "",
    address: props.user.address ?? "",
    currentPassword: "",
  }));
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  // Reset codes go to this address, so the server asks for the password before it changes.
  const emailChanged =
    form.email.trim().toLowerCase() !== (props.user.email ?? "").trim().toLowerCase();

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  // Cancel, Escape and clicking outside ask before throwing away edits (spaces alone don't count). Not while
  // saving.
  const { requestClose: close, discardDialog } = useUnsavedChangesGuard({
    dirty: Object.keys(initialForm).some((field) => form[field].trim() !== initialForm[field].trim()),
    busy: loading,
    onClose: props.onClose,
  });

  const updateProfile = async (event) => {
    event.preventDefault();
    const validation = validateWith(updateUserSchema, form);
    const passwordMissing = emailChanged && !form.currentPassword;
    if (!validation.success || passwordMissing) {
      setErrors({
        ...validation.errors,
        ...(passwordMissing && {
          currentPassword: "Enter your current password to change your email",
        }),
      });
      return;
    }
    setLoading(true);
    setServerError("");
    try {
      const updatedUser = await updateUser(
        props.user.id,
        validation.data.firstName,
        validation.data.lastName,
        validation.data.email,
        validation.data.phoneNo,
        validation.data.address,
        emailChanged ? form.currentPassword : undefined
      );
      // Keep the token and any other stored fields; only the profile fields change.
      const stored = JSON.parse(localStorage.getItem("userData")) || {};
      const userData = { ...stored, ...updatedUser };
      localStorage.setItem("userData", JSON.stringify(userData));
      window.dispatchEvent(new Event("userDataUpdated"));
      toast.success("Profile updated");
      props.onSaved(userData);
      props.onClose();
    } catch (error) {
      const message = getApiErrorMessage(error, "Failed to update profile.");
      // Show a wrong password next to the password box rather than at the bottom of the form.
      if (emailChanged && message === "Current password is incorrect") {
        setErrors((prev) => ({ ...prev, currentPassword: message }));
      } else {
        setServerError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && close()}>
      <DialogContent className="sm:max-w-xl">
        <form onSubmit={updateProfile} noValidate>
          <fieldset disabled={loading} className="grid min-w-0 gap-4">
            <ModalHeader
              title="Edit Profile"
              description="Update your personal details."
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <LabelWithInput
                htmlFor="firstName"
                labelName="First Name"
                inputType="text"
                inputId="firstName"
                placeholder="Enter first name"
                value={form.firstName}
                onChange={handleChange("firstName")}
                error={errors.firstName}
              />

              <LabelWithInput
                htmlFor="lastName"
                labelName="Last Name"
                inputType="text"
                inputId="lastName"
                placeholder="Enter last name"
                value={form.lastName}
                onChange={handleChange("lastName")}
                error={errors.lastName}
              />

              <LabelWithInput
                htmlFor="email"
                labelName="Email Address"
                inputType="text"
                inputId="email"
                placeholder="Enter email"
                value={form.email}
                onChange={handleChange("email")}
                error={errors.email}
              />

              <LabelWithInput
                htmlFor="phone"
                labelName="Phone No"
                optional
                inputType="text"
                inputId="phone"
                placeholder="Enter phone no"
                value={form.phoneNo}
                onChange={handleChange("phoneNo")}
                error={errors.phoneNo}
              />

              <LabelWithInput
                htmlFor="address"
                labelName="Address"
                optional
                inputType="text"
                inputId="address"
                placeholder="Enter address"
                value={form.address}
                onChange={handleChange("address")}
                error={errors.address}
                className="sm:col-span-2"
              />

              {emailChanged && (
                <LabelWithInput
                  htmlFor="currentPassword"
                  labelName="Current Password"
                  inputType="password"
                  inputId="currentPassword"
                  placeholder="Confirm it's you to change your email"
                  value={form.currentPassword}
                  onChange={handleChange("currentPassword")}
                  error={errors.currentPassword}
                  className="sm:col-span-2"
                />
              )}
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
                {loading ? "Updating..." : "Update"}
              </Button>
            </DialogFooter>
          </fieldset>
        </form>
        {discardDialog}
      </DialogContent>
    </Dialog>
  );
}
