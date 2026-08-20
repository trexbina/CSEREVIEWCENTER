"use client"
import React, { useState, useMemo, useEffect, useCallback } from "react"
import { motion } from "motion/react"
import { Trash2, Plus, Save, Clock, Settings, X, ArrowLeft, Calculator, Check, ChevronDown, ChevronRight, Maximize2, Minimize2, Pencil, Printer, Download } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const DEFAULT_STATUS_RULES = [
  { min: 80, max: 100, label: "SUPERIOR / IT PREPARED", bg: "bg-[#fbcfe8] text-[#be185d]", border: "border-pink-200" },
  { min: 70, max: 79.89, label: "ADEQUATELY PREPARED", bg: "bg-[#bfdbfe] text-[#1d4ed8]", border: "border-blue-200" },
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

  const handleRemoveMockExam = async (mockExamId) => {
    if (!confirm("Are you sure you want to remove this exam column? This will untarget this batch from the exam, but will not delete any stored scores.")) return
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
  const examNameLower = (data.batch?.exam_name || "").toLowerCase()
  const availableExams = allSystemMockExams.filter(se => {
    if (mockExams.some(m => m.id === se.id)) return false
    let targets = se.targets || []
    if (typeof targets === 'string') {
      try { targets = JSON.parse(targets) } catch (e) { targets = [] }
    }
    if (!Array.isArray(targets)) targets = []
    if (targets.length === 0) return true
    return targets.some(t => {
      const tLower = String(t).toLowerCase()
      return tLower.includes(`-${examNameLower}`) || tLower.includes(`${examNameLower}-`) || tLower === examNameLower
    })
  })

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className={isFullscreen ? "fixed inset-0 z-50 bg-background p-6 overflow-auto flex flex-col space-y-5" : "space-y-5"}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Calculator className="h-5 w-5 text-yellow-600" /> {data.gradebook.name}
            </h2>
            <p className="text-xs text-muted-foreground">
              <span className="font-mono bg-muted/40 px-2 py-0.5 rounded border border-border">{data.gradebook.code}</span>
              <span className="ml-2">{data.batch?.batch_name} / {data.batch?.target_year} — {data.batch?.exam_name}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground font-semibold mr-2">{students.length} students · {mockExams.length} exams</span>
          
          <button 
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all active:scale-95 shadow-sm"
            title="Export Gradebook Report to CSV"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>

          <button 
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all active:scale-95 shadow-sm"
            title="Print or Save PDF Report"
          >
            <Printer className="h-4 w-4" />
            Print Report
          </button>

          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-1.5 bg-[#eedc82] hover:bg-[#e6d370] text-black font-bold px-5 py-2 rounded-xl text-xs transition-all active:scale-95 shadow-sm">
            {saving ? <Clock className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving..." : "Save Changes"}
          </button>
          
          <button 
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="flex items-center gap-1.5 bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground font-bold px-4 py-2 rounded-xl text-xs transition-all active:scale-95 border border-border shadow-sm"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Mode"}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          </button>
        </div>
      </div>

      {/* Spreadsheet + Status Reference */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">
        <div className="flex-1 overflow-x-auto w-full border border-[#d1d5db] dark:border-zinc-700 rounded-lg shadow-sm">
          <table className="w-full min-w-[800px] border-collapse text-left bg-white dark:bg-zinc-900">
            <thead>
              <tr className="h-8 bg-[#f3f4f6] dark:bg-zinc-800 border-b border-[#d1d5db] dark:border-zinc-700">
                <th className="w-10 border-r border-[#d1d5db] dark:border-zinc-700"></th>
                <th className="border-r border-[#d1d5db] dark:border-zinc-700"></th>
                <th className="border-r border-[#d1d5db] dark:border-zinc-700"></th>
                <th colSpan={mockExams.length + 1} className="text-center font-bold text-xs uppercase tracking-wider text-muted-foreground border-r border-[#d1d5db] dark:border-zinc-700">Mock Exams</th>
                <th colSpan={3}></th>
              </tr>
              <tr className="h-9 bg-[#f9fafb] dark:bg-zinc-800/40 border-b border-[#d1d5db] dark:border-zinc-700 text-xs text-gray-600 dark:text-gray-300 font-bold text-center select-none">
                <td className="border-r border-[#d1d5db] dark:border-zinc-700 bg-[#f3f4f6] dark:bg-zinc-800 text-[10px] text-gray-400">#</td>
                <td className="border-r border-[#d1d5db] dark:border-zinc-700 text-left px-3 min-w-[180px]">STUDENT NAME</td>
                <td className="border-r border-[#d1d5db] dark:border-zinc-700 text-left px-3 min-w-[140px]">SCHOOL</td>
                {mockExams.map((m, i) => (
                  <td key={m.id} className="border-r border-[#d1d5db] dark:border-zinc-700 px-2 min-w-[110px] relative group" title={m.title}>
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="font-semibold text-gray-800 dark:text-gray-200">{m.title?.length > 12 ? m.title.slice(0, 12) + "…" : m.title}</span>
                      <button 
                        onClick={() => handleRemoveMockExam(m.id)} 
                        title="Remove exam column" 
                        className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </td>
                ))}
                {/* ADD + Column Header */}
                <td className="border-r border-[#d1d5db] dark:border-zinc-700 px-2 min-w-[110px] bg-yellow-50/30 dark:bg-yellow-950/5 hover:bg-yellow-100/40 transition-colors cursor-pointer text-center relative group">
                  {availableExams.length > 0 ? (
                    <div className="relative inline-block w-full">
                      <select 
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAddMockExam(e.target.value);
                            e.target.value = "";
                          }
                        }}
                        className="w-full bg-transparent border-0 outline-none text-xs text-yellow-700 dark:text-yellow-400 font-black cursor-pointer text-center appearance-none pr-4"
                      >
                        <option value="" className="text-gray-500 dark:text-gray-400 font-normal">ADD +</option>
                        {availableExams.map(ae => (
                          <option key={ae.id} value={ae.id} className="text-black dark:text-white font-medium">
                            {ae.title} ({ae.exam_code})
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 group-hover:opacity-100 transition-opacity">
                        <ChevronDown className="h-3.5 w-3.5 text-yellow-700 dark:text-yellow-400" />
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400 italic font-medium">No more exams</span>
                  )}
                </td>
                <td className="border-r border-[#d1d5db] dark:border-zinc-700 min-w-[60px]">TOTAL</td>
                <td className="border-r border-[#d1d5db] dark:border-zinc-700 min-w-[60px]">%</td>
                <td className="min-w-[160px]">STATUS</td>
              </tr>
              {/* Max scores row */}
              <tr className="h-8 border-b border-[#d1d5db] dark:border-zinc-700 text-xs font-semibold text-center bg-gray-50/50 dark:bg-zinc-800/20">
                <td className="border-r border-[#d1d5db] dark:border-zinc-700 bg-[#f3f4f6] dark:bg-zinc-800 text-[10px] text-gray-400">MAX</td>
                <td className="border-r border-[#d1d5db] dark:border-zinc-700"></td>
                <td className="border-r border-[#d1d5db] dark:border-zinc-700"></td>
                {mockExams.map(m => (
                  <td key={m.id} className="border-r border-[#d1d5db] dark:border-zinc-700 text-gray-500 font-bold">{parseInt(m.question_count) || "—"}</td>
                ))}
                {/* Placeholder max cell for ADD + column */}
                <td className="border-r border-[#d1d5db] dark:border-zinc-700 bg-yellow-50/10 dark:bg-yellow-950/5 text-gray-400 font-bold">—</td>
                <td className="border-r border-[#d1d5db] dark:border-zinc-700 font-bold">{mockExams.reduce((s, m) => s + (parseInt(m.question_count) || 0), 0)}</td>
                <td className="border-r border-[#d1d5db] dark:border-zinc-700"></td>
                <td></td>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr><td colSpan={3 + mockExams.length + 1 + 3} className="text-center py-10 text-muted-foreground text-xs italic">No students enrolled in this batch yet.</td></tr>
              ) : students.map((student, ri) => {
                const totalMax = mockExams.reduce((s, m) => s + (parseInt(m.question_count) || 0), 0)
                const totalScore = mockExams.reduce((s, m) => {
                  const v = localScores[student.id]?.[m.id]?.score
                  return s + (v === "" || v === undefined ? 0 : Number(v))
                }, 0)
                const pct = totalMax > 0 ? (totalScore / totalMax) * 100 : 0
                const { status, bg } = getStatusAndStyleFromRules(pct, statusRules)
                return (
                  <tr key={student.id} className="h-9 border-b border-[#e5e7eb] dark:border-zinc-800 text-xs hover:bg-[#f9fafb] dark:hover:bg-zinc-800/20">
                    <td className="border-r border-[#d1d5db] dark:border-zinc-700 bg-[#f3f4f6] dark:bg-zinc-800 text-center text-[10px] text-gray-400 select-none">{ri + 1}</td>
                    <td className="border-r border-[#d1d5db] dark:border-zinc-700 px-3 font-medium text-gray-800 dark:text-gray-200">{student.name}</td>
                    <td className="border-r border-[#d1d5db] dark:border-zinc-700 px-3 text-gray-500">{student.school_name}</td>
                    {mockExams.map(m => {
                      const val = localScores[student.id]?.[m.id]?.score
                      return (
                        <td key={m.id} className="border-r border-[#d1d5db] dark:border-zinc-700 px-1 text-center">
                          <input type="number" value={val === undefined ? "" : val}
                            onChange={e => handleScoreChange(student.id, m.id, e.target.value)}
                            className="w-full text-center bg-transparent border-0 outline-none focus:bg-white dark:focus:bg-zinc-950/20 px-1 py-0.5 text-gray-700 dark:text-gray-200 font-bold" placeholder="—" />
                        </td>
                      )
                    })}
                    {/* Placeholder cell for student row under ADD + column */}
                    <td className="border-r border-[#d1d5db] dark:border-zinc-700 bg-yellow-50/10 dark:bg-yellow-950/5 text-center text-gray-400 font-bold">—</td>
                    <td className="border-r border-[#d1d5db] dark:border-zinc-700 font-bold text-center text-gray-900 dark:text-gray-100 bg-gray-50/30">{totalScore}</td>
                    <td className="border-r border-[#d1d5db] dark:border-zinc-700 text-center font-semibold text-gray-800 dark:text-gray-200 bg-gray-50/30">{pct.toFixed(2)}%</td>
                    <td className={`text-center font-bold text-[10px] px-1 ${bg}`}>{status}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Status Reference */}
        <div className="w-full lg:w-64 border border-[#d1d5db] dark:border-zinc-700 rounded-xl overflow-hidden shadow-sm flex-shrink-0">
          <div className="bg-zinc-800 dark:bg-zinc-950 text-white font-bold text-xs uppercase tracking-wider p-3 flex items-center justify-between select-none">
            <span>STATUS REFERENCE</span>
            <button 
              type="button"
              onClick={() => {
                setTempRules(JSON.parse(JSON.stringify(statusRules)))
                setIsRulesModalOpen(true)
              }}
              className="p-1 hover:bg-zinc-700 rounded transition-colors text-yellow-400 hover:text-yellow-300"
              title="Edit Formula Percentage & Status Text"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="p-3 space-y-2">
            {statusRules.map((rule, idx) => (
              <div key={idx} className={`p-2.5 rounded ${rule.bg} border ${rule.border}`}>
                <div className="text-[10px] font-black uppercase">
                  {Number(rule.min).toFixed(2)}% - {Number(rule.max).toFixed(2)}%
                </div>
                <div className="text-xs font-extrabold mt-0.5">{rule.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Edit Status Rules Modal */}
      {isRulesModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-zinc-900 text-white px-5 py-4 flex items-center justify-between">
              <h3 className="font-extrabold text-sm flex items-center gap-2">
                <Pencil className="h-4 w-4 text-yellow-400" /> Edit Status Reference Rules & Formulas
              </h3>
              <button onClick={() => setIsRulesModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <p className="text-xs text-muted-foreground">
                Customize the percentage range thresholds and status text. Grades will automatically recalculate according to your updated formulas.
              </p>

              {tempRules.map((rule, idx) => (
                <div key={idx} className="p-3 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-2.5 bg-slate-50/50 dark:bg-zinc-800/40">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200">
                    <span>Tier {idx + 1} Status Rule</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${rule.bg}`}>{rule.label}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Min Score %</label>
                      <input 
                        type="number" 
                        step="0.01"
                        value={rule.min} 
                        onChange={(e) => {
                          const updated = [...tempRules]
                          updated[idx].min = parseFloat(e.target.value) || 0
                          setTempRules(updated)
                        }}
                        className="w-full text-xs h-9 px-2.5 bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-lg font-bold" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Max Score %</label>
                      <input 
                        type="number" 
                        step="0.01"
                        value={rule.max} 
                        onChange={(e) => {
                          const updated = [...tempRules]
                          updated[idx].max = parseFloat(e.target.value) || 0
                          setTempRules(updated)
                        }}
                        className="w-full text-xs h-9 px-2.5 bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-lg font-bold" 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Status Reference Text</label>
                    <input 
                      type="text" 
                      value={rule.label} 
                      onChange={(e) => {
                        const updated = [...tempRules]
                        updated[idx].label = e.target.value
                        setTempRules(updated)
                      }}
                      className="w-full text-xs h-9 px-2.5 bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-lg font-bold" 
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-slate-100 dark:bg-zinc-800/80 px-5 py-3.5 flex justify-end gap-2 border-t border-border">
              <button 
                onClick={() => setIsRulesModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveRules}
                className="px-5 py-2 text-xs font-bold bg-[#eedc82] hover:bg-[#e6d370] text-black rounded-xl shadow-sm transition-all"
              >
                Save Rules & Formulas
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}

// ── MAIN GRADEBOOK VIEW ──
const GradebookView = ({ onBack, batches, tree, schools, gradebooks, fetchData, apiCall }) => {
  const [buildGradebookId, setBuildGradebookId] = useState(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [form, setForm] = useState({ id: "", name: "", code: "", batch_id: "", exam_id: "", status: "ACTIVE" })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleOpenAdd = () => {
    setForm({ id: "", name: "", code: "", batch_id: "", exam_id: "", status: "ACTIVE" })
    setIsEdit(false)
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (gb) => {
    setForm({ id: gb.id, name: gb.name, code: gb.code, batch_id: gb.batch_id, exam_id: gb.exam_id, status: gb.status })
    setIsEdit(true)
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.code.trim() || !form.batch_id) return
    setIsSubmitting(true)
    try {
      let res
      if (isEdit) {
        res = await apiCall("UPDATE", "GRADEBOOK", form)
      } else {
        res = await apiCall("ADD", "GRADEBOOK", form)
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

  const handleDelete = async (id) => {
    if (!confirm("Delete this gradebook?")) return
    await apiCall("DELETE", "GRADEBOOK", { id })
    await fetchData()
  }

  // Auto-fill exam_id when batch changes
  const handleBatchChange = (batchId) => {
    const batch = batches.find(b => b.id === parseInt(batchId))
    setForm({ ...form, batch_id: batchId, exam_id: batch ? batch.exam_id : "" })
  }

  // If building, show spreadsheet
  if (buildGradebookId) {
    return <SpreadsheetView gradebookId={buildGradebookId} onBack={() => setBuildGradebookId(null)} />
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
      {/* Header — no card, attached to background */}
      <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors">
            <ChevronRight className="h-5 w-5 rotate-180" />
          </button>
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
              <Calculator className="h-5 w-5 text-rose-500" /> Gradebooks
            </h2>
            <p className="text-sm text-muted-foreground">Dynamic gradebooks — students and scores auto-populate from batch enrollment and mock exam results</p>
          </div>
        </div>
        <button onClick={handleOpenAdd} className="flex items-center gap-2 bg-[#eedc82] hover:bg-[#e6d370] text-black font-bold py-2.5 px-4 rounded-xl shadow-xs transition-all text-xs active:scale-95">
          <Plus className="h-4 w-4 stroke-[3]" /> Add Gradebook
        </button>
      </div>

      {/* Gradebooks Table — no card wrapper, expands to background */}
      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="text-xs font-bold text-foreground">GRADEBOOK TITLE</TableHead>
              <TableHead className="text-xs font-bold text-foreground">EXAM CODE</TableHead>
              <TableHead className="text-xs font-bold text-foreground">BATCH</TableHead>
              <TableHead className="text-xs font-bold text-foreground">TYPE</TableHead>
              <TableHead className="text-xs font-bold text-foreground">STUDENTS</TableHead>
              <TableHead className="text-xs font-bold text-foreground">DATE CREATED</TableHead>
              <TableHead className="text-xs font-bold text-foreground">STATUS</TableHead>
              <TableHead className="text-xs font-bold text-right text-foreground">ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {gradebooks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-muted-foreground text-xs italic">
                  No gradebooks created yet. Click "Add Gradebook" to create one.
                </TableCell>
              </TableRow>
            ) : gradebooks.map(gb => (
              <TableRow key={gb.id} className="hover:bg-muted/10">
                <TableCell className="font-bold text-foreground text-xs">{gb.name}</TableCell>
                <TableCell className="text-xs">
                  <span className="font-mono text-muted-foreground bg-muted/50 px-2 py-0.5 rounded border border-border">{gb.code}</span>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground font-medium">
                  {gb.batch_name} / {gb.target_year}
                </TableCell>
                <TableCell className="text-xs font-bold text-foreground uppercase">{gb.exam_name}</TableCell>
                <TableCell className="text-xs">
                  <span className="bg-[#f0fdf4] text-[#166534] dark:bg-green-950/20 dark:text-green-400 font-bold px-2 py-0.5 rounded-full border border-green-200">
                    {gb.student_count} enrolled
                  </span>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{new Date(gb.created_at).toLocaleDateString("en-GB")}</TableCell>
                <TableCell className="text-xs">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${gb.status === "ACTIVE" ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400" : "bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400"}`}>
                    {gb.status}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => setBuildGradebookId(gb.id)} className="bg-[#eedc82] hover:bg-[#e6d370] text-black font-bold py-1 px-3.5 rounded-lg text-[10px] uppercase tracking-wider shadow-xs transition-all active:scale-95">Build</button>
                    <button onClick={() => handleOpenEdit(gb)} className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-all" title="Edit"><Settings className="h-3.5 w-3.5" /></button>
                    <button onClick={() => handleDelete(gb.id)} className="p-1.5 rounded-lg border border-border hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-all" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Add/Edit Dialog */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-card w-full max-w-lg border border-border rounded-2xl shadow-2xl overflow-hidden">
            <form onSubmit={handleSubmit}>
              <div className="flex justify-between items-center p-4 border-b border-border bg-muted/20">
                <h3 className="font-bold text-foreground text-sm uppercase tracking-wider">{isEdit ? "Edit Gradebook" : "Create Gradebook"}</h3>
                <button type="button" onClick={() => setIsDialogOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block">Gradebook Name</label>
                  <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. LEPT EXAM" className="w-full bg-background border border-input rounded-xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#ba5a62] font-semibold" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block">Gradebook Code</label>
                  <input type="text" required value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="e.g. LEPT-2026-B1" className="w-full bg-background border border-input rounded-xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#ba5a62] font-semibold" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block">Select Batch</label>
                  <select required value={form.batch_id} onChange={e => handleBatchChange(e.target.value)} className="w-full bg-background border border-input rounded-xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#ba5a62] font-semibold cursor-pointer">
                    <option value="">— Choose a batch —</option>
                    {batches.map(b => {
                      const exam = tree.find(t => t.id === b.exam_id)
                      return <option key={b.id} value={b.id}>{b.name} / {b.target_year} — {exam?.name || "?"}</option>
                    })}
                  </select>
                  <p className="text-[10px] text-muted-foreground italic">Students enrolled in this batch will automatically appear in the gradebook.</p>
                </div>
                {isEdit && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block">Status</label>
                    <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full bg-background border border-input rounded-xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#ba5a62] font-semibold cursor-pointer">
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                  </div>
                )}
              </div>
              <div className="p-4 border-t border-border bg-muted/20 flex justify-end gap-2">
                <button type="button" onClick={() => setIsDialogOpen(false)} className="bg-muted hover:bg-muted/80 text-muted-foreground font-bold py-2 px-4 rounded-xl text-xs transition-all">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="bg-[#eedc82] hover:bg-[#e6d370] text-black font-bold py-2 px-5 rounded-xl text-xs transition-all active:scale-95 shadow-xs">
                  {isSubmitting ? "Submitting..." : isEdit ? "Save Details" : "Create Gradebook"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}

export default GradebookView
