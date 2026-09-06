"use client"

import { useState, useRef, useEffect } from "react"
import { Clock, X } from "lucide-react"

export default function MinimalTimePicker({
    value,
    onChange,
    placeholder = "--:-- --",
    className = "",
    size = "default" // "default" (h-10) or "compact" (h-9)
}) {
    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef(null)

    // Parse value ("HH:mm") into 12-hour components
    const parseTime = (timeStr) => {
        if (!timeStr) return { hour: "12", minute: "00", ampm: "AM" }
        const parts = timeStr.split(":")
        if (parts.length < 2) return { hour: "12", minute: "00", ampm: "AM" }
        let h = parseInt(parts[0], 10)
        const m = parts[1] || "00"
        if (isNaN(h)) return { hour: "12", minute: "00", ampm: "AM" }
        const ampm = h >= 12 ? "PM" : "AM"
        h = h % 12
        h = h ? h : 12
        const strH = String(h)
        return { hour: strH, minute: m, ampm }
    }

    const { hour: currentHour, minute: currentMinute, ampm: currentAmpm } = parseTime(value)

    // Close popover when clicking outside
    useEffect(() => {
        function handleClickOutside(e) {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const handleClear = (e) => {
        e.stopPropagation()
        e.preventDefault()
        onChange("")
        setIsOpen(false)
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
        hours = hours ? hours : 12
        const strHours = hours < 10 ? `0${hours}` : `${hours}`
        return `${strHours}:${minutes} ${ampm}`
    }

    const setTimeComponent = (newHour, newMinute, newAmpm) => {
        let h = parseInt(newHour, 10)
        if (newAmpm === "PM" && h < 12) h += 12
        if (newAmpm === "AM" && h === 12) h = 0
        const strH = String(h).padStart(2, '0')
        const strM = String(newMinute).padStart(2, '0')
        onChange(`${strH}:${strM}`)
    }

    const hoursList = Array.from({ length: 12 }, (_, i) => String(i + 1))
    const minutesList = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"]

    const heightClass = size === "compact" ? "h-9 text-xs" : "h-10 text-sm"

    return (
        <div className={`relative flex items-center w-full ${className}`} ref={containerRef}>
            {/* Input Trigger Button */}
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`flex ${heightClass} w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-3 font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50/80 cursor-pointer shadow-2xs transition-all relative overflow-hidden select-none`}
            >
                <div className="flex items-center gap-2 truncate">
                    <Clock className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    <span className={value ? "font-semibold text-gray-800" : "text-gray-400 font-normal"}>
                        {value ? formatDisplayTime(value) : placeholder}
                    </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                    {value && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer z-10"
                            title="Clear time"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Pure White, Minimal & Modern Time Picker Popover */}
            {isOpen && (
                <div className="absolute z-[110] top-full right-0 mt-1.5 w-56 rounded-xl bg-white p-3 border border-gray-200/90 shadow-lg font-sans animate-in fade-in zoom-in-95 duration-150 select-none">
                    {/* Header: AM / PM Switcher */}
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100">
                        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                            Time
                        </span>
                        <div className="flex items-center gap-0.5 bg-gray-100/90 p-0.5 rounded-lg border border-gray-200/60 text-xs font-semibold">
                            <button
                                type="button"
                                onClick={() => setTimeComponent(currentHour, currentMinute, "AM")}
                                className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                                    currentAmpm === "AM"
                                        ? "bg-white text-gray-900 shadow-xs font-bold"
                                        : "text-gray-500 hover:text-gray-900"
                                }`}
                            >
                                AM
                            </button>
                            <button
                                type="button"
                                onClick={() => setTimeComponent(currentHour, currentMinute, "PM")}
                                className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                                    currentAmpm === "PM"
                                        ? "bg-white text-gray-900 shadow-xs font-bold"
                                        : "text-gray-500 hover:text-gray-900"
                                }`}
                            >
                                PM
                            </button>
                        </div>
                    </div>

                    {/* Columns Grid: Hours & Minutes */}
                    <div className="grid grid-cols-2 gap-2 text-center">
                        {/* Hours Column */}
                        <div>
                            <span className="block text-[10px] font-semibold text-gray-400 uppercase mb-1">Hour</span>
                            <div className="max-h-36 overflow-y-auto space-y-0.5 pr-0.5">
                                {hoursList.map(h => {
                                    const isSelected = currentHour === h
                                    return (
                                        <button
                                            type="button"
                                            key={h}
                                            onClick={() => setTimeComponent(h, currentMinute, currentAmpm)}
                                            className={`w-full py-1 text-xs rounded-lg font-medium transition-all cursor-pointer flex items-center justify-center ${
                                                isSelected
                                                    ? "bg-gray-900 text-white font-semibold shadow-xs"
                                                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                                            }`}
                                        >
                                            {h.padStart(2, '0')}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Minutes Column */}
                        <div>
                            <span className="block text-[10px] font-semibold text-gray-400 uppercase mb-1">Min</span>
                            <div className="max-h-36 overflow-y-auto space-y-0.5 pr-0.5">
                                {minutesList.map(m => {
                                    const isSelected = currentMinute === m
                                    return (
                                        <button
                                            type="button"
                                            key={m}
                                            onClick={() => setTimeComponent(currentHour, m, currentAmpm)}
                                            className={`w-full py-1 text-xs rounded-lg font-medium transition-all cursor-pointer flex items-center justify-center ${
                                                isSelected
                                                    ? "bg-gray-900 text-white font-semibold shadow-xs"
                                                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                                            }`}
                                        >
                                            {m}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between pt-2 mt-2 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={handleClear}
                            className="text-xs font-medium text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                        >
                            Clear
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                const now = new Date()
                                const h = String(now.getHours()).padStart(2, '0')
                                const m = String(now.getMinutes()).padStart(2, '0')
                                onChange(`${h}:${m}`)
                                setIsOpen(false)
                            }}
                            className="text-xs font-semibold text-gray-900 hover:text-gray-600 transition-colors cursor-pointer"
                        >
                            Now
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

