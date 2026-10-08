import { useState } from "react";
import Modal from "../ui/Modal";
import { createNewContact } from "../../service/ContactService";
import LabelWithInput from "../label-and-inputs/LabelWithInput";
import { PlusIcon } from "../icons/Icons";
import { createContactSchema } from "../../validation/createContactSchema";
import { validateWith } from "../../validation/common";

const emptyContact = {
  firstName: "",
  lastName: "",
  email: "",
  phoneNo: "",
  address: "",
};

export default function AddContactModal(props) {
  const [form, setForm] = useState(emptyContact);
  const [errors, setErrors] = useState({});
  const userId = props.userId;

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const addNewContact = async (event) => {
    event.preventDefault();
    const validation = validateWith(createContactSchema, form);
    if (!validation.success) {
      setErrors(validation.errors);
      return;
    }
    await createNewContact(
      validation.data.firstName,
      validation.data.lastName,
      validation.data.email,
      validation.data.address,
      validation.data.phoneNo,
      userId
    );
    props.fetchContacts();
    props.onClose();
  };

  return (
    <Modal onClose={props.onClose} titleId="add-contact-title" panelClassName="sm:max-w-xl">
      <form onSubmit={addNewContact} noValidate>
        <div className="px-6 pt-6">
          <div className="flex items-center gap-4">
            <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
              <PlusIcon className="h-5 w-5" />
            </span>
            <div>
              <h3 id="add-contact-title" className="text-lg font-semibold text-slate-900">
                Add Contact
              </h3>
              <p className="text-xs text-slate-500">
                Fill in the details to save a new contact.
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
        </div>

        <div className="mt-2 flex flex-col-reverse gap-2 rounded-b-2xl border-t border-slate-100 bg-slate-50 px-6 py-4 sm:flex-row-reverse">
          <button
            type="submit"
            className="inline-flex w-full justify-center rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-700 sm:w-auto"
          >
            Add Contact
          </button>
          <button
            type="button"
            data-autofocus
            onClick={props.onClose}
            className="mt-0 inline-flex w-full justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 transition-colors hover:bg-slate-50 sm:w-auto"
          >
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}