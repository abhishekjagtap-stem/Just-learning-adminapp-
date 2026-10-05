import { useEffect, useState, useMemo } from "react"
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  MapPin,
  RefreshCw,
  Sparkles,
  Eye,
  Filter,
  AlertCircle,
  Plus,
  Edit,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { cn } from "@/lib/utils"
import {
  fetchDynamicIndianHolidays,
  INDIAN_STATES,
  type DynamicHolidayItem,
} from "@/lib/holidays"
import {
  getCulturalStatesContentList,
  getTodayInIndiaCalendar,
  getTodayInIndiaDetail,
  deleteTodayInIndia,
  type StateCulturalContent,
  type TodayInIndiaCalendarEntry,
  type TodayInIndiaItem,
} from "@/lib/api"
import { TodayInIndiaEditor } from "./today-in-india-editor"
import { StatePreviewModal } from "./state-preview-modal"

interface DynamicCalendarItem {
  id: string
  date: string // "YYYY-MM-DD"
  title: string
  subtitle?: string
  description?: string
  source: "holiday_api" | "cultural_backend_api" | "today_in_india_api"
  category: "holiday" | "festival" | "observance" | "cultural_release" | "today_in_india"
  stateCode?: string | null
  stateName?: string | null
  isNational?: boolean
  culturalContent?: StateCulturalContent
  todayInIndiaEntry?: TodayInIndiaCalendarEntry
}

