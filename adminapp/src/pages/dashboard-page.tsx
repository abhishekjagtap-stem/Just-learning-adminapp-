import { useState } from "react"
import { X } from "lucide-react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"

export function DashboardPage() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-svh">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((value) => !value)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header onMenuClick={() => setMobileOpen(true)} title="Dashboard" />
        <main className="flex-1 flex items-center justify-center p-6 sm:p-12 text-center">
          <div className="max-w-4xl space-y-4 animate-in fade-in zoom-in-95 duration-300">
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight uppercase bg-gradient-to-r from-purple-600 via-indigo-500 to-pink-500 bg-clip-text text-transparent leading-tight select-none">
              dashboard will be obtained at last explore other pages MFS
            </h1>
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
