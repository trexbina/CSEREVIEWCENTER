"use client"

import React, { useState, useMemo, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  Trash2,
  PlusCircle,
  FolderTree,
  ChevronDown,
  ChevronRight,
  Calendar,
  Layers,
  Save,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  Settings,
  X,
  Filter,
  ArrowLeft
} from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"



// Custom Prompt Dialog Component
const CustomPrompt = ({ isOpen, title, value, onChange, onCancel, onConfirm, placeholder }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-card w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-border"
      >
        <div className="flex justify-between items-center p-4 border-b border-border bg-muted/30">
          <h3 className="font-semibold text-foreground">{title}</h3>
          <button onClick={onCancel} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6">
          <input 
            type="text" 
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-background border border-input rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && onConfirm()}
          />
        </div>
        <div className="p-4 border-t border-border bg-muted/30 flex justify-end gap-3">
          <button onClick={onCancel} className="px-5 py-2 rounded-lg text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-all focus:ring-2 focus:ring-primary focus:ring-offset-2">
            <Save className="h-4 w-4" /> Save
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// Batch Dialog Component
const SchoolDialog = ({ isOpen, schoolForm, setSchoolForm, onSubmit, onCancel, isEdit }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.95, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        className="bg-card w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-border"
      >
        <div className="flex justify-between items-center p-4 border-b border-border bg-muted/30">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            {isEdit ? <Settings className="h-5 w-5 text-primary" /> : <PlusCircle className="h-5 w-5 text-primary" />}
            {isEdit ? "Edit School Details" : "Register New School"}
          </h3>
          <button onClick={onCancel} className="text-muted-foreground hover:text-foreground transition-colors"><X className="h-5 w-5" /></button>
        </div>
        
        <form onSubmit={onSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">School Name</label>
            <input 
              type="text" 
              placeholder="e.g. University of the Philippines"
              value={schoolForm.name}
              onChange={e => setSchoolForm({...schoolForm, name: e.target.value})}
              className="w-full bg-background border border-input rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium text-sm"
              required autoFocus
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Address</label>
            <input 
              type="text" 
              placeholder="e.g. Diliman, Quezon City"
              value={schoolForm.address}
              onChange={e => setSchoolForm({...schoolForm, address: e.target.value})}
              className="w-full bg-background border border-input rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium text-sm"
            />
          </div>
          <div className="pt-2 flex justify-end gap-3">
             <button type="button" onClick={onCancel} className="px-5 py-2.5 rounded-lg text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
             <button type="submit" className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-all"><Save className="h-4 w-4"/> Save Record</button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

const BatchDialog = ({ isOpen, batchForm, setBatchForm, onSubmit, onCancel, tree, isEdit }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.95, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        className="bg-card w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-border"
      >
        <div className="flex justify-between items-center p-4 border-b border-border bg-muted/30">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            {isEdit ? (
              <Settings className="h-5 w-5 text-primary" />
            ) : (
              <PlusCircle className="h-5 w-5 text-primary" />
            )}
            {isEdit ? "Edit Batch Details" : "Create New Batch"}
          </h3>
          <button onClick={onCancel} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={onSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Batch Number</label>
              <div className="flex items-center bg-background border border-input rounded-lg overflow-hidden transition-all focus-within:ring-2 focus-within:ring-primary/50 text-sm">
                 <span className="px-3 py-2.5 bg-muted text-muted-foreground font-bold border-r border-input">Batch</span>
                 <input 
                  type="number" 
                  min="1"
                  placeholder="e.g. 1"
                  value={batchForm.batchNumber}
                  onChange={e => setBatchForm({...batchForm, batchNumber: e.target.value})}
                  className="w-full px-3 py-2.5 text-foreground focus:outline-none font-medium bg-transparent"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Target Year</label>
              <select 
                value={batchForm.year}
                onChange={e => setBatchForm({...batchForm, year: e.target.value})}
                className="w-full bg-background border border-input rounded-lg px-3 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium text-sm"
                required
              >
                  <option value="" disabled>Select Year...</option>
                  <option value="2024">2024</option>
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                  <option value="2028">2028</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Target Examination</label>
            <select 
              value={batchForm.examId}
              onChange={e => setBatchForm({...batchForm, examId: e.target.value})}
              className="w-full bg-background border border-input rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium text-sm"
              required
            >
              <option value="" disabled>Select an Exam...</option>
              {tree.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Status</label>
            <div className="flex gap-2">
              {["upcoming", "active", "completed"].map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setBatchForm({...batchForm, status: s})}
                  className={`flex-1 py-2 text-[11px] font-bold uppercase tracking-wider rounded-md transition-all border ${
                    batchForm.status === s 
                      ? s === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 shadow-sm dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/50' 
                        : s === 'upcoming' ? 'bg-amber-50 text-amber-600 border-amber-200 shadow-sm dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/50'
                        : 'bg-slate-50 text-slate-600 border-slate-200 shadow-sm dark:bg-slate-500/20 dark:text-slate-400 dark:border-slate-500/50'
                      : 'bg-background text-muted-foreground border-input hover:border-border'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-border flex gap-3">
             <button type="button" onClick={onCancel} className="flex-1 bg-muted hover:bg-muted/80 text-foreground font-semibold py-2.5 px-4 rounded-lg flex justify-center items-center transition-colors">
               Cancel
            </button>
            <button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2.5 px-4 rounded-lg flex justify-center items-center gap-2 transition-colors">
              <Save className="h-4 w-4" /> Save Batch Config
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

// Exam Settings Dialog Component (Level 1 — rename + depth limit)
const ExamSettingsDialog = ({ isOpen, examSettings, setExamSettings, onSave, onCancel }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-card w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-border"
      >
        <div className="flex justify-between items-center p-4 border-b border-border bg-muted/30">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" /> Examination Settings
          </h3>
          <button onClick={onCancel} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Examination Name</label>
            <input 
              type="text" 
              value={examSettings.name}
              onChange={(e) => setExamSettings({...examSettings, name: e.target.value})}
              placeholder="e.g. LEPT"
              className="w-full bg-background border border-input rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Maximum Depth Level</label>
            <input 
              type="number" 
              min="1"
              max="10"
              value={examSettings.maxLevel}
              onChange={(e) => setExamSettings({...examSettings, maxLevel: e.target.value})}
              placeholder="e.g. 3"
              className="w-full bg-background border border-input rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
            />
            <p className="text-[11px] text-muted-foreground mt-1.5">Controls how many nested levels (Courses → Specializations) are allowed under this examination.</p>
          </div>
        </div>
        <div className="p-4 border-t border-border bg-muted/30 flex gap-3">
          <button onClick={onCancel} className="flex-1 bg-muted hover:bg-muted/80 text-foreground font-semibold py-2.5 px-4 rounded-lg flex justify-center items-center transition-colors">
            Cancel
          </button>
          <button onClick={onSave} className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2.5 px-4 rounded-lg flex justify-center items-center gap-2 transition-colors">
            <Save className="h-4 w-4" /> Save Settings
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default function MasterDataBuilderPage() {
  const [activeTab, setActiveTab] = useState("menu") // "menu" | "tree" | "batches" | "schools" | "courses"
  
  // Tree State
  const [tree, setTree] = useState([])
  const [expandedNodes, setExpandedNodes] = useState({}) 
  const [selectedExamId, setSelectedExamId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch initial data
  const fetchData = async () => {
    try {
      const res = await fetch('/api/admin/master-data/dropdowns')
      const data = await res.json()
      
      // Build tree
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
      setIsLoading(false)
    } catch (e) {
      console.error("Failed to fetch master data", e)
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])
  
  // Auto-reset if selected exam gets deleted
  useEffect(() => {
    if (selectedExamId && !tree.find(e => e.id === selectedExamId)) {
      setSelectedExamId(null)
    }
  }, [tree, selectedExamId])

  // Custom Prompt State
  const [promptData, setPromptData] = useState({ isOpen: false, title: "", value: "", actionType: null, targetParams: null, placeholder: "" })
  
  // Exam Settings Dialog State
  const [isExamSettingsOpen, setIsExamSettingsOpen] = useState(false)
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
      } else {
        await apiCall("ADD", "SCHOOL", { name: schoolForm.name, address: schoolForm.address });
      }
      await fetchData();
    } catch(err) {
      console.error(err);
    }
    setIsSchoolDialogOpen(false)
  }

  const handleOpenEditSchool = (school) => {
    setSchoolForm({ id: school.id, name: school.name, address: school.address || "" })
    setIsSchoolEdit(true)
    setIsSchoolDialogOpen(true)
  }

  
  // Batch Filters
  const [filterExam, setFilterExam] = useState("all")
  const [filterYear, setFilterYear] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")

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
      } 
      else if (actionType === "ADD_PROGRAM") {
        await apiCall("ADD", "PROGRAM", { examId: targetParams.examId, name: value })
      }
      else if (actionType === "ADD_MAJOR") {
         await apiCall("ADD", "MAJOR", { programId: targetParams.programId, name: value })
      }
      else if (actionType === "RENAME_EXAM") {
        await apiCall("RENAME", "EXAM", { id: targetParams.examId, name: value })
      }
      else if (actionType === "RENAME_PROGRAM") {
        await apiCall("RENAME", "PROGRAM", { id: targetParams.programId, name: value })
      }
      else if (actionType === "RENAME_MAJOR") {
        await apiCall("RENAME", "MAJOR", { id: targetParams.majorId, name: value })
      }
      else if (actionType === "ADD_SCHOOL") {
        await apiCall("ADD", "SCHOOL", { name: value })
      }
      else if (actionType === "RENAME_SCHOOL") {
        await apiCall("RENAME", "SCHOOL", { id: targetParams.id, name: value })
      }
      else if (actionType === "ADD_COURSE") {
        await apiCall("ADD", "COURSE", { name: value })
      }
      else if (actionType === "RENAME_COURSE") {
        await apiCall("RENAME", "COURSE", { id: targetParams.id, name: value })
      }
      
      await fetchData(); // Refresh all state natively from backend
    } catch(e) {
      console.error(e)
    }
    
    closePrompt();
  }

  // --- Tree Actions ---
  const toggleNode = (id) => {
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const handleDeleteExam = async (examId) => {
    await apiCall("DELETE", "EXAM", { id: examId });
    await fetchData();
  }
  const handleDeleteProgram = async (examId, programId) => {
    await apiCall("DELETE", "PROGRAM", { id: programId });
    await fetchData();
  }
  const handleDeleteMajor = async (examId, programId, majorId) => {
    await apiCall("DELETE", "MAJOR", { id: majorId });
    await fetchData();
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
      } else {
        await apiCall("ADD", "BATCH", { name: newName, target_year: parseInt(batchForm.year), exam_id: batchForm.examId, status: batchForm.status });
      }
      await fetchData();
    } catch(err) {
      console.error(err);
    }
    setIsBatchDialogOpen(false)
  }

  const handleDeleteBatch = async (batchId) => {
    try {
       await apiCall("DELETE", "BATCH", { id: batchId });
       await fetchData();
    } catch (e) {
       console.error("Failed to delete", e);
    }
  }
  
  // Computed Batches Filter
  const filteredBatches = useMemo(() => {
    return batches.filter(batch => {
      if (filterExam !== "all" && batch.exam_id !== parseInt(filterExam)) return false;
      if (filterStatus !== "all" && batch.status !== filterStatus) return false;
      if (filterYear !== "all" && batch.target_year !== parseInt(filterYear)) return false;
      return true;
    });
  }, [batches, filterExam, filterStatus, filterYear]);

  // --- Helper Components ---
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
      className="p-1.5 rounded bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-colors"
      title="Delete"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  )
  
  const SettingsBtn = ({ onClick }) => (
    <button 
      onClick={onClick}
      className="p-1.5 rounded bg-muted/50 text-muted-foreground hover:bg-primary/20 hover:text-primary transition-colors"
      title="Settings"
    >
      <Settings className="h-4 w-4" />
    </button>
  )

  const ExpandBtn = ({ isOpen, onClick }) => (
    <button onClick={onClick} className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-md transition-colors mr-2">
      {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
    </button>
  )

  return (
    <div className="min-h-screen bg-background text-foreground p-8 font-sans">
      
      <CustomPrompt 
        isOpen={promptData.isOpen}
        title={promptData.title}
        value={promptData.value}
        onChange={(val) => setPromptData({...promptData, value: val})}
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

      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-end border-b border-border pb-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2 mb-1">
              <Layers className="h-6 w-6 text-primary" /> Master Data
            </h1>
            <p className="text-sm text-muted-foreground">Manage core system data, structural blueprints, and cohorts.</p>
          </div>
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
              className="space-y-3"
            >
              <div 
                className="bg-card border border-border rounded-2xl p-6 flex items-center justify-between cursor-pointer hover:border-primary/50 hover:shadow-md transition-all group"
                onClick={() => setActiveTab("tree")}
              >
                <div className="flex items-center gap-5">
                  <div className="p-3 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                    <FolderTree className="h-7 w-7" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-lg">Examination Management Data</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Manage examinations, courses, and specializations · {tree.length} examination{tree.length !== 1 ? "s" : ""} registered
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>

              <div 
                className="bg-card border border-border rounded-2xl p-6 flex items-center justify-between cursor-pointer hover:border-primary/50 hover:shadow-md transition-all group"
                onClick={() => setActiveTab("batches")}
              >
                <div className="flex items-center gap-5">
                  <div className="p-3 rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
                    <Calendar className="h-7 w-7" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-lg">Batch Management Data</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Manage cohorts and timelines · {batches.length} batch{batches.length !== 1 ? "es" : ""} registered
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>

              <div 
                className="bg-card border border-border rounded-2xl p-6 flex items-center justify-between cursor-pointer hover:border-primary/50 hover:shadow-md transition-all group"
                onClick={() => setActiveTab("education")}
              >
                <div className="flex items-center gap-5">
                  <div className="p-3 rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
                    <Layers className="h-7 w-7" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-lg">Academic Institutions & Courses</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Manage {schools.length} school{schools.length !== 1 ? "s" : ""} and {academicCourses.length} course{academicCourses.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
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
              className="bg-card border border-border rounded-2xl p-6 shadow-sm relative"
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
                    <div className="flex items-center gap-4 mb-6 pb-4 border-b border-border">
                      <button 
                        onClick={() => setActiveTab("menu")}
                        className="p-2 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <ChevronRight className="h-5 w-5 rotate-180" />
                      </button>
                      <div className="flex-1">
                        <h2 className="text-lg font-bold">Examination Management Data</h2>
                        <p className="text-sm text-muted-foreground">Select an examination to manage its structure.</p>
                      </div>
                      <button 
                        onClick={() => openPrompt("Enter Examination Name:", "ADD_EXAM", null)} 
                        className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2 px-4 rounded-lg flex items-center gap-2 shadow-sm transition-all text-sm"
                      >
                        <PlusCircle className="h-4 w-4" /> Add Examination
                      </button>
                    </div>

                    <div className="space-y-3">
                      {tree.map(exam => {
                        const totalMajors = exam.programs.reduce((acc, p) => acc + p.majors.length, 0);
                        return (
                          <div 
                            key={exam.id}
                            className="bg-background border border-border rounded-xl p-4 flex items-center justify-between cursor-pointer hover:border-primary/50 hover:shadow-sm transition-all group"
                            onClick={() => setSelectedExamId(exam.id)}
                          >
                            <div className="flex items-center gap-4">
                              <div className="p-2.5 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                                <FolderTree className="h-6 w-6" />
                              </div>
                              <div>
                                <h3 className="font-bold text-foreground text-base">{exam.name}</h3>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {exam.programs.length} course{exam.programs.length !== 1 ? "s" : ""} · {totalMajors} specialization{totalMajors !== 1 ? "s" : ""} · Max depth: {exam.maxLevel || 3}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                              <SettingsBtn onClick={() => openExamSettings(exam)} />
                              <DeleteBtn onClick={() => handleDeleteExam(exam.id)} />
                              <ChevronRight className="h-5 w-5 text-muted-foreground ml-2 group-hover:text-primary transition-colors" />
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {tree.length === 0 && (
                      <div className="text-center py-16 text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border mt-4">
                        <FolderTree className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                        <p className="font-medium text-foreground">No examinations yet.</p>
                        <p className="text-sm mt-1">Click &quot;Add Examination&quot; above to create your first one.</p>
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
                      <div className="flex items-center gap-4 mb-6 pb-4 border-b border-border">
                        <button 
                          onClick={() => setSelectedExamId(null)}
                          className="p-2 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <ChevronRight className="h-5 w-5 rotate-180" />
                        </button>
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h2 className="text-lg font-bold">{exam.name}</h2>
                            <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">Max Depth: {exam.maxLevel || 3}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">Manage courses and specializations under this examination.</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => openPrompt("Enter Course / Program Name:", "ADD_PROGRAM", { examId: exam.id })}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2 px-4 rounded-lg flex items-center gap-2 shadow-sm transition-all text-sm"
                          >
                            <PlusCircle className="h-4 w-4" /> Add Course
                          </button>
                          <SettingsBtn onClick={() => openExamSettings(exam)} />
                        </div>
                      </div>

                      {/* Tree detail for this exam */}
                      <div className="min-h-[350px] overflow-x-auto p-4 bg-muted/20 rounded-xl border border-border/50">
                        {exam.programs.length === 0 ? (
                          <div className="text-center py-16 text-muted-foreground">
                            <FolderTree className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                            <p className="font-medium text-foreground">No courses added yet.</p>
                            <p className="text-sm mt-1">Click &quot;Add Course&quot; to start building this examination&apos;s structure.</p>
                          </div>
                        ) : (
                          <div className="pl-4 space-y-3">
                            {exam.programs.map((prog, index) => {
                              const isProgOpen = expandedNodes[prog.id];
                              const isLastProg = index === exam.programs.length - 1;
                              
                              return (
                                <div key={prog.id} className="relative">
                                  {/* Vertical connector between programs */}
                                  {!isLastProg && (
                                    <div className="absolute left-6 top-10 bottom-[-16px] w-[2px]" style={{ backgroundColor: 'rgba(59, 130, 246, 0.25)' }} />
                                  )}

                                  {/* Vertical line for Specializations inside this program */}
                                  {isProgOpen && prog.majors.length > 0 && (
                                    <div className="absolute left-[4.5rem] top-10 bottom-6 w-4 border-l-2 border-transparent" style={{ borderLeftColor: 'rgba(34, 197, 94, 0.35)' }} />
                                  )}

                                  {/* Level 2: Course Box */}
                                  <div className="relative z-10 w-full max-w-[500px] bg-card border-2 border-green-500 rounded-xl px-4 py-3 flex justify-between items-center shadow-sm mb-2">
                                    <div className="flex items-center font-bold text-foreground">
                                      <ExpandBtn isOpen={isProgOpen} onClick={() => toggleNode(prog.id)} />
                                      {prog.name}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button onClick={() => openPrompt("Enter Specialization / Major Name:", "ADD_MAJOR", { examId: exam.id, programId: prog.id })} className="text-green-500 hover:text-green-600 p-1"><PlusCircle className="h-5 w-5" /></button>
                                      <SettingsBtn onClick={() => openPrompt("Rename Course / Program:", "RENAME_PROGRAM", { examId: exam.id, programId: prog.id }, prog.name, prog.name)} />
                                      <DeleteBtn onClick={() => handleDeleteProgram(exam.id, prog.id)} />
                                    </div>
                                    <NodeButton icon={Plus} label="Spec" colorClass="text-green-500" onClick={() => openPrompt("Enter Specialization / Major Name:", "ADD_MAJOR", { examId: exam.id, programId: prog.id })} />
                                  </div>

                                  {/* Level 3: Specializations */}
                                  <AnimatePresence>
                                    {isProgOpen && (
                                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                        <div className="pl-12 pt-1 pb-1 space-y-2 relative z-0">
                                          {prog.majors.map((major, mIndex) => {
                                            const isLastMajor = mIndex === prog.majors.length - 1;
                                            return (
                                              <div key={major.id} className="relative">
                                                <div className="absolute -left-6 top-1/2 w-6 border-t-2 border-transparent" style={{ borderTopColor: 'rgba(34, 197, 94, 0.35)' }} />
                                                {!isLastMajor && (<div className="absolute -left-6 top-1/2 bottom-[-8px] w-[2px]" style={{ backgroundColor: 'rgba(34, 197, 94, 0.35)' }} />)}
                                                
                                                <div className="w-full max-w-[460px] bg-card border-2 border-purple-500 rounded-xl px-4 py-3 flex justify-between items-center shadow-sm relative z-10">
                                                  <div className="font-bold text-foreground pl-6">
                                                    {major.name}
                                                  </div>
                                                  <div className="flex items-center gap-2">
                                                    <SettingsBtn onClick={() => openPrompt("Rename Specialization / Major:", "RENAME_MAJOR", { examId: exam.id, programId: prog.id, majorId: major.id }, major.name, major.name)} />
                                                    <DeleteBtn onClick={() => handleDeleteMajor(exam.id, prog.id, major.id)} />
                                                  </div>
                                                </div>
                                              </div>
                                            )
                                          })}
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>

                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
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
              <div className="w-full bg-card border border-border rounded-2xl p-6 shadow-sm">
                 
                 {/* Back + Header */}
                 <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border">
                   <button 
                     onClick={() => setActiveTab("menu")}
                     className="p-2 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                   >
                     <ChevronRight className="h-5 w-5 rotate-180" />
                   </button>
                   <div className="flex-1">
                     <h2 className="text-lg font-bold flex items-center gap-2 text-foreground">
                      <Calendar className="h-6 w-6 text-primary" /> Batch Management Data
                    </h2>
                    <p className="text-sm text-muted-foreground">Manage cohorts, timelines, and student batches.</p>
                   </div>
                   <button 
                     onClick={handleOpenAddBatch}
                     className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2 px-4 rounded-lg flex items-center gap-2 shadow-sm transition-all text-sm"
                   >
                     <PlusCircle className="h-4 w-4" /> Add New Batch
                   </button>
                 </div>

                 {/* Filters Row */}
                 <div className="flex flex-wrap items-center gap-3 mb-6 bg-muted/30 p-3 rounded-lg border border-border/50">
                    <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mr-2">
                       <Filter className="h-4 w-4" /> Filters:
                    </div>
                    <select 
                      value={filterExam} onChange={e => setFilterExam(e.target.value)}
                      className="bg-background border border-border rounded-md px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary min-w-[140px]"
                    >
                       <option value="all">All Examinations</option>
                       {tree.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                    <select 
                      value={filterYear} onChange={e => setFilterYear(e.target.value)}
                      className="bg-background border border-border rounded-md px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary min-w-[120px]"
                    >
                       <option value="all">All Years</option>
                       <option value="2024">2024</option>
                       <option value="2025">2025</option>
                       <option value="2026">2026</option>
                       <option value="2027">2027</option>
                    </select>
                    <select 
                      value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                      className="bg-background border border-border rounded-md px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary min-w-[120px]"
                    >
                       <option value="all">All Statuses</option>
                       <option value="active">Active</option>
                       <option value="upcoming">Upcoming</option>
                       <option value="completed">Completed</option>
                    </select>
                 </div>
                
                 {/* Batches Table */}
                 <div className="space-y-4">
                  {filteredBatches.length > 0 ? (
                    <div className="rounded-lg border border-border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50 hover:bg-muted/50">
                            <TableHead className="w-[120px]">Status</TableHead>
                            <TableHead>Batch Name</TableHead>
                            <TableHead>Examination</TableHead>
                            <TableHead>Target Year</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredBatches.map(batch => {
                            const exam = tree.find(e => e.id === batch.exam_id)
                            return (
                              <TableRow key={batch.id}>
                                <TableCell>
                                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold ${
                                      batch.status === 'active' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                                      : batch.status === 'upcoming' ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
                                      : 'bg-slate-100 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400'
                                    }`}>
                                      {batch.status === 'active' ? <CheckCircle className="h-3 w-3"/> :
                                      batch.status === 'upcoming' ? <Clock className="h-3 w-3"/> : <XCircle className="h-3 w-3"/>}
                                      <span className="uppercase tracking-wider">{batch.status}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="font-bold text-foreground">
                                  {batch.name}
                                </TableCell>
                                <TableCell>
                                  <span className="text-[10px] uppercase tracking-wider bg-muted text-muted-foreground py-1 px-2.5 rounded-full border border-border font-semibold">
                                     {exam ? exam.name : "Unknown"}
                                  </span>
                                </TableCell>
                                <TableCell className="font-medium text-muted-foreground">
                                  <div className="flex items-center gap-1.5"><Calendar className="h-4 w-4"/> {batch.target_year}</div>
                                </TableCell>
                                <TableCell className="text-right flex justify-end gap-2">
                                  <SettingsBtn onClick={() => handleOpenEditBatch(batch)} />
                                  <DeleteBtn onClick={() => handleDeleteBatch(batch.id)} />
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-16 text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">
                      <FolderTree className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                      <p className="font-medium text-foreground">No batches found matching the filters.</p>
                      <p className="text-sm mt-1">Try adjusting your filters or click &quot;Add New Batch&quot; above.</p>
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
              className="bg-card border border-border rounded-2xl p-6 shadow-sm relative min-h-[400px] flex flex-col gap-10"
            >
              {/* Header */}
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setActiveTab("menu")}
                  className="p-2 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Layers className="h-5 w-5 text-purple-500" />
                  Academic Institutions & Courses
                </h2>
              </div>

              {/* Schools Section */}
              <div>
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    School Management Data
                  </h3>
                  <button 
                    onClick={() => {
                        setSchoolForm({ id: "", name: "", address: "" })
                        setIsSchoolEdit(false)
                        setIsSchoolDialogOpen(true)
                    }}
                    className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-1.5 px-3 rounded-lg shadow-sm transition-all text-sm"
                  >
                    <PlusCircle className="h-4 w-4" /> Add School
                  </button>
                </div>

                <div className={`rounded-lg border border-border ${isSchoolsExpanded ? 'max-h-[350px] overflow-y-auto' : 'overflow-hidden'}`}>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead>School Name</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {schools.length === 0 && (
                         <TableRow>
                            <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">No schools active.</TableCell>
                         </TableRow>
                      )}
                      {(isSchoolsExpanded ? schools : schools.slice(0, 5)).map(school => (
                        <TableRow key={school.id}>
                          <TableCell className="font-bold text-foreground">{school.name}</TableCell>
                          <TableCell className="text-muted-foreground">{school.address || <span className="opacity-50 italic">No Address Configured</span>}</TableCell>
                          <TableCell className="text-right flex justify-end gap-2">
                            <SettingsBtn onClick={() => handleOpenEditSchool(school)} />
                            <DeleteBtn onClick={async () => { await apiCall("DELETE", "SCHOOL", { id: school.id }); await fetchData(); }} />
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
                      className="text-sm font-semibold text-primary hover:text-primary/70 transition-colors"
                    >
                      {isSchoolsExpanded ? "Show Less" : `Show All (${schools.length})`}
                    </button>
                  </div>
                )}
              </div>

              {/* Courses Section */}
              <div>
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    Course Management Data
                  </h3>
                  <button 
                    onClick={() => openPrompt("Add Course", "ADD_COURSE", null, "e.g. BS Computer Science")}
                    className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-1.5 px-3 rounded-lg shadow-sm transition-all text-sm"
                  >
                    <PlusCircle className="h-4 w-4" /> Add Course
                  </button>
                </div>

                <div className={`rounded-lg border border-border ${isCoursesExpanded ? 'max-h-[350px] overflow-y-auto' : 'overflow-hidden'}`}>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead>Course Name</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {academicCourses.length === 0 && (
                         <TableRow>
                            <TableCell colSpan={2} className="text-center py-6 text-muted-foreground">No courses active.</TableCell>
                         </TableRow>
                      )}
                      {(isCoursesExpanded ? academicCourses : academicCourses.slice(0, 5)).map(course => (
                        <TableRow key={course.id}>
                          <TableCell className="font-bold text-foreground">{course.name}</TableCell>
                          <TableCell className="text-right flex justify-end gap-2">
                            <SettingsBtn onClick={() => openPrompt("Rename Course", "RENAME_COURSE", { id: course.id }, "Course Name", course.name)} />
                            <DeleteBtn onClick={async () => { await apiCall("DELETE", "COURSE", { id: course.id }); await fetchData(); }} />
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
                      className="text-sm font-semibold text-primary hover:text-primary/70 transition-colors"
                    >
                      {isCoursesExpanded ? "Show Less" : `Show All (${academicCourses.length})`}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
        )}
      </div>
    </div>
  )
}