export function EditorialCalendar() {
  const { toast } = useToast()
  const today = new Date()
  const [currentDate, setCurrentDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const [selectedDateStr, setSelectedDateStr] = useState(() => today.toISOString().split("T")[0])
  const [selectedState, setSelectedState] = useState<string>("ALL")
  const [categoryFilter, setCategoryFilter] = useState<"all" | "today_in_india" | "holidays" | "cultural">("all")

  // Dynamic API state
  const [holidays, setHolidays] = useState<DynamicHolidayItem[]>([])
  const [culturalContents, setCulturalContents] = useState<StateCulturalContent[]>([])
  const [todayInIndiaMap, setTodayInIndiaMap] = useState<Record<string, TodayInIndiaCalendarEntry[]>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastSynced, setLastSynced] = useState<string | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)

  // Today in India Editor view state
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [todayInIndiaTargetDate, setTodayInIndiaTargetDate] = useState<string>(today.toISOString().split("T")[0])
  const [editingTodayInIndiaItem, setEditingTodayInIndiaItem] = useState<TodayInIndiaItem | null>(null)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)

  // Mobile preview modal for dynamic cultural state data
  const [previewContent, setPreviewContent] = useState<StateCulturalContent | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // Fetch dynamic data from APIs (Indian Calendar API + Cultural Backend API + Today in India Calendar API)
  const loadDynamicData = async (forceRefresh = false) => {
    if (forceRefresh) setIsRefreshing(true)
    else setIsLoading(true)
    setApiError(null)

    try {
      const [fetchedHolidays, fetchedContents, todayInIndiaRes] = await Promise.all([
        fetchDynamicIndianHolidays(year, forceRefresh),
        getCulturalStatesContentList().catch(() => [] as StateCulturalContent[]),
        getTodayInIndiaCalendar(year, month + 1).catch(() => ({ dates: {}, total_entries: 0, year, month: month + 1 })),
      ])

      setHolidays(fetchedHolidays)
      setCulturalContents(fetchedContents)
      setTodayInIndiaMap(todayInIndiaRes?.dates || {})
      setLastSynced(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }))
    } catch (err: any) {
      setApiError(err?.message || "Failed to sync dynamic data from API.")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    loadDynamicData()
  }, [year, month])

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const goToToday = () => {
    const now = new Date()
    setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1))
    setSelectedDateStr(now.toISOString().split("T")[0])
  }

  // Days in month calculation
  const firstDayIndex = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()

  const formatYMD = (y: number, m: number, d: number) => {
    const mm = String(m + 1).padStart(2, "0")
    const dd = String(d).padStart(2, "0")
    return `${y}-${mm}-${dd}`
  }

  // Aggregate all dynamic items from APIs into a unified list
  const dynamicCalendarItems = useMemo(() => {
    const items: DynamicCalendarItem[] = []

    // 1. Add Today in India scheduled items from backend API
    for (const [dateStr, entries] of Object.entries(todayInIndiaMap)) {
      for (const entry of entries) {
        items.push({
          id: `tii-${entry.id}`,
          date: dateStr,
          title: entry.title,
          subtitle: entry.category_display || entry.category.replace(/_/g, " "),
          description: entry.state ? `State: ${entry.state}` : "Pan-India",
          source: "today_in_india_api",
          category: "today_in_india",
          stateName: entry.state || null,
          isNational: !entry.state,
          todayInIndiaEntry: entry,
        })
      }
    }

    // 2. Add Holidays & Festivals from live Calendar API
    for (const h of holidays) {
      items.push({
        id: h.id,
        date: h.date,
        title: h.name,
        subtitle: h.localName,
        description: h.description,
        source: "holiday_api",
        category: h.category,
        stateCode: h.stateCode,
        stateName: h.stateName,
        isNational: h.isNational,
      })
    }

    // 3. Add Cultural State Data releases & updates from Backend API
    for (const content of culturalContents) {
      const dateToUse = content.updated_at || content.created_at
      if (dateToUse) {
        const itemDateStr = dateToUse.split("T")[0]
        if (itemDateStr.startsWith(String(year))) {
          items.push({
            id: `cultural-${content.id || content.state_name}-${itemDateStr}`,
            date: itemDateStr,
            title: `${content.state_name} Cultural Data`,
            subtitle: content.is_published ? "Published Live" : "Draft State Content",
            description: content.subtitle || `Capital: ${content.capital} • Language: ${content.language_spoken_mostly}`,
            source: "cultural_backend_api",
            category: "cultural_release",
            stateCode: content.state_code ? `IN-${content.state_code}` : null,
            stateName: content.state_name,
            isNational: false,
            culturalContent: content,
          })
        }
      }
    }

    return items
  }, [holidays, culturalContents, todayInIndiaMap, year])

  // Filter items based on selected state and category
  const filteredItems = useMemo(() => {
    return dynamicCalendarItems.filter((item) => {
      // Category filter
      if (categoryFilter === "today_in_india" && item.source !== "today_in_india_api") return false
      if (categoryFilter === "holidays" && item.source !== "holiday_api") return false
      if (categoryFilter === "cultural" && item.source !== "cultural_backend_api") return false

      // State filter
      if (selectedState !== "ALL") {
        if (item.isNational) return true
        if (item.stateCode && item.stateCode === selectedState) return true
        if (item.stateName && INDIAN_STATES.find((s) => s.code === selectedState)?.name.includes(item.stateName)) {
          return true
        }
        return false
      }

      return true
    })
  }, [dynamicCalendarItems, categoryFilter, selectedState])

  // Get items for a specific date
  const getItemsForDate = (dateStr: string) => {
    return filteredItems.filter((i) => i.date === dateStr)
  }

  // Selected date items
  const selectedDayItems = getItemsForDate(selectedDateStr)
  const selectedDayTodayInIndia = selectedDayItems.filter((i) => i.source === "today_in_india_api")
  const selectedDayOtherEvents = selectedDayItems.filter((i) => i.source !== "today_in_india_api")

  // Current month's items
  const currentMonthPrefix = `${year}-${String(month + 1).padStart(2, "0")}`
  const monthItems = filteredItems.filter((i) => i.date.startsWith(currentMonthPrefix))

  // Upcoming items from today onwards
  const todayStr = today.toISOString().split("T")[0]
  const upcomingItems = [...filteredItems]
    .filter((i) => i.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 6)

  // Handlers for Today in India
  const handleOpenCreateTodayInIndia = (targetDate?: string) => {
    setEditingTodayInIndiaItem(null)
    setTodayInIndiaTargetDate(targetDate || selectedDateStr || todayStr)
    setIsEditorOpen(true)
  }

  const handleEditTodayInIndia = async (id: number) => {
    try {
      setIsLoadingDetail(true)
      const detail = await getTodayInIndiaDetail(id)
      setEditingTodayInIndiaItem(detail)
      setTodayInIndiaTargetDate(detail.scheduled_date)
      setIsEditorOpen(true)
    } catch (err: any) {
      toast(err?.message || "Failed to load content details.", "error")
    } finally {
      setIsLoadingDetail(false)
    }
  }

  const handleDeleteTodayInIndia = async (id: number) => {
    if (!confirm("Are you sure you want to remove this Today in India scheduled entry?")) return
    try {
      await deleteTodayInIndia(id)
      toast("Today in India content deleted successfully.", "error")
      loadDynamicData(true)
    } catch (err: any) {
      toast(err?.message || "Failed to delete item.", "error")
    }
  }

  if (isEditorOpen) {
    return (
      <TodayInIndiaEditor
        initialData={editingTodayInIndiaItem}
        initialDate={todayInIndiaTargetDate}
        onBack={() => {
          setIsEditorOpen(false)
          setEditingTodayInIndiaItem(null)
        }}
        onSaved={() => {
          setIsEditorOpen(false)
          setEditingTodayInIndiaItem(null)
          loadDynamicData(true)
        }}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Top Controls & API Connection Badge */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-card p-4 sm:p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400">
            <CalendarIcon className="size-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-foreground">
                {monthNames[month]} {year}
              </h3>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-0.5 text-[11px] font-bold text-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live APIs Connected
              </span>
            </div>
            <p className="text-xs font-medium text-slate-600 dark:text-muted-foreground mt-0.5">
              Today in India Scheduling • Indian Calendar API • Cultural Backend API
              {lastSynced && ` • Synced at ${lastSynced}`}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Schedule Today in India Primary Button */}
          <Button
            size="sm"
            onClick={() => handleOpenCreateTodayInIndia(selectedDateStr)}
            className="gap-1.5 font-bold shadow-xs bg-orange-600 hover:bg-orange-700 text-white"
          >
            <Plus className="size-4" />
            Schedule Today in India
          </Button>

          {/* Refresh from API Button */}
          <Button
            size="sm"
            variant="outline"
            disabled={isRefreshing || isLoading}
            onClick={() => loadDynamicData(true)}
            className="gap-1.5 font-semibold text-xs border-slate-300 dark:border-border"
          >
            <RefreshCw className={cn("size-3.5", (isRefreshing || isLoading) && "animate-spin")} />
            Sync
          </Button>

          {/* Indian State / Region Filter */}
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-border bg-white dark:bg-background px-2.5 py-1 text-xs text-slate-800 dark:text-foreground shadow-2xs">
            <MapPin className="size-3.5 text-slate-500 dark:text-muted-foreground shrink-0" />
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="bg-transparent font-bold outline-none cursor-pointer max-w-[130px] truncate text-slate-900 dark:text-foreground"
              title="Filter by State"
            >
              {INDIAN_STATES.map((st) => (
                <option key={st.code} value={st.code}>
                  {st.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-border bg-white dark:bg-background px-2.5 py-1 text-xs text-slate-800 dark:text-foreground shadow-2xs">
            <Filter className="size-3.5 text-slate-500 dark:text-muted-foreground shrink-0" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as any)}
              className="bg-transparent font-bold outline-none cursor-pointer text-slate-900 dark:text-foreground"
            >
              <option value="all">All Events ({monthItems.length})</option>
              <option value="today_in_india">Today in India Stories</option>
              <option value="holidays">Holidays & Festivals</option>
              <option value="cultural">State Cultural Guides</option>
            </select>
          </div>

          {/* Month Navigation */}
          <div className="flex items-center gap-1 border border-slate-300 dark:border-border rounded-lg bg-white dark:bg-background p-0.5 shadow-2xs">
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-slate-700 dark:text-foreground hover:bg-slate-100 dark:hover:bg-muted"
              onClick={prevMonth}
              title="Previous month"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2.5 text-xs font-bold text-slate-900 dark:text-foreground hover:bg-slate-100 dark:hover:bg-muted"
              onClick={goToToday}
            >
              Today
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-slate-700 dark:text-foreground hover:bg-slate-100 dark:hover:bg-muted"
              onClick={nextMonth}
              title="Next month"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      {apiError && (
        <div className="flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{apiError}</span>
        </div>
      )}

      {/* Main Grid: Calendar Matrix & Inspection Sidebar */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Calendar View (8 Cols) */}
        <div className="lg:col-span-8 rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-card shadow-sm overflow-hidden flex flex-col">
          {/* Day of Week Header */}
          <div className="grid grid-cols-7 border-b border-slate-200 dark:border-border bg-slate-50 dark:bg-muted/40 text-center text-xs font-bold text-slate-700 dark:text-muted-foreground py-2.5">
            {dayNames.map((d, idx) => (
              <div
                key={d}
                className={cn(
                  "uppercase tracking-wider",
                  (idx === 0 || idx === 6) && "text-rose-600 dark:text-rose-400 font-extrabold"
                )}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Loading Indicator */}
          {isLoading ? (
            <div className="h-[480px] flex flex-col items-center justify-center gap-3 text-slate-500">
              <RefreshCw className="size-8 animate-spin text-orange-600" />
              <p className="text-sm font-semibold">Querying live API endpoints...</p>
            </div>
          ) : (
            /* Month Matrix Grid */
            <div className="grid grid-cols-7 divide-x divide-y divide-slate-200 dark:divide-border flex-1 border-b border-slate-200 dark:border-border">
              {/* Prev Month Days */}
              {Array.from({ length: firstDayIndex }).map((_, idx) => {
                const dayNum = daysInPrevMonth - firstDayIndex + idx + 1
                return (
                  <div
                    key={`prev-${idx}`}
                    className="min-h-[105px] bg-slate-50/70 dark:bg-muted/20 p-2 text-slate-400 dark:text-muted-foreground/40 select-none"
                  >
                    <span className="text-xs font-medium">{dayNum}</span>
                  </div>
                )
              })}

              {/* Current Month Days */}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const dayNum = idx + 1
                const dateStr = formatYMD(year, month, dayNum)
                const isSelected = dateStr === selectedDateStr
                const isToday = dateStr === todayStr
                const dayItems = getItemsForDate(dateStr)

                const hasTodayInIndia = dayItems.some((i) => i.source === "today_in_india_api")
                const hasHolidays = dayItems.some((i) => i.source === "holiday_api")
                const hasCultural = dayItems.some((i) => i.source === "cultural_backend_api")

                return (
                  <div
                    key={`day-${dayNum}`}
                    onClick={() => setSelectedDateStr(dateStr)}
                    className={cn(
                      "min-h-[105px] p-2 transition cursor-pointer flex flex-col justify-between group relative select-none",
                      "border-slate-200 dark:border-border hover:bg-slate-50 dark:hover:bg-muted/50",
                      isSelected && "bg-purple-50/90 dark:bg-primary/10 ring-2 ring-primary ring-inset z-10",
                      !isSelected && hasTodayInIndia && "bg-orange-50/60 dark:bg-orange-950/20",
                      !isSelected && hasHolidays && !hasTodayInIndia && "bg-amber-50/60 dark:bg-amber-950/20",
                      !isSelected && hasCultural && !hasHolidays && !hasTodayInIndia && "bg-blue-50/50 dark:bg-blue-950/20"
                    )}
                  >
                    {/* Date Number Header */}
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          "flex size-6 items-center justify-center rounded-full text-xs font-bold transition",
                          isToday
                            ? "bg-primary text-primary-foreground shadow-xs"
                            : isSelected
                            ? "text-primary font-black"
                            : "text-slate-800 dark:text-foreground font-semibold"
                        )}
                      >
                        {dayNum}
                      </span>

                      {/* Small badge indicators */}
                      <div className="flex items-center gap-1">
                        {hasTodayInIndia && (
                          <span
                            className="size-2 rounded-full bg-orange-600 shadow-2xs"
                            title="Today in India scheduled story"
                          />
                        )}
                        {hasCultural && (
                          <span
                            className="size-2 rounded-full bg-blue-500 shadow-2xs"
                            title="State Cultural Data"
                          />
                        )}
                        {hasHolidays && (
                          <span
                            className="size-2 rounded-full bg-amber-500 shadow-2xs"
                            title="Holiday/Festival"
                          />
                        )}
                      </div>
                    </div>

                    {/* Dynamic Event Badges */}
                    <div className="mt-1 space-y-1 flex-1 overflow-hidden">
                      {dayItems.slice(0, 2).map((item) => {
                        const isTII = item.source === "today_in_india_api"
                        const isHoliday = item.source === "holiday_api"

                        return (
                          <div
                            key={item.id}
                            className={cn(
                              "truncate rounded px-1.5 py-0.5 text-[10px] font-bold border shadow-2xs leading-tight",
                              isTII
                                ? "bg-orange-100 text-orange-950 border-orange-300 dark:bg-orange-950/80 dark:text-orange-200"
                                : isHoliday
                                ? item.category === "holiday"
                                  ? "bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950/80 dark:text-amber-200"
                                  : "bg-indigo-100 text-indigo-950 border-indigo-300 dark:bg-indigo-950/80 dark:text-indigo-200"
                                : "bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-200"
                            )}
                            title={`${item.title} (${item.subtitle || item.description})`}
                          >
                            {isTII ? "🇮🇳 " : isHoliday ? (item.category === "holiday" ? "✨ " : "🏛️ ") : "📍 "}
                            {item.title}
                          </div>
                        )
                      })}

                      {dayItems.length > 2 && (
                        <span className="block text-[10px] font-bold text-slate-500 dark:text-muted-foreground pl-0.5">
                          +{dayItems.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}

              {/* Next Month Trailing Days */}
              {(() => {
                const totalCells = firstDayIndex + daysInMonth
                const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7)
                return Array.from({ length: remainingCells }).map((_, idx) => (
                  <div
                    key={`next-${idx}`}
                    className="min-h-[105px] bg-slate-50/70 dark:bg-muted/20 p-2 text-slate-400 dark:text-muted-foreground/40 select-none"
                  >
                    <span className="text-xs font-medium">{idx + 1}</span>
                  </div>
                ))
              })()}
            </div>
          )}

          {/* Calendar Bottom Legend */}
          <div className="flex flex-wrap items-center justify-between border-t border-slate-200 dark:border-border bg-slate-50 dark:bg-muted/30 px-4 py-2.5 text-xs text-slate-600 dark:text-muted-foreground">
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-foreground">
                <span className="size-2.5 rounded-full bg-orange-600" />
                Today in India Stories
              </span>
              <span className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-foreground">
                <span className="size-2.5 rounded-full bg-amber-500" />
                Public Holidays
              </span>
              <span className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-foreground">
                <span className="size-2.5 rounded-full bg-indigo-500" />
                Religious Festivals
              </span>
              <span className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-foreground">
                <span className="size-2.5 rounded-full bg-emerald-500" />
                Cultural State Guides
              </span>
            </div>
            <span className="text-[11px] font-medium text-slate-500">
              Total {monthItems.length} dynamic items in {monthNames[month]}
            </span>
          </div>
        </div>

        {/* Selected Day Details & Inspection Column (4 Cols) */}
        <div className="lg:col-span-4 space-y-5">
          {/* Selected Day Card */}
          <div className="rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-card p-5 shadow-sm space-y-4">
            <div className="flex items-start justify-between border-b border-slate-200 dark:border-border pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                  Selected Date
                </span>
                <h4 className="text-base font-bold text-slate-900 dark:text-foreground mt-0.5">
                  {new Date(selectedDateStr + "T00:00:00").toLocaleDateString(undefined, {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </h4>
              </div>
              <Button
                size="sm"
                onClick={() => handleOpenCreateTodayInIndia(selectedDateStr)}
                className="h-8 text-xs font-bold gap-1 bg-orange-600 hover:bg-orange-700 text-white shadow-xs"
              >
                <Plus className="size-3.5" />
                Schedule
              </Button>
            </div>

            {/* Section 1: Today in India Scheduled Stories */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-foreground flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-orange-600" />
                  Today in India Stories ({selectedDayTodayInIndia.length})
                </span>
              </div>

              {selectedDayTodayInIndia.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 dark:border-border p-3.5 text-center bg-slate-50/50 dark:bg-muted/10 space-y-2">
                  <p className="text-xs text-muted-foreground">
                    No story scheduled for this date.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenCreateTodayInIndia(selectedDateStr)}
                    className="h-7 text-xs font-bold border-orange-300 text-orange-800 dark:text-orange-300 hover:bg-orange-50 dark:hover:bg-orange-950/30"
                  >
                    <Plus className="size-3 mr-1" />
                    Create story for this date
                  </Button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {selectedDayTodayInIndia.map((item) => {
                    const tii = item.todayInIndiaEntry
                    return (
                      <div
                        key={item.id}
                        className="rounded-xl border border-orange-300/80 dark:border-orange-800/60 bg-orange-50/60 dark:bg-orange-950/20 p-3 shadow-2xs space-y-2"
                      >
                        <div className="flex gap-2.5 items-start">
                          {tii?.hero_image_url ? (
                            <div className="size-12 rounded-lg border border-orange-200 overflow-hidden bg-slate-100 shrink-0">
                              <img src={tii.hero_image_url} alt="" className="h-full w-full object-cover" />
                            </div>
                          ) : null}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="rounded bg-orange-200 text-orange-950 dark:bg-orange-900 dark:text-orange-200 px-1.5 py-0.5 text-[9px] font-black uppercase">
                                {tii?.category?.replace(/_/g, " ")}
                              </span>
                              <span
                                className={cn(
                                  "rounded px-1.5 py-0.5 text-[9px] font-bold",
                                  tii?.status === "published"
                                    ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
                                    : tii?.status === "draft"
                                    ? "bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300"
                                    : "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-300"
                                )}
                              >
                                {tii?.status}
                              </span>
                              {tii?.state && (
                                <span className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[9px] font-semibold text-slate-700 dark:text-slate-300">
                                  {tii.state}
                                </span>
                              )}
                            </div>
                            <h5 className="font-bold text-xs text-slate-900 dark:text-foreground line-clamp-1">
                              {item.title}
                            </h5>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-orange-200/60 dark:border-orange-900/40">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isLoadingDetail}
                            onClick={() => handleEditTodayInIndia(tii!.id)}
                            className="h-6 px-2 text-[11px] font-bold border-slate-300 dark:border-border"
                          >
                            <Edit className="size-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteTodayInIndia(tii!.id)}
                            className="h-6 px-2 text-[11px] font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          >
                            <Trash2 className="size-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Section 2: Holidays & Cultural Updates */}
            {selectedDayOtherEvents.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-border">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-foreground block">
                  Other Observances on this Day ({selectedDayOtherEvents.length})
                </span>

                <div className="space-y-2">
                  {selectedDayOtherEvents.map((item) => {
                    const isHoliday = item.source === "holiday_api"
                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "rounded-xl border p-2.5 shadow-2xs space-y-1.5",
                          isHoliday
                            ? "bg-amber-50/70 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700/60"
                            : "bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-700/60"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span
                                className={cn(
                                  "rounded px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider",
                                  isHoliday
                                    ? "bg-amber-200 text-amber-950 dark:bg-amber-800 dark:text-amber-100"
                                    : "bg-emerald-200 text-emerald-950 dark:bg-emerald-800 dark:text-emerald-100"
                                )}
                              >
                                {isHoliday ? item.category : "State Cultural Guide"}
                              </span>
                              {item.stateName && (
                                <span className="rounded bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 text-[9px] font-bold text-slate-700 dark:text-slate-300">
                                  {item.stateName}
                                </span>
                              )}
                            </div>
                            <h5 className="font-bold text-xs text-slate-900 dark:text-foreground">
                              {item.title}
                            </h5>
                          </div>

                          {item.culturalContent && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setPreviewContent(item.culturalContent!)
                                setPreviewOpen(true)
                              }}
                              className="h-6 px-2 text-[10px] font-bold gap-1 shrink-0"
                            >
                              <Eye className="size-2.5" />
                              Preview
                            </Button>
                          )}
                        </div>

                        {item.description && (
                          <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                            {item.description}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Upcoming Live Stories & Events */}
          <div className="rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-card p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-slate-900 dark:text-foreground flex items-center gap-1.5">
                <Sparkles className="size-4 text-orange-500" />
                Upcoming Live Schedule
              </h4>
              <span className="text-[11px] text-muted-foreground font-medium">Dynamic</span>
            </div>

            {upcomingItems.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-3">No upcoming events recorded in API.</p>
            ) : (
              <div className="space-y-2">
                {upcomingItems.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => setSelectedDateStr(u.date)}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-border/70 hover:bg-slate-50 dark:hover:bg-muted/50 cursor-pointer transition"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-bold text-slate-900 dark:text-foreground truncate">{u.title}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {u.source === "today_in_india_api" ? "Today in India • " : ""}
                        {u.stateName ? `${u.stateName} • ` : ""}{u.category}
                      </p>
                    </div>
                    <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded shrink-0">
                      {new Date(u.date + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* State Preview Drawer */}
      <StatePreviewModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        content={previewContent}
      />
    </div>
  )
}
