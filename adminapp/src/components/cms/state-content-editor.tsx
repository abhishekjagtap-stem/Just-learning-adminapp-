import { useState } from "react"
import {
  ArrowLeft,
  Save,
  Eye,
  Plus,
  Trash2,
  BookOpen,
  Palette,
  Compass,
  Crown,
  Calendar,
  Utensils,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type {
  StateCulturalContent,
  DestinationTag,
  TimelineEvent,
  StateFestival,
  StateFood,
  StateArtCraft,
  IconicDestination,
  StateLegend,
} from "@/lib/api"

export const ALL_INDIAN_STATES: { name: string; code: string; capital: string; defaultLanguage: string }[] = [
  { name: "Andhra Pradesh", code: "AP", capital: "Amaravati", defaultLanguage: "Telugu" },
  { name: "Arunachal Pradesh", code: "AR", capital: "Itanagar", defaultLanguage: "English" },
  { name: "Assam", code: "AS", capital: "Dispur", defaultLanguage: "Assamese" },
  { name: "Bihar", code: "BR", capital: "Patna", defaultLanguage: "Hindi" },
  { name: "Chhattisgarh", code: "CG", capital: "Raipur", defaultLanguage: "Chhattisgarhi" },
  { name: "Goa", code: "GA", capital: "Panaji", defaultLanguage: "Konkani" },
  { name: "Gujarat", code: "GJ", capital: "Gandhinagar", defaultLanguage: "Gujarati" },
  { name: "Haryana", code: "HR", capital: "Chandigarh", defaultLanguage: "Hindi" },
  { name: "Himachal Pradesh", code: "HP", capital: "Shimla", defaultLanguage: "Hindi" },
  { name: "Jharkhand", code: "JH", capital: "Ranchi", defaultLanguage: "Hindi" },
  { name: "Karnataka", code: "KA", capital: "Bengaluru", defaultLanguage: "Kannada" },
  { name: "Kerala", code: "KL", capital: "Thiruvananthapuram", defaultLanguage: "Malayalam" },
  { name: "Madhya Pradesh", code: "MP", capital: "Bhopal", defaultLanguage: "Hindi" },
  { name: "Maharashtra", code: "MH", capital: "Mumbai", defaultLanguage: "Marathi" },
  { name: "Manipur", code: "MN", capital: "Imphal", defaultLanguage: "Meitei" },
  { name: "Meghalaya", code: "ML", capital: "Shillong", defaultLanguage: "English" },
  { name: "Mizoram", code: "MZ", capital: "Aizawl", defaultLanguage: "Mizo" },
  { name: "Nagaland", code: "NL", capital: "Kohima", defaultLanguage: "English" },
  { name: "Odisha", code: "OR", capital: "Bhubaneswar", defaultLanguage: "Odia" },
  { name: "Punjab", code: "PB", capital: "Chandigarh", defaultLanguage: "Punjabi" },
  { name: "Rajasthan", code: "RJ", capital: "Jaipur", defaultLanguage: "Hindi" },
  { name: "Sikkim", code: "SK", capital: "Gangtok", defaultLanguage: "Nepali" },
  { name: "Tamil Nadu", code: "TN", capital: "Chennai", defaultLanguage: "Tamil" },
  { name: "Telangana", code: "TG", capital: "Hyderabad", defaultLanguage: "Telugu" },
  { name: "Tripura", code: "TR", capital: "Agartala", defaultLanguage: "Bengali" },
  { name: "Uttar Pradesh", code: "UP", capital: "Lucknow", defaultLanguage: "Hindi" },
  { name: "Uttarakhand", code: "UK", capital: "Dehradun", defaultLanguage: "Hindi" },
  { name: "West Bengal", code: "WB", capital: "Kolkata", defaultLanguage: "Bengali" },
  // Union Territories
  { name: "Andaman and Nicobar Islands", code: "AN", capital: "Port Blair", defaultLanguage: "Hindi" },
  { name: "Chandigarh", code: "CH", capital: "Chandigarh", defaultLanguage: "Hindi" },
  { name: "Dadra and Nagar Haveli and Daman and Diu", code: "DH", capital: "Daman", defaultLanguage: "Gujarati" },
  { name: "Delhi", code: "DL", capital: "New Delhi", defaultLanguage: "Hindi" },
  { name: "Jammu and Kashmir", code: "JK", capital: "Srinagar / Jammu", defaultLanguage: "Kashmiri" },
  { name: "Ladakh", code: "LA", capital: "Leh", defaultLanguage: "Ladakhi" },
  { name: "Lakshadweep", code: "LD", capital: "Kavaratti", defaultLanguage: "Malayalam" },
  { name: "Puducherry", code: "PY", capital: "Puducherry", defaultLanguage: "Tamil" },
]

interface StateContentEditorProps {
  initialData: StateCulturalContent | null
  preselectedState?: { name: string; code: string; capital: string; defaultLanguage: string } | null
  onSave: (payload: StateCulturalContent) => Promise<void>
  onCancel: () => void
  onPreview: (content: StateCulturalContent) => void
  isSaving: boolean
}

export function StateContentEditor({
  initialData,
  preselectedState,
  onSave,
  onCancel,
  onPreview,
  isSaving,
}: StateContentEditorProps) {
  const isEditing = Boolean(initialData?.id || initialData?.state_name)

  const defaultState = preselectedState || ALL_INDIAN_STATES.find((s) => s.name === "Maharashtra") || ALL_INDIAN_STATES[0]

  const [stateName, setStateName] = useState(initialData?.state_name || defaultState.name)
  const [capital, setCapital] = useState(initialData?.capital || defaultState.capital)
  const [language, setLanguage] = useState(initialData?.language_spoken_mostly || defaultState.defaultLanguage)
  const [subtitle, setSubtitle] = useState(initialData?.subtitle || "")
  const [heroImageUrl, setHeroImageUrl] = useState(initialData?.hero_image_url || "")
  const [isPublished, setIsPublished] = useState(initialData?.is_published ?? true)

  // Tab 1: The Story
  const [storyTitle, setStoryTitle] = useState(initialData?.the_story?.title || "")
  const [storyDescription, setStoryDescription] = useState(initialData?.the_story?.description || "")
  const [timeline, setTimeline] = useState<TimelineEvent[]>(
    initialData?.the_story?.timeline || [
      { year_or_era: "", title: "", description: "", order: 1 },
    ]
  )

  // Tab 2: The Culture
  const [festivals, setFestivals] = useState<StateFestival[]>(
    initialData?.the_culture?.festivals || [
      { title: "", image_url: "", description: "", order: 1 },
    ]
  )
  const [foods, setFoods] = useState<StateFood[]>(
    initialData?.the_culture?.foods || [
      { dish_name: "", image_url: "", origin: "", ingredients: "", order: 1 },
    ]
  )
  const [artsAndCrafts, setArtsAndCrafts] = useState<StateArtCraft[]>(
    initialData?.the_culture?.arts_and_crafts || [
      { title: "", image_url: "", description: "", order: 1 },
    ]
  )

  // Tab 3: The Land
  const [geoImageUrl, setGeoImageUrl] = useState(initialData?.the_land?.geographic_image_url || "")
  const [geoOverview, setGeoOverview] = useState(initialData?.the_land?.geographic_overview || "")
  const [destinations, setDestinations] = useState<IconicDestination[]>(
    initialData?.the_land?.iconic_destinations || [
      { title: "", category_tag: "forts", image_url: "", description: "", fact: "", order: 1 },
    ]
  )

  // Tab 4: The Legends
  const [legends, setLegends] = useState<StateLegend[]>(
    initialData?.the_legends || [
      { name: "", subtitle: "", image_url: "", description: "", order: 1 },
    ]
  )

  const [activeEditorTab, setActiveEditorTab] = useState<"general" | "story" | "culture" | "land" | "legends">("general")

  // On selecting a state from dropdown, auto-fill capital and language if not already set
  const handleStateSelect = (name: string) => {
    setStateName(name)
    const match = ALL_INDIAN_STATES.find((s) => s.name === name)
    if (match) {
      if (!capital || capital === defaultState.capital) setCapital(match.capital)
      if (!language || language === defaultState.defaultLanguage) setLanguage(match.defaultLanguage)
    }
  }

  // Build the complete StateCulturalContent payload
  const buildPayload = (): StateCulturalContent => {
    const stateObj = ALL_INDIAN_STATES.find((s) => s.name === stateName)
    return {
      ...(initialData?.id ? { id: initialData.id } : {}),
      state_name: stateName,
      state_code: stateObj?.code || initialData?.state_code || "",
      capital,
      language_spoken_mostly: language,
      subtitle,
      hero_image_url: heroImageUrl,
      is_published: isPublished,
      the_story: {
        title: storyTitle,
        description: storyDescription,
        timeline: timeline.filter((t) => t.title.trim() !== ""),
      },
      the_culture: {
        festivals: festivals.filter((f) => f.title.trim() !== ""),
        foods: foods.filter((f) => f.dish_name.trim() !== ""),
        arts_and_crafts: artsAndCrafts.filter((a) => a.title.trim() !== ""),
      },
      the_land: {
        geographic_image_url: geoImageUrl,
        geographic_overview: geoOverview,
        iconic_destinations: destinations.filter((d) => d.title.trim() !== ""),
      },
      the_legends: legends.filter((l) => l.name.trim() !== ""),
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload = buildPayload()
    onSave(payload)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Top Sticky Header */}
      <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 dark:border-border bg-white/95 dark:bg-card/95 p-4 shadow-sm backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            className="h-8 gap-1.5 font-bold"
          >
            <ArrowLeft className="size-4" />
            Back to Directory
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900 dark:text-foreground">
                {isEditing ? `Edit ${stateName}` : "Create State Cultural Content"}
              </h3>
              <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                {ALL_INDIAN_STATES.find((s) => s.name === stateName)?.code || "IN"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Atomic multi-tab content structure (Hero + 4 Tabs)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Published Toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none border border-slate-200 dark:border-border rounded-lg px-3 py-1.5 bg-slate-50 dark:bg-muted/40">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="size-4 rounded text-primary focus:ring-primary"
            />
            <span className={cn("text-xs font-bold", isPublished ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400")}>
              {isPublished ? "Published Live" : "Draft Only"}
            </span>
          </label>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onPreview(buildPayload())}
            className="h-9 gap-1.5 font-bold border-slate-300 dark:border-border"
          >
            <Eye className="size-4" />
            Live Preview
          </Button>

          <Button
            type="submit"
            disabled={isSaving}
            className="h-9 gap-1.5 font-bold shadow-xs"
          >
            <Save className="size-4" />
            {isSaving ? "Saving..." : isEditing ? "Save Changes" : "Create State Content"}
          </Button>
        </div>
      </div>

      {/* Editor Sub-Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-border pb-2 overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveEditorTab("general")}
          className={cn(
            "flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition cursor-pointer select-none",
            activeEditorTab === "general"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground border border-border"
          )}
        >
          <Sparkles className="size-4" />
          General & Hero Info
        </button>
        <button
          type="button"
          onClick={() => setActiveEditorTab("story")}
          className={cn(
            "flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition cursor-pointer select-none",
            activeEditorTab === "story"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground border border-border"
          )}
        >
          <BookOpen className="size-4" />
          Tab 1: The Story ({timeline.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveEditorTab("culture")}
          className={cn(
            "flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition cursor-pointer select-none",
            activeEditorTab === "culture"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground border border-border"
          )}
        >
          <Palette className="size-4" />
          Tab 2: The Culture ({festivals.length + foods.length + artsAndCrafts.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveEditorTab("land")}
          className={cn(
            "flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition cursor-pointer select-none",
            activeEditorTab === "land"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground border border-border"
          )}
        >
          <Compass className="size-4" />
          Tab 3: The Land ({destinations.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveEditorTab("legends")}
          className={cn(
            "flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition cursor-pointer select-none",
            activeEditorTab === "legends"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground border border-border"
          )}
        >
          <Crown className="size-4" />
          Tab 4: The Legends ({legends.length})
        </button>
      </div>

      {/* SECTION: GENERAL & HERO */}
      {activeEditorTab === "general" && (
        <div className="rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-card p-6 shadow-sm space-y-6">
          <div className="border-b border-border pb-3">
            <h4 className="text-base font-bold text-slate-900 dark:text-foreground">Hero & State Overview</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Core identity parameters shown at the top of the cultural page.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                State / Union Territory *
              </label>
              <select
                value={stateName}
                onChange={(e) => handleStateSelect(e.target.value)}
                className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 dark:border-border bg-white dark:bg-background px-3 text-sm font-semibold outline-none focus:border-primary shadow-2xs"
              >
                {ALL_INDIAN_STATES.map((st) => (
                  <option key={st.code} value={st.name}>
                    {st.name} ({st.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Capital City *
              </label>
              <input
                required
                type="text"
                value={capital}
                onChange={(e) => setCapital(e.target.value)}
                placeholder="e.g. Mumbai"
                className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 dark:border-border bg-white dark:bg-background px-3 text-sm font-semibold outline-none focus:border-primary shadow-2xs"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Primary Language Spoken *
              </label>
              <input
                required
                type="text"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                placeholder="e.g. Marathi"
                className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 dark:border-border bg-white dark:bg-background px-3 text-sm font-semibold outline-none focus:border-primary shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Subtitle / Motto *
              </label>
              <input
                required
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="e.g. Gateway to India's Rich Heritage and Industry"
                className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 dark:border-border bg-white dark:bg-background px-3 text-sm font-semibold outline-none focus:border-primary shadow-2xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Hero Image URL
            </label>
            <div className="mt-1.5 flex gap-3">
              <input
                type="url"
                value={heroImageUrl}
                onChange={(e) => setHeroImageUrl(e.target.value)}
                placeholder="https://example.com/maharashtra_hero.jpg"
                className="h-10 flex-1 rounded-lg border border-slate-300 dark:border-border bg-white dark:bg-background px-3 text-sm font-medium outline-none focus:border-primary shadow-2xs"
              />
            </div>
            {heroImageUrl && (
              <div className="mt-3 relative h-40 w-full rounded-lg overflow-hidden border border-border bg-muted">
                <img
                  src={heroImageUrl}
                  alt="Hero Preview"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none"
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION: TAB 1 - THE STORY */}
      {activeEditorTab === "story" && (
        <div className="rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-card p-6 shadow-sm space-y-6">
          <div className="border-b border-border pb-3">
            <h4 className="text-base font-bold text-slate-900 dark:text-foreground">Tab 1: The Story Timeline</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Narrative arc and chronological milestones in the state's historical journey.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Story Title *
              </label>
              <input
                required
                type="text"
                value={storyTitle}
                onChange={(e) => setStoryTitle(e.target.value)}
                placeholder="e.g. The Historic Maratha Saga"
                className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 dark:border-border bg-white dark:bg-background px-3 text-sm font-semibold outline-none focus:border-primary shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Story Overview Description *
              </label>
              <textarea
                required
                rows={3}
                value={storyDescription}
                onChange={(e) => setStoryDescription(e.target.value)}
                placeholder="e.g. Maharashtra has a deep-rooted history starting from the Satavahanas to Shivaji Maharaj..."
                className="mt-1.5 w-full rounded-lg border border-slate-300 dark:border-border bg-white dark:bg-background p-3 text-sm font-medium outline-none focus:border-primary shadow-2xs leading-relaxed"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h5 className="font-bold text-sm text-foreground">Timeline Milestones</h5>
                <p className="text-xs text-muted-foreground">Historical eras and pivotal events in chronological order.</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setTimeline([
                    ...timeline,
                    { year_or_era: "", title: "", description: "", order: timeline.length + 1 },
                  ])
                }
                className="gap-1.5 font-bold"
              >
                <Plus className="size-4" />
                Add Milestone
              </Button>
            </div>

            <div className="space-y-4">
              {timeline.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200 dark:border-border bg-slate-50 dark:bg-muted/30 p-4 space-y-3 relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                      Milestone #{idx + 1}
                    </span>
                    {timeline.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setTimeline(timeline.filter((_, i) => i !== idx))}
                        className="text-muted-foreground hover:text-destructive p-1 transition cursor-pointer"
                        title="Delete milestone"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
                    <div>
                      <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                        Year / Era *
                      </label>
                      <input
                        required
                        type="text"
                        value={item.year_or_era}
                        onChange={(e) => {
                          const updated = [...timeline]
                          updated[idx].year_or_era = e.target.value
                          setTimeline(updated)
                        }}
                        placeholder="e.g. 1674 CE"
                        className="mt-1 h-9 w-full rounded-lg border border-slate-300 dark:border-border bg-white dark:bg-background px-3 text-xs font-semibold outline-none focus:border-primary shadow-2xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                        Milestone Title *
                      </label>
                      <input
                        required
                        type="text"
                        value={item.title}
                        onChange={(e) => {
                          const updated = [...timeline]
                          updated[idx].title = e.target.value
                          setTimeline(updated)
                        }}
                        placeholder="e.g. Coronation of Chhatrapati Shivaji Maharaj"
                        className="mt-1 h-9 w-full rounded-lg border border-slate-300 dark:border-border bg-white dark:bg-background px-3 text-xs font-semibold outline-none focus:border-primary shadow-2xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      Detailed Narrative Description *
                    </label>
                    <textarea
                      required
                      rows={2}
                      value={item.description}
                      onChange={(e) => {
                        const updated = [...timeline]
                        updated[idx].description = e.target.value
                        setTimeline(updated)
                      }}
                      placeholder="e.g. Establishment of Hindavi Swarajya at Raigad Fort..."
                      className="mt-1 w-full rounded-lg border border-slate-300 dark:border-border bg-white dark:bg-background p-2 text-xs font-medium outline-none focus:border-primary shadow-2xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION: TAB 2 - THE CULTURE */}
      {activeEditorTab === "culture" && (
        <div className="space-y-6">
          {/* Festivals */}
          <div className="rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="size-5 text-amber-500" />
                <div>
                  <h4 className="font-bold text-base text-slate-900 dark:text-foreground">Celebrated Festivals</h4>
                  <p className="text-xs text-muted-foreground">Cultural festivals unique to this state.</p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setFestivals([...festivals, { title: "", image_url: "", description: "", order: festivals.length + 1 }])
                }
                className="gap-1.5 font-bold"
              >
                <Plus className="size-4" />
                Add Festival
              </Button>
            </div>

            <div className="space-y-4">
              {festivals.map((fest, idx) => (
                <div key={idx} className="rounded-xl border border-slate-200 dark:border-border bg-slate-50 dark:bg-muted/30 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-amber-800 dark:text-amber-300">
                      Festival #{idx + 1}
                    </span>
                    {festivals.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setFestivals(festivals.filter((_, i) => i !== idx))}
                        className="text-muted-foreground hover:text-destructive p-1 transition cursor-pointer"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                        Festival Title *
                      </label>
                      <input
                        required
                        type="text"
                        value={fest.title}
                        onChange={(e) => {
                          const updated = [...festivals]
                          updated[idx].title = e.target.value
                          setFestivals(updated)
                        }}
                        placeholder="e.g. Ganesh Chaturthi"
                        className="mt-1 h-9 w-full rounded-lg border border-slate-300 dark:border-border bg-white dark:bg-background px-3 text-xs font-semibold outline-none focus:border-primary shadow-2xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                        Image URL
                      </label>
                      <input
                        type="url"
                        value={fest.image_url}
                        onChange={(e) => {
                          const updated = [...festivals]
                          updated[idx].image_url = e.target.value
                          setFestivals(updated)
                        }}
                        placeholder="https://example.com/ganesh.jpg"
                        className="mt-1 h-9 w-full rounded-lg border border-slate-300 dark:border-border bg-white dark:bg-background px-3 text-xs font-medium outline-none focus:border-primary shadow-2xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      Description *
                    </label>
                    <textarea
                      required
                      rows={2}
                      value={fest.description}
                      onChange={(e) => {
                        const updated = [...festivals]
                        updated[idx].description = e.target.value
                        setFestivals(updated)
                      }}
                      placeholder="e.g. A 10-day grand spectacle honoring Lord Ganesha with music and processions..."
                      className="mt-1 w-full rounded-lg border border-slate-300 dark:border-border bg-white dark:bg-background p-2 text-xs font-medium outline-none focus:border-primary shadow-2xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Traditional Foods */}
          <div className="rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Utensils className="size-5 text-emerald-500" />
                <div>
                  <h4 className="font-bold text-base text-slate-900 dark:text-foreground">Culinary Delicacies</h4>
                  <p className="text-xs text-muted-foreground">Famous traditional dishes and their key ingredients.</p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setFoods([
                    ...foods,
                    { dish_name: "", image_url: "", origin: stateName, ingredients: "", order: foods.length + 1 },
                  ])
                }
                className="gap-1.5 font-bold"
              >
                <Plus className="size-4" />
                Add Food
              </Button>
            </div>

            <div className="space-y-4">
              {foods.map((food, idx) => (
                <div key={idx} className="rounded-xl border border-slate-200 dark:border-border bg-slate-50 dark:bg-muted/30 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-emerald-800 dark:text-emerald-300">
                      Dish #{idx + 1}
                    </span>
                    {foods.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setFoods(foods.filter((_, i) => i !== idx))}
                        className="text-muted-foreground hover:text-destructive p-1 transition cursor-pointer"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                        Dish Name *
                      </label>
                      <input
                        required
                        type="text"
                        value={food.dish_name}
                        onChange={(e) => {
                          const updated = [...foods]
                          updated[idx].dish_name = e.target.value
                          setFoods(updated)
                        }}
                        placeholder="e.g. Puran Poli"
                        className="mt-1 h-9 w-full rounded-lg border border-slate-300 dark:border-border bg-white dark:bg-background px-3 text-xs font-semibold outline-none focus:border-primary shadow-2xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                        Origin / Region
                      </label>
                      <input
                        type="text"
                        value={food.origin}
                        onChange={(e) => {
                          const updated = [...foods]
                          updated[idx].origin = e.target.value
                          setFoods(updated)
                        }}
                        placeholder="e.g. Maharashtra"
                        className="mt-1 h-9 w-full rounded-lg border border-slate-300 dark:border-border bg-white dark:bg-background px-3 text-xs font-medium outline-none focus:border-primary shadow-2xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                        Image URL
                      </label>
                      <input
                        type="url"
                        value={food.image_url}
                        onChange={(e) => {
                          const updated = [...foods]
                          updated[idx].image_url = e.target.value
                          setFoods(updated)
                        }}
                        placeholder="https://example.com/puran_poli.jpg"
                        className="mt-1 h-9 w-full rounded-lg border border-slate-300 dark:border-border bg-white dark:bg-background px-3 text-xs font-medium outline-none focus:border-primary shadow-2xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      Ingredients (What it is made up of) *
                    </label>
                    <input
                      required
                      type="text"
                      value={food.ingredients}
                      onChange={(e) => {
                        const updated = [...foods]
                        updated[idx].ingredients = e.target.value
                        setFoods(updated)
                      }}
                      placeholder="e.g. Chana dal, jaggery, nutmeg, whole wheat flour, ghee"
                      className="mt-1 h-9 w-full rounded-lg border border-slate-300 dark:border-border bg-white dark:bg-background px-3 text-xs font-medium outline-none focus:border-primary shadow-2xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Arts & Crafts */}
          <div className="rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Palette className="size-5 text-purple-500" />
                <div>
                  <h4 className="font-bold text-base text-slate-900 dark:text-foreground">Arts & Handicrafts</h4>
                  <p className="text-xs text-muted-foreground">Traditional folk arts, textile weaving, and craftwork.</p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setArtsAndCrafts([
                    ...artsAndCrafts,
                    { title: "", image_url: "", description: "", order: artsAndCrafts.length + 1 },
                  ])
                }
                className="gap-1.5 font-bold"
              >
                <Plus className="size-4" />
                Add Art & Craft
              </Button>
            </div>

            <div className="space-y-4">
              {artsAndCrafts.map((craft, idx) => (
                <div key={idx} className="rounded-xl border border-slate-200 dark:border-border bg-slate-50 dark:bg-muted/30 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-purple-800 dark:text-purple-300">
                      Craft #{idx + 1}
                    </span>
                    {artsAndCrafts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setArtsAndCrafts(artsAndCrafts.filter((_, i) => i !== idx))}
                        className="text-muted-foreground hover:text-destructive p-1 transition cursor-pointer"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                        Craft Title *
                      </label>
                      <input
                        required
                        type="text"
                        value={craft.title}
                        onChange={(e) => {
                          const updated = [...artsAndCrafts]
                          updated[idx].title = e.target.value
                          setArtsAndCrafts(updated)
                        }}
                        placeholder="e.g. Warli Folk Painting"
                        className="mt-1 h-9 w-full rounded-lg border border-slate-300 dark:border-border bg-white dark:bg-background px-3 text-xs font-semibold outline-none focus:border-primary shadow-2xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                        Image URL
                      </label>
                      <input
                        type="url"
                        value={craft.image_url}
                        onChange={(e) => {
                          const updated = [...artsAndCrafts]
                          updated[idx].image_url = e.target.value
                          setArtsAndCrafts(updated)
                        }}
                        placeholder="https://example.com/warli.jpg"
                        className="mt-1 h-9 w-full rounded-lg border border-slate-300 dark:border-border bg-white dark:bg-background px-3 text-xs font-medium outline-none focus:border-primary shadow-2xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      Description
                    </label>
                    <textarea
                      rows={2}
                      value={craft.description || ""}
                      onChange={(e) => {
                        const updated = [...artsAndCrafts]
                        updated[idx].description = e.target.value
                        setArtsAndCrafts(updated)
                      }}
                      placeholder="e.g. Traditional tribal art created using rice paste on mud walls..."
                      className="mt-1 w-full rounded-lg border border-slate-300 dark:border-border bg-white dark:bg-background p-2 text-xs font-medium outline-none focus:border-primary shadow-2xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION: TAB 3 - THE LAND */}
      {activeEditorTab === "land" && (
        <div className="rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-card p-6 shadow-sm space-y-6">
          <div className="border-b border-border pb-3">
            <h4 className="text-base font-bold text-slate-900 dark:text-foreground">Tab 3: The Land & Landmarks</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Topography, geographic overview, and classified iconic destinations.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Geographic Image URL
              </label>
              <input
                type="url"
                value={geoImageUrl}
                onChange={(e) => setGeoImageUrl(e.target.value)}
                placeholder="https://example.com/geography.jpg"
                className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 dark:border-border bg-white dark:bg-background px-3 text-sm font-medium outline-none focus:border-primary shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Geographic Overview Narrative *
              </label>
              <textarea
                required
                rows={3}
                value={geoOverview}
                onChange={(e) => setGeoOverview(e.target.value)}
                placeholder="e.g. Extends across the Western Ghats and Deccan Plateau with rich coastline and fertile river valleys..."
                className="mt-1.5 w-full rounded-lg border border-slate-300 dark:border-border bg-white dark:bg-background p-3 text-sm font-medium outline-none focus:border-primary shadow-2xs leading-relaxed"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h5 className="font-bold text-sm text-foreground">Iconic Destinations</h5>
                <p className="text-xs text-muted-foreground">Classified with tags (forts, palaces, temples, wildlife, nature).</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setDestinations([
                    ...destinations,
                    { title: "", category_tag: "forts", image_url: "", description: "", fact: "", order: destinations.length + 1 },
                  ])
                }
                className="gap-1.5 font-bold"
              >
                <Plus className="size-4" />
                Add Destination
              </Button>
            </div>

            <div className="space-y-4">
              {destinations.map((dest, idx) => (
                <div key={idx} className="rounded-xl border border-slate-200 dark:border-border bg-slate-50 dark:bg-muted/30 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-primary">
                      Destination #{idx + 1}
                    </span>
                    {destinations.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setDestinations(destinations.filter((_, i) => i !== idx))}
                        className="text-muted-foreground hover:text-destructive p-1 transition cursor-pointer"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                        Destination Title *
                      </label>
                      <input
                        required
                        type="text"
                        value={dest.title}
                        onChange={(e) => {
                          const updated = [...destinations]
                          updated[idx].title = e.target.value
                          setDestinations(updated)
                        }}
                        placeholder="e.g. Raigad Fort"
                        className="mt-1 h-9 w-full rounded-lg border border-slate-300 dark:border-border bg-white dark:bg-background px-3 text-xs font-semibold outline-none focus:border-primary shadow-2xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                        Category Tag *
                      </label>
                      <select
                        value={dest.category_tag}
                        onChange={(e) => {
                          const updated = [...destinations]
                          updated[idx].category_tag = e.target.value as DestinationTag
                          setDestinations(updated)
                        }}
                        className="mt-1 h-9 w-full rounded-lg border border-slate-300 dark:border-border bg-white dark:bg-background px-3 text-xs font-bold outline-none focus:border-primary shadow-2xs"
                      >
                        <option value="forts">🏰 Forts</option>
                        <option value="palaces">👑 Palaces</option>
                        <option value="temples">🛕 Temples</option>
                        <option value="wildlife">🐅 Wildlife</option>
                        <option value="nature">🌿 Nature</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                        Image URL
                      </label>
                      <input
                        type="url"
                        value={dest.image_url}
                        onChange={(e) => {
                          const updated = [...destinations]
                          updated[idx].image_url = e.target.value
                          setDestinations(updated)
                        }}
                        placeholder="https://example.com/raigad.jpg"
                        className="mt-1 h-9 w-full rounded-lg border border-slate-300 dark:border-border bg-white dark:bg-background px-3 text-xs font-medium outline-none focus:border-primary shadow-2xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      Description *
                    </label>
                    <textarea
                      required
                      rows={2}
                      value={dest.description}
                      onChange={(e) => {
                        const updated = [...destinations]
                        updated[idx].description = e.target.value
                        setDestinations(updated)
                      }}
                      placeholder="e.g. Hill fort situated in Mahad, capital of Maratha empire..."
                      className="mt-1 w-full rounded-lg border border-slate-300 dark:border-border bg-white dark:bg-background p-2 text-xs font-medium outline-none focus:border-primary shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="size-3 text-amber-500" />
                      Fascinating Fact *
                    </label>
                    <input
                      required
                      type="text"
                      value={dest.fact}
                      onChange={(e) => {
                        const updated = [...destinations]
                        updated[idx].fact = e.target.value
                        setDestinations(updated)
                      }}
                      placeholder="e.g. Ascending requires climbing over 1700 steps or taking the ropeway."
                      className="mt-1 h-9 w-full rounded-lg border border-amber-300 dark:border-amber-800 bg-white dark:bg-background px-3 text-xs font-medium outline-none focus:border-amber-500 shadow-2xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION: TAB 4 - THE LEGENDS */}
      {activeEditorTab === "legends" && (
        <div className="rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-card p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h4 className="text-base font-bold text-slate-900 dark:text-foreground">Tab 4: State Legends & Heroes</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Biographical profiles of historical figures, freedom fighters, and cultural leaders.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setLegends([
                  ...legends,
                  { name: "", subtitle: "", image_url: "", description: "", order: legends.length + 1 },
                ])
              }
              className="gap-1.5 font-bold"
            >
              <Plus className="size-4" />
              Add Legend
            </Button>
          </div>

          <div className="space-y-4">
            {legends.map((leg, idx) => (
              <div key={idx} className="rounded-xl border border-slate-200 dark:border-border bg-slate-50 dark:bg-muted/30 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-primary">
                    Legend #{idx + 1}
                  </span>
                  {legends.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setLegends(legends.filter((_, i) => i !== idx))}
                      className="text-muted-foreground hover:text-destructive p-1 transition cursor-pointer"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      Legend Name *
                    </label>
                    <input
                      required
                      type="text"
                      value={leg.name}
                      onChange={(e) => {
                        const updated = [...legends]
                        updated[idx].name = e.target.value
                        setLegends(updated)
                      }}
                      placeholder="e.g. Chhatrapati Shivaji Maharaj"
                      className="mt-1 h-9 w-full rounded-lg border border-slate-300 dark:border-border bg-white dark:bg-background px-3 text-xs font-semibold outline-none focus:border-primary shadow-2xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      Subtitle / Role *
                    </label>
                    <input
                      required
                      type="text"
                      value={leg.subtitle}
                      onChange={(e) => {
                        const updated = [...legends]
                        updated[idx].subtitle = e.target.value
                        setLegends(updated)
                      }}
                      placeholder="e.g. Founder of the Maratha Empire"
                      className="mt-1 h-9 w-full rounded-lg border border-slate-300 dark:border-border bg-white dark:bg-background px-3 text-xs font-semibold outline-none focus:border-primary shadow-2xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      Portrait Image URL
                    </label>
                    <input
                      type="url"
                      value={leg.image_url}
                      onChange={(e) => {
                        const updated = [...legends]
                        updated[idx].image_url = e.target.value
                        setLegends(updated)
                      }}
                      placeholder="https://example.com/shivaji.jpg"
                      className="mt-1 h-9 w-full rounded-lg border border-slate-300 dark:border-border bg-white dark:bg-background px-3 text-xs font-medium outline-none focus:border-primary shadow-2xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Detailed Narrative & Contributions *
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={leg.description}
                    onChange={(e) => {
                      const updated = [...legends]
                      updated[idx].description = e.target.value
                      setLegends(updated)
                    }}
                    placeholder="e.g. Legendary king and pioneer of guerrilla warfare strategies (Ganimi Kava)..."
                    className="mt-1 w-full rounded-lg border border-slate-300 dark:border-border bg-white dark:bg-background p-2 text-xs font-medium outline-none focus:border-primary shadow-2xs"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Sticky Action Bar */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
        <Button type="button" variant="outline" onClick={onCancel} className="font-semibold">
          Cancel
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => onPreview(buildPayload())}
          className="font-bold border-slate-300 dark:border-border"
        >
          <Eye className="size-4 mr-1.5" />
          Preview
        </Button>
        <Button type="submit" disabled={isSaving} className="font-bold shadow-xs">
          <Save className="size-4 mr-1.5" />
          {isSaving ? "Saving..." : isEditing ? "Save Changes" : "Create State Content"}
        </Button>
      </div>
    </form>
  )
}
