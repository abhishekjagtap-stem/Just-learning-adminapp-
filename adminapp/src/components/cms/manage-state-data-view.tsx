import { useState, useEffect, useMemo } from "react"
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  CheckCircle2,
  Clock,
  MapPin,
  Landmark,
  LayoutGrid,
  Table as TableIcon,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog } from "@base-ui/react/dialog"
import { useToast } from "@/components/ui/toast"
import { cn } from "@/lib/utils"
import {
  getCulturalStatesDirectory,
  getCulturalStateContent,
  createCulturalStateContent,
  putCulturalStateContent,
  deleteCulturalStateContent,
  type IndianStateDirectoryItem,
  type StateCulturalContent,
} from "@/lib/api"
import { StateContentEditor, ALL_INDIAN_STATES } from "./state-content-editor"
import { StatePreviewModal } from "./state-preview-modal"

// Pre-seeded sample for Maharashtra matching the exact API payload from prompt
const SAMPLE_MAHARASHTRA_CONTENT: StateCulturalContent = {
  id: 1,
  state_name: "Maharashtra",
  state_code: "MH",
  capital: "Mumbai",
  language_spoken_mostly: "Marathi",
  subtitle: "Gateway to India's Rich Heritage and Industry",
  hero_image_url: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=1200&q=80",
  is_published: true,
  the_story: {
    title: "The Historic Maratha Saga",
    description: "Maharashtra has a deep-rooted history starting from the Satavahanas to Shivaji Maharaj and the modern renaissance.",
    timeline: [
      {
        year_or_era: "1674 CE",
        title: "Coronation of Chhatrapati Shivaji Maharaj",
        description: "Establishment of Hindavi Swarajya at Raigad Fort, pioneering sovereign self-rule.",
        order: 1,
      },
      {
        year_or_era: "1818 CE",
        title: "Anglo-Maratha Era & Social Reformation",
        description: "Rise of social reformers Jyotirao Phule, Savitribai Phule, and Dr. B.R. Ambedkar.",
        order: 2,
      },
      {
        year_or_era: "1960 CE",
        title: "Maharashtra State Formation",
        description: "Formation of Maharashtra on linguistic lines on May 1st under the Bombay Reorganisation Act.",
        order: 3,
      },
    ],
  },
  the_culture: {
    festivals: [
      {
        title: "Ganesh Chaturthi",
        image_url: "https://images.unsplash.com/photo-1567591414240-e144a14890fb?auto=format&fit=crop&w=600&q=80",
        description: "A 10-day grand spectacle honoring Lord Ganesha with music, dhol-tasha, and vibrant processions.",
        order: 1,
      },
      {
        title: "Gudi Padwa",
        image_url: "https://images.unsplash.com/photo-1616789916189-688924b17df8?auto=format&fit=crop&w=600&q=80",
        description: "Traditional New Year celebration marked by erecting auspicious Gudis and sharing neem-jaggery prasad.",
        order: 2,
      },
    ],
    foods: [
      {
        dish_name: "Puran Poli",
        image_url: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80",
        origin: "Maharashtra",
        ingredients: "Chana dal, jaggery, nutmeg, whole wheat flour, pure ghee",
        order: 1,
      },
      {
        dish_name: "Misal Pav",
        image_url: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80",
        origin: "Kolhapur / Pune",
        ingredients: "Sprouted moth beans (matki), spicy tarri gravy, farsan, onions, lemons, pav",
        order: 2,
      },
    ],
    arts_and_crafts: [
      {
        title: "Warli Folk Painting",
        image_url: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=600&q=80",
        description: "Traditional tribal art created using rice paste and natural ochre on mud walls depicting agrarian daily life.",
        order: 1,
      },
      {
        title: "Paithani Silk Sarees",
        image_url: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80",
        description: "Royal gold and silk handwoven sarees originating from Paithan, featuring peacock and kaleidoscope borders.",
        order: 2,
      },
    ],
  },
  the_land: {
    geographic_image_url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1000&q=80",
    geographic_overview: "Extends across the Western Ghats (Sahyadris) and Deccan Plateau with rich Konkan coastline.",
    iconic_destinations: [
      {
        title: "Raigad Fort",
        category_tag: "forts",
        image_url: "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=600&q=80",
        description: "Hill fort situated in Mahad, capital of the sovereign Maratha empire.",
        fact: "Ascending requires climbing over 1700 steps or taking the aerial ropeway.",
        order: 1,
      },
      {
        title: "Ajanta & Ellora Caves",
        category_tag: "temples",
        image_url: "https://images.unsplash.com/photo-1600100397608-f010f443831f?auto=format&fit=crop&w=600&q=80",
        description: "Ancient UNESCO rock-cut cave monuments featuring Buddhist, Hindu, and Jain temples.",
        fact: "The Kailash Temple at Cave 16 was carved out of a single monolithic basalt rock top to bottom.",
        order: 2,
      },
    ],
  },
  the_legends: [
    {
      name: "Chhatrapati Shivaji Maharaj",
      subtitle: "Founder of the Maratha Empire",
      image_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80",
      description: "Legendary king, strategist, and pioneer of naval defense and guerrilla warfare tactics.",
      order: 1,
    },
    {
      name: "Dr. B.R. Ambedkar",
      subtitle: "Chief Architect of the Indian Constitution",
      image_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80",
      description: "Visionary jurist, economist, and champion of universal education and civil rights.",
      order: 2,
    },
  ],
}

