"use client"

import { useState, useEffect, useRef, use } from "react"
import { useRouter } from "next/navigation"
import { Loader2, ChevronLeft, Image as ImageIcon, Trash2, Plus, GripVertical, Save, Eye, Settings } from "lucide-react"

const GOOGLE_FONTS_URL = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Roboto:wght@400;500;700&family=Poppins:wght@400;500;700&family=Lato:wght@400;700&family=Montserrat:wght@400;500;700&family=Open+Sans:wght@400;600;700&family=Nunito:wght@400;600;700&family=Raleway:wght@400;500;700&family=Playfair+Display:wght@400;700&family=Merriweather:wght@400;700&family=Source+Sans+3:wght@400;600;700&family=DM+Sans:wght@400;500;700&display=swap"

const FONT_OPTIONS = [
    { label: "Inter",           value: "'Inter', sans-serif" },
    { label: "Roboto",          value: "'Roboto', sans-serif" },
    { label: "Open Sans",       value: "'Open Sans', sans-serif" },
    { label: "Poppins",        value: "'Poppins', sans-serif" },
    { label: "Lato",           value: "'Lato', sans-serif" },
    { label: "Montserrat",     value: "'Montserrat', sans-serif" },
    { label: "Nunito",         value: "'Nunito', sans-serif" },
    { label: "DM Sans",        value: "'DM Sans', sans-serif" },
    { label: "Source Sans 3",  value: "'Source Sans 3', sans-serif" },
    { label: "Raleway",        value: "'Raleway', sans-serif" },
    { label: "Playfair Display",value: "'Playfair Display', serif" },
    { label: "Georgia",        value: "Georgia, serif" },
    { label: "Arial",          value: "Arial, sans-serif" },
]

