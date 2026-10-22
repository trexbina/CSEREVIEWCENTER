"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState, useEffect, useRef, useMemo } from "react"
import {
    LayoutDashboard,
    Users,
    FileText,
    BarChart3,
    Bell,
    User,
    BookOpen,
    Shield,
    DollarSign,
    ClipboardList,
    FolderOpen,
    GraduationCap,
    Activity,
    Menu,
    X,
    ChevronLeft,
    Flame,
    Calendar,
    Layers,
    PencilLine,
    Star,
    Search,
    Trash,
} from "lucide-react"

import { Settings as AnimatedSettingsBase } from "@/components/animate-ui/icons/settings"
import { LogoutButton } from "@/components/logout-button"

/* ------------------------------------------------------------------ */
/*  Icon mapping                                                       */
/* ------------------------------------------------------------------ */
function Settings(props) {
    return <AnimatedSettingsBase animateOnHover {...props} />
}

import { Home } from "lucide-react"

const iconMap = {
    Home,
    LayoutDashboard,
    Users,
    FileText,
    BarChart3,
    Bell,
    Settings,
    User,
    BookOpen,
    Shield,
    DollarSign,
    ClipboardList,
    FolderOpen,
    GraduationCap,
    Activity,
    Flame,
    Calendar,
    Layers,
    PencilLine,
    Star,
    Trash,
}

import { LordIcon } from "@/components/ui/lord-icon"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

const sidebarJsonMap = {
    Home: "/icons/sidebar/home.json",
    LayoutDashboard: "/icons/sidebar/home.json",
    User: "/icons/sidebar/users.json",
    Users: "/icons/sidebar/users.json",
    FileText: "/icons/sidebar/curriculum.json",
    PencilLine: "/icons/sidebar/exam.json",
    Layers: "/icons/sidebar/layers.json",
    Calendar: "/icons/sidebar/calendar.json",
    Star: "/icons/sidebar/myprogress.json",
    BarChart3: "/icons/sidebar/analytics.json",
    Settings: "/icons/sidebar/settings.json",
    Trash: "/icons/sidebar/trash.json",
}

/* ------------------------------------------------------------------ */
/*  Navigation definitions per role                                    */
/* ------------------------------------------------------------------ */
const studentNav = [
    { section: "GENERAL" },
    { label: "Dashboard", href: "/student", icon: "LayoutDashboard" },
    { label: "Subjects", href: "/student/subjects", icon: "Layers" },
    { label: "Assignments", href: "/student/assignments", icon: "FileText" },
    { label: "Calendar", href: "/student/calendar", icon: "Calendar" },
    { label: "Mock Exams", href: "/student/mock-exams", icon: "PencilLine" },
    { label: "My Progress", href: "/student/progress", icon: "Star" },
    { section: "ACCOUNT" },
    { label: "Profile", href: "/student/profile", icon: "User" },
    { label: "Settings", href: "/student/settings", icon: "Settings" },
]

const teacherNav = [
    { section: "GENERAL" },
    { label: "Modules", href: "/teacher/modules", icon: "Layers", description: "Curriculum modules & categories" },
]

const superAdminNav = [
    { section: "GENERAL" },
    { label: "Admin Dashboard", href: "/admin", icon: "Home", description: "System overview, active users, and others" },
    { label: "User Management", href: "/admin/users", icon: "User", description: "Manage students, teachers, and accounts" },
    { label: "Curriculum Manager", href: "/admin/curriculum", icon: "FileText", description: "Manage exam programs, subjects, and topics" },
    { label: "Mock Exams", href: "/admin/mock-exams", icon: "PencilLine", description: "Create and configure mock exams" },
    { label: "Master Data", href: "/admin/master-data", icon: "Layers", description: "Manage courses, batches, and gradebooks" },
    { label: "Analytical Overview", href: "/admin/analytical-overview", icon: "BarChart3", description: "Performance reports and learning insights" },
    { section: "OTHER" },
    { label: "Trash", href: "/admin/trash", icon: "Trash", description: "Item recovery and recycle bin" },
    { label: "Settings", href: "/admin/settings", icon: "Settings" },
]

const academicAdminNav = [
    { section: "GENERAL" },
    { label: "Admin Dashboard", href: "/admin", icon: "Home", description: "System overview & academic metrics" },
    { label: "Curriculum Manager", href: "/admin/curriculum", icon: "FileText", description: "Manage exam programs, subjects, and topics" },
    { label: "Mock Exams", href: "/admin/mock-exams", icon: "PencilLine", description: "Create and configure mock exams" },
    { label: "Master Data", href: "/admin/master-data", icon: "Layers", description: "View curriculum master data & courses" },
    { label: "Analytical Overview", href: "/admin/analytical-overview", icon: "BarChart3", description: "Performance reports and learning insights" },
]

