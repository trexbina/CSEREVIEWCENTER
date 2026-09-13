// this tells nextjs to run this layout in the browser
"use client"

// helper functions from react to store states
import { useState, use } from "react"
import { Menu, X } from "lucide-react"

// sidebar toolbar and content layout for the mock exam builder screen
export default function MockExamBuilderLayout({ children, params }) {
    const unwrappedParams = use(params)
    const examId = unwrappedParams?.examId
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)

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

            {/* Toolbar Sidebar (Emptied and ready for toolbar items) */}
            <aside className={`
                absolute md:static inset-y-0 left-0 z-50 
                w-80 shrink-0 border-r border-border bg-card flex flex-col h-full overflow-hidden shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-transform duration-300 ease-in-out
                ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0 md:shadow-none'}
            `}>
                {/* Mobile close button header */}
                <div className="md:hidden p-3 border-b border-border flex justify-end">
                    <button
                        className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted cursor-pointer"
                        onClick={() => setIsSidebarOpen(false)}
                        aria-label="Close sidebar"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Toolbar content area */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {/* Empty toolbar ready for tools */}
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
