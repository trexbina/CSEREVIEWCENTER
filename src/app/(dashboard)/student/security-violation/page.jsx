"use client"

import Link from "next/link"
import { ShieldAlert, ArrowLeft, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function SecurityViolationPage() {
    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gray-50/70 p-4 select-none">
            <div className="w-full max-w-md bg-white border border-red-100 shadow-xl rounded-2xl p-6 sm:p-8 text-center relative overflow-hidden">
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-red-50 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-amber-50 rounded-full blur-2xl pointer-events-none" />

                <div className="mx-auto w-16 h-16 rounded-2xl bg-red-100/70 text-red-600 flex items-center justify-center mb-5 shadow-sm">
                    <ShieldAlert className="w-9 h-9 stroke-[2.2]" />
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200/60 mb-3">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    Security Policy Violation
                </div>

                <h1 className="text-2xl font-bold tracking-tight text-gray-900 mb-2">
                    Developer Tools Detected
                </h1>

                <p className="text-sm text-gray-600 leading-relaxed mb-6">
                    Inspecting element source or opening browser Developer Tools is strictly prohibited in the student portal to protect exam and learning content.
                </p>

                <div className="p-3.5 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-500 text-left mb-6 space-y-1">
                    <p className="font-semibold text-gray-700">Required Action:</p>
                    <p>1. Close browser Inspect / Developer Tools (<kbd className="px-1.5 py-0.5 bg-white border rounded text-[11px]">F12</kbd> or <kbd className="px-1.5 py-0.5 bg-white border rounded text-[11px]">Ctrl+Shift+I</kbd>).</p>
                    <p>2. Reload or return to the student dashboard.</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5">
                    <Button
                        variant="outline"
                        className="w-full gap-2 border-gray-200 hover:bg-gray-100"
                        onClick={() => window.location.reload()}
                    >
                        <RefreshCw className="w-4 h-4" />
                        Reload Page
                    </Button>
                    <Button
                        asChild
                        className="w-full gap-2 bg-primary hover:bg-primary/90 text-white"
                    >
                        <Link href="/student">
                            <ArrowLeft className="w-4 h-4" />
                            Back to Student
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    )
}
