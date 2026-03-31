"use client"

import { useRef, useState } from "react"
import { Maximize, Minimize, ZoomIn, ZoomOut, Loader2 } from "lucide-react"

export default function CustomPdfViewer({ url }) {
    const containerRef = useRef(null)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [scale, setScale] = useState(100)
    const [loading, setLoading] = useState(true)

    // Append parameters to hide browser PDF toolbar
    const pdfUrl = `${url}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`

    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen().catch(err => {
                console.error(`Fullscreen error: ${err.message}`)
            })
            setIsFullscreen(true)
        } else {
            document.exitFullscreen()
            setIsFullscreen(false)
        }
    }

    function handleZoomIn() {
        setScale(prev => Math.min(200, prev + 25))
    }

    function handleZoomOut() {
        setScale(prev => Math.max(50, prev - 25))
    }

    return (
        <div ref={containerRef} className="flex flex-col h-full w-full bg-[#333] relative select-none"
             onContextMenu={(e) => e.preventDefault()}
        >
            {/* Custom Toolbar */}
            <div className="flex items-center justify-between px-5 py-3 bg-[#2b2b2b] border-b border-[#1a1a1a] text-white shrink-0 shadow-lg z-20">
                {/* Left: Document Label */}
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                    <span className="text-sm font-semibold text-white/80 tracking-wide">
                        PDF Document
                    </span>
                </div>

                {/* Center: Zoom Controls */}
                <div className="flex items-center gap-1 bg-black/30 rounded-lg p-1 border border-white/10">
                    <button 
                        onClick={handleZoomOut}
                        disabled={scale <= 50}
                        className="p-1.5 hover:bg-white/10 rounded transition-colors disabled:opacity-30"
                        title="Zoom Out"
                    >
                        <ZoomOut className="w-4 h-4 text-white/90" />
                    </button>
                    <span className="text-xs font-bold text-white/80 w-12 text-center select-none tabular-nums">
                        {scale}%
                    </span>
                    <button 
                        onClick={handleZoomIn}
                        disabled={scale >= 200}
                        className="p-1.5 hover:bg-white/10 rounded transition-colors disabled:opacity-30"
                        title="Zoom In"
                    >
                        <ZoomIn className="w-4 h-4 text-white/90" />
                    </button>
                </div>

                {/* Right: Fullscreen */}
                <button 
                    onClick={toggleFullscreen}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors border border-white/10"
                    title="Toggle Fullscreen"
                >
                    {isFullscreen 
                        ? <Minimize className="w-4 h-4 text-white" />
                        : <Maximize className="w-4 h-4 text-white" />
                    }
                </button>
            </div>

            {/* PDF Content Area */}
            <div className="flex-1 overflow-auto relative bg-[#525659]" style={{ minHeight: 'calc(100vh - 120px)' }}>
                {loading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#525659] z-10">
                        <Loader2 className="w-8 h-8 animate-spin text-white/50" />
                        <p className="text-white/60 text-sm font-medium">Loading PDF...</p>
                    </div>
                )}
                <div 
                    className="w-full h-full origin-top-left relative"
                    style={{ 
                        transform: `scale(${scale / 100})`, 
                        transformOrigin: 'top center',
                        width: scale > 100 ? `${10000 / scale}%` : '100%',
                        minHeight: `${10000 / scale}%`,
                    }}
                >
                    {/* Transparent overlay to block right-click / Save As inside the iframe */}
                    <div 
                        className="absolute inset-0 z-10"
                        onContextMenu={(e) => e.preventDefault()}
                        style={{ background: 'transparent' }}
                    />
                    <iframe
                        src={pdfUrl}
                        title="PDF Viewer"
                        className="w-full h-full border-none"
                        style={{ minHeight: 'calc(100vh - 120px)' }}
                        onLoad={() => setLoading(false)}
                    />
                </div>
            </div>
        </div>
    )
}
