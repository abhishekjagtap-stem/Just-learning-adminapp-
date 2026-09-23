import { useEffect, useState } from "react"
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  FileText,
  User,
  Filter,
  Sparkles,
  MapPin,
  PartyPopper,
  BookOpen,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog } from "@base-ui/react/dialog"
import { cn } from "@/lib/utils"
import type { CMSArticle } from "@/pages/cms-page"
import {
  INDIAN_STATES,
  INDIAN_HOLIDAYS_DB,
  fetchNagerHolidaysForYear,
  type NagerHoliday,
} from "@/lib/holidays"

interface EditorialCalendarProps {
  articles: CMSArticle[]
  onAddArticle: (article: CMSArticle) => void
  onApprove: (id: number) => void
  onPublish: (id: number) => void
  onOpenReject: (id: number) => void
  isManagerOrAdmin: boolean
}

export function EditorialCalendar({
  articles,
  onAddArticle,
  onApprove,
  onPublish,
  onOpenReject,
  isManagerOrAdmin,
}: EditorialCalendarProps) {
  const today = new Date()
  const [currentDate, setCurrentDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const [selectedDateStr, setSelectedDateStr] = useState(() => today.toISOString().split("T")[0])
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedState, setSelectedState] = useState<string>("ALL")
  const [showHolidays, setShowHolidays] = useState<boolean>(true)
  const [holidays, setHolidays] = useState<NagerHoliday[]>(INDIAN_HOLIDAYS_DB)
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false)
  const [prefilledDraft, setPrefilledDraft] = useState<{
    title: string
    category: string
    date: string
  } | null>(null)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // Asynchronously fetch/refresh holidays from Nager.Date API
  useEffect(() => {
    let isMounted = true
    fetchNagerHolidaysForYear(year).then((fetched) => {
      if (isMounted && fetched && fetched.length > 0) {
        setHolidays(fetched)
      }
    })
    return () => {
      isMounted = false
    }
  }, [year])

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

  // Format date helper YYYY-MM-DD
  const formatYMD = (y: number, m: number, d: number) => {
    const mm = String(m + 1).padStart(2, "0")
    const dd = String(d).padStart(2, "0")
    return `${y}-${mm}-${dd}`
  }

  // Filter articles based on status filter
  const visibleArticles = articles.filter((art) => {
    if (statusFilter === "all") return true
    return art.status === statusFilter
  })

  // Get articles for a specific day string (YYYY-MM-DD)
  const getArticlesForDay = (dateStr: string) => {
    return visibleArticles.filter((art) => art.updated_at === dateStr)
  }

  // Get holidays for a specific day string (YYYY-MM-DD)
  const getHolidaysForDay = (dateStr: string) => {
    if (!showHolidays) return []
    return holidays.filter((h) => {
      if (h.date !== dateStr) return false
      if (selectedState === "ALL") return true
      if (h.global) return true
      return h.counties ? h.counties.includes(selectedState) : false
    })
  }

  // Current month's holidays
  const mm = String(month + 1).padStart(2, "0")
  const currentMonthPrefix = `${year}-${mm}`
  const monthHolidays = holidays.filter((h) => {
    if (!h.date.startsWith(currentMonthPrefix)) return false
    if (selectedState === "ALL") return true
    if (h.global) return true
    return h.counties ? h.counties.includes(selectedState) : false
  })

  // Selected date articles & holidays
  const selectedDayArticles = articles.filter((art) => art.updated_at === selectedDateStr)
  const selectedDayHolidays = getHolidaysForDay(selectedDateStr)

  // Status badge config with high contrast for light mode
  const getBadgeStyle = (status: CMSArticle["status"]) => {
    switch (status) {
      case "published":
        return "bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-700"
      case "approved":
        return "bg-blue-100 text-blue-950 border-blue-300 dark:bg-blue-950/70 dark:text-blue-300 dark:border-blue-700"
      case "submitted":
        return "bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-700"
      case "draft":
        return "bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
      case "rejected":
        return "bg-rose-100 text-rose-950 border-rose-300 dark:bg-rose-950/70 dark:text-rose-300 dark:border-rose-700"
    }
  }

  const handleCreateScheduled = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const newArt: CMSArticle = {
      id: Date.now(),
      title: String(form.get("title")),
      category: String(form.get("category")),
      author: "Admin Editor",
      status: String(form.get("status")) as CMSArticle["status"],
      updated_at: String(form.get("date")) || selectedDateStr,
    }
    onAddArticle(newArt)
    setPrefilledDraft(null)
    setScheduleDialogOpen(false)
  }

  // Upcoming items this month (Articles + Holidays)
  const todayStr = today.toISOString().split("T")[0]
  const upcomingArticles = [...articles]
    .filter((a) => a.updated_at >= todayStr)
    .sort((a, b) => a.updated_at.localeCompare(b.updated_at))
    .slice(0, 5)

  const upcomingHolidays = [...holidays]
    .filter((h) => {
      if (h.date < todayStr) return false
      if (selectedState === "ALL") return true
      if (h.global) return true
      return h.counties ? h.counties.includes(selectedState) : false
    })
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Calendar Header Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-card p-4 sm:p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
            <CalendarIcon className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-foreground">
                {monthNames[month]} {year}
              </h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 dark:bg-orange-500/10 px-2 py-0.5 text-[11px] font-bold text-orange-950 dark:text-orange-300 border border-orange-300 dark:border-orange-500/20">
                🇮🇳 India Calendar
              </span>
            </div>
            <p className="text-xs font-medium text-slate-600 dark:text-muted-foreground mt-0.5">
              Editorial publication schedule, National Gazetted holidays & State-based observances
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Indian State / Region Filter */}
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-border bg-white dark:bg-background px-2.5 py-1 text-xs text-slate-800 dark:text-foreground shadow-2xs">
            <MapPin className="size-3.5 text-slate-500 dark:text-muted-foreground shrink-0" />
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="bg-transparent font-bold outline-none cursor-pointer max-w-[140px] truncate text-slate-900 dark:text-foreground"
              title="Filter holidays by State"
            >
              {INDIAN_STATES.map((st) => (
                <option key={st.code} value={st.code}>
                  {st.name}
                </option>
              ))}
            </select>
          </div>

          {/* Toggle Indian Holidays */}
          <button
            type="button"
            onClick={() => setShowHolidays((v) => !v)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs transition cursor-pointer select-none shadow-2xs",
              showHolidays
                ? "bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30 font-bold"
                : "bg-white dark:bg-background text-slate-700 dark:text-muted-foreground border-slate-300 dark:border-border hover:bg-slate-50 dark:hover:bg-muted font-medium"
            )}
            title="Toggle showing Indian holidays"
          >
            <span>🇮🇳</span>
            <span>Holidays ({monthHolidays.length})</span>
          </button>

          {/* Article Status Filter */}
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-border bg-white dark:bg-background px-2.5 py-1 text-xs shadow-2xs text-slate-800 dark:text-foreground">
            <Filter className="size-3.5 text-slate-500 dark:text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent font-bold outline-none cursor-pointer text-slate-900 dark:text-foreground"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="submitted">Pending Review</option>
              <option value="approved">Approved</option>
              <option value="draft">Drafts</option>
            </select>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-1 rounded-lg border border-slate-300 dark:border-border bg-white dark:bg-background p-1 shadow-2xs">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={prevMonth}
              title="Previous month"
              className="size-7 hover:bg-slate-100 dark:hover:bg-muted text-slate-700 dark:text-foreground"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={goToToday}
              className="h-7 px-2 font-bold text-xs bg-slate-100 dark:bg-muted/60 text-slate-900 dark:text-foreground hover:bg-slate-200 dark:hover:bg-muted"
            >
              Today
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={nextMonth}
              title="Next month"
              className="size-7 hover:bg-slate-100 dark:hover:bg-muted text-slate-700 dark:text-foreground"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>

          <Dialog.Root open={scheduleDialogOpen} onOpenChange={(open) => {
            setScheduleDialogOpen(open)
            if (!open) setPrefilledDraft(null)
          }}>
            <Dialog.Trigger render={
              <Button size="sm" className="gap-1.5 font-bold shadow-xs">
                <Plus className="size-4" />
                Schedule Entry
              </Button>
            } />
            <Dialog.Portal>
              <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50 animate-in fade-in duration-200" />
              <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <Dialog.Popup className="w-full max-w-md rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-card p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
                  <Dialog.Title className="text-lg font-bold text-slate-900 dark:text-foreground">
                    {prefilledDraft ? "Draft Content for Holiday" : "Schedule Editorial Content"}
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-sm text-slate-600 dark:text-muted-foreground font-medium">
                    Assign educational articles, quiz sets, or announcements to a target date.
                  </Dialog.Description>
                  <form className="mt-6 space-y-4" onSubmit={handleCreateScheduled}>
                    <label className="block text-sm font-semibold text-slate-800 dark:text-foreground">
                      Article Title
                      <input
                        required
                        name="title"
                        type="text"
                        defaultValue={prefilledDraft?.title || ""}
                        placeholder="e.g. Republic Day Special: STEM Innovations in India"
                        className="mt-2 h-10 w-full rounded-lg border border-slate-300 dark:border-border bg-white dark:bg-background px-3 text-sm font-medium outline-none focus:border-primary shadow-2xs"
                      />
                    </label>

                    <div className="grid grid-cols-2 gap-3">
                      <label className="block text-sm font-semibold text-slate-800 dark:text-foreground">
                        Category
                        <select
                          name="category"
                          defaultValue={prefilledDraft?.category || "Science & Tech"}
                          className="mt-2 h-10 w-full rounded-lg border border-slate-300 dark:border-border bg-white dark:bg-background px-3 text-sm font-medium outline-none focus:border-primary shadow-2xs"
                        >
                          <option value="Science & Tech">Science & Tech</option>
                          <option value="Mathematics">Mathematics</option>
                          <option value="Physics">Physics</option>
                          <option value="Technology">Technology</option>
                          <option value="Announcement">Announcement</option>
                        </select>
                      </label>

                      <label className="block text-sm font-semibold text-slate-800 dark:text-foreground">
                        Target Date
                        <input
                          type="date"
                          name="date"
                          defaultValue={prefilledDraft?.date || selectedDateStr}
                          className="mt-2 h-10 w-full rounded-lg border border-slate-300 dark:border-border bg-white dark:bg-background px-3 text-sm font-medium outline-none focus:border-primary shadow-2xs"
                        />
                      </label>
                    </div>

                    <label className="block text-sm font-semibold text-slate-800 dark:text-foreground">
                      Status
                      <select
                        name="status"
                        defaultValue="draft"
                        className="mt-2 h-10 w-full rounded-lg border border-slate-300 dark:border-border bg-white dark:bg-background px-3 text-sm font-medium outline-none focus:border-primary shadow-2xs"
                      >
                        <option value="draft">Draft</option>
                        <option value="submitted">Pending Review</option>
                        <option value="approved">Approved</option>
                        <option value="published">Published</option>
                      </select>
                    </label>

                    <div className="flex justify-end gap-2 pt-2">
                      <Dialog.Close render={<Button type="button" variant="outline" className="font-semibold">Cancel</Button>} />
                      <Button type="submit" className="font-bold">Save to Calendar</Button>
                    </div>
                  </form>
                </Dialog.Popup>
              </Dialog.Viewport>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </div>

      {/* Main Calendar Area + Details Sidebar */}
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Calendar Grid Container */}
        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-card shadow-sm">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 border-b border-slate-200 dark:border-border bg-slate-100/90 dark:bg-muted/70 text-center text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
            {dayNames.map((d) => (
              <div key={d} className="py-2.5">
                {d}
              </div>
            ))}
          </div>

          {/* Date Cells */}
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-200 dark:divide-border border-b border-slate-200 dark:border-border text-sm">
            {/* Previous Month Cells */}
            {Array.from({ length: firstDayIndex }).map((_, idx) => {
              const dayNum = daysInPrevMonth - firstDayIndex + idx + 1
              const prevMonthIndex = month === 0 ? 11 : month - 1
              const prevYear = month === 0 ? year - 1 : year
              const cellDate = formatYMD(prevYear, prevMonthIndex, dayNum)
              return (
                <div
                  key={`prev-${idx}`}
                  onClick={() => {
                    prevMonth()
                    setSelectedDateStr(cellDate)
                  }}
                  className="min-h-[105px] p-2 bg-slate-50/70 dark:bg-muted/20 opacity-60 hover:opacity-90 transition cursor-pointer select-none"
                >
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500">{dayNum}</span>
                </div>
              )
            })}

            {/* Current Month Cells */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1
              const cellDate = formatYMD(year, month, dayNum)
              const isSelected = selectedDateStr === cellDate
              const isToday =
                today.getFullYear() === year &&
                today.getMonth() === month &&
                today.getDate() === dayNum

              const dayArticles = getArticlesForDay(cellDate)
              const dayHolidays = getHolidaysForDay(cellDate)

              return (
                <div
                  key={`curr-${dayNum}`}
                  onClick={() => setSelectedDateStr(cellDate)}
                  className={cn(
                    "min-h-[110px] p-1.5 sm:p-2 transition flex flex-col justify-between cursor-pointer select-none",
                    isSelected
                      ? "bg-purple-50/90 dark:bg-primary/10 ring-2 ring-primary ring-inset font-semibold shadow-xs"
                      : dayHolidays.length > 0
                      ? "bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                      : isToday
                      ? "bg-purple-50/60 dark:bg-secondary/20 hover:bg-purple-50/80"
                      : "bg-white dark:bg-card hover:bg-slate-50/80 dark:hover:bg-muted/40"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "grid size-6 place-items-center rounded-full text-xs font-bold transition",
                        isToday
                          ? "bg-primary text-primary-foreground font-black shadow-xs"
                          : isSelected
                          ? "text-primary font-black text-sm"
                          : "text-slate-800 dark:text-foreground"
                      )}
                    >
                      {dayNum}
                    </span>
                    <div className="flex items-center gap-1">
                      {dayHolidays.length > 0 && (
                        <span
                          title={dayHolidays.map((h) => h.name).join(", ")}
                          className="text-xs"
                        >
                          {dayHolidays[0].global ? "🇮🇳" : "🎉"}
                        </span>
                      )}
                      {dayArticles.length > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-800 dark:bg-secondary dark:text-secondary-foreground border border-slate-200 dark:border-transparent">
                          {dayArticles.length}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Pills inside cell: Holidays + Articles */}
                  <div className="mt-1 space-y-1">
                    {/* Holiday Pill */}
                    {dayHolidays.slice(0, 1).map((h) => (
                      <div
                        key={h.name}
                        title={`${h.name} (${h.localName}) - ${h.global ? "National Gazetted Holiday" : "State Holiday"}`}
                        className={cn(
                          "truncate rounded px-1.5 py-0.5 text-[10px] font-bold flex items-center gap-1 leading-tight shadow-2xs border",
                          h.global
                            ? "bg-orange-100 text-orange-950 border-orange-300 dark:bg-orange-950/70 dark:text-orange-200 dark:border-orange-800"
                            : "bg-indigo-100 text-indigo-950 border-indigo-300 dark:bg-indigo-950/70 dark:text-indigo-200 dark:border-indigo-800"
                        )}
                      >
                        <span className="shrink-0">{h.global ? "🇮🇳" : "🏛️"}</span>
                        <span className="truncate">{h.name}</span>
                      </div>
                    ))}

                    {/* Article Badges */}
                    {dayArticles.slice(0, dayHolidays.length > 0 ? 1 : 2).map((art) => (
                      <div
                        key={art.id}
                        title={`${art.title} (${art.status})`}
                        className={cn(
                          "truncate rounded px-1.5 py-0.5 text-[10px] font-semibold border leading-tight transition shadow-2xs",
                          getBadgeStyle(art.status)
                        )}
                      >
                        {art.title}
                      </div>
                    ))}

                    {dayArticles.length > (dayHolidays.length > 0 ? 1 : 2) && (
                      <div className="text-[9px] font-bold text-slate-600 dark:text-muted-foreground pl-1">
                        +{dayArticles.length - (dayHolidays.length > 0 ? 1 : 2)} more
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

            {/* Next Month Cells to fill trailing grid */}
            {Array.from({
              length: (7 - ((firstDayIndex + daysInMonth) % 7)) % 7,
            }).map((_, idx) => {
              const dayNum = idx + 1
              const nextMonthIndex = month === 11 ? 0 : month + 1
              const nextYear = month === 11 ? year + 1 : year
              const cellDate = formatYMD(nextYear, nextMonthIndex, dayNum)
              return (
                <div
                  key={`next-${idx}`}
                  onClick={() => {
                    nextMonth()
                    setSelectedDateStr(cellDate)
                  }}
                  className="min-h-[105px] p-2 bg-slate-50/70 dark:bg-muted/20 opacity-60 hover:opacity-90 transition cursor-pointer select-none"
                >
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500">{dayNum}</span>
                </div>
              )
            })}
          </div>

          {/* Calendar Status Legend */}
          <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3 bg-slate-50 dark:bg-muted/30 border-t border-slate-200 dark:border-border text-xs text-slate-700 dark:text-muted-foreground font-medium">
            <div className="flex flex-wrap items-center gap-4">
              <span className="font-bold text-slate-900 dark:text-foreground">Legend:</span>
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-orange-500" />
                <span className="font-semibold text-slate-800 dark:text-slate-200">🇮🇳 National Holiday</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-indigo-500" />
                <span className="font-semibold text-slate-800 dark:text-slate-200">🏛️ State Holiday</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-emerald-500" />
                <span>Published Article</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-blue-500" />
                <span>Approved</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-amber-500" />
                <span>In Review</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-slate-400" />
                <span>Draft</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 dark:text-muted-foreground font-medium">
              Powered by Nager.Date India Holidays Engine
            </div>
          </div>
        </div>

        {/* Selected Date Schedule & Queue Sidebar */}
        <div className="space-y-6">
          {/* Selected Date Card */}
          <div className="rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-border pb-3">
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-foreground">Selected Date</h4>
                <p className="text-xs font-semibold text-slate-600 dark:text-muted-foreground mt-0.5">{selectedDateStr}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setScheduleDialogOpen(true)}
                className="h-7 gap-1 px-2.5 text-xs font-semibold border-slate-300 dark:border-border"
              >
                <Plus className="size-3" />
                Add
              </Button>
            </div>

            <div className="mt-4 space-y-3">
              {/* Indian Holiday Card with Writer Tip */}
              {selectedDayHolidays.map((holiday) => (
                <div
                  key={holiday.name}
                  className="rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50/90 dark:bg-amber-950/40 p-4 text-xs shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl shrink-0">{holiday.global ? "🇮🇳" : "🎉"}</span>
                      <div>
                        <h5 className="font-black text-amber-950 dark:text-white text-sm leading-snug">
                          {holiday.name}
                        </h5>
                        <p className="text-xs text-amber-900 dark:text-amber-300 font-bold mt-0.5">
                          {holiday.localName}
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 text-[10px] px-2.5 py-0.5 rounded-full font-bold border bg-white dark:bg-card text-amber-950 dark:text-amber-200 border-amber-300 dark:border-amber-700 shadow-2xs">
                      {holiday.global ? "National Gazetted" : "State Holiday"}
                    </span>
                  </div>

                  {holiday.editorialTip && (
                    <div className="rounded-lg bg-white dark:bg-card p-3 border border-amber-200 dark:border-amber-800/60 shadow-2xs">
                      <p className="text-xs font-extrabold text-amber-950 dark:text-amber-300 flex items-center gap-1.5">
                        <Sparkles className="size-3.5 text-amber-600 dark:text-amber-400" />
                        Writer's Editorial Tip:
                      </p>
                      <p className="mt-1.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                        {holiday.editorialTip}
                      </p>
                    </div>
                  )}

                  <Button
                    size="sm"
                    onClick={() => {
                      setPrefilledDraft({
                        title: holiday.defaultArticleTitle || `${holiday.name} Special: Student Exploration Guide`,
                        category: holiday.suggestedCategory || "Science & Tech",
                        date: holiday.date,
                      })
                      setScheduleDialogOpen(true)
                    }}
                    className="w-full text-xs h-8 gap-1.5 font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
                  >
                    <BookOpen className="size-3.5" />
                    Draft article for this holiday
                  </Button>
                </div>
              ))}

              {/* Scheduled Articles on Selected Date */}
              {selectedDayArticles.map((art) => (
                <div
                  key={art.id}
                  className="rounded-xl border border-slate-200 dark:border-border bg-slate-50 dark:bg-muted/30 p-3.5 text-xs space-y-2.5 hover:bg-white dark:hover:bg-muted/50 transition shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h5 className="font-bold text-slate-900 dark:text-foreground text-sm leading-snug line-clamp-2">
                      {art.title}
                    </h5>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-600 dark:text-muted-foreground">{art.category}</span>
                    <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold border capitalize shadow-2xs", getBadgeStyle(art.status))}>
                      {art.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-border/50 text-[11px]">
                    <span className="flex items-center gap-1 text-slate-600 dark:text-muted-foreground font-medium">
                      <User className="size-3" />
                      {art.author}
                    </span>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                      {art.status === "submitted" && isManagerOrAdmin && (
                        <>
                          <button
                            onClick={() => onApprove(art.id)}
                            className="font-bold text-primary hover:underline"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => onOpenReject(art.id)}
                            className="font-bold text-rose-600 hover:underline"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {(art.status === "approved" || (art.status === "submitted" && isManagerOrAdmin)) && (
                        <button
                          onClick={() => onPublish(art.id)}
                          className="font-bold text-emerald-700 hover:underline"
                        >
                          Publish
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {selectedDayArticles.length === 0 && selectedDayHolidays.length === 0 && (
                <div className="py-8 text-center text-slate-500 dark:text-muted-foreground text-xs">
                  <Clock className="size-8 mx-auto mb-2 opacity-50 text-slate-400" />
                  <p className="font-bold text-slate-800 dark:text-foreground">No content or holidays scheduled</p>
                  <p className="mt-1 font-medium">Click "Add" to schedule an article for this date.</p>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Holidays & Editorial Deadlines Tabs */}
          <div className="rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-card p-5 shadow-sm space-y-4">
            {/* Upcoming Indian Holidays */}
            <div>
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-border pb-2.5">
                <PartyPopper className="size-4 text-amber-500" />
                <h4 className="font-bold text-sm text-slate-900 dark:text-foreground">Upcoming Indian Holidays</h4>
              </div>

              <div className="mt-3 space-y-2">
                {upcomingHolidays.length === 0 ? (
                  <p className="py-2 text-center text-xs text-slate-500 dark:text-muted-foreground">
                    No upcoming holidays in the immediate schedule.
                  </p>
                ) : (
                  upcomingHolidays.map((h) => (
                    <div
                      key={h.name}
                      onClick={() => setSelectedDateStr(h.date)}
                      className="flex items-start justify-between gap-3 p-2.5 rounded-lg hover:bg-amber-50/80 dark:hover:bg-amber-950/30 cursor-pointer transition text-xs border border-slate-100 dark:border-transparent hover:border-amber-200 dark:hover:border-amber-800"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs">{h.global ? "🇮🇳" : "🎉"}</span>
                          <p className="font-bold text-slate-900 dark:text-foreground truncate">{h.name}</p>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-muted-foreground mt-0.5 truncate font-medium">
                          {h.localName} {h.global ? "• National" : `• State`}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-black text-amber-900 dark:text-amber-300">
                          {h.date.slice(5)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Upcoming Editorial Articles */}
            <div className="pt-2 border-t border-slate-200 dark:border-border">
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-border pb-2.5">
                <Sparkles className="size-4 text-primary" />
                <h4 className="font-bold text-sm text-slate-900 dark:text-foreground">Upcoming Content Queue</h4>
              </div>

              <div className="mt-3 space-y-2">
                {upcomingArticles.length === 0 ? (
                  <p className="py-2 text-center text-xs text-slate-500 dark:text-muted-foreground font-medium">
                    No scheduled articles in the queue.
                  </p>
                ) : (
                  upcomingArticles.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedDateStr(item.updated_at)}
                      className="flex items-start justify-between gap-3 p-2.5 rounded-lg hover:bg-slate-100/80 dark:hover:bg-muted/50 cursor-pointer transition text-xs border border-slate-100 dark:border-transparent hover:border-slate-200 dark:hover:border-border"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-900 dark:text-foreground truncate">{item.title}</p>
                        <p className="text-[11px] text-slate-600 dark:text-muted-foreground mt-0.5 flex items-center gap-1 font-medium">
                          <FileText className="size-3" />
                          {item.category}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[11px] font-bold text-slate-700 dark:text-muted-foreground block">
                          {item.updated_at.slice(5)}
                        </span>
                        <span className={cn("text-[9px] px-1.5 py-0.2 rounded font-bold border inline-block mt-0.5 capitalize shadow-2xs", getBadgeStyle(item.status))}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
