"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Loader2, ChevronLeft, Menu, X } from "lucide-react"

export default function StudentSubjectLayout({ children }) {
    const params = useParams()
    const router = useRouter()
    const searchParams = useSearchParams()
    const subjectId = params.subjectId

    const [modules, setModules] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState("modules") // modules or files
    const [isSidebarOpen, setIsSidebarOpen] = useState(false) // responsive sidebar state

    useEffect(() => {
        fetchModules()
    }, [subjectId])

    async function fetchModules() {
        try {
            const res = await fetch(`/api/student/subjects/${subjectId}/modules`)
            if (res.ok) {
                const data = await res.json()
                const fetchedModules = data.modules || []
                setModules(fetchedModules)

                // If no lesson is selected, automatically select the first available one
                if (!searchParams.get("lessonId")) {
                    for (const mod of fetchedModules) {
                        if (mod.lessons && mod.lessons.length > 0) {
                            const firstLesson = mod.lessons[0]
                            router.replace(`/student/subjects/${subjectId}?lessonId=${firstLesson.id}&type=${firstLesson.lesson_type || 'module'}`)
                            break
                        }
                    }
                }
            } else if (res.status === 403) {
                router.push("/student/subjects")
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
        <div className="flex relative h-[calc(100vh-64px)] w-full overflow-hidden bg-white">

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
                absolute md:static inset-y-0 left-0 z-50 
                w-80 shrink-0 border-r border-gray-100 bg-white flex flex-col h-full overflow-hidden transition-transform duration-300 ease-in-out
                ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0 md:shadow-none'}
            `}>

                {/* School Branding / Header */}
                <div className="p-6 pb-4 flex flex-row items-center justify-between border-b border-gray-50">
                    <div className="flex flex-col items-start">
                        <img
                            src="/assets/Peak_excellence_logo.png"
                            alt="Peak Excellence"
                            className="h-10 md:h-12 w-auto object-contain mb-2 md:mb-3"
                            onError={(e) => { e.target.style.display = 'none' }}
                        />
                        <h2 className="text-[13px] md:text-[15px] font-extrabold tracking-widest text-[#4d4d4d] uppercase font-sans">
                            PEAK EXCELLENCE
                        </h2>
                    </div>
                    {/* Close button for mobile */}
                    <button
                        className="md:hidden p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                        onClick={() => setIsSidebarOpen(false)}
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Back button & Toggle Tabs */}
                <div className="p-4 flex items-center gap-3">
                    <button
                        onClick={() => router.push('/student/subjects')}
                        className="h-7 w-7 flex items-center justify-center rounded-full bg-gray-200 text-white hover:bg-gray-300 transition-colors shrink-0"
                        title="Back to Subjects"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>

                    <div className="flex bg-gray-100/80 rounded-xl p-1 flex-1">
                        <button
                            onClick={() => setActiveTab("modules")}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === "modules" ? "bg-gray-200/60 text-gray-600 shadow-sm" : "text-gray-400 hover:text-gray-500"}`}
                        >
                            Modules
                        </button>
                        <button
                            onClick={() => setActiveTab("files")}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === "files" ? "bg-white text-gray-800 shadow-sm" : "text-gray-400 hover:text-gray-500"}`}
                        >
                            Files
                        </button>
                    </div>
                </div>

                {/* Modules List Scrolling Area */}
                <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-6 custom-scrollbar">
                    {modules.map((module) => {
                        // Split module title to bold the prefix (e.g. "Module 1:")
                        const modParts = module.title.split(":")
                        const hasModPrefix = modParts.length > 1

                        return (
                            <div key={module.id} className="space-y-3 pb-4 border-b border-gray-50/50 last:border-0">
                                {/* Module Title */}
                                <h3 className="text-[13px] text-[#8c8c8c]">
                                    {hasModPrefix ? (
                                        <>
                                            <span className="font-semibold">{modParts[0]}:</span>
                                            {modParts.slice(1).join(":")}
                                        </>
                                    ) : (
                                        <span className="font-semibold">{module.title}</span>
                                    )}
                                </h3>

                                {/* Lessons Inner List */}
                                <div className="space-y-4 pl-2 pt-2">
                                    {module.lessons?.map((lesson) => {
                                        const isActive = searchParams.get("lessonId") === lesson.id.toString()

                                        const isQuiz = lesson.title.toLowerCase().includes("quiz") || lesson.title.toLowerCase().includes("exam")
                                        const lessonParts = lesson.title.split(":")
                                        const hasLessonPrefix = lessonParts.length > 1

                                        // Render Quiz differently
                                        if (isQuiz) {
                                            return (
                                                <div
                                                    key={lesson.id}
                                                    onClick={() => {
                                                        router.push(`/student/subjects/${subjectId}?lessonId=${lesson.id}&type=${lesson.lesson_type || 'module'}`);
                                                        setIsSidebarOpen(false);
                                                    }}
                                                    className={`cursor-pointer px-4 py-2.5 rounded-xl ml-4 mr-2 transition-all duration-200 ${isActive
                                                            ? 'bg-gray-300/50 text-gray-700 shadow-sm transform scale-[1.02]'
                                                            : 'bg-gray-100 hover:bg-gray-200 text-gray-500'
                                                        }`}
                                                >
                                                    <p className="text-[13px]">
                                                        {hasLessonPrefix ? (
                                                            <>
                                                                <span className="font-bold">{lessonParts[0]}:</span>
                                                                {lessonParts.slice(1).join(":")}
                                                            </>
                                                        ) : (
                                                            <span className="font-bold">{lesson.title}</span>
                                                        )}
                                                    </p>
                                                </div>
                                            )
                                        }

                                        // Standard Lesson formatting
                                        return (
                                            <div
                                                key={lesson.id}
                                                onClick={() => {
                                                    router.push(`/student/subjects/${subjectId}?lessonId=${lesson.id}&type=${lesson.lesson_type || 'module'}`);
                                                    setIsSidebarOpen(false);
                                                }}
                                                className={`cursor-pointer transition-colors px-2 py-1 -mx-2 rounded-lg ${isActive ? 'bg-[#fef5f6] text-[#ba5a62]' : 'hover:bg-gray-50'}`}
                                            >
                                                <p className={`text-[13px] ${isActive ? 'text-[#ba5a62]' : 'text-[#a0a0a0]'}`}>
                                                    {hasLessonPrefix ? (
                                                        <>
                                                            <span className={`font-bold ${isActive ? 'text-[#ba5a62]' : 'text-[#7a7a7a]'}`}>{lessonParts[0]}:</span>
                                                            {lessonParts.slice(1).join(":")}
                                                        </>
                                                    ) : (
                                                        <span className={`font-bold ${isActive ? 'text-[#ba5a62]' : 'text-[#7a7a7a]'}`}>{lesson.title}</span>
                                                    )}
                                                </p>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Main Content Area (Builder View) */}
            <div className="flex-1 overflow-y-auto bg-white flex flex-col w-full h-full relative">
                {children}
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: #e5e7eb;
                    border-radius: 20px;
                }
            `}</style>
        </div>
    )
}
