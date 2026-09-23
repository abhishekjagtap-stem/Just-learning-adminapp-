import { useCallback, useEffect, useState, type FormEvent } from "react"
import { Dialog } from "@base-ui/react/dialog"
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Edit,
  ExternalLink,
  Gamepad2,
  GitCompare,
  HelpCircle,
  Image as ImageIcon,
  ListOrdered,
  Radio as RadioIcon,
  Trash2,
  Type,
  X,
  XCircle,
} from "lucide-react"
import { Header } from "@/components/dashboard/header"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/toast"
import {
  deleteMCQQuestion,
  getMCQQuestionDetail,
  updateMCQQuestion,
  type MCQOption,
  type MCQQuestion,
  type QuestionType,
} from "@/lib/api"
import { navigateTo } from "@/lib/navigation"

export function MCQDetailPage({ questionId }: { questionId: number }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  const [question, setQuestion] = useState<MCQQuestion | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [copiedApiUrl, setCopiedApiUrl] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Edit Form State
  const [formQuestionType, setFormQuestionType] = useState<QuestionType>("standard")
  const [formQuestionText, setFormQuestionText] = useState("")
  const [formSubject, setFormSubject] = useState("")
  const [formDifficulty, setFormDifficulty] = useState<"beginner" | "intermediate" | "advanced">("beginner")
  const [formIsActive, setFormIsActive] = useState(true)
  const [formImageUrl, setFormImageUrl] = useState("")
  const [formScenarioText, setFormScenarioText] = useState("")
  const [formOptions, setFormOptions] = useState<MCQOption[]>([])
  const [formChronoItems, setFormChronoItems] = useState<string[]>(["", "", "", "", ""])
  const [formLeftCol, setFormLeftCol] = useState<string[]>(["", "", "", ""])
  const [formRightCol, setFormRightCol] = useState<string[]>(["", "", "", ""])
  const [formCorrectPairs, setFormCorrectPairs] = useState<Record<string, string>>({ "1": "", "2": "", "3": "", "4": "" })
  const [formMatchExplanation, setFormMatchExplanation] = useState("")

  const { toast } = useToast()

  const fetchDetail = useCallback(async () => {
    setIsLoading(true)
    setErrorMsg(null)
    try {
      const data = await getMCQQuestionDetail(questionId)
      setQuestion(data)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load MCQ question details."
      setErrorMsg(msg)
      toast(msg, "error")
    } finally {
      setIsLoading(false)
    }
  }, [questionId, toast])

  useEffect(() => {
    void fetchDetail()
  }, [fetchDetail])

  const openEditModal = () => {
    if (!question) return
    setFormQuestionType(question.question_type || "standard")
    setFormQuestionText(question.question_text)
    setFormSubject(question.subject)
    setFormDifficulty((question.difficulty as "beginner" | "intermediate" | "advanced") || "beginner")
    setFormIsActive(question.is_active)
    setFormImageUrl(question.image_url || "")
    setFormScenarioText(question.scenario_text || "")

    if (question.options && question.options.length > 0) {
      setFormOptions(
        question.options.map((opt) => ({
          id: opt.id,
          option_text: opt.option_text,
          image_url: opt.image_url || "",
          is_correct: opt.is_correct,
          explanation: opt.explanation,
        }))
      )
    } else {
      setFormOptions([
        { option_text: "", is_correct: true, explanation: "" },
        { option_text: "", is_correct: false, explanation: "" },
        { option_text: "", is_correct: false, explanation: "" },
        { option_text: "", is_correct: false, explanation: "" },
      ])
    }

    setFormChronoItems(
      question.metadata?.items && Array.isArray(question.metadata.items)
        ? question.metadata.items
        : ["", "", "", "", ""]
    )
    setFormLeftCol(
      question.metadata?.left_column && Array.isArray(question.metadata.left_column)
        ? question.metadata.left_column
        : ["", "", "", ""]
    )
    setFormRightCol(
      question.metadata?.right_column && Array.isArray(question.metadata.right_column)
        ? question.metadata.right_column
        : ["", "", "", ""]
    )
    setFormCorrectPairs(
      question.metadata?.correct_pairs && typeof question.metadata.correct_pairs === "object"
        ? question.metadata.correct_pairs
        : { "1": "", "2": "", "3": "", "4": "" }
    )
    setFormMatchExplanation(question.metadata?.explanation || "")
    setEditDialogOpen(true)
  }

  const handleCorrectOptionSelect = (selectedIndex: number) => {
    setFormOptions((prev) =>
      prev.map((opt, i) => ({
        ...opt,
        is_correct: i === selectedIndex,
      }))
    )
  }

  const handleOptionTextChange = (index: number, text: string) => {
    setFormOptions((prev) =>
      prev.map((opt, i) => (i === index ? { ...opt, option_text: text } : opt))
    )
  }

  const handleExplanationChange = (index: number, text: string) => {
    setFormOptions((prev) =>
      prev.map((opt, i) => (i === index ? { ...opt, explanation: text } : opt))
    )
  }

  const handleEditSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!question) return

    if (!formQuestionText.trim()) {
      toast("Question text is required.", "error")
      return
    }

    const payload: any = {
      question_type: formQuestionType,
      question_text: formQuestionText.trim(),
      subject: formSubject.trim(),
      difficulty: formDifficulty,
      is_active: formIsActive,
    }

    if (formQuestionType === "standard" || formQuestionType === "image_based" || formQuestionType === "scene_based") {
      if (formOptions.length !== 4) {
        toast("Must have exactly 4 options.", "error")
        return
      }
      const correctCount = formOptions.filter((o) => o.is_correct).length
      if (correctCount !== 1) {
        toast("Exactly 1 option must be marked as correct.", "error")
        return
      }

      if (formQuestionType === "image_based") {
        if (!formImageUrl.trim()) {
          toast("Image URL is required.", "error")
          return
        }
        payload.image_url = formImageUrl.trim()
      } else if (formQuestionType === "scene_based") {
        if (!formScenarioText.trim()) {
          toast("Scenario text is required.", "error")
          return
        }
        payload.scenario_text = formScenarioText.trim()
        if (formImageUrl.trim()) payload.image_url = formImageUrl.trim()
      }

      payload.options = formOptions.map((o) => ({
        id: o.id,
        option_text: o.option_text.trim(),
        image_url: o.image_url?.trim() || null,
        is_correct: o.is_correct,
        explanation: o.explanation.trim(),
      }))
    } else if (formQuestionType === "chronological") {
      if (formChronoItems.length !== 5 || formChronoItems.some((i) => !i.trim())) {
        toast("All 5 sequence items must be filled.", "error")
        return
      }
      payload.metadata = { items: formChronoItems.map((item) => item.trim()) }
      payload.options = []
    } else if (formQuestionType === "match_following") {
      if (formLeftCol.some((i) => !i.trim()) || formRightCol.some((i) => !i.trim())) {
        toast("All left and right column items must be filled.", "error")
        return
      }
      payload.metadata = {
        left_column: formLeftCol.map((item) => item.trim()),
        right_column: formRightCol.map((item) => item.trim()),
        correct_pairs: formCorrectPairs,
        explanation: formMatchExplanation.trim() || undefined,
      }
      payload.options = []
    }

    setIsSavingEdit(true)
    try {
      await updateMCQQuestion(question.id, payload)
      setEditDialogOpen(false)
      toast("Question updated successfully!")
      await fetchDetail()
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to update question.", "error")
    } finally {
      setIsSavingEdit(false)
    }
  }

  const handleDelete = async () => {
    if (!question) return
    setIsDeleting(true)
    try {
      await deleteMCQQuestion(question.id)
      toast("Question deleted successfully.")
      navigateTo("/games/mcq")
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to delete question.", "error")
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  const copyEndpointUrl = () => {
    const url = `${window.location.protocol}//${window.location.host}/api/admin-side/mcq-questions/${questionId}/`
    navigator.clipboard.writeText(url)
    setCopiedApiUrl(true)
    setTimeout(() => setCopiedApiUrl(false), 2000)
    toast("Endpoint URL copied to clipboard!")
  }

  const getTypeBadge = (type?: QuestionType) => {
    switch (type) {
      case "standard":
        return { label: "Standard Text", icon: Type, className: "bg-slate-500/15 text-slate-700 dark:text-slate-200 border-slate-500/30" }
      case "image_based":
        return { label: "Image-Based", icon: ImageIcon, className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30" }
      case "scene_based":
        return { label: "Scene / Scenario", icon: BookOpen, className: "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30" }
      case "chronological":
        return { label: "Chronological Order", icon: ListOrdered, className: "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30" }
      case "match_following":
        return { label: "Match Following", icon: GitCompare, className: "bg-blue-500/15 text-blue-800 dark:text-blue-300 border-blue-500/30" }
      default:
        return { label: "Standard", icon: Type, className: "bg-muted text-muted-foreground border-border" }
    }
  }

  const badge = getTypeBadge(question?.question_type)
  const TypeIcon = badge.icon

  return (
    <div className="flex min-h-svh bg-background text-foreground">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header title="MCQ & Game Question Detail" onMenuClick={() => setMobileOpen(true)} />

        <main className="flex-1 p-4 sm:p-7">
          <div className="mx-auto max-w-5xl space-y-6">
            {/* Top Bar */}
            <div className="flex items-center justify-between gap-4">
              <button
                onClick={() => navigateTo("/games/mcq")}
                className="group flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition"
              >
                <ArrowLeft className="size-4 transition transform group-hover:-translate-x-1" />
                Back to Questions
              </button>

              {question && (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={openEditModal} className="gap-2">
                    <Edit className="size-4" /> Edit Question
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => setDeleteDialogOpen(true)} className="gap-2">
                    <Trash2 className="size-4" /> Delete
                  </Button>
                </div>
              )}
            </div>

            {/* Error State */}
            {errorMsg && !isLoading && (
              <div className="rounded-xl border bg-card p-12 text-center">
                <HelpCircle className="mx-auto size-12 text-destructive/50" />
                <h3 className="mt-4 text-lg font-semibold text-destructive">Question Not Found</h3>
                <p className="mt-1 text-sm text-muted-foreground">{errorMsg}</p>
                <Button className="mt-6 gap-2" onClick={() => navigateTo("/games/mcq")}>
                  <ArrowLeft className="size-4" /> Back to All Questions
                </Button>
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="space-y-6">
                <Skeleton className="h-8 w-1/3 rounded-md" />
                <Skeleton className="h-44 w-full rounded-xl" />
                <Skeleton className="h-64 w-full rounded-xl" />
              </div>
            )}

            {/* Content View */}
            {question && !isLoading && (
              <div className="space-y-6">
                {/* Header Metadata */}
                <div className="rounded-xl border bg-card p-6 shadow-xs space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                        Question #{question.id}
                      </span>
                      <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-0.5 text-xs font-semibold ${badge.className}`}>
                        <TypeIcon className="size-3.5" />
                        {badge.label}
                      </span>
                      <span className="rounded-md bg-indigo-500/10 dark:bg-indigo-500/20 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                        {question.subject}
                      </span>
                      <span
                        className={`rounded-md px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${
                          question.difficulty === "beginner"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : question.difficulty === "intermediate"
                            ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                            : "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                        }`}
                      >
                        {question.difficulty}
                      </span>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        question.is_active
                          ? "bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          : "bg-destructive/10 text-destructive border border-destructive/20"
                      }`}
                    >
                      {question.is_active ? "● Published (Active)" : "○ Inactive"}
                    </span>
                  </div>

                  {/* Scene passage if present */}
                  {question.question_type === "scene_based" && question.scenario_text && (
                    <div className="rounded-lg bg-purple-500/10 dark:bg-purple-950/40 border border-purple-500/30 p-4 text-xs leading-relaxed text-foreground">
                      <span className="font-bold flex items-center gap-1.5 mb-1 text-purple-700 dark:text-purple-300">
                        <BookOpen className="size-4" /> Scenario Passage:
                      </span>
                      {question.scenario_text}
                    </div>
                  )}

                  {/* Primary Image Preview if present */}
                  {question.image_url && (
                    <div className="rounded-lg border p-3 bg-muted/30 flex flex-col sm:flex-row items-center gap-4">
                      <img src={question.image_url} alt="Question Diagram" className="h-36 w-60 rounded object-cover border shadow-xs" />
                      <div className="text-xs text-muted-foreground space-y-1">
                        <span className="font-semibold block text-foreground">Primary Question Image</span>
                        <span className="break-all font-mono text-[11px]">{question.image_url}</span>
                      </div>
                    </div>
                  )}

                  <h1 className="text-xl font-bold tracking-tight sm:text-2xl leading-relaxed text-foreground">
                    {question.question_text}
                  </h1>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-border">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="size-3.5" />
                      Created: {new Date(question.created_at).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="size-3.5" />
                      Updated: {new Date(question.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Display based on Question Type */}

                {/* Standard, Image-Based, Scene-Based: Options & Explanations */}
                {(question.question_type === "standard" || question.question_type === "image_based" || question.question_type === "scene_based") && (
                  <div className="rounded-xl border bg-card p-6 shadow-xs space-y-4">
                    <h3 className="font-semibold text-base flex items-center gap-2">
                      <Gamepad2 className="size-5 text-primary" />
                      4 Options & Answer Explanations
                    </h3>

                    <div className="grid gap-4 sm:grid-cols-2 pt-2">
                      {question.options?.map((opt, idx) => (
                        <div
                          key={opt.id || idx}
                          className={`rounded-xl border p-5 space-y-3 transition ${
                            opt.is_correct
                              ? "border-emerald-500/50 bg-emerald-500/10 dark:bg-emerald-950/30 text-foreground"
                              : "bg-muted/40 text-foreground border-border"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 border-b pb-3 border-border/60">
                            <div className="flex items-center gap-2">
                              {opt.is_correct ? (
                                <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />
                              ) : (
                                <XCircle className="size-5 text-muted-foreground opacity-40" />
                              )}
                              <span className="font-bold text-sm">
                                Option {String.fromCharCode(65 + idx)}
                              </span>
                            </div>

                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase shadow-xs ${
                                opt.is_correct ? "bg-emerald-600 dark:bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {opt.is_correct ? "Correct Answer" : "Incorrect"}
                            </span>
                          </div>

                          <p className="font-semibold text-sm text-foreground">{opt.option_text}</p>

                          {opt.image_url && (
                            <img src={opt.image_url} alt="Option Image" className="h-20 w-32 rounded object-cover border" />
                          )}

                          <div className="rounded-lg bg-background p-3 text-xs leading-relaxed text-muted-foreground border border-border/60 space-y-1">
                            <span className="font-semibold text-foreground block">
                              Explanation:
                            </span>
                            <span>{opt.explanation}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Chronological Order View */}
                {question.question_type === "chronological" && question.metadata?.items && (
                  <div className="rounded-xl border bg-card p-6 shadow-xs space-y-4">
                    <h3 className="font-semibold text-base flex items-center gap-2 text-amber-700 dark:text-amber-300">
                      <ListOrdered className="size-5" />
                      Correct Chronological Sequence (1 to 5)
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      The items below are ordered in their correct timeline sequence from oldest to newest.
                    </p>

                    <div className="space-y-3 pt-2">
                      {question.metadata.items.map((item, idx) => (
                        <div key={idx} className="rounded-lg border bg-amber-500/10 dark:bg-amber-950/30 border-amber-500/30 p-3.5 text-xs font-semibold flex items-center gap-3">
                          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-amber-600 dark:bg-amber-500 text-xs font-bold text-white shadow-xs">
                            {idx + 1}
                          </span>
                          <span className="text-foreground text-sm">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Match the Following View */}
                {question.question_type === "match_following" && question.metadata && (
                  <div className="rounded-xl border bg-card p-6 shadow-xs space-y-4">
                    <h3 className="font-semibold text-base flex items-center gap-2 text-blue-700 dark:text-blue-300">
                      <GitCompare className="size-5" />
                      Match the Following Columns & Pair Mappings
                    </h3>

                    <div className="grid gap-6 sm:grid-cols-2 pt-2">
                      <div className="rounded-lg border p-4 bg-muted/20 border-border space-y-2">
                        <h4 className="text-xs font-bold uppercase text-blue-700 dark:text-blue-300">Column A (Left Items)</h4>
                        <ul className="space-y-2 text-xs font-medium">
                          {question.metadata.left_column?.map((item, i) => (
                            <li key={i} className="rounded bg-card p-2.5 border border-blue-500/20 text-card-foreground">
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="rounded-lg border p-4 bg-muted/20 border-border space-y-2">
                        <h4 className="text-xs font-bold uppercase text-blue-700 dark:text-blue-300">Column B (Right Matches)</h4>
                        <ul className="space-y-2 text-xs font-medium">
                          {question.metadata.right_column?.map((item, i) => (
                            <li key={i} className="rounded bg-card p-2.5 border border-blue-500/20 text-card-foreground">
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {question.metadata.correct_pairs && (
                      <div className="rounded-lg bg-blue-500/10 border border-blue-500/30 p-4 space-y-2">
                        <h4 className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase">Correct Pair Mappings</h4>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(question.metadata.correct_pairs).map(([left, right]) => (
                            <span key={left} className="rounded bg-blue-600 dark:bg-blue-500 px-3 py-1 text-xs font-bold text-white shadow-xs">
                              {left} → {right}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {question.metadata.explanation && (
                      <div className="rounded-lg bg-background p-4 border text-xs leading-relaxed text-muted-foreground">
                        <span className="font-semibold text-foreground block mb-1">Pair Explanation:</span>
                        {question.metadata.explanation}
                      </div>
                    )}
                  </div>
                )}

                {/* Developer JSON Payload Viewer */}
                <div className="rounded-xl border bg-card p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b pb-3">
                    <h3 className="font-semibold text-sm flex items-center gap-2 font-mono">
                      <ExternalLink className="size-4 text-primary" />
                      API Endpoint Response (GET /api/admin-side/mcq-questions/{questionId}/)
                    </h3>
                    <Button variant="ghost" size="icon-sm" onClick={copyEndpointUrl} title="Copy Endpoint URL">
                      {copiedApiUrl ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
                    </Button>
                  </div>

                  <div className="rounded-lg bg-slate-950 p-4 text-slate-100 font-mono text-xs overflow-x-auto shadow-inner max-h-72">
                    <pre>{JSON.stringify(question, null, 2)}</pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Edit Dialog */}
      {question && (
        <Dialog.Root open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <Dialog.Portal>
            <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/60 animate-in fade-in duration-200" />
            <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
              <Dialog.Popup className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-xl border bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between border-b pb-4 shrink-0">
                  <Dialog.Title className="text-lg font-semibold flex items-center gap-2">
                    <Edit className="size-5 text-primary" /> Edit Question #{question.id}
                  </Dialog.Title>
                  <Dialog.Close
                    render={
                      <button className="rounded-md p-1 hover:bg-muted text-muted-foreground">
                        <X className="size-4" />
                      </button>
                    }
                  />
                </div>

                <form className="mt-4 flex flex-1 flex-col overflow-hidden" onSubmit={handleEditSubmit}>
                  <div className="flex-1 overflow-y-auto pr-1 my-2 space-y-6">
                    <label className="block text-sm font-medium">
                      Question Text <span className="text-destructive">*</span>
                      <textarea
                        required
                        rows={2}
                        value={formQuestionText}
                        onChange={(e) => setFormQuestionText(e.target.value)}
                        className="mt-1.5 w-full rounded-lg border bg-background p-3 text-sm outline-none focus:border-primary"
                      />
                    </label>

                    {(formQuestionType === "image_based" || formQuestionType === "scene_based") && (
                      <label className="block text-sm font-medium">
                        Main Question Image URL
                        <input
                          type="url"
                          value={formImageUrl}
                          onChange={(e) => setFormImageUrl(e.target.value)}
                          className="mt-1.5 h-10 w-full rounded-lg border bg-background px-3 text-xs outline-none focus:border-primary"
                        />
                      </label>
                    )}

                    {formQuestionType === "scene_based" && (
                      <label className="block text-sm font-medium">
                        Scenario Passage Text
                        <textarea
                          rows={3}
                          value={formScenarioText}
                          onChange={(e) => setFormScenarioText(e.target.value)}
                          className="mt-1.5 w-full rounded-lg border bg-background p-3 text-xs outline-none focus:border-primary"
                        />
                      </label>
                    )}

                    <div className="grid gap-4 sm:grid-cols-3">
                      <label className="block text-sm font-medium">
                        Subject <span className="text-destructive">*</span>
                        <input
                          required
                          type="text"
                          value={formSubject}
                          onChange={(e) => setFormSubject(e.target.value)}
                          className="mt-1.5 h-10 w-full rounded-lg border bg-background px-3 text-xs outline-none focus:border-primary"
                        />
                      </label>

                      <label className="block text-sm font-medium">
                        Difficulty
                        <select
                          value={formDifficulty}
                          onChange={(e) =>
                            setFormDifficulty(e.target.value as "beginner" | "intermediate" | "advanced")
                          }
                          className="mt-1.5 h-10 w-full rounded-lg border bg-background px-3 text-xs font-medium outline-none focus:border-primary"
                        >
                          <option value="beginner">Beginner</option>
                          <option value="intermediate">Intermediate</option>
                          <option value="advanced">Advanced</option>
                        </select>
                      </label>

                      <div className="flex items-center gap-3 pt-6">
                        <input
                          id="edit_is_active"
                          type="checkbox"
                          checked={formIsActive}
                          onChange={(e) => setFormIsActive(e.target.checked)}
                          className="size-4 rounded accent-primary cursor-pointer"
                        />
                        <label htmlFor="edit_is_active" className="text-sm cursor-pointer select-none font-medium">
                          Published (Active)
                        </label>
                      </div>
                    </div>

                    {(formQuestionType === "standard" || formQuestionType === "image_based" || formQuestionType === "scene_based") && (
                      <div className="space-y-4 rounded-xl border p-4 bg-muted/20 border-border">
                        <div className="flex items-center justify-between border-b pb-3">
                          <h4 className="text-sm font-semibold flex items-center gap-2">
                            <RadioIcon className="size-4 text-primary" />
                            4 Options & Explanations <span className="text-destructive">*</span>
                          </h4>
                        </div>

                        <div className="space-y-4">
                          {formOptions.map((opt, index) => (
                            <div
                              key={index}
                              className={`rounded-lg border p-4 transition ${
                                opt.is_correct ? "border-emerald-500/50 bg-emerald-500/5 dark:bg-emerald-950/20" : "bg-background border-border"
                              }`}
                            >
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                  <input
                                    type="radio"
                                    name="edit_correct_option"
                                    checked={opt.is_correct}
                                    onChange={() => handleCorrectOptionSelect(index)}
                                    className="size-4 accent-emerald-600 cursor-pointer"
                                  />
                                  <span className={`text-xs font-bold ${opt.is_correct ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"}`}>
                                    Option {String.fromCharCode(65 + index)} {opt.is_correct && "(Correct)"}
                                  </span>
                                </label>

                                <input
                                  required
                                  type="text"
                                  value={opt.option_text}
                                  onChange={(e) => handleOptionTextChange(index, e.target.value)}
                                  className="h-9 flex-1 rounded-lg border bg-background px-3 text-xs outline-none focus:border-primary"
                                />
                              </div>

                              <div className="mt-3">
                                <textarea
                                  required
                                  rows={2}
                                  value={opt.explanation}
                                  onChange={(e) => handleExplanationChange(index, e.target.value)}
                                  className="w-full rounded-lg border bg-background p-2.5 text-xs outline-none focus:border-primary"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t shrink-0">
                    <Dialog.Close
                      render={
                        <Button type="button" variant="outline">
                          Cancel
                        </Button>
                      }
                    />
                    <Button type="submit" disabled={isSavingEdit}>
                      {isSavingEdit ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </Dialog.Popup>
            </Dialog.Viewport>
          </Dialog.Portal>
        </Dialog.Root>
      )}

      {/* Delete Dialog */}
      <Dialog.Root open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50 animate-in fade-in duration-200" />
          <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <Dialog.Popup className="w-full max-w-md rounded-xl border bg-card p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
              <Dialog.Title className="text-lg font-semibold text-destructive flex items-center gap-2">
                <Trash2 className="size-5" /> Delete Question
              </Dialog.Title>
              <Dialog.Description className="mt-2 text-sm text-muted-foreground">
                Are you sure you want to delete Question #{question?.id}: <strong className="text-foreground">"{question?.question_text}"</strong>? This action cannot be undone.
              </Dialog.Description>

              <div className="mt-6 flex justify-end gap-2">
                <Dialog.Close
                  render={
                    <Button type="button" variant="outline" disabled={isDeleting}>
                      Cancel
                    </Button>
                  }
                />
                <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                  {isDeleting ? "Deleting..." : "Yes, Delete Question"}
                </Button>
              </div>
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Mobile Menu */}
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
