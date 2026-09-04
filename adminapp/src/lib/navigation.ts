export function navigateTo(path: string) {
  if (window.location.pathname !== path) {
    window.history.pushState({}, "", path)
    window.dispatchEvent(new Event("jl:navigate"))
  }
}
