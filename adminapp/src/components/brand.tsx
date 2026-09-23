import { cn } from "@/lib/utils"
import jlLogo from "@/assets/jl-logo.png"

export function Brand({
  compact = false,
  className,
  variant = "default",
}: {
  compact?: boolean
  className?: string
  variant?: "default" | "light"
}) {
  return (
    <div className={cn("flex items-center gap-3 select-none min-w-0 overflow-hidden", className)}>
      <img
        src={jlLogo}
        alt="Just Learning Logo"
        className={cn(
          "object-contain transition-all duration-200 shrink-0 drop-shadow-xs",
          compact ? "h-11 w-auto" : "h-14 w-auto"
        )}
      />
      {!compact && (
        <div className="flex flex-col min-w-0 justify-center">
          <span
            className={cn(
              "text-base font-extrabold tracking-tight leading-tight whitespace-nowrap truncate",
              variant === "light" ? "text-white" : "text-foreground"
            )}
          >
            Just Learning
          </span>
          <span
            className={cn(
              "text-[10px] font-bold tracking-wider uppercase leading-tight whitespace-nowrap truncate mt-0.5",
              variant === "light" ? "text-purple-200" : "text-primary"
            )}
          >
            Admin Workspace
          </span>
        </div>
      )}
    </div>
  )
}
