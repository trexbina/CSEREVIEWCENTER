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
    ListFilter
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

export default function OcrQuestionScanner() {
    const [fileInfo, setFileInfo] = useState(null)
    const [isScanning, setIsScanning] = useState(false)
    const [progressStatus, setProgressStatus] = useState("")
    const [progressPercent, setProgressPercent] = useState(0)
    const [rawExtractedText, setRawExtractedText] = useState("")
    const [createdQuestions, setCreatedQuestions] = useState([])
    const [showRawText, setShowRawText] = useState(false)
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
            {/* Header Badge - Minimal Neutral */}
            <div className="rounded-xl border border-border bg-card p-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className="size-7 rounded-lg bg-muted text-muted-foreground flex items-center justify-center shrink-0">
                        <Sparkles className="size-3.5" />
                    </div>
                    <div className="min-w-0">
                        <h4 className="text-xs font-semibold text-foreground truncate">RapidOCR Extractor</h4>
                        <p className="text-[10px] text-muted-foreground truncate">PDF & image parser</p>
                    </div>
                </div>

                {(fileInfo || createdQuestions.length > 0) && (
                    <button
                        type="button"
                        onClick={resetScanner}
                        className="text-[11px] font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 bg-muted/80 hover:bg-muted px-2.5 py-1 rounded-lg border border-border/80 cursor-pointer transition-colors shrink-0"
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
                        relative border border-dashed rounded-xl p-6 text-center cursor-pointer transition-all
                        ${isDragging 
                            ? "border-foreground/40 bg-muted/40" 
                            : "border-border hover:border-border/80 hover:bg-muted/20 bg-card"
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
                        <div className="size-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
                            <Upload className="size-4" />
                        </div>
                        <div className="space-y-0.5">
                            <p className="text-xs font-medium text-foreground">
                                Upload PDF or Exam Image
                            </p>
                            <p className="text-[10px] text-muted-foreground leading-relaxed px-1">
                                Automatically detects questions and choices
                            </p>
                        </div>

                        <div className="mt-1 inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-muted/60 border border-border/60 text-[10px] text-muted-foreground font-normal">
                            <Clipboard className="size-2.5" />
                            <span>Or press <kbd className="font-sans font-medium">Ctrl + V</kbd> to paste</span>
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
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">
                                {fileInfo.type} {fileInfo.size ? `• ${fileInfo.size}` : ""}
                            </p>
                        </div>
                    </div>
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
                        <span className="font-mono text-muted-foreground font-medium shrink-0 ml-2 text-xs">
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

            {/* Auto-Creation Success Card - Minimal Neutral */}
            {createdQuestions.length > 0 && (
                <div className="space-y-3 pt-1 animate-in fade-in duration-200">
                    <div className="p-3 rounded-xl border border-border bg-muted/20 flex items-start gap-2.5">
                        <CheckCircle2 className="size-4 text-foreground/80 shrink-0 mt-0.5" />
                        <div className="min-w-0 space-y-0.5">
                            <h5 className="text-xs font-semibold text-foreground">
                                {createdQuestions.length} {createdQuestions.length === 1 ? "Question" : "Questions"} Ready
                            </h5>
                            <p className="text-[11px] text-muted-foreground leading-snug">
                                Added to exam canvas. Duplicates are automatically prevented.
                            </p>
                        </div>
                    </div>                    {/* Cards preview header & Raw text toggle */}
                    <div className="flex items-center justify-between border-b border-border pb-2 pt-0.5">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                            <Layers className="size-3.5 text-muted-foreground" />
                            <span>Generated Questions ({createdQuestions.length})</span>
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
                        <div className="p-2.5 rounded-lg border border-border bg-muted/40 font-mono text-[10px] text-muted-foreground max-h-36 overflow-y-auto whitespace-pre-wrap">
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
                                    <span className="font-semibold text-muted-foreground shrink-0 font-mono text-[11px]">
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
