"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { EyeOff, ShieldAlert, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

/**
 * SecurityShield – Zero-Latency High-Security Anti-Capture & Deterrence Layer.
 * Minimalist Plain White Glassmorphism Design with System Primary Button.
 */
export function SecurityShield({
    children,
    blurOnFocusLoss = true,
    blurOnMouseLeave = false,
    allowInputCopy = true,
    blockDevTools = false,
    redirectToOnDevTools = "",
}) {
    const router = useRouter()
    const [isBlurred, setIsBlurred] = useState(false)
    const [isDestroyed, setIsDestroyed] = useState(false)
    const blurTimeoutRef = useRef(null)
    const isRedirectingRef = useRef(false)

    useEffect(() => {
        // Synchronous instant shield activator (0ms response time before OS compositor grabs frame)
        const triggerShieldSync = () => {
            document.documentElement.classList.add("shield-active")
            setIsBlurred(true)
        }

        const releaseShieldSync = () => {
            if (isDestroyed) return
            document.documentElement.classList.remove("shield-active")
            setIsBlurred(false)
        }

        /* ──────── 8. Anti-debugging & Instant Frontend Destruction ──────────── */
        const triggerDestructionAndRedirect = () => {
            // Immediate synchronous wipe of child DOM to prevent DevTools inspection/source extraction
            setIsDestroyed(true)
            document.documentElement.classList.add("shield-active")

            try {
                // Wipe session storage indicators or state if needed
                const contentEl = document.getElementById("security-shield-content")
                if (contentEl) {
                    contentEl.innerHTML = ""
                }
            } catch {
                // Ignore DOM manipulation errors
            }

            if (!isRedirectingRef.current) {
                isRedirectingRef.current = true
                if (redirectToOnDevTools) {
                    setTimeout(() => {
                        if (typeof window !== "undefined" && window.location.pathname !== redirectToOnDevTools) {
                            window.location.replace(redirectToOnDevTools)
                        }
                    }, 1200)
                }
            }
        }

        /* ───────────────── 1. Block Right-Click ───────────────── */
        const blockContext = (e) => {
            e.preventDefault()
            e.stopPropagation()
            return false
        }

        /* ────────── 2. Instant Keyboard Interception ──────────── */
        const handleKeyDown = (e) => {
            const isInput =
                e.target instanceof HTMLInputElement ||
                e.target instanceof HTMLTextAreaElement ||
                e.target?.isContentEditable

            const key = (e.key || "").toLowerCase()
            const code = (e.code || "").toLowerCase()
            const ctrl = e.ctrlKey || e.metaKey

            // A. INSTANT SCREENSHOT TRIGGERS (Windows Key / Meta / PrintScreen)
            if (
                e.key === "Meta" ||
                e.key === "OS" ||
                code.includes("meta") ||
                code.includes("os") ||
                e.keyCode === 91 ||
                e.keyCode === 92 ||
                e.keyCode === 93 ||
                e.key === "PrintScreen" ||
                code === "printscreen" ||
                e.keyCode === 44
            ) {
                triggerShieldSync()

                // Flush OS clipboard
                if (navigator?.clipboard?.writeText) {
                    navigator.clipboard.writeText("").catch(() => { })
                }
                return
            }

            // B. F12 (DevTools)
            if (e.key === "F12" || code === "f12" || e.keyCode === 123) {
                e.preventDefault()
                e.stopPropagation()
                e.stopImmediatePropagation()
                if (blockDevTools) {
                    triggerDestructionAndRedirect()
                }
                return false
            }

            // C. Ctrl+P / Cmd+P (Print)
            if (ctrl && (key === "p" || code === "keyp" || e.keyCode === 80)) {
                e.preventDefault()
                e.stopPropagation()
                e.stopImmediatePropagation()
                return false
            }

            // D. Ctrl+S / Cmd+S (Save)
            if (ctrl && (key === "s" || code === "keys" || e.keyCode === 83)) {
                e.preventDefault()
                e.stopPropagation()
                e.stopImmediatePropagation()
                return false
            }

            // E. Ctrl+U / Cmd+U (View Source)
            if (ctrl && (key === "u" || code === "keyu" || e.keyCode === 85)) {
                e.preventDefault()
                e.stopPropagation()
                e.stopImmediatePropagation()
                if (blockDevTools) {
                    triggerDestructionAndRedirect()
                }
                return false
            }

            // F. Ctrl+Shift+I / J / C (Inspect / Console / Element Picker)
            if (
                ctrl &&
                e.shiftKey &&
                (
                    ["i", "j", "c"].includes(key) ||
                    ["keyi", "keyj", "keyc"].includes(code)
                )
            ) {
                e.preventDefault()
                e.stopPropagation()
                e.stopImmediatePropagation()
                if (blockDevTools) {
                    triggerDestructionAndRedirect()
                }
                return false
            }

            // G. Ctrl+C, Ctrl+X, Ctrl+A, Ctrl+F (Copy, Cut, Select All, Find)
            if (
                ctrl &&
                (
                    ["c", "x", "a", "f"].includes(key) ||
                    ["keyc", "keyx", "keya", "keyf"].includes(code)
                )
            ) {
                if (!isInput || !allowInputCopy) {
                    e.preventDefault()
                    e.stopPropagation()
                    e.stopImmediatePropagation()
                    return false
                }
            }
        }

        const handleKeyUp = (e) => {
            const code = (e.code || "").toLowerCase()
            if (
                e.key === "PrintScreen" ||
                code === "printscreen" ||
                e.keyCode === 44
            ) {
                triggerShieldSync()
                if (navigator?.clipboard?.writeText) {
                    navigator.clipboard.writeText("").catch(() => { })
                }
            }
        }

        /* ────────── 3. Block Drag & Drop ──────────── */
        const blockDrag = (e) => {
            e.preventDefault()
            e.stopPropagation()
            return false
        }

        /* ────────── 4. Block Global Copy & Cut Events ──────────── */
        const blockClipboard = (e) => {
            const isInput =
                e.target instanceof HTMLInputElement ||
                e.target instanceof HTMLTextAreaElement ||
                e.target?.isContentEditable

            if (!isInput || !allowInputCopy) {
                e.preventDefault()
                e.stopPropagation()
                if (e.clipboardData) {
                    e.clipboardData.setData("text/plain", "")
                }
                return false
            }
        }

        /* ────────── 5. Prevent Print Event ──────────── */
        const handleBeforePrint = (e) => {
            e.preventDefault()
            return false
        }

        /* ────────── 6. Window Blur / Tab Switch / Snipping Tool Detection ──────────── */
        const handleWindowBlur = () => {
            if (blurOnFocusLoss) {
                triggerShieldSync()
            }
        }

        const handleWindowFocus = () => {
            if (blurOnFocusLoss) {
                // Short delay to guarantee any background screen-capture finished
                if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current)
                blurTimeoutRef.current = setTimeout(() => {
                    releaseShieldSync()
                }, 150)
            }
        }

        const handleVisibilityChange = () => {
            if (blurOnFocusLoss) {
                if (document.hidden) {
                    triggerShieldSync()
                } else {
                    handleWindowFocus()
                }
            }
        }

        /* ────────── 7. Mouse Leaving Window (Edge Snipping Tool / Multi-Monitor Detection) ──────────── */
        const handleMouseLeave = (e) => {
            if (!blurOnMouseLeave) return
            // If the cursor truly leaves the document window/viewport
            if (
                !e.relatedTarget &&
                !e.toElement &&
                (e.clientY <= 0 || e.clientX <= 0 || e.clientX >= window.innerWidth || e.clientY >= window.innerHeight)
            ) {
                triggerShieldSync()
            }
        }

        const handleMouseEnter = () => {
            if (blurOnMouseLeave && document.hasFocus()) {
                if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current)
                blurTimeoutRef.current = setTimeout(() => {
                    releaseShieldSync()
                }, 100)
            }
        }

        // Attach global capture-phase listeners on window
        window.addEventListener("contextmenu", blockContext, true)
        window.addEventListener("keydown", handleKeyDown, true)
        window.addEventListener("keyup", handleKeyUp, true)
        window.addEventListener("dragstart", blockDrag, true)
        window.addEventListener("copy", blockClipboard, true)
        window.addEventListener("cut", blockClipboard, true)
        window.addEventListener("beforeprint", handleBeforePrint, true)

        if (blurOnFocusLoss) {
            window.addEventListener("blur", handleWindowBlur)
            window.addEventListener("focus", handleWindowFocus)
            document.addEventListener("visibilitychange", handleVisibilityChange)
        }

        if (blurOnMouseLeave) {
            document.addEventListener("mouseleave", handleMouseLeave)
            document.addEventListener("mouseenter", handleMouseEnter)
        }

        /* ──────── 8. Anti-debugging & DevTools Detection ──────────── */
        let devToolsCheckInterval = null
        if (blockDevTools) {
            // Check threshold for outer vs inner dimensions (docked DevTools)
            const checkWindowDimensions = () => {
                const threshold = 160
                const widthThreshold = window.outerWidth - window.innerWidth > threshold
                const heightThreshold = window.outerHeight - window.innerHeight > threshold
                if (widthThreshold || heightThreshold) {
                    triggerDestructionAndRedirect()
                }
            }

            // Periodic inspection detection (window size + console/timing inspection)
            devToolsCheckInterval = setInterval(() => {
                checkWindowDimensions()

                // Console logging object getter trick without freezing execution
                const div = document.createElement("div")
                let detected = false
                Object.defineProperty(div, "id", {
                    get: () => {
                        detected = true
                        triggerDestructionAndRedirect()
                        return ""
                    },
                    configurable: true,
                })
                // Trigger inspection check silently
                try {
                    console.debug(div)
                    console.clear()
                } catch {
                    // Ignore console errors
                }

                if (detected) {
                    triggerDestructionAndRedirect()
                }
            }, 1000)

            window.addEventListener("resize", checkWindowDimensions)
        }

        /* ──────────────── Cleanup ──────────────── */
        return () => {
            document.documentElement.classList.remove("shield-active")
            window.removeEventListener("contextmenu", blockContext, true)
            window.removeEventListener("keydown", handleKeyDown, true)
            window.removeEventListener("keyup", handleKeyUp, true)
            window.removeEventListener("dragstart", blockDrag, true)
            window.removeEventListener("copy", blockClipboard, true)
            window.removeEventListener("cut", blockClipboard, true)
            window.removeEventListener("beforeprint", handleBeforePrint, true)

            if (blurOnFocusLoss) {
                window.removeEventListener("blur", handleWindowBlur)
                window.removeEventListener("focus", handleWindowFocus)
                document.removeEventListener("visibilitychange", handleVisibilityChange)
            }
            if (blurOnMouseLeave) {
                document.removeEventListener("mouseleave", handleMouseLeave)
                document.removeEventListener("mouseenter", handleMouseEnter)
            }
            if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current)
            if (devToolsCheckInterval) clearInterval(devToolsCheckInterval)
            if (blockDevTools) {
                window.removeEventListener("resize", checkWindowDimensions)
            }
        }
    }, [blurOnFocusLoss, blurOnMouseLeave, allowInputCopy, blockDevTools, redirectToOnDevTools, router])

    if (isDestroyed) {
        return (
            <div className="fixed inset-0 z-[9999999] bg-white flex flex-col items-center justify-center p-6 text-center select-none">
                <div className="flex flex-col items-center max-w-md w-full animate-in fade-in zoom-in-95 duration-200">
                    <div className="w-16 h-16 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mb-5 shadow-sm">
                        <ShieldAlert className="w-10 h-10 stroke-[2.2]" />
                    </div>

                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200 mb-3">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                        Security Violation Detected
                    </div>

                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 mb-2">
                        Developer Tools Detected
                    </h1>

                    <p className="text-sm text-gray-600 leading-relaxed mb-6">
                        Inspecting source code or opening developer tools is strictly prohibited. The current session has been dismantled to protect student test material.
                    </p>

                    <div className="flex items-center gap-2 text-xs font-medium text-gray-500 bg-gray-50 border border-gray-100 px-4 py-2.5 rounded-lg">
                        <Loader2 className="w-4 h-4 animate-spin text-red-600" />
                        Redirecting to security incident page...
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div
            className={`security-shield relative ${isBlurred ? "security-shield-blurred" : ""}`}
            style={{
                WebkitUserSelect: "none",
                MozUserSelect: "none",
                msUserSelect: "none",
                userSelect: "none",
                WebkitTouchCallout: "none",
            }}
        >
            {/* Main Content (Instant blur & opacity fade with 0ms transition) */}
            <div
                id="security-shield-content"
                className="security-shield-content"
                style={{
                    filter: isBlurred ? "blur(30px)" : "none",
                    opacity: isBlurred ? 0 : 1,
                    visibility: isBlurred ? "hidden" : "visible",
                    pointerEvents: isBlurred ? "none" : "auto",
                }}
            >
                {children}
            </div>

            {/* Plain Minimal White Glassmorphism Privacy Shield Overlay */}
            <div
                id="security-shield-overlay"
                className={`fixed inset-0 z-[999999] bg-white/85 backdrop-blur-2xl flex-col items-center justify-center p-6 text-center select-none cursor-pointer ${isBlurred ? "flex" : "hidden"
                    }`}
                style={{
                    display: isBlurred ? "flex" : "none",
                }}
                onClick={() => {
                    document.documentElement.classList.remove("shield-active")
                    setIsBlurred(false)
                }}
            >
                <div className="flex flex-col items-center max-w-lg text-center animate-in fade-in zoom-in-95 duration-150 pointer-events-none">
                    <div className="mb-4 text-primary">
                        <EyeOff className="size-10 md:size-12 text-primary stroke-[2.2]" />
                    </div>

                    <h2 className="text-xl md:text-2xl font-extrabold tracking-tight text-gray-900 mb-2">
                        Uh-oh! Something&apos;s not right!
                    </h2>

                    <p className="text-sm md:text-base text-gray-500 font-medium leading-relaxed max-w-md">
                        Return to this window or click anywhere to resume.
                    </p>
                </div>
            </div>

        </div>
    )
}





