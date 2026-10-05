/**
 * Dynamic Indian Holidays & Observances API Service
 * Fetches live data from public Indian Calendar APIs and Nager Date API dynamically.
 * Zero hardcoded fallback arrays - 100% dynamic API-based.
 */

export interface DynamicHolidayItem {
  id: string
  date: string // "YYYY-MM-DD"
  name: string
  localName?: string
  type: "Gazetted Public" | "Religious Festival" | "Cultural Observance" | "National Day"
  category: "holiday" | "festival" | "observance"
  description: string
  stateCode: string | null // e.g. "IN-MH" or null for All India
  stateName: string | null
  isNational: boolean
  source: "indian_calendar_api" | "nager_api"
}

export interface IndianStateFilterOption {
  code: string
  name: string
}

export const INDIAN_STATES: IndianStateFilterOption[] = [
  { code: "ALL", name: "All India (National & All States)" },
  { code: "IN-MH", name: "Maharashtra" },
  { code: "IN-DL", name: "Delhi (NCT)" },
  { code: "IN-KA", name: "Karnataka" },
  { code: "IN-TN", name: "Tamil Nadu" },
  { code: "IN-WB", name: "West Bengal" },
  { code: "IN-GJ", name: "Gujarat" },
  { code: "IN-UP", name: "Uttar Pradesh" },
  { code: "IN-TG", name: "Telangana" },
  { code: "IN-AP", name: "Andhra Pradesh" },
  { code: "IN-KL", name: "Kerala" },
  { code: "IN-PB", name: "Punjab" },
  { code: "IN-RJ", name: "Rajasthan" },
  { code: "IN-BR", name: "Bihar" },
  { code: "IN-AS", name: "Assam" },
  { code: "IN-OR", name: "Odisha" },
  { code: "IN-MP", name: "Madhya Pradesh" },
  { code: "IN-HR", name: "Haryana" },
  { code: "IN-JK", name: "Jammu & Kashmir" },
  { code: "IN-GA", name: "Goa" },
]

// In-memory cache per year to minimize redundant network calls while keeping it dynamic
const holidayCache = new Map<number, DynamicHolidayItem[]>()

/**
 * Infer regional Indian state association based on festival/holiday name
 */
function inferStateForEvent(name: string, extras?: string): { code: string | null; name: string | null } {
  const text = `${name} ${extras || ""}`.toLowerCase()

  if (text.includes("pongal") || text.includes("jallikattu") || text.includes("puthandu")) {
    return { code: "IN-TN", name: "Tamil Nadu" }
  }
  if (text.includes("lohri") || text.includes("baisakhi") || text.includes("guru nanak")) {
    return { code: "IN-PB", name: "Punjab" }
  }
  if (text.includes("ganesh chaturthi") || text.includes("gudi padwa") || text.includes("shivaji")) {
    return { code: "IN-MH", name: "Maharashtra" }
  }
  if (text.includes("durga puja") || text.includes("poila boishakh") || text.includes("kali puja")) {
    return { code: "IN-WB", name: "West Bengal" }
  }
  if (text.includes("onam") || text.includes("vishu")) {
    return { code: "IN-KL", name: "Kerala" }
  }
  if (text.includes("uttarayan") || text.includes("makar sankranti")) {
    return { code: "IN-GJ", name: "Gujarat" }
  }
  if (text.includes("chhath puja")) {
    return { code: "IN-BR", name: "Bihar" }
  }
  if (text.includes("bihu")) {
    return { code: "IN-AS", name: "Assam" }
  }
  if (text.includes("rath yatra")) {
    return { code: "IN-OR", name: "Odisha" }
  }
  if (text.includes("ugadi")) {
    return { code: "IN-KA", name: "Karnataka" }
  }
  if (text.includes("bathukamma") || text.includes("bonalu")) {
    return { code: "IN-TG", name: "Telangana" }
  }

  // Major national gazetted days
  return { code: null, name: null }
}

/**
 * Map raw event type from API to normalized display category
 */
