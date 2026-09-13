"use client"

import dynamic from "next/dynamic"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useMemo } from "react"
import { Shield } from "lucide-react"

import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"

export function DashboardShell({ role, permissions, roleName, children }) {
    const pathname = usePathname()
    const router = useRouter()
    
    const isCourseViewer = 
        (/^\/admin\/curriculum\/[^/]+\/content/.test(pathname)) ||
        (/^\/student\/subjects\/[^/]+/.test(pathname)) ||
        (/^\/teacher\/modules\/[^/]+/.test(pathname)) ||
        (/^\/admin\/mock-exams\/[^/]+/.test(pathname))

    // Automatically redirect from /admin if /admin is not in permissions
    useEffect(() => {
        if (role !== "student" && role !== "teacher" && Array.isArray(permissions) && permissions.length > 0) {
            if (pathname === "/admin" && !permissions.includes("/admin")) {
                const firstAllowed = permissions.find((p) => p !== "/admin") || permissions[0]
                if (firstAllowed) {
                    router.replace(firstAllowed)
                }
            }
        }
    }, [pathname, permissions, role, router])

    // Check if the current route is an admin module that is restricted for this role
    const isRestrictedModule = useMemo(() => {
        if (role === "student" || role === "teacher") return false
        if (!Array.isArray(permissions)) return false

        const guardedModules = [
            "/admin/users",
            "/admin/curriculum",
            "/admin/mock-exams",
            "/admin/master-data",
            "/admin/analytical-overview",
            "/admin/trash",
            "/admin/settings",
        ]

        for (const mod of guardedModules) {
            if (pathname === mod || pathname.startsWith(mod + "/")) {
                return !permissions.includes(mod)
            }
        }

        if (pathname === "/admin") {
            return !permissions.includes("/admin")
        }

        return false
    }, [pathname, permissions, role])

    return (
        <div className="flex min-h-screen bg-background">
            {/* Side Panel Navbar — z-30 so it overlaps the header (z-20) */}
            {!isCourseViewer && (
                <DashboardSidebar
                    role={role}
                    permissions={permissions}
                    roleName={roleName}
                />
            )}

            {/* Right column: header + page content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top header — sits behind the sidebar */}
                {!isCourseViewer && <DashboardHeader role={role} />}

                {/* Dashboard Content */}
                <main className={`flex-1 ${isCourseViewer ? "" : "px-4 py-8 lg:px-6 pt-6"}`}>
                    {isRestrictedModule ? (
                        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
                            <div className="w-12 h-12 rounded-2xl bg-muted border border-border flex items-center justify-center text-muted-foreground mb-4 shadow-xs">
                                <Shield className="w-6 h-6" />
                            </div>
                            <h2 className="text-xl font-bold text-foreground">Access Restricted</h2>
                            <p className="text-sm text-muted-foreground mt-1 max-w-md">
                                Your role does not have permission to access this dashboard module. Please contact an administrator if you require access.
                            </p>
                            {permissions && permissions.length > 0 && (
                                <button
                                    onClick={() => {
                                        const target = permissions.find((p) => p !== "/admin") || permissions[0]
                                        if (target) router.push(target)
                                    }}
                                    className="mt-6 px-4 py-2 bg-[#E9C46A] hover:bg-[#dfb550] text-white text-xs font-semibold rounded-xl shadow-2xs transition-all cursor-pointer"
                                >
                                    Go to Accessible Module
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="w-full h-full">{children}</div>
                    )}
                </main>
            </div>
        </div>
    )
}

