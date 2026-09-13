"use client"

import { useState, useRef, useEffect } from "react"
import { createWorker } from "tesseract.js"
import { pdfjs } from "react-pdf"
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
    EyeOff,
    FileCheck,
    Layers,
    ListFilter,
    Braces,
    Copy
} from "lucide-react"
import { toast } from "@/components/ui/toast"

// Configure PDF.js worker
if (typeof window !== "undefined" && !pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url
    ).toString()
}

/**
 * Pre-processes text to break inline choices and questions onto new lines
 */
function preprocessQuestionText(text) {
    if (!text) return ""
    let t = text.replace(/\r\n/g, "\n")

    // Separate inline choices: e.g. "a. ... b. ..." or "A. ... B. ..." or "(a) ... (b) ..." or "[a] ... [b] ..."
    t = t.replace(/([^\n])\s+([a-eA-E][\.\)])\s+/g, "$1\n$2 ")
    t = t.replace(/([^\n])\s+(\([a-eA-E]\))\s+/g, "$1\n$2 ")
    t = t.replace(/([^\n])\s+(\[[a-eA-E]\])\s+/g, "$1\n$2 ")

    // Separate inline questions: e.g. "...text. 2. Next question..." or "...text? Q2. Next..."
    t = t.replace(/([^\n])\s+((?:Question|Item|Q)\s*\d+[:.\-\)])\s+/gi, "$1\n$2 ")
    t = t.replace(/([^\n])\s+(\d+[\.\)])\s+/g, "$1\n$2 ")

    // Separate inline answer keys / notes / explanations
    t = t.replace(/([^\n])\s+((?:Answer|Ans|Key|Correct Answer)\s*[:\-])\s+/gi, "$1\n$2 ")
    t = t.replace(/([^\n])\s+((?:Explanation|Rationale|Note)\s*[:\-])\s+/gi, "$1\n$2 ")

    return t
}

/**
 * Intelligent Multi-Question Parser for RapidOCR
 * Parses single or multi-question questionnaires from PDFs or screenshots.
 */
function parseQuestionsFromText(rawText) {
    if (!rawText || !rawText.trim()) return []

    const preprocessed = preprocessQuestionText(rawText)
    const lines = preprocessed.split("\n").map(l => l.trim()).filter(Boolean)

    if (lines.length === 0) return []

    // Match question starts: e.g. "1.", "1)", "Q1.", "Question 1:", "1 - ", etc.
    const questionStartRegex = /^(?:(?:Question|Item|Q)\s*\d+[:.\-\)]|\d+[\.\)\-]\s+)/i

    let rawBlocks = []
    let currentBlock = []

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        if (questionStartRegex.test(line) && currentBlock.length > 0) {
            // Check if currentBlock has non-empty content
            rawBlocks.push([...currentBlock])
            currentBlock = []
        }
        currentBlock.push(line)
    }

    if (currentBlock.length > 0) {
        rawBlocks.push(currentBlock)
    }

    // If no distinct numbered blocks were found, treat lines as a single block
    if (rawBlocks.length === 0) {
        rawBlocks = [lines]
    }

    const parsedQuestions = []
    const optionRegex = /^[(\[]?([A-Ea-e])[)\]\.\s\-:]\s*(.*)/
    const answerRegex = /^(?:Answer|Ans|Key|Correct Answer)\s*[:\-]\s*([A-Ea-e]|True|False)/i
    const explanationRegex = /^(?:Explanation|Rationale|Note)\s*[:\-]?\s*(.*)/i

    rawBlocks.forEach((blockLines, blockIdx) => {
        let questionTextLines = []
        let options = []
        let detectedAnswer = null
        let explanationLines = []
        let isParsingOptions = false
        let isParsingExplanation = false

        for (let i = 0; i < blockLines.length; i++) {
            const line = blockLines[i]

            // Answer Key match
            const ansMatch = line.match(answerRegex)
            if (ansMatch) {
                detectedAnswer = ansMatch[1].toUpperCase()
                continue
            }

            // Explanation / Rationale match
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

            // Choice / Option match (A., B., C., D., etc.)
            const optMatch = line.match(optionRegex)
            if (optMatch) {
                isParsingOptions = true
                const letter = optMatch[1].toUpperCase()
                const optContent = optMatch[2] || ""

                options.push({
                    id: Date.now() + "_" + blockIdx + "_" + letter + "_" + Math.random().toString(36).substring(2, 6),
                    letter,
                    text: optContent.trim(),
                    isCorrect: false
                })
                continue
            }

            if (isParsingOptions && options.length > 0) {
                // Continuation line for the current option
                options[options.length - 1].text += " " + line
            } else {
                questionTextLines.push(line)
            }
        }

        // Clean question text: strip leading "1. ", "Question 1: "
        let questionPrompt = questionTextLines.join(" ")
            .replace(/^(?:(?:Question|Item|Q)\s*\d+[:.\-\)]|\d+[\.\)\-]\s*)/i, "")
            .trim()

        // If block only contained header text with no options and wasn't a question, skip
        if (!questionPrompt && options.length === 0) return
        if (options.length === 0 && !questionStartRegex.test(blockLines[0])) return

        // Default to standard 4 options if none detected
        if (options.length === 0) {
            options = [
                { id: Date.now() + "_" + blockIdx + "_A", letter: "A", text: "Option A", isCorrect: false },
                { id: Date.now() + "_" + blockIdx + "_B", letter: "B", text: "Option B", isCorrect: false },
                { id: Date.now() + "_" + blockIdx + "_C", letter: "C", text: "Option C", isCorrect: false },
                { id: Date.now() + "_" + blockIdx + "_D", letter: "D", text: "Option D", isCorrect: false },
            ]
        }

        // If an answer key letter was detected, mark the matching choice
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

        parsedQuestions.push({
            id: (Date.now() + blockIdx + Math.floor(Math.random() * 1000)).toString(),
            type: "question",
            questionType: "Multiple Choice",
            text: questionPrompt || `Question ${blockIdx + 1}`,
            image: null,
            points: 1,
            options: options.map(o => ({
                id: o.id,
                text: o.text || `Choice ${o.letter}`,
                isCorrect: !!o.isCorrect
            })),
            explanation: explanationLines.join(" ").trim()
        })
    })

    return parsedQuestions
}

