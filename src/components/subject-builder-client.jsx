"use client"

import { useSearchParams } from "next/navigation"
import { useRef, useState, useEffect, useMemo } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import {
    Search, Bell, PenTool, FileText, Upload, X, Loader2,
    Type, Image as ImageIcon, Minus, Quote, Play,
    Heading1, List, ListOrdered,
    Square, LayoutDashboard, Columns, Grid2X2,
    Video, Headphones, GalleryHorizontal, LayoutGrid,
    MousePointerClick, TextCursorInput, TextSelect, CheckSquare,
    Space, HelpCircle, ListTree, Code, Settings,
    ChevronDown, ChevronRight, AlignLeft, AlignCenter, AlignRight, AlignJustify,
    AlignStartVertical, AlignCenterVertical, AlignEndVertical,
    Bold, Italic, Underline,
    Palette, Layers, ChevronLeft, Trash, Plus, Maximize, Minimize, BookOpen, Eye, Save, CheckCircle2, Wrench,
    MoveHorizontal, MoveVertical, MoveDiagonal, MoveDiagonal2
} from "lucide-react"
import dynamic from "next/dynamic"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const CustomPdfViewer = dynamic(() => import("@/components/custom-pdf-viewer"), {
    ssr: false,
    loading: () => (
        <div className="absolute inset-0 flex items-center justify-center bg-white text-gray-500 text-sm font-medium">
            Loading PDF...
        </div>
    )
})

const QuizBuilder = dynamic(() => import("@/components/quiz-builder"), {
    ssr: false,
    loading: () => (
        <div className="absolute inset-0 flex items-center justify-center bg-white text-gray-500 text-sm font-medium">
            Loading Quiz/Assignment Builder...
        </div>
    )
})

const GOOGLE_FONTS_URL = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800&family=Roboto:wght@400;500;700;800&family=Poppins:wght@400;500;700;800&family=Lato:wght@400;700&family=Montserrat:wght@400;500;700;800&family=Open+Sans:wght@400;600;700&family=Nunito:wght@400;600;700&family=Raleway:wght@400;500;700&family=Playfair+Display:wght@400;700&family=Merriweather:wght@400;700&family=Source+Sans+3:wght@400;600;700&family=DM+Sans:wght@400;500;700&display=swap"

