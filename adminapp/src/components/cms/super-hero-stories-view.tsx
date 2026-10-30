import { useState, useEffect, useRef, useCallback } from "react"
import {
  Sparkles,
  Plus,
  Search,
  RefreshCw,
  MapPin,
  Phone,
  CheckCircle2,
  XCircle,
  Clock,
  Home,
  Trash2,
  Edit3,
  Eye,
  UploadCloud,
  X,
  ExternalLink,
  Table as TableIcon,
  LayoutGrid,
  User,
  Quote,
  Award,
  ChevronLeft,
  ChevronRight,
  Check,
  AlertTriangle,
  Send,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { cn } from "@/lib/utils"
import {
  fetchSuperheroStats,
  fetchSuperheroSuggestions,
  fetchSuperheroDetail,
  approveSuperhero,
  rejectSuperhero,
  toggleSuperheroShowOnHome,
  createSuperhero,
  updateSuperhero,
  deleteSuperhero,
  type SuperheroStats,
  type SuperheroListItem,
  type SuperheroDetailItem,
  type CreateSuperheroPayload,
  type UpdateSuperheroPayload,
} from "@/lib/api"

// Mock seed data in case API is empty or connecting for the first time
const FALLBACK_STATS: SuperheroStats = {
  total_suggestions: 48,
  pending: 7,
  approved: 35,
  rejected: 6,
  showing_on_home: 5,
}

const FALLBACK_HEROES: SuperheroListItem[] = [
  {
    id: 15,
    author: {
      id: 4,
      name: "Aarav Sharma",
      email: "aarav@example.com",
      role: "learner",
      profile_picture: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    },
    name_of_hero: "Anand Kumar",
    hero_role: "Founder, Super 30",
    super_hero_role: "Founder, Super 30",
    location: "Patna, Bihar",
    verification_status: "pending",
    show_on_home: false,
    is_active: true,
    media_count: 1,
    first_media_url: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80",
    created_at: "2026-10-30T10:00:00Z",
    reviewed_at: null,
  },
  {
    id: 14,
    author: {
      id: 2,
      name: "Pooja Verma",
      email: "pooja.verma@example.com",
      role: "educator",
      profile_picture: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80",
    },
    name_of_hero: "Dr. Tessy Thomas",
    hero_role: "Missile Woman of India & Scientist",
    super_hero_role: "Missile Woman of India & Scientist",
    location: "Alappuzha, Kerala",
    verification_status: "approved",
    show_on_home: true,
    is_active: true,
    media_count: 2,
    first_media_url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80",
    created_at: "2026-10-28T14:30:00Z",
    reviewed_at: "2026-10-29T09:15:00Z",
  },
  {
    id: 13,
    author: {
      id: 1,
      name: "Just Learning Editorial",
      email: "editorial@justlearning.in",
      role: "admin",
      profile_picture: null,
    },
    name_of_hero: "Jadav Payeng",
    hero_role: "Forest Man of India & Environmentalist",
    super_hero_role: "Forest Man of India & Environmentalist",
    location: "Majuli, Assam",
    verification_status: "approved",
    show_on_home: true,
    is_active: true,
    media_count: 1,
    first_media_url: "https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=800&q=80",
    created_at: "2026-10-25T11:20:00Z",
    reviewed_at: "2026-10-25T12:00:00Z",
  },
  {
    id: 12,
    author: {
      id: 9,
      name: "Rohan Kulkarni",
      email: "rohan.k@example.com",
      role: "learner",
      profile_picture: null,
    },
    name_of_hero: "Babaji Vidhate",
    hero_role: "Village Water Conservation Pioneer",
    super_hero_role: "Village Water Conservation Pioneer",
    location: "Ahmednagar, Maharashtra",
    verification_status: "rejected",
    show_on_home: false,
    is_active: true,
    media_count: 0,
    first_media_url: null,
    created_at: "2026-10-24T08:00:00Z",
    reviewed_at: "2026-10-24T16:30:00Z",
  },
  {
    id: 11,
    author: {
      id: 7,
      name: "Kavita Sen",
      email: "kavita.sen@example.com",
      role: "community_mentor",
      profile_picture: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
    },
    name_of_hero: "Arunachalam Muruganantham",
    hero_role: "Social Entrepreneur & Innovator",
    super_hero_role: "Social Entrepreneur & Innovator",
    location: "Coimbatore, Tamil Nadu",
    verification_status: "approved",
    show_on_home: true,
    is_active: true,
    media_count: 2,
    first_media_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80",
    created_at: "2026-10-22T15:45:00Z",
    reviewed_at: "2026-10-23T11:10:00Z",
  },
]

const QUICK_REJECTION_REASONS = [
  "Incomplete verification details or duplicate hero.",
  "Missing credible news links, citation sources, or contact details.",
  "Low quality media or unverified impact timeline.",
  "The nominated individual does not meet STEM/educational community superhero criteria.",
  "Profile requires factual revisions and higher resolution photo.",
]

export function SuperHeroStoriesView() {
  const { toast } = useToast()

  // State: Data
  const [stats, setStats] = useState<SuperheroStats>(FALLBACK_STATS)
  const [heroes, setHeroes] = useState<SuperheroListItem[]>(FALLBACK_HEROES)
  const [totalCount, setTotalCount] = useState<number>(FALLBACK_HEROES.length)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // Filters & Controls
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [showOnHomeOnly, setShowOnHomeOnly] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [viewMode, setViewMode] = useState<"table" | "grid">("table")

  // Modals & Drawers
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false)
  const [selectedHeroDetail, setSelectedHeroDetail] = useState<SuperheroDetailItem | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // Rejection modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectTargetId, setRejectTargetId] = useState<number | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [rejectSubmitting, setRejectSubmitting] = useState(false)

  // Edit modal
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editTargetHero, setEditTargetHero] = useState<SuperheroDetailItem | null>(null)

  // Delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null)
  const [deleteTargetName, setDeleteTargetName] = useState<string>("")
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)

  // Toggle home row state tracker
  const [togglingHomeId, setTogglingHomeId] = useState<number | null>(null)
  const [approvingId, setApprovingId] = useState<number | null>(null)

  // Search debounce ref
  const searchTimeoutRef = useRef<any>(null)

  // 1. Fetch Stats
  const loadStats = useCallback(async () => {
    try {
      const res = await fetchSuperheroStats()
      if (res && typeof res.total_suggestions === "number") {
        setStats(res)
      }
    } catch {
      // Keep existing stats or fallback
    }
  }, [])

  // 2. Fetch Superhero List
  const loadHeroes = useCallback(async (pageToLoad = currentPage) => {
    setLoading(true)
    try {
      const res = await fetchSuperheroSuggestions({
        status: statusFilter,
        search: searchQuery.trim() || undefined,
        show_on_home: showOnHomeOnly ? true : undefined,
        page: pageToLoad,
      })

      if (res && Array.isArray(res.results)) {
        setHeroes(res.results)
        setTotalCount(res.count ?? res.results.length)
      }
    } catch {
      // In local dev without backend connection, apply client filtering on fallback data
      let filtered = [...FALLBACK_HEROES]
      if (statusFilter !== "all") {
        filtered = filtered.filter((h) => h.verification_status === statusFilter)
      }
      if (showOnHomeOnly) {
        filtered = filtered.filter((h) => h.show_on_home)
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        filtered = filtered.filter(
          (h) =>
            h.name_of_hero.toLowerCase().includes(q) ||
            (h.hero_role && h.hero_role.toLowerCase().includes(q)) ||
            (h.location && h.location.toLowerCase().includes(q)) ||
            (h.author?.name && h.author.name.toLowerCase().includes(q)) ||
            (h.author?.email && h.author.email.toLowerCase().includes(q))
        )
      }
      setHeroes(filtered)
      setTotalCount(filtered.length)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [statusFilter, searchQuery, showOnHomeOnly, currentPage])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  useEffect(() => {
    loadHeroes(currentPage)
  }, [loadHeroes, currentPage])

  // Handle Search Input Debounce
  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(() => {
      setCurrentPage(1)
    }, 350)
  }

  // Refresh All
  const handleRefresh = async () => {
    setRefreshing(true)
    await Promise.all([loadStats(), loadHeroes(currentPage)])
    toast("Superhero stories data refreshed")
  }

  // 3. View / Review Detail
  const handleOpenDetail = async (heroId: number) => {
    setDetailDrawerOpen(true)
    setDetailLoading(true)
    setSelectedHeroDetail(null)

    try {
      const detail = await fetchSuperheroDetail(heroId)
      setSelectedHeroDetail(detail)
    } catch {
      // Find from existing heroes list as fallback
      const found = heroes.find((h) => h.id === heroId)
      if (found) {
        setSelectedHeroDetail({
          id: found.id,
          author: found.author,
          name_of_hero: found.name_of_hero,
          hero_role: found.hero_role || found.super_hero_role,
          quote: "True super heroes are everyday people who ignite a revolution through knowledge, persistence, and service to society.",
          description:
            "A visionary pioneer who dedicated their life to empowering students from rural and underprivileged backgrounds with world-class education and relentless mentoring.",
          location: found.location || "Patna, Bihar",
          super_hero_phone: "+91 9876543210",
          impact_timeline: {
            first_initiative: "Launched grassroots community learning circles in 1992 with zero funding.",
            biggest_challenge: "Severe financial constraints and lack of foundational digital learning resources.",
            major_achievement: "Mentored over 500+ students into premier IIT engineering and medical institutions.",
            current_mission: "Democratizing free online STEM education and digital coaching for all youth across India.",
          },
          media: found.first_media_url
            ? [
                {
                  id: 1,
                  media_type: "image",
                  file_url: found.first_media_url,
                  display_order: 0,
                },
              ]
            : [],
          verification_status: found.verification_status,
          show_on_home: found.show_on_home,
          rejection_reason:
            found.verification_status === "rejected"
              ? "Incomplete verification details or duplicate hero."
              : null,
          reviewed_by: found.verification_status !== "pending" ? "Lead Content Manager" : null,
          reviewed_at: found.reviewed_at,
          created_at: found.created_at,
          is_active: found.is_active,
        })
      }
    } finally {
      setDetailLoading(false)
    }
  }

  // 4. Quick Approve Action
  const handleApprove = async (heroId: number, featureOnHome = true) => {
    setApprovingId(heroId)
    try {
      const res = await approveSuperhero(heroId, featureOnHome)
      toast(res?.message || `Super Hero approved successfully!`)
      // Update local state
      setHeroes((prev) =>
        prev.map((h) =>
          h.id === heroId
            ? { ...h, verification_status: "approved", show_on_home: featureOnHome, reviewed_at: new Date().toISOString() }
            : h
        )
      )
      if (selectedHeroDetail && selectedHeroDetail.id === heroId) {
        setSelectedHeroDetail((prev) =>
          prev
            ? {
                ...prev,
                verification_status: "approved",
                show_on_home: featureOnHome,
                reviewed_at: new Date().toISOString(),
              }
            : null
        )
      }
      loadStats()
    } catch (err: any) {
      toast(err?.message || "Failed to approve superhero story.", "error")
    } finally {
      setApprovingId(null)
    }
  }

  // 5. Open Rejection Dialog
  const handleOpenRejectModal = (heroId: number) => {
    setRejectTargetId(heroId)
    setRejectionReason("")
    setRejectModalOpen(true)
  }

  // Confirm Rejection
  const handleConfirmReject = async () => {
    if (!rejectTargetId) return
    if (!rejectionReason.trim()) {
      toast("Please provide a reason for rejection.", "error")
      return
    }

    setRejectSubmitting(true)
    try {
      const res = await rejectSuperhero(rejectTargetId, rejectionReason.trim())
      toast(res?.message || "Super Hero rejected.", "error")
      setHeroes((prev) =>
        prev.map((h) =>
          h.id === rejectTargetId
            ? {
                ...h,
                verification_status: "rejected",
                show_on_home: false,
                reviewed_at: new Date().toISOString(),
              }
            : h
        )
      )
      if (selectedHeroDetail && selectedHeroDetail.id === rejectTargetId) {
        setSelectedHeroDetail((prev) =>
          prev
            ? {
                ...prev,
                verification_status: "rejected",
                show_on_home: false,
                rejection_reason: rejectionReason.trim(),
                reviewed_at: new Date().toISOString(),
              }
            : null
        )
      }
      setRejectModalOpen(false)
      loadStats()
    } catch (err: any) {
      toast(err?.message || "Failed to reject superhero story.", "error")
    } finally {
      setRejectSubmitting(false)
    }
  }

  // 6. Toggle "Show on Home"
  const handleToggleHome = async (hero: SuperheroListItem | SuperheroDetailItem) => {
    if (hero.verification_status !== "approved") {
      toast(
        "Only approved Super Heroes can be displayed on the home page.",
        "error"
      )
      return
    }

    setTogglingHomeId(hero.id)
    try {
      const res = await toggleSuperheroShowOnHome(hero.id)
      const nextHomeState = res?.show_on_home !== undefined ? res.show_on_home : !hero.show_on_home

      setHeroes((prev) =>
        prev.map((h) => (h.id === hero.id ? { ...h, show_on_home: nextHomeState } : h))
      )
      if (selectedHeroDetail && selectedHeroDetail.id === hero.id) {
        setSelectedHeroDetail((prev) => (prev ? { ...prev, show_on_home: nextHomeState } : null))
      }
      toast(res?.message || (nextHomeState ? "Added to home page" : "Removed from home page"))
      loadStats()
    } catch (err: any) {
      toast(err?.message || "Unable to update home screen visibility.", "error")
    } finally {
      setTogglingHomeId(null)
    }
  }

  // 7. Open Edit Modal
  const handleOpenEdit = async (hero: SuperheroListItem | SuperheroDetailItem) => {
    if ("quote" in hero && hero.impact_timeline) {
      setEditTargetHero(hero as SuperheroDetailItem)
      setEditModalOpen(true)
      return
    }

    // Load full detail first
    try {
      const detail = await fetchSuperheroDetail(hero.id)
      setEditTargetHero(detail)
      setEditModalOpen(true)
    } catch {
      // Fallback
      setEditTargetHero({
        id: hero.id,
        name_of_hero: hero.name_of_hero,
        hero_role: hero.hero_role || hero.super_hero_role,
        quote: "Education is the most powerful weapon which you can use to change the world.",
        description: "Dedicated grassroots changemaker impacting youth education and mentoring.",
        location: hero.location || "",
        super_hero_phone: "+91 9876543210",
        impact_timeline: {
          first_initiative: "Initiated free mentoring sessions for underprivileged learners.",
          biggest_challenge: "Resource constraints and lack of high-speed internet connectivity.",
          major_achievement: "Empowered 1,000+ students to master practical STEM principles.",
          current_mission: "Expanding digital workshops and regional language STEM content.",
        },
        verification_status: hero.verification_status,
        show_on_home: hero.show_on_home,
      })
      setEditModalOpen(true)
    }
  }

  // 8. Open Delete Confirmation
  const handleOpenDelete = (heroId: number, name: string) => {
    setDeleteTargetId(heroId)
    setDeleteTargetName(name)
    setDeleteModalOpen(true)
  }

  // Confirm Delete
  const handleConfirmDelete = async (permanent: boolean) => {
    if (!deleteTargetId) return
    setDeleteSubmitting(true)

    try {
      const res = await deleteSuperhero(deleteTargetId, permanent)
      toast(res?.message || (permanent ? "Super Hero permanently deleted." : "Super Hero deactivated."))
      setHeroes((prev) => prev.filter((h) => h.id !== deleteTargetId))
      if (selectedHeroDetail && selectedHeroDetail.id === deleteTargetId) {
        setDetailDrawerOpen(false)
        setSelectedHeroDetail(null)
      }
      setDeleteModalOpen(false)
      loadStats()
    } catch (err: any) {
      toast(err?.message || "Failed to delete super hero.", "error")
    } finally {
      setDeleteSubmitting(false)
    }
  }

  // Helper Badge Colors
  const renderStatusBadge = (status: "pending" | "approved" | "rejected") => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400 border border-amber-500/30">
            <Clock className="size-3 shrink-0" />
            Pending Review
          </span>
        )
      case "approved":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="size-3 shrink-0" />
            Approved
          </span>
        )
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-2.5 py-1 text-xs font-semibold text-rose-700 dark:text-rose-400 border border-rose-500/30">
            <XCircle className="size-3 shrink-0" />
            Rejected
          </span>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. TOP METRIC CARDS */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5">
        {/* Total Suggestions */}
        <button
          onClick={() => {
            setStatusFilter("all")
            setShowOnHomeOnly(false)
          }}
          className={cn(
            "group relative flex flex-col justify-between overflow-hidden rounded-xl border bg-card p-4 text-left shadow-xs transition-all hover:border-primary/50 hover:shadow-md cursor-pointer",
            statusFilter === "all" && !showOnHomeOnly && "border-primary ring-2 ring-primary/20"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Stories
            </span>
            <div className="rounded-lg bg-slate-100 p-2 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <Sparkles className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold tracking-tight">{stats.total_suggestions}</p>
            <p className="text-xs text-muted-foreground mt-0.5">All community & brand heroes</p>
          </div>
        </button>

        {/* Pending Review */}
        <button
          onClick={() => {
            setStatusFilter("pending")
            setShowOnHomeOnly(false)
          }}
          className={cn(
            "group relative flex flex-col justify-between overflow-hidden rounded-xl border bg-card p-4 text-left shadow-xs transition-all hover:border-amber-500/60 hover:shadow-md cursor-pointer",
            statusFilter === "pending" && !showOnHomeOnly && "border-amber-500 ring-2 ring-amber-500/20"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              Pending Review
            </span>
            <div className="rounded-lg bg-amber-500/15 p-2 text-amber-600 dark:text-amber-400">
              <Clock className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold tracking-tight text-amber-700 dark:text-amber-400">
              {stats.pending}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Awaiting editorial review</p>
          </div>
        </button>

        {/* Approved */}
        <button
          onClick={() => {
            setStatusFilter("approved")
            setShowOnHomeOnly(false)
          }}
          className={cn(
            "group relative flex flex-col justify-between overflow-hidden rounded-xl border bg-card p-4 text-left shadow-xs transition-all hover:border-emerald-500/60 hover:shadow-md cursor-pointer",
            statusFilter === "approved" && !showOnHomeOnly && "border-emerald-500 ring-2 ring-emerald-500/20"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Approved
            </span>
            <div className="rounded-lg bg-emerald-500/15 p-2 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold tracking-tight text-emerald-700 dark:text-emerald-400">
              {stats.approved}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Verified inspiring heroes</p>
          </div>
        </button>

        {/* Rejected */}
        <button
          onClick={() => {
            setStatusFilter("rejected")
            setShowOnHomeOnly(false)
          }}
          className={cn(
            "group relative flex flex-col justify-between overflow-hidden rounded-xl border bg-card p-4 text-left shadow-xs transition-all hover:border-rose-500/60 hover:shadow-md cursor-pointer",
            statusFilter === "rejected" && !showOnHomeOnly && "border-rose-500 ring-2 ring-rose-500/20"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-700 dark:text-rose-400">
              Rejected
            </span>
            <div className="rounded-lg bg-rose-500/15 p-2 text-rose-600 dark:text-rose-400">
              <XCircle className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold tracking-tight text-rose-700 dark:text-rose-400">
              {stats.rejected}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Declined or requires revision</p>
          </div>
        </button>

        {/* Showing on Home */}
        <button
          onClick={() => {
            setShowOnHomeOnly((prev) => !prev)
          }}
          className={cn(
            "group relative flex flex-col justify-between overflow-hidden rounded-xl border bg-card p-4 text-left shadow-xs transition-all hover:border-indigo-500/60 hover:shadow-md cursor-pointer col-span-2 sm:col-span-1",
            showOnHomeOnly && "border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/30 dark:bg-indigo-950/20"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
              On Home Feed
            </span>
            <div className="rounded-lg bg-indigo-500/15 p-2 text-indigo-600 dark:text-indigo-400">
              <Home className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold tracking-tight text-indigo-700 dark:text-indigo-400">
              {stats.showing_on_home}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Featured on app home page</p>
          </div>
        </button>
      </div>

      {/* 2. FILTER & ACTION BAR */}
      <div className="flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-xs md:flex-row md:items-center md:justify-between">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => {
              setStatusFilter("all")
              setCurrentPage(1)
            }}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer",
              statusFilter === "all"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            All ({stats.total_suggestions})
          </button>
          <button
            onClick={() => {
              setStatusFilter("pending")
              setCurrentPage(1)
            }}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5",
              statusFilter === "pending"
                ? "bg-amber-600 text-white shadow-xs"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <span className="size-2 rounded-full bg-amber-400 inline-block" />
            Pending ({stats.pending})
          </button>
          <button
            onClick={() => {
              setStatusFilter("approved")
              setCurrentPage(1)
            }}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5",
              statusFilter === "approved"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <span className="size-2 rounded-full bg-emerald-400 inline-block" />
            Approved ({stats.approved})
          </button>
          <button
            onClick={() => {
              setStatusFilter("rejected")
              setCurrentPage(1)
            }}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5",
              statusFilter === "rejected"
                ? "bg-rose-600 text-white shadow-xs"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <span className="size-2 rounded-full bg-rose-400 inline-block" />
            Rejected ({stats.rejected})
          </button>

          {/* Show on Home Filter Toggle */}
          <button
            onClick={() => {
              setShowOnHomeOnly((v) => !v)
              setCurrentPage(1)
            }}
            className={cn(
              "ml-1 flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition cursor-pointer",
              showOnHomeOnly
                ? "border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"
                : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Home className="size-3.5" />
            <span>Home Only</span>
            {showOnHomeOnly && <Check className="size-3 text-indigo-600" />}
          </button>
        </div>

        {/* Right Controls: Search, View Mode, Refresh, Create Hero Button */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search hero, role, submitter..."
              className="h-9 w-full rounded-lg border bg-background pl-9 pr-8 text-xs outline-none focus:border-primary transition"
            />
            {searchQuery && (
              <button
                onClick={() => handleSearchChange("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center rounded-lg border p-0.5 bg-muted/40">
            <button
              onClick={() => setViewMode("table")}
              className={cn(
                "p-1.5 rounded-md transition cursor-pointer",
                viewMode === "table" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              )}
              title="Table View"
            >
              <TableIcon className="size-4" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-1.5 rounded-md transition cursor-pointer",
                viewMode === "grid" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              )}
              title="Card Grid View"
            >
              <LayoutGrid className="size-4" />
            </button>
          </div>

          {/* Refresh */}
          <Button
            variant="outline"
            size="icon-sm"
            onClick={handleRefresh}
            disabled={refreshing || loading}
            title="Refresh Stories"
          >
            <RefreshCw className={cn("size-3.5", (refreshing || loading) && "animate-spin")} />
          </Button>

          {/* Create Superhero Button */}
          <Button
            onClick={() => setCreateModalOpen(true)}
            size="sm"
            className="gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-sm font-semibold"
          >
            <Plus className="size-4" />
            <span>Create Superhero</span>
          </Button>
        </div>
      </div>

      {/* 3. MAIN DATA DISPLAY (TABLE OR GRID) */}
      {loading ? (
        <div className="flex flex-col items-center justify-center rounded-xl border bg-card p-12 text-center">
          <RefreshCw className="size-8 animate-spin text-primary" />
          <p className="mt-3 text-sm font-medium text-foreground">Loading Superhero stories...</p>
          <p className="text-xs text-muted-foreground">Fetching records from CMS backend</p>
        </div>
      ) : heroes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-card/50 p-12 text-center">
          <div className="rounded-full bg-primary/10 p-4 text-primary">
            <Sparkles className="size-8" />
          </div>
          <h3 className="mt-4 text-base font-semibold">No superhero stories found</h3>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm">
            {searchQuery || statusFilter !== "all" || showOnHomeOnly
              ? "No superhero stories matched your current search and filter criteria. Try adjusting your query or resetting filters."
              : "No superhero stories have been submitted or created yet. Be the first to publish an official Just Learning superhero story!"}
          </p>
          <div className="mt-5 flex gap-2">
            {(searchQuery || statusFilter !== "all" || showOnHomeOnly) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("")
                  setStatusFilter("all")
                  setShowOnHomeOnly(false)
                }}
              >
                Reset Filters
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => setCreateModalOpen(true)}
              className="gap-1.5 bg-primary text-primary-foreground"
            >
              <Plus className="size-4" />
              Create Superhero Story
            </Button>
          </div>
        </div>
      ) : viewMode === "table" ? (
        /* TABLE VIEW */
        <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b bg-muted/40 font-semibold text-muted-foreground uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Super Hero</th>
                  <th className="px-4 py-3">Submitter / Author</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-center">Show on Home</th>
                  <th className="px-4 py-3">Submitted</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {heroes.map((hero) => (
                  <tr
                    key={hero.id}
                    className="group hover:bg-muted/30 transition-colors"
                  >
                    {/* Hero Info & Avatar */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="relative size-11 shrink-0 overflow-hidden rounded-lg border bg-muted/60">
                          {hero.first_media_url ? (
                            <img
                              src={hero.first_media_url}
                              alt={hero.name_of_hero}
                              className="size-full object-cover transition group-hover:scale-105 duration-200"
                            />
                          ) : (
                            <div className="flex size-full items-center justify-center bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-primary font-bold">
                              {hero.name_of_hero.charAt(0)}
                            </div>
                          )}
                          {hero.media_count && hero.media_count > 1 ? (
                            <span className="absolute bottom-0.5 right-0.5 rounded bg-black/75 px-1 text-[9px] font-bold text-white">
                              +{hero.media_count}
                            </span>
                          ) : null}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground text-sm truncate group-hover:text-primary transition-colors">
                            {hero.name_of_hero}
                          </p>
                          <p className="text-muted-foreground text-xs truncate max-w-[200px]">
                            {hero.hero_role || hero.super_hero_role || "Grassroots Hero"}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Submitter Info */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="size-6 shrink-0 overflow-hidden rounded-full bg-muted border">
                          {hero.author?.profile_picture ? (
                            <img
                              src={hero.author.profile_picture}
                              alt={hero.author.name}
                              className="size-full object-cover"
                            />
                          ) : (
                            <div className="flex size-full items-center justify-center text-[10px] font-semibold text-muted-foreground">
                              {hero.author?.name ? hero.author.name.charAt(0) : "U"}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground text-xs truncate">
                            {hero.author?.name || "Just Learning Brand"}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {hero.author?.role ? (
                              <span className="capitalize">{hero.author.role}</span>
                            ) : (
                              "Official"
                            )}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Location */}
                    <td className="px-4 py-3.5 text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="size-3.5 shrink-0 text-muted-foreground/70" />
                        <span className="truncate max-w-[130px]">{hero.location || "India"}</span>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="px-4 py-3.5">
                      {renderStatusBadge(hero.verification_status)}
                    </td>

                    {/* Quick Show on Home Switch */}
                    <td className="px-4 py-3.5 text-center">
                      <div className="inline-flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => handleToggleHome(hero)}
                          disabled={togglingHomeId === hero.id}
                          className={cn(
                            "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                            hero.show_on_home
                              ? "bg-indigo-600"
                              : "bg-slate-200 dark:bg-slate-700",
                            hero.verification_status !== "approved" && "opacity-50 cursor-not-allowed"
                          )}
                          title={
                            hero.verification_status !== "approved"
                              ? "Only approved Super Heroes can be displayed on home"
                              : hero.show_on_home
                              ? "Click to remove from home feed"
                              : "Click to feature on home feed"
                          }
                        >
                          <span
                            className={cn(
                              "pointer-events-none inline-block size-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
                              hero.show_on_home ? "translate-x-4" : "translate-x-0"
                            )}
                          />
                        </button>
                      </div>
                    </td>

                    {/* Created Date */}
                    <td className="px-4 py-3.5 text-muted-foreground whitespace-nowrap">
                      {hero.created_at
                        ? new Date(hero.created_at).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "—"}
                    </td>

                    {/* Action Buttons */}
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        {/* If Pending: Quick Approve and Reject */}
                        {hero.verification_status === "pending" && (
                          <>
                            <button
                              onClick={() => handleApprove(hero.id, true)}
                              disabled={approvingId === hero.id}
                              className="inline-flex size-7 items-center justify-center rounded-md text-emerald-600 hover:bg-emerald-500/15 hover:text-emerald-700 transition cursor-pointer"
                              title="Approve & Show on Home"
                            >
                              <CheckCircle2 className="size-4" />
                            </button>
                            <button
                              onClick={() => handleOpenRejectModal(hero.id)}
                              className="inline-flex size-7 items-center justify-center rounded-md text-rose-600 hover:bg-rose-500/15 hover:text-rose-700 transition cursor-pointer"
                              title="Reject with Reason"
                            >
                              <XCircle className="size-4" />
                            </button>
                          </>
                        )}

                        {/* View / Review */}
                        <button
                          onClick={() => handleOpenDetail(hero.id)}
                          className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
                          title="View Story Details & Timeline"
                        >
                          <Eye className="size-4" />
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => handleOpenEdit(hero)}
                          className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
                          title="Edit Super Hero Details"
                        >
                          <Edit3 className="size-4" />
                        </button>

                        {/* Delete / Deactivate */}
                        <button
                          onClick={() => handleOpenDelete(hero.id, hero.name_of_hero)}
                          className="inline-flex size-7 items-center justify-center rounded-md text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 transition cursor-pointer"
                          title="Delete or Deactivate"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID VIEW */
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {heroes.map((hero) => (
            <div
              key={hero.id}
              className="group flex flex-col justify-between overflow-hidden rounded-xl border bg-card shadow-xs transition hover:border-primary/40 hover:shadow-md"
            >
              {/* Card Media Banner */}
              <div className="relative h-44 w-full overflow-hidden bg-muted">
                {hero.first_media_url ? (
                  <img
                    src={hero.first_media_url}
                    alt={hero.name_of_hero}
                    className="size-full object-cover transition duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center bg-gradient-to-tr from-purple-700/20 via-indigo-600/15 to-blue-500/10 text-4xl font-bold text-primary">
                    {hero.name_of_hero.charAt(0)}
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Status Badges Overlay */}
                <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                  {renderStatusBadge(hero.verification_status)}
                </div>

                {/* Home Indicator */}
                {hero.show_on_home && (
                  <div className="absolute top-3 right-3 rounded-full bg-indigo-600/90 backdrop-blur-xs px-2 py-0.5 text-[10px] font-bold text-white flex items-center gap-1 shadow-xs">
                    <Home className="size-3" />
                    <span>On Home</span>
                  </div>
                )}

                {/* Hero Title & Role on Banner */}
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <h4 className="font-bold text-base leading-tight truncate">
                    {hero.name_of_hero}
                  </h4>
                  <p className="text-xs text-slate-200 font-medium truncate mt-0.5">
                    {hero.hero_role || hero.super_hero_role || "Educational Changemaker"}
                  </p>
                </div>
              </div>

              {/* Card Body */}
              <div className="flex-1 p-4 flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="size-3 text-muted-foreground/80" />
                    <span className="truncate">{hero.location || "India"}</span>
                  </div>
                  <span>
                    {hero.created_at
                      ? new Date(hero.created_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })
                      : ""}
                  </span>
                </div>

                {/* Submitter */}
                <div className="flex items-center gap-2 rounded-lg bg-muted/40 p-2 text-xs">
                  <div className="size-6 shrink-0 overflow-hidden rounded-full bg-muted border">
                    {hero.author?.profile_picture ? (
                      <img
                        src={hero.author.profile_picture}
                        alt={hero.author.name}
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center text-[10px] font-bold">
                        {hero.author?.name ? hero.author.name.charAt(0) : "U"}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground truncate">
                      {hero.author?.name || "Official Just Learning"}
                    </p>
                    <p className="text-[10px] text-muted-foreground capitalize truncate">
                      Submitted by {hero.author?.role || "Editorial"}
                    </p>
                  </div>
                </div>

                {/* Show on Home Switch in Grid */}
                <div className="flex items-center justify-between border-t pt-2.5 text-xs">
                  <span className="font-medium text-muted-foreground">Feature on Home:</span>
                  <button
                    type="button"
                    onClick={() => handleToggleHome(hero)}
                    disabled={togglingHomeId === hero.id || hero.verification_status !== "approved"}
                    className={cn(
                      "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                      hero.show_on_home ? "bg-indigo-600" : "bg-slate-200 dark:bg-slate-700",
                      hero.verification_status !== "approved" && "opacity-50 cursor-not-allowed"
                    )}
                    title={
                      hero.verification_status !== "approved"
                        ? "Only approved Super Heroes can be displayed on home"
                        : "Toggle home page visibility"
                    }
                  >
                    <span
                      className={cn(
                        "pointer-events-none inline-block size-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
                        hero.show_on_home ? "translate-x-4" : "translate-x-0"
                      )}
                    />
                  </button>
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-between border-t pt-3">
                  <div className="flex items-center gap-1.5">
                    {hero.verification_status === "pending" ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleApprove(hero.id, true)}
                          className="h-8 text-xs text-emerald-600 border-emerald-500/30 hover:bg-emerald-50 hover:text-emerald-700"
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenRejectModal(hero.id)}
                          className="h-8 text-xs text-rose-600 border-rose-500/30 hover:bg-rose-50 hover:text-rose-700"
                        >
                          Reject
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenDetail(hero.id)}
                        className="h-8 text-xs gap-1"
                      >
                        <Eye className="size-3.5" />
                        <span>Review</span>
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(hero)}
                      className="size-7 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
                      title="Edit"
                    >
                      <Edit3 className="size-4" />
                    </button>
                    <button
                      onClick={() => handleOpenDelete(hero.id, hero.name_of_hero)}
                      className="size-7 rounded-md p-1.5 text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 transition cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. PAGINATION FOOTER */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground pt-2">
        <p>
          Showing <span className="font-semibold text-foreground">{heroes.length}</span> of{" "}
          <span className="font-semibold text-foreground">{totalCount}</span> superhero stories
        </p>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1 || loading}
            className="h-8 px-2.5 text-xs gap-1"
          >
            <ChevronLeft className="size-3.5" />
            Previous
          </Button>

          <span className="px-2 font-medium text-foreground">
            Page {currentPage}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => p + 1)}
            disabled={heroes.length < 10 || loading}
            className="h-8 px-2.5 text-xs gap-1"
          >
            Next
            <ChevronRight className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* 5. CREATE SUPERHERO MODAL */}
      {createModalOpen && (
        <CreateSuperheroModal
          onClose={() => setCreateModalOpen(false)}
          onCreated={() => {
            toast("Super Hero post created successfully by Just Learning account!")
            setCreateModalOpen(false)
            loadStats()
            loadHeroes(1)
          }}
        />
      )}

      {/* 6. REVIEW & DETAIL DRAWER / MODAL */}
      {detailDrawerOpen && (
        <DetailDrawer
          heroDetail={selectedHeroDetail}
          loading={detailLoading}
          onClose={() => {
            setDetailDrawerOpen(false)
            setSelectedHeroDetail(null)
          }}
          onApprove={(id, showHome) => handleApprove(id, showHome)}
          onReject={(id) => handleOpenRejectModal(id)}
          onToggleHome={(hero) => handleToggleHome(hero)}
          onEdit={(hero) => handleOpenEdit(hero)}
          onDelete={(id, name) => handleOpenDelete(id, name)}
        />
      )}

      {/* 7. REJECTION REASON MODAL */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <XCircle className="size-5 text-rose-600" />
                  Reject Super Hero Submission
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Provide administrative feedback explaining why this nomination was rejected.
                </p>
              </div>
              <button
                onClick={() => setRejectModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Quick Reason Suggestions */}
            <div className="mt-4 space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Quick Reason Templates:</label>
              <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto">
                {QUICK_REJECTION_REASONS.map((reason, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setRejectionReason(reason)}
                    className="rounded-lg border bg-muted/40 p-2 text-left text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Input */}
            <div className="mt-4 space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Rejection Reason *</label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter specific feedback or revision guidelines..."
                className="w-full rounded-lg border bg-background p-3 text-xs outline-none focus:border-rose-500 transition"
              />
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRejectModalOpen(false)}
                disabled={rejectSubmitting}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmReject}
                disabled={rejectSubmitting || !rejectionReason.trim()}
                className="bg-rose-600 hover:bg-rose-700 text-white font-semibold"
              >
                {rejectSubmitting ? "Rejecting..." : "Confirm Rejection"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 8. EDIT MODAL */}
      {editModalOpen && editTargetHero && (
        <EditSuperheroModal
          hero={editTargetHero}
          onClose={() => {
            setEditModalOpen(false)
            setEditTargetHero(null)
          }}
          onUpdated={(updated) => {
            toast("Super Hero story updated successfully.")
            setHeroes((prev) => prev.map((h) => (h.id === updated.id ? { ...h, ...updated } : h)))
            if (selectedHeroDetail && selectedHeroDetail.id === updated.id) {
              setSelectedHeroDetail((prev) => (prev ? { ...prev, ...updated } : null))
            }
            setEditModalOpen(false)
            setEditTargetHero(null)
            loadStats()
          }}
        />
      )}

      {/* 9. DELETE CONFIRMATION MODAL */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="rounded-full bg-rose-500/15 p-2.5">
                <AlertTriangle className="size-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  Delete / Deactivate Story
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Action on superhero: <span className="font-semibold text-foreground">{deleteTargetName}</span>
                </p>
              </div>
            </div>

            <p className="mt-4 text-xs text-muted-foreground leading-relaxed">
              Choose whether you wish to <span className="font-semibold text-foreground">Soft Deactivate</span> (sets is_active to false and removes from the mobile app home screen) or <span className="font-semibold text-rose-600">Hard Delete</span> permanently from the database.
            </p>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteModalOpen(false)}
                disabled={deleteSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleConfirmDelete(false)}
                disabled={deleteSubmitting}
                className="text-amber-600 border-amber-500/30 hover:bg-amber-50"
              >
                Soft Deactivate
              </Button>
              <Button
                size="sm"
                onClick={() => handleConfirmDelete(true)}
                disabled={deleteSubmitting}
                className="bg-rose-600 hover:bg-rose-700 text-white font-semibold"
              >
                Hard Delete Permanently
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ==========================================
// CREATE SUPERHERO MODAL
// ==========================================
function CreateSuperheroModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (post: SuperheroDetailItem) => void
}) {
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [mediaPreview, setMediaPreview] = useState<string | null>(null)

  // Form Fields
  const [nameOfHero, setNameOfHero] = useState("")
  const [heroRole, setHeroRole] = useState("")
  const [quote, setQuote] = useState("")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [superHeroPhone, setSuperHeroPhone] = useState("")
  const [showOnHome, setShowOnHome] = useState(true)

  // Impact Timeline 4 milestones
  const [firstInitiative, setFirstInitiative] = useState("")
  const [biggestChallenge, setBiggestChallenge] = useState("")
  const [majorAchievement, setMajorAchievement] = useState("")
  const [currentMission, setCurrentMission] = useState("")

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setMediaFile(file)
      setMediaPreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nameOfHero.trim()) {
      toast("Hero Name is required.", "error")
      return
    }

    setSubmitting(true)
    try {
      const payload: CreateSuperheroPayload = {
        name_of_hero: nameOfHero.trim(),
        hero_role: heroRole.trim(),
        quote: quote.trim(),
        description: description.trim(),
        location: location.trim(),
        super_hero_phone: superHeroPhone.trim(),
        show_on_home: showOnHome,
        first_initiative: firstInitiative.trim(),
        biggest_challenge: biggestChallenge.trim(),
        major_achievement: majorAchievement.trim(),
        current_mission: currentMission.trim(),
        media: mediaFile,
      }

      const res = await createSuperhero(payload)
      onCreated(res.post)
    } catch (err: any) {
      toast(err?.message || "Failed to create super hero story.", "error")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-xl border bg-card shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4 bg-muted/30">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Sparkles className="size-5 text-purple-600" />
              Publish Superhero Story (Official Just Learning)
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Publish directly as verified official Just Learning brand content.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Form Body (Scrollable) */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section 1: Hero Identity */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
              <User className="size-3.5" />
              1. Hero Profile & Identity
            </h4>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-foreground">
                  Hero Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={nameOfHero}
                  onChange={(e) => setNameOfHero(e.target.value)}
                  placeholder="e.g. Anand Kumar"
                  className="mt-1.5 h-9 w-full rounded-lg border bg-background px-3 text-xs outline-none focus:border-primary transition"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">
                  Hero Role / Designation
                </label>
                <input
                  type="text"
                  value={heroRole}
                  onChange={(e) => setHeroRole(e.target.value)}
                  placeholder="e.g. Founder, Super 30"
                  className="mt-1.5 h-9 w-full rounded-lg border bg-background px-3 text-xs outline-none focus:border-primary transition"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Patna, Bihar"
                  className="mt-1.5 h-9 w-full rounded-lg border bg-background px-3 text-xs outline-none focus:border-primary transition"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Contact Phone</label>
                <input
                  type="text"
                  value={superHeroPhone}
                  onChange={(e) => setSuperHeroPhone(e.target.value)}
                  placeholder="e.g. +91 9876543210"
                  className="mt-1.5 h-9 w-full rounded-lg border bg-background px-3 text-xs outline-none focus:border-primary transition"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">
                Inspirational Quote
              </label>
              <input
                type="text"
                value={quote}
                onChange={(e) => setQuote(e.target.value)}
                placeholder='e.g. "Rich or poor doesn&apos;t decide your potential."'
                className="mt-1.5 h-9 w-full rounded-lg border bg-background px-3 text-xs outline-none focus:border-primary transition"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">
                Story Description & Background
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Comprehensive overview of what this superhero achieved and how they transformed society..."
                className="mt-1.5 w-full rounded-lg border bg-background p-3 text-xs outline-none focus:border-primary transition"
              />
            </div>
          </div>

          {/* Section 2: 4-Step Impact Timeline */}
          <div className="space-y-4 border-t pt-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
              <Award className="size-3.5" />
              2. 4-Milestone Impact Timeline
            </h4>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div className="rounded-lg border bg-muted/20 p-3">
                <span className="inline-flex size-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary mb-1">
                  1
                </span>
                <label className="block text-xs font-semibold text-foreground">
                  First Initiative (Genesis)
                </label>
                <textarea
                  rows={2}
                  value={firstInitiative}
                  onChange={(e) => setFirstInitiative(e.target.value)}
                  placeholder="e.g. Started Ramanujan School of Mathematics in 1992"
                  className="mt-1.5 w-full rounded-md border bg-background p-2 text-xs outline-none focus:border-primary"
                />
              </div>

              <div className="rounded-lg border bg-muted/20 p-3">
                <span className="inline-flex size-5 items-center justify-center rounded-full bg-amber-500/10 text-[10px] font-bold text-amber-600 mb-1">
                  2
                </span>
                <label className="block text-xs font-semibold text-foreground">
                  Biggest Challenge Overcome
                </label>
                <textarea
                  rows={2}
                  value={biggestChallenge}
                  onChange={(e) => setBiggestChallenge(e.target.value)}
                  placeholder="e.g. Extreme financial constraints and lack of tutoring infrastructure"
                  className="mt-1.5 w-full rounded-md border bg-background p-2 text-xs outline-none focus:border-primary"
                />
              </div>

              <div className="rounded-lg border bg-muted/20 p-3">
                <span className="inline-flex size-5 items-center justify-center rounded-full bg-emerald-500/10 text-[10px] font-bold text-emerald-600 mb-1">
                  3
                </span>
                <label className="block text-xs font-semibold text-foreground">
                  Major Achievement
                </label>
                <textarea
                  rows={2}
                  value={majorAchievement}
                  onChange={(e) => setMajorAchievement(e.target.value)}
                  placeholder="e.g. 500+ underprivileged students cracked IIT JEE"
                  className="mt-1.5 w-full rounded-md border bg-background p-2 text-xs outline-none focus:border-primary"
                />
              </div>

              <div className="rounded-lg border bg-muted/20 p-3">
                <span className="inline-flex size-5 items-center justify-center rounded-full bg-indigo-500/10 text-[10px] font-bold text-indigo-600 mb-1">
                  4
                </span>
                <label className="block text-xs font-semibold text-foreground">
                  Current Mission & Future Goal
                </label>
                <textarea
                  rows={2}
                  value={currentMission}
                  onChange={(e) => setCurrentMission(e.target.value)}
                  placeholder="e.g. Providing online free coaching classes to every Indian village"
                  className="mt-1.5 w-full rounded-md border bg-background p-2 text-xs outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Media Upload & Home Visibility */}
          <div className="space-y-4 border-t pt-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
              <UploadCloud className="size-3.5" />
              3. Media Asset & Feed Visibility
            </h4>

            {/* Media Upload Area */}
            <div>
              <label className="text-xs font-semibold text-foreground">
                Hero Photo or Video File
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {mediaPreview ? (
                <div className="mt-2 relative rounded-xl border overflow-hidden max-w-sm h-48 bg-black/5">
                  {mediaFile?.type.startsWith("video") ? (
                    <video
                      src={mediaPreview}
                      controls
                      className="size-full object-cover"
                    />
                  ) : (
                    <img
                      src={mediaPreview}
                      alt="Preview"
                      className="size-full object-cover"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setMediaFile(null)
                      setMediaPreview(null)
                    }}
                    className="absolute top-2 right-2 rounded-full bg-black/70 p-1.5 text-white hover:bg-black transition"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 flex flex-col items-center justify-center rounded-xl border border-dashed border-primary/40 bg-muted/20 p-6 text-center hover:bg-muted/40 transition cursor-pointer"
                >
                  <UploadCloud className="size-8 text-primary" />
                  <p className="mt-2 text-xs font-medium text-foreground">
                    Click to browse or drag and drop hero portrait
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    PNG, JPG, WEBP, or MP4 up to 50MB
                  </p>
                </div>
              )}
            </div>

            {/* Show on Home Switch */}
            <div className="flex items-center justify-between rounded-xl border bg-muted/30 p-3.5">
              <div>
                <p className="text-xs font-semibold text-foreground">
                  Feature on Mobile Home Page Immediately
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Will instantly highlight this hero on the learners&apos; discovery feed.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowOnHome(!showOnHome)}
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                  showOnHome ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-700"
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
                    showOnHome ? "translate-x-5" : "translate-x-0"
                  )}
                />
              </button>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2 border-t pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitting}
              className="bg-primary text-primary-foreground font-semibold gap-1.5"
            >
              <Send className="size-3.5" />
              {submitting ? "Publishing Story..." : "Publish Superhero Story"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ==========================================
// REVIEW & DETAIL DRAWER / MODAL
// ==========================================
function DetailDrawer({
  heroDetail,
  loading,
  onClose,
  onApprove,
  onReject,
  onToggleHome,
  onEdit,
  onDelete,
}: {
  heroDetail: SuperheroDetailItem | null
  loading: boolean
  onClose: () => void
  onApprove: (id: number, showHome: boolean) => void
  onReject: (id: number) => void
  onToggleHome: (hero: SuperheroDetailItem) => void
  onEdit: (hero: SuperheroDetailItem) => void
  onDelete: (id: number, name: string) => void
}) {
  const [featureOnHomeChecked, setFeatureOnHomeChecked] = useState(true)

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <div className="w-full max-w-2xl rounded-xl border bg-card p-12 text-center">
          <RefreshCw className="size-8 animate-spin text-primary mx-auto" />
          <p className="mt-3 text-sm font-semibold">Loading story details...</p>
        </div>
      </div>
    )
  }

  if (!heroDetail) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-3xl max-h-[92vh] flex flex-col rounded-xl border bg-card shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b px-6 py-4 bg-muted/40">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Super Hero Story #{heroDetail.id}
            </span>
            {heroDetail.verification_status === "pending" && (
              <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400 border border-amber-500/30">
                Pending Review
              </span>
            )}
            {heroDetail.verification_status === "approved" && (
              <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                Approved
              </span>
            )}
            {heroDetail.verification_status === "rejected" && (
              <span className="rounded-full bg-rose-500/15 px-2.5 py-0.5 text-xs font-semibold text-rose-700 dark:text-rose-400 border border-rose-500/30">
                Rejected
              </span>
            )}
            {heroDetail.show_on_home && (
              <span className="rounded-full bg-indigo-500/15 px-2 py-0.5 text-xs font-bold text-indigo-700 dark:text-indigo-400 border border-indigo-500/30 flex items-center gap-1">
                <Home className="size-3" />
                Featured on Home
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Hero Banner / Identity */}
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <div className="relative size-24 shrink-0 overflow-hidden rounded-xl border bg-muted shadow-xs">
              {heroDetail.media && heroDetail.media.length > 0 ? (
                <img
                  src={heroDetail.media[0].file_url}
                  alt={heroDetail.name_of_hero}
                  className="size-full object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center bg-gradient-to-tr from-purple-600/30 to-indigo-600/30 text-2xl font-bold text-primary">
                  {heroDetail.name_of_hero.charAt(0)}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-bold text-foreground">
                {heroDetail.name_of_hero}
              </h2>
              <p className="text-sm font-medium text-primary mt-0.5">
                {heroDetail.hero_role || heroDetail.super_hero_role || "Grassroots Hero"}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                {heroDetail.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="size-3.5" />
                    <span>{heroDetail.location}</span>
                  </div>
                )}
                {heroDetail.super_hero_phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="size-3.5" />
                    <span>{heroDetail.super_hero_phone}</span>
                  </div>
                )}
                {heroDetail.created_at && (
                  <div className="flex items-center gap-1">
                    <Clock className="size-3.5" />
                    <span>
                      Submitted on {new Date(heroDetail.created_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Inspirational Quote Callout */}
          {heroDetail.quote && (
            <div className="relative rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs italic text-foreground">
              <Quote className="absolute right-3 top-3 size-6 text-primary/20" />
              &ldquo;{heroDetail.quote}&rdquo;
            </div>
          )}

          {/* Story Description */}
          {heroDetail.description && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                About the Hero
              </h4>
              <p className="text-xs leading-relaxed text-foreground/90 whitespace-pre-wrap">
                {heroDetail.description}
              </p>
            </div>
          )}

          {/* Rejection Notice Banner if rejected */}
          {heroDetail.verification_status === "rejected" && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-50/40 dark:bg-rose-950/20 p-4 text-xs">
              <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-semibold">
                <XCircle className="size-4" />
                <span>Rejection Reason Feedback:</span>
              </div>
              <p className="mt-1 text-muted-foreground">
                {heroDetail.rejection_reason || "Incomplete verification details or duplicate hero."}
              </p>
            </div>
          )}

          {/* 4-Step Impact Timeline Visualizer */}
          {heroDetail.impact_timeline && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Award className="size-4 text-primary" />
                Impact Milestones
              </h4>

              <div className="space-y-3">
                {/* Step 1 */}
                <div className="flex items-start gap-3 rounded-lg border bg-card p-3">
                  <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                    1
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">First Initiative</p>
                    <p className="text-xs text-foreground mt-0.5">
                      {heroDetail.impact_timeline.first_initiative || "Not specified"}
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-3 rounded-lg border bg-card p-3">
                  <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-xs font-bold text-amber-600">
                    2
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">Biggest Challenge</p>
                    <p className="text-xs text-foreground mt-0.5">
                      {heroDetail.impact_timeline.biggest_challenge || "Not specified"}
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-3 rounded-lg border bg-card p-3">
                  <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-xs font-bold text-emerald-600">
                    3
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">Major Achievement</p>
                    <p className="text-xs text-foreground mt-0.5">
                      {heroDetail.impact_timeline.major_achievement || "Not specified"}
                    </p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex items-start gap-3 rounded-lg border bg-card p-3">
                  <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-indigo-500/15 text-xs font-bold text-indigo-600">
                    4
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">Current Mission</p>
                    <p className="text-xs text-foreground mt-0.5">
                      {heroDetail.impact_timeline.current_mission || "Not specified"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Media Gallery */}
          {heroDetail.media && heroDetail.media.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Media Attachments ({heroDetail.media.length})
              </h4>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {heroDetail.media.map((m) => (
                  <div
                    key={m.id}
                    className="group relative h-28 overflow-hidden rounded-lg border bg-muted"
                  >
                    <img
                      src={m.file_url}
                      alt="Hero media"
                      className="size-full object-cover transition group-hover:scale-105"
                    />
                    <a
                      href={m.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition text-white text-xs gap-1 font-semibold"
                    >
                      <ExternalLink className="size-3.5" />
                      View Full
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submitter & Review Meta Card */}
          <div className="rounded-xl border bg-muted/20 p-4 text-xs space-y-2">
            <h4 className="font-semibold text-foreground">Submission & Audit Details</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-muted-foreground">Nominated By:</span>{" "}
                <span className="font-medium text-foreground">
                  {heroDetail.author?.name || "Official Just Learning Account"}
                </span>
                {heroDetail.author?.email && (
                  <p className="text-[11px] text-muted-foreground">{heroDetail.author.email}</p>
                )}
              </div>
              <div>
                <span className="text-muted-foreground">Submitter Role:</span>{" "}
                <span className="font-medium text-foreground capitalize">
                  {heroDetail.author?.role || "Editorial"}
                </span>
              </div>
              {heroDetail.reviewed_at && (
                <div>
                  <span className="text-muted-foreground">Reviewed At:</span>{" "}
                  <span className="font-medium text-foreground">
                    {new Date(heroDetail.reviewed_at).toLocaleString()}
                  </span>
                </div>
              )}
              {heroDetail.reviewed_by && (
                <div>
                  <span className="text-muted-foreground">Reviewed By:</span>{" "}
                  <span className="font-medium text-foreground">{heroDetail.reviewed_by}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t px-6 py-4 bg-muted/30">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(heroDetail)}
              className="text-xs gap-1"
            >
              <Edit3 className="size-3.5" />
              Edit Details
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(heroDetail.id, heroDetail.name_of_hero)}
              className="text-xs text-rose-600 border-rose-500/30 hover:bg-rose-50 gap-1"
            >
              <Trash2 className="size-3.5" />
              Delete
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {/* If pending: Approve and Reject buttons */}
            {heroDetail.verification_status === "pending" ? (
              <>
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground mr-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={featureOnHomeChecked}
                    onChange={(e) => setFeatureOnHomeChecked(e.target.checked)}
                    className="rounded border-slate-300 text-primary focus:ring-primary"
                  />
                  <span>Feature on Home</span>
                </label>

                <Button
                  size="sm"
                  onClick={() => onApprove(heroDetail.id, featureOnHomeChecked)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-1.5"
                >
                  <CheckCircle2 className="size-3.5" />
                  Approve Story
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onReject(heroDetail.id)}
                  className="text-rose-600 border-rose-500/30 hover:bg-rose-50 text-xs gap-1.5"
                >
                  <XCircle className="size-3.5" />
                  Reject
                </Button>
              </>
            ) : heroDetail.verification_status === "approved" ? (
              <Button
                size="sm"
                variant={heroDetail.show_on_home ? "outline" : "default"}
                onClick={() => onToggleHome(heroDetail)}
                className="text-xs gap-1.5"
              >
                <Home className="size-3.5" />
                {heroDetail.show_on_home ? "Remove from Home Feed" : "Feature on Home Feed"}
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onApprove(heroDetail.id, false)}
                className="text-emerald-600 border-emerald-500/30 hover:bg-emerald-50 text-xs gap-1.5"
              >
                <CheckCircle2 className="size-3.5" />
                Re-approve Story
              </Button>
            )}

            <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ==========================================
// EDIT SUPERHERO MODAL
// ==========================================
function EditSuperheroModal({
  hero,
  onClose,
  onUpdated,
}: {
  hero: SuperheroDetailItem
  onClose: () => void
  onUpdated: (updated: SuperheroDetailItem) => void
}) {
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)

  const [nameOfHero, setNameOfHero] = useState(hero.name_of_hero || "")
  const [heroRole, setHeroRole] = useState(hero.hero_role || hero.super_hero_role || "")
  const [quote, setQuote] = useState(hero.quote || "")
  const [description, setDescription] = useState(hero.description || "")
  const [location, setLocation] = useState(hero.location || "")
  const [superHeroPhone, setSuperHeroPhone] = useState(hero.super_hero_phone || "")
  const [showOnHome, setShowOnHome] = useState(hero.show_on_home || false)

  const [firstInitiative, setFirstInitiative] = useState(
    hero.impact_timeline?.first_initiative || ""
  )
  const [biggestChallenge, setBiggestChallenge] = useState(
    hero.impact_timeline?.biggest_challenge || ""
  )
  const [majorAchievement, setMajorAchievement] = useState(
    hero.impact_timeline?.major_achievement || ""
  )
  const [currentMission, setCurrentMission] = useState(
    hero.impact_timeline?.current_mission || ""
  )

  const [newMediaFile, setNewMediaFile] = useState<File | null>(null)
  const [newMediaPreview, setNewMediaPreview] = useState<string | null>(null)

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nameOfHero.trim()) {
      toast("Hero Name cannot be empty.", "error")
      return
    }

    setSubmitting(true)
    try {
      const payload: UpdateSuperheroPayload = {
        name_of_hero: nameOfHero.trim(),
        hero_role: heroRole.trim(),
        quote: quote.trim(),
        description: description.trim(),
        location: location.trim(),
        super_hero_phone: superHeroPhone.trim(),
        show_on_home: showOnHome,
        first_initiative: firstInitiative.trim(),
        biggest_challenge: biggestChallenge.trim(),
        major_achievement: majorAchievement.trim(),
        current_mission: currentMission.trim(),
        media: newMediaFile,
      }

      const updated = await updateSuperhero(hero.id, payload)
      onUpdated(updated)
    } catch (err: any) {
      toast(err?.message || "Failed to update super hero.", "error")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-xl border bg-card shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b px-6 py-4 bg-muted/30">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Edit3 className="size-4 text-primary" />
            Edit Super Hero: {hero.name_of_hero}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleUpdate} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-foreground">Hero Name *</label>
              <input
                type="text"
                required
                value={nameOfHero}
                onChange={(e) => setNameOfHero(e.target.value)}
                className="mt-1 h-9 w-full rounded-lg border bg-background px-3 text-xs outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground">Role / Title</label>
              <input
                type="text"
                value={heroRole}
                onChange={(e) => setHeroRole(e.target.value)}
                className="mt-1 h-9 w-full rounded-lg border bg-background px-3 text-xs outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="mt-1 h-9 w-full rounded-lg border bg-background px-3 text-xs outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground">Contact Phone</label>
              <input
                type="text"
                value={superHeroPhone}
                onChange={(e) => setSuperHeroPhone(e.target.value)}
                className="mt-1 h-9 w-full rounded-lg border bg-background px-3 text-xs outline-none focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground">Quote</label>
            <input
              type="text"
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
              className="mt-1 h-9 w-full rounded-lg border bg-background px-3 text-xs outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground">Story Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full rounded-lg border bg-background p-3 text-xs outline-none focus:border-primary"
            />
          </div>

          <div className="border-t pt-4 space-y-3">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Timeline Milestones
            </h4>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-foreground">Step 1: First Initiative</label>
                <textarea
                  rows={2}
                  value={firstInitiative}
                  onChange={(e) => setFirstInitiative(e.target.value)}
                  className="mt-1 w-full rounded-md border bg-background p-2 text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground">Step 2: Biggest Challenge</label>
                <textarea
                  rows={2}
                  value={biggestChallenge}
                  onChange={(e) => setBiggestChallenge(e.target.value)}
                  className="mt-1 w-full rounded-md border bg-background p-2 text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground">Step 3: Major Achievement</label>
                <textarea
                  rows={2}
                  value={majorAchievement}
                  onChange={(e) => setMajorAchievement(e.target.value)}
                  className="mt-1 w-full rounded-md border bg-background p-2 text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground">Step 4: Current Mission</label>
                <textarea
                  rows={2}
                  value={currentMission}
                  onChange={(e) => setCurrentMission(e.target.value)}
                  className="mt-1 w-full rounded-md border bg-background p-2 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Replace Portrait Media */}
          <div className="border-t pt-3 space-y-2">
            <label className="block text-xs font-semibold text-foreground">
              Replace Hero Portrait / Media (Optional)
            </label>
            <input
              type="file"
              accept="image/*,video/*"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  const f = e.target.files[0]
                  setNewMediaFile(f)
                  setNewMediaPreview(URL.createObjectURL(f))
                }
              }}
              className="block w-full text-xs text-muted-foreground file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border file:border-border file:text-xs file:font-semibold file:bg-muted"
            />
            {newMediaPreview && (
              <div className="relative size-20 rounded-lg overflow-hidden border">
                <img src={newMediaPreview} alt="Preview" className="size-full object-cover" />
              </div>
            )}
          </div>

          {/* Show on Home */}
          <div className="flex items-center justify-between border-t pt-3">
            <span className="text-xs font-semibold text-foreground">Show on Home Page:</span>
            <button
              type="button"
              onClick={() => setShowOnHome(!showOnHome)}
              className={cn(
                "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out",
                showOnHome ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-700"
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block size-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
                  showOnHome ? "translate-x-4" : "translate-x-0"
                )}
              />
            </button>
          </div>

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
