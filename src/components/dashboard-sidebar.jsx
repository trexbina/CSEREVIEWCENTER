"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState, useEffect, useRef } from "react"
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
    BarChart3: "/icons/sidebar/analytics.json",
    Settings: "/icons/sidebar/settings.json",
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

const adminNav = [
    { section: "GENERAL" },
    { label: "Admin Dashboard", href: "/admin", icon: "Home", description: "System overview, active users, and others" },
    { label: "User Management", href: "/admin/users", icon: "User", description: "Manage students, teachers, and accounts" },
    { label: "Curriculum Manager", href: "/admin/curriculum", icon: "FileText", description: "Manage exam programs, subjects, and topics" },
    { label: "Mock Exams", href: "/admin/mock-exams", icon: "PencilLine", description: "Create and configure mock exams" },
    { label: "Master Data", href: "/admin/master-data", icon: "Layers", description: "Manage courses, batches, and gradebooks" },
    { label: "Analytical Overview", href: "/admin/analytical-overview", icon: "BarChart3", description: "Performance reports and learning insights" },
    { section: "OTHER" },
    { label: "Settings", href: "/admin/settings", icon: "Settings" },
]

const navByRole = {
    student: studentNav,
    teacher: teacherNav,
    admin: adminNav,
}

const roleBadgeMap = {
    teacher: { label: "instructor", color: "bg-primary/15 text-primary" },
    admin: { label: "administrator", color: "bg-destructive/15 text-destructive" },
}

/* ------------------------------------------------------------------ */
/*  Sidebar component                                                  */
/* ------------------------------------------------------------------ */
export function DashboardSidebar({ role }) {
    const pathname = usePathname()
    const router = useRouter()
    const [collapsed, setCollapsed] = useState(false)
    const [mobileOpen, setMobileOpen] = useState(false)

    const navItems = navByRole[role] || studentNav
    const badge = roleBadgeMap[role]

    /* Eagerly prefetch every sidebar route on mount for instant navigation */
    useEffect(() => {
        navItems.forEach((item) => {
            if (item.href) router.prefetch(item.href)
        })
    }, [navItems, router])


    function isActive(href) {
        if (href === `/${role}`) return pathname === href
        return pathname.startsWith(href)
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
                className={`group relative flex items-center gap-4 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${active
                    ? "bg-black/[0.03] dark:bg-white/[0.06] text-[#696969] dark:text-white"
                    : "text-[#696969] dark:text-[#e5e7eb] hover:bg-black/[0.025] dark:hover:bg-white/[0.04] hover:text-black dark:hover:text-white"
                    } ${collapsed ? "justify-center" : ""}`}
            >
                {jsonSrc ? (
                    <div className="shrink-0 flex items-center justify-center pointer-events-none transition-colors duration-200 [&_path]:!fill-[#4b5563] dark:[&_path]:!fill-[#9ca3af] [&_path]:!stroke-[#4b5563] dark:[&_path]:!stroke-[#9ca3af] [&_circle]:!stroke-[#4b5563] dark:[&_circle]:!stroke-[#9ca3af] [&_rect]:!stroke-[#4b5563] dark:[&_rect]:!stroke-[#9ca3af]">
                        <LordIcon
                            ref={iconRef}
                            src={jsonSrc}
                            trigger="manual"
                            size={26}
                            speed={1}
                        />
                    </div>
                ) : (
                    <Icon className="h-6 w-6 shrink-0 text-[#4b5563] dark:text-[#9ca3af]" />
                )}
                {!collapsed && (
                    <span className={`text-[13.5px] font-medium leading-none truncate ${active ? "text-[#696969] dark:text-white" : "text-[#696969] dark:text-[#e5e7eb]"}`}>
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
            <div className="flex h-full flex-col">
                {/* Logo & Brand Name */}
                <div className={`flex items-center ${collapsed ? "justify-center px-2 pt-6 pb-3" : "justify-start pl-4 pr-3 pt-6 pb-3 gap-3.5"}`}>
                    <img
                        src="/landingpageassets/logo.png"
                        alt="Peak Excellence Review Center"
                        className={`object-contain shrink-0 transition-all ${collapsed ? "h-11 w-11" : "h-14.5 w-14.5 sm:h-14 sm:w-14"}`}
                    />
                    {!collapsed && (
                        <div className="flex flex-col min-w-0">
                            <span className="text-[18.5px] font-bold tracking-[0.16em] text-[#1f2937] dark:text-white leading-tight">
                                PEAK
                            </span>
                            <span className="text-[11.5px] font-semibold tracking-[0.24em] text-[#696969] dark:text-[#9ca3af] uppercase leading-tight -mt-0.5">
                                Excellence
                            </span>
                        </div>
                    )}
                </div>

                {/* Nav links */}
                <TooltipProvider delayDuration={150}>
                    <nav className="flex-1 space-y-2 overflow-y-auto px-3 pt-1 pb-6">
                        {navItems.map((item, idx) => {
                            // Section header support
                            if (item.section) {
                                return (
                                    <p key={`section-${idx}`} className={`px-3 pt-4 pb-1 text-[11px] font-semibold uppercase tracking-widest text-[#696969] dark:text-[#6b7280]/80 ${collapsed ? "hidden" : ""}`}>
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
                </TooltipProvider>

                {/* Bottom section */}
                <div className="border-t border-sidebar-border p-3 space-y-2">
                    <div className={`flex ${collapsed ? "justify-center" : "justify-start"}`}>
                        <LogoutButton iconOnly={collapsed} />
                    </div>
                </div>
            </div>
        )
    }


    return (
        <>
            {/* Mobile hamburger */}
            <button
                onClick={() => setMobileOpen(true)}
                className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-foreground shadow-sm lg:hidden"
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
                className={`fixed inset-y-0 left-0 z-50 w-72 transform bg-sidebar transition-transform duration-200 ease-in-out lg:hidden ${mobileOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                <button
                    onClick={() => setMobileOpen(false)}
                    className="absolute right-3 top-4 flex h-8 w-8 items-center justify-center rounded-md text-sidebar-foreground/70 hover:text-sidebar-foreground"
                    aria-label="Close sidebar"
                >
                    <X className="h-5 w-5" />
                </button>
                <SidebarContent />
            </aside>

            {/* Desktop sidebar */}
            <aside
                className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:border-r lg:border-sidebar-border lg:bg-sidebar transition-all duration-200 ${collapsed ? "lg:w-[68px]" : "lg:w-64"
                    }`}
            >
                <SidebarContent />
                {/* Collapse toggle */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-sidebar-border bg-sidebar text-sidebar-foreground/70 shadow-sm hover:text-sidebar-foreground"
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

