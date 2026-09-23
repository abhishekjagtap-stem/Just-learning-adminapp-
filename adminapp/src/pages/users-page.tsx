import { useCallback, useEffect, useState, type FormEvent } from "react"
import { Dialog } from "@base-ui/react/dialog"
import { Plus, X } from "lucide-react"
import { Header } from "@/components/dashboard/header"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/toast"
import { createStaff, getAdminUsers, type AdminUser } from "@/lib/api"

export function UsersPage() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const loadUsers = useCallback(async () => {
    setIsLoading(true)
    try {
      const { results } = await getAdminUsers()
      setUsers(results)
    } catch (error) {
      toast(error instanceof Error ? error.message : "Unable to load users.", "error")
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    void loadUsers()
  }, [loadUsers])

  const handleCreateUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setIsSubmitting(true)
    try {
      const roleVal = String(form.get("role") || "")
      const response = await createStaff({
        email: String(form.get("email")),
        password: String(form.get("password")),
        first_name: String(form.get("first_name") || ""),
        last_name: String(form.get("last_name") || ""),
        role: roleVal || undefined,
        is_superuser: form.get("is_superuser") === "on",
      })
      setDialogOpen(false)
      await loadUsers()
      toast(response.message)
    } catch (error) {
      toast(error instanceof Error ? error.message : "Unable to create the user.", "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getRoleLabel = (user: AdminUser) => {
    if (user.is_superuser) return "Superadmin"
    if (user.role === "content_creator") return "Content Creator"
    if (user.role === "content_manager") return "Content Manager"
    return "Staff"
  }

  return (
    <div className="flex min-h-svh">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((value) => !value)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header title="Users" onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 p-4 sm:p-7">
          <div className="mx-auto max-w-7xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold">Admin & staff users</h2>
                <p className="mt-1 text-sm text-muted-foreground">Manage users with access to the admin workspace.</p>
              </div>
              <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
                <Dialog.Trigger render={<Button><Plus />Create user</Button>} />
                <Dialog.Portal>
                  <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50 animate-in fade-in duration-200" />
                  <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <Dialog.Popup className="w-full max-w-md rounded-xl border bg-card p-6 shadow-xl animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-200">
                      <Dialog.Title className="text-lg font-semibold">Create staff account</Dialog.Title>
                      <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                        Create an administrator, content manager, or content creator account with workspace access.
                      </Dialog.Description>
                      <form className="mt-6 space-y-4" onSubmit={handleCreateUser}>
                        <div className="grid grid-cols-2 gap-3">
                          <label className="block text-sm font-medium">
                            First name
                            <input
                              name="first_name"
                              type="text"
                              placeholder="Jane"
                              className="mt-1.5 h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-primary"
                            />
                          </label>
                          <label className="block text-sm font-medium">
                            Last name
                            <input
                              name="last_name"
                              type="text"
                              placeholder="Doe"
                              className="mt-1.5 h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-primary"
                            />
                          </label>
                        </div>

                        <label className="block text-sm font-medium">
                          Email
                          <input
                            required
                            name="email"
                            type="email"
                            placeholder="staff@justlearning.com"
                            className="mt-1.5 h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-primary"
                          />
                        </label>

                        <label className="block text-sm font-medium">
                          Password
                          <input
                            required
                            name="password"
                            type="password"
                            minLength={6}
                            placeholder="Set a secure password"
                            className="mt-1.5 h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-primary"
                          />
                        </label>

                        <label className="block text-sm font-medium">
                          Role / Permissions
                          <select
                            name="role"
                            className="mt-1.5 h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-primary"
                          >
                            <option value="">General Staff</option>
                            <option value="content_creator">Content Creator (Draft & Submit)</option>
                            <option value="content_manager">Content Manager (Review & Publish)</option>
                          </select>
                        </label>

                        <label className="flex items-center gap-2 text-sm pt-1">
                          <input name="is_superuser" type="checkbox" className="size-4 accent-primary" />
                          Create as superadmin
                        </label>

                        <div className="flex justify-end gap-2 pt-3">
                          <Dialog.Close render={<Button type="button" variant="outline">Cancel</Button>} />
                          <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Creating…" : "Create user"}
                          </Button>
                        </div>
                      </form>
                    </Dialog.Popup>
                  </Dialog.Viewport>
                </Dialog.Portal>
              </Dialog.Root>
            </div>

            <div className="overflow-hidden rounded-xl border bg-card">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-left text-sm">
                  <thead className="border-b bg-muted/50 text-muted-foreground">
                    <tr>
                      <th className="px-5 py-3 font-medium">Email</th>
                      <th className="px-5 py-3 font-medium">Role</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 font-medium">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      Array.from({ length: 5 }, (_, index) => (
                        <tr key={index} className="border-b last:border-0">
                          <td className="px-5 py-4"><Skeleton className="h-4 w-52" /></td>
                          <td className="px-5 py-4"><Skeleton className="h-4 w-28" /></td>
                          <td className="px-5 py-4"><Skeleton className="h-4 w-16" /></td>
                          <td className="px-5 py-4"><Skeleton className="h-4 w-24" /></td>
                        </tr>
                      ))
                    ) : (
                      users.map((user) => (
                        <tr key={user.id} className="border-b last:border-0">
                          <td className="px-5 py-4 font-medium">
                            {user.email}
                            {user.full_name && (
                              <span className="ml-2 text-xs font-normal text-muted-foreground">
                                ({user.full_name})
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4 font-medium">{getRoleLabel(user)}</td>
                          <td className="px-5 py-4">
                            <span className={user.is_active ? "text-emerald-600 font-medium" : "text-destructive"}>
                              {user.is_active ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-muted-foreground">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    )}
                    {!isLoading && users.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-5 py-8 text-center text-muted-foreground">
                          No admin or staff users found.
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
    </div>
  )
}
