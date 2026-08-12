import { HeartHandshake } from "lucide-react"
import { cn } from "@/lib/utils"

export function Brand({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
        <HeartHandshake className="size-5" strokeWidth={2.25} />
      </div>
      {!compact && <p className="text-lg font-semibold tracking-tight text-foreground">Just Learning</p>}
    </div>
  )
}
