"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Maximize, Minimize, ZoomIn, ZoomOut, Loader2 } from "lucide-react"
import { Document, Page, pdfjs } from "react-pdf"

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
).toString()

export default function CustomPdfViewer({ url, watermarkText: userName = "", isStudent = false }) {
    const containerRef = useRef(null)
    const viewerRef = useRef(null)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [scale, setScale] = useState(100)
    const [loading, setLoading] = useState(true)
    const [numPages, setNumPages] = useState(0)
    const [loadError, setLoadError] = useState("")
    const [viewerWidth, setViewerWidth] = useState(0)
    const [qualityTier, setQualityTier] = useState(1)
    const watermarkText = useMemo(() => {
        const companyName = "Peak-Execellence-Review-Center-Inc"
        const safeUserName = String(userName || "").trim().replace(/\s+/g, "")
        return safeUserName
            ? `Property of ${companyName}-${safeUserName}`
            : `Property of ${companyName}`
    }, [userName])

    useEffect(() => {
        setLoading(true)
        setLoadError("")
        setNumPages(0)
    }, [url])

    useEffect(() => {
        if (!isStudent) return

        const clearSelection = () => {
            const selection = window.getSelection()
            if (selection?.rangeCount) selection.removeAllRanges()
        }

        document.addEventListener("selectionchange", clearSelection)
        return () => document.removeEventListener("selectionchange", clearSelection)
    }, [isStudent])

    useEffect(() => {
        if (!viewerRef.current) return

        const updateWidth = () => {
            if (!viewerRef.current) return
            setViewerWidth(Math.floor(viewerRef.current.clientWidth))
        }

        updateWidth()

        const resizeObserver = new ResizeObserver(updateWidth)
        resizeObserver.observe(viewerRef.current)
        window.addEventListener("resize", updateWidth)

        return () => {
            resizeObserver.disconnect()
            window.removeEventListener("resize", updateWidth)
        }
    }, [])

    useEffect(() => {
        if (typeof window === "undefined") return

        const ua = window.navigator.userAgent || ""
        const isMobileUa = /Android|iPhone|iPad|iPod|Mobile/i.test(ua)
        const isCoarsePointer = window.matchMedia?.("(pointer: coarse)")?.matches ?? false
        const cores = window.navigator.hardwareConcurrency || 8
        const memory = window.navigator.deviceMemory || 8

        const shouldUseMediumQuality = isMobileUa || isCoarsePointer || cores <= 6 || memory <= 4
        setQualityTier(shouldUseMediumQuality ? 2 : 1)
    }, [])

    const pageWidth = useMemo(() => {
        if (!viewerWidth) return undefined
        const sidePadding = qualityTier === 1 ? 32 : 48
        return Math.max(320, viewerWidth - sidePadding)
    }, [viewerWidth, qualityTier])

    const pageDevicePixelRatio = useMemo(() => {
        if (typeof window === "undefined") return qualityTier === 1 ? 2.4 : 1.7

        const deviceDpr = window.devicePixelRatio || 1
        const baseTarget = qualityTier === 1 ? 2.4 : 1.7
        const dprCap = qualityTier === 1 ? 3 : 2.25
        const zoomPenalty = scale >= 150 ? 0.2 : 0

        const target = Math.max(deviceDpr, baseTarget) - zoomPenalty
        return Math.min(dprCap, Math.max(1.25, target))
    }, [qualityTier, scale])

    function onDocumentLoadSuccess({ numPages: loadedPages }) {
        setNumPages(loadedPages)
        setLoading(false)
    }

    function onDocumentLoadError(error) {
        console.error("PDF load error:", error)
        setLoadError("Failed to load PDF file.")
        setLoading(false)
    }

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
        <div
            ref={containerRef}
            className="flex flex-col h-full w-full bg-white relative select-none"
            onContextMenu={(e) => isStudent && e.preventDefault()}
            onCopy={(e) => isStudent && e.preventDefault()}
            onCut={(e) => isStudent && e.preventDefault()}
            onDragStart={(e) => isStudent && e.preventDefault()}
            onKeyDown={(e) => {
                if (!isStudent) return
                if ((e.ctrlKey || e.metaKey) && ["c", "s", "p", "a"].includes(e.key.toLowerCase())) {
                    e.preventDefault()
                }
            }}
        >
            <div className="flex items-center justify-between px-5 py-3 bg-[#2b2b2b] border-b border-[#1a1a1a] text-white shrink-0 shadow-lg z-20">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                    <span className="text-sm font-semibold text-white/80 tracking-wide">
                        PDF Document
                    </span>
                </div>

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

                {!isStudent && (
                    <span className="hidden sm:inline-flex rounded-md border border-white/15 bg-white/5 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-white/80">
                        {qualityTier === 1 ? "Adaptive Q1" : "Adaptive Q2"}
                    </span>
                )}

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

            <div
                className="flex-1 overflow-auto relative bg-[#f5f5f5] min-h-0"
                onContextMenu={(e) => isStudent && e.preventDefault()}
            >
                {loading && (
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#f5f5f5] z-10">
                        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                        <p className="text-gray-500 text-sm font-medium">Loading PDF...</p>
                    </div>
                )}

                {loadError ? (
                    <div className="absolute inset-0 flex items-center justify-center p-6">
                        <p className="text-sm font-medium text-red-600">{loadError}</p>
                    </div>
                ) : (
                    <div ref={viewerRef} className="relative w-full min-h-full">
                        <Document
                            file={url}
                            onLoadSuccess={onDocumentLoadSuccess}
                            onLoadError={onDocumentLoadError}
                            loading={null}
                            className="w-full flex flex-col items-center gap-4 py-4"
                        >
                            {Array.from({ length: numPages }, (_, index) => (
                                <div
                                    key={`page-${index + 1}`}
                                    className="shadow-[0_4px_24px_rgba(0,0,0,0.1)] rounded overflow-hidden"
                                    onContextMenu={(e) => isStudent && e.preventDefault()}
                                >
                                    <Page
                                        pageNumber={index + 1}
                                        width={pageWidth}
                                        scale={scale / 100}
                                        devicePixelRatio={pageDevicePixelRatio}
                                        renderMode="canvas"
                                        renderTextLayer={false}
                                        renderAnnotationLayer={false}
                                        className={isStudent ? "pointer-events-none select-none" : "select-none"}
                                    />
                                </div>
                            ))}
                        </Document>

                        <div className="pointer-events-none absolute inset-0 overflow-hidden select-none z-20">
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div
                                    className="rotate-[-22deg] whitespace-nowrap text-center text-[clamp(13px,1.3vw,18px)] font-semibold tracking-[0.18em] uppercase"
                                    style={{ color: "#111111", opacity: 0.07 }}
                                >
                                    {watermarkText}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
