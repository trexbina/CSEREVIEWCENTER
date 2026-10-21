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
    const [isExpanded, setIsExpanded] = useState(false)
    const [scale, setScale] = useState(100)
    const [loading, setLoading] = useState(true)
    const [numPages, setNumPages] = useState(0)
    const [loadError, setLoadError] = useState("")
    const [viewerWidth, setViewerWidth] = useState(0)
    const [watermarkConfig, setWatermarkConfig] = useState({
        enabled: true,
        template: "{name} - {email}",
        opacity: 0.15,
        size: "medium",
        count: 1,
        userEmail: ""
    })
    const qualityTier = 1 // Default High Quality Tier
    const enhanceImage = true // Default High Quality Image Enhancement

    // Load active watermark rules from settings
    useEffect(() => {
        let isMounted = true
        fetch("/api/security/settings")
            .then(res => res.json())
            .then(data => {
                if (isMounted && data?.watermark) {
                    setWatermarkConfig({
                        enabled: data.watermark.enabled ?? true,
                        template: data.watermark.template || "{name} - {email}",
                        opacity: data.watermark.opacity ?? 0.15,
                        size: data.watermark.size || "medium",
                        count: Math.min(3, Math.max(1, parseInt(data.watermark.count, 10) || 1)),
                        userEmail: data.user?.email || ""
                    })
                }
            })
            .catch(() => {})
        return () => { isMounted = false }
    }, [])

    const watermarkText = useMemo(() => {
        if (!watermarkConfig.enabled) return ""
        const displayName = userName || "Student"
        const email = watermarkConfig.userEmail || ""
        const dateStr = new Date().toISOString().split("T")[0]

        return watermarkConfig.template
            .replace(/{name}/gi, displayName)
            .replace(/{email}/gi, email)
            .replace(/{date}/gi, dateStr)
            || displayName
    }, [userName, watermarkConfig])

    const watermarkOpacity = watermarkConfig.opacity ?? 0.15

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

    const computedWidth = useMemo(() => {
        if (!viewerWidth) return undefined
        const baseWidth = Math.max(320, viewerWidth - 48)
        return Math.round(baseWidth * (scale / 100))
    }, [viewerWidth, scale])

    const pageDevicePixelRatio = useMemo(() => {
        if (typeof window === "undefined") return 2
        return Math.min(3, Math.max(2, window.devicePixelRatio || 2))
    }, [])

    const maxZoom = 200

    useEffect(() => {
        if (scale > maxZoom) {
            setScale(maxZoom)
        }
    }, [maxZoom, scale])

    useEffect(() => {
        const handleFsChange = () => {
            if (document.fullscreenElement === containerRef.current) {
                setIsFullscreen(true)
            } else {
                setIsFullscreen(false)
            }
        }
        document.addEventListener("fullscreenchange", handleFsChange)
        return () => document.removeEventListener("fullscreenchange", handleFsChange)
    }, [])

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
        if (document.fullscreenElement === containerRef.current) {
            document.exitFullscreen().catch(() => {})
            setIsFullscreen(false)
            setIsExpanded(false)
        } else {
            if (containerRef.current?.requestFullscreen) {
                containerRef.current.requestFullscreen().then(() => {
                    setIsFullscreen(true)
                }).catch(() => {
                    setIsExpanded(prev => !prev)
                })
            } else {
                setIsExpanded(prev => !prev)
            }
        }
    }

    function handleZoomIn() {
        setScale(prev => Math.min(maxZoom, prev + 25))
    }

    function handleZoomOut() {
        setScale(prev => Math.max(50, prev - 25))
    }

    return (
        <div
            ref={containerRef}
            className={`flex flex-col h-full w-full bg-white relative select-none ${
                isExpanded ? 'fixed inset-0 z-[100] h-screen w-screen' : ''
            }`}
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
                {/* Zoom Controls on Left Side */}
                <div className="flex items-center gap-1 bg-black/30 rounded-lg p-1 border border-white/10">
                    <button
                        onClick={handleZoomOut}
                        disabled={scale <= 50}
                        className="p-1.5 hover:bg-white/10 rounded transition-colors disabled:opacity-30 cursor-pointer"
                        title="Zoom Out"
                    >
                        <ZoomOut className="w-4 h-4 text-white/90" />
                    </button>
                    <span className="text-xs font-bold text-white/80 w-12 text-center select-none tabular-nums">
                        {scale}%
                    </span>
                    <button
                        onClick={handleZoomIn}
                        disabled={scale >= maxZoom}
                        className="p-1.5 hover:bg-white/10 rounded transition-colors disabled:opacity-30 cursor-pointer"
                        title="Zoom In"
                    >
                        <ZoomIn className="w-4 h-4 text-white/90" />
                    </button>
                </div>

                {/* PDF Fullscreen Button on Right Side */}
                <button
                    onClick={toggleFullscreen}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors border border-white/10 cursor-pointer"
                    title="Toggle Fullscreen"
                >
                    {isFullscreen || isExpanded
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
                                    key={`page-${index + 1}-${computedWidth}`}
                                    className="relative shadow-[0_4px_24px_rgba(0,0,0,0.1)] rounded overflow-hidden transition-all duration-150"
                                    style={{ width: computedWidth ? `${computedWidth}px` : 'auto' }}
                                    onContextMenu={(e) => isStudent && e.preventDefault()}
                                >
                                    <Page
                                        pageNumber={index + 1}
                                        width={computedWidth}
                                        devicePixelRatio={pageDevicePixelRatio}
                                        canvasBackground="#ffffff"
                                        renderMode="canvas"
                                        renderTextLayer={false}
                                        renderAnnotationLayer={false}
                                        className={[
                                            "pdf-page",
                                            isStudent ? "pointer-events-none select-none" : "select-none"
                                        ].join(" ")}
                                    />

                                    <div className="pointer-events-none absolute inset-0 overflow-hidden select-none z-10">
                                        {Array.from({ length: watermarkConfig.count || 1 }).map((_, stampIdx) => {
                                            const totalCount = watermarkConfig.count || 1
                                            const topPercent =
                                                totalCount === 1 ? "50%" :
                                                totalCount === 2 ? (stampIdx === 0 ? "28%" : "72%") :
                                                (stampIdx === 0 ? "20%" : stampIdx === 1 ? "50%" : "80%")

                                            const fontSizeClamped =
                                                watermarkConfig.size === "small" || watermarkConfig.size === "1" || watermarkConfig.size === 1
                                                    ? "clamp(13px, 1.4vw, 20px)"
                                                    : watermarkConfig.size === "large" || watermarkConfig.size === "3" || watermarkConfig.size === 3
                                                    ? "clamp(24px, 3.2vw, 44px)"
                                                    : "clamp(18px, 2.2vw, 32px)"

                                            return (
                                                <div
                                                    key={stampIdx}
                                                    className="absolute inset-x-0 flex items-center justify-center -translate-y-1/2"
                                                    style={{ top: topPercent }}
                                                >
                                                    <div
                                                        className="rotate-[-22deg] whitespace-nowrap text-center font-semibold tracking-[0.18em] uppercase select-none"
                                                        style={{
                                                            color: "#111111",
                                                            opacity: watermarkOpacity,
                                                            fontSize: fontSizeClamped
                                                        }}
                                                    >
                                                        {watermarkText}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))}
                        </Document>
                    </div>
                )}
            </div>
        </div>
    )
}
