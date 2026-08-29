// this tells nextjs to run this layout in the browser
"use client"

// helper functions from react to store states and run actions
import { useState, useEffect, use } from "react"

// router helper to navigate between mock exams
import { useRouter } from "next/navigation"

// icons for sidebar, search, and header actions
import { 
    Loader2, 
    FileText, 
    Search, 
    Maximize, 
    Minimize, 
    Bell, 
    Menu, 
    X, 
    CheckCircle2, 
    Lock 
} from "lucide-react"

// sidebar and top bar layout for the mock exam builder screen
export default function MockExamBuilderLayout({ children, params }) {
    // unwrap the exam id from the url
    const unwrappedParams = use(params)
    const examId = unwrappedParams?.examId
    const router = useRouter()

    // states to hold the mock exams list, loading state, and search query
    const [exams, setExams] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const [isFullscreen, setIsFullscreen] = useState(false)

    // download the list of all mock exams when the page opens
    useEffect(() => {
        fetchExams()
    }, [])

    // fetch all mock exams from the database
    async function fetchExams() {
        try {
            setLoading(true)
            const res = await fetch("/api/admin/mock-exams")
            if (res.ok) {
                const data = await res.json()
                setExams(data.exams || [])
            }
        } catch (error) {
            console.error("Failed to fetch mock exams", error)
        } finally {
            setLoading(false)
        }
    }

    // toggle fullscreen mode on and off
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {})
            setIsFullscreen(true)
        } else {
            document.exitFullscreen().catch(() => {})
            setIsFullscreen(false)
        }
    }

    const filteredExams = exams.filter(exam => {
        const query = searchQuery.toLowerCase()
        return (
            exam.title?.toLowerCase().includes(query) ||
            exam.exam_code?.toLowerCase().includes(query)
        )
    })

    return (
        <div className="flex relative h-screen w-full overflow-hidden bg-background">

            {/* Mobile Sidebar Toggle Button */}
            <button
                onClick={() => setIsSidebarOpen(true)}
                className="md:hidden absolute bottom-6 right-6 z-40 h-14 w-14 bg-[#ba5a62] text-white rounded-full shadow-2xl shadow-black/30 flex items-center justify-center hover:bg-[#a64e56] transition-transform active:scale-95 cursor-pointer"
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

            {/* Mock Exams Sidebar */}
            <div className={`
                absolute md:static inset-y-0 left-0 z-50 
                w-80 shrink-0 border-r border-border bg-card flex flex-col h-full overflow-hidden shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-transform duration-300 ease-in-out
                ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0 md:shadow-none'}
            `}>

                {/* School Branding / Header */}
                <div className="p-6 pb-4 flex items-center justify-between border-b border-border">
                    <div className="flex flex-col items-start gap-1">
                        <img
                            src="/landingpageassets/logo.png"
                            alt="Peak Excellence"
                            className="h-10 md:h-12 w-auto object-contain"
                            onError={(e) => { e.target.style.display = 'none' }}
                        />
                        <h2 className="text-xs md:text-sm font-extrabold tracking-widest text-foreground uppercase font-sans mt-2">
                            PEAK EXCELLENCE
                        </h2>
                    </div>
                    {/* Close button for mobile */}
                    <button
                        className="md:hidden p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted cursor-pointer"
                        onClick={() => setIsSidebarOpen(false)}
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Title Action */}
                <div className="p-4 border-b border-border flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground truncate">
                        Mock Exams
                    </span>
                    <span className="bg-muted border border-border text-muted-foreground px-2 py-0.5 rounded-full text-xs font-semibold font-mono">
                        {exams.length}
                    </span>
                </div>

                {/* Search Bar */}
                <div className="p-3 border-b border-border bg-muted/20">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Filter mock exams..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-1.5 bg-background border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-slate-400 transition-all shadow-2xs"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Mock Exams List */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                    {loading ? (
                        <div className="flex items-center justify-center py-16 text-muted-foreground">
                            <Loader2 className="h-6 w-6 animate-spin text-[#E9C46A]" />
                        </div>
                    ) : filteredExams.length === 0 ? (
                        <div className="text-center py-16 text-muted-foreground text-xs font-medium px-4">
                            {searchQuery ? "No matching mock exams found." : "No mock exams created yet."}
                        </div>
                    ) : (
                        filteredExams.map((exam) => {
                            const isCurrentActive = exam.id?.toString() === examId?.toString()
                            const isLocked = exam.unlock_date && new Date(exam.unlock_date).getTime() > Date.now()

                            return (
                                <div
                                    key={exam.id}
                                    onClick={() => {
                                        if (!isCurrentActive) {
                                            router.replace(`/admin/mock-exams/${exam.id}`)
                                            setIsSidebarOpen(false)
                                        }
                                    }}
                                    className={`
                                        group relative p-2.5 rounded-xl border transition-all cursor-pointer select-none
                                        ${isCurrentActive 
                                            ? 'bg-muted/70 border-border shadow-2xs' 
                                            : 'bg-card border-border/70 hover:border-border hover:bg-muted/40 shadow-2xs'
                                        }
                                    `}
                                >
                                    <div className="flex items-center gap-3">
                                        {/* Icon Container */}
                                        <div className={`size-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                                            isCurrentActive 
                                                ? 'bg-[#E9C46A] text-slate-950 shadow-2xs' 
                                                : 'bg-muted text-muted-foreground group-hover:text-foreground'
                                        }`}>
                                            <FileText className="h-4 w-4" />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            {/* Exam Title */}
                                            <h3 
                                                className={`text-xs font-bold leading-snug truncate ${
                                                    isCurrentActive ? 'text-foreground font-extrabold' : 'text-foreground/90 group-hover:text-foreground'
                                                }`} 
                                                title={exam.title}
                                            >
                                                {exam.title || "Untitled Mock Exam"}
                                            </h3>

                                            {/* Code and Status row */}
                                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-muted text-muted-foreground uppercase tracking-wider font-mono">
                                                    {exam.exam_code || "NO CODE"}
                                                </span>
                                                <span className={`text-[10px] font-semibold flex items-center gap-1 ${
                                                    isLocked ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                                                }`}>
                                                    <span className={`size-1.5 rounded-full ${isLocked ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                                                    {isLocked ? "Locked" : "Active"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>

            {/* Main Content Area (Builder) */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-background">
                {children}
            </div>

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
