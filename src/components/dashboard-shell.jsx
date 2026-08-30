"use client"

import dynamic from "next/dynamic"
import { usePathname } from "next/navigation"

import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"

export function DashboardShell({ role, children }) {
    const pathname = usePathname()
    
    const isCourseViewer = 
        (/^\/admin\/curriculum\/[^/]+\/content/.test(pathname)) ||
        (/^\/student\/subjects\/[^/]+/.test(pathname)) ||
        (/^\/teacher\/modules\/[^/]+/.test(pathname)) ||
        (/^\/admin\/mock-exams\/[^/]+/.test(pathname))

    return (
        <div className="flex min-h-screen bg-background">
            {/* Side Panel Navbar — z-30 so it overlaps the header (z-20) */}
            {!isCourseViewer && <DashboardSidebar role={role} />}

            {/* Right column: header + page content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top header — sits behind the sidebar */}
                {!isCourseViewer && <DashboardHeader role={role} />}

                {/* Dashboard Content */}
                <main className={`flex-1 ${isCourseViewer ? '' : 'px-4 py-8 lg:px-6 pt-6'}`}>
                    <div className="w-full h-full">{children}</div>
                </main>
            </div>
        </div>
    )
}
