"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { FileText, Play, ChevronLeft, CheckCircle, Clock, Award, HelpCircle, Check, X as XIcon, Eye } from "lucide-react"

export default function StudentMockExamsPage() {
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeExam, setActiveExam] = useState(null)
  const [answers, setAnswers] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const [isReviewMode, setIsReviewMode] = useState(false)

  const fetchExams = async () => {
    try {
      const res = await fetch("/api/student/mock-exams")
      if (res.ok) {
        const data = await res.json()
        setExams(data.exams || [])
      }
    } catch (err) {
      console.error("Error fetching exams:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchExams()
  }, [])

  const handleStartExam = (exam) => {
    setActiveExam(exam)
    setAnswers({})
    setResult(null)
    setIsReviewMode(false)
  }

  const handleReviewExam = (exam) => {
    setActiveExam(exam)
    setAnswers(exam.student_answers || {})
    setResult({
      score: exam.score,
      maxScore: exam.max_score,
      percentage: (exam.score / (exam.max_score || 1)) * 100
    })
    setIsReviewMode(true)
  }

  const handleOptionSelect = (qId, optionId, isMultiple) => {
    if (isReviewMode || result) return
    setAnswers(prev => {
      const current = prev[qId] || []
      if (isMultiple) {
        if (current.includes(optionId)) {
          return { ...prev, [qId]: current.filter(id => id !== optionId) }
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
    setAnswers(prev => ({ ...prev, [qId]: text }))
  }

  const handleSubmitExam = async () => {
    if (!activeExam) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/student/mock-exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examId: activeExam.id,
          answers
        })
      })
      if (res.ok) {
        const data = await res.json()
        setResult({
          score: data.score,
          maxScore: data.maxScore,
          percentage: (data.score / (data.maxScore || 1)) * 100
        })
        setIsReviewMode(true)
        fetchExams() // reload list to show score
      } else {
        alert("Failed to submit exam. Please try again.")
      }
    } catch (err) {
      console.error(err)
      alert("Error submitting exam.")
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
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-4xl mx-auto pb-20">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setActiveExam(null)} 
              className="p-2 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-foreground">{activeExam.title}</h2>
                {isReviewMode && (
                  <span className="text-[10px] bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-blue-200 dark:border-blue-800">
                    Review Mode
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground font-mono">{activeExam.exam_code}</p>
            </div>
          </div>
          {!isCompleted ? (
            <button
              onClick={handleSubmitExam}
              disabled={submitting}
              className="bg-[#eedc82] hover:bg-[#e6d370] text-black font-bold py-2.5 px-6 rounded-xl text-xs transition-all active:scale-95 shadow-sm"
            >
              {submitting ? "Submitting..." : "Submit Exam"}
            </button>
          ) : (
            <button
              onClick={() => setActiveExam(null)}
              className="bg-muted hover:bg-muted/80 text-foreground font-bold py-2 px-4 rounded-xl text-xs transition-all"
            >
              Exit Review
            </button>
          )}
        </div>

        {/* Results Screen */}
        {result && (
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="border border-green-200 bg-green-50/50 dark:bg-green-950/10 rounded-2xl p-6 text-center space-y-4">
            <div className="inline-flex p-3 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600">
              <Award className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Exam Performance Summary</h3>
              <p className="text-sm text-muted-foreground mt-1">Review your answers below. Correct answers are highlighted in green, and incorrect answers are flagged in red.</p>
            </div>
            <div className="flex justify-center gap-8 py-4">
              <div className="text-center">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Score</span>
                <div className="text-3xl font-black text-foreground mt-1">{result.score} / {result.maxScore}</div>
              </div>
              <div className="text-center">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Percentage</span>
                <div className="text-3xl font-black text-foreground mt-1">{result.percentage.toFixed(1)}%</div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-4 text-xs font-semibold">
              <span className="inline-flex items-center gap-1.5 text-green-600">
                <span className="size-3 rounded-full bg-green-500" /> Correct Answer
              </span>
              <span className="inline-flex items-center gap-1.5 text-red-600">
                <span className="size-3 rounded-full bg-red-500" /> Your Wrong Choice
              </span>
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
                {q.questionType !== "Short Answer" && (
                  <div className="space-y-3 pl-4">
                    {q.options?.map(opt => {
                      const optIdStr = (opt.id ?? "").toString()
                      const isUserSelected = selectedArr.includes(optIdStr)
                      const isCorrectOption = Boolean(opt.isCorrect)

                      let cardStyle = "border-border hover:bg-muted/30"
                      let badgeElement = null
                      let radioIcon = null

                      if (isCompleted) {
                        if (isCorrectOption) {
                          // CORRECT ANSWER: Always highlighted in bright GREEN (even if student picked wrong)
                          cardStyle = "bg-green-500/15 border-green-500 text-green-950 dark:text-green-200 ring-2 ring-green-500/40 font-semibold shadow-xs"
                          badgeElement = (
                            <span className="flex items-center gap-1.5 text-xs font-bold text-green-800 dark:text-green-200 bg-green-500/25 px-3 py-1 rounded-full border border-green-500/50">
                              <Check className="h-4 w-4 stroke-[3]" /> Correct Answer
                            </span>
                          )
                          radioIcon = (
                            <div className="size-5 rounded-full bg-green-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                              <Check className="h-3.5 w-3.5 stroke-[3]" />
                            </div>
                          )
                        } else if (isUserSelected && !isCorrectOption) {
                          // WRONG USER CHOICE: highlighted in RED
                          cardStyle = "bg-red-500/15 border-red-500 text-red-950 dark:text-red-200 ring-2 ring-red-500/40 font-semibold shadow-xs"
                          badgeElement = (
                            <span className="flex items-center gap-1.5 text-xs font-bold text-red-800 dark:text-red-200 bg-red-500/25 px-3 py-1 rounded-full border border-red-500/50">
                              <XIcon className="h-4 w-4 stroke-[3]" /> Your Wrong Choice
                            </span>
                          )
                          radioIcon = (
                            <div className="size-5 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                              <XIcon className="h-3.5 w-3.5 stroke-[3]" />
                            </div>
                          )
                        } else {
                          // Neutral options
                          cardStyle = "opacity-45 border-border/70 bg-card/20"
                          radioIcon = <div className="size-4 rounded-full border border-muted-foreground/40 shrink-0" />
                        }
                      } else {
                        if (isUserSelected) {
                          cardStyle = "bg-primary/5 border-primary/60 ring-2 ring-primary/20 shadow-xs"
                          radioIcon = (
                            <div className="size-4 rounded-full border-2 border-primary bg-primary flex items-center justify-center shrink-0">
                              <div className="size-1.5 rounded-full bg-white" />
                            </div>
                          )
                        } else {
                          radioIcon = <div className="size-4 rounded-full border border-muted-foreground shrink-0" />
                        }
                      }

                      return (
                        <div 
                          key={opt.id} 
                          onClick={() => !isCompleted && handleOptionSelect(q.id, opt.id, q.questionType === "Multiple Choice" && q.options?.filter(o => o.isCorrect).length > 1)}
                          className={`flex items-center justify-between gap-3 p-4 rounded-xl border transition-all ${cardStyle} ${!isCompleted ? "cursor-pointer" : "cursor-default"}`}
                        >
                          <div className="flex items-center gap-3.5">
                            {radioIcon}
                            <span className="text-xs sm:text-sm font-medium">{opt.text}</span>
                          </div>

                          {badgeElement}
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Short Answer */}
                {q.questionType === "Short Answer" && (
                  <div className="pl-4 max-w-lg space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase text-muted-foreground">Your Answer:</span>
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
                            : "border-input focus:ring-primary/30"
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
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-[#eedc82]" />
          <h1 className="text-2xl font-bold text-foreground">Mock Exams</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Practice with board examination mock exams. Your results will instantly sync with the system gradebook.
        </p>
      </div>

      {/* Available Exams grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {exams.length === 0 ? (
          <div className="col-span-full border border-border rounded-xl p-8 text-center text-muted-foreground text-xs italic bg-muted/10">
            No active mock exams are available for your batch at this moment.
          </div>
        ) : exams.map(exam => {
          const hasTaken = exam.score !== null && exam.score !== undefined
          return (
            <div key={exam.id} className="border border-border rounded-xl p-5 bg-card/45 backdrop-blur-xs flex flex-col justify-between space-y-4 hover:border-muted-foreground/30 transition-all">
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <span className="font-mono text-[10px] bg-muted/65 px-2 py-0.5 rounded text-muted-foreground border border-border font-bold uppercase tracking-wider">
                    {exam.exam_code}
                  </span>
                  {hasTaken && (
                    <span className="flex items-center gap-1 text-[10px] text-green-600 bg-green-50 dark:bg-green-950/20 px-2.5 py-0.5 rounded-full border border-green-200 font-bold">
                      <CheckCircle className="h-3 w-3" /> Completed
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-foreground text-sm">{exam.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2">{exam.description || "No description provided."}</p>
              </div>

              <div className="flex items-center justify-between border-t border-border/60 pt-3 text-[11px] text-muted-foreground font-semibold">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-3.5 w-3.5" />
                  <span>{exam.question_count} questions</span>
                </div>
                {hasTaken ? (
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="block text-[9px] text-muted-foreground font-black uppercase">Your Score</span>
                      <span className="text-xs text-foreground font-extrabold">{exam.score} / {exam.max_score}</span>
                    </div>
                    <button 
                      onClick={() => handleReviewExam(exam)}
                      className="flex items-center gap-1 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-bold px-3 py-1.5 rounded-lg transition-all text-xs border border-border"
                    >
                      <Eye className="h-3.5 w-3.5" /> View Results
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => handleStartExam(exam)}
                    className="flex items-center gap-1 bg-[#eedc82] hover:bg-[#e6d370] text-black font-bold px-4 py-1.5 rounded-lg transition-all active:scale-95"
                  >
                    <Play className="h-3 w-3 fill-black" /> Start Exam
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}

