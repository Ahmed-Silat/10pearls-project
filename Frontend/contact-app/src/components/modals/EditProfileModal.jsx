import { useState } from "react";
import Modal from "../ui/Modal";
import LabelWithInput from "../label-and-inputs/LabelWithInput";
import { updateUser } from "../../service/authService";
import { getApiErrorMessage } from "../../service/Constants";
import { PencilIcon } from "../icons/Icons";
import { updateUserSchema } from "../../validation/updateUserSchema";
import { validateWith } from "../../validation/common";

export default function EditProfileModal(props) {
  const [form, setForm] = useState({
    firstName: props.user.firstName ?? "",
    lastName: props.user.lastName ?? "",
    email: props.user.email ?? "",
    phoneNo: props.user.phone ?? "",
    address: props.user.address ?? "",
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const updateProfile = async (event) => {
    event.preventDefault();
    const validation = validateWith(updateUserSchema, form);
    if (!validation.success) {
      setErrors(validation.errors);
      return;
    }
    try {
      const updatedUser = await updateUser(
        props.user.id,
        validation.data.firstName,
        validation.data.lastName,
        validation.data.email,
        validation.data.phoneNo,
        validation.data.address
      );
      // Keep the token and any other stored fields; only the profile fields change.
      const stored = JSON.parse(localStorage.getItem("userData")) || {};
      const userData = { ...stored, ...updatedUser };
      localStorage.setItem("userData", JSON.stringify(userData));
      window.dispatchEvent(new Event("userDataUpdated"));
      props.onSaved(userData);
      props.onClose();
    } catch (error) {
      setServerError(getApiErrorMessage(error, "Failed to update profile."));
    }
  };

  return (
    <Modal onClose={props.onClose} titleId="edit-profile-title" panelClassName="sm:max-w-xl">
      <form onSubmit={updateProfile} noValidate>
        <div className="px-6 pt-6">
          <div className="flex items-center gap-4">
            <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
              <PencilIcon className="h-5 w-5" />
            </span>
            <div>
              <h3 id="edit-profile-title" className="text-lg font-semibold text-slate-900">
                Edit Profile
              </h3>
              <p className="text-xs text-slate-500">
                Update your personal details.
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-x-4 sm:grid-cols-2">
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
          </div>
          {serverError && (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{serverError}</p>
          )}
        </div>

        <div className="mt-2 flex flex-col-reverse gap-2 rounded-b-2xl border-t border-slate-100 bg-slate-50 px-6 py-4 sm:flex-row-reverse">
          <button
            type="submit"
            className="inline-flex w-full justify-center rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-700 sm:w-auto"
          >
            Update
          </button>
          <button
            type="button"
            data-autofocus
            onClick={props.onClose}
            className="inline-flex w-full justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 transition-colors hover:bg-slate-50 sm:w-auto"
          >
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}
