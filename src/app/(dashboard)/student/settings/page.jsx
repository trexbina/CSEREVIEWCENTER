"use client"

import { useState } from "react"
import {
    Type,
    KeyRound,
    Eye,
    EyeOff,
    CheckCircle2,
    AlertCircle,
    Loader2
} from "lucide-react"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { FontSwitcher } from "@/components/font-switcher"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function StudentSettingsPage() {
    // Password state
    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showCurrentPassword, setShowCurrentPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [passwordLoading, setPasswordLoading] = useState(false)
    const [passwordFeedback, setPasswordFeedback] = useState(null)

    const handleChangePassword = async (e) => {
        e.preventDefault()
        setPasswordFeedback(null)

        if (!currentPassword || !currentPassword.trim()) {
            setPasswordFeedback({
                type: "error",
                message: "Current password is required."
            })
            return
        }

        if (!newPassword || newPassword.trim().length < 6) {
            setPasswordFeedback({
                type: "error",
                message: "New password must be at least 6 characters long."
            })
            return
        }

        if (newPassword !== confirmPassword) {
            setPasswordFeedback({
                type: "error",
                message: "New password and retype password do not match."
            })
            return
        }

        setPasswordLoading(true)
        try {
            const res = await fetch("/api/user/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    currentPassword: currentPassword.trim(),
                    newPassword: newPassword.trim(),
                    confirmPassword: confirmPassword.trim()
                })
            })

            const data = await res.json()

            if (!res.ok) {
                setPasswordFeedback({
                    type: "error",
                    message: data.error || "Failed to update password."
                })
                return
            }

            setPasswordFeedback({
                type: "success",
                message: "Password changed successfully."
            })
            setCurrentPassword("")
            setNewPassword("")
            setConfirmPassword("")
        } catch {
            setPasswordFeedback({
                type: "error",
                message: "Network error occurred. Please try again."
            })
        } finally {
            setPasswordLoading(false)
        }
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold tracking-wider text-[#4d4d4d] dark:text-slate-200 uppercase mb-1">
                    SETTINGS
                </h1>
                <p className="text-[#8c8c8c] dark:text-slate-400 text-sm font-medium">
                    Manage your appearance, typography, and account preferences.
                </p>
            </div>

            {/* Change Password Card */}
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                    <KeyRound className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold text-foreground">Change Password</h2>
                </div>
                <p className="text-sm text-muted-foreground">
                    Update your account login password. Enter your new password and retype it to confirm.
                </p>

                <form onSubmit={handleChangePassword} className="space-y-4 max-w-xl pt-2">
                    {/* Feedback Alert */}
                    {passwordFeedback && (
                        <div
                            className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-150 ${
                                passwordFeedback.type === "success"
                                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                                    : "bg-destructive/10 border-destructive/20 text-destructive"
                            }`}
                        >
                            {passwordFeedback.type === "success" ? (
                                <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                                <AlertCircle className="size-4 shrink-0 text-destructive" />
                            )}
                            <span>{passwordFeedback.message}</span>
                        </div>
                    )}

                    {/* Current Password (Required) */}
                    <div className="space-y-1.5">
                        <Label htmlFor="student-current-password" className="text-xs font-semibold text-foreground">
                            Current Password <span className="text-destructive">*</span>
                        </Label>
                        <div className="relative">
                            <Input
                                id="student-current-password"
                                required
                                type={showCurrentPassword ? "text" : "password"}
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="Enter your current password"
                                className="h-10 pr-10 text-xs rounded-lg border-border/70"
                            />
                            <button
                                type="button"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                tabIndex={-1}
                            >
                                {showCurrentPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                            </button>
                        </div>
                        <span className="text-[11px] text-muted-foreground block">
                            Required to confirm your identity. If forgotten, please contact an administrator.
                        </span>
                    </div>

                    {/* New Password & Retype Password */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="student-new-password" className="text-xs font-semibold text-foreground">
                                New Password <span className="text-destructive">*</span>
                            </Label>
                            <div className="relative">
                                <Input
                                    id="student-new-password"
                                    required
                                    type={showNewPassword ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Min. 6 characters"
                                    className="h-10 pr-10 text-xs rounded-lg border-border/70"
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
                            <span className="text-[11px] text-muted-foreground block">
                                Minimum 6 characters.
                            </span>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="student-confirm-password" className="text-xs font-semibold text-foreground">
                                Retype New Password <span className="text-destructive">*</span>
                            </Label>
                            <div className="relative">
                                <Input
                                    id="student-confirm-password"
                                    required
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Retype new password"
                                    className="h-10 pr-10 text-xs rounded-lg border-border/70"
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

                            {/* Password match feedback */}
                            {confirmPassword.length > 0 && (
                                <div className="pt-0.5">
                                    {newPassword === confirmPassword ? (
                                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                                            <CheckCircle2 className="size-3" /> Passwords match
                                        </span>
                                    ) : (
                                        <span className="text-[11px] text-rose-500 dark:text-rose-400 font-semibold flex items-center gap-1">
                                            <AlertCircle className="size-3" /> Passwords do not match
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2 flex items-center justify-end">
                        <button
                            type="submit"
                            disabled={passwordLoading || !newPassword || !confirmPassword}
                            className="h-10 px-5 rounded-lg bg-[#E9C46A] hover:bg-[#dfb550] disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all active:scale-95 cursor-pointer flex items-center gap-2"
                        >
                            {passwordLoading ? (
                                <>
                                    <Loader2 className="size-3.5 animate-spin" />
                                    <span>Updating…</span>
                                </>
                            ) : (
                                <span>Update Password</span>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {/* Typography / Font Preference */}
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center gap-2">
                    <Type className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold text-foreground">Typography & Font Preference</h2>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                    Customize the font used across your dashboard.
                </p>
                <div className="mt-4">
                    <FontSwitcher />
                </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-foreground">Notification Preferences</h2>
                <p className="mt-4 text-sm text-muted-foreground">
                    Notification settings will be available here soon.
                </p>
            </div>

            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-foreground">Display</h2>
                <p className="mt-4 text-sm text-muted-foreground">
                    Choose a theme for the application.
                </p>
                <div className="mt-4">
                    <ThemeSwitcher />
                </div>
            </div>
        </div>
    )
}

