import { ChevronLeft, ChevronRight, CircleHelp, HandHeart, LayoutDashboard, LogOut, Settings, ShieldCheck, Users, WalletCards } from "lucide-react"
import { Brand } from "@/components/brand"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { navigateTo } from "@/lib/navigation"

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard }, { label: "Users", icon: Users }, { label: "Funds", icon: WalletCards },
  { label: "Donations", icon: HandHeart }, { label: "Parent Consent", icon: ShieldCheck }, { label: "Settings", icon: Settings },
]

export function Sidebar({ collapsed, onToggle, mobile = false }: { collapsed: boolean; onToggle: () => void; mobile?: boolean }) {
  return <aside className={cn("shrink-0 border-r bg-card transition-[width] duration-200", mobile ? "flex h-full w-72 flex-col" : "hidden md:flex md:flex-col", collapsed ? "w-[76px]" : "w-64")}>
    <div className="flex h-[76px] items-center justify-between px-5"> <Brand compact={collapsed} /> {!collapsed && <Button variant="ghost" size="icon-sm" onClick={onToggle} aria-label="Collapse sidebar"><ChevronLeft /></Button>} </div>
    {collapsed && <Button variant="ghost" size="icon-sm" onClick={onToggle} className="mx-auto mb-5" aria-label="Expand sidebar"><ChevronRight /></Button>}
    <nav className="flex flex-1 flex-col gap-1 px-3">{navItems.map(({ label, icon: Icon }) => <button key={label} onClick={() => navigateTo("/dashboard")} className={cn("group flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground", label === "Dashboard" && "bg-secondary text-primary")} title={collapsed ? label : undefined}><Icon className="size-[18px] shrink-0" /> {!collapsed && <span>{label}</span>}</button>)}</nav>
    <div className="space-y-1 border-t p-3"><button className="flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground" title={collapsed ? "Help & support" : undefined}><CircleHelp className="size-[18px] shrink-0" />{!collapsed && "Help & support"}</button><button onClick={() => navigateTo("/login")} className="flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted-foreground hover:bg-red-50 hover:text-destructive" title={collapsed ? "Log out" : undefined}><LogOut className="size-[18px] shrink-0" />{!collapsed && "Log out"}</button></div>
  </aside>
}
