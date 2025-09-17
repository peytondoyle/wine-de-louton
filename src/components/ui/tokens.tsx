import { cn } from "../../lib/utils"

export const menuContainer = (className?: string) =>
  cn(
    "z-[60] min-w-[12rem] overflow-hidden rounded-lg border",
    "border-neutral-200 bg-white text-neutral-900",
    "shadow-md",
    className
  )

export const menuViewport = "max-h-[60vh] overflow-auto p-1"
export const menuItemBase =
  "relative flex cursor-pointer select-none items-center gap-2 rounded-md px-3.5 min-h-10 text-[15px] leading-5 outline-none"
export const menuItemState =
  // default, hover, active, disabled, focus
  "text-neutral-900 hover:bg-neutral-100 data-[highlighted]:bg-neutral-100 " +
  "data-[state=checked]:bg-blue-50 data-[state=checked]:text-blue-700 " +
  "data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30"
export const menuItemIcon = "ml-auto size-4 shrink-0 text-current"
export const menuLabel = "px-3.5 py-2.5 text-[15px] font-semibold text-neutral-600"
export const menuSeparator = "my-1 h-px bg-neutral-200/70"

export const quietCard =
  "rounded-xl border border-neutral-200/70 bg-white shadow-sm " +
  "hover:shadow-card hover:translate-y-[1px] hover:border-neutral-200 active:translate-y-0 " +
  "motion-safe:transition-[box-shadow,transform] motion-safe:duration-150 motion-safe:ease-out motion-reduce:transition-none " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
