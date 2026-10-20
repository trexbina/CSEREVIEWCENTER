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
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-1.5 pt-1">
          <DialogTitle className="text-xl font-bold tracking-tight text-[#1E1E1E] dark:text-white">
            Forgot Password
          </DialogTitle>
          <DialogDescription className="text-xs text-[#696969] dark:text-gray-400 max-w-[280px] leading-relaxed">
            Enter your Login ID to receive a secure password reset link at your registered email address.
          </DialogDescription>
        </div>

        {/* Error message */}
        {forgotError && (
          <div className="rounded-xl bg-destructive/10 p-3 text-xs text-destructive text-center border border-destructive/20 font-medium animate-in fade-in duration-200 flex items-center justify-center gap-2">
            <ShieldAlert className="size-4 shrink-0" />
            <span>{forgotError}</span>
          </div>
        )}

        {/* Success message */}
        {forgotSuccess ? (
          <div className="space-y-4 text-center animate-in fade-in zoom-in-95 duration-200">
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
              className="w-full h-10.5 bg-[#E9C46A] hover:bg-[#deb454] text-[#1E1E1E] font-bold text-xs uppercase tracking-wider rounded-xl shadow-2xs transition-all active:scale-[0.99] cursor-pointer"
            >
              Back to Sign In
            </Button>
          </div>
        ) : (
          <form onSubmit={handleForgotSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="forgot-identifier" className="text-xs font-semibold text-[#3B3B3B] dark:text-gray-300">
                Login ID / Username
              </Label>
              <Input
                id="forgot-identifier"
                type="text"
                required
                autoComplete="username"
                value={forgotIdentifier}
                onChange={(e) => setForgotIdentifier(e.target.value)}
                className="h-10.5 text-xs sm:text-sm rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.04] px-3.5 text-[#1E1E1E] dark:text-white focus-visible:ring-1.5 focus-visible:ring-[#E9C46A] focus-visible:border-[#E9C46A] transition-all shadow-2xs"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-10.5 bg-[#E9C46A] hover:bg-[#deb454] text-[#1E1E1E] font-bold text-xs uppercase tracking-wider rounded-xl shadow-2xs mt-2 transition-all active:scale-[0.99] cursor-pointer"
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
                className="inline-flex items-center gap-1.5 text-xs text-[#696969] hover:text-[#1E1E1E] dark:text-gray-400 dark:hover:text-white font-medium transition-colors cursor-pointer"
              >
                <ArrowLeft className="size-3.5" />
                <span>Back to Sign In</span>
              </button>
            </div>
          </form>
        )}
      </div>
    )
  }

  /* ---------------- Standard Login View ---------------- */
  return (
    <div>
      {/* Header with Logo */}
      <div className="flex flex-col items-center text-center space-y-1 mb-5">
        <div className="size-10 flex items-center justify-center p-1 mb-1">
          <img
            src="/landingpageassets/logo.png"
            alt="Peak Excellence"
            className="h-full w-full object-contain"
          />
        </div>
        <DialogTitle className="text-xl font-bold tracking-tight text-[#1E1E1E] dark:text-white">
          Sign In
        </DialogTitle>
        <DialogDescription className="sr-only">
          Sign in to your PEAK Review Center account
        </DialogDescription>
      </div>

      {error && (
        <div className="rounded-xl bg-destructive/10 p-3 text-xs text-destructive text-center mb-4 border border-destructive/20 font-medium animate-in fade-in duration-200">
          {error}
        </div>
      )}

      <form onSubmit={handleLoginSubmit} className="space-y-3.5">
        <div className="space-y-1.5">
          <Label htmlFor="login-id" className="text-xs font-semibold text-[#3B3B3B] dark:text-gray-300">
            Login ID
          </Label>
          <Input
            id="login-id"
            type="text"
            required
            autoComplete="username"
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
            className="h-10.5 text-xs sm:text-sm rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.04] px-3.5 text-[#1E1E1E] dark:text-white focus-visible:ring-1.5 focus-visible:ring-[#E9C46A] focus-visible:border-[#E9C46A] transition-all shadow-2xs"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-xs font-semibold text-[#3B3B3B] dark:text-gray-300">
            Password
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-10.5 text-xs sm:text-sm rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.04] pl-3.5 pr-10 text-[#1E1E1E] dark:text-white focus-visible:ring-1.5 focus-visible:ring-[#E9C46A] focus-visible:border-[#E9C46A] transition-all shadow-2xs"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors cursor-pointer"
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
          className="w-full h-10.5 bg-[#E9C46A] hover:bg-[#deb454] text-[#1E1E1E] font-bold text-xs uppercase tracking-wider rounded-xl shadow-2xs mt-2 transition-all active:scale-[0.99] cursor-pointer"
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

      <div className="mt-5 pt-3.5 border-t border-black/5 dark:border-white/5 text-center">
        <p className="text-xs text-[#696969] dark:text-gray-400">
          Forgot your password?{" "}
          <button
            type="button"
            onClick={() => {
              setError("")
              setMode("forgot")
            }}
            className="font-semibold text-[#b38a2e] dark:text-[#E9C46A] hover:underline cursor-pointer ml-0.5"
          >
            Reset it
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
      <DialogContent className="sm:max-w-[380px] p-6 sm:p-7 bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 shadow-2xl rounded-2xl">
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
