"use client"

import dynamic from "next/dynamic"
import { usePathname } from "next/navigation"

/* ── Lazy‑load heavy client components inside a client boundary ── */
/* ssr: false is only allowed in Client Components                 */

const DashboardSidebar = dynamic(
    () => import("@/components/dashboard-sidebar").then((m) => m.DashboardSidebar),
    {
        loading: () => (
            <>
                {/* Desktop sidebar skeleton */}
                <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:w-64 lg:border-r lg:border-sidebar-border lg:bg-sidebar animate-pulse" />
                <div className="hidden lg:block lg:w-64 shrink-0" />
            </>
        ),
        ssr: false,
    }
)

const DashboardHeader = dynamic(
    () => import("@/components/dashboard-header").then((m) => m.DashboardHeader),
    {
        loading: () => (
            <header className="sticky top-0 z-20 flex h-14 items-center border-b border-border bg-background/80 backdrop-blur px-4 lg:px-8 animate-pulse" />
        ),
        ssr: false,
    }
)

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
