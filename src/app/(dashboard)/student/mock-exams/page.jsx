"use client"

import React, { useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "motion/react"
import {
  FileText,
  Play,
  ChevronLeft,
  CheckCircle,
  Clock,
  Award,
  HelpCircle,
  Check,
  X as XIcon,
  Eye,
  Lock,
  RotateCcw,
  PencilLine,
  Wifi,
  WifiOff,
  CloudOff,
  CloudCheck,
  RefreshCw,
  AlertTriangle,
} from "lucide-react"

// Helper to construct local storage key
const getExamStorageKey = (examId) => `peak_mock_session_${examId}`

export default function StudentMockExamsPage() {
  const searchParams = useSearchParams()
  const targetExamId = searchParams ? searchParams.get("examId") : null

  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeExam, setActiveExam] = useState(null)
  const [answers, setAnswers] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const [isReviewMode, setIsReviewMode] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(null)

  // Offline & sync states
  const [isOnline, setIsOnline] = useState(true)
  const [restoredSession, setRestoredSession] = useState(false)
  const [offlineSubmitPending, setOfflineSubmitPending] = useState(false)
  const [syncStatus, setSyncStatus] = useState("synced") // 'synced' | 'saving' | 'offline_cached'

  // Monitor network connectivity
  useEffect(() => {
    setIsOnline(typeof navigator !== "undefined" ? navigator.onLine : true)

    const handleOnline = () => {
      setIsOnline(true)
    }
    const handleOffline = () => {
      setIsOnline(false)
      setSyncStatus("offline_cached")
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  const fetchExams = async () => {
    try {
      const res = await fetch("/api/student/mock-exams")
      if (res.ok) {
        const data = await res.json()
        const fetchedExams = data.exams || []
        setExams(fetchedExams)
        // Cache available exams list offline in case of reconnect
        try {
          localStorage.setItem("peak_cached_exams_list", JSON.stringify(fetchedExams))
        } catch (e) {}
      }
    } catch (err) {
      console.error("Error fetching exams, checking offline cache:", err)
      // If network fails, load from cached list
      try {
        const cached = localStorage.getItem("peak_cached_exams_list")
        if (cached) {
          setExams(JSON.parse(cached))
        }
      } catch (e) {}
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchExams()
  }, [])

  // Auto-save answers to local storage on answer change (shows saving indicator)
  useEffect(() => {
    if (!activeExam || isReviewMode || result) return

    setSyncStatus("saving")
    const key = getExamStorageKey(activeExam.id)
    const sessionData = {
      examId: activeExam.id,
      examData: activeExam,
      answers,
      timeRemaining,
      savedAt: new Date().toISOString(),
    }

    try {
      localStorage.setItem(key, JSON.stringify(sessionData))
      const timer = setTimeout(() => {
        setSyncStatus(isOnline ? "synced" : "offline_cached")
      }, 300)
      return () => clearTimeout(timer)
    } catch (e) {
      console.error("Failed to save to localStorage:", e)
    }
  }, [answers, activeExam, isReviewMode, result, isOnline])

  // Silently save timeRemaining every 5 seconds or on unload without triggering UI state change
  useEffect(() => {
    if (!activeExam || isReviewMode || result || timeRemaining === null) return

    const key = getExamStorageKey(activeExam.id)
    try {
      const existing = localStorage.getItem(key)
      if (existing) {
        const parsed = JSON.parse(existing)
        parsed.timeRemaining = timeRemaining
        localStorage.setItem(key, JSON.stringify(parsed))
      }
    } catch (e) {}
  }, [timeRemaining, activeExam, isReviewMode, result])

  // Check if there are unsubmitted cached answers for exams
  const getCachedSession = (examId) => {
    try {
      const saved = localStorage.getItem(getExamStorageKey(examId))
      if (saved) {
        return JSON.parse(saved)
      }
    } catch (e) {}
    return null
  }

  // Clear cached session after submission
  const clearCachedSession = (examId) => {
    try {
      localStorage.removeItem(getExamStorageKey(examId))
    } catch (e) {}
  }

  // Auto-open exam if examId query param is provided
  useEffect(() => {
    if (!loading && exams.length > 0 && targetExamId && !activeExam) {
      const found = exams.find((e) => String(e.id) === String(targetExamId))
      if (found) {
        const unlockTime = found.unlock_date ? new Date(found.unlock_date).getTime() : null
        const isTooEarly = unlockTime && unlockTime > Date.now()
        if (found.completed) {
          handleReviewExam(found)
        } else if (!isTooEarly) {
          handleStartExam(found)
        }
      }
    }
  }, [loading, exams, targetExamId])

  const handleStartExam = (exam) => {
    const unlockTime = exam.unlock_date ? new Date(exam.unlock_date).getTime() : null
    if (unlockTime && unlockTime > Date.now()) {
      alert("This mock exam is not available yet.")
      return
    }

    // Check if user has an existing cached session for this exam (e.g. after power cut / reload)
    const cached = getCachedSession(exam.id)

    let settings = {}
    if (exam.questions) {
      let parsed = exam.questions
      if (typeof parsed === "string") {
        try {
          parsed = JSON.parse(parsed)
        } catch (e) {}
      }
      if (parsed && !Array.isArray(parsed) && parsed.settings) {
        settings = parsed.settings
      }
    }

    const duration = Number(settings.timeLimitMinutes) || 0

    if (cached && cached.answers && Object.keys(cached.answers).length > 0) {
      // Restore previous answers and remaining time
      setAnswers(cached.answers || {})
      if (cached.timeRemaining !== null && cached.timeRemaining !== undefined) {
        setTimeRemaining(cached.timeRemaining)
      } else if (duration > 0) {
        setTimeRemaining(duration * 60)
      } else {
        setTimeRemaining(null)
      }
      setRestoredSession(true)
    } else {
      // Start fresh
      setAnswers({})
      if (duration > 0) {
        setTimeRemaining(duration * 60)
      } else {
        setTimeRemaining(null)
      }
      setRestoredSession(false)
    }

    setActiveExam(exam)
    setResult(null)
    setIsReviewMode(false)
  }

  // Timer countdown
  useEffect(() => {
    if (!activeExam || isReviewMode || result || timeRemaining === null) return
    if (timeRemaining <= 0) {
      handleSubmitExam()
      return
    }
    const timer = setInterval(() => {
      setTimeRemaining((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [activeExam, isReviewMode, result, timeRemaining])

  const formatTime = (seconds) => {
    if (seconds === null || seconds === undefined) return ""
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleReviewExam = (exam) => {
    setActiveExam(exam)
    setAnswers(exam.student_answers || {})
    setResult({
      score: exam.score,
      maxScore: exam.max_score,
      percentage: (exam.score / (exam.max_score || 1)) * 100,
    })
    setIsReviewMode(true)
    setTimeRemaining(null)
  }

  const handleOptionSelect = (qId, optionId, isMultiple) => {
    if (isReviewMode || result) return
    setAnswers((prev) => {
      const current = prev[qId] || []
      if (isMultiple) {
        if (current.includes(optionId)) {
          return { ...prev, [qId]: current.filter((id) => id !== optionId) }
        } else {
          return { ...prev, [qId]: [...current, optionId] }
        }
      } else {
        return { ...prev, [qId]: [optionId] }
      }
    })
  }

  const handleShortAnswerChange = (qId, text) => {
    if (isReviewMode || result) return
    setAnswers((prev) => ({ ...prev, [qId]: text }))
  }

  const handleSubmitExam = async () => {
    if (!activeExam || submitting) return

    // If offline, save into offline submit queue
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setOfflineSubmitPending(true)
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/student/mock-exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examId: activeExam.id,
          answers,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setResult({
          score: data.score,
          maxScore: data.maxScore,
          percentage: (data.score / (data.maxScore || 1)) * 100,
        })
        setIsReviewMode(true)
        setTimeRemaining(null)
        setOfflineSubmitPending(false)
        clearCachedSession(activeExam.id)
        fetchExams() // reload list to show score
      } else {
        alert("Failed to submit exam online. Your answers are saved locally on this computer. Please try submitting again.")
      }
    } catch (err) {
      console.error(err)
      setOfflineSubmitPending(true)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Loading Exams...</p>
        </div>
      </div>
    )
  }

  // ── TEST TAKING / REVIEW IMMERSIVE VIEW ──
  if (activeExam) {
    const questions = activeExam.questions?.questions || activeExam.questions || []
    const isCompleted = isReviewMode || !!result

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 w-full max-w-6xl mx-auto px-4 py-4 pb-20">
        {/* Restored Session Notification */}
        {restoredSession && !isCompleted && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 px-5 flex items-center justify-between text-xs text-amber-800 dark:text-amber-300">
            <div className="flex items-center gap-2.5">
              <RefreshCw className="h-4 w-4 text-amber-600 animate-spin-slow shrink-0" />
              <span>
                <strong>Session Restored:</strong> We retrieved your saved answers and timer from this device.
              </span>
            </div>
            <button
              onClick={() => {
                if (confirm("Are you sure you want to reset all your answers for this exam?")) {
                  clearCachedSession(activeExam.id)
                  setAnswers({})
                  setRestoredSession(false)
                }
              }}
              className="underline font-semibold hover:text-amber-950 dark:hover:text-amber-100 text-xs cursor-pointer ml-3 shrink-0"
            >
              Reset Draft
            </button>
          </div>
        )}

        {/* Offline Sync Status Banner */}
        {!isOnline && (
          <div className="bg-zinc-800 text-white rounded-2xl p-3.5 px-5 flex items-center justify-between text-xs shadow-md">
            <div className="flex items-center gap-2.5">
              <WifiOff className="h-4 w-4 text-amber-400 shrink-0" />
              <span>
                <strong>Offline Mode:</strong> Internet disconnected. You can keep answering questions uninterrupted — your progress is safely cached locally.
              </span>
            </div>
            <span className="text-[11px] opacity-75 shrink-0 hidden sm:inline">
              Saved locally
            </span>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border pb-4 gap-4">
          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl font-bold text-foreground">{activeExam.title}</h2>
                {isReviewMode ? (
                  <span className="text-xs text-[#E9C46A] bg-[#E9C46A]/10 font-semibold px-2.5 py-0.5 rounded-full border border-[#E9C46A]/20">
                    Review Mode
                  </span>
                ) : (
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full border ${
                    !isOnline
                      ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                      : syncStatus === "saving"
                      ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                      : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                  }`}>
                    {!isOnline ? (
                      <>
                        <CloudOff className="h-3 w-3" /> Offline Saved
                      </>
                    ) : syncStatus === "saving" ? (
                      <>
                        <RefreshCw className="h-3 w-3 animate-spin" /> Saving...
                      </>
                    ) : (
                      <>
                        <CloudCheck className="h-3 w-3" /> Cached Locally
                      </>
                    )}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{activeExam.exam_code}</p>
            </div>
          </div>
          {!isCompleted ? (
            <div className="flex items-center gap-2.5">
              <button
                onClick={handleSubmitExam}
                disabled={submitting}
                className="bg-[#E9C46A] hover:bg-[#dfb550] text-white font-bold py-2.5 px-6 rounded-xl text-xs transition-all active:scale-95 shadow-sm cursor-pointer disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit Exam"}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setActiveExam(null)}
              className="flex items-center gap-1.5 bg-card hover:bg-muted text-foreground border border-border font-medium px-4 py-2 rounded-xl text-xs shadow-2xs transition-all cursor-pointer active:scale-95"
            >
              Exit Review
            </button>
          )}
        </div>

        {/* Offline Submission Modal / Alert */}
        {offlineSubmitPending && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 text-xs text-amber-900 dark:text-amber-200 space-y-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-sm">Exam Finished & Answers Safely Cached</p>
                <p className="text-muted-foreground leading-relaxed">
                  You are currently offline or your network disconnected. Your answers are saved locally on this browser. Once you are connected back to the internet, click the button below to upload your score.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={handleSubmitExam}
                disabled={submitting}
                className="bg-[#E9C46A] hover:bg-[#dfb550] text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Wifi className="h-3.5 w-3.5" /> {submitting ? "Uploading..." : "Upload & Submit Now"}
              </button>
            </div>
          </div>
        )}

        {/* Timer Banner */}
        {timeRemaining !== null && !isCompleted && (
          <div className="sticky top-4 z-30 bg-card/95 backdrop-blur-md border border-border rounded-2xl p-3.5 px-5 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2 text-primary font-bold text-xs">
              <Clock className="h-4 w-4 animate-pulse" />
              <span>Time Remaining</span>
            </div>
            <div className={`font-bold text-base tracking-tight ${timeRemaining < 300 ? 'text-red-600 animate-pulse' : 'text-foreground'}`}>
              {formatTime(timeRemaining)}
            </div>
          </div>
        )}

        {/* Results Screen */}
        {result && (
          <motion.div 
            initial={{ scale: 0.98, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
              <div>
                <h3 className="text-lg font-bold text-foreground">Exam Performance Summary</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Review your answers below. Correct answers are highlighted in green, and incorrect answers are flagged in red.
                </p>
              </div>
              <div className="flex items-center gap-5 text-xs font-semibold shrink-0">
                <span className="inline-flex items-center gap-1.5 text-emerald-600">
                  <span className="size-2.5 rounded-full bg-emerald-500" /> Correct Answer
                </span>
                <span className="inline-flex items-center gap-1.5 text-rose-500">
                  <span className="size-2.5 rounded-full bg-rose-500" /> Your Wrong Choice
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-muted/30 border border-border rounded-xl p-3.5 text-center">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Score</span>
                <div className="text-2xl font-bold text-foreground mt-1">{result.score} / {result.maxScore}</div>
              </div>
              <div className="bg-muted/30 border border-border rounded-xl p-3.5 text-center">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Percentage</span>
                <div className={`text-2xl font-bold mt-1 ${result.percentage >= 75 ? "text-emerald-600" : result.percentage >= 60 ? "text-blue-600" : "text-amber-600"}`}>
                  {result.percentage.toFixed(1)}%
                </div>
              </div>
              <div className="bg-muted/30 border border-border rounded-xl p-3.5 text-center">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Result</span>
                <div className={`text-2xl font-bold mt-1 ${result.percentage >= 75 ? "text-emerald-600" : "text-amber-600"}`}>
                  {result.percentage >= 75 ? "Passed" : "Needs Review"}
                </div>
              </div>
              <div className="bg-muted/30 border border-border rounded-xl p-3.5 text-center">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Questions</span>
                <div className="text-2xl font-bold text-foreground mt-1">{questions.filter(q => q.type === 'question').length}</div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Questions list */}
        <div className="space-y-6">
          {questions.filter(q => q.type === 'question').map((q, idx) => {
            const selected = answers[q.id] || []
            const selectedArr = Array.isArray(selected) ? selected.map(s => s.toString()) : [selected.toString()]

            // Evaluate question correctness for review mode
            let isQuestionCorrect = false
            if (isCompleted) {
              if (q.questionType === "True or False" || q.questionType === "Multiple Choice") {
                const correctIds = q.options?.filter(o => o.isCorrect).map(o => o.id.toString()) || []
                if (correctIds.length > 0 &&
                    correctIds.length === selectedArr.length &&
                    correctIds.every(id => selectedArr.includes(id))) {
                  isQuestionCorrect = true
                }
              } else if (q.questionType === "Short Answer") {
                const targetStr = (q.correctAnswer || "").trim()
                const studentStr = (typeof selected === "string" ? selected : "").trim()
                const matches = q.caseSensitive 
                    ? studentStr === targetStr 
                    : studentStr.toLowerCase() === targetStr.toLowerCase()
                if (targetStr && matches) {
                  isQuestionCorrect = true
                }
              }
            }

            return (
              <div 
                key={q.id} 
                className={`p-6 rounded-xl border bg-card/45 backdrop-blur-xs space-y-4 transition-all ${
                  isCompleted
                    ? isQuestionCorrect
                      ? "border-green-200 dark:border-green-900/50 bg-green-50/20 dark:bg-green-950/5"
                      : "border-red-200 dark:border-red-900/50 bg-red-50/20 dark:bg-red-950/5"
                    : "border-border"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-2">
                    <span className="font-bold text-primary">{idx + 1}.</span>
                    <p className="font-semibold text-foreground whitespace-pre-wrap">{q.text}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold bg-muted px-2 py-0.5 rounded-full text-muted-foreground uppercase">{q.points || 1} pt</span>
                  </div>
                </div>

                {q.image && (
                  <div className="max-w-md">
                    <img src={q.image} alt="Exam figure" className="rounded-lg border max-h-48 object-contain" />
                  </div>
                )}

                {/* Multiple Choice / True or False */}
                {(q.questionType === "Multiple Choice" || q.questionType === "True or False") && (
                  <div className="grid gap-2.5 pt-2">
                    {q.options?.map((opt) => {
                      const isSelected = selectedArr.includes(opt.id.toString())
                      const isCorrectAnswer = isCompleted && opt.isCorrect
                      const isWrongSelected = isCompleted && isSelected && !opt.isCorrect

                      return (
                        <button
                          key={opt.id}
                          type="button"
                          disabled={isCompleted}
                          onClick={() => handleOptionSelect(q.id, opt.id, q.multipleAnswers)}
                          className={`flex items-center justify-between p-3.5 rounded-xl border text-xs sm:text-sm font-medium transition-all text-left ${
                            isCompleted
                              ? isCorrectAnswer
                                ? "border-green-500 bg-green-500/10 text-green-900 dark:text-green-100 ring-1 ring-green-500"
                                : isWrongSelected
                                ? "border-red-500 bg-red-500/10 text-red-900 dark:text-red-100 ring-1 ring-red-500"
                                : "border-border/60 opacity-60 text-muted-foreground"
                              : isSelected
                              ? "border-primary bg-primary/10 text-primary font-bold shadow-xs"
                              : "border-border hover:bg-muted/50 text-foreground"
                          }`}
                        >
                          <span>{opt.text}</span>
                          <div className="flex items-center gap-2">
                            {isCompleted && (
                              <>
                                {isCorrectAnswer && <Check className="h-4 w-4 text-green-600 dark:text-green-400" />}
                                {isWrongSelected && <XIcon className="h-4 w-4 text-red-600 dark:text-red-400" />}
                              </>
                            )}
                            <div className={`size-4 rounded-full border flex items-center justify-center ${
                              isSelected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30"
                            }`}>
                              {isSelected && <div className="size-1.5 rounded-full bg-white" />}
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* Short Answer */}
                {q.questionType === "Short Answer" && (
                  <div className="pl-4 max-w-lg space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase text-muted-foreground">Your Answer:</span>
                        {isCompleted && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                            isQuestionCorrect 
                              ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
                              : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                          }`}>
                            {isQuestionCorrect ? <Check className="h-3 w-3" /> : <XIcon className="h-3 w-3" />}
                            {isQuestionCorrect ? "Correct" : "Wrong Answer"}
                          </span>
                        )}
                      </div>
                      <input 
                        type="text" 
                        value={typeof selected === "string" ? selected : ""}
                        disabled={isCompleted}
                        onChange={e => handleShortAnswerChange(q.id, e.target.value)}
                        placeholder="Type your answer here..."
                        className={`w-full bg-background border rounded-xl px-4 py-2.5 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 font-medium transition-all ${
                          isCompleted
                            ? isQuestionCorrect
                              ? "border-green-500 bg-green-500/10 ring-2 ring-green-500/20 text-green-900 dark:text-green-100"
                              : "border-red-500 bg-red-500/10 ring-2 ring-red-500/20 text-red-900 dark:text-red-100"
                            : "border-input focus:ring-slate-400/30"
                        }`}
                      />
                    </div>

                    {isCompleted && !isQuestionCorrect && (
                      <div className="text-xs font-semibold text-green-800 dark:text-green-200 bg-green-500/10 p-3 rounded-xl border border-green-500/40 flex items-start gap-2.5">
                        <Check className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                        <div>
                          <span className="text-[10px] font-extrabold uppercase text-green-700 dark:text-green-400 block tracking-wider">
                            Correct Answer:
                          </span>
                          <span className="text-sm font-bold text-green-900 dark:text-green-100">
                            {q.correctAnswer}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </motion.div>
    )
  }

  // ── LIST VIEW (ATTACHED TO BACKGROUND) ──
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 w-full max-w-6xl mx-auto px-4 py-4 relative">
      {/* Header */}
      <div className="border-b border-gray-200/50 pb-4">
        <div className="flex items-center gap-2.5 mb-1">
          <PencilLine className="h-6 w-6 text-[#E9C46A]" />
          <h1 className="text-2xl font-bold tracking-wider text-[#4d4d4d] uppercase">
            MOCK EXAMS
          </h1>
        </div>
        <p className="text-[#8c8c8c] text-sm font-medium">
          Practice with board examination mock exams. Your results will instantly sync with the system gradebook.
        </p>
      </div>

      {/* Available Exams grid */}
      <div className="grid gap-5 md:grid-cols-2">
        {exams.length === 0 ? (
          <div className="col-span-full border border-gray-100 rounded-2xl p-10 text-center text-muted-foreground text-xs italic bg-white shadow-2xs">
            No active mock exams are available for your batch at this moment.
          </div>
        ) : exams.map(exam => {
          const hasTaken = exam.score !== null && exam.score !== undefined
          const cachedSession = getCachedSession(exam.id)
          const hasDraft = !hasTaken && cachedSession && cachedSession.answers && Object.keys(cachedSession.answers).length > 0

          let settings = {}
          if (exam.questions) {
            let parsed = exam.questions
            if (typeof parsed === "string") {
              try { parsed = JSON.parse(parsed) } catch (e) {}
            }
            if (parsed && !Array.isArray(parsed) && parsed.settings) {
              settings = parsed.settings
            }
          }

          const unlockTime = exam.unlock_date ? new Date(exam.unlock_date).getTime() : null
          const isTooEarly = unlockTime && unlockTime > Date.now()
          const startDateTime = exam.unlock_date ? new Date(exam.unlock_date) : null
          const duration = Number(settings.timeLimitMinutes) || 0
          const retries = Number(settings.maxRetries) || 0
          const attemptsCount = Number(exam.attempts_count) || (hasTaken ? 1 : 0)
          const maxAllowedAttempts = 1 + retries
          const canRetake = retries > 0 && attemptsCount < maxAllowedAttempts

          return (
            <div key={exam.id} className="border border-gray-100 rounded-2xl p-6 sm:p-7 bg-white shadow-2xs hover:border-gray-200/80 transition-all flex flex-col justify-between space-y-5 min-h-[220px]">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <span className="text-xs bg-gray-50 px-2.5 py-1 rounded-md text-gray-600 border border-gray-200/60 font-bold uppercase tracking-wider shadow-2xs">
                    {exam.exam_code}
                  </span>
                  {hasTaken ? (
                    <span className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 dark:bg-green-950/20 px-3 py-1 rounded-full border border-green-200 font-bold">
                      <CheckCircle className="h-3.5 w-3.5" /> Completed
                    </span>
                  ) : hasDraft ? (
                    <span className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 font-bold">
                      <RefreshCw className="h-3 w-3" /> Draft Saved
                    </span>
                  ) : null}
                </div>
                <h3 className="font-bold text-[#4d4d4d] text-base leading-snug">{exam.title}</h3>
                <p className="text-xs sm:text-sm text-[#8c8c8c] line-clamp-2 leading-relaxed">{exam.description || "No description provided."}</p>

                {/* Scheduled Start Date & Time Note (exact quiz announcement dialogue design) */}
                {isTooEarly && (
                  <div className="bg-white dark:bg-card border border-gray-200/80 dark:border-border rounded-xl px-4 py-3 text-xs text-gray-600 dark:text-muted-foreground shadow-2xs mt-2">
                    <span className="font-semibold text-gray-800 dark:text-foreground">Exam Not Available Yet:</span> Scheduled to open on <span className="font-medium text-gray-900 dark:text-foreground">{startDateTime ? startDateTime.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : ''}</span>.
                  </div>
                )}
              </div>

              {/* Exam Details (Questions count, Duration, Retries) & Action Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-t border-gray-100 pt-4 gap-4">
                {/* Meta details */}
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-gray-500 font-medium">
                  <div className="flex items-center gap-1.5">
                    <HelpCircle className="h-4 w-4 text-gray-400" />
                    <span>{exam.question_count || 0} questions</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span>{duration > 0 ? `${duration} mins` : "Unlimited time"}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <RotateCcw className="h-4 w-4 text-gray-400" />
                    <span>
                      {retries > 0 
                        ? `${attemptsCount}/${maxAllowedAttempts} attempts used` 
                        : "Single attempt only"}
                    </span>
                  </div>
                </div>

                {/* Action button */}
                <div className="shrink-0 flex items-center justify-end">
                  {hasTaken ? (
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="block text-[10px] text-gray-400 font-bold uppercase">Your Score</span>
                        <span className="text-sm text-[#4d4d4d] font-extrabold">{exam.score} / {exam.max_score}</span>
                      </div>
                      <button 
                        onClick={() => handleReviewExam(exam)}
                        className="flex items-center gap-1.5 bg-white hover:bg-gray-50 text-gray-700 font-bold px-3 py-2 rounded-xl transition-all text-xs border border-gray-200/70 shadow-2xs cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5 text-gray-500" /> Review
                      </button>
                      {canRetake && (
                        <button 
                          onClick={() => {
                            clearCachedSession(exam.id)
                            handleStartExam(exam)
                          }}
                          className="flex items-center gap-1.5 bg-[#E9C46A] hover:bg-[#dfb550] text-white font-bold px-3.5 py-2 rounded-xl transition-all text-xs shadow-2xs cursor-pointer active:scale-95"
                        >
                          <RotateCcw className="h-3.5 w-3.5" /> Retake
                        </button>
                      )}
                    </div>
                  ) : (
                    <button 
                      onClick={() => !isTooEarly && handleStartExam(exam)}
                      disabled={isTooEarly}
                      title={isTooEarly ? "Exam is not available yet" : hasDraft ? "Resume Exam" : "Start Exam"}
                      className={`flex items-center gap-2 font-bold px-5 py-2 rounded-xl text-xs sm:text-sm transition-all shadow-2xs ${
                        isTooEarly
                          ? "bg-[#E9C46A]/40 text-white/60 cursor-not-allowed opacity-60"
                          : "bg-[#E9C46A] hover:bg-[#dfb550] text-white active:scale-95 cursor-pointer"
                      }`}
                    >
                      <Play className={`h-3.5 w-3.5 ${isTooEarly ? "fill-white/60 text-white/60" : "fill-white text-white"}`} /> 
                      {hasDraft ? "Resume Exam" : "Start Exam"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}
