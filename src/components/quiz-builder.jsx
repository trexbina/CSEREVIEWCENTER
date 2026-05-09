"use client"

import { useState, useEffect, useRef } from "react"
import { Loader2, Image as ImageIcon, Trash2, Plus, ArrowRight, GripVertical } from "lucide-react"

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
    { label: "Merriweather",   value: "'Merriweather', serif" },
    { label: "Georgia",        value: "Georgia, serif" },
    { label: "Times New Roman",value: "'Times New Roman', serif" },
    { label: "Arial",          value: "Arial, sans-serif" },
    { label: "Courier New",    value: "'Courier New', monospace" },
]

export default function QuizBuilder({ lessonId, subjectId, isStudent = false }) {
    const [lessonTitle, setLessonTitle] = useState("Quiz")
    const [questions, setQuestions] = useState([])
    const [fetching, setFetching] = useState(true)
    const [saving, setSaving] = useState(false)
    const [dragBlockIndex, setDragBlockIndex] = useState(null)
    const [dragOverBlockIndex, setDragOverBlockIndex] = useState(null)
    const [studentAnswers, setStudentAnswers] = useState({})
    const [isSubmitted, setIsSubmitted] = useState(false)
    const [quizSettings, setQuizSettings] = useState({
        fontFamily: "'Inter', sans-serif",
        fontSize: 16
    })
    const fileInputRefs = useRef({})

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
        if (!lessonId) return
        fetchLessonData()
    }, [lessonId])

    async function fetchLessonData() {
        setFetching(true)
        try {
            const endpoint = isStudent
                ? `/api/student/subjects/${subjectId}/lessons/${lessonId}`
                : `/api/admin/subjects/${subjectId}/lessons/${lessonId}`

            const res = await fetch(endpoint)
            if (res.ok) {
                const { lesson } = await res.json()
                if (lesson.title) setLessonTitle(lesson.title)
                if (lesson.quiz_content) {
                    try {
                        const parsed = JSON.parse(lesson.quiz_content)
                        if (parsed && !Array.isArray(parsed) && parsed.questions) {
                            setQuestions(parsed.questions)
                            if (parsed.settings) setQuizSettings(parsed.settings)
                        } else {
                            setQuestions(Array.isArray(parsed) ? parsed : [])
                        }
                    } catch (e) {
                        console.error("Failed to parse quiz content")
                    }
                }
            }
        } catch (err) {
            console.error("Fetch lesson error:", err)
        } finally {
            setFetching(false)
        }
    }

    async function saveQuiz() {
        if (!lessonId || isStudent) return
        setSaving(true)
        try {
            const res = await fetch(`/api/admin/subjects/${subjectId}/lessons/${lessonId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ quiz_content: JSON.stringify({ settings: quizSettings, questions }) })
            })
            if (!res.ok) throw new Error("Save failed")
        } catch (err) {
            console.error("Failed to save quiz", err)
            alert("Failed to save quiz content")
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
        if (isStudent) return
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
        if (isSubmitted || !isStudent) return
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
        if (isSubmitted || !isStudent) return
        setStudentAnswers(prev => ({ ...prev, [questionId]: text }))
    }

    const submitQuiz = () => {
        setIsSubmitted(true)
        window.scrollTo({ top: 0, behavior: 'smooth' })
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

            // Update image URL for the block
            setQuestions(questions.map(q => q.id === blockId ? { ...q, image: uploadData.url } : q))
        } catch (err) {
            console.error("Upload error", err)
            alert("Failed to upload image")
        } finally {
            if (fileInputRefs.current[blockId]) fileInputRefs.current[blockId].value = ""
        }
    }

    function handleDragStart(e, index) {
        setDragBlockIndex(index)
        e.dataTransfer.effectAllowed = "move"
        e.dataTransfer.setData("text/plain", index) // Required for Firefox
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
            <div className="flex justify-center items-center h-full min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        )
    }

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 w-full">
            {/* Main Content Area */}
            <div className="flex-1 w-full space-y-6">
                
                {/* Header Actions */}
                {!isStudent && (
                    <div className="flex flex-col gap-4 border-b border-gray-100 pb-6">
                        {/* Row 1: Title + Save Button */}
                        <div className="flex items-center justify-between">
                            <h1 className="text-2xl font-black text-gray-800 tracking-tight">
                                {lessonTitle}
                            </h1>
                            <button
                                onClick={saveQuiz}
                                disabled={saving}
                                className="bg-[#71c58d] hover:bg-[#5db87a] disabled:opacity-50 text-white text-sm font-bold px-6 py-2.5 rounded shadow-sm transition-colors flex items-center gap-2"
                            >
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
                            </button>
                        </div>

                        {/* Row 2: Add Buttons + Font Controls */}
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                            <div className="flex gap-3">
                                <button
                                    onClick={addQuestion}
                                    className="bg-[#fce9ea] hover:bg-[#f5cdd0] text-[#ba5a62] text-xs font-bold px-4 py-2 rounded shadow-sm uppercase tracking-wider transition-colors"
                                >
                                    + ADD QUESTION
                                </button>
                                <button
                                    onClick={addTitleDescription}
                                    className="bg-[#fce9ea] hover:bg-[#f5cdd0] text-[#ba5a62] text-xs font-bold px-4 py-2 rounded shadow-sm uppercase tracking-wider transition-colors"
                                >
                                    + ADD TITLE/DESCRIPTION
                                </button>
                            </div>
                            <div className="flex items-center gap-2">
                                <select 
                                    value={quizSettings.fontFamily} 
                                    onChange={(e) => setQuizSettings({ ...quizSettings, fontFamily: e.target.value })}
                                    className="bg-white/50 border border-[#f5cdd0] text-[#ba5a62] text-xs font-bold px-3 py-2 rounded shadow-sm outline-none cursor-pointer hover:bg-white/80 transition-colors"
                                    style={{ fontFamily: quizSettings.fontFamily }}
                                >
                                    {FONT_OPTIONS.map(f => (
                                        <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>
                                            {f.label}
                                        </option>
                                    ))}
                                </select>
                                <div className="flex items-center gap-1 border border-[#f5cdd0] rounded shadow-sm bg-white/50 px-2">
                                    <input
                                        type="number"
                                        min={8}
                                        max={72}
                                        value={quizSettings.fontSize}
                                        onChange={(e) => {
                                            const val = Math.min(72, Math.max(8, Number(e.target.value)))
                                            setQuizSettings({ ...quizSettings, fontSize: val || 16 })
                                        }}
                                        className="w-10 text-center text-[#ba5a62] text-xs font-bold outline-none bg-transparent py-2"
                                    />
                                    <span className="text-[#ba5a62] text-xs font-bold opacity-60">px</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Blocks Container */}
                <div className={`space-y-8 ${isStudent ? 'bg-white pb-20' : 'bg-gray-50/30 p-4 rounded-3xl min-h-[500px]'}`}>
                    {questions.length === 0 && !isStudent && (
                        <div className="text-center text-gray-400 py-20 font-medium">
                            No questions added yet. Click "+ ADD QUESTION" to get started.
                        </div>
                    )}
                    
                    {questions.map((block, index) => {
                        const questionNumber = block.type === "question" 
                            ? questions.slice(0, index + 1).filter(q => q.type === "question").length 
                            : null;

                        return (
                        <div 
                            id={`question-block-${block.id}`}
                            key={block.id} 
                            draggable={!isStudent}
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDrop={(e) => handleDrop(e, index)}
                            onDragEnd={handleDragEnd}
                            className={`relative group transition-all ${isStudent ? 'py-4' : 'bg-white border text-sm border-gray-200 shadow-sm rounded-xl p-6'} ${dragOverBlockIndex === index && dragBlockIndex !== index ? 'border-blue-400 border-t-4 translate-y-1' : ''}`}
                        >
                            
                            {!isStudent && (
                                <>
                                    <div className="absolute top-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 transition-colors">
                                        <GripVertical className="h-4 w-4" />
                                    </div>
                                    <button 
                                        onClick={() => removeBlock(block.id)}
                                        className="absolute -top-3 -right-3 h-8 w-8 bg-white border border-gray-200 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </>
                            )}

                            {block.type === "question" && (
                                <div className="space-y-4">
                                    {isStudent ? (
                                        <div className="flex items-start gap-3 py-1 pl-3 group relative">
                                            <span className="font-extrabold text-[#ba5a62]/60 whitespace-nowrap select-none pt-1" style={{ fontSize: `${quizSettings.fontSize}px` }}>{questionNumber}.</span>
                                            <span 
                                                className="flex-1 whitespace-pre-wrap leading-relaxed text-gray-700 font-medium py-1 pr-12" 
                                                style={{ fontFamily: quizSettings.fontFamily, fontSize: `${quizSettings.fontSize}px` }}
                                            >{block.text}</span>
                                            <span className="absolute right-0 top-1 text-gray-400 font-bold text-[10px] bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded uppercase tracking-widest pointer-events-none">
                                                {block.points !== undefined ? block.points : 1} pt{(block.points !== undefined ? block.points : 1) !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-md p-1 pl-3 transition-colors focus-within:border-[#f5cdd0] focus-within:bg-white text-sm">
                                            <span className="font-extrabold text-[#ba5a62]/60 whitespace-nowrap select-none" style={{ fontSize: `${quizSettings.fontSize}px` }}>
                                                {questionNumber}.
                                            </span>
                                            <input
                                                type="text"
                                                value={block.text}
                                                onChange={(e) => updateQuestionText(block.id, e.target.value)}
                                                placeholder="Type question here..."
                                                style={{ fontFamily: quizSettings.fontFamily, fontSize: `${quizSettings.fontSize}px` }}
                                                className="flex-1 bg-transparent py-2.5 outline-none text-gray-700 font-medium placeholder-gray-400"
                                            />
                                            <label className="p-2 cursor-pointer hover:bg-gray-200 rounded text-gray-500 transition-colors">
                                                <ImageIcon className="h-5 w-5" />
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
                                            <img src={block.image} alt="Question media" className="max-h-64 rounded-md border border-gray-200 object-contain" />
                                            {!isStudent && (
                                                <button 
                                                    onClick={() => setQuestions(questions.map(q => q.id === block.id ? { ...q, image: null } : q))}
                                                    className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded hover:bg-red-500 transition-colors"
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {/* Options Area (Visible for Multiple Choice) */}
                                    {block.questionType !== "Short Answer" && (
                                        <div className="space-y-3 mt-4 ml-6">
                                            {block.options?.map((option, oIdx) => {
                                                const studentSelected = (studentAnswers[block.id] || []).includes(option.id)
                                                
                                                let circleClass = "border-gray-300 bg-white"
                                                let innerCircle = false
                                                let optionBg = "transparent"
                                                let optionText = "text-gray-600"

                                                if (isStudent && isSubmitted) {
                                                    if (option.isCorrect) {
                                                        circleClass = "border-green-500 bg-green-500/10"
                                                        innerCircle = true
                                                        optionBg = "bg-green-50/50 rounded ring-1 ring-green-200"
                                                        optionText = "text-green-800 font-bold"
                                                    } else if (studentSelected && !option.isCorrect) {
                                                        circleClass = "border-red-500 bg-red-500/10"
                                                        innerCircle = true
                                                        optionBg = "bg-red-50/50 rounded ring-1 ring-red-200"
                                                        optionText = "text-red-800 line-through"
                                                    }
                                                } else if (isStudent && studentSelected) {
                                                    circleClass = "border-blue-500 bg-blue-500"
                                                    innerCircle = true
                                                    optionBg = "bg-blue-50/50 rounded ring-1 ring-blue-100"
                                                    optionText = "text-blue-800 font-medium"
                                                } else if (!isStudent && option.isCorrect) {
                                                    circleClass = "border-green-500 bg-green-500"
                                                    innerCircle = true
                                                } else if (!isStudent) {
                                                    circleClass = "border-gray-300 bg-white hover:border-green-300"
                                                }

                                                return (
                                                <div key={option.id} className={`flex items-center gap-3 p-1 transition-colors ${isStudent ? `cursor-pointer ${optionBg}` : ''} ${!isSubmitted && isStudent ? 'hover:bg-gray-50' : ''}`} onClick={() => isStudent ? handleStudentOptionToggle(block.id, option.id, block.questionType) : null}>
                                                    <button
                                                        type="button"
                                                        disabled={isStudent && isSubmitted}
                                                        onClick={(e) => {
                                                            if (!isStudent) toggleCorrectAnswer(block.id, option.id)
                                                        }}
                                                        title={isStudent ? "Select answer" : "Choose correct answer"}
                                                        className={`w-5 h-5 flex items-center justify-center rounded-full border shadow-inner flex-shrink-0 transition-colors ${circleClass} ${isStudent && isSubmitted ? 'cursor-default' : 'cursor-pointer'}`}
                                                    >
                                                        {innerCircle && <div className={`w-2 h-2 rounded-full ${(!isStudent || studentSelected) && !isSubmitted ? "bg-white" : (isStudent && isSubmitted ? (option.isCorrect ? "bg-green-500" : "bg-red-500") : "bg-white")}`}></div>}
                                                    </button>
                                                    {isStudent ? (
                                                        <div 
                                                            className={`flex-1 ${optionText} py-2 px-1 leading-relaxed`}
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
                                                            className="flex-1 border border-gray-200 rounded-md py-2 px-3 text-gray-600 outline-none focus:border-blue-400 transition-colors"
                                                        />
                                                    )}
                                                    {!isStudent && block.questionType !== "True or False" && (
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                removeOption(block.id, option.id)
                                                            }}
                                                            className="text-gray-400 hover:text-red-500 text-sm font-medium border border-gray-200 px-3 py-2 rounded-md hover:bg-red-50 transition-colors"
                                                        >
                                                            Remove
                                                        </button>
                                                    )}
                                                </div>
                                            )})}
                                            {!isStudent && (block.questionType === "Multiple Choice" || block.questionType === "True or False") && !block.options?.some(o => o.isCorrect) && (
                                                <p className="text-xs font-bold text-red-400 mt-2 italic">
                                                    * Please select a correct answer by clicking an empty circle above.
                                                </p>
                                            )}
                                        </div>
                                    )}
                                    
                                    {block.questionType === "Short Answer" && (
                                        <div className="mt-4 ml-8 w-full max-w-md space-y-1">
                                            {isStudent ? (
                                                <div className="flex flex-col gap-2">
                                                    <input 
                                                        type="text" 
                                                        value={studentAnswers[block.id] || ""}
                                                        onChange={(e) => handleStudentShortAnswer(block.id, e.target.value)}
                                                        readOnly={isSubmitted}
                                                        placeholder="Type your answer here..."
                                                        style={{ fontFamily: quizSettings.fontFamily, fontSize: `${quizSettings.fontSize}px` }}
                                                        className={`w-full border-b-2 pb-2 outline-none bg-transparent transition-colors ${
                                                            isSubmitted ? (
                                                                (studentAnswers[block.id] || "").toLowerCase() === (block.correctAnswer || "").toLowerCase()
                                                                    ? "border-green-500 text-green-700 font-bold"
                                                                    : "border-red-500 text-red-600 font-semibold"
                                                            ) : "border-dashed border-gray-300 focus:border-blue-400 text-gray-800"
                                                        }`}
                                                    />
                                                    {isSubmitted && (studentAnswers[block.id] || "").toLowerCase() !== (block.correctAnswer || "").toLowerCase() && (
                                                        <p className="text-sm font-bold text-green-600 bg-green-50 inline-block px-2 py-1 rounded">
                                                            Correct Answer: {block.correctAnswer}
                                                        </p>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="flex flex-col gap-2">
                                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Correct Answer</label>
                                                    <input 
                                                        type="text" 
                                                        value={block.correctAnswer || ""}
                                                        onChange={(e) => updateShortAnswerText(block.id, e.target.value)}
                                                        placeholder="Enter the correct answer (case-insensitive)..."
                                                        style={{ fontFamily: quizSettings.fontFamily, fontSize: `${quizSettings.fontSize}px` }}
                                                        className="w-full border-b-2 border-solid border-gray-200 pb-2 outline-none bg-transparent focus:border-green-400 text-gray-700 font-medium transition-colors"
                                                    />
                                                    {(!block.correctAnswer || !block.correctAnswer.trim()) && (
                                                        <p className="text-xs font-bold text-red-400 mt-1 italic">
                                                            * Please provide the correct short answer text above.
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {!isStudent && (
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-6 gap-4 border-t border-gray-100 pt-4">
                                            <div className="flex items-center gap-4 flex-wrap">
                                                {block.questionType === "Multiple Choice" && (
                                                    <button 
                                                        onClick={() => addOption(block.id)}
                                                        className="border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-bold px-4 py-2 rounded transition-colors"
                                                    >
                                                        Add Option
                                                    </button>
                                                )}
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Points:</span>
                                                    <input 
                                                        type="number" 
                                                        min={1} 
                                                        max={100} 
                                                        value={block.points !== undefined ? block.points : 1}
                                                        onChange={(e) => updateQuestionPoints(block.id, Number(e.target.value))}
                                                        className="w-16 border border-gray-200 rounded px-2 py-1.5 text-center text-gray-700 font-bold outline-none focus:border-blue-400 bg-white"
                                                    />
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-3 ml-auto">
                                                <select
                                                    value={block.questionType || "Multiple Choice"}
                                                    onChange={(e) => updateQuestionType(block.id, e.target.value)}
                                                    className="border border-gray-200 rounded px-3 py-2 text-sm text-gray-600 outline-none focus:border-blue-400 bg-white"
                                                >
                                                    <option>Multiple Choice</option>
                                                    <option>Short Answer</option>
                                                    <option>True or False</option>
                                                </select>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {block.type === "title_description" && (
                                <div className="space-y-4">
                                    {isStudent ? (
                                        <div className="flex flex-col gap-4 py-2 border-b border-gray-100">
                                            {block.title && <h2 className="font-black text-gray-900 leading-tight" style={{ fontFamily: quizSettings.fontFamily, fontSize: `${quizSettings.fontSize * 1.5}px` }}>{block.title}</h2>}
                                            {block.description && <p className="text-gray-700 whitespace-pre-wrap leading-relaxed" style={{ fontFamily: quizSettings.fontFamily, fontSize: `${quizSettings.fontSize}px` }}>{block.description}</p>}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-3">
                                            <div className="flex items-center border-b-2 border-gray-200 focus-within:border-blue-500 transition-colors pb-1">
                                                <input
                                                    type="text"
                                                    value={block.title}
                                                    onChange={(e) => updateTitleDescTitle(block.id, e.target.value)}
                                                    placeholder="Title"
                                                    style={{ fontFamily: quizSettings.fontFamily, fontSize: `${quizSettings.fontSize * 1.5}px` }}
                                                    className="w-full font-bold bg-transparent outline-none text-gray-800 placeholder-gray-400"
                                                />
                                            </div>
                                            <div className="flex flex-col bg-gray-50 border border-gray-200 rounded p-2 focus-within:border-[#f5cdd0] focus-within:bg-white transition-colors">
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
                                                {!isStudent && (
                                                    <button 
                                                        onClick={() => setQuestions(questions.map(q => q.id === block.id ? { ...q, image: null } : q))}
                                                        className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded hover:bg-red-500 transition-colors"
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                            )}

                        </div>
                    )})}

                    {isStudent && questions.length > 0 && (
                        <div className="pt-10 flex justify-center border-t border-gray-100 mt-10">
                            {isSubmitted ? (
                                (() => {
                                    let totalPoints = 0;
                                    let earnedPoints = 0;

                                    questions.filter(q => q.type === 'question').forEach(q => {
                                        const pts = q.points !== undefined ? q.points : 1;
                                        totalPoints += pts;
                                        
                                        let isQCorrect = false;
                                        if (q.questionType === "True or False" || q.questionType === "Multiple Choice") {
                                            const correctOptionIds = q.options?.filter(o => o.isCorrect).map(o => o.id) || [];
                                            const studentSelectedIds = studentAnswers[q.id] || [];
                                            
                                            if (correctOptionIds.length > 0 && 
                                                correctOptionIds.length === studentSelectedIds.length && 
                                                correctOptionIds.every(id => studentSelectedIds.includes(id))) {
                                                isQCorrect = true;
                                            }
                                        } else if (q.questionType === "Short Answer") {
                                            const correctAns = q.correctAnswer || "";
                                            if (correctAns.trim() !== "" && (studentAnswers[q.id] || "").trim().toLowerCase() === correctAns.trim().toLowerCase()) {
                                                isQCorrect = true;
                                            }
                                        }
                                        
                                        if (isQCorrect) earnedPoints += pts;
                                    });

                                    return (
                                        <div className="flex flex-col items-center gap-6 animate-in slide-in-from-bottom-4 fade-in duration-500">
                                            <div className="bg-green-50 text-green-800 font-bold px-8 py-4 rounded-xl text-lg flex items-center gap-3 shadow-sm border border-green-200">
                                                Quiz Submitted Successfully!
                                            </div>
                                            <div className="flex flex-col items-center justify-center p-8 bg-white border-2 border-gray-100 rounded-3xl shadow-sm text-center">
                                                <p className="text-gray-500 font-extrabold uppercase tracking-widest text-sm mb-2">Final Score</p>
                                                <div className="text-5xl font-black text-gray-800 tracking-tighter">
                                                    <span className={`${earnedPoints === totalPoints ? 'text-green-500' : earnedPoints > totalPoints/2 ? 'text-blue-500' : 'text-[#ba5a62]'}`}>{earnedPoints}</span>
                                                    <span className="text-gray-300 mx-2">/</span> 
                                                    {totalPoints}
                                                </div>
                                                <p className="text-gray-400 font-medium mt-3 text-sm">points accumulated</p>
                                            </div>
                                        </div>
                                    )
                                })()
                            ) : (
                                <button
                                    onClick={submitQuiz}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg px-12 py-4 rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95"
                                >
                                    Submit Quiz
                                </button>
                            )}
                        </div>
                    )}
                </div>

            </div>

            {/* Right Sidebar - Questions Tracker */}
            <div className="w-full lg:w-[320px] shrink-0 sticky top-24 self-start">
                <div className="bg-white border border-gray-100 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] h-[600px] flex flex-col overflow-hidden">
                    <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-white text-gray-700">
                        <h3 className="font-extrabold text-sm tracking-widest uppercase">Questions</h3>
                        <span className="text-gray-400 font-bold font-mono">
                            {questions.filter(q => q.type === 'question').length}
                        </span>
                    </div>
                    <div className="p-6 flex-1 overflow-y-auto space-y-3 bg-gray-50/30 text-sm">
                        {questions.filter(q => q.type === 'question').map((q, i) => {
                            const realIndex = questions.findIndex(item => item.id === q.id);
                            return (
                            <div 
                                key={q.id} 
                                draggable={!isStudent}
                                onDragStart={(e) => handleDragStart(e, realIndex)}
                                onDragOver={(e) => handleDragOver(e, realIndex)}
                                onDrop={(e) => handleDrop(e, realIndex)}
                                onDragEnd={handleDragEnd}
                                onClick={() => {
                                    const el = document.getElementById(`question-block-${q.id}`)
                                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
                                }}
                                className={`p-3 bg-white border border-gray-100 rounded-xl shadow-sm text-gray-600 hover:border-blue-300 transition-colors cursor-pointer active:scale-[0.98] ${dragOverBlockIndex === realIndex && dragBlockIndex !== realIndex ? 'border-blue-400 border-t-4 translate-y-1' : ''}`}
                            >
                                <div className="flex items-start gap-2">
                                    {!isStudent && <GripVertical className="h-4 w-4 shrink-0 text-gray-300 hover:text-gray-500 mt-0.5" />}
                                    <div className="flex-1 min-w-0 flex">
                                        <span className="font-bold mr-2 text-gray-400 whitespace-nowrap">{i + 1}.</span> 
                                        <span className="line-clamp-2 font-medium">{q.text || "Empty query..."}</span>
                                    </div>
                                </div>
                            </div>
                        )})}
                        {questions.filter(q => q.type === 'question').length === 0 && (
                            <div className="text-center text-gray-400 py-10 font-medium">
                                No questions to display.
                            </div>
                        )}
                    </div>
                </div>
            </div>

        </div>
    )
}
