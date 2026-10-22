// this tells nextjs to run this layout in the browser
"use client"

// helper functions from react to store states
import { useState, use } from "react"
import { useRouter } from "next/navigation"
import { Menu, X, ChevronLeft, Settings } from "lucide-react"
import OcrQuestionScanner from "@/components/ocr-question-scanner"

// sidebar toolbar and content layout for the mock exam builder screen
export default function MockExamBuilderLayout({ children, params }) {
    const unwrappedParams = use(params)
    const examId = unwrappedParams?.examId
    const router = useRouter()
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)

    function checkUnsavedChanges() {
        if (typeof window !== "undefined") {
            const hasQuizChanges = typeof window.__peak_is_quiz_dirty === "function"
                ? window.__peak_is_quiz_dirty()
                : !!window.__peak_has_unsaved_quiz

            if (hasQuizChanges) {
                const confirmed = window.confirm("You have unsaved changes that may not be saved. Are you sure you want to leave?")
                if (confirmed) {
                    window.__peak_has_unsaved_quiz = false
                    if (typeof window.__peak_is_quiz_dirty === "function") {
                        window.__peak_is_quiz_dirty = () => false
                    }
                    return true
                }
                return false
            }
        }
        return true
    }

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

            {/* Toolbar Sidebar */}
            <aside className={`
                absolute md:static inset-y-0 left-0 z-50 
                w-80 shrink-0 border-r border-border bg-card flex flex-col h-full overflow-hidden shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-transform duration-300 ease-in-out
                ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0 md:shadow-none'}
            `}>
                {/* School Branding / Header */}
                <div className="p-6 pb-4 flex items-center justify-between border-b border-border">
                    <div className="flex flex-col items-start gap-1">
                        <img
                            src="/landingpageassets/logo.png"
                            alt="CSE Review System"
                            className="h-10 md:h-12 w-auto object-contain"
                            onError={(e) => { e.target.style.display = 'none' }}
                        />
                        <h2 className="text-xs md:text-sm font-extrabold tracking-widest text-foreground uppercase font-sans mt-2">
                            CSE REVIEW SYSTEM
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

                {/* Title Action & Back Button */}
                <div className="p-3 px-4 flex items-center justify-between gap-2 border-b border-border/40">
                    <div className="flex items-center gap-2 min-w-0">
                        <button
                            onClick={() => {
                                if (!checkUnsavedChanges()) return
                                router.push('/admin/mock-exams')
                            }}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/80 bg-muted/60 text-muted-foreground transition-all hover:bg-muted hover:text-foreground shadow-2xs shrink-0 cursor-pointer"
                            title="Back to Mock Exams List"
                        >
                            <ChevronLeft className="h-3.5 w-3.5" />
                        </button>
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground truncate">
                            Builder Toolbox
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            if (typeof window !== "undefined") {
                                if (typeof window.__peak_open_settings === "function") {
                                    window.__peak_open_settings()
                                } else {
                                    window.dispatchEvent(new CustomEvent("peak:open-settings"))
                                }
                            }
                        }}
                        className="p-1.5 rounded-xl border border-border/80 bg-card hover:bg-muted/60 text-muted-foreground hover:text-foreground text-xs font-semibold shadow-2xs transition-all cursor-pointer flex items-center justify-center shrink-0"
                        title="Exam Settings"
                    >
                        <Settings className="h-4 w-4" />
                    </button>
                </div>

                {/* Toolbar content area */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    <OcrQuestionScanner />
                </div>
            </aside>

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
