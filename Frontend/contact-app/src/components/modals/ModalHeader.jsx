import { DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/**
 * The title and one-line description at the top of a modal, in plain shadcn/ui style.
 * Pass `alert` inside an AlertDialog, so they're wired to that dialog instead.
 */
export default function ModalHeader({ title, description, alert = false }) {
  const Header = alert ? AlertDialogHeader : DialogHeader;
  const Title = alert ? AlertDialogTitle : DialogTitle;
  const Description = alert ? AlertDialogDescription : DialogDescription;

  return (
    <Header>
      <Title>{title}</Title>
      <Description>{description}</Description>
    </Header>
  );
}
