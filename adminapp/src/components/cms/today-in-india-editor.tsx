import { useState, useEffect } from "react"
import {
  ArrowLeft,
  Calendar,
  Sparkles,
  Image as ImageIcon,
  Plus,
  Trash2,
  Tag,
  Save,
  Clock,
  History,
  Users,
  Utensils,
  Palette,
  Leaf,
  Languages,
  Landmark,
  Eye,
  CheckCircle2,
  Wand2,
  MapPin,
  ExternalLink,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { cn } from "@/lib/utils"
import {
  type CreateTodayInIndiaPayload,
  type TodayInIndiaCategory,
  type TodayInIndiaCategoryOption,
  type TodayInIndiaItem,
  getTodayInIndiaCategories,
  createTodayInIndia,
  putTodayInIndia,
  deleteTodayInIndia,
} from "@/lib/api"
import { ALL_INDIAN_STATES } from "./state-content-editor"
import { TodayInIndiaPreviewModal } from "./today-in-india-preview-modal"

interface TodayInIndiaEditorProps {
  initialData?: TodayInIndiaItem | null
  initialDate?: string
  onBack: () => void
  onSaved: () => void
}

const DEFAULT_CATEGORIES: TodayInIndiaCategoryOption[] = [
  { key: "festive_story", label: "Festive Story", description: "Festivals, sacred traditions & holy rituals" },
  { key: "history", label: "History", description: "Historical battles, eras, monuments & dynasties" },
  { key: "people", label: "About Someone or People", description: "Inspirational personalities, leaders & folk heroes" },
  { key: "food", label: "Food", description: "Cuisine, heritage recipes & indigenous flavours" },
  { key: "art_and_craft", label: "Art and Craft", description: "Handicrafts, textiles, folklore arts & music" },
  { key: "science_and_nature", label: "Science and Nature", description: "Ancient inventions, ecology, fauna & flora" },
  { key: "language", label: "Language", description: "Scripts, idioms, literature & linguistic heritage" },
  { key: "place", label: "Place", description: "Sacred towns, natural wonders & architectural marvels" },
]

const CATEGORY_ICONS: Record<TodayInIndiaCategory, typeof Sparkles> = {
  festive_story: Sparkles,
  history: History,
  people: Users,
  food: Utensils,
  art_and_craft: Palette,
  science_and_nature: Leaf,
  language: Languages,
  place: Landmark,
}

// Sample story matching API specs for 1-click pre-fill
const SAMPLE_DEV_DEEPAWALI_STORY: CreateTodayInIndiaPayload = {
  main_tag: "Today in India",
  category: "festive_story",
  scheduled_date: new Date().toISOString().split("T")[0],
  title: "Grand Dev Deepawali Across Varanasi Ghats",
  subtitle: "The Festival of Lights illuminates the Holy River",
  hero_image_url:
    "https://images.unsplash.com/photo-1567591414240-e144a1bb37e7?auto=format&fit=crop&w=1200&q=80",
  state: "Uttar Pradesh",
  description:
    "Millions of earthen lamps float on the Ganga as Dev Deepawali commences across all 84 ghats, celebrating the victory of Lord Shiva over the demon Tripurasura.",
  status: "scheduled",
  tags: [
    {
      title: "Dev Deepawali",
      subtitle: "Festival of the Gods",
      order: 1,
    },
    {
      title: "Ganga Aarti",
      subtitle: "Sacred light ritual",
      order: 2,
    },
  ],
  festive_gallery: [
    {
      image_url:
        "https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=800&q=80",
      title: "Dashashwamedh Ghat",
      subtitle: "Ghats lit simultaneously",
      order: 1,
    },
    {
      image_url:
        "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80",
      title: "Evening Aarti Spectacle",
      subtitle: "Devotees gather along river banks",
      order: 2,
    },
  ],
  fact_image_url:
    "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80",
  fact_title: "Over 1 Million Lamps",
  fact_description:
    "Varanasi illuminates over one million clay lamps across 84 ghats in a single evening, attracting pilgrims and spectators from all corners of the globe.",
}

export function TodayInIndiaEditor({
  initialData,
  initialDate,
  onBack,
  onSaved,
}: TodayInIndiaEditorProps) {
  const { toast } = useToast()

  const [categories, setCategories] = useState<TodayInIndiaCategoryOption[]>(DEFAULT_CATEGORIES)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)

  // Form states
  const [mainTag, setMainTag] = useState(initialData?.main_tag || "Today in India")
  const [category, setCategory] = useState<TodayInIndiaCategory>(
    initialData?.category || "festive_story"
  )
  const [scheduledDate, setScheduledDate] = useState(
    initialData?.scheduled_date || initialDate || new Date().toISOString().split("T")[0]
  )
  const [title, setTitle] = useState(initialData?.title || "")
  const [subtitle, setSubtitle] = useState(initialData?.subtitle || "")
  const [heroImageUrl, setHeroImageUrl] = useState(initialData?.hero_image_url || "")
  const [state, setState] = useState(initialData?.state || "Pan-India")
  const [description, setDescription] = useState(initialData?.description || "")
  const [status, setStatus] = useState<"draft" | "scheduled" | "published">(
    initialData?.status || "scheduled"
  )

  // Repeaters
  const [tags, setTags] = useState<Array<{ title: string; subtitle: string; order?: number }>>(
    initialData?.tags && initialData.tags.length > 0
      ? initialData.tags
      : [
          { title: "Dev Deepawali", subtitle: "Festival of the Gods", order: 1 },
        ]
  )

  const [festiveGallery, setFestiveGallery] = useState<
    Array<{ image_url: string; title: string; subtitle?: string; order?: number }>
  >(
    initialData?.festive_gallery && initialData.festive_gallery.length > 0
      ? initialData.festive_gallery
      : []
  )

  // Fact section
  const [factImageUrl, setFactImageUrl] = useState(initialData?.fact_image_url || "")
  const [factTitle, setFactTitle] = useState(initialData?.fact_title || "")
  const [factDescription, setFactDescription] = useState(initialData?.fact_description || "")

  // Fetch categories from API
  useEffect(() => {
    getTodayInIndiaCategories()
      .then((cats) => {
        if (cats && cats.length > 0) {
          setCategories(cats)
        }
      })
      .catch(() => {
        // Fallback to default categories
      })
  }, [])

  // Auto-fill template
  const handleApplySample = () => {
    setMainTag(SAMPLE_DEV_DEEPAWALI_STORY.main_tag)
    setCategory(SAMPLE_DEV_DEEPAWALI_STORY.category)
    setScheduledDate(initialDate || new Date().toISOString().split("T")[0])
    setTitle(SAMPLE_DEV_DEEPAWALI_STORY.title)
    setSubtitle(SAMPLE_DEV_DEEPAWALI_STORY.subtitle || "")
    setHeroImageUrl(SAMPLE_DEV_DEEPAWALI_STORY.hero_image_url)
    setState(SAMPLE_DEV_DEEPAWALI_STORY.state || "Uttar Pradesh")
    setDescription(SAMPLE_DEV_DEEPAWALI_STORY.description)
    setStatus(SAMPLE_DEV_DEEPAWALI_STORY.status)
    setTags(SAMPLE_DEV_DEEPAWALI_STORY.tags)
    setFestiveGallery(SAMPLE_DEV_DEEPAWALI_STORY.festive_gallery)
    setFactImageUrl(SAMPLE_DEV_DEEPAWALI_STORY.fact_image_url || "")
    setFactTitle(SAMPLE_DEV_DEEPAWALI_STORY.fact_title || "")
    setFactDescription(SAMPLE_DEV_DEEPAWALI_STORY.fact_description || "")
    toast("Populated sample Dev Deepawali story!", "success")
  }

  // Tags repeater handlers
  const handleAddTag = () => {
    setTags([...tags, { title: "", subtitle: "", order: tags.length + 1 }])
  }

  const handleUpdateTag = (index: number, field: "title" | "subtitle", val: string) => {
    const updated = [...tags]
    updated[index] = { ...updated[index], [field]: val }
    setTags(updated)
  }

  const handleRemoveTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index))
  }

  // Festive gallery handlers
  const handleAddGalleryItem = () => {
    setFestiveGallery([
      ...festiveGallery,
      { image_url: "", title: "", subtitle: "", order: festiveGallery.length + 1 },
    ])
  }

  const handleUpdateGallery = (
    index: number,
    field: "image_url" | "title" | "subtitle",
    val: string
  ) => {
    const updated = [...festiveGallery]
    updated[index] = { ...updated[index], [field]: val }
    setFestiveGallery(updated)
  }

  const handleRemoveGallery = (index: number) => {
    setFestiveGallery(festiveGallery.filter((_, i) => i !== index))
  }

  // Current payload representation for preview & save
  const currentPayload: CreateTodayInIndiaPayload = {
    main_tag: mainTag,
    category,
    scheduled_date: scheduledDate,
    title,
    subtitle: subtitle || undefined,
    hero_image_url: heroImageUrl,
    state: state === "Pan-India" ? undefined : state,
    description,
    status,
    tags: tags
      .filter((t) => t.title.trim())
      .map((t, idx) => ({
        title: t.title.trim(),
        subtitle: t.subtitle.trim(),
        order: idx + 1,
      })),
    festive_gallery: festiveGallery
      .filter((g) => g.image_url.trim())
      .map((g, idx) => ({
        image_url: g.image_url.trim(),
        title: g.title.trim() || `Gallery Image ${idx + 1}`,
        subtitle: g.subtitle?.trim() || undefined,
        order: idx + 1,
      })),
    fact_image_url: factImageUrl.trim() || undefined,
    fact_title: factTitle.trim() || undefined,
    fact_description: factDescription.trim() || undefined,
  }

  // Save handler
  const handleSave = async (targetStatus?: "draft" | "scheduled") => {
    if (!title.trim()) {
      toast("Please provide a story title.", "error")
      return
    }
    if (!heroImageUrl.trim()) {
      toast("Please provide a hero image URL.", "error")
      return
    }
    if (!description.trim()) {
      toast("Please write a story description.", "error")
      return
    }
    if (!scheduledDate) {
      toast("Please select a scheduled date.", "error")
      return
    }

    const payloadToSave: CreateTodayInIndiaPayload = {
      ...currentPayload,
      status: targetStatus || status,
    }

    setIsSubmitting(true)
    try {
      if (initialData?.id) {
        await putTodayInIndia(initialData.id, payloadToSave)
        toast("Story updated successfully!", "success")
      } else {
        await createTodayInIndia(payloadToSave)
        toast(
          targetStatus === "draft"
            ? "Story saved as Draft!"
            : "Story scheduled successfully for " + scheduledDate,
          "success"
        )
      }
      onSaved()
    } catch (err: any) {
      toast(err.message || "Failed to save story. Please check inputs.", "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!initialData?.id) return
    if (!confirm(`Are you sure you want to delete "${initialData.title}"?`)) return

    setIsDeleting(true)
    try {
      await deleteTodayInIndia(initialData.id)
      toast("Story deleted successfully.", "success")
      onSaved()
    } catch (err: any) {
      toast(err.message || "Failed to delete story.", "error")
    } finally {
      setIsDeleting(false)
    }
  }

  const isFormValid = Boolean(
    title.trim() && heroImageUrl.trim() && description.trim() && scheduledDate
  )

  return (
    <div className="space-y-6 pb-20 animate-in fade-in-50 duration-200">
      {/* Sticky Top Header Bar */}
      <div className="sticky top-0 z-30 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/95 backdrop-blur-md p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            className="h-9 gap-1.5 font-bold border-slate-300 bg-white text-slate-800 hover:bg-slate-100 hover:text-slate-950 shadow-2xs cursor-pointer"
          >
            <ArrowLeft className="size-4 text-slate-700" />
            Back to Calendar
          </Button>

          <div className="h-5 w-px bg-slate-200 hidden sm:block" />

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300/80 px-2.5 py-1 text-xs font-bold shadow-2xs">
              <Sparkles className="size-3.5 text-amber-600" />
              Today in India
            </span>

            <span className="text-sm font-black text-slate-900">
              {initialData ? `Edit: ${initialData.title}` : "New Scheduled Story"}
            </span>

            <span className="rounded-md bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 text-xs font-bold">
              {scheduledDate}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {!initialData && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleApplySample}
              className="h-9 gap-1.5 text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300 cursor-pointer shadow-2xs"
              title="Autofill form with Varanasi Dev Deepawali sample data"
            >
              <Wand2 className="size-3.5 text-amber-600" />
              Sample Story
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreviewOpen(true)}
            className="h-9 gap-1.5 text-xs font-bold border-slate-300 bg-white text-slate-800 hover:bg-slate-50 cursor-pointer shadow-2xs"
          >
            <Eye className="size-3.5 text-primary" />
            Mobile Preview
          </Button>

          {initialData?.id && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting || isSubmitting}
              className="h-9 gap-1.5 text-xs font-bold text-rose-600 border-rose-300 bg-rose-50/50 hover:bg-rose-100 cursor-pointer"
            >
              <Trash2 className="size-3.5" />
              Delete
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSave("draft")}
            disabled={isSubmitting || isDeleting}
            className="h-9 gap-1.5 text-xs font-bold border-slate-300 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer shadow-2xs"
          >
            <Clock className="size-3.5 text-slate-500" />
            Save Draft
          </Button>

          <Button
            size="sm"
            onClick={() => handleSave("scheduled")}
            disabled={isSubmitting || isDeleting}
            className="h-9 gap-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-sm shadow-amber-500/20 cursor-pointer"
          >
            <Save className="size-3.5" />
            {initialData ? "Update & Schedule" : "Schedule Content"}
          </Button>
        </div>
      </div>

      {/* Main 2-Column Editor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Editor (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card 1: Scheduling, Category & Regional Setting */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-amber-100/70 border border-amber-200 text-amber-700 flex items-center justify-center">
                  <Calendar className="size-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">
                  1. Schedule & Category Classification
                </h3>
              </div>
              <span className="text-xs font-medium text-slate-500 hidden sm:inline">
                Determines when & where story appears
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Scheduled Date *
                </label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  State / Territorial Focus
                </label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 shadow-2xs"
                >
                  <option value="Pan-India">Pan-India (National Heritage)</option>
                  <optgroup label="States">
                    {ALL_INDIAN_STATES.filter((s) => s.code.length === 2 && !["AN","CH","DH","DL","JK","LA","LD","PY"].includes(s.code)).map((s) => (
                      <option key={s.code} value={s.name}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Union Territories">
                    {ALL_INDIAN_STATES.filter((s) => ["AN","CH","DH","DL","JK","LA","LD","PY"].includes(s.code)).map((s) => (
                      <option key={s.code} value={s.name}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
            </div>

            {/* 8 Categories Visual Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Story Category (Choose 1 of 8) *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {categories.map((cat) => {
                  const Icon = CATEGORY_ICONS[cat.key] || Sparkles
                  const isSelected = category === cat.key
                  return (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => setCategory(cat.key)}
                      className={cn(
                        "group flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer",
                        isSelected
                          ? "border-amber-500 bg-amber-50/80 text-amber-950 ring-2 ring-amber-500/30 shadow-xs"
                          : "border-slate-200 bg-white hover:bg-amber-50/30 hover:border-amber-300 text-slate-800 shadow-2xs"
                      )}
                    >
                      <div className="flex items-center justify-between w-full mb-1.5">
                        <div
                          className={cn(
                            "size-7 rounded-lg flex items-center justify-center transition-colors",
                            isSelected
                              ? "bg-amber-500 text-white shadow-xs"
                              : "bg-slate-100 text-slate-600 group-hover:bg-amber-100 group-hover:text-amber-800"
                          )}
                        >
                          <Icon className="size-3.5" />
                        </div>
                        {isSelected && (
                          <span className="size-2 rounded-full bg-amber-500" />
                        )}
                      </div>
                      <span className={cn("text-xs font-bold leading-tight", isSelected ? "text-amber-950" : "text-slate-900")}>
                        {cat.label}
                      </span>
                      <span className={cn("text-[10px] mt-1 line-clamp-1", isSelected ? "text-amber-800 font-medium" : "text-slate-500")}>
                        {cat.description || cat.key}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Card 2: Hero & Narrative Core */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-amber-100/70 border border-amber-200 text-amber-700 flex items-center justify-center">
                  <Sparkles className="size-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">
                  2. Hero Content & Narrative Story
                </h3>
              </div>
              <span className="text-xs font-medium text-slate-500 hidden sm:inline">
                Primary card displayed on the mobile feed
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Story Title *
                  </label>
                  <span className="text-[11px] font-medium text-slate-500">
                    {title.length} characters
                  </span>
                </div>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Grand Dev Deepawali Across Varanasi Ghats"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Subtitle (Optional)
                </label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="e.g. The Festival of Lights illuminates the Holy River"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Hero Image URL *
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="url"
                      value={heroImageUrl}
                      onChange={(e) => setHeroImageUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/photo-..."
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 shadow-2xs"
                    />
                  </div>
                  {heroImageUrl && (
                    <a
                      href={heroImageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-xl border border-slate-300 bg-slate-50 px-3 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 shadow-2xs"
                    >
                      <ExternalLink className="size-3" />
                      View
                    </a>
                  )}
                </div>

                {heroImageUrl && (
                  <div className="mt-2.5 relative h-52 w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-inner">
                    <img
                      src={heroImageUrl}
                      alt="Hero preview"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        ;(e.target as HTMLElement).style.display = "none"
                      }}
                    />
                    <div className="absolute bottom-2 right-2 rounded-md bg-black/60 backdrop-blur-xs px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
                      Live Hero Preview
                    </div>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Story Narrative / Description *
                  </label>
                  <span className="text-[11px] font-medium text-slate-500">
                    {description.split(/\s+/).filter(Boolean).length} words
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detail the significance, ritual, cultural background or historical event occurring on this day..."
                  className="w-full rounded-xl border border-slate-300 bg-white p-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 leading-relaxed shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* Card 3: Dynamic Tags Repeater */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-amber-100/70 border border-amber-200 text-amber-700 flex items-center justify-center">
                  <Tag className="size-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">
                  3. Key Highlights & Tags Repeater
                </h3>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddTag}
                className="h-8 gap-1 text-xs font-bold border-slate-300 bg-white text-slate-800 hover:bg-slate-50 cursor-pointer shadow-2xs"
              >
                <Plus className="size-3.5" />
                Add Tag
              </Button>
            </div>

            {tags.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center">
                No tags added. Click "Add Tag" to highlight specific traditions or themes.
              </p>
            ) : (
              <div className="space-y-3">
                {tags.map((tagItem, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/70"
                  >
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-700">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={tagItem.title}
                      onChange={(e) => handleUpdateTag(idx, "title", e.target.value)}
                      placeholder="Tag Title (e.g. Ganga Aarti)"
                      className="w-full sm:w-1/2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                    />
                    <input
                      type="text"
                      value={tagItem.subtitle}
                      onChange={(e) => handleUpdateTag(idx, "subtitle", e.target.value)}
                      placeholder="Tag Subtitle (e.g. Sacred light ritual)"
                      className="w-full sm:w-1/2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveTag(idx)}
                      className="size-8 p-0 text-slate-400 hover:text-rose-600 shrink-0 cursor-pointer"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card 4: Festive Gallery Repeater */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-amber-100/70 border border-amber-200 text-amber-700 flex items-center justify-center">
                  <ImageIcon className="size-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">
                  4. Festive Gallery Images Repeater
                </h3>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddGalleryItem}
                className="h-8 gap-1 text-xs font-bold border-slate-300 bg-white text-slate-800 hover:bg-slate-50 cursor-pointer shadow-2xs"
              >
                <Plus className="size-3.5" />
                Add Image
              </Button>
            </div>

            {festiveGallery.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">
                No gallery images added yet. Click "Add Image" to include multi-photo coverage.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {festiveGallery.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col gap-2 p-3 rounded-xl border border-slate-200 bg-slate-50/70"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">
                        Image #{idx + 1}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveGallery(idx)}
                        className="size-7 p-0 text-slate-400 hover:text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>

                    <input
                      type="url"
                      value={item.image_url}
                      onChange={(e) => handleUpdateGallery(idx, "image_url", e.target.value)}
                      placeholder="Image URL (https://...)"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                    />

                    {item.image_url && (
                      <div className="h-28 w-full rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                        <img
                          src={item.image_url}
                          alt={item.title || "Gallery"}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            ;(e.target as HTMLElement).style.display = "none"
                          }}
                        />
                      </div>
                    )}

                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => handleUpdateGallery(idx, "title", e.target.value)}
                      placeholder="Image Caption / Title"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                    />

                    <input
                      type="text"
                      value={item.subtitle || ""}
                      onChange={(e) => handleUpdateGallery(idx, "subtitle", e.target.value)}
                      placeholder="Optional Subtitle"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-600 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card 5: Fact / "Did You Know?" Section */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-amber-100/70 border border-amber-200 text-amber-700 flex items-center justify-center">
                  <Sparkles className="size-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">
                  5. "Did You Know?" Fact Section (Optional)
                </h3>
              </div>
              <span className="text-xs font-medium text-slate-500 hidden sm:inline">
                Fascinating trivia for mobile readers
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Fact Headline / Title
                  </label>
                  <input
                    type="text"
                    value={factTitle}
                    onChange={(e) => setFactTitle(e.target.value)}
                    placeholder="e.g. Over 1 Million Lamps"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Fact Image URL
                  </label>
                  <input
                    type="url"
                    value={factImageUrl}
                    onChange={(e) => setFactImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Fact Details & Story
                </label>
                <textarea
                  rows={4}
                  value={factDescription}
                  onChange={(e) => setFactDescription(e.target.value)}
                  placeholder="e.g. Varanasi illuminates over one million clay lamps across 84 ghats in a single evening..."
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 leading-relaxed shadow-2xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Feed Simulation & Quick Actions (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Status & Schedule Overview Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-600" />
              Publishing & Status
            </h4>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Publishing Status
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(["draft", "scheduled", "published"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStatus(s)}
                      className={cn(
                        "rounded-lg py-1.5 text-xs font-bold capitalize transition-colors border cursor-pointer",
                        status === s
                          ? s === "published"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-400 font-extrabold shadow-2xs"
                            : s === "scheduled"
                            ? "bg-amber-50 text-amber-800 border-amber-400 font-extrabold shadow-2xs"
                            : "bg-slate-100 text-slate-800 border-slate-400 font-extrabold shadow-2xs"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Validation Checklist */}
              <div className="rounded-xl bg-slate-50 border border-slate-200/90 p-3.5 space-y-2 text-xs">
                <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider mb-1">
                  Readiness Checklist
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn("size-2 rounded-full", scheduledDate ? "bg-emerald-500" : "bg-rose-500")} />
                  <span className="font-medium text-slate-700">Date selected ({scheduledDate})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn("size-2 rounded-full", title.trim() ? "bg-emerald-500" : "bg-rose-500")} />
                  <span className="font-medium text-slate-700">Title provided</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn("size-2 rounded-full", heroImageUrl.trim() ? "bg-emerald-500" : "bg-rose-500")} />
                  <span className="font-medium text-slate-700">Hero banner set</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn("size-2 rounded-full", description.trim() ? "bg-emerald-500" : "bg-rose-500")} />
                  <span className="font-medium text-slate-700">Description narrative written</span>
                </div>
              </div>

              <Button
                onClick={() => handleSave(status === "draft" ? "draft" : "scheduled")}
                disabled={isSubmitting || !isFormValid}
                className={cn(
                  "w-full h-10 font-bold text-white shadow-xs transition-colors",
                  isFormValid
                    ? "bg-amber-600 hover:bg-amber-700 cursor-pointer"
                    : "bg-amber-300 text-amber-900/60 cursor-not-allowed"
                )}
              >
                {isSubmitting ? "Saving..." : initialData ? "Update Story" : "Schedule Content"}
              </Button>
            </div>
          </div>

          {/* Live Mobile Card Simulation */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Sparkles className="size-4 text-amber-500" />
                Live Card Feed Preview
              </h4>
              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
              >
                Open Mobile Phone
              </button>
            </div>

            {/* Mobile Card Mock */}
            <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 text-white shadow-md">
              <div className="relative h-44 w-full bg-slate-800">
                {heroImageUrl ? (
                  <img
                    src={heroImageUrl}
                    alt={title || "Preview"}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
                    <ImageIcon className="size-8 opacity-40 mb-1" />
                    <span className="text-[11px]">Enter Hero Image URL</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                  <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[9px] font-black text-slate-950 uppercase tracking-wider">
                    Today in India
                  </span>
                  <span className="rounded-full bg-white/20 backdrop-blur-xs px-2 py-0.5 text-[9px] font-semibold text-white capitalize">
                    {category.replace(/_/g, " ")}
                  </span>
                </div>
                {state && state !== "Pan-India" && (
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1 rounded-full bg-black/50 backdrop-blur-xs px-2 py-0.5 text-[9px] font-medium text-slate-200">
                    <MapPin className="size-2 text-amber-400" />
                    {state}
                  </div>
                )}
                <div className="absolute bottom-2 left-3 right-3">
                  <p className="text-[11px] text-amber-400 font-bold">{scheduledDate}</p>
                  <h5 className="text-sm font-black text-white line-clamp-2 leading-tight">
                    {title || "Untitled Story"}
                  </h5>
                </div>
              </div>

              <div className="p-3 space-y-2 bg-slate-900/90">
                <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                  {description || "Write description on the left..."}
                </p>

                {tags.length > 0 && tags[0].title && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {tags.slice(0, 3).map((t, i) => (
                      <span
                        key={i}
                        className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-300 border border-slate-700"
                      >
                        #{t.title}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreviewOpen(true)}
              className="w-full h-9 font-bold text-xs gap-1.5 border-slate-300 bg-white text-slate-800 hover:bg-slate-50 cursor-pointer shadow-2xs"
            >
              <Eye className="size-3.5 text-primary" />
              Launch Interactive Phone Drawer
            </Button>
          </div>
        </div>
      </div>

      {/* Interactive Mobile Device Drawer */}
      <TodayInIndiaPreviewModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        story={currentPayload}
      />
    </div>
  )
}
