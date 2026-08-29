"use client"

import { useRef } from "react"
import { Clock, X } from "lucide-react"

export default function MinimalTimePicker({
    value,
    onChange,
    placeholder = "--:-- --",
    className = "",
    size = "default" // "default" (h-10) or "compact" (h-9)
}) {
    const inputRef = useRef(null)

    const handleClear = (e) => {
        e.stopPropagation()
        e.preventDefault()
        onChange("")
        if (inputRef.current) {
            inputRef.current.value = ""
        }
    }

    const formatDisplayTime = (timeStr) => {
        if (!timeStr) return null
        const parts = timeStr.split(":")
        if (parts.length < 2) return timeStr
        let hours = parseInt(parts[0], 10)
        const minutes = parts[1]
        if (isNaN(hours)) return timeStr
        const ampm = hours >= 12 ? "PM" : "AM"
        hours = hours % 12
        hours = hours ? hours : 12 // the hour '0' should be '12'
        const strHours = hours < 10 ? `0${hours}` : `${hours}`
        return `${strHours}:${minutes} ${ampm}`
    }

    const heightClass = size === "compact" ? "h-9 text-xs" : "h-10 text-sm"

    return (
        <div className={`relative flex items-center w-full ${className}`}>
            <div
                onClick={() => {
                    if (inputRef.current) {
                        try {
                            if (typeof inputRef.current.showPicker === "function") {
                                inputRef.current.showPicker()
                            } else {
                                inputRef.current.focus()
                            }
                        } catch {
                            inputRef.current.focus()
                        }
                    }
                }}
                className={`flex ${heightClass} w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-3 font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50/80 cursor-pointer shadow-2xs transition-all relative overflow-hidden`}
            >
                <div className="flex items-center gap-2 truncate">
                    <Clock className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    <span className={value ? "font-semibold text-gray-800" : "text-gray-400"}>
                        {value ? formatDisplayTime(value) : placeholder}
                    </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                    {value && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="p-1 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer z-10"
                            title="Clear time"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>

                {/* Hidden native time input for picker triggering */}
                <input
                    ref={inputRef}
                    type="time"
                    value={value || ""}
                    onChange={(e) => onChange(e.target.value)}
                    className="absolute inset-0 opacity-0 pointer-events-none w-full h-full"
                    tabIndex={-1}
                />
            </div>
        </div>
    )
}
