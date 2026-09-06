"use client"

import { useState, useRef, useEffect } from "react"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from "lucide-react"

export default function MinimalDatePicker({ value, onChange, placeholder = "Select date...", popoverPosition = "right", className = "" }) {
    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef(null)

    // Current displayed month & year in picker
    const initialDate = value ? new Date(value) : new Date()
    const [viewDate, setViewDate] = useState(new Date(initialDate.getFullYear(), initialDate.getMonth(), 1))

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

    const selectedDate = value ? new Date(value) : null
    const year = viewDate.getFullYear()
    const month = viewDate.getMonth()

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ]

    // Days in current month
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    // Starting day of week (0 = Sun, 1 = Mon...)
    const startDayOfWeek = new Date(year, month, 1).getDay()

    const handlePrevMonth = (e) => {
        e.stopPropagation()
        setViewDate(new Date(year, month - 1, 1))
    }

    const handleNextMonth = (e) => {
        e.stopPropagation()
        setViewDate(new Date(year, month + 1, 1))
    }

    const handleYearChange = (e) => {
        e.stopPropagation()
        const newYear = parseInt(e.target.value, 10)
        setViewDate(new Date(newYear, month, 1))
    }

    const handleSelectDay = (day) => {
        const formattedMonth = String(month + 1).padStart(2, '0')
        const formattedDay = String(day).padStart(2, '0')
        const dateStr = `${year}-${formattedMonth}-${formattedDay}`
        onChange(dateStr)
        setIsOpen(false)
    }

    const handleClear = (e) => {
        e.stopPropagation()
        onChange("")
        setIsOpen(false)
    }

    // Format display string
    const formatDisplay = (date) => {
        if (!date || isNaN(date.getTime())) return null
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    }

    // Year range options (2020 - 2035)
    const currentYear = new Date().getFullYear()
    const yearOptions = Array.from({ length: 20 }, (_, i) => currentYear - 5 + i)

    return (
        <div className={`relative inline-block w-full ${className}`} ref={containerRef}>
            {/* Input trigger button */}
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="flex h-8.5 w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-2.5 text-xs font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50/80 cursor-pointer shadow-2xs transition-all"
            >
                <div className="flex items-center gap-1.5 truncate">
                    <CalendarIcon className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    <span className={selectedDate ? "font-semibold text-gray-800 text-xs" : "text-gray-400 text-xs"}>
                        {selectedDate ? formatDisplay(selectedDate) : placeholder}
                    </span>
                </div>
                {selectedDate && (
                    <button
                        onClick={handleClear}
                        className="p-0.5 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors shrink-0"
                        title="Clear date"
                    >
                        <X className="h-3 w-3" />
                    </button>
                )}
            </div>

            {/* Minimal Calendar Popover */}
            {isOpen && (
                <div className={`absolute z-[100] w-56 rounded-xl bg-white p-2.5 border border-gray-200 shadow-xl animate-in fade-in zoom-in-95 duration-150 ${
                    popoverPosition === "top" 
                        ? "bottom-full left-0 mb-1.5" 
                        : popoverPosition === "top-right"
                        ? "bottom-full right-0 mb-1.5"
                        : popoverPosition === "bottom-right"
                        ? "top-full right-0 mt-1.5"
                        : popoverPosition === "right" 
                        ? "left-full -top-1 ml-2.5" 
                        : "top-full left-0 mt-1.5"
                }`}>
                    {/* Month & Year Navigation Header */}
                    <div className="flex items-center justify-between pb-2 mb-1.5 border-b border-gray-100">
                        <div className="flex items-center gap-1.5 text-xs font-semibold tracking-tight text-gray-800">
                            <span>{monthNames[month]}</span>
                            {/* Year selector dropdown */}
                            <select
                                value={year}
                                onChange={handleYearChange}
                                className="bg-gray-100/80 hover:bg-gray-200/70 text-gray-800 font-semibold px-1.5 py-0.5 rounded-md text-xs cursor-pointer focus:outline-none transition-colors border border-gray-200/80"
                            >
                                {yearOptions.map(y => (
                                    <option key={y} value={y} className="font-medium text-gray-800 bg-white">
                                        {y}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center gap-0.5">
                            <button
                                type="button"
                                onClick={handlePrevMonth}
                                className="p-1 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
                                title="Previous Month"
                            >
                                <ChevronLeft className="h-3.5 w-3.5" />
                            </button>
                            <button
                                type="button"
                                onClick={handleNextMonth}
                                className="p-1 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
                                title="Next Month"
                            >
                                <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </div>

                    {/* Weekday Labels */}
                    <div className="grid grid-cols-7 gap-0.5 text-center mb-1">
                        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d, i) => (
                            <span key={i} className="text-[10px] font-semibold text-gray-400">
                                {d}
                            </span>
                        ))}
                    </div>

                    {/* Days Grid */}
                    <div className="grid grid-cols-7 gap-0.5 text-center">
                        {/* Empty padding days */}
                        {Array.from({ length: startDayOfWeek }).map((_, i) => (
                            <div key={`empty-${i}`} className="h-6.5 w-6.5" />
                        ))}

                        {/* Month days */}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const day = i + 1
                            const isToday = new Date().toDateString() === new Date(year, month, day).toDateString()
                            const isSelected = selectedDate &&
                                selectedDate.getFullYear() === year &&
                                selectedDate.getMonth() === month &&
                                selectedDate.getDate() === day

                            return (
                                <button
                                    type="button"
                                    key={day}
                                    onClick={() => handleSelectDay(day)}
                                    className={`h-6.5 w-6.5 text-[11px] font-medium rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                                        isSelected
                                            ? "bg-gray-900 text-white font-semibold shadow-xs"
                                            : isToday
                                            ? "bg-gray-100 text-gray-900 font-semibold border border-gray-200"
                                            : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                                    }`}
                                >
                                    {day}
                                </button>
                            )
                        })}
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between pt-2 mt-1.5 border-t border-gray-100">
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
                                const today = new Date()
                                const formattedMonth = String(today.getMonth() + 1).padStart(2, '0')
                                const formattedDay = String(today.getDate()).padStart(2, '0')
                                onChange(`${today.getFullYear()}-${formattedMonth}-${formattedDay}`)
                                setIsOpen(false)
                            }}
                            className="text-xs font-semibold text-gray-900 hover:text-gray-600 transition-colors cursor-pointer"
                        >
                            Today
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
