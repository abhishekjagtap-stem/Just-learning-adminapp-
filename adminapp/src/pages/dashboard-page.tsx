import { useState, useEffect } from "react"
import {
  X,
  Compass,
  FileText,
  Sparkles,
  Trophy,
  Radio,
  Gamepad2,
  Users,
  Languages,
  Landmark,
  ArrowRight,
  Share2,
  RefreshCw,
} from "lucide-react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { navigateTo } from "@/lib/navigation"
import {
  getAdminUsers,
  getPodcasts,
  fetchSuperheroStats,
  getArenaEventsStats,
  type SuperheroStats,
  type ArenaEventsStats,
} from "@/lib/api"

export function DashboardPage() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Real data counters from active backend APIs
  const [totalUsers, setTotalUsers] = useState<number>(0)
  const [totalPodcasts, setTotalPodcasts] = useState<number>(0)
  const [superheroStats, setSuperheroStats] = useState<SuperheroStats | null>(null)
  const [arenaStats, setArenaStats] = useState<ArenaEventsStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function loadRealData() {
      try {
        const [usersRes, podcastsRes, heroesRes, arenaRes] = await Promise.allSettled([
          getAdminUsers(),
          getPodcasts(),
          fetchSuperheroStats(),
          getArenaEventsStats(),
        ])

        if (!isMounted) return

        if (usersRes.status === "fulfilled" && usersRes.value) {
          const val = usersRes.value
          if (typeof val.count === "number") setTotalUsers(val.count)
          else if (Array.isArray(val.results)) setTotalUsers(val.results.length)
        }

        if (podcastsRes.status === "fulfilled" && podcastsRes.value) {
          const val = podcastsRes.value
          if (Array.isArray(val)) setTotalPodcasts(val.length)
          else if (val && typeof val === "object" && "count" in val) setTotalPodcasts(val.count)
        }

        if (heroesRes.status === "fulfilled" && heroesRes.value) {
          setSuperheroStats(heroesRes.value)
        }

        if (arenaRes.status === "fulfilled" && arenaRes.value) {
          setArenaStats(arenaRes.value)
        }
      } catch {
        // Fallback to 0 if API is unavailable or returns 404
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadRealData()
    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div className="flex min-h-svh">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((value) => !value)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header onMenuClick={() => setMobileOpen(true)} title="Main Dashboard" />
        <main className="flex-1 p-4 sm:p-7">
          <div className="mx-auto max-w-7xl space-y-7">
            {/* 1. UNDER CONSTRUCTION / NOTICE BANNER */}
            <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-purple-500/10 via-indigo-500/5 to-background p-6 sm:p-8 shadow-xs">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="max-w-2xl space-y-2">
                  <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary border border-primary/20">
                    <span className="relative flex size-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                      <span className="relative inline-flex size-2 rounded-full bg-primary" />
                    </span>
                    Executive Dashboard Under Construction
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                    Master Analytics Dashboard in Progress
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Cross-platform business telemetry, revenue metrics, and high-level charts will be integrated in the final phase. In the meantime, please explore and manage all live operational modules below.
                  </p>
                </div>

                <div className="shrink-0 flex flex-wrap gap-2.5">
                  <Button
                    onClick={() => navigateTo("/cms")}
                    className="gap-2 bg-primary text-primary-foreground font-semibold shadow-xs"
                  >
                    <Compass className="size-4" />
                    Explore Content Hub
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigateTo("/cms/superheroes")}
                    className="gap-2"
                  >
                    <Sparkles className="size-4" />
                    Super Hero Stories
                  </Button>
                </div>
              </div>
            </div>

            {/* 2. REAL METRICS COUNTERS (LIVE DATA ONLY - NO FAKE DONATIONS) */}
            <div>
              <div className="mb-3.5 flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  Live System Counters
                </h3>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  {loading && <RefreshCw className="size-3 animate-spin" />}
                  Direct from Backend APIs
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {/* Users Count */}
                <div
                  onClick={() => navigateTo("/users")}
                  className="rounded-xl border bg-card p-5 shadow-xs hover:border-primary/40 transition cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Total Users & Staff
                    </span>
                    <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-600 dark:text-indigo-400">
                      <Users className="size-4" />
                    </div>
                  </div>
                  <p className="mt-3 text-2xl font-bold tracking-tight text-foreground group-hover:text-primary transition">
                    {totalUsers}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Registered administrators & staff</p>
                </div>

                {/* Podcasts Count */}
                <div
                  onClick={() => navigateTo("/podcasts")}
                  className="rounded-xl border bg-card p-5 shadow-xs hover:border-primary/40 transition cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Podcasts Library
                    </span>
                    <div className="rounded-lg bg-purple-500/10 p-2 text-purple-600 dark:text-purple-400">
                      <Radio className="size-4" />
                    </div>
                  </div>
                  <p className="mt-3 text-2xl font-bold tracking-tight text-foreground group-hover:text-primary transition">
                    {totalPodcasts}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Published audio & video episodes</p>
                </div>

                {/* Superhero Stories Count */}
                <div
                  onClick={() => navigateTo("/cms/superheroes")}
                  className="rounded-xl border bg-card p-5 shadow-xs hover:border-primary/40 transition cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Superhero Stories
                    </span>
                    <div className="rounded-lg bg-amber-500/10 p-2 text-amber-600 dark:text-amber-400">
                      <Sparkles className="size-4" />
                    </div>
                  </div>
                  <p className="mt-3 text-2xl font-bold tracking-tight text-foreground group-hover:text-primary transition">
                    {superheroStats?.total_suggestions ?? 0}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {superheroStats?.pending ?? 0} pending review
                  </p>
                </div>

                {/* Arena Events Count */}
                <div
                  onClick={() => navigateTo("/cms/events")}
                  className="rounded-xl border bg-card p-5 shadow-xs hover:border-primary/40 transition cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Arena Events
                    </span>
                    <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
                      <Trophy className="size-4" />
                    </div>
                  </div>
                  <p className="mt-3 text-2xl font-bold tracking-tight text-foreground group-hover:text-primary transition">
                    {arenaStats?.total_events ?? 0}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Competitions & championships</p>
                </div>
              </div>
            </div>

            {/* 3. OPERATIONAL MODULES DIRECTORY */}
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  Explore Active System Modules
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Click any module below to jump directly to its dedicated management workspace.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {/* Module 1: Content Hub */}
                <div
                  onClick={() => navigateTo("/cms")}
                  className="group flex flex-col justify-between rounded-xl border bg-card p-5 shadow-xs hover:border-primary/50 hover:shadow-md transition cursor-pointer"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
                        <FileText className="size-5" />
                      </div>
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600">
                        Active
                      </span>
                    </div>
                    <h4 className="mt-4 font-semibold text-base group-hover:text-primary transition">
                      Content Management Hub
                    </h4>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      Draft, review, approve, and publish educational articles, announcements, and curriculum guides.
                    </p>
                  </div>
                  <div className="mt-5 flex items-center text-xs font-semibold text-primary gap-1 group-hover:translate-x-1 transition-transform">
                    <span>Open Content Hub</span>
                    <ArrowRight className="size-3.5" />
                  </div>
                </div>

                {/* Module 2: Super Hero Stories */}
                <div
                  onClick={() => navigateTo("/cms/superheroes")}
                  className="group flex flex-col justify-between rounded-xl border bg-card p-5 shadow-xs hover:border-primary/50 hover:shadow-md transition cursor-pointer"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="rounded-lg bg-purple-500/10 p-2.5 text-purple-600 dark:text-purple-400">
                        <Sparkles className="size-5" />
                      </div>
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600">
                        Active
                      </span>
                    </div>
                    <h4 className="mt-4 font-semibold text-base group-hover:text-primary transition">
                      Super Hero Stories
                    </h4>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      Review community nominations, verify 4-step impact timelines, approve heroes, and feature on mobile home.
                    </p>
                  </div>
                  <div className="mt-5 flex items-center text-xs font-semibold text-primary gap-1 group-hover:translate-x-1 transition-transform">
                    <span>Open Super Hero Stories</span>
                    <ArrowRight className="size-3.5" />
                  </div>
                </div>

                {/* Module 3: Arena Events */}
                <div
                  onClick={() => navigateTo("/cms/events")}
                  className="group flex flex-col justify-between rounded-xl border bg-card p-5 shadow-xs hover:border-primary/50 hover:shadow-md transition cursor-pointer"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="rounded-lg bg-amber-500/10 p-2.5 text-amber-600 dark:text-amber-400">
                        <Trophy className="size-5" />
                      </div>
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600">
                        Active
                      </span>
                    </div>
                    <h4 className="mt-4 font-semibold text-base group-hover:text-primary transition">
                      Arena Events & Championships
                    </h4>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      Create and manage STEM competitions, science quizzes, robotics hackathons, and national arena leagues.
                    </p>
                  </div>
                  <div className="mt-5 flex items-center text-xs font-semibold text-primary gap-1 group-hover:translate-x-1 transition-transform">
                    <span>Open Arena Events</span>
                    <ArrowRight className="size-3.5" />
                  </div>
                </div>

                {/* Module 4: Podcasts */}
                <div
                  onClick={() => navigateTo("/podcasts")}
                  className="group flex flex-col justify-between rounded-xl border bg-card p-5 shadow-xs hover:border-primary/50 hover:shadow-md transition cursor-pointer"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="rounded-lg bg-blue-500/10 p-2.5 text-blue-600 dark:text-blue-400">
                        <Radio className="size-5" />
                      </div>
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600">
                        Active
                      </span>
                    </div>
                    <h4 className="mt-4 font-semibold text-base group-hover:text-primary transition">
                      Podcasts & Media Shows
                    </h4>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      Publish educational podcast episodes, configure audio embed codes, and feature trending series.
                    </p>
                  </div>
                  <div className="mt-5 flex items-center text-xs font-semibold text-primary gap-1 group-hover:translate-x-1 transition-transform">
                    <span>Open Podcasts</span>
                    <ArrowRight className="size-3.5" />
                  </div>
                </div>

                {/* Module 5: Games & MCQ Engine */}
                <div
                  onClick={() => navigateTo("/games/mcq")}
                  className="group flex flex-col justify-between rounded-xl border bg-card p-5 shadow-xs hover:border-primary/50 hover:shadow-md transition cursor-pointer"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="rounded-lg bg-pink-500/10 p-2.5 text-pink-600 dark:text-pink-400">
                        <Gamepad2 className="size-5" />
                      </div>
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600">
                        Active
                      </span>
                    </div>
                    <h4 className="mt-4 font-semibold text-base group-hover:text-primary transition">
                      Games & MCQ Engine
                    </h4>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      Manage interactive quiz questions: standard text, image questions, chronological ordering, and match pairs.
                    </p>
                  </div>
                  <div className="mt-5 flex items-center text-xs font-semibold text-primary gap-1 group-hover:translate-x-1 transition-transform">
                    <span>Open MCQ Engine</span>
                    <ArrowRight className="size-3.5" />
                  </div>
                </div>

                {/* Module 6: Users & Permissions */}
                <div
                  onClick={() => navigateTo("/users")}
                  className="group flex flex-col justify-between rounded-xl border bg-card p-5 shadow-xs hover:border-primary/50 hover:shadow-md transition cursor-pointer"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="rounded-lg bg-indigo-500/10 p-2.5 text-indigo-600 dark:text-indigo-400">
                        <Users className="size-5" />
                      </div>
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600">
                        Active
                      </span>
                    </div>
                    <h4 className="mt-4 font-semibold text-base group-hover:text-primary transition">
                      User Management
                    </h4>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      Create staff members, invite content creators, assign administrative roles, and inspect active users.
                    </p>
                  </div>
                  <div className="mt-5 flex items-center text-xs font-semibold text-primary gap-1 group-hover:translate-x-1 transition-transform">
                    <span>Open User Management</span>
                    <ArrowRight className="size-3.5" />
                  </div>
                </div>

                {/* Module 7: Language System */}
                <div
                  onClick={() => navigateTo("/language-system")}
                  className="group flex flex-col justify-between rounded-xl border bg-card p-5 shadow-xs hover:border-primary/50 hover:shadow-md transition cursor-pointer"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="rounded-lg bg-teal-500/10 p-2.5 text-teal-600 dark:text-teal-400">
                        <Languages className="size-5" />
                      </div>
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600">
                        Active
                      </span>
                    </div>
                    <h4 className="mt-4 font-semibold text-base group-hover:text-primary transition">
                      Language System
                    </h4>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      Curate multilingual vocabulary terms, translations, and regional phonetics for Indian languages.
                    </p>
                  </div>
                  <div className="mt-5 flex items-center text-xs font-semibold text-primary gap-1 group-hover:translate-x-1 transition-transform">
                    <span>Open Language System</span>
                    <ArrowRight className="size-3.5" />
                  </div>
                </div>

                {/* Module 8: Cultural States */}
                <div
                  onClick={() => navigateTo("/cms/states")}
                  className="group flex flex-col justify-between rounded-xl border bg-card p-5 shadow-xs hover:border-primary/50 hover:shadow-md transition cursor-pointer"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="rounded-lg bg-amber-600/10 p-2.5 text-amber-700 dark:text-amber-400">
                        <Landmark className="size-5" />
                      </div>
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600">
                        Active
                      </span>
                    </div>
                    <h4 className="mt-4 font-semibold text-base group-hover:text-primary transition">
                      Manage State Data
                    </h4>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      Configure comprehensive cultural stories, culinary heritage, festivals, and timelines for 28 states & 8 UTs.
                    </p>
                  </div>
                  <div className="mt-5 flex items-center text-xs font-semibold text-primary gap-1 group-hover:translate-x-1 transition-transform">
                    <span>Open State Data</span>
                    <ArrowRight className="size-3.5" />
                  </div>
                </div>

                {/* Module 9: Official Feed Posts */}
                <div
                  onClick={() => navigateTo("/cms/feed-post")}
                  className="group flex flex-col justify-between rounded-xl border bg-card p-5 shadow-xs hover:border-primary/50 hover:shadow-md transition cursor-pointer"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="rounded-lg bg-violet-500/10 p-2.5 text-violet-600 dark:text-violet-400">
                        <Share2 className="size-5" />
                      </div>
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600">
                        Active
                      </span>
                    </div>
                    <h4 className="mt-4 font-semibold text-base group-hover:text-primary transition">
                      Post on Feed
                    </h4>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      Publish official brand media updates, announcements, and tagged topics directly to the user discovery feed.
                    </p>
                  </div>
                  <div className="mt-5 flex items-center text-xs font-semibold text-primary gap-1 group-hover:translate-x-1 transition-transform">
                    <span>Open Feed Post</span>
                    <ArrowRight className="size-3.5" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

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
