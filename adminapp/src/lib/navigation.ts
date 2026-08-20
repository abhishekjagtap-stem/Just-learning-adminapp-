export function navigateTo(path: "/login" | "/dashboard" | "/users") {
  if (window.location.pathname !== path) {
    window.history.pushState({}, "", path)
    window.dispatchEvent(new Event("jl:navigate"))
  }
}
