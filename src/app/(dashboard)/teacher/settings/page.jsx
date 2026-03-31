"use client"

import { Settings } from "@/components/animate-ui/icons/settings"
import { ThemeSwitcher } from "@/components/theme-switcher"

export default function TeacherSettingsPage() {

    return (
        <div className="space-y-8">
            <div>
                <div className="flex items-center gap-3">
                    <Settings className="h-8 w-8 text-primary" animateOnHover />
                    <h1 className="text-3xl font-bold text-foreground">Account Settings</h1>
                </div>
                <p className="mt-2 text-muted-foreground">
                    Manage your account preferences, notification settings, and display options.
                </p>
            </div>

            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-foreground">Notification Preferences</h2>
                <p className="mt-4 text-sm text-muted-foreground">
                    Configure which notifications you receive and how they are delivered.
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
