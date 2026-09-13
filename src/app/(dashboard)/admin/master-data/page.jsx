// this tells nextjs to run this page in the browser
"use client"

// helper tools from react to handle data state and page effects
import React, { useState, useMemo, useEffect } from "react"

// animation helpers for smooth transitions
import { motion, AnimatePresence } from "motion/react"

// small icons used on cards and tables
import {
  Trash,
  FolderTree,
  ChevronDown,
  ChevronRight,
  Calendar,
  Layers,
  Save,
  Plus,
  Settings,
  X,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  Calculator,
  Percent,
  GraduationCap
} from "lucide-react"

// table styling components
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// gradebook view component
import GradebookView from "./GradebookView"

// roles and limitation view component
import RolesAndLimitationView from "./RolesAndLimitationView"

// modal dialog to confirm deleting items
import ConfirmDeleteModal from "@/components/confirm-delete-modal"
import { toast } from "@/components/ui/toast"

// --- Helper Functions & External Subcomponents (defined outside parent to prevent losing input focus) ---
const getStatusStyle = (status) => {
  switch (status?.toLowerCase()) {
    case "active":
      return "text-emerald-600 font-medium"
    case "upcoming":
      return "text-blue-600 font-medium"
    case "completed":
      return "text-gray-500 font-medium"
    default:
      return "text-muted-foreground font-medium"
  }
}

const NodeButton = ({ icon: Icon, label, colorClass, onClick }) => (
  <button
    onClick={onClick}
    className={`absolute -bottom-3 left-1/2 -translate-x-1/2 bg-background px-1.5 flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider rounded-md hover:scale-110 transition-transform ${colorClass}`}
  >
    <Icon className="h-3 w-3" /> {label}
  </button>
)

const DeleteBtn = ({ onClick }) => (
  <button
    onClick={onClick}
    className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
    title="Delete"
  >
    <Trash className="h-4 w-4" />
  </button>
)

const SettingsBtn = ({ onClick }) => (
  <button
    onClick={onClick}
    className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
    title="Settings"
  >
    <Settings className="h-4 w-4" />
  </button>
)

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

const ExpandBtn = ({ isOpen, onClick }) => (
  <button onClick={onClick} className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-md transition-colors mr-2">
    {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
  </button>
)

// simple custom text input prompt modal
const CustomPrompt = ({ isOpen, title, value, onChange, onConfirm, onCancel, placeholder }) => {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl p-6 max-w-sm w-full shadow-lg space-y-4">
        <h3 className="font-bold text-foreground text-base">{title}</h3>
        <input
          type="text"
          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-slate-400/20"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") onConfirm()
            if (e.key === "Escape") onCancel()
          }}
        />
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary/90">Confirm</button>
        </div>
      </div>
    </div>
  )
}

// school create and edit modal
const SchoolDialog = ({ isOpen, schoolForm, setSchoolForm, onSubmit, onCancel, isEdit }) => {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full shadow-lg space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-foreground text-base">{isEdit ? "Edit School" : "Add School"}</h3>
          <button onClick={onCancel} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">School Name</label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm"
              value={schoolForm.name}
              onChange={(e) => setSchoolForm({ ...schoolForm, name: e.target.value })}
              placeholder="e.g. University of the Philippines"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Address / Campus</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm"
              value={schoolForm.address}
              onChange={(e) => setSchoolForm({ ...schoolForm, address: e.target.value })}
              placeholder="e.g. Diliman, Quezon City"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onCancel} className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground">Cancel</button>
            <button type="submit" className="bg-[#E9C46A] hover:bg-[#dfb550] disabled:opacity-50 text-white text-xs font-semibold px-4 py-1.5 rounded-xl shadow-2xs transition-all flex items-center justify-center cursor-pointer">{isEdit ? "Save Changes" : "Add School"}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// batch create and edit modal
