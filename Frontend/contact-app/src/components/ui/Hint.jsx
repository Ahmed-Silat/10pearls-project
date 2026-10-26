import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * Shows `label` in a shadcn/ui tooltip when `children` (one element, e.g. a Button) is hovered or focused.
 * Short for Tooltip + TooltipTrigger asChild + TooltipContent. With no label, renders the child as it is.
 */
export default function Hint({ label, side = "top", align = "center", children }) {
  if (!label) return children;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side} align={align} className="max-w-xs break-words">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
