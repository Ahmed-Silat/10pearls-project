import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/** Small spinning loading indicator (shadcn style). Inherits the text colour of its parent. */
export default function Spinner({ className = "h-4 w-4" }) {
  return <LoaderCircle className={cn("animate-spin", className)} aria-hidden="true" />;
}
