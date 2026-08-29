"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import Link from "next/link"
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  FileText,
  HelpCircle,
  ArrowRight,
  Maximize2,
  Minimize2,
  Plus,
  Trash2,
  X,
  Pin
} from "lucide-react"

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export default function StudentCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [assignments, setAssignments] = useState([])
  const [customNotes, setCustomNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false)
  const containerRef = useRef(null)

  // Filter: 'all' | 'assignments' | 'quizzes' | 'notes'
  const [typeFilter, setTypeFilter] = useState("all")

  // Modal for adding personal calendar item
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [noteForm, setNoteForm] = useState({
    title: "",
    description: "",
    time: "",
    tag: "personal",
    date: ""
  })
  const [savingNote, setSavingNote] = useState(false)

  // Fetch all assignments, quizzes, and personal notes
  const fetchData = async () => {
    setLoading(true)
    try {
      const [assignRes, notesRes] = await Promise.all([
        fetch("/api/student/assignments"),
        fetch("/api/student/calendar/notes")
      ])
      
      if (assignRes.ok) {
        const data = await assignRes.json()
        setAssignments(data.assignments || [])
      }

      if (notesRes.ok) {
        const data = await notesRes.json()
        setCustomNotes(data.notes || [])
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
      if (typeFilter === "notes") return

      if (item.start_date) {
        const startKey = formatYMD(item.start_date)
        if (startKey) {
          if (!map[startKey]) map[startKey] = []
          map[startKey].push({ ...item, eventRole: "start", isCustomNote: false })
        }
      }

      if (item.due_date) {
        const dueKey = formatYMD(item.due_date)
        if (dueKey && dueKey !== formatYMD(item.start_date)) {
          if (!map[dueKey]) map[dueKey] = []
          map[dueKey].push({ ...item, eventRole: "due", isCustomNote: false })
        }
      }
    })

    // 2. Personal Notes / Custom Events
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
            tag: note.tag,
            eventRole: "note",
            isCustomNote: true
          })
        }
      })
    }

    return map
  }, [assignments, customNotes, typeFilter])

  const selectedDateKey = formatYMD(selectedDate)
  const selectedEvents = useMemo(() => {
    return eventsByDate[selectedDateKey] || []
  }, [eventsByDate, selectedDateKey])

  const monthName = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })
  const selectedFormatted = selectedDate.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  })

  // Open add note modal for a specific day
  const handleOpenAddNote = (d = selectedDate) => {
    setNoteForm({
      title: "",
      description: "",
      time: "",
      tag: "personal",
      date: formatYMD(d)
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
        setCustomNotes((prev) => [...prev, data.note])
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
      className={`space-y-6 w-full ${
        isFullscreen
          ? "fixed inset-0 z-50 bg-white dark:bg-slate-950 p-6 md:p-8 overflow-y-auto"
          : "max-w-6xl mx-auto px-4 py-4"
      } animate-in fade-in duration-200`}
    >
      {/* ── Header & Navigation Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200/60 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-wider text-[#4d4d4d] dark:text-slate-200 uppercase">
              CALENDAR
            </h1>
            {isFullscreen && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300">
                Workspace Mode
              </span>
            )}
          </div>
          <p className="text-xs text-[#8c8c8c] dark:text-slate-400 font-medium mt-0.5">
            {isFullscreen
              ? "Full screen editor: click on any day to add or manage your personal tasks & schedules."
              : "Schedule of quizzes, assignments, and personal notes."}
          </p>
        </div>

        {/* Action Controls & Filters */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {/* Quick Add Button with Blue System Primary Styling */}
          <button
            onClick={() => handleOpenAddNote(selectedDate)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg bg-[#E9C46A] hover:bg-[#dfb550] text-white shadow-sm transition-all cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Event</span>
          </button>

          {/* System Blue Active Filter Pills */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setTypeFilter("all")}
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                typeFilter === "all"
                  ? "bg-[#E9C46A] text-slate-900 shadow-sm"
                  : "bg-gray-50 text-[#4d4d4d] border border-gray-200/50 hover:bg-gray-100 hover:border-gray-300"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setTypeFilter("quizzes")}
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                typeFilter === "quizzes"
                  ? "bg-[#E9C46A] text-slate-900 shadow-sm"
                  : "bg-gray-50 text-[#4d4d4d] border border-gray-200/50 hover:bg-gray-100 hover:border-gray-300"
              }`}
            >
              Quizzes
            </button>
            <button
              onClick={() => setTypeFilter("assignments")}
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                typeFilter === "assignments"
                  ? "bg-[#E9C46A] text-slate-900 shadow-sm"
                  : "bg-gray-50 text-[#4d4d4d] border border-gray-200/50 hover:bg-gray-100 hover:border-gray-300"
              }`}
            >
              Assignments
            </button>
            <button
              onClick={() => setTypeFilter("notes")}
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                typeFilter === "notes"
                  ? "bg-[#E9C46A] text-slate-900 shadow-sm"
                  : "bg-gray-50 text-[#4d4d4d] border border-gray-200/50 hover:bg-gray-100 hover:border-gray-300"
              }`}
            >
              My Notes
            </button>
          </div>

          {/* Full Screen Toggle Button */}
          <button
            onClick={toggleFullscreen}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg border border-gray-200/60 bg-white text-gray-700 hover:bg-gray-100 hover:border-gray-300 transition-all cursor-pointer shadow-2xs"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen Workspace"}
          >
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5 text-[#E9C46A]" /> : <Maximize2 className="h-3.5 w-3.5 text-[#E9C46A]" />}
            <span>{isFullscreen ? "Exit" : "Full Screen"}</span>
          </button>
        </div>
      </div>

      {/* ── Main Layout: Full Width Calendar Grid ── */}
      <div className="w-full">
        {/* Calendar Grid Card Container */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
          {/* Month Toolbar */}
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
              {monthName}
            </h2>

            <div className="flex items-center gap-1.5">
              <button
                onClick={goToToday}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground transition-colors border border-border"
              >
                Today
              </button>
              <button
                onClick={prevMonth}
                className="p-1 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors border border-border"
                title="Previous Month"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={nextMonth}
                className="p-1 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors border border-border"
                title="Next Month"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Day of Week Row */}
          <div className="grid grid-cols-7 text-center pb-2 border-b border-border bg-muted/20 py-1.5 rounded-lg">
            {DAYS_OF_WEEK.map((day) => (
              <span key={day} className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                {day}
              </span>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {calendarDays.map((item, idx) => {
              const dayKey = formatYMD(item.date)
              const events = eventsByDate[dayKey] || []
              const isSelected = selectedDateKey === dayKey
              const isToday = formatYMD(new Date()) === dayKey

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedDate(item.date)}
                  onDoubleClick={() => handleOpenAddNote(item.date)}
                  className={`min-h-[90px] sm:min-h-[110px] p-2.5 rounded-xl transition-all cursor-pointer select-none flex flex-col justify-between border group relative ${
                    isSelected
                      ? "border-primary bg-primary/5 dark:bg-primary/10 shadow-2xs"
                      : isToday
                      ? "border-border bg-background shadow-2xs ring-1 ring-border"
                      : "border-border/60 bg-background/60 hover:border-border hover:bg-background"
                  } ${!item.isCurrentMonth ? "opacity-30 bg-transparent border-transparent hover:border-transparent" : ""}`}
                >
                  {/* Top Day Number & Add Action on Hover */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold ${
                        isToday
                          ? "w-5 h-5 flex items-center justify-center rounded-full bg-[#E9C46A] text-slate-900 font-bold shadow-xs"
                          : isSelected
                          ? "text-[#E9C46A] font-bold"
                          : "text-foreground font-medium"
                      }`}
                    >
                      {item.date.getDate()}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleOpenAddNote(item.date)
                        }}
                        className="opacity-0 group-hover:opacity-100 h-4 w-4 flex items-center justify-center rounded text-muted-foreground hover:text-[#E9C46A] transition-opacity cursor-pointer"
                        title="Add event on this date"
                      >
                        <Plus className="h-3 w-3" />
                      </button>

                      {events.length > 0 && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#E9C46A]" />
                      )}
                    </div>
                  </div>

                  {/* Event Badges List */}
                  <div className="space-y-1 mt-1 overflow-hidden">
                    {events.slice(0, 3).map((ev, evIdx) => (
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
                        className={`text-[10px] font-medium truncate px-1.5 py-0.5 rounded leading-tight border transition-colors ${
                          ev.isCustomNote
                            ? "bg-muted text-foreground border-border/80 font-semibold"
                            : "bg-muted/60 text-muted-foreground border-border/50 hover:text-foreground hover:border-border"
                        }`}
                        title={ev.title}
                      >
                        {ev.title}
                      </div>
                    ))}
                    {events.length > 3 && (
                      <span className="block text-[9px] font-medium text-muted-foreground text-center">
                        +{events.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Add Note / Custom Event Modal ── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Add Calendar Note / Event
                </h3>
                <p className="text-xs text-gray-400">
                  Scheduled for {noteForm.date}
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNote} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Study Chapter 4, Group Review"
                  value={noteForm.title}
                  onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-gray-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={noteForm.date}
                    onChange={(e) => setNoteForm({ ...noteForm, date: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    Time (Optional)
                  </label>
                  <input
                    type="time"
                    value={noteForm.time}
                    onChange={(e) => setNoteForm({ ...noteForm, time: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  Description / Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Add details, links, or notes..."
                  value={noteForm.description}
                  onChange={(e) => setNoteForm({ ...noteForm, description: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingNote || !noteForm.title.trim()}
                  className="px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white bg-[#E9C46A] hover:bg-[#dfb550] rounded-lg transition-colors disabled:opacity-50 shadow-sm cursor-pointer"
                >
                  {savingNote ? "Saving..." : "Save Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
