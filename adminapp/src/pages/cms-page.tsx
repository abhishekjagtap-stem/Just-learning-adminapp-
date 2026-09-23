import { useEffect, useState } from "react"
import {
  Plus,
  X,
  Search,
  Calendar,
} from "lucide-react"
import { Header } from "@/components/dashboard/header"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { Dialog } from "@base-ui/react/dialog"
import { EditorialCalendar } from "@/components/cms/editorial-calendar"
import { navigateTo } from "@/lib/navigation"

export type CMSArticle = {
  id: number
  title: string
  category: string
  author: string
  status: "draft" | "submitted" | "approved" | "published" | "rejected"
  rejection_reason?: string
  updated_at: string
  views?: number
}

const initialArticles: CMSArticle[] = [
  {
    id: 1,
    title: "Introduction to Quantum Computing for High School Learners",
    category: "Science & Tech",
    author: "Jane ContentCreator",
    status: "submitted",
    updated_at: "2026-09-22",
  },
  {
    id: 2,
    title: "Interactive Mathematics: Solving Quadratic Equations Visually",
    category: "Mathematics",
    author: "Jane ContentCreator",
    status: "draft",
    updated_at: "2026-09-23",
  },
  {
    id: 3,
    title: "STEM Learning Milestones for 2026 - Official Parent Guide",
    category: "Announcement",
    author: "John ContentManager",
    status: "published",
    views: 1420,
    updated_at: "2026-09-18",
  },
  {
    id: 4,
    title: "Understanding Artificial Intelligence in Everyday Life",
    category: "Technology",
    author: "Alice Writer",
    status: "approved",
    updated_at: "2026-09-21",
  },
  {
    id: 5,
    title: "Physics Experiments You Can Try at Home with Everyday Materials",
    category: "Physics",
    author: "Jane ContentCreator",
    status: "rejected",
    rejection_reason: "Needs higher resolution diagram images and safer procedure guidelines.",
    updated_at: "2026-09-19",
  },
  {
    id: 6,
    title: "Space Exploration & Next-Gen Robotics in 2026",
    category: "Technology",
    author: "Alice Writer",
    status: "approved",
    updated_at: "2026-09-25",
  },
  {
    id: 7,
    title: "Monthly STEM Quiz Preparation & Challenge Pack",
    category: "Science & Tech",
    author: "Jane ContentCreator",
    status: "draft",
    updated_at: "2026-09-28",
  },
]

type CMSTab = "all" | "reviews" | "published" | "calendar"

