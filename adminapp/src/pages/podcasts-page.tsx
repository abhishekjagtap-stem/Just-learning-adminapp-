import { useCallback, useEffect, useState, type FormEvent } from "react"
import { Dialog } from "@base-ui/react/dialog"
import {
  Info,
  Play,
  Plus,
  Radio,
  Search,
  Settings2,
  Sparkles,
  Tv,
  X,
} from "lucide-react"
import { Header } from "@/components/dashboard/header"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/toast"
import { YouTubePlayer } from "@/components/ui/youtube-player"
import {
  createPodcast,
  getAdminSettings,
  getPodcasts,
  togglePodcastHome,
  updateAdminSettings,
  type AdminSettings,
  type Podcast,
} from "@/lib/api"
import { navigateTo } from "@/lib/navigation"

export function PodcastsPage() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false)
  const [previewPodcast, setPreviewPodcast] = useState<Podcast | null>(null)

  const [podcasts, setPodcasts] = useState<Podcast[]>([])
  const [settings, setSettings] = useState<AdminSettings>({ max_home_podcasts: 2 })

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false)
  const [togglingId, setTogglingId] = useState<number | null>(null)

  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<"all" | "home">("all")

  const { toast } = useToast()

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [podcastsRes, settingsRes] = await Promise.allSettled([
        getPodcasts(),
        getAdminSettings(),
      ])

      if (podcastsRes.status === "fulfilled") {
        const raw = podcastsRes.value
        setPodcasts(Array.isArray(raw) ? raw : raw.results || [])
      }

      if (settingsRes.status === "fulfilled") {
        setSettings(settingsRes.value)
      }
    } catch (error) {
      toast(error instanceof Error ? error.message : "Unable to load podcasts data.", "error")
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const handleCreatePodcast = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const embed_code = String(form.get("embed_code") || "").trim()
    const description = String(form.get("description") || "").trim()
    const keep_at_home = form.get("keep_at_home") === "on"

    if (!embed_code) {
      toast("Please provide a YouTube iframe embed code.", "error")
      return
    }

    setIsSubmitting(true)
    try {
      await createPodcast({
        embed_code,
        description: description || undefined,
        keep_at_home,
      })
      setCreateDialogOpen(false)
      toast("Podcast published successfully!")
      await loadData()
    } catch (error) {
      toast(error instanceof Error ? error.message : "Failed to create podcast.", "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleHome = async (podcast: Podcast) => {
    const targetState = !podcast.keep_at_home
    setTogglingId(podcast.id)

    // Optimistically update local state for instant UI response
    setPodcasts((prev) =>
      prev.map((item) => (item.id === podcast.id ? { ...item, keep_at_home: targetState } : item))
    )

    try {
      const response = await togglePodcastHome(podcast.id, targetState)
      const finalState = typeof response?.keep_at_home === "boolean" ? response.keep_at_home : targetState

      // Ensure state matches server response
      setPodcasts((prev) =>
        prev.map((item) => (item.id === podcast.id ? { ...item, keep_at_home: finalState } : item))
      )

      toast(
        finalState
          ? `"${podcast.title}" is now featured on the Home screen.`
          : `"${podcast.title}" removed from the Home screen.`
      )

    } catch (error) {
      // Revert optimistic update on server error (e.g. limit reached)
      setPodcasts((prev) =>
        prev.map((item) => (item.id === podcast.id ? { ...item, keep_at_home: !targetState } : item))
      )
      const msg = error instanceof Error ? error.message : "Unable to update podcast home status."
      toast(msg, "error")
    } finally {
      setTogglingId(null)
    }
  }

  const handleUpdateSettings = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const limit = Number(form.get("max_home_podcasts"))

    if (isNaN(limit) || limit < 1) {
      toast("Please enter a valid limit (1 or more).", "error")
      return
    }

    setIsUpdatingSettings(true)
    try {
      const updated = await updateAdminSettings({ max_home_podcasts: limit })
      setSettings(updated)
      setSettingsDialogOpen(false)
      toast(`Maximum home podcasts limit updated to ${updated.max_home_podcasts}.`)
      await loadData()
    } catch (error) {
      toast(error instanceof Error ? error.message : "Unable to update settings.", "error")
    } finally {
      setIsUpdatingSettings(false)
    }
  }

  const featuredCount = podcasts.filter((p) => p.keep_at_home).length
  const filteredPodcasts = podcasts.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
    if (activeTab === "home") return matchesSearch && p.keep_at_home
    return matchesSearch
  })

  return (
    <div className="flex min-h-svh bg-background">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header title="Podcasts" onMenuClick={() => setMobileOpen(true)} />

        <main className="flex-1 p-4 sm:p-7">
          <div className="mx-auto max-w-7xl space-y-6">
            {/* Header & Stats Banner */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">Podcast Management</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Publish YouTube embeds and manage podcasts featured on the mobile app home screen.
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Settings Dialog Trigger */}
                <Dialog.Root open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
                  <Dialog.Trigger
                    render={
                      <Button variant="outline" size="sm" className="gap-2">
                        <Settings2 className="size-4" />
                        Home Limit ({settings.max_home_podcasts})
                      </Button>
                    }
                  />
                  <Dialog.Portal>
                    <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50 animate-in fade-in duration-200" />
                    <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-4">
                      <Dialog.Popup className="w-full max-w-md rounded-xl border bg-card p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between">
                          <Dialog.Title className="text-lg font-semibold flex items-center gap-2">
                            <Settings2 className="size-5 text-primary" />
                            Admin Display Settings
                          </Dialog.Title>
                          <Dialog.Close
                            render={
                              <button className="rounded-md p-1 hover:bg-muted text-muted-foreground">
                                <X className="size-4" />
                              </button>
                            }
                          />
                        </div>
                        <Dialog.Description className="mt-2 text-sm text-muted-foreground">
                          Set the maximum number of podcasts that admins are allowed to highlight on the home screen at once.
                        </Dialog.Description>

                        <form className="mt-6 space-y-4" onSubmit={handleUpdateSettings}>
                          <label className="block text-sm font-medium">
                            Max Home Podcasts Limit
                            <input
                              required
                              name="max_home_podcasts"
                              type="number"
                              min={1}
                              max={50}
                              defaultValue={settings.max_home_podcasts}
                              className="mt-2 h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                            />
                          </label>

                          <div className="rounded-lg bg-amber-500/10 p-3 text-xs text-amber-600 dark:text-amber-400 flex items-start gap-2">
                            <Info className="size-4 shrink-0 mt-0.5" />
                            <span>
                              If you set a lower limit than current active home podcasts, admins won't be able to activate new ones until excess ones are unchecked.
                            </span>
                          </div>

                          <div className="flex justify-end gap-2 pt-2">
                            <Dialog.Close
                              render={
                                <Button type="button" variant="outline">
                                  Cancel
                                </Button>
                              }
                            />
                            <Button type="submit" disabled={isUpdatingSettings}>
                              {isUpdatingSettings ? "Saving…" : "Save Limit"}
                            </Button>
                          </div>
                        </form>
                      </Dialog.Popup>
                    </Dialog.Viewport>
                  </Dialog.Portal>
                </Dialog.Root>

                {/* Create Podcast Dialog Trigger */}
                <Dialog.Root open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                  <Dialog.Trigger
                    render={
                      <Button className="gap-2">
                        <Plus className="size-4" />
                        Add Podcast
                      </Button>
                    }
                  />
                  <Dialog.Portal>
                    <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50 animate-in fade-in duration-200" />
                    <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-4">
                      <Dialog.Popup className="w-full max-w-lg rounded-xl border bg-card p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between">
                          <Dialog.Title className="text-lg font-semibold flex items-center gap-2">
                            <Radio className="size-5 text-primary" />
                            Add New Podcast
                          </Dialog.Title>
                          <Dialog.Close
                            render={
                              <button className="rounded-md p-1 hover:bg-muted text-muted-foreground">
                                <X className="size-4" />
                              </button>
                            }
                          />
                        </div>
                        <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                          Paste a YouTube iframe embed code. Title and thumbnail will be parsed automatically.
                        </Dialog.Description>

                        <form className="mt-6 space-y-4" onSubmit={handleCreatePodcast}>
                          <label className="block text-sm font-medium">
                            YouTube Embed Code <span className="text-destructive">*</span>
                            <textarea
                              required
                              name="embed_code"
                              rows={4}
                              placeholder='<iframe width="560" height="315" src="https://www.youtube.com/embed/3pG8Hgq3Z8M" title="YouTube video player" frameborder="0" allowfullscreen></iframe>'
                              className="mt-2 w-full rounded-lg border bg-background p-3 text-xs font-mono outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                            />
                          </label>

                          <label className="block text-sm font-medium">
                            Description <span className="text-muted-foreground text-xs">(Optional)</span>
                            <textarea
                              name="description"
                              rows={3}
                              placeholder="An inspiring episode discussing science, innovation, and learning..."
                              className="mt-2 w-full rounded-lg border bg-background p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                            />
                          </label>

                          <div className="flex items-center gap-3 rounded-lg border p-3 bg-muted/30">
                            <input
                              id="keep_at_home"
                              name="keep_at_home"
                              type="checkbox"
                              className="size-4 rounded accent-primary cursor-pointer"
                            />
                            <label htmlFor="keep_at_home" className="text-sm cursor-pointer select-none font-medium">
                              Show on Mobile App Home Screen
                              <span className="block text-xs font-normal text-muted-foreground">
                                Featured limit: {featuredCount} / {settings.max_home_podcasts} active
                              </span>
                            </label>
                          </div>

                          <div className="flex justify-end gap-2 pt-2">
                            <Dialog.Close
                              render={
                                <Button type="button" variant="outline">
                                  Cancel
                                </Button>
                              }
                            />
                            <Button type="submit" disabled={isSubmitting}>
                              {isSubmitting ? "Publishing…" : "Publish Podcast"}
                            </Button>
                          </div>
                        </form>
                      </Dialog.Popup>
                    </Dialog.Viewport>
                  </Dialog.Portal>
                </Dialog.Root>
              </div>
            </div>

            {/* Quick Status Cards */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border bg-card p-5 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Podcasts</p>
                  <p className="mt-2 text-3xl font-bold">{podcasts.length}</p>
                </div>
                <div className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Tv className="size-5" />
                </div>
              </div>

              <div className="rounded-xl border bg-card p-5 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Featured on Home</p>
                  <p className="mt-2 text-3xl font-bold">
                    {featuredCount} <span className="text-sm font-normal text-muted-foreground">/ {settings.max_home_podcasts}</span>
                  </p>
                </div>
                <div className="grid size-11 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Sparkles className="size-5" />
                </div>
              </div>

              <div className="rounded-xl border bg-card p-5 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Home Max Limit</p>
                  <p className="mt-2 text-3xl font-bold">{settings.max_home_podcasts}</p>
                </div>
                <div className="grid size-11 place-items-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <Settings2 className="size-5" />
                </div>
              </div>
            </div>

            {/* Controls Bar: Search & Tabs */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
              <div className="flex items-center gap-1 rounded-lg border bg-card p-1">
                <button
                  onClick={() => setActiveTab("all")}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                    activeTab === "all"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  All Podcasts ({podcasts.length})
                </button>
                <button
                  onClick={() => setActiveTab("home")}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                    activeTab === "home"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Home Featured ({featuredCount})
                </button>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by title or text…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 w-full rounded-lg border bg-background pl-9 pr-3 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
              </div>
            </div>

            {/* Content Area */}
            {isLoading ? (
              /* Skeleton Loader */
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="rounded-xl border bg-card p-4 space-y-3">
                    <Skeleton className="h-44 w-full rounded-lg" />
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <div className="flex items-center justify-between pt-2">
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-6 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredPodcasts.length === 0 ? (
              /* Empty State */
              <div className="rounded-xl border bg-card p-12 text-center">
                <Radio className="mx-auto size-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold">No podcasts found</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {searchQuery
                    ? "No podcasts match your search query."
                    : activeTab === "home"
                    ? "No podcasts are currently marked to display on the home screen."
                    : "Get started by adding your first YouTube podcast embed."}
                </p>
                {activeTab === "all" && !searchQuery && (
                  <Button className="mt-6 gap-2" onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="size-4" /> Add Podcast
                  </Button>
                )}
              </div>
            ) : (
              /* Podcasts Grid */
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredPodcasts.map((podcast) => (
                  <div
                    key={podcast.id}
                    onClick={() => navigateTo(`/podcasts/${podcast.id}`)}
                    className="group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border bg-card shadow-xs transition duration-200 hover:shadow-md hover:border-primary/50"
                  >
                    {/* Thumbnail / Video Container */}
                    <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
                      {podcast.thumbnail_url ? (
                        <img
                          src={podcast.thumbnail_url}
                          alt={podcast.title}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                          onError={(e) => {
                            const target = e.currentTarget
                            if (target.src.includes("maxresdefault")) {
                              target.src = target.src.replace("maxresdefault", "hqdefault")
                            }
                          }}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
                          <Radio className="size-10" />
                        </div>
                      )}

                      {/* Play overlay button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setPreviewPodcast(podcast)
                        }}
                        className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-90 transition hover:bg-black/50 group-hover:opacity-100"
                        title="Watch video preview"
                      >
                        <div className="grid size-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg transition transform hover:scale-110">
                          <Play className="size-5 fill-current ml-0.5" />
                        </div>
                      </button>

                      {/* Home featured badge */}
                      {podcast.keep_at_home && (
                        <div className="absolute left-3 top-3 rounded-full bg-emerald-600 px-2.5 py-0.5 text-[11px] font-semibold text-white shadow-xs flex items-center gap-1">
                          <Sparkles className="size-3" /> Home
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex flex-1 flex-col p-5">
                      <h3
                        className="line-clamp-2 font-semibold text-base leading-snug group-hover:text-primary transition"
                        title={podcast.title}
                      >
                        {podcast.title}
                      </h3>

                      <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-muted-foreground flex-1">
                        {podcast.description || "No description provided."}
                      </p>

                      <div className="mt-4 pt-4 border-t flex items-center justify-between gap-2">
                        {/* Toggle switch for Keep on Home */}
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={podcast.keep_at_home}
                            disabled={togglingId === podcast.id}
                            onClick={() => handleToggleHome(podcast)}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              podcast.keep_at_home ? "bg-primary" : "bg-input"
                            } ${togglingId === podcast.id ? "opacity-50 cursor-not-allowed" : ""}`}
                          >
                            <span
                              className={`pointer-events-none inline-block size-5 transform rounded-full bg-background shadow-lg ring-0 transition duration-200 ease-in-out ${
                                podcast.keep_at_home ? "translate-x-5" : "translate-x-0"
                              }`}
                            />
                          </button>
                          <span className="text-xs font-medium select-none">
                            {podcast.keep_at_home ? "Featured" : "Feature"}
                          </span>
                        </div>

                        {/* Watch preview button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs gap-1 text-muted-foreground hover:text-foreground"
                          onClick={(e) => {
                            e.stopPropagation()
                            setPreviewPodcast(podcast)
                          }}
                        >
                          <Play className="size-3" /> Preview
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Video Preview Modal */}
      <Dialog.Root open={!!previewPodcast} onOpenChange={(open) => !open && setPreviewPodcast(null)}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/70 animate-in fade-in duration-200" />
          <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <Dialog.Popup className="w-full max-w-3xl rounded-xl border bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-3">
                <Dialog.Title className="text-base font-semibold line-clamp-1">
                  {previewPodcast?.title}
                </Dialog.Title>
                <Dialog.Close
                  render={
                    <button className="rounded-md p-1 hover:bg-muted text-muted-foreground">
                      <X className="size-4" />
                    </button>
                  }
                />
              </div>

              {previewPodcast && (
                <div className="mt-2 space-y-4">
                  <YouTubePlayer embedCode={previewPodcast.embed_code} title={previewPodcast.title} autoplay />

                  {previewPodcast.description && (
                    <div className="rounded-lg bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
                      {previewPodcast.description}
                    </div>
                  )}
                </div>
              )}
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Mobile Drawer Navigation */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 bg-foreground/20 md:hidden">
          <div className="relative h-full w-72 shadow-xl">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3 z-10 grid size-8 place-items-center rounded-md hover:bg-muted"
              aria-label="Close menu"
            >
              <X className="size-5" />
            </button>
            <Sidebar mobile collapsed={false} onToggle={() => setMobileOpen(false)} />
          </div>
        </div>
      )}
    </div>
  )
}
