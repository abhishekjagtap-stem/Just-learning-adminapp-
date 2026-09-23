import { useCallback, useEffect, useState, type FormEvent } from "react"
import { Dialog } from "@base-ui/react/dialog"
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Gamepad2,
  GitCompare,
  HelpCircle,
  Image as ImageIcon,
  Info,
  ListOrdered,
  Pencil,
  Plus,
  Radio as RadioIcon,
  Search,
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
  createMCQQuestion,
  deleteMCQQuestion,
  getMCQQuestions,
  updateMCQQuestion,
  type MCQOption,
  type MCQQuestion,
  type QuestionType,
} from "@/lib/api"
import { navigateTo } from "@/lib/navigation"

const EMPTY_OPTIONS: MCQOption[] = [
  { option_text: "", is_correct: true, explanation: "" },
  { option_text: "", is_correct: false, explanation: "" },
  { option_text: "", is_correct: false, explanation: "" },
  { option_text: "", is_correct: false, explanation: "" },
]

const EMPTY_CHRONO_ITEMS = ["", "", "", "", ""]
const EMPTY_LEFT_COL = ["", "", "", ""]
const EMPTY_RIGHT_COL = ["", "", "", ""]
const EMPTY_CORRECT_PAIRS: Record<string, string> = { "1": "", "2": "", "3": "", "4": "" }

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

  // Filter States
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [expandedExplanations, setExpandedExplanations] = useState<Record<number, boolean>>({})

  // Form State for Create / Edit Modal
  const [formQuestionType, setFormQuestionType] = useState<QuestionType>("standard")
  const [formQuestionText, setFormQuestionText] = useState("")
  const [formSubject, setFormSubject] = useState("")
  const [formDifficulty, setFormDifficulty] = useState<"beginner" | "intermediate" | "advanced">("beginner")
  const [formIsActive, setFormIsActive] = useState(true)
  const [formImageUrl, setFormImageUrl] = useState("")
  const [formScenarioText, setFormScenarioText] = useState("")
  const [formOptions, setFormOptions] = useState<MCQOption[]>(EMPTY_OPTIONS)

  // Chronological Form State
  const [formChronoItems, setFormChronoItems] = useState<string[]>(EMPTY_CHRONO_ITEMS)

  // Match the Following Form State
  const [formLeftCol, setFormLeftCol] = useState<string[]>(EMPTY_LEFT_COL)
  const [formRightCol, setFormRightCol] = useState<string[]>(EMPTY_RIGHT_COL)
  const [formCorrectPairs, setFormCorrectPairs] = useState<Record<string, string>>(EMPTY_CORRECT_PAIRS)
  const [formMatchExplanation, setFormMatchExplanation] = useState("")

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
    setFormQuestionType("standard")
    setFormQuestionText("")
    setFormSubject("")
    setFormDifficulty("beginner")
    setFormIsActive(true)
    setFormImageUrl("")
    setFormScenarioText("")
    setFormOptions([
      { option_text: "", is_correct: true, explanation: "" },
      { option_text: "", is_correct: false, explanation: "" },
      { option_text: "", is_correct: false, explanation: "" },
      { option_text: "", is_correct: false, explanation: "" },
    ])
    setFormChronoItems(["", "", "", "", ""])
    setFormLeftCol(["", "", "", ""])
    setFormRightCol(["", "", "", ""])
    setFormCorrectPairs({ "1": "", "2": "", "3": "", "4": "" })
    setFormMatchExplanation("")
    setCreateDialogOpen(true)
  }

  const openEditDialog = (q: MCQQuestion) => {
    setEditingQuestion(q)
    setFormQuestionType(q.question_type || "standard")
    setFormQuestionText(q.question_text)
    setFormSubject(q.subject)
    setFormDifficulty((q.difficulty as "beginner" | "intermediate" | "advanced") || "beginner")
    setFormIsActive(q.is_active)
    setFormImageUrl(q.image_url || "")
    setFormScenarioText(q.scenario_text || "")

    if (q.options && q.options.length > 0) {
      setFormOptions(
        q.options.map((opt) => ({
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

    if (q.metadata?.items && Array.isArray(q.metadata.items)) {
      setFormChronoItems(q.metadata.items)
    } else {
      setFormChronoItems(["", "", "", "", ""])
    }

    if (q.metadata?.left_column && Array.isArray(q.metadata.left_column)) {
      setFormLeftCol(q.metadata.left_column)
    } else {
      setFormLeftCol(["", "", "", ""])
    }

    if (q.metadata?.right_column && Array.isArray(q.metadata.right_column)) {
      setFormRightCol(q.metadata.right_column)
    } else {
      setFormRightCol(["", "", "", ""])
    }

    if (q.metadata?.correct_pairs && typeof q.metadata.correct_pairs === "object") {
      setFormCorrectPairs(q.metadata.correct_pairs)
    } else {
      setFormCorrectPairs({ "1": "", "2": "", "3": "", "4": "" })
    }

    setFormMatchExplanation(q.metadata?.explanation || "")
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

  const handleOptionImageChange = (index: number, url: string) => {
    setFormOptions((prev) =>
      prev.map((opt, i) => (i === index ? { ...opt, image_url: url } : opt))
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
      toast("Please enter question text.", "error")
      return
    }

    if (!formSubject.trim()) {
      toast("Please enter a subject.", "error")
      return
    }

    const payload: any = {
      question_type: formQuestionType,
      question_text: formQuestionText.trim(),
      subject: formSubject.trim(),
      difficulty: formDifficulty,
      is_active: formIsActive,
    }

    if (formQuestionType === "standard") {
      if (formOptions.length !== 4) {
        toast("Standard questions must have exactly 4 options.", "error")
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
      payload.options = formOptions.map((o) => ({
        id: o.id,
        option_text: o.option_text.trim(),
        is_correct: o.is_correct,
        explanation: o.explanation.trim(),
      }))
    } else if (formQuestionType === "image_based") {
      if (!formImageUrl.trim()) {
        toast("Please provide a primary image URL for image-based question.", "error")
        return
      }
      if (formOptions.length !== 4) {
        toast("Image-based questions must have exactly 4 options.", "error")
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
      payload.image_url = formImageUrl.trim()
      payload.options = formOptions.map((o) => ({
        id: o.id,
        option_text: o.option_text.trim(),
        image_url: o.image_url?.trim() || null,
        is_correct: o.is_correct,
        explanation: o.explanation.trim(),
      }))
    } else if (formQuestionType === "scene_based") {
      if (!formScenarioText.trim()) {
        toast("Please provide scenario text/passage description.", "error")
        return
      }
      if (formOptions.length !== 4) {
        toast("Scene-based questions must have exactly 4 options.", "error")
        return
      }
      const correctCount = formOptions.filter((o) => o.is_correct).length
      if (correctCount !== 1) {
        toast("Please mark exactly 1 option as correct.", "error")
        return
      }
      payload.scenario_text = formScenarioText.trim()
      if (formImageUrl.trim()) payload.image_url = formImageUrl.trim()
      payload.options = formOptions.map((o) => ({
        id: o.id,
        option_text: o.option_text.trim(),
        is_correct: o.is_correct,
        explanation: o.explanation.trim(),
      }))
    } else if (formQuestionType === "chronological") {
      if (formChronoItems.length !== 5 || formChronoItems.some((item) => !item.trim())) {
        toast("Chronological question requires all 5 sequence items to be filled.", "error")
        return
      }
      payload.metadata = {
        items: formChronoItems.map((item) => item.trim()),
      }
      payload.options = []
    } else if (formQuestionType === "match_following") {
      if (formLeftCol.length === 0 || formLeftCol.some((item) => !item.trim())) {
        toast("All left column items must be filled.", "error")
        return
      }
      if (formRightCol.length === 0 || formRightCol.some((item) => !item.trim())) {
        toast("All right column items must be filled.", "error")
        return
      }
      if (Object.values(formCorrectPairs).some((val) => !val.trim())) {
        toast("All correct pair mappings must be provided.", "error")
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

    setIsSubmitting(true)
    try {
      if (editingQuestion) {
        await updateMCQQuestion(editingQuestion.id, payload)
        toast("Question updated successfully!")
      } else {
        await createMCQQuestion(payload)
        toast("Question created successfully!")
      }
      setCreateDialogOpen(false)
      await loadQuestions()
    } catch (error) {
      toast(error instanceof Error ? error.message : "Failed to save question.", "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleActive = async (q: MCQQuestion, e: React.MouseEvent) => {
    e.stopPropagation()
    const targetState = !q.is_active
    setTogglingId(q.id)

    setQuestions((prev) =>
      prev.map((item) => (item.id === q.id ? { ...item, is_active: targetState } : item))
    )

    try {
      await updateMCQQuestion(q.id, {
        question_type: q.question_type,
        question_text: q.question_text,
        difficulty: q.difficulty,
        subject: q.subject,
        is_active: targetState,
      })
      toast(targetState ? `Question #${q.id} activated.` : `Question #${q.id} deactivated.`)
    } catch (error) {
      setQuestions((prev) =>
        prev.map((item) => (item.id === q.id ? { ...item, is_active: !targetState } : item))
      )
      toast(error instanceof Error ? error.message : "Failed to toggle status.", "error")
    } finally {
      setTogglingId(null)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deletingQuestion) return
    setIsDeleting(true)
    try {
      await deleteMCQQuestion(deletingQuestion.id)
      toast("Question deleted successfully.")
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

  // Filtered Questions
  const filteredQuestions = questions.filter((q) => {
    const matchesSearch =
      q.question_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.scenario_text && q.scenario_text.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesType = typeFilter === "all" || q.question_type === typeFilter
    const matchesDifficulty =
      difficultyFilter === "all" || q.difficulty.toLowerCase() === difficultyFilter.toLowerCase()
    const matchesStatus =
      statusFilter === "all" ? true : statusFilter === "active" ? q.is_active : !q.is_active

    return matchesSearch && matchesType && matchesDifficulty && matchesStatus
  })

  const standardCount = questions.filter((q) => q.question_type === "standard").length
  const imageCount = questions.filter((q) => q.question_type === "image_based").length
  const sceneCount = questions.filter((q) => q.question_type === "scene_based").length
  const chronoCount = questions.filter((q) => q.question_type === "chronological").length
  const matchCount = questions.filter((q) => q.question_type === "match_following").length

  const getTypeBadge = (type: QuestionType) => {
    switch (type) {
      case "standard":
        return {
          label: "Standard Text",
          icon: Type,
          className: "bg-slate-500/15 text-slate-700 dark:text-slate-200 border-slate-500/30",
        }
      case "image_based":
        return {
          label: "Image-Based",
          icon: ImageIcon,
          className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
        }
      case "scene_based":
        return {
          label: "Scene / Scenario",
          icon: BookOpen,
          className: "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30",
        }
      case "chronological":
        return {
          label: "Chronological Order",
          icon: ListOrdered,
          className: "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30",
        }
      case "match_following":
        return {
          label: "Match Following",
          icon: GitCompare,
          className: "bg-blue-500/15 text-blue-800 dark:text-blue-300 border-blue-500/30",
        }
      default:
        return {
          label: "Standard",
          icon: Type,
          className: "bg-muted text-muted-foreground border-border",
        }
    }
  }

  return (
    <div className="flex min-h-svh bg-background text-foreground">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header title="Games / MCQ Engine" onMenuClick={() => setMobileOpen(true)} />

        <main className="flex-1 p-4 sm:p-7">
          <div className="mx-auto max-w-7xl space-y-6">
            {/* Header & Action Bar */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
                  <Gamepad2 className="size-6 text-primary" />
                  Multiple Choice & Interactive Games Engine
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Create and manage 5 distinct question types: Standard, Image-Based, Scenario, Chronological, and Match the Following.
                </p>
              </div>

              <Button onClick={openCreateDialog} className="gap-2 self-start sm:self-auto shadow-md">
                <Plus className="size-4" /> Add Question
              </Button>
            </div>

            {/* Metrics Bar */}
            <div className="grid gap-4 sm:grid-cols-5">
              <div className="rounded-xl border bg-card p-4 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Total Questions</p>
                  <p className="mt-1 text-2xl font-bold">{questions.length}</p>
                </div>
                <div className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
                  <HelpCircle className="size-5" />
                </div>
              </div>

              <div className="rounded-xl border bg-card p-4 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Standard / Image</p>
                  <p className="mt-1 text-2xl font-bold">{standardCount} <span className="text-sm font-normal text-muted-foreground">/ {imageCount}</span></p>
                </div>
                <div className="grid size-10 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <ImageIcon className="size-5" />
                </div>
              </div>

              <div className="rounded-xl border bg-card p-4 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Scene / Passage</p>
                  <p className="mt-1 text-2xl font-bold">{sceneCount}</p>
                </div>
                <div className="grid size-10 place-items-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <BookOpen className="size-5" />
                </div>
              </div>

              <div className="rounded-xl border bg-card p-4 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Chronological</p>
                  <p className="mt-1 text-2xl font-bold">{chronoCount}</p>
                </div>
                <div className="grid size-10 place-items-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <ListOrdered className="size-5" />
                </div>
              </div>

              <div className="rounded-xl border bg-card p-4 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Match Following</p>
                  <p className="mt-1 text-2xl font-bold">{matchCount}</p>
                </div>
                <div className="grid size-10 place-items-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <GitCompare className="size-5" />
                </div>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
              <div className="relative flex-1 max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search questions by prompt, subject or passage..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Question Type Filter */}
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="h-10 rounded-lg border bg-background px-3 text-xs font-medium outline-none focus:border-primary"
                >
                  <option value="all">All 5 Question Types</option>
                  <option value="standard">Standard Text</option>
                  <option value="image_based">Image-Based</option>
                  <option value="scene_based">Scene / Scenario-Based</option>
                  <option value="chronological">Chronological Order</option>
                  <option value="match_following">Match the Following</option>
                </select>

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

            {/* Questions List */}
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="rounded-xl border bg-card p-6 space-y-3">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-20 w-full rounded-lg" />
                  </div>
                ))}
              </div>
            ) : filteredQuestions.length === 0 ? (
              <div className="rounded-xl border bg-card p-12 text-center">
                <HelpCircle className="mx-auto size-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold">No questions found</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {searchQuery || typeFilter !== "all" || difficultyFilter !== "all" || statusFilter !== "all"
                    ? "No questions match your filter criteria."
                    : "Create your first question to get started."}
                </p>
                <Button className="mt-6 gap-2" onClick={openCreateDialog}>
                  <Plus className="size-4" /> Add Question
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredQuestions.map((q) => {
                  const typeBadge = getTypeBadge(q.question_type)
                  const TypeIcon = typeBadge.icon
                  const isExpanded = !!expandedExplanations[q.id]

                  return (
                    <div
                      key={q.id}
                      onClick={() => navigateTo(`/games/mcq/${q.id}`)}
                      className="group relative rounded-xl border bg-card p-6 shadow-xs transition duration-200 hover:shadow-md hover:border-primary/50 cursor-pointer"
                    >
                      {/* Top Row Badges & Actions */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-md bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                            #{q.id}
                          </span>

                          <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-0.5 text-xs font-semibold ${typeBadge.className}`}>
                            <TypeIcon className="size-3.5" />
                            {typeBadge.label}
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

                      {/* Question Content View per Question Type */}

                      {/* 1. Scene passage if present */}
                      {q.question_type === "scene_based" && q.scenario_text && (
                        <div className="mt-4 rounded-lg bg-purple-500/10 dark:bg-purple-950/40 border border-purple-500/30 p-3.5 text-xs leading-relaxed text-foreground">
                          <span className="font-bold flex items-center gap-1.5 mb-1 text-purple-700 dark:text-purple-300">
                            <BookOpen className="size-4" /> Scenario Passage:
                          </span>
                          {q.scenario_text}
                        </div>
                      )}

                      {/* Primary Image if present */}
                      {q.image_url && (
                        <div className="mt-4 flex items-center gap-4 rounded-lg border bg-muted/30 p-2.5">
                          <img
                            src={q.image_url}
                            alt="Question Illustration"
                            className="h-20 w-32 rounded object-cover border"
                            onError={(e) => {
                              ;(e.target as HTMLImageElement).style.display = "none"
                            }}
                          />
                          <div className="text-xs text-muted-foreground">
                            <span className="font-semibold block text-foreground">Primary Question Image</span>
                            <span className="truncate block max-w-md text-[11px]">{q.image_url}</span>
                          </div>
                        </div>
                      )}

                      {/* Main Question Text */}
                      <h3 className="mt-4 text-base font-semibold leading-snug text-foreground group-hover:text-primary transition">
                        {q.question_text}
                      </h3>

                      {/* Type 1, 2, 3: Options Grid */}
                      {(q.question_type === "standard" || q.question_type === "image_based" || q.question_type === "scene_based") && q.options && (
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          {q.options.map((opt, idx) => (
                            <div
                              key={opt.id || idx}
                              className={`rounded-lg border p-3 text-xs transition ${
                                opt.is_correct
                                  ? "border-emerald-500/50 bg-emerald-500/10 dark:bg-emerald-950/30 text-foreground font-medium"
                                  : "bg-muted/40 text-foreground border-border"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span className="flex items-start gap-2">
                                  {opt.is_correct ? (
                                    <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                                  ) : (
                                    <XCircle className="size-4 text-muted-foreground shrink-0 opacity-40 mt-0.5" />
                                  )}
                                  <span>
                                    <span className="font-semibold">
                                      Option {String.fromCharCode(65 + idx)}:
                                    </span>{" "}
                                    {opt.option_text}
                                  </span>
                                </span>

                                {opt.is_correct && (
                                  <span className="rounded bg-emerald-600 dark:bg-emerald-500 px-1.5 py-0.5 text-[10px] font-bold text-white uppercase shrink-0 shadow-xs">
                                    Correct
                                  </span>
                                )}
                              </div>

                              {/* Option image thumbnail */}
                              {opt.image_url && (
                                <img
                                  src={opt.image_url}
                                  alt={`Option ${String.fromCharCode(65 + idx)}`}
                                  className="mt-2 h-12 w-20 rounded object-cover border"
                                />
                              )}

                              {/* Explanation Preview */}
                              {isExpanded && opt.explanation && (
                                <div className="mt-2 pt-2 border-t border-border/60 text-[11px] text-muted-foreground">
                                  <span className="font-semibold text-foreground">Why: </span>
                                  {opt.explanation}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Type 4: Chronological Sequence List */}
                      {q.question_type === "chronological" && q.metadata?.items && (
                        <div className="mt-4 rounded-xl border bg-amber-500/10 dark:bg-amber-950/30 border-amber-500/30 p-4">
                          <h4 className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                            <ListOrdered className="size-4" /> Correct Chronological Sequence (1 to 5):
                          </h4>
                          <div className="grid gap-2 sm:grid-cols-5">
                            {q.metadata.items.map((item, idx) => (
                              <div
                                key={idx}
                                className="rounded-lg border bg-card p-2.5 text-xs shadow-xs font-medium text-card-foreground flex items-center gap-2 border-amber-500/20"
                              >
                                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-amber-600 dark:bg-amber-500 text-[10px] font-bold text-white shadow-xs">
                                  {idx + 1}
                                </span>
                                <span className="truncate">{item}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Type 5: Match the Following Columns */}
                      {q.question_type === "match_following" && q.metadata && (
                        <div className="mt-4 rounded-xl border bg-blue-500/10 dark:bg-blue-950/30 border-blue-500/30 p-4 space-y-3">
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                              <h5 className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase mb-2">Column A (Items)</h5>
                              <ul className="space-y-1.5 text-xs">
                                {q.metadata.left_column?.map((item, i) => (
                                  <li key={i} className="rounded bg-card p-2 border border-blue-500/20 font-medium text-card-foreground">
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <h5 className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase mb-2">Column B (Matches)</h5>
                              <ul className="space-y-1.5 text-xs">
                                {q.metadata.right_column?.map((item, i) => (
                                  <li key={i} className="rounded bg-card p-2 border border-blue-500/20 font-medium text-card-foreground">
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          {q.metadata.correct_pairs && (
                            <div className="pt-2 border-t border-blue-500/20 text-xs flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-blue-700 dark:text-blue-300">Correct Pairs:</span>
                              {Object.entries(q.metadata.correct_pairs).map(([left, right]) => (
                                <span key={left} className="rounded bg-blue-600 dark:bg-blue-500 px-2 py-0.5 text-[11px] font-bold text-white shadow-xs">
                                  {left} → {right}
                                </span>
                              ))}
                            </div>
                          )}

                          {q.metadata.explanation && (
                            <p className="text-[11px] text-muted-foreground pt-1">
                              <span className="font-semibold text-foreground">Explanation: </span>
                              {q.metadata.explanation}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Card Footer */}
                      <div className="mt-4 pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
                        {(q.question_type === "standard" || q.question_type === "image_based" || q.question_type === "scene_based") ? (
                          <button
                            type="button"
                            onClick={(e) => toggleExplanations(q.id, e)}
                            className="flex items-center gap-1.5 font-medium hover:text-foreground transition"
                          >
                            <Info className="size-3.5 text-primary" />
                            {isExpanded ? "Hide Explanations" : "View Option Explanations"}
                            <ChevronDown className={`size-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                          </button>
                        ) : (
                          <span className="text-[11px] font-medium text-muted-foreground">
                            Interactive Game Question ({q.question_type})
                          </span>
                        )}

                        <span className="flex items-center gap-1 text-primary group-hover:underline">
                          View Detail <ChevronRight className="size-3" />
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

      {/* Create / Edit Question Modal */}
      <Dialog.Root open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/60 animate-in fade-in duration-200" />
          <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <Dialog.Popup className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-xl border bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b pb-4 shrink-0">
                <Dialog.Title className="text-lg font-semibold flex items-center gap-2">
                  <Gamepad2 className="size-5 text-primary" />
                  {editingQuestion ? `Edit Question #${editingQuestion.id}` : "Create New Question"}
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
                  {/* Select Question Type Tabs */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                      Select Question Type <span className="text-destructive">*</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {[
                        { type: "standard", label: "1. Standard", icon: Type },
                        { type: "image_based", label: "2. Image-Based", icon: ImageIcon },
                        { type: "scene_based", label: "3. Scenario", icon: BookOpen },
                        { type: "chronological", label: "4. Chrono", icon: ListOrdered },
                        { type: "match_following", label: "5. Match", icon: GitCompare },
                      ].map((item) => {
                        const Icon = item.icon
                        const isSelected = formQuestionType === item.type
                        return (
                          <button
                            key={item.type}
                            type="button"
                            onClick={() => setFormQuestionType(item.type as QuestionType)}
                            className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-semibold transition ${
                              isSelected
                                ? "border-primary bg-primary/15 text-primary shadow-xs font-bold"
                                : "bg-muted/30 hover:bg-muted text-muted-foreground border-border"
                            }`}
                          >
                            <Icon className="size-4 mb-1" />
                            {item.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Question Prompt Text */}
                  <label className="block text-sm font-medium">
                    Question Prompt / Text <span className="text-destructive">*</span>
                    <textarea
                      required
                      rows={2}
                      placeholder={
                        formQuestionType === "chronological"
                          ? "e.g. Arrange the following historical events in chronological order (oldest to newest)."
                          : formQuestionType === "match_following"
                          ? "e.g. Match the countries with their capital cities."
                          : "e.g. What is the capital of France?"
                      }
                      value={formQuestionText}
                      onChange={(e) => setFormQuestionText(e.target.value)}
                      className="mt-1.5 w-full rounded-lg border bg-background p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                    />
                  </label>

                  {/* Type 2 & 3: Primary Image URL input */}
                  {(formQuestionType === "image_based" || formQuestionType === "scene_based") && (
                    <label className="block text-sm font-medium">
                      Main Question Image URL {formQuestionType === "image_based" && <span className="text-destructive">*</span>}
                      <input
                        required={formQuestionType === "image_based"}
                        type="url"
                        placeholder="e.g. https://example.com/images/eiffel.jpg"
                        value={formImageUrl}
                        onChange={(e) => setFormImageUrl(e.target.value)}
                        className="mt-1.5 h-10 w-full rounded-lg border bg-background px-3 text-xs outline-none focus:border-primary"
                      />
                    </label>
                  )}

                  {/* Type 3: Scenario Textarea */}
                  {formQuestionType === "scene_based" && (
                    <label className="block text-sm font-medium">
                      Scenario / Passage Narrative Text <span className="text-destructive">*</span>
                      <textarea
                        required
                        rows={3}
                        placeholder="e.g. A manufacturing server experiences an unexpected surge in network load at 02:00 UTC, causing packet drop rates to exceed 15%..."
                        value={formScenarioText}
                        onChange={(e) => setFormScenarioText(e.target.value)}
                        className="mt-1.5 w-full rounded-lg border bg-background p-3 text-xs outline-none focus:border-primary"
                      />
                    </label>
                  )}

                  {/* Subject, Difficulty & Active */}
                  <div className="grid gap-4 sm:grid-cols-3">
                    <label className="block text-sm font-medium">
                      Subject <span className="text-destructive">*</span>
                      <input
                        required
                        type="text"
                        placeholder="e.g. Geography, Science, History..."
                        value={formSubject}
                        onChange={(e) => setFormSubject(e.target.value)}
                        className="mt-1.5 h-10 w-full rounded-lg border bg-background px-3 text-xs outline-none focus:border-primary"
                      />
                    </label>

                    <label className="block text-sm font-medium">
                      Difficulty Level
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
                        id="mcq_is_active"
                        type="checkbox"
                        checked={formIsActive}
                        onChange={(e) => setFormIsActive(e.target.checked)}
                        className="size-4 rounded accent-primary cursor-pointer"
                      />
                      <label htmlFor="mcq_is_active" className="text-sm cursor-pointer select-none font-medium">
                        Published (Active)
                      </label>
                    </div>
                  </div>

                  {/* Standard, Image-Based, Scene-Based: 4 Options Builder */}
                  {(formQuestionType === "standard" || formQuestionType === "image_based" || formQuestionType === "scene_based") && (
                    <div className="space-y-4 rounded-xl border p-4 bg-muted/20 border-border">
                      <div className="flex items-center justify-between border-b pb-3">
                        <h4 className="text-sm font-semibold flex items-center gap-2">
                          <RadioIcon className="size-4 text-primary" />
                          4 Options & Explanations <span className="text-destructive">*</span>
                        </h4>
                        <span className="text-xs text-muted-foreground">
                          Mark exactly <strong className="text-emerald-600 dark:text-emerald-400">1 option as correct</strong>
                        </span>
                      </div>

                      <div className="space-y-4">
                        {formOptions.map((opt, index) => (
                          <div
                            key={index}
                            className={`rounded-lg border p-4 transition ${
                              opt.is_correct
                                ? "border-emerald-500/50 bg-emerald-500/5 dark:bg-emerald-950/20"
                                : "bg-background border-border"
                            }`}
                          >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                  type="radio"
                                  name="correct_option_selector"
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
                                placeholder={`Option ${String.fromCharCode(65 + index)} text`}
                                value={opt.option_text}
                                onChange={(e) => handleOptionTextChange(index, e.target.value)}
                                className="h-9 flex-1 rounded-lg border bg-background px-3 text-xs outline-none focus:border-primary"
                              />
                            </div>

                            {formQuestionType === "image_based" && (
                              <div className="mt-2">
                                <input
                                  type="url"
                                  placeholder={`Optional Option ${String.fromCharCode(65 + index)} Image URL`}
                                  value={opt.image_url || ""}
                                  onChange={(e) => handleOptionImageChange(index, e.target.value)}
                                  className="h-8 w-full rounded border bg-background px-3 text-[11px] outline-none focus:border-primary"
                                />
                              </div>
                            )}

                            <div className="mt-2">
                              <textarea
                                required
                                rows={2}
                                placeholder={`Explanation why Option ${String.fromCharCode(65 + index)} is ${opt.is_correct ? "correct" : "incorrect"}...`}
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

                  {/* Type 4: Chronological 5 Items Builder */}
                  {formQuestionType === "chronological" && (
                    <div className="space-y-4 rounded-xl border p-4 bg-amber-500/10 dark:bg-amber-950/30 border-amber-500/30">
                      <h4 className="text-sm font-semibold flex items-center gap-2 text-amber-800 dark:text-amber-300">
                        <ListOrdered className="size-4" /> 5 Sequence Items (In Correct Chronological Order)
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Enter the 5 events in their exact chronological order (from oldest to newest).
                      </p>

                      <div className="space-y-3">
                        {[
                          "e.g. 1. Construction of the Great Pyramids",
                          "e.g. 2. Fall of the Western Roman Empire",
                          "e.g. 3. Invention of the Printing Press",
                          "e.g. 4. American Declaration of Independence",
                          "e.g. 5. First Moon Landing",
                        ].map((placeholderText, idx) => (
                          <div key={idx} className="flex items-center gap-3">
                            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-amber-600 dark:bg-amber-500 font-bold text-xs text-white shadow-xs">
                              {idx + 1}
                            </span>
                            <input
                              required
                              type="text"
                              placeholder={placeholderText}
                              value={formChronoItems[idx] || ""}
                              onChange={(e) => {
                                const next = [...formChronoItems]
                                next[idx] = e.target.value
                                setFormChronoItems(next)
                              }}
                              className="h-10 flex-1 rounded-lg border bg-background px-3 text-xs outline-none focus:border-primary"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Type 5: Match the Following Builder */}
                  {formQuestionType === "match_following" && (
                    <div className="space-y-4 rounded-xl border p-4 bg-blue-500/10 dark:bg-blue-950/30 border-blue-500/30">
                      <h4 className="text-sm font-semibold flex items-center gap-2 text-blue-800 dark:text-blue-300">
                        <GitCompare className="size-4" /> Match the Following Columns & Pairs
                      </h4>

                      <div className="grid gap-4 sm:grid-cols-2">
                        {/* Left Column */}
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-blue-700 dark:text-blue-300 uppercase">Column A (Items)</label>
                          {[
                            "e.g. 1. India",
                            "e.g. 2. France",
                            "e.g. 3. Japan",
                            "e.g. 4. Spain",
                          ].map((placeholderText, idx) => (
                            <input
                              key={idx}
                              required
                              type="text"
                              placeholder={placeholderText}
                              value={formLeftCol[idx] || ""}
                              onChange={(e) => {
                                const next = [...formLeftCol]
                                next[idx] = e.target.value
                                setFormLeftCol(next)
                              }}
                              className="h-9 w-full rounded border bg-background px-3 text-xs outline-none focus:border-primary"
                            />
                          ))}
                        </div>

                        {/* Right Column */}
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-blue-700 dark:text-blue-300 uppercase">Column B (Matches)</label>
                          {[
                            "e.g. A. Tokyo",
                            "e.g. B. New Delhi",
                            "e.g. C. Madrid",
                            "e.g. D. Paris",
                          ].map((placeholderText, idx) => (
                            <input
                              key={idx}
                              required
                              type="text"
                              placeholder={placeholderText}
                              value={formRightCol[idx] || ""}
                              onChange={(e) => {
                                const next = [...formRightCol]
                                next[idx] = e.target.value
                                setFormRightCol(next)
                              }}
                              className="h-9 w-full rounded border bg-background px-3 text-xs outline-none focus:border-primary"
                            />
                          ))}
                        </div>
                      </div>

                      {/* Correct Pairs Mapping */}
                      <div className="pt-2 border-t border-blue-500/20">
                        <label className="block text-xs font-bold text-blue-700 dark:text-blue-300 uppercase mb-2">
                          Correct Pair Mappings (e.g. 1 → B, 2 → D, 3 → A, 4 → C)
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {["1", "2", "3", "4"].map((key, i) => (
                            <div key={key} className="flex items-center gap-2 rounded border bg-background p-2 text-xs">
                              <span className="font-bold text-blue-600 dark:text-blue-400">{key} →</span>
                              <input
                                required
                                type="text"
                                maxLength={2}
                                placeholder={["B", "D", "A", "C"][i]}
                                value={formCorrectPairs[key] || ""}
                                onChange={(e) => {
                                  setFormCorrectPairs((prev) => ({
                                    ...prev,
                                    [key]: e.target.value.toUpperCase(),
                                  }))
                                }}
                                className="h-7 w-10 text-center font-bold rounded border bg-muted/30 outline-none uppercase"
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      <label className="block text-xs font-medium pt-2">
                        Explanation
                        <textarea
                          rows={2}
                          placeholder="e.g. India=New Delhi (B), France=Paris (D), Japan=Tokyo (A), Spain=Madrid (C)."
                          value={formMatchExplanation}
                          onChange={(e) => setFormMatchExplanation(e.target.value)}
                          className="mt-1 w-full rounded-lg border bg-background p-2.5 text-xs outline-none focus:border-primary"
                        />
                      </label>
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
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : editingQuestion ? "Update Question" : "Create Question"}
                  </Button>
                </div>
              </form>
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Delete Dialog */}
      <Dialog.Root open={!!deletingQuestion} onOpenChange={(open) => !open && setDeletingQuestion(null)}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50 animate-in fade-in duration-200" />
          <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <Dialog.Popup className="w-full max-w-md rounded-xl border bg-card p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
              <Dialog.Title className="text-lg font-semibold text-destructive flex items-center gap-2">
                <Trash2 className="size-5" /> Delete Question
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
