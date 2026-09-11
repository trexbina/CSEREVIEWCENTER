// this tells nextjs to run this gradebook component in the browser
"use client"

// helper tools from react to handle state and lifecycle
import React, { useState, useMemo, useEffect, useCallback, useRef } from "react"

// animation helpers for smooth view transitions
import { motion } from "motion/react"

// small icons used for buttons and cards
import { Trash, Plus, Save, Clock, Settings, X, ArrowLeft, Calculator, Check, ChevronDown, ChevronRight, Maximize2, Minimize2, Pencil, Printer, Download, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"

// table styling helpers
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// confirmation modal popup for delete actions
import ConfirmDeleteModal from "@/components/confirm-delete-modal"
import { toast } from "@/components/ui/toast"

// helper function to turn batches exams programs and majors into an organized tree structure
function buildCourseTreeFromMasterData({ batches = [], examinations = [], programs = [], majors = [] }) {
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
        entityType: "exam",
        rawId: exam.id,
        label: exam.name,
        children: examPrograms.map(prog => {
          const progMajors = majors.filter(m => m.program_id === prog.id)
          return {
            id: `batch_${batchId}_prog_${prog.id}`,
            entityType: "program",
            rawId: prog.id,
            label: prog.name,
            children: progMajors.map(maj => ({
              id: `batch_${batchId}_maj_${maj.id}`,
              entityType: "major",
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
      entityType: "batch",
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
        entityType: "exam",
        rawId: exam.id,
        label: exam.name,
        children: examPrograms.map(prog => {
          const progMajors = majors.filter(m => m.program_id === prog.id)
          return {
            id: `prog_${prog.id}`,
            entityType: "program",
            rawId: prog.id,
            label: prog.name,
            children: progMajors.map(maj => ({
              id: `maj_${maj.id}`,
              entityType: "major",
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
    selfIds.forEach(id => next.delete(id))
  } else {
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

function TreeRow({ node, selected, onToggle, depth = 0 }) {
  const [open, setOpen] = useState(depth === 0)
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

      {open && (
        <div className="absolute z-50 mt-1.5 w-full bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-2 border-b border-gray-100 bg-gray-50">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Select Target Courses</span>
          </div>

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

const DEFAULT_STATUS_RULES = [
  { min: 80, max: 100, label: "SUPERIOR / IT PREPARED", bg: "bg-[#fbcfe8] text-[#be185d]", border: "border-pink-200" },
  { min: 70, max: 79.89, label: "ADEQUATELY PREPARED", bg: "bg-[#bfdbfe] text-[#dfb550]", border: "border-blue-200" },
  { min: 60, max: 69.99, label: "NEEDS REINFORCEMENT", bg: "bg-[#bbf7d0] text-[#15803d]", border: "border-green-200" },
  { min: 0, max: 59.99, label: "FOR MONITORING", bg: "bg-[#fef08a] text-[#a16207]", border: "border-yellow-200" },
]

const getStatusAndStyleFromRules = (percent, rules = DEFAULT_STATUS_RULES) => {
  const numPct = Number(percent) || 0
  for (const rule of rules) {
    if (numPct >= Number(rule.min) && numPct <= Number(rule.max)) {
      return { status: rule.label, bg: rule.bg, border: rule.border }
    }
  }
  if (numPct >= (Number(rules[0]?.min) || 80)) return { status: rules[0].label, bg: rules[0].bg, border: rules[0].border }
  if (numPct >= (Number(rules[1]?.min) || 70)) return { status: rules[1].label, bg: rules[1].bg, border: rules[1].border }
  if (numPct >= (Number(rules[2]?.min) || 60)) return { status: rules[2].label, bg: rules[2].bg, border: rules[2].border }
  return { status: rules[3]?.label || "FOR MONITORING", bg: rules[3]?.bg || "bg-[#fef08a] text-[#a16207]", border: rules[3]?.border || "border-yellow-200" }
}

// ── SPREADSHEET VIEW ──
const SpreadsheetView = ({ gradebookId, onBack }) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [localScores, setLocalScores] = useState({})
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Status Reference editable rules state
  const [statusRules, setStatusRules] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("gradebook_status_rules")
      if (saved) {
        try { return JSON.parse(saved) } catch (e) {}
      }
    }
    return DEFAULT_STATUS_RULES
  })
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false)
  const [tempRules, setTempRules] = useState(statusRules)

  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isFullscreen])

  const fetchGradebookData = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/gradebook/${gradebookId}`)
      if (!res.ok) throw new Error("Failed")
      const json = await res.json()
      setData(json)
      // Initialize local scores from server
      const scores = {}
      for (const student of json.students) {
        scores[student.id] = {}
        for (const mock of json.mockExams) {
          const serverScore = json.scoresMap?.[student.id]?.[mock.id]
          scores[student.id][mock.id] = {
            score: serverScore?.score ?? "",
            maxScore: (serverScore?.maxScore ?? parseInt(mock.question_count)) || 0
          }
        }
      }
      setLocalScores(scores)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [gradebookId])

  useEffect(() => { fetchGradebookData() }, [fetchGradebookData])

  const handleScoreChange = (studentId, mockId, val) => {
    setLocalScores(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], [mockId]: { ...prev[studentId]?.[mockId], score: val === "" ? "" : Number(val) } }
    }))
  }

  const handleSave = async () => {
    if (!data) return
    setSaving(true)
    try {
      const allScores = []
      for (const student of data.students) {
        for (const mock of data.mockExams) {
          const cell = localScores[student.id]?.[mock.id]
          if (cell && cell.score !== "" && cell.score !== undefined) {
            allScores.push({ studentId: student.id, mockExamId: mock.id, score: cell.score, maxScore: cell.maxScore || parseInt(mock.question_count) || 0 })
          }
        }
      }
      await fetch(`/api/admin/gradebook/${gradebookId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "SAVE_ALL", scores: allScores })
      })
      alert("Saved successfully!")
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  const handleAddMockExam = async (mockExamId) => {
    try {
      const res = await fetch(`/api/admin/gradebook/${gradebookId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ADD_MOCK_EXAM", mockExamId })
      })
      if (!res.ok) throw new Error("Failed to add mock exam")
      await fetchGradebookData()
    } catch (e) {
      console.error(e)
      alert("Error adding exam: " + e.message)
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

  const triggerDelete = (title, description, onConfirmAction) => {
    setDeleteModal({
      isOpen: true,
      title,
      description,
      onConfirm: async () => {
        setDeleteModal(prev => ({ ...prev, isDeleting: true }))
        try {
          await onConfirmAction()
        } finally {
          setDeleteModal({ isOpen: false, title: "", description: "", onConfirm: null, isDeleting: false })
        }
      },
      isDeleting: false
    })
  }

  const handleRemoveMockExam = (mockExamId) => {
    triggerDelete(
      "Remove Exam Column",
      "Are you sure you want to remove this exam column? This will untarget this batch from the exam, but will not delete any stored scores.",
      async () => {
        try {
          const res = await fetch(`/api/admin/gradebook/${gradebookId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "REMOVE_MOCK_EXAM", mockExamId })
          })
          if (!res.ok) throw new Error("Failed to remove mock exam")
          await fetchGradebookData()
        } catch (e) {
          console.error(e)
          alert("Error removing exam: " + e.message)
        }
      }
    )
  }

  const handleSaveRules = () => {
    setStatusRules(tempRules)
    if (typeof window !== "undefined") {
      localStorage.setItem("gradebook_status_rules", JSON.stringify(tempRules))
    }
    setIsRulesModalOpen(false)
  }

  const handleExportCSV = () => {
    if (!data?.students || data.students.length === 0) return
    const mockExamsList = data.mockExams || []

    const examTitles = mockExamsList.map((m) => `"${m.title.replace(/"/g, '""')}"`)
    const headers = ["\"#\"", "\"STUDENT NAME\"", "\"SCHOOL\"", ...examTitles, "\"TOTAL SCORE\"", "\"PERCENTAGE (%)\"", "\"STATUS\""].join(",")

    const totalMax = mockExamsList.reduce((s, m) => s + (parseInt(m.question_count) || 0), 0)

    const rows = data.students.map((student, ri) => {
      const examScores = mockExamsList.map((m) => {
        const val = localScores[student.id]?.[m.id]?.score
        return val === undefined || val === "" ? "0" : String(val)
      })
      const totalScore = mockExamsList.reduce((s, m) => {
        const v = localScores[student.id]?.[m.id]?.score
        return s + (v === "" || v === undefined ? 0 : Number(v))
      }, 0)
      const pct = totalMax > 0 ? (totalScore / totalMax) * 100 : 0
      const { status } = getStatusAndStyleFromRules(pct, statusRules)

      return [
        `"${ri + 1}"`,
        `"${(student.name || "").replace(/"/g, '""')}"`,
        `"${(student.school_name || "").replace(/"/g, '""')}"`,
        ...examScores,
        `"${totalScore}"`,
        `"${pct.toFixed(2)}%"`,
        `"${status.replace(/"/g, '""')}"`,
      ].join(",")
    })

    const csvString = [headers, ...rows].join("\n")
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", `${(data.gradebook?.name || "gradebook").replace(/[^a-zA-Z0-9_-]/g, "_")}_report.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) return <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">Loading spreadsheet...</div>
  if (!data) return <div className="text-center py-20 text-red-500">Failed to load gradebook data.</div>

  const mockExams = data.mockExams || []
  const students = data.students || []
  const allSystemMockExams = data.allSystemMockExams || []
  const availableExams = allSystemMockExams.filter(se => !mockExams.some(m => m.id === se.id))

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="fixed inset-0 z-50 bg-background p-6 md:p-8 flex flex-col h-screen w-screen overflow-hidden gap-4"
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-4 pb-3 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack} 
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card hover:bg-muted text-foreground border border-border transition-all cursor-pointer shadow-2xs font-medium text-xs active:scale-95" 
            title="Back to Master Data"
          >
            <ChevronRight className="h-4 w-4 rotate-180 text-muted-foreground" />
            <span>Back</span>
          </button>
          <div>
            <h2 className="text-xl font-bold text-foreground">
              {data.gradebook.name}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              <span className="font-mono bg-muted/60 text-foreground px-2 py-0.5 rounded text-xs border border-border">{data.gradebook.code}</span>
              <span className="ml-2">{data.batch?.batch_name} / {data.batch?.target_year} — {data.batch?.exam_name}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="text-xs text-muted-foreground font-semibold mr-1">{students.length} students · {mockExams.length} exams</span>
          
          <button 
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 bg-card hover:bg-muted text-foreground border border-border font-medium px-3.5 py-2 rounded-xl text-xs shadow-2xs transition-all cursor-pointer active:scale-95"
            title="Export Gradebook Report to CSV"
          >
            <Download className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Export CSV</span>
          </button>

          <button 
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 bg-card hover:bg-muted text-foreground border border-border font-medium px-3.5 py-2 rounded-xl text-xs shadow-2xs transition-all cursor-pointer active:scale-95"
            title="Print or Save PDF Report"
          >
            <Printer className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Print Report</span>
          </button>

          <button 
            onClick={handleSave} 
            disabled={saving}
            className="bg-[#E9C46A] hover:bg-[#dfb550] disabled:opacity-50 text-white text-xs font-semibold px-4 py-1.5 rounded-xl shadow-2xs transition-all flex items-center justify-center cursor-pointer"
          >
            {saving ? <Clock className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
            <span>{saving ? "Saving..." : "Save Changes"}</span>
          </button>
        </div>
      </div>

      {/* Spreadsheet Full-Width Table (Fills Remaining Vertical Space) */}
      <div className="flex-1 w-full overflow-auto border border-border rounded-2xl bg-card shadow-sm min-h-0">
        <table className="w-full min-w-[800px] border-collapse text-left bg-card">
          <thead className="sticky top-0 z-10 shadow-xs">
            <tr className="h-10 bg-muted border-b border-border text-xs font-semibold text-foreground text-center select-none">
              <td className="border-r border-border bg-muted/90 text-xs text-muted-foreground font-medium">#</td>
              <td className="border-r border-border text-left px-4 min-w-[180px]">Student Name</td>
              <td className="border-r border-border text-left px-4 min-w-[140px]">School</td>
              {mockExams.map((m) => (
                <td key={m.id} className="border-r border-border px-3 min-w-[110px] relative group" title={m.title}>
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="font-semibold text-foreground">{m.title?.length > 14 ? m.title.slice(0, 14) + "…" : m.title}</span>
                    <button 
                      onClick={() => handleRemoveMockExam(m.id)} 
                      title="Remove exam column" 
                      className="text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </td>
              ))}
              {/* Select Exam Column Header */}
              <td className="border-r border-border p-0 min-w-[130px] bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer text-center relative group">
                {availableExams.length > 0 ? (
                  <div className="relative flex items-center justify-center w-full h-full px-2 py-1.5">
                    <select 
                      onChange={(e) => {
                        if (e.target.value) {
                          handleAddMockExam(e.target.value);
                          e.target.value = "";
                        }
                      }}
                      className="w-full bg-transparent border-0 outline-none text-xs text-[#E9C46A] font-bold cursor-pointer text-center appearance-none pr-5 py-1"
                    >
                      <option value="" className="text-muted-foreground font-normal">Select Exam</option>
                      {availableExams.map(ae => (
                        <option key={ae.id} value={ae.id} className="text-foreground font-medium">
                          {ae.title} ({ae.exam_code})
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity">
                      <ChevronDown className="h-3.5 w-3.5 text-[#E9C46A]" />
                    </div>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground italic font-medium px-2">No more exams</span>
                )}
              </td>
              <td className="border-r border-border min-w-[70px]">Total</td>
              <td className="border-r border-border min-w-[70px]">%</td>
              <td className="min-w-[160px] px-3">Status</td>
            </tr>
            {/* Max scores row */}
            <tr className="h-8 border-b border-border text-xs font-medium text-center bg-muted/50 text-muted-foreground">
              <td className="border-r border-border bg-muted/70 text-[10px] font-semibold text-muted-foreground">MAX</td>
              <td className="border-r border-border"></td>
              <td className="border-r border-border"></td>
              {mockExams.map(m => (
                <td key={m.id} className="border-r border-border text-muted-foreground font-semibold">{parseInt(m.question_count) || "—"}</td>
              ))}
              {/* Placeholder max cell for Select Exam column */}
              <td className="border-r border-border bg-muted/20 text-muted-foreground/40 font-bold">—</td>
              <td className="border-r border-border font-semibold text-foreground">{mockExams.reduce((s, m) => s + (parseInt(m.question_count) || 0), 0)}</td>
              <td className="border-r border-border"></td>
              <td></td>
            </tr>
          </thead>
          <tbody className="text-xs">
            {students.map((student, ri) => {
              const totalMax = mockExams.reduce((s, m) => s + (parseInt(m.question_count) || 0), 0)
              const totalScore = mockExams.reduce((s, m) => {
                const v = localScores[student.id]?.[m.id]?.score
                return s + (v === "" || v === undefined ? 0 : Number(v))
              }, 0)
              const pct = totalMax > 0 ? (totalScore / totalMax) * 100 : 0
              const { status, bg } = getStatusAndStyleFromRules(pct, statusRules)
              return (
                <tr key={student.id} className="h-11 border-b border-border hover:bg-muted/10 transition-colors">
                  <td className="border-r border-border bg-muted/20 text-center text-xs text-muted-foreground select-none font-medium">{ri + 1}</td>
                  <td className="border-r border-border px-4 font-medium text-foreground">{student.name}</td>
                  <td className="border-r border-border px-4 text-muted-foreground">{student.school_name}</td>
                  {mockExams.map(m => {
                    const val = localScores[student.id]?.[m.id]?.score
                    return (
                      <td key={m.id} className="border-r border-border px-1 text-center">
                        <input 
                          type="number" 
                          value={val === undefined ? "" : val}
                          onChange={e => handleScoreChange(student.id, m.id, e.target.value)}
                          className="w-full text-center bg-transparent border-0 outline-none focus:bg-card focus:ring-1 focus:ring-primary rounded py-1 text-foreground font-semibold transition-all" 
                          placeholder="—" 
                        />
                      </td>
                    )
                  })}
                  {/* Placeholder cell for student row under Select Exam column */}
                  <td className="border-r border-border bg-muted/10 text-center text-muted-foreground/40 font-bold">—</td>
                  <td className="border-r border-border font-bold text-center text-foreground bg-muted/10">{totalScore}</td>
                  <td className="border-r border-border text-center font-semibold text-foreground bg-muted/10">{pct.toFixed(2)}%</td>
                  <td className={`text-center font-bold text-[11px] px-2 select-none ${bg}`}>
                    {status}
                  </td>
                </tr>
              )
            })}

            {/* Empty Excel Spreadsheet Rows to fill remaining space */}
            {Array.from({ length: Math.max(16 - students.length, 6) }).map((_, i) => {
              const rowNum = students.length + i + 1
              return (
                <tr key={`empty-row-${rowNum}`} className="h-11 border-b border-border hover:bg-muted/5 transition-colors">
                  <td className="border-r border-border bg-muted/15 text-center text-xs text-muted-foreground/50 select-none font-medium">
                    {rowNum}
                  </td>
                  <td className="border-r border-border px-4"></td>
                  <td className="border-r border-border px-4"></td>
                  {mockExams.map((m) => (
                    <td key={m.id} className="border-r border-border px-1 text-center"></td>
                  ))}
                  {/* Empty cell under Select Exam column */}
                  <td className="border-r border-border bg-muted/5"></td>
                  <td className="border-r border-border bg-muted/5"></td>
                  <td className="border-r border-border bg-muted/5"></td>
                  <td></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Status Reference Bar (Pinned at Bottom) */}
      <div className="w-full border border-border rounded-2xl overflow-hidden bg-card shadow-sm shrink-0">
        <div className="bg-card px-5 py-2.5 border-b border-border flex items-center justify-between select-none">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-foreground">Status Reference</span>
            <span className="text-xs text-muted-foreground hidden sm:inline">• Performance rating tiers and formulas</span>
          </div>
          <button 
            type="button"
            onClick={() => {
              setTempRules(JSON.parse(JSON.stringify(statusRules)))
              setIsRulesModalOpen(true)
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-all cursor-pointer text-xs font-medium border border-border/60"
            title="Edit Formula Percentage & Status Text"
          >
            <Pencil className="h-3.5 w-3.5" />
            <span>Edit Rules</span>
          </button>
        </div>
        <div className="p-3.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-card">
          {statusRules.map((rule, idx) => (
            <div key={idx} className={`p-3 rounded-xl ${rule.bg} border ${rule.border} flex flex-col gap-0.5 shadow-2xs`}>
              <div className="text-[10px] font-bold opacity-75 uppercase tracking-wide">
                {Number(rule.min).toFixed(2)}% – {Number(rule.max).toFixed(2)}%
              </div>
              <div className="text-xs font-bold">{rule.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Status Rules Modal */}
      {isRulesModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-card px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                Edit Status Reference Rules
              </h3>
              <button onClick={() => setIsRulesModalOpen(false)} className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-colors cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto bg-card">
              <p className="text-xs text-muted-foreground">
                Customize percentage range thresholds and status text. Grades will automatically recalculate according to your updated formulas.
              </p>

              {tempRules.map((rule, idx) => (
                <div key={idx} className="p-3.5 rounded-xl border border-border space-y-3 bg-muted/20">
                  <div className="flex items-center justify-between text-xs font-bold text-foreground">
                    <span>Tier {idx + 1} Status Rule</span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${rule.bg} border ${rule.border}`}>{rule.label}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Min Score %</label>
                      <input 
                        type="number" 
                        step="0.01"
                        value={rule.min} 
                        onChange={(e) => {
                          const updated = [...tempRules]
                          updated[idx].min = parseFloat(e.target.value) || 0
                          setTempRules(updated)
                        }}
                        className="w-full text-xs h-9 px-3 bg-card border border-border rounded-lg font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Max Score %</label>
                      <input 
                        type="number" 
                        step="0.01"
                        value={rule.max} 
                        onChange={(e) => {
                          const updated = [...tempRules]
                          updated[idx].max = parseFloat(e.target.value) || 0
                          setTempRules(updated)
                        }}
                        className="w-full text-xs h-9 px-3 bg-card border border-border rounded-lg font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary" 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Status Reference Text</label>
                    <input 
                      type="text" 
                      value={rule.label} 
                      onChange={(e) => {
                        const updated = [...tempRules]
                        updated[idx].label = e.target.value
                        setTempRules(updated)
                      }}
                      className="w-full text-xs h-9 px-3 bg-card border border-border rounded-lg font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary" 
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-muted/30 px-6 py-4 flex justify-end gap-2.5 border-t border-border">
              <button 
                onClick={() => setIsRulesModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveRules}
                className="px-5 py-2 text-xs font-bold bg-[#E9C46A] hover:bg-[#dfb550] text-white rounded-xl shadow-sm transition-all cursor-pointer active:scale-95"
              >
                Save Rules & Formulas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reusable Confirm Delete Modal inside SpreadsheetView */}
      <ConfirmDeleteModal 
        isOpen={deleteModal.isOpen}
        title={deleteModal.title}
        description={deleteModal.description}
        isDeleting={deleteModal.isDeleting}
        onConfirm={deleteModal.onConfirm}
        onCancel={() => setDeleteModal(prev => ({ ...prev, isOpen: false }))}
      />
    </motion.div>
  )
}

// main gradebook view component
const GradebookView = ({ onBack, batches = [], tree = [], schools = [], gradebooks = [], fetchData, apiCall, programs = [], majors = [] }) => {
  // gradebook selected to build or edit formulas
  const [buildGradebookId, setBuildGradebookId] = useState(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [form, setForm] = useState({ id: "", name: "", code: "", batch_id: "", exam_id: "", targets: [], status: "ACTIVE" })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // organize all courses into a hierarchical tree
  const courseTree = useMemo(() => {
    const examinations = tree.map(e => ({ id: e.id, name: e.name }))
    return buildCourseTreeFromMasterData({
      batches,
      examinations,
      programs,
      majors
    })
  }, [batches, tree, programs, majors])

  // delete confirmation popup state
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    title: "Confirm Deletion",
    description: "Are you sure you want to delete this item? This action cannot be undone.",
    onConfirm: null,
    isDeleting: false
  })

  // helper function to open the delete confirmation popup
  const triggerDelete = (title, description, onConfirmAction) => {
    setDeleteModal({
      isOpen: true,
      title,
      description,
      onConfirm: async () => {
        setDeleteModal(prev => ({ ...prev, isDeleting: true }))
        try {
          await onConfirmAction()
        } finally {
          setDeleteModal({ isOpen: false, title: "", description: "", onConfirm: null, isDeleting: false })
        }
      },
      isDeleting: false
    })
  }

  // filters and sorting state
  const [filterExam, setFilterExam] = useState("all")
  const [filterBatch, setFilterBatch] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [sortField, setSortField] = useState("name")
  const [sortDir, setSortDir] = useState("asc")

  // handles sorting columns when clicking table headers
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(prev => prev === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDir("asc")
    }
  }

  const filteredGradebooks = useMemo(() => {
    let result = (gradebooks || []).filter(gb => {
      if (filterExam !== "all" && gb.exam_id !== parseInt(filterExam)) return false
      if (filterBatch !== "all" && gb.batch_id !== parseInt(filterBatch)) return false
      if (filterStatus !== "all" && gb.status?.toLowerCase() !== filterStatus.toLowerCase()) return false
      return true
    })

    result.sort((a, b) => {
      let valA = ""
      let valB = ""
      if (sortField === "name") {
        valA = (a.name || "").toLowerCase()
        valB = (b.name || "").toLowerCase()
      } else if (sortField === "code") {
        valA = (a.code || "").toLowerCase()
        valB = (b.code || "").toLowerCase()
      } else if (sortField === "batch") {
        valA = (a.batch_name || "").toLowerCase()
        valB = (b.batch_name || "").toLowerCase()
      } else if (sortField === "exam") {
        valA = (a.exam_name || "").toLowerCase()
        valB = (b.exam_name || "").toLowerCase()
      } else if (sortField === "students") {
        valA = a.student_count || 0
        valB = b.student_count || 0
      } else if (sortField === "created_at") {
        valA = new Date(a.created_at).getTime() || 0
        valB = new Date(b.created_at).getTime() || 0
      } else if (sortField === "status") {
        valA = (a.status || "").toLowerCase()
        valB = (b.status || "").toLowerCase()
      }

      if (valA < valB) return sortDir === "asc" ? -1 : 1
      if (valA > valB) return sortDir === "asc" ? 1 : -1
      return 0
    })

    return result
  }, [gradebooks, filterExam, filterBatch, filterStatus, sortField, sortDir])

  const SortButton = ({ label, field, sortField, sortDir, onSort }) => {
    const active = sortField === field
    return (
      <button
        onClick={() => onSort(field)}
        className="flex items-center gap-1 hover:text-foreground transition-colors font-semibold cursor-pointer text-foreground select-none"
      >
        <span>{label}</span>
        <span className="flex flex-col text-[10px] leading-[8px] opacity-70">
          {active ? (
            sortDir === "asc" ? <ArrowUp className="h-3 w-3 text-primary stroke-[2.5]" /> : <ArrowDown className="h-3 w-3 text-primary stroke-[2.5]" />
          ) : (
            <ArrowUpDown className="h-3 w-3 opacity-40 hover:opacity-100 transition-opacity" />
          )}
        </span>
      </button>
    )
  }

  const handleOpenAdd = () => {
    setForm({ id: "", name: "", code: "", batch_id: "", exam_id: "", targets: [], status: "ACTIVE" })
    setIsEdit(false)
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (gb) => {
    let initialTargets = []
    if (gb.targets) {
      try {
        initialTargets = typeof gb.targets === "string" ? JSON.parse(gb.targets) : gb.targets
      } catch (e) { initialTargets = [] }
    }
    if (!Array.isArray(initialTargets) || initialTargets.length === 0) {
      if (gb.batch_id) initialTargets = [`batch_${gb.batch_id}`]
    }

    setForm({
      id: gb.id,
      name: gb.name,
      code: gb.code,
      batch_id: gb.batch_id,
      exam_id: gb.exam_id,
      targets: initialTargets,
      status: gb.status
    })
    setIsEdit(true)
    setIsDialogOpen(true)
  }

  const handleTargetsChange = (newSelectedSet) => {
    const targetsArray = Array.from(newSelectedSet)
    let derivedBatchId = form.batch_id
    let derivedExamId = form.exam_id

    for (const t of targetsArray) {
      const match = String(t).match(/^batch_(\d+)/)
      if (match) {
        derivedBatchId = match[1]
        const b = batches.find(x => x.id === parseInt(match[1]))
        if (b) derivedExamId = b.exam_id
        break
      }
    }

    setForm(prev => ({
      ...prev,
      targets: targetsArray,
      batch_id: derivedBatchId,
      exam_id: derivedExamId
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.code.trim()) return
    if (!form.targets || form.targets.length === 0) {
      alert("Please select at least one target course or batch.")
      return
    }

    let finalBatchId = form.batch_id
    if (!finalBatchId) {
      for (const t of form.targets) {
        const match = String(t).match(/^batch_(\d+)/)
        if (match) {
          finalBatchId = match[1]
          break
        }
      }
    }

    if (!finalBatchId && batches.length > 0) {
      finalBatchId = batches[0].id
    }

    const payload = {
      ...form,
      batch_id: finalBatchId
    }

    setIsSubmitting(true)
    try {
      let res
      if (isEdit) {
        res = await apiCall("UPDATE", "GRADEBOOK", payload)
      } else {
        res = await apiCall("ADD", "GRADEBOOK", payload)
      }
      if (res && res.error) {
        alert("Failed to save: " + res.error)
        return
      }
      await fetchData()
      setIsDialogOpen(false)
    } catch (err) { 
      console.error(err) 
      alert("An unexpected error occurred.")
    } finally { 
      setIsSubmitting(false) 
    }
  }

  const handleDelete = (id, gbName = "this gradebook") => {
    triggerDelete(
      "Delete Gradebook",
      `Are you sure you want to delete "${gbName}"? All calculated readiness records for this gradebook will be permanently removed. This cannot be undone.`,
      async () => {
        await apiCall("DELETE", "GRADEBOOK", { id })
        await fetchData()
        toast("Successfully moved gradebook to trash.")
      }
    )
  }

  // If building, show spreadsheet
  if (buildGradebookId) {
    return <SpreadsheetView gradebookId={buildGradebookId} onBack={() => setBuildGradebookId(null)} />
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
      <div className="w-full bg-card border border-border/40 rounded-2xl p-6 shadow-xs">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4 pb-4 mb-6 border-b border-border/40">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer" title="Back to Master Data">
              <ChevronRight className="h-5 w-5 rotate-180" />
            </button>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-foreground truncate">
                Gradebooks
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">Configure grade formulas, weights, and student readiness scores.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-medium text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full">
              {gradebooks.length} {gradebooks.length === 1 ? "Gradebook" : "Gradebooks"}
            </span>
            <button onClick={handleOpenAdd} className="bg-[#E9C46A] hover:bg-[#dfb550] text-white font-semibold py-1.5 px-3.5 rounded-lg transition-all text-xs cursor-pointer active:scale-95">
              Add Gradebook
            </button>
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {/* Target Examination Filter */}
          <div className="relative inline-flex items-center gap-1.5 bg-muted/30 border border-border/40 rounded-lg px-2.5 py-1 text-xs font-medium text-foreground">
            <span className="text-muted-foreground font-normal">Exam:</span>
            <select 
              value={filterExam} 
              onChange={e => setFilterExam(e.target.value)}
              className="bg-transparent font-medium text-foreground outline-none cursor-pointer pr-1"
            >
              <option value="all">All</option>
              {tree.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>

          {/* Batch Filter */}
          <div className="relative inline-flex items-center gap-1.5 bg-muted/30 border border-border/40 rounded-lg px-2.5 py-1 text-xs font-medium text-foreground">
            <span className="text-muted-foreground font-normal">Batch:</span>
            <select 
              value={filterBatch} 
              onChange={e => setFilterBatch(e.target.value)}
              className="bg-transparent font-medium text-foreground outline-none cursor-pointer pr-1"
            >
              <option value="all">All</option>
              {batches.map(b => <option key={b.id} value={b.id}>{b.name} / {b.target_year}</option>)}
            </select>
          </div>

          {/* Status Filter */}
          <div className="relative inline-flex items-center gap-1.5 bg-muted/30 border border-border/40 rounded-lg px-2.5 py-1 text-xs font-medium text-foreground">
            <span className="text-muted-foreground font-normal">Status:</span>
            <select 
              value={filterStatus} 
              onChange={e => setFilterStatus(e.target.value)}
              className="bg-transparent font-medium text-foreground outline-none cursor-pointer pr-1"
            >
              <option value="all">All</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          {(filterExam !== "all" || filterBatch !== "all" || filterStatus !== "all") && (
            <button
              onClick={() => {
                setFilterExam("all")
                setFilterBatch("all")
                setFilterStatus("all")
              }}
              className="text-xs text-[#E9C46A] hover:underline self-center px-1 cursor-pointer"
            >
              Reset filters
            </button>
          )}
        </div>

        {/* Gradebooks Table */}
        <div className="min-h-[220px] flex flex-col">
          {filteredGradebooks.length > 0 ? (
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/40 text-xs font-medium text-muted-foreground">
                    <th className="py-2.5 px-4 w-[22%]" scope="col">
                      <SortButton label="Gradebook Title" field="name" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    </th>
                    <th className="py-2.5 px-3 w-[13%]" scope="col">
                      <SortButton label="Exam Code" field="code" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    </th>
                    <th className="py-2.5 px-3 w-[14%]" scope="col">
                      <SortButton label="Batch / Target" field="batch" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    </th>
                    <th className="py-2.5 px-3 w-[11%]" scope="col">
                      <SortButton label="Type" field="exam" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    </th>
                    <th className="py-2.5 px-3 w-[12%]" scope="col">
                      <SortButton label="Students" field="students" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    </th>
                    <th className="py-2.5 px-3 w-[12%]" scope="col">
                      <SortButton label="Date Created" field="created_at" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    </th>
                    <th className="py-2.5 px-3 w-[9%]" scope="col">
                      <SortButton label="Status" field="status" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    </th>
                    <th className="py-2.5 px-4 w-[7%] text-right font-medium text-muted-foreground" scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {filteredGradebooks.map(gb => (
                    <tr key={gb.id} className="border-b border-border/30 last:border-b-0 hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-4 text-[#4382DF] whitespace-nowrap font-medium cursor-pointer hover:underline" onClick={() => setBuildGradebookId(gb.id)}>
                        {gb.name}
                      </td>
                      <td className="py-3 px-3 text-foreground whitespace-nowrap">{gb.code}</td>
                      <td className="py-3 px-3 text-foreground whitespace-nowrap">
                        {gb.batch_name} / {gb.target_year}
                      </td>
                      <td className="py-3 px-3 text-foreground whitespace-nowrap uppercase">{gb.exam_name || "—"}</td>
                      <td className="py-3 px-3 text-foreground whitespace-nowrap">
                        {gb.student_count || 0} enrolled
                      </td>
                      <td className="py-3 px-3 text-foreground whitespace-nowrap">{new Date(gb.created_at).toLocaleDateString()}</td>
                      <td className="py-3 px-3 text-foreground whitespace-nowrap">
                        <span className={gb.status === "ACTIVE" ? "text-emerald-600 font-medium" : "text-gray-500 font-medium"}>
                          {gb.status === "ACTIVE" ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button onClick={() => handleOpenEdit(gb)} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer" title="Edit"><Pencil className="h-3.5 w-3.5" /></button>
                          <button onClick={() => handleDelete(gb.id, gb.name)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors cursor-pointer" title="Delete"><Trash className="h-3.5 w-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
              <p className="text-sm font-semibold text-foreground mb-1">
                {gradebooks.length === 0 ? "No Gradebooks Yet" : "No Matching Gradebooks"}
              </p>
              <p className="text-xs text-muted-foreground">
                {gradebooks.length === 0 
                  ? "Click on the add gradebook button above to create your first gradebook."
                  : "Try adjusting your filter criteria to view other gradebooks."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Dialog */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-[560px] bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 animate-in zoom-in-95 duration-200 overflow-visible relative">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
                <div>
                  <h3 className="text-base font-semibold uppercase tracking-wider text-[#4d4d4d]">{isEdit ? "Edit Gradebook" : "Create Gradebook"}</h3>
                  <p className="text-xs text-gray-400 font-normal mt-0.5">Configure gradebook title, code, and target courses/batches</p>
                </div>
                <button type="button" onClick={() => setIsDialogOpen(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#7a7a7a] uppercase mb-1">Gradebook Name</label>
                  <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. LEPT EXAM" className="w-full h-10 bg-white border border-gray-200 rounded-xl px-3.5 text-sm text-gray-800 focus:outline-none focus:border-gray-400 font-medium" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#7a7a7a] uppercase mb-1">Gradebook Code</label>
                  <input type="text" required value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="e.g. LEPT-2026-B1" className="w-full h-10 bg-white border border-gray-200 rounded-xl px-3.5 text-sm uppercase font-mono tracking-wide text-gray-800 focus:outline-none focus:border-gray-400 font-medium" />
                </div>
              </div>

              <div className="relative">
                <label className="block text-xs font-semibold text-[#7a7a7a] uppercase mb-1">Target Courses / Batch</label>
                <CourseMultiSelect 
                  selected={form.targets || []} 
                  onChange={handleTargetsChange} 
                  tree={courseTree} 
                />
                <p className="text-xs text-gray-400 mt-1">Students enrolled in the selected batches, programs, or majors will automatically appear in this gradebook.</p>
              </div>

              {isEdit && (
                <div>
                  <label className="block text-xs font-semibold text-[#7a7a7a] uppercase mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full h-10 bg-white border border-gray-200 rounded-xl px-3 text-sm text-gray-800 focus:outline-none focus:border-gray-400 font-medium cursor-pointer">
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              )}

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2.5">
                <button type="button" onClick={() => setIsDialogOpen(false)} className="px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="bg-[#E9C46A] hover:bg-[#dfb550] text-white font-bold text-xs uppercase px-5 py-2 rounded-xl shadow-sm transition-all cursor-pointer active:scale-95 flex items-center gap-1.5">
                  <Save className="h-3.5 w-3.5" />
                  {isSubmitting ? "Submitting..." : isEdit ? "Save Details" : "Create Gradebook"}
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
    </motion.div>
  )
}

export default GradebookView
