"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import Link from "next/link"
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Plus,
  Trash2,
  X,
  Calendar as CalendarIcon,
  Clock,
  ArrowRight
} from "lucide-react"

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

const NOTE_COLORS = [
  {
    id: "amber",
    label: "Amber",
    bg: "bg-[#E9C46A]/20 dark:bg-[#E9C46A]/25",
    text: "text-[#B78103] dark:text-[#E9C46A]",
    border: "border-[#E9C46A]/40",
    dot: "bg-[#E9C46A]",
    cellBg: "bg-[#FDF6E2] dark:bg-[#322812]",
    cellSelectedBg: "bg-[#FCEFC7] dark:bg-[#3D3319]",
    numText: "text-[#B78103] dark:text-[#E9C46A]"
  },
  {
    id: "teal",
    label: "Teal",
    bg: "bg-[#2A9D8F]/20 dark:bg-[#2A9D8F]/25",
    text: "text-[#2A9D8F] dark:text-[#2A9D8F]",
    border: "border-[#2A9D8F]/40",
    dot: "bg-[#2A9D8F]",
    cellBg: "bg-[#E1F4F1] dark:bg-[#162D2A]",
    cellSelectedBg: "bg-[#CEEFEA] dark:bg-[#1E3B37]",
    numText: "text-[#1F746A] dark:text-[#4FD1C5]"
  },
  {
    id: "coral",
    label: "Coral",
    bg: "bg-[#E17055]/20 dark:bg-[#E17055]/25",
    text: "text-[#E17055] dark:text-[#E17055]",
    border: "border-[#E17055]/40",
    dot: "bg-[#E17055]",
    cellBg: "bg-[#FDECE7] dark:bg-[#381B15]",
    cellSelectedBg: "bg-[#FBD9CF] dark:bg-[#48231C]",
    numText: "text-[#C0392B] dark:text-[#E17055]"
  },
  {
    id: "blue",
    label: "Blue",
    bg: "bg-blue-500/15 dark:bg-blue-500/20",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-500/30",
    dot: "bg-blue-500",
    cellBg: "bg-[#E7F0FD] dark:bg-[#15233C]",
    cellSelectedBg: "bg-[#D4E4FC] dark:bg-[#1C2F50]",
    numText: "text-[#1D4ED8] dark:text-[#60A5FA]"
  },
  {
    id: "purple",
    label: "Purple",
    bg: "bg-purple-500/15 dark:bg-purple-500/20",
    text: "text-purple-600 dark:text-purple-400",
    border: "border-purple-500/30",
    dot: "bg-purple-500",
    cellBg: "bg-[#F3EBFD] dark:bg-[#28183C]",
    cellSelectedBg: "bg-[#E8D9FC] dark:bg-[#341F4F]",
    numText: "text-[#6D28D9] dark:text-[#A78BFA]"
  },
  {
    id: "rose",
    label: "Rose",
    bg: "bg-rose-500/15 dark:bg-rose-500/20",
    text: "text-rose-600 dark:text-rose-400",
    border: "border-rose-500/30",
    dot: "bg-rose-500",
    cellBg: "bg-[#FDEBF1] dark:bg-[#3C1525]",
    cellSelectedBg: "bg-[#FBD7E4] dark:bg-[#4E1C31]",
    numText: "text-[#BE123C] dark:text-[#FB7185]"
  },
]

const getNoteColor = (tag) => {
  return NOTE_COLORS.find((c) => c.id === tag) || NOTE_COLORS[0]
}

const format12Hour = (timeStr) => {
  if (!timeStr) return ""
  if (/am|pm/i.test(timeStr)) return timeStr
  const parts = timeStr.split(":")
  if (parts.length < 2) return timeStr
  let hours = parseInt(parts[0], 10)
  const minutes = parts[1]
  if (isNaN(hours)) return timeStr
  const ampm = hours >= 12 ? "PM" : "AM"
  hours = hours % 12
  if (hours === 0) hours = 12
  return `${hours}:${minutes} ${ampm}`
}

