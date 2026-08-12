import { useState } from "react"
import { X } from "lucide-react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { StatCards } from "@/components/dashboard/stat-cards"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { Overview } from "@/components/dashboard/overview"

export function DashboardPage() { const [collapsed, setCollapsed] = useState(false); const [mobileOpen, setMobileOpen] = useState(false); return <div className="flex min-h-svh"><Sidebar collapsed={collapsed} onToggle={() => setCollapsed((value) => !value)} /><div className="flex min-w-0 flex-1 flex-col"><Header onMenuClick={() => setMobileOpen(true)} /><main className="flex-1 p-4 sm:p-7"><div className="mx-auto max-w-7xl"><StatCards /><div className="mt-6 grid gap-6 xl:grid-cols-[1.08fr_0.92fr]"><Overview /><RecentActivity /></div></div></main></div>{mobileOpen && <div className="fixed inset-0 z-50 bg-foreground/20 md:hidden"><div className="relative h-full w-72 shadow-xl"><button onClick={() => setMobileOpen(false)} className="absolute right-3 top-3 z-10 grid size-8 place-items-center rounded-md hover:bg-muted" aria-label="Close menu"><X className="size-5" /></button><Sidebar mobile collapsed={false} onToggle={() => setMobileOpen(false)} /></div></div>}</div> }
