import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
  {
    variants: {
      variant: {
        // === Primary ===
        primary:
          "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary))]/90 focus-visible:ring-[hsl(var(--primary))]/30",

        // === Secondary ===
        secondary:
          "bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] hover:bg-[hsl(var(--secondary))]/90 border border-[hsl(var(--border))]/30",

        // === Outline ===
        outline:
          "border border-[hsl(var(--border))]/40 bg-transparent hover:bg-[hsl(var(--muted))]/40 text-foreground/80 dark:border-[hsl(var(--border))]/30",

        // === Edit (Subtle blue tone) ===
        edit:
          "border border-[hsl(var(--border))]/30 text-[hsl(var(--primary))] hover:text-[hsl(var(--primary-foreground))] hover:border-[hsl(var(--primary))]/40 hover:bg-[hsl(var(--primary))]/10 dark:hover:bg-[hsl(var(--primary))]/20",

        // === Delete (Danger tone) ===
        delete:
          "border border-[hsl(var(--border))]/30 text-[hsl(var(--destructive))] hover:text-[hsl(var(--destructive-foreground))] hover:border-[hsl(var(--destructive))]/40 hover:bg-[hsl(var(--destructive))]/10 dark:hover:bg-[hsl(var(--destructive))]/20",

        // === View (Info tone) ===
        view:
          "border border-[hsl(var(--border))]/30 text-[hsl(var(--info))] hover:text-[hsl(var(--info-foreground))] hover:border-[hsl(var(--info))]/40 hover:bg-[hsl(var(--info))]/10 dark:hover:bg-[hsl(var(--info))]/20",

        // === Reminder (Warning tone) ===
        reminder:
          "border border-[hsl(var(--border))]/30 text-[hsl(var(--warning))] hover:text-[hsl(var(--warning-foreground))] hover:border-[hsl(var(--warning))]/40 hover:bg-[hsl(var(--warning))]/10 dark:hover:bg-[hsl(var(--warning))]/20",

        // === Ghost ===
        ghost:
          "hover:bg-[hsl(var(--muted))]/30 hover:text-[hsl(var(--foreground))] dark:hover:bg-[hsl(var(--muted))]/40",

        // === Link ===
        link:
          "text-[hsl(var(--primary))] underline-offset-4 hover:underline",
      },

      // === Sizes ===
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-6 text-base",
        icon: "size-9",
        "icon-sm": "size-8",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
)

function Button({ className, variant, size, asChild = false, ...props }) {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
