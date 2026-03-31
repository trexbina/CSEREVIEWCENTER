"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
    Plus, Pencil, Trash2, GripVertical, X, Save,
    BookOpen, Layers, Search, ChevronDown, ChevronUp,
    Eye, FileText,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
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
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

const CATEGORIES = [
    "General Education",
    "Professional Education",
    "Major / Specialization",
]

const EMPTY_SUBJECT = {
    title: "",
    code: "",
    description: "",
    category: "",
    status: "active",
    topics: [],
}

// ─── Topic Builder ──────────────────────────────────────
function TopicBuilder({ topics, onChange }) {
    const [newTopic, setNewTopic] = useState("")
    const [newSubtopic, setNewSubtopic] = useState({})

    function addTopic() {
        if (!newTopic.trim()) return
        onChange([...topics, { name: newTopic.trim(), subtopics: [] }])
        setNewTopic("")
    }

    function removeTopic(idx) {
        onChange(topics.filter((_, i) => i !== idx))
    }

    function addSubtopic(topicIdx) {
        const text = newSubtopic[topicIdx]?.trim()
        if (!text) return
        const updated = topics.map((t, i) =>
            i === topicIdx ? { ...t, subtopics: [...t.subtopics, text] } : t
        )
        onChange(updated)
        setNewSubtopic((prev) => ({ ...prev, [topicIdx]: "" }))
    }

    function removeSubtopic(topicIdx, subIdx) {
        const updated = topics.map((t, i) =>
            i === topicIdx
                ? { ...t, subtopics: t.subtopics.filter((_, j) => j !== subIdx) }
                : t
        )
        onChange(updated)
    }

    function moveTopic(idx, dir) {
        const newIdx = idx + dir
        if (newIdx < 0 || newIdx >= topics.length) return
        const copy = [...topics]
            ;[copy[idx], copy[newIdx]] = [copy[newIdx], copy[idx]]
        onChange(copy)
    }

    return (
        <div className="space-y-3">
            <Label className="text-sm font-medium">Topics & Subtopics</Label>
            <p className="text-xs text-muted-foreground">
                Build the content structure of this subject. Add topics and nest subtopics within them.
            </p>

            {/* add topic row */}
            <div className="flex gap-2">
                <Input
                    placeholder="New topic name…"
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTopic())}
                />
                <Button type="button" size="sm" onClick={addTopic} disabled={!newTopic.trim()}>
                    <Plus className="mr-1 h-4 w-4" /> Add
                </Button>
            </div>

            {topics.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">
                    No topics yet. Add your first topic above.
                </p>
            )}

            <Accordion type="multiple" className="w-full">
                {topics.map((topic, tIdx) => (
                    <AccordionItem value={`topic-${tIdx}`} key={tIdx}>
                        <div className="flex items-center gap-2">
                            <div className="flex flex-col">
                                <button
                                    type="button"
                                    className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                                    onClick={() => moveTopic(tIdx, -1)}
                                    disabled={tIdx === 0}
                                >
                                    <ChevronUp className="h-3.5 w-3.5" />
                                </button>
                                <button
                                    type="button"
                                    className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                                    onClick={() => moveTopic(tIdx, 1)}
                                    disabled={tIdx === topics.length - 1}
                                >
                                    <ChevronDown className="h-3.5 w-3.5" />
                                </button>
                            </div>

                            <AccordionTrigger className="flex-1 py-2 text-sm font-medium">
                                <span className="flex items-center gap-2">
                                    <Layers className="h-4 w-4 text-primary" />
                                    {topic.name}
                                    <Badge variant="secondary" className="ml-1 text-[10px]">
                                        {topic.subtopics.length} subtopic{topic.subtopics.length !== 1 && "s"}
                                    </Badge>
                                </span>
                            </AccordionTrigger>

                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                onClick={() => removeTopic(tIdx)}
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                        </div>

                        <AccordionContent>
                            <div className="ml-8 space-y-2 pb-2">
                                {topic.subtopics.map((sub, sIdx) => (
                                    <div
                                        key={sIdx}
                                        className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-1.5 text-sm"
                                    >
                                        <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
                                        <span className="flex-1">{sub}</span>
                                        <button
                                            type="button"
                                            className="text-muted-foreground hover:text-destructive"
                                            onClick={() => removeSubtopic(tIdx, sIdx)}
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                ))}

                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Add subtopic…"
                                        className="h-8 text-sm"
                                        value={newSubtopic[tIdx] || ""}
                                        onChange={(e) =>
                                            setNewSubtopic((p) => ({ ...p, [tIdx]: e.target.value }))
                                        }
                                        onKeyDown={(e) =>
                                            e.key === "Enter" && (e.preventDefault(), addSubtopic(tIdx))
                                        }
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-8 text-xs"
                                        onClick={() => addSubtopic(tIdx)}
                                        disabled={!newSubtopic[tIdx]?.trim()}
                                    >
                                        <Plus className="mr-1 h-3 w-3" /> Add
                                    </Button>
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </div>
    )
}

// ─── Subject Builder Dialog ─────────────────────────────
function SubjectDialog({ open, onOpenChange, subject, onSave, saving }) {
    const [form, setForm] = useState(EMPTY_SUBJECT)
    const [error, setError] = useState("")

    useEffect(() => {
        if (open) {
            setForm(subject ? { ...subject, topics: subject.topics || [] } : { ...EMPTY_SUBJECT })
            setError("")
        }
    }, [open, subject])

    function set(field, value) {
        setForm((f) => ({ ...f, [field]: value }))
    }

    async function handleSubmit(e) {
        e.preventDefault()
        setError("")
        if (!form.title.trim() || !form.code.trim()) {
            setError("Title and code are required.")
            return
        }
        const err = await onSave(form)
        if (err) setError(err)
    }

    const isEdit = !!subject

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] max-w-2xl overflow-hidden p-0">
                <form onSubmit={handleSubmit} className="flex h-full flex-col">
                    <DialogHeader className="px-6 pt-6 pb-2">
                        <DialogTitle className="flex items-center gap-2 text-lg">
                            <BookOpen className="h-5 w-5 text-primary" />
                            {isEdit ? "Edit Subject" : "Create New Subject"}
                        </DialogTitle>
                        <DialogDescription>
                            {isEdit
                                ? "Update the subject details and topic structure."
                                : "Fill in the details below to create a new subject."}
                        </DialogDescription>
                    </DialogHeader>

                    <ScrollArea className="flex-1 px-6">
                        <div className="space-y-5 pb-4">
                            {error && (
                                <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                                    {error}
                                </div>
                            )}

                            {/* title + code */}
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Subject Title *</Label>
                                    <Input
                                        id="title"
                                        placeholder="e.g. General Mathematics"
                                        value={form.title}
                                        onChange={(e) => set("title", e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="code">Subject Code *</Label>
                                    <Input
                                        id="code"
                                        placeholder="e.g. MATH101"
                                        value={form.code}
                                        onChange={(e) => set("code", e.target.value.toUpperCase())}
                                        className="uppercase"
                                    />
                                </div>
                            </div>

                            {/* description */}
                            <div className="space-y-2">
                                <Label htmlFor="desc">Description</Label>
                                <Textarea
                                    id="desc"
                                    placeholder="A brief overview of what this subject covers…"
                                    rows={3}
                                    value={form.description}
                                    onChange={(e) => set("description", e.target.value)}
                                />
                            </div>

                            {/* category + status */}
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Category</Label>
                                    <Select
                                        value={form.category}
                                        onValueChange={(v) => set("category", v)}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {CATEGORIES.map((c) => (
                                                <SelectItem key={c} value={c}>
                                                    {c}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-end gap-3 pb-1">
                                    <div className="space-y-2">
                                        <Label>Status</Label>
                                        <div className="flex items-center gap-2">
                                            <Switch
                                                checked={form.status === "active"}
                                                onCheckedChange={(v) =>
                                                    set("status", v ? "active" : "inactive")
                                                }
                                            />
                                            <span className="text-sm text-muted-foreground">
                                                {form.status === "active" ? "Active" : "Inactive"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* topics builder */}
                            <TopicBuilder
                                topics={form.topics}
                                onChange={(t) => set("topics", t)}
                            />
                        </div>
                    </ScrollArea>

                    <DialogFooter className="border-t px-6 py-4">
                        <DialogClose asChild>
                            <Button type="button" variant="outline">
                                Cancel
                            </Button>
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
                                    {isEdit ? "Update Subject" : "Create Subject"}
                                </span>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

// ─── Subject View Dialog ────────────────────────────────
function SubjectViewDialog({ open, onOpenChange, subject }) {
    if (!subject) return null

    const topics = subject.topics || []

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[85vh] max-w-2xl overflow-hidden p-0">
                <DialogHeader className="px-6 pt-6 pb-2">
                    <DialogTitle className="flex items-center gap-2 text-lg">
                        <Eye className="h-5 w-5 text-primary" />
                        {subject.title}
                        <Badge variant="outline" className="ml-1 font-mono text-xs">
                            {subject.code}
                        </Badge>
                    </DialogTitle>
                    <DialogDescription>Subject details and structure overview.</DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-1 px-6 pb-6">
                    <div className="space-y-5">
                        {/* info grid */}
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">Category</p>
                                <p className="mt-0.5 text-sm">
                                    {subject.category || <span className="text-muted-foreground">—</span>}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">Status</p>
                                <Badge
                                    variant={subject.status === "active" ? "default" : "secondary"}
                                    className={
                                        subject.status === "active"
                                            ? "mt-0.5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                            : "mt-0.5 bg-zinc-500/15 text-zinc-500"
                                    }
                                >
                                    {subject.status}
                                </Badge>
                            </div>
                        </div>

                        {/* description */}
                        {subject.description && (
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">Description</p>
                                <p className="mt-1 text-sm text-foreground/80 whitespace-pre-wrap">
                                    {subject.description}
                                </p>
                            </div>
                        )}

                        <Separator />

                        {/* topics */}
                        <div>
                            <p className="text-xs font-medium text-muted-foreground mb-3">
                                Topics ({topics.length})
                            </p>
                            {topics.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No topics defined.</p>
                            ) : (
                                <div className="space-y-3">
                                    {topics.map((t, i) => (
                                        <div key={i} className="rounded-md border bg-muted/30 p-3">
                                            <p className="text-sm font-medium flex items-center gap-2">
                                                <Layers className="h-4 w-4 text-primary" />
                                                {t.name}
                                            </p>
                                            {t.subtopics?.length > 0 && (
                                                <ul className="mt-2 ml-6 space-y-1">
                                                    {t.subtopics.map((s, j) => (
                                                        <li
                                                            key={j}
                                                            className="text-sm text-muted-foreground list-disc"
                                                        >
                                                            {s}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}

// ─── Main Subject Manager ───────────────────────────────
export default function SubjectManager() {
    const router = useRouter()
    const [subjects, setSubjects] = useState([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editing, setEditing] = useState(null)
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(null)
    const [search, setSearch] = useState("")
    const [filterCat, setFilterCat] = useState("all")
    const [viewing, setViewing] = useState(null)

    // fetch subjects
    const load = useCallback(async () => {
        try {
            const res = await fetch("/api/admin/subjects")
            if (res.ok) {
                const data = await res.json()
                setSubjects(data.subjects)
            }
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { load() }, [load])

    // save (create or update)
    async function handleSave(form) {
        setSaving(true)
        try {
            const isEdit = !!editing
            const url = isEdit
                ? `/api/admin/subjects?id=${editing.id}`
                : "/api/admin/subjects"

            const res = await fetch(url, {
                method: isEdit ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            })

            const data = await res.json()
            if (!res.ok) return data.error || "Something went wrong."

            setDialogOpen(false)
            setEditing(null)
            await load()
            return null
        } finally {
            setSaving(false)
        }
    }

    // delete
    async function handleDelete() {
        if (!deleting) return
        try {
            await fetch(`/api/admin/subjects?id=${deleting.id}`, { method: "DELETE" })
            setDeleting(null)
            await load()
        } catch {
            setDeleting(null)
        }
    }

    // filter
    const filtered = subjects.filter((s) => {
        const matchesSearch =
            s.title.toLowerCase().includes(search.toLowerCase()) ||
            s.code.toLowerCase().includes(search.toLowerCase())
        const matchesCat = filterCat === "all" || s.category === filterCat
        return matchesSearch && matchesCat
    })

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <BookOpen className="h-5 w-5 text-primary" />
                                Subjects
                            </CardTitle>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Create and manage subjects with topics and subtopics.
                            </p>
                        </div>
                        <Button
                            onClick={() => {
                                setEditing(null)
                                setDialogOpen(true)
                            }}
                        >
                            <Plus className="mr-2 h-4 w-4" /> New Subject
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* filters */}
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search by title or code…"
                                className="pl-9"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <Select value={filterCat} onValueChange={setFilterCat}>
                            <SelectTrigger className="w-full sm:w-48">
                                <SelectValue placeholder="All Categories" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                {CATEGORIES.map((c) => (
                                    <SelectItem key={c} value={c}>
                                        {c}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* table */}
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
                            <BookOpen className="mb-3 h-10 w-10 text-muted-foreground/50" />
                            <p className="font-medium text-muted-foreground">
                                {subjects.length === 0 ? "No subjects yet" : "No matching subjects"}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {subjects.length === 0
                                    ? "Create your first subject to get started."
                                    : "Try adjusting your search or filters."}
                            </p>
                            {subjects.length === 0 && (
                                <Button
                                    className="mt-4"
                                    size="sm"
                                    onClick={() => {
                                        setEditing(null)
                                        setDialogOpen(true)
                                    }}
                                >
                                    <Plus className="mr-2 h-4 w-4" /> Create Subject
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Code</TableHead>
                                        <TableHead>Title</TableHead>
                                        <TableHead className="hidden md:table-cell">Category</TableHead>
                                        <TableHead className="hidden sm:table-cell">Topics</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filtered.map((subject) => (
                                        <TableRow key={subject.id}>
                                            <TableCell className="font-mono text-sm font-medium">
                                                {subject.code}
                                            </TableCell>
                                            <TableCell className="font-medium">{subject.title}</TableCell>
                                            <TableCell className="hidden md:table-cell">
                                                {subject.category ? (
                                                    <Badge variant="outline">{subject.category}</Badge>
                                                ) : (
                                                    <span className="text-muted-foreground">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="hidden sm:table-cell">
                                                <Badge variant="secondary">
                                                    {(subject.topics || []).length} topic
                                                    {(subject.topics || []).length !== 1 && "s"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={subject.status === "active" ? "default" : "secondary"}
                                                    className={
                                                        subject.status === "active"
                                                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                                            : "bg-zinc-500/15 text-zinc-500"
                                                    }
                                                >
                                                    {subject.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    {/* View subject details */}
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        title="View subject"
                                                        onClick={() => setViewing(subject)}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    {/* Open content editor page */}
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-primary"
                                                        title="Content editor"
                                                        onClick={() => router.push(`/admin/curriculum/${subject.id}/content`)}
                                                    >
                                                        <FileText className="h-4 w-4" />
                                                    </Button>
                                                    {/* Edit subject */}
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        title="Edit subject"
                                                        onClick={() => {
                                                            setEditing(subject)
                                                            setDialogOpen(true)
                                                        }}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    {/* Delete subject */}
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                                        title="Delete subject"
                                                        onClick={() => setDeleting(subject)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* create / edit dialog */}
            <SubjectDialog
                open={dialogOpen}
                onOpenChange={(v) => {
                    setDialogOpen(v)
                    if (!v) setEditing(null)
                }}
                subject={editing}
                onSave={handleSave}
                saving={saving}
            />

            {/* view dialog */}
            <SubjectViewDialog
                open={!!viewing}
                onOpenChange={(v) => !v && setViewing(null)}
                subject={viewing}
            />

            {/* delete confirmation */}
            <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Subject</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete{" "}
                            <strong>{deleting?.title}</strong> ({deleting?.code})? This action
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
        </>
    )
}
