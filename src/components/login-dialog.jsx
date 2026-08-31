"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const ROLE_HOME = { 
  student: "/student", 
  teacher: "/teacher", 
  admin: "/admin",
  super_admin: "/admin",
  academic_admin: "/admin",
  registrar: "/admin",
}

/* ------------------------------------------------------------------ */
/*  Login form inner content                                           */
/* ------------------------------------------------------------------ */
function LoginFormInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl")

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Invalid username or password.")
        setLoading(false)
        return
      }

      const role = data.user.role
      const destination = callbackUrl || ROLE_HOME[role] || "/student"
      const userName = data.user.name || "User"

      // Navigate to the dedicated loading screen page
      router.push(`/loading-screen?destination=${encodeURIComponent(destination)}&role=${encodeURIComponent(role)}&name=${encodeURIComponent(userName)}`)
    } catch {
      setError("Network error. Please try again.")
      setLoading(false)
    }
  }

  return (
    <div className="p-1 sm:p-2">
      {/* Header with Logo */}
      <div className="flex flex-col items-center text-center space-y-2 mb-6">
        <div className="size-11 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-800 flex items-center justify-center p-2 shadow-2xs">
          <img
            src="/landingpageassets/logo.png"
            alt="Peak Excellence"
            className="h-full w-full object-contain"
          />
        </div>
        <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          Sign In
        </DialogTitle>
      </div>

      {error && (
        <div className="rounded-xl bg-destructive/10 p-3 text-xs text-destructive text-center mb-5 border border-destructive/20 font-medium animate-in fade-in duration-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-semibold text-foreground">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            required
            autoComplete="username"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-10 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-background/50 focus-visible:ring-1 focus-visible:ring-slate-300 dark:focus-visible:ring-slate-600 focus-visible:border-slate-400 dark:focus-visible:border-slate-500 transition-all px-3.5"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-xs font-semibold text-foreground">
              Password
            </Label>
          </div>
          <Input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-10 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-background/50 focus-visible:ring-1 focus-visible:ring-slate-300 dark:focus-visible:ring-slate-600 focus-visible:border-slate-400 dark:focus-visible:border-slate-500 transition-all px-3.5"
          />
        </div>

        <Button
          type="submit"
          className="w-full h-10 bg-[#E9C46A] text-white font-bold text-xs rounded-xl shadow-xs mt-2 transition-opacity duration-200 hover:opacity-85 hover:bg-[#E9C46A] active:opacity-75 cursor-pointer"
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="animate-spin h-3.5 w-3.5" />
              Logging in...
            </span>
          ) : (
            "Log In"
          )}
        </Button>
      </form>

      <div className="mt-6 pt-4 border-t border-border/50 text-center space-y-2">
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Need an account or forgot your password? <br className="hidden sm:block" />
          <span className="text-foreground font-medium">Contact your administrator</span>
        </p>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main Exported Component                                            */
/* ------------------------------------------------------------------ */
export function LoginDialog({ children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px] p-6 bg-card border border-border/80 shadow-2xl rounded-2xl">
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-[#E9C46A]" /></div>}>
          <LoginFormInner />
        </Suspense>
      </DialogContent>
    </Dialog>
  )
}
