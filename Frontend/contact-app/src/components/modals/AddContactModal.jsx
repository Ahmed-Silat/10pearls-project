import { useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { createNewContact, getDuplicates } from "../../service/ContactService";
import { useDuplicateCheck } from "../../hooks/useDuplicateCheck";
import DuplicateNotice from "../ui/DuplicateNotice";
import ContactFormFields from "./ContactFormFields";
import ModalHeader from "./ModalHeader";
import {
  EMPTY_CONTACT_FORM,
  hasFormChanged,
  richerFields,
  validateContactForm,
  withoutErrorsFor,
} from "./contactForm";
import { useUnsavedChangesGuard } from "../../hooks/useUnsavedChangesGuard";
import { getApiErrorMessage } from "../../service/Constants";

/**
 * `defaultEmergency` starts with "Emergency contact" ticked (used on the Emergency page); `defaultTagIds` starts
 * with those tags picked (used on a tag's page).
 */
export default function AddContactModal(props) {
  const [initialForm] = useState(() => ({
    ...EMPTY_CONTACT_FORM,
    emergency: Boolean(props.defaultEmergency),
    tagIds: props.defaultTagIds ?? [],
  }));
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  // Warning shown while typing, and the server's duplicate list once Save was pressed (then "Save anyway?").
  const { matches: possibleDuplicates, check: checkForDuplicates } = useDuplicateCheck();
  const [confirmDuplicates, setConfirmDuplicates] = useState(null);
  const userId = props.userId;

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => withoutErrorsFor(prev, field));
    setConfirmDuplicates(null);
  };

  const checkPhoneAndEmail = () => checkForDuplicates({ phone: form.phoneNo, email: form.email });

  // Cancel, Escape and clicking outside ask before throwing away what was typed. Not while saving.
  const { requestClose: close, discardDialog } = useUnsavedChangesGuard({
    dirty: hasFormChanged(initialForm, form),
    busy: loading,
    onClose: props.onClose,
  });

  const addNewContact = async ({ allowDuplicate = false } = {}) => {
    const validation = validateContactForm(form);
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
        { allowDuplicate, emergency: form.emergency, tagIds: form.tagIds, ...richerFields(validation.data) }
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

            <ContactFormFields
              form={form}
              errors={errors}
              onChange={updateField}
              onPhoneOrEmailBlur={checkPhoneAndEmail}
              disabled={loading}
            />
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
        {discardDialog}
      </DialogContent>
    </Dialog>
  );
}