const BatchDialog = ({ isOpen, batchForm, setBatchForm, onSubmit, onCancel, tree, isEdit }) => {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full shadow-lg space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-foreground text-base">{isEdit ? "Edit Batch" : "Add Batch"}</h3>
          <button onClick={onCancel} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Batch Name / Number</label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm"
              value={batchForm.batchNumber}
              onChange={(e) => setBatchForm({ ...batchForm, batchNumber: e.target.value })}
              placeholder="e.g. Batch 1"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Target Year</label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm"
              value={batchForm.year}
              onChange={(e) => setBatchForm({ ...batchForm, year: e.target.value })}
              placeholder="e.g. 2025"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Target Examination</label>
            <select
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm"
              value={batchForm.examId}
              onChange={(e) => setBatchForm({ ...batchForm, examId: e.target.value })}
              required
            >
              <option value="" disabled>Select Examination</option>
              {tree.map((exam) => (
                <option key={exam.id} value={exam.id}>{exam.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Status</label>
            <select
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm"
              value={batchForm.status}
              onChange={(e) => setBatchForm({ ...batchForm, status: e.target.value })}
            >
              <option value="upcoming">Upcoming</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onCancel} className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground">Cancel</button>
            <button type="submit" className="bg-[#E9C46A] hover:bg-[#dfb550] disabled:opacity-50 text-white text-xs font-semibold px-4 py-1.5 rounded-xl shadow-2xs transition-all flex items-center justify-center cursor-pointer">{isEdit ? "Save Changes" : "Create Batch"}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// exam settings modal
const ExamSettingsDialog = ({ isOpen, examSettings, setExamSettings, onSave, onCancel }) => {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full shadow-lg space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-foreground text-base">Examination Settings</h3>
          <button onClick={onCancel} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Examination Name</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm"
              value={examSettings.name}
              onChange={(e) => setExamSettings({ ...examSettings, name: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Max Depth Level</label>
            <input
              type="number"
              min="1"
              max="5"
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm"
              value={examSettings.maxLevel}
              onChange={(e) => setExamSettings({ ...examSettings, maxLevel: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onCancel} className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground">Cancel</button>
            <button type="button" onClick={onSave} className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary/90">Save Settings</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// main master data settings screen
export default function MasterDataBuilderPage() {
  // tracks which sub menu or tab the user is viewing
  const [activeTab, setActiveTab] = useState("menu")

  // changes the active tab and updates the url history
  const handleTabChange = (tab, pushHistory = true) => {
    setActiveTab(tab)
    if (typeof window !== "undefined") {
      if (pushHistory) {
        window.history.pushState({ tab }, "", tab === "menu" ? window.location.pathname : `?tab=${tab}`)
      }
    }
  }

  // list of exams programs and majors in tree format
  const [tree, setTree] = useState([])
  const [expandedNodes, setExpandedNodes] = useState({})
  const [selectedExamId, setSelectedExamId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // downloads master data lists from the database
  const fetchData = async () => {
    try {
      const res = await fetch('/api/admin/master-data/dropdowns')
      const data = await res.json()

      // organize exams programs and majors into a hierarchy
      const builtTree = (data.examinations || []).map(exam => ({
        id: exam.id, name: exam.name, maxLevel: 3, hasSettings: true,
        programs: (data.programs || []).filter(p => p.exam_id === exam.id).map(prog => ({
          id: prog.id, name: prog.name,
          majors: (data.majors || []).filter(m => m.program_id === prog.id).map(maj => ({
            id: maj.id, name: maj.name
          }))
        }))
      }))

      setTree(builtTree)
      setBatches(data.batches || [])
      setSchools(data.schools || [])
      setAcademicCourses(data.academic_courses || [])
      setGradebooks(data.gradebooks || [])
      setRoles(data.roles || [])
      setIsLoading(false)
    } catch (e) {
      console.error("Failed to fetch master data", e)
      setIsLoading(false)
    }
  }

  // runs once when the screen loads to check url tab and fetch data
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const tab = params.get("tab")
      if (tab) {
        setActiveTab(tab)
      }
    }

    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search)
      const tab = params.get("tab") || "menu"
      setActiveTab(tab)
    }

    window.addEventListener("popstate", handlePopState)
    fetchData()
    return () => window.removeEventListener("popstate", handlePopState)
  }, [])

  // reset selected exam if it gets removed from the tree
  useEffect(() => {
    if (selectedExamId && !tree.find(e => e.id === selectedExamId)) {
      setSelectedExamId(null)
    }
  }, [tree, selectedExamId])

  // state for popup text prompt to add or rename items
  const [promptData, setPromptData] = useState({ isOpen: false, title: "", value: "", actionType: null, targetParams: null, placeholder: "" })

  // state for popup exam settings
  const [isExamSettingsOpen, setIsExamSettingsOpen] = useState(false)

  // state for popup delete confirmation box
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

  const [examSettings, setExamSettings] = useState({ examId: "", name: "", maxLevel: 3 })

  const openExamSettings = (exam) => {
    setExamSettings({ examId: exam.id, name: exam.name, maxLevel: exam.maxLevel || 3 })
    setIsExamSettingsOpen(true)
  }
  const handleSaveExamSettings = () => {
    if (!examSettings.name.trim()) return;
    const level = parseInt(examSettings.maxLevel);
    setTree(tree.map(e => {
      if (e.id === examSettings.examId) return { ...e, name: examSettings.name, maxLevel: isNaN(level) ? 3 : level }
      return e
    }))
    setIsExamSettingsOpen(false)
  }

  // Batch State
  const [batches, setBatches] = useState([])

  // Schools & Courses State
  const [schools, setSchools] = useState([])
  const [academicCourses, setAcademicCourses] = useState([])
  const [gradebooks, setGradebooks] = useState([])
  const [roles, setRoles] = useState([])
  const [isSchoolsExpanded, setIsSchoolsExpanded] = useState(false)
  const [isCoursesExpanded, setIsCoursesExpanded] = useState(false)
  const [isBatchDialogOpen, setIsBatchDialogOpen] = useState(false)
  const [isBatchEdit, setIsBatchEdit] = useState(false)
  const [batchForm, setBatchForm] = useState({ id: "", batchNumber: "", year: "2025", examId: "", status: "upcoming" })

  const [isSchoolDialogOpen, setIsSchoolDialogOpen] = useState(false)
  const [isSchoolEdit, setIsSchoolEdit] = useState(false)
  const [schoolForm, setSchoolForm] = useState({ id: "", name: "", address: "" })

  const handleSchoolSubmit = async (e) => {
    e.preventDefault();
    if (!schoolForm.name.trim()) return;
    try {
      if (isSchoolEdit) {
        await apiCall("UPDATE", "SCHOOL", { id: schoolForm.id, name: schoolForm.name, address: schoolForm.address });
        toast("Successfully updated institution.");
      } else {
        await apiCall("ADD", "SCHOOL", { name: schoolForm.name, address: schoolForm.address });
        toast("Successfully added institution.");
      }
      await fetchData();
    } catch (err) {
      console.error(err);
      toast("An error occurred while saving institution.");
    }
    setIsSchoolDialogOpen(false)
  }

  const handleOpenEditSchool = (school) => {
    setSchoolForm({ id: school.id, name: school.name, address: school.address || "" })
    setIsSchoolEdit(true)
    setIsSchoolDialogOpen(true)
  }


  // Batch Filters & Sorting
  const [filterExam, setFilterExam] = useState("all")
  const [filterYear, setFilterYear] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [batchSortField, setBatchSortField] = useState("name")
  const [batchSortDir, setBatchSortDir] = useState("asc")

  const handleBatchSort = (field) => {
    if (batchSortField === field) {
      setBatchSortDir(prev => prev === "asc" ? "desc" : "asc")
    } else {
      setBatchSortField(field)
      setBatchSortDir("asc")
    }
  }

  // --- Prompt Handling ---
  const openPrompt = (title, actionType, targetParams, placeholder = "", prefill = "") => {
    setPromptData({ isOpen: true, title, value: prefill, actionType, targetParams, placeholder })
  }
  const closePrompt = () => setPromptData({ ...promptData, isOpen: false })

  const apiCall = async (action, entity, payload) => {
    const res = await fetch('/api/admin/master-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, entity, payload })
    });
    return res.json();
  }

  const handlePromptConfirm = async () => {
    if (!promptData.value.trim()) return;

    const { actionType, targetParams, value } = promptData;

    try {
      if (actionType === "ADD_EXAM") {
        await apiCall("ADD", "EXAM", { name: value })
        toast("Successfully created examination.")
      }
      else if (actionType === "ADD_PROGRAM") {
        await apiCall("ADD", "PROGRAM", { examId: targetParams.examId, name: value })
        toast("Successfully created program.")
      }
      else if (actionType === "ADD_MAJOR") {
        await apiCall("ADD", "MAJOR", { programId: targetParams.programId, name: value })
        toast("Successfully created major.")
      }
      else if (actionType === "RENAME_EXAM") {
        await apiCall("RENAME", "EXAM", { id: targetParams.examId, name: value })
        toast("Successfully renamed examination.")
      }
      else if (actionType === "RENAME_PROGRAM") {
        await apiCall("RENAME", "PROGRAM", { id: targetParams.programId, name: value })
        toast("Successfully renamed program.")
      }
      else if (actionType === "RENAME_MAJOR") {
        await apiCall("RENAME", "MAJOR", { id: targetParams.majorId, name: value })
        toast("Successfully renamed major.")
      }
      else if (actionType === "ADD_SCHOOL") {
        await apiCall("ADD", "SCHOOL", { name: value })
        toast("Successfully added institution.")
      }
      else if (actionType === "RENAME_SCHOOL") {
        await apiCall("RENAME", "SCHOOL", { id: targetParams.id, name: value })
        toast("Successfully renamed institution.")
      }
      else if (actionType === "ADD_COURSE") {
        await apiCall("ADD", "COURSE", { name: value })
        toast("Successfully added course.")
      }
      else if (actionType === "RENAME_COURSE") {
        await apiCall("RENAME", "COURSE", { id: targetParams.id, name: value })
        toast("Successfully renamed course.")
      }

      await fetchData(); // Refresh all state natively from backend
    } catch (e) {
      console.error(e)
      toast("An error occurred while saving.")
    }

    closePrompt();
  }

  // --- Tree Actions ---
  const toggleNode = (id) => {
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const handleDeleteExam = (examId, examName = "this examination") => {
    triggerDelete(
      "Delete Examination",
      `Are you sure you want to delete "${examName}"? All nested courses and specializations will also be removed. This cannot be undone.`,
      async () => {
        await apiCall("DELETE", "EXAM", { id: examId });
        await fetchData();
        toast("Successfully moved examination to trash.");
      }
    )
  }

  const handleDeleteProgram = (examId, programId, progName = "this course") => {
    triggerDelete(
      "Delete Course",
      `Are you sure you want to delete "${progName}"? All specializations under this course will also be removed. This cannot be undone.`,
      async () => {
        await apiCall("DELETE", "PROGRAM", { id: programId });
        await fetchData();
        toast("Successfully moved course to trash.");
      }
    )
  }

  const handleDeleteMajor = (examId, programId, majorId, majorName = "this specialization") => {
    triggerDelete(
      "Delete Specialization",
      `Are you sure you want to delete "${majorName}"? This action cannot be undone.`,
      async () => {
        await apiCall("DELETE", "MAJOR", { id: majorId });
        await fetchData();
        toast("Successfully moved specialization to trash.");
      }
    )
  }

  // --- Batch Actions ---
  const handleOpenAddBatch = () => {
    setBatchForm({ id: "", batchNumber: "", year: "2025", examId: "", status: "upcoming" })
    setIsBatchEdit(false)
    setIsBatchDialogOpen(true)
  }

  const handleOpenEditBatch = (batch) => {
    const batchNum = batch.name ? batch.name.replace("Batch ", "") : ""
    setBatchForm({
      id: batch.id,
      batchNumber: batchNum,
      year: batch.target_year || "2025",
      examId: batch.exam_id || "",
      status: batch.status || "upcoming"
    })
    setIsBatchEdit(true)
    setIsBatchDialogOpen(true)
  }

  const handleBatchSubmit = async (e) => {
    e.preventDefault()
    if (!batchForm.batchNumber || !batchForm.examId || !batchForm.year) return

    const newName = `Batch ${batchForm.batchNumber}`
    try {
      if (isBatchEdit) {
        await apiCall("UPDATE", "BATCH", { id: batchForm.id, name: newName, target_year: parseInt(batchForm.year), exam_id: batchForm.examId, status: batchForm.status });
        toast("Successfully updated batch.");
      } else {
        await apiCall("ADD", "BATCH", { name: newName, target_year: parseInt(batchForm.year), exam_id: batchForm.examId, status: batchForm.status });
        toast("Successfully created batch.");
      }
      await fetchData();
    } catch (err) {
      console.error(err);
      toast("An error occurred while saving batch.");
    }
    setIsBatchDialogOpen(false)
  }

  const handleDeleteBatch = (batchId, batchName = "this batch") => {
    triggerDelete(
      "Delete Batch",
      `Are you sure you want to delete "${batchName}"? This action cannot be undone.`,
      async () => {
        try {
          await apiCall("DELETE", "BATCH", { id: batchId });
          await fetchData();
          toast("Successfully moved batch to trash.");
        } catch (e) {
          console.error("Failed to delete", e);
          toast("Failed to delete batch.");
        }
      }
    )
  }

  // Computed Years for Filter
  const yearsList = useMemo(() => {
    const years = new Set(batches.map(b => b.target_year).filter(Boolean));
    const currentYear = new Date().getFullYear();
    years.add(currentYear);
    years.add(currentYear + 1);
    return Array.from(years).sort((a, b) => b - a);
  }, [batches]);

  // Computed Batches Filter & Sort
  const filteredBatches = useMemo(() => {
    let result = batches.filter(batch => {
      if (filterExam !== "all" && batch.exam_id !== parseInt(filterExam)) return false;
      if (filterStatus !== "all" && batch.status !== filterStatus) return false;
      if (filterYear !== "all" && batch.target_year !== parseInt(filterYear)) return false;
      return true;
    });

    result.sort((a, b) => {
      let valA, valB;
      if (batchSortField === "status") {
        valA = (a.status || "").toLowerCase();
        valB = (b.status || "").toLowerCase();
      } else if (batchSortField === "name") {
        valA = (a.name || "").toLowerCase();
        valB = (b.name || "").toLowerCase();
      } else if (batchSortField === "exam") {
        const examA = tree.find(e => e.id === a.exam_id);
        const examB = tree.find(e => e.id === b.exam_id);
        valA = (examA?.name || "").toLowerCase();
        valB = (examB?.name || "").toLowerCase();
      } else if (batchSortField === "target_year") {
        valA = a.target_year || 0;
        valB = b.target_year || 0;
      }

      if (valA < valB) return batchSortDir === "asc" ? -1 : 1;
      if (valA > valB) return batchSortDir === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [batches, filterExam, filterStatus, filterYear, batchSortField, batchSortDir, tree]);

  return (
    <div className="space-y-6 w-full max-w-6xl mx-auto px-4 py-4 relative animate-in fade-in duration-300">

      <CustomPrompt
        isOpen={promptData.isOpen}
        title={promptData.title}
        value={promptData.value}
        onChange={(val) => setPromptData({ ...promptData, value: val })}
        onConfirm={handlePromptConfirm}
        onCancel={closePrompt}
        placeholder={promptData.placeholder}
      />

      <SchoolDialog
        isOpen={isSchoolDialogOpen}
        schoolForm={schoolForm}
        setSchoolForm={setSchoolForm}
        onSubmit={handleSchoolSubmit}
        onCancel={() => setIsSchoolDialogOpen(false)}
        isEdit={isSchoolEdit}
      />

      <BatchDialog
        isOpen={isBatchDialogOpen}
        batchForm={batchForm}
        setBatchForm={setBatchForm}
        onSubmit={handleBatchSubmit}
        onCancel={() => setIsBatchDialogOpen(false)}
        tree={tree}
        isEdit={isBatchEdit}
      />

      <ExamSettingsDialog
        isOpen={isExamSettingsOpen}
        examSettings={examSettings}
        setExamSettings={setExamSettings}
        onSave={handleSaveExamSettings}
        onCancel={() => setIsExamSettingsOpen(false)}
      />

      <div className="space-y-6">

        {/* Header */}
        <div className="border-b border-border/40 pb-4">
          <div className="flex items-center gap-2.5 mb-1">
            <Layers className="h-6 w-6 text-[#E9C46A]" />
            <h1 className="text-2xl font-bold tracking-wider text-foreground uppercase">
              MASTER DATA
            </h1>
          </div>
          <p className="text-muted-foreground text-sm font-medium">
            Manage exams, review batches, schools, and grade settings.
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="flex flex-col items-center gap-3">
              <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-muted-foreground font-medium text-sm">Synchronizing Master Data...</p>
            </div>
          </div>
        ) : (
          <AnimatePresence mode="wait">


            {/* === LEVEL 0: MAIN MENU === */}
            {activeTab === "menu" && (
              <motion.div
                key="menu"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-100"
              >
                {/* Examination Management Data */}
                <div
                  className="p-5 sm:p-6 flex items-center justify-between cursor-pointer transition-all group"
                  onClick={() => handleTabChange("tree")}
                >
                  <div className="min-w-0">
                    <h3 className="font-bold text-[#4d4d4d] text-base group-hover:text-[#E9C46A] transition-colors truncate">
                      Examination Management Data
                    </h3>
                    <p className="text-xs sm:text-sm text-[#8c8c8c] mt-0.5 truncate">
                      Set up board exams, programs, and majors
                    </p>
                  </div>
                  <div className="flex items-center shrink-0 ml-4">
                    <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-[#E9C46A] group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>

                {/* Batch Management Data */}
                <div
                  className="p-5 sm:p-6 flex items-center justify-between cursor-pointer transition-all group"
                  onClick={() => handleTabChange("batches")}
                >
                  <div className="min-w-0">
                    <h3 className="font-bold text-[#4d4d4d] text-base group-hover:text-[#E9C46A] transition-colors truncate">
                      Batch Management Data
                    </h3>
                    <p className="text-xs sm:text-sm text-[#8c8c8c] mt-0.5 truncate">
                      Create and manage review batches and target exam years
                    </p>
                  </div>
                  <div className="flex items-center shrink-0 ml-4">
                    <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-[#E9C46A] group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>

                {/* Academic Institutions & Courses */}
                <div
                  className="p-5 sm:p-6 flex items-center justify-between cursor-pointer transition-all group"
                  onClick={() => handleTabChange("education")}
                >
                  <div className="min-w-0">
                    <h3 className="font-bold text-[#4d4d4d] text-base group-hover:text-[#E9C46A] transition-colors truncate">
                      Academic Institutions & Courses
                    </h3>
                    <p className="text-xs sm:text-sm text-[#8c8c8c] mt-0.5 truncate">
                      Manage schools, universities, and college degrees
                    </p>
                  </div>
                  <div className="flex items-center shrink-0 ml-4">
                    <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-[#E9C46A] group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>

                {/* Gradebook */}
                <div
                  className="p-5 sm:p-6 flex items-center justify-between cursor-pointer transition-all group"
                  onClick={() => handleTabChange("gradebook")}
                >
                  <div className="min-w-0">
                    <h3 className="font-bold text-[#4d4d4d] text-base group-hover:text-[#E9C46A] transition-colors truncate">
                      Gradebook
                    </h3>
                    <p className="text-xs sm:text-sm text-[#8c8c8c] mt-0.5 truncate">
                      Configure grade formulas and student readiness scores
                    </p>
                  </div>
                  <div className="flex items-center shrink-0 ml-4">
                    <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-[#E9C46A] group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>

                {/* Roles and Limitation */}
                <div
                  className="p-5 sm:p-6 flex items-center justify-between cursor-pointer transition-all group"
                  onClick={() => handleTabChange("roles")}
                >
                  <div className="min-w-0">
                    <h3 className="font-bold text-[#4d4d4d] text-base group-hover:text-[#E9C46A] transition-colors truncate">
                      Roles and Limitation
                    </h3>
                    <p className="text-xs sm:text-sm text-[#8c8c8c] mt-0.5 truncate">
                      Configure user roles and dashboard access permissions
                    </p>
                  </div>
                  <div className="flex items-center shrink-0 ml-4">
                    <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-[#E9C46A] group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 1: EXAMINATION MANAGEMENT DATA */}
            {activeTab === "tree" && (
              <motion.div
                key="tree"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-card border border-border/40 rounded-2xl p-6 shadow-xs relative"
              >
                <AnimatePresence mode="wait">

                  {/* === LIST VIEW === */}
                  {selectedExamId === null && (
                    <motion.div
                      key="exam-list"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                    >
                      <div className="flex items-center gap-4 mb-6 pb-4 border-b border-border/40">
                        <button
                          onClick={() => handleTabChange("menu")}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
                          title="Back to Master Data"
                        >
                          <ChevronRight className="h-5 w-5 rotate-180" />
                        </button>
                        <div className="flex-1 min-w-0">
                          <h2 className="text-lg font-bold text-foreground truncate">
                            Examination Management Data
                          </h2>
                          <p className="text-xs text-muted-foreground mt-0.5">Select an examination to manage programs and specializations.</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-medium text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full">
                            {tree.length} {tree.length === 1 ? "Exam" : "Exams"}
                          </span>
                          <button
                            onClick={() => openPrompt("Enter Examination Name:", "ADD_EXAM", null)}
                            className="bg-[#E9C46A] hover:bg-[#dfb550] text-white font-semibold py-1.5 px-3.5 rounded-lg flex items-center gap-1.5 transition-all text-xs cursor-pointer active:scale-95"
                          >
                            Add Examination
                          </button>
                        </div>
                      </div>

                      {tree.length > 0 && (
                        <div className="bg-card border border-border/30 rounded-xl overflow-hidden divide-y divide-border/30">
                          {tree.map(exam => {
                            const totalMajors = exam.programs.reduce((acc, p) => acc + p.majors.length, 0);
                            return (
                              <div
                                key={exam.id}
                                className="p-4 sm:p-4.5 flex items-center justify-between cursor-pointer hover:bg-muted/20 transition-all group"
                                onClick={() => setSelectedExamId(exam.id)}
                              >
                                <div>
                                  <h3 className="font-bold text-foreground text-sm sm:text-base group-hover:text-[#E9C46A] transition-colors">{exam.name}</h3>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {exam.programs.length} course{exam.programs.length !== 1 ? "s" : ""} · {totalMajors} specialization{totalMajors !== 1 ? "s" : ""} · Max depth: {exam.maxLevel || 3}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0 ml-4" onClick={e => e.stopPropagation()}>
                                  <SettingsBtn onClick={() => openExamSettings(exam)} />
                                  <DeleteBtn onClick={() => handleDeleteExam(exam.id, exam.name)} />
                                  <ChevronRight className="h-4 w-4 text-muted-foreground ml-1 group-hover:text-[#E9C46A] group-hover:translate-x-0.5 transition-all" />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {tree.length === 0 && (
                        <div className="text-center py-16 text-muted-foreground">
                          <p className="font-semibold text-foreground text-sm">No examinations yet.</p>
                          <p className="text-xs mt-1">Click &quot;Add Examination&quot; above to create your first one.</p>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* === DETAIL VIEW (selected exam) === */}
                  {(() => {
                    const exam = selectedExamId !== null ? tree.find(e => e.id === selectedExamId) : null;
                    if (selectedExamId !== null && !exam) return null; // exam was deleted, useEffect below handles reset
                    if (!exam) return null;
                    return (
                      <motion.div
                        key="exam-detail"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                      >
                        {/* Back button + header */}
                        <div className="flex items-center gap-4 mb-6 pb-4 border-b border-border/40">
                          <button
                            onClick={() => setSelectedExamId(null)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
                            title="Back to Examinations"
                          >
                            <ChevronRight className="h-5 w-5 rotate-180" />
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2.5">
                              <h2 className="text-lg font-bold text-foreground truncate">{exam.name}</h2>
                              <span className="text-xs font-medium text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md">
                                Max Depth: {exam.maxLevel || 3}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">Manage courses and specializations under this examination.</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => openPrompt("Enter Course / Program Name:", "ADD_PROGRAM", { examId: exam.id })}
                              className="bg-[#E9C46A] hover:bg-[#dfb550] text-white font-semibold py-1.5 px-3.5 rounded-lg flex items-center gap-1.5 transition-all text-xs cursor-pointer active:scale-95"
                            >
                              Add Course
                            </button>
                            <SettingsBtn onClick={() => openExamSettings(exam)} />
                          </div>
                        </div>

                        {/* Course / Program List */}
                        {exam.programs.length === 0 ? (
                          <div className="text-center py-16 text-muted-foreground">
                            <p className="font-semibold text-foreground text-sm">No courses added yet.</p>
                            <p className="text-xs mt-1">Click &quot;Add Course&quot; to start building this examination&apos;s structure.</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {exam.programs.map((prog) => {
                              const isProgOpen = expandedNodes[prog.id];

                              return (
                                <div key={prog.id} className="bg-card border border-border/30 rounded-xl overflow-hidden transition-all">
                                  {/* Course Row Header */}
                                  <div className="p-3.5 sm:p-4 flex items-center justify-between transition-colors">
                                    <div
                                      className="flex items-center gap-2 cursor-pointer select-none min-w-0"
                                      onClick={() => toggleNode(prog.id)}
                                    >
                                      <button className="p-1 text-muted-foreground hover:text-foreground transition-colors">
                                        {isProgOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                      </button>
                                      <span className="font-bold text-foreground text-sm truncate">{prog.name}</span>
                                      <span className="text-xs font-medium text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md ml-1 shrink-0">
                                        {prog.majors.length} {prog.majors.length === 1 ? 'Spec' : 'Specs'}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <button
                                        onClick={() => openPrompt("Enter Specialization / Major Name:", "ADD_MAJOR", { examId: exam.id, programId: prog.id })}
                                        className="flex items-center gap-1 text-xs font-semibold text-[#E9C46A] hover:text-[#dfb550] px-2 py-1 rounded hover:bg-muted/40 transition-colors cursor-pointer"
                                        title="Add Specialization"
                                      >
                                        <Plus className="h-3 w-3" /> Spec
                                      </button>
                                      <SettingsBtn onClick={() => openPrompt("Rename Course / Program:", "RENAME_PROGRAM", { examId: exam.id, programId: prog.id }, prog.name, prog.name)} />
                                      <DeleteBtn onClick={() => handleDeleteProgram(exam.id, prog.id, prog.name)} />
                                    </div>
                                  </div>

                                  {/* Nested Specializations */}
                                  <AnimatePresence>
                                    {isProgOpen && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden border-t border-border/30 bg-muted/10"
                                      >
                                        {prog.majors.length === 0 ? (
                                          <div className="py-3 px-6 text-xs text-muted-foreground italic">
                                            No specializations configured yet. Click &quot;+ Spec&quot; to add one.
                                          </div>
                                        ) : (
                                          <div className="divide-y divide-border/20">
                                            {prog.majors.map((major) => (
                                              <div key={major.id} className="py-2.5 px-6 pl-10 flex items-center justify-between text-xs sm:text-sm font-medium">
                                                <div className="flex items-center gap-2 min-w-0">
                                                  <span className="h-1.5 w-1.5 rounded-full bg-[#E9C46A] shrink-0" />
                                                  <span className="font-medium text-foreground truncate">{major.name}</span>
                                                </div>
                                                <div className="flex items-center gap-1 shrink-0">
                                                  <SettingsBtn onClick={() => openPrompt("Rename Specialization / Major:", "RENAME_MAJOR", { examId: exam.id, programId: prog.id, majorId: major.id }, major.name, major.name)} />
                                                  <DeleteBtn onClick={() => handleDeleteMajor(exam.id, prog.id, major.id, major.name)} />
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </motion.div>
                    )
                  })()}

                </AnimatePresence>
              </motion.div>
            )}

            {/* TAB 2: BATCH MANAGEMENT DATA */}
            {activeTab === "batches" && (
              <motion.div
                key="batches"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                <div className="w-full bg-card border border-border/40 rounded-2xl p-6 shadow-xs">
                  {/* Header */}
                  <div className="flex items-center gap-4 mb-6 pb-4 border-b border-border/40">
                    <button
                      onClick={() => handleTabChange("menu")}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
                      title="Back to Master Data"
                    >
                      <ChevronRight className="h-5 w-5 rotate-180" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-bold text-foreground truncate">
                        Batch Management Data
                      </h2>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Create and manage review batches and target exam years.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-medium text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full">
                        {batches.length} {batches.length === 1 ? "Batch" : "Batches"}
                      </span>
                      <button
                        onClick={handleOpenAddBatch}
                        className="bg-[#E9C46A] hover:bg-[#dfb550] text-white font-semibold py-1.5 px-3.5 rounded-lg flex items-center gap-1.5 transition-all text-xs cursor-pointer active:scale-95"
                      >
                        Add New Batch
                      </button>
                    </div>
                  </div>

                  {/* Filters Row */}
                  <div className="flex flex-wrap items-center gap-2 mb-6">
                    {/* Examination Filter */}
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

                    {/* Target Year Filter */}
                    <div className="relative inline-flex items-center gap-1.5 bg-muted/30 border border-border/40 rounded-lg px-2.5 py-1 text-xs font-medium text-foreground">
                      <span className="text-muted-foreground font-normal">Year:</span>
                      <select
                        value={filterYear}
                        onChange={e => setFilterYear(e.target.value)}
                        className="bg-transparent font-medium text-foreground outline-none cursor-pointer pr-1"
                      >
                        <option value="all">All</option>
                        {yearsList.map(y => <option key={y} value={y}>{y}</option>)}
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
                        <option value="active">Active</option>
                        <option value="upcoming">Upcoming</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>

                    {(filterExam !== "all" || filterYear !== "all" || filterStatus !== "all") && (
                      <button
                        onClick={() => {
                          setFilterExam("all")
                          setFilterYear("all")
                          setFilterStatus("all")
                        }}
                        className="text-xs text-[#E9C46A] hover:underline self-center px-1 cursor-pointer"
                      >
                        Reset filters
                      </button>
                    )}
                  </div>

                  {/* Batches Table / Content */}
                  <div className="min-h-[220px] flex flex-col">
                    {filteredBatches.length > 0 ? (
                      <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-border/40 text-xs font-medium text-muted-foreground">
                              <th className="py-2.5 px-4 w-[22%]" scope="col">
                                <SortButton label="Status" field="status" sortField={batchSortField} sortDir={batchSortDir} onSort={handleBatchSort} />
                              </th>
                              <th className="py-2.5 px-4 w-[22%]" scope="col">
                                <SortButton label="Batch" field="name" sortField={batchSortField} sortDir={batchSortDir} onSort={handleBatchSort} />
                              </th>
                              <th className="py-2.5 px-4 w-[26%]" scope="col">
                                <SortButton label="Target Examination" field="exam" sortField={batchSortField} sortDir={batchSortDir} onSort={handleBatchSort} />
                              </th>
                              <th className="py-2.5 px-4 w-[20%]" scope="col">
                                <SortButton label="Target Year" field="target_year" sortField={batchSortField} sortDir={batchSortDir} onSort={handleBatchSort} />
                              </th>
                              <th className="py-2.5 px-4 w-[10%] text-right font-medium text-muted-foreground" scope="col">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="text-sm">
                            {filteredBatches.map(batch => {
                              const exam = tree.find(e => e.id === batch.exam_id)
                              return (
                                <tr key={batch.id} className="border-b border-border/30 last:border-b-0 hover:bg-muted/20 transition-colors">
                                  <td className="py-3 px-4 text-foreground whitespace-nowrap">
                                    <span className={getStatusStyle(batch.status)}>
                                      {batch.status ? batch.status.charAt(0).toUpperCase() + batch.status.slice(1) : "Unknown"}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-foreground whitespace-nowrap font-medium">
                                    {batch.name}
                                  </td>
                                  <td className="py-3 px-4 text-foreground whitespace-nowrap">
                                    {exam ? exam.name : "Unknown"}
                                  </td>
                                  <td className="py-3 px-4 text-foreground whitespace-nowrap">
                                    {batch.target_year}
                                  </td>
                                  <td className="py-3 px-4 text-right whitespace-nowrap">
                                    <div className="inline-flex items-center justify-end gap-1.5">
                                      <SettingsBtn onClick={() => handleOpenEditBatch(batch)} />
                                      <DeleteBtn onClick={() => handleDeleteBatch(batch.id, batch.name)} />
                                    </div>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
                        <p className="text-sm font-semibold text-foreground mb-1">
                          {batches.length === 0 ? "No Batches Yet" : "No Matching Batches"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {batches.length === 0
                            ? "Click on the add new batch button to create your first batch."
                            : "Try adjusting your filter criteria to view other batches."}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 4: EDUCATION MANAGEMENT DATA */}
            {activeTab === "education" && (
              <motion.div
                key="education"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-card border border-border/40 rounded-2xl p-6 shadow-xs relative min-h-[400px] flex flex-col gap-8"
              >
                {/* Header */}
                <div className="flex items-center gap-4 border-b border-border/40 pb-4">
                  <button
                    onClick={() => handleTabChange("menu")}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
                    title="Back to Master Data"
                  >
                    <ChevronRight className="h-5 w-5 rotate-180" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold text-foreground truncate">
                      Academic Institutions & Courses
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Configure registered universities, schools, and academic course offerings.</p>
                  </div>
                </div>

                {/* Schools Section */}
                <div>
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-border/40">
                    <h3 className="text-sm sm:text-base font-bold text-foreground">
                      School Management Data
                    </h3>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-medium text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full">
                        {schools.length} {schools.length === 1 ? "School" : "Schools"}
                      </span>
                      <button
                        onClick={() => {
                          setSchoolForm({ id: "", name: "", address: "" })
                          setIsSchoolEdit(false)
                          setIsSchoolDialogOpen(true)
                        }}
                        className="bg-[#E9C46A] hover:bg-[#dfb550] text-white font-semibold py-1.5 px-3.5 rounded-lg transition-all text-xs cursor-pointer active:scale-95"
                      >
                        Add School
                      </button>
                    </div>
                  </div>

                  <div className={`rounded-xl border border-border/30 overflow-hidden ${isSchoolsExpanded ? 'max-h-[350px] overflow-y-auto' : ''}`}>
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-transparent border-b border-border/40 text-xs">
                          <TableHead className="py-2.5 px-4 font-medium text-muted-foreground">School Name</TableHead>
                          <TableHead className="py-2.5 px-4 font-medium text-muted-foreground">Address</TableHead>
                          <TableHead className="py-2.5 px-4 text-right font-medium text-muted-foreground">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="text-sm">
                        {schools.length === 0 && (
                          <TableRow className="border-0">
                            <TableCell colSpan={3} className="text-center py-8 text-muted-foreground text-xs">No schools active.</TableCell>
                          </TableRow>
                        )}
                        {(isSchoolsExpanded ? schools : schools.slice(0, 5)).map(school => (
                          <TableRow key={school.id} className="border-b border-border/20 last:border-b-0 hover:bg-muted/20 transition-colors">
                            <TableCell className="py-3 px-4 font-medium text-foreground whitespace-nowrap">{school.name}</TableCell>
                            <TableCell className="py-3 px-4 text-muted-foreground text-xs">{school.address || <span className="opacity-50 italic">No Address Configured</span>}</TableCell>
                            <TableCell className="py-3 px-4 text-right whitespace-nowrap">
                              <div className="inline-flex items-center justify-end gap-1.5">
                                <SettingsBtn onClick={() => handleOpenEditSchool(school)} />
                                <DeleteBtn onClick={() => triggerDelete("Delete School", `Are you sure you want to delete "${school.name}"?`, async () => { await apiCall("DELETE", "SCHOOL", { id: school.id }); await fetchData(); toast("Successfully moved institution to trash."); })} />
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {schools.length > 5 && (
                    <div className="flex justify-center mt-3">
                      <button
                        onClick={() => setIsSchoolsExpanded(!isSchoolsExpanded)}
                        className="text-xs font-semibold text-[#E9C46A] hover:underline transition-colors"
                      >
                        {isSchoolsExpanded ? "Show Less" : `Show All (${schools.length})`}
                      </button>
                    </div>
                  )}
                </div>

                {/* Courses Section */}
                <div>
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-border/40">
                    <h3 className="text-sm sm:text-base font-bold text-foreground">
                      Course Management Data
                    </h3>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-medium text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full">
                        {academicCourses.length} {academicCourses.length === 1 ? "Course" : "Courses"}
                      </span>
                      <button
                        onClick={() => openPrompt("Add Course", "ADD_COURSE", null, "e.g. BS Computer Science")}
                        className="bg-[#E9C46A] hover:bg-[#dfb550] text-white font-semibold py-1.5 px-3.5 rounded-lg transition-all text-xs cursor-pointer active:scale-95"
                      >
                        Add Course
                      </button>
                    </div>
                  </div>

                  <div className={`rounded-xl border border-border/30 overflow-hidden ${isCoursesExpanded ? 'max-h-[350px] overflow-y-auto' : ''}`}>
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-transparent border-b border-border/40 text-xs">
                          <TableHead className="py-2.5 px-4 font-medium text-muted-foreground">Course Name</TableHead>
                          <TableHead className="py-2.5 px-4 text-right font-medium text-muted-foreground">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="text-sm">
                        {academicCourses.length === 0 && (
                          <TableRow className="border-0">
                            <TableCell colSpan={2} className="text-center py-8 text-muted-foreground text-xs">No courses active.</TableCell>
                          </TableRow>
                        )}
                        {(isCoursesExpanded ? academicCourses : academicCourses.slice(0, 5)).map(course => (
                          <TableRow key={course.id} className="border-b border-border/20 last:border-b-0 hover:bg-muted/20 transition-colors">
                            <TableCell className="py-3 px-4 font-medium text-foreground whitespace-nowrap">{course.name}</TableCell>
                            <TableCell className="py-3 px-4 text-right whitespace-nowrap">
                              <div className="inline-flex items-center justify-end gap-1.5">
                                <SettingsBtn onClick={() => openPrompt("Rename Course", "RENAME_COURSE", { id: course.id }, "Course Name", course.name)} />
                                <DeleteBtn onClick={() => triggerDelete("Delete Academic Course", `Are you sure you want to delete "${course.name}"?`, async () => { await apiCall("DELETE", "COURSE", { id: course.id }); await fetchData(); toast("Successfully moved course to trash."); })} />
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {academicCourses.length > 5 && (
                    <div className="flex justify-center mt-3">
                      <button
                        onClick={() => setIsCoursesExpanded(!isCoursesExpanded)}
                        className="text-xs font-semibold text-[#E9C46A] hover:underline transition-colors"
                      >
                        {isCoursesExpanded ? "Show Less" : `Show All (${academicCourses.length})`}
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === "gradebook" && (
              <GradebookView
                onBack={() => handleTabChange("menu")}
                batches={batches}
                tree={tree}
                schools={schools}
                gradebooks={gradebooks}
                fetchData={fetchData}
                apiCall={apiCall}
                programs={tree.flatMap(exam => (exam.programs || []).map(p => ({ ...p, exam_id: exam.id })))}
                majors={tree.flatMap(exam => (exam.programs || []).flatMap(p => (p.majors || []).map(m => ({ ...m, program_id: p.id }))))}
              />
            )}

            {activeTab === "roles" && (
              <RolesAndLimitationView
                onBack={() => handleTabChange("menu")}
                roles={roles}
                fetchData={fetchData}
                apiCall={apiCall}
              />
            )}

          </AnimatePresence>
        )}
      </div>

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
