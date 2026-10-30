import { useState, useEffect } from "react"
import {
  X,
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
  AlertCircle,
} from "lucide-react"
import { Dialog } from "@base-ui/react/dialog"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { cn } from "@/lib/utils"
import {
  createTodayInIndia,
  updateTodayInIndia,
  deleteTodayInIndia,
  type TodayInIndiaCategory,
  type TodayInIndiaItem,
  type CreateTodayInIndiaPayload,
} from "@/lib/api"
import { ALL_INDIAN_STATES } from "./state-content-editor"

export interface TodayInIndiaModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialDate?: string
  initialData?: TodayInIndiaItem | null
  onSuccess: () => void
}

const CATEGORY_OPTIONS: Array<{
  value: TodayInIndiaCategory
  label: string
  icon: typeof Sparkles
  badgeClass: string
}> = [
    {
      value: "festive_story",
      label: "Festive Story",
      icon: Sparkles,
      badgeClass: "bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950/70 dark:text-amber-300",
    },
    {
      value: "history",
      label: "History",
      icon: History,
      badgeClass: "bg-orange-100 text-orange-950 border-orange-300 dark:bg-orange-950/70 dark:text-orange-300",
    },
    {
      value: "people",
      label: "About Someone or People",
      icon: Users,
      badgeClass: "bg-blue-100 text-blue-950 border-blue-300 dark:bg-blue-950/70 dark:text-blue-300",
    },
    {
      value: "food",
      label: "Food",
      icon: Utensils,
      badgeClass: "bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-300",
    },
    {
      value: "art_and_craft",
      label: "Art and Craft",
      icon: Palette,
      badgeClass: "bg-purple-100 text-purple-950 border-purple-300 dark:bg-purple-950/70 dark:text-purple-300",
    },
    {
      value: "science_and_nature",
      label: "Science and Nature",
      icon: Leaf,
      badgeClass: "bg-teal-100 text-teal-950 border-teal-300 dark:bg-teal-950/70 dark:text-teal-300",
    },
    {
      value: "language",
      label: "Language",
      icon: Languages,
      badgeClass: "bg-pink-100 text-pink-950 border-pink-300 dark:bg-pink-950/70 dark:text-pink-300",
    },
    {
      value: "place",
      label: "Place",
      icon: Landmark,
      badgeClass: "bg-indigo-100 text-indigo-950 border-indigo-300 dark:bg-indigo-950/70 dark:text-indigo-300",
    },
  ]

