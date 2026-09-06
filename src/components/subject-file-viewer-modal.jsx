"use client"

import dynamic from "next/dynamic"
import { Loader2, X } from "lucide-react"

const CustomPdfViewer = dynamic(() => import("@/components/custom-pdf-viewer"), {
    ssr: false,
    loading: () => (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <p className="text-gray-500 text-sm font-medium">Loading document...</p>
        </div>
    )
})

export default function SubjectFileViewerModal({ file, onClose, isStudent = false }) {
    if (!file?.url) return null

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose()
            }}
        >
            <div className="relative w-full max-w-4xl h-[85vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">
                {/* Modal Header */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 bg-gray-50/90">
                    <div className="flex flex-col min-w-0 pr-4">
                        <span className="text-sm font-semibold text-gray-800 truncate" title={file.name}>
                            {file.name}
                        </span>
                        {file.source && (
                            <span className="text-[11px] text-gray-400 truncate" title={file.source}>
                                From: {file.source}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        {/* Admins can download, students CANNOT */}
                        {!isStudent && (
                            <a
                                href={file.url}
                                download={file.name || "download"}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors shadow-2xs cursor-pointer"
                            >
                                Download
                            </a>
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 hover:bg-gray-200/80 text-gray-500 hover:text-gray-800 rounded-lg transition-colors cursor-pointer"
                            title="Close"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Viewer Body */}
                <div className="flex-1 w-full h-full min-h-0 bg-gray-100 relative overflow-hidden">
                    {file.type === "pdf" ? (
                        <CustomPdfViewer url={file.url} isStudent={isStudent} />
                    ) : file.type === "image" ? (
                        <div
                            className="w-full h-full flex items-center justify-center p-4 bg-gray-900/5 overflow-auto select-none"
                            onContextMenu={(e) => isStudent && e.preventDefault()}
                        >
                            <img
                                src={file.url}
                                alt={file.name}
                                className="max-h-full max-w-full object-contain rounded-lg shadow-sm pointer-events-auto"
                                draggable={!isStudent}
                            />
                        </div>
                    ) : file.type === "video" ? (
                        <div
                            className="w-full h-full flex items-center justify-center p-4 bg-black overflow-hidden"
                            onContextMenu={(e) => isStudent && e.preventDefault()}
                        >
                            <video
                                src={file.url}
                                controls
                                controlsList={isStudent ? "nodownload noplaybackrate" : undefined}
                                disablePictureInPicture={isStudent}
                                className="max-h-full max-w-full rounded-lg shadow-lg"
                            />
                        </div>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center p-6 text-center">
                            <CustomPdfViewer url={file.url} isStudent={isStudent} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
