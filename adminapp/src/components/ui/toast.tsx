import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react"
import { X } from "lucide-react"
import { Toast } from "@base-ui/react/toast"

type ToastType = "success" | "error"
type ToastContextValue = { toast: (message: string, type?: ToastType) => void }

const ToastContext = createContext<ToastContextValue | null>(null)

function ToastRenderer({ children }: { children: ReactNode }) {
  const { toasts, add, close } = Toast.useToastManager()
  const toast = useCallback((message: string, type: ToastType = "success") => { add({ title: message, type }) }, [add])
  const value = useMemo(() => ({ toast }), [toast])
  return <ToastContext.Provider value={value}>{children}<Toast.Viewport className="fixed right-4 top-4 z-[100] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2">{toasts.map((item) => <Toast.Root key={item.id} toast={item}><Toast.Content className={`flex items-start justify-between gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg ${item.type === "error" ? "border-destructive/30 bg-destructive text-white" : "border-emerald-200 bg-card text-foreground"}`}><Toast.Title className="font-medium">{item.title}</Toast.Title><button type="button" onClick={() => close(item.id)} className="-mr-1 -mt-1 rounded p-1 opacity-70 hover:opacity-100" aria-label="Dismiss notification"><X className="size-4" /></button></Toast.Content></Toast.Root>)}</Toast.Viewport></ToastContext.Provider>
}

export function Toaster({ children }: { children: ReactNode }) {
  return <Toast.Provider><ToastRenderer>{children}</ToastRenderer></Toast.Provider>
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error("useToast must be used within Toaster")
  return context
}