const registrarNav = [
    { section: "GENERAL" },
    { label: "Admin Dashboard", href: "/admin", icon: "Home", description: "System overview & enrollment counts" },
    { label: "User Management", href: "/admin/users", icon: "User", description: "Manage students and pre-registrations" },
    { label: "Master Data", href: "/admin/master-data", icon: "Layers", description: "Manage batches, programs, and schools" },
]

const navByRole = {
    student: studentNav,
    teacher: teacherNav,
    admin: superAdminNav,
    super_admin: superAdminNav,
    academic_admin: academicAdminNav,
    registrar: registrarNav,
}

const roleBadgeMap = {
    teacher: { label: "instructor", color: "bg-primary/15 text-primary" },
    admin: { label: "super admin", color: "bg-destructive/15 text-destructive" },
    super_admin: { label: "super admin", color: "bg-destructive/15 text-destructive" },
    academic_admin: { label: "academic coordinator", color: "bg-[#E9C46A]/20 text-[#B8860B] dark:text-[#E9C46A]" },
    registrar: { label: "registrar", color: "bg-blue-500/15 text-blue-600 dark:text-blue-400" },
}

/* ------------------------------------------------------------------ */
/*  Sidebar component                                                  */
export function DashboardSidebar({ role, permissions, roleName }) {
    const pathname = usePathname()
    const router = useRouter()
    const [collapsed, setCollapsed] = useState(false)
    const [mobileOpen, setMobileOpen] = useState(false)
    const [customPermissions, setCustomPermissions] = useState(null)
    const [customRoleName, setCustomRoleName] = useState(roleName || "")

    useEffect(() => {
        // If permissions prop wasn't passed directly, fetch from /api/admin/roles
        if (!permissions && role && role !== "student" && role !== "teacher") {
            fetch("/api/admin/roles")
                .then((res) => res.json())
                .then((data) => {
                    const r = (data.roles || []).find((x) => x.role_key === role)
                    if (r) {
                        setCustomPermissions(Array.isArray(r.permissions) ? r.permissions : [])
                        if (!customRoleName) setCustomRoleName(r.name)
                    }
                })
                .catch(() => {})
        }

        const handleRoleUpdated = () => {
            fetch("/api/admin/roles")
                .then((res) => res.json())
                .then((data) => {
                    const r = (data.roles || []).find((x) => x.role_key === role)
                    if (r) {
                        setCustomPermissions(Array.isArray(r.permissions) ? r.permissions : [])
                        setCustomRoleName(r.name)
                    }
                })
                .catch(() => {})
        }
        window.addEventListener("role-permissions-updated", handleRoleUpdated)
        return () => window.removeEventListener("role-permissions-updated", handleRoleUpdated)
    }, [role, permissions, customRoleName])

    // Compute nav items: only show modules assigned to the admin user's role
    const navItems = useMemo(() => {
        if (role === "student") return studentNav
        if (role === "teacher") return teacherNav

        const allowed = permissions || customPermissions
        if (Array.isArray(allowed)) {
            const result = []
            let pendingSection = null

            for (const item of superAdminNav) {
                if (item.section) {
                    pendingSection = item
                } else {
                    const isMasterData = item.href === "/admin/master-data"
                    const hasMasterDataPerm = isMasterData && (
                        allowed.includes("/admin/master-data") ||
                        allowed.includes("/admin/master-data/tree") ||
                        allowed.includes("/admin/master-data/batches") ||
                        allowed.includes("/admin/master-data/education") ||
                        allowed.includes("/admin/master-data/gradebook") ||
                        allowed.includes("/admin/master-data/roles") ||
                        allowed.includes("/admin/roles")
                    )

                    const isAllowed = 
                        allowed.includes(item.href) ||
                        (item.href === "/admin/settings" && allowed.includes("/admin/settings/security")) ||
                        hasMasterDataPerm

                    if (isAllowed) {
                        if (pendingSection) {
                            result.push(pendingSection)
                            pendingSection = null
                        }

                        // If user only has access to a single master data section, link directly to it
                        if (isMasterData && !allowed.includes("/admin/master-data")) {
                            const permitted = []
                            if (allowed.includes("/admin/master-data/tree")) permitted.push("tree")
                            if (allowed.includes("/admin/master-data/batches")) permitted.push("batches")
                            if (allowed.includes("/admin/master-data/education")) permitted.push("education")
                            if (allowed.includes("/admin/master-data/gradebook")) permitted.push("gradebook")
                            if (allowed.includes("/admin/master-data/roles") || allowed.includes("/admin/roles")) permitted.push("roles")

                            if (permitted.length === 1) {
                                result.push({
                                    ...item,
                                    href: `/admin/master-data?tab=${permitted[0]}`
                                })
                                continue
                            }
                        }

                        result.push(item)
                    }
                }
            }
            return result
        }

        // Fallback if no permissions configured
        if (navByRole[role]) return navByRole[role]
        return superAdminNav
    }, [role, permissions, customPermissions])

    const badge = useMemo(() => {
        const displayName = roleName || customRoleName
        if (displayName) {
            return {
                label: displayName.toLowerCase(),
                color: roleBadgeMap[role]?.color || "bg-slate-500/15 text-slate-700 dark:text-slate-300",
            }
        }
        if (roleBadgeMap[role]) return roleBadgeMap[role]
        return { label: (role || "admin").replace(/_/g, " "), color: "bg-slate-500/15 text-slate-700 dark:text-slate-300" }
    }, [role, roleName, customRoleName])

    /* Eagerly prefetch every sidebar route on mount for instant navigation */
    useEffect(() => {
        navItems.forEach((item) => {
            if (item.href) router.prefetch(item.href)
        })
    }, [navItems, router])


    function isActive(href) {
        if (href === "/admin") return pathname === "/admin"
        if (href === `/${role}`) return pathname === href
        return pathname === href || pathname.startsWith(href + "/")
    }

    /* ------------------------------------------------------------------ */
    /*  Sidebar Nav Item component with hover interaction & tooltip       */
    /* ------------------------------------------------------------------ */
    function SidebarNavItem({ item, active, collapsed, onNavigate }) {
        const iconRef = useRef(null)
        const jsonSrc = sidebarJsonMap[item.icon]
        const Icon = iconMap[item.icon] || LayoutDashboard

        const content = (
            <Link
                href={item.href}
                onClick={onNavigate}
                onMouseEnter={() => {
                    if (iconRef.current) {
                        iconRef.current.play()
                    }
                }}
                className={`group relative flex items-center gap-3.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${active
                    ? "bg-white dark:bg-white/[0.12] text-[#3B3B3B] dark:text-white shadow-xs"
                    : "text-[#696969] dark:text-[#e5e7eb] hover:bg-black/[0.035] dark:hover:bg-white/[0.04] hover:text-[#3B3B3B] dark:hover:text-white"
                    } ${collapsed ? "justify-center px-2" : ""}`}
            >
                {jsonSrc ? (
                    <div className={`shrink-0 flex items-center justify-center pointer-events-none transition-colors duration-200 ${active
                        ? "[&_path]:!fill-[#3B3B3B] dark:[&_path]:!fill-white [&_path]:!stroke-[#3B3B3B] dark:[&_path]:!stroke-white [&_circle]:!stroke-[#3B3B3B] dark:[&_circle]:!stroke-white [&_rect]:!stroke-[#3B3B3B] dark:[&_rect]:!stroke-white"
                        : "[&_path]:!fill-[#696969] dark:[&_path]:!fill-[#9ca3af] [&_path]:!stroke-[#696969] dark:[&_path]:!stroke-[#9ca3af] [&_circle]:!stroke-[#696969] dark:[&_circle]:!stroke-[#9ca3af] [&_rect]:!stroke-[#696969] dark:[&_rect]:!stroke-[#9ca3af]"
                        }`}>
                        <LordIcon
                            ref={iconRef}
                            src={jsonSrc}
                            trigger="manual"
                            size={25}
                            speed={1}
                        />
                    </div>
                ) : (
                    <Icon className={`h-5.5 w-5.5 shrink-0 transition-colors ${active ? "text-[#3B3B3B] dark:text-white" : "text-[#696969] dark:text-[#9ca3af]"}`} />
                )}
                {!collapsed && (
                    <span className={`text-[13.5px] leading-none truncate transition-colors ${active ? "text-[#3B3B3B] dark:text-white font-semibold" : "text-[#696969] dark:text-[#e5e7eb]"}`}>
                        {item.label}
                    </span>
                )}
            </Link>
        )

        if (item.description || collapsed) {
            return (
                <Tooltip delayDuration={150}>
                    <TooltipTrigger asChild>
                        {content}
                    </TooltipTrigger>
                    <TooltipContent
                        side="right"
                        align="center"
                        className="bg-white text-gray-800 dark:bg-slate-900 dark:text-slate-100 border border-gray-200 dark:border-slate-800 shadow-md text-xs px-3 py-1.5 rounded-lg max-w-xs font-normal"
                    >
                        {item.description || item.label}
                    </TooltipContent>
                </Tooltip>
            )
        }

        return content
    }

    /* ---- Sidebar content (shared between mobile & desktop) ---- */
    function SidebarContent() {
        return (
            <TooltipProvider delayDuration={150}>
                <div className="flex h-full flex-col bg-[#F2F2F2] dark:bg-[#14161b]">
                    {/* Logo - Emblem with 'CSE' & 'Review' stacked text */}
                    <div className={`flex items-center pt-5 pb-3 ${collapsed ? "justify-center px-2" : "justify-start px-4 gap-3"}`}>
                        <img
                            src="/landingpageassets/logo.png"
                            alt="CSE Review System"
                            className={`shrink-0 object-contain transition-all ${collapsed ? "size-9" : "size-10 sm:size-[42px]"}`}
                        />
                        {!collapsed && (
                            <div className="flex flex-col leading-tight select-none">
                                <span className="text-[15px] font-black tracking-wider text-[#3B3B3B] dark:text-white uppercase font-sans">
                                    CSE
                                </span>
                                <span className="text-[12px] font-semibold tracking-wide text-[#696969] dark:text-gray-400 font-sans -mt-0.5">
                                    Review
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Nav links */}
                    <nav className="flex-1 space-y-1.5 overflow-y-auto px-3 py-2">
                        {navItems.map((item, idx) => {
                            // Section header support
                            if (item.section) {
                                return (
                                    <p key={`section-${idx}`} className={`px-3 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-widest text-[#696969]/50 dark:text-[#6b7280]/60 ${collapsed ? "hidden" : ""}`}>
                                        {item.section}
                                    </p>
                                )
                            }

                            const active = isActive(item.href)

                            return (
                                <SidebarNavItem
                                    key={item.href}
                                    item={item}
                                    active={active}
                                    collapsed={collapsed}
                                    onNavigate={() => setMobileOpen(false)}
                                />
                            )
                        })}
                    </nav>

                    {/* Bottom section */}
                    <div className="border-t border-black/5 dark:border-white/10 p-3">
                        <div className={`flex ${collapsed ? "justify-center" : "justify-start"}`}>
                            <LogoutButton iconOnly={collapsed} />
                        </div>
                    </div>
                </div>
            </TooltipProvider>
        )
    }


    return (
        <>
            {/* Mobile hamburger */}
            <button
                onClick={() => setMobileOpen(true)}
                className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-[#F2F2F2] dark:bg-[#14161b] text-foreground shadow-sm lg:hidden"
                aria-label="Open sidebar"
            >
                <Menu className="h-5 w-5" />
            </button>

            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Mobile drawer */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-72 transform bg-[#F2F2F2] dark:bg-[#14161b] transition-transform duration-200 ease-in-out lg:hidden ${mobileOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                <button
                    onClick={() => setMobileOpen(false)}
                    className="absolute right-3 top-4 flex h-8 w-8 items-center justify-center rounded-md text-[#696969] hover:text-black dark:hover:text-white"
                    aria-label="Close sidebar"
                >
                    <X className="h-5 w-5" />
                </button>
                <SidebarContent />
            </aside>

            {/* Desktop sidebar */}
            <aside
                className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:border-r lg:border-black/5 dark:lg:border-white/10 lg:bg-[#F2F2F2] dark:lg:bg-[#14161b] transition-all duration-200 ${collapsed ? "lg:w-[68px]" : "lg:w-64"
                    }`}
            >
                <SidebarContent />
                {/* Collapse toggle */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-black/10 dark:border-white/15 bg-[#F2F2F2] dark:bg-[#14161b] text-[#696969] shadow-sm hover:text-black dark:hover:text-white cursor-pointer"
                    aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    <ChevronLeft className={`h-3.5 w-3.5 transition-transform ${collapsed ? "rotate-180" : ""}`} />
                </button>
            </aside>

            {/* Spacer to push content */}
            <div className={`hidden lg:block shrink-0 transition-all duration-200 ${collapsed ? "lg:w-[68px]" : "lg:w-64"}`} />
        </>
    )
}