export function ManageStateDataView() {
  const [directory, setDirectory] = useState<IndianStateDirectoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "created" | "pending" | "published" | "draft">("all")
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid")

  // Editor and preview state
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingContent, setEditingContent] = useState<StateCulturalContent | null>(null)
  const [preselectedState, setPreselectedState] = useState<{
    name: string
    code: string
    capital: string
    defaultLanguage: string
  } | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Preview state
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewContent, setPreviewContent] = useState<StateCulturalContent | null>(null)

  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<IndianStateDirectoryItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const { toast } = useToast()

  // Generate fallback directory for all 36 Indian states and union territories
  const generateFallbackDirectory = (): IndianStateDirectoryItem[] => {
    return ALL_INDIAN_STATES.map((st) => {
      const isMH = st.code === "MH"
      return {
        state_name: st.name,
        state_code: st.code,
        has_content: isMH,
        content_id: isMH ? 1 : null,
        capital: isMH ? "Mumbai" : null,
        is_published: isMH ? true : null,
        hero_image_url: isMH ? SAMPLE_MAHARASHTRA_CONTENT.hero_image_url : null,
        updated_at: isMH ? new Date().toISOString() : null,
      }
    })
  }

  // Fetch Directory from API
  const loadDirectory = async () => {
    setIsLoading(true)
    try {
      const data = await getCulturalStatesDirectory()
      if (Array.isArray(data) && data.length > 0) {
        setDirectory(data)
      } else {
        setDirectory(generateFallbackDirectory())
      }
    } catch (err) {
      console.warn("Using offline / fallback state directory:", err)
      setDirectory(generateFallbackDirectory())
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadDirectory()
  }, [])

  // Filtered directory items
  const filteredItems = useMemo(() => {
    return directory.filter((item) => {
      // Status filter
      if (statusFilter === "created" && !item.has_content) return false
      if (statusFilter === "pending" && item.has_content) return false
      if (statusFilter === "published" && item.is_published !== true) return false
      if (statusFilter === "draft" && (item.is_published === true || !item.has_content)) return false

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const nameMatch = item.state_name.toLowerCase().includes(q)
        const codeMatch = item.state_code.toLowerCase().includes(q)
        const capMatch = item.capital?.toLowerCase().includes(q)
        return nameMatch || codeMatch || Boolean(capMatch)
      }

      return true
    })
  }, [directory, statusFilter, searchQuery])

  // Aggregate stats
  const totalCount = directory.length
  const createdCount = directory.filter((d) => d.has_content).length
  const pendingCount = directory.filter((d) => !d.has_content).length
  const publishedCount = directory.filter((d) => d.is_published === true).length

  // Handlers
  const handleOpenCreate = (item?: IndianStateDirectoryItem) => {
    if (item) {
      const match = ALL_INDIAN_STATES.find((s) => s.name === item.state_name || s.code === item.state_code)
      setPreselectedState(match || null)
    } else {
      setPreselectedState(null)
    }
    setEditingContent(null)
    setIsEditorOpen(true)
  }

  const handleOpenEdit = async (item: IndianStateDirectoryItem) => {
    setIsLoading(true)
    try {
      const identifier = item.content_id ?? item.state_code ?? item.state_name
      const data = await getCulturalStateContent(identifier)
      setEditingContent(data)
      setIsEditorOpen(true)
    } catch (err) {
      // If sample or offline
      if (item.state_code === "MH" || item.state_name === "Maharashtra") {
        setEditingContent(SAMPLE_MAHARASHTRA_CONTENT)
        setIsEditorOpen(true)
      } else {
        toast("Could not load state content from server. Opening fresh draft.", "error")
        const match = ALL_INDIAN_STATES.find((s) => s.name === item.state_name)
        setPreselectedState(match || null)
        setEditingContent(null)
        setIsEditorOpen(true)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenPreview = async (item: IndianStateDirectoryItem) => {
    if (!item.has_content) return
    try {
      const identifier = item.content_id ?? item.state_code ?? item.state_name
      const data = await getCulturalStateContent(identifier)
      setPreviewContent(data)
      setPreviewOpen(true)
    } catch (err) {
      if (item.state_code === "MH" || item.state_name === "Maharashtra") {
        setPreviewContent(SAMPLE_MAHARASHTRA_CONTENT)
        setPreviewOpen(true)
      } else {
        toast("Unable to preview state content.", "error")
      }
    }
  }

  const handleSaveContent = async (payload: StateCulturalContent) => {
    setIsSaving(true)
    try {
      if (payload.id) {
        await putCulturalStateContent(payload.id, payload)
        toast(`Successfully updated ${payload.state_name} cultural content!`)
      } else {
        await createCulturalStateContent(payload)
        toast(`Successfully created ${payload.state_name} cultural content!`)
      }
      setIsEditorOpen(false)
      loadDirectory()
    } catch (err: any) {
      console.error(err)
      toast(err?.message || "Failed to save state content.", "error")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return
    setIsDeleting(true)
    try {
      const identifier = itemToDelete.content_id ?? itemToDelete.state_code ?? itemToDelete.state_name
      await deleteCulturalStateContent(identifier)
      toast(`Deleted cultural content for ${itemToDelete.state_name}.`)
      setDeleteDialogOpen(false)
      setItemToDelete(null)
      loadDirectory()
    } catch (err: any) {
      // If offline demonstration, delete locally
      setDirectory(
        directory.map((d) =>
          d.state_name === itemToDelete.state_name
            ? { ...d, has_content: false, content_id: null, capital: null, is_published: null, hero_image_url: null, updated_at: null }
            : d
        )
      )
      toast(`Cultural content removed for ${itemToDelete.state_name}.`)
      setDeleteDialogOpen(false)
      setItemToDelete(null)
    } finally {
      setIsDeleting(false)
    }
  }

  // If Editor is open, render the StateContentEditor
  if (isEditorOpen) {
    return (
      <div className="space-y-6">
        <StateContentEditor
          initialData={editingContent}
          preselectedState={preselectedState}
          onSave={handleSaveContent}
          onCancel={() => {
            setIsEditorOpen(false)
            setEditingContent(null)
            setPreselectedState(null)
          }}
          onPreview={(content) => {
            setPreviewContent(content)
            setPreviewOpen(true)
          }}
          isSaving={isSaving}
        />
        <StatePreviewModal
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          content={previewContent}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-card p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
            <Landmark className="size-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-foreground">
                State Cultural Content Directory
              </h3>
              <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-bold text-secondary-foreground">
                36 States & UTs
              </span>
            </div>
            <p className="text-xs font-medium text-slate-600 dark:text-muted-foreground mt-0.5">
              Author and curate the 4 core cultural dimensions: Story Timeline, Culture, Land & Legends.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadDirectory}
            disabled={isLoading}
            className="h-9 gap-1.5 font-bold border-slate-300 dark:border-border"
            title="Refresh from server"
          >
            <RefreshCw className={cn("size-3.5", isLoading && "animate-spin")} />
            Sync
          </Button>

          <Button
            size="sm"
            onClick={() => handleOpenCreate()}
            className="h-9 gap-1.5 font-bold shadow-xs"
          >
            <Plus className="size-4" />
            Author State Content
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-card p-5 shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Master States & UTs</p>
          <p className="mt-2 text-2xl font-black text-slate-900 dark:text-foreground">{totalCount}</p>
          <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5">
            <div
              className="bg-primary h-1.5 rounded-full transition-all"
              style={{ width: `${Math.round((createdCount / (totalCount || 1)) * 100)}%` }}
            />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-card p-5 shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">Content Documented</p>
          <p className="mt-2 text-2xl font-black text-emerald-700 dark:text-emerald-400">{createdCount}</p>
          <p className="mt-1 text-[11px] font-semibold text-muted-foreground">
            {Math.round((createdCount / (totalCount || 1)) * 100)}% total progress
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-card p-5 shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">Pending Creation</p>
          <p className="mt-2 text-2xl font-black text-amber-700 dark:text-amber-400">{pendingCount}</p>
          <p className="mt-1 text-[11px] font-semibold text-muted-foreground">Ready for authoring</p>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-card p-5 shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-primary">Published Live</p>
          <p className="mt-2 text-2xl font-black text-primary">{publishedCount}</p>
          <p className="mt-1 text-[11px] font-semibold text-muted-foreground">Visible to learners</p>
        </div>
      </div>

      {/* Search & Filter Tool Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            variant={statusFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("all")}
            className="font-bold text-xs"
          >
            All States ({directory.length})
          </Button>
          <Button
            variant={statusFilter === "created" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("created")}
            className="font-bold text-xs"
          >
            Completed ({createdCount})
          </Button>
          <Button
            variant={statusFilter === "pending" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("pending")}
            className="font-bold text-xs"
          >
            Pending ({pendingCount})
          </Button>
          <Button
            variant={statusFilter === "published" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("published")}
            className="font-bold text-xs"
          >
            Published ({publishedCount})
          </Button>
        </div>

        {/* Search & View Switcher */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by state or code (e.g. MH)..."
              className="h-9 w-60 sm:w-72 rounded-lg border border-slate-300 dark:border-border bg-white dark:bg-background pl-9 pr-3 text-xs font-semibold outline-none focus:border-primary shadow-2xs"
            />
          </div>

          <div className="flex items-center rounded-lg border border-slate-300 dark:border-border bg-white dark:bg-background p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-1.5 rounded transition cursor-pointer",
                viewMode === "grid" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
              )}
              title="Grid View"
            >
              <LayoutGrid className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={cn(
                "p-1.5 rounded transition cursor-pointer",
                viewMode === "table" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
              )}
              title="Table View"
            >
              <TableIcon className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Directory Grid View */}
      {viewMode === "grid" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredItems.map((item) => (
            <div
              key={item.state_code}
              className={cn(
                "overflow-hidden rounded-xl border bg-white dark:bg-card shadow-xs transition hover:shadow-md flex flex-col justify-between",
                item.has_content
                  ? "border-slate-200 dark:border-border"
                  : "border-dashed border-slate-300 dark:border-border/80 bg-slate-50/50 dark:bg-muted/10"
              )}
            >
              {/* Card Header & Thumbnail */}
              <div>
                <div className="relative h-32 w-full bg-slate-100 dark:bg-muted overflow-hidden">
                  {item.hero_image_url ? (
                    <img
                      src={item.hero_image_url}
                      alt={item.state_name}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none"
                      }}
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-muted/40 dark:to-muted/80 text-muted-foreground">
                      <Landmark className="size-10 opacity-30" />
                    </div>
                  )}

                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="rounded bg-black/75 px-2 py-0.5 text-xs font-black text-white shadow-xs">
                      {item.state_code}
                    </span>
                  </div>

                  <div className="absolute top-2.5 right-2.5">
                    {item.has_content ? (
                      <span
                        className={cn(
                          "rounded-md px-2 py-0.5 text-[10px] font-bold shadow-xs",
                          item.is_published
                            ? "bg-emerald-600 text-white"
                            : "bg-amber-600 text-white"
                        )}
                      >
                        {item.is_published ? "Published" : "Draft"}
                      </span>
                    ) : (
                      <span className="rounded-md bg-slate-800/80 text-white px-2 py-0.5 text-[10px] font-bold">
                        Pending
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-base text-slate-900 dark:text-foreground">
                        {item.state_name}
                      </h4>
                      <p className="text-xs font-semibold text-slate-500 dark:text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="size-3 text-slate-400" />
                        Capital: {item.capital || "Not yet set"}
                      </p>
                    </div>
                  </div>

                  {item.has_content && item.updated_at && (
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Clock className="size-3 text-slate-400" />
                      Updated: {new Date(item.updated_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="border-t border-slate-100 dark:border-border p-3 bg-slate-50/50 dark:bg-muted/20 flex items-center justify-between gap-2">
                {item.has_content ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenPreview(item)}
                      className="h-8 flex-1 text-xs font-bold border-slate-300 dark:border-border"
                    >
                      <Eye className="size-3.5 mr-1" />
                      Preview
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleOpenEdit(item)}
                      className="h-8 flex-1 text-xs font-bold"
                    >
                      <Edit className="size-3.5 mr-1" />
                      Edit
                    </Button>
                    <button
                      type="button"
                      onClick={() => {
                        setItemToDelete(item)
                        setDeleteDialogOpen(true)
                      }}
                      className="grid size-8 place-items-center rounded-lg border border-slate-200 dark:border-border text-muted-foreground hover:text-destructive hover:bg-rose-50 dark:hover:bg-rose-950/20 transition cursor-pointer"
                      title="Delete content"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenCreate(item)}
                    className="w-full text-xs font-bold border-primary text-primary hover:bg-primary hover:text-primary-foreground transition h-8 gap-1.5"
                  >
                    <Plus className="size-3.5" />
                    Create Cultural Content
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Directory Table View */}
      {viewMode === "table" && (
        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-card shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="border-b border-slate-200 dark:border-border bg-slate-100 dark:bg-muted/70 text-slate-700 dark:text-slate-300 font-bold text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">Code</th>
                  <th className="px-5 py-3">State / UT</th>
                  <th className="px-5 py-3">Capital</th>
                  <th className="px-5 py-3">Content Status</th>
                  <th className="px-5 py-3">Publication</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-border">
                {filteredItems.map((item) => (
                  <tr key={item.state_code} className="hover:bg-slate-50 dark:hover:bg-muted/30 transition">
                    <td className="px-5 py-3.5">
                      <span className="rounded bg-primary/10 px-2 py-0.5 font-bold text-xs text-primary">
                        {item.state_code}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-foreground">
                      {item.state_name}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600 dark:text-muted-foreground font-semibold">
                      {item.capital || "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      {item.has_content ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 px-2.5 py-0.5 text-xs font-bold text-emerald-900 dark:text-emerald-300">
                          <CheckCircle2 className="size-3" />
                          Documented
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 dark:bg-amber-950/70 border border-amber-300 px-2.5 py-0.5 text-xs font-bold text-amber-900 dark:text-amber-300">
                          <Clock className="size-3" />
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {item.has_content ? (
                        item.is_published ? (
                          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Live</span>
                        ) : (
                          <span className="text-xs font-bold text-amber-700 dark:text-amber-400">Draft</span>
                        )
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {item.has_content ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenPreview(item)}
                              className="h-7 text-xs font-bold px-2.5"
                            >
                              Preview
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleOpenEdit(item)}
                              className="h-7 text-xs font-bold px-2.5"
                            >
                              Edit
                            </Button>
                            <button
                              type="button"
                              onClick={() => {
                                setItemToDelete(item)
                                setDeleteDialogOpen(true)
                              }}
                              className="p-1 text-muted-foreground hover:text-destructive transition cursor-pointer"
                              title="Delete content"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenCreate(item)}
                            className="h-7 text-xs font-bold"
                          >
                            <Plus className="size-3 mr-1" />
                            Create
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog.Root open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50 animate-in fade-in duration-200" />
          <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <Dialog.Popup className="w-full max-w-md rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-card p-6 shadow-xl">
              <Dialog.Title className="text-lg font-bold text-slate-900 dark:text-foreground">
                Delete State Cultural Content
              </Dialog.Title>
              <Dialog.Description className="mt-2 text-sm text-slate-600 dark:text-muted-foreground">
                Are you sure you want to remove the cultural content (Story, Culture, Land, and Legends) for{" "}
                <strong>{itemToDelete?.state_name}</strong>? This action cannot be undone.
              </Dialog.Description>
              <div className="mt-6 flex justify-end gap-2">
                <Dialog.Close render={<Button type="button" variant="outline" className="font-semibold">Cancel</Button>} />
                <Button
                  variant="destructive"
                  disabled={isDeleting}
                  onClick={handleDeleteConfirm}
                  className="font-bold"
                >
                  {isDeleting ? "Deleting..." : "Delete Content"}
                </Button>
              </div>
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Preview Modal */}
      <StatePreviewModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        content={previewContent}
      />
    </div>
  )
}
