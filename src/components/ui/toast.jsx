"use client"

import React, { createContext, useContext, useState, useCallback } from "react"
import { AnimatePresence, motion } from "motion/react"

const ToastContext = createContext({
  showToast: () => {},
  toast: () => {},
})

let globalToastHandler = null

/**
 * Universal function callable from anywhere (even outside React tree)
 * Usage: toast("Saved successfully!") or toast.success("...")
 */
export function toast(message, options = {}) {
  if (globalToastHandler) {
    globalToastHandler(message, options)
  }
}

toast.success = (message, options = {}) => toast(message, { ...options, type: "success" })
toast.error = (message, options = {}) => toast(message, { ...options, type: "error" })
toast.info = (message, options = {}) => toast(message, { ...options, type: "info" })

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, options = {}) => {
    const id = Date.now() + Math.random().toString(36).slice(2, 7)
    const duration = options.duration || 3200

    const newToast = {
      id,
      message,
      type: options.type || "success",
    }

    setToasts((prev) => [...prev.slice(-4), newToast]) // keep at most 4 visible

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, duration)
  }, [])

  // Register global imperative handler
  React.useEffect(() => {
    globalToastHandler = addToast
    return () => {
      globalToastHandler = null
    }
  }, [addToast])

  return (
    <ToastContext.Provider value={{ showToast: addToast, toast: addToast }}>
      {children}

      {/* Floating Bottom-Right Toast Stack */}
      <div
        className="fixed bottom-5 right-5 z-[9999] flex flex-col items-end gap-2.5 pointer-events-none select-none max-w-sm w-full px-3 sm:px-0"
        aria-live="polite"
        aria-atomic="true"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 16, x: 20 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, x: 16, transition: { duration: 0.2, ease: "easeOut" } }}
              transition={{
                type: "spring",
                stiffness: 380,
                damping: 28,
              }}
              className="pointer-events-auto rounded-xl bg-white dark:bg-[#1A1A1A] border border-black/10 dark:border-white/10 px-4 py-3 shadow-[0_6px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_6px_24px_rgba(0,0,0,0.35)] min-w-[200px] max-w-sm"
            >
              <div className="text-xs font-medium text-[#3B3B3B] dark:text-neutral-200 leading-snug">
                {t.message}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