export function CMSPage() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const getTabFromPath = (path: string): CMSTab => {
    if (path === "/cms/calendar") return "calendar"
    if (path === "/cms/approvals") return "reviews"
    if (path === "/cms/published") return "published"
    return "all"
  }

  const [activeTab, setActiveTab] = useState<CMSTab>(() =>
    getTabFromPath(window.location.pathname)
  )

  useEffect(() => {
    const handleNav = () => {
      setActiveTab(getTabFromPath(window.location.pathname))
    }
    window.addEventListener("popstate", handleNav)
    window.addEventListener("jl:navigate", handleNav)
    return () => {
      window.removeEventListener("popstate", handleNav)
      window.removeEventListener("jl:navigate", handleNav)
    }
  }, [])

  const handleTabChange = (tab: CMSTab) => {
    setActiveTab(tab)
    if (tab === "calendar") navigateTo("/cms/calendar")
    else if (tab === "reviews") navigateTo("/cms/approvals")
    else if (tab === "published") navigateTo("/cms/published")
    else navigateTo("/cms")
  }
  const [articles, setArticles] = useState<CMSArticle[]>(initialArticles)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [selectedArticleId, setSelectedArticleId] = useState<number | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const { toast } = useToast()

  // Stored User Info
  const userString = sessionStorage.getItem("admin-user")
  const currentUser = userString ? JSON.parse(userString) : null
  const isManagerOrAdmin = currentUser?.is_superuser || currentUser?.role === "content_manager"

  // Counts
  const totalCount = articles.length
  const draftCount = articles.filter((a) => a.status === "draft").length
  const submittedCount = articles.filter((a) => a.status === "submitted").length
  const publishedCount = articles.filter((a) => a.status === "published").length

  // Filtered List
  const filteredArticles = articles.filter((article) => {
    if (activeTab === "reviews" && article.status !== "submitted") return false
    if (activeTab === "published" && article.status !== "published") return false

    if (statusFilter !== "all" && article.status !== statusFilter) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      return (
        article.title.toLowerCase().includes(q) ||
        article.category.toLowerCase().includes(q) ||
        article.author.toLowerCase().includes(q)
      )
    }
    return true
  })

  // Action Handlers
  const handleCreateArticle = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const newArt: CMSArticle = {
      id: Date.now(),
      title: String(form.get("title")),
      category: String(form.get("category")),
      author: currentUser?.email ? currentUser.email.split("@")[0] : "Content Creator",
      status: "draft",
      updated_at: new Date().toISOString().split("T")[0],
    }
    setArticles([newArt, ...articles])
    setCreateDialogOpen(false)
    toast("Draft article created successfully!")
  }

  const handleSubmitForReview = (id: number) => {
    setArticles(
      articles.map((a) => (a.id === id ? { ...a, status: "submitted" as const } : a))
    )
    toast("Article submitted for review.")
  }

  const handleApprove = (id: number) => {
    setArticles(
      articles.map((a) => (a.id === id ? { ...a, status: "approved" as const } : a))
    )
    toast("Article approved.")
  }

  const handlePublish = (id: number) => {
    setArticles(
      articles.map((a) => (a.id === id ? { ...a, status: "published" as const, views: 0 } : a))
    )
    toast("Article published live.")
  }

  const handleUnpublish = (id: number) => {
    setArticles(
      articles.map((a) => (a.id === id ? { ...a, status: "draft" as const } : a))
    )
    toast("Article moved back to drafts.")
  }

  const handleOpenReject = (id: number) => {
    setSelectedArticleId(id)
    setRejectionReason("")
    setRejectDialogOpen(true)
  }

  const handleConfirmReject = () => {
    if (!selectedArticleId) return
    setArticles(
      articles.map((a) =>
        a.id === selectedArticleId
          ? { ...a, status: "rejected" as const, rejection_reason: rejectionReason || "Needs revisions." }
          : a
      )
    )
    setRejectDialogOpen(false)
    toast("Article rejected.", "error")
  }

  const getStatusBadge = (status: CMSArticle["status"]) => {
    switch (status) {
      case "draft":
        return <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-2.5 py-0.5 text-xs font-medium text-slate-800 dark:text-slate-200">Draft</span>
      case "submitted":
        return <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-700 px-2.5 py-0.5 text-xs font-semibold text-amber-900 dark:text-amber-200">Pending Review</span>
      case "approved":
        return <span className="inline-flex items-center gap-1 rounded-md bg-blue-100 dark:bg-blue-950/70 border border-blue-300 dark:border-blue-700 px-2.5 py-0.5 text-xs font-semibold text-blue-900 dark:text-blue-200">Approved</span>
      case "published":
        return <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-700 px-2.5 py-0.5 text-xs font-semibold text-emerald-900 dark:text-emerald-200">Published</span>
      case "rejected":
        return <span className="inline-flex items-center gap-1 rounded-md bg-rose-100 dark:bg-rose-950/70 border border-rose-300 dark:border-rose-700 px-2.5 py-0.5 text-xs font-semibold text-rose-900 dark:text-rose-200">Rejected</span>
    }
  }

  return (
    <div className="flex min-h-svh">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((value) => !value)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header title={activeTab === "calendar" ? "Editorial Calendar" : "Content management"} onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 p-4 sm:p-7">
          <div className="mx-auto max-w-7xl">
            {/* Top Bar Header & Stat Cards (only for non-calendar tabs) */}
            {activeTab !== "calendar" && (
              <>
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-semibold">Content management</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Create, review, approve, and publish content.</p>
                  </div>
                  <Dialog.Root open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                    <Dialog.Trigger render={<Button><Plus />Create article</Button>} />
                    <Dialog.Portal>
                      <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50 animate-in fade-in duration-200" />
                      <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <Dialog.Popup className="w-full max-w-md rounded-xl border bg-card p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
                          <Dialog.Title className="text-lg font-semibold">Create content draft</Dialog.Title>
                          <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                            Draft a new educational article or announcement.
                          </Dialog.Description>
                          <form className="mt-6 space-y-4" onSubmit={handleCreateArticle}>
                            <label className="block text-sm font-medium">
                              Article Title
                              <input
                                required
                                name="title"
                                type="text"
                                placeholder="e.g. Physics Principles Explained"
                                className="mt-2 h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-primary"
                              />
                            </label>

                            <label className="block text-sm font-medium">
                              Category
                              <select
                                name="category"
                                className="mt-2 h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-primary"
                              >
                                <option value="Science & Tech">Science & Tech</option>
                                <option value="Mathematics">Mathematics</option>
                                <option value="Physics">Physics</option>
                                <option value="Technology">Technology</option>
                                <option value="Announcement">Announcement</option>
                              </select>
                            </label>

                            <label className="block text-sm font-medium">
                              Content Outline
                              <textarea
                                rows={3}
                                name="body"
                                placeholder="Write draft content..."
                                className="mt-2 w-full rounded-lg border bg-background p-3 text-sm outline-none focus:border-primary"
                              />
                            </label>

                            <div className="flex justify-end gap-2 pt-2">
                              <Dialog.Close render={<Button type="button" variant="outline">Cancel</Button>} />
                              <Button type="submit">Save draft</Button>
                            </div>
                          </form>
                        </Dialog.Popup>
                      </Dialog.Viewport>
                    </Dialog.Portal>
                  </Dialog.Root>
                </div>

                {/* Stat Cards */}
                <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
                  <div className="rounded-xl border bg-card p-5 shadow-xs">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total content</p>
                    <p className="mt-2 text-2xl font-bold">{totalCount}</p>
                  </div>
                  <div className="rounded-xl border bg-card p-5 shadow-xs">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Drafts</p>
                    <p className="mt-2 text-2xl font-bold">{draftCount}</p>
                  </div>
                  <div className="rounded-xl border bg-card p-5 shadow-xs">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pending review</p>
                    <p className="mt-2 text-2xl font-bold text-amber-700 dark:text-amber-400">{submittedCount}</p>
                  </div>
                  <div className="rounded-xl border bg-card p-5 shadow-xs">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Published</p>
                    <p className="mt-2 text-2xl font-bold text-emerald-700 dark:text-emerald-400">{publishedCount}</p>
                  </div>
                </div>
              </>
            )}

            {/* Tabs & Search */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant={activeTab === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleTabChange("all")}
                >
                  All articles ({articles.length})
                </Button>
                <Button
                  variant={activeTab === "reviews" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleTabChange("reviews")}
                >
                  Pending review ({submittedCount})
                </Button>
                <Button
                  variant={activeTab === "published" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleTabChange("published")}
                >
                  Published ({publishedCount})
                </Button>
                <Button
                  variant={activeTab === "calendar" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleTabChange("calendar")}
                  className="gap-1.5"
                >
                  <Calendar className="size-3.5" />
                  Calendar
                </Button>
              </div>

              {activeTab !== "calendar" && (
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search articles..."
                      className="h-9 w-52 rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary md:w-64"
                    />
                  </div>

                  {activeTab === "all" && (
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="h-9 rounded-lg border bg-background px-3 text-sm outline-none focus:border-primary"
                    >
                      <option value="all">All statuses</option>
                      <option value="draft">Drafts</option>
                      <option value="submitted">Submitted</option>
                      <option value="approved">Approved</option>
                      <option value="published">Published</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  )}
                </div>
              )}
            </div>

            {activeTab === "calendar" ? (
              <EditorialCalendar
                articles={articles}
                onAddArticle={(newArt) => {
                  setArticles([newArt, ...articles])
                  toast("Content scheduled to calendar successfully!")
                }}
                onApprove={handleApprove}
                onPublish={handlePublish}
                onOpenReject={handleOpenReject}
                isManagerOrAdmin={isManagerOrAdmin}
              />
            ) : (
              /* Articles Table */
              <div className="overflow-hidden rounded-xl border bg-card">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px] text-left text-sm">
                    <thead className="border-b bg-muted/50 text-muted-foreground">
                      <tr>
                        <th className="px-5 py-3 font-medium">Article & category</th>
                        <th className="px-5 py-3 font-medium">Author</th>
                        <th className="px-5 py-3 font-medium">Status</th>
                        <th className="px-5 py-3 font-medium">Updated</th>
                        <th className="px-5 py-3 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredArticles.map((article) => (
                        <tr key={article.id} className="border-b last:border-0">
                          <td className="px-5 py-4">
                            <div className="font-medium">{article.title}</div>
                            <div className="mt-1 text-xs text-muted-foreground">
                              {article.category}
                              {article.views !== undefined && ` • ${article.views} views`}
                            </div>
                            {article.rejection_reason && (
                              <div className="mt-1 text-xs text-destructive">
                                Reason: {article.rejection_reason}
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-4 text-muted-foreground">{article.author}</td>
                          <td className="px-5 py-4">{getStatusBadge(article.status)}</td>
                          <td className="px-5 py-4 text-muted-foreground">{article.updated_at}</td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {(article.status === "draft" || article.status === "rejected") && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleSubmitForReview(article.id)}
                                >
                                  Submit
                                </Button>
                              )}

                              {article.status === "submitted" && isManagerOrAdmin && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => handleApprove(article.id)}
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleOpenReject(article.id)}
                                  >
                                    Reject
                                  </Button>
                                </>
                              )}

                              {(article.status === "approved" || (article.status === "submitted" && isManagerOrAdmin)) && (
                                <Button
                                  size="sm"
                                  onClick={() => handlePublish(article.id)}
                                >
                                  Publish
                                </Button>
                              )}

                              {article.status === "published" && isManagerOrAdmin && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleUnpublish(article.id)}
                                >
                                  Unpublish
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}

                      {filteredArticles.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">
                            No content items found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Reject Modal */}
      <Dialog.Root open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50 animate-in fade-in duration-200" />
          <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <Dialog.Popup className="w-full max-w-md rounded-xl border bg-card p-6 shadow-xl">
              <Dialog.Title className="text-lg font-semibold">Reject submission</Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                Provide feedback to the author explaining why this submission was rejected.
              </Dialog.Description>

              <div className="mt-4">
                <label className="block text-sm font-medium">
                  Rejection feedback
                  <textarea
                    rows={3}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Enter rejection notes..."
                    className="mt-2 w-full rounded-lg border bg-background p-3 text-sm outline-none focus:border-primary"
                  />
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Dialog.Close render={<Button type="button" variant="outline">Cancel</Button>} />
                <Button variant="destructive" onClick={handleConfirmReject}>
                  Reject
                </Button>
              </div>
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>

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
