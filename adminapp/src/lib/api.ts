const apiBaseUrl = import.meta.env.VITE_API_BASE_URL

function endpoint(path: string) {
  if (!apiBaseUrl) {
    throw new Error("VITE_API_BASE_URL is not configured.")
  }

  return new URL(path.replace(/^\//, ""), `${apiBaseUrl.replace(/\/$/, "")}/`).toString()
}

type RequestOptions = {
  method?: "GET" | "POST"
  body?: unknown
  authenticated?: boolean
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = sessionStorage.getItem("admin-auth-token")
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (options.authenticated && token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(endpoint(path), {
    method: options.method ?? "POST",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  })

  const data: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    const detail =
      typeof data === "object" && data !== null && "detail" in data && typeof data.detail === "string"
        ? data.detail
        : "Unable to complete the request. Please check your details and try again."
    throw new Error(detail)
  }

  return data as T
}

export type AdminLoginResponse = {
  message: string
  admin_role: string
  tokens: {
    access: string
    refresh: string
  }
  user: AdminUser
}

export type AdminUser = {
  id: number
  email: string
  is_active: boolean
  is_staff: boolean
  is_superuser: boolean
  created_at: string
}

export function loginAdmin(credentials: { email: string; password: string }) {
  return request<AdminLoginResponse>("api/auth/admin/login/", { body: credentials })
}

export function createStaff(staff: { email: string; password: string; is_superuser: boolean }) {
  return request<{ message: string; staff: AdminUser }>("api/auth/admin/create-staff/", {
    body: staff,
    authenticated: true,
  })
}

export function getAdminUsers() {
  return request<{ count: number; results: AdminUser[] }>("api/auth/admin/users/", {
    method: "GET",
    authenticated: true,
  })
}
