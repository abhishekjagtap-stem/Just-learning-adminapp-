const apiBaseUrl = import.meta.env.VITE_API_BASE_URL

function endpoint(path: string) {
  if (!apiBaseUrl) {
    throw new Error("VITE_API_BASE_URL is not configured.")
  }

  return new URL(path.replace(/^\//, ""), `${apiBaseUrl.replace(/\/$/, "")}/`).toString()
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE"
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
    let detail = "Unable to complete the request. Please check your details and try again."
    if (typeof data === "object" && data !== null) {
      if ("detail" in data && typeof (data as { detail: unknown }).detail === "string") {
        detail = (data as { detail: string }).detail
      } else {
        const errorMessages: string[] = []
        for (const value of Object.values(data as Record<string, unknown>)) {
          if (Array.isArray(value)) {
            errorMessages.push(...value.map((v) => (typeof v === "string" ? v : JSON.stringify(v))))
          } else if (typeof value === "string") {
            errorMessages.push(value)
          }
        }
        if (errorMessages.length > 0) {
          detail = errorMessages.join(" ")
        }
      }
    }
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

export type Podcast = {
  id: number
  embed_code: string
  description?: string
  title: string
  thumbnail_url?: string | null
  keep_at_home: boolean
  created_at: string
  updated_at: string
}

export type AdminSettings = {
  max_home_podcasts: number
  updated_at?: string
}

export type CreatePodcastPayload = {
  embed_code: string
  description?: string
  keep_at_home?: boolean
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

export function getPodcasts() {
  return request<Podcast[] | { count: number; results: Podcast[] }>("api/admin-side/podcasts/", {
    method: "GET",
    authenticated: true,
  })
}

export function createPodcast(payload: CreatePodcastPayload) {
  return request<Podcast>("api/admin-side/podcasts/create/", {
    method: "POST",
    body: payload,
    authenticated: true,
  })
}

export function updatePodcast(id: number, payload: Partial<CreatePodcastPayload>) {
  return request<Podcast>(`api/admin-side/podcasts/${id}/`, {
    method: "PATCH",
    body: payload,
    authenticated: true,
  })
}

export function togglePodcastHome(id: number, keep_at_home: boolean) {
  return updatePodcast(id, { keep_at_home })
}

export function getAdminSettings() {
  return request<AdminSettings>("api/admin-side/settings/", {
    method: "GET",
    authenticated: true,
  })
}

export function updateAdminSettings(settings: { max_home_podcasts: number }) {
  return request<AdminSettings>("api/admin-side/settings/", {
    method: "PUT",
    body: settings,
    authenticated: true,
  })
}

export function getPodcastDetail(id: number) {
  return request<Podcast>(`api/admin-side/podcasts/${id}/`, {
    method: "GET",
    authenticated: true,
  })
}

export function deletePodcast(id: number) {
  return request<void>(`api/admin-side/podcasts/${id}/`, {
    method: "DELETE",
    authenticated: true,
  })
}

export function getHomePodcasts() {
  return request<Podcast[] | { count: number; results: Podcast[] }>("api/admin-side/podcasts/home/", {
    method: "GET",
    authenticated: false,
  })
}

export type MCQOption = {
  id?: number
  option_text: string
  is_correct: boolean
  explanation: string
}

export type MCQQuestion = {
  id: number
  question_text: string
  difficulty: "beginner" | "intermediate" | "advanced" | string
  subject: string
  is_active: boolean
  options: MCQOption[]
  created_at: string
  updated_at: string
}

export type CreateMCQQuestionPayload = {
  question_text: string
  difficulty: "beginner" | "intermediate" | "advanced" | string
  subject: string
  is_active?: boolean
  options: MCQOption[]
}

export function getMCQQuestions() {
  return request<MCQQuestion[] | { count: number; results: MCQQuestion[] }>("api/admin-side/mcq-questions/", {
    method: "GET",
    authenticated: true,
  })
}

export function createMCQQuestion(payload: CreateMCQQuestionPayload) {
  return request<MCQQuestion>("api/admin-side/mcq-questions/create/", {
    method: "POST",
    body: payload,
    authenticated: true,
  })
}

export function getMCQQuestionDetail(id: number) {
  return request<MCQQuestion>(`api/admin-side/mcq-questions/${id}/`, {
    method: "GET",
    authenticated: true,
  })
}

export function updateMCQQuestion(id: number, payload: Partial<CreateMCQQuestionPayload>) {
  return request<MCQQuestion>(`api/admin-side/mcq-questions/${id}/`, {
    method: "PUT",
    body: payload,
    authenticated: true,
  })
}

export function deleteMCQQuestion(id: number) {
  return request<void>(`api/admin-side/mcq-questions/${id}/`, {
    method: "DELETE",
    authenticated: true,
  })
}
