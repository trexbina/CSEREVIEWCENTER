"use client"

import { Type } from "lucide-react"
import { Settings } from "@/components/animate-ui/icons/settings"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { FontSwitcher } from "@/components/font-switcher"

export default function StudentSettingsPage() {

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
