import { cn } from "../../lib/utils"

export const menuContainer = (className?: string) =>
  cn(
    "z-[60] min-w-[12rem] overflow-hidden rounded-lg border",
    "border-neutral-200/80 bg-white text-neutral-900",
    "shadow-lg shadow-black/5 ring-1 ring-black/5",
    "backdrop-blur supports-[backdrop-filter]:bg-white/95",
    className
  )

export const menuViewport = "max-h-[60vh] overflow-auto p-1"
export const menuItemBase =
  "relative flex cursor-pointer select-none items-center gap-2 rounded-md px-3 py-2 text-[14px] leading-5 outline-none"
export const menuItemState =
  // default, hover, active, disabled, focus
  "text-neutral-900 hover:bg-neutral-50 data-[highlighted]:bg-neutral-100 " +
  "data-[state=checked]:bg-blue-50 data-[state=checked]:text-blue-700 " +
  "data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30"
export const menuItemIcon = "ml-auto size-4 shrink-0 text-current"
export const menuLabel = "px-3 py-2 text-[12px] font-medium uppercase tracking-wide text-neutral-500"
export const menuSeparator = "my-1 h-px bg-neutral-200/70"

export const quietCard =
  "rounded-xl border border-neutral-200/70 bg-white shadow-sm " +
  "hover:shadow-md hover:border-neutral-300/70 " +
  "transition-shadow transition-colors duration-150 motion-reduce:transition-none " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
