"use client"

import { Settings } from "@/components/animate-ui/icons/settings"
import { ThemeSwitcher } from "@/components/theme-switcher"

export default function SystemSettingsPage() {

    return (
        <div className="space-y-8">
            <div>
                <div className="flex items-center gap-3">
                    <Settings className="h-8 w-8 text-primary" animateOnHover />
                    <h1 className="text-3xl font-bold text-foreground">System Settings</h1>
                </div>
                <p className="mt-2 text-muted-foreground">
                    Configure platform-wide settings, defaults, and system behavior.
                </p>
            </div>

            {/* Display / Theme */}
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-foreground">Display</h2>
                <p className="mt-4 text-sm text-muted-foreground">
                    Choose a theme for the application.
                </p>
                <div className="mt-4">
                    <ThemeSwitcher />
                </div>
            </div>

            {/* General */}
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-foreground">General</h2>
                <p className="mt-4 text-sm text-muted-foreground">
                    Site name, branding, and default configuration options will be managed here.
                </p>
            </div>

            {/* Authentication */}
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-foreground">Authentication</h2>
                <p className="mt-4 text-sm text-muted-foreground">
                    Session duration, password policies, and security settings.
                </p>
            </div>

            {/* Maintenance */}
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-foreground">Maintenance</h2>
                <p className="mt-4 text-sm text-muted-foreground">
                    Database maintenance, backup schedules, and system health monitoring.
                </p>
            </div>
        </div>
    )
}
