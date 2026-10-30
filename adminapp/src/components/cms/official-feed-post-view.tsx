import { useState, useRef, useEffect } from "react"
import {
  Send,
  Sparkles,
  Image as ImageIcon,
  Video,
  X,
  UploadCloud,
  CheckCircle2,
  Users,
  Calendar,
  Landmark,
  Hash,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
  Search,
  MapPin,
  Building,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { cn } from "@/lib/utils"
import {
  createOfficialJLPost,
  fetchFeedEvents,
  type JLPostItem,
  type FeedEventItem,
} from "@/lib/api"

// Curated topic interests with standard IDs
const TOPIC_INTERESTS: { id: number; label: string; icon: string }[] = [
  { id: 1, label: "Science & Tech", icon: "🔬" },
  { id: 2, label: "Arts & Craft", icon: "🎨" },
  { id: 3, label: "History & Heritage", icon: "🏛️" },
  { id: 4, label: "Environment & Nature", icon: "🌿" },
  { id: 5, label: "Mathematics", icon: "📐" },
  { id: 6, label: "Space & Astronomy", icon: "🚀" },
  { id: 7, label: "Languages & Literature", icon: "🗣️" },
  { id: 8, label: "Culture & Festivals", icon: "🎭" },
  { id: 9, label: "Wellness & Sports", icon: "🏃" },
]

// Popular quick hashtags
const QUICK_HASHTAGS = [
  "#JustLearning",
  "#STEMIndia",
  "#RootsAndCulture",
  "#StudentInnovation",
  "#LearningTogether",
  "#OfficialUpdate",
]

interface UploadedMediaItem {
  id: string
  file: File
  previewUrl: string
  isVideo: boolean
}

function formatEventDates(start?: string, end?: string) {
  if (!start) return ""
  try {
    const s = new Date(start)
    const sStr = s.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    if (!end || end === start) return sStr
    const e = new Date(end)
    const eStr = e.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    return `${sStr} - ${eStr}`
  } catch {
    return start
  }
}

export function OfficialFeedPostView() {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form State
  const [description, setDescription] = useState("")
  const [postType, setPostType] = useState<"community" | "event" | "roots_culture">("community")
  const [selectedInterests, setSelectedInterests] = useState<number[]>([1])
  const [mediaList, setMediaList] = useState<UploadedMediaItem[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)

  // Event Selection State (for post_type === "event")
  const [selectedEvent, setSelectedEvent] = useState<FeedEventItem | null>(null)
  const [eventSearchQuery, setEventSearchQuery] = useState("")
  const [eventsList, setEventsList] = useState<FeedEventItem[]>([])
  const [isLoadingEvents, setIsLoadingEvents] = useState(false)
  const [eventFetchError, setEventFetchError] = useState<string | null>(null)
  const [isChangingEvent, setIsChangingEvent] = useState(false)

  // Session history of published posts
  const [recentPosts, setRecentPosts] = useState<JLPostItem[]>([])

  // Fetch events when postType switches to "event" or search keyword changes
  useEffect(() => {
    if (postType !== "event") return

    let isMounted = true
    setIsLoadingEvents(true)
    setEventFetchError(null)

    const timer = setTimeout(async () => {
      try {
        const res = await fetchFeedEvents({
          search: eventSearchQuery.trim(),
          status: "approved",
          limit: 20,
        })
        if (isMounted) {
          setEventsList(res.results || [])
        }
      } catch (err: any) {
        if (isMounted) {
          setEventFetchError(err.message || "Failed to load events for selection.")
        }
      } finally {
        if (isMounted) {
          setIsLoadingEvents(false)
        }
      }
    }, eventSearchQuery ? 300 : 0)

    return () => {
      isMounted = false
      clearTimeout(timer)
    }
  }, [postType, eventSearchQuery])

  // Toggle interest
  const toggleInterest = (id: number) => {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  // Append hashtag
  const appendHashtag = (tag: string) => {
    setDescription((prev) => {
      const trimmed = prev.trim()
      if (!trimmed) return tag + " "
      if (trimmed.includes(tag)) return prev
      return `${trimmed} ${tag} `
    })
  }

  // Handle files selection
  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return

    const newItems: UploadedMediaItem[] = []
    Array.from(files).forEach((file) => {
      const isVideo = file.type.startsWith("video/")
      const isImage = file.type.startsWith("image/")

      if (!isImage && !isVideo) {
        toast(`Unsupported file format: ${file.name}. Please upload images or videos.`, "error")
        return
      }

      if (file.size > 50 * 1024 * 1024) {
        toast(`File ${file.name} exceeds 50MB limit.`, "error")
        return
      }

      const previewUrl = URL.createObjectURL(file)
      newItems.push({
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        file,
        previewUrl,
        isVideo,
      })
    })

    setMediaList((prev) => [...prev, ...newItems])
  }

  // Remove media item
  const removeMedia = (id: string) => {
    setMediaList((prev) => {
      const item = prev.find((m) => m.id === id)
      if (item) URL.revokeObjectURL(item.previewUrl)
      return prev.filter((m) => m.id !== id)
    })
  }

  // Clear form
  const handleReset = () => {
    if (description || mediaList.length > 0 || selectedEvent) {
      if (!confirm("Are you sure you want to discard this draft?")) return
    }
    mediaList.forEach((m) => URL.revokeObjectURL(m.previewUrl))
    setDescription("")
    setPostType("community")
    setSelectedInterests([1])
    setMediaList([])
    setSelectedEvent(null)
    setEventSearchQuery("")
    setIsChangingEvent(false)
  }

  // Submit Post
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!description.trim()) {
      toast("Please provide post description / caption.", "error")
      return
    }

    if (postType === "event" && !selectedEvent) {
      toast("Please select a related approved event for this Event post.", "error")
      return
    }

    setIsUploading(true)
    try {
      const res = await createOfficialJLPost({
        description: description.trim(),
        post_type: postType,
        interests: selectedInterests,
        mediaFiles: mediaList.map((m) => m.file),
        event: postType === "event" && selectedEvent ? selectedEvent.id : undefined,
      })

      toast(res.message || "Post created successfully as Just Learning!", "success")

      if (res.post) {
        setRecentPosts((prev) => [res.post, ...prev])
      }

      // Cleanup previews
      mediaList.forEach((m) => URL.revokeObjectURL(m.previewUrl))
      setDescription("")
      setMediaList([])
      setSelectedInterests([1])
      setSelectedEvent(null)
      setEventSearchQuery("")
      setIsChangingEvent(false)
    } catch (err: any) {
      toast(err.message || "Failed to publish post. Please check inputs.", "error")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-6 pb-20 animate-in fade-in-50 duration-200">
      {/* Official Brand Header Banner */}
      <div className="rounded-2xl border border-slate-200 dark:border-border bg-white dark:bg-card p-5 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            {/* JL Brand Emblem */}
            <div className="relative size-13 shrink-0 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-md ring-4 ring-purple-100 dark:ring-purple-950/60">
              JL
              <div
                className="absolute -bottom-1 -right-1 size-5 rounded-full bg-amber-400 border-2 border-white dark:border-slate-900 flex items-center justify-center text-slate-950 shadow-xs"
                title="Official Brand Account"
              >
                <ShieldCheck className="size-3.5 fill-amber-400 text-slate-950" />
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-foreground">
                  Just Learning
                </h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 text-xs font-bold text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shadow-2xs">
                  <CheckCircle2 className="size-3 text-blue-600 dark:text-blue-400 fill-blue-600 dark:fill-blue-400 text-white" />
                  Official Account
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-950/60 px-2.5 py-0.5 text-xs font-bold text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  <Sparkles className="size-3 text-amber-600 dark:text-amber-400" />
                  post_as_jl: true
                </span>
              </div>
              <p className="text-xs font-medium text-slate-500 dark:text-muted-foreground mt-0.5">
                Author & publish feed posts publicly under the official Just Learning brand account.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 text-xs font-bold">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              Feed API Connected
            </span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Authoring Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Controls (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Post Type Selector */}
            <div className="rounded-2xl border border-slate-200 dark:border-border bg-white dark:bg-card p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-border pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold">
                    1
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-foreground text-base">
                    Select Post Type *
                  </h3>
                </div>
                <span className="text-xs text-slate-500 dark:text-muted-foreground font-medium hidden sm:inline">
                  Categorizes post in mobile feed
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    type: "community" as const,
                    label: "Community",
                    icon: Users,
                    desc: "Student updates & open discussion",
                  },
                  {
                    type: "event" as const,
                    label: "Event",
                    icon: Calendar,
                    desc: "Webinars, workshops & contests",
                  },
                  {
                    type: "roots_culture" as const,
                    label: "Roots & Culture",
                    icon: Landmark,
                    desc: "Heritage, festivals & traditions",
                  },
                ].map(({ type, label, icon: Icon, desc }) => {
                  const isSelected = postType === type
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setPostType(type)}
                      className={cn(
                        "flex flex-col items-start p-3.5 rounded-xl border text-left transition-all cursor-pointer",
                        isSelected
                          ? "border-primary bg-primary/10 dark:bg-primary/20 text-primary ring-2 ring-primary/20 shadow-xs"
                          : "border-slate-200 dark:border-border bg-white dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300 shadow-2xs"
                      )}
                    >
                      <div className="flex items-center justify-between w-full mb-2">
                        <div
                          className={cn(
                            "size-8 rounded-lg flex items-center justify-center transition-colors",
                            isSelected
                              ? "bg-primary text-primary-foreground shadow-xs"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                          )}
                        >
                          <Icon className="size-4" />
                        </div>
                        {isSelected && (
                          <span className="size-2 rounded-full bg-primary" />
                        )}
                      </div>
                      <span className="text-xs font-bold leading-tight text-slate-900 dark:text-foreground">
                        {label}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-muted-foreground mt-1 line-clamp-2">
                        {desc}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Conditional Event Selection Step (Only when postType === 'event') */}
            {postType === "event" && (
              <div className="rounded-2xl border-2 border-primary/20 dark:border-primary/30 bg-white dark:bg-card p-6 shadow-xs space-y-4 animate-in fade-in slide-in-from-top-3 duration-200">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-border pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="size-8 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold">
                      2
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-foreground text-base flex items-center gap-2">
                        Link Specific Event *
                        <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full">
                          Required
                        </span>
                      </h3>
                    </div>
                  </div>
                  {selectedEvent && !isChangingEvent ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsChangingEvent(true)}
                      className="text-xs h-8 font-bold border-slate-300 dark:border-border cursor-pointer"
                    >
                      Change Event
                    </Button>
                  ) : (
                    <span className="text-xs text-slate-500 dark:text-muted-foreground font-medium hidden sm:inline">
                      API: /api/admin/feed/events/
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-500 dark:text-muted-foreground">
                  Select the approved Arena event this post highlights. Students will be able to view details and register directly from this feed card.
                </p>

                {/* Selected Event Card View */}
                {selectedEvent && !isChangingEvent ? (
                  <div className="relative rounded-xl border-2 border-emerald-500/40 dark:border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20 p-4 space-y-3 shadow-2xs">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {selectedEvent.media_url ? (
                          <img
                            src={selectedEvent.media_url}
                            alt={selectedEvent.title}
                            className="size-14 rounded-xl object-cover border border-emerald-200 dark:border-emerald-800 shadow-2xs shrink-0"
                          />
                        ) : (
                          <div className="size-14 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-2xs shrink-0">
                            <Calendar className="size-6" />
                          </div>
                        )}
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-md">
                              <CheckCircle2 className="size-3 text-emerald-600 dark:text-emerald-400" />
                              Linked (ID: {selectedEvent.id})
                            </span>
                            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                              {selectedEvent.verification_status || "Approved"}
                            </span>
                          </div>
                          <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-foreground leading-snug truncate">
                            {selectedEvent.title}
                          </h4>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-600 dark:text-slate-300">
                            {selectedEvent.organizer_name && (
                              <span className="inline-flex items-center gap-1 truncate max-w-[180px]">
                                <Building className="size-3 text-slate-400 shrink-0" />
                                {selectedEvent.organizer_name}
                              </span>
                            )}
                            {selectedEvent.venue && (
                              <span className="inline-flex items-center gap-1 truncate max-w-[180px]">
                                <MapPin className="size-3 text-rose-500 shrink-0" />
                                {selectedEvent.venue}
                              </span>
                            )}
                            {selectedEvent.start_date && (
                              <span className="inline-flex items-center gap-1 text-purple-700 dark:text-purple-300 font-medium">
                                <Calendar className="size-3 text-purple-500 shrink-0" />
                                {formatEventDates(selectedEvent.start_date, selectedEvent.end_date)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setIsChangingEvent(true)}
                          className="text-xs h-8 font-bold cursor-pointer"
                        >
                          Change
                        </Button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedEvent(null)
                            setIsChangingEvent(false)
                          }}
                          className="size-8 rounded-lg bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-200 dark:border-rose-900 transition-colors cursor-pointer"
                          title="Remove linked event"
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                    </div>

                    {/* Quick Helper to insert title or hashtag */}
                    <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-800/40 flex flex-wrap items-center gap-2 text-xs">
                      <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px]">Quick actions:</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (!description.includes(selectedEvent.title)) {
                            setDescription((prev) =>
                              prev ? `${selectedEvent.title}\n\n${prev}` : `${selectedEvent.title}\n\nJoin us for this exciting event!`
                            )
                          }
                        }}
                        className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 hover:underline cursor-pointer bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800"
                      >
                        + Insert Title in Caption
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const tag = `#${selectedEvent.title.replace(/[^a-zA-Z0-9]/g, "")}`
                          appendHashtag(tag)
                        }}
                        className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 hover:underline cursor-pointer bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800"
                      >
                        + Add Event Hashtag
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Live Search Input Box */}
                    <div className="relative">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                      <input
                        type="text"
                        value={eventSearchQuery}
                        onChange={(e) => setEventSearchQuery(e.target.value)}
                        placeholder="Search approved events by title, venue, organizer..."
                        className="w-full pl-10 pr-20 py-2.5 rounded-xl border border-slate-300 dark:border-border bg-white dark:bg-slate-900/60 text-sm text-slate-900 dark:text-foreground placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 shadow-2xs"
                      />
                      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                        {isLoadingEvents && (
                          <RefreshCw className="size-4 text-primary animate-spin" />
                        )}
                        {eventSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setEventSearchQuery("")}
                            className="size-6 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer"
                          >
                            <X className="size-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Results / Dropdown list */}
                    <div className="border border-slate-200 dark:border-border rounded-xl bg-slate-50/50 dark:bg-slate-900/40 p-2 max-h-64 overflow-y-auto space-y-1.5">
                      {isLoadingEvents && eventsList.length === 0 ? (
                        <div className="p-6 text-center text-slate-500 dark:text-muted-foreground space-y-2">
                          <RefreshCw className="size-5 animate-spin mx-auto text-primary" />
                          <p className="text-xs font-medium">Loading approved events...</p>
                        </div>
                      ) : eventFetchError ? (
                        <div className="p-4 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs">
                            <AlertCircle className="size-4 shrink-0" />
                            <span>{eventFetchError}</span>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setEventSearchQuery((q) => q + " ")}
                            className="text-xs h-7 font-bold border-rose-300 dark:border-rose-800"
                          >
                            Retry
                          </Button>
                        </div>
                      ) : eventsList.length === 0 ? (
                        <div className="p-6 text-center text-slate-500 dark:text-muted-foreground space-y-1">
                          <Calendar className="size-6 mx-auto opacity-40 mb-1" />
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">No approved events found</p>
                          <p className="text-[11px]">
                            {eventSearchQuery
                              ? `No events matched "${eventSearchQuery}". Try another keyword.`
                              : "No approved events currently available to link."}
                          </p>
                        </div>
                      ) : (
                        eventsList.map((item) => {
                          const isItemChosen = selectedEvent?.id === item.id
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => {
                                setSelectedEvent(item)
                                setIsChangingEvent(false)
                              }}
                              className={cn(
                                "w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 group",
                                isItemChosen
                                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 ring-1 ring-emerald-500"
                                  : "border-slate-200 dark:border-border bg-white dark:bg-card hover:border-primary/50 hover:bg-primary/5 dark:hover:bg-primary/10 shadow-2xs"
                              )}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                {item.media_url ? (
                                  <img
                                    src={item.media_url}
                                    alt={item.title}
                                    className="size-11 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                                  />
                                ) : (
                                  <div className="size-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                    <Calendar className="size-5" />
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-extrabold text-xs text-slate-900 dark:text-foreground truncate group-hover:text-primary transition-colors">
                                      {item.title}
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded">
                                      #{item.id}
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500 dark:text-muted-foreground mt-0.5">
                                    {item.organizer_name && (
                                      <span className="truncate max-w-[150px]">
                                        {item.organizer_name}
                                      </span>
                                    )}
                                    {item.venue && (
                                      <>
                                        <span>•</span>
                                        <span className="truncate max-w-[150px]">
                                          {item.venue}
                                        </span>
                                      </>
                                    )}
                                    {item.start_date && (
                                      <>
                                        <span>•</span>
                                        <span className="text-purple-600 dark:text-purple-400 font-medium">
                                          {formatEventDates(item.start_date, item.end_date)}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="shrink-0 flex items-center gap-2">
                                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full capitalize hidden sm:inline">
                                  {item.verification_status || "Approved"}
                                </span>
                                <div className="size-7 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-primary group-hover:text-white flex items-center justify-center transition-colors">
                                  <ChevronRight className="size-4" />
                                </div>
                              </div>
                            </button>
                          )
                        })
                      )}
                    </div>

                    {selectedEvent && isChangingEvent && (
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setIsChangingEvent(false)}
                          className="text-xs h-7 font-bold cursor-pointer"
                        >
                          Cancel (Keep {selectedEvent.title})
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Content & Caption Textarea */}
            <div className="rounded-2xl border border-slate-200 dark:border-border bg-white dark:bg-card p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-border pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold">
                    {postType === "event" ? 3 : 2}
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-foreground text-base">
                    Post Caption / Description *
                  </h3>
                </div>
                <span className="text-xs font-medium text-slate-500 dark:text-muted-foreground">
                  {description.length} characters
                </span>
              </div>

              <div>
                <textarea
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What's happening in Just Learning? Share exciting educational updates, milestone celebrations, contest announcements, or cultural insights..."
                  className="w-full rounded-xl border border-slate-300 dark:border-border bg-white dark:bg-slate-900/60 p-3.5 text-sm text-slate-900 dark:text-foreground placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 leading-relaxed shadow-2xs"
                />
              </div>

              {/* Quick Hashtag Chips */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-muted-foreground">
                  <Hash className="size-3 text-primary" />
                  <span>Quick Hashtags (Click to Add)</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_HASHTAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => appendHashtag(tag)}
                      className="rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-purple-100 dark:hover:bg-purple-950/60 text-slate-700 dark:text-slate-300 hover:text-purple-900 dark:hover:text-purple-200 px-2.5 py-1 text-xs font-bold transition-colors cursor-pointer border border-slate-200/60 dark:border-slate-700 shadow-2xs"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Media Upload (Images & Videos) */}
            <div className="rounded-2xl border border-slate-200 dark:border-border bg-white dark:bg-card p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-border pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold">
                    {postType === "event" ? 4 : 3}
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-foreground text-base">
                    Media Attachments (Optional)
                  </h3>
                </div>
                <span className="text-xs text-slate-500 dark:text-muted-foreground font-medium">
                  {mediaList.length} files attached
                </span>
              </div>

              {/* Drag and Drop Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault()
                  setIsDragOver(true)
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setIsDragOver(false)
                  handleFiles(e.dataTransfer.files)
                }}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors",
                  isDragOver
                    ? "border-primary bg-primary/5 dark:bg-primary/10"
                    : "border-slate-300 dark:border-border hover:border-primary hover:bg-slate-50/50 dark:hover:bg-slate-800/40 bg-slate-50/30 dark:bg-slate-900/30"
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={(e) => handleFiles(e.target.files)}
                  className="hidden"
                />

                <div className="size-11 rounded-full bg-purple-100 dark:bg-purple-950/60 text-primary flex items-center justify-center mb-2 shadow-2xs">
                  <UploadCloud className="size-6" />
                </div>
                <p className="text-sm font-bold text-slate-900 dark:text-foreground">
                  Click to upload or drag & drop media
                </p>
                <p className="text-xs text-slate-500 dark:text-muted-foreground mt-0.5">
                  Supports multiple Images (JPG, PNG, WebP) & Videos (MP4, WebM) up to 50MB
                </p>
              </div>

              {/* Uploaded Files Previews Grid */}
              {mediaList.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                  {mediaList.map((item, idx) => (
                    <div
                      key={item.id}
                      className="group relative rounded-xl border border-slate-200 dark:border-border bg-slate-50 dark:bg-slate-900 overflow-hidden shadow-2xs"
                    >
                      <div className="h-28 w-full bg-slate-900 flex items-center justify-center overflow-hidden">
                        {item.isVideo ? (
                          <div className="relative w-full h-full flex items-center justify-center bg-slate-950">
                            <video
                              src={item.previewUrl}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <Video className="size-7 text-white" />
                            </div>
                          </div>
                        ) : (
                          <img
                            src={item.previewUrl}
                            alt="Upload preview"
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeMedia(item.id)
                        }}
                        className="absolute top-1.5 right-1.5 size-6 rounded-full bg-black/70 hover:bg-rose-600 text-white flex items-center justify-center transition-colors cursor-pointer"
                        title="Remove file"
                      >
                        <X className="size-3.5" />
                      </button>

                      {/* File Details */}
                      <div className="p-2 bg-white dark:bg-slate-800">
                        <div className="flex items-center gap-1 text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">
                          {item.isVideo ? (
                            <Video className="size-3 text-purple-600 dark:text-purple-400 shrink-0" />
                          ) : (
                            <ImageIcon className="size-3 text-amber-600 dark:text-amber-400 shrink-0" />
                          )}
                          <span className="truncate">{item.file.name}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {(item.file.size / (1024 * 1024)).toFixed(1)} MB • #{idx + 1}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Topics & Interests Multi-Selector */}
            <div className="rounded-2xl border border-slate-200 dark:border-border bg-white dark:bg-card p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-border pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold">
                    {postType === "event" ? 5 : 4}
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-foreground text-base">
                    Select Topic Interests
                  </h3>
                </div>
                <span className="text-xs text-slate-500 dark:text-muted-foreground font-medium">
                  {selectedInterests.length} selected
                </span>
              </div>

              <p className="text-xs text-slate-500 dark:text-muted-foreground">
                Tagging interests ensures your post appears in targeted student discovery feeds:
              </p>

              <div className="flex flex-wrap gap-2">
                {TOPIC_INTERESTS.map((interest) => {
                  const isChecked = selectedInterests.includes(interest.id)
                  return (
                    <button
                      key={interest.id}
                      type="button"
                      onClick={() => toggleInterest(interest.id)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer border",
                        isChecked
                          ? "bg-purple-600 text-white border-purple-600 shadow-xs ring-2 ring-purple-600/20"
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

            {/* Primary Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-card border border-slate-200 dark:border-border shadow-xs">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={isUploading}
                className="w-full sm:w-auto font-bold border-slate-300 dark:border-border text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Clear Draft
              </Button>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Button
                  type="submit"
                  disabled={isUploading || !description.trim() || (postType === "event" && !selectedEvent)}
                  className="w-full sm:w-auto h-11 px-6 font-bold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md shadow-indigo-500/20 gap-2 cursor-pointer"
                >
                  {isUploading ? (
                    <>
                      <RefreshCw className="size-4 animate-spin" />
                      Publishing to Feed...
                    </>
                  ) : (
                    <>
                      <Send className="size-4" />
                      Publish as Just Learning
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>

        {/* Right Column: Live Feed Simulation & Recent Session Posts (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Live Mobile Feed Card Simulation */}
          <div className="rounded-2xl border border-slate-200 dark:border-border bg-white dark:bg-card p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-purple-600 dark:text-purple-400" />
                <h4 className="font-bold text-slate-900 dark:text-foreground text-sm">
                  Live Mobile Feed Preview
                </h4>
              </div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-muted-foreground uppercase tracking-wider">
                Student App View
              </span>
            </div>

            {/* Simulated Feed Post Card */}
            <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-md overflow-hidden text-slate-900 dark:text-foreground">
              {/* Post Author Header */}
              <div className="p-3.5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  {/* Brand Avatar */}
                  <div className="size-9 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs ring-2 ring-purple-100 dark:ring-purple-900 shadow-2xs">
                    JL
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 leading-tight">
                      <span className="text-xs font-black text-slate-900 dark:text-white">
                        Just Learning
                      </span>
                      <CheckCircle2 className="size-3 text-blue-600 dark:text-blue-400 fill-blue-600 dark:fill-blue-400 text-white" />
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                      <span>@justlearning</span>
                      <span>•</span>
                      <span className="capitalize font-medium text-purple-700 dark:text-purple-300">
                        {postType.replace(/_/g, " ")}
                      </span>
                      <span>•</span>
                      <span>Just now</span>
                    </div>
                  </div>
                </div>

                <span className="rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 px-2 py-0.5 text-[10px] font-bold">
                  Official
                </span>
              </div>

              {/* Caption */}
              <div className="p-3.5 space-y-2">
                <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {description || "Your post description will appear here in real-time as you type..."}
                </p>

                {/* Tagged Interests Pills */}
                {selectedInterests.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {selectedInterests.map((id) => {
                      const match = TOPIC_INTERESTS.find((t) => t.id === id)
                      if (!match) return null
                      return (
                        <span
                          key={id}
                          className="rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 text-[10px] font-bold"
                        >
                          {match.icon} {match.label}
                        </span>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Event Attachment Card (Simulated In-Feed Mobile Attachment) */}
              {postType === "event" && (
                <div className="px-3.5 pb-2">
                  {selectedEvent ? (
                    <div className="rounded-xl border border-purple-200 dark:border-purple-800/80 bg-gradient-to-br from-purple-50/70 via-indigo-50/40 to-purple-50/70 dark:from-purple-950/40 dark:to-indigo-950/30 p-3 shadow-xs space-y-2">
                      <div className="flex items-start gap-3">
                        {selectedEvent.media_url ? (
                          <img
                            src={selectedEvent.media_url}
                            alt={selectedEvent.title}
                            className="size-16 rounded-lg object-cover border border-purple-200 dark:border-purple-800 shrink-0"
                          />
                        ) : (
                          <div className="size-16 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
                            <Calendar className="size-7" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-black uppercase tracking-wider bg-purple-600 text-white px-1.5 py-0.5 rounded">
                              Event
                            </span>
                            <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 truncate">
                              {selectedEvent.organizer_name || "Just Learning Arena"}
                            </span>
                          </div>
                          <h5 className="font-extrabold text-xs text-slate-900 dark:text-white leading-tight line-clamp-2">
                            {selectedEvent.title}
                          </h5>
                          <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-600 dark:text-slate-400">
                            {selectedEvent.start_date && (
                              <span className="flex items-center gap-1 font-medium text-purple-700 dark:text-purple-300">
                                <Calendar className="size-3 text-purple-600" />
                                {formatEventDates(selectedEvent.start_date, selectedEvent.end_date)}
                              </span>
                            )}
                            {selectedEvent.venue && (
                              <span className="flex items-center gap-1 truncate max-w-[140px]">
                                <MapPin className="size-3 text-rose-500 shrink-0" />
                                {selectedEvent.venue}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-purple-200/60 dark:border-purple-900/50">
                        <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                          Arena Event #{selectedEvent.id}
                        </span>
                        <span className="text-[10px] font-extrabold text-primary bg-white dark:bg-slate-900 px-2 py-0.5 rounded-full border border-purple-200 dark:border-purple-800 shadow-2xs flex items-center gap-1">
                          View & Register →
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-purple-300 dark:border-purple-800/80 p-4 text-center bg-purple-50/30 dark:bg-purple-950/20 space-y-1">
                      <Calendar className="size-5 text-purple-500 mx-auto opacity-70" />
                      <p className="text-xs font-bold text-purple-900 dark:text-purple-200">
                        No Event Linked Yet
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        Select an approved event on the left to preview the interactive event card here
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Media Preview Container */}
              {mediaList.length > 0 && (
                <div className="relative w-full bg-slate-900">
                  {mediaList[0].isVideo ? (
                    <video
                      src={mediaList[0].previewUrl}
                      controls
                      className="w-full max-h-64 object-cover"
                    />
                  ) : (
                    <img
                      src={mediaList[0].previewUrl}
                      alt="Primary media"
                      className="w-full max-h-64 object-cover"
                    />
                  )}

                  {mediaList.length > 1 && (
                    <div className="absolute bottom-2 right-2 rounded-full bg-black/70 backdrop-blur-xs px-2 py-0.5 text-[10px] font-bold text-white">
                      + {mediaList.length - 1} more media
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons Simulation */}
              <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 text-xs hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer">
                    <Heart className="size-4" />
                    <span>0</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">
                    <MessageCircle className="size-4" />
                    <span>0</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs hover:text-purple-600 dark:hover:text-purple-400 transition-colors cursor-pointer">
                    <Share2 className="size-4" />
                  </div>
                </div>

                <Bookmark className="size-4 hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer" />
              </div>
            </div>
          </div>

          {/* Recently Published In This Session */}
          <div className="rounded-2xl border border-slate-200 dark:border-border bg-white dark:bg-card p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 dark:text-foreground text-sm">
                Published In This Session
              </h4>
              <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs font-bold text-slate-600 dark:text-slate-300">
                {recentPosts.length}
              </span>
            </div>

            {recentPosts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 dark:border-border p-6 text-center text-slate-500 dark:text-muted-foreground">
                <AlertCircle className="size-6 mx-auto mb-1 opacity-40" />
                <p className="text-xs font-medium">No posts published yet in this session.</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                  Created posts will appear here with post ID and details.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-80 overflow-y-auto">
                {recentPosts.map((post) => (
                  <div
                    key={post.id}
                    className="p-3 rounded-xl border border-slate-200 dark:border-border bg-slate-50 dark:bg-slate-900/60 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-foreground">
                        Post #{post.id}
                      </span>
                      <span className="rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800">
                        Live
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2">
                      {post.description}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-muted-foreground pt-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="capitalize font-medium text-purple-700 dark:text-purple-300">
                          {post.post_type.replace(/_/g, " ")}
                        </span>
                        {post.event && (
                          <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded font-bold border border-emerald-200 dark:border-emerald-800">
                            <Calendar className="size-2.5" />
                            {typeof post.event === "object" ? post.event.title : `Event #${post.event}`}
                          </span>
                        )}
                      </div>
                      <span>
                        {post.created_at
                          ? new Date(post.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                          : "Just now"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
