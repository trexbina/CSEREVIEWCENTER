"use client"

import Link from "next/link"
import { Shield, FileText, Type } from "lucide-react"
import { Settings } from "@/components/animate-ui/icons/settings"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { FontSwitcher } from "@/components/font-switcher"

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

            {/* Typography / Font Preference */}
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center gap-2">
                    <Type className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold text-foreground">Typography & Font Preference</h2>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                    Choose your preferred font family for the entire system interface.
                </p>
                <div className="mt-4">
                    <FontSwitcher />
                </div>
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
                <h2 className="text-lg font-semibold text-foreground">Authentication & Security</h2>
                <p className="mt-4 text-sm text-muted-foreground">
                    Session duration, password policies, access logs, and watermark settings.
                </p>
                <div className="mt-6">
                    <Link href="/admin/security" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors">
                       <Shield className="h-4 w-4" /> Manage Security & IP Control
                    </Link>
                </div>
            </div>

            {/* Maintenance */}
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-foreground">Maintenance</h2>
                <p className="mt-4 text-sm text-muted-foreground">
                    Database maintenance, backup schedules, and system health monitoring.
                </p>
            </div>

            {/* Reports */}
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-foreground">System Reports</h2>
                <p className="mt-4 text-sm text-muted-foreground">
                    View and export detailed system logs, user activity, and performance metrics.
                </p>
                <div className="mt-6">
                    <Link href="/admin/system-report" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors">
                       <FileText className="h-4 w-4" /> View System Reports
                    </Link>
                </div>
            </div>
        </div>
    )
}
