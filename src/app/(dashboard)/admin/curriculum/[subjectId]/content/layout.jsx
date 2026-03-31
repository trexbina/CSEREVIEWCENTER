"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Loader2, ChevronLeft, Plus, FileText, LayoutDashboard, Pencil, Trash, PenTool, GripVertical } from "lucide-react"

export default function SubjectContentLayout({ children }) {
    const params = useParams()
    const router = useRouter()
    const searchParams = useSearchParams()
    const subjectId = params.subjectId

    const [modules, setModules] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState("modules") // modules or files
    
    const [newModuleName, setNewModuleName] = useState("")
    const [addingModule, setAddingModule] = useState(false)

    // Lesson addition states
    const [addingLessonToModule, setAddingLessonToModule] = useState(null)
    const [newLessonType, setNewLessonType] = useState(null)
    const [newLessonTitle, setNewLessonTitle] = useState("")

    // Drag state
    const [dragItem, setDragItem] = useState(null) // { type: 'module'|'lesson', id, moduleId?, index }
    const [dragOverItem, setDragOverItem] = useState(null) // same shape

    useEffect(() => {
        fetchModules()
    }, [subjectId])

    async function fetchModules() {
        try {
            const res = await fetch(`/api/admin/subjects/${subjectId}/modules`)
            if (res.ok) {
                const data = await res.json()
                const fetchedModules = data.modules || []
                setModules(fetchedModules)

                // If no lesson is selected, automatically select the first available one
                if (!searchParams.get("lessonId")) {
                    for (const mod of fetchedModules) {
                        if (mod.lessons && mod.lessons.length > 0) {
                            const firstLesson = mod.lessons[0]
                            router.replace(`/admin/curriculum/${subjectId}/content?lessonId=${firstLesson.id}&type=${firstLesson.lesson_type || 'module'}`)
                            break
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Failed to fetch modules", error)
        } finally {
            setLoading(false)
        }
    }

    async function handleAddModule() {
        if (!newModuleName.trim()) return
        try {
            const res = await fetch(`/api/admin/subjects/${subjectId}/modules`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: "module", title: newModuleName })
            })
            if (res.ok) {
                const data = await res.json()
                setModules([...modules, data.module])
                setNewModuleName("")
                setAddingModule(false)
            }
        } catch (error) {
            console.error(error)
        }
    }

    async function handleAddLesson(moduleId) {
        if (!newLessonTitle.trim() || !newLessonType) return

        try {
            const res = await fetch(`/api/admin/subjects/${subjectId}/modules`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: "lesson", title: newLessonTitle, module_id: moduleId, lesson_type: newLessonType })
            })
            if (res.ok) {
                const data = await res.json()
                setModules(modules.map(m => {
                    if (m.id === moduleId) {
                        return { ...m, lessons: [...(m.lessons || []), data.lesson] }
                    }
                    return m
                }))
                setAddingLessonToModule(null)
                setNewLessonType(null)
                setNewLessonTitle("")
            }
        } catch (error) {
            console.error(error)
        }
    }

    const [editingModuleId, setEditingModuleId] = useState(null)
    const [editingLessonId, setEditingLessonId] = useState(null)
    const [editTitle, setEditTitle] = useState("")

    async function handleEdit(type, id, originalTitle) {
        if (editingModuleId === id || editingLessonId === id) {
            // Save mode
            if (!editTitle.trim() || editTitle.trim() === originalTitle) {
                setEditingModuleId(null)
                setEditingLessonId(null)
                return
            }
            try {
                const res = await fetch(`/api/admin/subjects/${subjectId}/modules`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ type, id, title: editTitle })
                })
                if (res.ok) {
                    if (type === "module") {
                        setModules(modules.map(m => m.id === id ? { ...m, title: editTitle } : m))
                    } else {
                        setModules(modules.map(m => ({
                            ...m,
                            lessons: m.lessons.map(l => l.id === id ? { ...l, title: editTitle } : l)
                        })))
                    }
                }
            } catch (error) {
                console.error(error)
            }
            setEditingModuleId(null)
            setEditingLessonId(null)
        } else {
            // Enter edit mode
            setEditTitle(originalTitle)
            if (type === "module") {
                setEditingModuleId(id)
                setEditingLessonId(null)
            } else {
                setEditingLessonId(id)
                setEditingModuleId(null)
            }
        }
    }

    async function handleDelete(type, id) {
        if (!confirm(`Are you sure you want to delete this ${type}?`)) return
        try {
            const res = await fetch(`/api/admin/subjects/${subjectId}/modules?type=${type}&id=${id}`, {
                method: "DELETE"
            })
            if (res.ok) {
                if (type === "module") {
                    setModules(modules.filter(m => m.id !== id))
                } else {
                    setModules(modules.map(m => ({
                        ...m,
                        lessons: m.lessons.filter(l => l.id !== id)
                    })))
                }
            }
        } catch (error) {
            console.error(error)
        }
    }

    // ── DRAG & DROP HANDLERS ──

    function handleModuleDragStart(e, moduleId, index) {
        setDragItem({ type: 'module', id: moduleId, index })
        e.dataTransfer.effectAllowed = "move"
    }

    function handleModuleDragOver(e, moduleId, index) {
        e.preventDefault()
        e.dataTransfer.dropEffect = "move"
        if (dragItem?.type === 'module') {
            setDragOverItem({ type: 'module', id: moduleId, index })
        }
    }

    function handleModuleDrop(e, targetIndex) {
        e.preventDefault()
        if (!dragItem || dragItem.type !== 'module') { setDragItem(null); setDragOverItem(null); return }

        const newModules = [...modules]
        const [moved] = newModules.splice(dragItem.index, 1)
        newModules.splice(targetIndex, 0, moved)
        setModules(newModules)
        setDragItem(null)
        setDragOverItem(null)
        // TODO: persist new order to backend
    }

    function handleLessonDragStart(e, lessonId, moduleId, index) {
        e.stopPropagation()
        setDragItem({ type: 'lesson', id: lessonId, moduleId, index })
        e.dataTransfer.effectAllowed = "move"
    }

    function handleLessonDragOver(e, lessonId, moduleId, index) {
        e.preventDefault()
        e.stopPropagation()
        e.dataTransfer.dropEffect = "move"
        if (dragItem?.type === 'lesson') {
            setDragOverItem({ type: 'lesson', id: lessonId, moduleId, index })
        }
    }

    function handleLessonDrop(e, targetModuleId, targetIndex) {
        e.preventDefault()
        e.stopPropagation()
        if (!dragItem || dragItem.type !== 'lesson') { setDragItem(null); setDragOverItem(null); return }

        const sourceModuleId = dragItem.moduleId
        const newModules = modules.map(m => ({ ...m, lessons: [...(m.lessons || [])] }))

        const sourceModule = newModules.find(m => m.id === sourceModuleId)
        const targetModule = newModules.find(m => m.id === targetModuleId)
        if (!sourceModule || !targetModule) { setDragItem(null); setDragOverItem(null); return }

        const [movedLesson] = sourceModule.lessons.splice(dragItem.index, 1)
        targetModule.lessons.splice(targetIndex, 0, movedLesson)

        setModules(newModules)
        setDragItem(null)
        setDragOverItem(null)
        // TODO: persist new order/parent to backend
    }

    function handleDragEnd() {
        setDragItem(null)
        setDragOverItem(null)
    }

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        )
    }

    return (
        <div className="flex h-[calc(100vh-64px)] w-full overflow-hidden bg-white">
            {/* Subject Sidebar */}
            <div className="w-80 shrink-0 border-r border-gray-200 bg-white flex flex-col h-full overflow-hidden shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10 transition-all">
                
                {/* School Branding / Header */}
                <div className="p-6 border-b border-gray-100 flex flex-col items-center">
                    <img 
                        src="/assets/Peak_excellence_logo.png" 
                        alt="Peak Excellence" 
                        className="h-12 w-auto object-contain mb-3"
                        onError={(e) => { e.target.style.display = 'none' }}
                    />
                    <h2 className="text-sm font-extrabold tracking-widest text-[#4d4d4d] uppercase font-sans">
                        PEAK EXCELLENCE
                    </h2>
                </div>

                {/* Back button & Toggle Tabs */}
                <div className="p-4 border-b border-gray-100 flex items-center gap-3">
                    <button 
                        onClick={() => router.push('/admin/curriculum')}
                        className="h-8 w-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors"
                        title="Back to Subjects"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    
                    <div className="flex bg-gray-100 rounded-lg p-1 flex-1">
                        <button 
                            onClick={() => setActiveTab("modules")}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === "modules" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                        >
                            Modules
                        </button>
                        <button 
                            onClick={() => setActiveTab("files")}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === "files" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                        >
                            Files
                        </button>
                    </div>
                </div>

                {/* Modules List Scrolling Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
                    {modules.map((module, idx) => (
                        <div 
                            key={module.id} 
                            className={`space-y-3 transition-all ${dragOverItem?.type === 'module' && dragOverItem?.id === module.id && dragItem?.id !== module.id ? 'border-t-2 border-blue-400 pt-2' : ''}`}
                            onDragOver={(e) => handleModuleDragOver(e, module.id, idx)}
                            onDrop={(e) => handleModuleDrop(e, idx)}
                            onDragEnd={handleDragEnd}
                        >
                            {/* Module Header */}
                            <div className="border-b border-gray-100 pb-2 flex justify-between items-center group">
                                <div 
                                    className="flex items-center gap-1.5 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 transition-colors shrink-0"
                                    draggable
                                    onDragStart={(e) => handleModuleDragStart(e, module.id, idx)}
                                >
                                    <GripVertical className="h-4 w-4" />
                                </div>
                                {editingModuleId === module.id ? (
                                    <div className="flex-1 flex items-center gap-2 mr-2">
                                        <input 
                                            type="text" 
                                            value={editTitle} 
                                            onChange={e => setEditTitle(e.target.value)}
                                            onKeyDown={e => e.key === "Enter" && handleEdit("module", module.id, module.title)}
                                            autoFocus
                                            className="w-full text-[13px] font-bold text-gray-700 bg-white border border-gray-300 rounded px-2 py-1 outline-none focus:border-[#f5cdd0]" 
                                        />
                                    </div>
                                ) : (
                                    <h3 className="text-[13px] font-bold text-gray-600 flex-1 ml-1">
                                        {module.title}
                                    </h3>
                                )}

                                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleEdit("module", module.id, module.title) }}
                                        className={`p-1 rounded hover:bg-gray-100 transition-colors ${editingModuleId === module.id ? "text-green-600 font-bold text-[10px] w-auto px-2" : "text-gray-400 hover:text-blue-500"}`}
                                        title="Edit Module"
                                    >
                                        {editingModuleId === module.id ? "SAVE" : <Pencil className="h-3 w-3" />}
                                    </button>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleDelete("module", module.id) }}
                                        className="p-1 text-gray-400 hover:text-red-500 rounded hover:bg-gray-100 transition-colors"
                                        title="Delete Module"
                                    >
                                        <Trash className="h-3 w-3" />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider pl-1">
                                    LESSONS
                                </p>
                                
                                {/* Lessons */}
                                {module.lessons?.map((lesson, lIdx) => (
                                    <div 
                                        key={lesson.id}
                                        onDragOver={(e) => handleLessonDragOver(e, lesson.id, module.id, lIdx)}
                                        onDrop={(e) => handleLessonDrop(e, module.id, lIdx)}
                                        onDragEnd={handleDragEnd}
                                        onClick={() => {
                                            if (editingLessonId !== lesson.id) router.push(`/admin/curriculum/${subjectId}/content?lessonId=${lesson.id}&type=${lesson.lesson_type || 'module'}`)
                                        }}
                                        className={`p-3 bg-white border rounded-lg shadow-sm cursor-pointer hover:border-blue-400 hover:shadow-md transition-all group flex items-center justify-between ${
                                            dragOverItem?.type === 'lesson' && dragOverItem?.id === lesson.id && dragItem?.id !== lesson.id 
                                                ? 'border-blue-400 border-t-2' 
                                                : 'border-gray-200'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            <div 
                                                className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 transition-colors shrink-0" 
                                                draggable
                                                onDragStart={(e) => handleLessonDragStart(e, lesson.id, module.id, lIdx)}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <GripVertical className="h-3.5 w-3.5" />
                                            </div>
                                            {editingLessonId === lesson.id ? (
                                                <div className="flex-1 flex items-center gap-2 mr-2">
                                                    <input 
                                                        type="text" 
                                                        value={editTitle} 
                                                        onChange={e => setEditTitle(e.target.value)}
                                                        onKeyDown={e => e.key === "Enter" && handleEdit("lesson", lesson.id, lesson.title)}
                                                        autoFocus
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="w-full text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded px-2 py-1 outline-none focus:border-[#f5cdd0]" 
                                                    />
                                                </div>
                                            ) : (
                                                <p className="text-sm font-semibold text-gray-700 group-hover:text-blue-600 transition-colors flex-1 line-clamp-2 pr-2">
                                                    {lesson.title}
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleEdit("lesson", lesson.id, lesson.title) }}
                                                className={`p-1.5 rounded bg-gray-50 hover:bg-blue-50 transition-colors ${editingLessonId === lesson.id ? "text-green-600 font-bold text-[10px] w-auto px-2" : "text-gray-400 hover:text-blue-500"}`}
                                                title="Edit Lesson"
                                            >
                                                {editingLessonId === lesson.id ? "SAVE" : <Pencil className="h-3.5 w-3.5" />}
                                            </button>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleDelete("lesson", lesson.id) }}
                                                className="p-1.5 text-gray-400 hover:text-red-500 rounded bg-gray-50 hover:bg-red-50 transition-colors"
                                                title="Delete Lesson"
                                            >
                                                <Trash className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                {/* Lesson drop zone at the end of a module's lesson list */}
                                {dragItem?.type === 'lesson' && (
                                    <div 
                                        className="h-8 border-2 border-dashed border-blue-300 rounded-lg bg-blue-50/50 flex items-center justify-center text-blue-400 text-xs font-bold"
                                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOverItem({ type: 'lesson', id: 'end', moduleId: module.id, index: (module.lessons?.length || 0) }) }}
                                        onDrop={(e) => handleLessonDrop(e, module.id, module.lessons?.length || 0)}
                                    >
                                        Drop here
                                    </div>
                                )}

                                {/* Add Lesson Button & Dropdown */}
                                <div className="relative">
                                    {addingLessonToModule === module.id ? (
                                        <div className="bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2">
                                            {!newLessonType ? (
                                                <div className="flex flex-col">
                                                    <button onClick={() => setNewLessonType('module')} className="flex items-center gap-3 px-4 py-3 text-xs font-semibold text-gray-700 hover:bg-gray-50 border-b border-gray-100 transition-colors">
                                                        <PenTool className="h-3.5 w-3.5 text-gray-400" /> Module Builder
                                                    </button>
                                                    <button onClick={() => setNewLessonType('pdf')} className="flex items-center gap-3 px-4 py-3 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                                                        <FileText className="h-3.5 w-3.5 text-gray-400" /> PDF Builder
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="p-3 bg-gray-50 flex flex-col gap-2">
                                                    <div className="flex items-center gap-2 mb-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                                        {newLessonType === 'module' ? <PenTool className="h-3 w-3"/> : <FileText className="h-3 w-3"/>}
                                                        New {newLessonType} Lesson
                                                    </div>
                                                    <input 
                                                        type="text" 
                                                        placeholder="Name lesson here..." 
                                                        value={newLessonTitle}
                                                        onChange={(e) => setNewLessonTitle(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') handleAddLesson(module.id)
                                                            if (e.key === 'Escape') { setAddingLessonToModule(null); setNewLessonType(null); setNewLessonTitle(""); }
                                                        }}
                                                        autoFocus
                                                        className="w-full text-sm rounded border border-gray-300 px-2 py-1.5 focus:outline-none focus:border-[#f5cdd0]"
                                                    />
                                                    <div className="flex gap-2 mt-1">
                                                        <button onClick={() => handleAddLesson(module.id)} className="flex-1 bg-[#f5cdd0] text-[#ba5a62] hover:bg-[#eeb8bc] font-bold text-xs py-1.5 rounded transition-colors">Save</button>
                                                        <button onClick={() => { setAddingLessonToModule(null); setNewLessonType(null); setNewLessonTitle(""); }} className="flex-1 bg-white border border-gray-200 text-gray-500 font-bold text-xs py-1.5 rounded hover:bg-gray-50 transition-colors">Cancel</button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={() => setAddingLessonToModule(module.id)}
                                            className="w-full flex items-center justify-center py-2.5 bg-gray-50 hover:bg-gray-100 border border-transparent hover:border-gray-200 text-gray-400 hover:text-gray-600 rounded-lg transition-all"
                                        >
                                            <Plus className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Add Module Area */}
                    <div className="pt-4 border-t border-gray-100">
                        {!addingModule ? (
                            <button 
                                onClick={() => setAddingModule(true)}
                                className="w-full py-2.5 bg-[#fef5f6] hover:bg-[#fce9ea] text-[#ba5a62] text-sm font-bold rounded-lg border border-[#f5cdd0] border-dashed transition-colors"
                            >
                                + ADD NEW MODULE
                            </button>
                        ) : (
                            <div className="space-y-2 bg-gray-50 p-3 rounded-xl border border-gray-200">
                                <input 
                                    type="text" 
                                    placeholder="Module Name..." 
                                    className="w-full p-2 text-sm rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#f5cdd0]"
                                    value={newModuleName}
                                    onChange={e => setNewModuleName(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') handleAddModule(); if (e.key === 'Escape') setAddingModule(false); }}
                                    autoFocus
                                />
                                <div className="flex gap-2">
                                    <button onClick={handleAddModule} className="flex-1 bg-[#f5cdd0] text-[#ba5a62] hover:bg-[#eeb8bc] font-bold text-xs py-1.5 rounded transition-colors">Save</button>
                                    <button onClick={() => setAddingModule(false)} className="flex-1 bg-white border border-gray-200 text-gray-500 font-bold text-xs py-1.5 rounded hover:bg-gray-50 transition-colors">Cancel</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content Area (Builder) */}
            <div className="flex-1 overflow-y-auto bg-[#f5f5f5]">
                {children}
            </div>
            
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: #e5e7eb;
                    border-radius: 20px;
                }
            `}</style>
        </div>
    )
}