function normalizeType(rawType?: string, eventName?: string): {
  type: DynamicHolidayItem["type"]
  category: DynamicHolidayItem["category"]
  isNational: boolean
} {
  const norm = (rawType || "").toLowerCase()
  const name = (eventName || "").toLowerCase()

  if (
    name.includes("republic day") ||
    name.includes("independence day") ||
    name.includes("gandhi jayanti") ||
    norm.includes("gazetted") ||
    norm.includes("national")
  ) {
    return { type: "Gazetted Public", category: "holiday", isNational: true }
  }

  if (norm.includes("festival") || norm.includes("religional")) {
    return { type: "Religious Festival", category: "festival", isNational: false }
  }

  if (norm.includes("good to know") || norm.includes("observance") || norm.includes("day")) {
    return { type: "Cultural Observance", category: "observance", isNational: false }
  }

  return { type: "Cultural Observance", category: "observance", isNational: false }
}

/**
 * Fetch dynamic Indian holidays and festivals from live APIs
 * @param year e.g. 2026
 * @param forceRefresh whether to bypass in-memory cache
 */
export async function fetchDynamicIndianHolidays(
  year: number,
  forceRefresh = false
): Promise<DynamicHolidayItem[]> {
  if (!forceRefresh && holidayCache.has(year)) {
    return holidayCache.get(year)!
  }

  const results: DynamicHolidayItem[] = []
  const seenKeys = new Set<string>()

  // 1. Primary Dynamic API: calendar-bharat JSON endpoint
  try {
    const res = await fetch(`https://jayantur13.github.io/calendar-bharat/calendar/${year}.json`)
    if (res.ok) {
      const data = await res.json()
      const yearObj = data[String(year)] || data
      if (yearObj && typeof yearObj === "object") {
        for (const monthDays of Object.values(yearObj)) {
          if (monthDays && typeof monthDays === "object") {
            for (const [dayKey, info] of Object.entries(monthDays as Record<string, any>)) {
              // Day key format: "January 1, 2026, Thursday"
              const parts = dayKey.split(",")
              if (parts.length >= 2) {
                const dateChunk = `${parts[0].trim()}, ${parts[1].trim()}`
                const parsedDate = new Date(dateChunk)
                if (!isNaN(parsedDate.getTime())) {
                  const y = parsedDate.getFullYear()
                  const m = String(parsedDate.getMonth() + 1).padStart(2, "0")
                  const d = String(parsedDate.getDate()).padStart(2, "0")
                  const dateStr = `${y}-${m}-${d}`

                  const eventName = info.event || "Observance"
                  const dedupeKey = `${dateStr}-${eventName.toLowerCase().trim()}`

                  if (!seenKeys.has(dedupeKey)) {
                    seenKeys.add(dedupeKey)
                    const stateMeta = inferStateForEvent(eventName, info.extras)
                    const typeMeta = normalizeType(info.type, eventName)

                    results.push({
                      id: `cb-${dateStr}-${results.length}`,
                      date: dateStr,
                      name: eventName,
                      type: typeMeta.type,
                      category: typeMeta.category,
                      description: info.extras || info.type || "Indian Calendar Observance",
                      stateCode: stateMeta.code,
                      stateName: stateMeta.name,
                      isNational: typeMeta.isNational || stateMeta.code === null,
                      source: "indian_calendar_api",
                    })
                  }
                }
              }
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn(`Dynamic Indian Calendar API query failed for year ${year}:`, err)
  }

  // 2. Secondary Dynamic API: Nager.Date Public Holidays
  try {
    const nagerRes = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/IN`)
    if (nagerRes.ok) {
      const nagerData: any[] = await nagerRes.json()
      if (Array.isArray(nagerData) && nagerData.length > 0) {
        for (const item of nagerData) {
          const dedupeKey = `${item.date}-${(item.name || "").toLowerCase().trim()}`
          if (!seenKeys.has(dedupeKey)) {
            seenKeys.add(dedupeKey)
            const stateMeta = inferStateForEvent(item.name || item.localName)
            results.push({
              id: `nager-${item.date}-${results.length}`,
              date: item.date,
              name: item.name || item.localName,
              localName: item.localName,
              type: item.global ? "Gazetted Public" : "Religious Festival",
              category: item.global ? "holiday" : "festival",
              description: item.localName ? `Local name: ${item.localName}` : "Official Public Holiday",
              stateCode: item.counties && item.counties.length > 0 ? item.counties[0] : stateMeta.code,
              stateName: stateMeta.name,
              isNational: item.global ?? true,
              source: "nager_api",
            })
          }
        }
      }
    }
  } catch {
    // Graceful no-op if Nager returns empty or errors
  }

  // Sort chronologically
  results.sort((a, b) => a.date.localeCompare(b.date))

  // Cache results
  holidayCache.set(year, results)

  return results
}
