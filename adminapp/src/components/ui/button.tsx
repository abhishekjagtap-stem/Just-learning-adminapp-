import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4",
  { variants: { variant: { default: "bg-primary text-primary-foreground hover:bg-primary/90", outline: "border bg-background hover:bg-muted", secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80", ghost: "hover:bg-muted", destructive: "bg-destructive text-white hover:bg-destructive/90" }, size: { default: "h-9 gap-1.5 px-3", sm: "h-8 gap-1 px-2.5 text-xs", lg: "h-10 gap-2 px-4", icon: "size-9", "icon-sm": "size-8" } }, defaultVariants: { variant: "default", size: "default" } },
)

function Button({ className, variant, size, ...props }: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return <ButtonPrimitive className={cn(buttonVariants({ variant, size, className }))} {...props} />
}

export { Button, buttonVariants }
