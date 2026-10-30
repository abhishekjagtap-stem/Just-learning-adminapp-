import { useMemo } from "react"
import { Clock } from "lucide-react"
import { cn } from "@/lib/utils"

export interface TimePicker12hProps {
  value?: string // Expects "HH:MM:SS" or "HH:MM"
  onChange: (value24: string) => void
  disabled?: boolean
  className?: string
  size?: "default" | "sm"
  presets?: string[] // Optional quick time presets in "HH:MM:SS"
}

// Convert "HH:MM:SS" or "HH:MM" -> { hour12: "09", minute: "00", period: "AM" }
export function parseTime24to12(timeStr?: string): {
  hour12: string
  minute: string
  period: "AM" | "PM"
} {
  if (!timeStr || typeof timeStr !== "string") {
    return { hour12: "09", minute: "00", period: "AM" }
  }

  const parts = timeStr.trim().split(":")
  let h = parseInt(parts[0] || "9", 10)
  const m = parseInt(parts[1] || "0", 10)

  if (isNaN(h)) h = 9
  const period: "AM" | "PM" = h >= 12 ? "PM" : "AM"

  let h12 = h % 12
  if (h12 === 0) h12 = 12

  const hour12 = String(h12).padStart(2, "0")
  const minute = String(isNaN(m) || m < 0 ? 0 : Math.min(59, m)).padStart(2, "0")

  return { hour12, minute, period }
}

// Convert { hour12: "09", minute: "00", period: "AM" } -> "09:00:00"
export function format12toTime24(
  hour12: string | number,
  minute: string | number,
  period: "AM" | "PM"
): string {
  let h = parseInt(String(hour12), 10)
  const m = parseInt(String(minute), 10)

  if (isNaN(h) || h < 1 || h > 12) h = 12
  const minVal = isNaN(m) || m < 0 ? 0 : Math.min(59, m)

  let h24 = h
  if (period === "AM") {
    if (h === 12) h24 = 0
  } else {
    if (h !== 12) h24 = h + 12
  }

  return `${String(h24).padStart(2, "0")}:${String(minVal).padStart(2, "0")}:00`
}

// Formats "09:00:00" -> "9:00 AM" for human friendly display
export function formatTimeDisplay(timeStr?: string): string {
  if (!timeStr) return ""
  const { hour12, minute, period } = parseTime24to12(timeStr)
  const h = parseInt(hour12, 10)
  return `${h}:${minute} ${period}`
}

// Formats "2026-11-20" -> "Fri, 20 Nov 2026"
export function formatDateDisplay(dateStr?: string): string {
  if (!dateStr) return ""
  try {
    const [year, month, day] = dateStr.split("-").map(Number)
    if (!year || !month || !day) return dateStr
    const d = new Date(year, month - 1, day)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  } catch {
    return dateStr
  }
}

const HOURS_12 = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"]

// Common 5-minute increments for cleaner dropdowns, plus fallback to 00-59
const MINUTES_5 = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"))

export function TimePicker12h({
  value = "09:00:00",
  onChange,
  disabled = false,
  className,
  size = "default",
  presets,
}: TimePicker12hProps) {
  const { hour12, minute, period } = useMemo(() => parseTime24to12(value), [value])

  const handleHourChange = (newHour: string) => {
    const updated = format12toTime24(newHour, minute, period)
    onChange(updated)
  }

  const handleMinuteChange = (newMinute: string) => {
    const updated = format12toTime24(hour12, newMinute, period)
    onChange(updated)
  }

  const handlePeriodChange = (newPeriod: "AM" | "PM") => {
    if (newPeriod === period) return
    const updated = format12toTime24(hour12, minute, newPeriod)
    onChange(updated)
  }

  const isSmall = size === "sm"

  return (
    <div className={cn("space-y-1.5", className)}>
      <div
        className={cn(
          "flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-border bg-white dark:bg-slate-900/70 shadow-2xs transition-all focus-within:border-amber-500 focus-within:ring-4 focus-within:ring-amber-500/10",
          disabled && "opacity-60 pointer-events-none bg-slate-100 dark:bg-slate-800",
          isSmall ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-sm"
        )}
      >
        <Clock className={cn("text-amber-600 dark:text-amber-400 shrink-0", isSmall ? "size-3.5" : "size-4")} />

        {/* Hour Select */}
        <div className="relative inline-flex items-center">
          <select
            value={hour12}
            onChange={(e) => handleHourChange(e.target.value)}
            disabled={disabled}
            aria-label="Hour (1-12)"
            className={cn(
              "font-bold text-slate-900 dark:text-foreground bg-transparent appearance-none text-center cursor-pointer focus:outline-none focus:text-amber-600 dark:focus:text-amber-400 pr-1",
              isSmall ? "text-xs py-0.5" : "text-sm py-1"
            )}
          >
            {HOURS_12.map((h) => (
              <option key={h} value={h} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-foreground">
                {h}
              </option>
            ))}
          </select>
          <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase select-none mr-0.5">
            hr
          </span>
        </div>

        <span className="font-black text-slate-400 select-none">:</span>

        {/* Minute Select */}
        <div className="relative inline-flex items-center">
          <select
            value={minute}
            onChange={(e) => handleMinuteChange(e.target.value)}
            disabled={disabled}
            aria-label="Minute (00-59)"
            className={cn(
              "font-bold text-slate-900 dark:text-foreground bg-transparent appearance-none text-center cursor-pointer focus:outline-none focus:text-amber-600 dark:focus:text-amber-400 pr-1",
              isSmall ? "text-xs py-0.5" : "text-sm py-1"
            )}
          >
            {MINUTES_5.map((m) => (
              <option key={m} value={m} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-foreground">
                {m}
              </option>
            ))}
          </select>
          <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase select-none">
            min
          </span>
        </div>

        {/* AM / PM Segmented Toggle */}
        <div className="ml-auto inline-flex items-center rounded-lg bg-slate-100 dark:bg-slate-800/80 p-0.5 border border-slate-200/80 dark:border-border/80">
          <button
            type="button"
            disabled={disabled}
            onClick={() => handlePeriodChange("AM")}
            className={cn(
              "font-black rounded-md transition-all cursor-pointer select-none",
              isSmall ? "px-1.5 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
              period === "AM"
                ? "bg-amber-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            AM
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => handlePeriodChange("PM")}
            className={cn(
              "font-black rounded-md transition-all cursor-pointer select-none",
              isSmall ? "px-1.5 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
              period === "PM"
                ? "bg-amber-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            PM
          </button>
        </div>
      </div>

      {/* Quick Presets if provided */}
      {presets && presets.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Presets:
          </span>
          {presets.map((preset) => {
            const label = formatTimeDisplay(preset)
            const isSelected = value.slice(0, 5) === preset.slice(0, 5)
            return (
              <button
                key={preset}
                type="button"
                onClick={() => onChange(preset)}
                className={cn(
                  "rounded-md px-2 py-0.5 text-[10px] font-bold transition-all cursor-pointer border",
                  isSelected
                    ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40 ring-1 ring-amber-500/30"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-border hover:bg-slate-50 dark:hover:bg-slate-800"
                )}
              >
                {label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
