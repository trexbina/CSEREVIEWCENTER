"use client"

import { Suspense, useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2, Eye, EyeOff, ArrowLeft, Mail, CheckCircle2, ShieldAlert } from "lucide-react"

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
/*  Login & Forgot Password Inner Content                              */
/* ------------------------------------------------------------------ */
function LoginFormInner({ initialMode = "login" }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl")

  const [mode, setMode] = useState(initialMode) // "login" | "forgot"

  // Login form state
  const [loginId, setLoginId] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  // Forgot password form state
  const [forgotIdentifier, setForgotIdentifier] = useState("")
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotError, setForgotError] = useState("")
  const [forgotSuccess, setForgotSuccess] = useState("")

  async function handleLoginSubmit(e) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loginId, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Invalid Login ID or password.")
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

  async function handleForgotSubmit(e) {
    e.preventDefault()
    setForgotError("")
    setForgotSuccess("")
    setForgotLoading(true)

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: forgotIdentifier }),
      })

      const data = await res.json()

      if (!res.ok) {
        setForgotError(data.error || "Unable to process password reset.")
        setForgotLoading(false)
        return
      }

      setForgotSuccess(
        data.message ||
          "If an account matching that username exists, a password reset link has been dispatched to its registered email address."
      )
    } catch {
      setForgotError("Network error. Please try again.")
    } finally {
      setForgotLoading(false)
    }
  }

  /* ---------------- Forgot Password View ---------------- */
  if (mode === "forgot") {
    return (
      <div className="p-1 sm:p-2 space-y-5">
        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="size-11 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center p-2 shadow-2xs">
            <Mail className="size-5 text-[#E9C46A]" />
          </div>
          <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Forgot Password
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground max-w-xs">
            Enter your user account to receive a secure password reset link at your registered email address.
          </DialogDescription>
        </div>

        {/* Error message (displays 'invalid Contact Admin to change password' if admin username entered) */}
        {forgotError && (
          <div className="rounded-xl bg-destructive/10 p-3 text-xs text-destructive text-center border border-destructive/20 font-medium animate-in fade-in duration-200 flex items-center justify-center gap-2">
            <ShieldAlert className="size-4 shrink-0" />
            <span>{forgotError}</span>
          </div>
        )}

        {/* Success message */}
        {forgotSuccess ? (
          <div className="space-y-5 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="rounded-xl bg-emerald-500/10 p-4 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-400 font-medium leading-relaxed flex flex-col items-center space-y-2">
              <CheckCircle2 className="size-6 text-emerald-600 dark:text-emerald-400" />
              <p>{forgotSuccess}</p>
            </div>
            <Button
              type="button"
              onClick={() => {
                setForgotSuccess("")
                setMode("login")
              }}
              className="w-full h-10 bg-[#E9C46A] text-slate-900 font-bold text-xs rounded-xl shadow-xs hover:bg-[#dfb758] cursor-pointer"
            >
              Back to Sign In
            </Button>
          </div>
        ) : (
          <form onSubmit={handleForgotSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="forgot-identifier" className="text-xs font-semibold text-foreground">
                User Account (Username / Login ID)
              </Label>
              <Input
                id="forgot-identifier"
                type="text"
                required
                autoComplete="username"
                placeholder="e.g. dianalan00002 or email@example.com"
                value={forgotIdentifier}
                onChange={(e) => setForgotIdentifier(e.target.value)}
                className="h-10 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-background/50 focus-visible:ring-1 focus-visible:ring-slate-300 dark:focus-visible:ring-slate-600 focus-visible:border-slate-400 dark:focus-visible:border-slate-500 transition-all px-3.5"
              />
              <p className="text-[11px] text-muted-foreground">
                We will look up your registered email and send a secure reset link.
              </p>
            </div>

            <Button
              type="submit"
              className="w-full h-10 bg-[#E9C46A] text-slate-900 font-bold text-xs rounded-xl shadow-xs mt-2 transition-opacity duration-200 hover:opacity-85 hover:bg-[#E9C46A] active:opacity-75 cursor-pointer"
              disabled={forgotLoading || !forgotIdentifier.trim()}
            >
              {forgotLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="animate-spin h-3.5 w-3.5" />
                  Sending Reset Link...
                </span>
              ) : (
                "Send Reset Link"
              )}
            </Button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setForgotError("")
                  setMode("login")
                }}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors cursor-pointer"
              >
                <ArrowLeft className="size-3.5" />
                Back to Sign In
              </button>
            </div>
          </form>
        )}
      </div>
    )
  }

  /* ---------------- Standard Login View ---------------- */
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
        <DialogDescription className="sr-only">
          Sign in to your PEAK Review Center account
        </DialogDescription>
      </div>

      {error && (
        <div className="rounded-xl bg-destructive/10 p-3 text-xs text-destructive text-center mb-5 border border-destructive/20 font-medium animate-in fade-in duration-200">
          {error}
        </div>
      )}

      <form onSubmit={handleLoginSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="login-id" className="text-xs font-semibold text-foreground">
            Login ID
          </Label>
          <Input
            id="login-id"
            type="text"
            required
            autoComplete="username"
            placeholder="e.g. dianalan00002"
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
            className="h-10 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-background/50 focus-visible:ring-1 focus-visible:ring-slate-300 dark:focus-visible:ring-slate-600 focus-visible:border-slate-400 dark:focus-visible:border-slate-500 transition-all px-3.5"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-xs font-semibold text-foreground">
              Password
            </Label>
            <button
              type="button"
              onClick={() => {
                setError("")
                setMode("forgot")
              }}
              className="text-[11px] text-[#b38a2e] dark:text-[#E9C46A] hover:underline font-medium cursor-pointer"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-10 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-background/50 focus-visible:ring-1 focus-visible:ring-slate-300 dark:focus-visible:ring-slate-600 focus-visible:border-slate-400 dark:focus-visible:border-slate-500 transition-all pl-3.5 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              tabIndex={-1}
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full h-10 bg-[#E9C46A] text-slate-900 font-bold text-xs rounded-xl shadow-xs mt-2 transition-opacity duration-200 hover:opacity-85 hover:bg-[#E9C46A] active:opacity-75 cursor-pointer"
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
          Forgot your password?{" "}
          <button
            type="button"
            onClick={() => {
              setError("")
              setMode("forgot")
            }}
            className="text-[#b38a2e] dark:text-[#E9C46A] hover:underline font-semibold cursor-pointer"
          >
            Reset it here
          </button>
        </p>
      </div>
    </div>
  )
}

function LoginDialogInner({ children, defaultOpen = false, initialMode = "login" }) {
  const searchParams = useSearchParams()
  const shouldOpenFromQuery = searchParams?.get("login") === "1"
  const shouldOpenForgot = searchParams?.get("forgot") === "1"
  const queryNeedsOpen = shouldOpenFromQuery || shouldOpenForgot

  const [userOpen, setUserOpen] = useState(null)
  const open = userOpen !== null ? userOpen : (defaultOpen || queryNeedsOpen)

  const effectiveMode = shouldOpenForgot ? "forgot" : initialMode

  return (
    <Dialog open={open} onOpenChange={setUserOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px] p-6 bg-card border border-border/80 shadow-2xl rounded-2xl">
        <LoginFormInner initialMode={effectiveMode} />
      </DialogContent>
    </Dialog>
  )
}

export function LoginDialog(props) {
  return (
    <Suspense fallback={props.children ? <>{props.children}</> : null}>
      <LoginDialogInner {...props} />
    </Suspense>
  )
}

export function ForgotPasswordDialog(props) {
  return (
    <Suspense fallback={props.children ? <>{props.children}</> : null}>
      <LoginDialogInner {...props} initialMode="forgot" />
    </Suspense>
  )
}
