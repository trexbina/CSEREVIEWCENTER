"use client"

import { Suspense, useState, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Flame, Loader2 } from "lucide-react"

const ROLE_HOME = { student: "/student", teacher: "/teacher", admin: "/admin" }

/* Routes to prefetch per role after login */
const ROLE_ROUTES = {
  student: [
    "/student",
    "/student/groups",
    "/student/mock-exams",
    "/student/progress",
    "/student/notifications",
    "/student/profile",
    "/student/settings",
  ],
  teacher: [
    "/teacher",
    "/teacher/content",
    "/teacher/exams",
    "/teacher/students",
    "/teacher/notifications",
    "/teacher/settings",
  ],
  admin: [
    "/admin",
    "/admin/users",
    "/admin/security",
    "/admin/curriculum",
    "/admin/financials",
    "/admin/reports",
    "/admin/notifications",
    "/admin/settings",
  ],
}

/* ------------------------------------------------------------------ */
/*  Loading overlay shown while prefetching                            */
/* ------------------------------------------------------------------ */
function LoadingOverlay({ message }) {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm transition-opacity">
      <div className="flex flex-col items-center gap-6 animate-in fade-in duration-300">
        {/* Logo */}
        <div className="relative w-40 md:w-56 animate-pulse flex justify-center mb-2">
            <img 
                src="/peak_loading_screen-removebg-preview.png" 
                alt="Loading Peak Excellence..." 
                className="w-full h-auto object-contain drop-shadow-xl"
            />
        </div>

        {/* Spinner */}
        <Loader2 className="h-8 w-8 animate-spin text-primary" />

        {/* Message */}
        <div className="text-center space-y-1">
          <p className="text-lg font-semibold text-foreground">{message}</p>
          <p className="text-sm text-muted-foreground">Preparing your dashboard…</p>
        </div>

        {/* Progress bar */}
        <div className="w-48 h-1.5 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: "70%", animation: "loading-bar 1.5s ease-in-out infinite" }} />
        </div>
      </div>

      <style jsx>{`
        @keyframes loading-bar {
          0% { width: 15%; margin-left: 0; }
          50% { width: 70%; margin-left: 15%; }
          100% { width: 15%; margin-left: 85%; }
        }
      `}</style>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Login form                                                         */
/* ------------------------------------------------------------------ */
function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl")

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [prefetching, setPrefetching] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState("")

  /* Prefetch all routes for the user's role */
  const prefetchRoutes = useCallback(async (role) => {
    const routes = ROLE_ROUTES[role] || []

    // Warm up the heavy dashboard client chunks in parallel with route prefetches.
    // dynamic(() => import(...)) created separate chunks for sidebar/header/carousel;
    // importing them here forces the browser to download & cache those bundles
    // while the loading overlay is still visible.
    const chunkWarmups = [
      import("@/components/dashboard-sidebar"),
      import("@/components/dashboard-header"),
      import("@/components/dashboard-carousel"),
    ]

    // Also pre-fetch the actual HTML/RSC payload for every navbar page so the
    // content is already in the browser cache when the user clicks a nav link.
    // We use plain fetch() with priority "low" so it doesn't block the main
    // prefetches but still warms the server-side data + RSC cache.
    const pageFetches = routes.map((route) =>
      fetch(route, {
        priority: "low",
        headers: { "RSC": "1", "Next-Router-Prefetch": "1" },
      }).catch(() => { })
    )

    // Fire all prefetches + chunk warm‑ups + page fetches in parallel
    await Promise.allSettled([
      ...routes.map((route) => router.prefetch(route)),
      ...chunkWarmups,
      ...pageFetches,
    ])
  }, [router])

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
        setError(data.error || "Login failed.")
        setLoading(false)
        return
      }

      const role = data.user.role
      const destination = callbackUrl || ROLE_HOME[role] || "/student"

      // Show loading overlay and prefetch all dashboard routes
      setPrefetching(true)
      setLoadingMessage(`Welcome back, ${data.user.name || "User"}!`)

      // Prefetch all role routes + the destination in parallel
      await prefetchRoutes(role)

      // Small delay so the loading screen feels intentional
      await new Promise((r) => setTimeout(r, 600))

      // Navigate to the dashboard
      router.push(destination)
      router.refresh()
    } catch {
      setError("Network error. Please try again.")
      setLoading(false)
      setPrefetching(false)
    }
  }

  /* Show full-screen loading overlay during prefetching */
  if (prefetching) {
    return <LoadingOverlay message={loadingMessage} />
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 rounded-lg border border-border bg-card p-8 shadow-sm">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Welcome Back</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to your account
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Contact your administrator if you need an account.
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