export default function OcrQuestionScanner() {
    const [fileInfo, setFileInfo] = useState(null)
    const [isScanning, setIsScanning] = useState(false)
    const [progressStatus, setProgressStatus] = useState("")
    const [progressPercent, setProgressPercent] = useState(0)
    const [rawExtractedText, setRawExtractedText] = useState("")
    const [createdQuestions, setCreatedQuestions] = useState([])
    const [showRawText, setShowRawText] = useState(false)
    const [activeTab, setActiveTab] = useState("cards") // "cards" | "json"
    const [jsonCopied, setJsonCopied] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const fileInputRef = useRef(null)

    // Listen for clipboard paste (Ctrl+V) for screenshots
    useEffect(() => {
        const handlePaste = (e) => {
            const items = e.clipboardData?.items
            if (!items) return

            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf("image") !== -1) {
                    const blob = items[i].getAsFile()
                    if (blob) {
                        e.preventDefault()
                        handleSelectedFile(blob)
                        toast.info("Image pasted from clipboard")
                        break
                    }
                }
            }
        }

        window.addEventListener("paste", handlePaste)
        return () => window.removeEventListener("paste", handlePaste)
    }, [])

    function handleSelectedFile(file) {
        if (!file) return

        const isPdf = file.type === "application/pdf" || file.name?.toLowerCase().endsWith(".pdf")
        const isImg = file.type.startsWith("image/")

        if (!isPdf && !isImg) {
            toast.error("Please provide a PDF or image file (PNG, JPG, WebP)")
            return
        }

        setFileInfo({
            name: file.name || (isPdf ? "Uploaded Document.pdf" : "Pasted Screenshot.png"),
            type: isPdf ? "pdf" : "image",
            size: file.size ? `${Math.round(file.size / 1024)} KB` : ""
        })

        if (isPdf) {
            processPdfFile(file)
        } else {
            processImageFile(file)
        }
    }

    // Process image file through RapidOCR Worker
    async function processImageFile(file) {
        setIsScanning(true)
        setProgressStatus("Initializing RapidOCR engine...")
        setProgressPercent(10)
        setCreatedQuestions([])
        setRawExtractedText("")

        const reader = new FileReader()
        reader.onload = async (e) => {
            const imageUrl = e.target.result
            try {
                const worker = await createWorker("eng", 1, {
                    logger: (m) => {
                        if (m.status === "recognizing text") {
                            setProgressStatus("RapidOCR: Recognizing text...")
                            setProgressPercent(Math.round((m.progress || 0) * 100))
                        } else if (m.status === "loading tesseract core") {
                            setProgressStatus("RapidOCR: Loading core WASM...")
                            setProgressPercent(25)
                        } else if (m.status === "loading language traineddata") {
                            setProgressStatus("RapidOCR: Loading models...")
                            setProgressPercent(50)
                        }
                    }
                })

                const ret = await worker.recognize(imageUrl)
                await worker.terminate()

                const text = ret.data.text || ""
                setRawExtractedText(text)
                finalizeExtractedQuestions(text)
            } catch (err) {
                console.error("Image OCR Failed:", err)
                toast.error("OCR scan failed. Please try again.")
                setIsScanning(false)
            }
        }
        reader.readAsDataURL(file)
    }

    // Process PDF file (Digital text extraction + Scanned page OCR fallback)
    async function processPdfFile(file) {
        setIsScanning(true)
        setProgressStatus("Reading PDF document...")
        setProgressPercent(5)
        setCreatedQuestions([])
        setRawExtractedText("")

        try {
            const arrayBuffer = await file.arrayBuffer()
            const loadingTask = pdfjs.getDocument({ data: arrayBuffer })
            const pdf = await loadingTask.promise
            const totalPages = pdf.numPages

            let combinedText = ""
            let ocrWorker = null

            for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
                const percent = Math.round((pageNum / totalPages) * 90)
                setProgressPercent(percent)
                setProgressStatus(`Analyzing page ${pageNum} of ${totalPages}...`)

                const page = await pdf.getPage(pageNum)
                const textContent = await page.getTextContent()

                // Reconstruct page text while preserving line breaks based on Y-coordinates and hasEOL
                let pageDigitalText = ""
                let lastY = null

                for (let i = 0; i < textContent.items.length; i++) {
                    const item = textContent.items[i]
                    if (!item || !item.str) continue

                    const currentY = item.transform ? item.transform[5] : null
                    if (lastY !== null && currentY !== null && Math.abs(currentY - lastY) > 5) {
                        pageDigitalText += "\n"
                    } else if (item.hasEOL) {
                        pageDigitalText += "\n"
                    } else if (pageDigitalText.length > 0 && !pageDigitalText.endsWith("\n") && !pageDigitalText.endsWith(" ")) {
                        pageDigitalText += " "
                    }

                    pageDigitalText += item.str
                    if (currentY !== null) {
                        lastY = currentY
                    }
                }

                if (pageDigitalText.trim().length > 40) {
                    // Page has digital text
                    combinedText += "\n\n" + pageDigitalText
                } else {
                    // Scanned PDF page: render to canvas and run OCR
                    setProgressStatus(`RapidOCR scanning page ${pageNum} of ${totalPages}...`)
                    const viewport = page.getViewport({ scale: 2.0 })
                    const canvas = document.createElement("canvas")
                    canvas.width = viewport.width
                    canvas.height = viewport.height
                    const ctx = canvas.getContext("2d")
                    await page.render({ canvasContext: ctx, viewport }).promise

                    const pageDataUrl = canvas.toDataURL("image/png")

                    if (!ocrWorker) {
                        ocrWorker = await createWorker("eng", 1)
                    }

                    const ocrRes = await ocrWorker.recognize(pageDataUrl)
                    combinedText += "\n\n" + (ocrRes.data.text || "")
                }
            }

            if (ocrWorker) {
                await ocrWorker.terminate()
            }

            setRawExtractedText(combinedText)
            finalizeExtractedQuestions(combinedText)
        } catch (err) {
            console.error("PDF Processing Failed:", err)
            toast.error("Failed to parse PDF. Please ensure it is a readable document.")
            setIsScanning(false)
        }
    }

    // Finalize: parse questions and automatically create cards in the exam builder
    function finalizeExtractedQuestions(fullText) {
        if (!fullText || !fullText.trim()) {
            toast.error("No readable text found in document.")
            setIsScanning(false)
            return
        }

        const questions = parseQuestionsFromText(fullText)

        if (questions.length === 0) {
            toast.error("Could not format questions from document text.")
            setIsScanning(false)
            return
        }

        // 1. Direct function call to QuizBuilder bridge
        if (typeof window !== "undefined" && typeof window.__peak_import_questions === "function") {
            window.__peak_import_questions(questions)
        }

        // 2. Dispatch custom event as backup
        window.dispatchEvent(new CustomEvent("peak:add-ocr-question", { detail: questions }))

        setCreatedQuestions(questions)
        setIsScanning(false)
        setProgressStatus("")
        setProgressPercent(0)
    }

    function resetScanner() {
        setFileInfo(null)
        setRawExtractedText("")
        setCreatedQuestions([])
        setShowRawText(false)
        setActiveTab("cards")
        if (fileInputRef.current) fileInputRef.current.value = ""
    }

    return (
        <div className="space-y-4">
            {/* Header Badge */}
            <div className="rounded-xl border border-border/80 bg-muted/30 p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="size-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                        <Sparkles className="size-4" />
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-foreground">RapidOCR Extractor</h4>
                        <p className="text-[10px] text-muted-foreground">PDF & image auto-builder</p>
                    </div>
                </div>

                {(fileInfo || createdQuestions.length > 0) && (
                    <button
                        type="button"
                        onClick={resetScanner}
                        className="text-[10px] font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1 bg-muted px-2 py-1 rounded-md border border-border/70 cursor-pointer transition-colors"
                        title="Scan another document"
                    >
                        <RefreshCw className="size-3" />
                        <span>New Scan</span>
                    </button>
                )}
            </div>

            {/* Input Dropzone & Paste Area (when no scan is active or completed) */}
            {!fileInfo && (
                <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                        e.preventDefault()
                        setIsDragging(false)
                        if (e.dataTransfer.files?.[0]) handleSelectedFile(e.dataTransfer.files[0])
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`
                        relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all
                        ${isDragging 
                            ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20" 
                            : "border-border/80 hover:border-border hover:bg-muted/30 bg-card"
                        }
                    `}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf, application/pdf, image/png, image/jpeg, image/webp"
                        className="hidden"
                        onChange={(e) => {
                            if (e.target.files?.[0]) handleSelectedFile(e.target.files[0])
                        }}
                    />

                    <div className="flex flex-col items-center gap-2.5">
                        <div className="size-11 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                            <Upload className="size-5" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs font-semibold text-foreground">
                                Upload PDF or Exam Image
                            </p>
                            <p className="text-[10px] text-muted-foreground leading-relaxed px-2">
                                Automatically parses questions & choices directly into cards
                            </p>
                        </div>

                        <div className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/60 border border-border/80 text-[10px] text-muted-foreground font-medium">
                            <Clipboard className="size-3" />
                            <span>Or press <strong>Ctrl + V</strong> to paste screenshot</span>
                        </div>
                    </div>
                </div>
            )}

            {/* File Info Bar */}
            {fileInfo && (
                <div className="p-3 rounded-xl border border-border bg-card flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="size-8 rounded-lg bg-muted flex items-center justify-center shrink-0 text-muted-foreground">
                            {fileInfo.type === "pdf" ? <FileText className="size-4" /> : <ImageIcon className="size-4" />}
                        </div>
                        <div className="min-w-0">
                            <p className="font-semibold text-foreground truncate text-xs" title={fileInfo.name}>
                                {fileInfo.name}
                            </p>
                            <p className="text-[10px] text-muted-foreground uppercase font-mono">
                                {fileInfo.type} {fileInfo.size ? `• ${fileInfo.size}` : ""}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Scanning Progress Bar */}
            {isScanning && (
                <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-foreground flex items-center gap-1.5 truncate">
                            <Loader2 className="size-3.5 animate-spin text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span className="truncate">{progressStatus || "Scanning document..."}</span>
                        </span>
                        <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold shrink-0 ml-2">
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

            {/* Auto-Creation Success Card */}
            {createdQuestions.length > 0 && (
                <div className="space-y-3 pt-1 animate-in fade-in duration-200">
                    <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-950/20 space-y-2">
                        <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                            <CheckCircle2 className="size-4 shrink-0" />
                            <h5 className="text-xs font-bold">
                                {createdQuestions.length} {createdQuestions.length === 1 ? "Question Card" : "Question Cards"} Created!
                            </h5>
                        </div>
                        <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80 leading-snug">
                            All questions and choices were automatically parsed and appended to your exam editor.
                        </p>
                    </div>

                    {/* Tab switcher: Cards preview vs JSON Text */}
                    <div className="flex items-center justify-between border-b border-border/80 pb-1.5 pt-1">
                        <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg border border-border/70">
                            <button
                                type="button"
                                onClick={() => setActiveTab("cards")}
                                className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                                    activeTab === "cards" 
                                        ? "bg-card text-foreground shadow-2xs" 
                                        : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                <Layers className="size-3" />
                                <span>Cards ({createdQuestions.length})</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab("json")}
                                className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                                    activeTab === "json" 
                                        ? "bg-card text-foreground shadow-2xs" 
                                        : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                <Braces className="size-3" />
                                <span>JSON Text</span>
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={() => setShowRawText(!showRawText)}
                            className="text-[10px] font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer"
                        >
                            {showRawText ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                            <span>{showRawText ? "Hide Text" : "Raw OCR"}</span>
                        </button>
                    </div>

                    {showRawText && (
                        <div className="p-2.5 rounded-lg border border-border bg-muted/40 font-mono text-[10px] text-muted-foreground max-h-36 overflow-y-auto whitespace-pre-wrap">
                            {rawExtractedText}
                        </div>
                    )}

                    {/* Tab 1: Cards View */}
                    {activeTab === "cards" && (
                        <div className="max-h-60 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
                            {createdQuestions.map((q, idx) => (
                                <div
                                    key={q.id || idx}
                                    className="p-2.5 rounded-lg border border-border/80 bg-card text-xs space-y-1"
                                >
                                    <div className="flex items-start gap-1.5">
                                        <span className="font-bold text-emerald-600 dark:text-emerald-400 shrink-0 font-mono text-[11px]">
                                            Q{idx + 1}.
                                        </span>
                                        <p className="font-medium text-foreground line-clamp-2 leading-snug">
                                            {q.text}
                                        </p>
                                    </div>
                                    <div className="text-[10px] text-muted-foreground flex items-center gap-2 pl-5">
                                        <span>{q.options?.length || 0} Choices</span>
                                        {q.options?.some(o => o.isCorrect) && (
                                            <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-0.5">
                                                <Check className="size-2.5" /> Key marked
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Tab 2: JSON Text View */}
                    {activeTab === "json" && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-[11px]">
                                <span className="text-muted-foreground font-mono">
                                    {createdQuestions.length} Questions JSON
                                </span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const text = JSON.stringify(createdQuestions, null, 2)
                                        navigator.clipboard.writeText(text)
                                        setJsonCopied(true)
                                        setTimeout(() => setJsonCopied(false), 2000)
                                        toast.success("JSON copied to clipboard!")
                                    }}
                                    className="text-[10px] font-semibold text-foreground flex items-center gap-1 bg-muted px-2 py-0.5 rounded border border-border/70 hover:bg-muted/80 cursor-pointer transition-colors"
                                >
                                    {jsonCopied ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
                                    <span>{jsonCopied ? "Copied" : "Copy JSON"}</span>
                                </button>
                            </div>

                            <pre className="p-2.5 rounded-lg border border-border bg-gray-950 text-emerald-400 font-mono text-[10px] max-h-56 overflow-y-auto whitespace-pre custom-scrollbar">
                                {JSON.stringify(createdQuestions, null, 2)}
                            </pre>

                            <button
                                type="button"
                                onClick={() => {
                                    if (typeof window !== "undefined" && typeof window.__peak_import_questions === "function") {
                                        window.__peak_import_questions(createdQuestions)
                                    } else {
                                        window.dispatchEvent(new CustomEvent("peak:add-ocr-question", { detail: createdQuestions }))
                                    }
                                    toast.success("Applied to exam cards!")
                                }}
                                className="w-full bg-[#E9C46A] hover:bg-[#dfb550] text-white text-xs font-semibold py-1.5 rounded-lg transition-all shadow-2xs cursor-pointer text-center"
                            >
                                Re-Apply to Exam Cards
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
