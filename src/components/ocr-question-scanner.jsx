"use client"

import { useState, useRef, useEffect } from "react"
import { createWorker } from "tesseract.js"
import { pdfjs } from "react-pdf"
import { 
    Upload, 
    Loader2, 
    FileText, 
    Image as ImageIcon,
    Check,
    ChevronDown,
    X,
    Eye,
    EyeOff,
    Plus,
    Sparkles
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

    // Separate inline questions: e.g. "...text. 2. Next question..." or "...text? Q2. Next..." or "...text. 10. Next..."
    t = t.replace(/([^\n])\s+((?:Question|Item|Q)\s*\d+[:.\-\)])\s+/gi, "$1\n$2 ")
    t = t.replace(/([^\n])\s+((?:[1-9]\d*)\s*[\.\)])\s+/g, "$1\n$2 ")

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

    // Match question starts: e.g. "1.", "1)", "10.", "Q1.", "Question 1:", "1 - ", etc.
    const questionStartRegex = /^(?:(?:Question|Item|Q)\s*\d+[:.\-\)]|\d+\s*[\.\)\-]\s*)/i

    let rawBlocks = []
    let currentBlock = []

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        if (questionStartRegex.test(line) && currentBlock.length > 0) {
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

        // Skip non-MCQ questions: if no choices were detected, this is likely
        // a short-answer, essay, or identification question — disregard it.
        if (options.length === 0) return

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

        const uniqueQuestionId = `q_${Date.now()}_${blockIdx}_${Math.random().toString(36).substring(2, 9)}`

        parsedQuestions.push({
            id: uniqueQuestionId,
            type: "question",
            questionType: "Multiple Choice",
            text: questionPrompt || `Question ${blockIdx + 1}`,
            image: null,
            points: 1,
            options: options.map((o, optIdx) => ({
                id: o.id || `opt_${uniqueQuestionId}_${optIdx}_${Math.random().toString(36).substring(2, 6)}`,
                text: o.text || `Choice ${o.letter}`,
                isCorrect: !!o.isCorrect
            })),
            explanation: explanationLines.join(" ").trim()
        })
    })

    return parsedQuestions
}

