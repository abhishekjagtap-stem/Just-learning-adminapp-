import { useCallback, useEffect, useState, type FormEvent } from "react"
import { Dialog } from "@base-ui/react/dialog"
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Filter,
  Gamepad2,
  HelpCircle,
  Info,
  Pencil,
  Plus,
  Radio as RadioIcon,
  Search,
  Sparkles,
  Trash2,
  X,
  XCircle,
} from "lucide-react"
import { Header } from "@/components/dashboard/header"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/toast"
import {
  createMCQQuestion,
  deleteMCQQuestion,
  getMCQQuestions,
  updateMCQQuestion,
  type MCQOption,
  type MCQQuestion,
} from "@/lib/api"
import { navigateTo } from "@/lib/navigation"

const INITIAL_OPTIONS: MCQOption[] = [
  { option_text: "", is_correct: true, explanation: "" },
  { option_text: "", is_correct: false, explanation: "" },
  { option_text: "", is_correct: false, explanation: "" },
  { option_text: "", is_correct: false, explanation: "" },
]

export function MCQQuestionsPage() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<MCQQuestion | null>(null)
  const [deletingQuestion, setDeletingQuestion] = useState<MCQQuestion | null>(null)

  const [questions, setQuestions] = useState<MCQQuestion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [togglingId, setTogglingId] = useState<number | null>(null)

  const [searchQuery, setSearchQuery] = useState("")
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [expandedExplanations, setExpandedExplanations] = useState<Record<number, boolean>>({})

  // Form State for Create / Edit Modal
  const [formQuestionText, setFormQuestionText] = useState("")
  const [formSubject, setFormSubject] = useState("")
  const [formDifficulty, setFormDifficulty] = useState<"beginner" | "intermediate" | "advanced">("beginner")
  const [formIsActive, setFormIsActive] = useState(true)
  const [formOptions, setFormOptions] = useState<MCQOption[]>(INITIAL_OPTIONS)

  const { toast } = useToast()

  const loadQuestions = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await getMCQQuestions()
      const rawList = Array.isArray(res) ? res : res.results || []
      setQuestions(rawList)
    } catch (error) {
      toast(error instanceof Error ? error.message : "Unable to load MCQ questions.", "error")
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    void loadQuestions()
  }, [loadQuestions])

  const openCreateDialog = () => {
    setEditingQuestion(null)
    setFormQuestionText("")
    setFormSubject("General Knowledge")
    setFormDifficulty("beginner")
    setFormIsActive(true)
    setFormOptions([
      { option_text: "", is_correct: true, explanation: "" },
      { option_text: "", is_correct: false, explanation: "" },
      { option_text: "", is_correct: false, explanation: "" },
      { option_text: "", is_correct: false, explanation: "" },
    ])
    setCreateDialogOpen(true)
  }

  const openEditDialog = (q: MCQQuestion) => {
    setEditingQuestion(q)
    setFormQuestionText(q.question_text)
    setFormSubject(q.subject)
    setFormDifficulty((q.difficulty as "beginner" | "intermediate" | "advanced") || "beginner")
    setFormIsActive(q.is_active)
    setFormOptions(
      q.options.map((opt) => ({
        id: opt.id,
        option_text: opt.option_text,
        is_correct: opt.is_correct,
        explanation: opt.explanation,
      }))
    )
    setCreateDialogOpen(true)
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

  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!formQuestionText.trim()) {
      toast("Please enter a question text.", "error")
      return
    }

    if (!formSubject.trim()) {
      toast("Please enter a subject.", "error")
      return
    }

    // Client side validation for 4 options
    if (formOptions.length !== 4) {
      toast("Question must have exactly 4 options.", "error")
      return
    }

    const correctCount = formOptions.filter((o) => o.is_correct).length
    if (correctCount !== 1) {
      toast("Please mark exactly 1 option as correct.", "error")
      return
    }

    for (let i = 0; i < 4; i++) {
      if (!formOptions[i].option_text.trim()) {
        toast(`Option #${i + 1} text cannot be empty.`, "error")
        return
      }
      if (!formOptions[i].explanation.trim()) {
        toast(`Option #${i + 1} explanation cannot be empty.`, "error")
        return
      }
    }

    setIsSubmitting(true)

    const payload = {
      question_text: formQuestionText.trim(),
      subject: formSubject.trim(),
      difficulty: formDifficulty,
      is_active: formIsActive,
      options: formOptions.map((o) => ({
        id: o.id,
        option_text: o.option_text.trim(),
        is_correct: o.is_correct,
        explanation: o.explanation.trim(),
      })),
    }

    try {
      if (editingQuestion) {
        await updateMCQQuestion(editingQuestion.id, payload)
        toast("MCQ Question updated successfully!")
      } else {
        await createMCQQuestion(payload)
        toast("MCQ Question created successfully!")
      }
      setCreateDialogOpen(false)
      await loadQuestions()
    } catch (error) {
      toast(error instanceof Error ? error.message : "Failed to save MCQ Question.", "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleActive = async (q: MCQQuestion, e: React.MouseEvent) => {
    e.stopPropagation()
    const targetState = !q.is_active
    setTogglingId(q.id)

    // Optimistic UI update
    setQuestions((prev) =>
      prev.map((item) => (item.id === q.id ? { ...item, is_active: targetState } : item))
    )

    try {
      await updateMCQQuestion(q.id, {
        question_text: q.question_text,
        difficulty: q.difficulty,
        subject: q.subject,
        is_active: targetState,
        options: q.options,
      })
      toast(
        targetState
          ? `Question #${q.id} is now active.`
          : `Question #${q.id} deactivated.`
      )
    } catch (error) {
      // Revert optimistic update
      setQuestions((prev) =>
        prev.map((item) => (item.id === q.id ? { ...item, is_active: !targetState } : item))
      )
      toast(error instanceof Error ? error.message : "Failed to toggle question status.", "error")
    } finally {
      setTogglingId(null)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deletingQuestion) return
    setIsDeleting(true)
    try {
      await deleteMCQQuestion(deletingQuestion.id)
      toast("MCQ Question deleted successfully.")
      setDeletingQuestion(null)
      await loadQuestions()
    } catch (error) {
      toast(error instanceof Error ? error.message : "Failed to delete question.", "error")
    } finally {
      setIsDeleting(false)
    }
  }

  const toggleExplanations = (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setExpandedExplanations((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  // Filtering questions
  const filteredQuestions = questions.filter((q) => {
    const matchesSearch =
      q.question_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.subject.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesDifficulty =
      difficultyFilter === "all" || q.difficulty.toLowerCase() === difficultyFilter.toLowerCase()

    const matchesStatus =
      statusFilter === "all"
        ? true
        : statusFilter === "active"
        ? q.is_active
        : !q.is_active

    return matchesSearch && matchesDifficulty && matchesStatus
  })

  const activeCount = questions.filter((q) => q.is_active).length
  const beginnerCount = questions.filter((q) => q.difficulty === "beginner").length
  const intermediateCount = questions.filter((q) => q.difficulty === "intermediate").length
  const advancedCount = questions.filter((q) => q.difficulty === "advanced").length

  return (
    <div className="flex min-h-svh bg-background">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header title="Games / Manage MCQ" onMenuClick={() => setMobileOpen(true)} />

        <main className="flex-1 p-4 sm:p-7">
          <div className="mx-auto max-w-7xl space-y-6">
            {/* Header & Main Action Bar */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
                  <Gamepad2 className="size-6 text-primary" />
                  Multiple Choice Questions (MCQ)
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Create and manage 4-option quiz questions with detailed answer explanations.
                </p>
              </div>

              <Button onClick={openCreateDialog} className="gap-2 self-start sm:self-auto">
                <Plus className="size-4" /> Add MCQ Question
              </Button>
            </div>

            {/* Quick Metrics Cards */}
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="rounded-xl border bg-card p-5 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Questions</p>
                  <p className="mt-2 text-3xl font-bold">{questions.length}</p>
                </div>
                <div className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                  <HelpCircle className="size-5" />
                </div>
              </div>

              <div className="rounded-xl border bg-card p-5 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active Questions</p>
                  <p className="mt-2 text-3xl font-bold text-emerald-600 dark:text-emerald-400">{activeCount}</p>
                </div>
                <div className="grid size-11 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="size-5" />
                </div>
              </div>

              <div className="rounded-xl border bg-card p-5 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Beginner Level</p>
                  <p className="mt-2 text-3xl font-bold">{beginnerCount}</p>
                </div>
                <div className="grid size-11 place-items-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Sparkles className="size-5" />
                </div>
              </div>

              <div className="rounded-xl border bg-card p-5 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Inter. / Adv.</p>
                  <p className="mt-2 text-3xl font-bold">
                    {intermediateCount} <span className="text-sm font-normal text-muted-foreground">/ {advancedCount}</span>
                  </p>
                </div>
                <div className="grid size-11 place-items-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <Filter className="size-5" />
                </div>
              </div>
            </div>

            {/* Filter Bar: Search & Selectors */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
              <div className="relative flex-1 max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search questions by text or subject…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Difficulty Filter */}
                <select
                  value={difficultyFilter}
                  onChange={(e) => setDifficultyFilter(e.target.value)}
                  className="h-10 rounded-lg border bg-background px-3 text-xs font-medium outline-none focus:border-primary"
                >
                  <option value="all">All Difficulties</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-10 rounded-lg border bg-background px-3 text-xs font-medium outline-none focus:border-primary"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
              </div>
            </div>

            {/* Content List */}
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="rounded-xl border bg-card p-6 space-y-3">
                    <Skeleton className="h-6 w-3/4" />
                    <div className="grid gap-2 sm:grid-cols-2 pt-2">
                      <Skeleton className="h-12 w-full rounded-lg" />
                      <Skeleton className="h-12 w-full rounded-lg" />
                      <Skeleton className="h-12 w-full rounded-lg" />
                      <Skeleton className="h-12 w-full rounded-lg" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredQuestions.length === 0 ? (
              <div className="rounded-xl border bg-card p-12 text-center">
                <HelpCircle className="mx-auto size-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold">No MCQ questions found</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {searchQuery || difficultyFilter !== "all" || statusFilter !== "all"
                    ? "No questions match your current search filters."
                    : "Create your first Multiple Choice Question to populate the quiz engine."}
                </p>
                <Button className="mt-6 gap-2" onClick={openCreateDialog}>
                  <Plus className="size-4" /> Add MCQ Question
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredQuestions.map((q) => {
                  const isExpanded = !!expandedExplanations[q.id]
                  return (
                    <div
                      key={q.id}
                      onClick={() => navigateTo(`/games/mcq/${q.id}`)}
                      className="group relative rounded-xl border bg-card p-6 shadow-xs transition duration-200 hover:shadow-md hover:border-primary/50 cursor-pointer"
                    >
                      {/* Top Badges & Header */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-md bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                            #{q.id}
                          </span>
                          <span className="rounded-md bg-indigo-500/10 dark:bg-indigo-500/20 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                            {q.subject}
                          </span>

                          <span
                            className={`rounded-md px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${
                              q.difficulty === "beginner"
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : q.difficulty === "intermediate"
                                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                : "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                            }`}
                          >
                            {q.difficulty}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                          {/* Active Toggle Switch */}
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              role="switch"
                              aria-checked={q.is_active}
                              disabled={togglingId === q.id}
                              onClick={(e) => handleToggleActive(q, e)}
                              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                q.is_active ? "bg-primary" : "bg-input"
                              } ${togglingId === q.id ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                              <span
                                className={`pointer-events-none inline-block size-5 transform rounded-full bg-background shadow-lg ring-0 transition duration-200 ease-in-out ${
                                  q.is_active ? "translate-x-5" : "translate-x-0"
                                }`}
                              />
                            </button>
                            <span className="text-xs font-medium select-none">
                              {q.is_active ? "Active" : "Inactive"}
                            </span>
                          </div>

                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title="Edit Question"
                            onClick={(e) => {
                              e.stopPropagation()
                              openEditDialog(q)
                            }}
                          >
                            <Pencil className="size-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-destructive hover:bg-destructive/10"
                            title="Delete Question"
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeletingQuestion(q)
                            }}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Question Text */}
                      <h3 className="mt-4 text-base font-semibold leading-snug text-foreground group-hover:text-primary transition">
                        {q.question_text}
                      </h3>

                      {/* 4 Options Grid */}
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {q.options.map((opt, idx) => (
                          <div
                            key={opt.id || idx}
                            className={`rounded-lg border p-3 text-xs transition ${
                              opt.is_correct
                                ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-950 dark:text-emerald-200 font-medium"
                                : "bg-muted/30 text-foreground"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="flex items-center gap-2">
                                {opt.is_correct ? (
                                  <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                ) : (
                                  <XCircle className="size-4 text-muted-foreground shrink-0 opacity-40" />
                                )}
                                <span className="font-semibold">
                                  Option {String.fromCharCode(65 + idx)}:
                                </span>{" "}
                                {opt.option_text}
                              </span>

                              {opt.is_correct && (
                                <span className="rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold text-white uppercase">
                                  Correct
                                </span>
                              )}
                            </div>

                            {/* Option Explanation preview */}
                            {isExpanded && opt.explanation && (
                              <div className="mt-2 pt-2 border-t border-emerald-500/20 text-[11px] leading-relaxed text-muted-foreground">
                                <span className="font-semibold text-foreground">Why: </span>
                                {opt.explanation}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Toggle Explanations Footer */}
                      <div className="mt-4 pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
                        <button
                          type="button"
                          onClick={(e) => toggleExplanations(q.id, e)}
                          className="flex items-center gap-1.5 font-medium hover:text-foreground transition"
                        >
                          <Info className="size-3.5 text-primary" />
                          {isExpanded ? "Hide Option Explanations" : "View Option Explanations"}
                          <ChevronDown className={`size-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                        </button>

                        <span className="flex items-center gap-1 text-primary group-hover:underline">
                          Manage Detail <ChevronRight className="size-3" />
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Create / Edit MCQ Modal Dialog */}
      <Dialog.Root open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/60 animate-in fade-in duration-200" />
          <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <Dialog.Popup className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-xl border bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b pb-4 shrink-0">
                <Dialog.Title className="text-lg font-semibold flex items-center gap-2">
                  <Gamepad2 className="size-5 text-primary" />
                  {editingQuestion ? "Edit MCQ Question" : "Create New MCQ Question"}
                </Dialog.Title>
                <Dialog.Close
                  render={
                    <button className="rounded-md p-1 hover:bg-muted text-muted-foreground">
                      <X className="size-4" />
                    </button>
                  }
                />
              </div>

              <form className="mt-4 flex flex-1 flex-col overflow-hidden" onSubmit={handleFormSubmit}>
                <div className="flex-1 overflow-y-auto pr-1 my-2 space-y-6">
                  <Dialog.Description className="text-xs text-muted-foreground">
                    Enter question text, select subject/difficulty, and provide exactly 4 options with 1 correct answer and explanations for all options.
                  </Dialog.Description>

                  {/* Question Text */}
                  <label className="block text-sm font-medium">
                    Question Text <span className="text-destructive">*</span>
                    <textarea
                      required
                      rows={3}
                      placeholder="e.g. What is the capital city of France?"
                      value={formQuestionText}
                      onChange={(e) => setFormQuestionText(e.target.value)}
                      className="mt-2 w-full rounded-lg border bg-background p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                    />
                  </label>

                  {/* Subject & Difficulty Grid */}
                  <div className="grid gap-4 sm:grid-cols-3">
                    <label className="block text-sm font-medium">
                      Subject <span className="text-destructive">*</span>
                      <input
                        required
                        type="text"
                        placeholder="Geography, Math, Science…"
                        value={formSubject}
                        onChange={(e) => setFormSubject(e.target.value)}
                        className="mt-2 h-10 w-full rounded-lg border bg-background px-3 text-xs outline-none focus:border-primary"
                      />
                    </label>

                    <label className="block text-sm font-medium">
                      Difficulty Level
                      <select
                        value={formDifficulty}
                        onChange={(e) =>
                          setFormDifficulty(e.target.value as "beginner" | "intermediate" | "advanced")
                        }
                        className="mt-2 h-10 w-full rounded-lg border bg-background px-3 text-xs font-medium outline-none focus:border-primary"
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </label>

                    <div className="flex items-center gap-3 pt-6">
                      <input
                        id="mcq_is_active"
                        type="checkbox"
                        checked={formIsActive}
                        onChange={(e) => setFormIsActive(e.target.checked)}
                        className="size-4 rounded accent-primary cursor-pointer"
                      />
                      <label htmlFor="mcq_is_active" className="text-sm cursor-pointer select-none font-medium">
                        Publish Question (Active)
                      </label>
                    </div>
                  </div>

                  {/* 4 Options Builder */}
                  <div className="space-y-4 rounded-xl border p-4 bg-muted/20">
                    <div className="flex items-center justify-between border-b pb-3">
                      <h4 className="text-sm font-semibold flex items-center gap-2">
                        <RadioIcon className="size-4 text-primary" />
                        4 Options & Explanations <span className="text-destructive">*</span>
                      </h4>
                      <span className="text-xs text-muted-foreground">
                        Select the radio button for the <strong className="text-emerald-600">1 correct answer</strong>
                      </span>
                    </div>

                    <div className="space-y-4">
                      {formOptions.map((opt, index) => (
                        <div
                          key={index}
                          className={`rounded-lg border p-4 transition ${
                            opt.is_correct
                              ? "border-emerald-500/50 bg-emerald-500/5 dark:bg-emerald-950/20"
                              : "bg-background"
                          }`}
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            {/* Radio Selector for Correct Answer */}
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="radio"
                                name="correct_option_selector"
                                checked={opt.is_correct}
                                onChange={() => handleCorrectOptionSelect(index)}
                                className="size-4 accent-emerald-600 cursor-pointer"
                              />
                              <span className={`text-xs font-bold ${opt.is_correct ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"}`}>
                                Option {String.fromCharCode(65 + index)} {opt.is_correct && "(Correct Answer)"}
                              </span>
                            </label>

                            {/* Option Text Input */}
                            <input
                              required
                              type="text"
                              placeholder={`Option ${String.fromCharCode(65 + index)} text (e.g. ${
                                index === 0 ? "Paris" : index === 1 ? "London" : index === 2 ? "Berlin" : "Madrid"
                              })`}
                              value={opt.option_text}
                              onChange={(e) => handleOptionTextChange(index, e.target.value)}
                              className="h-9 flex-1 rounded-lg border bg-background px-3 text-xs outline-none focus:border-primary"
                            />
                          </div>

                          {/* Explanation Text Area */}
                          <div className="mt-3">
                            <textarea
                              required
                              rows={2}
                              placeholder={`Explanation why Option ${String.fromCharCode(65 + index)} is ${
                                opt.is_correct ? "correct" : "incorrect"
                              }…`}
                              value={opt.explanation}
                              onChange={(e) => handleExplanationChange(index, e.target.value)}
                              className="w-full rounded-lg border bg-background p-2.5 text-xs outline-none focus:border-primary"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t shrink-0">
                  <Dialog.Close
                    render={
                      <Button type="button" variant="outline">
                        Cancel
                      </Button>
                    }
                  />
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Saving Question…" : editingQuestion ? "Update Question" : "Create Question"}
                  </Button>
                </div>
              </form>
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Delete Confirmation Dialog */}
      <Dialog.Root open={!!deletingQuestion} onOpenChange={(open) => !open && setDeletingQuestion(null)}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50 animate-in fade-in duration-200" />
          <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <Dialog.Popup className="w-full max-w-md rounded-xl border bg-card p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
              <Dialog.Title className="text-lg font-semibold text-destructive flex items-center gap-2">
                <Trash2 className="size-5" /> Delete MCQ Question
              </Dialog.Title>
              <Dialog.Description className="mt-2 text-sm text-muted-foreground">
                Are you sure you want to delete Question #{deletingQuestion?.id}: <strong className="text-foreground">"{deletingQuestion?.question_text}"</strong>? This action cannot be undone.
              </Dialog.Description>

              <div className="mt-6 flex justify-end gap-2">
                <Dialog.Close
                  render={
                    <Button type="button" variant="outline" disabled={isDeleting}>
                      Cancel
                    </Button>
                  }
                />
                <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isDeleting}>
                  {isDeleting ? "Deleting…" : "Yes, Delete Question"}
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
