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

const ROLE_HOME = { student: "/student", teacher: "/teacher", admin: "/admin" }

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
        setError(data.error || "Login failed.")
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
    <div className="px-2 py-6 md:px-6">
      <DialogHeader className="mb-10 space-y-3">
        <DialogTitle className="text-3xl md:text-4xl font-extrabold text-center tracking-tight text-[#0f172a]">
          Welcome Back
        </DialogTitle>
        <DialogDescription className="text-center text-[#64748b] font-medium text-[15px]">
          Sign in to your account
        </DialogDescription>
      </DialogHeader>

      {error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive text-center mb-6 border border-destructive/20 font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2.5">
          <Label htmlFor="email" className="text-sm font-bold text-[#1e293b]">Username</Label>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 border-[#cbd5e1] focus-visible:ring-[#3b82f6]/40 focus-visible:border-[#3b82f6] transition-all rounded-lg shadow-sm text-base px-4"
          />
        </div>

        <div className="space-y-2.5">
          <Label htmlFor="password" className="text-sm font-bold text-[#1e293b]">Password</Label>
          <Input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 border-[#cbd5e1] focus-visible:ring-[#3b82f6]/40 focus-visible:border-[#3b82f6] transition-all rounded-lg shadow-sm text-base px-4"
          />
        </div>

        <Button 
          type="submit" 
          className="w-full h-[52px] bg-[#eed48f] hover:bg-[#e4c46c] text-white font-bold text-[16px] rounded-lg transition-all shadow-md hover:shadow-lg mt-2" 
          disabled={loading}
        >
          {loading ? "Logging in…" : "Log In"}
        </Button>
      </form>
      
      <div className="mt-10 px-4 text-center">
        <p className="text-[12px] text-[#94a3b8] font-medium leading-relaxed">
          Contact your administrator if you need an account or if you forgot your password.
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
      <DialogContent className="sm:max-w-md md:max-w-[480px] p-6 md:p-8 bg-white border-none shadow-2xl rounded-2xl">
        <Suspense fallback={<div className="flex justify-center p-12"><Loader2 className="animate-spin h-10 w-10 text-[#eed48f]" /></div>}>
          <LoginFormInner />
        </Suspense>
      </DialogContent>
    </Dialog>
  )
}