export default function OcrQuestionScanner({ hideActionButtons = false } = {}) {
    const [fileInfo, setFileInfo] = useState(null)
    const [isScanning, setIsScanning] = useState(false)
    const [progressStatus, setProgressStatus] = useState("")
    const [progressPercent, setProgressPercent] = useState(0)
    const [rawExtractedText, setRawExtractedText] = useState("")
    const [createdQuestions, setCreatedQuestions] = useState([])
    const [showRawText, setShowRawText] = useState(false)
    const [isExpanded, setIsExpanded] = useState(false)
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
        setIsExpanded(false)
        if (fileInputRef.current) fileInputRef.current.value = ""
    }

    return (
        <div className="space-y-3">
            {/* Hidden native file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept=".pdf, application/pdf, image/png, image/jpeg, image/webp"
                className="hidden"
                onChange={(e) => {
                    if (e.target.files?.[0]) handleSelectedFile(e.target.files[0])
                }}
            />

            {/* Action Buttons: Add Question and Add Title/Desc */}
            {!hideActionButtons && (
                <div className="grid grid-cols-2 gap-2">
                    <button
                        type="button"
                        onClick={() => {
                            if (typeof window !== "undefined") {
                                if (typeof window.__peak_add_question === "function") {
                                    window.__peak_add_question()
                                } else {
                                    window.dispatchEvent(new CustomEvent("peak:add-question"))
                                }
                            }
                        }}
                        className="w-full bg-gray-100/90 hover:bg-gray-200/80 text-gray-700 border border-gray-200/60 text-xs font-semibold px-3 py-2 rounded-xl shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                        <Plus className="size-3 text-gray-500" />
                        <span>Add Question</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            if (typeof window !== "undefined") {
                                if (typeof window.__peak_add_title_desc === "function") {
                                    window.__peak_add_title_desc()
                                } else {
                                    window.dispatchEvent(new CustomEvent("peak:add-title-desc"))
                                }
                            }
                        }}
                        className="w-full bg-gray-100/90 hover:bg-gray-200/80 text-gray-700 border border-gray-200/60 text-xs font-semibold px-3 py-2 rounded-xl shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                        <Plus className="size-3 text-gray-500" />
                        <span>Add Title/Desc</span>
                    </button>
                </div>
            )}

            {/* OCR Explanatory Description */}
            <div className="rounded-xl border border-border/70 bg-muted/30 p-3 space-y-1">
                <div className="flex items-center gap-1.5 text-foreground font-semibold text-xs">
                    <Sparkles className="size-3.5 text-[#E9C46A] shrink-0" />
                    <span>OCR Question Scanner</span>
                </div>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                    Automatically scans and detects multiple-choice quiz questions from PDF reviewers or screenshots to build exams significantly faster.
                </p>
            </div>

            {/* Direct Upload / Dropzone Box */}
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
                        relative border border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-200
                        ${isDragging 
                            ? "border-[#E9C46A] bg-[#E9C46A]/10" 
                            : "border-border hover:border-[#E9C46A]/60 hover:bg-muted/30 bg-card"
                        }
                    `}
                >
                    <div className="flex flex-col items-center gap-2">
                        <div className="size-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                            <Upload className="size-4" />
                        </div>
                        <div className="space-y-0.5">
                            <p className="text-xs font-medium text-foreground">
                                Upload PDF or Image
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                                or paste screenshot (Ctrl+V)
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* File Info Bar - Minimal */}
            {fileInfo && (
                <div className="p-2.5 rounded-xl border border-border bg-card flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="size-7 rounded-lg bg-muted flex items-center justify-center shrink-0 text-muted-foreground">
                            {fileInfo.type === "pdf" ? <FileText className="size-3.5" /> : <ImageIcon className="size-3.5" />}
                        </div>
                        <div className="min-w-0">
                            <p className="font-medium text-foreground truncate text-xs" title={fileInfo.name}>
                                {fileInfo.name}
                            </p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                {fileInfo.type} {fileInfo.size ? `• ${fileInfo.size}` : ""}
                            </p>
                        </div>
                    </div>

                    {!isScanning && (
                        <button
                            type="button"
                            onClick={resetScanner}
                            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer shrink-0"
                            title="Clear and scan another file"
                        >
                            <X className="size-3.5" />
                        </button>
                    )}
                </div>
            )}

            {/* Scanning Progress Bar - Minimal Neutral */}
            {isScanning && (
                <div className="p-3 rounded-xl border border-border bg-muted/30 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-foreground flex items-center gap-1.5 truncate">
                            <Loader2 className="size-3.5 animate-spin text-muted-foreground shrink-0" />
                            <span className="truncate text-xs">{progressStatus || "Scanning document..."}</span>
                        </span>
                        <span className="text-muted-foreground font-medium shrink-0 ml-2 text-xs">
                            {progressPercent}%
                        </span>
                    </div>
                    <div className="w-full h-1 rounded-full bg-muted overflow-hidden">
                        <div
                            className="h-full bg-foreground/60 transition-all duration-200"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Auto-Creation Success Summary - Minimal */}
            {createdQuestions.length > 0 && (
                <div className="space-y-3 pt-1 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between border-b border-border pb-2">
                        <div className="text-xs font-semibold text-foreground">
                            {createdQuestions.length} {createdQuestions.length === 1 ? "Question" : "Questions"} Extracted
                        </div>

                        <button
                            type="button"
                            onClick={() => setShowRawText(!showRawText)}
                            className="text-[11px] font-normal text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer"
                        >
                            {showRawText ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                            <span>{showRawText ? "Hide Text" : "Raw Text"}</span>
                        </button>
                    </div>

                    {showRawText && (
                        <div className="p-2.5 rounded-lg border border-border bg-muted/40 text-[10px] text-muted-foreground max-h-36 overflow-y-auto whitespace-pre-wrap">
                            {rawExtractedText}
                        </div>
                    )}

                    {/* Cards View - Minimal */}
                    <div className="max-h-60 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
                        {createdQuestions.map((q, idx) => (
                            <div
                                key={q.id || idx}
                                className="p-2.5 rounded-lg border border-border bg-card text-xs space-y-1 hover:border-border/80 transition-colors"
                            >
                                <div className="flex items-start gap-1.5">
                                    <span className="font-semibold text-muted-foreground shrink-0 text-[11px]">
                                        {idx + 1}.
                                    </span>
                                    <p className="font-normal text-foreground line-clamp-2 leading-snug text-xs">
                                        {q.text}
                                    </p>
                                </div>
                                <div className="text-[10px] text-muted-foreground flex items-center gap-2 pl-4">
                                    <span>{q.options?.length || 0} Choices</span>
                                    {q.options?.some(o => o.isCorrect) && (
                                        <span className="text-foreground/70 font-medium flex items-center gap-0.5">
                                            <Check className="size-2.5" /> Key set
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
