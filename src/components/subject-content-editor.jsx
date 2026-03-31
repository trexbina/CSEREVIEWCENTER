"use client"

import { useState, useEffect, useCallback, useRef, Fragment } from "react"
import { useRouter } from "next/navigation"
import {
    ArrowLeft, Bold, Italic, Underline, Strikethrough,
    Heading1, Heading2, List, ListOrdered,
    Plus, Type, ImageIcon, Save, Eye, Pencil,
    Trash2, ChevronUp, ChevronDown, GripVertical,
    FileText, Pilcrow, Loader2, Check, Minus,
    AlignLeft, AlignCenter, AlignRight, Quote, Link2,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

function genTempId() {
    return `temp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

// ─── Toolbar Button with Tooltip ────────────────────────
function ToolbarBtn({ icon: Icon, label, onClick, active, disabled }) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={onClick}
                    disabled={disabled}
                    className={cn(
                        "inline-flex h-8 w-8 items-center justify-center rounded-md text-sm transition-colors",
                        "hover:bg-accent hover:text-accent-foreground",
                        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                        "disabled:pointer-events-none disabled:opacity-50",
                        active && "bg-accent text-accent-foreground",
                    )}
                >
                    <Icon className="h-4 w-4" />
                </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
                {label}
            </TooltipContent>
        </Tooltip>
    )
}

// ─── Insert-between-blocks divider ──────────────────────
function InsertDivider({ onInsert }) {
    const [show, setShow] = useState(false)

    return (
        <div
            className="relative flex items-center justify-center py-1"
            onMouseEnter={() => setShow(true)}
            onMouseLeave={() => setShow(false)}
        >
            <div
                className={cn(
                    "flex items-center gap-2 transition-all duration-200",
                    show ? "opacity-100" : "opacity-0",
                )}
            >
                <div className="h-px flex-1 bg-border" />
                <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                        onInsert("text")
                        setShow(false)
                    }}
                    className="inline-flex items-center gap-1 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground shadow-sm hover:border-primary hover:text-primary transition-colors"
                >
                    <Type className="h-3 w-3" /> Text
                </button>
                <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                        onInsert("image")
                        setShow(false)
                    }}
                    className="inline-flex items-center gap-1 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground shadow-sm hover:border-primary hover:text-primary transition-colors"
                >
                    <ImageIcon className="h-3 w-3" /> Image
                </button>
                <div className="h-px flex-1 bg-border" />
            </div>
        </div>
    )
}

// ─── Main Content Editor ────────────────────────────────
export default function SubjectContentEditor({ subject }) {
    const router = useRouter()
    const [blocks, setBlocks] = useState([])
    const [deletedIds, setDeletedIds] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [saveStatus, setSaveStatus] = useState("")
    const [dirty, setDirty] = useState(false)
    const [previewMode, setPreviewMode] = useState(false)
    const [focusedBlockId, setFocusedBlockId] = useState(null)
    const [activeFormats, setActiveFormats] = useState({})
    const [deleting, setDeleting] = useState(null)

    const blockRefs = useRef({})
    const initializedBlocks = useRef(new Set())

    // ── load content ────────────────────────────────────
    const loadContent = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch(
                `/api/admin/subjects/content?subjectId=${subject.id}`
            )
            if (res.ok) {
                const data = await res.json()
                setBlocks(data.content)
                initializedBlocks.current.clear()
            }
        } finally {
            setLoading(false)
        }
    }, [subject.id])

    useEffect(() => {
        loadContent()
    }, [loadContent])

    // ── init contentEditable HTML after blocks load ─────
    useEffect(() => {
        if (loading) return
        blocks.forEach((b) => {
            if (
                b.type === "text" &&
                blockRefs.current[b.id] &&
                !initializedBlocks.current.has(b.id)
            ) {
                blockRefs.current[b.id].innerHTML = b.body || ""
                initializedBlocks.current.add(b.id)
            }
        })
    }, [blocks, loading])

    // ── track active formatting ─────────────────────────
    useEffect(() => {
        function handleSelectionChange() {
            setActiveFormats({
                bold: document.queryCommandState("bold"),
                italic: document.queryCommandState("italic"),
                underline: document.queryCommandState("underline"),
                strikeThrough: document.queryCommandState("strikeThrough"),
            })
        }
        document.addEventListener("selectionchange", handleSelectionChange)
        return () =>
            document.removeEventListener("selectionchange", handleSelectionChange)
    }, [])

    // ── Ctrl+S shortcut ─────────────────────────────────
    const saveRef = useRef()
    saveRef.current = { dirty, saving, doSave: handleSave }

    useEffect(() => {
        function onKeyDown(e) {
            if ((e.ctrlKey || e.metaKey) && e.key === "s") {
                e.preventDefault()
                const { dirty, saving, doSave } = saveRef.current
                if (dirty && !saving) doSave()
            }
        }
        window.addEventListener("keydown", onKeyDown)
        return () => window.removeEventListener("keydown", onKeyDown)
    }, [])

    // ── execCommand on current selection ────────────────
    function execFormat(command, value) {
        document.execCommand(command, false, value || null)
        setActiveFormats({
            bold: document.queryCommandState("bold"),
            italic: document.queryCommandState("italic"),
            underline: document.queryCommandState("underline"),
            strikeThrough: document.queryCommandState("strikeThrough"),
        })
    }

    // ── block management ────────────────────────────────
    function addBlock(type, atIndex) {
        const newBlock = {
            id: genTempId(),
            type,
            title: "",
            body: "",
            image_url: "",
            sort_order: 0,
        }
        setBlocks((prev) => {
            const copy = [...prev]
            const idx = atIndex != null ? atIndex : copy.length
            copy.splice(idx, 0, newBlock)
            return copy
        })
        setDirty(true)

        // focus the new text block after render
        if (type === "text") {
            requestAnimationFrame(() => {
                const el = blockRefs.current[newBlock.id]
                if (el) el.focus()
            })
        }
    }

    function updateBlockField(id, field, value) {
        setBlocks((prev) =>
            prev.map((b) => (b.id === id ? { ...b, [field]: value } : b))
        )
        setDirty(true)
    }

    function removeBlock(block) {
        setDeleting(block)
    }

    function confirmDelete() {
        if (!deleting) return
        if (!String(deleting.id).startsWith("temp_")) {
            setDeletedIds((prev) => [...prev, deleting.id])
        }
        setBlocks((prev) => prev.filter((b) => b.id !== deleting.id))
        delete blockRefs.current[deleting.id]
        initializedBlocks.current.delete(deleting.id)
        setDeleting(null)
        setDirty(true)
    }

    function moveBlock(index, direction) {
        const newIndex = index + direction
        if (newIndex < 0 || newIndex >= blocks.length) return
        const copy = [...blocks]
            ;[copy[index], copy[newIndex]] = [copy[newIndex], copy[index]]
        setBlocks(copy)
        setDirty(true)
    }

    // ── save all changes ────────────────────────────────
    async function handleSave() {
        setSaving(true)
        setSaveStatus("")
        try {
            // sync contentEditable HTML into block data
            const currentBlocks = blocks.map((block) => {
                if (block.type === "text" && blockRefs.current[block.id]) {
                    return {
                        ...block,
                        body: blockRefs.current[block.id].innerHTML,
                    }
                }
                return block
            })

            // 1) delete removed blocks
            for (const id of deletedIds) {
                await fetch(`/api/admin/subjects/content?id=${id}`, {
                    method: "DELETE",
                })
            }

            // 2) create new / update existing
            for (let i = 0; i < currentBlocks.length; i++) {
                const block = currentBlocks[i]
                const isNew = String(block.id).startsWith("temp_")
                const payload = {
                    type: block.type,
                    title: block.title || null,
                    body: block.type === "text" ? block.body || "" : null,
                    image_url: block.type === "image" ? block.image_url || "" : null,
                    sort_order: i,
                }

                if (isNew) {
                    await fetch("/api/admin/subjects/content", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            ...payload,
                            subject_id: subject.id,
                        }),
                    })
                } else {
                    await fetch(`/api/admin/subjects/content?id=${block.id}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload),
                    })
                }
            }

            // 3) reload clean state
            setDeletedIds([])
            setDirty(false)
            setSaveStatus("saved")
            await loadContent()
            setTimeout(() => setSaveStatus(""), 3000)
        } catch (err) {
            console.error("Save error:", err)
            setSaveStatus("error")
        } finally {
            setSaving(false)
        }
    }

    // ── insert link prompt ──────────────────────────────
    function insertLink() {
        const url = prompt("Enter URL:")
        if (url) execFormat("createLink", url)
    }

    // ── render ──────────────────────────────────────────
    return (
        <TooltipProvider delayDuration={200}>
            {/* Document editor styles */}
            <style>{`
                .doc-editor [contenteditable] {
                    outline: none;
                    min-height: 2em;
                    line-height: 1.75;
                }
                .doc-editor [contenteditable]:empty::before {
                    content: attr(data-placeholder);
                    color: hsl(var(--muted-foreground));
                    pointer-events: none;
                }
                .doc-editor [contenteditable] h2 {
                    font-size: 1.5em;
                    font-weight: 700;
                    margin: 0.5em 0 0.25em;
                    line-height: 1.3;
                }
                .doc-editor [contenteditable] h3 {
                    font-size: 1.25em;
                    font-weight: 600;
                    margin: 0.4em 0 0.2em;
                    line-height: 1.3;
                }
                .doc-editor [contenteditable] p {
                    margin: 0.25em 0;
                }
                .doc-editor [contenteditable] ul,
                .doc-editor [contenteditable] ol {
                    margin: 0.3em 0;
                    padding-left: 1.5em;
                }
                .doc-editor [contenteditable] ul { list-style: disc; }
                .doc-editor [contenteditable] ol { list-style: decimal; }
                .doc-editor [contenteditable] li { margin: 0.1em 0; }
                .doc-editor [contenteditable] blockquote {
                    border-left: 3px solid hsl(var(--border));
                    padding-left: 1em;
                    margin: 0.5em 0;
                    color: hsl(var(--muted-foreground));
                    font-style: italic;
                }
                .doc-editor [contenteditable] hr {
                    border: none;
                    border-top: 1px solid hsl(var(--border));
                    margin: 1em 0;
                }
                .doc-editor [contenteditable] a {
                    color: hsl(var(--primary));
                    text-decoration: underline;
                }
                .doc-preview h2 { font-size: 1.5em; font-weight: 700; margin: 0.5em 0 0.25em; }
                .doc-preview h3 { font-size: 1.25em; font-weight: 600; margin: 0.4em 0 0.2em; }
                .doc-preview p { margin: 0.25em 0; }
                .doc-preview ul { list-style: disc; padding-left: 1.5em; margin: 0.3em 0; }
                .doc-preview ol { list-style: decimal; padding-left: 1.5em; margin: 0.3em 0; }
                .doc-preview blockquote {
                    border-left: 3px solid hsl(var(--border));
                    padding-left: 1em; margin: 0.5em 0;
                    color: hsl(var(--muted-foreground)); font-style: italic;
                }
                .doc-preview hr { border: none; border-top: 1px solid hsl(var(--border)); margin: 1em 0; }
                .doc-preview a { color: hsl(var(--primary)); text-decoration: underline; }
            `}</style>

            <div className="-mx-4 lg:-mx-8 -mt-6 -mb-8">
                {/* ── Header bar ─────────────────────────────── */}
                <div className="sticky top-0 z-20 flex items-center gap-3 border-b bg-card px-4 py-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push("/admin/curriculum")}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                    <Separator orientation="vertical" className="h-6" />
                    <div className="flex items-center gap-2 min-w-0">
                        <FileText className="h-5 w-5 text-primary shrink-0" />
                        <span className="font-semibold truncate">
                            {subject.title}
                        </span>
                        <Badge
                            variant="outline"
                            className="font-mono text-[10px] shrink-0"
                        >
                            {subject.code}
                        </Badge>
                    </div>
                    <div className="flex-1" />

                    {dirty && (
                        <Badge
                            variant="secondary"
                            className="text-[10px] animate-pulse shrink-0"
                        >
                            Unsaved changes
                        </Badge>
                    )}
                    {saveStatus === "saved" && (
                        <Badge className="bg-emerald-500/15 text-emerald-600 text-[10px] shrink-0">
                            <Check className="mr-1 h-3 w-3" /> Saved
                        </Badge>
                    )}
                    {saveStatus === "error" && (
                        <Badge variant="destructive" className="text-[10px] shrink-0">
                            Save failed
                        </Badge>
                    )}

                    <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={saving || !dirty}
                    >
                        {saving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                                Saving…
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" /> Save
                            </>
                        )}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPreviewMode(!previewMode)}
                    >
                        {previewMode ? (
                            <>
                                <Pencil className="mr-2 h-4 w-4" /> Edit
                            </>
                        ) : (
                            <>
                                <Eye className="mr-2 h-4 w-4" /> Preview
                            </>
                        )}
                    </Button>
                </div>

                {/* ── Formatting toolbar (edit mode only) ────── */}
                {!previewMode && (
                    <div className="sticky top-[53px] z-10 flex flex-wrap items-center gap-0.5 border-b bg-muted/30 px-4 py-1.5">
                        <ToolbarBtn
                            icon={Bold}
                            label="Bold (Ctrl+B)"
                            onClick={() => execFormat("bold")}
                            active={activeFormats.bold}
                        />
                        <ToolbarBtn
                            icon={Italic}
                            label="Italic (Ctrl+I)"
                            onClick={() => execFormat("italic")}
                            active={activeFormats.italic}
                        />
                        <ToolbarBtn
                            icon={Underline}
                            label="Underline (Ctrl+U)"
                            onClick={() => execFormat("underline")}
                            active={activeFormats.underline}
                        />
                        <ToolbarBtn
                            icon={Strikethrough}
                            label="Strikethrough"
                            onClick={() => execFormat("strikeThrough")}
                            active={activeFormats.strikeThrough}
                        />

                        <Separator orientation="vertical" className="mx-1.5 h-6" />

                        <ToolbarBtn
                            icon={Heading1}
                            label="Heading 1"
                            onClick={() => execFormat("formatBlock", "<h2>")}
                        />
                        <ToolbarBtn
                            icon={Heading2}
                            label="Heading 2"
                            onClick={() => execFormat("formatBlock", "<h3>")}
                        />
                        <ToolbarBtn
                            icon={Pilcrow}
                            label="Paragraph"
                            onClick={() => execFormat("formatBlock", "<p>")}
                        />

                        <Separator orientation="vertical" className="mx-1.5 h-6" />

                        <ToolbarBtn
                            icon={List}
                            label="Bullet list"
                            onClick={() => execFormat("insertUnorderedList")}
                        />
                        <ToolbarBtn
                            icon={ListOrdered}
                            label="Numbered list"
                            onClick={() => execFormat("insertOrderedList")}
                        />
                        <ToolbarBtn
                            icon={Quote}
                            label="Blockquote"
                            onClick={() =>
                                execFormat("formatBlock", "<blockquote>")
                            }
                        />

                        <Separator orientation="vertical" className="mx-1.5 h-6" />

                        <ToolbarBtn
                            icon={AlignLeft}
                            label="Align left"
                            onClick={() => execFormat("justifyLeft")}
                        />
                        <ToolbarBtn
                            icon={AlignCenter}
                            label="Align center"
                            onClick={() => execFormat("justifyCenter")}
                        />
                        <ToolbarBtn
                            icon={AlignRight}
                            label="Align right"
                            onClick={() => execFormat("justifyRight")}
                        />

                        <Separator orientation="vertical" className="mx-1.5 h-6" />

                        <ToolbarBtn
                            icon={Link2}
                            label="Insert link"
                            onClick={insertLink}
                        />
                        <ToolbarBtn
                            icon={Minus}
                            label="Horizontal line"
                            onClick={() => execFormat("insertHorizontalRule")}
                        />

                        <Separator orientation="vertical" className="mx-1.5 h-6" />

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => addBlock("text")}
                                    className="inline-flex h-8 items-center gap-1 rounded-md border bg-card px-2.5 text-xs hover:border-primary hover:text-primary transition-colors"
                                >
                                    <Plus className="h-3 w-3" />
                                    <Type className="h-3.5 w-3.5" />
                                    <span className="hidden sm:inline">Text</span>
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="text-xs">
                                Add text block
                            </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => addBlock("image")}
                                    className="inline-flex h-8 items-center gap-1 rounded-md border bg-card px-2.5 text-xs hover:border-primary hover:text-primary transition-colors"
                                >
                                    <Plus className="h-3 w-3" />
                                    <ImageIcon className="h-3.5 w-3.5" />
                                    <span className="hidden sm:inline">
                                        Image
                                    </span>
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="text-xs">
                                Add image block
                            </TooltipContent>
                        </Tooltip>
                    </div>
                )}

                {/* ── Document area ──────────────────────────── */}
                <div className="bg-muted/20 p-4 sm:p-8 min-h-[calc(100vh-10rem)]">
                    <div className="doc-editor mx-auto max-w-4xl rounded-lg border bg-card shadow-sm">
                        <div className="p-6 sm:p-10">
                            {loading ? (
                                <div className="flex items-center justify-center py-24">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : previewMode ? (
                                /* ── Preview mode ──────────────── */
                                <div className="doc-preview space-y-6">
                                    {blocks.length === 0 ? (
                                        <p className="py-16 text-center text-muted-foreground">
                                            No content yet.
                                        </p>
                                    ) : (
                                        blocks.map((block) => (
                                            <div key={block.id}>
                                                {block.title && (
                                                    <h3 className="text-base font-semibold text-foreground mb-2">
                                                        {block.title}
                                                    </h3>
                                                )}
                                                {block.type === "text" && (
                                                    <div
                                                        className="text-sm leading-relaxed text-foreground/90"
                                                        dangerouslySetInnerHTML={{
                                                            __html:
                                                                blockRefs.current[
                                                                    block.id
                                                                ]?.innerHTML ||
                                                                block.body ||
                                                                "",
                                                        }}
                                                    />
                                                )}
                                                {block.type === "image" &&
                                                    block.image_url && (
                                                        <div className="overflow-hidden rounded-lg border">
                                                            <img
                                                                src={
                                                                    block.image_url
                                                                }
                                                                alt={
                                                                    block.title ||
                                                                    "Content image"
                                                                }
                                                                className="w-full object-contain bg-muted/20"
                                                            />
                                                        </div>
                                                    )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            ) : blocks.length === 0 ? (
                                /* ── Empty state ───────────────── */
                                <div className="flex flex-col items-center justify-center py-24 text-center">
                                    <FileText className="mb-4 h-12 w-12 text-muted-foreground/30" />
                                    <p className="text-lg font-medium text-muted-foreground">
                                        Start building your content
                                    </p>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Add text and image blocks to create
                                        subject material.
                                    </p>
                                    <div className="mt-6 flex gap-3">
                                        <Button
                                            variant="outline"
                                            onClick={() => addBlock("text")}
                                        >
                                            <Type className="mr-2 h-4 w-4" />{" "}
                                            Add Text Block
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => addBlock("image")}
                                        >
                                            <ImageIcon className="mr-2 h-4 w-4" />{" "}
                                            Add Image Block
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                /* ── Edit mode blocks ──────────── */
                                <>
                                    {blocks.map((block, idx) => (
                                        <Fragment key={block.id}>
                                            <div
                                                className={cn(
                                                    "group relative rounded-lg border border-transparent px-4 py-3 transition-all",
                                                    focusedBlockId === block.id
                                                        ? "border-primary/30 bg-primary/[0.02] ring-1 ring-primary/20"
                                                        : "hover:border-border hover:bg-muted/20"
                                                )}
                                            >
                                                {/* Block controls ─ left side */}
                                                <div className="absolute -left-11 top-3 flex-col gap-0.5 hidden sm:flex opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <button
                                                                type="button"
                                                                className="h-6 w-6 inline-flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-30"
                                                                onClick={() =>
                                                                    moveBlock(
                                                                        idx,
                                                                        -1
                                                                    )
                                                                }
                                                                disabled={
                                                                    idx === 0
                                                                }
                                                            >
                                                                <ChevronUp className="h-3.5 w-3.5" />
                                                            </button>
                                                        </TooltipTrigger>
                                                        <TooltipContent
                                                            side="left"
                                                            className="text-xs"
                                                        >
                                                            Move up
                                                        </TooltipContent>
                                                    </Tooltip>
                                                    <GripVertical className="mx-auto h-3.5 w-3.5 text-muted-foreground/40" />
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <button
                                                                type="button"
                                                                className="h-6 w-6 inline-flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-30"
                                                                onClick={() =>
                                                                    moveBlock(
                                                                        idx,
                                                                        1
                                                                    )
                                                                }
                                                                disabled={
                                                                    idx ===
                                                                    blocks.length -
                                                                    1
                                                                }
                                                            >
                                                                <ChevronDown className="h-3.5 w-3.5" />
                                                            </button>
                                                        </TooltipTrigger>
                                                        <TooltipContent
                                                            side="left"
                                                            className="text-xs"
                                                        >
                                                            Move down
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </div>

                                                {/* Delete button ─ right side */}
                                                <div className="absolute -right-11 top-3 hidden sm:block opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <button
                                                                type="button"
                                                                className="h-6 w-6 inline-flex items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                                onClick={() =>
                                                                    removeBlock(
                                                                        block
                                                                    )
                                                                }
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </button>
                                                        </TooltipTrigger>
                                                        <TooltipContent
                                                            side="right"
                                                            className="text-xs"
                                                        >
                                                            Delete block
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </div>

                                                {/* Mobile controls (inline) */}
                                                <div className="flex items-center justify-between gap-2 mb-2 sm:hidden">
                                                    <Badge
                                                        variant="outline"
                                                        className="text-[10px]"
                                                    >
                                                        {block.type === "text" ? (
                                                            <>
                                                                <Type className="mr-1 h-2.5 w-2.5" />
                                                                Text
                                                            </>
                                                        ) : (
                                                            <>
                                                                <ImageIcon className="mr-1 h-2.5 w-2.5" />
                                                                Image
                                                            </>
                                                        )}
                                                    </Badge>
                                                    <div className="flex gap-1">
                                                        <button
                                                            type="button"
                                                            className="h-6 w-6 inline-flex items-center justify-center rounded text-muted-foreground hover:text-foreground disabled:opacity-30"
                                                            onClick={() =>
                                                                moveBlock(
                                                                    idx,
                                                                    -1
                                                                )
                                                            }
                                                            disabled={idx === 0}
                                                        >
                                                            <ChevronUp className="h-3.5 w-3.5" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="h-6 w-6 inline-flex items-center justify-center rounded text-muted-foreground hover:text-foreground disabled:opacity-30"
                                                            onClick={() =>
                                                                moveBlock(
                                                                    idx,
                                                                    1
                                                                )
                                                            }
                                                            disabled={
                                                                idx ===
                                                                blocks.length - 1
                                                            }
                                                        >
                                                            <ChevronDown className="h-3.5 w-3.5" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="h-6 w-6 inline-flex items-center justify-center rounded text-muted-foreground hover:text-destructive"
                                                            onClick={() =>
                                                                removeBlock(
                                                                    block
                                                                )
                                                            }
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Block type badge + title (desktop) */}
                                                <div className="mb-2 items-center gap-2 hidden sm:flex">
                                                    <Badge
                                                        variant="outline"
                                                        className="text-[10px] opacity-60 shrink-0"
                                                    >
                                                        {block.type ===
                                                            "text" ? (
                                                            <>
                                                                <Type className="mr-1 h-2.5 w-2.5" />
                                                                Text
                                                            </>
                                                        ) : (
                                                            <>
                                                                <ImageIcon className="mr-1 h-2.5 w-2.5" />
                                                                Image
                                                            </>
                                                        )}
                                                    </Badge>
                                                    <input
                                                        value={
                                                            block.title || ""
                                                        }
                                                        onChange={(e) =>
                                                            updateBlockField(
                                                                block.id,
                                                                "title",
                                                                e.target.value
                                                            )
                                                        }
                                                        placeholder="Section title (optional)"
                                                        className="flex-1 bg-transparent text-sm font-semibold text-foreground placeholder:text-muted-foreground/40 placeholder:font-normal outline-none"
                                                    />
                                                </div>

                                                {/* Title for mobile */}
                                                <input
                                                    value={block.title || ""}
                                                    onChange={(e) =>
                                                        updateBlockField(
                                                            block.id,
                                                            "title",
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="Section title (optional)"
                                                    className="w-full mb-2 bg-transparent text-sm font-semibold text-foreground placeholder:text-muted-foreground/40 placeholder:font-normal outline-none sm:hidden"
                                                />

                                                {/* ── Content area ──────────── */}
                                                {block.type === "text" ? (
                                                    <div
                                                        ref={(el) => {
                                                            blockRefs.current[
                                                                block.id
                                                            ] = el
                                                        }}
                                                        contentEditable
                                                        suppressContentEditableWarning
                                                        onFocus={() =>
                                                            setFocusedBlockId(
                                                                block.id
                                                            )
                                                        }
                                                        onBlur={() => {
                                                            const html =
                                                                blockRefs
                                                                    .current[
                                                                    block.id
                                                                ]?.innerHTML ||
                                                                ""
                                                            setBlocks((prev) =>
                                                                prev.map((b) =>
                                                                    b.id ===
                                                                        block.id
                                                                        ? {
                                                                            ...b,
                                                                            body: html,
                                                                        }
                                                                        : b
                                                                )
                                                            )
                                                        }}
                                                        onInput={() =>
                                                            setDirty(true)
                                                        }
                                                        data-placeholder="Start typing your content here…"
                                                        className="text-sm min-h-[3em] focus:outline-none"
                                                    />
                                                ) : (
                                                    <div className="space-y-3">
                                                        <Input
                                                            value={
                                                                block.image_url ||
                                                                ""
                                                            }
                                                            onChange={(e) =>
                                                                updateBlockField(
                                                                    block.id,
                                                                    "image_url",
                                                                    e.target
                                                                        .value
                                                                )
                                                            }
                                                            placeholder="Paste image URL (e.g. https://example.com/image.png)"
                                                            className="text-sm"
                                                            onFocus={() =>
                                                                setFocusedBlockId(
                                                                    block.id
                                                                )
                                                            }
                                                        />
                                                        {block.image_url && (
                                                            <div className="overflow-hidden rounded-lg border bg-muted/20">
                                                                <img
                                                                    src={
                                                                        block.image_url
                                                                    }
                                                                    alt={
                                                                        block.title ||
                                                                        "Content image"
                                                                    }
                                                                    className="max-h-80 w-full object-contain"
                                                                    onError={(
                                                                        e
                                                                    ) => {
                                                                        e.target.style.display =
                                                                            "none"
                                                                    }}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Insert divider between blocks */}
                                            <InsertDivider
                                                onInsert={(type) =>
                                                    addBlock(type, idx + 1)
                                                }
                                            />
                                        </Fragment>
                                    ))}

                                    {/* Add block buttons at bottom */}
                                    <div className="flex items-center justify-center gap-3 pt-6 pb-4">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-xs"
                                            onClick={() => addBlock("text")}
                                        >
                                            <Plus className="mr-1 h-3 w-3" />
                                            <Type className="mr-1 h-3 w-3" />{" "}
                                            Text Block
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-xs"
                                            onClick={() => addBlock("image")}
                                        >
                                            <Plus className="mr-1 h-3 w-3" />
                                            <ImageIcon className="mr-1 h-3 w-3" />{" "}
                                            Image Block
                                        </Button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Delete confirmation ─────────────────────── */}
                <AlertDialog
                    open={!!deleting}
                    onOpenChange={(v) => !v && setDeleting(null)}
                >
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>
                                Delete Content Block
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to delete this{" "}
                                {deleting?.type} block
                                {deleting?.title
                                    ? ` "${deleting.title}"`
                                    : ""}
                                ? This action cannot be undone after saving.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={confirmDelete}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                                Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </TooltipProvider>
    )
}
