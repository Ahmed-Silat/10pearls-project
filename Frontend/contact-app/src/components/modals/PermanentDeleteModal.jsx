import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import ModalHeader from "./ModalHeader";

/** Confirms deleting a contact from Recently deleted for good. `onConfirm` does the delete and may throw. */
export default function PermanentDeleteModal({ name, onConfirm, onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // The modal cannot be closed while the delete is in progress.
  const close = () => {
    if (!loading) onClose();
  };

  const confirm = async () => {
    setLoading(true);
    setError("");
    try {
      await onConfirm();
    } catch (message) {
      setError(String(message));
      setLoading(false);
    }
  };

  return (
    <AlertDialog open onOpenChange={(open) => !open && close()}>
      <AlertDialogContent className="sm:max-w-md">
        <fieldset disabled={loading} className="grid min-w-0 gap-4">
          <ModalHeader alert title="Delete permanently?" description="This can't be undone." />
          <p className="text-sm text-muted-foreground">
            <span className="font-medium capitalize text-foreground">{name}</span> will be deleted for good
            and can no longer be restored.
          </p>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="mt-0">Cancel</AlertDialogCancel>
            <Button variant="destructive" loading={loading} onClick={confirm}>
              {loading ? "Deleting..." : "Delete forever"}
            </Button>
          </AlertDialogFooter>
        </fieldset>
      </AlertDialogContent>
    </AlertDialog>
  );
}
