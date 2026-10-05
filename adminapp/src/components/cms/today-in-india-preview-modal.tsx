import {
  X,
  MapPin,
  Sparkles,
  ArrowLeft,
  Share2,
  Bookmark,
  Wifi,
  Battery,
  Calendar,
  Tag,
  Lightbulb,
} from "lucide-react"
import { Dialog } from "@base-ui/react/dialog"
import { cn } from "@/lib/utils"
import type { CreateTodayInIndiaPayload } from "@/lib/api"

interface TodayInIndiaPreviewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  story: CreateTodayInIndiaPayload | null
}

const CATEGORY_NAMES: Record<string, string> = {
  festive_story: "Festive Story",
  history: "History",
  people: "About Someone or People",
  food: "Food",
  art_and_craft: "Art and Craft",
  science_and_nature: "Science and Nature",
  language: "Language",
  place: "Place",
}

export function TodayInIndiaPreviewModal({
  open,
  onOpenChange,
  story,
}: TodayInIndiaPreviewModalProps) {
  if (!story) return null

  const categoryLabel = CATEGORY_NAMES[story.category] || story.category || "Story"
  const formattedDate = story.scheduled_date
    ? new Date(story.scheduled_date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Today"

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        {/* Backdrop */}
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        {/* Smooth Drawer from Right */}
        <Dialog.Popup
          className={cn(
            "fixed inset-y-0 right-0 z-50 h-full w-full sm:max-w-md",
            "bg-slate-950 p-4 shadow-2xl flex flex-col justify-center items-center",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
            "duration-300 ease-out focus:outline-none"
          )}
        >
          {/* Close button at top corner */}
          <Dialog.Close
            className="absolute top-4 right-4 z-50 rounded-full bg-white/10 p-2 text-white/80 hover:bg-white/20 hover:text-white transition-colors"
            title="Close Preview"
          >
            <X className="size-5" />
          </Dialog.Close>

          {/* Device Mockup Shell */}
          <div className="relative w-full max-w-[370px] h-[94vh] max-h-[800px] bg-black rounded-[48px] p-3 shadow-2xl ring-1 ring-white/20 flex flex-col">
            {/* Outer Speaker / Mic Notch */}
            <div className="absolute top-5 left-1/2 -translate-x-1/2 w-28 h-4 bg-black rounded-full z-40 flex items-center justify-center">
              <div className="w-10 h-1 bg-zinc-800 rounded-full" />
              <div className="absolute right-3 size-2.5 rounded-full bg-zinc-900 border border-zinc-800" />
            </div>

            {/* Screen Container */}
            <div className="relative w-full h-full bg-slate-900 text-white rounded-[38px] overflow-hidden flex flex-col select-none border border-slate-800">
              {/* iOS / Android Status Bar */}
              <div className="h-10 w-full px-6 flex items-center justify-between text-[11px] font-semibold text-slate-300 z-30 pt-1">
                <span>9:41</span>
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Wifi className="size-3" />
                  <Battery className="size-3.5" />
                </div>
              </div>

              {/* Scrollable Story Content */}
              <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
                {/* Hero Banner */}
                <div className="relative h-64 w-full bg-slate-800">
                  {story.hero_image_url ? (
                    <img
                      src={story.hero_image_url}
                      alt={story.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
                      <Sparkles className="size-8 mb-2 opacity-40" />
                      <span className="text-xs">No hero image provided</span>
                    </div>
                  )}

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                  {/* Top Bar Navigation inside App */}
                  <div className="absolute top-2 inset-x-0 px-4 flex items-center justify-between z-20">
                    <button
                      type="button"
                      onClick={() => onOpenChange(false)}
                      className="size-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white/90"
                    >
                      <ArrowLeft className="size-4" />
                    </button>
                    <div className="flex items-center gap-2">
                      <div className="size-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white/90">
                        <Bookmark className="size-4" />
                      </div>
                      <div className="size-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white/90">
                        <Share2 className="size-4" />
                      </div>
                    </div>
                  </div>

                  {/* Badges on bottom of Hero */}
                  <div className="absolute bottom-3 left-4 right-4 z-20 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-0.5 text-[10px] font-bold text-slate-950 uppercase tracking-wider shadow-sm">
                        <Sparkles className="size-3" />
                        Today in India
                      </span>
                      <span className="inline-flex items-center rounded-full bg-white/20 backdrop-blur-md px-2 py-0.5 text-[10px] font-semibold text-white">
                        {categoryLabel}
                      </span>
                      {story.state && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-800/80 backdrop-blur-md px-2 py-0.5 text-[10px] font-medium text-slate-200">
                          <MapPin className="size-2.5 text-amber-400" />
                          {story.state}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Main Body */}
                <div className="p-4 space-y-5">
                  {/* Title & Subtitle */}
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-amber-400 font-medium mb-1">
                      <Calendar className="size-3" />
                      <span>{formattedDate}</span>
                    </div>
                    <h1 className="text-xl font-black text-white leading-tight">
                      {story.title || "Untitled Story"}
                    </h1>
                    {story.subtitle && (
                      <p className="mt-1 text-xs text-slate-300 font-medium leading-relaxed">
                        {story.subtitle}
                      </p>
                    )}
                  </div>

                  {/* Description Paragraph */}
                  <div className="rounded-xl bg-slate-800/60 p-3.5 border border-slate-700/50">
                    <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                      {story.description || "No description provided yet."}
                    </p>
                  </div>

                  {/* Dynamic Tags */}
                  {story.tags && story.tags.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        <Tag className="size-3 text-amber-400" />
                        <span>Key Highlights & Tags</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {story.tags.map((t, idx) => (
                          <div
                            key={idx}
                            className="rounded-lg bg-slate-800 px-2.5 py-1.5 border border-slate-700 text-left"
                          >
                            <p className="text-xs font-bold text-white leading-none">{t.title}</p>
                            {t.subtitle && (
                              <p className="text-[10px] text-slate-400 mt-0.5">{t.subtitle}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Festive Gallery */}
                  {story.festive_gallery && story.festive_gallery.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        <Sparkles className="size-3 text-amber-400" />
                        <span>Visual Gallery</span>
                      </div>
                      <div className="space-y-2.5">
                        {story.festive_gallery.map((g, idx) => (
                          <div
                            key={idx}
                            className="rounded-xl overflow-hidden bg-slate-800 border border-slate-700"
                          >
                            {g.image_url && (
                              <img
                                src={g.image_url}
                                alt={g.title}
                                className="w-full h-32 object-cover"
                                referrerPolicy="no-referrer"
                              />
                            )}
                            <div className="p-2.5">
                              <p className="text-xs font-bold text-white">{g.title}</p>
                              {g.subtitle && (
                                <p className="text-[10px] text-slate-400 mt-0.5">{g.subtitle}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Fact Card */}
                  {(story.fact_title || story.fact_description) && (
                    <div className="rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/30 p-3.5 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                        <Lightbulb className="size-4" />
                        <span>Did You Know?</span>
                      </div>
                      {story.fact_image_url && (
                        <img
                          src={story.fact_image_url}
                          alt={story.fact_title || "Fact"}
                          className="w-full h-28 object-cover rounded-lg"
                          referrerPolicy="no-referrer"
                        />
                      )}
                      {story.fact_title && (
                        <h4 className="text-xs font-bold text-white">{story.fact_title}</h4>
                      )}
                      {story.fact_description && (
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          {story.fact_description}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Footer padding */}
                  <div className="h-6" />
                </div>
              </div>

              {/* Bottom Home Indicator Bar */}
              <div className="h-5 w-full flex items-center justify-center pb-1">
                <div className="w-28 h-1 bg-white/30 rounded-full" />
              </div>
            </div>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
