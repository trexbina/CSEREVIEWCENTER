"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Plus, ArrowUpDown, ChevronDown, Save, Calendar as CalendarIcon, Check, ChevronRight, Pencil, Trash } from "lucide-react"

// ─── Static course / specialization tree ────────────────────────────────────
// Shape: batch → exam → programs → majors
const COURSE_TREE = [
    {
        id: "batch1",
        label: "Batch 1 / 2026",
        children: [
            {
                id: "batch1-lept",
                label: "LEPT",
                children: [
                    { id: "batch1-lept-bsed-english",    label: "BSED – English" },
                    { id: "batch1-lept-bsed-math",       label: "BSED – Mathematics" },
                    { id: "batch1-lept-bsed-science",    label: "BSED – Science" },
                    { id: "batch1-lept-bsed-filipino",   label: "BSED – Filipino" },
                    { id: "batch1-lept-bsed-socstudies", label: "BSED – Social Studies" },
                    { id: "batch1-lept-beed",            label: "BEED" },
                ],
            },
        ],
    },
    {
        id: "batch2",
        label: "Batch 2 / 2026",
        children: [
            {
                id: "batch2-lept",
                label: "LEPT",
                children: [
                    { id: "batch2-lept-bsed-english",    label: "BSED – English" },
                    { id: "batch2-lept-bsed-math",       label: "BSED – Mathematics" },
                    { id: "batch2-lept-bsed-science",    label: "BSED – Science" },
                    { id: "batch2-lept-bsed-filipino",   label: "BSED – Filipino" },
                    { id: "batch2-lept-bsed-socstudies", label: "BSED – Social Studies" },
                    { id: "batch2-lept-beed",            label: "BEED" },
                ],
            },
        ],
    },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────
/** Collect all leaf IDs under a node */
function allLeafIds(node) {
    if (!node.children || node.children.length === 0) return [node.id]
    return node.children.flatMap(allLeafIds)
}

/** Collect all IDs (including self) under a node */
function allIds(node) {
    const ids = [node.id]
    if (node.children) ids.push(...node.children.flatMap(allIds))
    return ids
}

/** Given the current selected set, compute the new set after toggling a node */
function toggleNode(selected, node) {
    const leaves = allLeafIds(node)
    const selfIds = allIds(node)
    const allLeafSelected = leaves.every(id => selected.has(id))

    const next = new Set(selected)
    if (allLeafSelected) {
        // deselect self + all descendants
        selfIds.forEach(id => next.delete(id))
    } else {
        // select self + all descendants
        selfIds.forEach(id => next.add(id))
    }
    return reconcile(next, COURSE_TREE)
}

/** After mutating the selected set, bubble up: mark a parent as selected only if all its leaves are selected */
function reconcile(selected, nodes) {
    for (const node of nodes) {
        if (!node.children) continue
        reconcile(selected, node.children)
        const leaves = allLeafIds(node)
        if (leaves.every(id => selected.has(id))) {
            selected.add(node.id)
        } else {
            selected.delete(node.id)
        }
    }
    return selected
}

/** Determine checkbox state: 'all' | 'some' | 'none' */
function checkState(selected, node) {
    const leaves = allLeafIds(node)
    const count = leaves.filter(id => selected.has(id)).length
    if (count === 0) return "none"
    if (count === leaves.length) return "all"
    return "some"
}

/** Build a human-readable summary string of selections */
function buildSummary(selected) {
    if (selected.size === 0) return "Select courses…"

    // Check if entire batches are selected
    const parts = []
    for (const batch of COURSE_TREE) {
        const state = checkState(selected, batch)
        if (state === "all") {
            parts.push(batch.label)
        } else if (state === "some") {
            for (const course of batch.children) {
                const cs = checkState(selected, course)
                if (cs === "all") {
                    parts.push(`${batch.label} › ${course.label}`)
                } else if (cs === "some") {
                    const subs = course.children
                        .filter(m => selected.has(m.id))
                        .map(m => m.label)
                    parts.push(...subs)
                }
            }
        }
    }
    if (parts.length === 0) return "Select courses…"
    if (parts.length > 2) return `${parts.slice(0, 2).join(", ")} +${parts.length - 2} more`
    return parts.join(", ")
}

// ─── Checkbox UI ─────────────────────────────────────────────────────────────
function Checkbox({ state }) {
    const base = "w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border transition-colors"
    if (state === "all")
        return (
            <span className={`${base} bg-[#eedc82] border-[#eedc82]`}>
                <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
            </span>
        )
    if (state === "some")
        return (
            <span className={`${base} bg-[#eedc82]/40 border-[#eedc82]`}>
                <span className="w-2 h-0.5 rounded-full bg-[#b8a730]" />
            </span>
        )
    return <span className={`${base} border-gray-300 bg-white`} />
}

// ─── Recursive tree row ───────────────────────────────────────────────────────
function TreeRow({ node, selected, onToggle, depth = 0 }) {
    const [open, setOpen] = useState(depth === 0) // batches open by default
    const hasChildren = node.children && node.children.length > 0
    const state = checkState(selected, node)
    const isLeaf = !hasChildren

    return (
        <div>
            <div
                className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors select-none"
                style={{ paddingLeft: `${12 + depth * 16}px` }}
                onClick={() => {
                    if (hasChildren) setOpen(o => !o)
                    onToggle(node)
                }}
            >
                {/* expand arrow */}
                {hasChildren ? (
                    <ChevronRight
                        className={`h-3.5 w-3.5 text-gray-400 flex-shrink-0 transition-transform ${open ? "rotate-90" : ""}`}
                        onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
                    />
                ) : (
                    <span className="w-3.5 flex-shrink-0" />
                )}

                <Checkbox state={state} />

                <span
                    className={`text-[13px] leading-tight font-medium ${
                        depth === 0
                            ? "text-[#5a5a5a] font-bold"
                            : depth === 1
                            ? "text-[#6a6a6a] font-semibold"
                            : "text-[#7a7a7a]"
                    }`}
                >
                    {node.label}
                </span>
            </div>

            {hasChildren && open && (
                <div>
                    {node.children.map(child => (
                        <TreeRow
                            key={child.id}
                            node={child}
                            selected={selected}
                            onToggle={onToggle}
                            depth={depth + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

// ─── Multi-select dropdown ────────────────────────────────────────────────────
function CourseMultiSelect({ selected, onChange }) {
    const [open, setOpen] = useState(false)
    const ref = useRef(null)

    // close on outside click
    useEffect(() => {
        function handler(e) {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false)
        }
        document.addEventListener("mousedown", handler)
        return () => document.removeEventListener("mousedown", handler)
    }, [])

    function handleToggle(node) {
        onChange(toggleNode(new Set(selected), node))
    }

    const summary = buildSummary(new Set(selected))
    const hasSelection = selected.length > 0

    return (
        <div ref={ref} className="relative">
            {/* Trigger */}
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className="w-full h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm text-left flex items-center justify-between focus:outline-none focus:ring-1 focus:ring-gray-300 transition-shadow"
            >
                <span className={`truncate ${hasSelection ? "text-[#5a5a5a] font-medium" : "text-gray-400"}`}>
                    {summary}
                </span>
                <ChevronDown className={`h-4 w-4 text-gray-400 flex-shrink-0 ml-2 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>

            {/* Badge count */}
            {selected.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#eedc82] text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-sm pointer-events-none">
                    {selected.length}
                </span>
            )}

            {/* Dropdown panel */}
            {open && (
                <div className="absolute z-50 mt-1.5 w-full bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                    {/* Header */}
                    <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-gray-50">
                        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Select Target Courses</span>
                        {selected.length > 0 && (
                            <button
                                type="button"
                                onClick={() => onChange([])}
                                className="text-[11px] text-[#ba5a62] font-bold hover:underline"
                            >
                                Clear all
                            </button>
                        )}
                    </div>

                    {/* Tree */}
                    <div className="max-h-64 overflow-y-auto py-1.5 px-1">
                        {COURSE_TREE.map(batch => (
                            <TreeRow
                                key={batch.id}
                                node={batch}
                                selected={new Set(selected)}
                                onToggle={handleToggle}
                                depth={0}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function parseTargets(targets) {
    if (!targets || targets.length === 0) return { batch: "—", type: "—", course: "—" }
    
    const batches = []
    const types = []
    const courses = []
    
    for (const tId of targets) {
        // If it's a batch:
        const batchNode = COURSE_TREE.find(b => b.id === tId)
        if (batchNode) {
            batches.push(batchNode.label)
            continue
        }
        
        // If it's an exam/type:
        for (const b of COURSE_TREE) {
            const examNode = b.children?.find(e => e.id === tId)
            if (examNode) {
                types.push(examNode.label)
                break
            }
            
            // If it's a course/major:
            if (b.children) {
                for (const e of b.children) {
                    const courseNode = e.children?.find(c => c.id === tId)
                    if (courseNode) {
                        courses.push(courseNode.label)
                        break
                    }
                }
            }
        }
    }
    
    return {
        batch: batches.length > 0 ? batches.join(", ") : (targets.some(id => id.startsWith("batch1")) ? "Batch 1" : (targets.some(id => id.startsWith("batch2")) ? "Batch 2" : "—")),
        type: types.length > 0 ? types.join(", ") : (targets.some(id => id.includes("lept")) ? "LEPT" : "—"),
        course: courses.length > 0 ? (courses.length > 2 ? `${courses.length} Spec.` : courses.join(", ")) : "All"
    }
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function MockExamsPage() {
    const router = useRouter()
    const [exams, setExams] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingExam, setEditingExam] = useState(null)
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        examCode: "",
        targetCourses: [],   // array of selected IDs
        unlockDate: "",
        status: "Locked"
    })

    useEffect(() => {
        fetchExams()
    }, [])

    async function fetchExams() {
        try {
            setLoading(true)
            const res = await fetch("/api/admin/mock-exams")
            if (res.ok) {
                const data = await res.json()
                setExams(data.exams || [])
            } else {
                setError("Failed to fetch mock exams.")
            }
        } catch (err) {
            console.error(err)
            setError("Error loading exams.")
        } finally {
            setLoading(false)
        }
    }

    const handleSaveMockExam = async (e) => {
        e.preventDefault()
        try {
            const url = editingExam 
                ? `/api/admin/mock-exams/${editingExam.id}`
                : "/api/admin/mock-exams"
            const method = editingExam ? "PUT" : "POST"

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            })

            if (res.ok) {
                const data = await res.json()
                setIsModalOpen(false)
                setEditingExam(null)
                
                if (method === "POST") {
                    // Redirect to the builder for the new mock exam!
                    router.push(`/admin/mock-exams/${data.exam.id}`)
                } else {
                    fetchExams()
                }
            } else {
                const errData = await res.json()
                alert(errData.error || "Failed to save mock exam.")
            }
        } catch (err) {
            console.error(err)
            alert("An error occurred while saving the exam.")
        }
    }

    const handleDeleteExam = async (examId) => {
        if (!confirm("Are you sure you want to delete this mock exam?")) return
        try {
            const res = await fetch(`/api/admin/mock-exams/${examId}`, {
                method: "DELETE"
            })
            if (res.ok) {
                setExams(exams.filter(exam => exam.id !== examId))
            } else {
                alert("Failed to delete exam.")
            }
        } catch (err) {
            console.error(err)
            alert("An error occurred.")
        }
    }

    function openModal(exam = null) {
        if (exam) {
            setEditingExam(exam)
            setFormData({
                title: exam.title,
                description: exam.description || "",
                examCode: exam.exam_code,
                targetCourses: exam.targets || [],
                unlockDate: exam.unlock_date ? new Date(exam.unlock_date).toISOString().slice(0, 16) : "",
                status: exam.status === "active" ? "Active" : "Locked"
            })
        } else {
            setEditingExam(null)
            setFormData({ title: "", description: "", examCode: "", targetCourses: [], unlockDate: "", status: "Locked" })
        }
        setIsModalOpen(true)
    }

    return (
        <div className="w-full max-w-7xl mx-auto px-4 py-8 space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-[28px] font-black text-[#4d4d4d] tracking-wide uppercase">
                    MOCK EXAM
                </h1>
                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-1.5 bg-[#f5cdd0] text-[#ba5a62] font-bold text-[11px] tracking-wide uppercase px-5 py-2.5 rounded-lg shadow-sm hover:bg-[#f1b8bd] hover:-translate-y-0.5 transition-all"
                >
                    <Plus className="h-3.5 w-3.5" strokeWidth={3} /> ADD MOCK EXAM
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-6">
                {[
                    { label: "Batch", value: "All" },
                    { label: "Type", value: "BLEPT" },
                    { label: "Course", value: "All" },
                    { label: "Year", value: "2026" }
                ].map((filter, i) => (
                    <button key={i} className="flex items-center bg-[#f2f4f7] hover:bg-[#e2e5e9] rounded-md border border-gray-200 px-3 py-1.5 transition-colors">
                        <ArrowUpDown className="h-3 w-3 text-gray-400 mr-2" />
                        <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">{filter.label}: {filter.value}</span>
                        <ChevronDown className="h-3.5 w-3.5 text-gray-400 ml-2" />
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="border border-gray-200 rounded-[1.25rem] overflow-hidden bg-white shadow-sm min-h-[500px] flex flex-col">
                <div className="bg-[#f2f4f7] grid grid-cols-9 py-3.5 px-6 text-[10px] font-bold text-[#8c8c8c] uppercase tracking-widest border-b border-gray-200">
                    <div className="col-span-2 flex items-center gap-1.5 cursor-pointer hover:text-gray-600 transition-colors">Mock Exam Title <ChevronDown className="h-3.5 w-3.5 text-gray-400" /></div>
                    <div className="flex items-center gap-1.5 cursor-pointer hover:text-gray-600 transition-colors">Exam Code <ChevronDown className="h-3.5 w-3.5 text-gray-400" /></div>
                    <div className="flex items-center gap-1.5 cursor-pointer hover:text-gray-600 transition-colors">Batch <ChevronDown className="h-3.5 w-3.5 text-gray-400" /></div>
                    <div className="col-span-1 flex items-center gap-1.5 cursor-pointer hover:text-gray-600 transition-colors">Type <ChevronDown className="h-3.5 w-3.5 text-gray-400" /></div>
                    <div className="col-span-1 flex items-center gap-1.5 cursor-pointer hover:text-gray-600 transition-colors">Course <ChevronDown className="h-3.5 w-3.5 text-gray-400" /></div>
                    <div className="col-span-1 flex items-center gap-1.5 cursor-pointer hover:text-gray-600 transition-colors">Date Created <ChevronDown className="h-3.5 w-3.5 text-gray-400" /></div>
                    <div className="flex items-center gap-1.5 cursor-pointer hover:text-gray-600 transition-colors">Status <ChevronDown className="h-3.5 w-3.5 text-gray-400" /></div>
                    <div className="text-right">Actions</div>
                </div>

                {loading ? (
                    <div className="flex-1 flex items-center justify-center p-8 bg-[#fdfdfd]">
                        <span className="text-sm font-semibold text-gray-400 uppercase tracking-widest animate-pulse">Loading Mock Exams...</span>
                    </div>
                ) : error ? (
                    <div className="flex-1 flex items-center justify-center p-8 bg-[#fdfdfd] text-red-500 font-semibold uppercase text-xs">
                        {error}
                    </div>
                ) : exams.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-[#fdfdfd]">
                        <h2 className="text-[22px] font-black text-[#5a5a5a] mb-2 tracking-tight">No Exams Yet</h2>
                        <p className="text-[13px] font-medium text-[#8c8c8c]">
                            Click on the create new exam button to begin creating a new exam.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 flex-1 bg-white">
                        {exams.map((exam) => {
                            const { batch, type, course } = parseTargets(exam.targets)
                            return (
                                <div key={exam.id} className="grid grid-cols-9 py-4 px-6 items-center text-[13px] text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-100">
                                    <div 
                                        className="col-span-2 font-bold text-[#4d4d4d] cursor-pointer hover:underline"
                                        onClick={() => router.push(`/admin/mock-exams/${exam.id}`)}
                                    >
                                        {exam.title}
                                    </div>
                                    <div className="font-mono text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded w-fit tracking-wider">{exam.exam_code}</div>
                                    <div className="font-medium">{batch}</div>
                                    <div className="font-medium">{type}</div>
                                    <div className="font-medium text-gray-500">{course}</div>
                                    <div className="col-span-1 text-[11px] text-gray-400 font-semibold">{new Date(exam.created_at).toLocaleDateString()}</div>
                                    <div>
                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border shadow-sm ${
                                            exam.status === "active" 
                                                ? "bg-green-50 text-green-700 border-green-200" 
                                                : "bg-red-50 text-red-700 border-red-200"
                                        }`}>
                                            {exam.status === "active" ? "Active" : "Locked"}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => router.push(`/admin/mock-exams/${exam.id}`)}
                                            className="bg-[#eedc82] text-white hover:bg-[#e0d075] px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95"
                                        >
                                            Build
                                        </button>
                                        <button
                                            onClick={() => openModal(exam)}
                                            className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-gray-100 rounded-md transition-colors"
                                            title="Edit Exam"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteExam(exam.id)}
                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-gray-100 rounded-md transition-colors"
                                            title="Delete Exam"
                                        >
                                            <Trash className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* ── Add/Edit Mock Exam Modal ── */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-250">
                    <div className="w-full max-w-[620px] bg-white rounded-[1.25rem] shadow-2xl p-8 animate-in zoom-in-95 duration-200">
                        <div className="mb-6">
                            <h2 className="text-[22px] font-black text-[#7a7a7a] tracking-wide uppercase">
                                {editingExam ? "EDIT MOCK EXAM" : "ADD MOCK EXAM"}
                            </h2>
                            <p className="text-[13px] font-medium text-[#8c8c8c] mt-1">
                                Configure mock exam name, code, description, status, and target courses
                            </p>
                        </div>

                        <div className="w-full h-px bg-gray-100 mb-6" />

                        <form onSubmit={handleSaveMockExam} className="space-y-5">
                            {/* Title */}
                            <div>
                                <label className="block text-[#7a7a7a] text-[13px] font-bold mb-2">Title:</label>
                                <input
                                    type="text"
                                    placeholder="Enter title here..."
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-300 transition-shadow"
                                    required
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-[#7a7a7a] text-[13px] font-bold mb-2">Description</label>
                                <input
                                    type="text"
                                    placeholder="Enter description here..."
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-300 transition-shadow"
                                />
                            </div>

                            {/* Exam Code */}
                            <div>
                                <label className="block text-[#7a7a7a] text-[13px] font-bold mb-2">
                                    Exam Code
                                    <span className="ml-1.5 text-[11px] font-normal text-gray-400">(unique identifier for this exam)</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. LEPT-2026-B1-001"
                                    value={formData.examCode}
                                    onChange={e => setFormData({ ...formData, examCode: e.target.value.toUpperCase() })}
                                    className="w-full h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm font-mono text-gray-700 tracking-widest placeholder:font-sans placeholder:tracking-normal focus:outline-none focus:ring-1 focus:ring-[#eedc82] transition-shadow"
                                    maxLength={30}
                                    required
                                />
                            </div>

                            {/* Target Courses multi-select (full width) */}
                            <div>
                                <label className="block text-[#7a7a7a] text-[13px] font-bold mb-2">
                                    Target Courses / Batch
                                    <span className="ml-1.5 text-[11px] font-normal text-gray-400">(select batch, course, or specialization)</span>
                                </label>
                                <CourseMultiSelect
                                    selected={formData.targetCourses}
                                    onChange={ids => setFormData({ ...formData, targetCourses: Array.from(ids) })}
                                />
                            </div>

                            {/* Unlock Date */}
                            <div>
                                <label className="block text-[#7a7a7a] text-[13px] font-bold mb-2">Unlock Date &amp; Time:</label>
                                <div className="relative">
                                    <input
                                        type="datetime-local"
                                        value={formData.unlockDate}
                                        onChange={e => setFormData({ ...formData, unlockDate: e.target.value })}
                                        className="w-full h-11 rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-sm text-[#8c8c8c] focus:outline-none focus:ring-1 focus:ring-gray-300"
                                    />
                                    <CalendarIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 pointer-events-none" />
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between pt-6 border-t border-gray-100 mt-6">
                                {/* Status toggle */}
                                <div className="flex items-center gap-3">
                                    <span className="text-[#7a7a7a] text-[13px] font-bold">Status:</span>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, status: formData.status === "Locked" ? "Active" : "Locked" })}
                                        className="flex items-center gap-2"
                                    >
                                        <div className={`w-11 h-6 rounded-full transition-colors flex items-center px-0.5 ${formData.status === "Active" ? "bg-[#e0d68f]" : "bg-gray-300"}`}>
                                            <div className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${formData.status === "Active" ? "translate-x-[20px]" : "translate-x-0"}`} />
                                        </div>
                                        <span className={`text-[13px] font-bold ${formData.status === "Active" ? "text-[#e0d68f]" : "text-[#f06e6e]"}`}>
                                            {formData.status}
                                        </span>
                                    </button>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-6 py-2.5 rounded-2xl border border-gray-200 text-[#7a7a7a] text-[13px] font-bold hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex items-center gap-2 px-8 py-2.5 rounded-2xl bg-[#eedc82] text-white text-[13px] font-bold hover:bg-[#e0d075] transition-colors shadow-sm"
                                    >
                                        <Save className="h-4 w-4" /> Save
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
