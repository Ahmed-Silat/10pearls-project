import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import ModalHeader from "./ModalHeader";
import ContactFormFields from "./ContactFormFields";
import { getDuplicates, updateContact } from "../../service/ContactService";
import { useDuplicateCheck } from "../../hooks/useDuplicateCheck";
import DuplicateNotice from "../ui/DuplicateNotice";
import {
  contactToForm,
  EMPTY_CONTACT_FORM,
  richerFields,
  validateContactForm,
  withoutErrorsFor,
} from "./contactForm";
import { getApiErrorMessage } from "../../service/Constants";
import Spinner from "../ui/Spinner";

export default function EditModal(props) {
  const [contactId, setContactId] = useState("");
  const [form, setForm] = useState(EMPTY_CONTACT_FORM);
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

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => withoutErrorsFor(prev, field));
    setConfirmDuplicates(null);
  };

  const checkPhoneAndEmail = () => checkForDuplicates({ phone: form.phoneNo, email: form.email });

  // The modal cannot be closed while a save is in progress.
  const close = () => {
    if (!loading) props.onClose();
  };

  const updateCurrentContact = async ({ allowDuplicate = false } = {}) => {
    const validation = validateContactForm(form);
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
        { allowDuplicate, emergency: form.emergency, tagIds: form.tagIds, ...richerFields(validation.data) }
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
      setForm(contactToForm(props.contactData));
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
              <ContactFormFields
                form={form}
                errors={errors}
                onChange={updateField}
                onPhoneOrEmailBlur={checkPhoneAndEmail}
                disabled={loading}
              />
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
