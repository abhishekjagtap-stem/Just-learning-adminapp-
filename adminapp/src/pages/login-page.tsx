import { useState, type FormEvent } from "react"
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react"
import { Brand } from "@/components/brand"
import { Button } from "@/components/ui/button"
import { navigateTo } from "@/lib/navigation"

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); navigateTo("/dashboard") }

  return (
    <main className="h-svh overflow-hidden bg-[#fbf8ff] p-3 sm:p-5">
      <div className="mx-auto grid h-full max-w-6xl overflow-hidden rounded-3xl bg-card shadow-[0_20px_60px_rgba(73,38,112,0.12)] lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden overflow-hidden bg-primary p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute -right-24 -top-20 size-80 rounded-full border-[36px] border-white/10" />
          <div className="absolute -bottom-20 -left-20 size-64 rounded-full bg-[#9b5de5]" />
          <Brand className="relative" />
          <div className="relative max-w-md"><p className="mb-5 text-sm font-medium tracking-wide text-purple-100">ADMIN PORTAL</p><h1 className="text-4xl font-semibold leading-tight tracking-tight">One mission. One workspace.</h1><p className="mt-5 max-w-sm text-base leading-7 text-purple-50/85">One clear place to manage the work that drives JL forward.</p></div>
          <p className="relative text-sm text-purple-100/80">© 2026 JL. Built for meaningful work.</p>
        </section>
        <section className="flex min-h-0 items-center justify-center overflow-hidden p-6 sm:p-12">
          <div className="w-full max-w-sm"><Brand className="mb-12 lg:hidden" /><div className="mb-8"><p className="text-sm font-medium text-primary">WELCOME BACK</p><h2 className="mt-2 text-3xl font-semibold tracking-tight">Sign in to Just Learning</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Enter your details to access the admin workspace.</p></div>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <label className="block text-sm font-medium">Email or username<div className="relative mt-2"><Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input required type="text" placeholder="you@jl.org" className="h-11 w-full rounded-lg border bg-background pl-10 pr-3 text-sm outline-none transition focus:border-primary focus:ring-3 focus:ring-primary/10" /></div></label>
              <label className="block text-sm font-medium">Password<div className="relative mt-2"><LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input required type={showPassword ? "text" : "password"} placeholder="Enter your password" className="h-11 w-full rounded-lg border bg-background pl-10 pr-11 text-sm outline-none transition focus:border-primary focus:ring-3 focus:ring-primary/10" /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></div></label>
              <div className="flex items-center justify-between gap-4 text-sm"><label className="flex cursor-pointer items-center gap-2 text-muted-foreground"><input type="checkbox" className="size-4 rounded border-input accent-primary" />Remember me</label><button type="button" className="font-medium text-primary hover:underline">Forgot password?</button></div>
              <Button type="submit" size="lg" className="h-11 w-full">Login</Button>
            </form><p className="mt-8 text-center text-xs text-muted-foreground">Secure access for authorized JL staff.</p>
          </div>
        </section>
      </div>
    </main>
  )
}
