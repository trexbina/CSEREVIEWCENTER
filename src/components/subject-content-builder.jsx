"use client"

import { useState, useEffect, useCallback } from "react"
import {
    Plus, Trash2, Pencil, ChevronUp, ChevronDown, Save, X,
    Type, ImageIcon, Eye, ArrowLeft, FileText, GripVertical,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
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
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"

// ─── Add / Edit Block Dialog ────────────────────────────
function BlockDialog({ open, onOpenChange, block, onSave, saving }) {
    const [type, setType] = useState("text")
    const [title, setTitle] = useState("")
    const [body, setBody] = useState("")
    const [imageUrl, setImageUrl] = useState("")
    const [error, setError] = useState("")

    useEffect(() => {
        if (open) {
            if (block) {
                setType(block.type)
                setTitle(block.title || "")
                setBody(block.body || "")
                setImageUrl(block.image_url || "")
            } else {
                setType("text")
                setTitle("")
                setBody("")
                setImageUrl("")
            }
            setError("")
        }
    }, [open, block])

    async function handleSubmit(e) {
        e.preventDefault()
        setError("")

        if (type === "text" && !body.trim()) {
            setError("Text body is required.")
            return
        }
        if (type === "image" && !imageUrl.trim()) {
            setError("Image URL is required.")
            return
        }

        const err = await onSave({
            type,
            title: title.trim(),
            body: body.trim(),
            image_url: imageUrl.trim(),
        })
        if (err) setError(err)
    }

    const isEdit = !!block

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {isEdit ? (
                                <><Pencil className="h-5 w-5 text-primary" /> Edit Content Block</>
                            ) : (
                                <><Plus className="h-5 w-5 text-primary" /> Add Content Block</>
                            )}
                        </DialogTitle>
                        <DialogDescription>
                            {isEdit
                                ? "Update this content block."
                                : "Add a text or image block to the subject content."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {error && (
                            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                                {error}
                            </div>
                        )}

                        {/* Type selector */}
                        <div className="space-y-2">
                            <Label>Block Type</Label>
                            <Select value={type} onValueChange={setType}>
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="text">
                                        <span className="flex items-center gap-2">
                                            <Type className="h-4 w-4" /> Text
                                        </span>
                                    </SelectItem>
                                    <SelectItem value="image">
                                        <span className="flex items-center gap-2">
                                            <ImageIcon className="h-4 w-4" /> Image
                                        </span>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Title (optional) */}
                        <div className="space-y-2">
                            <Label htmlFor="block-title">Title (optional)</Label>
                            <Input
                                id="block-title"
                                placeholder="e.g. Introduction, Key Concepts…"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>

                        {/* Text body */}
                        {type === "text" && (
                            <div className="space-y-2">
                                <Label htmlFor="block-body">Content *</Label>
                                <Textarea
                                    id="block-body"
                                    placeholder="Write your content here…"
                                    rows={6}
                                    value={body}
                                    onChange={(e) => setBody(e.target.value)}
                                />
                            </div>
                        )}

                        {/* Image URL */}
                        {type === "image" && (
                            <div className="space-y-2">
                                <Label htmlFor="block-image">Image URL *</Label>
                                <Input
                                    id="block-image"
                                    placeholder="https://example.com/image.png"
                                    value={imageUrl}
                                    onChange={(e) => setImageUrl(e.target.value)}
                                />
                                {imageUrl.trim() && (
                                    <div className="mt-2 overflow-hidden rounded-md border">
                                        <img
                                            src={imageUrl}
                                            alt="Preview"
                                            className="max-h-48 w-full object-contain bg-muted/30"
                                            onError={(e) => {
                                                e.target.style.display = "none"
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button type="submit" disabled={saving}>
                            {saving ? (
                                <span className="flex items-center gap-2">
                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                    Saving…
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <Save className="h-4 w-4" />
                                    {isEdit ? "Update Block" : "Add Block"}
                                </span>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

// ─── Content Block Card (editor view) ───────────────────
function ContentBlockCard({ block, index, total, onEdit, onDelete, onMove }) {
    return (
        <div className="group flex gap-3 rounded-lg border bg-card p-4 shadow-sm transition-colors hover:border-primary/30">
            {/* reorder + grip */}
            <div className="flex flex-col items-center gap-1 pt-1">
                <button
                    className="text-muted-foreground hover:text-foreground disabled:opacity-20"
                    onClick={() => onMove(-1)}
                    disabled={index === 0}
                >
                    <ChevronUp className="h-4 w-4" />
                </button>
                <GripVertical className="h-4 w-4 text-muted-foreground/50" />
                <button
                    className="text-muted-foreground hover:text-foreground disabled:opacity-20"
                    onClick={() => onMove(1)}
                    disabled={index === total - 1}
                >
                    <ChevronDown className="h-4 w-4" />
                </button>
            </div>

            {/* content preview */}
            <div className="flex-1 min-w-0">
                <div className="mb-2 flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">
                        {block.type === "text" ? (
                            <><Type className="mr-1 h-3 w-3" />Text</>
                        ) : (
                            <><ImageIcon className="mr-1 h-3 w-3" />Image</>
                        )}
                    </Badge>
                    {block.title && (
                        <span className="text-sm font-medium truncate">{block.title}</span>
                    )}
                </div>

                {block.type === "text" && (
                    <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">
                        {block.body}
                    </p>
                )}
                {block.type === "image" && block.image_url && (
                    <img
                        src={block.image_url}
                        alt={block.title || "Content image"}
                        className="mt-1 max-h-32 rounded-md border object-contain bg-muted/20"
                        onError={(e) => {
                            e.target.src = ""
                            e.target.alt = "Image failed to load"
                        }}
                    />
                )}
            </div>

            {/* actions */}
            <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
                    <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:bg-destructive/10"
                    onClick={onDelete}
                >
                    <Trash2 className="h-3.5 w-3.5" />
                </Button>
            </div>
        </div>
    )
}

// ─── View-only Content Renderer ─────────────────────────
function ContentViewer({ blocks }) {
    if (blocks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <FileText className="mb-3 h-10 w-10 text-muted-foreground/40" />
                <p className="text-muted-foreground">No content blocks yet.</p>
                <p className="mt-1 text-sm text-muted-foreground">
                    Switch to the Edit tab to start adding content.
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {blocks.map((block) => (
                <div key={block.id}>
                    {block.title && (
                        <h3 className="mb-2 text-base font-semibold text-foreground">
                            {block.title}
                        </h3>
                    )}
                    {block.type === "text" && (
                        <p className="text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap">
                            {block.body}
                        </p>
                    )}
                    {block.type === "image" && block.image_url && (
                        <div className="overflow-hidden rounded-lg border">
                            <img
                                src={block.image_url}
                                alt={block.title || "Content image"}
                                className="w-full object-contain bg-muted/20"
                                onError={(e) => {
                                    e.target.alt = "Image failed to load"
                                }}
                            />
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
}

// ─── Main Content Builder ───────────────────────────────
export default function SubjectContentBuilder({ subject, onBack }) {
    const [blocks, setBlocks] = useState([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingBlock, setEditingBlock] = useState(null)
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(null)

    const loadContent = useCallback(async () => {
        try {
            const res = await fetch(
                `/api/admin/subjects/content?subjectId=${subject.id}`
            )
            if (res.ok) {
                const data = await res.json()
                setBlocks(data.content)
            }
        } finally {
            setLoading(false)
        }
    }, [subject.id])

    useEffect(() => {
        loadContent()
    }, [loadContent])

    // save block (create or update)
    async function handleSave(form) {
        setSaving(true)
        try {
            const isEdit = !!editingBlock
            const url = isEdit
                ? `/api/admin/subjects/content?id=${editingBlock.id}`
                : "/api/admin/subjects/content"

            const res = await fetch(url, {
                method: isEdit ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(
                    isEdit ? form : { ...form, subject_id: subject.id }
                ),
            })
            const data = await res.json()
            if (!res.ok) return data.error || "Something went wrong."

            setDialogOpen(false)
            setEditingBlock(null)
            await loadContent()
            return null
        } finally {
            setSaving(false)
        }
    }

    // delete block
    async function handleDelete() {
        if (!deleting) return
        try {
            await fetch(`/api/admin/subjects/content?id=${deleting.id}`, {
                method: "DELETE",
            })
            setDeleting(null)
            await loadContent()
        } catch {
            setDeleting(null)
        }
    }

    // reorder
    async function handleMove(index, direction) {
        const newIndex = index + direction
        if (newIndex < 0 || newIndex >= blocks.length) return

        const copy = [...blocks]
            ;[copy[index], copy[newIndex]] = [copy[newIndex], copy[index]]
        setBlocks(copy)

        // persist new order
        const reorderPayload = copy.map((b, i) => ({ id: b.id, sort_order: i }))
        await fetch("/api/admin/subjects/content?action=reorder", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ blocks: reorderPayload }),
        })
    }

    return (
        <div className="space-y-4">
            {/* header with back button */}
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1">
                    <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        {subject.title}
                        <Badge variant="outline" className="ml-1 font-mono text-xs">
                            {subject.code}
                        </Badge>
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Manage content blocks for this subject.
                    </p>
                </div>
            </div>

            <Separator />

            <Tabs defaultValue="edit" className="w-full">
                <div className="flex items-center justify-between">
                    <TabsList>
                        <TabsTrigger value="edit" className="gap-1.5">
                            <Pencil className="h-3.5 w-3.5" /> Edit
                        </TabsTrigger>
                        <TabsTrigger value="view" className="gap-1.5">
                            <Eye className="h-3.5 w-3.5" /> View
                        </TabsTrigger>
                    </TabsList>

                    <Button
                        size="sm"
                        onClick={() => {
                            setEditingBlock(null)
                            setDialogOpen(true)
                        }}
                    >
                        <Plus className="mr-2 h-4 w-4" /> Add Block
                    </Button>
                </div>

                {/* ── Edit Tab ─────────────────────────── */}
                <TabsContent value="edit" className="mt-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        </div>
                    ) : blocks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
                            <FileText className="mb-3 h-10 w-10 text-muted-foreground/40" />
                            <p className="font-medium text-muted-foreground">
                                No content yet
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Add text and image blocks to build this subject&apos;s content.
                            </p>
                            <Button
                                className="mt-4"
                                size="sm"
                                onClick={() => {
                                    setEditingBlock(null)
                                    setDialogOpen(true)
                                }}
                            >
                                <Plus className="mr-2 h-4 w-4" /> Add First Block
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {blocks.map((block, idx) => (
                                <ContentBlockCard
                                    key={block.id}
                                    block={block}
                                    index={idx}
                                    total={blocks.length}
                                    onEdit={() => {
                                        setEditingBlock(block)
                                        setDialogOpen(true)
                                    }}
                                    onDelete={() => setDeleting(block)}
                                    onMove={(dir) => handleMove(idx, dir)}
                                />
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* ── View Tab ─────────────────────────── */}
                <TabsContent value="view" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Content Preview</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ContentViewer blocks={blocks} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* add / edit dialog */}
            <BlockDialog
                open={dialogOpen}
                onOpenChange={(v) => {
                    setDialogOpen(v)
                    if (!v) setEditingBlock(null)
                }}
                block={editingBlock}
                onSave={handleSave}
                saving={saving}
            />

            {/* delete confirmation */}
            <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Content Block</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this{" "}
                            <strong>{deleting?.type}</strong> block
                            {deleting?.title ? ` "${deleting.title}"` : ""}? This
                            cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
