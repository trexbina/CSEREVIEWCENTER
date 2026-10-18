"use client"

import { Suspense, useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, ArrowLeft, KeyRound, ShieldCheck } from "lucide-react"

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [verifying, setVerifying] = useState(true)
  const [tokenValid, setTokenValid] = useState(false)
  const [tokenError, setTokenError] = useState("")

  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  // Verify token on mount
  useEffect(() => {
    if (!token) {
      setVerifying(false)
      setTokenValid(false)
      setTokenError("No password reset token was provided.")
      return
    }

    async function checkToken() {
      try {
        const res = await fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`)
        const data = await res.json()
        if (res.ok && data.valid) {
          setTokenValid(true)
        } else {
          setTokenValid(false)
          setTokenError(data.error || "This reset link is invalid or has expired.")
        }
      } catch {
        setTokenValid(false)
        setTokenError("Network error checking token. Please try again.")
      } finally {
        setVerifying(false)
      }
    }

    checkToken()
  }, [token])

  async function handleSubmit(e) {
    e.preventDefault()
    setError("")

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.")
      return
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          newPassword,
          confirmPassword,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Failed to reset password. Please try again.")
        setSubmitting(false)
        return
      }

      setSuccess(true)
    } catch {
      setError("A network error occurred. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  // 1. Loading state during initial verification
  if (verifying) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
        <Loader2 className="size-8 text-[#E9C46A] animate-spin" />
        <p className="text-sm text-muted-foreground font-medium">Verifying reset link security...</p>
      </div>
    )
  }

  // 2. Token invalid or expired error state
  if (!tokenValid) {
    return (
      <div className="p-6 sm:p-8 text-center space-y-5">
        <div className="size-14 mx-auto rounded-full bg-destructive/10 text-destructive flex items-center justify-center border border-destructive/20">
          <AlertCircle className="size-7" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight text-foreground">Link Invalid or Expired</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
            {tokenError || "This password reset token is either invalid, already utilized, or has expired."}
          </p>
        </div>
        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/?login=1"
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            Back to Sign In
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs font-semibold hover:bg-muted/50 transition-colors"
          >
            Go to Home
          </Link>
        </div>
      </div>
    )
  }

  // 3. Success state
  if (success) {
    return (
      <div className="p-6 sm:p-8 text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="size-14 mx-auto rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
          <CheckCircle2 className="size-7" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight text-foreground">Password Reset Successfully!</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
            Your new password has been securely saved. You can now use it to sign in to your PEAK account.
          </p>
        </div>
        <div className="pt-3">
          <Link
            href="/?login=1"
            className="w-full inline-flex items-center justify-center h-11 bg-[#E9C46A] hover:bg-[#dfb758] text-slate-900 font-bold text-xs rounded-xl shadow-sm transition-all"
          >
            Sign In with New Password
          </Link>
        </div>
      </div>
    )
  }

  // 4. Form state
  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword
  const hasMinLength = newPassword.length >= 6

  return (
    <div className="p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col items-center text-center space-y-2">
        <div className="size-12 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center p-2.5 shadow-sm">
          <KeyRound className="size-6 text-[#E9C46A]" />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          Create New Password
        </h1>
        <p className="text-xs text-muted-foreground max-w-xs">
          Choose a strong password with at least 6 characters.
        </p>
      </div>

      {error && (
        <div className="rounded-xl bg-destructive/10 p-3 text-xs text-destructive text-center border border-destructive/20 font-medium animate-in fade-in duration-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* New Password */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">New Password</label>
          <div className="relative">
            <input
              type={showNewPassword ? "text" : "password"}
              required
              minLength={6}
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full h-10 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-background/50 focus:outline-none focus:ring-1 focus:ring-[#E9C46A] px-3.5 pr-10 text-foreground transition-all"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              tabIndex={-1}
            >
              {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        {/* Confirm New Password */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">Confirm New Password</label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              required
              minLength={6}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full h-10 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-background/50 focus:outline-none focus:ring-1 focus:ring-[#E9C46A] px-3.5 pr-10 text-foreground transition-all"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              tabIndex={-1}
            >
              {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        {/* Validation indicators */}
        <div className="space-y-1 pt-1 text-[11px] text-muted-foreground">
          <div className={`flex items-center gap-1.5 ${hasMinLength ? "text-emerald-600 dark:text-emerald-400 font-medium" : ""}`}>
            <span className={`size-1.5 rounded-full ${hasMinLength ? "bg-emerald-500" : "bg-muted-foreground/40"}`} />
            At least 6 characters
          </div>
          {confirmPassword && (
            <div className={`flex items-center gap-1.5 ${passwordsMatch ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-destructive font-medium"}`}>
              <span className={`size-1.5 rounded-full ${passwordsMatch ? "bg-emerald-500" : "bg-destructive"}`} />
              {passwordsMatch ? "Passwords match" : "Passwords do not match"}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting || !hasMinLength || !passwordsMatch}
          className="w-full h-10 mt-2 bg-[#E9C46A] hover:bg-[#dfb758] active:opacity-80 text-slate-900 font-bold text-xs rounded-xl shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              Updating Password...
            </>
          ) : (
            <>
              <ShieldCheck className="size-4" />
              Update Password
            </>
          )}
        </button>
      </form>

      <div className="pt-2 text-center">
        <Link
          href="/?login=1"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          Back to Sign In
        </Link>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background px-4 py-12 relative selection:bg-[#E9C46A]/30">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(233,196,106,0.15),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(233,196,106,0.08),rgba(0,0,0,0))] pointer-events-none" />

      <div className="relative w-full max-w-md bg-card border border-border/80 shadow-2xl rounded-2xl overflow-hidden backdrop-blur-sm">
        <Suspense
          fallback={
            <div className="p-12 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="size-8 text-[#E9C46A] animate-spin" />
              <p className="text-xs text-muted-foreground">Loading reset verification...</p>
            </div>
          }
        >
          <ResetPasswordContent />
        </Suspense>
      </div>
    </div>
  )
}
