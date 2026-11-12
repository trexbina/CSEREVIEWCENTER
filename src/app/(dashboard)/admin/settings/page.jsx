"use client"

import { useState } from "react"
import { Settings } from "@/components/animate-ui/icons/settings"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { Loader2, KeyRound, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function PasswordInput({ id, label, value, onChange, visible, setVisible, placeholder }) {
    return (
        <div className="space-y-1.5">
            <Label htmlFor={id} className="text-xs font-semibold text-foreground">
                {label} <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
                <Input id={id} required type={visible ? "text" : "password"} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="h-10 pr-10 text-xs rounded-xl border-border/70" />
                <button type="button" onClick={() => setVisible(!visible)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer" tabIndex={-1} aria-label={visible ? `Hide ${label}` : `Show ${label}`}>
                    {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
            </div>
        </div>
    )
}

export default function SystemSettingsPage() {
    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showCurrentPassword, setShowCurrentPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [passwordLoading, setPasswordLoading] = useState(false)
    const [passwordFeedback, setPasswordFeedback] = useState(null)

    const handleChangePassword = async (event) => {
        event.preventDefault()
        setPasswordFeedback(null)

        if (!currentPassword.trim()) return setPasswordFeedback({ type: "error", message: "Current password is required." })
        if (newPassword.trim().length < 6) return setPasswordFeedback({ type: "error", message: "New password must be at least 6 characters long." })
        if (newPassword !== confirmPassword) return setPasswordFeedback({ type: "error", message: "New password and retype password do not match." })

        setPasswordLoading(true)
        try {
            const response = await fetch("/api/user/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentPassword: currentPassword.trim(), newPassword: newPassword.trim(), confirmPassword: confirmPassword.trim() }),
            })
            const data = await response.json()
            if (!response.ok) return setPasswordFeedback({ type: "error", message: data.error || "Failed to update password." })
            setPasswordFeedback({ type: "success", message: "Password changed successfully." })
            setCurrentPassword("")
            setNewPassword("")
            setConfirmPassword("")
        } catch {
            setPasswordFeedback({ type: "error", message: "Network error occurred. Please try again." })
        } finally {
            setPasswordLoading(false)
        }
    }

    return (
        <div className="space-y-8 w-full max-w-6xl mx-auto px-4 py-4 pb-16">
            <div className="border-b border-border pb-5"><div className="flex items-center gap-2.5"><Settings className="h-6 w-6 text-[#E9C46A]" animateOnHover /><h1 className="text-2xl font-bold tracking-wider text-foreground uppercase">System Settings</h1></div></div>
            <div className="space-y-8">
                <section className="pb-8 border-b border-border/60"><h2 className="text-base font-bold uppercase tracking-wider text-foreground">Display Theme</h2><div className="pt-4"><ThemeSwitcher /></div></section>
                <section className="pb-8">
                    <div className="mb-4"><div className="flex items-center gap-2"><KeyRound className="h-4.5 w-4.5 text-[#E9C46A]" /><h2 className="text-base font-bold uppercase tracking-wider text-foreground">Account Password</h2></div><p className="text-sm text-muted-foreground mt-0.5">Update your login password.</p></div>
                    <div className="max-w-2xl rounded-2xl border border-border/80 bg-card p-6 shadow-xs"><form onSubmit={handleChangePassword} className="space-y-4">
                        {passwordFeedback && <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${passwordFeedback.type === "success" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600" : "bg-destructive/10 border-destructive/20 text-destructive"}`}>{passwordFeedback.type === "success" ? <CheckCircle2 className="size-4 shrink-0" /> : <AlertCircle className="size-4 shrink-0" />}<span>{passwordFeedback.message}</span></div>}
                        <PasswordInput id="current-password" label="Current Password" value={currentPassword} onChange={setCurrentPassword} visible={showCurrentPassword} setVisible={setShowCurrentPassword} placeholder="Enter your current password" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><PasswordInput id="new-password" label="New Password" value={newPassword} onChange={setNewPassword} visible={showNewPassword} setVisible={setShowNewPassword} placeholder="Minimum 6 characters" /><PasswordInput id="confirm-password" label="Retype New Password" value={confirmPassword} onChange={setConfirmPassword} visible={showConfirmPassword} setVisible={setShowConfirmPassword} placeholder="Retype your new password" /></div>
                        {confirmPassword && <p className={`text-[11px] font-semibold ${newPassword === confirmPassword ? "text-emerald-600" : "text-rose-500"}`}>{newPassword === confirmPassword ? "Passwords match" : "Passwords do not match"}</p>}
                        <div className="pt-2 flex justify-end"><button type="submit" disabled={passwordLoading || !newPassword || !confirmPassword} className="h-10 px-6 rounded-xl bg-[#E9C46A] hover:bg-[#dfb550] disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider shadow-xs transition-all cursor-pointer flex items-center gap-2">{passwordLoading && <Loader2 className="size-3.5 animate-spin" />}Update Password</button></div>
                    </form></div>
                </section>
            </div>
        </div>
    )
}
