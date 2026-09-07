import { useCallback, useEffect, useState, type FormEvent } from "react"
import { Dialog } from "@base-ui/react/dialog"
import {
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Edit,
  ExternalLink,
  Gamepad2,
  HelpCircle,
  Radio as RadioIcon,
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
  deleteMCQQuestion,
  getMCQQuestionDetail,
  updateMCQQuestion,
  type MCQOption,
  type MCQQuestion,
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
  const [formQuestionText, setFormQuestionText] = useState("")
  const [formSubject, setFormSubject] = useState("")
  const [formDifficulty, setFormDifficulty] = useState<"beginner" | "intermediate" | "advanced">("beginner")
  const [formIsActive, setFormIsActive] = useState(true)
  const [formOptions, setFormOptions] = useState<MCQOption[]>([])

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
    setFormQuestionText(question.question_text)
    setFormSubject(question.subject)
    setFormDifficulty((question.difficulty as "beginner" | "intermediate" | "advanced") || "beginner")
    setFormIsActive(question.is_active)
    setFormOptions(
      question.options.map((opt) => ({
        id: opt.id,
        option_text: opt.option_text,
        is_correct: opt.is_correct,
        explanation: opt.explanation,
      }))
    )
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

    if (formOptions.length !== 4) {
      toast("Must have 4 options.", "error")
      return
    }

    const correctCount = formOptions.filter((o) => o.is_correct).length
    if (correctCount !== 1) {
      toast("Exactly 1 option must be marked as correct.", "error")
      return
    }

    setIsSavingEdit(true)
    try {
      await updateMCQQuestion(question.id, {
        question_text: formQuestionText.trim(),
        subject: formSubject.trim(),
        difficulty: formDifficulty,
        is_active: formIsActive,
        options: formOptions,
      })
      setEditDialogOpen(false)
      toast("MCQ Question updated successfully!")
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
      toast("MCQ Question deleted successfully.")
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

  return (
    <div className="flex min-h-svh bg-background">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header title="MCQ Detail" onMenuClick={() => setMobileOpen(true)} />

        <main className="flex-1 p-4 sm:p-7">
          <div className="mx-auto max-w-5xl space-y-6">
            {/* Top Navigation Bar */}
            <div className="flex items-center justify-between gap-4">
              <button
                onClick={() => navigateTo("/games/mcq")}
                className="group flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition"
              >
                <ArrowLeft className="size-4 transition transform group-hover:-translate-x-1" />
                Back to MCQ Questions
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

            {/* Error View */}
            {errorMsg && !isLoading && (
              <div className="rounded-xl border bg-card p-12 text-center">
                <HelpCircle className="mx-auto size-12 text-destructive/50" />
                <h3 className="mt-4 text-lg font-semibold text-destructive">Question Not Found</h3>
                <p className="mt-1 text-sm text-muted-foreground">{errorMsg}</p>
                <Button className="mt-6 gap-2" onClick={() => navigateTo("/games/mcq")}>
                  <ArrowLeft className="size-4" /> Back to All MCQ Questions
                </Button>
              </div>
            )}

            {/* Loading View */}
            {isLoading && (
              <div className="space-y-6">
                <Skeleton className="h-8 w-1/3 rounded-md" />
                <Skeleton className="h-44 w-full rounded-xl" />
                <Skeleton className="h-64 w-full rounded-xl" />
              </div>
            )}

            {/* Detail Content View */}
            {question && !isLoading && (
              <div className="space-y-6">
                {/* Header Metadata Card */}
                <div className="rounded-xl border bg-card p-6 shadow-xs space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                        Question #{question.id}
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

                  <h1 className="text-xl font-bold tracking-tight sm:text-2xl leading-relaxed text-foreground">
                    {question.question_text}
                  </h1>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="size-3.5" />
                      Created: {new Date(question.created_at).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="size-3.5" />
                      Last Updated: {new Date(question.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* 4 Options & Detailed Explanations */}
                <div className="rounded-xl border bg-card p-6 shadow-xs space-y-4">
                  <h3 className="font-semibold text-base flex items-center gap-2">
                    <Gamepad2 className="size-5 text-primary" />
                    Options & Answer Explanations
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Each question contains 4 options with exactly 1 correct answer and detailed explanation text.
                  </p>

                  <div className="grid gap-4 sm:grid-cols-2 pt-2">
                    {question.options.map((opt, idx) => (
                      <div
                        key={opt.id || idx}
                        className={`rounded-xl border p-5 space-y-3 transition ${
                          opt.is_correct
                            ? "border-emerald-500/50 bg-emerald-500/10 dark:bg-emerald-950/20"
                            : "bg-muted/20"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 border-b pb-3 border-muted">
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
                            className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase ${
                              opt.is_correct
                                ? "bg-emerald-600 text-white"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {opt.is_correct ? "Correct Answer" : "Incorrect"}
                          </span>
                        </div>

                        <p className="font-semibold text-sm text-foreground">{opt.option_text}</p>

                        <div className="rounded-lg bg-background p-3 text-xs leading-relaxed text-muted-foreground space-y-1">
                          <span className="font-semibold text-foreground block">
                            Explanation:
                          </span>
                          <span>{opt.explanation}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Developer / API Inspector */}
                <div className="rounded-xl border bg-card p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b pb-3">
                    <h3 className="font-semibold text-sm flex items-center gap-2 font-mono">
                      <ExternalLink className="size-4 text-primary" />
                      API Payload Response (GET /:id/)
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

      {/* Edit Modal */}
      {question && (
        <Dialog.Root open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <Dialog.Portal>
            <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/60 animate-in fade-in duration-200" />
            <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
              <Dialog.Popup className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-xl border bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between border-b pb-4 shrink-0">
                  <Dialog.Title className="text-lg font-semibold flex items-center gap-2">
                    <Edit className="size-5 text-primary" /> Edit MCQ Question #{question.id}
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
                        rows={3}
                        value={formQuestionText}
                        onChange={(e) => setFormQuestionText(e.target.value)}
                        className="mt-2 w-full rounded-lg border bg-background p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                      />
                    </label>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <label className="block text-sm font-medium">
                        Subject <span className="text-destructive">*</span>
                        <input
                          required
                          type="text"
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
                          id="edit_mcq_is_active"
                          type="checkbox"
                          checked={formIsActive}
                          onChange={(e) => setFormIsActive(e.target.checked)}
                          className="size-4 rounded accent-primary cursor-pointer"
                        />
                        <label htmlFor="edit_mcq_is_active" className="text-sm cursor-pointer select-none font-medium">
                          Published (Active)
                        </label>
                      </div>
                    </div>

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
                              <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                  type="radio"
                                  name="edit_correct_option"
                                  checked={opt.is_correct}
                                  onChange={() => handleCorrectOptionSelect(index)}
                                  className="size-4 accent-emerald-600 cursor-pointer"
                                />
                                <span className={`text-xs font-bold ${opt.is_correct ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"}`}>
                                  Option {String.fromCharCode(65 + index)} {opt.is_correct && "(Correct Answer)"}
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
                      {isSavingEdit ? "Saving…" : "Save Changes"}
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
