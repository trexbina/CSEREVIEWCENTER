"use client"

import { useState, useRef, useEffect } from "react"
import { createWorker } from "tesseract.js"
import { 
    Upload, 
    Clipboard, 
    Sparkles, 
    Check, 
    AlertCircle, 
    Plus, 
    Trash2, 
    Loader2, 
    FileText, 
    Image as ImageIcon,
    RefreshCw,
    CheckCircle2,
    Eye,
    EyeOff
} from "lucide-react"
import { toast } from "@/components/ui/toast"

// Helper function to intelligently parse extracted text into a structured question
function parseQuestionText(rawText) {
    if (!rawText || !rawText.trim()) {
        return null
    }

    const lines = rawText
        .split("\n")
        .map(l => l.trim())
        .filter(Boolean)

    let questionLines = []
    let options = []
    let detectedAnswer = null
    let explanationLines = []
    let isParsingOptions = false
    let isParsingExplanation = false

    // Option detection regex: e.g. "A.", "A)", "(A)", "[A]", "a.", "1." (if letters aren't used)
    const optionRegex = /^(\(?[A-Da-d]\)?[.)\]]|(?:\d+\.?\s+)?\b(?:True|False)\b)/i
    // Answer detection: e.g. "Answer: B", "Ans: (C)", "Key: A", "Correct: B"
    const answerRegex = /^(?:Answer|Ans|Key|Correct Answer)\s*[:\-]\s*([A-Da-d]|True|False)/i
    // Explanation detection: e.g. "Explanation:", "Rationale:"
    const explanationRegex = /^(?:Explanation|Rationale|Note)\s*[:\-]?\s*(.*)/i

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]

        // Check for answer key line
        const ansMatch = line.match(answerRegex)
        if (ansMatch) {
            detectedAnswer = ansMatch[1].toUpperCase()
            continue
        }

        // Check for explanation/rationale
        const expMatch = line.match(explanationRegex)
        if (expMatch) {
            isParsingExplanation = true
            isParsingOptions = false
            if (expMatch[1]) explanationLines.push(expMatch[1])
            continue
        }

        if (isParsingExplanation) {
            explanationLines.push(line)
            continue
        }

        // Check for option line
        const optMatch = line.match(optionRegex)
        if (optMatch) {
            isParsingOptions = true
            // Strip the leading identifier (A., A), etc.)
            const cleanText = line.replace(optionRegex, "").trim()
            // Try to extract letter label (A, B, C, D)
            const letterMatch = line.match(/^[(\[]?([A-Da-d])[)\]\.\s]/)
            const letter = letterMatch ? letterMatch[1].toUpperCase() : String.fromCharCode(65 + options.length)

            options.push({
                id: Date.now() + Math.random().toString(36).substring(2, 7),
                letter,
                text: cleanText || line,
                isCorrect: false
            })
            continue
        }

        if (isParsingOptions && options.length > 0) {
            // Append continuation lines to the last option text
            options[options.length - 1].text += " " + line
        } else {
            // Still in question text
            questionLines.push(line)
        }
    }

    // Clean question text: strip leading numbers like "1. ", "Question 1: "
    let fullQuestion = questionLines.join(" ").replace(/^(?:Question\s*\d+[:.]?|\d+[.)\]])\s*/i, "").trim()

    // If no options were found, create standard 4 options
    if (options.length === 0) {
        options = [
            { id: Date.now() + "1", letter: "A", text: "Option A", isCorrect: false },
            { id: Date.now() + "2", letter: "B", text: "Option B", isCorrect: false },
            { id: Date.now() + "3", letter: "C", text: "Option C", isCorrect: false },
            { id: Date.now() + "4", letter: "D", text: "Option D", isCorrect: false },
        ]
    }

    // If answer was detected (e.g. "B"), mark the corresponding option as correct
    if (detectedAnswer) {
        options = options.map((opt, idx) => {
            const isMatch = opt.letter === detectedAnswer || 
                (detectedAnswer === "A" && idx === 0) ||
                (detectedAnswer === "B" && idx === 1) ||
                (detectedAnswer === "C" && idx === 2) ||
                (detectedAnswer === "D" && idx === 3)
            return { ...opt, isCorrect: isMatch }
        })
    }

    return {
        questionText: fullQuestion || rawText.substring(0, 100),
        options,
        explanation: explanationLines.join(" ").trim(),
        points: 1
    }
}

