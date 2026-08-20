"use client"

import { useEffect } from "react"

/**
 * SecurityShield – Frontend deterrence layer.
 *
 * Drop this component into any page/layout to:
 *  1. Block right-click context menu
 *  2. Block DevTools shortcut keys (F12, Ctrl+Shift+I/J/C, Ctrl+U, etc.)
 *  3. Run an anti-debugging / debugger-loop
 *  4. Inject CSS that prevents text selection & drag-and-drop
 *
 * NOTE: These are deterrents, not bulletproof protections.
 * They discourage casual tampering but cannot stop a determined attacker.
 */
export function SecurityShield({ children }) {
    useEffect(() => {
        /* ───────────────── 1. Block right-click ───────────────── */
        const blockContext = (e) => {
            e.preventDefault()
            return false
        }

        /* ────────── 2. Block DevTools shortcut keys ──────────── */
        const blockShortcuts = (e) => {
            // F12
            if (e.key === "F12") {
                e.preventDefault()
                return false
            }

            const ctrl = e.ctrlKey || e.metaKey // metaKey = Cmd on Mac

            // Ctrl+Shift+I  (Inspect)
            // Ctrl+Shift+J  (Console)
            // Ctrl+Shift+C  (Element picker)
            if (ctrl && e.shiftKey && ["I", "i", "J", "j", "C", "c"].includes(e.key)) {
                e.preventDefault()
                return false
            }

            // Ctrl+U  (View Source)
            if (ctrl && (e.key === "u" || e.key === "U")) {
                e.preventDefault()
                return false
            }

            // Ctrl+S  (Save page)
            if (ctrl && (e.key === "s" || e.key === "S")) {
                e.preventDefault()
                return false
            }
        }

        /* ────────── 3. Block drag events on images ──────────── */
        const blockDrag = (e) => {
            if (e.target.tagName === "IMG") {
                e.preventDefault()
                return false
            }
        }

        document.addEventListener("contextmenu", blockContext)
        document.addEventListener("keydown", blockShortcuts)
        document.addEventListener("dragstart", blockDrag)

        /* ──────── 4. Anti-debugging: debugger-loop ──────────── */
        // Runs a check every 2 s. When DevTools is open the `debugger`
        // statement pauses execution, making it hard to use the console.
        let debuggerInterval = null

        const startAntiDebug = () => {
            debuggerInterval = setInterval(() => {
                const before = performance.now()
                // eslint-disable-next-line no-debugger
                debugger
                const after = performance.now()
                // If the delta is large, DevTools was likely open
                if (after - before > 100) {
                    // Optionally you could redirect:
                    // window.location.href = "/"
                }
            }, 2000)
        }

        // Only enable debugger-loop in production to avoid annoying during dev
        if (process.env.NODE_ENV === "production") {
            startAntiDebug()
        }

        /* ──────────────── Cleanup ──────────────── */
        return () => {
            document.removeEventListener("contextmenu", blockContext)
            document.removeEventListener("keydown", blockShortcuts)
            document.removeEventListener("dragstart", blockDrag)
            if (debuggerInterval) clearInterval(debuggerInterval)
        }
    }, [])

    return (
        <div
            className="security-shield"
            style={{
                /* Prevent text selection */
                WebkitUserSelect: "none",
                MozUserSelect: "none",
                msUserSelect: "none",
                userSelect: "none",
                /* Prevent callout (iOS long-press menu) */
                WebkitTouchCallout: "none",
            }}
            onCopy={(e) => e.preventDefault()}
            onCut={(e) => e.preventDefault()}
            onPaste={(e) => e.preventDefault()}
        >
            {children}
        </div>
    )
}
