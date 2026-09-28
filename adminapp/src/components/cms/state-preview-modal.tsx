import { useState } from "react"
import {
  X,
  MapPin,
  Languages,
  BookOpen,
  Calendar,
  Utensils,
  Palette,
  Compass,
  Crown,
  Sparkles,
  ArrowLeft,
  Share2,
  Bookmark,
  Wifi,
  Battery,
} from "lucide-react"
import { Dialog } from "@base-ui/react/dialog"
import { cn } from "@/lib/utils"
import type { StateCulturalContent } from "@/lib/api"

interface StatePreviewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  content: StateCulturalContent | null
}

const TABS: Array<{ key: "story" | "culture" | "land" | "legends"; label: string; icon: typeof BookOpen }> = [
  { key: "story", label: "Story", icon: BookOpen },
  { key: "culture", label: "Culture", icon: Palette },
  { key: "land", label: "Land", icon: Compass },
  { key: "legends", label: "Legends", icon: Crown },
]

export function StatePreviewModal({
  open,
  onOpenChange,
  content,
}: StatePreviewModalProps) {
  const [activePreviewTab, setActivePreviewTab] = useState<"story" | "culture" | "land" | "legends">("story")
  const [cultureCategoryFilter, setCultureCategoryFilter] = useState<"all" | "festivals" | "food" | "arts">("all")
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [touchStartX, setTouchStartX] = useState<number | null>(null)

  if (!content) return null

  // Support swipe left/right between the 4 tabs
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return
    const diff = e.changedTouches[0].clientX - touchStartX
    if (Math.abs(diff) > 50) {
      const tabKeys: ("story" | "culture" | "land" | "legends")[] = ["story", "culture", "land", "legends"]
      const currIdx = tabKeys.indexOf(activePreviewTab)
      if (diff < 0 && currIdx < tabKeys.length - 1) {
        setActivePreviewTab(tabKeys[currIdx + 1])
      } else if (diff > 0 && currIdx > 0) {
        setActivePreviewTab(tabKeys[currIdx - 1])
      }
    }
    setTouchStartX(null)
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        {/* Backdrop with silky fade-in */}
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs smooth-backdrop-enter" />

        {/* Viewport aligned to right edge */}
        <Dialog.Viewport className="fixed inset-0 z-50 flex justify-end overflow-hidden pointer-events-none">
          {/* Smooth Slide-over Drawer (100vh with no outer scroll) */}
          <Dialog.Popup
            className="pointer-events-auto relative h-[100dvh] w-full sm:w-[480px] bg-slate-950/95 border-l border-slate-800/80 shadow-2xl flex flex-col justify-between p-2.5 sm:p-4 overflow-hidden smooth-drawer-enter"
          >
            {/* Drawer Top Bar */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Mobile Preview</span>
                <span className="rounded-md bg-primary/20 px-2 py-0.5 text-xs font-bold text-primary">
                  {content.state_name}
                </span>
                <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
                  • Swipe tabs or scroll
                </span>
              </div>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="grid size-8 place-items-center rounded-full bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white transition cursor-pointer shadow-xs"
                aria-label="Close drawer"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Mobile Device Frame — Fits 100vh height cleanly */}
            <div className="my-auto py-1 flex justify-center items-center h-[calc(100dvh-5.5rem)]">
              <div
                className="relative w-[360px] sm:w-[375px] h-full max-h-[820px] bg-background text-foreground rounded-[44px] shadow-2xl border-[9px] border-slate-800 flex flex-col overflow-hidden ring-1 ring-white/10 select-none shrink-0"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                {/* Dynamic Island */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 w-24 h-4 bg-black rounded-full flex items-center justify-end px-2">
                  <span className="size-1.5 rounded-full bg-emerald-500/80 animate-pulse" />
                </div>

                {/* Phone Status Bar */}
                <div className="h-9 w-full shrink-0 flex items-center justify-between px-6 pt-1 text-[11px] font-bold text-foreground z-20">
                  <span>9:41</span>
                  <div className="flex items-center gap-1.5">
                    <Wifi className="size-3" />
                    <span className="text-[10px] font-black">5G</span>
                    <Battery className="size-3.5 fill-current" />
                  </div>
                </div>

                {/* In-App Mobile Top Navigation */}
                <div className="relative z-20 flex items-center justify-between px-3.5 py-1.5 border-b border-border/50 bg-background/90 backdrop-blur-md shrink-0">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenChange(false)}
                      className="grid size-7 place-items-center rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition"
                      title="Back"
                    >
                      <ArrowLeft className="size-4" />
                    </button>
                    <div className="flex flex-col">
                      <span className="text-xs font-black tracking-tight leading-none line-clamp-1">
                        {content.state_name}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-medium">Cultural Guide</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setIsBookmarked(!isBookmarked)}
                      className="grid size-7 place-items-center rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition"
                      title="Bookmark"
                    >
                      <Bookmark className={cn("size-3.5", isBookmarked && "fill-primary text-primary")} />
                    </button>
                    <button
                      type="button"
                      className="grid size-7 place-items-center rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition"
                      title="Share"
                    >
                      <Share2 className="size-3.5" />
                    </button>
                  </div>
                </div>

                {/* Mobile Viewport — Slideable & Smoothly Scrollable */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden touch-pan-y overscroll-contain scroll-smooth scrollbar-thin pb-4">
                  {/* Hero Banner Section */}
                  <div className="relative h-44 w-full bg-slate-900 shrink-0 overflow-hidden">
                    {content.hero_image_url ? (
                      <img
                        src={content.hero_image_url}
                        alt={content.state_name}
                        className="h-full w-full object-cover opacity-80"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none"
                        }}
                      />
                    ) : null}
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />

                    <div className="absolute bottom-2.5 left-3.5 right-3.5">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="rounded-md bg-primary px-2 py-0.5 text-[9px] font-black uppercase text-primary-foreground tracking-wider shadow-xs">
                          {content.state_code || "IN"}
                        </span>
                        <span
                          className={cn(
                            "rounded-md px-1.5 py-0.5 text-[9px] font-bold text-white shadow-xs",
                            content.is_published ? "bg-emerald-600" : "bg-amber-600"
                          )}
                        >
                          {content.is_published ? "Published" : "Draft"}
                        </span>
                      </div>
                      <h2 className="text-lg font-black text-foreground tracking-tight leading-tight">
                        {content.state_name}
                      </h2>
                      <p className="text-[10px] text-muted-foreground font-medium line-clamp-1 mt-0.5">
                        {content.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Metadata Pill Chips (Horizontally Slideable) */}
                  <div className="px-3.5 py-2 flex items-center gap-2 overflow-x-auto scrollbar-none text-[10px]">
                    <div className="inline-flex items-center gap-1 rounded-full bg-muted/90 px-2.5 py-0.5 font-medium shrink-0 shadow-2xs">
                      <MapPin className="size-2.5 text-primary" />
                      <span className="text-muted-foreground">Capital:</span>
                      <strong className="text-foreground">{content.capital || "N/A"}</strong>
                    </div>
                    <div className="inline-flex items-center gap-1 rounded-full bg-muted/90 px-2.5 py-0.5 font-medium shrink-0 shadow-2xs">
                      <Languages className="size-2.5 text-primary" />
                      <span className="text-muted-foreground">Language:</span>
                      <strong className="text-foreground">{content.language_spoken_mostly || "N/A"}</strong>
                    </div>
                  </div>

                  {/* Segmented Mobile Tab Bar with smooth indicator */}
                  <div className="px-3 pt-0.5 sticky top-0 z-20 bg-background/95 backdrop-blur-xs pb-1">
                    <div className="grid grid-cols-4 rounded-xl bg-muted p-1 text-center text-xs font-bold border border-border/50">
                      {TABS.map((tab) => {
                        const Icon = tab.icon
                        const isActive = activePreviewTab === tab.key
                        return (
                          <button
                            key={tab.key}
                            type="button"
                            onClick={() => setActivePreviewTab(tab.key)}
                            className={cn(
                              "py-1 rounded-lg transition-all duration-200 cursor-pointer flex flex-col items-center gap-0.5",
                              isActive
                                ? "bg-background text-primary shadow-xs font-bold scale-[1.02]"
                                : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            <Icon className="size-3" />
                            <span className="text-[9px]">{tab.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Tab Body — Smoothly rendered per tab */}
                  <div className="p-3 space-y-3.5">
                    {/* TAB 1: THE STORY */}
                    {activePreviewTab === "story" && (
                      <div className="space-y-3 animate-in fade-in duration-200">
                        <div className="rounded-xl border border-border bg-card p-3 shadow-2xs">
                          <h3 className="text-xs font-bold text-foreground">
                            {content.the_story?.title || "The Historical Journey"}
                          </h3>
                          <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
                            {content.the_story?.description || "Historical narrative about the state."}
                          </p>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                              Milestones Timeline
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {content.the_story?.timeline?.length || 0} events
                            </span>
                          </div>
                          {content.the_story?.timeline?.length === 0 ? (
                            <p className="text-xs text-muted-foreground italic">No milestones added.</p>
                          ) : (
                            <div className="relative pl-4 border-l-2 border-primary/40 space-y-3 ml-2">
                              {content.the_story?.timeline?.map((evt, idx) => (
                                <div key={idx} className="relative group">
                                  <div className="absolute -left-[23px] top-1 grid size-3.5 place-items-center rounded-full bg-primary text-primary-foreground shadow-xs">
                                    <span className="size-1 rounded-full bg-white" />
                                  </div>
                                  <div className="rounded-xl border border-border bg-card p-2.5 shadow-2xs hover:border-primary/40 transition">
                                    <span className="inline-block rounded-md bg-secondary px-2 py-0.5 text-[9px] font-bold text-secondary-foreground mb-1">
                                      {evt.year_or_era}
                                    </span>
                                    <h5 className="font-bold text-xs text-foreground">{evt.title}</h5>
                                    <p className="mt-0.5 text-[10px] text-muted-foreground leading-relaxed">
                                      {evt.description}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* TAB 2: THE CULTURE */}
                    {activePreviewTab === "culture" && (
                      <div className="space-y-3 animate-in fade-in duration-200">
                        {/* Slideable Subcategory Filter Chips */}
                        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
                          <button
                            type="button"
                            onClick={() => setCultureCategoryFilter("all")}
                            className={cn(
                              "rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition cursor-pointer shrink-0",
                              cultureCategoryFilter === "all"
                                ? "bg-foreground text-background shadow-xs"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            All
                          </button>
                          <button
                            type="button"
                            onClick={() => setCultureCategoryFilter("festivals")}
                            className={cn(
                              "rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition cursor-pointer shrink-0",
                              cultureCategoryFilter === "festivals"
                                ? "bg-foreground text-background shadow-xs"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            Festivals ({content.the_culture?.festivals?.length || 0})
                          </button>
                          <button
                            type="button"
                            onClick={() => setCultureCategoryFilter("food")}
                            className={cn(
                              "rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition cursor-pointer shrink-0",
                              cultureCategoryFilter === "food"
                                ? "bg-foreground text-background shadow-xs"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            Food ({content.the_culture?.foods?.length || 0})
                          </button>
                          <button
                            type="button"
                            onClick={() => setCultureCategoryFilter("arts")}
                            className={cn(
                              "rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition cursor-pointer shrink-0",
                              cultureCategoryFilter === "arts"
                                ? "bg-foreground text-background shadow-xs"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            Arts ({content.the_culture?.arts_and_crafts?.length || 0})
                          </button>
                        </div>

                        {/* Festivals (Slideable Horizontal Cards) */}
                        {(cultureCategoryFilter === "all" || cultureCategoryFilter === "festivals") && (
                          <div className="space-y-1.5">
                            <span className="flex items-center gap-1.5 text-[11px] font-bold text-foreground">
                              <Calendar className="size-3 text-amber-500" /> Celebrated Festivals
                            </span>
                            <div className="flex gap-2.5 overflow-x-auto scrollbar-none pb-1 snap-x snap-mandatory">
                              {content.the_culture?.festivals?.map((fest, idx) => (
                                <div
                                  key={idx}
                                  className="w-[200px] shrink-0 snap-start overflow-hidden rounded-xl border border-border bg-card shadow-2xs flex flex-col"
                                >
                                  {fest.image_url && (
                                    <img
                                      src={fest.image_url}
                                      alt={fest.title}
                                      className="h-24 w-full object-cover bg-muted"
                                    />
                                  )}
                                  <div className="p-2.5">
                                    <h5 className="font-bold text-xs text-foreground">{fest.title}</h5>
                                    <p className="mt-0.5 text-[10px] text-muted-foreground leading-relaxed line-clamp-3">
                                      {fest.description}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Food (Slideable Horizontal Cards) */}
                        {(cultureCategoryFilter === "all" || cultureCategoryFilter === "food") && (
                          <div className="space-y-1.5">
                            <span className="flex items-center gap-1.5 text-[11px] font-bold text-foreground">
                              <Utensils className="size-3 text-emerald-500" /> Traditional Cuisine
                            </span>
                            <div className="flex gap-2.5 overflow-x-auto scrollbar-none pb-1 snap-x snap-mandatory">
                              {content.the_culture?.foods?.map((food, idx) => (
                                <div
                                  key={idx}
                                  className="w-[200px] shrink-0 snap-start overflow-hidden rounded-xl border border-border bg-card shadow-2xs flex flex-col"
                                >
                                  {food.image_url && (
                                    <img
                                      src={food.image_url}
                                      alt={food.dish_name}
                                      className="h-24 w-full object-cover bg-muted"
                                    />
                                  )}
                                  <div className="p-2.5 space-y-1">
                                    <div className="flex items-center justify-between">
                                      <h5 className="font-bold text-xs text-foreground truncate">{food.dish_name}</h5>
                                      <span className="text-[9px] font-semibold bg-muted px-1.5 py-0.5 rounded shrink-0">
                                        {food.origin || content.state_name}
                                      </span>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2">
                                      <strong className="text-foreground">Made with:</strong> {food.ingredients}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Arts & Crafts */}
                        {(cultureCategoryFilter === "all" || cultureCategoryFilter === "arts") && (
                          <div className="space-y-1.5">
                            <span className="flex items-center gap-1.5 text-[11px] font-bold text-foreground">
                              <Palette className="size-3 text-purple-500" /> Folk Art & Crafts
                            </span>
                            <div className="flex gap-2.5 overflow-x-auto scrollbar-none pb-1 snap-x snap-mandatory">
                              {content.the_culture?.arts_and_crafts?.map((art, idx) => (
                                <div
                                  key={idx}
                                  className="w-[200px] shrink-0 snap-start overflow-hidden rounded-xl border border-border bg-card shadow-2xs flex flex-col"
                                >
                                  {art.image_url && (
                                    <img
                                      src={art.image_url}
                                      alt={art.title}
                                      className="h-24 w-full object-cover bg-muted"
                                    />
                                  )}
                                  <div className="p-2.5">
                                    <h5 className="font-bold text-xs text-foreground">{art.title}</h5>
                                    {art.description && (
                                      <p className="mt-0.5 text-[10px] text-muted-foreground leading-relaxed line-clamp-3">
                                        {art.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* TAB 3: THE LAND */}
                    {activePreviewTab === "land" && (
                      <div className="space-y-3 animate-in fade-in duration-200">
                        {/* Geography Card */}
                        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-2xs">
                          {content.the_land?.geographic_image_url && (
                            <img
                              src={content.the_land.geographic_image_url}
                              alt="Geography"
                              className="h-28 w-full object-cover"
                            />
                          )}
                          <div className="p-2.5">
                            <h4 className="font-bold text-xs text-foreground mb-0.5">Geographic Landscape</h4>
                            <p className="text-[10px] text-muted-foreground leading-relaxed">
                              {content.the_land?.geographic_overview || "Overview of topography and climate."}
                            </p>
                          </div>
                        </div>

                        {/* Slideable Destinations */}
                        <div className="space-y-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                            Must-Visit Destinations
                          </span>
                          <div className="flex gap-2.5 overflow-x-auto scrollbar-none pb-1 snap-x snap-mandatory">
                            {content.the_land?.iconic_destinations?.map((dest, idx) => (
                              <div
                                key={idx}
                                className="w-[220px] shrink-0 snap-start overflow-hidden rounded-xl border border-border bg-card shadow-2xs flex flex-col"
                              >
                                {dest.image_url && (
                                  <img
                                    src={dest.image_url}
                                    alt={dest.title}
                                    className="h-28 w-full object-cover bg-muted"
                                  />
                                )}
                                <div className="p-2.5 space-y-1">
                                  <div className="flex items-center justify-between">
                                    <h5 className="font-bold text-xs text-foreground truncate">{dest.title}</h5>
                                    <span className="rounded-md bg-secondary px-1.5 py-0.5 text-[9px] font-black uppercase text-secondary-foreground shrink-0">
                                      {dest.category_tag}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2">
                                    {dest.description}
                                  </p>
                                  {dest.fact && (
                                    <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-2 text-[10px] text-amber-950 dark:text-amber-200">
                                      <span className="font-bold flex items-center gap-1 text-[9px] mb-0.5">
                                        <Sparkles className="size-2.5 text-amber-500" />
                                        Fact:
                                      </span>
                                      <p className="line-clamp-2">{dest.fact}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TAB 4: THE LEGENDS */}
                    {activePreviewTab === "legends" && (
                      <div className="space-y-2.5 animate-in fade-in duration-200">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                          Historical Legends
                        </span>
                        <div className="flex gap-2.5 overflow-x-auto scrollbar-none pb-1 snap-x snap-mandatory">
                          {content.the_legends?.map((leg, idx) => (
                            <div
                              key={idx}
                              className="w-[200px] shrink-0 snap-start overflow-hidden rounded-xl border border-border bg-card shadow-2xs flex flex-col"
                            >
                              {leg.image_url && (
                                <img
                                  src={leg.image_url}
                                  alt={leg.name}
                                  className="h-32 w-full object-cover bg-muted"
                                />
                              )}
                              <div className="p-2.5">
                                <h5 className="font-bold text-xs text-foreground">{leg.name}</h5>
                                <p className="text-[10px] font-semibold text-primary mb-1 truncate">{leg.subtitle}</p>
                                <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-3">
                                  {leg.description}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Mobile Home Indicator Bar */}
                <div className="h-5 w-full shrink-0 flex items-center justify-center bg-background">
                  <div className="w-24 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                </div>
              </div>
            </div>

            {/* Drawer Bottom Bar */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 shrink-0">
              <span>{content.state_code || "IN"} • {content.capital || "State"}</span>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="text-xs font-semibold text-slate-300 hover:text-white underline cursor-pointer"
              >
                Close Drawer
              </button>
            </div>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
