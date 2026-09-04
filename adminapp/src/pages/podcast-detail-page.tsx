import { useCallback, useEffect, useState, type FormEvent } from "react"
import { Dialog } from "@base-ui/react/dialog"
import {
  ArrowLeft,
  Calendar,
  Check,
  Clock,
  Copy,
  Edit,
  ExternalLink,
  Radio,
  Sparkles,
  Trash2,
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
  deletePodcast,
  getAdminSettings,
  getPodcastDetail,
  togglePodcastHome,
  updatePodcast,
  type AdminSettings,
  type Podcast,
} from "@/lib/api"
import { navigateTo } from "@/lib/navigation"

export function PodcastDetailPage({ podcastId }: { podcastId: number }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  const [podcast, setPodcast] = useState<Podcast | null>(null)
  const [settings, setSettings] = useState<AdminSettings>({ max_home_podcasts: 2 })

  const [isLoading, setIsLoading] = useState(true)
  const [isToggling, setIsToggling] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [copiedApiUrl, setCopiedApiUrl] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const { toast } = useToast()

  const fetchDetail = useCallback(async () => {
    setIsLoading(true)
    setErrorMsg(null)
    try {
      const [podcastData, settingsData] = await Promise.all([
        getPodcastDetail(podcastId),
        getAdminSettings().catch(() => ({ max_home_podcasts: 2 })),
      ])
      setPodcast(podcastData)
      setSettings(settingsData)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load podcast details."
      setErrorMsg(msg)
      toast(msg, "error")
    } finally {
      setIsLoading(false)
    }
  }, [podcastId, toast])

  useEffect(() => {
    void fetchDetail()
  }, [fetchDetail])

  const handleToggleHome = async () => {
    if (!podcast) return
    const targetState = !podcast.keep_at_home
    setIsToggling(true)

    // Optimistic UI update
    setPodcast((prev) => (prev ? { ...prev, keep_at_home: targetState } : null))

    try {
      const res = await togglePodcastHome(podcast.id, targetState)
      const finalState = typeof res?.keep_at_home === "boolean" ? res.keep_at_home : targetState

      setPodcast((prev) => (prev ? { ...prev, keep_at_home: finalState } : null))
      toast(
        finalState
          ? `"${podcast.title}" is now featured on the Home screen.`
          : `"${podcast.title}" removed from the Home screen.`
      )
    } catch (err) {
      // Revert optimistic update
      setPodcast((prev) => (prev ? { ...prev, keep_at_home: !targetState } : null))
      const msg = err instanceof Error ? err.message : "Failed to update home status."
      toast(msg, "error")
    } finally {
      setIsToggling(false)
    }
  }

  const handleEditSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!podcast) return

    const form = new FormData(event.currentTarget)
    const embed_code = String(form.get("embed_code") || "").trim()
    const description = String(form.get("description") || "").trim()
    const keep_at_home = form.get("keep_at_home") === "on"

    setIsSavingEdit(true)
    try {
      await updatePodcast(podcast.id, {
        embed_code: embed_code || undefined,
        description: description || undefined,
        keep_at_home,
      })
      setEditDialogOpen(false)
      toast("Podcast updated successfully!")
      await fetchDetail()
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update podcast."
      toast(msg, "error")
    } finally {
      setIsSavingEdit(false)
    }
  }

  const handleDelete = async () => {
    if (!podcast) return
    setIsDeleting(true)
    try {
      await deletePodcast(podcast.id)
      toast(`Podcast "${podcast.title}" deleted successfully.`)
      navigateTo("/podcasts")
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to delete podcast."
      toast(msg, "error")
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  const copyEndpointUrl = () => {
    const url = `${window.location.protocol}//${window.location.host}/api/admin-side/podcasts/${podcastId}/`
    navigator.clipboard.writeText(url)
    setCopiedApiUrl(true)
    setTimeout(() => setCopiedApiUrl(false), 2000)
    toast("Endpoint URL copied to clipboard!")
  }

  return (
    <div className="flex min-h-svh bg-background">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header title="Podcast Detail" onMenuClick={() => setMobileOpen(true)} />

        <main className="flex-1 p-4 sm:p-7">
          <div className="mx-auto max-w-6xl space-y-6">
            {/* Top Navigation & Breadcrumb */}
            <div className="flex items-center justify-between gap-4">
              <button
                onClick={() => navigateTo("/podcasts")}
                className="group flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition"
              >
                <ArrowLeft className="size-4 transition transform group-hover:-translate-x-1" />
                Back to Podcasts
              </button>

              {podcast && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => setEditDialogOpen(true)}
                  >
                    <Edit className="size-4" />
                    Edit Podcast
                  </Button>

                  <Button
                    variant="destructive"
                    size="sm"
                    className="gap-2"
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    <Trash2 className="size-4" />
                    Delete Podcast
                  </Button>
                </div>
              )}
            </div>

            {/* Error view */}
            {errorMsg && !isLoading && (
              <div className="rounded-xl border bg-card p-12 text-center">
                <Radio className="mx-auto size-12 text-destructive/50" />
                <h3 className="mt-4 text-lg font-semibold text-destructive">Podcast Not Found</h3>
                <p className="mt-1 text-sm text-muted-foreground">{errorMsg}</p>
                <Button className="mt-6 gap-2" onClick={() => navigateTo("/podcasts")}>
                  <ArrowLeft className="size-4" /> Back to All Podcasts
                </Button>
              </div>
            )}

            {/* Loading view */}
            {isLoading && (
              <div className="space-y-6">
                <Skeleton className="h-8 w-1/3 rounded-md" />
                <div className="grid gap-6 lg:grid-cols-3">
                  <Skeleton className="h-80 w-full rounded-xl lg:col-span-2" />
                  <Skeleton className="h-80 w-full rounded-xl" />
                </div>
              </div>
            )}

            {/* Podcast Content View */}
            {podcast && !isLoading && (
              <div className="space-y-6">
                {/* Title & Metadata Card */}
                <div className="rounded-xl border bg-card p-6 shadow-xs space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                      ID #{podcast.id}
                    </span>
                    {podcast.keep_at_home && (
                      <span className="rounded-md bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <Sparkles className="size-3" /> Featured on Home Screen
                      </span>
                    )}
                  </div>

                  <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{podcast.title}</h1>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="size-3.5" />
                      Created: {new Date(podcast.created_at).toLocaleDateString()} at{" "}
                      {new Date(podcast.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="size-3.5" />
                      Updated: {new Date(podcast.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Grid: Video Player + Settings/Metadata Controls */}
                <div className="grid gap-6 lg:grid-cols-3">
                  {/* Left Column: Embed Player */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Video Player Box */}
                    <div className="overflow-hidden rounded-xl border bg-slate-950 shadow-xl">
                      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-4 py-2.5 text-xs text-slate-300">
                        <span className="flex items-center gap-2 font-mono font-medium">
                          <Tv className="size-4 text-primary" /> YouTube Player (HD 1080p)
                        </span>
                        <span className="rounded-full bg-red-600/20 px-2 py-0.5 text-[10px] font-semibold text-red-400 border border-red-500/30">
                          LIVE PREVIEW
                        </span>
                      </div>
                      <YouTubePlayer embedCode={podcast.embed_code} title={podcast.title} />
                    </div>

                    {/* Description Card */}
                    <div className="rounded-xl border bg-card p-6 shadow-xs space-y-2">
                      <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                        Description
                      </h3>
                      <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                        {podcast.description || "No description provided for this podcast."}
                      </p>
                    </div>
                  </div>

                  {/* Right Column: Home Display Switch & API Inspector */}
                  <div className="space-y-6">
                    {/* Home Status Toggle Card */}
                    <div className="rounded-xl border bg-card p-6 shadow-xs space-y-4">
                      <h3 className="font-semibold text-base flex items-center gap-2">
                        <Sparkles className="size-4 text-primary" />
                        Home Display Settings
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Control whether this podcast appears on the mobile app home screen (Dynamic Max Limit: {settings.max_home_podcasts}).
                      </p>

                      <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/20">
                        <div>
                          <p className="text-sm font-medium">Keep at Home</p>
                          <p className="text-xs text-muted-foreground">
                            {podcast.keep_at_home ? "Active on Home screen" : "Not displayed on Home"}
                          </p>
                        </div>

                        <button
                          type="button"
                          role="switch"
                          aria-checked={podcast.keep_at_home}
                          disabled={isToggling}
                          onClick={handleToggleHome}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            podcast.keep_at_home ? "bg-primary" : "bg-input"
                          } ${isToggling ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          <span
                            className={`pointer-events-none inline-block size-5 transform rounded-full bg-background shadow-lg ring-0 transition duration-200 ease-in-out ${
                              podcast.keep_at_home ? "translate-x-5" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Developer / API Details Box */}
                    <div className="rounded-xl border bg-card p-6 shadow-xs space-y-4">
                      <div className="flex items-center justify-between border-b pb-3">
                        <h3 className="font-semibold text-sm flex items-center gap-2">
                          <ExternalLink className="size-4 text-primary" />
                          API Response (GET /:id/)
                        </h3>
                        <Button variant="ghost" size="icon-sm" onClick={copyEndpointUrl} title="Copy Endpoint URL">
                          {copiedApiUrl ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
                        </Button>
                      </div>

                      <div className="rounded-lg bg-slate-950 p-3 text-slate-100 font-mono text-xs overflow-x-auto shadow-inner max-h-60">
                        <pre>{JSON.stringify(podcast, null, 2)}</pre>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Edit Podcast Dialog */}
      {podcast && (
        <Dialog.Root open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <Dialog.Portal>
            <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50 animate-in fade-in duration-200" />
            <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <Dialog.Popup className="w-full max-w-lg rounded-xl border bg-card p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between">
                  <Dialog.Title className="text-lg font-semibold flex items-center gap-2">
                    <Edit className="size-5 text-primary" />
                    Edit Podcast Details
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
                  Update podcast embed code or description (PATCH /api/admin-side/podcasts/{podcast.id}/).
                </Dialog.Description>

                <form className="mt-6 space-y-4" onSubmit={handleEditSubmit}>
                  <label className="block text-sm font-medium">
                    YouTube Embed Code
                    <textarea
                      name="embed_code"
                      rows={4}
                      defaultValue={podcast.embed_code}
                      className="mt-2 w-full rounded-lg border bg-background p-3 text-xs font-mono outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                    />
                  </label>

                  <label className="block text-sm font-medium">
                    Description
                    <textarea
                      name="description"
                      rows={3}
                      defaultValue={podcast.description || ""}
                      className="mt-2 w-full rounded-lg border bg-background p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                    />
                  </label>

                  <div className="flex items-center gap-3 rounded-lg border p-3 bg-muted/30">
                    <input
                      id="edit_keep_at_home"
                      name="keep_at_home"
                      type="checkbox"
                      defaultChecked={podcast.keep_at_home}
                      className="size-4 rounded accent-primary cursor-pointer"
                    />
                    <label htmlFor="edit_keep_at_home" className="text-sm cursor-pointer select-none font-medium">
                      Show on Mobile App Home Screen
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
                    <Button type="submit" disabled={isSavingEdit}>
                      {isSavingEdit ? "Saving…" : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </Dialog.Popup>
            </Dialog.Viewport>
          </Dialog.Portal>
        </Dialog.Root>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog.Root open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50 animate-in fade-in duration-200" />
          <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <Dialog.Popup className="w-full max-w-md rounded-xl border bg-card p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
              <Dialog.Title className="text-lg font-semibold text-destructive flex items-center gap-2">
                <Trash2 className="size-5" /> Delete Podcast
              </Dialog.Title>
              <Dialog.Description className="mt-2 text-sm text-muted-foreground">
                Are you sure you want to delete <strong className="text-foreground">"{podcast?.title}"</strong>? This action cannot be undone.
              </Dialog.Description>

              <div className="mt-6 flex justify-end gap-2">
                <Dialog.Close
                  render={
                    <Button type="button" variant="outline" disabled={isDeleting}>
                      Cancel
                    </Button>
                  }
                />
                <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                  {isDeleting ? "Deleting…" : "Yes, Delete Podcast"}
                </Button>
              </div>
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Mobile Menu */}
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
