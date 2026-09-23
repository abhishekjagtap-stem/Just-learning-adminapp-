import { useEffect, useState } from "react"
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Gamepad2,
  HandHeart,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Radio,
  Settings,
  ShieldCheck,
  Users,
  WalletCards,
  Languages,
  FileText,
  Calendar,
  CheckSquare,
  Upload,
  Folder,
  ArrowLeftRight,
} from "lucide-react"
import { Brand } from "@/components/brand"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { navigateTo } from "@/lib/navigation"

type NavItem = {
  label: string
  icon: any
  path?: string
  children?: { label: string; icon: any; path: string }[]
}

const mainNavItems: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Users", icon: Users, path: "/users" },
  { label: "Podcasts", icon: Radio, path: "/podcasts" },
  {
    label: "Games",
    icon: Gamepad2,
    children: [
      { label: "Manage MCQ", icon: HelpCircle, path: "/games/mcq" },
    ],
  },
  { label: "Language System", icon: Languages, path: "/language-system" },
  { label: "Funds", icon: WalletCards },
  { label: "Donations", icon: HandHeart },
  { label: "Parent Consent", icon: ShieldCheck },
  { label: "Settings", icon: Settings },
]

const cmsNavItems: NavItem[] = [
  { label: "Content Hub", icon: FileText, path: "/cms" },
  { label: "Calendar", icon: Calendar, path: "/cms/calendar" },
  { label: "Pending Approvals", icon: CheckSquare, path: "/cms/approvals" },
  { label: "Published Library", icon: Upload, path: "/cms/published" },
  { label: "Media & Assets", icon: Folder },
]

export function Sidebar({ collapsed, onToggle, mobile = false }: { collapsed: boolean; onToggle: () => void; mobile?: boolean }) {
  const [currentPath, setCurrentPath] = useState(window.location.pathname)
  const [gamesOpen, setGamesOpen] = useState(() => window.location.pathname.startsWith("/games"))

  useEffect(() => {
    const handleNav = () => setCurrentPath(window.location.pathname)
    window.addEventListener("popstate", handleNav)
    window.addEventListener("jl:navigate", handleNav)
    return () => {
      window.removeEventListener("popstate", handleNav)
      window.removeEventListener("jl:navigate", handleNav)
    }
  }, [])

  const userString = sessionStorage.getItem("admin-user")
  const currentUser = userString ? JSON.parse(userString) : null
  const isSuperadmin = currentUser?.is_superuser
  const isContentRole = currentUser?.role === "content_creator" || currentUser?.role === "content_manager"

  const isCms = currentPath.startsWith("/cms") || (isContentRole && !isSuperadmin)
  const currentNavItems = isCms ? cmsNavItems : mainNavItems

  const logOut = () => {
    sessionStorage.clear()
    navigateTo("/login")
  }

  return (
    <aside
      className={cn(
        "shrink-0 border-r bg-card transition-[width] duration-200",
        mobile
          ? "flex h-full w-72 flex-col"
          : "hidden md:flex md:flex-col sticky top-0 h-svh z-30",
        collapsed ? "w-[76px]" : "w-64"
      )}
    >
      <div className="flex h-20 items-center justify-between px-4 sm:px-5 gap-2 border-b border-border/40 shrink-0">
        <Brand compact={collapsed} />
        {!collapsed && (
          <Button variant="ghost" size="icon-sm" onClick={onToggle} aria-label="Collapse sidebar" className="shrink-0 text-muted-foreground hover:text-foreground">
            <ChevronLeft className="size-4" />
          </Button>
        )}
      </div>

      {collapsed && (
        <Button variant="ghost" size="icon-sm" onClick={onToggle} className="mx-auto my-3 shrink-0" aria-label="Expand sidebar">
          <ChevronRight className="size-4" />
        </Button>
      )}

      {!collapsed && (
        <p className="px-4 sm:px-5 pt-4 pb-2 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase shrink-0 select-none">
          {isCms ? "CMS Workspace" : "Workspace"}
        </p>
      )}

      <nav className="flex flex-1 flex-col gap-1 px-3 overflow-y-auto min-h-0 py-2 scrollbar-thin">
        {currentNavItems.map((item) => {
          if (item.children) {
            const hasActiveChild = item.children.some((child) => child.path === currentPath)
            return (
              <div key={item.label} className="space-y-1">
                <button
                  onClick={() => {
                    if (collapsed) {
                      onToggle()
                    }
                    setGamesOpen((v) => !v)
                  }}
                  className={cn(
                    "group flex h-10 w-full items-center justify-between rounded-lg px-3 text-sm font-medium transition cursor-pointer select-none",
                    hasActiveChild ? "bg-secondary/60 text-primary font-semibold" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="size-[18px] shrink-0" strokeWidth={hasActiveChild ? 2.25 : 2} />
                    {!collapsed && <span>{item.label}</span>}
                  </div>
                  {!collapsed && (
                    <ChevronDown className={cn("size-4 transition-transform duration-200", gamesOpen && "rotate-180")} />
                  )}
                </button>

                {gamesOpen && !collapsed && (
                  <div className="ml-4 pl-3 border-l space-y-1">
                    {item.children.map((child) => {
                      const active = child.path === currentPath
                      return (
                        <button
                          key={child.label}
                          onClick={() => navigateTo(child.path)}
                          className={cn(
                            "flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-xs font-medium transition cursor-pointer select-none",
                            active
                              ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          )}
                        >
                          <child.icon className="size-4 shrink-0" />
                          <span>{child.label}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          }

          const active = item.path === currentPath
          const unavailable = !item.path
          return (
            <button
              key={item.label}
              onClick={() => item.path && navigateTo(item.path)}
              disabled={unavailable}
              className={cn(
                "group flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition cursor-pointer select-none",
                active ? "bg-secondary text-primary shadow-sm font-semibold" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                unavailable && "cursor-not-allowed opacity-65 hover:bg-transparent hover:text-muted-foreground"
              )}
              title={collapsed ? `${item.label}${unavailable ? " (coming soon)" : ""}` : unavailable ? "Coming soon" : undefined}
            >
              <item.icon className="size-[18px] shrink-0" strokeWidth={active ? 2.25 : 2} />
              {!collapsed && <span>{item.label}</span>}
            </button>
          )
        })}
      </nav>

      <div className="space-y-1 border-t p-3 shrink-0">
        {isSuperadmin && (
          <button
            onClick={() => navigateTo(isCms ? "/dashboard" : "/cms")}
            className="flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-primary hover:bg-purple-50 dark:hover:bg-purple-950/30 transition cursor-pointer select-none"
            title={collapsed ? (isCms ? "Main Admin" : "Content Management") : undefined}
          >
            <ArrowLeftRight className="size-[18px] shrink-0" />
            {!collapsed && (isCms ? "Switch to Main Admin" : "Content Management")}
          </button>
        )}

        <button className="flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground cursor-pointer select-none" title={collapsed ? "Help & support" : undefined}>
          <CircleHelp className="size-[18px] shrink-0" />
          {!collapsed && "Help & support"}
        </button>

        <button onClick={logOut} className="flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted-foreground transition hover:bg-red-50 hover:text-destructive dark:hover:bg-red-950/20 cursor-pointer select-none" title={collapsed ? "Log out" : undefined}>
          <LogOut className="size-[18px] shrink-0" />
          {!collapsed && "Log out"}
        </button>
      </div>
    </aside>
  )
}
