import { useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { createNewContact, getDuplicates } from "../../service/ContactService";
import { useDuplicateCheck } from "../../hooks/useDuplicateCheck";
import DuplicateNotice from "../ui/DuplicateNotice";
import LabelWithInput from "../label-and-inputs/LabelWithInput";
import EmergencyField from "./EmergencyField";
import ModalHeader from "./ModalHeader";
import { createContactSchema } from "../../validation/createContactSchema";
import { validateWith } from "../../validation/common";
import { getApiErrorMessage } from "../../service/Constants";

const emptyContact = {
  firstName: "",
  lastName: "",
  email: "",
  phoneNo: "",
  address: "",
  emergency: false,
};

/** `defaultEmergency` starts with "Emergency contact" ticked (used on the Emergency page). */
export default function AddContactModal(props) {
  const [form, setForm] = useState(() => ({ ...emptyContact, emergency: Boolean(props.defaultEmergency) }));
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  // Warning shown while typing, and the server's duplicate list once Save was pressed (then "Save anyway?").
  const { matches: possibleDuplicates, check: checkForDuplicates } = useDuplicateCheck();
  const [confirmDuplicates, setConfirmDuplicates] = useState(null);
  const userId = props.userId;

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setConfirmDuplicates(null);
  };

  const handleEmergencyChange = (checked) => setForm((prev) => ({ ...prev, emergency: checked }));

  const checkPhoneAndEmail = () => checkForDuplicates({ phone: form.phoneNo, email: form.email });

  // The modal cannot be closed while a save is in progress.
  const close = () => {
    if (!loading) props.onClose();
  };

  const addNewContact = async ({ allowDuplicate = false } = {}) => {
    const validation = validateWith(createContactSchema, form);
    if (!validation.success) {
      setErrors(validation.errors);
      return;
    }
    setLoading(true);
    setServerError("");
    try {
      await createNewContact(
        validation.data.firstName,
        validation.data.lastName,
        validation.data.email,
        validation.data.address,
        validation.data.phoneNo,
        userId,
        { allowDuplicate, emergency: form.emergency }
      );
      toast.success("Contact added");
      props.fetchContacts();
      props.onClose();
    } catch (error) {
      const duplicates = getDuplicates(error);
      if (duplicates) setConfirmDuplicates(duplicates);
      else setServerError(getApiErrorMessage(error, "Failed to add contact."));
    } finally {
      setLoading(false);
    }
  };

  const submit = (event) => {
    event.preventDefault();
    addNewContact();
  };

  return (
    <Dialog open onOpenChange={(open) => !open && close()}>
      <DialogContent className="sm:max-w-xl">
        <form onSubmit={submit} noValidate>
          <fieldset disabled={loading} className="grid min-w-0 gap-4">
            <ModalHeader
              title="Add Contact"
              description="Fill in the details to save a new contact."
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
                onBlur={checkPhoneAndEmail}
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
                onBlur={checkPhoneAndEmail}
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

              <EmergencyField
                checked={form.emergency}
                onChange={handleEmergencyChange}
                className="sm:col-span-2"
              />
            </div>
            <DuplicateNotice
              matches={confirmDuplicates ?? possibleDuplicates}
              confirm={Boolean(confirmDuplicates)}
            />
            {serverError && (
              <Alert variant="destructive">
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              {confirmDuplicates ? (
                <>
                  <Button variant="outline" onClick={() => setConfirmDuplicates(null)}>
                    Go back
                  </Button>
                  <Button
                    variant="warning"
                    loading={loading}
                    onClick={() => addNewContact({ allowDuplicate: true })}
                  >
                    {loading ? "Adding..." : "Save anyway"}
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" data-autofocus onClick={close}>
                    Cancel
                  </Button>
                  <Button type="submit" loading={loading}>
                    {loading ? "Adding..." : "Add Contact"}
                  </Button>
                </>
              )}
            </DialogFooter>
          </fieldset>
        </form>
      </DialogContent>
    </Dialog>
  );
}
