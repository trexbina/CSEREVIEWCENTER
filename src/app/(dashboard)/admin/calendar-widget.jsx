"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]

export function CalendarWidget() {
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [selectedDate, setSelectedDate] = useState(() => new Date())

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // First day of month (0 = Sun, 1 = Mon, etc.)
  const firstDayIndex = new Date(year, month, 1).getDay()
  // Total days in current month
  const totalDays = new Date(year, month + 1, 0).getDate()
  // Total days in previous month
  const prevMonthTotalDays = new Date(year, month, 0).getDate()

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const today = new Date()
  const isToday = (day) =>
    today.getDate() === day &&
    today.getMonth() === month &&
    today.getFullYear() === year

  const isSelected = (day) =>
    selectedDate.getDate() === day &&
    selectedDate.getMonth() === month &&
    selectedDate.getFullYear() === year

  // Build calendar cells
  const calendarCells = []

  // Trailing days from prev month
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    calendarCells.push({
      day: prevMonthTotalDays - i,
      currentMonth: false,
    })
  }

  // Current month days
  for (let d = 1; d <= totalDays; d++) {
    calendarCells.push({
      day: d,
      currentMonth: true,
    })
  }

  // Trailing days into next month to complete rows (up to 35 or 42 cells)
  const remainingCells = (7 - (calendarCells.length % 7)) % 7
  for (let d = 1; d <= remainingCells; d++) {
    calendarCells.push({
      day: d,
      currentMonth: false,
    })
  }

  return (
    <div className="w-full rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-md shadow-2xs p-3.5 sm:p-4 flex flex-col justify-between transition-all">
      {/* ── Top Bar / Header ── */}
      <div>
        <div className="flex items-center justify-between pb-2.5 border-b border-black/5 dark:border-white/5">
          <span className="text-xs font-bold text-[#3B3B3B] dark:text-white tracking-wider uppercase select-none">
            {MONTH_NAMES[month]} {year}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              aria-label="Previous month"
              className="size-6 rounded-lg flex items-center justify-center text-[#696969] hover:text-[#3B3B3B] dark:text-gray-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer active:scale-95"
            >
              <ChevronLeft className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              aria-label="Next month"
              className="size-6 rounded-lg flex items-center justify-center text-[#696969] hover:text-[#3B3B3B] dark:text-gray-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer active:scale-95"
            >
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        </div>

        {/* ── Days of week header ── */}
        <div className="grid grid-cols-7 gap-1 mt-2 text-center text-[10px] font-semibold text-[#696969]/80 dark:text-gray-400 select-none">
          {DAYS.map((day) => (
            <div key={day} className="py-0.5">
              {day}
            </div>
          ))}
        </div>

        {/* ── Calendar Dates Grid ── */}
        <div className="grid grid-cols-7 gap-1 mt-1">
          {calendarCells.map((cell, idx) => {
            const activeToday = cell.currentMonth && isToday(cell.day)
            const activeSelected = cell.currentMonth && isSelected(cell.day)

            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  if (cell.currentMonth) {
                    setSelectedDate(new Date(year, month, cell.day))
                  }
                }}
                disabled={!cell.currentMonth}
                className={`h-6 text-[11px] font-medium rounded-md flex items-center justify-center transition-all cursor-pointer ${
                  !cell.currentMonth
                    ? "text-neutral-300 dark:text-neutral-600 cursor-default opacity-40"
                    : activeSelected
                    ? "bg-[#3B3B3B] text-white dark:bg-white dark:text-gray-900 font-semibold shadow-xs"
                    : activeToday
                    ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold hover:bg-emerald-500/30"
                    : "text-[#3B3B3B] dark:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/10"
                }`}
              >
                {cell.day}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Bottom note ── */}
      <div className="pt-2 mt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[10px] text-[#696969]/70 dark:text-gray-500">
        <span>Review Calendar</span>
        <button
          type="button"
          onClick={() => {
            const now = new Date()
            setCurrentDate(now)
            setSelectedDate(now)
          }}
          className="hover:text-[#3B3B3B] dark:hover:text-white transition-colors cursor-pointer"
        >
          Today
        </button>
      </div>
    </div>
  )
}
