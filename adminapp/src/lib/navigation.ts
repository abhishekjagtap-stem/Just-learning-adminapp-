export function navigateTo(path: "/login" | "/dashboard") {
  if (window.location.pathname !== path) {
    window.history.pushState({}, "", path)
    window.dispatchEvent(new Event("jl:navigate"))
  }
}
