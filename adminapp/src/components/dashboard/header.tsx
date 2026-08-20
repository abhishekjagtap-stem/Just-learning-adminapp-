import { useEffect, useState } from "react"
import { Bell, Menu, Moon, Search, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"

type StoredUser = { email: string; is_superuser: boolean }

export function Header({ onMenuClick, title = "Dashboard" }: { onMenuClick: () => void; title?: string }) {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"))
  const [user] = useState<StoredUser | null>(() => {
    const value = sessionStorage.getItem("admin-user")
    if (!value) return null
    try { return JSON.parse(value) as StoredUser } catch { return null }
  })
  useEffect(() => { document.documentElement.classList.toggle("dark", dark) }, [dark])

  const email = user?.email ?? "Administrator"
  const initials = email.split("@")[0].split(/[._-]/).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "AD"
  const role = user?.is_superuser ? "Superadmin" : "Administrator"

  return <header className="flex h-[76px] shrink-0 items-center justify-between border-b bg-card px-4 sm:px-7"><div className="flex items-center gap-3"><Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick} aria-label="Open menu"><Menu /></Button><div><h1 className="text-lg font-semibold tracking-tight sm:text-xl">{title}</h1><p className="hidden text-xs text-muted-foreground sm:block">Here’s what’s happening with JL today.</p></div></div><div className="flex items-center gap-2 sm:gap-3"><div className="relative hidden sm:block"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input placeholder="Search anything..." className="h-9 w-44 rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary md:w-56" /></div><Button variant="ghost" size="icon" onClick={() => setDark((value) => !value)} aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}>{dark ? <Sun /> : <Moon />}</Button><Button variant="ghost" size="icon" className="relative" aria-label="Notifications"><Bell /><span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-primary ring-2 ring-card" /></Button><button className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-muted"><span className="grid size-8 place-items-center rounded-full bg-[#f0e5ff] text-xs font-semibold text-primary dark:bg-[#3b2b55]">{initials}</span><span className="hidden max-w-48 text-left md:block"><span className="block truncate text-xs font-semibold">{email}</span><span className="block text-[11px] text-muted-foreground">{role}</span></span></button></div></header>
}
