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
  first_name?: string
  last_name?: string
  full_name?: string
  role?: string | null
  is_active: boolean
  is_staff: boolean
  is_superuser: boolean
  created_at: string
}

export type CreateStaffPayload = {
  email: string
  password: string
  first_name?: string
  last_name?: string
  role?: string
  is_superuser?: boolean
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

export function createStaff(staff: CreateStaffPayload) {
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

export type QuestionType = "standard" | "image_based" | "scene_based" | "chronological" | "match_following"

export type MCQMetadata = {
  items?: string[]
  left_column?: string[]
  right_column?: string[]
  correct_pairs?: Record<string, string>
  explanation?: string
  [key: string]: any
}

export type MCQOption = {
  id?: number
  option_text: string
  image_url?: string | null
  is_correct: boolean
  explanation: string
}

export type MCQQuestion = {
  id: number
  question_type: QuestionType
  question_text: string
  scenario_text?: string | null
  image_url?: string | null
  metadata?: MCQMetadata | null
  difficulty: "beginner" | "intermediate" | "advanced" | string
  subject: string
  is_active: boolean
  options?: MCQOption[]
  created_at: string
  updated_at: string
}

export type CreateMCQQuestionPayload = {
  question_type: QuestionType
  question_text: string
  scenario_text?: string
  image_url?: string
  metadata?: MCQMetadata
  difficulty: "beginner" | "intermediate" | "advanced" | string
  subject: string
  is_active?: boolean
  options?: MCQOption[]
}

export function getMCQQuestions() {
  return request<MCQQuestion[] | { count: number; results: MCQQuestion[] }>("api/admin-side/mcq-questions/", {
    method: "GET",
    authenticated: true,
  })
}

export function createMCQQuestion(payload: CreateMCQQuestionPayload) {
  return request<MCQQuestion>("api/admin-side/mcq-questions/", {
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

export type LanguageSystemStats = {
  total_words: number
  total_translations: number
  failed_translations: number
  total_audio: number
  failed_audio: number
}

export type AdminDailyWord = {
  id: number
  word: string
  day_number: number
  status: string
  category: string | null
  translations_count: number
  audio_count: number
  created_at: string
}

export function getLanguageSystemStats() {
  return request<LanguageSystemStats>("api/admin-side/language-system/stats/", {
    method: "GET",
    authenticated: true,
  })
}

export function getLanguageSystemWords() {
  return request<AdminDailyWord[] | { count: number; results: AdminDailyWord[] }>("api/admin-side/language-system/words/", {
    method: "GET",
    authenticated: true,
  })
}

export type WordTranslation = {
  language: { code: string; name: string; native_name: string }
  translated_word: string
  translated_sentence: string
  translation_status: string
  audio: { word_audio_url?: string; sentence_audio_url?: string }
}

export type AdminDailyWordDetail = {
  id: number
  word: string
  definition: string
  english_sentence: string
  day_number: number
  translations: WordTranslation[]
}

export function getLanguageSystemWordDetail(id: number) {
  return request<AdminDailyWordDetail>(`api/admin-side/language-system/words/${id}/`, {
    method: "GET",
    authenticated: true,
  })
}

// Cultural State Content Types & API Functions
export interface IndianStateDirectoryItem {
  state_name: string
  state_code: string
  has_content: boolean
  content_id: number | null
  capital: string | null
  is_published: boolean | null
  hero_image_url: string | null
  updated_at: string | null
}

export interface TimelineEvent {
  id?: number
  year_or_era: string
  title: string
  description: string
  order?: number
}

export interface TheStoryTab {
  title: string
  description: string
  timeline: TimelineEvent[]
}

export interface StateFestival {
  id?: number
  title: string
  image_url: string
  description: string
  order?: number
}

export interface StateFood {
  id?: number
  dish_name: string
  image_url: string
  origin: string
  ingredients: string
  order?: number
}

export interface StateArtCraft {
  id?: number
  title: string
  image_url: string
  description?: string
  order?: number
}

export interface TheCultureTab {
  festivals: StateFestival[]
  foods: StateFood[]
  arts_and_crafts: StateArtCraft[]
}

export type DestinationTag = "forts" | "palaces" | "temples" | "wildlife" | "nature"

export interface IconicDestination {
  id?: number
  title: string
  category_tag: DestinationTag
  image_url: string
  description: string
  fact: string
  order?: number
}

export interface TheLandTab {
  geographic_image_url: string
  geographic_overview: string
  iconic_destinations: IconicDestination[]
}

export interface StateLegend {
  id?: number
  name: string
  subtitle: string
  image_url: string
  description: string
  order?: number
}

export interface StateCulturalContent {
  id?: number
  state_name: string
  state_code?: string
  capital: string
  language_spoken_mostly: string
  subtitle: string
  hero_image_url: string
  is_published: boolean
  the_story: TheStoryTab
  the_culture: TheCultureTab
  the_land: TheLandTab
  the_legends: StateLegend[]
  created_at?: string
  updated_at?: string
}

export function getCulturalStatesDirectory(params?: { status?: "pending" | "created"; search?: string }) {
  const query = new URLSearchParams()
  if (params?.status) query.set("status", params.status)
  if (params?.search) query.set("search", params.search)
  const qs = query.toString() ? `?${query.toString()}` : ""
  return request<IndianStateDirectoryItem[]>(`api/admin-side/content-management/cultural/states/${qs}`, {
    method: "GET",
    authenticated: true,
  })
}

export function getCulturalStatesContentList(search?: string) {
  const query = search ? `?search=${encodeURIComponent(search)}` : ""
  return request<StateCulturalContent[]>(`api/admin-side/content-management/cultural/states/content/${query}`, {
    method: "GET",
    authenticated: true,
  })
}

export function getCulturalStateContent(identifier: string | number) {
  return request<StateCulturalContent>(`api/admin-side/content-management/cultural/states/content/${identifier}/`, {
    method: "GET",
    authenticated: true,
  })
}

export function createCulturalStateContent(payload: StateCulturalContent) {
  return request<StateCulturalContent>("api/admin-side/content-management/cultural/states/content/", {
    method: "POST",
    body: payload,
    authenticated: true,
  })
}

export function updateCulturalStateContent(identifier: string | number, payload: Partial<StateCulturalContent>) {
  return request<StateCulturalContent>(`api/admin-side/content-management/cultural/states/content/${identifier}/`, {
    method: "PATCH",
    body: payload,
    authenticated: true,
  })
}

export function putCulturalStateContent(identifier: string | number, payload: StateCulturalContent) {
  return request<StateCulturalContent>(`api/admin-side/content-management/cultural/states/content/${identifier}/`, {
    method: "PUT",
    body: payload,
    authenticated: true,
  })
}

export function deleteCulturalStateContent(identifier: string | number) {
  return request<void>(`api/admin-side/content-management/cultural/states/content/${identifier}/`, {
    method: "DELETE",
    authenticated: true,
  })
}

// ------------------------------------------------------------
// TODAY IN INDIA (Daily Cultural Content & Scheduling)
// ------------------------------------------------------------

export type TodayInIndiaCategory =
  | "festive_story"
  | "history"
  | "people"
  | "food"
  | "art_and_craft"
  | "science_and_nature"
  | "language"
  | "place"

export interface TodayInIndiaCategoryOption {
  value?: TodayInIndiaCategory
  key?: TodayInIndiaCategory
  label: string
  description?: string
}

export interface TodayInIndiaTag {
  id?: number
  title: string
  subtitle: string
  order?: number
}

export interface TodayInIndiaGalleryItem {
  id?: number
  image_url: string
  title: string
  subtitle?: string
  order?: number
}

export interface TodayInIndiaItem {
  id?: number
  main_tag: string
  category: TodayInIndiaCategory
  category_display?: string
  scheduled_date: string
  title: string
  subtitle?: string
  hero_image_url: string
  state?: string
  description: string
  status: "draft" | "scheduled" | "published"
  status_display?: string
  tags: TodayInIndiaTag[]
  festive_gallery: TodayInIndiaGalleryItem[]
  fact_image_url?: string
  fact_title?: string
  fact_description?: string
  created_by?: number
  created_by_email?: string
  created_at?: string
  updated_at?: string
}

export type CreateTodayInIndiaPayload = Omit<
  TodayInIndiaItem,
  "id" | "created_by" | "created_by_email" | "created_at" | "updated_at" | "category_display" | "status_display"
>

export interface TodayInIndiaCalendarEntry {
  id: number
  title: string
  category: TodayInIndiaCategory
  category_display?: string
  scheduled_date: string
  status: "draft" | "scheduled" | "published"
  hero_image_url: string
  state?: string
}

export interface TodayInIndiaCalendarResponse {
  year: number
  month: number
  total_entries: number
  dates: Record<string, TodayInIndiaCalendarEntry[]>
}

export function getTodayInIndiaCategories() {
  return request<TodayInIndiaCategoryOption[]>("api/admin-side/content-management/cultural/today-in-india/categories/", {
    method: "GET",
    authenticated: true,
  })
}

export function getTodayInIndiaCalendar(year: number, month: number) {
  return request<TodayInIndiaCalendarResponse>(
    `api/admin-side/content-management/cultural/today-in-india/calendar/?year=${year}&month=${month}`,
    {
      method: "GET",
      authenticated: true,
    }
  )
}

export function getTodayInIndiaList(params?: { search?: string; status?: string; category?: string }) {
  const query = new URLSearchParams()
  if (params?.search) query.set("search", params.search)
  if (params?.status) query.set("status", params.status)
  if (params?.category) query.set("category", params.category)
  const qs = query.toString() ? `?${query.toString()}` : ""
  return request<TodayInIndiaItem[]>(`api/admin-side/content-management/cultural/today-in-india/${qs}`, {
    method: "GET",
    authenticated: true,
  })
}

export function getTodayInIndiaDetail(id: number) {
  return request<TodayInIndiaItem>(`api/admin-side/content-management/cultural/today-in-india/${id}/`, {
    method: "GET",
    authenticated: true,
  })
}

export function createTodayInIndia(payload: CreateTodayInIndiaPayload) {
  return request<TodayInIndiaItem>("api/admin-side/content-management/cultural/today-in-india/", {
    method: "POST",
    body: payload,
    authenticated: true,
  })
}

export function updateTodayInIndia(id: number, payload: Partial<CreateTodayInIndiaPayload>) {
  return request<TodayInIndiaItem>(`api/admin-side/content-management/cultural/today-in-india/${id}/`, {
    method: "PATCH",
    body: payload,
    authenticated: true,
  })
}

export function putTodayInIndia(id: number, payload: CreateTodayInIndiaPayload) {
  return request<TodayInIndiaItem>(`api/admin-side/content-management/cultural/today-in-india/${id}/`, {
    method: "PUT",
    body: payload,
    authenticated: true,
  })
}

export function deleteTodayInIndia(id: number) {
  return request<void>(`api/admin-side/content-management/cultural/today-in-india/${id}/`, {
    method: "DELETE",
    authenticated: true,
  })
}

// ==========================================
// Official "Just Learning" (JL) Feed Post APIs
// ==========================================

export interface FeedEventItem {
  id: number
  title: string
  slug?: string
  venue?: string
  organizer_name?: string
  start_date?: string
  end_date?: string
  verification_status?: string
  is_active?: boolean
  media_url?: string | null
}

export interface FeedEventsResponse {
  count?: number
  total_matched?: number
  results: FeedEventItem[]
}

export interface SearchFeedEventsParams {
  search?: string
  status?: string
  limit?: number
}

export const fetchFeedEvents = async ({
  search = "",
  status = "approved",
  limit = 20,
}: SearchFeedEventsParams = {}): Promise<FeedEventsResponse> => {
  const token = sessionStorage.getItem("admin-auth-token") || localStorage.getItem("token")
  const url = new URL(endpoint("api/admin/feed/events/"))
  if (search.trim()) {
    url.searchParams.append("search", search.trim())
  }
  if (status) {
    url.searchParams.append("status", status)
  }
  if (limit) {
    url.searchParams.append("limit", limit.toString())
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  let response = await fetch(url.toString(), {
    method: "GET",
    headers,
  })

  // Fallback to /api/admin/content-management/feed/events/ if 404
  if (response.status === 404) {
    const fallbackUrl = new URL(endpoint("api/admin/content-management/feed/events/"))
    if (search.trim()) fallbackUrl.searchParams.append("search", search.trim())
    if (status) fallbackUrl.searchParams.append("status", status)
    if (limit) fallbackUrl.searchParams.append("limit", limit.toString())
    response = await fetch(fallbackUrl.toString(), {
      method: "GET",
      headers,
    })
  }

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    let detail = "Failed to load events for selection."
    if (data && typeof data === "object") {
      if ("detail" in data && typeof (data as any).detail === "string") {
        detail = (data as any).detail
      } else if ("message" in data && typeof (data as any).message === "string") {
        detail = (data as any).message
      }
    }
    throw new Error(detail)
  }

  if (Array.isArray(data)) {
    return { count: data.length, total_matched: data.length, results: data }
  }

  return (
    data || {
      count: 0,
      total_matched: 0,
      results: [],
    }
  )
}

export interface CreateJLPostPayload {
  description: string
  post_type: "community" | "event" | "roots_culture"
  interests?: number[]
  mediaFiles?: File[]
  event?: number | null
  eventId?: number | null
}

export interface JLPostAuthor {
  id: number
  name: string
  is_official?: boolean
}

export interface JLPostMedia {
  id: number
  media_type: "image" | "video"
  file: string
  display_order?: number
}

export interface JLPostItem {
  id: number
  description: string
  post_type: "community" | "event" | "roots_culture"
  is_active?: boolean
  likes_count?: number
  is_liked?: boolean
  is_saved?: boolean
  author?: JLPostAuthor
  media?: JLPostMedia[]
  event?: FeedEventItem | number | null
  created_at?: string
}

export interface CreateJLPostResponse {
  message: string
  post: JLPostItem
}

export const createOfficialJLPost = async ({
  description,
  post_type = "community",
  interests = [],
  mediaFiles = [],
  event,
  eventId,
}: CreateJLPostPayload): Promise<CreateJLPostResponse> => {
  const token = sessionStorage.getItem("admin-auth-token") || localStorage.getItem("token")
  const formData = new FormData()
  formData.append("description", description)
  formData.append("post_type", post_type)
  formData.append("post_as_jl", "true") // Flag to post as official brand account

  const linkedEventId = event ?? eventId
  if (post_type === "event" && linkedEventId) {
    formData.append("event", linkedEventId.toString())
  }

  interests.forEach((interestId) => {
    formData.append("interests", interestId.toString())
  })

  mediaFiles.forEach((file) => {
    formData.append("media", file)
  })

  const headers: Record<string, string> = {}
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  // Attempt POST to api/admin/feed/posts/create/ first, fallback to api/posts/post/create/
  let postUrl = endpoint("api/admin/feed/posts/create/")
  let response = await fetch(postUrl, {
    method: "POST",
    headers,
    // NOTE: Do NOT set Content-Type manually for FormData; browser sets boundary automatically
    body: formData,
  })

  if (response.status === 404) {
    postUrl = endpoint("api/posts/post/create/")
    response = await fetch(postUrl, {
      method: "POST",
      headers,
      body: formData,
    })
  }

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    let detail = "Failed to create official post."
    if (data && typeof data === "object") {
      if ("detail" in data && typeof (data as any).detail === "string") {
        detail = (data as any).detail
      } else if ("message" in data && typeof (data as any).message === "string") {
        detail = (data as any).message
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

  return data as CreateJLPostResponse
}

// ==========================================
// Arena Events Management APIs
// ==========================================

export interface ArenaTimelineItem {
  id?: number
  day: number
  title: string
  description?: string
  start_time: string // "HH:MM:SS"
  end_time: string   // "HH:MM:SS"
  order?: number
}

export interface ArenaEventsStats {
  total_events: number
  pending_verification: number
  approved: number
  rejected: number
  draft: number
  official_jl_events: number
  mentor_events: number
}

export interface ArenaEventListItem {
  id: number
  title: string
  slug: string
  media?: string | null
  venue: string
  start_date: string // "YYYY-MM-DD"
  end_date: string   // "YYYY-MM-DD"
  start_time: string // "HH:MM:SS"
  end_time: string   // "HH:MM:SS"
  interests?: string[] | number[]
  interested_count?: number
  view_count?: number
  is_interested?: boolean
  is_featured?: boolean
  current_step?: number
  is_completed?: boolean
  verification_status?: string // "draft" | "pending" | "approved" | "rejected"
  rejection_reason?: string | null
  is_official?: boolean
  is_active?: boolean
  organizer_name?: string
  created_by?: {
    id: number
    name: string
    email?: string
    role?: string
    phone_number?: string
    is_mentor?: boolean
    is_official?: boolean
  }
  created_by_name?: string
}

export interface ArenaEventDetail extends ArenaEventListItem {
  description: string
  age_criteria?: string | null
  brochure?: string | null
  registration_link?: string | null
  organizer_phone?: string | null
  starts_at?: string
  ends_at?: string
  reviewed_by?: number | null
  reviewed_by_name?: string | null
  reviewed_at?: string | null
  published_at?: string
  created_at?: string
  timeline?: ArenaTimelineItem[]
}

export interface CreateArenaEventPayload {
  title: string
  description: string
  venue: string
  start_date: string
  start_time: string
  end_date: string
  end_time: string
  interest_ids?: number[]
  age_criteria?: string
  organizer_name?: string
  organizer_phone?: string
  registration_link?: string
  is_featured?: boolean
  post_as_jl?: boolean
  timeline?: ArenaTimelineItem[]
  media?: File | string | null
}

export interface ArenaEventListParams {
  is_jl?: boolean
  status?: "all" | "draft" | "pending" | "approved" | "rejected"
  is_active?: boolean
  is_featured?: boolean
  search?: string
  interest?: number
  role?: "mentor" | string
}

export async function getArenaEventsStats(): Promise<ArenaEventsStats> {
  return request<ArenaEventsStats>("api/admin/content-management/arena/events/stats/", {
    method: "GET",
    authenticated: true,
  })
}

export async function getArenaEvents(params?: ArenaEventListParams): Promise<ArenaEventListItem[]> {
  const query = new URLSearchParams()
  if (params?.is_jl !== undefined) query.set("is_jl", String(params.is_jl))
  if (params?.status && params.status !== "all") query.set("status", params.status)
  if (params?.is_active !== undefined) query.set("is_active", String(params.is_active))
  if (params?.is_featured !== undefined) query.set("is_featured", String(params.is_featured))
  if (params?.search) query.set("search", params.search)
  if (params?.interest !== undefined) query.set("interest", String(params.interest))
  if (params?.role) query.set("role", params.role)

  const queryString = query.toString()
  const path = `api/admin/content-management/arena/events/${queryString ? `?${queryString}` : ""}`

  return request<ArenaEventListItem[]>(path, {
    method: "GET",
    authenticated: true,
  })
}

export async function getArenaEventDetail(id: number): Promise<ArenaEventDetail> {
  return request<ArenaEventDetail>(`api/admin/content-management/arena/events/${id}/`, {
    method: "GET",
    authenticated: true,
  })
}

export async function createArenaEvent(payload: CreateArenaEventPayload): Promise<ArenaEventDetail> {
  const token = sessionStorage.getItem("admin-auth-token") || localStorage.getItem("token")

  if (payload.media instanceof File) {
    const formData = new FormData()
    formData.append("title", payload.title)
    formData.append("description", payload.description)
    formData.append("venue", payload.venue)
    formData.append("start_date", payload.start_date)
    formData.append("start_time", payload.start_time)
    formData.append("end_date", payload.end_date)
    formData.append("end_time", payload.end_time)
    if (payload.is_featured !== undefined) formData.append("is_featured", String(payload.is_featured))
    if (payload.post_as_jl !== undefined) formData.append("post_as_jl", String(payload.post_as_jl))
    if (payload.age_criteria) formData.append("age_criteria", payload.age_criteria)
    if (payload.organizer_name) formData.append("organizer_name", payload.organizer_name)
    if (payload.organizer_phone) formData.append("organizer_phone", payload.organizer_phone)
    if (payload.registration_link) formData.append("registration_link", payload.registration_link)
    formData.append("media", payload.media)

    if (payload.interest_ids && payload.interest_ids.length > 0) {
      payload.interest_ids.forEach((id) => formData.append("interest_ids", String(id)))
    }
    if (payload.timeline && payload.timeline.length > 0) {
      formData.append("timeline", JSON.stringify(payload.timeline))
    }

    const headers: Record<string, string> = {}
    if (token) headers.Authorization = `Bearer ${token}`

    const res = await fetch(endpoint("api/admin/content-management/arena/events/"), {
      method: "POST",
      headers,
      body: formData,
    })
    const data = await res.json().catch(() => null)
    if (!res.ok) {
      throw new Error(data?.detail || data?.message || "Failed to create arena event.")
    }
    return data
  }

  return request<ArenaEventDetail>("api/admin/content-management/arena/events/", {
    method: "POST",
    body: payload,
    authenticated: true,
  })
}

export async function updateArenaEvent(
  id: number,
  payload: Partial<CreateArenaEventPayload>
): Promise<ArenaEventDetail> {
  const token = sessionStorage.getItem("admin-auth-token") || localStorage.getItem("token")

  if (payload.media instanceof File) {
    const formData = new FormData()
    if (payload.title) formData.append("title", payload.title)
    if (payload.description) formData.append("description", payload.description)
    if (payload.venue) formData.append("venue", payload.venue)
    if (payload.start_date) formData.append("start_date", payload.start_date)
    if (payload.start_time) formData.append("start_time", payload.start_time)
    if (payload.end_date) formData.append("end_date", payload.end_date)
    if (payload.end_time) formData.append("end_time", payload.end_time)
    if (payload.is_featured !== undefined) formData.append("is_featured", String(payload.is_featured))
    if (payload.post_as_jl !== undefined) formData.append("post_as_jl", String(payload.post_as_jl))
    if (payload.age_criteria) formData.append("age_criteria", payload.age_criteria)
    if (payload.organizer_name) formData.append("organizer_name", payload.organizer_name)
    if (payload.organizer_phone) formData.append("organizer_phone", payload.organizer_phone)
    if (payload.registration_link) formData.append("registration_link", payload.registration_link)
    formData.append("media", payload.media)

    if (payload.interest_ids && payload.interest_ids.length > 0) {
      payload.interest_ids.forEach((iId) => formData.append("interest_ids", String(iId)))
    }
    if (payload.timeline && payload.timeline.length > 0) {
      formData.append("timeline", JSON.stringify(payload.timeline))
    }

    const headers: Record<string, string> = {}
    if (token) headers.Authorization = `Bearer ${token}`

    const res = await fetch(endpoint(`api/admin/content-management/arena/events/${id}/`), {
      method: "PATCH",
      headers,
      body: formData,
    })
    const data = await res.json().catch(() => null)
    if (!res.ok) {
      throw new Error(data?.detail || data?.message || "Failed to update arena event.")
    }
    return data
  }

  return request<ArenaEventDetail>(`api/admin/content-management/arena/events/${id}/`, {
    method: "PATCH",
    body: payload,
    authenticated: true,
  })
}

export async function deleteArenaEvent(id: number): Promise<void> {
  return request<void>(`api/admin/content-management/arena/events/${id}/`, {
    method: "DELETE",
    authenticated: true,
  })
}

export interface ApproveArenaEventResponse {
  message: string
  event: Partial<ArenaEventDetail>
}

export async function approveArenaEvent(eventId: number): Promise<ApproveArenaEventResponse> {
  return request<ApproveArenaEventResponse>(`api/admin/content-management/arena/events/${eventId}/approve/`, {
    method: "POST",
    body: {},
    authenticated: true,
  })
}

export interface RejectArenaEventResponse {
  message: string
  event: Partial<ArenaEventDetail>
}

export async function rejectArenaEvent(
  eventId: number,
  rejectionReason: string
): Promise<RejectArenaEventResponse> {
  return request<RejectArenaEventResponse>(`api/admin/content-management/arena/events/${eventId}/reject/`, {
    method: "POST",
    body: {
      rejection_reason: rejectionReason,
    },
    authenticated: true,
  })
}

// ==========================================
// SUPER HERO STORIES MANAGEMENT API
// ==========================================

export interface SuperheroAuthor {
  id: number
  name: string
  email: string
  role: string
  profile_picture?: string | null
}

export interface SuperheroImpactTimeline {
  first_initiative?: string
  biggest_challenge?: string
  major_achievement?: string
  current_mission?: string
}

export interface SuperheroMediaItem {
  id: number
  media_type: "image" | "video" | string
  file_url: string
  display_order?: number
}

export interface SuperheroListItem {
  id: number
  author?: SuperheroAuthor | null
  name_of_hero: string
  hero_role?: string
  super_hero_role?: string
  location?: string
  verification_status: "pending" | "approved" | "rejected"
  show_on_home: boolean
  is_active: boolean
  media_count?: number
  first_media_url?: string | null
  created_at: string
  reviewed_at?: string | null
}

export interface SuperheroListResponse {
  count: number
  next: string | null
  previous: string | null
  results: SuperheroListItem[]
}

export interface SuperheroStats {
  total_suggestions: number
  pending: number
  approved: number
  rejected: number
  showing_on_home: number
}

export interface SuperheroDetailItem {
  id: number
  author?: SuperheroAuthor | null
  name_of_hero: string
  hero_role?: string
  super_hero_role?: string
  quote?: string
  description?: string
  location?: string
  super_hero_phone?: string
  impact_timeline?: SuperheroImpactTimeline | null
  media?: SuperheroMediaItem[]
  verification_status: "pending" | "approved" | "rejected"
  show_on_home: boolean
  rejection_reason?: string | null
  reviewed_by?: string | null
  reviewed_at?: string | null
  created_at?: string
  is_active?: boolean
}

export interface CreateSuperheroPayload {
  name_of_hero: string
  hero_role?: string
  quote?: string
  description?: string
  location?: string
  super_hero_phone?: string
  show_on_home?: boolean
  first_initiative?: string
  biggest_challenge?: string
  major_achievement?: string
  current_mission?: string
  media?: File | null
}

export interface UpdateSuperheroPayload {
  name_of_hero?: string
  hero_role?: string
  quote?: string
  description?: string
  location?: string
  super_hero_phone?: string
  show_on_home?: boolean
  first_initiative?: string
  biggest_challenge?: string
  major_achievement?: string
  current_mission?: string
  media?: File | null
}

export interface SuperheroQueryParams {
  status?: "pending" | "approved" | "rejected" | "all"
  search?: string
  show_on_home?: boolean
  page?: number
}

async function superheroRequest<T>(
  subpath: string,
  options: RequestOptions = {}
): Promise<T> {
  const cleanSubpath = subpath ? (subpath.startsWith("?") ? subpath : subpath.replace(/^\//, "")) : ""
  const primaryPath = `api/admin/super-hero-suggestion/${cleanSubpath}`
  const fallbackPath = `api/admin/content-management/super-hero-suggestion/${cleanSubpath}`

  try {
    return await request<T>(primaryPath, options)
  } catch (err: any) {
    const msg = String(err?.message || "").toLowerCase()
    if (msg.includes("404") || msg.includes("not found") || msg.includes("didn't match")) {
      return await request<T>(fallbackPath, options)
    }
    throw err
  }
}

export async function fetchSuperheroStats(): Promise<SuperheroStats> {
  return superheroRequest<SuperheroStats>("stats/", {
    method: "GET",
    authenticated: true,
  })
}

export async function fetchSuperheroSuggestions(
  params: SuperheroQueryParams = {}
): Promise<SuperheroListResponse> {
  const query = new URLSearchParams()
  if (params.status && params.status !== "all") {
    query.set("status", params.status)
  }
  if (params.search && params.search.trim()) {
    query.set("search", params.search.trim())
  }
  if (params.show_on_home !== undefined) {
    query.set("show_on_home", String(params.show_on_home))
  }
  if (params.page && params.page > 1) {
    query.set("page", String(params.page))
  }

  const qs = query.toString()
  return superheroRequest<SuperheroListResponse>(qs ? `?${qs}` : "", {
    method: "GET",
    authenticated: true,
  })
}

export async function fetchSuperheroDetail(id: number): Promise<SuperheroDetailItem> {
  return superheroRequest<SuperheroDetailItem>(`${id}/`, {
    method: "GET",
    authenticated: true,
  })
}

export async function approveSuperhero(
  id: number,
  show_on_home: boolean = false
): Promise<{ message: string; post: SuperheroDetailItem }> {
  return superheroRequest<{ message: string; post: SuperheroDetailItem }>(`${id}/approve/`, {
    method: "POST",
    body: { show_on_home },
    authenticated: true,
  })
}

export async function rejectSuperhero(
  id: number,
  rejection_reason: string
): Promise<{ message: string; post: SuperheroDetailItem }> {
  return superheroRequest<{ message: string; post: SuperheroDetailItem }>(`${id}/reject/`, {
    method: "POST",
    body: { rejection_reason },
    authenticated: true,
  })
}

export async function toggleSuperheroShowOnHome(
  id: number
): Promise<{ message: string; show_on_home: boolean }> {
  return superheroRequest<{ message: string; show_on_home: boolean }>(`${id}/toggle-home/`, {
    method: "POST",
    body: {},
    authenticated: true,
  })
}

export async function createSuperhero(
  payload: CreateSuperheroPayload
): Promise<{ message: string; post: SuperheroDetailItem }> {
  const token = sessionStorage.getItem("admin-auth-token") || localStorage.getItem("token")
  const formData = new FormData()

  formData.append("name_of_hero", payload.name_of_hero)
  if (payload.hero_role) formData.append("hero_role", payload.hero_role)
  if (payload.quote) formData.append("quote", payload.quote)
  if (payload.description) formData.append("description", payload.description)
  if (payload.location) formData.append("location", payload.location)
  if (payload.super_hero_phone) formData.append("super_hero_phone", payload.super_hero_phone)
  formData.append("show_on_home", payload.show_on_home ? "true" : "false")
  if (payload.first_initiative) formData.append("first_initiative", payload.first_initiative)
  if (payload.biggest_challenge) formData.append("biggest_challenge", payload.biggest_challenge)
  if (payload.major_achievement) formData.append("major_achievement", payload.major_achievement)
  if (payload.current_mission) formData.append("current_mission", payload.current_mission)
  if (payload.media instanceof File) {
    formData.append("media", payload.media)
  }

  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`

  let res = await fetch(endpoint("api/admin/super-hero-suggestion/"), {
    method: "POST",
    headers,
    body: formData,
  })

  if (res.status === 404) {
    res = await fetch(endpoint("api/admin/content-management/super-hero-suggestion/"), {
      method: "POST",
      headers,
      body: formData,
    })
  }

  const data = await res.json().catch(() => null)
  if (!res.ok) {
    let detail = "Failed to create super hero."
    if (data && typeof data === "object") {
      if ("detail" in data && typeof data.detail === "string") detail = data.detail
      else if ("message" in data && typeof data.message === "string") detail = data.message
      else {
        const errorList: string[] = []
        for (const [k, v] of Object.entries(data)) {
          if (Array.isArray(v)) errorList.push(`${k}: ${v.join(", ")}`)
          else if (typeof v === "string") errorList.push(`${k}: ${v}`)
        }
        if (errorList.length > 0) detail = errorList.join(" | ")
      }
    }
    throw new Error(detail)
  }

  return data
}

export async function updateSuperhero(
  id: number,
  payload: UpdateSuperheroPayload
): Promise<SuperheroDetailItem> {
  const token = sessionStorage.getItem("admin-auth-token") || localStorage.getItem("token")

  if (payload.media instanceof File) {
    const formData = new FormData()
    if (payload.name_of_hero) formData.append("name_of_hero", payload.name_of_hero)
    if (payload.hero_role) formData.append("hero_role", payload.hero_role)
    if (payload.quote) formData.append("quote", payload.quote)
    if (payload.description) formData.append("description", payload.description)
    if (payload.location) formData.append("location", payload.location)
    if (payload.super_hero_phone) formData.append("super_hero_phone", payload.super_hero_phone)
    if (payload.show_on_home !== undefined) formData.append("show_on_home", payload.show_on_home ? "true" : "false")
    if (payload.first_initiative) formData.append("first_initiative", payload.first_initiative)
    if (payload.biggest_challenge) formData.append("biggest_challenge", payload.biggest_challenge)
    if (payload.major_achievement) formData.append("major_achievement", payload.major_achievement)
    if (payload.current_mission) formData.append("current_mission", payload.current_mission)
    formData.append("media", payload.media)

    const headers: Record<string, string> = {}
    if (token) headers.Authorization = `Bearer ${token}`

    let res = await fetch(endpoint(`api/admin/super-hero-suggestion/${id}/`), {
      method: "PATCH",
      headers,
      body: formData,
    })

    if (res.status === 404) {
      res = await fetch(endpoint(`api/admin/content-management/super-hero-suggestion/${id}/`), {
        method: "PATCH",
        headers,
        body: formData,
      })
    }

    const data = await res.json().catch(() => null)
    if (!res.ok) {
      throw new Error(data?.detail || data?.message || "Failed to update super hero.")
    }
    return data
  }

  const { media, ...jsonBody } = payload
  return superheroRequest<SuperheroDetailItem>(`${id}/`, {
    method: "PATCH",
    body: jsonBody,
    authenticated: true,
  })
}

export async function deleteSuperhero(
  id: number,
  permanent: boolean = false
): Promise<{ message: string }> {
  return superheroRequest<{ message: string }>(`${id}/?permanent=${permanent}`, {
    method: "DELETE",
    authenticated: true,
  })
}

