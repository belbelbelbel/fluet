import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 dark:ring-offset-neutral-950 dark:focus-visible:ring-neutral-300",
  {
    variants: {
      variant: {
        default: "bg-gray-950 dark:bg-purple-600 text-white hover:bg-gray-900 dark:hover:bg-purple-700 shadow-md hover:shadow-lg transition-all",
        destructive:
          "bg-red-600 text-white hover:bg-red-700 shadow-md hover:shadow-lg transition-all",
        outline:
          "border-2 border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-950 dark:text-slate-100 hover:bg-gray-100 dark:hover:bg-slate-700 hover:border-gray-400 dark:hover:border-slate-500 transition-all",
        ghost:
          "hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-200 hover:text-gray-950 dark:hover:text-white transition-all",
        secondary:
          "bg-gray-100 dark:bg-slate-700 text-gray-950 dark:text-slate-100 hover:bg-gray-200 dark:hover:bg-slate-600 transition-all",
        link: "text-neutral-900 dark:text-neutral-100 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-auto px-4 py-2",
        sm: "h-9 rounded-lg px-3",
        lg: "h-11 rounded-xl px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
