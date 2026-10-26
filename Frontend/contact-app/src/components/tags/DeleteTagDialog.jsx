import { useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogFooter } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import ModalHeader from "../modals/ModalHeader";
import { deleteTag } from "../../service/TagService";
import { getApiErrorMessage } from "../../service/Constants";

/** Confirms deleting a tag. The contacts stay; they just lose the tag. `onDeleted` runs after it's gone. */
export default function DeleteTagDialog({ tag, onClose, onDeleted }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const close = () => {
    if (!loading) onClose();
  };

  const confirm = async () => {
    setLoading(true);
    setError("");
    try {
      await deleteTag(tag.id);
      toast.success(`Deleted the tag "${tag.name}"`);
      onDeleted?.();
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err, "Couldn't delete the tag."));
      setLoading(false);
    }
  };

  return (
    <AlertDialog open onOpenChange={(open) => !open && close()}>
      <AlertDialogContent className="sm:max-w-md">
        <ModalHeader
          alert
          title={`Delete the tag "${tag.name}"?`}
          description="Contacts with this tag stay where they are; they just lose the tag."
        />
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <Button variant="destructive" loading={loading} onClick={confirm}>
            {loading ? "Deleting..." : "Delete tag"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