export default function OcrQuestionScanner() {
    const [imagePreview, setImagePreview] = useState(null)
    const [isScanning, setIsScanning] = useState(false)
    const [progressStatus, setProgressStatus] = useState("")
    const [progressPercent, setProgressPercent] = useState(0)
    const [rawExtractedText, setRawExtractedText] = useState("")
    const [parsedData, setParsedData] = useState(null)
    const [showRawText, setShowRawText] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const fileInputRef = useRef(null)
    const containerRef = useRef(null)

    // Listen for clipboard paste (Ctrl+V) anywhere while toolbox is open
    useEffect(() => {
        const handlePaste = (e) => {
            const items = e.clipboardData?.items
            if (!items) return

            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf("image") !== -1) {
                    const blob = items[i].getAsFile()
                    if (blob) {
                        e.preventDefault()
                        processImageFile(blob)
                        toast.info("Image pasted from clipboard")
                        break
                    }
                }
            }
        }

        window.addEventListener("paste", handlePaste)
        return () => window.removeEventListener("paste", handlePaste)
    }, [])

    function processImageFile(file) {
        if (!file || !file.type.startsWith("image/")) {
            toast.error("Please provide an image file (PNG, JPG, WebP)")
            return
        }

        const reader = new FileReader()
        reader.onload = (e) => {
            setImagePreview(e.target.result)
            runClientOcr(e.target.result)
        }
        reader.readAsDataURL(file)
    }

    async function runClientOcr(imageUrl) {
        setIsScanning(true)
        setProgressStatus("Initializing in-browser engine...")
        setProgressPercent(5)
        setParsedData(null)
        setRawExtractedText("")

        try {
            const worker = await createWorker("eng", 1, {
                logger: (m) => {
                    if (m.status === "recognizing text") {
                        setProgressStatus("Recognizing question text...")
                        setProgressPercent(Math.round((m.progress || 0) * 100))
                    } else if (m.status === "loading tesseract core") {
                        setProgressStatus("Loading WASM core...")
                        setProgressPercent(20)
                    } else if (m.status === "loading language traineddata") {
                        setProgressStatus("Loading language dictionary...")
                        setProgressPercent(40)
                    } else if (m.status === "initializing api") {
                        setProgressStatus("Preparing OCR model...")
                        setProgressPercent(60)
                    }
                }
            })

            const ret = await worker.recognize(imageUrl)
            await worker.terminate()

            const text = ret.data.text || ""
            setRawExtractedText(text)

            if (!text.trim()) {
                toast.error("No text could be detected in this image.")
                setIsScanning(false)
                return
            }

            const parsed = parseQuestionText(text)
            setParsedData(parsed)
            toast.success("Text recognized successfully!")
        } catch (err) {
            console.error("Client OCR Failed:", err)
            toast.error("OCR scan failed. Please check image quality and try again.")
        } finally {
            setIsScanning(false)
            setProgressStatus("")
            setProgressPercent(0)
        }
    }

    function handleFileDrop(e) {
        e.preventDefault()
        setIsDragging(false)
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processImageFile(e.dataTransfer.files[0])
        }
    }

    function resetScanner() {
        setImagePreview(null)
        setRawExtractedText("")
        setParsedData(null)
        setShowRawText(false)
        if (fileInputRef.current) fileInputRef.current.value = ""
    }

    function handleInsertQuestion() {
        if (!parsedData || !parsedData.questionText.trim()) {
            toast.error("Question text cannot be empty")
            return
        }

        const newQuestionObj = {
            id: Date.now().toString(),
            type: "question",
            questionType: "Multiple Choice",
            text: parsedData.questionText,
            image: null,
            points: Number(parsedData.points || 1),
            options: parsedData.options.map((opt, i) => ({
                id: Date.now() + i.toString(),
                text: opt.text || `Option ${i + 1}`,
                isCorrect: !!opt.isCorrect
            }))
        }

        // Dispatch custom event to QuizBuilder
        window.dispatchEvent(new CustomEvent("peak:add-ocr-question", { detail: newQuestionObj }))
        resetScanner()
    }

    return (
        <div ref={containerRef} className="space-y-4">
            {/* Tool Header Card */}
            <div className="rounded-xl border border-border/80 bg-muted/30 p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="size-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                        <Sparkles className="size-4" />
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-foreground">Question OCR</h4>
                        <p className="text-[10px] text-muted-foreground">In-browser WASM scanner</p>
                    </div>
                </div>

                {imagePreview && (
                    <button
                        type="button"
                        onClick={resetScanner}
                        className="text-[10px] font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1 bg-muted px-2 py-1 rounded-md border border-border/70 cursor-pointer"
                    >
                        <RefreshCw className="size-3" />
                        <span>Reset</span>
                    </button>
                )}
            </div>

            {/* Input Dropzone / Paste Area (when no image is active) */}
            {!imagePreview && (
                <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleFileDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`
                        relative border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all
                        ${isDragging 
                            ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20" 
                            : "border-border/80 hover:border-border hover:bg-muted/30 bg-card"
                        }
                    `}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png, image/jpeg, image/webp"
                        className="hidden"
                        onChange={(e) => {
                            if (e.target.files?.[0]) processImageFile(e.target.files[0])
                        }}
                    />

                    <div className="flex flex-col items-center gap-2">
                        <div className="size-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                            <Upload className="size-5" />
                        </div>
                        <div className="space-y-0.5">
                            <p className="text-xs font-semibold text-foreground">
                                Drop image or click to upload
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                                PNG, JPG, or WebP screenshot
                            </p>
                        </div>

                        <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/60 border border-border/80 text-[10px] text-muted-foreground font-medium">
                            <Clipboard className="size-3" />
                            <span>Or press <strong>Ctrl + V</strong> to paste</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Image Preview & Scanning Indicator */}
            {imagePreview && (
                <div className="space-y-3">
                    <div className="relative rounded-xl border border-border overflow-hidden bg-black/5 dark:bg-white/5 max-h-48 flex items-center justify-center">
                        <img
                            src={imagePreview}
                            alt="Scan preview"
                            className="max-h-44 w-auto object-contain rounded-lg"
                        />
                    </div>

                    {isScanning && (
                        <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-foreground flex items-center gap-1.5">
                                    <Loader2 className="size-3.5 animate-spin text-emerald-600 dark:text-emerald-400" />
                                    <span>{progressStatus || "Scanning image..."}</span>
                                </span>
                                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                                    {progressPercent}%
                                </span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                                <div
                                    className="h-full bg-emerald-500 transition-all duration-200"
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Parsed Question Editor Card */}
            {parsedData && (
                <div className="space-y-3 pt-1 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                            Extracted Question
                        </span>
                        <button
                            type="button"
                            onClick={() => setShowRawText(!showRawText)}
                            className="text-[10px] font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer"
                        >
                            {showRawText ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                            <span>{showRawText ? "Hide Raw" : "Raw Text"}</span>
                        </button>
                    </div>

                    {/* Raw Text view if toggled */}
                    {showRawText && (
                        <div className="p-2.5 rounded-lg border border-border bg-muted/40 font-mono text-[10px] text-muted-foreground max-h-32 overflow-y-auto whitespace-pre-wrap">
                            {rawExtractedText}
                        </div>
                    )}

                    {/* Question Prompt Field */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase">
                            Question Prompt
                        </label>
                        <textarea
                            value={parsedData.questionText}
                            onChange={(e) => setParsedData({ ...parsedData, questionText: e.target.value })}
                            rows={3}
                            placeholder="Question text..."
                            className="w-full rounded-lg border border-border bg-background p-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
                        />
                    </div>

                    {/* Options List */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase">
                                Choices & Correct Answer
                            </label>
                            <span className="text-[10px] text-muted-foreground">
                                Click check to mark correct
                            </span>
                        </div>

                        <div className="space-y-1.5">
                            {parsedData.options.map((opt, idx) => (
                                <div key={opt.id || idx} className="flex items-center gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const updated = parsedData.options.map((o, i) => ({
                                                ...o,
                                                isCorrect: i === idx ? !o.isCorrect : o.isCorrect
                                            }))
                                            setParsedData({ ...parsedData, options: updated })
                                        }}
                                        className={`size-6 rounded-md flex items-center justify-center shrink-0 transition-colors border cursor-pointer ${
                                            opt.isCorrect 
                                                ? "bg-emerald-500 text-white border-emerald-600" 
                                                : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                                        }`}
                                        title={opt.isCorrect ? "Correct answer" : "Mark as correct"}
                                    >
                                        <Check className="size-3.5" />
                                    </button>

                                    <span className="text-[11px] font-mono font-bold text-muted-foreground w-4 text-center">
                                        {opt.letter || String.fromCharCode(65 + idx)}
                                    </span>

                                    <input
                                        type="text"
                                        value={opt.text}
                                        onChange={(e) => {
                                            const updated = [...parsedData.options]
                                            updated[idx] = { ...updated[idx], text: e.target.value }
                                            setParsedData({ ...parsedData, options: updated })
                                        }}
                                        placeholder={`Option ${idx + 1}...`}
                                        className="flex-1 h-7.5 rounded-lg border border-border bg-background px-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
                                    />

                                    {parsedData.options.length > 2 && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const updated = parsedData.options.filter((_, i) => i !== idx)
                                                setParsedData({ ...parsedData, options: updated })
                                            }}
                                            className="size-6 text-muted-foreground hover:text-rose-500 flex items-center justify-center shrink-0 cursor-pointer"
                                            title="Delete option"
                                        >
                                            <Trash2 className="size-3" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Add Option Button */}
                        <button
                            type="button"
                            onClick={() => {
                                const nextLetter = String.fromCharCode(65 + parsedData.options.length)
                                setParsedData({
                                    ...parsedData,
                                    options: [
                                        ...parsedData.options,
                                        { id: Date.now().toString(), letter: nextLetter, text: "", isCorrect: false }
                                    ]
                                })
                            }}
                            className="w-full py-1 rounded-md border border-dashed border-border hover:border-emerald-500/50 hover:bg-emerald-500/5 text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 text-[11px] font-medium flex items-center justify-center gap-1 cursor-pointer transition-colors mt-1"
                        >
                            <Plus className="size-3" />
                            <span>Add Choice</span>
                        </button>
                    </div>

                    {/* Submit Button to Insert into Exam */}
                    <button
                        type="button"
                        onClick={handleInsertQuestion}
                        className="w-full h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer mt-2 active:scale-98"
                    >
                        <Plus className="size-3.5 stroke-[2.5]" />
                        <span>Insert into Exam</span>
                    </button>
                </div>
            )}
        </div>
    )
}