export default function StudentCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)
  const [assignments, setAssignments] = useState([])
  const [mockExams, setMockExams] = useState([])
  const [customNotes, setCustomNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false)
  const containerRef = useRef(null)

  // Filter: 'all' | 'quizzes' | 'mock-exams' | 'assignments' | 'notes'
  const [typeFilter, setTypeFilter] = useState("all")

  // Modal for adding personal calendar item
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [noteForm, setNoteForm] = useState({
    title: "",
    description: "",
    time: "",
    tag: "amber",
    date: ""
  })
  const [savingNote, setSavingNote] = useState(false)

  // Fetch all assignments, quizzes, mock exams, and personal notes
  const fetchData = async () => {
    setLoading(true)
    try {
      const [assignRes, notesRes, examsRes] = await Promise.all([
        fetch("/api/student/assignments"),
        fetch("/api/student/calendar/notes"),
        fetch("/api/student/mock-exams")
      ])

      if (assignRes.ok) {
        const data = await assignRes.json()
        setAssignments(data.assignments || [])
      }

      if (notesRes.ok) {
        const data = await notesRes.json()
        setCustomNotes(data.notes || [])
      }

      if (examsRes.ok) {
        const data = await examsRes.json()
        setMockExams(data.exams || [])
      }
    } catch (err) {
      setError(err.message || "Failed to load calendar events.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Fullscreen toggle handler with HTML5 Fullscreen API fallback
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen().catch(() => {})
      }
      setIsFullscreen(true)
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {})
      }
      setIsFullscreen(false)
    }
  }

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [])

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))
  const goToToday = () => {
    const today = new Date()
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1))
    setSelectedDate(today)
  }

  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const daysInPrevMonth = new Date(year, month, 0).getDate()

    const days = []

    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, daysInPrevMonth - i),
        isCurrentMonth: false,
      })
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      })
    }

    const remaining = (7 - (days.length % 7)) % 7
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      })
    }

    return days
  }, [year, month])

  const formatYMD = (d) => {
    if (!d) return ""
    const dateObj = new Date(d)
    if (isNaN(dateObj.getTime())) return ""
    const y = dateObj.getFullYear()
    const m = String(dateObj.getMonth() + 1).padStart(2, "0")
    const day = String(dateObj.getDate()).padStart(2, "0")
    return `${y}-${m}-${day}`
  }

  // Combined events mapping
  const eventsByDate = useMemo(() => {
    const map = {}

    // 1. Quizzes & Assignments
    assignments.forEach((item) => {
      if (typeFilter === "assignments" && !item.is_assignment) return
      if (typeFilter === "quizzes" && item.is_assignment) return
      if (typeFilter === "mock-exams" || typeFilter === "notes") return

      if (item.start_date) {
        const startKey = formatYMD(item.start_date)
        if (startKey) {
          if (!map[startKey]) map[startKey] = []
          map[startKey].push({ ...item, eventRole: "start", isCustomNote: false, isMockExam: false })
        }
      }

      if (item.due_date) {
        const dueKey = formatYMD(item.due_date)
        if (dueKey && dueKey !== formatYMD(item.start_date)) {
          if (!map[dueKey]) map[dueKey] = []
          map[dueKey].push({ ...item, eventRole: "due", isCustomNote: false, isMockExam: false })
        }
      }
    })

    // 2. Mock Exams
    if (typeFilter === "all" || typeFilter === "mock-exams") {
      mockExams.forEach((exam) => {
        const examDate = exam.unlock_date || exam.created_at
        if (examDate) {
          const examKey = formatYMD(examDate)
          if (examKey) {
            if (!map[examKey]) map[examKey] = []
            map[examKey].push({
              id: exam.id,
              title: exam.title,
              description: exam.description || `Mock Exam · ${exam.question_count || 0} questions`,
              isMockExam: true,
              is_assignment: false,
              isCustomNote: false,
              eventRole: "exam",
              unlock_date: exam.unlock_date,
              score: exam.score,
              max_score: exam.max_score,
              completed_at: exam.completed_at,
              quiz_url: `/student/mock-exams?examId=${exam.id}`
            })
          }
        }
      })
    }

    // 3. Personal Notes / Custom Events
    if (typeFilter === "all" || typeFilter === "notes") {
      customNotes.forEach((note) => {
        const key = note.event_date
        if (key) {
          if (!map[key]) map[key] = []
          map[key].push({
            id: note.id,
            title: note.title,
            description: note.description,
            time: note.time,
            tag: note.tag || "amber",
            eventRole: "note",
            isCustomNote: true,
            isMockExam: false
          })
        }
      })
    }

    return map
  }, [assignments, mockExams, customNotes, typeFilter])

  const selectedDateKey = formatYMD(selectedDate)
  const selectedEvents = useMemo(() => {
    return eventsByDate[selectedDateKey] || []
  }, [eventsByDate, selectedDateKey])

  const monthName = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })
  const selectedFormatted = selectedDate
    ? selectedDate.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : ""

  // Open add note modal for a specific day
  const handleOpenAddNote = (d = selectedDate || new Date()) => {
    const formattedDate = formatYMD(d || new Date())
    const existingNotesForDate = customNotes.filter((n) => n.event_date === formattedDate)
    const activeTag = existingNotesForDate.length > 0
      ? existingNotesForDate[existingNotesForDate.length - 1].tag
      : "amber"

    setNoteForm({
      title: "",
      description: "",
      time: "",
      tag: activeTag || "amber",
      date: formattedDate
    })
    setIsAddModalOpen(true)
  }

  // Save new custom note
  const handleSaveNote = async (e) => {
    e.preventDefault()
    if (!noteForm.title.trim() || !noteForm.date) return

    setSavingNote(true)
    try {
      const res = await fetch("/api/student/calendar/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_date: noteForm.date,
          title: noteForm.title,
          description: noteForm.description,
          time: noteForm.time,
          tag: noteForm.tag
        })
      })

      if (res.ok) {
        const data = await res.json()
        setCustomNotes((prev) => [
          ...prev.map((n) => (n.event_date === noteForm.date ? { ...n, tag: noteForm.tag } : n)),
          data.note
        ])
        setIsAddModalOpen(false)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSavingNote(false)
    }
  }

  // Delete custom note
  const handleDeleteNote = async (id) => {
    try {
      const res = await fetch(`/api/student/calendar/notes?id=${id}`, {
        method: "DELETE"
      })
      if (res.ok) {
        setCustomNotes((prev) => prev.filter((n) => n.id !== id))
      }
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div
      ref={containerRef}
      onClick={() => {
        if (selectedDate) setSelectedDate(null)
      }}
      className={`space-y-6 sm:space-y-8 w-full ${
        isFullscreen
          ? "fixed inset-0 z-50 bg-[#FDFBF7] dark:bg-neutral-950 p-6 md:p-8 overflow-y-auto"
          : "max-w-6xl mx-auto px-4 py-4 pb-10"
      }`}
    >
      {/* ── Page Heading & Controls ── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#3B3B3B] dark:text-white">
              Calendar
            </h1>
            {isFullscreen && (
              <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded-full select-none">
                Fullscreen
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-neutral-400 dark:text-neutral-500 font-normal">
            {isFullscreen
              ? "Workspace mode: click on any day to add or manage your schedule."
              : "View your quizzes, assignments, and study schedule."}
          </p>
        </div>

        {/* Action Controls & Filters */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Add Event Button: Sleek Primary Button */}
          <button
            type="button"
            onClick={() => handleOpenAddNote(selectedDate)}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 h-8 rounded-xl text-xs font-semibold text-white bg-[#3B3B3B] hover:bg-[#2B2B2B] dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 transition-all shadow-2xs cursor-pointer active:scale-95"
          >
            <Plus className="size-3.5" />
            <span>Add Event</span>
          </button>

          {/* Minimal Segmented Tab Filter */}
          <div className="flex items-center gap-1 p-1 bg-black/[0.03] dark:bg-white/[0.04] rounded-xl border border-black/5 dark:border-white/10 select-none">
            <button
              type="button"
              onClick={() => setTypeFilter("all")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                typeFilter === "all"
                  ? "bg-white dark:bg-white/15 text-[#3B3B3B] dark:text-white shadow-2xs"
                  : "text-neutral-500 hover:text-[#3B3B3B] dark:text-neutral-400 dark:hover:text-white"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter("quizzes")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                typeFilter === "quizzes"
                  ? "bg-white dark:bg-white/15 text-[#3B3B3B] dark:text-white shadow-2xs"
                  : "text-neutral-500 hover:text-[#3B3B3B] dark:text-neutral-400 dark:hover:text-white"
              }`}
            >
              Quizzes
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter("mock-exams")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                typeFilter === "mock-exams"
                  ? "bg-white dark:bg-white/15 text-[#3B3B3B] dark:text-white shadow-2xs"
                  : "text-neutral-500 hover:text-[#3B3B3B] dark:text-neutral-400 dark:hover:text-white"
              }`}
            >
              Mock Exams
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter("assignments")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                typeFilter === "assignments"
                  ? "bg-white dark:bg-white/15 text-[#3B3B3B] dark:text-white shadow-2xs"
                  : "text-neutral-500 hover:text-[#3B3B3B] dark:text-neutral-400 dark:hover:text-white"
              }`}
            >
              Assignments
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter("notes")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                typeFilter === "notes"
                  ? "bg-white dark:bg-white/15 text-[#3B3B3B] dark:text-white shadow-2xs"
                  : "text-neutral-500 hover:text-[#3B3B3B] dark:text-neutral-400 dark:hover:text-white"
              }`}
            >
              Notes
            </button>
          </div>

          {/* Full Screen Toggle Button: White button style */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 h-8 rounded-xl text-xs font-semibold text-[#696969] hover:text-[#3B3B3B] dark:text-gray-400 dark:hover:text-white bg-white dark:bg-white/10 hover:bg-white/90 border border-black/5 dark:border-white/10 transition-all shadow-2xs cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
            <span>{isFullscreen ? "Exit" : "Full Screen"}</span>
          </button>
        </div>
      </div>

      {/* ── Line Divider ── */}
      <div className="border-t border-black/5 dark:border-white/10" />

      {/* ── Main Layout: Calendar Card Container ── */}
      <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-md shadow-2xs overflow-hidden flex flex-col justify-between">
        {/* Month Toolbar Header: Signature Brand Amber Header */}
        <div className="relative z-10 px-5 py-3.5 sm:px-6 sm:py-4 flex items-center justify-between border-b border-black/5 dark:border-white/5 bg-[#E9C46A]/20 dark:bg-[#E9C46A]/25 shadow-[0_2px_4px_-1px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_4px_-1px_rgba(0,0,0,0.3)]">
          <h2 className="text-sm sm:text-base font-semibold text-[#3B3B3B] dark:text-white tracking-tight">
            {monthName}
          </h2>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={goToToday}
              className="px-3 h-7 rounded-lg text-xs font-semibold text-[#696969] hover:text-[#3B3B3B] dark:text-gray-400 dark:hover:text-white bg-white dark:bg-white/10 hover:bg-white/90 border border-black/5 dark:border-white/10 transition-all shadow-2xs cursor-pointer"
            >
              Today
            </button>
            <button
              type="button"
              onClick={prevMonth}
              aria-label="Previous Month"
              className="size-7 rounded-lg text-[#696969] hover:text-[#3B3B3B] dark:text-gray-400 dark:hover:text-white bg-white dark:bg-white/10 hover:bg-white/90 border border-black/5 dark:border-white/10 flex items-center justify-center transition-all shadow-2xs cursor-pointer active:scale-95"
            >
              <ChevronLeft className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={nextMonth}
              aria-label="Next Month"
              className="size-7 rounded-lg text-[#696969] hover:text-[#3B3B3B] dark:text-gray-400 dark:hover:text-white bg-white dark:bg-white/10 hover:bg-white/90 border border-black/5 dark:border-white/10 flex items-center justify-center transition-all shadow-2xs cursor-pointer active:scale-95"
            >
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        </div>

        {/* Day of Week Row */}
        <div className="grid grid-cols-7 text-center py-2.5 border-b border-black/5 dark:border-white/5 text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider select-none bg-black/[0.015] dark:bg-white/[0.02]">
          {DAYS_OF_WEEK.map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5 p-3 sm:p-4">
          {calendarDays.map((item, idx) => {
            const dayKey = formatYMD(item.date)
            const events = eventsByDate[dayKey] || []
            const isSelected = selectedDateKey === dayKey
            const isToday = formatYMD(new Date()) === dayKey

            // Check if this date has any visible custom notes under the current filter to tint the whole box
            const visibleNotes =
              typeFilter === "all" || typeFilter === "notes"
                ? events.filter((e) => e.isCustomNote)
                : []
            const latestNote = visibleNotes.length > 0 ? visibleNotes[visibleNotes.length - 1] : null
            const dateNoteColor = latestNote ? getNoteColor(latestNote.tag) : null

            let cellHighlight = "border-black/5 dark:border-white/10 bg-white/40 dark:bg-white/[0.015] hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"

            if (dateNoteColor) {
              cellHighlight = `border-transparent ${dateNoteColor.cellBg} shadow-2xs ${
                isSelected ? "ring-1 ring-inset ring-black/20 dark:ring-white/30" : ""
              }`
            } else if (isSelected) {
              cellHighlight = "border-black/25 dark:border-white/35 bg-white/40 dark:bg-white/[0.015] shadow-2xs"
            }

            return (
              <div
                key={idx}
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedDate((prev) => {
                    if (prev && formatYMD(prev) === dayKey) {
                      return null
                    }
                    return item.date
                  })
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation()
                  handleOpenAddNote(item.date)
                }}
                className={`min-h-[85px] sm:min-h-[110px] p-2 sm:p-2.5 rounded-xl transition-colors cursor-pointer select-none flex flex-col justify-between border group relative ${cellHighlight} ${!item.isCurrentMonth ? "opacity-30 border-transparent hover:border-transparent bg-transparent" : ""}`}
              >
                {/* Top Day Number & Add Action on Hover */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs ${
                      isToday
                        ? "size-6 rounded-full bg-neutral-200/80 dark:bg-neutral-700 text-[#3B3B3B] dark:text-white font-bold flex items-center justify-center -ml-0.5"
                        : "text-[#3B3B3B] dark:text-neutral-200 font-semibold"
                    }`}
                  >
                    {item.date.getDate()}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleOpenAddNote(item.date)
                      }}
                      className="opacity-0 group-hover:opacity-100 size-4 flex items-center justify-center rounded text-neutral-400 hover:text-[#3B3B3B] dark:hover:text-white transition-opacity cursor-pointer"
                      title="Add note on this date"
                    >
                      <Plus className="size-3" />
                    </button>
                  </div>
                </div>

                {/* Event Badges List */}
                <div className="space-y-1 mt-1 overflow-hidden">
                  {events.slice(0, 3).map((ev, evIdx) => {
                    const badgeColor = ev.isCustomNote
                      ? "bg-transparent border-transparent text-[#3B3B3B] dark:text-neutral-200 font-medium px-0.5"
                      : ev.isMockExam
                      ? "bg-purple-500/15 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/30"
                      : ev.is_assignment
                      ? "bg-[#2A9D8F]/15 dark:bg-[#2A9D8F]/20 text-[#2A9D8F] dark:text-[#2A9D8F] border-[#2A9D8F]/30"
                      : "bg-[#E9C46A]/20 dark:bg-[#E9C46A]/25 text-neutral-800 dark:text-neutral-200 border-[#E9C46A]/30"

                    return (
                      <div
                        key={evIdx}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (!ev.isCustomNote && ev.quiz_url) {
                            window.location.href = ev.quiz_url
                          } else {
                            setSelectedDate(item.date)
                          }
                        }}
                        className={
                          ev.isCustomNote
                            ? "text-[10px] font-medium truncate text-[#3B3B3B] dark:text-neutral-200 leading-tight px-1 py-0.5"
                            : `text-[10px] font-medium truncate px-1.5 py-0.5 rounded border leading-tight transition-colors ${badgeColor}`
                        }
                        title={ev.title}
                      >
                        {ev.title}
                      </div>
                    )
                  })}
                  {events.length > 3 && (
                    <span className="block text-[9px] font-medium text-neutral-400 text-center">
                      +{events.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Selected Date Schedule List Card ── */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-md shadow-2xs overflow-hidden flex flex-col justify-between"
      >
        {/* Header: Signature Brand Amber Header */}
        <div className="relative z-10 px-5 py-3.5 sm:px-6 sm:py-4 flex items-center justify-between border-b border-black/5 dark:border-white/5 bg-[#E9C46A]/20 dark:bg-[#E9C46A]/25 shadow-[0_2px_4px_-1px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_4px_-1px_rgba(0,0,0,0.3)]">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-medium text-neutral-600 dark:text-neutral-300">
              {selectedFormatted ? `Schedule for ${selectedFormatted}` : "Schedule"}
            </span>
            {selectedDate && selectedEvents.length > 0 && (
              <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded-full select-none">
                {selectedEvents.length} {selectedEvents.length === 1 ? "item" : "items"}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => handleOpenAddNote(selectedDate || new Date())}
            className="inline-flex items-center gap-1.5 px-3 h-7 rounded-lg text-xs font-semibold text-[#696969] hover:text-[#3B3B3B] dark:text-gray-400 dark:hover:text-white bg-white dark:bg-white/10 hover:bg-white/90 border border-black/5 dark:border-white/10 transition-all shadow-2xs cursor-pointer"
          >
            <Plus className="size-3" />
            <span>Add Note</span>
          </button>
        </div>

        {/* Content list */}
        <div className="p-5 sm:p-6 divide-y divide-black/5 dark:divide-white/5">
          {!selectedDate ? (
            <div className="py-6 text-center text-xs text-neutral-400 dark:text-neutral-500">
              Select any date on the calendar to view its schedule.
            </div>
          ) : selectedEvents.length === 0 ? (
            <div className="py-6 text-center text-xs text-neutral-400 dark:text-neutral-500">
              No events or notes scheduled for this date.
            </div>
          ) : (
            selectedEvents.map((ev, i) => (
              <div key={i} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-semibold text-[#3B3B3B] dark:text-white truncate">
                      {ev.title}
                    </span>
                    {!ev.isCustomNote && (
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        ev.isMockExam
                          ? "bg-purple-500/15 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/30"
                          : ev.is_assignment
                          ? "bg-[#2A9D8F]/15 text-[#2A9D8F] border-[#2A9D8F]/20"
                          : "bg-[#E9C46A]/20 text-neutral-800 dark:text-neutral-200 border-[#E9C46A]/25"
                      }`}>
                        {ev.isMockExam ? "Mock Exam" : ev.is_assignment ? "Assignment" : "Quiz"}
                      </span>
                    )}
                  </div>
                  {ev.description && (
                    <p className="text-xs text-neutral-400 dark:text-neutral-500 line-clamp-1">
                      {ev.description}
                      {ev.isMockExam && ev.score !== null && ev.score !== undefined && (
                        <span className="ml-2 font-medium text-[#2A9D8F]">
                          · Score: {ev.score}/{ev.max_score || 100}
                        </span>
                      )}
                    </p>
                  )}
                  {ev.time && (
                    <div className="flex items-center gap-1 text-[11px] text-neutral-400">
                      <Clock className="size-3" />
                      <span>{format12Hour(ev.time)}</span>
                    </div>
                  )}
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  {!ev.isCustomNote && ev.quiz_url ? (
                    <Link
                      href={ev.quiz_url}
                      className="inline-flex items-center justify-center px-3.5 h-7 rounded-lg text-xs font-semibold text-[#696969] hover:text-[#3B3B3B] dark:text-gray-400 dark:hover:text-white bg-white dark:bg-white/10 hover:bg-white/90 border border-black/5 dark:border-white/10 transition-all shadow-2xs cursor-pointer"
                    >
                      {ev.isMockExam ? (ev.completed_at || ev.score !== null ? "Review" : "Start Exam") : "Open"}
                    </Link>
                  ) : ev.isCustomNote ? (
                    <button
                      type="button"
                      onClick={() => handleDeleteNote(ev.id)}
                      title="Delete note"
                      aria-label="Delete note"
                      className="size-7 rounded-lg text-neutral-400 hover:text-rose-500 hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Add Note / Custom Event Modal ── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-neutral-900 border border-black/10 dark:border-white/15 rounded-2xl w-full max-w-md shadow-xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-black/5 dark:border-white/10 pb-3">
              <div>
                <h3 className="text-base font-semibold text-[#3B3B3B] dark:text-white tracking-tight">
                  Add Note
                </h3>
                <p className="text-xs text-neutral-400 dark:text-neutral-500 font-normal">
                  Scheduled for {noteForm.date}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                aria-label="Close"
                className="size-7 rounded-lg text-neutral-400 hover:text-[#3B3B3B] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNote} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#3B3B3B] dark:text-white mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Study Session, Group Review"
                  value={noteForm.title}
                  onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
                  className="w-full text-xs px-3 h-8 rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-white/5 text-[#3B3B3B] dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-black/20 dark:focus:ring-white/20 transition-all shadow-2xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#3B3B3B] dark:text-white mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={noteForm.date}
                    onChange={(e) => setNoteForm({ ...noteForm, date: e.target.value })}
                    className="w-full text-xs px-3 h-8 rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-white/5 text-[#3B3B3B] dark:text-white focus:outline-none focus:ring-1 focus:ring-black/20 dark:focus:ring-white/20 transition-all shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#3B3B3B] dark:text-white mb-1">
                    Time (Optional)
                  </label>
                  <input
                    type="time"
                    value={noteForm.time}
                    onChange={(e) => setNoteForm({ ...noteForm, time: e.target.value })}
                    className="w-full text-xs px-3 h-8 rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-white/5 text-[#3B3B3B] dark:text-white focus:outline-none focus:ring-1 focus:ring-black/20 dark:focus:ring-white/20 transition-all shadow-2xs"
                  />
                </div>
              </div>

              {/* Color Tag Picker */}
              <div>
                <label className="block text-xs font-semibold text-[#3B3B3B] dark:text-white mb-1.5">
                  Color Tag
                </label>
                <div className="flex items-center gap-2.5 flex-wrap">
                  {NOTE_COLORS.map((c) => {
                    const isSelected = (noteForm.tag || "amber") === c.id
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setNoteForm({ ...noteForm, tag: c.id })}
                        className={`size-6 rounded-full ${c.dot} flex items-center justify-center transition-all cursor-pointer ${
                          isSelected ? "ring-2 ring-offset-2 ring-[#3B3B3B] dark:ring-white scale-110" : "opacity-75 hover:opacity-100"
                        }`}
                        title={c.label}
                      >
                        {isSelected && <span className="size-1.5 rounded-full bg-white shadow-xs" />}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3B3B3B] dark:text-white mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Add details or notes..."
                  value={noteForm.description}
                  onChange={(e) => setNoteForm({ ...noteForm, description: e.target.value })}
                  className="w-full text-xs p-3 rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-white/5 text-[#3B3B3B] dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-black/20 dark:focus:ring-white/20 transition-all shadow-2xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-black/5 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 h-8 rounded-xl text-xs font-semibold text-[#696969] hover:text-[#3B3B3B] dark:text-gray-400 dark:hover:text-white bg-white dark:bg-white/10 hover:bg-white/90 border border-black/5 dark:border-white/10 transition-all shadow-2xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingNote || !noteForm.title.trim()}
                  className="px-4 h-8 rounded-xl text-xs font-semibold text-white bg-[#3B3B3B] hover:bg-[#2B2B2B] dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 transition-all shadow-2xs cursor-pointer disabled:opacity-50"
                >
                  {savingNote ? "Saving..." : "Save Note"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
