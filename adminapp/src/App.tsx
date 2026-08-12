import { useEffect, useState } from "react"

import { DashboardPage } from "@/pages/dashboard-page"
import { LoginPage } from "@/pages/login-page"

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

  return path === "/dashboard" ? <DashboardPage /> : <LoginPage />
}

export default App
