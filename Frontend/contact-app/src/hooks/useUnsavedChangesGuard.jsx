import { useEffect, useState } from "react";
import DiscardChangesDialog from "../components/modals/DiscardChangesDialog";

/**
 * Stops a form's edits being thrown away by accident. `requestClose` is what the form's Cancel button, Escape and
 * clicking outside should call: it closes straight away when nothing has changed (`dirty` false), and otherwise
 * asks "Discard your changes?" first (render `discardDialog`). Closing is ignored while `busy` (saving). While
 * there are changes, closing or reloading the browser tab asks too.
 */
export function useUnsavedChangesGuard({ dirty, busy = false, onClose }) {
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (event) => {
      event.preventDefault();
      // Older browsers only ask when this is set.
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const requestClose = () => {
    if (busy) return;
    if (dirty) setConfirming(true);
    else onClose();
  };

  const discardDialog = confirming ? (
    <DiscardChangesDialog
      onKeepEditing={() => setConfirming(false)}
      onDiscard={() => {
        setConfirming(false);
        onClose();
      }}
    />
  ) : null;

  return { requestClose, discardDialog };
}
