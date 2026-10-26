import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import ModalHeader from "./ModalHeader";
import LabelWithInput from "../label-and-inputs/LabelWithInput";
import { Label } from "@/components/ui/label";
import EmergencyField from "./EmergencyField";
import TagPicker from "../tags/TagPicker";
import { getDuplicates, updateContact } from "../../service/ContactService";
import { useDuplicateCheck } from "../../hooks/useDuplicateCheck";
import DuplicateNotice from "../ui/DuplicateNotice";
import { createContactSchema } from "../../validation/createContactSchema";
import { validateWith } from "../../validation/common";
import { getApiErrorMessage } from "../../service/Constants";
import Spinner from "../ui/Spinner";

export default function EditModal(props) {
  const [contactId, setContactId] = useState("");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNo: "",
    address: "",
    emergency: false,
    tagIds: [],
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  // The contact is still being fetched when the modal first opens.
  const isLoadingContact = !props.contactData;
  // Warning shown while typing, and the server's duplicate list once Update was pressed (then "Save anyway?").
  // The contact being edited is left out, so it never clashes with itself.
  const { matches: possibleDuplicates, check: checkForDuplicates } = useDuplicateCheck(
    props.contactData?.id
  );
  const [confirmDuplicates, setConfirmDuplicates] = useState(null);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setConfirmDuplicates(null);
  };

  const handleEmergencyChange = (checked) => setForm((prev) => ({ ...prev, emergency: checked }));
  const handleTagsChange = (tagIds) => setForm((prev) => ({ ...prev, tagIds }));

  const checkPhoneAndEmail = () => checkForDuplicates({ phone: form.phoneNo, email: form.email });

  // The modal cannot be closed while a save is in progress.
  const close = () => {
    if (!loading) props.onClose();
  };

  const updateCurrentContact = async ({ allowDuplicate = false } = {}) => {
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
        validation.data.address,
        { allowDuplicate, emergency: form.emergency, tagIds: form.tagIds }
      );
      toast.success("Contact updated");
      props.getContacts();
      props.onClose();
    } catch (error) {
      const duplicates = getDuplicates(error);
      if (duplicates) setConfirmDuplicates(duplicates);
      else setServerError(getApiErrorMessage(error, "Failed to update contact."));
    } finally {
      setLoading(false);
    }
  };

  const submit = (event) => {
    event.preventDefault();
    updateCurrentContact();
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
        emergency: Boolean(props.contactData.emergency),
        tagIds: (props.contactData.tags ?? []).map((tag) => tag.id),
      });
    }
  }, [props.contactData]);

  return (
    <Dialog open onOpenChange={(open) => !open && close()}>
      <DialogContent className="sm:max-w-xl">
        <form onSubmit={submit} noValidate>
          <fieldset disabled={loading} className="grid min-w-0 gap-4">
            <ModalHeader
              title="Update Contact"
              description="Edit the details of this contact."
            />

            {/* The modal opens straight away; the form appears once the contact has loaded. */}
            {isLoadingContact ? (
              <div
                role="status"
                className="flex min-h-[18rem] flex-col items-center justify-center gap-3 text-muted-foreground"
              >
                <Spinner className="h-6 w-6" />
                <p className="text-sm">Loading contact details...</p>
              </div>
            ) : (
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

                <div className="grid gap-2 sm:col-span-2">
                  <Label htmlFor="tags">
                    Tags <span className="ml-1 font-normal text-muted-foreground">(optional)</span>
                  </Label>
                  <TagPicker id="tags" value={form.tagIds} onChange={handleTagsChange} disabled={loading} />
                </div>

                <EmergencyField
                  checked={form.emergency}
                  onChange={handleEmergencyChange}
                  className="sm:col-span-2"
                />
              </div>
            )}
            {!isLoadingContact && (
              <DuplicateNotice
                matches={confirmDuplicates ?? possibleDuplicates}
                confirm={Boolean(confirmDuplicates)}
              />
            )}
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
                    onClick={() => updateCurrentContact({ allowDuplicate: true })}
                  >
                    {loading ? "Updating..." : "Save anyway"}
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" data-autofocus onClick={close}>
                    Cancel
                  </Button>
                  <Button type="submit" loading={loading} disabled={isLoadingContact}>
                    {loading ? "Updating..." : "Update"}
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