export function TodayInIndiaModal({
  open,
  onOpenChange,
  initialDate,
  initialData,
  onSuccess,
}: TodayInIndiaModalProps) {
  const { toast } = useToast()
  const todayStr = new Date().toISOString().split("T")[0]

  // Form State
  const [scheduledDate, setScheduledDate] = useState(initialDate || todayStr)
  const [category, setCategory] = useState<TodayInIndiaCategory>("festive_story")
  const [title, setTitle] = useState("")
  const [subtitle, setSubtitle] = useState("")
  const [heroImageUrl, setHeroImageUrl] = useState("")
  const [stateName, setStateName] = useState("Pan-India / All India")
  const [description, setDescription] = useState("")

  // Dynamic Tags Repeater
  const [tags, setTags] = useState<Array<{ title: string; subtitle: string }>>([
    { title: "", subtitle: "" },
  ])

  // Festive Gallery Repeater
  const [gallery, setGallery] = useState<Array<{ image_url: string; title: string; subtitle: string }>>([])

  // Fact Section
  const [factImageUrl, setFactImageUrl] = useState("")
  const [factTitle, setFactTitle] = useState("")
  const [factDescription, setFactDescription] = useState("")

  // Submission / Loading
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Reset or pre-fill form when modal opens or initialData changes
  useEffect(() => {
    if (open) {
      setErrorMsg(null)
      setDeleteConfirmOpen(false)
      if (initialData) {
        setScheduledDate(initialData.scheduled_date || initialDate || todayStr)
        setCategory(initialData.category || "festive_story")
        setTitle(initialData.title || "")
        setSubtitle(initialData.subtitle || "")
        setHeroImageUrl(initialData.hero_image_url || "")
        setStateName(initialData.state || "Pan-India / All India")
        setDescription(initialData.description || "")
        setTags(
          initialData.tags && initialData.tags.length > 0
            ? initialData.tags.map((t) => ({ title: t.title, subtitle: t.subtitle }))
            : [{ title: "", subtitle: "" }]
        )
        setGallery(
          initialData.festive_gallery && initialData.festive_gallery.length > 0
            ? initialData.festive_gallery.map((g) => ({
              image_url: g.image_url,
              title: g.title,
              subtitle: g.subtitle || "",
            }))
            : []
        )
        setFactImageUrl(initialData.fact_image_url || "")
        setFactTitle(initialData.fact_title || "")
        setFactDescription(initialData.fact_description || "")
      } else {
        setScheduledDate(initialDate || todayStr)
        setCategory("festive_story")
        setTitle("")
        setSubtitle("")
        setHeroImageUrl("")
        setStateName("Pan-India / All India")
        setDescription("")
        setTags([{ title: "", subtitle: "" }])
        setGallery([])
        setFactImageUrl("")
        setFactTitle("")
        setFactDescription("")
      }
    }
  }, [open, initialData, initialDate, todayStr])

  // Tag Handlers
  const handleAddTag = () => {
    setTags([...tags, { title: "", subtitle: "" }])
  }

  const handleUpdateTag = (index: number, field: "title" | "subtitle", value: string) => {
    const updated = [...tags]
    updated[index][field] = value
    setTags(updated)
  }

  const handleRemoveTag = (index: number) => {
    setTags(tags.filter((_, idx) => idx !== index))
  }

  // Gallery Handlers
  const handleAddGalleryItem = () => {
    setGallery([...gallery, { image_url: "", title: "", subtitle: "" }])
  }

  const handleUpdateGallery = (index: number, field: "image_url" | "title" | "subtitle", value: string) => {
    const updated = [...gallery]
    updated[index][field] = value
    setGallery(updated)
  }

  const handleRemoveGallery = (index: number) => {
    setGallery(gallery.filter((_, idx) => idx !== index))
  }

  // Submit Handler
  const handleSubmit = async (targetStatus: "draft" | "scheduled" | "published") => {
    setErrorMsg(null)

    if (!title.trim()) {
      setErrorMsg("Title is required.")
      return
    }
    if (!heroImageUrl.trim()) {
      setErrorMsg("Hero image URL is required.")
      return
    }
    if (!description.trim()) {
      setErrorMsg("Description is required.")
      return
    }
    if (!scheduledDate) {
      setErrorMsg("Scheduled date is required.")
      return
    }

    setIsSubmitting(true)

    // Filter valid tags & gallery items
    const cleanTags = tags
      .filter((t) => t.title.trim().length > 0)
      .map((t, idx) => ({
        title: t.title.trim(),
        subtitle: t.subtitle.trim(),
        order: idx + 1,
      }))

    const cleanGallery = gallery
      .filter((g) => g.image_url.trim().length > 0 && g.title.trim().length > 0)
      .map((g, idx) => ({
        image_url: g.image_url.trim(),
        title: g.title.trim(),
        subtitle: g.subtitle.trim() || undefined,
        order: idx + 1,
      }))

    const payload: CreateTodayInIndiaPayload = {
      main_tag: "Today in India",
      category,
      scheduled_date: scheduledDate,
      title: title.trim(),
      subtitle: subtitle.trim() || undefined,
      hero_image_url: heroImageUrl.trim(),
      state: stateName === "Pan-India / All India" ? "" : stateName,
      description: description.trim(),
      status: targetStatus,
      tags: cleanTags,
      festive_gallery: cleanGallery,
      fact_image_url: factImageUrl.trim() || undefined,
      fact_title: factTitle.trim() || undefined,
      fact_description: factDescription.trim() || undefined,
    }

    try {
      if (initialData?.id) {
        await updateTodayInIndia(initialData.id, payload)
        toast(
          targetStatus === "draft"
            ? "Content draft updated successfully!"
            : targetStatus === "published"
              ? "Content published live successfully!"
              : "Content scheduled successfully!"
        )
      } else {
        await createTodayInIndia(payload)
        toast(
          targetStatus === "draft"
            ? "Saved as draft successfully!"
            : targetStatus === "published"
              ? "Content published live successfully!"
              : "Content scheduled to calendar successfully!"
        )
      }
      onSuccess()
      onOpenChange(false)
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to save content. Please verify all details.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete Handler
  const handleDelete = async () => {
    if (!initialData?.id) return
    setIsDeleting(true)
    try {
      await deleteTodayInIndia(initialData.id)
      toast("Content removed successfully.", "error")
      onSuccess()
      onOpenChange(false)
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to delete content.")
    } finally {
      setIsDeleting(false)
      setDeleteConfirmOpen(false)
    }
  }

  const selectedCategoryMeta =
    CATEGORY_OPTIONS.find((c) => c.value === category) || CATEGORY_OPTIONS[0]
  const CategoryIcon = selectedCategoryMeta.icon

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200" />
        <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <Dialog.Popup className="relative w-full max-w-3xl max-h-[92vh] flex flex-col rounded-2xl border border-slate-200 dark:border-border bg-white dark:bg-card shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-border px-5 py-4 shrink-0 bg-slate-50/70 dark:bg-muted/40">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-500/20">
                  <Calendar className="size-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-orange-100 text-orange-950 dark:bg-orange-950/70 dark:text-orange-200 border border-orange-300 dark:border-orange-700 px-2 py-0.5 text-xs font-black uppercase tracking-wider">
                      🇮🇳 Today in India
                    </span>
                    <span className="text-xs text-muted-foreground font-medium">
                      {initialData?.id ? "Edit Scheduled Content" : "Create & Schedule Content"}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-foreground mt-0.5">
                    {initialData?.id ? `Edit: ${initialData.title}` : "Schedule Cultural Content"}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="grid size-8 place-items-center rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-muted dark:text-slate-400 transition cursor-pointer"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Error Banner */}
            {errorMsg && (
              <div className="mx-6 mt-4 flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/30 dark:border-rose-900/50 dark:text-rose-200 p-3 text-xs">
                <AlertCircle className="size-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              {/* Row 1: Scheduled Date & Category */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-muted-foreground mb-1.5">
                    Scheduled Date <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      required
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="h-10 w-full rounded-lg border border-slate-300 dark:border-border bg-white dark:bg-background px-3 text-sm font-semibold text-slate-900 dark:text-foreground outline-none focus:border-primary shadow-2xs"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Date when this story is highlighted on the learner app.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-muted-foreground mb-1.5">
                    Content Category <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as TodayInIndiaCategory)}
                      className="h-10 w-full rounded-lg border border-slate-300 dark:border-border bg-white dark:bg-background px-3 text-sm font-bold text-slate-900 dark:text-foreground outline-none focus:border-primary shadow-2xs cursor-pointer"
                    >
                      {CATEGORY_OPTIONS.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-[11px]">
                    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border", selectedCategoryMeta.badgeClass)}>
                      <CategoryIcon className="size-3" />
                      {selectedCategoryMeta.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Row 2: Title & Subtitle */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-muted-foreground mb-1.5">
                    Story Title <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Grand Dev Deepawali Across Varanasi Ghats"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-300 dark:border-border bg-white dark:bg-background px-3 text-sm font-bold text-slate-900 dark:text-foreground outline-none focus:border-primary shadow-2xs"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-muted-foreground mb-1.5">
                      Subtitle / Tagline (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. The Festival of Lights illuminates the Holy River"
                      value={subtitle}
                      onChange={(e) => setSubtitle(e.target.value)}
                      className="h-10 w-full rounded-lg border border-slate-300 dark:border-border bg-white dark:bg-background px-3 text-sm text-slate-900 dark:text-foreground outline-none focus:border-primary shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-muted-foreground mb-1.5">
                      Indian State Association
                    </label>
                    <div className="flex items-center gap-1.5">
                      <select
                        value={stateName}
                        onChange={(e) => setStateName(e.target.value)}
                        className="h-10 w-full rounded-lg border border-slate-300 dark:border-border bg-white dark:bg-background px-3 text-sm font-semibold text-slate-900 dark:text-foreground outline-none focus:border-primary shadow-2xs cursor-pointer"
                      >
                        <option value="Pan-India / All India">Pan-India (National / All States)</option>
                        {ALL_INDIAN_STATES.map((st) => (
                          <option key={st.code} value={st.name}>
                            {st.name} ({st.code})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 3: Hero Image URL with Live Thumbnail */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-muted-foreground mb-1.5">
                  Hero Image URL <span className="text-destructive">*</span>
                </label>
                <div className="flex gap-3 items-start">
                  <div className="flex-1">
                    <input
                      type="url"
                      required
                      placeholder="https://images.unsplash.com/..."
                      value={heroImageUrl}
                      onChange={(e) => setHeroImageUrl(e.target.value)}
                      className="h-10 w-full rounded-lg border border-slate-300 dark:border-border bg-white dark:bg-background px-3 text-sm text-slate-900 dark:text-foreground outline-none focus:border-primary shadow-2xs font-mono text-xs"
                    />
                    <p className="text-[11px] text-muted-foreground mt-1">
                      High-resolution landscape image displayed as the main banner.
                    </p>
                  </div>
                  {heroImageUrl ? (
                    <div className="relative size-16 rounded-xl border border-slate-300 dark:border-border overflow-hidden bg-slate-100 dark:bg-muted shrink-0 shadow-xs">
                      <img
                        src={heroImageUrl}
                        alt="Hero preview"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          ; (e.target as HTMLElement).style.display = "none"
                        }}
                      />
                    </div>
                  ) : (
                    <div className="grid size-16 place-items-center rounded-xl border border-dashed border-slate-300 dark:border-border text-slate-400 shrink-0">
                      <ImageIcon className="size-6" />
                    </div>
                  )}
                </div>
              </div>

              {/* Row 4: Narrative Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-muted-foreground mb-1.5">
                  Story Narrative & Detailed Description <span className="text-destructive">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Narrative description explaining the significance of this event, story, or cultural milestone..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-border bg-white dark:bg-background p-3 text-sm text-slate-900 dark:text-foreground outline-none focus:border-primary shadow-2xs leading-relaxed"
                />
              </div>

              {/* Row 5: Dynamic Tags Section */}
              <div className="rounded-xl border border-slate-200 dark:border-border bg-slate-50/50 dark:bg-muted/20 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tag className="size-4 text-primary" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-foreground">
                      Dynamic Highlight Tags ({tags.filter((t) => t.title).length})
                    </h4>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleAddTag}
                    className="h-7 text-xs font-bold gap-1 border-slate-300 dark:border-border"
                  >
                    <Plus className="size-3" /> Add Tag
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Key takeaways or sub-themes with a title and short descriptive subtitle.
                </p>

                <div className="space-y-2.5">
                  {tags.map((tag, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 dark:border-border bg-white dark:bg-card shadow-2xs"
                    >
                      <span className="text-xs font-bold text-muted-foreground w-5 text-center">
                        #{idx + 1}
                      </span>
                      <input
                        type="text"
                        placeholder="Tag Title (e.g. Dev Deepawali)"
                        value={tag.title}
                        onChange={(e) => handleUpdateTag(idx, "title", e.target.value)}
                        className="h-8 flex-1 rounded border border-slate-200 dark:border-border bg-transparent px-2.5 text-xs font-bold outline-none focus:border-primary"
                      />
                      <input
                        type="text"
                        placeholder="Tag Subtitle (e.g. Festival of the Gods)"
                        value={tag.subtitle}
                        onChange={(e) => handleUpdateTag(idx, "subtitle", e.target.value)}
                        className="h-8 flex-1 rounded border border-slate-200 dark:border-border bg-transparent px-2.5 text-xs outline-none focus:border-primary"
                      />
                      {tags.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(idx)}
                          className="grid size-7 place-items-center rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                          title="Remove tag"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Row 6: Festive Gallery Section */}
              <div className="rounded-xl border border-slate-200 dark:border-border bg-slate-50/50 dark:bg-muted/20 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="size-4 text-emerald-600 dark:text-emerald-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-foreground">
                      Festive Photo Gallery ({gallery.length})
                    </h4>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleAddGalleryItem}
                    className="h-7 text-xs font-bold gap-1 border-slate-300 dark:border-border"
                  >
                    <Plus className="size-3" /> Add Photo
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Optional photo gallery highlighting celebrations, rituals, or architecture.
                </p>

                {gallery.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic py-1">
                    No gallery photos added yet. Click &ldquo;Add Photo&rdquo; to include pictures.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {gallery.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex gap-3 items-start p-3 rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-card shadow-2xs"
                      >
                        {item.image_url ? (
                          <div className="size-14 rounded-lg border border-slate-200 overflow-hidden bg-slate-100 shrink-0">
                            <img src={item.image_url} alt="" className="h-full w-full object-cover" />
                          </div>
                        ) : (
                          <div className="grid size-14 place-items-center rounded-lg border border-dashed border-slate-300 text-slate-400 shrink-0">
                            <ImageIcon className="size-5" />
                          </div>
                        )}
                        <div className="flex-1 space-y-1.5">
                          <input
                            type="url"
                            placeholder="Image URL (https://...)"
                            value={item.image_url}
                            onChange={(e) => handleUpdateGallery(idx, "image_url", e.target.value)}
                            className="h-7 w-full rounded border border-slate-200 dark:border-border bg-transparent px-2 text-xs font-mono outline-none focus:border-primary"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              placeholder="Title (e.g. Dashashwamedh Ghat)"
                              value={item.title}
                              onChange={(e) => handleUpdateGallery(idx, "title", e.target.value)}
                              className="h-7 w-full rounded border border-slate-200 dark:border-border bg-transparent px-2 text-xs font-bold outline-none focus:border-primary"
                            />
                            <input
                              type="text"
                              placeholder="Subtitle (Optional)"
                              value={item.subtitle}
                              onChange={(e) => handleUpdateGallery(idx, "subtitle", e.target.value)}
                              className="h-7 w-full rounded border border-slate-200 dark:border-border bg-transparent px-2 text-xs outline-none focus:border-primary"
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveGallery(idx)}
                          className="grid size-7 place-items-center rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer shrink-0 mt-1"
                          title="Remove photo"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Row 7: Fact Section */}
              <div className="rounded-xl border border-amber-300/80 dark:border-amber-700/60 bg-amber-50/60 dark:bg-amber-950/20 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-amber-500" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-950 dark:text-amber-300">
                    Fascinating Fact Section (Optional)
                  </h4>
                </div>
                <p className="text-[11px] text-amber-900/80 dark:text-amber-300/70">
                  Highlight an astonishing fact, record, or educational discovery for curious learners.
                </p>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-[11px] font-bold text-amber-950 dark:text-amber-300 mb-1">
                      Fact Image URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={factImageUrl}
                      onChange={(e) => setFactImageUrl(e.target.value)}
                      className="h-9 w-full rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-background px-3 text-xs outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-amber-950 dark:text-amber-300 mb-1">
                      Fact Title
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Over 1 Million Lamps"
                      value={factTitle}
                      onChange={(e) => setFactTitle(e.target.value)}
                      className="h-9 w-full rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-background px-3 text-xs font-bold outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-amber-950 dark:text-amber-300 mb-1">
                    Fact Narrative
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Varanasi illuminates over one million clay lamps across 84 ghats in a single evening..."
                    value={factDescription}
                    onChange={(e) => setFactDescription(e.target.value)}
                    className="w-full rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-background p-2.5 text-xs outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>

            {/* Bottom Modal Actions */}
            <div className="flex flex-wrap items-center justify-between border-t border-slate-200 dark:border-border bg-slate-50/90 dark:bg-muted/30 px-6 py-3.5 shrink-0 gap-3">
              <div>
                {initialData?.id ? (
                  deleteConfirmOpen ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-rose-600 font-bold">Confirm delete?</span>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={isDeleting}
                        onClick={handleDelete}
                        className="h-8 text-xs font-bold"
                      >
                        {isDeleting ? "Deleting..." : "Yes, Delete"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDeleteConfirmOpen(false)}
                        className="h-8 text-xs font-semibold"
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteConfirmOpen(true)}
                      className="text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    >
                      <Trash2 className="size-3.5 mr-1" />
                      Delete
                    </Button>
                  )
                ) : (
                  <span className="text-xs text-muted-foreground font-medium">
                    Scheduled for: <strong>{scheduledDate}</strong>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                  className="font-semibold text-xs h-9 border-slate-300 dark:border-border"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmitting}
                  onClick={() => handleSubmit("draft")}
                  className="font-bold text-xs h-9 border-slate-300 dark:border-border gap-1"
                >
                  <Save className="size-3.5" />
                  Save Draft
                </Button>
                <Button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSubmit("scheduled")}
                  className="font-bold text-xs h-9 gap-1 shadow-xs"
                >
                  <Clock className="size-3.5" />
                  {isSubmitting ? "Scheduling..." : "Schedule Content"}
                </Button>
              </div>
            </div>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
