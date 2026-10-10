import { useEffect, useState } from "react";
import { toast } from "sonner";
import Modal from "../ui/Modal";
import LabelWithInput from "../label-and-inputs/LabelWithInput";
import { updateContact } from "../../service/ContactService";
import { PencilIcon } from "../icons/Icons";
import { createContactSchema } from "../../validation/createContactSchema";
import { validateWith } from "../../validation/common";
import { getApiErrorMessage } from "../../service/Constants";
import Button from "../button/Button";
import Spinner from "../ui/Spinner";

export default function EditModal(props) {
  const [contactId, setContactId] = useState("");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNo: "",
    address: "",
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  // The contact is still being fetched when the modal first opens.
  const isLoadingContact = !props.contactData;

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  // The modal cannot be closed while a save is in progress.
  const close = () => {
    if (!loading) props.onClose();
  };

  const updateCurrentContact = async (event) => {
    event.preventDefault();
    const validation = validateWith(createContactSchema, form);
    if (!validation.success) {
      setErrors(validation.errors);
      return;
    }
    setLoading(true);
    setServerError("");
    try {
      await updateContact(
        contactId,
        validation.data.firstName,
        validation.data.lastName,
        validation.data.email,
        validation.data.phoneNo,
        validation.data.address
      );
      toast.success("Contact updated");
      props.getContacts();
      props.onClose();
    } catch (error) {
      setServerError(getApiErrorMessage(error, "Failed to update contact."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (props.contactData) {
      setContactId(props.contactData.id);
      setForm({
        firstName: props.contactData.firstName,
        lastName: props.contactData.lastName ?? "",
        email: props.contactData.email ?? "",
        phoneNo: props.contactData.phone ?? "",
        address: props.contactData.address ?? "",
      });
    }
  }, [props.contactData]);

  return (
    <Modal onClose={close} titleId="edit-contact-title" panelClassName="sm:max-w-xl">
      <form onSubmit={updateCurrentContact} noValidate>
        <fieldset disabled={loading} className="min-w-0">
          <div className="px-6 pt-6">
            <div className="flex items-center gap-4">
              <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                <PencilIcon className="h-5 w-5" />
              </span>
              <div>
                <h3 id="edit-contact-title" className="text-lg font-semibold text-slate-900">
                  Update Contact
                </h3>
                <p className="text-xs text-slate-500">
                  Edit the details of this contact.
                </p>
              </div>
            </div>

            {/* The modal opens straight away; the form appears once the contact has loaded. */}
            {isLoadingContact ? (
              <div
                role="status"
                className="flex min-h-[18rem] flex-col items-center justify-center gap-3 text-sky-600"
              >
                <Spinner className="h-7 w-7" />
                <p className="text-sm font-medium text-slate-500">Loading contact details...</p>
              </div>
            ) : (
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
                  optional
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
                  optional
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
            )}
            {serverError && (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{serverError}</p>
            )}
          </div>

          <div className="mt-2 flex flex-col-reverse gap-2 rounded-b-2xl border-t border-slate-100 bg-slate-50 px-6 py-4 sm:flex-row-reverse">
            <Button
              type="submit"
              name={loading ? "Updating..." : "Update"}
              loading={loading}
              disabled={isLoadingContact}
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
