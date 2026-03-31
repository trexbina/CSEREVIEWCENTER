"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
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

const iconMap = {
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
    { label: "Analytics Hub", href: "/teacher", icon: "BarChart3", description: "Batch performance, readiness score & competency heatmap" },
    { label: "Content Vault", href: "/teacher/content", icon: "FolderOpen", description: "Categories" },
    { label: "Exam Creator", href: "/teacher/exams", icon: "ClipboardList", description: "Create tests" },
    { label: "Student Directory", href: "/teacher/students", icon: "GraduationCap", description: "List of enrolled reviewees" },
    { label: "Notifications", href: "/teacher/notifications", icon: "Bell" },
    { label: "Account Settings", href: "/teacher/settings", icon: "Settings" },
]

const adminNav = [
    { label: "Command Center", href: "/admin", icon: "LayoutDashboard", description: "System overview, active users & enrollment stats" },
    { label: "User Management", href: "/admin/users", icon: "Users", description: "Manage students, instructors & staff roles" },
    { label: "Master Data", href: "/admin/master-data", icon: "FolderOpen", description: "Manage core data entities" },
    { label: "System Report", href: "/admin/system-report", icon: "FileText", description: "View and export system reports" },
    { label: "Analytical Overview", href: "/admin/analytical-overview", icon: "BarChart3", description: "Analytics and insights dashboard" },
    { label: "Security & IP Control", href: "/admin/security", icon: "Shield", description: "Session monitoring, access logs & watermark settings" },
    { label: "Curriculum Manager", href: "/admin/curriculum", icon: "BookOpen", description: "Manage LET competencies & subjects" },
    { label: "Notifications", href: "/admin/notifications", icon: "Bell" },
    { label: "System Settings", href: "/admin/settings", icon: "Settings" },
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

    /* ---- Sidebar content (shared between mobile & desktop) ---- */
    function SidebarContent() {
        return (
            <div className="flex h-full flex-col">
                {/* Logo */}
                <div className={`flex items-center gap-3 px-4 pt-6 pb-6 ${collapsed ? "justify-center px-2" : ""}`}>
                    <img
                        src="/peakassestsimage/peak.jpg"
                        alt="Peak Excellence Review Center"
                        className={`rounded-md object-contain transition-all ${collapsed ? "h-8 w-8" : "h-11 w-11"}`}
                        style={{ mixBlendMode: "lighten" }}
                    />
                    {!collapsed && (
                        <div className="flex flex-col">
                            <span className="text-[8px] font-bold text-sidebar-foreground/50 tracking-widest leading-none mb-1">
                                EXCELLENCE REVIEW CENTER, INC.
                            </span>
                            <span className="text-[17px] font-black tracking-tight text-sidebar-foreground leading-none">
                                PEAK EXCELLENCE
                            </span>
                        </div>
                    )}
                </div>

                {/* Role badge */}
                {badge && !collapsed && (
                    <div className="px-4 pt-4">
                        <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${badge.color}`}>
                            {badge.label}
                        </span>
                    </div>
                )}
                {badge && collapsed && (
                    <div className="flex justify-center pt-4">
                        <span className={`inline-block h-2 w-2 rounded-full ${badge.color}`} />
                    </div>
                )}

                {/* Nav links */}
                <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
                    {navItems.map((item, idx) => {
                        // Section header support
                        if (item.section) {
                            return (
                                <p key={`section-${idx}`} className={`px-3 pt-4 pb-1 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/40 ${collapsed ? "hidden" : ""}`}>
                                    {item.section}
                                </p>
                            )
                        }

                        const Icon = iconMap[item.icon] || LayoutDashboard
                        const active = isActive(item.href)

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setMobileOpen(false)}
                                title={collapsed ? item.label : undefined}
                                className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${active
                                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                                    } ${collapsed ? "justify-center" : ""}`}
                            >
                                {active && (
                                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-r-full bg-sidebar-primary" />
                                )}
                                <Icon className={`h-5 w-5 shrink-0 ${active ? "text-sidebar-primary" : ""}`} />
                                {!collapsed && (
                                    <div className="flex flex-col">
                                        <span>{item.label}</span>
                                        {item.description && (
                                            <span className="text-[11px] font-normal text-sidebar-foreground/50 leading-tight">
                                                {item.description}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </Link>
                        )
                    })}
                </nav>

                {/* Mood Swing Widget */}
                {role === "student" && !collapsed && (
                    <div className="mx-3 mb-4 rounded-xl bg-card border border-border/50 p-4 shadow-sm">
                        <p className="text-[13px] font-medium text-sidebar-foreground/80 mb-3">How do you feel today?</p>
                        <div className="flex justify-between items-center px-1">
                            <button className="text-xl hover:scale-110 transition-transform" title="Happy">😀</button>
                            <button className="text-xl hover:scale-110 transition-transform" title="Relieved">😅</button>
                            <button className="text-xl hover:scale-110 transition-transform" title="Neutral">😐</button>
                            <button className="text-xl hover:scale-110 transition-transform" title="Stressed">😖</button>
                            <button className="text-xl hover:scale-110 transition-transform" title="Sleepy">😴</button>
                            <button className="text-xl hover:scale-110 transition-transform" title="Angry">😡</button>
                        </div>
                    </div>
                )}

                {/* Upcoming Events Widget */}
                {role === "student" && !collapsed && (
                    <div className="mx-3 mb-3 rounded-xl bg-card border border-border/50 p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <Calendar className="h-5 w-5 text-sidebar-foreground/70" />
                            <h3 className="font-bold text-sidebar-foreground/80 text-[15px]">Upcoming Events</h3>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="flex flex-col items-center justify-center min-w-[40px]">
                                <span className="text-xl font-bold text-sidebar-foreground/60 leading-none">26</span>
                                <span className="text-[11px] font-medium text-sidebar-foreground/50 mt-1">March</span>
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] font-semibold text-sidebar-foreground/50 uppercase leading-[1.3]">
                                    QUIZ ON STUDY AND THINKING SKILLS<br/>EXAMINATION DRILLS
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Bottom section */}
                <div className="border-t border-sidebar-border p-3 space-y-2">
                    <div className={`flex ${collapsed ? "justify-center" : ""}`}>
                        <LogoutButton />
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
