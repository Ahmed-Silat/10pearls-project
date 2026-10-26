import { useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import LabelWithInput from "../label-and-inputs/LabelWithInput";
import ModalHeader from "../modals/ModalHeader";
import { CheckIcon } from "../icons/Icons";
import { createTag, TAG_COLORS, updateTag } from "../../service/TagService";
import { getApiErrorMessage } from "../../service/Constants";
import { colorLabel, tagDotClass } from "./tagColors";

/**
 * Creates a tag, or renames/recolours `tag` when one is passed. `onSaved` gets the saved tag.
 */
export default function TagDialog({ tag, onClose, onSaved }) {
  const isEdit = Boolean(tag);
  const [name, setName] = useState(tag?.name ?? "");
  const [color, setColor] = useState(tag?.color ?? "blue");
  const [error, setError] = useState("");
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const close = () => {
    if (!loading) onClose();
  };

  const save = async (event) => {
    event.preventDefault();
    const trimmed = name.trim().replace(/\s+/g, " ");
    if (!trimmed) return setError("Give the tag a name");
    if (trimmed.length > 30) return setError("Tag names can be up to 30 characters");
    setLoading(true);
    setServerError("");
    try {
      const saved = isEdit ? await updateTag(tag.id, trimmed, color) : await createTag(trimmed, color);
      toast.success(isEdit ? "Tag updated" : "Tag created");
      onSaved?.(saved);
      onClose();
    } catch (err) {
      setServerError(getApiErrorMessage(err, isEdit ? "Couldn't update the tag." : "Couldn't create the tag."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && close()}>
      <DialogContent className="sm:max-w-sm">
        <form onSubmit={save} noValidate>
          <fieldset disabled={loading} className="grid min-w-0 gap-4">
            <ModalHeader
              title={isEdit ? "Edit tag" : "New tag"}
              description={isEdit ? "Rename the tag or pick another colour." : "Group contacts like Family or Work."}
            />
            <LabelWithInput
              htmlFor="tagName"
              inputId="tagName"
              labelName="Name"
              placeholder="e.g. Family"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setError("");
              }}
              error={error}
            />
            <div className="grid gap-2">
              <Label id="tag-color-label">Colour</Label>
              <div role="radiogroup" aria-labelledby="tag-color-label" className="flex flex-wrap gap-2">
                {TAG_COLORS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    role="radio"
                    aria-checked={color === option}
                    aria-label={colorLabel(option)}
                    onClick={() => setColor(option)}
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-full text-white ring-offset-background transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      tagDotClass(option),
                      color === option && "ring-2 ring-foreground ring-offset-2"
                    )}
                  >
                    {color === option && <CheckIcon className="h-4 w-4" />}
                  </button>
                ))}
              </div>
            </div>
            {serverError && (
              <Alert variant="destructive">
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            )}
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" data-autofocus onClick={close}>
                Cancel
              </Button>
              <Button type="submit" loading={loading}>
                {loading ? "Saving..." : isEdit ? "Save" : "Create tag"}
              </Button>
            </DialogFooter>
          </fieldset>
        </form>
      </DialogContent>
    </Dialog>
  );
}
