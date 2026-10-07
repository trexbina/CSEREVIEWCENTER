"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { Loader2, Image as ImageIcon, Trash, Plus, ArrowRight, GripVertical, Save, HelpCircle, Clock, Calendar, AlertCircle, Settings, X, RotateCcw, Eye, PenTool, ArrowLeft, Maximize, Minimize, Play, CheckCircle2, FileText, ExternalLink, Braces, Copy, Check } from "lucide-react"

const CustomPdfViewer = dynamic(() => import("@/components/custom-pdf-viewer"), {
    ssr: false,
    loading: () => (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <p className="text-gray-500 text-sm font-medium">Loading PDF document...</p>
        </div>
    )
})

const OcrQuestionScanner = dynamic(() => import("@/components/ocr-question-scanner"), {
    ssr: false,
    loading: () => (
        <div className="p-4 flex items-center justify-center text-xs text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Loading RapidOCR Scanner...
        </div>
    )
})
import MinimalDatePicker from "@/components/ui/MinimalDatePicker"
import MinimalTimePicker from "@/components/ui/MinimalTimePicker"
import { toast } from "@/components/ui/toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LordIcon } from "@/components/ui/lord-icon"

const GOOGLE_FONTS_URL = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Roboto:wght@400;500;700&family=Poppins:wght@400;500;700&family=Lato:wght@400;700&family=Montserrat:wght@400;500;700&family=Open+Sans:wght@400;600;700&family=Nunito:wght@400;600;700&family=Raleway:wght@400;500;700&family=Playfair+Display:wght@400;700&family=Merriweather:wght@400;700&family=Source+Sans+3:wght@400;600;700&family=DM+Sans:wght@400;500;700&display=swap"

const FONT_OPTIONS = [
    { label: "Inter", value: "'Inter', sans-serif" },
    { label: "Roboto", value: "'Roboto', sans-serif" },
    { label: "Open Sans", value: "'Open Sans', sans-serif" },
    { label: "Poppins", value: "'Poppins', sans-serif" },
    { label: "Lato", value: "'Lato', sans-serif" },
    { label: "Montserrat", value: "'Montserrat', sans-serif" },
    { label: "Nunito", value: "'Nunito', sans-serif" },
    { label: "DM Sans", value: "'DM Sans', sans-serif" },
    { label: "Source Sans 3", value: "'Source Sans 3', sans-serif" },
    { label: "Raleway", value: "'Raleway', sans-serif" },
    { label: "Playfair Display", value: "'Playfair Display', serif" },
    { label: "Merriweather", value: "'Merriweather', serif" },
    { label: "Georgia", value: "Georgia, serif" },
    { label: "Times New Roman", value: "'Times New Roman', serif" },
    { label: "Arial", value: "Arial, sans-serif" },
    { label: "Courier New", value: "'Courier New', monospace" },
]

const DEFAULT_QUIZ_SETTINGS = {
    fontFamily: "'Inter', sans-serif",
    fontSize: 14,
    startDate: "",
    startTime: "",
    isAssignment: false,
    endDate: "",
    endTime: "",
    timeLimitMinutes: 0,
    maxRetries: 0,
    referencePdf: null,
    referencePdfs: []
}

