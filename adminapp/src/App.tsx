import { useEffect, useState } from "react"

import { DashboardPage } from "@/pages/dashboard-page"
import { LoginPage } from "@/pages/login-page"
import { UsersPage } from "@/pages/users-page"
import { PodcastsPage } from "@/pages/podcasts-page"
import { PodcastDetailPage } from "@/pages/podcast-detail-page"
import { MCQQuestionsPage } from "@/pages/mcq-questions-page"
import { MCQDetailPage } from "@/pages/mcq-detail-page"
import { Toaster } from "@/components/ui/toast"

function App() {
  const [path, setPath] = useState(window.location.pathname)

  useEffect(() => {
    const updatePath = () => setPath(window.location.pathname)
    window.addEventListener("popstate", updatePath)
    window.addEventListener("jl:navigate", updatePath)
    return () => {
      window.removeEventListener("popstate", updatePath)
      window.removeEventListener("jl:navigate", updatePath)
    }
  }, [])

  const podcastMatch = path.match(/^\/podcasts\/(\d+)$/)
  const podcastId = podcastMatch ? Number(podcastMatch[1]) : null

  const mcqMatch = path.match(/^\/games\/mcq\/(\d+)$/)
  const mcqId = mcqMatch ? Number(mcqMatch[1]) : null

  const page =
    podcastId !== null
      ? <PodcastDetailPage podcastId={podcastId} />
      : mcqId !== null
      ? <MCQDetailPage questionId={mcqId} />
      : path === "/dashboard"
      ? <DashboardPage />
      : path === "/users"
      ? <UsersPage />
      : path === "/podcasts"
      ? <PodcastsPage />
      : path === "/games/mcq" || path === "/games"
      ? <MCQQuestionsPage />
      : <LoginPage />
  return <Toaster>{page}</Toaster>
}

export default App
