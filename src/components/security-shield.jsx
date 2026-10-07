"use client"

import { useEffect, useState, useRef } from "react"
import { EyeOff } from "lucide-react"
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
}) {
    const [isBlurred, setIsBlurred] = useState(false)
    const blurTimeoutRef = useRef(null)

    useEffect(() => {
        // Synchronous instant shield activator (0ms response time before OS compositor grabs frame)
        const triggerShieldSync = () => {
            document.documentElement.classList.add("shield-active")
            setIsBlurred(true)
        }

        const releaseShieldSync = () => {
            document.documentElement.classList.remove("shield-active")
            setIsBlurred(false)
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

        /* ──────── 8. Anti-debugging: debugger-loop in production ──────────── */
        let debuggerInterval = null
        if (process.env.NODE_ENV === "production") {
            debuggerInterval = setInterval(() => {
                const before = performance.now()
                // eslint-disable-next-line no-debugger
                debugger
                const after = performance.now()
                if (after - before > 100) {
                    // DevTools was opened
                }
            }, 2000)
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
            if (debuggerInterval) clearInterval(debuggerInterval)
        }
    }, [blurOnFocusLoss, blurOnMouseLeave, allowInputCopy])

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