export default function MockExamBuilderPage({ params }) {
    const { examId } = use(params)
    const router = useRouter()
    
    const [exam, setExam] = useState(null)
    const [questions, setQuestions] = useState([])
    const [fetching, setFetching] = useState(true)
    const [saving, setSaving] = useState(false)
    const [isStudentPreview, setIsStudentPreview] = useState(false)
    const [studentAnswers, setStudentAnswers] = useState({})
    const [isSubmitted, setIsSubmitted] = useState(false)
    const [dragBlockIndex, setDragBlockIndex] = useState(null)
    const [dragOverBlockIndex, setDragOverBlockIndex] = useState(null)
    const [settings, setSettings] = useState({
        fontFamily: "'Inter', sans-serif",
        fontSize: 16
    })

    const fileInputRefs = useRef({})

    // Load Fonts once
    useEffect(() => {
        if (document.getElementById('builder-google-fonts')) return
        const link = document.createElement('link')
        link.id = 'builder-google-fonts'
        link.rel = 'stylesheet'
        link.href = GOOGLE_FONTS_URL
        document.head.appendChild(link)
    }, [])

    useEffect(() => {
        if (examId) fetchExam()
    }, [examId])

    async function fetchExam() {
        try {
            setFetching(true)
            const res = await fetch(`/api/admin/mock-exams/${examId}`)
            if (res.ok) {
                const data = await res.json()
                setExam(data.exam)
                if (data.exam.questions) {
                    let parsed = []
                    if (typeof data.exam.questions === "string") {
                        try { parsed = JSON.parse(data.exam.questions) } catch (e) { parsed = [] }
                    } else {
                        parsed = data.exam.questions
                    }
                    
                    if (parsed && !Array.isArray(parsed) && parsed.questions) {
                        setQuestions(parsed.questions)
                        if (parsed.settings) setSettings(parsed.settings)
                    } else {
                        setQuestions(Array.isArray(parsed) ? parsed : [])
                    }
                }
            } else {
                alert("Failed to load mock exam.")
                router.push("/admin/mock-exams")
            }
        } catch (err) {
            console.error(err)
            alert("Error loading mock exam.")
        } finally {
            setFetching(false)
        }
    }

    async function saveMockExam() {
        setSaving(true)
        try {
            const res = await fetch(`/api/admin/mock-exams/${examId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    questions: { settings, questions } 
                })
            })
            if (res.ok) {
                const data = await res.json()
                setExam(data.exam)
            } else {
                throw new Error("Save failed")
            }
        } catch (err) {
            console.error(err)
            alert("Failed to save mock exam questions.")
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
                { id: Date.now() + "1", text: "Option 1", isCorrect: false },
                { id: Date.now() + "2", text: "Option 2", isCorrect: false },
                { id: Date.now() + "3", text: "Option 3", isCorrect: false },
            ]
        }
        setQuestions([...questions, newQuestion])
    }

    const insertQuestionAfter = (id) => {
        const index = questions.findIndex(q => q.id === id)
        if (index === -1) return
        const newQuestion = {
            id: Date.now().toString(),
            type: "question",
            questionType: "Multiple Choice",
            text: "",
            image: null,
            points: 1,
            options: [
                { id: Date.now() + "1", text: "Option 1", isCorrect: false },
                { id: Date.now() + "2", text: "Option 2", isCorrect: false },
                { id: Date.now() + "3", text: "Option 3", isCorrect: false },
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

    const updateCaseSensitive = (id, caseSensitive) => {
        setQuestions(questions.map(q => q.id === id ? { ...q, caseSensitive } : q))
    }

    const updateQuestionType = (id, questionType) => {
        setQuestions(questions.map(q => {
            if (q.id === id) {
                const newData = { ...q, questionType }
                if (questionType === "True or False") {
                    newData.options = [
                        { id: Date.now() + "1", text: "True", isCorrect: false },
                        { id: Date.now() + "2", text: "False", isCorrect: false }
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
                    options: [...(q.options || []), { id: Date.now().toString(), text: `Option ${(q.options?.length || 0) + 1}`, isCorrect: false }]
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
        setQuestions(questions.map(q => {
            if (q.id === questionId) {
                return {
                    ...q,
                    options: q.options.map(o => {
                        if (q.questionType === "True or False") {
                            return { ...o, isCorrect: o.id === optionId }
                        } else {
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
        if (isSubmitted) return
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
        if (isSubmitted) return
        setStudentAnswers(prev => ({ ...prev, [questionId]: text }))
    }

    async function handleImageUpload(e, blockId) {
        const files = Array.from(e.target.files || [])
        if (!files.length) return
        try {
            const formData = new FormData()
            formData.append("file", files[0])

            const uploadRes = await fetch('/api/admin/upload', {
                method: 'POST',
                body: formData
            })
            if (!uploadRes.ok) throw new Error("Upload failed")
            const uploadData = await uploadRes.json()

            setQuestions(questions.map(q => q.id === blockId ? { ...q, image: uploadData.url } : q))
        } catch (err) {
            console.error(err)
            alert("Failed to upload image")
        } finally {
            if (fileInputRefs.current[blockId]) fileInputRefs.current[blockId].value = ""
        }
    }

    // Drag & Drop
    function handleDragStart(e, index) {
        setDragBlockIndex(index)
        e.dataTransfer.effectAllowed = "move"
        e.dataTransfer.setData("text/plain", index)
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
    }

    function handleDragEnd() {
        setDragBlockIndex(null)
        setDragOverBlockIndex(null)
    }

    if (fetching) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-[#fafafa]">
                <div className="text-center space-y-3">
                    <Loader2 className="h-10 w-10 animate-spin text-[#ba5a62] mx-auto" />
                    <p className="text-sm font-extrabold tracking-widest text-[#8c8c8c] uppercase">Loading Exam Builder...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-screen w-full bg-white overflow-hidden animate-in fade-in duration-300">
            {/* Top Toolbar */}
            <header className="h-16 shrink-0 border-b border-gray-200 px-6 flex items-center justify-between bg-white z-20">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push("/admin/mock-exams")}
                        className="h-10 w-10 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-250 text-gray-500 hover:text-gray-700 transition-colors shadow-sm"
                        title="Back to List"
                    >
                        <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
                    </button>
                    <div>
                        <h2 className="text-lg font-black text-[#4d4d4d] uppercase tracking-wide">
                            {exam?.title}
                        </h2>
                        <p className="text-xs text-gray-400 font-bold font-mono tracking-wider">{exam?.exam_code}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Student view toggle */}
                    <button
                        onClick={() => {
                            setIsStudentPreview(!isStudentPreview)
                            setIsSubmitted(false)
                            setStudentAnswers({})
                        }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${
                            isStudentPreview 
                                ? "bg-[#ba5a62] text-white border-transparent" 
                                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                        }`}
                    >
                        <Eye className="h-4 w-4" /> {isStudentPreview ? "Builder View" : "Student View"}
                    </button>

                    {/* Save Button */}
                    {!isStudentPreview && (
                        <button
                            onClick={saveMockExam}
                            disabled={saving}
                            className="bg-[#eedc82] hover:bg-[#e0d075] disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider px-6 py-2.5 rounded-xl shadow-sm hover:-translate-y-0.5 transition-all flex items-center gap-2 active:scale-95"
                        >
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            {saving ? "Saving..." : "Save Exam"}
                        </button>
                    )}
                </div>
            </header>

            {/* Main Area */}
            <div className="flex-1 flex overflow-hidden bg-[#fafafa]">
                {/* Editor Content */}
                <div className="flex-1 overflow-y-auto px-6 py-10 md:px-12 flex justify-center custom-scrollbar">
                    <div className="w-full max-w-4xl space-y-8">
                        {/* Editor Controls */}
                        {!isStudentPreview && (
                            <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm flex items-center justify-between flex-wrap gap-4">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={addQuestion}
                                        className="bg-[#fef5f6] hover:bg-[#fce9ea] text-[#ba5a62] text-xs font-bold px-5 py-2.5 rounded-xl border border-[#f5cdd0]/60 uppercase tracking-wider transition-all hover:-translate-y-0.5 shadow-sm"
                                    >
                                        + Add Question
                                    </button>
                                    <button
                                        onClick={addTitleDescription}
                                        className="bg-gray-50 hover:bg-gray-100 text-gray-600 text-xs font-bold px-5 py-2.5 rounded-xl border border-gray-200 uppercase tracking-wider transition-all hover:-translate-y-0.5 shadow-sm"
                                    >
                                        + Add Title Block
                                    </button>
                                </div>

                                <div className="flex items-center gap-2">
                                    <select
                                        value={settings.fontFamily}
                                        onChange={(e) => setSettings({ ...settings, fontFamily: e.target.value })}
                                        className="bg-white border border-gray-200 text-gray-600 text-xs font-bold px-3 py-2 rounded-xl shadow-sm outline-none cursor-pointer hover:bg-gray-50 transition-colors"
                                        style={{ fontFamily: settings.fontFamily }}
                                    >
                                        {FONT_OPTIONS.map(f => (
                                            <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>
                                                {f.label}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="flex items-center gap-1 border border-gray-200 rounded-xl shadow-sm bg-white px-3 py-1">
                                        <input
                                            type="number"
                                            min={8}
                                            max={72}
                                            value={settings.fontSize}
                                            onChange={(e) => {
                                                const val = Math.min(72, Math.max(8, Number(e.target.value)))
                                                setSettings({ ...settings, fontSize: val || 16 })
                                            }}
                                            className="w-8 text-center text-gray-700 text-xs font-bold outline-none bg-transparent"
                                        />
                                        <span className="text-gray-400 text-xs font-semibold">px</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Questions list container */}
                        <div className={`space-y-6 ${isStudentPreview ? 'bg-white rounded-3xl p-8 border border-gray-100 shadow-sm' : ''}`}>
                            {questions.length === 0 && (
                                <div className="text-center text-gray-400 py-24 font-medium bg-white rounded-3xl border border-dashed border-gray-200">
                                    No questions yet. Click "+ Add Question" to begin crafting your mock exam!
                                </div>
                            )}

                            {questions.map((block, idx) => {
                                const questionNumber = block.type === "question" 
                                    ? questions.slice(0, idx + 1).filter(q => q.type === "question").length 
                                    : null

                                return (
                                    <div
                                        key={block.id}
                                        id={`question-block-${block.id}`}
                                        draggable={!isStudentPreview}
                                        onDragStart={(e) => handleDragStart(e, idx)}
                                        onDragOver={(e) => handleDragOver(e, idx)}
                                        onDrop={(e) => handleDrop(e, idx)}
                                        onDragEnd={handleDragEnd}
                                        className={`relative group transition-all ${
                                            isStudentPreview 
                                                ? 'py-6 border-b border-gray-100 last:border-b-0' 
                                                : 'bg-white border border-gray-200 rounded-2xl p-6 shadow-sm'
                                        } ${dragOverBlockIndex === idx && dragBlockIndex !== idx ? 'border-[#ba5a62] border-t-4 translate-y-1' : ''}`}
                                    >
                                        {/* Drag handle & Delete block buttons */}
                                        {!isStudentPreview && (
                                            <>
                                                <div className="absolute top-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 transition-colors">
                                                    <GripVertical className="h-4 w-4" />
                                                </div>
                                                <button 
                                                    onClick={() => removeBlock(block.id)}
                                                    className="absolute -top-2.5 -right-2.5 h-7 w-7 bg-white border border-gray-200 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10"
                                                    title="Delete Block"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </>
                                        )}

                                        {/* QUESTION TYPE BLOCK */}
                                        {block.type === "question" && (
                                            <div className="space-y-4">
                                                {isStudentPreview ? (
                                                    <div className="flex items-start gap-3 relative">
                                                        <span className="font-black text-[#ba5a62] pt-0.5 select-none" style={{ fontSize: `${settings.fontSize}px` }}>{questionNumber}.</span>
                                                        <span 
                                                            className="flex-1 whitespace-pre-wrap leading-relaxed text-gray-700 font-semibold" 
                                                            style={{ fontFamily: settings.fontFamily, fontSize: `${settings.fontSize}px` }}
                                                        >
                                                            {block.text || "(Untitled Question)"}
                                                        </span>
                                                        <span className="text-[10px] font-extrabold bg-gray-100 border border-gray-200 text-gray-500 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                            {block.points || 1} pt{(block.points || 1) !== 1 ? 's' : ''}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-3 bg-gray-50 border border-gray-250 rounded-xl px-4 py-1.5 focus-within:border-[#eedc82] focus-within:bg-white transition-colors">
                                                        <span className="font-black text-[#ba5a62] select-none" style={{ fontSize: `${settings.fontSize}px` }}>
                                                            {questionNumber}.
                                                        </span>
                                                        <input
                                                            type="text"
                                                            value={block.text}
                                                            onChange={(e) => updateQuestionText(block.id, e.target.value)}
                                                            placeholder="Enter question text here..."
                                                            style={{ fontFamily: settings.fontFamily, fontSize: `${settings.fontSize}px` }}
                                                            className="flex-1 bg-transparent py-2 outline-none text-gray-700 font-semibold placeholder-gray-400"
                                                        />
                                                        <label className="p-2 cursor-pointer hover:bg-gray-200 rounded-xl text-gray-400 hover:text-gray-600 transition-colors">
                                                            <ImageIcon className="h-4.5 w-4.5" />
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

                                                {/* Attached Image preview */}
                                                {block.image && (
                                                    <div className="relative inline-block mt-2 max-w-lg">
                                                        <img src={block.image} alt="Media" className="max-h-64 rounded-xl border border-gray-200 object-contain shadow-sm" />
                                                        {!isStudentPreview && (
                                                            <button 
                                                                onClick={() => setQuestions(questions.map(q => q.id === block.id ? { ...q, image: null } : q))}
                                                                className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-lg hover:bg-red-500 transition-colors"
                                                            >
                                                                <Trash2 className="h-3 w-3" />
                                                            </button>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Options list for choice-based questions */}
                                                {block.questionType !== "Short Answer" && (
                                                    <div className="space-y-2.5 pl-6 mt-3">
                                                        {block.options?.map((option) => {
                                                            const isSelected = (studentAnswers[block.id] || []).includes(option.id)

                                                            let indicatorClass = "border-gray-300 bg-white"
                                                            let showIndicatorDot = false
                                                            let wrapperClass = ""

                                                            if (isStudentPreview && isSubmitted) {
                                                                if (option.isCorrect) {
                                                                    indicatorClass = "border-green-500 bg-green-500/10"
                                                                    showIndicatorDot = true
                                                                    wrapperClass = "bg-green-50/50 rounded-xl ring-1 ring-green-200"
                                                                } else if (isSelected) {
                                                                    indicatorClass = "border-red-500 bg-red-500/10"
                                                                    showIndicatorDot = true
                                                                    wrapperClass = "bg-red-50/50 rounded-xl ring-1 ring-red-200"
                                                                }
                                                            } else if (isStudentPreview && isSelected) {
                                                                indicatorClass = "border-[#ba5a62] bg-[#ba5a62]"
                                                                showIndicatorDot = true
                                                                wrapperClass = "bg-rose-50/40 rounded-xl ring-1 ring-rose-100"
                                                            } else if (!isStudentPreview && option.isCorrect) {
                                                                indicatorClass = "border-green-500 bg-green-500"
                                                                showIndicatorDot = true
                                                            }

                                                            return (
                                                                <div 
                                                                    key={option.id} 
                                                                    className={`flex items-center gap-3 p-1.5 transition-colors ${
                                                                        isStudentPreview ? `cursor-pointer ${wrapperClass} hover:bg-gray-50/50` : ''
                                                                    }`}
                                                                    onClick={() => isStudentPreview ? handleStudentOptionToggle(block.id, option.id, block.questionType) : null}
                                                                >
                                                                    <button
                                                                        type="button"
                                                                        disabled={isStudentPreview && isSubmitted}
                                                                        onClick={() => {
                                                                            if (!isStudentPreview) toggleCorrectAnswer(block.id, option.id)
                                                                        }}
                                                                        className={`w-5 h-5 flex items-center justify-center rounded-full border shadow-inner flex-shrink-0 transition-all ${indicatorClass}`}
                                                                    >
                                                                        {showIndicatorDot && (
                                                                            <div className={`w-2 h-2 rounded-full ${
                                                                                (!isStudentPreview || isSelected) && !isSubmitted 
                                                                                    ? "bg-white" 
                                                                                    : (isStudentPreview && isSubmitted ? (option.isCorrect ? "bg-green-500" : "bg-red-500") : "bg-white")
                                                                            }`} />
                                                                        )}
                                                                    </button>

                                                                    {isStudentPreview ? (
                                                                        <div 
                                                                            className={`flex-1 py-1 px-1 font-medium ${
                                                                                isSubmitted && option.isCorrect 
                                                                                    ? "text-green-800 font-bold" 
                                                                                    : isSubmitted && isSelected 
                                                                                        ? "text-red-700 line-through" 
                                                                                        : "text-gray-600"
                                                                            }`}
                                                                            style={{ fontFamily: settings.fontFamily, fontSize: `${settings.fontSize}px` }}
                                                                        >
                                                                            {option.text}
                                                                        </div>
                                                                    ) : (
                                                                        <input
                                                                            type="text"
                                                                            value={option.text}
                                                                            onChange={(e) => updateOptionText(block.id, option.id, e.target.value)}
                                                                            readOnly={block.questionType === "True or False"}
                                                                            className="flex-1 border border-gray-200 rounded-xl py-1.5 px-3 text-gray-600 outline-none focus:border-[#ba5a62] transition-colors"
                                                                            style={{ fontFamily: settings.fontFamily, fontSize: `${settings.fontSize}px` }}
                                                                        />
                                                                    )}

                                                                    {!isStudentPreview && block.questionType !== "True or False" && (
                                                                        <button
                                                                            onClick={() => removeOption(block.id, option.id)}
                                                                            className="text-xs text-gray-400 hover:text-red-500 font-bold px-3 py-1.5 border border-gray-250 hover:bg-red-50 rounded-xl transition-colors"
                                                                        >
                                                                            Remove
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            )
                                                        })}

                                                        {!isStudentPreview && !block.options?.some(o => o.isCorrect) && (
                                                            <p className="text-xs font-bold text-amber-500/80 mt-1 italic pl-1">
                                                                * Mark correct choice(s) by clicking the option's left circle
                                                            </p>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Option list for Short Answer */}
                                                {block.questionType === "Short Answer" && (
                                                    <div className="pl-6 w-full max-w-lg mt-2">
                                                        {isStudentPreview ? (
                                                            <div className="space-y-2">
                                                                <input
                                                                    type="text"
                                                                    value={studentAnswers[block.id] || ""}
                                                                    onChange={(e) => handleStudentShortAnswer(block.id, e.target.value)}
                                                                    readOnly={isSubmitted}
                                                                    placeholder="Type answer text here..."
                                                                    style={{ fontFamily: settings.fontFamily, fontSize: `${settings.fontSize}px` }}
                                                                    className={`w-full border-b-2 pb-1.5 outline-none bg-transparent transition-colors ${
                                                                        isSubmitted 
                                                                            ? (
                                                                                block.caseSensitive
                                                                                    ? (studentAnswers[block.id] || "").trim() === (block.correctAnswer || "").trim()
                                                                                    : (studentAnswers[block.id] || "").trim().toLowerCase() === (block.correctAnswer || "").trim().toLowerCase()
                                                                            )
                                                                                ? "border-green-500 text-green-700 font-bold"
                                                                                : "border-red-500 text-red-600 font-semibold"
                                                                            : "border-gray-200 focus:border-[#ba5a62] text-gray-800"
                                                                    }`}
                                                                />
                                                                {isSubmitted && (
                                                                    block.caseSensitive
                                                                        ? (studentAnswers[block.id] || "").trim() !== (block.correctAnswer || "").trim()
                                                                        : (studentAnswers[block.id] || "").trim().toLowerCase() !== (block.correctAnswer || "").trim().toLowerCase()
                                                                ) && (
                                                                    <p className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded inline-block">
                                                                        Expected: {block.correctAnswer}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-1">
                                                                <div className="flex items-center justify-between mb-1">
                                                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Expected Correct Text</label>
                                                                    <label className="flex items-center gap-2 cursor-pointer select-none">
                                                                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Case Sensitive</span>
                                                                        <div className="relative">
                                                                            <input 
                                                                                type="checkbox"
                                                                                checked={!!block.caseSensitive}
                                                                                onChange={(e) => updateCaseSensitive(block.id, e.target.checked)}
                                                                                className="sr-only peer"
                                                                            />
                                                                            <div className="w-8 h-4 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-4 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#ba5a62]"></div>
                                                                        </div>
                                                                    </label>
                                                                </div>
                                                                <input
                                                                    type="text"
                                                                    value={block.correctAnswer || ""}
                                                                    onChange={(e) => updateShortAnswerText(block.id, e.target.value)}
                                                                    placeholder={block.caseSensitive ? "Enter exact case-sensitive key answer..." : "Enter exact case-insensitive key answer..."}
                                                                    className="w-full border-b-2 border-gray-200 pb-1 focus:border-green-500 transition-colors outline-none bg-transparent text-gray-700 font-medium"
                                                                    style={{ fontFamily: settings.fontFamily, fontSize: `${settings.fontSize}px` }}
                                                                />
                                                                {(!block.correctAnswer || !block.correctAnswer.trim()) && (
                                                                    <p className="text-xs font-bold text-red-400 italic mt-1">
                                                                        * Input correct text answer to validate scores.
                                                                    </p>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}


                                                {/* Points & Options actions toolbar */}
                                                {!isStudentPreview && (
                                                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100 mt-4">
                                                        <div className="flex items-center gap-3">
                                                            {block.questionType === "Multiple Choice" && (
                                                                <button
                                                                    onClick={() => addOption(block.id)}
                                                                    className="text-xs font-bold text-gray-500 hover:text-gray-700 px-4 py-2 border border-gray-200 hover:bg-gray-50 rounded-xl transition-all"
                                                                >
                                                                    Add Choice Option
                                                                </button>
                                                            )}
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Points:</span>
                                                                <input
                                                                    type="number"
                                                                    min={1}
                                                                    value={block.points || 1}
                                                                    onChange={(e) => updateQuestionPoints(block.id, Number(e.target.value))}
                                                                    className="w-14 border border-gray-200 rounded-xl py-1 px-2 text-center text-gray-700 font-bold outline-none focus:border-[#eedc82]"
                                                                />
                                                            </div>
                                                        </div>

                                                        <select
                                                            value={block.questionType || "Multiple Choice"}
                                                            onChange={(e) => updateQuestionType(block.id, e.target.value)}
                                                            className="border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-500 bg-white outline-none cursor-pointer focus:border-[#eedc82]"
                                                        >
                                                            <option>Multiple Choice</option>
                                                            <option>Short Answer</option>
                                                            <option>True or False</option>
                                                        </select>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* TITLE DESCRIPTION BLOCK */}
                                        {block.type === "title_description" && (
                                            <div className="space-y-4">
                                                {isStudentPreview ? (
                                                    <div className="py-2 border-b border-gray-100">
                                                        {block.title && <h3 className="font-black text-gray-800 leading-snug" style={{ fontFamily: settings.fontFamily, fontSize: `${settings.fontSize * 1.4}px` }}>{block.title}</h3>}
                                                        {block.description && <p className="text-gray-500 whitespace-pre-wrap leading-relaxed mt-2" style={{ fontFamily: settings.fontFamily, fontSize: `${settings.fontSize}px` }}>{block.description}</p>}
                                                    </div>
                                                ) : (
                                                    <div className="space-y-3">
                                                        <input
                                                            type="text"
                                                            value={block.title}
                                                            onChange={(e) => updateTitleDescTitle(block.id, e.target.value)}
                                                            placeholder="Enter section title here..."
                                                            className="w-full font-bold bg-transparent border-b border-gray-200 focus:border-[#ba5a62] outline-none text-gray-800 pb-1"
                                                            style={{ fontFamily: settings.fontFamily, fontSize: `${settings.fontSize * 1.3}px` }}
                                                        />
                                                        <div className="flex flex-col bg-gray-50 border border-gray-200 rounded-xl p-3 focus-within:border-[#eedc82] focus-within:bg-white transition-all">
                                                            <textarea
                                                                value={block.description}
                                                                onChange={(e) => updateTitleDescDesc(block.id, e.target.value)}
                                                                placeholder="Section description text..."
                                                                rows={3}
                                                                className="w-full bg-transparent outline-none text-gray-600 resize-y text-sm font-medium"
                                                                style={{ fontFamily: settings.fontFamily, fontSize: `${settings.fontSize}px` }}
                                                            />
                                                            <div className="flex justify-end mt-2">
                                                                <label className="p-1.5 cursor-pointer hover:bg-gray-200 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
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

                                                {/* Image inside title block */}
                                                {block.image && (
                                                    <div className="relative inline-block mt-1 max-w-lg">
                                                        <img src={block.image} alt="Media" className="max-h-64 rounded-xl border border-gray-200 object-contain shadow-sm" />
                                                        {!isStudentPreview && (
                                                            <button 
                                                                onClick={() => setQuestions(questions.map(q => q.id === block.id ? { ...q, image: null } : q))}
                                                                className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-lg hover:bg-red-500 transition-colors"
                                                            >
                                                                <Trash2 className="h-3 w-3" />
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Inline Add Question Button */}
                                        {!isStudentPreview && (
                                            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all z-20">
                                                <button
                                                    onClick={() => insertQuestionAfter(block.id)}
                                                    className="flex items-center gap-1 bg-[#ba5a62] hover:bg-[#a34c53] text-white text-[11px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full shadow-md hover:-translate-y-0.5 transition-all hover:scale-105 active:scale-95 whitespace-nowrap cursor-pointer"
                                                    title="Add Question Below"
                                                >
                                                    <Plus className="h-3.5 w-3.5" />
                                                    <span>Add Question Below</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>

                        {/* Submit button for preview mode */}
                        {isStudentPreview && questions.length > 0 && (
                            <div className="pt-8 border-t border-gray-200 flex flex-col items-center gap-4">
                                {isSubmitted ? (
                                    (() => {
                                        let totalPts = 0
                                        let earnedPts = 0
                                        
                                        questions.filter(q => q.type === 'question').forEach(q => {
                                            const pts = q.points || 1
                                            totalPts += pts
                                            
                                            let isCorrect = false
                                            if (q.questionType === "True or False" || q.questionType === "Multiple Choice") {
                                                const correctIds = q.options?.filter(o => o.isCorrect).map(o => o.id) || []
                                                const selectedIds = studentAnswers[q.id] || []
                                                if (correctIds.length > 0 && 
                                                    correctIds.length === selectedIds.length && 
                                                    correctIds.every(id => selectedIds.includes(id))) {
                                                    isCorrect = true
                                                }
                                            } else if (q.questionType === "Short Answer") {
                                                const targetStr = (q.correctAnswer || "").trim()
                                                const studentStr = (studentAnswers[q.id] || "").trim()
                                                const matches = q.caseSensitive 
                                                    ? studentStr === targetStr 
                                                    : studentStr.toLowerCase() === targetStr.toLowerCase()
                                                if (targetStr && matches) {
                                                    isCorrect = true
                                                }
                                            }
                                            if (isCorrect) earnedPts += pts
                                        })

                                        return (
                                            <div className="text-center space-y-4 animate-in slide-in-from-bottom-2 duration-300">
                                                <div className="bg-green-50 text-green-800 font-bold px-6 py-3 rounded-xl border border-green-200 inline-block">
                                                    Submitted Preview successfully!
                                                </div>
                                                <div className="p-6 bg-white border border-gray-200 rounded-3xl shadow-sm text-center max-w-xs mx-auto">
                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Preview Score</span>
                                                    <div className="text-4xl font-black mt-2 text-gray-800">
                                                        <span className="text-green-500">{earnedPts}</span> / {totalPts}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })()
                                ) : (
                                    <button
                                        onClick={() => {
                                            setIsSubmitted(true)
                                            window.scrollTo({ top: 0, behavior: 'smooth' })
                                        }}
                                        className="bg-[#eedc82] hover:bg-[#e0d075] text-white font-bold text-sm px-10 py-3.5 rounded-xl shadow-md transition-all hover:scale-105 active:scale-95"
                                    >
                                        Submit Mock Exam
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Questions Tracker Sidebar */}
                <div className="hidden lg:flex w-72 shrink-0 border-l border-gray-200 bg-white flex-col">
                    <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                        <span className="text-xs font-black text-[#4d4d4d] tracking-widest uppercase">QUESTIONS</span>
                        <span className="font-mono text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                            {questions.filter(q => q.type === 'question').length}
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#fafafa]">
                        {questions.filter(q => q.type === 'question').map((q, idx) => {
                            const realIdx = questions.findIndex(item => item.id === q.id)
                            return (
                                <div
                                    key={q.id}
                                    draggable={!isStudentPreview}
                                    onDragStart={(e) => handleDragStart(e, realIdx)}
                                    onDragOver={(e) => handleDragOver(e, realIdx)}
                                    onDrop={(e) => handleDrop(e, realIdx)}
                                    onDragEnd={handleDragEnd}
                                    onClick={() => {
                                        const el = document.getElementById(`question-block-${q.id}`)
                                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
                                    }}
                                    className={`p-3 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-[#eedc82] cursor-pointer transition-colors active:scale-98 flex items-start gap-2 ${
                                        dragOverBlockIndex === realIdx && dragBlockIndex !== realIdx ? 'border-amber-400 border-t-4 translate-y-1' : ''
                                    }`}
                                >
                                    {!isStudentPreview && <GripVertical className="h-4 w-4 text-gray-300 mt-0.5 shrink-0" />}
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs text-gray-400 font-extrabold uppercase mb-0.5">Question {idx + 1}</div>
                                        <div className="text-xs font-semibold text-gray-700 line-clamp-2 leading-relaxed">
                                            {q.text || "Type your query here..."}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}

                        {questions.filter(q => q.type === 'question').length === 0 && (
                            <div className="text-center text-xs font-bold text-gray-400 py-10 uppercase tracking-wide">
                                Empty exam list
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: #e2e8f0;
                    border-radius: 20px;
                }
            `}</style>
        </div>
    )
}
