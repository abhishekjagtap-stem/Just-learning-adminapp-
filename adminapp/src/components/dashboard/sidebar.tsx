import { useState } from "react"
import { ChevronDown, ChevronLeft, ChevronRight, CircleHelp, Gamepad2, HandHeart, HelpCircle, LayoutDashboard, LogOut, Radio, Settings, ShieldCheck, Users, WalletCards } from "lucide-react"
import { Brand } from "@/components/brand"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { navigateTo } from "@/lib/navigation"

type NavItem = {
  label: string
  icon: typeof LayoutDashboard
  path?: string
  children?: { label: string; icon: typeof HelpCircle; path: string }[]
}

const navItems: NavItem[] = [
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
  { label: "Funds", icon: WalletCards },
  { label: "Donations", icon: HandHeart },
  { label: "Parent Consent", icon: ShieldCheck },
  { label: "Settings", icon: Settings },
]

export function Sidebar({ collapsed, onToggle, mobile = false }: { collapsed: boolean; onToggle: () => void; mobile?: boolean }) {
  const [gamesOpen, setGamesOpen] = useState(() => window.location.pathname.startsWith("/games"))
  const logOut = () => { sessionStorage.clear(); navigateTo("/login") }

  return <aside className={cn("shrink-0 border-r bg-card transition-[width] duration-200", mobile ? "flex h-full w-72 flex-col" : "hidden md:flex md:flex-col", collapsed ? "w-[76px]" : "w-64")}>
    <div className="flex h-[76px] items-center justify-between px-5"><Brand compact={collapsed} />{!collapsed && <Button variant="ghost" size="icon-sm" onClick={onToggle} aria-label="Collapse sidebar"><ChevronLeft /></Button>}</div>
    {collapsed && <Button variant="ghost" size="icon-sm" onClick={onToggle} className="mx-auto mb-4" aria-label="Expand sidebar"><ChevronRight /></Button>}
    {!collapsed && <p className="px-5 pb-2 text-[11px] font-semibold tracking-wider text-muted-foreground">WORKSPACE</p>}
    <nav className="flex flex-1 flex-col gap-1 px-3">{navItems.map((item) => {
      if (item.children) {
        const hasActiveChild = item.children.some((child) => child.path === window.location.pathname)
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
                "group flex h-10 w-full items-center justify-between rounded-lg px-3 text-sm font-medium transition",
                hasActiveChild ? "bg-secondary/60 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
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
                  const active = child.path === window.location.pathname
                  return (
                    <button
                      key={child.label}
                      onClick={() => navigateTo(child.path)}
                      className={cn(
                        "flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-xs font-medium transition",
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

      const active = item.path === window.location.pathname
      const unavailable = !item.path
      return (
        <button
          key={item.label}
          onClick={() => item.path && navigateTo(item.path)}
          disabled={unavailable}
          className={cn(
            "group flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition",
            active ? "bg-secondary text-primary shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            unavailable && "cursor-not-allowed opacity-65 hover:bg-transparent hover:text-muted-foreground"
          )}
          title={collapsed ? `${item.label}${unavailable ? " (coming soon)" : ""}` : unavailable ? "Coming soon" : undefined}
        >
          <item.icon className="size-[18px] shrink-0" strokeWidth={active ? 2.25 : 2} />
          {!collapsed && <span>{item.label}</span>}
        </button>
      )
    })}</nav>
    <div className="space-y-1 border-t p-3"><button className="flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground" title={collapsed ? "Help & support" : undefined}><CircleHelp className="size-[18px] shrink-0" />{!collapsed && "Help & support"}</button><button onClick={logOut} className="flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted-foreground transition hover:bg-red-50 hover:text-destructive" title={collapsed ? "Log out" : undefined}><LogOut className="size-[18px] shrink-0" />{!collapsed && "Log out"}</button></div>
  </aside>
}