export default function MockExamBuilder({ examId, isStudent = false, onToggleViewMode, backUrl }) {
    const router = useRouter()
    const [lessonTitle, setLessonTitle] = useState("Mock Exam")
    const [questions, setQuestions] = useState([])
    const [fetching, setFetching] = useState(true)
    const [saving, setSaving] = useState(false)
    const [dragBlockIndex, setDragBlockIndex] = useState(null)
    const [dragOverBlockIndex, setDragOverBlockIndex] = useState(null)
    const [draggableBlockIndex, setDraggableBlockIndex] = useState(null)
    const [isQuizStarted, setIsQuizStarted] = useState(false)
    const [studentAnswers, setStudentAnswers] = useState({})
    const [isSubmitted, setIsSubmitted] = useState(false)
    const [internalPreview, setInternalPreview] = useState(false)
    const effectiveIsStudent = isStudent || internalPreview
    // When switching to student view from admin/teacher side, go straight to quiz view (start display is only for real student side)
    const effectiveQuizStarted = !onToggleViewMode && !internalPreview ? isQuizStarted : true

    const [quizSettings, setQuizSettings] = useState(DEFAULT_QUIZ_SETTINGS)
    const [showSettings, setShowSettings] = useState(false)
    const [showJsonModal, setShowJsonModal] = useState(false)
    const [jsonInputText, setJsonInputText] = useState("")
    const [jsonCopied, setJsonCopied] = useState(false)
    const [viewingPdf, setViewingPdf] = useState(null)

    const allReferencePdfs = useMemo(() => {
        if (Array.isArray(quizSettings.referencePdfs) && quizSettings.referencePdfs.length > 0) {
            return quizSettings.referencePdfs.filter(p => p && p.url)
        }
        if (quizSettings.referencePdf?.url) {
            return [quizSettings.referencePdf]
        }
        return []
    }, [quizSettings.referencePdfs, quizSettings.referencePdf])
    const [uploadingPdf, setUploadingPdf] = useState(false)
    const [timeRemaining, setTimeRemaining] = useState(null)
    const [isTimeUp, setIsTimeUp] = useState(false)
    const [timeTakenSeconds, setTimeTakenSeconds] = useState(null)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [attemptsCount, setAttemptsCount] = useState(1)
    const [currentUserName, setCurrentUserName] = useState("")
    const startTimeRef = useRef(null)
    const fileInputRefs = useRef({})
    const pdfInputRef = useRef(null)
    const pdfListRef = useRef(null)
    const settingsModalBodyRef = useRef(null)
    const initialDataRef = useRef(null)

    // Check if there are unsaved changes
    const isDirty = !effectiveIsStudent && (() => {
        try {
            const currentData = JSON.stringify({
                title: lessonTitle || "",
                settings: quizSettings || {},
                questions: questions || []
            })
            if (initialDataRef.current !== null) {
                return currentData !== initialDataRef.current
            }
            // If initial data hasn't finished setting yet, but questions or title have been entered, mark dirty
            return questions.length > 0
        } catch {
            return false
        }
    })()

    // Expose dirty state to window and handle beforeunload (browser close/refresh/back)
    if (typeof window !== "undefined") {
        window.__peak_has_unsaved_quiz = isDirty
        window.__peak_is_quiz_dirty = () => isDirty
    }

    useEffect(() => {
        if (typeof window !== "undefined") {
            window.__peak_has_unsaved_quiz = isDirty
            window.__peak_is_quiz_dirty = () => isDirty
        }
        const handleBeforeUnload = (e) => {
            if (isDirty) {
                e.preventDefault()
                e.returnValue = ""
            }
        }
        window.addEventListener("beforeunload", handleBeforeUnload)
        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload)
        }
    }, [isDirty])

    useEffect(() => {
        return () => {
            if (typeof window !== "undefined") {
                window.__peak_has_unsaved_quiz = false
                delete window.__peak_is_quiz_dirty
            }
        }
    }, [])

    useEffect(() => {
        fetch("/api/security/settings")
            .then(res => res.json())
            .then(data => {
                if (data?.user?.name) {
                    setCurrentUserName(data.user.name)
                }
            })
            .catch(() => { })
    }, [])

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement)
        }
        document.addEventListener("fullscreenchange", handleFullscreenChange)
        return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
    }, [])

    // Listen for questions created by RapidOCR or external toolboxes
    useEffect(() => {
        const handleImport = (payload) => {
            const generateUniqueId = (prefix = "q") => `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

            const normalizeText = (t) => (t || "").trim().toLowerCase().replace(/\s+/g, " ")

            if (Array.isArray(payload) && payload.length > 0) {
                let addedCount = 0
                setQuestions(prev => {
                    // Collect existing question texts to avoid duplicate questions
                    const existingTexts = new Set(
                        prev.filter(p => p.type === "question" && p.text).map(p => normalizeText(p.text))
                    )
                    const existingIds = new Set(prev.map(p => p.id))

                    // Filter out incoming questions that already exist in the exam
                    const incomingUnique = payload.filter(q => {
                        if (!q || !q.text) return false
                        const norm = normalizeText(q.text)
                        if (existingTexts.has(norm)) {
                            return false // Skip duplicate question
                        }
                        existingTexts.add(norm)
                        return true
                    })

                    if (incomingUnique.length === 0) {
                        addedCount = 0
                        return prev
                    }

                    const sanitized = incomingUnique.map((q, qIdx) => {
                        const qId = q.id && !existingIds.has(q.id) ? q.id : generateUniqueId(`q_${qIdx}`)
                        existingIds.add(qId)

                        return {
                            ...q,
                            id: qId,
                            options: Array.isArray(q.options)
                                ? q.options.map((opt, optIdx) => ({
                                    ...opt,
                                    id: opt.id ? `${opt.id}_${Math.random().toString(36).substring(2, 6)}` : generateUniqueId(`opt_${optIdx}`)
                                }))
                                : []
                        }
                    })

                    addedCount = sanitized.length
                    return [...prev, ...sanitized]
                })
                // Toast after state update, outside the updater
                setTimeout(() => {
                    if (addedCount === 0) {
                        toast.info("All scanned questions are already present in the exam.")
                    } else {
                        toast.success(`${addedCount} questions added to exam!`)
                    }
                }, 0)
            } else if (payload && payload.text) {
                let wasAdded = false
                setQuestions(prev => {
                    const norm = normalizeText(payload.text)
                    const exists = prev.some(p => p.type === "question" && normalizeText(p.text) === norm)
                    if (exists) {
                        wasAdded = false
                        return prev
                    }
                    const newQ = {
                        ...payload,
                        id: generateUniqueId()
                    }
                    wasAdded = true
                    return [...prev, newQ]
                })
                setTimeout(() => {
                    if (wasAdded) {
                        toast.success("Question added to exam from RapidOCR!")
                    } else {
                        toast.info("This question is already in the exam.")
                    }
                }, 0)
            }
        }

        // 1. Direct window bridges for reliable cross-component calls
        window.__peak_import_questions = handleImport
        window.__peak_add_question = () => {
            setQuestions(prev => [
                ...prev,
                {
                    id: Date.now().toString(),
                    type: "question",
                    questionType: "Multiple Choice",
                    text: "",
                    image: null,
                    points: 1,
                    options: [
                        { id: Date.now() + "1", text: "Option 1" },
                        { id: Date.now() + "2", text: "Option 2" },
                        { id: Date.now() + "3", text: "Option 3" },
                    ]
                }
            ])
        }
        window.__peak_add_title_desc = () => {
            setQuestions(prev => [
                ...prev,
                {
                    id: Date.now().toString(),
                    type: "title_description",
                    title: "",
                    description: "",
                    image: null
                }
            ])
        }

        // 2. CustomEvent listeners
        const handleAddOcrQuestion = (e) => {
            handleImport(e.detail)
        }
        const handleExternalAddQuestion = () => {
            if (typeof window.__peak_add_question === "function") {
                window.__peak_add_question()
            }
        }
        const handleExternalAddTitleDesc = () => {
            if (typeof window.__peak_add_title_desc === "function") {
                window.__peak_add_title_desc()
            }
        }
        window.addEventListener("peak:add-ocr-question", handleAddOcrQuestion)
        window.addEventListener("peak:add-question", handleExternalAddQuestion)
        window.addEventListener("peak:add-title-desc", handleExternalAddTitleDesc)

        return () => {
            delete window.__peak_import_questions
            delete window.__peak_add_question
            delete window.__peak_add_title_desc
            window.removeEventListener("peak:add-ocr-question", handleAddOcrQuestion)
            window.removeEventListener("peak:add-question", handleExternalAddQuestion)
            window.removeEventListener("peak:add-title-desc", handleExternalAddTitleDesc)
        }
    }, [])

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch((err) => {
                console.error("Error attempting fullscreen:", err)
            })
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen()
            }
        }
    }

    useEffect(() => {
        if (effectiveIsStudent && effectiveQuizStarted && !startTimeRef.current) {
            startTimeRef.current = Date.now()
        }
    }, [effectiveIsStudent, effectiveQuizStarted])

    // Helper to parse combined date and time
    const getFullDateTime = (dateStr, timeStr, defaultTime) => {
        if (!dateStr) return null
        const time = timeStr && timeStr.trim() ? timeStr : defaultTime
        return new Date(`${dateStr}T${time}`)
    }

    // Availability checks for student
    const now = new Date()
    const startDateTime = getFullDateTime(quizSettings.startDate, quizSettings.startTime, "00:00")
    const endDateTime = quizSettings.endDate ? getFullDateTime(quizSettings.endDate, quizSettings.endTime, "23:59") : null
    const isTooEarly = effectiveIsStudent && !internalPreview && startDateTime && startDateTime > now
    const isPastDeadline = effectiveIsStudent && !internalPreview && endDateTime && endDateTime < now && !isSubmitted
    const isQuizLocked = isTooEarly || isPastDeadline

    // Start timer only after quiz is started (only for real student side)
    useEffect(() => {
        if (!isStudent || onToggleViewMode || internalPreview || isSubmitted || fetching || isQuizLocked || !effectiveQuizStarted) return
        if (quizSettings.timeLimitMinutes && quizSettings.timeLimitMinutes > 0) {
            if (timeRemaining === null) {
                setTimeRemaining(quizSettings.timeLimitMinutes * 60)
            }
        }
    }, [isStudent, onToggleViewMode, internalPreview, quizSettings.timeLimitMinutes, isSubmitted, fetching, isQuizLocked, effectiveQuizStarted, timeRemaining])

    // Decrement timer (only for real student side)
    useEffect(() => {
        if (!isStudent || onToggleViewMode || internalPreview || isSubmitted || timeRemaining === null || timeRemaining <= 0 || isQuizLocked || !effectiveQuizStarted) return

        const interval = setInterval(() => {
            setTimeRemaining(prev => {
                if (prev <= 1) {
                    clearInterval(interval)
                    setIsTimeUp(true)
                    setIsSubmitted(true)
                    if (startTimeRef.current && timeTakenSeconds === null) {
                        const duration = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000))
                        setTimeTakenSeconds(duration)
                    }
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => clearInterval(interval)
    }, [isStudent, onToggleViewMode, internalPreview, isSubmitted, timeRemaining, isQuizLocked, effectiveQuizStarted])

    function formatTime(seconds) {
        if (seconds === null || seconds < 0) return "00:00"
        const hrs = Math.floor(seconds / 3600)
        const mins = Math.floor((seconds % 3600) / 60)
        const secs = seconds % 60
        if (hrs > 0) {
            return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
        }
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
    }

    // Load Google Fonts once
    useEffect(() => {
        if (document.getElementById('quiz-google-fonts')) return
        const link = document.createElement('link')
        link.id = 'quiz-google-fonts'
        link.rel = 'stylesheet'
        link.href = GOOGLE_FONTS_URL
        document.head.appendChild(link)
    }, [])

    useEffect(() => {
        if (examId) {
            fetchExamData()
        } else {
            setFetching(false)
        }
    }, [examId])

    async function fetchExamData() {
        setFetching(true)
        setIsQuizStarted(false)
        setQuestions([])
        setQuizSettings(DEFAULT_QUIZ_SETTINGS)
        setStudentAnswers({})
        setIsSubmitted(false)
        setTimeTakenSeconds(null)
        setTimeRemaining(null)
        setIsTimeUp(false)
        try {
            const endpoint = isStudent
                ? `/api/student/mock-exams/${examId}`
                : `/api/admin/mock-exams/${examId}`
            const res = await fetch(endpoint, { cache: "no-store" })
            if (res.ok) {
                const data = await res.json()
                const exam = data.exam
                let initialLoadedQuestions = []
                let initialLoadedSettings = DEFAULT_QUIZ_SETTINGS
                if (exam) {
                    if (exam.title) setLessonTitle(exam.title)
                    if (exam.questions) {
                        let parsed = exam.questions
                        if (typeof parsed === "string") {
                            try { parsed = JSON.parse(parsed) } catch (e) { parsed = [] }
                        }
                        if (parsed && !Array.isArray(parsed) && parsed.questions) {
                            initialLoadedQuestions = parsed.questions || []
                            setQuestions(initialLoadedQuestions)
                            if (parsed.settings) {
                                const rawList = Array.isArray(parsed.settings.referencePdfs)
                                    ? parsed.settings.referencePdfs
                                    : (parsed.settings.referencePdf?.url ? [parsed.settings.referencePdf] : [])
                                initialLoadedSettings = {
                                    ...DEFAULT_QUIZ_SETTINGS,
                                    ...parsed.settings,
                                    referencePdfs: rawList,
                                    referencePdf: rawList[0] || null,
                                    maxRetries: Number(parsed.settings.maxRetries ?? 0),
                                    timeLimitMinutes: Number(parsed.settings.timeLimitMinutes ?? 0)
                                }
                                setQuizSettings(initialLoadedSettings)
                            } else {
                                setQuizSettings(DEFAULT_QUIZ_SETTINGS)
                            }
                        } else {
                            initialLoadedQuestions = Array.isArray(parsed) ? parsed : []
                            setQuestions(initialLoadedQuestions)
                            setQuizSettings(DEFAULT_QUIZ_SETTINGS)
                        }
                    } else {
                        setQuestions([])
                        setQuizSettings(DEFAULT_QUIZ_SETTINGS)
                    }
                    initialDataRef.current = JSON.stringify({
                        title: exam.title || lessonTitle || "",
                        settings: initialLoadedSettings,
                        questions: initialLoadedQuestions
                    })
                }
            }
        } catch (err) {
            console.error("Fetch exam error:", err)
        } finally {
            setFetching(false)
        }
    }

    async function saveQuiz(silent = false) {
        const isSilent = silent === true
        if (effectiveIsStudent) return false
        setSaving(true)
        try {
            if (examId) {
                const res = await fetch(`/api/admin/mock-exams/${examId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        title: lessonTitle,
                        questions: { settings: quizSettings, questions }
                    })
                })
                if (!res.ok) throw new Error("Save failed")
            }

            // Snapshot clean state on save
            initialDataRef.current = JSON.stringify({
                title: lessonTitle || "",
                settings: quizSettings || {},
                questions: questions || []
            })
            if (typeof window !== "undefined") {
                window.__peak_has_unsaved_quiz = false
                window.__peak_is_quiz_dirty = () => false
            }

            if (!isSilent) {
                toast.success("Successfully saved changes!")
            }
            return true
        } catch (err) {
            console.error("Failed to save content", err)
            if (!isSilent) {
                toast.error("Failed to save content")
            }
            return false
        } finally {
            setSaving(false)
        }
    }

    const addQuestion = () => {
        const newQuestion = {
            id: Date.now().toString(),
            type: "question",
            questionType: "Multiple Choice",
            text: "",
            image: null,
            points: 1,
            options: [
                { id: Date.now() + "1", text: "Option 1" },
                { id: Date.now() + "2", text: "Option 2" },
                { id: Date.now() + "3", text: "Option 3" },
            ]
        }
        setQuestions([...questions, newQuestion])
    }

    const addQuestionAfter = (index) => {
        const newQuestion = {
            id: Date.now().toString(),
            type: "question",
            questionType: "Multiple Choice",
            text: "",
            image: null,
            points: 1,
            options: [
                { id: Date.now() + "1", text: "Option 1" },
                { id: Date.now() + "2", text: "Option 2" },
                { id: Date.now() + "3", text: "Option 3" },
            ]
        }
        const updated = [...questions]
        updated.splice(index + 1, 0, newQuestion)
        setQuestions(updated)
    }

    const addTitleDescription = () => {
        const newBlock = {
            id: Date.now().toString(),
            type: "title_description",
            title: "",
            description: "",
            image: null
        }
        setQuestions([...questions, newBlock])
    }

    const updateQuestionText = (id, text) => {
        setQuestions(questions.map(q => q.id === id ? { ...q, text } : q))
    }

    const updateTitleDescTitle = (id, title) => {
        setQuestions(questions.map(q => q.id === id ? { ...q, title } : q))
    }

    const updateTitleDescDesc = (id, description) => {
        setQuestions(questions.map(q => q.id === id ? { ...q, description } : q))
    }

    const updateShortAnswerText = (id, text) => {
        setQuestions(questions.map(q => q.id === id ? { ...q, correctAnswer: text } : q))
    }

    const updateQuestionType = (id, questionType) => {
        setQuestions(questions.map(q => {
            if (q.id === id) {
                const newData = { ...q, questionType }
                if (questionType === "True or False") {
                    newData.options = [
                        { id: Date.now() + "1", text: "True" },
                        { id: Date.now() + "2", text: "False" }
                    ]
                }
                return newData
            }
            return q
        }))
    }

    const updateQuestionPoints = (id, points) => {
        setQuestions(questions.map(q => q.id === id ? { ...q, points } : q))
    }

    const addOption = (questionId) => {
        setQuestions(questions.map(q => {
            if (q.id === questionId) {
                return {
                    ...q,
                    options: [...(q.options || []), { id: Date.now().toString(), text: `Option ${(q.options?.length || 0) + 1}` }]
                }
            }
            return q
        }))
    }

    const removeOption = (questionId, optionId) => {
        setQuestions(questions.map(q => {
            if (q.id === questionId) {
                return {
                    ...q,
                    options: q.options.filter(o => o.id !== optionId)
                }
            }
            return q
        }))
    }

    const updateOptionText = (questionId, optionId, text) => {
        setQuestions(questions.map(q => {
            if (q.id === questionId) {
                return {
                    ...q,
                    options: q.options.map(o => o.id === optionId ? { ...o, text } : o)
                }
            }
            return q
        }))
    }

    const toggleCorrectAnswer = (questionId, optionId) => {
        if (effectiveIsStudent) return
        setQuestions(questions.map(q => {
            if (q.id === questionId) {
                return {
                    ...q,
                    options: q.options.map(o => {
                        if (q.questionType === "True or False") {
                            // Only one correct answer for True or False
                            return { ...o, isCorrect: o.id === optionId }
                        } else {
                            // Multiple correct answers allowed for Multiple Choice
                            if (o.id === optionId) {
                                return { ...o, isCorrect: !o.isCorrect }
                            }
                            return o
                        }
                    })
                }
            }
            return q
        }))
    }

    const removeBlock = (id) => {
        setQuestions(questions.filter(q => q.id !== id))
    }

    const handleStudentOptionToggle = (questionId, optionId, questionType) => {
        if (isSubmitted || !effectiveIsStudent) return
        setStudentAnswers(prev => {
            const current = prev[questionId] || []
            if (questionType === "True or False") {
                return { ...prev, [questionId]: [optionId] }
            } else {
                if (current.includes(optionId)) {
                    return { ...prev, [questionId]: current.filter(id => id !== optionId) }
                } else {
                    return { ...prev, [questionId]: [...current, optionId] }
                }
            }
        })
    }

    const handleStudentShortAnswer = (questionId, text) => {
        if (isSubmitted || !effectiveIsStudent) return
        setStudentAnswers(prev => ({ ...prev, [questionId]: text }))
    }

    const submitQuiz = async () => {
        let duration = timeTakenSeconds
        if (startTimeRef.current && (duration === null || duration === undefined)) {
            duration = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000))
            setTimeTakenSeconds(duration)
        }
        setIsSubmitted(true)
        window.scrollTo({ top: 0, behavior: 'smooth' })

        if (!internalPreview && isStudent && lessonId) {
            // Calculate total and earned points to save
            let totalPts = 0
            let earnedPts = 0
            questions.filter(q => q.type === 'question').forEach(q => {
                const pts = q.points !== undefined ? q.points : 1
                totalPts += pts
                let isQCorrect = false
                if (q.questionType === "True or False" || q.questionType === "Multiple Choice") {
                    const correctOptionIds = q.options?.filter(o => o.isCorrect).map(o => o.id) || []
                    const studentSelectedIds = studentAnswers[q.id] || []
                    if (correctOptionIds.length > 0 &&
                        correctOptionIds.length === studentSelectedIds.length &&
                        correctOptionIds.every(id => studentSelectedIds.includes(id))) {
                        isQCorrect = true
                    }
                } else if (q.questionType === "Short Answer") {
                    const correctAns = q.correctAnswer || ""
                    if (correctAns.trim() !== "" && (studentAnswers[q.id] || "").trim().toLowerCase() === correctAns.trim().toLowerCase()) {
                        isQCorrect = true
                    }
                }
                if (isQCorrect) earnedPts += pts
            })

            try {
                const res = await fetch('/api/student/quiz-submissions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contentId: parseInt(lessonId),
                        earnedPoints: earnedPts,
                        totalPoints: totalPts,
                        timeTakenSeconds: duration || 0,
                        answers: studentAnswers
                    })
                })
                if (res.ok) {
                    const data = await res.json()
                    if (data.submission && data.submission.attempts_count) {
                        setAttemptsCount(data.submission.attempts_count)
                    }
                }
            } catch (err) {
                console.error("Failed to save student quiz submission:", err)
            }
        }
    }

    const handleRetryQuiz = () => {
        setIsSubmitted(false)
        setIsQuizStarted(true)
        setStudentAnswers({})
        setTimeTakenSeconds(null)
        setIsTimeUp(false)
        if (quizSettings.timeLimitMinutes && quizSettings.timeLimitMinutes > 0) {
            setTimeRemaining(quizSettings.timeLimitMinutes * 60)
        }
        startTimeRef.current = Date.now()
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    async function handleImageUpload(e, blockId) {
        const file = e.target.files?.[0]
        if (!file) return
        try {
            const formData = new FormData()
            formData.append("file", file)
            const res = await fetch("/api/admin/upload", {
                method: "POST",
                body: formData
            })
            if (res.ok) {
                const data = await res.json()
                if (data.url) {
                    setQuestions(prev => prev.map(q => q.id === blockId ? { ...q, image: data.url } : q))
                }
            } else {
                const errData = await res.json().catch(() => ({}))
                alert(errData.error || "Image upload failed")
            }
        } catch (err) {
            console.error("Failed to upload image", err)
            alert("Image upload failed")
        } finally {
            if (e.target) e.target.value = ""
        }
    }

    async function handlePdfUpload(e) {
        const selectedFiles = Array.from(e.target.files || [])
        if (selectedFiles.length === 0) return

        const validFiles = selectedFiles.filter(f => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"))
        if (validFiles.length === 0) {
            toast.error("Please select valid PDF file(s)")
            if (e.target) e.target.value = ""
            return
        }

        setUploadingPdf(true)
        try {
            const uploadedPdfs = []
            for (const file of validFiles) {
                const formData = new FormData()
                formData.append("file", file)
                const res = await fetch("/api/admin/upload", {
                    method: "POST",
                    body: formData
                })
                if (res.ok) {
                    const data = await res.json()
                    if (data.url) {
                        uploadedPdfs.push({
                            url: data.url,
                            name: file.name
                        })
                    }
                } else {
                    const errData = await res.json().catch(() => ({}))
                    toast.error(errData.error || `Failed to upload ${file.name}`)
                }
            }

            if (uploadedPdfs.length > 0) {
                setQuizSettings(prev => {
                    const currentList = Array.isArray(prev.referencePdfs) && prev.referencePdfs.length > 0
                        ? prev.referencePdfs
                        : (prev.referencePdf?.url ? [prev.referencePdf] : [])
                    const updatedList = [...currentList, ...uploadedPdfs]
                    return {
                        ...prev,
                        referencePdfs: updatedList,
                        referencePdf: updatedList[0] || null
                    }
                })
                toast.success(uploadedPdfs.length === 1 ? "PDF attached successfully!" : `${uploadedPdfs.length} PDFs attached successfully!`)
                setTimeout(() => {
                    if (pdfListRef.current) {
                        pdfListRef.current.scrollTop = pdfListRef.current.scrollHeight
                    }
                    if (settingsModalBodyRef.current) {
                        settingsModalBodyRef.current.scrollTop = settingsModalBodyRef.current.scrollHeight
                    }
                }, 100)
            }
        } catch (err) {
            console.error("Failed to upload PDF", err)
            toast.error("Failed to upload PDF")
        } finally {
            setUploadingPdf(false)
            if (e.target) e.target.value = ""
        }
    }

    function handleRemovePdf(indexToRemove) {
        setQuizSettings(prev => {
            const currentList = Array.isArray(prev.referencePdfs) && prev.referencePdfs.length > 0
                ? prev.referencePdfs
                : (prev.referencePdf?.url ? [prev.referencePdf] : [])
            const updatedList = currentList.filter((_, idx) => idx !== indexToRemove)
            return {
                ...prev,
                referencePdfs: updatedList,
                referencePdf: updatedList[0] || null
            }
        })
        toast.info("Reference PDF removed")
    }

    function handleDragStart(e, index) {
        // Only allow dragging when initiated from the drag handle
        const isHandle = e.target && (e.target.closest('[data-drag-handle="true"]') || e.target.getAttribute('data-drag-handle') === 'true')
        const isInteractive = e.target && e.target.closest('input, textarea, button, select, [contenteditable="true"]')
        if (!isHandle || isInteractive) {
            e.preventDefault()
            return
        }
        setDragBlockIndex(index)
        e.dataTransfer.setData("text/plain", index)
        e.dataTransfer.effectAllowed = "move"
    }

    function handleDragOver(e, index) {
        e.preventDefault()
        e.dataTransfer.dropEffect = "move"
        if (dragOverBlockIndex !== index) {
            setDragOverBlockIndex(index)
        }
    }

    function handleDrop(e, targetIndex) {
        e.preventDefault()
        if (dragBlockIndex === null) return

        const newQuestions = [...questions]
        const [movedBlock] = newQuestions.splice(dragBlockIndex, 1)
        newQuestions.splice(targetIndex, 0, movedBlock)

        setQuestions(newQuestions)
        setDragBlockIndex(null)
        setDragOverBlockIndex(null)
        setDraggableBlockIndex(null)
    }

    function handleDragEnd() {
        setDragBlockIndex(null)
        setDragOverBlockIndex(null)
        setDraggableBlockIndex(null)
    }

    if (fetching) {
        return (
            <div className="flex justify-center items-center h-full min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        )
    }

    // Calculate student score when submitted
    let totalPoints = 0
    let earnedPoints = 0
    if (effectiveIsStudent && isSubmitted) {
        questions.filter(q => q.type === 'question').forEach(q => {
            const pts = q.points !== undefined ? q.points : 1
            totalPoints += pts
            let isQCorrect = false
            if (q.questionType === "True or False" || q.questionType === "Multiple Choice") {
                const correctOptionIds = q.options?.filter(o => o.isCorrect).map(o => o.id) || []
                const studentSelectedIds = studentAnswers[q.id] || []
                if (correctOptionIds.length > 0 &&
                    correctOptionIds.length === studentSelectedIds.length &&
                    correctOptionIds.every(id => studentSelectedIds.includes(id))) {
                    isQCorrect = true
                }
            } else if (q.questionType === "Short Answer") {
                const correctAns = q.correctAnswer || ""
                if (correctAns.trim() !== "" && (studentAnswers[q.id] || "").trim().toLowerCase() === correctAns.trim().toLowerCase()) {
                    isQCorrect = true
                }
            }
            if (isQCorrect) earnedPoints += pts
        })
    }

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto flex flex-col lg:flex-row items-start gap-8 w-full">
            {/* Main Content Area */}
            <div className="flex-1 w-full space-y-6 min-w-0">

                {/* Internal Preview Banner */}
                {internalPreview && (
                    <div className="bg-[#E9C46A]/10 border border-[#E9C46A]/30 rounded-2xl p-3 px-4 flex items-center justify-between shadow-2xs">
                        <div className="flex items-center gap-2 text-xs font-semibold text-[#E9C46A]">
                            <Eye className="h-4 w-4" />
                            <span>Student Preview Mode — test your questions, time limit, and scoring.</span>
                        </div>
                        <button
                            onClick={() => {
                                setInternalPreview(false)
                                setIsSubmitted(false)
                                setStudentAnswers({})
                            }}
                            className="bg-[#E9C46A] hover:bg-[#dfb550] text-white text-xs font-semibold px-3 py-1.5 rounded-xl shadow-2xs transition-all cursor-pointer"
                        >
                            Exit Preview
                        </button>
                    </div>
                )}

                {/* Student Header */}
                {effectiveIsStudent && (
                    <div className="border-b border-gray-200/80 pb-4 space-y-2">
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                            <div className="flex items-center gap-3 flex-wrap">
                                <h1 className="text-xl font-bold text-gray-800 tracking-tight">
                                    {lessonTitle}
                                </h1>
                                {quizSettings.isAssignment && (
                                    <span className="bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full border border-gray-200 text-xs font-medium">
                                        Assignment
                                    </span>
                                )}
                                {onToggleViewMode && (
                                    <button
                                        type="button"
                                        onClick={onToggleViewMode}
                                        className="px-3.5 py-1.5 rounded-xl border border-gray-200/80 bg-white hover:bg-gray-50 text-gray-700 font-semibold text-xs transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
                                    >
                                        <PenTool className="h-3.5 w-3.5 text-gray-500" />
                                        <span>Admin View</span>
                                    </button>
                                )}
                            </div>

                            {/* Right side: Timer (when active - only for real student side) OR Score / Attempts summary (when submitted) */}
                            <div className="flex items-center gap-3">
                                {isStudent && !onToggleViewMode && !internalPreview && quizSettings.timeLimitMinutes > 0 && effectiveQuizStarted && !isSubmitted && !isQuizLocked && (
                                    <div className="bg-white border border-gray-200/80 rounded-xl px-3 py-1.5 flex items-center gap-2 shadow-2xs">
                                        <Clock className={`h-4 w-4 ${timeRemaining !== null && timeRemaining < 300 ? 'text-red-500 animate-pulse' : 'text-[#E9C46A]'}`} />
                                        <span className={`font-mono font-bold text-sm tracking-tight ${timeRemaining !== null && timeRemaining < 300 ? 'text-red-600 animate-pulse' : 'text-gray-800'}`}>
                                            {formatTime(timeRemaining)}
                                        </span>
                                    </div>
                                )}

                                {isSubmitted && (() => {
                                    const maxRetries = Number(quizSettings.maxRetries || 0)
                                    const currentAttempts = attemptsCount || 1
                                    const retriesLeft = Math.max(0, maxRetries - (currentAttempts - 1))

                                    return (
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <div className="flex items-center gap-3 bg-gray-50 border border-gray-200/80 rounded-xl px-3.5 py-1.5 text-xs text-gray-700 font-medium">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-gray-400">Score:</span>
                                                    <span className="font-bold text-gray-900">{earnedPoints} / {totalPoints} pts</span>
                                                </div>
                                                <span className="text-gray-300">|</span>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-gray-400">Time Taken:</span>
                                                    <span className="font-bold text-gray-900">{formatTime(timeTakenSeconds)}</span>
                                                </div>
                                                {maxRetries > 0 && (
                                                    <>
                                                        <span className="text-gray-300">|</span>
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-gray-400">Retries:</span>
                                                            <span className={`font-bold ${retriesLeft > 0 ? 'text-[#E9C46A]' : 'text-gray-500'}`}>
                                                                {retriesLeft} / {maxRetries}
                                                            </span>
                                                        </div>
                                                    </>
                                                )}
                                            </div>

                                            {maxRetries > 0 && retriesLeft > 0 && (
                                                <button
                                                    onClick={handleRetryQuiz}
                                                    className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 text-xs font-semibold px-3.5 py-1.5 rounded-xl shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                                                >
                                                    <RotateCcw className="h-3.5 w-3.5 text-[#E9C46A]" />
                                                    <span>Retry Quiz</span>
                                                </button>
                                            )}
                                        </div>
                                    )
                                })()}
                            </div>
                        </div>
                    </div>
                )}

                {/* Header Actions */}
                {!effectiveIsStudent && (
                    <div className="border-b border-gray-200/80 pb-3 relative flex items-center justify-between gap-4 flex-wrap">
                        {/* Left: Mock Exam Title & Settings */}
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                            {examId ? (
                                <input
                                    type="text"
                                    value={lessonTitle}
                                    onChange={(e) => setLessonTitle(e.target.value)}
                                    className="text-xl font-bold text-gray-800 tracking-tight bg-transparent border-b border-transparent hover:border-gray-300 focus:border-slate-400 outline-none pb-0.5 w-full max-w-xl"
                                    placeholder="Mock Exam Title"
                                />
                            ) : (
                                <h1 className="text-xl font-bold text-gray-800 tracking-tight truncate">
                                    {lessonTitle}
                                </h1>
                            )}

                            {!examId && (
                                <button
                                    type="button"
                                    onClick={() => setShowSettings(!showSettings)}
                                    className={`p-1.5 rounded-xl border text-xs font-semibold shadow-2xs transition-all cursor-pointer flex items-center justify-center shrink-0 ${showSettings ? 'bg-[#E9C46A]/10 border-[#E9C46A]/40 text-[#E9C46A]' : 'bg-white border-gray-200/80 hover:bg-gray-50 text-gray-600 hover:text-gray-900'}`}
                                    title="Quiz Settings"
                                >
                                    <Settings className="h-4 w-4" />
                                </button>
                            )}
                        </div>

                        {/* Right: Fullscreen + Student View + Save Changes */}
                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                type="button"
                                onClick={toggleFullscreen}
                                className="p-1.5 rounded-xl border border-gray-200/80 bg-white hover:bg-gray-50 text-gray-500 hover:text-gray-800 transition-all shadow-2xs cursor-pointer flex items-center justify-center"
                                title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                            >
                                {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                            </button>
                            <button
                                type="button"
                                onClick={async () => {
                                    await saveQuiz(true)
                                    if (onToggleViewMode) {
                                        onToggleViewMode()
                                    } else {
                                        setInternalPreview(true)
                                        setIsSubmitted(false)
                                        setStudentAnswers({})
                                        startTimeRef.current = Date.now()
                                    }
                                }}
                                className="px-3 py-1.5 rounded-xl border border-gray-200/80 bg-white hover:bg-gray-50 text-gray-700 font-semibold text-xs transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
                            >
                                <Eye className="h-3.5 w-3.5 text-gray-500" />
                                <span>Student View</span>
                            </button>
                            <button
                                onClick={() => saveQuiz(false)}
                                disabled={saving}
                                className="bg-[#E9C46A] hover:bg-[#dfb550] disabled:opacity-50 text-white text-xs font-semibold px-4 py-1.5 rounded-xl shadow-2xs transition-all flex items-center justify-center cursor-pointer"
                            >
                                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
                                <span>Save Changes</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Quiz Settings Modal Popup Overlay */}
                {!effectiveIsStudent && showSettings && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200"
                        onClick={(e) => {
                                    if (e.target === e.currentTarget) setShowSettings(false)
                                }}
                            >
                                <div className="bg-white border border-gray-200/80 rounded-2xl shadow-xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                                    {/* Modal Header */}
                                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white rounded-t-2xl shrink-0">
                                        <h3 className="font-bold text-gray-800 text-base">{examId ? "Exam Settings" : "Quiz Settings"}</h3>
                                        <button
                                            onClick={() => setShowSettings(false)}
                                            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>

                                    {/* Modal Body */}
                                    <div ref={settingsModalBodyRef} className="p-6 space-y-6 text-sm overflow-y-auto flex-1">
                                        {/* Section 1: Access & Schedule */}
                                        <div>
                                            <h4 className="font-bold text-gray-800 text-xs uppercase tracking-wider mb-3">Access & Schedule</h4>

                                            {/* Set as assignment tick checkbox */}
                                            {!examId && (
                                                <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-200/80 mb-4 transition-all">
                                                    <label className="flex items-start gap-3 cursor-pointer select-none">
                                                        <input
                                                            type="checkbox"
                                                            checked={!!quizSettings.isAssignment}
                                                            onChange={(e) => setQuizSettings({ ...quizSettings, isAssignment: e.target.checked })}
                                                            className="mt-0.5 rounded border-gray-300 text-[#E9C46A] focus:ring-0 h-4 w-4 cursor-pointer accent-[#E9C46A]"
                                                        />
                                                        <div>
                                                            <span className="block text-xs font-bold text-gray-800">
                                                                Set as assignment
                                                            </span>
                                                            <span className="block text-xs font-normal text-gray-500 mt-0.5">
                                                                Marks this quiz as an assignment with a deadline
                                                            </span>
                                                        </div>
                                                    </label>
                                                </div>
                                            )}

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                                {/* Start Date */}
                                                <div className="flex flex-col gap-1.5">
                                                    <label className="font-semibold text-gray-600 text-xs">Start Date</label>
                                                    <MinimalDatePicker
                                                        value={quizSettings.startDate}
                                                        onChange={(dateStr) => setQuizSettings({ ...quizSettings, startDate: dateStr })}
                                                        placeholder="Select start date..."
                                                        popoverPosition="bottom"
                                                    />
                                                </div>

                                                {/* Start Time */}
                                                <div className="flex flex-col gap-1.5">
                                                    <label className="font-semibold text-gray-600 text-xs">Start Time</label>
                                                    <MinimalTimePicker
                                                        value={quizSettings.startTime || ""}
                                                        onChange={(timeStr) => setQuizSettings({ ...quizSettings, startTime: timeStr })}
                                                        size="compact"
                                                    />
                                                </div>
                                            </div>

                                            {/* End Date (Deadline) and End Time */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-4 pt-4 border-t border-dashed border-gray-200">
                                                {/* End Date */}
                                                <div className="flex flex-col gap-1.5">
                                                    <label className="font-semibold text-gray-600 text-xs">Deadline (End Date)</label>
                                                    <MinimalDatePicker
                                                        value={quizSettings.endDate}
                                                        onChange={(dateStr) => setQuizSettings({ ...quizSettings, endDate: dateStr })}
                                                        placeholder="Select deadline date..."
                                                        popoverPosition="bottom"
                                                    />
                                                </div>

                                                {/* End Time */}
                                                <div className="flex flex-col gap-1.5">
                                                    <label className="font-semibold text-gray-600 text-xs">Deadline Time</label>
                                                    <MinimalTimePicker
                                                        value={quizSettings.endTime || ""}
                                                        onChange={(timeStr) => setQuizSettings({ ...quizSettings, endTime: timeStr })}
                                                        size="compact"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="border-t border-gray-100 pt-5">
                                            {/* Section 2: Time Limit & Retries */}
                                            <h4 className="font-bold text-gray-800 text-xs uppercase tracking-wider mb-3">Time Limit & Attempts</h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                                <div className="flex flex-col gap-1.5">
                                                    <label className="font-semibold text-gray-600 text-xs">{examId ? "Exam Duration (Minutes)" : "Quiz Duration (Minutes)"}</label>
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        max={360}
                                                        placeholder="0 (Unlimited)"
                                                        value={quizSettings.timeLimitMinutes === 0 || quizSettings.timeLimitMinutes === "" ? "" : quizSettings.timeLimitMinutes}
                                                        onChange={(e) => {
                                                            const val = e.target.value
                                                            setQuizSettings({ ...quizSettings, timeLimitMinutes: val === "" ? "" : Math.max(0, Number(val)) })
                                                        }}
                                                        onBlur={() => {
                                                            if (quizSettings.timeLimitMinutes === "") {
                                                                setQuizSettings(prev => ({ ...prev, timeLimitMinutes: 0 }))
                                                            }
                                                        }}
                                                        className="w-full bg-gray-50/60 border border-gray-200/80 rounded-xl px-3 py-2 text-gray-800 text-sm outline-none focus:bg-white focus:border-gray-400 transition-all"
                                                    />
                                                    <span className="text-xs text-gray-400">Set to 0 for unlimited duration.</span>
                                                </div>

                                                <div className="flex flex-col gap-1.5">
                                                    <label className="font-semibold text-gray-600 text-xs">Allowed Retries</label>
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        max={10}
                                                        placeholder="0 (No retries)"
                                                        value={quizSettings.maxRetries === 0 || quizSettings.maxRetries === "" ? "" : quizSettings.maxRetries}
                                                        onChange={(e) => {
                                                            const val = e.target.value
                                                            setQuizSettings({ ...quizSettings, maxRetries: val === "" ? "" : Math.max(0, Number(val)) })
                                                        }}
                                                        onBlur={() => {
                                                            if (quizSettings.maxRetries === "") {
                                                                setQuizSettings(prev => ({ ...prev, maxRetries: 0 }))
                                                            }
                                                        }}
                                                        className="w-full bg-gray-50/60 border border-gray-200/80 rounded-xl px-3 py-2 text-gray-800 text-sm outline-none focus:bg-white focus:border-gray-400 transition-all"
                                                    />
                                                    <span className="text-xs text-gray-400">0 = single attempt only.</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Section 3: Reference Material (PDF) */}
                                        <div className="border-t border-gray-100 pt-5">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="font-bold text-gray-800 text-xs uppercase tracking-wider">Reference Material (PDF)</h4>
                                                <span className="text-[11px] text-gray-400 font-normal">Optional</span>
                                            </div>
                                            <p className="text-xs text-gray-500 mb-3.5">
                                                Attach PDF files (e.g. formula sheet, reading passage, or reference table) that students can open and reference while taking the {quizSettings.isAssignment ? "assignment" : "quiz"}.
                                            </p>

                                            <input
                                                ref={pdfInputRef}
                                                type="file"
                                                accept="application/pdf"
                                                multiple
                                                className="hidden"
                                                onChange={handlePdfUpload}
                                            />

                                            {allReferencePdfs.length > 0 && (
                                                <div
                                                    ref={pdfListRef}
                                                    className={`space-y-2 mb-3 ${allReferencePdfs.length > 1 ? "max-h-[220px] overflow-y-auto pr-1" : ""}`}
                                                >
                                                    {allReferencePdfs.map((pdf, idx) => (
                                                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50/80 border border-gray-200/80 rounded-xl transition-all">
                                                            <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                                                <FileText className="h-5 w-5 text-gray-500 shrink-0" />
                                                                <div className="min-w-0">
                                                                    <p className="text-xs font-semibold text-gray-800 truncate max-w-[280px]" title={pdf.name || "Reference Material.pdf"}>
                                                                        {pdf.name || "Reference Material.pdf"}
                                                                    </p>
                                                                    <p className="text-[11px] text-gray-400">PDF Document</p>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-1 shrink-0">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRemovePdf(idx)}
                                                                    className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                                                                    title="Remove attached PDF"
                                                                >
                                                                    <Trash className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            <button
                                                type="button"
                                                disabled={uploadingPdf}
                                                onClick={() => pdfInputRef.current?.click()}
                                                className={`w-full border border-gray-200 hover:border-gray-300 hover:bg-gray-50/80 rounded-xl transition-all cursor-pointer disabled:opacity-50 ${allReferencePdfs.length > 0
                                                        ? "p-3 flex items-center justify-center text-gray-500"
                                                        : "p-4 flex flex-col items-center justify-center gap-1 text-gray-500"
                                                    }`}
                                            >
                                                {uploadingPdf ? (
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                                                        <span className="text-xs font-medium text-gray-600">Uploading PDF document...</span>
                                                    </div>
                                                ) : allReferencePdfs.length > 0 ? (
                                                    <span className="text-xs font-semibold text-gray-700">Click to upload another PDF</span>
                                                ) : (
                                                    <div className="text-center">
                                                        <span className="text-xs font-semibold text-gray-700">Click to upload reference PDF</span>
                                                        <span className="block text-[11px] text-gray-400 mt-0.5">Supports multiple PDFs up to 50MB</span>
                                                    </div>
                                                )}
                                            </button>
                                        </div>

                                        {/* Section 4: RapidOCR Question Scanner */}
                                        <div className="border-t border-gray-100 pt-5">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="font-bold text-gray-800 text-xs uppercase tracking-wider">RapidOCR Question Scanner</h4>
                                                <span className="text-[11px] text-gray-400 font-normal">Extract from PDF / Images</span>
                                            </div>
                                            <p className="text-xs text-gray-500 mb-3.5 leading-relaxed">
                                                Upload or paste questionnaires, reviewer PDFs, or exam screenshots to automatically parse and add multiple-choice questions into this {quizSettings.isAssignment ? "assignment" : "quiz"}.
                                            </p>

                                            <div className="bg-gray-50/60 border border-gray-200/80 rounded-2xl p-4">
                                                <OcrQuestionScanner hideActionButtons={true} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Modal Footer */}
                                    <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex justify-end rounded-b-2xl">
                                        <button
                                            onClick={() => setShowSettings(false)}
                                            className="bg-[#E9C46A] hover:bg-[#dfb550] text-white font-semibold text-sm px-6 py-2 rounded-xl transition-all cursor-pointer shadow-2xs"
                                        >
                                            Done
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* JSON Text Import / Export Modal */}
                        {showJsonModal && (
                            <div
                                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200"
                                onClick={(e) => {
                                    if (e.target === e.currentTarget) setShowJsonModal(false)
                                }}
                            >
                                <div className="bg-white border border-gray-200/80 rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                                    {/* Modal Header */}
                                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white rounded-t-2xl shrink-0">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                                                <Braces className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-800 text-sm">Exam Questions JSON</h3>
                                                <p className="text-[11px] text-gray-400">View, copy, or paste raw JSON questions into your exam</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setShowJsonModal(false)}
                                            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>

                                    {/* Modal Body */}
                                    <div className="p-6 flex-1 overflow-y-auto space-y-3">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-gray-500 font-medium">JSON Questions Array</span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(jsonInputText)
                                                    setJsonCopied(true)
                                                    setTimeout(() => setJsonCopied(false), 2000)
                                                    toast.success("JSON copied to clipboard!")
                                                }}
                                                className="text-gray-600 hover:text-gray-900 flex items-center gap-1 bg-gray-100 hover:bg-gray-200 px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer transition-colors"
                                            >
                                                {jsonCopied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                                                <span>{jsonCopied ? "Copied!" : "Copy JSON"}</span>
                                            </button>
                                        </div>

                                        <textarea
                                            value={jsonInputText}
                                            onChange={(e) => setJsonInputText(e.target.value)}
                                            placeholder='[
  {
    "id": "1",
    "type": "question",
    "questionType": "Multiple Choice",
    "text": "What is...?",
    "points": 1,
    "options": [
      { "id": "1", "text": "Option 1", "isCorrect": true },
      { "id": "2", "text": "Option 2", "isCorrect": false }
    ]
  }
]'
                                            className="w-full h-80 p-3 bg-gray-900 text-emerald-400 font-mono text-xs rounded-xl border border-gray-800 outline-none focus:border-emerald-500 transition-colors resize-none leading-relaxed custom-scrollbar"
                                        />
                                    </div>

                                    {/* Modal Footer */}
                                    <div className="px-6 py-3.5 bg-gray-50/70 border-t border-gray-100 flex items-center justify-between rounded-b-2xl">
                                        <p className="text-[11px] text-gray-400">
                                            Paste valid JSON and click &quot;Apply JSON&quot; to replace or add to the current exam.
                                        </p>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    try {
                                                        let parsed = JSON.parse(jsonInputText)
                                                        if (parsed && !Array.isArray(parsed) && parsed.questions) {
                                                            parsed = parsed.questions
                                                        }
                                                        if (!Array.isArray(parsed)) {
                                                            throw new Error("JSON must be an array of questions or an object with a questions array")
                                                        }
                                                        setQuestions(prev => [...prev, ...parsed])
                                                        setShowJsonModal(false)
                                                        toast.success(`Appended ${parsed.length} questions from JSON!`)
                                                    } catch (err) {
                                                        toast.error("Invalid JSON: " + err.message)
                                                    }
                                                }}
                                                className="px-3.5 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 font-semibold text-xs transition-all cursor-pointer shadow-2xs"
                                            >
                                                Append to Exam
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    try {
                                                        let parsed = JSON.parse(jsonInputText)
                                                        if (parsed && !Array.isArray(parsed) && parsed.questions) {
                                                            parsed = parsed.questions
                                                        }
                                                        if (!Array.isArray(parsed)) {
                                                            throw new Error("JSON must be an array of questions or an object with a questions array")
                                                        }
                                                        setQuestions(parsed)
                                                        setShowJsonModal(false)
                                                        toast.success(`Applied ${parsed.length} questions to exam!`)
                                                    } catch (err) {
                                                        toast.error("Invalid JSON: " + err.message)
                                                    }
                                                }}
                                                className="bg-[#E9C46A] hover:bg-[#dfb550] text-white font-semibold text-xs px-4 py-1.5 rounded-xl transition-all cursor-pointer shadow-2xs"
                                            >
                                                Replace Exam Questions
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                {/* Student Floating Timer & Availability Banners */}
                {effectiveIsStudent && (
                    <div className="space-y-4">
                        {isTooEarly && (
                            <div className="inline-block max-w-xl bg-white border border-gray-200/80 rounded-xl px-4 py-3 text-xs text-gray-600 shadow-2xs">
                                <span className="font-semibold text-gray-800">{examId ? "Exam Not Available Yet:" : "Quiz Not Available Yet:"}</span> Scheduled to open on <span className="font-medium text-gray-900">{startDateTime ? startDateTime.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : ''}</span>.
                            </div>
                        )}

                        {isPastDeadline && (
                            <div className="inline-block max-w-xl bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-xs text-rose-800 shadow-2xs">
                                <span className="font-semibold">{examId ? "Exam Deadline Passed:" : quizSettings.isAssignment ? "Assignment Deadline Passed:" : "Quiz Deadline Passed:"}</span> This {examId ? "exam" : quizSettings.isAssignment ? "assignment" : "quiz"} closed on <span className="font-medium">{endDateTime ? endDateTime.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : ''}</span>.
                            </div>
                        )}

                        {isTimeUp && (
                            <div className="inline-block max-w-xl bg-white border border-gray-200/80 rounded-xl px-4 py-3 text-xs text-gray-600 shadow-2xs animate-in fade-in">
                                <span className="font-semibold text-gray-800">Time is Up!</span> Your answers have been automatically submitted.
                            </div>
                        )}
                    </div>
                )}

                {/* Blocks Container or Start Quiz Card */}
                {effectiveIsStudent && !isSubmitted && !effectiveQuizStarted && !isQuizLocked ? (
                    <div className="flex flex-col items-center justify-center min-h-[50vh] py-12 px-4 animate-in fade-in duration-200">
                        <div className="w-full max-w-md mx-auto space-y-6">
                            {/* Header Info */}
                            <div className="text-center">
                                <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-600 px-3 py-1 rounded-full border border-gray-200 text-xs font-medium">
                                    <HelpCircle className="h-3.5 w-3.5 text-gray-400" />
                                    <span>{examId ? "Examination Overview" : "Quiz Overview"}</span>
                                </span>
                            </div>

                            {/* Minimal Meta List */}
                            <div className="py-2 divide-y divide-gray-100 text-xs">
                                <div className="flex items-center justify-between py-2.5">
                                    <span className="text-gray-400 font-medium">Total Questions</span>
                                    <span className="font-semibold text-gray-700">
                                        {questions.filter(q => q.type === 'question').length} questions
                                    </span>
                                </div>
                                <div className="flex items-center justify-between py-2.5">
                                    <span className="text-gray-400 font-medium">Time Limit</span>
                                    <span className="font-semibold text-gray-700">
                                        {quizSettings.timeLimitMinutes > 0 ? `${quizSettings.timeLimitMinutes} mins` : "Untimed"}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between py-2.5">
                                    <span className="text-gray-400 font-medium">Attempts Allowed</span>
                                    <span className="font-semibold text-gray-700">
                                        {Number(quizSettings.maxRetries || 0) > 0 ? `${Number(quizSettings.maxRetries) + 1} attempts (${quizSettings.maxRetries} retries)` : "1 attempt"}
                                    </span>
                                </div>
                                {endDateTime && (
                                    <div className="flex items-center justify-between py-2.5">
                                        <span className="text-gray-400 font-medium">Due Date</span>
                                        <span className="font-semibold text-gray-700">
                                            {endDateTime.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                        </span>
                                    </div>
                                )}
                                {allReferencePdfs.length > 0 && (
                                    <div className="flex items-start justify-between py-2.5">
                                        <span className="text-gray-400 font-medium shrink-0 pt-0.5">
                                            {allReferencePdfs.length > 1 ? "PDF References" : "PDF Reference"}
                                        </span>
                                        <div className="flex flex-col items-end gap-1 text-right min-w-0 pl-3">
                                            {allReferencePdfs.map((pdf, idx) => (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => setViewingPdf(pdf)}
                                                    className="text-blue-600 hover:text-blue-700 underline text-xs font-medium cursor-pointer transition-colors max-w-[240px] truncate"
                                                    title={pdf.name || `Reference ${idx + 1}`}
                                                >
                                                    {pdf.name || `View PDF Document ${idx + 1}`}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Action Button */}
                            <div className="pt-2 text-center">
                                <button
                                    onClick={() => {
                                        setIsQuizStarted(true)
                                        startTimeRef.current = Date.now()
                                        if (quizSettings.timeLimitMinutes > 0) {
                                            setTimeRemaining(quizSettings.timeLimitMinutes * 60)
                                        }
                                    }}
                                    disabled={isQuizLocked || questions.filter(q => q.type === 'question').length === 0}
                                    className="w-full sm:w-auto min-w-[150px] bg-[#E9C46A] hover:bg-[#dfb550] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-xs px-6 py-2.5 rounded-xl shadow-2xs transition-all flex items-center justify-center gap-2 mx-auto cursor-pointer"
                                >
                                    <Play className="h-3.5 w-3.5 fill-white" />
                                    <span>Start {examId ? "Exam" : "Quiz"}</span>
                                </button>

                                {isQuizLocked && (
                                    <p className="text-xs text-rose-500 font-medium mt-2.5">
                                        {isTooEarly ? "This quiz is not open yet." : "The deadline has passed."}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                ) : isQuizLocked ? null : (
                    <div className={`space-y-6 ${effectiveIsStudent ? 'bg-white pb-20' : 'min-h-[400px]'}`}>
                        {/* PDF Reference Section */}
                        {allReferencePdfs.length > 0 && (
                            <div className="pb-1">
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                                    {allReferencePdfs.length > 1 ? "PDF References" : "PDF Reference"}
                                </h4>
                                <div className="flex flex-col items-start gap-1.5">
                                    {allReferencePdfs.map((pdf, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => setViewingPdf(pdf)}
                                            className="text-blue-600 hover:text-blue-700 underline text-sm font-medium cursor-pointer transition-colors p-0 inline-block text-left"
                                            title={pdf.name || `Reference ${idx + 1}`}
                                        >
                                            {pdf.name || (allReferencePdfs.length > 1 ? `View PDF Reference ${idx + 1}` : "View PDF Reference")}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {questions.length === 0 && !effectiveIsStudent && (
                            <div className="flex flex-col items-center justify-center text-center min-h-[460px] py-16 px-4">
                                <div className="flex items-center justify-center mb-2 shrink-0 [&_[fill]:not([fill='none'])]:!fill-[#E9C46A] [&_[stroke]:not([stroke='none'])]:!stroke-[#E9C46A] [&_path]:!stroke-[#E9C46A]">
                                    <LordIcon
                                        src="/icons/empty-quiz.json"
                                        size={40}
                                        speed={0.7}
                                        delay={2500}
                                        trigger="loop"
                                    />
                                </div>
                                <h3 className="text-sm font-bold text-gray-700 mb-1">No questions added yet</h3>
                                <p className="text-xs text-gray-400 max-w-xs">
                                    Click &quot;Add Question&quot; above to start building your mock exam.
                                </p>
                            </div>
                        )}

                        {!isQuizLocked && questions.map((block, index) => {
                            const questionNumber = block.type === "question"
                                ? questions.slice(0, index + 1).filter(q => q.type === "question").length
                                : null;

                            return (
                                <div key={block.id} className="relative group/card">
                                    <div
                                        id={`question-block-${block.id}`}
                                        draggable={!effectiveIsStudent && draggableBlockIndex === index}
                                        onDragStart={(e) => handleDragStart(e, index)}
                                        onDragOver={(e) => handleDragOver(e, index)}
                                        onDrop={(e) => handleDrop(e, index)}
                                        onDragEnd={handleDragEnd}
                                        className={`relative group transition-all ${effectiveIsStudent ? 'py-3' : 'bg-white border border-gray-200/80 rounded-2xl p-5 shadow-2xs'} ${dragOverBlockIndex === index && dragBlockIndex !== index ? 'border-gray-400 border-t-2' : ''}`}
                                    >

                                        {!effectiveIsStudent && (
                                            <>
                                                <div
                                                    data-drag-handle="true"
                                                    onMouseDown={() => setDraggableBlockIndex(index)}
                                                    onMouseUp={() => setDraggableBlockIndex(null)}
                                                    onMouseLeave={() => {
                                                        if (dragBlockIndex === null) setDraggableBlockIndex(null)
                                                    }}
                                                    className="absolute top-2.5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 transition-colors p-1 select-none"
                                                >
                                                    <GripVertical className="h-3.5 w-3.5 pointer-events-none" />
                                                </div>
                                                <button
                                                    onClick={() => removeBlock(block.id)}
                                                    className="absolute -top-3 -right-3 h-7 w-7 bg-white border border-gray-200 text-gray-400 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50 rounded-full shadow-2xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-20 cursor-pointer"
                                                    title="Delete Question"
                                                >
                                                    <Trash className="h-3.5 w-3.5" />
                                                </button>
                                            </>
                                        )}

                                        {block.type === "question" && (
                                            <div className="space-y-3">
                                                {effectiveIsStudent ? (
                                                    <div className="flex items-start gap-2 py-0.5 group relative">
                                                        <span className="font-medium text-gray-400 whitespace-nowrap select-none text-sm pt-0.5" style={{ fontSize: `${quizSettings.fontSize}px` }}>{questionNumber}.</span>
                                                        <span
                                                            className="flex-1 whitespace-pre-wrap leading-relaxed text-gray-800 font-normal text-sm py-0.5 pr-12"
                                                            style={{ fontFamily: quizSettings.fontFamily, fontSize: `${quizSettings.fontSize}px` }}
                                                        >{block.text}</span>
                                                        <span className="absolute right-0 top-1 text-gray-400 font-medium text-[10px] bg-gray-50 border border-gray-200/80 px-2 py-0.5 rounded-md pointer-events-none">
                                                            {block.points !== undefined ? block.points : 1} pt{(block.points !== undefined ? block.points : 1) !== 1 ? 's' : ''}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 border-b border-gray-200/80 focus-within:border-gray-400 transition-colors pb-1 group/prompt">
                                                        <span className="font-medium text-gray-400 whitespace-nowrap select-none text-sm" style={{ fontSize: `${quizSettings.fontSize}px` }}>
                                                            {questionNumber}.
                                                        </span>
                                                        <input
                                                            type="text"
                                                            value={block.text}
                                                            onChange={(e) => updateQuestionText(block.id, e.target.value)}
                                                            placeholder="Type question here..."
                                                            style={{ fontFamily: quizSettings.fontFamily, fontSize: `${quizSettings.fontSize}px` }}
                                                            className="flex-1 bg-transparent py-1 outline-none text-gray-800 font-medium placeholder-gray-400 text-sm"
                                                        />
                                                        <label className="p-1 cursor-pointer hover:bg-gray-100 rounded-md text-gray-400 hover:text-gray-600 transition-all opacity-0 group-hover/prompt:opacity-100 group-hover:opacity-100" title="Upload Image">
                                                            <ImageIcon className="h-4 w-4" />
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                className="hidden"
                                                                ref={el => fileInputRefs.current[block.id] = el}
                                                                onChange={(e) => handleImageUpload(e, block.id)}
                                                            />
                                                        </label>
                                                    </div>
                                                )}

                                                {block.image && (
                                                    <div className="relative inline-block mt-2">
                                                        <img src={block.image} alt="Question media" className="max-h-64 rounded-xl border border-gray-200/80 object-contain" />
                                                        {!effectiveIsStudent && (
                                                            <button
                                                                onClick={() => setQuestions(questions.map(q => q.id === block.id ? { ...q, image: null } : q))}
                                                                className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
                                                            >
                                                                <Trash className="h-3.5 w-3.5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Options Area (Visible for Multiple Choice) */}
                                                {block.questionType !== "Short Answer" && (
                                                    <div className="space-y-1.5 mt-3 pl-4">
                                                        {block.options?.map((option, oIdx) => {
                                                            const studentSelected = (studentAnswers[block.id] || []).includes(option.id)
                                                            const hasAnswered = (studentAnswers[block.id] || []).length > 0
                                                            const maxRetries = Number(quizSettings.maxRetries || 0)
                                                            const currentAttempts = attemptsCount || 1
                                                            const retriesLeft = Math.max(0, maxRetries - (currentAttempts - 1))
                                                            const hasRetriesRemaining = maxRetries > 0 && retriesLeft > 0

                                                            let circleClass = "border-gray-300 bg-white text-blue-600"
                                                            let innerCircle = false
                                                            let optionBg = "transparent"
                                                            let optionText = "text-gray-700 font-normal"

                                                            if (effectiveIsStudent && isSubmitted) {
                                                                if (!hasAnswered) {
                                                                    circleClass = "border-gray-300 bg-white text-gray-400"
                                                                    innerCircle = false
                                                                    optionBg = "transparent"
                                                                    optionText = "text-gray-600 font-normal"
                                                                } else if (studentSelected && option.isCorrect) {
                                                                    circleClass = "border-green-500 bg-green-500 text-white"
                                                                    innerCircle = true
                                                                    optionBg = "bg-green-50/50 rounded-md"
                                                                    optionText = "text-green-800 font-medium"
                                                                } else if (studentSelected && !option.isCorrect) {
                                                                    circleClass = "border-red-500 bg-red-500 text-white"
                                                                    innerCircle = true
                                                                    optionBg = "bg-red-50/50 rounded-md"
                                                                    optionText = "text-red-700 line-through"
                                                                } else if (option.isCorrect) {
                                                                    if (hasRetriesRemaining) {
                                                                        // Hide correct answer while student still has retries remaining
                                                                        circleClass = "border-gray-300 bg-white text-gray-400"
                                                                        innerCircle = false
                                                                        optionBg = "transparent"
                                                                        optionText = "text-gray-700 font-normal"
                                                                    } else {
                                                                        // Reveal correct answer when all retries are finished
                                                                        circleClass = "border-green-500 bg-green-500 text-white"
                                                                        innerCircle = true
                                                                        optionBg = "bg-green-50/50 rounded-md"
                                                                        optionText = "text-green-800 font-medium"
                                                                    }
                                                                }
                                                            } else if (effectiveIsStudent && studentSelected) {
                                                                circleClass = "border-[#E9C46A] bg-[#E9C46A] text-slate-900"
                                                                innerCircle = true
                                                                optionBg = "bg-blue-50/40 rounded-md"
                                                                optionText = "text-blue-900 font-medium"
                                                            } else if (!effectiveIsStudent && option.isCorrect) {
                                                                circleClass = "border-emerald-500 bg-emerald-500 text-white"
                                                                innerCircle = false
                                                            } else if (!effectiveIsStudent) {
                                                                circleClass = "border-gray-300 bg-white hover:border-[#E9C46A]"
                                                            }

                                                            return (
                                                                <div key={option.id} className={`flex items-center gap-2 group/opt py-0.5 transition-colors ${effectiveIsStudent ? `cursor-pointer ${optionBg}` : ''}`} onClick={() => effectiveIsStudent ? handleStudentOptionToggle(block.id, option.id, block.questionType) : null}>
                                                                    <button
                                                                        type="button"
                                                                        disabled={effectiveIsStudent && isSubmitted}
                                                                        onClick={(e) => {
                                                                            if (!effectiveIsStudent) toggleCorrectAnswer(block.id, option.id)
                                                                        }}
                                                                        title={effectiveIsStudent ? "Select answer" : "Choose correct answer"}
                                                                        className={`w-4 h-4 flex items-center justify-center rounded-full border flex-shrink-0 transition-colors ${circleClass} ${effectiveIsStudent && isSubmitted ? 'cursor-default' : 'cursor-pointer'}`}
                                                                    >
                                                                        {innerCircle && <div className="w-1.5 h-1.5 rounded-full bg-current"></div>}
                                                                    </button>
                                                                    {effectiveIsStudent ? (
                                                                        <div
                                                                            className={`flex-1 ${optionText} py-1 px-1 leading-relaxed text-sm`}
                                                                            style={{ fontFamily: quizSettings.fontFamily, fontSize: `${quizSettings.fontSize}px` }}
                                                                        >
                                                                            {option.text}
                                                                        </div>
                                                                    ) : (
                                                                        <input
                                                                            type="text"
                                                                            value={option.text}
                                                                            onChange={(e) => updateOptionText(block.id, option.id, e.target.value)}
                                                                            readOnly={block.questionType === "True or False"}
                                                                            style={{ fontFamily: quizSettings.fontFamily, fontSize: `${quizSettings.fontSize}px` }}
                                                                            className="flex-1 bg-transparent py-1 px-1.5 text-gray-700 text-xs font-normal outline-none focus:bg-gray-50/80 rounded-md transition-colors placeholder-gray-400"
                                                                        />
                                                                    )}
                                                                    {!effectiveIsStudent && block.questionType !== "True or False" && (
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation()
                                                                                removeOption(block.id, option.id)
                                                                            }}
                                                                            className="text-gray-400 hover:text-gray-700 p-1 rounded-md transition-all opacity-0 group-hover/opt:opacity-100 cursor-pointer"
                                                                            title="Remove option"
                                                                        >
                                                                            <Trash className="h-3.5 w-3.5" />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            )
                                                        })}
                                                        {!effectiveIsStudent && (block.questionType === "Multiple Choice" || block.questionType === "True or False") && !block.options?.some(o => o.isCorrect) && (
                                                            <p className="text-xs font-normal text-amber-500 mt-1 italic">
                                                                * Select a correct answer by clicking an empty circle above.
                                                            </p>
                                                        )}
                                                    </div>
                                                )}

                                                {block.questionType === "Short Answer" && (() => {
                                                    const studentAnsText = studentAnswers[block.id] || ""
                                                    const hasAnsweredShort = studentAnsText.trim().length > 0
                                                    const isCorrectShort = hasAnsweredShort && studentAnsText.trim().toLowerCase() === (block.correctAnswer || "").trim().toLowerCase()
                                                    const maxRetries = Number(quizSettings.maxRetries || 0)
                                                    const currentAttempts = attemptsCount || 1
                                                    const retriesLeft = Math.max(0, maxRetries - (currentAttempts - 1))
                                                    const hasRetriesRemaining = maxRetries > 0 && retriesLeft > 0

                                                    return (
                                                        <div className="mt-3 pl-4 w-full max-w-md space-y-1">
                                                            {effectiveIsStudent ? (
                                                                <div className="flex flex-col gap-1.5">
                                                                    <input
                                                                        type="text"
                                                                        value={studentAnsText}
                                                                        onChange={(e) => handleStudentShortAnswer(block.id, e.target.value)}
                                                                        readOnly={isSubmitted}
                                                                        placeholder={isSubmitted ? "(Unanswered)" : "Type your answer here..."}
                                                                        style={{ fontFamily: quizSettings.fontFamily, fontSize: `${quizSettings.fontSize}px` }}
                                                                        className={`w-full border-b pb-1.5 outline-none bg-transparent transition-colors text-sm ${isSubmitted ? (
                                                                                hasAnsweredShort ? (
                                                                                    isCorrectShort
                                                                                        ? "border-green-500 text-green-700 font-medium"
                                                                                        : "border-red-500 text-red-600 font-medium"
                                                                                ) : "border-gray-200 text-gray-400 font-normal italic"
                                                                            ) : "border-gray-200 focus:border-gray-400 text-gray-800"
                                                                            }`}
                                                                    />
                                                                    {isSubmitted && hasAnsweredShort && !isCorrectShort && !hasRetriesRemaining && (
                                                                        <p className="text-xs font-medium text-green-700 bg-green-50 inline-block px-2 py-0.5 rounded">
                                                                            Correct Answer: {block.correctAnswer}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <div className="flex flex-col gap-1">
                                                                    <label className="text-xs font-medium text-gray-400">Correct Answer</label>
                                                                    <input
                                                                        type="text"
                                                                        value={block.correctAnswer || ""}
                                                                        onChange={(e) => updateShortAnswerText(block.id, e.target.value)}
                                                                        placeholder="Enter the correct answer (case-insensitive)..."
                                                                        style={{ fontFamily: quizSettings.fontFamily, fontSize: `${quizSettings.fontSize}px` }}
                                                                        className="w-full border-b border-gray-200 pb-1 outline-none bg-transparent focus:border-gray-400 text-gray-700 text-xs font-normal transition-colors"
                                                                    />
                                                                    {(!block.correctAnswer || !block.correctAnswer.trim()) && (
                                                                        <p className="text-xs font-normal text-amber-500 mt-0.5 italic">
                                                                            * Please provide the correct short answer text above.
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )
                                                })()}

                                                {!effectiveIsStudent && (
                                                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-3 mt-3 text-xs">
                                                        <div className="flex items-center gap-4">
                                                            {block.questionType === "Multiple Choice" && (
                                                                <button
                                                                    onClick={() => addOption(block.id)}
                                                                    className="text-[#E9C46A] hover:text-[#dfb550] font-medium flex items-center gap-1 cursor-pointer transition-colors"
                                                                >
                                                                    Add Option
                                                                </button>
                                                            )}
                                                            <div className="flex items-center gap-1.5 text-gray-500 font-normal">
                                                                <span>Points:</span>
                                                                <input
                                                                    type="number"
                                                                    min={1}
                                                                    max={100}
                                                                    value={block.points === "" ? "" : (block.points !== undefined ? block.points : 1)}
                                                                    onChange={(e) => {
                                                                        const val = e.target.value
                                                                        updateQuestionPoints(block.id, val === "" ? "" : Math.max(1, Number(val)))
                                                                    }}
                                                                    onBlur={() => {
                                                                        if (block.points === "" || block.points === undefined) {
                                                                            updateQuestionPoints(block.id, 1)
                                                                        }
                                                                    }}
                                                                    className="w-7 h-7 bg-white border border-gray-200 rounded-md text-center text-gray-700 font-medium text-xs outline-none focus:border-gray-400 shadow-2xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                                />
                                                            </div>
                                                        </div>

                                                        <Select
                                                            value={block.questionType || "Multiple Choice"}
                                                            onValueChange={(val) => updateQuestionType(block.id, val)}
                                                        >
                                                            <SelectTrigger className="h-7 border-none shadow-none bg-transparent hover:bg-gray-100/70 text-xs text-gray-500 font-medium px-2 py-0 gap-1 rounded-lg hover:text-gray-800 transition-colors focus-visible:ring-0">
                                                                <SelectValue placeholder="Multiple Choice" />
                                                            </SelectTrigger>
                                                            <SelectContent align="end" className="bg-white rounded-lg shadow-xs border border-gray-200/80 p-1">
                                                                <SelectItem value="Multiple Choice" className="text-xs py-1 px-2 cursor-pointer">Multiple Choice</SelectItem>
                                                                <SelectItem value="Short Answer" className="text-xs py-1 px-2 cursor-pointer">Short Answer</SelectItem>
                                                                <SelectItem value="True or False" className="text-xs py-1 px-2 cursor-pointer">True or False</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {block.type === "title_description" && (
                                            <div className="space-y-4">
                                                {effectiveIsStudent ? (
                                                    <div className="flex flex-col gap-4 py-2 border-b border-gray-100">
                                                        {block.title && <h2 className="font-black text-gray-900 leading-tight" style={{ fontFamily: quizSettings.fontFamily, fontSize: `${quizSettings.fontSize * 1.5}px` }}>{block.title}</h2>}
                                                        {block.description && <p className="text-gray-700 whitespace-pre-wrap leading-relaxed" style={{ fontFamily: quizSettings.fontFamily, fontSize: `${quizSettings.fontSize}px` }}>{block.description}</p>}
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col gap-3">
                                                        <div className="flex items-center gap-2 border-b border-gray-200/80 focus-within:border-gray-400 transition-colors pb-1">
                                                            <input
                                                                type="text"
                                                                value={block.title}
                                                                onChange={(e) => updateTitleDescTitle(block.id, e.target.value)}
                                                                placeholder="Title"
                                                                style={{ fontFamily: quizSettings.fontFamily, fontSize: `${quizSettings.fontSize * 1.3}px` }}
                                                                className="flex-1 font-bold bg-transparent outline-none text-gray-800 placeholder-gray-400"
                                                            />
                                                            {!effectiveIsStudent && (
                                                                <button
                                                                    onClick={() => removeBlock(block.id)}
                                                                    className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md opacity-0 group-hover:opacity-100 transition-all cursor-pointer shrink-0"
                                                                    title="Delete Block"
                                                                >
                                                                    <Trash className="h-4 w-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col bg-gray-50 border border-gray-200 rounded p-2 focus-within:border-gray-300 focus-within:bg-white transition-colors">
                                                            <textarea
                                                                value={block.description}
                                                                onChange={(e) => updateTitleDescDesc(block.id, e.target.value)}
                                                                placeholder="Description..."
                                                                rows="3"
                                                                style={{ fontFamily: quizSettings.fontFamily, fontSize: `${quizSettings.fontSize}px` }}
                                                                className="w-full resize-y bg-transparent outline-none text-gray-600 placeholder-gray-400"
                                                            />
                                                            <div className="flex justify-end mt-2">
                                                                <label className="p-1.5 cursor-pointer hover:bg-gray-200 rounded text-gray-500 transition-colors">
                                                                    <ImageIcon className="h-4 w-4" />
                                                                    <input
                                                                        type="file"
                                                                        accept="image/*"
                                                                        className="hidden"
                                                                        ref={el => fileInputRefs.current[block.id] = el}
                                                                        onChange={(e) => handleImageUpload(e, block.id)}
                                                                    />
                                                                </label>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {block.image && (
                                                    <div className="relative inline-block mt-2">
                                                        <img src={block.image} alt="Block media" className="max-h-64 rounded-md border border-gray-200 object-contain" />
                                                        {!effectiveIsStudent && (
                                                            <button
                                                                onClick={() => setQuestions(questions.map(q => q.id === block.id ? { ...q, image: null } : q))}
                                                                className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded hover:bg-red-500 transition-colors"
                                                            >
                                                                <Trash className="h-3 w-3" />
                                                            </button>
                                                        )}
                                                    </div>
                                                )}

                                            </div>
                                        )}

                                    </div>

                                    {!effectiveIsStudent && (
                                        <div className="flex justify-center -mt-3 mb-3 z-10 relative">
                                            <button
                                                onClick={() => addQuestionAfter(index)}
                                                className="h-7 w-7 bg-white border border-gray-200 text-gray-400 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50 rounded-full shadow-2xs flex items-center justify-center transition-all opacity-0 group-hover/card:opacity-100 cursor-pointer"
                                                title="Add Question Below"
                                            >
                                                <Plus className="h-4 w-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )
                        })}

                        {isStudent && !onToggleViewMode && !internalPreview && questions.length > 0 && !isTooEarly && !isSubmitted && (
                            <div className="pt-10 flex justify-center border-t border-gray-100 mt-10">
                                <button
                                    onClick={submitQuiz}
                                    disabled={isQuizLocked}
                                    className="bg-[#E9C46A] hover:bg-[#dfb550] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm px-7 py-2.5 rounded-xl transition-colors cursor-pointer"
                                >
                                    Submit {examId ? "Exam" : "Quiz"}
                                </button>
                            </div>
                        )}
                    </div>
                )}

            </div>

            {/* Right Sidebar - Questions Tracker (Hidden when locked/not available yet or not started) */}
            {!isTooEarly && !((effectiveIsStudent && isPastDeadline && !isSubmitted)) && (!effectiveIsStudent || isSubmitted || effectiveQuizStarted) && (
                <div className="w-full lg:w-[300px] shrink-0 sticky top-6 self-start font-sans z-10">
                    <div className="bg-white border border-gray-200/70 rounded-2xl h-[calc(100vh-3rem)] flex flex-col overflow-hidden">
                        {/* Header */}
                        <div className="px-4 py-3.5 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
                            <h3 className="text-xs font-semibold tracking-wider uppercase text-gray-500">Questions</h3>
                            <span className="bg-gray-100/80 border border-gray-200/60 text-gray-600 px-2 py-0.5 rounded-full text-[11px] font-medium">
                                {questions.filter(q => q.type === 'question').length}
                            </span>
                        </div>
                        {/* List */}
                        <div className="p-3 flex-1 overflow-y-auto space-y-1.5 bg-white text-sm">
                            {questions.filter(q => q.type === 'question').map((q, i) => {
                                const realIndex = questions.findIndex(item => item.id === q.id);
                                return (
                                    <div
                                        key={q.id}
                                        draggable={!effectiveIsStudent}
                                        onDragStart={(e) => handleDragStart(e, realIndex)}
                                        onDragOver={(e) => handleDragOver(e, realIndex)}
                                        onDrop={(e) => handleDrop(e, realIndex)}
                                        onDragEnd={handleDragEnd}
                                        onClick={() => {
                                            const el = document.getElementById(`question-block-${q.id}`)
                                            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
                                        }}
                                        className={`p-2.5 bg-white border border-gray-200/70 hover:border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50/80 transition-all cursor-pointer ${dragOverBlockIndex === realIndex && dragBlockIndex !== realIndex ? 'border-gray-400 border-t-2 translate-y-0.5' : ''}`}
                                    >
                                        <div className="flex items-start gap-2">
                                            {!effectiveIsStudent && <GripVertical className="h-4 w-4 shrink-0 text-gray-300 hover:text-gray-500 mt-0.5" />}
                                            <div className="flex-1 min-w-0 flex items-baseline">
                                                <span className="font-semibold mr-1.5 text-gray-400 whitespace-nowrap text-sm">{i + 1}.</span>
                                                <span className="line-clamp-2 font-normal text-gray-700 leading-snug text-sm">{q.text || "Empty question..."}</span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                            {questions.filter(q => q.type === 'question').length === 0 && (
                                <div className="text-center text-gray-400 py-16 font-medium text-sm">
                                    No questions yet.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Reference Material (PDF) Viewer Modal */}
            {viewingPdf?.url && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setViewingPdf(null)
                    }}
                >
                    <div className="bg-white border border-gray-200/80 rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] max-h-[900px] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
                            <div className="min-w-0 pr-3">
                                <h3 className="font-bold text-gray-800 text-sm truncate">
                                    {viewingPdf.name || "PDF Reference"}
                                </h3>
                                <p className="text-[11px] text-gray-400">PDF Reference Document</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                {allReferencePdfs.length > 1 && (
                                    <select
                                        value={allReferencePdfs.findIndex(p => p.url === viewingPdf.url)}
                                        onChange={(e) => {
                                            const idx = Number(e.target.value)
                                            if (allReferencePdfs[idx]) setViewingPdf(allReferencePdfs[idx])
                                        }}
                                        className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1 text-gray-700 focus:outline-none cursor-pointer max-w-[200px] truncate"
                                    >
                                        {allReferencePdfs.map((p, idx) => (
                                            <option key={idx} value={idx}>
                                                {p.name || `Document ${idx + 1}`}
                                            </option>
                                        ))}
                                    </select>
                                )}
                                <button
                                    onClick={() => setViewingPdf(null)}
                                    className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                                    title="Close"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        {/* Modal PDF Viewer Body using built-in CustomPdfViewer */}
                        <div className="flex-1 w-full h-full bg-gray-100 relative overflow-hidden">
                            <CustomPdfViewer
                                url={viewingPdf.url}
                                watermarkText={currentUserName}
                                isStudent={effectiveIsStudent}
                            />
                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}
