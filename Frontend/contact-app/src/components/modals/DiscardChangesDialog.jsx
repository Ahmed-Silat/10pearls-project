import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import ModalHeader from "./ModalHeader";

/** "Discard your changes?", shown over a form that's being closed with unsaved edits. */
export default function DiscardChangesDialog({ onKeepEditing, onDiscard }) {
  return (
    <AlertDialog open onOpenChange={(open) => !open && onKeepEditing()}>
      <AlertDialogContent className="sm:max-w-sm">
        <ModalHeader
          alert
          title="Discard your changes?"
          description="You haven't saved them, so they'll be lost."
        />
        <AlertDialogFooter className="gap-2 sm:gap-0">
          {/* Focused when the dialog opens, so pressing Enter by accident keeps the work. */}
          <AlertDialogCancel className="mt-0">
            Keep editing
          </AlertDialogCancel>
          <AlertDialogAction className={buttonVariants({ variant: "destructive" })} onClick={onDiscard}>
            Discard
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
