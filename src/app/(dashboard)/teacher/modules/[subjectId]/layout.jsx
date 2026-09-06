"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Loader2, ChevronLeft, Menu, X } from "lucide-react"
import { extractSubjectFiles } from "@/lib/subject-files"
import SubjectFileViewerModal from "@/components/subject-file-viewer-modal"

function normalizeLessonType(rawType, hasPdf = false) {
    if (hasPdf) return "pdf"
    const value = String(rawType || "").trim().toLowerCase()
    if (value === "quiz" || value === "exam") return "quiz"
    if (value === "pdf" || value === "file" || value === "files") return "pdf"
    return "module"
}

// For teachers: only show modules and PDFs. Exclude quizzes.
function shouldShowLessonInTeacherTab(lesson, tab = "modules") {
    const lessonType = normalizeLessonType(lesson.lesson_type, lesson.has_pdf)
    if (lessonType === "quiz") return false
    if (tab === "files") return lessonType === "pdf"
    return true
}

function pickFirstTeacherLesson(modules, tab = "modules") {
    for (const mod of modules || []) {
        for (const lesson of mod.lessons || []) {
            if (shouldShowLessonInTeacherTab(lesson, tab)) return lesson
        }
    }
    return null
}

export default function TeacherSubjectLayout({ children }) {
    const params = useParams()
    const router = useRouter()
    const searchParams = useSearchParams()
    const subjectId = params.subjectId

    const initialTab = searchParams.get("tab") === "files" ? "files" : "modules"
    const [modules, setModules] = useState([])
    const [subjectInfo, setSubjectInfo] = useState(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState(initialTab)
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const [viewingFile, setViewingFile] = useState(null)

    const subjectFiles = useMemo(() => extractSubjectFiles(modules), [modules])

    useEffect(() => {
        fetchModules()
    }, [subjectId])

    useEffect(() => {
        const urlTab = searchParams.get("tab")
        if (urlTab === "files" && activeTab !== "files") {
            setActiveTab("files")
        } else if (urlTab === "modules" && activeTab !== "modules") {
            setActiveTab("modules")
        }
    }, [searchParams])

    useEffect(() => {
        if (loading) return
        if (!modules.length) return

        const currentLessonId = searchParams.get("lessonId")
        if (currentLessonId) {
            let found = null
            for (const mod of modules) {
                found = (mod.lessons || []).find((l) => String(l.id) === String(currentLessonId))
                if (found) break
            }
            if (found) {
                const norm = normalizeLessonType(found.lesson_type, found.has_pdf)
                if (norm === "pdf" && searchParams.get("tab") === "files" && activeTab !== "files") {
                    setActiveTab("files")
                }
            }
            return
        }

        const firstLesson = pickFirstTeacherLesson(modules, activeTab)
        if (!firstLesson) return

        const normalizedType = normalizeLessonType(firstLesson.lesson_type, firstLesson.has_pdf)
        router.replace(
            `/teacher/modules/${subjectId}?lessonId=${firstLesson.id}&type=${normalizedType}${activeTab === 'files' ? '&tab=files' : ''}`
        )
    }, [loading, modules, searchParams, activeTab, router, subjectId])

    async function fetchModules() {
        try {
            const res = await fetch(`/api/teacher/subjects/${subjectId}/modules`)
            if (res.ok) {
                const data = await res.json()
                const fetchedModules = data.modules || []
                setModules(fetchedModules)
                if (data.subject) {
                    setSubjectInfo(data.subject)
                }
            } else if (res.status === 403) {
                router.push("/teacher/modules")
            }
        } catch (error) {
            console.error("Failed to fetch modules", error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex h-[calc(100vh-64px)] w-full items-center justify-center bg-white">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        )
    }

    return (
        <div className="flex relative h-screen w-full overflow-hidden bg-white">

            {/* Mobile Sidebar Toggle Button */}
            <button
                onClick={() => setIsSidebarOpen(true)}
                className="md:hidden absolute bottom-6 right-6 z-40 h-14 w-14 bg-[#ba5a62] text-white rounded-full shadow-2xl shadow-black/30 flex items-center justify-center hover:bg-[#a64e56] transition-transform active:scale-95"
            >
                <Menu className="h-6 w-6" />
            </button>

            {/* Mobile Backdrop */}
            {isSidebarOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black/50 z-40 transition-opacity"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Subject Sidebar */}
            <div className={`
                absolute md:static inset-y-0 left-0 z-40 
                w-80 shrink-0 border-r border-gray-200 bg-white flex flex-col h-full overflow-hidden transition-transform duration-300 ease-in-out
                ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0 md:shadow-[2px_0_8px_rgba(0,0,0,0.015)]'}
            `}>

                {/* School Branding / Header */}
                <div className="px-5 py-4 flex items-center justify-between border-b border-gray-200">
                    <div className="flex items-center gap-3 select-none">
                        <img
                            src="/landingpageassets/logo.png"
                            alt="Peak Excellence Review Center"
                            className="size-10 shrink-0 object-contain"
                            onError={(e) => { e.target.style.display = 'none' }}
                        />
                        <div className="flex flex-col leading-tight select-none">
                            <span className="text-[15px] font-black tracking-wider text-[#3B3B3B] dark:text-white uppercase font-sans">
                                PEAK
                            </span>
                            <span className="text-[12px] font-semibold tracking-wide text-[#696969] dark:text-gray-400 font-sans -mt-0.5">
                                Excellence
                            </span>
                        </div>
                    </div>
                    {/* Close button for mobile */}
                    <button
                        className="md:hidden p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                        onClick={() => setIsSidebarOpen(false)}
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Back Button + Minimal Toggle Tabs */}
                <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2">
                    <button
                        onClick={() => {
                            if (subjectInfo) {
                                if (subjectInfo.category_id && subjectInfo.subcategory_id) {
                                    if (typeof window !== "undefined") {
                                        sessionStorage.setItem("teacher_selected_cat_id", String(subjectInfo.category_id))
                                        sessionStorage.setItem("teacher_selected_sub_id", String(subjectInfo.subcategory_id))
                                    }
                                    router.push(`/teacher/modules?cat=${subjectInfo.category_id}&sub=${subjectInfo.subcategory_id}`)
                                    return
                                }
                                if (subjectInfo.category_id) {
                                    if (typeof window !== "undefined") {
                                        sessionStorage.setItem("teacher_selected_cat_id", String(subjectInfo.category_id))
                                        sessionStorage.removeItem("teacher_selected_sub_id")
                                    }
                                    router.push(`/teacher/modules?cat=${subjectInfo.category_id}`)
                                    return
                                }
                            }
                            router.push('/teacher/modules')
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200/50 bg-gray-100 text-gray-600 transition-all hover:bg-gray-200 hover:text-gray-900 shadow-sm shrink-0 cursor-pointer"
                        title="Back to Subjects"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>

                    <div className="flex bg-gray-100/70 rounded-xl p-0.5 flex-1">
                        <button
                            onClick={() => setActiveTab("modules")}
                            className={`flex-1 py-1.5 text-xs rounded-lg transition-all cursor-pointer ${
                                activeTab === "modules"
                                    ? "bg-white text-gray-700 font-semibold shadow-2xs"
                                    : "text-gray-400 hover:text-gray-600 font-medium"
                            }`}
                        >
                            Modules
                        </button>
                        <button
                            onClick={() => setActiveTab("files")}
                            className={`flex-1 py-1.5 text-xs rounded-lg transition-all cursor-pointer ${
                                activeTab === "files"
                                    ? "bg-white text-gray-700 font-semibold shadow-2xs"
                                    : "text-gray-400 hover:text-gray-600 font-medium"
                            }`}
                        >
                            Files
                        </button>
                    </div>
                </div>

                {/* Content based on activeTab */}
                {activeTab === "files" ? (
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                        <div className="flex items-center justify-between pb-1">
                            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider pl-1">
                                Files ({subjectFiles.length})
                            </span>
                        </div>

                        {subjectFiles.length === 0 ? (
                            <div className="py-16 text-center px-4">
                                <p className="text-xs font-medium text-gray-500">
                                    No files available yet in this subject.
                                </p>
                                <p className="text-[11px] text-gray-400 mt-1">
                                    Files uploaded to lessons and quizzes will appear here.
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {subjectFiles.map((file) => (
                                    <div
                                        key={file.id}
                                        className="py-2.5 first:pt-1 last:pb-1 flex flex-col gap-1 text-left"
                                    >
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setViewingFile(file)
                                                setIsSidebarOpen(false)
                                            }}
                                            className="text-blue-600 hover:text-blue-700 underline text-[13px] font-medium cursor-pointer transition-colors text-left line-clamp-1 block w-full p-0"
                                            title={file.name}
                                        >
                                            {file.name}
                                        </button>
                                        <div className="flex items-center justify-between gap-2 text-[11px] text-gray-400">
                                            <span className="truncate" title={file.source}>
                                                From: {file.source}
                                            </span>
                                            <span className="shrink-0 uppercase font-medium text-[10px] text-gray-400 tracking-wider">
                                                {file.type}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    /* Modules List Scrolling Area */
                    <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 custom-scrollbar">
                        {modules.map((module) => {
                            const visibleLessons = (module.lessons || []).filter((lesson) => 
                                shouldShowLessonInTeacherTab(lesson, "modules")
                            )
                            if (visibleLessons.length === 0) return null

                            const modParts = module.title.split(":")
                            const hasModPrefix = modParts.length > 1

                            return (
                                <div key={module.id} className="space-y-2 pb-4 border-b border-gray-100/80 last:border-0">
                                    {/* Module Header */}
                                    <div className="px-1.5 pt-0.5 pb-0.5">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                                            Module
                                        </p>
                                        <h3 className="text-[14px] text-gray-800 tracking-tight leading-normal" title={module.title}>
                                            {hasModPrefix ? (
                                                <>
                                                    <span className="font-bold text-gray-800 mr-1">{modParts[0]}:</span>
                                                    <span className="text-gray-600 font-medium">{modParts.slice(1).join(":")}</span>
                                                </>
                                            ) : (
                                                <span className="font-bold text-gray-800">{module.title}</span>
                                            )}
                                        </h3>
                                    </div>

                                    {/* Lessons Label & Inner List */}
                                    <div className="space-y-1 pl-1">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pl-2 pt-1">
                                            Lessons
                                        </p>
                                        <div className="space-y-1 pl-1">
                                        {visibleLessons.map((lesson) => {
                                            const isActive = searchParams.get("lessonId") === lesson.id.toString()
                                            const lessonParts = lesson.title.split(":")
                                            const hasLessonPrefix = lessonParts.length > 1

                                            return (
                                                <div
                                                    key={lesson.id}
                                                    onClick={() => {
                                                        const normalizedType = normalizeLessonType(lesson.lesson_type, lesson.has_pdf)
                                                        router.push(
                                                            `/teacher/modules/${subjectId}?lessonId=${lesson.id}&type=${normalizedType}`
                                                        )
                                                        setIsSidebarOpen(false)
                                                    }}
                                                    className={`
                                                        group flex items-start gap-2.5 px-3 py-2 rounded-xl transition-all cursor-pointer select-none
                                                        ${isActive 
                                                            ? 'bg-blue-50/80 border border-[#E9C46A]/40 shadow-2xs' 
                                                            : 'hover:bg-gray-50 border border-transparent'
                                                        }
                                                    `}
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-[12px] leading-snug break-words ${isActive ? 'text-[#E9C46A] font-bold' : 'text-gray-600 group-hover:text-gray-900 font-medium'}`}>
                                                            {hasLessonPrefix ? (
                                                                <>
                                                                    <span className={isActive ? "text-[#E9C46A] font-bold mr-1" : "text-gray-800 font-semibold mr-1"}>
                                                                        {lessonParts[0]}:
                                                                    </span>
                                                                    <span className={isActive ? "text-[#E9C46A]" : "text-gray-600"}>
                                                                        {lessonParts.slice(1).join(":")}
                                                                    </span>
                                                                </>
                                                            ) : (
                                                                <span>{lesson.title}</span>
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0 bg-[#f5f5f5]">
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {children}
                </div>
            </div>

            {/* Subject File Viewer Modal (teacher can download) */}
            <SubjectFileViewerModal
                file={viewingFile}
                onClose={() => setViewingFile(null)}
                isStudent={false}
            />

            <style jsx global>{`
                .custom-scrollbar {
                    scrollbar-width: thin;
                    scrollbar-color: transparent transparent;
                    transition: scrollbar-color 0.2s ease;
                }
                .custom-scrollbar:hover {
                    scrollbar-color: #cbd5e1 transparent;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                    height: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: transparent;
                    border-radius: 20px;
                    transition: background-color 0.2s ease;
                }
                .custom-scrollbar:hover::-webkit-scrollbar-thumb {
                    background-color: #cbd5e1;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background-color: #94a3b8;
                }
            `}</style>
        </div>
    )
}
