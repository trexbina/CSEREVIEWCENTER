// this tells nextjs to run this mock exams screen in the browser
"use client"

// helper tools from react to handle state, memory, and effects
import { useState, useRef, useEffect, useMemo } from "react"

// helpers from nextjs to navigate and create links
import { useRouter } from "next/navigation"
import Link from "next/link"

// small icons used on tables, buttons, and cards
import { 
    Plus, 
    ArrowUpDown, 
    ArrowUp,
    ArrowDown,
    ChevronDown, 
    Save, 
    Check, 
    ChevronRight, 
    Pencil, 
    Trash, 
    X, 
    Loader2,
    Search 
} from "lucide-react"

// date and time picker components
import MinimalDatePicker from "@/components/ui/MinimalDatePicker"
import MinimalTimePicker from "@/components/ui/MinimalTimePicker"
import MultiSelectDropdown from "@/components/ui/MultiSelectDropdown"
import ConfirmDeleteModal from "@/components/confirm-delete-modal"
import { toast } from "@/components/ui/toast"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip"

// sorting button component for table headers with simple white tooltip
function SortButton({ label, field, sortField, sortDir, onSort }) {
  const active = sortField === field
  const tooltipText = !active
    ? `Sort by ${label}`
    : sortDir === "asc"
    ? "Sorted ascending (A-Z / Oldest)"
    : "Sorted descending (Z-A / Newest)"

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => onSort(field)}
            className="flex items-center gap-1.5 text-[#696969]/80 dark:text-gray-400 hover:text-[#3B3B3B] dark:hover:text-white transition-colors font-medium select-none cursor-pointer"
          >
            <span>{label}</span>
            {active ? (
              sortDir === "asc" ? (
                <ArrowUp className="h-3.5 w-3.5 text-[#3B3B3B] dark:text-white shrink-0" />
              ) : (
                <ArrowDown className="h-3.5 w-3.5 text-[#3B3B3B] dark:text-white shrink-0" />
              )
            ) : (
              <ArrowUpDown className="h-3.5 w-3.5 opacity-40 shrink-0" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent className="bg-white text-gray-800 dark:bg-slate-900 dark:text-slate-100 border border-gray-200 dark:border-slate-800 shadow-md text-xs px-2.5 py-1 rounded-lg">
          {tooltipText}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// helper function to turn master data into a nested course tree for filters
function buildCourseTreeFromMasterData(masterData) {
    const { batches = [], examinations = [], programs = [], majors = [] } = masterData

    if (batches.length === 0 && examinations.length === 0) {
        return []
    }

    const buildExamSubtree = (batchId, examIdFilter = null) => {
        const filteredExams = examIdFilter 
            ? examinations.filter(e => e.id === examIdFilter)
            : examinations

        return filteredExams.map(exam => {
            const examPrograms = programs.filter(p => p.exam_id === exam.id || !p.exam_id)
            return {
                id: `batch_${batchId}_exam_${exam.id}`,
                entityType: 'exam',
                rawId: exam.id,
                label: exam.name,
                children: examPrograms.map(prog => {
                    const progMajors = majors.filter(m => m.program_id === prog.id)
                    return {
                        id: `batch_${batchId}_prog_${prog.id}`,
                        entityType: 'program',
                        rawId: prog.id,
                        label: prog.name,
                        children: progMajors.map(maj => ({
                            id: `batch_${batchId}_maj_${maj.id}`,
                            entityType: 'major',
                            rawId: maj.id,
                            label: maj.name,
                            children: []
                        }))
                    }
                })
            }
        })
    }

    if (batches.length > 0) {
        return batches.map(batch => ({
            id: `batch_${batch.id}`,
            entityType: 'batch',
            rawId: batch.id,
            label: batch.target_year ? `${batch.name} / ${batch.target_year}` : batch.name,
            year: batch.target_year,
            children: buildExamSubtree(batch.id, batch.exam_id)
        }))
    } else {
        return examinations.map(exam => {
            const examPrograms = programs.filter(p => p.exam_id === exam.id || !p.exam_id)
            return {
                id: `exam_${exam.id}`,
                entityType: 'exam',
                rawId: exam.id,
                label: exam.name,
                children: examPrograms.map(prog => {
                    const progMajors = majors.filter(m => m.program_id === prog.id)
                    return {
                        id: `prog_${prog.id}`,
                        entityType: 'program',
                        rawId: prog.id,
                        label: prog.name,
                        children: progMajors.map(maj => ({
                            id: `maj_${maj.id}`,
                            entityType: 'major',
                            rawId: maj.id,
                            label: maj.name,
                            children: []
                        }))
                    }
                })
            }
        })
    }
}

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
function toggleNode(selected, node, tree) {
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
    return reconcile(next, tree)
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
function buildSummary(selected, tree) {
    if (selected.size === 0) return "Select courses…"

    const parts = []
    for (const batch of tree) {
        const state = checkState(selected, batch)
        if (state === "all") {
            parts.push(batch.label)
        } else if (state === "some" && batch.children) {
            for (const course of batch.children) {
                const cs = checkState(selected, course)
                if (cs === "all") {
                    parts.push(`${batch.label} › ${course.label}`)
                } else if (cs === "some" && course.children) {
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
            <span className={`${base} bg-[#E9C46A] border-[#E9C46A]`}>
                <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
            </span>
        )
    if (state === "some")
        return (
            <span className={`${base} bg-[#E9C46A]/20 border-[#E9C46A]`}>
                <span className="w-2 h-0.5 rounded-full bg-[#E9C46A]" />
            </span>
        )
    return <span className={`${base} border-gray-300 bg-white`} />
}

// ─── Recursive tree row ───────────────────────────────────────────────────────
function TreeRow({ node, selected, onToggle, depth = 0 }) {
    const [open, setOpen] = useState(depth === 0) // batches open by default
    const hasChildren = node.children && node.children.length > 0
    const state = checkState(selected, node)

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
function CourseMultiSelect({ selected, onChange, tree }) {
    const [open, setOpen] = useState(false)
    const ref = useRef(null)

    useEffect(() => {
        function handler(e) {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false)
        }
        document.addEventListener("mousedown", handler)
        return () => document.removeEventListener("mousedown", handler)
    }, [])

    function handleToggle(node) {
        onChange(toggleNode(new Set(selected), node, tree))
    }

    const summary = buildSummary(new Set(selected), tree)
    const hasSelection = selected.length > 0

    return (
        <div ref={ref} className="relative">
            {/* Trigger */}
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className="w-full h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm text-left flex items-center justify-between focus:outline-none focus:border-gray-400 transition-colors cursor-pointer"
            >
                <span className={`truncate ${hasSelection ? "text-gray-800 font-medium" : "text-gray-400 font-normal"}`}>
                    {summary}
                </span>
                <ChevronDown className={`h-4 w-4 text-gray-400 flex-shrink-0 ml-2 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown panel */}
            {open && (
                <div className="absolute z-50 mt-1.5 w-full bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                    {/* Header */}
                    <div className="px-3 py-2 border-b border-gray-100 bg-gray-50">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Select Target Courses</span>
                    </div>

                    {/* Tree */}
                    <div className="max-h-64 overflow-y-auto py-1.5 px-1">
                        {tree.length === 0 ? (
                            <div className="text-center py-6 text-xs text-gray-400">
                                No master data courses or batches configured yet.
                            </div>
                        ) : (
                            tree.map(batch => (
                                <TreeRow
                                    key={batch.id}
                                    node={batch}
                                    selected={new Set(selected)}
                                    onToggle={handleToggle}
                                    depth={0}
                                />
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

// ─── Target Label Parser ─────────────────────────────────────────────────────
function parseTargets(targets, tree = [], masterData = null) {
    if (!targets || targets.length === 0 || (targets.length === 1 && targets[0] === 'all')) {
        return { batch: "All", type: "All", course: "All" }
    }
    
    const batches = []
    const types = []
    const courses = []

    targets.forEach(t => {
        if (typeof t === 'string') {
            if (t.startsWith('course_')) {
                const cName = t.replace('course_', '')
                courses.push(cName)
                types.push(cName)
            } else if (t.startsWith('batch_')) {
                const bName = t.replace('batch_', '')
                batches.push(bName)
            } else if (t.toLowerCase().includes('batch1')) {
                batches.push("Batch 1")
            } else if (t.toLowerCase().includes('batch2')) {
                batches.push("Batch 2")
            } else if (t.toLowerCase().includes('lept')) {
                types.push("LEPT")
            }
        }
    })

    const traverse = (node) => {
        if (targets.includes(node.id)) {
            if (node.entityType === 'batch') batches.push(node.label)
            else if (node.entityType === 'exam') types.push(node.label)
            else if (node.entityType === 'program' || node.entityType === 'major') courses.push(node.label)
        }
        if (node.children) {
            node.children.forEach(traverse)
        }
    }

    tree.forEach(traverse)

    return {
        batch: batches.length > 0 ? Array.from(new Set(batches)).join(", ") : "All",
        type: types.length > 0 ? Array.from(new Set(types)).join(", ") : "All",
        course: courses.length > 0 
            ? (courses.length > 2 ? `${courses.length} Courses` : Array.from(new Set(courses)).join(", ")) 
            : "All"
    }
}

// main mock exams dashboard component
export default function MockExamsPage() {
    const router = useRouter()

    // list of mock exams and school master data
    const [exams, setExams] = useState([])
    const [masterData, setMasterData] = useState({
        batches: [],
        examinations: [],
        programs: [],
        majors: [],
        academic_courses: []
    })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    
    // search state
    const [searchQuery, setSearchQuery] = useState("")
    const [debouncedSearch, setDebouncedSearch] = useState("")

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300)
        return () => clearTimeout(timer)
    }, [searchQuery])

    // dropdown filter states
    const [selectedBatch, setSelectedBatch] = useState("All")
    const [selectedType, setSelectedType] = useState("All")
    const [selectedCourse, setSelectedCourse] = useState("All")
    const [selectedYear, setSelectedYear] = useState("All")

    // table sorting state
    const [sortField, setSortField] = useState("created_at")
    const [sortDir, setSortDir] = useState("desc")

    // handles sorting when column headers are clicked
    function handleSort(field) {
      if (sortField === field) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"))
      } else {
        setSortField(field)
        setSortDir("asc")
      }
    }

    // create and edit modal states
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingExam, setEditingExam] = useState(null)
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        examCode: "",
        targetCourses: ["all"],
        targetBatches: ["all"],
        unlockDate: "",
        status: "Locked"
    })

    // load mock exams and master data when page opens
    useEffect(() => {
        fetchInitialData()
    }, [])

    // fetch all mock exams and master data dropdowns
    async function fetchInitialData() {
        try {
            setLoading(true)
            const [examsRes, masterRes] = await Promise.all([
                fetch("/api/admin/mock-exams"),
                fetch("/api/admin/master-data/dropdowns")
            ])

            if (examsRes.ok) {
                const examsData = await examsRes.json()
                setExams(examsData.exams || [])
            } else {
                setError("Failed to fetch mock exams.")
            }

            if (masterRes.ok) {
                const md = await masterRes.json()
                setMasterData(md)
            }
        } catch (err) {
            console.error(err)
            setError("Error loading exams and master data.")
        } finally {
            setLoading(false)
        }
    }

    async function fetchExams() {
        try {
            const res = await fetch("/api/admin/mock-exams")
            if (res.ok) {
                const data = await res.json()
                setExams(data.exams || [])
            }
        } catch (err) {
            console.error(err)
        }
    }

    const courseTree = useMemo(() => {
        return buildCourseTreeFromMasterData(masterData)
    }, [masterData])

    // Derive years from masterData.batches
    const availableYears = useMemo(() => {
        const years = masterData.batches.map(b => b.target_year).filter(Boolean)
        return Array.from(new Set(years))
    }, [masterData.batches])

    // Filter and sort exams based on active filters & sorting
    const filteredExams = useMemo(() => {
        const q = debouncedSearch.toLowerCase().trim()

        let list = exams.filter(exam => {
            const { batch, type, course } = parseTargets(exam.targets, courseTree, masterData)

            if (q) {
                const titleMatch = (exam.title || "").toLowerCase().includes(q)
                const codeMatch = (exam.exam_code || "").toLowerCase().includes(q)
                const batchMatch = batch.toLowerCase().includes(q)
                const typeMatch = type.toLowerCase().includes(q)
                const courseMatch = course.toLowerCase().includes(q)
                if (!titleMatch && !codeMatch && !batchMatch && !typeMatch && !courseMatch) {
                    return false
                }
            }

            if (selectedBatch !== "All" && !batch.toLowerCase().includes(selectedBatch.toLowerCase())) {
                return false
            }
            if (selectedType !== "All" && !type.toLowerCase().includes(selectedType.toLowerCase())) {
                return false
            }
            if (selectedCourse !== "All" && !course.toLowerCase().includes(selectedCourse.toLowerCase())) {
                return false
            }
            if (selectedYear !== "All" && !batch.includes(String(selectedYear))) {
                return false
            }
            return true
        })

        return list.sort((a, b) => {
            const targetsA = parseTargets(a.targets, courseTree, masterData)
            const targetsB = parseTargets(b.targets, courseTree, masterData)

            let av = ""
            let bv = ""

            if (sortField === "title") {
                av = (a.title || "").toLowerCase()
                bv = (b.title || "").toLowerCase()
            } else if (sortField === "batch") {
                av = targetsA.batch.toLowerCase()
                bv = targetsB.batch.toLowerCase()
            } else if (sortField === "type") {
                av = targetsA.type.toLowerCase()
                bv = targetsB.type.toLowerCase()
            } else if (sortField === "course") {
                av = targetsA.course.toLowerCase()
                bv = targetsB.course.toLowerCase()
            } else if (sortField === "created_at" || sortField === "date") {
                const timeA = new Date(a.created_at || 0).getTime()
                const timeB = new Date(b.created_at || 0).getTime()
                return sortDir === "asc" ? timeA - timeB : timeB - timeA
            } else if (sortField === "status") {
                const isLockedA = a.unlock_date && new Date(a.unlock_date).getTime() > Date.now() ? 1 : 0
                const isLockedB = b.unlock_date && new Date(b.unlock_date).getTime() > Date.now() ? 1 : 0
                return sortDir === "asc" ? isLockedA - isLockedB : isLockedB - isLockedA
            } else if (sortField === "exam_code") {
                av = (a.exam_code || "").toLowerCase()
                bv = (b.exam_code || "").toLowerCase()
            }

            if (av < bv) return sortDir === "asc" ? -1 : 1
            if (av > bv) return sortDir === "asc" ? 1 : -1
            return 0
        })
    }, [exams, selectedBatch, selectedType, selectedCourse, selectedYear, courseTree, masterData, sortField, sortDir])

    const handleSaveMockExam = async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
            const url = editingExam 
                ? `/api/admin/mock-exams/${editingExam.id}`
                : "/api/admin/mock-exams"
            const method = editingExam ? "PUT" : "POST"

            // Construct combined targets list for storage
            const courses = Array.isArray(formData.targetCourses) ? formData.targetCourses : [formData.targetCourses]
            const batches = Array.isArray(formData.targetBatches) ? formData.targetBatches : [formData.targetBatches]
            
            const combinedTargets = []
            if (!courses.includes("all") && courses.length > 0) {
                courses.forEach(c => combinedTargets.push(`course_${c}`))
            }
            if (!batches.includes("all") && batches.length > 0) {
                batches.forEach(b => combinedTargets.push(`batch_${b}`))
            }

            const payload = {
                ...formData,
                targetCourses: combinedTargets.length === 0 ? ["all"] : combinedTargets
            }

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            })

            if (res.ok) {
                const data = await res.json()
                setIsModalOpen(false)
                toast(editingExam ? "Successfully updated mock exam." : "Successfully created mock exam.")
                setEditingExam(null)
                
                if (method === "POST") {
                    // Redirect to the builder for the new mock exam!
                    router.push(`/admin/mock-exams/${data.exam.id}`)
                } else {
                    fetchExams()
                }
            } else {
                const errData = await res.json()
                toast(errData.error || "Failed to save mock exam.")
            }
        } catch (err) {
            console.error(err)
            toast("An error occurred while saving the exam.")
        } finally {
            setSaving(false)
        }
    }

    // Confirm Delete Modal State
    const [deleteModal, setDeleteModal] = useState({
        isOpen: false,
        title: "Confirm Deletion",
        description: "Are you sure you want to delete this item? This action cannot be undone.",
        onConfirm: null,
        isDeleting: false
    })

    const handleDeleteExam = (exam) => {
        setDeleteModal({
            isOpen: true,
            title: "Delete Mock Exam",
            description: `Are you sure you want to delete "${exam.title}"? All associated questions and student exam attempts will be removed. This cannot be undone.`,
            onConfirm: async () => {
                setDeleteModal(prev => ({ ...prev, isDeleting: true }))
                try {
                    const res = await fetch(`/api/admin/mock-exams/${exam.id}`, {
                        method: "DELETE"
                    })
                    if (res.ok) {
                        setExams(prev => prev.filter(e => e.id !== exam.id))
                        toast("Successfully moved mock exam to trash.")
                    } else {
                        toast("Failed to delete exam.")
                    }
                } catch (err) {
                    console.error(err)
                    alert("An error occurred.")
                } finally {
                    setDeleteModal({ isOpen: false, title: "", description: "", onConfirm: null, isDeleting: false })
                }
            },
            isDeleting: false
        })
    }

    function openModal(exam = null) {
        if (exam) {
            setEditingExam(exam)
            let settings = {}
            if (exam.questions) {
                let parsed = exam.questions
                if (typeof parsed === "string") {
                    try { parsed = JSON.parse(parsed) } catch (e) {}
                }
                if (parsed && !Array.isArray(parsed) && parsed.settings) {
                    settings = parsed.settings
                }
            }

            let sDate = settings.startDate || ""
            let sTime = settings.startTime || ""
            if (!sDate && exam.unlock_date) {
                const d = new Date(exam.unlock_date)
                if (!isNaN(d.getTime())) {
                    sDate = d.toISOString().slice(0, 10)
                    sTime = d.toTimeString().slice(0, 5)
                }
            }

            // Parse targets to separate courses and batches
            let rawTargets = Array.isArray(exam.targets) 
                ? exam.targets 
                : (typeof exam.targets === 'string' ? JSON.parse(exam.targets || '[]') : [])
            
            let loadedCourses = []
            let loadedBatches = []

            if (rawTargets.length === 0 || rawTargets.includes("all")) {
                loadedCourses = ["all"]
                loadedBatches = ["all"]
            } else {
                // Separate rawTargets into courses and batches based on masterData or entity patterns
                rawTargets.forEach(t => {
                    if (typeof t === 'string' && t.startsWith("course_")) {
                        loadedCourses.push(t.replace("course_", ""))
                    } else if (typeof t === 'string' && t.startsWith("batch_")) {
                        loadedBatches.push(t.replace("batch_", ""))
                    } else {
                        // Check if it matches an exam name or a batch name
                        const isExam = masterData.examinations.some(e => e.name.toLowerCase() === String(t).toLowerCase() || String(e.id) === String(t))
                        const isBatch = masterData.batches.some(b => b.name.toLowerCase() === String(t).toLowerCase() || String(b.id) === String(t))
                        if (isExam) loadedCourses.push(t)
                        else if (isBatch) loadedBatches.push(t)
                        else loadedCourses.push(t)
                    }
                })
                if (loadedCourses.length === 0) loadedCourses = ["all"]
                if (loadedBatches.length === 0) loadedBatches = ["all"]
            }

            setFormData({
                title: exam.title,
                description: exam.description || "",
                examCode: exam.exam_code,
                targetCourses: loadedCourses,
                targetBatches: loadedBatches,
                startDate: sDate,
                startTime: sTime,
                timeLimitMinutes: settings.timeLimitMinutes ?? 0,
                maxRetries: settings.maxRetries ?? 0,
                status: "Active"
            })
        } else {
            setEditingExam(null)
            setFormData({
                title: "",
                description: "",
                examCode: "",
                targetCourses: ["all"],
                targetBatches: ["all"],
                startDate: "",
                startTime: "",
                timeLimitMinutes: 0,
                maxRetries: 0,
                status: "Active"
            })
        }
        setIsModalOpen(true)
    }

    return (
        <div className="space-y-6 w-full max-w-6xl mx-auto px-4 py-4 pb-16 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
                <div>
                    <h1 className="text-2xl font-bold tracking-wider text-foreground uppercase mb-1">
                        MOCK EXAMS
                    </h1>
                    <p className="text-muted-foreground text-sm font-medium">
                        Create, schedule, and manage board examination mock exams and target courses.
                    </p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center justify-center bg-[#E9C46A] text-white font-bold text-xs tracking-wide uppercase px-5 py-2.5 rounded-lg shadow-sm hover:bg-[#dfb550] hover:-translate-y-0.5 transition-all shrink-0 self-start sm:self-auto cursor-pointer"
                >
                    ADD MOCK EXAM
                </button>
            </div>

            {/* Controls & Filter toolbar matching User Management */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[260px]">
                    {/* Search bar */}
                    <div className="relative flex-1 min-w-[220px] max-w-md">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#696969]/70 pointer-events-none" />
                        <input
                            type="search"
                            placeholder="Search title, exam code, batch, course..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-10 pl-10 pr-4 text-sm rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/10 text-[#3B3B3B] dark:text-white placeholder:text-[#696969]/60 focus:outline-none focus:ring-1.5 focus:ring-black/15 dark:focus:ring-white/20 transition-all shadow-2xs"
                        />
                    </div>

                    {/* Filter dropdowns in minimal pill style */}
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Batch Filter */}
                        <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                            <SelectTrigger
                                aria-label="Filter mock exams by batch"
                                className="h-10 rounded-xl text-xs font-normal border-black/5 dark:border-white/10 bg-white dark:bg-white/10 text-[#696969] dark:text-gray-300 shadow-2xs focus:ring-1.5 focus:ring-black/15 dark:focus:ring-white/20"
                            >
                                <div className="flex items-center gap-1.5 truncate">
                                    <span className="text-[#696969]/70 dark:text-gray-400 font-medium">Batch:</span>
                                    <span className="font-normal text-[#696969] dark:text-gray-300 truncate">
                                        {selectedBatch}
                                    </span>
                                </div>
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-black/10 dark:border-white/10 bg-white dark:bg-slate-900 shadow-xl font-normal text-xs text-[#696969] dark:text-gray-300">
                                <SelectItem value="All" className="text-xs font-normal text-[#696969] dark:text-gray-300">All</SelectItem>
                                {masterData.batches.map(b => (
                                    <SelectItem key={b.id} value={b.name} className="text-xs font-normal text-[#696969] dark:text-gray-300">{b.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Exam Type Filter */}
                        <Select value={selectedType} onValueChange={setSelectedType}>
                            <SelectTrigger
                                aria-label="Filter mock exams by type"
                                className="h-10 rounded-xl text-xs font-normal border-black/5 dark:border-white/10 bg-white dark:bg-white/10 text-[#696969] dark:text-gray-300 shadow-2xs focus:ring-1.5 focus:ring-black/15 dark:focus:ring-white/20"
                            >
                                <div className="flex items-center gap-1.5 truncate">
                                    <span className="text-[#696969]/70 dark:text-gray-400 font-medium">Type:</span>
                                    <span className="font-normal text-[#696969] dark:text-gray-300 truncate">
                                        {selectedType}
                                    </span>
                                </div>
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-black/10 dark:border-white/10 bg-white dark:bg-slate-900 shadow-xl font-normal text-xs text-[#696969] dark:text-gray-300">
                                <SelectItem value="All" className="text-xs font-normal text-[#696969] dark:text-gray-300">All</SelectItem>
                                {masterData.examinations.map(ex => (
                                    <SelectItem key={ex.id} value={ex.name} className="text-xs font-normal text-[#696969] dark:text-gray-300">{ex.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Course / Program Filter */}
                        <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                            <SelectTrigger
                                aria-label="Filter mock exams by course"
                                className="h-10 max-w-[200px] rounded-xl text-xs font-normal border-black/5 dark:border-white/10 bg-white dark:bg-white/10 text-[#696969] dark:text-gray-300 shadow-2xs focus:ring-1.5 focus:ring-black/15 dark:focus:ring-white/20"
                            >
                                <div className="flex items-center gap-1.5 truncate">
                                    <span className="text-[#696969]/70 dark:text-gray-400 font-medium">Course:</span>
                                    <span className="font-normal text-[#696969] dark:text-gray-300 truncate">
                                        {selectedCourse}
                                    </span>
                                </div>
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-black/10 dark:border-white/10 bg-white dark:bg-slate-900 shadow-xl max-w-sm font-normal text-xs text-[#696969] dark:text-gray-300">
                                <SelectItem value="All" className="text-xs font-normal text-[#696969] dark:text-gray-300">All</SelectItem>
                                {masterData.programs.map(pr => (
                                    <SelectItem key={pr.id} value={pr.name} className="text-xs font-normal text-[#696969] dark:text-gray-300 truncate">{pr.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Year Filter */}
                        <Select value={selectedYear} onValueChange={setSelectedYear}>
                            <SelectTrigger
                                aria-label="Filter mock exams by year"
                                className="h-10 rounded-xl text-xs font-normal border-black/5 dark:border-white/10 bg-white dark:bg-white/10 text-[#696969] dark:text-gray-300 shadow-2xs focus:ring-1.5 focus:ring-black/15 dark:focus:ring-white/20"
                            >
                                <div className="flex items-center gap-1.5 truncate">
                                    <span className="text-[#696969]/70 dark:text-gray-400 font-medium">Year:</span>
                                    <span className="font-normal text-[#696969] dark:text-gray-300 truncate">
                                        {selectedYear}
                                    </span>
                                </div>
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-black/10 dark:border-white/10 bg-white dark:bg-slate-900 shadow-xl font-normal text-xs text-[#696969] dark:text-gray-300">
                                <SelectItem value="All" className="text-xs font-normal text-[#696969] dark:text-gray-300">All</SelectItem>
                                {availableYears.map(yr => (
                                    <SelectItem key={yr} value={yr} className="text-xs font-normal text-[#696969] dark:text-gray-300">{yr}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {(selectedBatch !== "All" || selectedType !== "All" || selectedCourse !== "All" || selectedYear !== "All" || searchQuery.trim()) && (
                            <button
                                onClick={() => {
                                    setSelectedBatch("All")
                                    setSelectedType("All")
                                    setSelectedCourse("All")
                                    setSelectedYear("All")
                                    setSearchQuery("")
                                }}
                                className="text-xs text-[#696969] dark:text-gray-400 hover:text-[#3B3B3B] dark:hover:text-white font-medium underline underline-offset-2 self-center px-2 py-1 transition-colors cursor-pointer"
                            >
                                Reset filters
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Table Container styled exactly like User Management */}
            <div className="w-full overflow-hidden rounded-2xl border border-black/5 dark:border-white/10 bg-card shadow-2xs">
                {loading ? (
                    <div className="flex items-center justify-center p-12 bg-card">
                        <span className="text-xs font-semibold text-[#696969] uppercase tracking-widest animate-pulse">Loading Mock Exams & Master Data...</span>
                    </div>
                ) : error ? (
                    <div className="flex items-center justify-center p-12 bg-card text-destructive font-semibold uppercase text-xs">
                        {error}
                    </div>
                ) : filteredExams.length === 0 ? (
                    <div className="py-16 text-center text-sm font-medium text-[#696969]">
                        <h2 className="text-sm font-semibold text-[#3B3B3B] dark:text-white mb-1">
                            {exams.length === 0 ? "No mock exams created yet" : "No matching mock exams found"}
                        </h2>
                        <p className="text-xs text-[#696969]/80 max-w-sm mx-auto">
                            {exams.length === 0 
                                ? "Click on the ADD MOCK EXAM button above to begin creating an exam."
                                : "Try adjusting your search or active filter criteria."}
                        </p>
                    </div>
                ) : (
                    <div className="max-h-[920px] overflow-y-auto overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[760px]" aria-label="Mock exams table">
                            <thead className="sticky top-0 z-10 bg-[#F2F2F2]/80 dark:bg-[#14161b]/90 backdrop-blur-xs border-b border-black/5 dark:border-white/10">
                                <tr className="h-11 text-xs font-semibold text-[#696969]/80 dark:text-gray-400">
                                    <th className="px-4 py-2.5 max-w-[240px] whitespace-nowrap" scope="col">
                                        <SortButton label="Title" field="title" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                                    </th>
                                    <th className="px-4 py-2.5 whitespace-nowrap" scope="col">
                                        <SortButton label="Exam Code" field="exam_code" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                                    </th>
                                    <th className="px-4 py-2.5 whitespace-nowrap" scope="col">
                                        <SortButton label="Batch" field="batch" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                                    </th>
                                    <th className="px-4 py-2.5 whitespace-nowrap" scope="col">
                                        <SortButton label="Examination" field="type" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                                    </th>
                                    <th className="px-4 py-2.5 whitespace-nowrap" scope="col">
                                        <SortButton label="Course / Major" field="course" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                                    </th>
                                    <th className="px-4 py-2.5 whitespace-nowrap" scope="col">
                                        <SortButton label="Created" field="created_at" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                                    </th>
                                    <th className="px-4 py-2.5 whitespace-nowrap" scope="col">
                                        <SortButton label="Status" field="status" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                                    </th>
                                    <th className="px-4 py-2.5 text-right pr-6 whitespace-nowrap" scope="col">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-black/5 dark:divide-white/5 text-sm">
                                {filteredExams.map((exam) => {
                                    const { batch, type, course } = parseTargets(exam.targets, courseTree, masterData)
                                    const isLocked = exam.unlock_date && new Date(exam.unlock_date).getTime() > Date.now()

                                    return (
                                        <tr key={exam.id} className="h-13 transition-colors hover:bg-black/[0.015] dark:hover:bg-white/[0.02]">
                                            <td className="px-4 font-semibold max-w-[240px]">
                                                <button
                                                    onClick={() => router.push(`/admin/mock-exams/${exam.id}`)}
                                                    title={exam.title}
                                                    className="block text-left truncate whitespace-nowrap text-[#696969] dark:text-gray-300 hover:text-[#3B3B3B] dark:hover:text-white hover:underline transition-colors cursor-pointer"
                                                >
                                                    {exam.title}
                                                </button>
                                            </td>
                                            <td className="px-4 text-sm text-[#696969] dark:text-gray-300 font-normal whitespace-nowrap">{exam.exam_code || "—"}</td>
                                            <td className="px-4 text-sm text-[#696969] dark:text-gray-300 font-normal whitespace-nowrap">{batch}</td>
                                            <td className="px-4 text-sm text-[#696969] dark:text-gray-300 font-normal whitespace-nowrap max-w-[200px] truncate" title={type}>{type}</td>
                                            <td className="px-4 text-sm text-[#696969] dark:text-gray-300 font-normal whitespace-nowrap max-w-[220px] truncate" title={course}>{course}</td>
                                            <td className="px-4 text-sm text-[#696969] dark:text-gray-400 font-normal whitespace-nowrap">
                                                {exam.created_at ? new Date(exam.created_at).toLocaleDateString() : "—"}
                                            </td>
                                            <td className="px-4 text-sm whitespace-nowrap">
                                                <span className="font-normal text-[#696969] dark:text-gray-300">
                                                    {isLocked ? "Locked" : "Active"}
                                                </span>
                                            </td>
                                            <td className="px-4 text-right pr-6 whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        onClick={() => openModal(exam)}
                                                        className="h-7 w-7 flex items-center justify-center text-[#696969] hover:text-[#3B3B3B] hover:bg-black/5 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                                                        title="Edit mock exam details"
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteExam(exam)}
                                                        className="h-7 w-7 flex items-center justify-center text-[#696969] hover:text-[#3B3B3B] hover:bg-black/5 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                                                        title="Delete mock exam"
                                                    >
                                                        <Trash className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── Add/Edit Mock Exam Modal ── */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="w-full max-w-[580px] max-h-[90vh] overflow-y-auto custom-scrollbar bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
                            <div>
                                <h2 className="text-base font-semibold uppercase tracking-wider text-[#4d4d4d]">
                                    {editingExam ? "Edit Mock Exam" : "Add Mock Exam"}
                                </h2>
                                <p className="text-xs text-gray-400 font-normal mt-0.5">
                                    Configure mock exam title, code, description, schedule, time limits, and target courses
                                </p>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveMockExam} className="space-y-4">
                            {/* Title & Exam Code in Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-[#7a7a7a] uppercase mb-1">
                                        Title:
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Mock Exam Title..."
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full h-10 rounded-xl border border-gray-200 px-3 text-sm focus:outline-none focus:border-gray-400 font-medium text-gray-800"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-[#7a7a7a] uppercase mb-1">
                                        Exam Code:
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. LEPT-2026-B1-001"
                                        value={formData.examCode}
                                        onChange={e => setFormData({ ...formData, examCode: e.target.value.toUpperCase() })}
                                        className="w-full h-10 rounded-xl border border-gray-200 px-3 text-sm uppercase font-mono tracking-wide focus:outline-none focus:border-gray-400 font-medium text-gray-800"
                                        maxLength={30}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-xs font-semibold text-[#7a7a7a] uppercase mb-1">
                                    Description:
                                </label>
                                <textarea
                                    placeholder="Mock exam description and instructions..."
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm resize-none focus:outline-none focus:border-gray-400 font-medium text-gray-800"
                                />
                            </div>

                            {/* Separate Target Course and Target Batch Multi-Select Combo Boxes */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <MultiSelectDropdown
                                        label="Target Course:"
                                        placeholder="All Courses"
                                        options={masterData.examinations}
                                        selectedValues={formData.targetCourses}
                                        onChange={(vals) => setFormData({ ...formData, targetCourses: vals })}
                                    />
                                </div>
                                <div>
                                    <MultiSelectDropdown
                                        label="Target Batch:"
                                        placeholder="All Batches"
                                        options={masterData.batches.map(b => ({
                                            id: b.id,
                                            name: b.target_year ? `${b.name} (${b.target_year})` : b.name
                                        }))}
                                        selectedValues={formData.targetBatches}
                                        onChange={(vals) => setFormData({ ...formData, targetBatches: vals })}
                                    />
                                </div>
                            </div>

                            {/* ACCESS & SCHEDULE */}
                            <div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-[#7a7a7a] uppercase mb-1">
                                            Start Date:
                                        </label>
                                        <MinimalDatePicker
                                            value={formData.startDate}
                                            onChange={(dateStr) => setFormData({ ...formData, startDate: dateStr })}
                                            placeholder="Select start date..."
                                            popoverPosition="top"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-[#7a7a7a] uppercase mb-1">
                                            Start Time:
                                        </label>
                                        <MinimalTimePicker
                                            value={formData.startTime || ""}
                                            onChange={(timeStr) => setFormData({ ...formData, startTime: timeStr })}
                                        />
                                    </div>
                                </div>
                                <span className="text-xs font-normal text-gray-400 block mt-1">
                                    Leave blank to make the exam immediately available to students.
                                </span>
                            </div>

                            {/* TIME LIMIT & ATTEMPTS */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="flex flex-col gap-1">
                                    <label className="block text-xs font-semibold text-[#7a7a7a] uppercase mb-0.5">
                                        Exam Duration (Minutes):
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        max={360}
                                        placeholder="0 (Unlimited)"
                                        value={formData.timeLimitMinutes === 0 || formData.timeLimitMinutes === "" ? "" : formData.timeLimitMinutes}
                                        onChange={(e) => {
                                            const val = e.target.value
                                            setFormData({ ...formData, timeLimitMinutes: val === "" ? "" : Math.max(0, Number(val)) })
                                        }}
                                        onBlur={() => {
                                            if (formData.timeLimitMinutes === "") {
                                                setFormData(prev => ({ ...prev, timeLimitMinutes: 0 }))
                                            }
                                        }}
                                        className="w-full h-10 rounded-xl border border-gray-200 px-3 text-sm focus:outline-none focus:border-gray-400 font-medium text-gray-800"
                                    />
                                    <span className="text-xs font-normal text-gray-400">
                                        Set to 0 for unlimited duration.
                                    </span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="block text-xs font-semibold text-[#7a7a7a] uppercase mb-0.5">
                                        Allowed Retries:
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        max={10}
                                        placeholder="0"
                                        value={formData.maxRetries === 0 || formData.maxRetries === "" ? "" : formData.maxRetries}
                                        onChange={(e) => {
                                            const val = e.target.value
                                            setFormData({ ...formData, maxRetries: val === "" ? "" : Math.max(0, Number(val)) })
                                        }}
                                        onBlur={() => {
                                            if (formData.maxRetries === "") {
                                                setFormData(prev => ({ ...prev, maxRetries: 0 }))
                                            }
                                        }}
                                        className="w-full h-10 rounded-xl border border-gray-200 px-3 text-sm focus:outline-none focus:border-gray-400 font-medium text-gray-800"
                                    />
                                    <span className="text-xs font-normal text-gray-400">
                                        0 = single attempt only.
                                    </span>
                                </div>
                            </div>

                            {/* Action Buttons Footer */}
                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 mt-5">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="rounded-lg px-4 py-2 text-xs font-semibold text-gray-500 border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving || !formData.title.trim() || !formData.examCode.trim()}
                                    className="bg-[#E9C46A] hover:bg-[#dfb550] disabled:opacity-50 text-white text-xs font-semibold px-4 py-1.5 rounded-xl shadow-2xs transition-all flex items-center justify-center cursor-pointer"
                                >
                                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
                                    <span>{saving ? "Saving..." : (editingExam ? "Save Changes" : "Save Exam")}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Reusable Confirm Delete Modal */}
            <ConfirmDeleteModal 
                isOpen={deleteModal.isOpen}
                title={deleteModal.title}
                description={deleteModal.description}
                isDeleting={deleteModal.isDeleting}
                onConfirm={deleteModal.onConfirm}
                onCancel={() => setDeleteModal(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    )
}
