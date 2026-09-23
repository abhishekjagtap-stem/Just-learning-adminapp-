import { useCallback, useEffect, useState } from "react"
import { Dialog } from "@base-ui/react/dialog"
import { Header } from "@/components/dashboard/header"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { 
  getLanguageSystemStats, 
  getLanguageSystemWords,
  getLanguageSystemWordDetail,
  type LanguageSystemStats, 
  type AdminDailyWord,
  type AdminDailyWordDetail
} from "@/lib/api"
import { X, Languages, Volume2, Globe, AlertCircle, Play, Eye } from "lucide-react"

export function LanguageSystemPage() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  
  const [stats, setStats] = useState<LanguageSystemStats | null>(null)
  const [words, setWords] = useState<AdminDailyWord[]>([])
  
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [isLoadingWords, setIsLoadingWords] = useState(true)

  // Detail Modal State
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedWord, setSelectedWord] = useState<AdminDailyWordDetail | null>(null)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)
  
  const { toast } = useToast()

  const loadData = useCallback(async () => {
    setIsLoadingStats(true)
    setIsLoadingWords(true)
    
    try {
      const statsData = await getLanguageSystemStats()
      setStats(statsData)
    } catch (error) {
      toast(error instanceof Error ? error.message : "Unable to load pipeline stats.", "error")
    } finally {
      setIsLoadingStats(false)
    }

    try {
      const wordsResponse = await getLanguageSystemWords()
      if ('results' in wordsResponse) {
        setWords(wordsResponse.results)
      } else {
        setWords(wordsResponse as AdminDailyWord[])
      }
    } catch (error) {
      toast(error instanceof Error ? error.message : "Unable to load words.", "error")
    } finally {
      setIsLoadingWords(false)
    }
  }, [toast])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const openWordDetail = async (id: number) => {
    setDetailOpen(true)
    setIsLoadingDetail(true)
    setSelectedWord(null)
    try {
      const detail = await getLanguageSystemWordDetail(id)
      setSelectedWord(detail)
    } catch (error) {
      toast(error instanceof Error ? error.message : "Unable to load word details.", "error")
      setDetailOpen(false)
    } finally {
      setIsLoadingDetail(false)
    }
  }

  const playAudio = (url: string | undefined) => {
    if (!url) return
    const audio = new Audio(url)
    audio.play().catch((err) => {
      console.error("Audio playback failed", err)
      toast("Unable to play audio. Ensure the media URL is accessible.", "error")
    })
  }

  return (
    <div className="flex min-h-svh">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
      
      <div className="flex min-w-0 flex-1 flex-col">
        <Header title="Language System" onMenuClick={() => setMobileOpen(true)} />
        
        <main className="flex-1 p-4 sm:p-7">
          <div className="mx-auto max-w-7xl">
            
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold">Language Content Pipeline</h2>
                <p className="mt-1 text-sm text-muted-foreground">Monitor generated translations and audio for the Daily Words.</p>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-center gap-4 rounded-xl border bg-card p-5">
                <div className="grid size-12 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                  <Languages className="size-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Words</p>
                  <p className="text-2xl font-semibold">
                    {isLoadingStats ? <Skeleton className="h-8 w-16 mt-1" /> : stats?.total_words || 0}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 rounded-xl border bg-card p-5">
                <div className="grid size-12 shrink-0 place-items-center rounded-full bg-blue-500/10 text-blue-600">
                  <Globe className="size-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Translations</p>
                  <p className="text-2xl font-semibold">
                    {isLoadingStats ? <Skeleton className="h-8 w-16 mt-1" /> : stats?.total_translations || 0}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 rounded-xl border bg-card p-5">
                <div className="grid size-12 shrink-0 place-items-center rounded-full bg-emerald-500/10 text-emerald-600">
                  <Volume2 className="size-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Audio Files</p>
                  <p className="text-2xl font-semibold">
                    {isLoadingStats ? <Skeleton className="h-8 w-16 mt-1" /> : stats?.total_audio || 0}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 rounded-xl border bg-card p-5">
                <div className="grid size-12 shrink-0 place-items-center rounded-full bg-destructive/10 text-destructive">
                  <AlertCircle className="size-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Failures</p>
                  <p className="text-2xl font-semibold">
                    {isLoadingStats ? <Skeleton className="h-8 w-16 mt-1" /> : (stats?.failed_translations || 0) + (stats?.failed_audio || 0)}
                  </p>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-xl border bg-card">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] text-left text-sm">
                  <thead className="border-b bg-muted/50 text-muted-foreground">
                    <tr>
                      <th className="px-5 py-3 font-medium">Day</th>
                      <th className="px-5 py-3 font-medium">Master Word</th>
                      <th className="px-5 py-3 font-medium">Category</th>
                      <th className="px-5 py-3 font-medium text-center">Translations</th>
                      <th className="px-5 py-3 font-medium text-center">Audio</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoadingWords ? (
                      Array.from({ length: 5 }, (_, index) => (
                        <tr key={index} className="border-b last:border-0">
                          <td className="px-5 py-4"><Skeleton className="h-4 w-8" /></td>
                          <td className="px-5 py-4"><Skeleton className="h-4 w-32" /></td>
                          <td className="px-5 py-4"><Skeleton className="h-4 w-20" /></td>
                          <td className="px-5 py-4"><Skeleton className="h-4 w-8 mx-auto" /></td>
                          <td className="px-5 py-4"><Skeleton className="h-4 w-8 mx-auto" /></td>
                          <td className="px-5 py-4"><Skeleton className="h-5 w-20 rounded-full" /></td>
                          <td className="px-5 py-4 flex justify-end"><Skeleton className="h-8 w-24" /></td>
                        </tr>
                      ))
                    ) : words.map((word) => (
                      <tr key={word.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="px-5 py-4 font-medium text-muted-foreground">Day {word.day_number}</td>
                        <td className="px-5 py-4 font-medium text-lg">{word.word}</td>
                        <td className="px-5 py-4">{word.category || <span className="text-muted-foreground italic">None</span>}</td>
                        <td className="px-5 py-4 text-center font-medium">{word.translations_count}</td>
                        <td className="px-5 py-4 text-center font-medium">{word.audio_count}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                            word.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-800' :
                            word.status === 'AUDIO_READY' ? 'bg-blue-100 text-blue-800' :
                            word.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {word.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Button variant="outline" size="sm" onClick={() => openWordDetail(word.id)}>
                            <Eye className="size-4 mr-2" />
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {!isLoadingWords && words.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">
                          No pipeline data found. Run the generator script to create words.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
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

      {/* Word Detail Dialog */}
      <Dialog.Root open={detailOpen} onOpenChange={setDetailOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50 animate-in fade-in duration-200" />
          <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <Dialog.Popup className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col rounded-xl border bg-card shadow-xl animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-200">
              <div className="flex items-center justify-between border-b px-6 py-4 shrink-0">
                <div>
                  <Dialog.Title className="text-xl font-bold flex items-center gap-3">
                    {isLoadingDetail ? <Skeleton className="h-7 w-32" /> : selectedWord?.word}
                    {!isLoadingDetail && selectedWord && (
                      <span className="text-sm font-medium bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                        Day {selectedWord.day_number}
                      </span>
                    )}
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                    {isLoadingDetail ? <Skeleton className="h-4 w-64 mt-2" /> : selectedWord?.english_sentence}
                  </Dialog.Description>
                </div>
                <Dialog.Close render={<Button variant="ghost" size="icon"><X className="size-5" /></Button>} />
              </div>
              
              <div className="overflow-y-auto p-6 bg-muted/20">
                {isLoadingDetail ? (
                  <div className="space-y-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-24 w-full rounded-xl" />
                    ))}
                  </div>
                ) : selectedWord?.translations.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No successful translations found for this word.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedWord?.translations.map((t, idx) => (
                      <div key={idx} className="rounded-xl border bg-card p-4 shadow-sm flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-3">
                            <span className="font-semibold text-sm bg-primary/10 text-primary px-2 py-1 rounded">
                              {t.language.name}
                            </span>
                            <span className="text-xs text-muted-foreground font-mono">
                              {t.language.native_name}
                            </span>
                          </div>
                          <p className="text-lg font-medium mb-2">{t.translated_word}</p>
                          <p className="text-sm text-muted-foreground line-clamp-2">{t.translated_sentence}</p>
                        </div>
                        
                        <div className="flex gap-2 mt-4 pt-4 border-t">
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            className="flex-1"
                            disabled={!t.audio?.word_audio_url}
                            onClick={() => playAudio(t.audio?.word_audio_url)}
                          >
                            <Play className="size-3 mr-2" />
                            Word
                          </Button>
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            className="flex-1"
                            disabled={!t.audio?.sentence_audio_url}
                            onClick={() => playAudio(t.audio?.sentence_audio_url)}
                          >
                            <Play className="size-3 mr-2" />
                            Sentence
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>

    </div>
  )
}