const FONT_OPTIONS = [
    { label: "Default (System)", value: "" },
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

const BLOCK_CATEGORIES = [
    {
        id: "text",
        label: "Text",
        items: [
            { type: "headline", label: "Headline", icon: Heading1 },
            { type: "text", label: "Text", icon: Type },
            { type: "bullet_list", label: "Bulleted List", icon: List },
            { type: "numbered_list", label: "Numbered List", icon: ListOrdered },
            { type: "quote", label: "Quote", icon: Quote },
        ]
    },
    {
        id: "layout",
        label: "Layout",
        items: [
            { type: "section", label: "Section", icon: Square },
            { type: "row", label: "Row", icon: LayoutDashboard },
            { type: "2_col", label: "2 Col", icon: Columns },
            { type: "3_col", label: "3 Col", icon: Grid2X2 },
            { type: "4_col", label: "4 Col", icon: LayoutGrid },
        ]
    },
    {
        id: "media",
        label: "Media",
        items: [
            { type: "image", label: "Image", icon: ImageIcon },
            { type: "video", label: "Video", icon: Video },
            { type: "audio", label: "Audio", icon: Headphones },
            { type: "carousel", label: "Carousel", icon: GalleryHorizontal },
            { type: "gallery", label: "Gallery", icon: LayoutGrid },
        ]
    },
    {
        id: "forms",
        label: "Forms",
        items: [
            { type: "button", label: "Button", icon: MousePointerClick },
            { type: "input", label: "Input", icon: TextCursorInput },
            { type: "textarea", label: "Textarea", icon: TextSelect },
            { type: "checkbox", label: "Checkbox", icon: CheckSquare },
        ]
    },
    {
        id: "other",
        label: "Other",
        items: [
            { type: "divider", label: "Divider", icon: Minus },
            { type: "spacer", label: "Spacer", icon: Space },
            { type: "faq", label: "FAQ", icon: HelpCircle },
            { type: "toc", label: "Table of Contents", icon: ListTree },
            { type: "html", label: "Raw HTML", icon: Code },
        ]
    }
];

function normalizeLessonType(rawType, hasPdfFiles = false) {
    const value = String(rawType || "").trim().toLowerCase()
    if (value === "quiz") return "quiz"
    if (value === "pdf" || value === "file" || value === "files") return "pdf"
    if (value === "module") return "module"
    return hasPdfFiles ? "pdf" : "module"
}

export default function SubjectBuilderClient({ subject, isStudent = false, currentUserName = "" }) {
    const searchParams = useSearchParams()
    const lessonId = searchParams.get("lessonId")
    const lessonType = searchParams.get("type") // "module" or "pdf"

    // PDF builder state
    const [pdfFiles, setPdfFiles] = useState([]) // array of { name, url, file }
    const [uploading, setUploading] = useState(false)
    const [activePdf, setActivePdf] = useState(null) // currently previewed PDF url
    const fileInputRef = useRef(null)

    // Module builder state
    const [blocks, setBlocks] = useState([])
    const [saving, setSaving] = useState(false)
    const [fetching, setFetching] = useState(false)
    const [activeToolCategory, setActiveToolCategory] = useState("text")
    const [activeBlockId, setActiveBlockId] = useState(null)
    const [viewMode, setViewMode] = useState(isStudent ? "student" : "admin")
    const [uploadingBlockId, setUploadingBlockId] = useState(null)
    const [fullscreenImage, setFullscreenImage] = useState(null)
    const [uiAlert, setUiAlert] = useState({ open: false, title: "Notice", description: "" })
    const [resolvedLessonType, setResolvedLessonType] = useState(normalizeLessonType(lessonType))
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [isToolboxOpen, setIsToolboxOpen] = useState(true)
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    const [activeDropTarget, setActiveDropTarget] = useState(null)
    const [draggingToolType, setDraggingToolType] = useState(null)
    const [isModuleCompleted, setIsModuleCompleted] = useState(false)
    const [currentLessonTitle, setCurrentLessonTitle] = useState("")
    const bottomSentinelRef = useRef(null)

    useEffect(() => {
        const handleGlobalDragEnd = () => {
            setDraggingToolType(null);
            setActiveDropTarget(null);
        };
        window.addEventListener('dragend', handleGlobalDragEnd);
        return () => window.removeEventListener('dragend', handleGlobalDragEnd);
    }, []);

    useEffect(() => {
        setIsModuleCompleted(false)
    }, [lessonId])

    useEffect(() => {
        if (!isStudent || (resolvedLessonType !== "module" && resolvedLessonType !== "pdf") || !lessonId || isModuleCompleted) return

        const observer = new IntersectionObserver(
            (entries) => {
                const first = entries[0]
                if (first && first.isIntersecting) {
                    setIsModuleCompleted(true)
                    fetch('/api/student/activities', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            activityType: 'module_complete',
                            title: `Completed Study Module: ${currentLessonTitle || 'Module'}`,
                            details: `Subject: ${subject.name || subject.title || 'Subject'}`,
                            status: 'success'
                        })
                    }).catch(err => console.error("Scroll completion log error:", err))
                }
            },
            { threshold: 0.5 }
        )

        const el = bottomSentinelRef.current
        if (el) observer.observe(el)

        return () => {
            if (el) observer.unobserve(el)
        }
    }, [isStudent, resolvedLessonType, lessonId, currentLessonTitle, subject, isModuleCompleted])

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement)
        }
        document.addEventListener("fullscreenchange", handleFullscreenChange)
        return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
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

    const savedSelectionRef = useRef(null);

    // Save selection whenever user highlights text inside the builder
    useEffect(() => {
        const handleSelectionChange = () => {
            const sel = window.getSelection();
            if (!sel || sel.rangeCount === 0) return;
            const range = sel.getRangeAt(0);
            // Check if selection is within an active contenteditable element
            const activeEl = range.commonAncestorContainer?.nodeType === 1 
                ? range.commonAncestorContainer 
                : range.commonAncestorContainer?.parentElement;
            if (activeEl && activeEl.closest('[contenteditable="true"]')) {
                savedSelectionRef.current = {
                    range: range.cloneRange(),
                    blockId: activeEl.closest('[data-block-id]')?.getAttribute('data-block-id')
                };
            }
        };
        document.addEventListener("selectionchange", handleSelectionChange);
        return () => document.removeEventListener("selectionchange", handleSelectionChange);
    }, []);

    function applyTextFormat(command, targetBlockId) {
        const sel = window.getSelection();
        let formatted = false;

        // Check if there is an active selection in the editor
        if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
            const range = sel.getRangeAt(0);
            const container = range.commonAncestorContainer.nodeType === 1 
                ? range.commonAncestorContainer 
                : range.commonAncestorContainer.parentElement;
            const editable = container?.closest('[contenteditable="true"]');
            if (editable) {
                document.execCommand(command, false, null);
                const bId = editable.closest('[data-block-id]')?.getAttribute('data-block-id') || targetBlockId;
                if (bId) updateBlockContent(bId, editable.innerHTML);
                formatted = true;
            }
        }

        // If no active range selection or focus was lost, check saved selection
        if (!formatted && savedSelectionRef.current && savedSelectionRef.current.blockId === targetBlockId) {
            try {
                const range = savedSelectionRef.current.range;
                if (!range.collapsed) {
                    sel.removeAllRanges();
                    sel.addRange(range);
                    document.execCommand(command, false, null);
                    const editable = document.querySelector(`[data-block-id="${targetBlockId}"] [contenteditable="true"]`);
                    if (editable) updateBlockContent(targetBlockId, editable.innerHTML);
                    formatted = true;
                }
            } catch (e) {
                console.warn("Could not restore selection:", e);
            }
        }

        // If nothing was specifically highlighted/selected, apply formatting to the ENTIRE block content
        if (!formatted) {
            const editable = document.querySelector(`[data-block-id="${targetBlockId}"] [contenteditable="true"]`);
            if (editable) {
                const range = document.createRange();
                range.selectNodeContents(editable);
                sel.removeAllRanges();
                sel.addRange(range);
                document.execCommand(command, false, null);
                updateBlockContent(targetBlockId, editable.innerHTML);
            }
        }
    }

    function showAlert(message, title = "Action failed") {
        setUiAlert({
            open: true,
            title,
            description: String(message || "Something went wrong."),
        })
    }

    const activeBlock = useMemo(() => {
        if (!activeBlockId) return null;
        let found = null;
        function findBlock(items) {
            for (let item of items) {
                if (item.id === activeBlockId) { found = item; return true; }
                if (item.children && findBlock(item.children)) return true;
            }
            return false;
        }
        findBlock(blocks);
        return found;
    }, [activeBlockId, blocks]);

    useEffect(() => {
        setResolvedLessonType(normalizeLessonType(lessonType))
    }, [lessonType])

    // Clear the canvas whenever the user switches lessons
    useEffect(() => {
        setBlocks([])
        setPdfFiles([])
        setActivePdf(null)
        setUploading(false)

        if (!lessonId) return

        async function fetchLessonData() {
            setFetching(true)
            try {
                const endpoint = isStudent
                    ? `/api/student/subjects/${subject.id}/lessons/${lessonId}`
                    : `/api/admin/subjects/${subject.id}/lessons/${lessonId}`;

                const res = await fetch(endpoint)
                if (res.ok) {
                    const { lesson } = await res.json()
                    if (lesson?.title) setCurrentLessonTitle(lesson.title)
                    const normalizedPdfFiles = Array.isArray(lesson?.pdf_files) ? lesson.pdf_files : []
                    const nextLessonType = normalizeLessonType(
                        lesson?.lesson_type,
                        Boolean(lesson?.has_pdf) || normalizedPdfFiles.length > 0
                    )
                    setResolvedLessonType(nextLessonType)

                    if (nextLessonType === "pdf") {
                        if (normalizedPdfFiles.length > 0) {
                            setPdfFiles(normalizedPdfFiles)
                            setActivePdf(normalizedPdfFiles[0]?.url || null)
                        } else {
                            setPdfFiles([])
                            setActivePdf(null)
                        }
                    } else if (nextLessonType === "module") {
                        if (lesson?.quiz_content) {
                            try {
                                setBlocks(JSON.parse(lesson.quiz_content))
                            } catch (e) {
                                console.error("Failed to parse blocks")
                                setBlocks([])
                            }
                        } else {
                            setBlocks([])
                        }
                    }
                }
            } catch (err) {
                console.error("Fetch lesson error:", err)
            } finally {
                setFetching(false)
            }
        }

        fetchLessonData()
    }, [lessonId, lessonType, subject.id])

    async function readUploadError(response) {
        try {
            const data = await response.json()
            if (data?.error) return data.error
        } catch (err) {
            // Ignore parse errors and fall back to status text.
        }
        return `Upload failed (${response.status})`
    }

    async function handlePdfUpload(e) {
        const files = Array.from(e.target.files || [])
        if (!files.length) return
        if (files[0].size > 50 * 1024 * 1024) {
            showAlert("File is too large. Maximum allowed file size is 50 MB.")
            return
        }
        setUploading(true)
        try {
            const formData = new FormData()
            formData.append("file", files[0])

            const uploadRes = await fetch('/api/admin/upload', {
                method: 'POST',
                body: formData
            })
            if (!uploadRes.ok) {
                const message = await readUploadError(uploadRes)
                throw new Error(message)
            }
            const uploadData = await uploadRes.json()

            const newFile = {
                name: uploadData.name,
                url: uploadData.url
            }

            setPdfFiles([newFile])
            setActivePdf(newFile.url)

            // Auto-save to database
            await fetch(`/api/admin/subjects/${subject.id}/lessons/${lessonId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pdf_files: [newFile] })
            })
            console.log("PDF Auto-saved!")
        } catch (err) {
            console.error(err)
            showAlert(err?.message || "Failed to upload PDF")
        } finally {
            setUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ""
        }
    }

    function removePdf(url) {
        setPdfFiles(prev => prev.filter(f => f.url !== url))
        if (activePdf === url) {
            const remaining = pdfFiles.filter(f => f.url !== url)
            setActivePdf(remaining[0]?.url || null)
        }
    }

    async function handleMediaUpload(e, blockId) {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        if (files[0].size > 50 * 1024 * 1024) {
            showAlert("File is too large. Maximum allowed file size is 50 MB.")
            return
        }
        setUploadingBlockId(blockId);
        try {
            const formData = new FormData();
            formData.append("file", files[0]);

            const uploadRes = await fetch('/api/admin/upload', {
                method: 'POST',
                body: formData
            });
            if (!uploadRes.ok) {
                const message = await readUploadError(uploadRes)
                throw new Error(message)
            }
            const uploadData = await uploadRes.json();

            updateBlockContent(blockId, uploadData.url);
        } catch (err) {
            console.error(err);
            showAlert(err?.message || "Failed to upload media");
        } finally {
            setUploadingBlockId(null);
        }
    }

    // Module Builder Handlers
    function unwrapSingleChildLayouts(items) {
        for (let i = 0; i < items.length; i++) {
            let item = items[i];
            if (item.children) {
                item.children = unwrapSingleChildLayouts(item.children);
            }

            if (["2_col", "3_col", "4_col", "row"].includes(item.type)) {
                const remainingElements = [];
                item.children?.forEach(col => {
                    if (col.type === "column") {
                        col.children?.forEach(c => remainingElements.push(c));
                    } else {
                        remainingElements.push(col);
                    }
                });

                if (remainingElements.length === 1) {
                    items[i] = remainingElements[0];
                } else if (remainingElements.length === 0) {
                    items.splice(i, 1);
                    i--;
                }
            }
        }
        return items;
    }

    function handleDragStart(e, type) {
        e.dataTransfer.setData("blockType", type)
        setDraggingToolType(type)
        e.stopPropagation()
    }

    function createBlock(type) {
        const id = Date.now().toString() + "_" + Math.random().toString(36).substr(2, 5);
        const newBlock = { id, type, content: "", properties: {} };

        if (["text", "headline", "quote", "bullet_list", "numbered_list"].includes(type)) {
            newBlock.properties = { fontFamily: "inherit", color: "#333333", fontSize: type === "headline" ? "24px" : "16px", textAlign: "left" };
            if (type === "headline") newBlock.content = "Heading...";
            if (type === "bullet_list" || type === "numbered_list") newBlock.content = "<li>List item</li>";
        }
        if (type === "button") {
            newBlock.properties = { backgroundColor: "#E9C46A", color: "#ffffff", borderRadius: "8px", padding: "12px 24px", textAlign: "center" };
            newBlock.content = "Click Me";
        }

        if (type === "2_col") {
            newBlock.children = [
                { id: id + "_c1", type: "column", children: [] },
                { id: id + "_c2", type: "column", children: [] }
            ];
        } else if (type === "3_col") {
            newBlock.children = [
                { id: id + "_c1", type: "column", children: [] },
                { id: id + "_c2", type: "column", children: [] },
                { id: id + "_c3", type: "column", children: [] }
            ];
        } else if (type === "4_col") {
            newBlock.children = [
                { id: id + "_c1", type: "column", children: [] },
                { id: id + "_c2", type: "column", children: [] },
                { id: id + "_c3", type: "column", children: [] },
                { id: id + "_c4", type: "column", children: [] }
            ];
        } else if (type === "row" || type === "section") {
            newBlock.children = [];
        }

        return newBlock;
    }

    function handleDrop(e, parentId = null) {
        e.preventDefault()
        e.stopPropagation()
        setDraggingToolType(null)

        const moveBlockId = e.dataTransfer.getData("moveBlockId")
        if (moveBlockId) {
            if (moveBlockId === parentId) return; // Prevent dropping on itself

            setBlocks(prev => {
                const newBlocks = JSON.parse(JSON.stringify(prev));
                let blockToMove = null;

                // 1. Find and extract the block from its current location
                function extractBlock(items) {
                    for (let i = 0; i < items.length; i++) {
                        if (items[i].id === moveBlockId) {
                            blockToMove = items[i];
                            items.splice(i, 1);
                            return true;
                        }
                        if (items[i].children && extractBlock(items[i].children)) return true;
                    }
                    return false;
                }
                extractBlock(newBlocks);
                if (!blockToMove) return prev;

                // 2. Insert into new location
                if (!parentId) {
                    newBlocks.push(blockToMove);
                } else {
                    function insertBlock(items) {
                        for (let item of items) {
                            if (item.id === parentId) {
                                if (!item.children) item.children = [];
                                item.children.push(blockToMove);
                                return true;
                            }
                            if (item.children && insertBlock(item.children)) return true;
                        }
                        return false;
                    }
                    insertBlock(newBlocks);
                }
                unwrapSingleChildLayouts(newBlocks);
                return newBlocks;
            });
            return;
        }

        const type = e.dataTransfer.getData("blockType")
        if (!type) return;

        const newBlock = createBlock(type);

        if (!parentId) {
            setBlocks(prev => [...prev, newBlock]);
        } else {
            setBlocks(prev => {
                const newBlocks = JSON.parse(JSON.stringify(prev));
                function appendToParent(items) {
                    for (let item of items) {
                        if (item.id === parentId) {
                            if (!item.children) item.children = [];
                            item.children.push(newBlock);
                            return true;
                        }
                        if (item.children && appendToParent(item.children)) return true;
                    }
                    return false;
                }
                appendToParent(newBlocks);
                return newBlocks;
            });
        }
    }

    function handleInsertBefore(e, targetId) {
        e.preventDefault()
        e.stopPropagation()

        const moveBlockId = e.dataTransfer.getData("moveBlockId")
        const newBlockType = e.dataTransfer.getData("blockType")

        if (!moveBlockId && !newBlockType) return;
        if (moveBlockId === targetId) return; // Prevent dropping on itself

        setBlocks(prev => {
            const newBlocks = JSON.parse(JSON.stringify(prev));
            let blockToInsert = null;

            if (moveBlockId) {
                // Find and extract
                function extractBlock(items) {
                    for (let i = 0; i < items.length; i++) {
                        if (items[i].id === moveBlockId) {
                            blockToInsert = items[i];
                            items.splice(i, 1);
                            return true;
                        }
                        if (items[i].children && extractBlock(items[i].children)) return true;
                    }
                    return false;
                }
                extractBlock(newBlocks);
                if (!blockToInsert) return prev;
            } else if (newBlockType) {
                blockToInsert = createBlock(newBlockType);
            }

            if (!blockToInsert) return prev;

            // Insert before targetId
            function insertBefore(items) {
                for (let i = 0; i < items.length; i++) {
                    if (items[i].id === targetId) {
                        items.splice(i, 0, blockToInsert);
                        return true;
                    }
                    if (items[i].children && insertBefore(items[i].children)) return true;
                }
                return false;
            }
            insertBefore(newBlocks);
            unwrapSingleChildLayouts(newBlocks);
            return newBlocks;
        });
        setDraggingToolType(null);
    }

    function handleInsertSide(e, targetId, side) {
        e.preventDefault();
        e.stopPropagation();

        const moveBlockId = e.dataTransfer.getData("moveBlockId");
        const newBlockType = e.dataTransfer.getData("blockType");

        if (!moveBlockId && !newBlockType) return;
        if (moveBlockId === targetId) return;

        setBlocks(prev => {
            const newBlocks = JSON.parse(JSON.stringify(prev));
            let blockToInsert = null;

            if (moveBlockId) {
                function extractBlock(items) {
                    for (let i = 0; i < items.length; i++) {
                        if (items[i].id === moveBlockId) {
                            blockToInsert = items[i];
                            items.splice(i, 1);
                            return true;
                        }
                        if (items[i].children && extractBlock(items[i].children)) return true;
                    }
                    return false;
                }
                extractBlock(newBlocks);
                if (!blockToInsert) return prev;
            } else if (newBlockType) {
                blockToInsert = createBlock(newBlockType);
            }

            if (!blockToInsert) return prev;

            function wrapInTwoCol(items) {
                for (let i = 0; i < items.length; i++) {
                    if (items[i].id === targetId) {
                        const targetBlock = items[i];
                        const colId = Date.now().toString() + "_" + Math.random().toString(36).substr(2, 5);

                        const col1Children = side === 'left' ? [blockToInsert] : [targetBlock];
                        const col2Children = side === 'left' ? [targetBlock] : [blockToInsert];

                        const twoColBlock = {
                            id: colId,
                            type: "2_col",
                            children: [
                                { id: colId + "_c1", type: "column", children: col1Children },
                                { id: colId + "_c2", type: "column", children: col2Children }
                            ]
                        };

                        items[i] = twoColBlock;
                        return true;
                    }
                    if (items[i].children && wrapInTwoCol(items[i].children)) return true;
                }
                return false;
            }
            wrapInTwoCol(newBlocks);
            unwrapSingleChildLayouts(newBlocks);
            return newBlocks;
        });
        setDraggingToolType(null);
    }

    function handleDragOver(e) {
        e.preventDefault()
        e.stopPropagation()
    }

    function removeBlock(id) {
        setBlocks(prev => {
            const newBlocks = JSON.parse(JSON.stringify(prev));

            // 1. Remove target block
            function filterItem(items) {
                for (let i = 0; i < items.length; i++) {
                    if (items[i].id === id) {
                        items.splice(i, 1);
                        return true;
                    }
                    if (items[i].children && filterItem(items[i].children)) {
                        return true;
                    }
                }
                return false;
            }
            filterItem(newBlocks);

            return unwrapSingleChildLayouts(newBlocks);
        });
        if (activeBlockId === id) setActiveBlockId(null);
    }

    function updateBlockContent(id, content) {
        setBlocks(prev => {
            const newBlocks = JSON.parse(JSON.stringify(prev));
            function update(items) {
                for (let item of items) {
                    if (item.id === id) { item.content = content; return true; }
                    if (item.children && update(item.children)) return true;
                }
                return false;
            }
            update(newBlocks);
            return newBlocks;
        });
    }

    function updateBlockProperty(id, property, value) {
        setBlocks(prev => {
            const newBlocks = JSON.parse(JSON.stringify(prev));
            function update(items) {
                for (let item of items) {
                    if (item.id === id) {
                        if (!item.properties) item.properties = {};
                        item.properties[property] = value;
                        return true;
                    }
                    if (item.children && update(item.children)) return true;
                }
                return false;
            }
            update(newBlocks);
            return newBlocks;
        });
    }

    function handleImageResizeStart(e, blockId, direction) {
        e.preventDefault();
        e.stopPropagation();

        const handleEl = e.currentTarget;
        const imgContainer = handleEl.closest('.group\\/image');
        const imgEl = imgContainer?.querySelector('img');
        if (!imgEl) return;

        const startX = e.clientX;
        const startY = e.clientY;
        const startWidth = imgEl.getBoundingClientRect().width;
        const startHeight = imgEl.getBoundingClientRect().height;

        const handleMouseMove = (moveEvent) => {
            moveEvent.preventDefault();

            // Find if this image is inside a column of a layout (e.g. 2_col)
            let parentLayout = null;
            let currentColumnIdx = -1;
            function findParentLayout(items) {
                for (let item of items) {
                    if (item.children) {
                        const colIdx = item.children.findIndex(c => c.children?.some(ch => ch.id === blockId));
                        if (colIdx !== -1) {
                            parentLayout = item;
                            currentColumnIdx = colIdx;
                            return true;
                        }
                        if (findParentLayout(item.children)) return true;
                    }
                }
                return false;
            }
            findParentLayout(blocks);

            const deltaX = moveEvent.clientX - startX;
            const deltaY = moveEvent.clientY - startY;

            // If inside a 2-column layout and resizing towards the right/left:
            if (parentLayout && parentLayout.type === "2_col" && (direction === 'e' || direction === 'w' || direction.includes('e') || direction.includes('w'))) {
                const layoutEl = imgContainer.closest('.grid');
                if (layoutEl) {
                    const totalGridWidth = layoutEl.getBoundingClientRect().width;
                    if (totalGridWidth > 100) {
                        let newCol1Ratio = (startWidth + (direction.includes('e') ? deltaX : -deltaX)) / totalGridWidth * 100;
                        // Constrain ratio between 15% and 85%
                        newCol1Ratio = Math.max(15, Math.min(85, Math.round(newCol1Ratio)));
                        const newCol2Ratio = 100 - newCol1Ratio;

                        if (currentColumnIdx === 0) {
                            updateBlockProperty(parentLayout.id, "gridTemplateColumns", `${newCol1Ratio}% ${newCol2Ratio}%`);
                        } else if (currentColumnIdx === 1) {
                            updateBlockProperty(parentLayout.id, "gridTemplateColumns", `${newCol2Ratio}% ${newCol1Ratio}%`);
                        }
                    }
                }
            }

            // Normal Width / Height resizing
            if (direction === 'e' || direction === 'w') {
                let newWidth = startWidth + (direction === 'e' ? deltaX : -deltaX);
                newWidth = Math.max(60, Math.round(newWidth));
                updateBlockProperty(blockId, "width", `${newWidth}px`);
            } else if (direction === 'n') {
                let newHeight = Math.max(40, Math.round(startHeight - deltaY));
                updateBlockProperty(blockId, "height", `${newHeight}px`);
            } else if (direction === 's') {
                let newHeight = Math.max(40, Math.round(startHeight + deltaY));
                updateBlockProperty(blockId, "height", `${newHeight}px`);
            } else {
                let newWidth = startWidth + (direction.includes('e') ? deltaX : -deltaX);
                let newHeight = startHeight + (direction.includes('s') ? deltaY : -deltaY);
                newWidth = Math.max(60, Math.round(newWidth));
                newHeight = Math.max(40, Math.round(newHeight));

                updateBlockProperty(blockId, "width", `${newWidth}px`);
                updateBlockProperty(blockId, "height", `${newHeight}px`);
            }

            updateBlockProperty(blockId, "objectFit", "fill");
        };

        const handleMouseUp = () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    }

    async function saveModuleBlocks() {
        if (!lessonId) return
        setSaving(true)
        try {
            const res = await fetch(`/api/admin/subjects/${subject.id}/lessons/${lessonId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ quiz_content: JSON.stringify(blocks) })
            })
            if (!res.ok) throw new Error("Save failed")
        } catch (err) {
            console.error(err)
            showAlert("Failed to save module content.")
        } finally {
            setSaving(false)
        }
    }

    function renderBlock(block, isRoot = true) {
        const isAdmin = viewMode === 'admin';
        const isSelected = isAdmin && activeBlockId === block.id;

        const formatPx = (val) => {
            if (!val && val !== 0) return undefined;
            const str = String(val).trim();
            if (!str) return undefined;
            return /^-?\d+(\.\d+)?$/.test(str) ? `${str}px` : str;
        };

        const textStyles = {
            fontFamily: block.properties?.fontFamily || undefined,
            color: block.properties?.color || undefined,
            fontSize: formatPx(block.properties?.fontSize),
            textAlign: block.properties?.textAlign || "left",
            lineHeight: formatPx(block.properties?.lineHeight),
            letterSpacing: formatPx(block.properties?.letterSpacing),
            fontWeight: block.type === 'headline' ? '800' : 'normal',
            fontStyle: block.type === 'quote' ? 'italic' : 'normal'
        };

        const verticalAlignClass = block.properties?.verticalAlign === 'center'
            ? 'justify-center'
            : block.properties?.verticalAlign === 'bottom'
                ? 'justify-end'
                : 'justify-start';

        const isLayoutBlock = ["2_col", "3_col", "4_col", "row", "section", "column"].includes(block.type);

        const isSideDrop = activeDropTarget?.id === block.id && (activeDropTarget.position === 'left' || activeDropTarget.position === 'right');
        const isTopDrop = activeDropTarget?.id === block.id && activeDropTarget.position === 'top';

        const blockContent = (
            <>
                {/* TEXT & HEADERS */}
                {["text", "headline", "quote", "bullet_list", "numbered_list"].includes(block.type) && (
                    <div className={`flex flex-col h-full w-full ${verticalAlignClass} ${block.type === 'quote' ? "border-l-4 border-[#E9C46A] pl-4 py-1 my-2" : "py-1"}`}>
                        <div
                            contentEditable={isAdmin}
                            suppressContentEditableWarning
                            onBlur={(e) => {
                                if (isAdmin) updateBlockContent(block.id, e.currentTarget.innerHTML);
                            }}
                            className={`outline-none min-h-[1.5em] leading-relaxed empty:before:text-gray-300 ${isAdmin && block.type === 'headline' ? "empty:before:content-['Heading...'] font-bold text-xl" :
                                isAdmin ? "empty:before:content-['Type_text_here...']" : ""
                                }`}
                            style={textStyles}
                            dangerouslySetInnerHTML={{ __html: block.content || "" }}
                        />
                    </div>
                )}

                {/* BUTTON BLOCK */}
                {block.type === "button" && (
                    <div className="my-2" style={{ textAlign: block.properties?.textAlign || "left" }}>
                        <a
                            href={isAdmin ? "#" : (block.properties?.url || "#")}
                            onClick={(e) => isAdmin && e.preventDefault()}
                            className="inline-block px-6 py-2.5 bg-[#E9C46A] text-slate-900 font-semibold rounded-lg shadow-2xs hover:bg-[#dfb550] transition-colors"
                            style={{
                                color: block.properties?.color || "#ffffff",
                                fontSize: block.properties?.fontSize || "14px"
                            }}
                        >
                            {block.content || "Click Me"}
                        </a>
                    </div>
                )}

                {/* IMAGE */}
                {block.type === 'image' && (
                    <div
                        className={`flex ${
                            block.properties?.textAlign === 'center'
                                ? 'justify-center'
                                : block.properties?.textAlign === 'right'
                                    ? 'justify-end'
                                    : 'justify-start'
                        }`}
                    >
                        {block.content ? (
                            <div className="relative group/image inline-block max-w-full select-none">
                                <img
                                    src={block.content}
                                    alt="Image block"
                                    className={`max-w-full rounded-lg transition-all ${!isAdmin ? 'cursor-zoom-in hover:opacity-95' : ''}`}
                                    style={{
                                        width: block.properties?.width || "100%",
                                        height: block.properties?.height || "auto",
                                        maxHeight: block.properties?.maxHeight || "none",
                                        objectFit: block.properties?.objectFit || "fill"
                                    }}
                                    onClick={(e) => {
                                        if (!isAdmin) {
                                            e.stopPropagation();
                                            setFullscreenImage(block.content);
                                        }
                                    }}
                                />
                                {isAdmin && isSelected && (
                                    <>
                                        {/* Single Bottom-Right Corner Resize Handle */}
                                        <div
                                            onMouseDown={(e) => handleImageResizeStart(e, block.id, 'se')}
                                            className="absolute -bottom-3 -right-3 w-5 h-5 bg-white border border-gray-300 rounded-md shadow-xs flex items-center justify-center cursor-nwse-resize z-30 hover:bg-gray-50 hover:border-gray-400 hover:scale-110 transition-all text-gray-600"
                                            title="Drag corner to resize"
                                        >
                                            <MoveDiagonal2 className="h-3 w-3" />
                                        </div>
                                    </>
                                )}

                                {/* Image action buttons directly on the image */}
                                {isAdmin && (
                                    <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-0 group-hover/image:opacity-100 transition-all z-30">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveBlockId(block.id);
                                                setIsSettingsOpen(prev => activeBlockId === block.id ? !prev : true);
                                            }}
                                            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                                                isSelected && isSettingsOpen
                                                    ? "bg-[#E9C46A] text-slate-900 shadow-2xs"
                                                    : "bg-white/90 backdrop-blur shadow-2xs hover:bg-white text-gray-700"
                                            }`}
                                            title="Element Settings"
                                        >
                                            <Settings className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); removeBlock(block.id); }}
                                            className="p-1.5 bg-white/90 backdrop-blur shadow-2xs hover:bg-white text-gray-500 hover:text-red-600 rounded-lg transition-all cursor-pointer"
                                            title="Delete image"
                                        >
                                            <Trash className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                )}
                                {!isAdmin && (
                                    <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/10 transition-colors rounded-lg pointer-events-none flex items-center justify-center">
                                        <Maximize className="h-6 w-6 text-white opacity-0 group-hover/image:opacity-100 transition-opacity drop-shadow-md" />
                                    </div>
                                )}
                            </div>
                        ) : (
                            isAdmin && (
                                <div className="relative group/image w-full">
                                    <label className="w-full h-44 bg-gray-50/70 rounded-xl flex flex-col items-center justify-center text-gray-400 gap-2 cursor-pointer hover:bg-gray-50/90 transition-all">
                                        <ImageIcon className="h-8 w-8 text-gray-400" />
                                        <span className="text-xs font-semibold text-gray-500">Upload Image</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => handleMediaUpload(e, block.id)}
                                        />
                                    </label>
                                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 opacity-0 group-hover/image:opacity-100 transition-all z-30">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveBlockId(block.id);
                                                setIsSettingsOpen(prev => activeBlockId === block.id ? !prev : true);
                                            }}
                                            className="p-1.5 bg-white/90 backdrop-blur shadow-2xs hover:bg-white text-gray-700 rounded-lg transition-all cursor-pointer"
                                            title="Element Settings"
                                        >
                                            <Settings className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); removeBlock(block.id); }}
                                            className="p-1.5 bg-white/90 backdrop-blur shadow-2xs hover:bg-white text-gray-500 hover:text-red-600 rounded-lg transition-all cursor-pointer"
                                            title="Delete image"
                                        >
                                            <Trash className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                )}

                {/* VIDEO */}
                {block.type === 'video' && (
                    <div className="my-2">
                        {block.content ? (
                            <div
                                className={`relative group/video w-full aspect-video rounded-xl overflow-hidden bg-black flex items-center justify-center ${isStudent ? 'select-none' : ''}`}
                                onContextMenu={(e) => isStudent && e.preventDefault()}
                            >
                                {block.content.includes("iframe") || block.content.includes("youtube") || block.content.includes("vimeo") || block.content.includes("embed") ? (
                                    <iframe
                                        src={block.content}
                                        className="w-full h-full"
                                        allowFullScreen={!isStudent}
                                    />
                                ) : (
                                    <video
                                        src={block.content}
                                        controls
                                        controlsList={isStudent ? "nodownload noremoteplayback" : undefined}
                                        disablePictureInPicture={isStudent}
                                        onContextMenu={(e) => isStudent && e.preventDefault()}
                                        className="w-full h-full object-contain"
                                    />
                                )}

                                {/* ANTI-SCREENRECORDING WATERMARK OVERLAY FOR STUDENTS */}
                                {isStudent && (
                                    <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center overflow-hidden">
                                        <div className="text-white/30 text-xs sm:text-sm font-black uppercase tracking-widest rotate-[-15deg] select-none text-center px-4 py-2 border border-white/10 rounded-lg bg-black/20 backdrop-blur-[1px] animate-pulse">
                                            {currentUserName || "PROTECTED CONTENT - CONFIDENTIAL"}
                                        </div>
                                    </div>
                                )}
                                {isAdmin && (
                                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 opacity-0 group-hover/video:opacity-100 transition-all z-30">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveBlockId(block.id);
                                                setIsSettingsOpen(prev => activeBlockId === block.id ? !prev : true);
                                            }}
                                            className="p-1.5 bg-white/90 backdrop-blur shadow-2xs hover:bg-white text-gray-700 rounded-lg transition-all cursor-pointer"
                                            title="Element Settings"
                                        >
                                            <Settings className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); removeBlock(block.id); }}
                                            className="p-1.5 bg-white/90 backdrop-blur shadow-2xs hover:bg-white text-gray-500 hover:text-red-600 rounded-lg transition-all cursor-pointer"
                                            title="Delete video"
                                        >
                                            <Trash className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            isAdmin && (
                                <div className="relative group/video w-full">
                                    {uploadingBlockId === block.id ? (
                                        <div className="w-full h-44 bg-gray-50/70 border border-gray-200/80 rounded-xl flex flex-col items-center justify-center text-gray-400 gap-2">
                                            <Loader2 className="h-8 w-8 animate-spin text-[#E9C46A]" />
                                            <span className="text-xs font-semibold text-gray-500">Uploading Video...</span>
                                        </div>
                                    ) : (
                                        <label className="w-full h-44 bg-gray-50/70 border border-gray-200/80 rounded-xl flex flex-col items-center justify-center text-gray-400 gap-2 cursor-pointer hover:bg-gray-50 hover:border-[#E9C46A]/40 transition-all">
                                            <Video className="h-8 w-8 text-gray-400" />
                                            <span className="text-xs font-semibold text-gray-500">Upload Video</span>
                                            <input
                                                type="file"
                                                accept="video/*"
                                                className="hidden"
                                                onChange={(e) => handleMediaUpload(e, block.id)}
                                            />
                                        </label>
                                    )}
                                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 opacity-0 group-hover/video:opacity-100 transition-all z-30">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveBlockId(block.id);
                                                setIsSettingsOpen(prev => activeBlockId === block.id ? !prev : true);
                                            }}
                                            className="p-1.5 bg-white/90 backdrop-blur shadow-2xs hover:bg-white text-gray-700 rounded-lg transition-all cursor-pointer"
                                            title="Element Settings"
                                        >
                                            <Settings className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); removeBlock(block.id); }}
                                            className="p-1.5 bg-white/90 backdrop-blur shadow-2xs hover:bg-white text-gray-500 hover:text-red-600 rounded-lg transition-all cursor-pointer"
                                            title="Delete video"
                                        >
                                            <Trash className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                )}

                {/* AUDIO */}
                {block.type === 'audio' && (
                    <div className="my-2">
                        {block.content ? (
                            <audio controls className="w-full">
                                <source src={block.content} />
                            </audio>
                        ) : (
                            isAdmin && (
                                <label className="w-full h-44 bg-gray-50/70 border border-gray-200/80 rounded-xl flex flex-col items-center justify-center text-gray-400 gap-2 cursor-pointer hover:bg-gray-50 hover:border-[#E9C46A]/40 transition-all">
                                    <Headphones className="h-8 w-8 text-gray-400" />
                                    <span className="text-xs font-semibold text-gray-500">Upload Audio File</span>
                                    <input
                                        type="file"
                                        accept="audio/*"
                                        className="hidden"
                                        onChange={(e) => handleMediaUpload(e, block.id)}
                                    />
                                </label>
                            )
                        )}
                    </div>
                )}

                {/* DIVIDER / SPACE */}
                {block.type === "divider" && <hr className="my-4 border-gray-200" />}
                {block.type === "space" && <div className="h-8" />}

                {/* LAYOUT BLOCKS */}
                {["2_col", "3_col", "4_col", "row", "section"].includes(block.type) && (
                    <div
                        className={`${isAdmin ? 'mt-1' : ''} ${block.type === 'row' ? 'flex flex-row flex-wrap gap-4' :
                            block.type === 'section' ? 'flex flex-col gap-4' :
                                `grid gap-4 ${block.type === '2_col' && !block.properties?.gridTemplateColumns ? 'grid-cols-1 md:grid-cols-2' :
                                    block.type === '3_col' && !block.properties?.gridTemplateColumns ? 'grid-cols-1 md:grid-cols-3' :
                                        block.type === '4_col' && !block.properties?.gridTemplateColumns ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' : ''
                                }`
                            }`}
                        style={{
                            gridTemplateColumns: block.properties?.gridTemplateColumns || undefined
                        }}
                        onDrop={(e) => {
                            if (!isAdmin) return;
                            if (["row", "section"].includes(block.type)) {
                                handleDrop(e, block.id);
                            }
                        }}
                        onDragOver={handleDragOver}
                    >
                        {block.children?.length === 0 && isAdmin ? (
                            <div className="p-6 border border-solid border-gray-200/80 text-center text-gray-400 text-xs rounded-xl bg-gray-50/50">Drop elements here</div>
                        ) : (
                            block.children?.map(child => renderBlock(child, false))
                        )}
                    </div>
                )}

                {/* COLUMNS INSIDE LAYOUT */}
                {block.type === "column" && (
                    <div
                        className="flex flex-col gap-3 min-h-[20px] h-full"
                        onDrop={(e) => isAdmin && handleDrop(e, block.id)}
                        onDragOver={handleDragOver}
                    >
                        {block.children?.length === 0 && isAdmin ? (
                            <div className="relative group/blank w-full h-44">
                                <div className="w-full h-full bg-gray-50/70 border border-gray-200/80 rounded-xl flex flex-col items-center justify-center text-gray-400 gap-2 hover:bg-gray-50 hover:border-[#E9C46A]/40 transition-all cursor-pointer">
                                    <Plus className="h-6 w-6 text-gray-400" />
                                    <span className="text-xs font-semibold text-gray-500">Add Element</span>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); removeBlock(block.id); }}
                                    className="absolute top-2.5 right-2.5 p-1.5 bg-white/90 backdrop-blur shadow-2xs hover:bg-white text-gray-500 hover:text-red-600 rounded-lg transition-all cursor-pointer opacity-0 group-hover/blank:opacity-100 z-30"
                                    title="Delete blank spot"
                                >
                                    <Trash className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        ) : (
                            block.children?.map(child => renderBlock(child, false))
                        )}
                    </div>
                )}

                {isAdmin && !isLayoutBlock && block.type !== "image" && (
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all z-30">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setActiveBlockId(block.id);
                                setIsSettingsOpen(prev => activeBlockId === block.id ? !prev : true);
                            }}
                            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                                isSelected && isSettingsOpen
                                    ? "bg-[#E9C46A] text-slate-900 shadow-2xs"
                                    : "bg-gray-100/90 hover:bg-gray-200 text-gray-600 hover:text-gray-900"
                            }`}
                            title="Element Settings"
                        >
                            <Settings className="h-3.5 w-3.5" />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); removeBlock(block.id); }}
                            className="p-1.5 bg-gray-100/90 hover:bg-gray-200 text-gray-400 hover:text-gray-700 rounded-lg transition-all cursor-pointer"
                            title="Delete element"
                        >
                            <Trash className="h-3.5 w-3.5" />
                        </button>
                    </div>
                )}
            </>
        );

        return (
            <div
                key={block.id}
                draggable={isAdmin}
                onDragStart={(e) => {
                    if (isAdmin) {
                        e.stopPropagation();
                        e.dataTransfer.setData("moveBlockId", block.id);
                    }
                }}
                onDrop={(e) => {
                    if (isAdmin) {
                        const dropSide = activeDropTarget?.id === block.id ? activeDropTarget.position : "top";
                        setActiveDropTarget(null);

                        if (dropSide === "left" || dropSide === "right") {
                            handleInsertSide(e, block.id, dropSide);
                        } else {
                            handleInsertBefore(e, block.id);
                        }
                    }
                }}
                onDragOver={(e) => {
                    if (!isAdmin) return;
                    e.preventDefault();
                    e.stopPropagation();

                    const rect = e.currentTarget.getBoundingClientRect();
                    const relY = (e.clientY - rect.top) / rect.height;
                    const relX = (e.clientX - rect.left) / rect.width;

                    let position = "top";
                    // If hovered in the left 30% or right 30% and not right on top edge
                    if (relY > 0.15) {
                        if (relX > 0.70) position = "right";
                        else if (relX < 0.30) position = "left";
                    }

                    if (!activeDropTarget || activeDropTarget.id !== block.id || activeDropTarget.position !== position) {
                        setActiveDropTarget({ id: block.id, position });
                    }
                }}
                onDragLeave={(e) => {
                    if (!isAdmin) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    // Only clear target if cursor actually left the block's outer bounding box
                    if (
                        e.clientX < rect.left ||
                        e.clientX >= rect.right ||
                        e.clientY < rect.top ||
                        e.clientY >= rect.bottom
                    ) {
                        setActiveDropTarget(prev => prev?.id === block.id ? null : prev);
                    }
                }}
                onClick={(e) => {
                    if (!isAdmin) return;
                    e.stopPropagation();
                    setActiveBlockId(block.id);
                }}
                data-block-id={block.id}
                className={`relative group rounded-xl ${isAdmin && !isLayoutBlock
                    ? `transition-all cursor-move border ${isSelected ? 'border-gray-400/90 shadow-2xs' : 'border-gray-200/70 hover:border-gray-300'}`
                    : ''
                    } ${block.type === 'image' && block.content ? (block.properties?.textAlign === 'center' ? 'w-fit mx-auto' : block.properties?.textAlign === 'right' ? 'w-fit ml-auto' : 'w-fit') : 'w-full'} ${isRoot ? 'mb-3' : 'mb-2 h-full'}`}
                style={{
                    backgroundColor: block.properties?.backgroundColor || 'transparent',
                    padding: formatPx(block.properties?.padding) || '0',
                }}
            >
                {/* TOP DROP INDICATOR LINE */}
                {isTopDrop && (
                    <div className="absolute -top-1.5 left-0 right-0 h-1 bg-[#E9C46A] rounded-full z-40 shadow-sm animate-in fade-in duration-100 pointer-events-none flex items-center justify-center">
                        <span className="px-2 py-0.5 bg-[#E9C46A] text-slate-900 text-[10px] font-semibold rounded-full -top-3 absolute shadow-xs">
                            Insert Above
                        </span>
                    </div>
                )}

                {/* LEFT SIDE DROP INDICATOR */}
                {isSideDrop && activeDropTarget.position === 'left' && (
                    <div className="absolute top-0 bottom-0 -left-1.5 w-1.5 bg-[#E9C46A] rounded-full z-40 shadow-sm animate-in fade-in duration-100 pointer-events-none flex items-center justify-center">
                        <span className="px-2 py-0.5 bg-[#E9C46A] text-slate-900 text-[10px] font-semibold rounded-full whitespace-nowrap -left-20 absolute shadow-xs">
                            Place Left
                        </span>
                    </div>
                )}

                {/* RIGHT SIDE DROP INDICATOR */}
                {isSideDrop && activeDropTarget.position === 'right' && (
                    <div className="absolute top-0 bottom-0 -right-1.5 w-1.5 bg-[#E9C46A] rounded-full z-40 shadow-sm animate-in fade-in duration-100 pointer-events-none flex items-center justify-center">
                        <span className="px-2 py-0.5 bg-[#E9C46A] text-slate-900 text-[10px] font-semibold rounded-full whitespace-nowrap -right-20 absolute shadow-xs">
                            Place Right
                        </span>
                    </div>
                )}

                {blockContent}
            </div>
        );
    }

    const isPdfFullCover = resolvedLessonType === "pdf" && activePdf;

    return (
        <div className="flex flex-col h-full w-full bg-white relative">
            <link rel="stylesheet" href={GOOGLE_FONTS_URL} />

            {/* Content Builder Area */}
            <div
                className={`flex-1 flex flex-col relative ${isPdfFullCover ? "overflow-hidden" : "overflow-y-auto p-0"} ${viewMode === "student" ? "select-none" : ""}`}
                onContextMenu={(e) => viewMode === 'student' && e.preventDefault()}
                onCopy={(e) => viewMode === 'student' && e.preventDefault()}
                onDragStart={(e) => viewMode === 'student' && e.preventDefault()}
                onKeyDown={(e) => {
                    if (viewMode === 'student' && (e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 's' || e.key === 'p' || e.key === 'a')) {
                        e.preventDefault();
                    }
                }}
            >
                {lessonId ? (
                    isPdfFullCover ? (
                        /* ── PDF BUILDER FULL COVER ── */
                        <div className="w-full h-full relative" style={{ minHeight: '100vh' }}>
                            {fetching ? (
                                <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
                                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                                </div>
                            ) : null}
                            <CustomPdfViewer
                                url={activePdf}
                                watermarkText={currentUserName}
                                isStudent={viewMode === "student"}
                            />
                        </div>
                    ) : (
                        <div className={`w-full space-y-8 ${isStudent ? 'pb-6' : 'pb-16'}`}>

                            {/* ── PDF BUILDER UPLOAD STATE ── */}
                            {resolvedLessonType === "pdf" && !activePdf && (
                                <div className="flex-1 flex flex-col items-center justify-center min-h-[calc(100vh-140px)] px-4 w-full animate-in fade-in duration-300">
                                    {!isStudent ? (
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className="relative flex flex-col items-center justify-center gap-3 w-full max-w-lg py-12 px-6 bg-white rounded-2xl border border-gray-200/80 cursor-pointer hover:border-gray-300 hover:bg-gray-50/40 transition-all group shadow-2xs text-center"
                                        >
                                            {uploading ? (
                                                <Loader2 className="h-6 w-6 animate-spin text-gray-400 my-4" />
                                            ) : (
                                                <>
                                                    <div className="h-10 w-10 rounded-xl bg-gray-50 border border-gray-200/60 flex items-center justify-center text-gray-400 group-hover:text-gray-600 group-hover:bg-gray-100/80 transition-all">
                                                        <Upload className="h-4 w-4" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-sm font-semibold text-gray-700">Upload PDF</p>
                                                        <p className="text-xs text-gray-400">Click to browse or drag and drop your file</p>
                                                    </div>
                                                </>
                                            )}
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="application/pdf"
                                                className="hidden"
                                                onChange={handlePdfUpload}
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center text-center py-16 px-4">
                                            <div className="h-10 w-10 rounded-xl bg-gray-50 border border-gray-200/60 flex items-center justify-center mb-3 text-gray-400">
                                                <BookOpen className="h-4 w-4" />
                                            </div>
                                            <p className="text-sm font-semibold text-gray-700">No PDF Available</p>
                                            <p className="text-xs text-gray-400 mt-1 max-w-xs">Your instructor has not uploaded a PDF for this lesson yet.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── MODULE BUILDER CANVAS ── */}
                            {resolvedLessonType === "module" && (
                                <div className="relative">
                                    <div className="flex justify-end mb-3 items-center gap-2 px-6 pt-4">
                                        {/* Fullscreen Button */}
                                        <button
                                            onClick={toggleFullscreen}
                                            className="h-8 w-8 rounded-lg flex items-center justify-center transition-all cursor-pointer shadow-2xs border bg-white hover:bg-gray-50 border-gray-200/80 text-gray-500 hover:text-gray-800"
                                            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                                        >
                                            {isFullscreen ? <Minimize className="h-3.5 w-3.5" /> : <Maximize className="h-3.5 w-3.5" />}
                                        </button>

                                        {!isStudent && (
                                            <>
                                                {/* Toolbox Icon Toggle Button (Admin only) */}
                                                {viewMode === 'admin' && (
                                                    <button
                                                        onClick={() => setIsToolboxOpen(!isToolboxOpen)}
                                                        className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all cursor-pointer shadow-2xs border ${
                                                            isToolboxOpen
                                                                ? "bg-[#E9C46A] text-slate-900 border-[#E9C46A] hover:bg-[#dfb550]"
                                                                : "bg-white hover:bg-gray-50 border-gray-200/80 text-gray-500 hover:text-gray-800"
                                                        }`}
                                                        title={isToolboxOpen ? "Hide Builder Toolbox" : "Show Builder Toolbox"}
                                                    >
                                                        <Wrench className="h-3.5 w-3.5" />
                                                    </button>
                                                )}

                                                <button
                                                    onClick={() => setViewMode(viewMode === 'admin' ? 'student' : 'admin')}
                                                    className="px-3.5 py-1.5 rounded-lg border border-gray-200/80 bg-white hover:bg-gray-50 text-gray-700 font-semibold text-xs transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
                                                >
                                                    {viewMode === 'admin' ? (
                                                        <>
                                                            <Eye className="h-3.5 w-3.5 text-gray-500" />
                                                            <span>Student View</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <PenTool className="h-3.5 w-3.5 text-gray-500" />
                                                            <span>Admin View</span>
                                                        </>
                                                    )}
                                                </button>

                                                {viewMode === 'admin' && (
                                                    <button
                                                        onClick={saveModuleBlocks}
                                                        disabled={saving || fetching}
                                                        className="px-4 py-1.5 rounded-lg bg-[#E9C46A] hover:bg-[#dfb550] disabled:opacity-50 text-slate-900 font-bold text-xs transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
                                                    >
                                                        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                                                        <span>Save Changes</span>
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                    <div
                                        className={`animate-in fade-in slide-in-from-bottom-4 duration-300 bg-white transition-all relative flex flex-col ${viewMode === 'admin' ? 'p-4 sm:p-5 min-h-[calc(100vh-160px)] mx-6 mb-8 border border-gray-200/80 rounded-2xl shadow-2xs' : 'p-4 sm:p-5 min-h-0'}`}
                                        onDrop={(e) => {
                                            if (viewMode === 'admin') {
                                                setActiveDropTarget(null);
                                                handleDrop(e);
                                            }
                                        }}
                                        onDragOver={(e) => {
                                            if (viewMode !== 'admin') return;
                                            e.preventDefault();
                                            if (!activeDropTarget || activeDropTarget.id !== 'canvas_bottom') {
                                                setActiveDropTarget({ id: 'canvas_bottom', position: 'bottom' });
                                            }
                                        }}
                                        onDragLeave={(e) => {
                                            if (viewMode !== 'admin') return;
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            if (
                                                e.clientX < rect.left ||
                                                e.clientX >= rect.right ||
                                                e.clientY < rect.top ||
                                                e.clientY >= rect.bottom
                                            ) {
                                                setActiveDropTarget(null);
                                            }
                                        }}
                                    >
                                        {blocks.length === 0 ? (
                                            draggingToolType || (viewMode === 'admin' && activeDropTarget?.id === 'canvas_bottom') ? (
                                                <div className="flex-1 w-full min-h-[calc(100vh-220px)] flex flex-col justify-start pt-2 animate-in fade-in duration-150 pointer-events-none">
                                                    <ElementSkeletonPreview type={draggingToolType || 'text'} />
                                                </div>
                                            ) : (
                                                <div className="flex-1 flex flex-col items-center justify-center min-h-[calc(100vh-220px)] py-12 px-4 text-center animate-in fade-in duration-300">
                                                    <h3 className="text-base font-bold text-[#4d4d4d] uppercase tracking-wider mb-1">
                                                        {isStudent ? "Module Empty" : "Module Empty"}
                                                    </h3>
                                                    <p className="text-xs text-gray-400 max-w-sm leading-relaxed">
                                                        {isStudent ? "This lesson does not have any content yet." : "Drag and drop elements from the builder toolbox below to start building your module."}
                                                    </p>
                                                </div>
                                            )
                                        ) : (
                                            <div className={`w-full space-y-2 ${isStudent ? 'pb-4' : 'pb-24'}`}>
                                                {blocks.map((block) => renderBlock(block, true))}

                                                {/* CANVAS BOTTOM SKELETON DROP PREVIEW */}
                                                {viewMode === 'admin' && activeDropTarget?.id === 'canvas_bottom' && (
                                                    <div className="w-full my-3 animate-in fade-in duration-150 pointer-events-none">
                                                        <ElementSkeletonPreview type={draggingToolType || 'text'} />
                                                    </div>
                                                )}

                                                {/* STUDENT MODULE/PDF SCROLL SENTINEL FOR COMPLETION TRACKING */}
                                                {isStudent && (
                                                    <div ref={bottomSentinelRef} className="py-4 flex justify-center text-xs text-gray-400 font-medium border-t border-gray-100/80 mt-6">
                                                        <span>You have reached the end of the lesson.</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* ── QUIZ BUILDER CANVAS ── */}
                            {resolvedLessonType === "quiz" && (
                                <QuizBuilder 
                                    key={lessonId}
                                    lessonId={lessonId} 
                                    subjectId={subject.id} 
                                    isStudent={viewMode === "student"} 
                                    onToggleViewMode={!isStudent ? () => setViewMode(viewMode === 'admin' ? 'student' : 'admin') : undefined}
                                />
                            )}
                        </div>
                    )
                ) : (
                    /* ── BLANK STATE ── */
                    <div className="flex-1 flex flex-col items-center justify-center min-h-[calc(100vh-160px)] px-4 text-center animate-in fade-in duration-300">
                        <h3 className="text-base font-bold text-[#4d4d4d] uppercase tracking-wider mb-1">
                            No Lesson Selected
                        </h3>
                        <p className="text-xs text-gray-400 max-w-sm leading-relaxed">
                            {isStudent
                                ? "Select a lesson from the sidebar to begin learning."
                                : `Select a lesson from the sidebar or create a new one to begin building content for ${subject?.code || "this subject"}.`}
                        </p>
                    </div>
                )}
            {/* CENTERED FLOATING TOOLBAR DOCK (FIXED AT BOTTOM CENTER OF CANVAS) */}
            {viewMode === 'admin' && lessonId && resolvedLessonType === "module" && isToolboxOpen && (
                <div className="fixed bottom-5 left-[calc(50%+160px)] -translate-x-1/2 z-40 bg-white/95 backdrop-blur-md border border-gray-200/80 rounded-2xl p-2.5 shadow-sm flex flex-col items-center gap-2 w-fit max-w-[90vw] transition-all duration-300 animate-in fade-in zoom-in-95">
                    {/* Collapse Button */}
                    <button
                        onClick={() => setIsToolboxOpen(false)}
                        className="absolute top-2 right-2 p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                        title="Hide Palette"
                    >
                        <ChevronDown className="h-3.5 w-3.5" />
                    </button>

                    {/* Tool Icons for active category */}
                    <div className="flex items-center justify-center gap-4 sm:gap-6 overflow-x-auto custom-scrollbar px-6 py-0.5 max-w-full">
                        {BLOCK_CATEGORIES.find(c => c.id === activeToolCategory)?.items.map((item, idx) => (
                            <DraggableTool
                                key={idx}
                                icon={item.icon}
                                label={item.label}
                                type={item.type}
                                onDragStart={handleDragStart}
                                onDragEnd={() => {
                                    setDraggingToolType(null);
                                    setActiveDropTarget(null);
                                }}
                            />
                        ))}
                    </div>

                    {/* Category Pill Switcher */}
                    <div className="flex items-center gap-1 p-0.5">
                        {BLOCK_CATEGORIES.map(category => (
                            <button
                                key={category.id}
                                onClick={() => setActiveToolCategory(category.id)}
                                className={`px-3 py-1 rounded-full text-[11px] font-medium tracking-wide uppercase whitespace-nowrap transition-all cursor-pointer ${
                                    activeToolCategory === category.id
                                        ? "bg-[#E9C46A] text-slate-900 shadow-2xs font-semibold"
                                        : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                                }`}
                            >
                                {category.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
            </div>

            {/* PROPERTIES FLOATING DOCK */}
            {viewMode === 'admin' && activeBlock && isSettingsOpen && (
                <div className="fixed top-20 right-6 w-80 max-h-[calc(100vh-100px)] bg-white border border-gray-200/80 rounded-2xl shadow-xl z-50 p-5 overflow-y-auto custom-scrollbar animate-in slide-in-from-right-8 duration-300 ease-out">
                    <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-gray-100">
                        <h3 className="font-bold text-[#4d4d4d] flex items-center gap-2 text-xs tracking-wider uppercase">
                            <Settings className="h-3.5 w-3.5 text-gray-500" />
                            {activeBlock.type} settings
                        </h3>
                        <button
                            onClick={() => setIsSettingsOpen(false)}
                            className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>

                    <div className="space-y-4">
                        {/* Image specific setting: ONLY Left, Center, Right position choices */}
                        {activeBlock.type === "image" ? (
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Position</label>
                                <div className="flex bg-gray-100/70 p-1 rounded-xl gap-1 border border-gray-200/40">
                                    <button
                                        onClick={() => updateBlockProperty(activeBlock.id, "textAlign", "left")}
                                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                                            activeBlock.properties?.textAlign === 'left' || !activeBlock.properties?.textAlign
                                                ? 'bg-white shadow-2xs text-[#4d4d4d] border border-gray-200/60'
                                                : 'text-gray-500 hover:text-gray-800'
                                        }`}
                                    >
                                        <AlignLeft className="h-3.5 w-3.5" />
                                        <span>Left</span>
                                    </button>
                                    <button
                                        onClick={() => updateBlockProperty(activeBlock.id, "textAlign", "center")}
                                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                                            activeBlock.properties?.textAlign === 'center'
                                                ? 'bg-white shadow-2xs text-[#4d4d4d] border border-gray-200/60'
                                                : 'text-gray-500 hover:text-gray-800'
                                        }`}
                                    >
                                        <AlignCenter className="h-3.5 w-3.5" />
                                        <span>Center</span>
                                    </button>
                                    <button
                                        onClick={() => updateBlockProperty(activeBlock.id, "textAlign", "right")}
                                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                                            activeBlock.properties?.textAlign === 'right'
                                                ? 'bg-white shadow-2xs text-[#4d4d4d] border border-gray-200/60'
                                                : 'text-gray-500 hover:text-gray-800'
                                        }`}
                                    >
                                        <AlignRight className="h-3.5 w-3.5" />
                                        <span>Right</span>
                                    </button>
                                </div>
                            </div>
                        ) : ["text", "headline", "quote", "bullet_list", "numbered_list"].includes(activeBlock.type) ? (
                            /* ─── TEXT & HEADLINE SETTINGS (WITH FORMATTING FIRST) ─── */
                            <div className="space-y-3.5">
                                {/* 1st: Text Formatting (Bold, Italic, Underline) */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Style</label>
                                    <div className="flex bg-gray-100/70 p-1 rounded-xl gap-1 border border-gray-200/40">
                                        <button
                                            type="button"
                                            onMouseDown={(e) => e.preventDefault()}
                                            onClick={() => applyTextFormat("bold", activeBlock.id)}
                                            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-bold text-[#4d4d4d] bg-white shadow-2xs border border-gray-200/60 hover:bg-gray-50 active:scale-95 transition-all cursor-pointer"
                                            title="Bold"
                                        >
                                            <Bold className="h-3.5 w-3.5" />
                                            <span>Bold</span>
                                        </button>
                                        <button
                                            type="button"
                                            onMouseDown={(e) => e.preventDefault()}
                                            onClick={() => applyTextFormat("italic", activeBlock.id)}
                                            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-semibold italic text-[#4d4d4d] bg-white shadow-2xs border border-gray-200/60 hover:bg-gray-50 active:scale-95 transition-all cursor-pointer"
                                            title="Italic"
                                        >
                                            <Italic className="h-3.5 w-3.5" />
                                            <span>Italic</span>
                                        </button>
                                        <button
                                            type="button"
                                            onMouseDown={(e) => e.preventDefault()}
                                            onClick={() => applyTextFormat("underline", activeBlock.id)}
                                            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-semibold underline text-[#4d4d4d] bg-white shadow-2xs border border-gray-200/60 hover:bg-gray-50 active:scale-95 transition-all cursor-pointer"
                                            title="Underline"
                                        >
                                            <Underline className="h-3.5 w-3.5" />
                                            <span>Underline</span>
                                        </button>
                                    </div>
                                </div>

                                {/* 2nd: Horizontal Alignment */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Horizontal Alignment</label>
                                    <div className="flex bg-gray-100/70 p-1 rounded-xl gap-1 border border-gray-200/40">
                                        <button
                                            type="button"
                                            onClick={() => updateBlockProperty(activeBlock.id, "textAlign", "left")}
                                            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                                                activeBlock.properties?.textAlign === 'left' || !activeBlock.properties?.textAlign
                                                    ? 'bg-white shadow-2xs text-[#4d4d4d] border border-gray-200/60'
                                                    : 'text-gray-500 hover:text-gray-800'
                                            }`}
                                            title="Left"
                                        >
                                            <AlignLeft className="h-3.5 w-3.5" />
                                            <span>Left</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => updateBlockProperty(activeBlock.id, "textAlign", "center")}
                                            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                                                activeBlock.properties?.textAlign === 'center'
                                                    ? 'bg-white shadow-2xs text-[#4d4d4d] border border-gray-200/60'
                                                    : 'text-gray-500 hover:text-gray-800'
                                            }`}
                                            title="Center"
                                        >
                                            <AlignCenter className="h-3.5 w-3.5" />
                                            <span>Center</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => updateBlockProperty(activeBlock.id, "textAlign", "right")}
                                            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                                                activeBlock.properties?.textAlign === 'right'
                                                    ? 'bg-white shadow-2xs text-[#4d4d4d] border border-gray-200/60'
                                                    : 'text-gray-500 hover:text-gray-800'
                                            }`}
                                            title="Right"
                                        >
                                            <AlignRight className="h-3.5 w-3.5" />
                                            <span>Right</span>
                                        </button>
                                    </div>
                                </div>

                                {/* 3rd: Vertical Alignment */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Vertical Alignment</label>
                                    <div className="flex bg-gray-100/70 p-1 rounded-xl gap-1 border border-gray-200/40">
                                        <button
                                            type="button"
                                            onClick={() => updateBlockProperty(activeBlock.id, "verticalAlign", "top")}
                                            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                                                activeBlock.properties?.verticalAlign === 'top' || !activeBlock.properties?.verticalAlign
                                                    ? 'bg-white shadow-2xs text-[#4d4d4d] border border-gray-200/60'
                                                    : 'text-gray-500 hover:text-gray-800'
                                            }`}
                                        >
                                            <AlignStartVertical className="h-3.5 w-3.5" />
                                            <span>Top</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => updateBlockProperty(activeBlock.id, "verticalAlign", "center")}
                                            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                                                activeBlock.properties?.verticalAlign === 'center'
                                                    ? 'bg-white shadow-2xs text-[#4d4d4d] border border-gray-200/60'
                                                    : 'text-gray-500 hover:text-gray-800'
                                            }`}
                                        >
                                            <AlignCenterVertical className="h-3.5 w-3.5" />
                                            <span>Center</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => updateBlockProperty(activeBlock.id, "verticalAlign", "bottom")}
                                            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                                                activeBlock.properties?.verticalAlign === 'bottom'
                                                    ? 'bg-white shadow-2xs text-[#4d4d4d] border border-gray-200/60'
                                                    : 'text-gray-500 hover:text-gray-800'
                                            }`}
                                        >
                                            <AlignEndVertical className="h-3.5 w-3.5" />
                                            <span>Bottom</span>
                                        </button>
                                    </div>
                                </div>

                                {/* 4th: Justify Option */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Text Justify</label>
                                    <div className="flex bg-gray-100/70 p-1 rounded-xl gap-1 border border-gray-200/40">
                                        <button
                                            type="button"
                                            onClick={() => updateBlockProperty(activeBlock.id, "textAlign", activeBlock.properties?.textAlign === 'justify' ? 'left' : 'justify')}
                                            className={`w-full flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                                                activeBlock.properties?.textAlign === 'justify'
                                                    ? 'bg-white shadow-2xs text-[#4d4d4d] border border-gray-200/60 font-bold'
                                                    : 'text-gray-500 hover:text-gray-800'
                                            }`}
                                        >
                                            <AlignJustify className="h-3.5 w-3.5" />
                                            <span>{activeBlock.properties?.textAlign === 'justify' ? "Justified (Active)" : "Justify Text"}</span>
                                        </button>
                                    </div>
                                </div>

                                {/* 3rd: Font Choices */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Font Family</label>
                                    <select
                                        value={activeBlock.properties?.fontFamily || ""}
                                        onChange={(e) => updateBlockProperty(activeBlock.id, "fontFamily", e.target.value)}
                                        className="w-full px-3 py-2 text-xs bg-white border border-gray-200/80 rounded-xl outline-none focus:border-gray-400 transition-all cursor-pointer font-medium text-gray-700 shadow-2xs"
                                    >
                                        {FONT_OPTIONS.map((f, i) => (
                                            <option key={i} value={f.value} style={{ fontFamily: f.value || 'inherit' }}>
                                                {f.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* 4th: Font Size (px auto) */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Font Size</label>
                                    <div className="relative flex items-center">
                                        <input
                                            type="text"
                                            value={activeBlock.properties?.fontSize || (activeBlock.type === "headline" ? "24" : "16")}
                                            onChange={(e) => updateBlockProperty(activeBlock.id, "fontSize", e.target.value)}
                                            placeholder="16"
                                            className="w-full px-3 py-2 pr-9 text-xs bg-white border border-gray-200/80 rounded-xl outline-none focus:border-gray-400 transition-all font-medium text-gray-800 shadow-2xs"
                                        />
                                        <span className="absolute right-3 text-xs font-semibold text-gray-400 pointer-events-none">px</span>
                                    </div>
                                </div>

                                {/* 5th: Text Color */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Text Color</label>
                                    <div className="flex items-center gap-2 px-2.5 py-1.5 border border-gray-200/80 rounded-xl bg-white shadow-2xs">
                                        <input
                                            type="color"
                                            value={activeBlock.properties?.color || "#333333"}
                                            onChange={(e) => updateBlockProperty(activeBlock.id, "color", e.target.value)}
                                            className="w-6 h-6 rounded-md border-0 cursor-pointer bg-transparent p-0 shrink-0"
                                        />
                                        <input
                                            type="text"
                                            value={activeBlock.properties?.color || "#333333"}
                                            onChange={(e) => updateBlockProperty(activeBlock.id, "color", e.target.value)}
                                            className="text-xs font-medium text-gray-700 flex-1 outline-none uppercase bg-transparent"
                                            placeholder="#333333"
                                        />
                                    </div>
                                </div>

                                {/* 6th: Background Color */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Background Color</label>
                                    <div className="flex items-center gap-2 px-2.5 py-1.5 border border-gray-200/80 rounded-xl bg-white shadow-2xs">
                                        <input
                                            type="color"
                                            value={activeBlock.properties?.backgroundColor && activeBlock.properties.backgroundColor !== 'transparent' ? activeBlock.properties.backgroundColor : "#ffffff"}
                                            onChange={(e) => updateBlockProperty(activeBlock.id, "backgroundColor", e.target.value)}
                                            className="w-6 h-6 rounded-md border-0 cursor-pointer bg-transparent p-0 shrink-0"
                                        />
                                        <input
                                            type="text"
                                            value={activeBlock.properties?.backgroundColor || "transparent"}
                                            onChange={(e) => updateBlockProperty(activeBlock.id, "backgroundColor", e.target.value)}
                                            className="text-xs font-medium text-gray-700 flex-1 outline-none bg-transparent"
                                            placeholder="transparent or #ffffff"
                                        />
                                    </div>
                                </div>

                                {/* 7th: Character Spacing (Letter Spacing) */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Character Spacing</label>
                                    <div className="relative flex items-center">
                                        <input
                                            type="text"
                                            value={activeBlock.properties?.letterSpacing || ""}
                                            placeholder="0"
                                            onChange={(e) => updateBlockProperty(activeBlock.id, "letterSpacing", e.target.value)}
                                            className="w-full px-3 py-2 pr-9 text-xs bg-white border border-gray-200/80 rounded-xl outline-none focus:border-gray-400 transition-all font-medium text-gray-800 shadow-2xs"
                                        />
                                        <span className="absolute right-3 text-xs font-semibold text-gray-400 pointer-events-none">px</span>
                                    </div>
                                </div>

                                {/* 8th: Line Spacing (Line Height) */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Line Spacing</label>
                                    <div className="relative flex items-center">
                                        <input
                                            type="text"
                                            value={activeBlock.properties?.lineHeight || ""}
                                            placeholder="normal"
                                            onChange={(e) => updateBlockProperty(activeBlock.id, "lineHeight", e.target.value)}
                                            className="w-full px-3 py-2 pr-9 text-xs bg-white border border-gray-200/80 rounded-xl outline-none focus:border-gray-400 transition-all font-medium text-gray-800 shadow-2xs"
                                        />
                                        <span className="absolute right-3 text-xs font-semibold text-gray-400 pointer-events-none">px</span>
                                    </div>
                                </div>

                                {/* 9th: Padding */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Padding</label>
                                    <div className="relative flex items-center">
                                        <input
                                            type="text"
                                            value={activeBlock.properties?.padding || ""}
                                            placeholder="0"
                                            onChange={(e) => updateBlockProperty(activeBlock.id, "padding", e.target.value)}
                                            className="w-full px-3 py-2 pr-9 text-xs bg-white border border-gray-200/80 rounded-xl outline-none focus:border-gray-400 transition-all font-medium text-gray-800 shadow-2xs"
                                        />
                                        <span className="absolute right-3 text-xs font-semibold text-gray-400 pointer-events-none">px</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* ─── OTHER BLOCKS (BUTTON, VIDEO, LAYOUT, ETC.) ─── */
                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Background Color</label>
                                    <div className="flex items-center gap-2 px-2.5 py-1.5 border border-gray-200/80 rounded-xl bg-white shadow-2xs">
                                        <input
                                            type="color"
                                            value={activeBlock.properties?.backgroundColor || "#ffffff"}
                                            onChange={(e) => updateBlockProperty(activeBlock.id, "backgroundColor", e.target.value)}
                                            className="w-6 h-6 rounded-md border-0 cursor-pointer bg-transparent p-0 shrink-0"
                                        />
                                        <input
                                            type="text"
                                            value={activeBlock.properties?.backgroundColor || "#ffffff"}
                                            onChange={(e) => updateBlockProperty(activeBlock.id, "backgroundColor", e.target.value)}
                                            className="text-xs font-medium text-gray-700 flex-1 outline-none uppercase bg-transparent"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Padding</label>
                                    <div className="relative flex items-center">
                                        <input
                                            type="text"
                                            value={activeBlock.properties?.padding || ""}
                                            placeholder="0"
                                            onChange={(e) => updateBlockProperty(activeBlock.id, "padding", e.target.value)}
                                            className="w-full px-3 py-2 pr-9 text-xs bg-white border border-gray-200/80 rounded-xl outline-none focus:border-gray-400 transition-all font-medium text-gray-800 shadow-2xs"
                                        />
                                        <span className="absolute right-3 text-xs font-semibold text-gray-400 pointer-events-none">px</span>
                                    </div>
                                </div>

                                {activeBlock.type === "video" && (
                                    <>
                                        <hr className="border-gray-100 my-2" />
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Media URL</label>
                                            <input
                                                type="text"
                                                value={activeBlock.content || ""}
                                                placeholder="https://..."
                                                onChange={(e) => updateBlockContent(activeBlock.id, e.target.value)}
                                                className="w-full px-3 py-2 text-xs bg-white border border-gray-200/80 rounded-xl outline-none focus:border-gray-400 transition-all font-medium text-gray-800 shadow-2xs"
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* FULLSCREEN IMAGE MODAL */}
            {fullscreenImage && (
                <div
                    className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200 cursor-zoom-out"
                    onClick={() => setFullscreenImage(null)}
                >
                    <button
                        className="absolute top-6 right-6 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 backdrop-blur transition-all"
                        onClick={(e) => { e.stopPropagation(); setFullscreenImage(null); }}
                    >
                        <X className="h-6 w-6" />
                    </button>
                    <div className="relative w-full h-full flex items-center justify-center max-w-6xl">
                        <img
                            src={fullscreenImage}
                            className="max-w-full max-h-full object-contain rounded-md shadow-2xl animate-in zoom-in-95 duration-300 pointer-events-none"
                            alt="Fullscreen view"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                </div>
            )}

            <AlertDialog open={uiAlert.open} onOpenChange={(open) => setUiAlert((prev) => ({ ...prev, open }))}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{uiAlert.title}</AlertDialogTitle>
                        <AlertDialogDescription>{uiAlert.description}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={() => setUiAlert((prev) => ({ ...prev, open: false }))}>
                            OK
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

function ElementSkeletonPreview({ type, className = "" }) {
    switch (type) {
        case "headline":
            return (
                <div className={`w-full py-4 px-5 bg-gray-50/80 border border-dashed border-gray-300 rounded-xl flex flex-col gap-2.5 animate-pulse ${className}`}>
                    <div className="h-6 bg-gray-200/90 rounded-md w-3/5" />
                    <div className="h-3.5 bg-gray-100 rounded-md w-2/5" />
                </div>
            );
        case "text":
            return (
                <div className={`w-full py-3.5 px-5 bg-gray-50/80 border border-dashed border-gray-300 rounded-xl flex flex-col gap-2 animate-pulse ${className}`}>
                    <div className="h-3 bg-gray-200/90 rounded-md w-full" />
                    <div className="h-3 bg-gray-200/80 rounded-md w-5/6" />
                    <div className="h-3 bg-gray-100 rounded-md w-3/4" />
                </div>
            );
        case "quote":
            return (
                <div className={`w-full py-3.5 px-5 bg-gray-50/80 border-l-4 border-l-gray-400 border border-dashed border-gray-300 rounded-xl flex flex-col gap-2 animate-pulse ${className}`}>
                    <div className="h-3.5 bg-gray-200 rounded-md w-4/5 italic" />
                    <div className="h-2.5 bg-gray-100 rounded-md w-1/4" />
                </div>
            );
        case "bullet_list":
        case "numbered_list":
            return (
                <div className={`w-full py-3.5 px-5 bg-gray-50/80 border border-dashed border-gray-300 rounded-xl flex flex-col gap-2.5 animate-pulse ${className}`}>
                    <div className="flex items-center gap-2.5">
                        <div className="h-2 w-2 rounded-full bg-gray-300 shrink-0" />
                        <div className="h-3 bg-gray-200 rounded-md w-3/4" />
                    </div>
                    <div className="flex items-center gap-2.5">
                        <div className="h-2 w-2 rounded-full bg-gray-300 shrink-0" />
                        <div className="h-3 bg-gray-200 rounded-md w-1/2" />
                    </div>
                    <div className="flex items-center gap-2.5">
                        <div className="h-2 w-2 rounded-full bg-gray-300 shrink-0" />
                        <div className="h-3 bg-gray-200 rounded-md w-2/3" />
                    </div>
                </div>
            );
        case "image":
        case "video":
        case "audio":
        case "embed":
            return (
                <div className={`w-full h-44 bg-gray-50/80 border border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-400 animate-pulse ${className}`}>
                    <div className="w-10 h-10 rounded-full bg-gray-200/90 flex items-center justify-center">
                        <div className="w-4 h-4 bg-gray-300 rounded-sm" />
                    </div>
                    <div className="h-3 bg-gray-200 rounded-md w-28" />
                </div>
            );
        case "button":
            return (
                <div className={`w-full py-4 px-5 bg-gray-50/80 border border-dashed border-gray-300 rounded-xl flex items-center justify-center animate-pulse ${className}`}>
                    <div className="h-9 w-36 bg-gray-200/90 rounded-lg" />
                </div>
            );
        case "2_col":
            return (
                <div className={`w-full py-4 px-4 bg-gray-50/80 border border-dashed border-gray-300 rounded-xl grid grid-cols-2 gap-4 animate-pulse ${className}`}>
                    <div className="h-28 bg-gray-200/70 rounded-lg border border-dashed border-gray-300/80" />
                    <div className="h-28 bg-gray-200/70 rounded-lg border border-dashed border-gray-300/80" />
                </div>
            );
        case "3_col":
            return (
                <div className={`w-full py-4 px-4 bg-gray-50/80 border border-dashed border-gray-300 rounded-xl grid grid-cols-3 gap-3 animate-pulse ${className}`}>
                    <div className="h-28 bg-gray-200/70 rounded-lg border border-dashed border-gray-300/80" />
                    <div className="h-28 bg-gray-200/70 rounded-lg border border-dashed border-gray-300/80" />
                    <div className="h-28 bg-gray-200/70 rounded-lg border border-dashed border-gray-300/80" />
                </div>
            );
        case "4_col":
            return (
                <div className={`w-full py-4 px-4 bg-gray-50/80 border border-dashed border-gray-300 rounded-xl grid grid-cols-4 gap-2.5 animate-pulse ${className}`}>
                    <div className="h-28 bg-gray-200/70 rounded-lg border border-dashed border-gray-300/80" />
                    <div className="h-28 bg-gray-200/70 rounded-lg border border-dashed border-gray-300/80" />
                    <div className="h-28 bg-gray-200/70 rounded-lg border border-dashed border-gray-300/80" />
                    <div className="h-28 bg-gray-200/70 rounded-lg border border-dashed border-gray-300/80" />
                </div>
            );
        case "divider":
            return (
                <div className={`w-full py-3 px-5 flex items-center justify-center animate-pulse ${className}`}>
                    <div className="w-full h-0.5 bg-gray-300 rounded-full" />
                </div>
            );
        case "spacer":
            return (
                <div className={`w-full h-12 bg-gray-100/60 border border-dashed border-gray-300 rounded-xl animate-pulse ${className}`} />
            );
        default:
            return (
                <div className={`w-full h-20 bg-gray-50/80 border border-dashed border-gray-300 rounded-xl flex items-center justify-center animate-pulse ${className}`}>
                    <div className="h-3.5 bg-gray-200 rounded-md w-1/3" />
                </div>
            );
    }
}

function DraggableTool({ icon: Icon, label, type, onDragStart, onDragEnd }) {
    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, type)}
            onDragEnd={onDragEnd}
            className="flex flex-col items-center justify-center gap-1 min-w-[56px] cursor-grab active:cursor-grabbing transition-all group shrink-0"
        >
            <div className="h-10 w-10 shrink-0 rounded-full border border-gray-200/90 bg-white flex items-center justify-center shadow-2xs group-hover:border-[#E9C46A]/50 group-hover:bg-blue-50/50 group-active:scale-95 transition-all">
                <Icon className="h-4.5 w-4.5 text-gray-500 group-hover:text-[#E9C46A] transition-colors" />
            </div>
            <span className="text-[10px] font-medium text-gray-400 group-hover:text-gray-700 tracking-wide uppercase text-center truncate max-w-[64px] transition-colors">{label}</span>
        </div>
    )
}
