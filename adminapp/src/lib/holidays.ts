export interface NagerHoliday {
  date: string // "YYYY-MM-DD"
  localName: string
  name: string
  countryCode: string // "IN"
  fixed: boolean
  global: boolean // true = National Gazetted, false = State-specific / Regional
  counties: string[] | null // Array of state codes e.g. ["IN-MH", "IN-DL"] or null if global
  launchYear: number | null
  types: ("Public" | "Gazetted" | "State" | "Observance" | "Festival")[]
  editorialTip?: string
  suggestedCategory?: string
  defaultArticleTitle?: string
}

export interface IndianState {
  code: string
  name: string
}

export const INDIAN_STATES: IndianState[] = [
  { code: "ALL", name: "All India (National & Major)" },
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

// Comprehensive database of National Gazetted, State, and Educational Observance days in India
export const INDIAN_HOLIDAYS_DB: NagerHoliday[] = [
  // --- 2026 Holidays ---
  {
    date: "2026-01-01",
    name: "New Year's Day",
    localName: "नव वर्ष",
    countryCode: "IN",
    fixed: true,
    global: true,
    counties: null,
    launchYear: null,
    types: ["Observance"],
    editorialTip: "Publish educational resolutions, STEM goal-setting guides, and upcoming year learning roadmaps.",
    suggestedCategory: "Announcement",
    defaultArticleTitle: "2026 STEM Learning Resolutions & Annual Milestones Guide",
  },
  {
    date: "2026-01-14",
    name: "Makar Sankranti / Uttarayan",
    localName: "मकर संक्रांति / उत्तरायण",
    countryCode: "IN",
    fixed: true,
    global: false,
    counties: ["IN-GJ", "IN-MH", "IN-KA", "IN-AP", "IN-TG", "IN-RJ", "IN-UP", "IN-BR"],
    launchYear: null,
    types: ["Festival", "State"],
    editorialTip: "Explore the physics of kite aerodynamics, sun's celestial transition (Uttarayana), and winter agricultural cycles.",
    suggestedCategory: "Physics",
    defaultArticleTitle: "Aerodynamics of Kites & Solar Physics: The Science Behind Makar Sankranti",
  },
  {
    date: "2026-01-15",
    name: "Pongal / Magh Bihu",
    localName: "பொங்கல் / মাঘ বিহু",
    countryCode: "IN",
    fixed: true,
    global: false,
    counties: ["IN-TN", "IN-AS", "IN-AP", "IN-KL"],
    launchYear: null,
    types: ["Festival", "State"],
    editorialTip: "Focus on soil science, seasonal crop cycles, rural engineering, and harvest traditions.",
    suggestedCategory: "Science & Tech",
    defaultArticleTitle: "Harvest STEM: Agriscience, Seasonal Cycles, and Tamil Heritage",
  },
  {
    date: "2026-01-26",
    name: "Republic Day",
    localName: "गणतंत्र दिवस",
    countryCode: "IN",
    fixed: true,
    global: true,
    counties: null,
    launchYear: 1950,
    types: ["Public", "Gazetted"],
    editorialTip: "Premier national holiday! High engagement for Constitution quizzes, civic science, defense tech innovations, and student democratic ideals.",
    suggestedCategory: "Announcement",
    defaultArticleTitle: "Republic Day Special: India's Scientific Achievements & Civic Milestones",
  },
  {
    date: "2026-02-15",
    name: "Maha Shivratri",
    localName: "महाशिवरात्रि",
    countryCode: "IN",
    fixed: false,
    global: true,
    counties: null,
    launchYear: null,
    types: ["Public", "Gazetted"],
    editorialTip: "Highlight ancient Indian temple architecture, acoustic engineering in stone sanctums, and heritage preservation.",
    suggestedCategory: "Science & Tech",
    defaultArticleTitle: "Acoustics & Architecture: Ancient Engineering of Indian Temples",
  },
  {
    date: "2026-02-19",
    name: "Chhatrapati Shivaji Maharaj Jayanti",
    localName: "शिवछत्रपती शिवाजी महाराज जयंती",
    countryCode: "IN",
    fixed: true,
    global: false,
    counties: ["IN-MH"],
    launchYear: null,
    types: ["State"],
    editorialTip: "Explore hill fort topography, rainwater harvesting systems in Sahyadri forts, and historical military tactics.",
    suggestedCategory: "Technology",
    defaultArticleTitle: "Fort Engineering & Water Harvesting of the Maratha Empire",
  },
  {
    date: "2026-02-28",
    name: "National Science Day",
    localName: "राष्ट्रीय विज्ञान दिवस",
    countryCode: "IN",
    fixed: true,
    global: true,
    counties: null,
    launchYear: 1987,
    types: ["Observance"],
    editorialTip: "Highest priority for content writers! Commemorating Sir C.V. Raman's discovery of the Raman Effect. Publish physics challenges, Nobel stories, and lab experiments.",
    suggestedCategory: "Science & Tech",
    defaultArticleTitle: "National Science Day: The Raman Effect & Future of Quantum Optics in India",
  },
  {
    date: "2026-03-04",
    name: "Holi (Festival of Colors)",
    localName: "होली",
    countryCode: "IN",
    fixed: false,
    global: true,
    counties: null,
    launchYear: null,
    types: ["Public", "Gazetted", "Festival"],
    editorialTip: "Great theme for organic chemistry (natural plant pigments vs synthetic dyes), water conservation awareness, and color perception optics.",
    suggestedCategory: "Science & Tech",
    defaultArticleTitle: "The Chemistry of Colors: Making Eco-Friendly Pigments with Everyday Science",
  },
  {
    date: "2026-03-19",
    name: "Gudi Padwa / Ugadi / Chaitra Sukladi",
    localName: "गुढीपाडवा / ಯುಗಾದಿ / ఉగాది",
    countryCode: "IN",
    fixed: false,
    global: false,
    counties: ["IN-MH", "IN-KA", "IN-TG", "IN-AP", "IN-GA"],
    launchYear: null,
    types: ["Festival", "State"],
    editorialTip: "Explain lunisolar calendar calculations, astronomical equinox alignments, and regional springtime flora.",
    suggestedCategory: "Mathematics",
    defaultArticleTitle: "Lunisolar Calendars: The Mathematics and Astronomy of Indian New Year",
  },
  {
    date: "2026-03-21",
    name: "Id-ul-Fitr (Ramzan Eid)",
    localName: "ईद-उल-फ़ित्र",
    countryCode: "IN",
    fixed: false,
    global: true,
    counties: null,
    launchYear: null,
    types: ["Public", "Gazetted"],
    editorialTip: "Discuss lunar sighting astronomy, community meal science, and cultural geography.",
    suggestedCategory: "Announcement",
    defaultArticleTitle: "Crescent Moon Astronomy & the Global Lunar Calendar Explained",
  },
  {
    date: "2026-04-03",
    name: "Good Friday",
    localName: "गुड फ्राइडे",
    countryCode: "IN",
    fixed: false,
    global: true,
    counties: null,
    launchYear: null,
    types: ["Public", "Gazetted"],
    editorialTip: "Focus on empathy in education, global historical traditions, and reflective weekend study modules.",
    suggestedCategory: "Announcement",
    defaultArticleTitle: "Reflective Learning: Building Empathy and Resilience in Young Learners",
  },
  {
    date: "2026-04-14",
    name: "Dr. B.R. Ambedkar Jayanti / Tamil New Year (Puthandu)",
    localName: "डॉ. बी.आर. अम्बेडकर जयंती / தமிழ்ப் புத்தாண்டு",
    countryCode: "IN",
    fixed: true,
    global: true,
    counties: null,
    launchYear: null,
    types: ["Public", "Gazetted"],
    editorialTip: "Highlight Dr. Ambedkar's focus on universal education and scientific temper, along with Tamil Nadu's Puthandu traditions.",
    suggestedCategory: "Announcement",
    defaultArticleTitle: "Education as Empowerment: The Vision of Dr. B.R. Ambedkar for Modern Learners",
  },
  {
    date: "2026-04-15",
    name: "Poila Boishakh (Bengali New Year) / Vishu",
    localName: "পয়লা বৈশাখ / വിഷു",
    countryCode: "IN",
    fixed: true,
    global: false,
    counties: ["IN-WB", "IN-AS", "IN-KL"],
    launchYear: null,
    types: ["Festival", "State"],
    editorialTip: "Celebrate regional New Years: Bengal's historic trading and mathematical traditions, and Kerala's agricultural flora (Kanikkonna).",
    suggestedCategory: "Science & Tech",
    defaultArticleTitle: "Botanical Wonders & Harvest Traditions of Poila Boishakh and Vishu",
  },
  {
    date: "2026-05-01",
    name: "Maharashtra Day / Gujarat Day / Labour Day",
    localName: "महाराष्ट्र दिन / ગુજરાત સ્થાપના દિવસ",
    countryCode: "IN",
    fixed: true,
    global: false,
    counties: ["IN-MH", "IN-GJ", "IN-KL", "IN-TN", "IN-WB"],
    launchYear: 1960,
    types: ["State"],
    editorialTip: "State linguistic formation history, industrial tech growth, and coastal biodiversity of Western India.",
    suggestedCategory: "Technology",
    defaultArticleTitle: "Industrial Technology & Maritime Heritage: 66 Years of Western India's Growth",
  },
  {
    date: "2026-05-31",
    name: "Buddha Purnima",
    localName: "बुद्ध पूर्णिमा",
    countryCode: "IN",
    fixed: false,
    global: true,
    counties: null,
    launchYear: null,
    types: ["Public", "Gazetted"],
    editorialTip: "Explore neuroscience of meditation, mindfulness in student focus, and Nalanda university history.",
    suggestedCategory: "Science & Tech",
    defaultArticleTitle: "Neuroscience of Focus: Ancient Mindfulness Techniques Tested by Modern Science",
  },
  {
    date: "2026-05-27",
    name: "Bakrid / Eid-ul-Adha",
    localName: "बकरीद / ईदुल अज़हा",
    countryCode: "IN",
    fixed: false,
    global: true,
    counties: null,
    launchYear: null,
    types: ["Public", "Gazetted"],
    editorialTip: "Explore themes of selflessness, community philanthropy, and global geographical celebrations.",
    suggestedCategory: "Announcement",
    defaultArticleTitle: "Global Traditions & Civic Giving: Community Impact for Learners",
  },
  {
    date: "2026-06-02",
    name: "Telangana Formation Day",
    localName: "తెలంగాణ ఆవిర్భావ దినోత్సవం",
    countryCode: "IN",
    fixed: true,
    global: false,
    counties: ["IN-TG"],
    launchYear: 2014,
    types: ["State"],
    editorialTip: "Highlight Hyderabad's IT corridor innovations, biotech hub (Genome Valley), and space tech startups.",
    suggestedCategory: "Technology",
    defaultArticleTitle: "Telangana Tech Surge: How Hyderabad Became India's Innovation Engine",
  },
  {
    date: "2026-06-21",
    name: "International Yoga Day & World Music Day",
    localName: "अंतर्राष्ट्रीय योग दिवस",
    countryCode: "IN",
    fixed: true,
    global: true,
    counties: null,
    launchYear: 2015,
    types: ["Observance"],
    editorialTip: "Biomechanics, posture science for young students, acoustics and frequency physics of musical instruments.",
    suggestedCategory: "Science & Tech",
    defaultArticleTitle: "The Biomechanics of Yoga: How Movement & Acoustics Boost Cognitive Function",
  },
  {
    date: "2026-07-28",
    name: "Muharram (Ashura)",
    localName: "मोहर्रम",
    countryCode: "IN",
    fixed: false,
    global: true,
    counties: null,
    launchYear: null,
    types: ["Public", "Gazetted"],
    editorialTip: "Cultural heritage and historical Islamic contributions to algebra, optics, and medicine.",
    suggestedCategory: "Mathematics",
    defaultArticleTitle: "The Golden Age of Algebra: How Ancient Mathematical Thought Shapes Modern Coding",
  },
  {
    date: "2026-08-15",
    name: "Independence Day",
    localName: "स्वतंत्रता दिवस",
    countryCode: "IN",
    fixed: true,
    global: true,
    counties: null,
    launchYear: 1947,
    types: ["Public", "Gazetted"],
    editorialTip: "Major flagship day! Spotlight India's space missions (ISRO Chandrayaan, Gaganyaan), national supercomputing (PARAM), and STEM talent.",
    suggestedCategory: "Technology",
    defaultArticleTitle: "Independence Day Special: 79 Years of Indian Scientific and Space Milestones",
  },
  {
    date: "2026-08-28",
    name: "Raksha Bandhan",
    localName: "रक्षाबंधन",
    countryCode: "IN",
    fixed: false,
    global: true,
    counties: null,
    launchYear: null,
    types: ["Festival"],
    editorialTip: "Family bonding, student peer mentoring, and sustainable handmade paper/thread crafting.",
    suggestedCategory: "Announcement",
    defaultArticleTitle: "Peer Mentoring in STEM: Why Collaborative Learning Accelerates Mastery",
  },
  {
    date: "2026-09-04",
    name: "Janmashtami",
    localName: "श्रीकृष्ण जन्माष्टमी",
    countryCode: "IN",
    fixed: false,
    global: true,
    counties: null,
    launchYear: null,
    types: ["Festival", "Public"],
    editorialTip: "Human pyramid physics in Dahi Handi (center of mass, distribution of forces, structural equilibrium).",
    suggestedCategory: "Physics",
    defaultArticleTitle: "The Physics of Dahi Handi: Center of Mass, Balance, and Structural Equilibrium",
  },
  {
    date: "2026-09-05",
    name: "National Teachers' Day (Dr. Radhakrishnan Jayanti)",
    localName: "शिक्षक दिवस",
    countryCode: "IN",
    fixed: true,
    global: true,
    counties: null,
    launchYear: 1962,
    types: ["Observance"],
    editorialTip: "Spotlight visionary educators, modern AI tools for classrooms, and honoring school mentors.",
    suggestedCategory: "Announcement",
    defaultArticleTitle: "Honoring Our Educators: The Changing Landscape of AI & Interactive Classrooms",
  },
  {
    date: "2026-09-14",
    name: "Ganesh Chaturthi",
    localName: "गणेश चतुर्थी",
    countryCode: "IN",
    fixed: false,
    global: false,
    counties: ["IN-MH", "IN-KA", "IN-TG", "IN-AP", "IN-GA", "IN-GJ"],
    launchYear: null,
    types: ["Festival", "State"],
    editorialTip: "Environmental science of eco-friendly clay vs POP idols, river conservation, and community robotics displays.",
    suggestedCategory: "Science & Tech",
    defaultArticleTitle: "Eco-Friendly Festivals: The Chemistry of Clay and Water Body Conservation",
  },
  {
    date: "2026-09-15",
    name: "Engineers' Day (Sir M. Visvesvaraya Jayanti)",
    localName: "अभियंता दिवस",
    countryCode: "IN",
    fixed: true,
    global: true,
    counties: null,
    launchYear: 1968,
    types: ["Observance"],
    editorialTip: "Key event for STEM! Tribute to Sir M. Visvesvaraya's dam and flood-gate engineering. Feature hydraulic projects and coding challenges.",
    suggestedCategory: "Technology",
    defaultArticleTitle: "Engineers' Day: Sir MV's Automated Floodgates & Next-Gen Hydraulic Civil Design",
  },
  {
    date: "2026-09-24",
    name: "Anant Chaturdashi (Ganesh Visarjan) / Id-e-Milad",
    localName: "अनंत चतुर्दशी / ईद-ए-मिलाद",
    countryCode: "IN",
    fixed: false,
    global: false,
    counties: ["IN-MH", "IN-GJ", "IN-TG"],
    launchYear: null,
    types: ["Festival", "State"],
    editorialTip: "Focus on civic noise pollution metrics, sustainable immersion tanks, and community harmony.",
    suggestedCategory: "Science & Tech",
    defaultArticleTitle: "Acoustics & Sound Wave Metrics: Measuring Urban Festive Decibel Levels",
  },
  {
    date: "2026-09-25",
    name: "Onam (Thiruvonam)",
    localName: "തിരുവോണം",
    countryCode: "IN",
    fixed: false,
    global: false,
    counties: ["IN-KL"],
    launchYear: null,
    types: ["Festival", "State"],
    editorialTip: "Snake boat race fluid mechanics (hydrodynamics), botanical geometry of Pookkalam flower patterns.",
    suggestedCategory: "Physics",
    defaultArticleTitle: "Hydrodynamics of Vallam Kali (Snake Boats) & Fractal Geometry of Pookkalam",
  },
  {
    date: "2026-10-02",
    name: "Mahatma Gandhi Jayanti (International Day of Non-Violence)",
    localName: "महात्मा गांधी जयंती",
    countryCode: "IN",
    fixed: true,
    global: true,
    counties: null,
    launchYear: 1948,
    types: ["Public", "Gazetted"],
    editorialTip: "Focus on sustainable zero-waste models, Khadi spinning wheel mechanics (Charkha), and green environmental initiatives.",
    suggestedCategory: "Science & Tech",
    defaultArticleTitle: "Zero-Waste Science & Sustainable Innovation: The Timeless Relevance of Gandhian Thought",
  },
  {
    date: "2026-10-18",
    name: "Maha Saptami (Durga Puja Begins)",
    localName: "মহা সপ্তমী",
    countryCode: "IN",
    fixed: false,
    global: false,
    counties: ["IN-WB", "IN-AS", "IN-OR", "IN-TR", "IN-BR"],
    launchYear: null,
    types: ["Festival", "State"],
    editorialTip: "Bengal's biggest festival! Focus on bamboo structural engineering of pandals and heritage light installations.",
    suggestedCategory: "Technology",
    defaultArticleTitle: "Structural Engineering of Durga Puja Pandals: Tensile Strength of Bamboo & Modern LED Arrays",
  },
  {
    date: "2026-10-20",
    name: "Dussehra (Vijayadashami) / Durga Visarjan",
    localName: "दशहरा / বিজয়া দশমী",
    countryCode: "IN",
    fixed: false,
    global: true,
    counties: null,
    launchYear: null,
    types: ["Public", "Gazetted", "Festival"],
    editorialTip: "Triumph of knowledge over ignorance. Feature interactive knowledge quests, quiz tourneys, and historical heritage.",
    suggestedCategory: "Announcement",
    defaultArticleTitle: "Vijayadashami Special: The Victory of Inquisitive Thinking Over Misconceptions in Science",
  },
  {
    date: "2026-11-01",
    name: "Kannada Rajyotsava / Kerala Piravi / Haryana Day",
    localName: "ಕನ್ನಡ ರಾಜ್ಯೋತ್ಸವ / കേരളപ്പിറവി",
    countryCode: "IN",
    fixed: true,
    global: false,
    counties: ["IN-KA", "IN-KL", "IN-HR", "IN-MP", "IN-CT"],
    launchYear: 1956,
    types: ["State"],
    editorialTip: "Celebrate state language achievements, digital Kannada computing tools, and Kerala's 100% literacy journey.",
    suggestedCategory: "Announcement",
    defaultArticleTitle: "Digital Literacy & Linguistic Computing: Celebrating Southern State Innovations",
  },
  {
    date: "2026-11-08",
    name: "Diwali (Deepavali) / Laxmi Pujan",
    localName: "दीपावली / लक्ष्मी पूजन",
    countryCode: "IN",
    fixed: false,
    global: true,
    counties: null,
    launchYear: null,
    types: ["Public", "Gazetted", "Festival"],
    editorialTip: "India's greatest festive week! Highlight chemistry of green crackers, physics of oil lamps and convection currents, and mathematical rangoli symmetries.",
    suggestedCategory: "Physics",
    defaultArticleTitle: "The Science of Light: Optics of Diyas, Heat Convection, and Green Firework Chemistry",
  },
  {
    date: "2026-11-10",
    name: "Bhai Dooj / Govardhan Puja",
    localName: "भाई दूज / गोवर्धन पूजा",
    countryCode: "IN",
    fixed: false,
    global: false,
    counties: ["IN-UP", "IN-MH", "IN-GJ", "IN-DL", "IN-BR", "IN-RJ"],
    launchYear: null,
    types: ["Festival", "State"],
    editorialTip: "Soil conservation, indigenous organic farming, and ecological stewardship.",
    suggestedCategory: "Science & Tech",
    defaultArticleTitle: "Ecological Stewardship: How Traditional Farming Honors Soil Biodiversity",
  },
  {
    date: "2026-11-14",
    name: "Children's Day (Bal Diwas)",
    localName: "बाल दिवस",
    countryCode: "IN",
    fixed: true,
    global: true,
    counties: null,
    launchYear: 1964,
    types: ["Observance"],
    editorialTip: "Prime event for our student platform! Launch gamified math challenge, interactive coding puzzles, and spotlight young innovators.",
    suggestedCategory: "Announcement",
    defaultArticleTitle: "Children's Day STEM Gala: Fun Science Puzzles, Math Riddles, and Young Innovator Spotlights",
  },
  {
    date: "2026-11-15",
    name: "Chhath Puja (Evening Arghya)",
    localName: "छठ पूजा",
    countryCode: "IN",
    fixed: false,
    global: false,
    counties: ["IN-BR", "IN-UP", "IN-JH", "IN-DL"],
    launchYear: null,
    types: ["Festival", "State"],
    editorialTip: "Solar spectrum physics, vitamin D synthesis, atmospheric refraction at sunset/sunrise, and river bank ecology.",
    suggestedCategory: "Physics",
    defaultArticleTitle: "The Physics of Sunlight & Atmospheric Refraction: Science Embedded in Chhath Puja",
  },
  {
    date: "2026-11-24",
    name: "Guru Nanak Jayanti (Gurpurab)",
    localName: "गुरु नानक जयंती",
    countryCode: "IN",
    fixed: false,
    global: true,
    counties: null,
    launchYear: null,
    types: ["Public", "Gazetted"],
    editorialTip: "Community kitchens (Langar) supply chain logistics, mass nutrition science, and universal equality principles.",
    suggestedCategory: "Science & Tech",
    defaultArticleTitle: "Logistics & Nutrition Science: The Engineering Behind World-Class Community Kitchens",
  },
  {
    date: "2026-12-22",
    name: "National Mathematics Day (Srinivasa Ramanujan Jayanti)",
    localName: "राष्ट्रीय गणित दिवस",
    countryCode: "IN",
    fixed: true,
    global: true,
    counties: null,
    launchYear: 2012,
    types: ["Observance"],
    editorialTip: "Huge engagement for math! Feature Ramanujan's taxicab number 1729, continued fractions, modular forms, and visual geometry quests.",
    suggestedCategory: "Mathematics",
    defaultArticleTitle: "The Magic of 1729: Ramanujan's Mathematical Intuition & Modern Computer Algorithms",
  },
  {
    date: "2026-12-25",
    name: "Christmas",
    localName: "क्रिसमस",
    countryCode: "IN",
    fixed: true,
    global: true,
    counties: null,
    launchYear: null,
    types: ["Public", "Gazetted"],
    editorialTip: "Winter solstice science, snowflake crystalline geometry, year-end student accomplishment wrap-ups.",
    suggestedCategory: "Science & Tech",
    defaultArticleTitle: "The Geometry of Snowflakes: Crystallography & Winter Solstice Science Explained",
  },
]

// Helper to filter holidays by date and state
export function getHolidaysForDate(
  dateStr: string,
  selectedState: string = "ALL"
): NagerHoliday[] {
  return INDIAN_HOLIDAYS_DB.filter((h) => {
    if (h.date !== dateStr) return false
    if (selectedState === "ALL") return true
    if (h.global) return true
    return h.counties ? h.counties.includes(selectedState) : false
  })
}

// Helper to get all holidays for a given month and year
export function getHolidaysForMonth(
  year: number,
  month: number, // 0-indexed
  selectedState: string = "ALL"
): NagerHoliday[] {
  const mm = String(month + 1).padStart(2, "0")
  const prefix = `${year}-${mm}`

  return INDIAN_HOLIDAYS_DB.filter((h) => {
    if (!h.date.startsWith(prefix)) return false
    if (selectedState === "ALL") return true
    if (h.global) return true
    return h.counties ? h.counties.includes(selectedState) : false
  })
}

// Fetch from Nager.Date API with graceful fallback to our curated database
export async function fetchNagerHolidaysForYear(year: number): Promise<NagerHoliday[]> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 2500) // 2.5s fast timeout
    const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/IN`, {
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (res.ok) {
      const data: any[] = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        // Merge with our rich editorial dataset
        const nagerMap = new Map<string, NagerHoliday>()
        for (const item of data) {
          nagerMap.set(item.date, {
            date: item.date,
            name: item.name,
            localName: item.localName || item.name,
            countryCode: "IN",
            fixed: item.fixed ?? true,
            global: item.global ?? true,
            counties: item.counties || null,
            launchYear: item.launchYear || null,
            types: item.types || ["Public"],
          })
        }

        // Overlay with our curated rich tips
        for (const localH of INDIAN_HOLIDAYS_DB) {
          if (localH.date.startsWith(String(year))) {
            const existing = nagerMap.get(localH.date)
            if (existing) {
              existing.editorialTip = localH.editorialTip
              existing.suggestedCategory = localH.suggestedCategory
              existing.defaultArticleTitle = localH.defaultArticleTitle
              existing.localName = localH.localName
            } else {
              nagerMap.set(localH.date, localH)
            }
          }
        }
        return Array.from(nagerMap.values())
      }
    }
  } catch (err) {
    // Graceful fallback to offline curated DB
    console.info("Using curated Indian holidays dataset (Nager API offline or empty for IN)")
  }

  // Return curated DB filtered for that year
  return INDIAN_HOLIDAYS_DB.filter((h) => h.date.startsWith(String(year)))
}
