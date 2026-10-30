import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import {
  Trophy,
  Plus,
  Search,
  RefreshCw,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  Edit,
  Star,
  X,
  UploadCloud,
  ArrowLeft,
  Wand2,
  Globe,
  Phone,
  LayoutGrid,
  Table as TableIcon,
  Eye,
  AlertTriangle,
  ExternalLink,
  FileText,
  UserCheck,
  XCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { cn } from "@/lib/utils"
import {
  getArenaEventsStats,
  getArenaEvents,
  getArenaEventDetail,
  createArenaEvent,
  updateArenaEvent,
  deleteArenaEvent,
  approveArenaEvent,
  rejectArenaEvent,
  type ArenaEventsStats,
  type ArenaEventListItem,
  type ArenaEventDetail,
  type CreateArenaEventPayload,
  type ArenaTimelineItem,
} from "@/lib/api"
import { TimePicker12h, formatTimeDisplay, formatDateDisplay } from "./time-picker-12h"

// Curated topic interests with IDs
const EVENT_INTERESTS: { id: number; label: string; icon: string }[] = [
  { id: 1, label: "Robotics & AI", icon: "🤖" },
  { id: 2, label: "Science & Innovation", icon: "🔬" },
  { id: 3, label: "Space & Astronomy", icon: "🚀" },
  { id: 4, label: "Mathematics & Logic", icon: "📐" },
  { id: 5, label: "Arts, Design & UI", icon: "🎨" },
  { id: 6, label: "Heritage & Culture", icon: "🏛️" },
  { id: 7, label: "Coding & Web", icon: "💻" },
  { id: 8, label: "Environment & Ecology", icon: "🌿" },
]

// Full sample event matching API spec
const SAMPLE_STEM_CHAMPIONSHIP: CreateArenaEventPayload = {
  title: "National STEM Championship 2026",
  description:
    "48-hour innovation contest organized by Just Learning for school and college innovators across India. Teams build practical solutions for sustainable smart cities and space discovery.",
  venue: "Nehru Science Centre, Worli, Mumbai",
  interest_ids: [1, 2],
  age_criteria: "14 - 22 years",
  organizer_name: "Just Learning",
  organizer_phone: "+91 9876543210",
  registration_link: "https://justlearning.in/events/stem2026/register",
  start_date: "2026-11-20",
  start_time: "09:00:00",
  end_date: "2026-11-22",
  end_time: "18:00:00",
  is_featured: true,
  post_as_jl: true,
  timeline: [
    {
      day: 1,
      title: "Opening Ceremony & Problem Statement Reveal",
      description: "Welcome speech, keynote by STEM leaders, and release of challenge guidelines.",
      start_time: "09:00:00",
      end_time: "11:30:00",
      order: 0,
    },
    {
      day: 2,
      title: "Judging & Prototype Demonstrations",
      description: "Mentors and industry jury evaluate working hardware & software student prototypes.",
      start_time: "10:00:00",
      end_time: "16:00:00",
      order: 1,
    },
    {
      day: 3,
      title: "Grand Finale & Award Ceremony",
      description: "Announcement of national champions, scholarship grants, and trophy distribution.",
      start_time: "14:00:00",
      end_time: "18:00:00",
      order: 2,
    },
  ],
}

export function ArenaEventsView() {
  const { toast } = useToast()
  const bannerInputRef = useRef<HTMLInputElement>(null)

  // List View State
  const [events, setEvents] = useState<ArenaEventListItem[]>([])
  const [stats, setStats] = useState<ArenaEventsStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "approved" | "pending" | "draft" | "rejected">("all")
  const [onlyOfficialJL, setOnlyOfficialJL] = useState(false)
  const [onlyMentor, setOnlyMentor] = useState(false)
  const [onlyFeatured, setOnlyFeatured] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid")

  // Review & Approval State
  const [reviewDetail, setReviewDetail] = useState<ArenaEventDetail | null>(null)
  const [isReviewOpen, setIsReviewOpen] = useState(false)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)
  const [isApproving, setIsApproving] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)

  // Direct Rejection Modal State
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false)
  const [rejectTargetId, setRejectTargetId] = useState<number | null>(null)
  const [rejectReasonText, setRejectReasonText] = useState("")

  // Form View State
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingEventId, setEditingEventId] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Form Fields
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [venue, setVenue] = useState("")
  const [startDate, setStartDate] = useState("2026-11-20")
  const [startTime, setStartTime] = useState("09:00:00")
  const [endDate, setEndDate] = useState("2026-11-22")
  const [endTime, setEndTime] = useState("18:00:00")
  const [ageCriteria, setAgeCriteria] = useState("14 - 24 years")
  const [organizerName, setOrganizerName] = useState("Just Learning")
  const [organizerPhone, setOrganizerPhone] = useState("+91 9876543210")
  const [registrationLink, setRegistrationLink] = useState("")
  const [isFeatured, setIsFeatured] = useState(false)
  const [postAsJl, setPostAsJl] = useState(true)
  const [selectedInterests, setSelectedInterests] = useState<number[]>([1, 2])
  const [timeline, setTimeline] = useState<ArenaTimelineItem[]>([])

  // Media
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string | null>(null)

  // Fetch Dashboard Verification Counts / Stats
  const loadStats = useCallback(async () => {
    try {
      const data = await getArenaEventsStats()
      setStats(data)
    } catch {
      // Fallback silently if stats endpoint not initialized yet
    }
  }, [])

  // Fetch events list
  const loadEvents = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true)
    else setIsSyncing(true)

    try {
      const data = await getArenaEvents({
        search: searchQuery.trim() || undefined,
        status: statusFilter,
        is_jl: onlyOfficialJL ? true : undefined,
        is_featured: onlyFeatured ? true : undefined,
        role: onlyMentor ? "mentor" : undefined,
      })
      setEvents(data || [])
    } catch (err: any) {
      toast(err.message || "Failed to load arena events.", "error")
    } finally {
      setIsLoading(false)
      setIsSyncing(false)
    }
  }, [searchQuery, statusFilter, onlyOfficialJL, onlyFeatured, onlyMentor, toast])

  useEffect(() => {
    loadEvents()
    loadStats()
  }, [loadEvents, loadStats])

  // Open Full Event & Mentor Detail View (Review Drawer)
  const handleOpenReview = async (id: number) => {
    setIsLoadingDetail(true)
    setIsReviewOpen(true)
    setReviewDetail(null)
    try {
      const detail = await getArenaEventDetail(id)
      setReviewDetail(detail)
    } catch (err: any) {
      toast(err.message || "Failed to load event & mentor details.", "error")
      setIsReviewOpen(false)
    } finally {
      setIsLoadingDetail(false)
    }
  }

  // Approve Event Action (POST /api/admin/content-management/arena/events/<id>/approve/)
  const handleApprove = async (eventId: number) => {
    setIsApproving(true)
    try {
      const res = await approveArenaEvent(eventId)
      toast(res.message || "Event approved and published live!", "success")
      if (reviewDetail?.id === eventId) {
        setReviewDetail((prev) =>
          prev
            ? {
                ...prev,
                verification_status: "approved",
                is_active: true,
                published_at: res.event.published_at || new Date().toISOString(),
                reviewed_by: res.event.reviewed_by,
                reviewed_by_name: res.event.reviewed_by_name || "Admin",
                reviewed_at: res.event.reviewed_at || new Date().toISOString(),
                rejection_reason: null,
              }
            : null
        )
      }
      loadEvents(true)
      loadStats()
    } catch (err: any) {
      toast(err.message || "Failed to approve event.", "error")
    } finally {
      setIsApproving(false)
    }
  }

  // Open Reject Dialog
  const handleOpenRejectDialog = (eventId: number) => {
    setRejectTargetId(eventId)
    setRejectReasonText("")
    setRejectionModalOpen(true)
  }

  // Reject Event Action (POST /api/admin/content-management/arena/events/<id>/reject/)
  const handleConfirmReject = async () => {
    if (!rejectTargetId) return
    if (!rejectReasonText.trim()) {
      toast("Please provide a rejection reason so the mentor knows what to fix.", "error")
      return
    }

    setIsRejecting(true)
    try {
      const res = await rejectArenaEvent(rejectTargetId, rejectReasonText.trim())
      toast(res.message || "Event rejected. Mentor feedback has been saved.", "success")
      if (reviewDetail?.id === rejectTargetId) {
        setReviewDetail((prev) =>
          prev
            ? {
                ...prev,
                verification_status: "rejected",
                is_active: false,
                rejection_reason: rejectReasonText.trim(),
                reviewed_by: res.event.reviewed_by,
                reviewed_by_name: res.event.reviewed_by_name || "Admin",
                reviewed_at: res.event.reviewed_at || new Date().toISOString(),
              }
            : null
        )
      }
      setRejectionModalOpen(false)
      loadEvents(true)
      loadStats()
    } catch (err: any) {
      toast(err.message || "Failed to reject event.", "error")
    } finally {
      setIsRejecting(false)
    }
  }

  const REJECTION_PRESETS = [
    "The venue details are missing the exact hall number, and the registration link returns a 404 error. Please update Step 2 and resubmit.",
    "Banner image resolution is too low or blurry. Please upload a high-resolution banner image (1200x630px recommended).",
    "The schedule timeline is empty. Please add day-wise milestones so participants can review session agendas.",
    "Registration link is invalid or inaccessible. Please verify and provide a working URL.",
    "Age criteria and eligibility details need further clarification.",
  ]

  // Open Create Form
  const handleOpenCreate = () => {
    setEditingEventId(null)
    setTitle("")
    setDescription("")
    setVenue("")
    setStartDate(new Date().toISOString().split("T")[0])
    setStartTime("09:00:00")
    setEndDate(new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0])
    setEndTime("18:00:00")
    setAgeCriteria("14 - 24 years")
    setOrganizerName("Just Learning")
    setOrganizerPhone("+91 9876543210")
    setRegistrationLink("")
    setIsFeatured(false)
    setPostAsJl(true)
    setSelectedInterests([1, 2])
    setTimeline([])
    setMediaFile(null)
    setMediaPreviewUrl(null)
    setIsEditorOpen(true)
  }

  // Open Edit Form
  const handleOpenEdit = async (id: number) => {
    setIsLoading(true)
    try {
      const detail = await getArenaEventDetail(id)
      setEditingEventId(detail.id)
      setTitle(detail.title || "")
      setDescription(detail.description || "")
      setVenue(detail.venue || "")
      setStartDate(detail.start_date || "")
      setStartTime(detail.start_time || "09:00:00")
      setEndDate(detail.end_date || "")
      setEndTime(detail.end_time || "18:00:00")
      setAgeCriteria(detail.age_criteria || "Open to all")
      setOrganizerName(detail.organizer_name || "Just Learning")
      setOrganizerPhone(detail.organizer_phone || "")
      setRegistrationLink(detail.registration_link || "")
      setIsFeatured(Boolean(detail.is_featured))
      setPostAsJl(Boolean(detail.is_official))
      setTimeline(detail.timeline || [])
      setMediaFile(null)
      setMediaPreviewUrl(detail.media || null)

      // Map interests
      if (Array.isArray(detail.interests)) {
        const mapped = detail.interests
          .map((item: any) => {
            if (typeof item === "number") return item
            const found = EVENT_INTERESTS.find((i) => i.label.toLowerCase().includes(String(item).toLowerCase()))
            return found?.id
          })
          .filter(Boolean) as number[]
        setSelectedInterests(mapped.length > 0 ? mapped : [1])
      }

      setIsEditorOpen(true)
    } catch (err: any) {
      toast(err.message || "Failed to load event details.", "error")
    } finally {
      setIsLoading(false)
    }
  }

  // Delete event
  const handleDelete = async (id: number, eventTitle: string) => {
    if (!confirm(`Are you sure you want to delete event "${eventTitle}"? This action cannot be undone.`)) return

    setIsDeleting(true)
    try {
      await deleteArenaEvent(id)
      toast("Arena event deleted successfully.", "success")
      setEvents((prev) => prev.filter((e) => e.id !== id))
      if (editingEventId === id) setIsEditorOpen(false)
    } catch (err: any) {
      toast(err.message || "Failed to delete event.", "error")
    } finally {
      setIsDeleting(false)
    }
  }

  // Populate sample event
  const handleApplySample = () => {
    setTitle(SAMPLE_STEM_CHAMPIONSHIP.title)
    setDescription(SAMPLE_STEM_CHAMPIONSHIP.description)
    setVenue(SAMPLE_STEM_CHAMPIONSHIP.venue)
    setStartDate(SAMPLE_STEM_CHAMPIONSHIP.start_date)
    setStartTime(SAMPLE_STEM_CHAMPIONSHIP.start_time)
    setEndDate(SAMPLE_STEM_CHAMPIONSHIP.end_date)
    setEndTime(SAMPLE_STEM_CHAMPIONSHIP.end_time)
    setAgeCriteria(SAMPLE_STEM_CHAMPIONSHIP.age_criteria || "14 - 22 years")
    setOrganizerName(SAMPLE_STEM_CHAMPIONSHIP.organizer_name || "Just Learning")
    setOrganizerPhone(SAMPLE_STEM_CHAMPIONSHIP.organizer_phone || "+91 9876543210")
    setRegistrationLink(SAMPLE_STEM_CHAMPIONSHIP.registration_link || "")
    setIsFeatured(Boolean(SAMPLE_STEM_CHAMPIONSHIP.is_featured))
    setPostAsJl(Boolean(SAMPLE_STEM_CHAMPIONSHIP.post_as_jl))
    setSelectedInterests(SAMPLE_STEM_CHAMPIONSHIP.interest_ids || [1, 2])
    setTimeline(SAMPLE_STEM_CHAMPIONSHIP.timeline || [])
    toast("Populated National STEM Championship 2026 sample data!", "success")
  }

  // Timeline handlers
  const handleAddTimelineItem = () => {
    const nextDay = timeline.length > 0 ? timeline[timeline.length - 1].day : 1
    setTimeline([
      ...timeline,
      {
        day: nextDay,
        title: "",
        description: "",
        start_time: "09:00:00",
        end_time: "12:00:00",
        order: timeline.length,
      },
    ])
  }

  const handleUpdateTimeline = (idx: number, field: keyof ArenaTimelineItem, val: any) => {
    const updated = [...timeline]
    updated[idx] = { ...updated[idx], [field]: val }
    setTimeline(updated)
  }

  const handleRemoveTimeline = (idx: number) => {
    setTimeline(timeline.filter((_, i) => i !== idx))
  }

  // Banner file selection
  const handleBannerFile = (files: FileList | null) => {
    if (!files || files.length === 0) return
    const file = files[0]
    setMediaFile(file)
    setMediaPreviewUrl(URL.createObjectURL(file))
  }

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      toast("Please provide an event title (max 50 chars).", "error")
      return
    }
    if (title.trim().length > 50) {
      toast("Title must be 50 characters or less.", "error")
      return
    }
    if (!venue.trim()) {
      toast("Please provide event venue or 'Online'.", "error")
      return
    }
    if (!description.trim()) {
      toast("Please provide an event description.", "error")
      return
    }
    if (!startDate || !endDate) {
      toast("Please select start and end dates.", "error")
      return
    }

    const payload: CreateArenaEventPayload = {
      title: title.trim(),
      description: description.trim(),
      venue: venue.trim(),
      start_date: startDate,
      start_time: startTime,
      end_date: endDate,
      end_time: endTime,
      interest_ids: selectedInterests,
      age_criteria: ageCriteria.trim() || undefined,
      organizer_name: organizerName.trim() || "Just Learning",
      organizer_phone: organizerPhone.trim() || undefined,
      registration_link: registrationLink.trim() || undefined,
      is_featured: isFeatured,
      post_as_jl: postAsJl,
      timeline: timeline.filter((t) => t.title.trim()),
      media: mediaFile || mediaPreviewUrl || null,
    }

    setIsSubmitting(true)
    try {
      if (editingEventId) {
        await updateArenaEvent(editingEventId, payload)
        toast("Arena event updated successfully!", "success")
      } else {
        await createArenaEvent(payload)
        toast("Arena event published & scheduled successfully!", "success")
      }
      setIsEditorOpen(false)
      loadEvents(true)
    } catch (err: any) {
      toast(err.message || "Failed to save arena event.", "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchesTitle = ev.title?.toLowerCase().includes(q)
        const matchesVenue = ev.venue?.toLowerCase().includes(q)
        const matchesSlug = ev.slug?.toLowerCase().includes(q)
        if (!matchesTitle && !matchesVenue && !matchesSlug) return false
      }
      return true
    })
  }, [events, searchQuery])

  // Aggregate Stats
  const totalEvents = events.length
  const officialCount = events.filter((e) => e.is_official).length
  const approvedCount = events.filter((e) => e.verification_status === "approved").length

  // ==========================================
  // VIEW: EVENT CREATE / EDIT FORM
  // ==========================================
  if (isEditorOpen) {
    return (
      <div className="space-y-6 pb-20 animate-in fade-in-50 duration-200">
        {/* Sticky Header Bar */}
        <div className="sticky top-0 z-30 flex flex-col gap-3 rounded-2xl border border-slate-200 dark:border-border bg-white/95 dark:bg-card/95 backdrop-blur-md p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditorOpen(false)}
              className="h-9 gap-1.5 font-bold border-slate-300 dark:border-border text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shadow-2xs"
            >
              <ArrowLeft className="size-4" />
              Back to Events
            </Button>

            <div className="h-5 w-px bg-slate-200 dark:bg-border hidden sm:block" />

            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 px-2.5 py-0.5 text-xs font-bold shadow-2xs">
                <Trophy className="size-3.5" />
                Arena Showcase
              </span>

              <span className="text-sm font-black text-slate-900 dark:text-foreground">
                {editingEventId ? `Edit Event #${editingEventId}` : "Create Official Arena Event"}
              </span>

              {isFeatured && (
                <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 px-2 py-0.5 text-xs font-bold">
                  <Star className="size-3 fill-purple-600 dark:fill-purple-400" />
                  Featured Banner
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!editingEventId && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleApplySample}
                className="h-9 gap-1.5 text-xs font-bold bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-700 cursor-pointer shadow-2xs"
                title="Prefill form with National STEM Championship 2026 data"
              >
                <Wand2 className="size-3.5 text-amber-600 dark:text-amber-400" />
                Sample Event
              </Button>
            )}

            {editingEventId && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleDelete(editingEventId, title)}
                disabled={isDeleting || isSubmitting}
                className="h-9 gap-1.5 text-xs font-bold text-rose-600 border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
              >
                <Trash2 className="size-3.5" />
                Delete
              </Button>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditorOpen(false)}
              className="h-9 text-xs font-bold border-slate-300 dark:border-border text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              Cancel
            </Button>

            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || isDeleting}
              className="h-9 gap-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-sm shadow-amber-500/20 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="size-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-3.5" />
                  {editingEventId ? "Update Event" : "Publish Arena Event"}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Card 1: Core Details */}
          <div className="rounded-2xl border border-slate-200 dark:border-border bg-white dark:bg-card p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold">
                  1
                </div>
                <h3 className="font-bold text-slate-900 dark:text-foreground text-base">
                  Event Essentials & Venue
                </h3>
              </div>
              <span className="text-xs text-slate-500 dark:text-muted-foreground font-medium hidden sm:inline">
                Basic event branding and physical/online location
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Event Title *
                  </label>
                  <span className={cn("text-[11px] font-semibold", title.length > 50 ? "text-rose-600 font-bold" : "text-slate-500 dark:text-muted-foreground")}>
                    {title.length} / 50 characters (max 50)
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={50}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. National STEM Championship 2026"
                  className="w-full rounded-xl border border-slate-300 dark:border-border bg-white dark:bg-slate-900/60 px-3.5 py-2.5 text-sm font-semibold text-slate-900 dark:text-foreground placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 shadow-2xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Venue Location *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                    <input
                      type="text"
                      value={venue}
                      onChange={(e) => setVenue(e.target.value)}
                      placeholder="e.g. Nehru Science Centre, Mumbai (or 'Online')"
                      className="w-full rounded-xl border border-slate-300 dark:border-border bg-white dark:bg-slate-900/60 pl-9.5 pr-3.5 py-2.5 text-sm text-slate-900 dark:text-foreground placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 shadow-2xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Age / Eligibility Criteria
                  </label>
                  <input
                    type="text"
                    value={ageCriteria}
                    onChange={(e) => setAgeCriteria(e.target.value)}
                    placeholder="e.g. 14 - 24 years or 'Open to all students'"
                    className="w-full rounded-xl border border-slate-300 dark:border-border bg-white dark:bg-slate-900/60 px-3.5 py-2.5 text-sm text-slate-900 dark:text-foreground placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Event Description *
                  </label>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-muted-foreground">
                    {description.split(/\s+/).filter(Boolean).length} words
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detail the championship rules, rounds, prizes, team sizes, and learning opportunities..."
                  className="w-full rounded-xl border border-slate-300 dark:border-border bg-white dark:bg-slate-900/60 p-3.5 text-sm text-slate-900 dark:text-foreground placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 leading-relaxed shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Date & Time Schedules */}
          <div className="rounded-2xl border border-slate-200 dark:border-border bg-white dark:bg-card p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-foreground text-base">
                    Date & Time Schedule
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-muted-foreground font-medium">
                    Select start and conclusion dates with 12-hour AM / PM time
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Event Start Box */}
              <div className="rounded-xl border border-amber-200/60 dark:border-amber-900/40 bg-amber-50/30 dark:bg-amber-950/10 p-4 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Event Start
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/70 border border-amber-300/60 dark:border-amber-800 px-2 py-0.5 rounded-md">
                    {formatDateDisplay(startDate)} • {formatTimeDisplay(startTime)}
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="size-3.5 text-amber-600" />
                        Start Date *
                      </span>
                      {startDate && (
                        <span className="text-[11px] font-semibold text-slate-500 dark:text-muted-foreground lowercase">
                          ({formatDateDisplay(startDate)})
                        </span>
                      )}
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 dark:border-border bg-white dark:bg-slate-900/60 px-3.5 py-2 text-sm text-slate-900 dark:text-foreground focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 shadow-2xs font-semibold cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                      <span className="flex items-center gap-1.5">
                        <Clock className="size-3.5 text-amber-600" />
                        Start Time (AM / PM) *
                      </span>
                      <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                        Selected: {formatTimeDisplay(startTime)}
                      </span>
                    </label>
                    <TimePicker12h
                      value={startTime}
                      onChange={setStartTime}
                      presets={["09:00:00", "10:00:00", "11:00:00", "14:00:00"]}
                    />
                  </div>
                </div>
              </div>

              {/* Event Conclusion Box */}
              <div className="rounded-xl border border-slate-200 dark:border-border bg-slate-50/50 dark:bg-slate-900/30 p-4 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="size-2 rounded-full bg-amber-500" />
                    <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Event Conclusion
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 bg-slate-200/70 dark:bg-slate-800 border border-slate-300/60 dark:border-slate-700 px-2 py-0.5 rounded-md">
                    {formatDateDisplay(endDate)} • {formatTimeDisplay(endTime)}
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="size-3.5 text-amber-600" />
                        End Date *
                      </span>
                      {endDate && (
                        <span className="text-[11px] font-semibold text-slate-500 dark:text-muted-foreground lowercase">
                          ({formatDateDisplay(endDate)})
                        </span>
                      )}
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 dark:border-border bg-white dark:bg-slate-900/60 px-3.5 py-2 text-sm text-slate-900 dark:text-foreground focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 shadow-2xs font-semibold cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                      <span className="flex items-center gap-1.5">
                        <Clock className="size-3.5 text-amber-600" />
                        End Time (AM / PM) *
                      </span>
                      <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                        Selected: {formatTimeDisplay(endTime)}
                      </span>
                    </label>
                    <TimePicker12h
                      value={endTime}
                      onChange={setEndTime}
                      presets={["16:00:00", "17:00:00", "18:00:00", "20:00:00"]}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Timing Schedule Preview Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-slate-900/40 text-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-amber-500 shrink-0" />
                <span className="font-semibold text-slate-600 dark:text-slate-400">
                  Total Schedule:
                </span>
                <span className="font-bold text-slate-900 dark:text-foreground">
                  {formatDateDisplay(startDate)} at {formatTimeDisplay(startTime)} → {formatDateDisplay(endDate)} at {formatTimeDisplay(endTime)}
                </span>
              </div>
              {endDate && startDate && endDate < startDate && (
                <div className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-bold text-[11px]">
                  <AlertTriangle className="size-3.5" />
                  Warning: End date is before start date
                </div>
              )}
            </div>
          </div>

          {/* Card 3: Organizer & Registration Link */}
          <div className="rounded-2xl border border-slate-200 dark:border-border bg-white dark:bg-card p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold">
                  3
                </div>
                <h3 className="font-bold text-slate-900 dark:text-foreground text-base">
                  Registration & Official Attribution
                </h3>
              </div>
              <span className="text-xs text-slate-500 dark:text-muted-foreground font-medium hidden sm:inline">
                Organizer contact & registration URL
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Organizer Name
                </label>
                <input
                  type="text"
                  value={organizerName}
                  onChange={(e) => setOrganizerName(e.target.value)}
                  placeholder="Just Learning"
                  className="w-full rounded-xl border border-slate-300 dark:border-border bg-white dark:bg-slate-900/60 px-3.5 py-2.5 text-sm text-slate-900 dark:text-foreground focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Contact Phone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                  <input
                    type="text"
                    value={organizerPhone}
                    onChange={(e) => setOrganizerPhone(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full rounded-xl border border-slate-300 dark:border-border bg-white dark:bg-slate-900/60 pl-9.5 pr-3.5 py-2.5 text-sm text-slate-900 dark:text-foreground focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Registration URL
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                  <input
                    type="url"
                    value={registrationLink}
                    onChange={(e) => setRegistrationLink(e.target.value)}
                    placeholder="https://justlearning.in/events/.../register"
                    className="w-full rounded-xl border border-slate-300 dark:border-border bg-white dark:bg-slate-900/60 pl-9.5 pr-3.5 py-2.5 text-sm text-slate-900 dark:text-foreground focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 shadow-2xs"
                  />
                </div>
              </div>
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 dark:border-border bg-slate-50/60 dark:bg-slate-900/40 cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition-colors">
                <input
                  type="checkbox"
                  checked={postAsJl}
                  onChange={(e) => setPostAsJl(e.target.checked)}
                  className="mt-0.5 size-4 rounded text-amber-600 focus:ring-amber-500"
                />
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-foreground">
                    <ShieldCheck className="size-4 text-amber-600" />
                    Post as Official Brand Event (post_as_jl)
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-muted-foreground mt-0.5">
                    Attributed directly to the official Just Learning brand and automatically verified & approved.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 dark:border-border bg-slate-50/60 dark:bg-slate-900/40 cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition-colors">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="mt-0.5 size-4 rounded text-purple-600 focus:ring-purple-500"
                />
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-foreground">
                    <Star className="size-4 text-purple-600" />
                    Pin to Homepage Featured Banner (is_featured)
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-muted-foreground mt-0.5">
                    Highlights the event prominently at the top of the mobile Arena feed and carousel.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Card 4: Media Banner & Topics */}
          <div className="rounded-2xl border border-slate-200 dark:border-border bg-white dark:bg-card p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold">
                  4
                </div>
                <h3 className="font-bold text-slate-900 dark:text-foreground text-base">
                  Banner Image & Topic Interests
                </h3>
              </div>
              <span className="text-xs text-slate-500 dark:text-muted-foreground font-medium hidden sm:inline">
                Visual poster and categorization
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Media Uploader */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                  Event Banner Image
                </label>
                <div
                  onClick={() => bannerInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 dark:border-border rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer hover:border-amber-500 hover:bg-amber-50/20 dark:hover:bg-amber-950/20 transition-all bg-slate-50/40 dark:bg-slate-900/40"
                >
                  <input
                    ref={bannerInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleBannerFile(e.target.files)}
                    className="hidden"
                  />
                  <UploadCloud className="size-8 text-amber-600 dark:text-amber-400 mb-1" />
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Click to upload banner poster
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-muted-foreground mt-0.5">
                    JPG, PNG, WebP up to 10MB
                  </p>
                </div>

                {mediaPreviewUrl && (
                  <div className="mt-3 relative h-40 w-full rounded-xl overflow-hidden border border-slate-200 dark:border-border bg-slate-900">
                    <img
                      src={mediaPreviewUrl}
                      alt="Banner Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setMediaFile(null)
                        setMediaPreviewUrl(null)
                      }}
                      className="absolute top-2 right-2 size-6 rounded-full bg-black/70 hover:bg-rose-600 text-white flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <X className="size-3.5" />
                    </button>
                    <div className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white">
                      Banner Preview
                    </div>
                  </div>
                )}
              </div>

              {/* Topic Interests */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                  Targeted Topics & Subjects
                </label>
                <div className="flex flex-wrap gap-2">
                  {EVENT_INTERESTS.map((interest) => {
                    const isChecked = selectedInterests.includes(interest.id)
                    return (
                      <button
                        key={interest.id}
                        type="button"
                        onClick={() => {
                          setSelectedInterests((prev) =>
                            prev.includes(interest.id)
                              ? prev.filter((i) => i !== interest.id)
                              : [...prev, interest.id]
                          )
                        }}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer border",
                          isChecked
                            ? "bg-amber-600 text-white border-amber-600 shadow-xs ring-2 ring-amber-600/20"
                            : "bg-white dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-border hover:bg-slate-50 dark:hover:bg-slate-800 shadow-2xs"
                        )}
                      >
                        <span>{interest.icon}</span>
                        <span>{interest.label}</span>
                        {isChecked && <CheckCircle2 className="size-3.5 ml-0.5" />}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Card 5: Day-wise Schedule Timeline Repeater */}
          <div className="rounded-2xl border border-slate-200 dark:border-border bg-white dark:bg-card p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold">
                  5
                </div>
                <h3 className="font-bold text-slate-900 dark:text-foreground text-base">
                  Day-Wise Schedule Timeline (Optional)
                </h3>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddTimelineItem}
                className="h-8 gap-1 text-xs font-bold border-slate-300 dark:border-border text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer shadow-2xs"
              >
                <Plus className="size-3.5" />
                Add Milestone
              </Button>
            </div>

            {timeline.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-muted-foreground py-4 text-center">
                No timeline milestones added. Click "Add Milestone" to provide hour-by-hour or day-by-day schedules.
              </p>
            ) : (
              <div className="space-y-3">
                {timeline.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col gap-2.5 p-4 rounded-xl border border-slate-200 dark:border-border bg-slate-50/60 dark:bg-slate-900/40"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex size-6 items-center justify-center rounded-full bg-amber-500 text-white text-[11px] font-bold">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Day {item.day} Schedule
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveTimeline(idx)}
                        className="size-7 p-0 text-slate-400 hover:text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-muted-foreground mb-1">
                          Day #
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={item.day}
                          onChange={(e) => handleUpdateTimeline(idx, "day", Number(e.target.value))}
                          className="w-full rounded-lg border border-slate-300 dark:border-border bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs font-bold text-slate-900 dark:text-foreground"
                        />
                      </div>

                      <div className="sm:col-span-4">
                        <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-muted-foreground mb-1">
                          Milestone Title *
                        </label>
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => handleUpdateTimeline(idx, "title", e.target.value)}
                          placeholder="e.g. Round 1: Problem Statement Reveal"
                          className="w-full rounded-lg border border-slate-300 dark:border-border bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-900 dark:text-foreground"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-muted-foreground mb-1">
                          Start Time (AM/PM)
                        </label>
                        <TimePicker12h
                          value={item.start_time}
                          onChange={(val) => handleUpdateTimeline(idx, "start_time", val)}
                          size="sm"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-muted-foreground mb-1">
                          End Time (AM/PM)
                        </label>
                        <TimePicker12h
                          value={item.end_time}
                          onChange={(val) => handleUpdateTimeline(idx, "end_time", val)}
                          size="sm"
                        />
                      </div>
                    </div>

                    <div>
                      <input
                        type="text"
                        value={item.description || ""}
                        onChange={(e) => handleUpdateTimeline(idx, "description", e.target.value)}
                        placeholder="Description of milestone activities, rules, or deliverables..."
                        className="w-full rounded-lg border border-slate-300 dark:border-border bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>
      </div>
    )
  }

  // ==========================================
  // VIEW: EVENTS DASHBOARD TABLE & GRID LIST
  // ==========================================
  return (
    <div className="space-y-6 pb-20 animate-in fade-in-50 duration-200">
      {/* Top Banner & Stats Header */}
      <div className="rounded-2xl border border-slate-200 dark:border-border bg-white dark:bg-card p-5 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="size-13 shrink-0 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white flex items-center justify-center font-black shadow-md ring-4 ring-amber-100 dark:ring-amber-950/60">
              <Trophy className="size-7" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-foreground">
                  Arena Events & Championships
                </h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-950/60 px-2.5 py-0.5 text-xs font-bold text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shadow-2xs">
                  <Sparkles className="size-3 text-amber-600" />
                  Official Arena Showcase
                </span>
              </div>
              <p className="text-xs font-medium text-slate-500 dark:text-muted-foreground mt-0.5">
                Manage competitions, science summits, webinars, and national championships for student innovators.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadEvents(true)}
              disabled={isSyncing}
              className="h-9 gap-1.5 font-bold border-slate-300 dark:border-border text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer shadow-2xs"
            >
              <RefreshCw className={cn("size-3.5", isSyncing && "animate-spin")} />
              Sync
            </Button>

            <Button
              size="sm"
              onClick={handleOpenCreate}
              className="h-9 gap-1.5 font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-sm shadow-amber-500/20 cursor-pointer"
            >
              <Plus className="size-4" />
              Create Arena Event
            </Button>
          </div>
        </div>

        {/* Quick Stat Tiles - Verification & Queue Counts */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-5 mt-5 border-t border-slate-100 dark:border-border">
          <div
            onClick={() => setStatusFilter("all")}
            className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-border cursor-pointer hover:border-slate-400 dark:hover:border-slate-600 transition-colors shadow-2xs"
            title="Show all events"
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-muted-foreground">Total Events</p>
            <p className="text-xl font-black text-slate-900 dark:text-foreground mt-0.5">{stats?.total_events ?? totalEvents}</p>
          </div>

          <div
            onClick={() => setStatusFilter("pending")}
            className={cn(
              "p-3 rounded-xl border cursor-pointer transition-all shadow-2xs",
              statusFilter === "pending"
                ? "bg-amber-100/80 dark:bg-amber-950/70 border-amber-500 ring-2 ring-amber-500/20"
                : (stats?.pending_verification ?? 0) > 0
                ? "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700"
                : "bg-slate-50 dark:bg-slate-900/60 border-slate-200/80 dark:border-border"
            )}
            title="Filter pending approval queue"
          >
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Pending Review</p>
              {(stats?.pending_verification ?? 0) > 0 && (
                <span className="flex size-2 rounded-full bg-amber-500 animate-ping" />
              )}
            </div>
            <p className="text-xl font-black text-amber-900 dark:text-amber-200 mt-0.5">
              {stats?.pending_verification ?? events.filter((e) => e.verification_status === "pending").length}
            </p>
          </div>

          <div
            onClick={() => setStatusFilter("approved")}
            className={cn(
              "p-3 rounded-xl border cursor-pointer transition-colors shadow-2xs",
              statusFilter === "approved"
                ? "bg-emerald-100/80 dark:bg-emerald-950/70 border-emerald-500 ring-2 ring-emerald-500/20"
                : "bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200/60 dark:border-emerald-900/40 hover:border-emerald-400"
            )}
            title="Filter approved live events"
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Approved Live</p>
            <p className="text-xl font-black text-emerald-900 dark:text-emerald-200 mt-0.5">{stats?.approved ?? approvedCount}</p>
          </div>

          <div
            onClick={() => {
              setOnlyMentor(!onlyMentor)
              if (!onlyMentor) setOnlyOfficialJL(false)
            }}
            className={cn(
              "p-3 rounded-xl border cursor-pointer transition-colors shadow-2xs",
              onlyMentor
                ? "bg-indigo-100/80 dark:bg-indigo-950/70 border-indigo-500 ring-2 ring-indigo-500/20"
                : "bg-indigo-50/60 dark:bg-indigo-950/30 border-indigo-200/60 dark:border-indigo-900/40 hover:border-indigo-400"
            )}
            title="Toggle mentor submissions"
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">Mentor Events</p>
            <p className="text-xl font-black text-indigo-900 dark:text-indigo-200 mt-0.5">
              {stats?.mentor_events ?? events.filter((e) => !e.is_official).length}
            </p>
          </div>

          <div
            onClick={() => {
              setOnlyOfficialJL(!onlyOfficialJL)
              if (!onlyOfficialJL) setOnlyMentor(false)
            }}
            className={cn(
              "p-3 rounded-xl border cursor-pointer transition-colors shadow-2xs",
              onlyOfficialJL
                ? "bg-blue-100/80 dark:bg-blue-950/70 border-blue-500 ring-2 ring-blue-500/20"
                : "bg-blue-50/60 dark:bg-blue-950/30 border-blue-200/60 dark:border-blue-900/40 hover:border-blue-400"
            )}
            title="Toggle official JL events"
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">Official Brand (JL)</p>
            <p className="text-xl font-black text-blue-900 dark:text-blue-200 mt-0.5">{stats?.official_jl_events ?? officialCount}</p>
          </div>

          <div
            onClick={() => setStatusFilter("rejected")}
            className={cn(
              "p-3 rounded-xl border cursor-pointer transition-colors shadow-2xs",
              statusFilter === "rejected"
                ? "bg-rose-100/80 dark:bg-rose-950/70 border-rose-500 ring-2 ring-rose-500/20"
                : "bg-rose-50/60 dark:bg-rose-950/30 border-rose-200/60 dark:border-rose-900/40 hover:border-rose-400"
            )}
            title="Filter rejected events"
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">Rejected</p>
            <p className="text-xl font-black text-rose-900 dark:text-rose-200 mt-0.5">
              {stats?.rejected ?? events.filter((e) => e.verification_status === "rejected").length}
            </p>
          </div>
        </div>
      </div>

      {/* Search, Filter Toolbar & View Toggle */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 rounded-2xl border border-slate-200 dark:border-border bg-white dark:bg-card shadow-xs">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search Input */}
          <div className="relative min-w-[240px] flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, venue, mentor, email..."
              className="w-full rounded-xl border border-slate-300 dark:border-border bg-white dark:bg-slate-900/60 pl-9 pr-3 py-2 text-xs font-semibold text-slate-900 dark:text-foreground placeholder:text-slate-400 focus:outline-none focus:border-amber-500 shadow-2xs"
            />
          </div>

          {/* Status Select */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="rounded-xl border border-slate-300 dark:border-border bg-white dark:bg-slate-900/60 px-3 py-2 text-xs font-bold text-slate-800 dark:text-foreground focus:outline-none focus:border-amber-500 shadow-2xs"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending Review ({(stats?.pending_verification ?? events.filter((e) => e.verification_status === "pending").length)})</option>
            <option value="approved">Approved</option>
            <option value="draft">Draft</option>
            <option value="rejected">Rejected</option>
          </select>

          {/* Filter Toggles */}
          <button
            type="button"
            onClick={() => {
              setOnlyMentor(!onlyMentor)
              if (!onlyMentor) setOnlyOfficialJL(false)
            }}
            className={cn(
              "rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer border flex items-center gap-1 shadow-2xs",
              onlyMentor
                ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                : "bg-white dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-border hover:bg-slate-50 dark:hover:bg-slate-800"
            )}
          >
            <UserCheck className="size-3.5" />
            Mentor Only
          </button>

          <button
            type="button"
            onClick={() => {
              setOnlyOfficialJL(!onlyOfficialJL)
              if (!onlyOfficialJL) setOnlyMentor(false)
            }}
            className={cn(
              "rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer border shadow-2xs",
              onlyOfficialJL
                ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                : "bg-white dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-border hover:bg-slate-50 dark:hover:bg-slate-800"
            )}
          >
            Official JL Only
          </button>

          <button
            type="button"
            onClick={() => setOnlyFeatured(!onlyFeatured)}
            className={cn(
              "rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer border flex items-center gap-1 shadow-2xs",
              onlyFeatured
                ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                : "bg-white dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-border hover:bg-slate-50 dark:hover:bg-slate-800"
            )}
          >
            <Star className="size-3" />
            Featured Only
          </button>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 rounded-xl border border-slate-200 dark:border-border p-1 bg-slate-50 dark:bg-slate-900/60">
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={cn(
              "rounded-lg p-1.5 text-xs font-bold transition-colors cursor-pointer",
              viewMode === "grid"
                ? "bg-white dark:bg-card text-amber-600 dark:text-amber-400 shadow-xs"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            )}
            title="Grid View"
          >
            <LayoutGrid className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={cn(
              "rounded-lg p-1.5 text-xs font-bold transition-colors cursor-pointer",
              viewMode === "table"
                ? "bg-white dark:bg-card text-amber-600 dark:text-amber-400 shadow-xs"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            )}
            title="Table View"
          >
            <TableIcon className="size-4" />
          </button>
        </div>
      </div>

      {/* Events Listing */}
      {isLoading ? (
        <div className="p-12 text-center rounded-2xl border border-slate-200 dark:border-border bg-white dark:bg-card">
          <RefreshCw className="size-8 animate-spin mx-auto text-amber-600 mb-2" />
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Loading arena events...</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-border bg-white dark:bg-card space-y-3">
          <Trophy className="size-10 mx-auto text-slate-300 dark:text-slate-700" />
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No Arena events found matching current filters.</p>
          <p className="text-xs text-slate-500 dark:text-muted-foreground max-w-sm mx-auto">
            Try adjusting your search query, status filter, or click below to author a new championship.
          </p>
          <Button
            size="sm"
            onClick={handleOpenCreate}
            className="font-bold bg-amber-600 hover:bg-amber-700 text-white cursor-pointer"
          >
            <Plus className="size-4" />
            Create Arena Event
          </Button>
        </div>
      ) : viewMode === "grid" ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEvents.map((ev) => (
            <div
              key={ev.id}
              className="rounded-2xl border border-slate-200 dark:border-border bg-white dark:bg-card overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                {/* Banner Thumbnail */}
                <div className="relative h-44 w-full bg-slate-900">
                  {ev.media ? (
                    <img
                      src={ev.media}
                      alt={ev.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 bg-gradient-to-br from-slate-900 to-amber-950/40">
                      <Trophy className="size-10 text-amber-500/40 mb-1" />
                      <span className="text-[11px] font-bold text-slate-400">Arena Event</span>
                    </div>
                  )}

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

                  {/* Badges on Top */}
                  <div className="absolute top-3 inset-x-3 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {ev.is_official && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-600/90 backdrop-blur-xs px-2.5 py-0.5 text-[10px] font-black text-white shadow-xs">
                          <CheckCircle2 className="size-3" />
                          Official JL
                        </span>
                      )}
                      {ev.is_featured && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-purple-600/90 backdrop-blur-xs px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                          <Star className="size-3 fill-white" />
                          Featured
                        </span>
                      )}
                    </div>

                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider backdrop-blur-xs",
                        ev.verification_status === "approved"
                          ? "bg-emerald-500/90 text-white"
                          : ev.verification_status === "rejected"
                          ? "bg-rose-500/90 text-white"
                          : "bg-amber-500/90 text-white"
                      )}
                    >
                      {ev.verification_status || "pending"}
                    </span>
                  </div>

                  {/* Date & Time pill bottom */}
                  <div className="absolute bottom-2.5 left-3 right-3 text-white">
                    <p className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                      <Calendar className="size-3" />
                      {ev.start_date} {ev.end_date !== ev.start_date ? `to ${ev.end_date}` : ""}
                    </p>
                  </div>
                </div>

                {/* Content Details */}
                <div className="p-4 space-y-3">
                  <h4 className="font-black text-sm text-slate-900 dark:text-foreground line-clamp-2 leading-snug">
                    {ev.title}
                  </h4>

                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="size-3.5 text-amber-600 shrink-0" />
                      <span className="truncate">{ev.venue || "Online Event"}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-muted-foreground">
                      <Clock className="size-3 shrink-0" />
                      <span>{formatTimeDisplay(ev.start_time)} - {formatTimeDisplay(ev.end_time)}</span>
                    </div>
                  </div>

                  {/* Topics Tags */}
                  {Array.isArray(ev.interests) && ev.interests.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {ev.interests.slice(0, 3).map((intName, i) => (
                        <span
                          key={i}
                          className="rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 text-[10px] font-bold"
                        >
                          #{intName}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Pending Review Prompt on Card */}
              {ev.verification_status === "pending" && (
                <div className="mx-4 mb-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/80 flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-900 dark:text-amber-200">
                    <Clock className="size-3.5 text-amber-600 shrink-0" />
                    <span>Awaiting Review</span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleOpenReview(ev.id)}
                    className="h-7 px-2.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white cursor-pointer shadow-2xs"
                  >
                    <ShieldCheck className="size-3.5 mr-1" />
                    Review
                  </Button>
                </div>
              )}

              {/* Rejection Note Preview if rejected */}
              {ev.verification_status === "rejected" && ev.rejection_reason && (
                <div className="mx-4 mb-2 p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-[11px] text-rose-800 dark:text-rose-300 flex items-start gap-1.5">
                  <AlertTriangle className="size-3.5 text-rose-600 shrink-0 mt-0.5" />
                  <p className="line-clamp-2 font-medium">{ev.rejection_reason}</p>
                </div>
              )}

              {/* Card Footer Actions */}
              <div className="p-3 border-t border-slate-100 dark:border-border flex flex-wrap items-center justify-between gap-2 text-xs bg-slate-50/50 dark:bg-slate-900/30">
                <div className="flex items-center gap-3 text-slate-500 dark:text-muted-foreground text-[11px]">
                  <span title="Interested count">❤️ {ev.interested_count ?? 0}</span>
                  <span title="Views">👁️ {ev.view_count ?? 0}</span>
                </div>

                <div className="flex items-center gap-1">
                  {ev.verification_status === "pending" && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleApprove(ev.id)}
                        disabled={isApproving}
                        className="h-7 px-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer shadow-2xs"
                        title="Approve and Publish Event"
                      >
                        <CheckCircle2 className="size-3.5 mr-1 text-emerald-600" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenRejectDialog(ev.id)}
                        className="h-7 px-2 text-xs font-bold text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer shadow-2xs"
                        title="Reject with Feedback"
                      >
                        <XCircle className="size-3.5 mr-1 text-rose-600" />
                        Reject
                      </Button>
                    </>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenReview(ev.id)}
                    className="size-8 p-0 text-slate-600 dark:text-slate-300 hover:text-amber-600 cursor-pointer"
                    title="View Full Event & Mentor Details"
                  >
                    <Eye className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenEdit(ev.id)}
                    className="size-8 p-0 text-slate-600 dark:text-slate-300 hover:text-amber-600 cursor-pointer"
                    title="Edit Event"
                  >
                    <Edit className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(ev.id, ev.title)}
                    className="size-8 p-0 text-slate-400 hover:text-rose-600 cursor-pointer"
                    title="Delete Event"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="rounded-2xl border border-slate-200 dark:border-border bg-white dark:bg-card overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-border text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Event</th>
                  <th className="p-3.5">Venue</th>
                  <th className="p-3.5">Dates</th>
                  <th className="p-3.5">Host & Attribution</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Stats</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-border text-slate-800 dark:text-slate-200 font-medium">
                {filteredEvents.map((ev) => (
                  <tr key={ev.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 font-bold">
                      <div className="flex items-center gap-2.5">
                        <div className="size-9 rounded-lg bg-slate-900 overflow-hidden shrink-0">
                          {ev.media ? (
                            <img src={ev.media} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-amber-500">
                              <Trophy className="size-4" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 dark:text-foreground line-clamp-1">{ev.title}</p>
                          <p className="text-[10px] text-slate-500 dark:text-muted-foreground">{ev.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 truncate max-w-[180px]">{ev.venue}</td>
                    <td className="p-3.5">
                      <p className="font-bold">{formatDateDisplay(ev.start_date)}</p>
                      <p className="text-[10px] text-slate-500">{formatTimeDisplay(ev.start_time)}</p>
                    </td>
                    <td className="p-3.5">
                      {ev.is_official ? (
                        <span className="inline-flex items-center gap-1 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 px-2 py-0.5 text-[10px] font-bold border border-blue-200 dark:border-blue-800">
                          <CheckCircle2 className="size-3" />
                          Official JL
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 text-[10px] font-bold border border-indigo-200 dark:border-indigo-800">
                          <UserCheck className="size-3" />
                          {ev.created_by?.name || ev.organizer_name || "Mentor"}
                        </span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={cn(
                          "rounded-md px-2 py-0.5 text-[10px] font-bold capitalize inline-flex items-center gap-1",
                          ev.verification_status === "approved"
                            ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300"
                            : ev.verification_status === "rejected"
                            ? "bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300"
                            : "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300"
                        )}
                      >
                        {ev.verification_status === "pending" && (
                          <span className="size-1.5 rounded-full bg-amber-500 animate-ping" />
                        )}
                        {ev.verification_status
                          ? ev.verification_status.charAt(0).toUpperCase() + ev.verification_status.slice(1)
                          : "Pending"}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-500 text-[11px]">
                      ❤️ {ev.interested_count ?? 0} • 👁️ {ev.view_count ?? 0}
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {ev.verification_status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleOpenReview(ev.id)}
                              className="h-7 px-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white cursor-pointer shadow-2xs"
                              title="Review Submission"
                            >
                              <ShieldCheck className="size-3 mr-1" />
                              Review
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleApprove(ev.id)}
                              className="h-7 px-2 text-xs font-bold text-emerald-700 border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer shadow-2xs"
                              title="Quick Approve"
                            >
                              <CheckCircle2 className="size-3 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenRejectDialog(ev.id)}
                              className="h-7 px-2 text-xs font-bold text-rose-700 border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer shadow-2xs"
                              title="Reject with Feedback"
                            >
                              <XCircle className="size-3 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenReview(ev.id)}
                          className="size-7 p-0 text-slate-600 hover:text-amber-600 cursor-pointer"
                          title="View Full Details"
                        >
                          <Eye className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(ev.id)}
                          className="size-7 p-0 text-slate-600 hover:text-amber-600 cursor-pointer"
                          title="Edit Event"
                        >
                          <Edit className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(ev.id, ev.title)}
                          className="size-7 p-0 text-slate-400 hover:text-rose-600 cursor-pointer"
                          title="Delete Event"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* REVIEW & APPROVAL DRAWER / MODAL */}
      {/* ========================================== */}
      {isReviewOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl rounded-3xl border border-slate-200 dark:border-border bg-white dark:bg-card shadow-2xl overflow-hidden my-6 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-border flex items-center justify-between bg-slate-50/60 dark:bg-slate-900/60">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs">
                  <ShieldCheck className="size-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-foreground text-base">
                    Event Review & Verification
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-muted-foreground">
                    Inspect event contents and mentor credentials before approval or rejection
                  </p>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsReviewOpen(false)}
                className="size-8 p-0 rounded-full text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="size-4" />
              </Button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {isLoadingDetail ? (
                <div className="p-12 text-center">
                  <RefreshCw className="size-7 animate-spin mx-auto text-amber-600 mb-2" />
                  <p className="font-bold text-slate-600 dark:text-slate-400">Loading complete event & mentor dossier...</p>
                </div>
              ) : reviewDetail ? (
                <>
                  {/* Status Banner */}
                  <div
                    className={cn(
                      "p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3",
                      reviewDetail.verification_status === "approved"
                        ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200"
                        : reviewDetail.verification_status === "rejected"
                        ? "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-700 text-rose-900 dark:text-rose-200"
                        : "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {reviewDetail.verification_status === "approved" ? (
                        <CheckCircle2 className="size-5 text-emerald-600 shrink-0" />
                      ) : reviewDetail.verification_status === "rejected" ? (
                        <XCircle className="size-5 text-rose-600 shrink-0" />
                      ) : (
                        <Clock className="size-5 text-amber-600 shrink-0" />
                      )}
                      <div>
                        <p className="font-black text-sm uppercase tracking-wide">
                          Status: {reviewDetail.verification_status || "Pending Verification"}
                        </p>
                        {reviewDetail.reviewed_by_name && (
                          <p className="text-[11px] opacity-80 mt-0.5">
                            Reviewed by {reviewDetail.reviewed_by_name}{" "}
                            {reviewDetail.reviewed_at ? `on ${new Date(reviewDetail.reviewed_at).toLocaleDateString()}` : ""}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {reviewDetail.verification_status === "approved" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenRejectDialog(reviewDetail.id)}
                          className="font-bold text-rose-700 border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                        >
                          <XCircle className="size-3.5 mr-1" />
                          Revoke Approval
                        </Button>
                      ) : reviewDetail.verification_status === "rejected" ? (
                        <Button
                          size="sm"
                          onClick={() => handleApprove(reviewDetail.id)}
                          disabled={isApproving}
                          className="font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-xs"
                        >
                          <CheckCircle2 className="size-3.5 mr-1" />
                          Re-approve Event
                        </Button>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenRejectDialog(reviewDetail.id)}
                            className="font-bold text-rose-700 border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                          >
                            <XCircle className="size-3.5 mr-1" />
                            Reject Event
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleApprove(reviewDetail.id)}
                            disabled={isApproving}
                            className="font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-xs"
                          >
                            <CheckCircle2 className="size-3.5 mr-1" />
                            Approve Now
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Rejection Alert if present */}
                  {reviewDetail.rejection_reason && (
                    <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-900 dark:text-rose-200 space-y-1">
                      <p className="font-black text-xs flex items-center gap-1.5 text-rose-700 dark:text-rose-400">
                        <AlertTriangle className="size-4" />
                        Previous Rejection Feedback
                      </p>
                      <p className="text-xs font-medium pl-5">{reviewDetail.rejection_reason}</p>
                    </div>
                  )}

                  {/* Mentor & Creator Profile Card */}
                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-border bg-slate-50/60 dark:bg-slate-900/40 space-y-3">
                    <p className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-muted-foreground flex items-center gap-1.5">
                      <UserCheck className="size-3.5 text-amber-600" />
                      Organizer / Mentor Profile
                    </p>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-card p-3.5 rounded-xl border border-slate-200/80 dark:border-border">
                      <div className="flex items-center gap-3">
                        <div className="size-11 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center font-black text-base shadow-xs">
                          {(reviewDetail.created_by?.name || reviewDetail.organizer_name || "M").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-black text-slate-900 dark:text-foreground text-sm">
                              {reviewDetail.created_by?.name || reviewDetail.organizer_name || "Community Mentor"}
                            </p>
                            <span className="rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 px-2 py-0.5 text-[10px] font-bold">
                              {reviewDetail.created_by?.role || (reviewDetail.is_official ? "Official JL" : "Mentor")}
                            </span>
                          </div>
                          <p className="text-slate-500 dark:text-muted-foreground text-xs mt-0.5">
                            {reviewDetail.created_by?.email || "Email not specified"}
                          </p>
                        </div>
                      </div>

                      <div className="text-slate-600 dark:text-slate-300 font-semibold space-y-1 sm:text-right">
                        <p className="flex items-center gap-1 sm:justify-end text-xs">
                          <Phone className="size-3 text-slate-400" />
                          <span>{reviewDetail.created_by?.phone_number || reviewDetail.organizer_phone || "No phone"}</span>
                        </p>
                        <span className="inline-block text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                          ✓ Verified Mentor Identity
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Event Core Presentation */}
                  <div className="rounded-2xl border border-slate-200 dark:border-border bg-white dark:bg-card overflow-hidden space-y-4">
                    {/* Banner Image */}
                    {reviewDetail.media && (
                      <div className="relative h-52 w-full bg-slate-900">
                        <img
                          src={reviewDetail.media}
                          alt={reviewDetail.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <div className="p-4 space-y-3">
                      <h4 className="font-black text-base text-slate-900 dark:text-foreground">
                        {reviewDetail.title}
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-2">
                          <MapPin className="size-4 text-amber-600 shrink-0" />
                          <span className="font-semibold">{reviewDetail.venue || "Online Event"}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Calendar className="size-4 text-amber-600 shrink-0" />
                          <span className="font-semibold">
                            {formatDateDisplay(reviewDetail.start_date)} {reviewDetail.end_date !== reviewDetail.start_date ? `to ${formatDateDisplay(reviewDetail.end_date)}` : ""} ({formatTimeDisplay(reviewDetail.start_time)} - {formatTimeDisplay(reviewDetail.end_time)})
                          </span>
                        </div>

                        {reviewDetail.age_criteria && (
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-500">Eligibility:</span>
                            <span>{reviewDetail.age_criteria}</span>
                          </div>
                        )}

                        {reviewDetail.registration_link && (
                          <div className="flex items-center gap-2">
                            <ExternalLink className="size-4 text-blue-600 shrink-0" />
                            <a
                              href={reviewDetail.registration_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-bold text-blue-600 hover:underline truncate"
                            >
                              Open Registration Link
                            </a>
                          </div>
                        )}

                        {reviewDetail.brochure && (
                          <div className="flex items-center gap-2">
                            <FileText className="size-4 text-purple-600 shrink-0" />
                            <a
                              href={reviewDetail.brochure}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-bold text-purple-600 hover:underline truncate"
                            >
                              Download Brochure (PDF)
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Description */}
                      <div className="pt-2 border-t border-slate-100 dark:border-border">
                        <p className="font-bold text-slate-700 dark:text-slate-300 mb-1">Description:</p>
                        <p className="text-slate-600 dark:text-muted-foreground whitespace-pre-wrap leading-relaxed">
                          {reviewDetail.description}
                        </p>
                      </div>

                      {/* Interests */}
                      {Array.isArray(reviewDetail.interests) && reviewDetail.interests.length > 0 && (
                        <div className="pt-2">
                          <p className="font-bold text-slate-700 dark:text-slate-300 mb-1.5">Target Interests:</p>
                          <div className="flex flex-wrap gap-1.5">
                            {reviewDetail.interests.map((item, idx) => (
                              <span
                                key={idx}
                                className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-800 dark:text-amber-300 font-bold text-xs"
                              >
                                #{item}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Timeline Schedule Section */}
                  {reviewDetail.timeline && reviewDetail.timeline.length > 0 && (
                    <div className="p-4 rounded-2xl border border-slate-200 dark:border-border bg-slate-50/50 dark:bg-slate-900/30 space-y-3">
                      <p className="font-black text-slate-900 dark:text-foreground text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <Clock className="size-3.5 text-amber-600" />
                        Day-Wise Schedule Timeline ({reviewDetail.timeline.length} Milestones)
                      </p>

                      <div className="space-y-2">
                        {reviewDetail.timeline.map((item, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-card flex items-start gap-3"
                          >
                            <span className="flex size-6 items-center justify-center rounded-full bg-amber-500 text-white font-bold text-xs shrink-0 mt-0.5">
                              {item.day}
                            </span>
                            <div className="flex-1 space-y-0.5">
                              <div className="flex items-center justify-between">
                                <p className="font-bold text-slate-900 dark:text-foreground text-xs">{item.title}</p>
                                <span className="text-[11px] font-semibold text-slate-500">
                                  {formatTimeDisplay(item.start_time)} - {formatTimeDisplay(item.end_time)}
                                </span>
                              </div>
                              {item.description && (
                                <p className="text-[11px] text-slate-500 dark:text-muted-foreground">{item.description}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-border flex items-center justify-between bg-slate-50/60 dark:bg-slate-900/60">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsReviewOpen(false)}
                className="font-bold cursor-pointer"
              >
                Close Dossier
              </Button>

              {reviewDetail && (
                <div className="flex items-center gap-2">
                  {reviewDetail.verification_status === "approved" ? (
                    <>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mr-1">
                        <CheckCircle2 className="size-4" />
                        Approved & Live
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenRejectDialog(reviewDetail.id)}
                        className="font-bold text-rose-700 border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                      >
                        <XCircle className="size-3.5 mr-1" />
                        Revoke Approval
                      </Button>
                    </>
                  ) : reviewDetail.verification_status === "rejected" ? (
                    <>
                      <span className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1 mr-1">
                        <XCircle className="size-4" />
                        Rejected
                      </span>
                      <Button
                        size="sm"
                        onClick={() => handleApprove(reviewDetail.id)}
                        disabled={isApproving}
                        className="font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-xs"
                      >
                        <CheckCircle2 className="size-3.5 mr-1" />
                        Re-approve & Publish
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenRejectDialog(reviewDetail.id)}
                        className="font-bold text-rose-700 border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                      >
                        <XCircle className="size-3.5 mr-1" />
                        Reject Submission
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleApprove(reviewDetail.id)}
                        disabled={isApproving}
                        className="font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-xs"
                      >
                        <CheckCircle2 className="size-3.5 mr-1" />
                        Approve & Publish Live
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* QUICK REJECT REASON MODAL */}
      {/* ========================================== */}
      {rejectionModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-border bg-white dark:bg-card shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-600">
                <AlertTriangle className="size-5" />
                <h3 className="font-bold text-base text-slate-900 dark:text-foreground">
                  Reject Event Submission
                </h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRejectionModalOpen(false)}
                className="size-7 p-0 cursor-pointer text-slate-400 hover:text-slate-800"
              >
                <X className="size-4" />
              </Button>
            </div>

            <p className="text-xs text-slate-500 dark:text-muted-foreground">
              Please specify feedback explaining why this event was rejected. The mentor will see this note to correct Step 2 or timeline milestones.
            </p>

            {/* Quick Presets */}
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold uppercase text-slate-400">Quick Feedback Templates:</p>
              <div className="flex flex-wrap gap-1.5">
                {REJECTION_PRESETS.map((preset, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setRejectReasonText(preset)}
                    className="text-[10px] text-left rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 px-2 py-1 font-semibold transition-colors cursor-pointer"
                  >
                    💡 {preset.slice(0, 48)}...
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Rejection Reason (Required) *
              </label>
              <textarea
                rows={4}
                value={rejectReasonText}
                onChange={(e) => setRejectReasonText(e.target.value)}
                placeholder="e.g. The venue details are missing the exact hall number, and the registration link returns a 404 error. Please update Step 2 and resubmit."
                className="w-full rounded-xl border border-slate-300 dark:border-border bg-white dark:bg-slate-900/60 p-3 text-xs font-medium text-slate-900 dark:text-foreground placeholder:text-slate-400 focus:outline-none focus:border-rose-500 shadow-2xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRejectionModalOpen(false)}
                className="font-bold cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmReject}
                disabled={isRejecting || !rejectReasonText.trim()}
                className="font-bold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer shadow-xs"
              >
                {isRejecting ? "Submitting..." : "Confirm Rejection"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
