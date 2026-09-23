import { useEffect, useState } from "react"

import { DashboardPage } from "@/pages/dashboard-page"
import { LoginPage } from "@/pages/login-page"
import { UsersPage } from "@/pages/users-page"
import { PodcastsPage } from "@/pages/podcasts-page"
import { PodcastDetailPage } from "@/pages/podcast-detail-page"
import { MCQQuestionsPage } from "@/pages/mcq-questions-page"
import { MCQDetailPage } from "@/pages/mcq-detail-page"
import { LanguageSystemPage } from "@/pages/language-system-page"
import { CMSPage } from "@/pages/cms-page"
import { Toaster } from "@/components/ui/toast"
import { navigateTo } from "@/lib/navigation"

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

  // Check stored user role for route restrictions
  const userString = sessionStorage.getItem("admin-user")
  const currentUser = userString ? JSON.parse(userString) : null
  const isContentUserOnly =
    currentUser &&
    !currentUser.is_superuser &&
    (currentUser.role === "content_creator" || currentUser.role === "content_manager")

  // If a content user tries to access main admin tabs, redirect them to /cms
  useEffect(() => {
    if (isContentUserOnly && !path.startsWith("/cms") && path !== "/login") {
      navigateTo("/cms")
    }
  }, [path, isContentUserOnly])

  const podcastMatch = path.match(/^\/podcasts\/(\d+)$/)
  const podcastId = podcastMatch ? Number(podcastMatch[1]) : null

  const mcqMatch = path.match(/^\/games\/mcq\/(\d+)$/)
  const mcqId = mcqMatch ? Number(mcqMatch[1]) : null

  let page = <LoginPage />

  if (path.startsWith("/cms")) {
    page = <CMSPage />
  } else if (isContentUserOnly) {
    page = <CMSPage />
  } else if (podcastId !== null) {
    page = <PodcastDetailPage podcastId={podcastId} />
  } else if (mcqId !== null) {
    page = <MCQDetailPage questionId={mcqId} />
  } else if (path === "/dashboard") {
    page = <DashboardPage />
  } else if (path === "/users") {
    page = <UsersPage />
  } else if (path === "/language-system") {
    page = <LanguageSystemPage />
  } else if (path === "/podcasts") {
    page = <PodcastsPage />
  } else if (path === "/games/mcq" || path === "/games") {
    page = <MCQQuestionsPage />
  }

  return <Toaster>{page}</Toaster>
}

export default App
