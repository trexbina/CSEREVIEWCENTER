// this tells nextjs to run this layout in the browser
"use client"

// helper functions from react to store data and run actions
import { useState, useEffect, useMemo } from "react"

// helper functions from nextjs to read the url parameters and navigate between pages
import { useParams, useRouter, useSearchParams } from "next/navigation"

// icons used on the buttons and lesson items
import { Loader2, ChevronLeft, Plus, FileText, Pencil, Trash, PenTool, GripVertical, Menu, X, HelpCircle } from "lucide-react"

// confirmation modal popup before deleting a module or lesson
import ConfirmDeleteModal from "@/components/confirm-delete-modal"
import { extractSubjectFiles } from "@/lib/subject-files"
import SubjectFileViewerModal from "@/components/subject-file-viewer-modal"

// main sidebar and workspace layout for editing modules and lessons inside a subject
export default function SubjectContentLayout({ children }) {
    const params = useParams()
    const router = useRouter()
    const searchParams = useSearchParams()
    const subjectId = params.subjectId

    // lists and details fetched from server
    const [modules, setModules] = useState([])
    const [subjectInfo, setSubjectInfo] = useState(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState("modules")
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const [viewingFile, setViewingFile] = useState(null)

    const subjectFiles = useMemo(() => extractSubjectFiles(modules), [modules])

    // module creation state
    const [newModuleName, setNewModuleName] = useState("")
    const [addingModule, setAddingModule] = useState(false)

    // lesson creation states
    const [addingLessonToModule, setAddingLessonToModule] = useState(null)
    const [newLessonType, setNewLessonType] = useState(null)
    const [newLessonTitle, setNewLessonTitle] = useState("")

    // drag and drop states for moving modules and lessons
    const [dragItem, setDragItem] = useState(null)
    const [dragOverItem, setDragOverItem] = useState(null)
    const [deleteTarget, setDeleteTarget] = useState(null)

    // download modules and lessons when subject id is ready
    useEffect(() => {
        fetchModules()
    }, [subjectId])

    // fetch all modules and lessons for this subject
    async function fetchModules() {
        try {
            const res = await fetch(`/api/admin/subjects/${subjectId}/modules`)
            if (res.ok) {
                const data = await res.json()
                const fetchedModules = data.modules || []
                setModules(fetchedModules)
                if (data.subject) {
                    setSubjectInfo(data.subject)
                }

                // if no lesson is currently selected in url automatically open the first lesson
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

    // add a new module to this subject
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

    const [isSubmittingLesson, setIsSubmittingLesson] = useState(false)

    // add a new lesson inside a module
    async function handleAddLesson(moduleId) {
        if (!newLessonTitle.trim() || !newLessonType || isSubmittingLesson) return

        setIsSubmittingLesson(true)
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
                if (data?.lesson?.id) {
                    router.replace(`/admin/curriculum/${subjectId}/content?lessonId=${data.lesson.id}&type=${data.lesson.lesson_type || 'module'}`)
                }
            }
        } catch (error) {
            console.error(error)
        } finally {
            setIsSubmittingLesson(false)
        }
    }

    const [editingModuleId, setEditingModuleId] = useState(null)
    const [editingLessonId, setEditingLessonId] = useState(null)
    const [editTitle, setEditTitle] = useState("")

    // rename a module or a lesson
    async function handleEdit(type, id, originalTitle) {
        if (editingModuleId === id || editingLessonId === id) {
            // save the new title
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
                        if (typeof window !== "undefined") {
                            window.dispatchEvent(new CustomEvent("peak_lesson_title_updated", {
                                detail: { lessonId: id, title: editTitle }
                            }))
                        }
                    }
                }
            } catch (error) {
                console.error(error)
            }
            setEditingModuleId(null)
            setEditingLessonId(null)
        } else {
            // open the edit text box
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

    // delete a module or lesson from the database
    async function deleteItem(type, id) {
        try {
            const res = await fetch(`/api/admin/subjects/${subjectId}/modules?type=${type}&id=${id}`, {
                method: "DELETE"
            })
            if (res.ok) {
                let updatedModules = []
                if (type === "module") {
                    updatedModules = modules.filter(m => m.id !== id)
                    setModules(updatedModules)
                } else {
                    updatedModules = modules.map(m => ({
                        ...m,
                        lessons: m.lessons.filter(l => l.id !== id)
                    }))
                    setModules(updatedModules)
                }

                // if the deleted lesson was open on the screen switch to the next available lesson
                const currentLessonId = searchParams.get("lessonId")
                const isCurrentLessonDeleted = (type === "lesson" && currentLessonId === id.toString()) ||
                    (type === "module" && modules.find(m => m.id === id)?.lessons?.some(l => l.id.toString() === currentLessonId))

                if (isCurrentLessonDeleted) {
                    let nextLesson = null
                    for (const mod of updatedModules) {
                        if (mod.lessons && mod.lessons.length > 0) {
                            nextLesson = mod.lessons[0]
                            break
                        }
                    }
                    if (nextLesson) {
                        router.replace(`/admin/curriculum/${subjectId}/content?lessonId=${nextLesson.id}&type=${nextLesson.lesson_type || 'module'}`)
                    } else {
                        router.replace(`/admin/curriculum/${subjectId}/content`)
                    }
                }
            }
        } catch (error) {
            console.error(error)
        }
    }

    // show the delete confirmation popup
    function handleDelete(type, id) {
        setDeleteTarget({ type, id })
    }

    // drag and drop handlers to reorder modules and lessons
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

    // loading spinner while subject and modules are loading
    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-white">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        )
    }

    return (
        <div className="flex relative h-screen w-full overflow-hidden bg-white">

            {/* mobile sidebar open button */}
            <button
                onClick={() => setIsSidebarOpen(true)}
                className="md:hidden absolute bottom-6 right-6 z-40 h-14 w-14 bg-[#ba5a62] text-white rounded-full shadow-2xl shadow-black/30 flex items-center justify-center hover:bg-[#a64e56] transition-transform active:scale-95"
            >
                <Menu className="h-6 w-6" />
            </button>

            {/* mobile backdrop overlay */}
            {isSidebarOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black/50 z-40 transition-opacity"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* left sidebar with module and lesson navigation */}
            <div className={`
                absolute md:static inset-y-0 left-0 z-50 
                w-80 shrink-0 border-r border-gray-200 bg-white flex flex-col h-full overflow-hidden shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-transform duration-300 ease-in-out
                ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0 md:shadow-none'}
            `}>

                {/* sidebar header with school logo */}
                <div className="px-5 py-4 flex items-center justify-between border-b border-gray-200">
                    <div className="flex items-center gap-3 select-none">
                        <img
                            src="/landingpageassets/logo.png"
                            alt="Peak Excellence Review Center"
                            className="size-10 shrink-0 object-contain"
                            onError={(e) => { e.target.style.display = 'none' }}
                        />
                        <div className="flex flex-col leading-tight select-none">
                            <span className="text-[15px] font-black tracking-wider text-[#3B3B3B] dark:text-white uppercase font-sans">
                                PEAK
                            </span>
                            <span className="text-[12px] font-semibold tracking-wide text-[#696969] dark:text-gray-400 font-sans -mt-0.5">
                                Excellence
                            </span>
                        </div>
                    </div>
                    {/* close sidebar button for mobile screens */}
                    <button
                        className="md:hidden p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                        onClick={() => setIsSidebarOpen(false)}
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* back button beside modules and files tabs */}
                <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2">
                    <button
                        onClick={() => {
                            if (subjectInfo) {
                                if (subjectInfo.category_id && subjectInfo.subcategory_id) {
                                    if (typeof window !== "undefined") {
                                        sessionStorage.setItem("admin_curriculum_cat_id", String(subjectInfo.category_id))
                                        sessionStorage.setItem("admin_curriculum_sub_id", String(subjectInfo.subcategory_id))
                                    }
                                    router.push(`/admin/curriculum?cat=${subjectInfo.category_id}&sub=${subjectInfo.subcategory_id}`)
                                    return
                                }
                                if (subjectInfo.category_id) {
                                    if (typeof window !== "undefined") {
                                        sessionStorage.setItem("admin_curriculum_cat_id", String(subjectInfo.category_id))
                                        sessionStorage.removeItem("admin_curriculum_sub_id")
                                    }
                                    router.push(`/admin/curriculum?cat=${subjectInfo.category_id}`)
                                    return
                                }
                            }
                            router.push('/admin/curriculum')
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200/50 bg-gray-100 text-gray-600 transition-all hover:bg-gray-200 hover:text-gray-900 shadow-sm shrink-0 cursor-pointer"
                        title="Back to Subjects"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>

                    <div className="flex bg-gray-100/80 rounded-xl p-0.5 flex-1 border border-gray-200/40">
                        <button
                            onClick={() => setActiveTab("modules")}
                            className={`flex-1 py-1.5 text-xs rounded-lg transition-all cursor-pointer ${activeTab === "modules" ? "bg-white text-gray-700 font-semibold shadow-2xs" : "text-gray-400 hover:text-gray-600 font-medium"}`}
                        >
                            Modules
                        </button>
                        <button
                            onClick={() => setActiveTab("files")}
                            className={`flex-1 py-1.5 text-xs rounded-lg transition-all cursor-pointer ${activeTab === "files" ? "bg-white text-gray-700 font-semibold shadow-2xs" : "text-gray-400 hover:text-gray-600 font-medium"}`}
                        >
                            Files
                        </button>
                    </div>
                </div>

                {/* tab content */}
                {activeTab === "files" ? (
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                        <div className="flex items-center justify-between pb-1">
                            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider pl-1">
                                Files ({subjectFiles.length})
                            </span>
                        </div>

                        {subjectFiles.length === 0 ? (
                            <div className="py-16 text-center px-4">
                                <p className="text-xs font-medium text-gray-500">
                                    No files uploaded yet in this subject.
                                </p>
                                <p className="text-[11px] text-gray-400 mt-1">
                                    Files uploaded to modules, lessons, or quizzes will appear here.
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {subjectFiles.map((file) => (
                                    <div
                                        key={file.id}
                                        className="py-2.5 first:pt-1 last:pb-1 flex flex-col gap-1 text-left"
                                    >
                                        <button
                                            type="button"
                                            onClick={() => setViewingFile(file)}
                                            className="text-blue-600 hover:text-blue-700 underline text-[13px] font-medium cursor-pointer transition-colors text-left line-clamp-1 block w-full p-0"
                                            title={file.name}
                                        >
                                            {file.name}
                                        </button>
                                        <div className="flex items-center justify-between gap-2 text-[11px] text-gray-400">
                                            <span className="truncate" title={file.source}>
                                                From: {file.source}
                                            </span>
                                            <span className="shrink-0 uppercase font-medium text-[10px] text-gray-400 tracking-wider">
                                                {file.type}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    /* list of modules and their lessons */
                    <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
                    {modules.map((module, idx) => (
                        <div
                            key={module.id}
                            className={`space-y-3 transition-all ${dragOverItem?.type === 'module' && dragOverItem?.id === module.id && dragItem?.id !== module.id ? 'border-t-2 border-blue-400 pt-2' : ''}`}
                            onDragOver={(e) => handleModuleDragOver(e, module.id, idx)}
                            onDrop={(e) => handleModuleDrop(e, idx)}
                            onDragEnd={handleDragEnd}
                        >
                            {/* module title bar */}
                            <div className="border-b border-gray-200 pb-2 flex justify-between items-start gap-2 group">
                                <div className="flex items-start gap-1.5 min-w-0 flex-1">
                                    <div
                                        className="flex items-center gap-1.5 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 transition-colors shrink-0 pt-0.5"
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
                                                className="w-full text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg px-2.5 py-1 outline-none focus:border-gray-400"
                                            />
                                        </div>
                                    ) : (
                                        <h3 className="text-sm font-semibold text-gray-700 flex-1 ml-1 leading-snug break-words pr-2" title={module.title}>
                                            {module.title}
                                        </h3>
                                    )}
                                </div>

                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 pt-0.5">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleEdit("module", module.id, module.title) }}
                                        className={`p-1.5 rounded-lg transition-colors ${editingModuleId === module.id ? "bg-[#E9C46A] text-slate-900 font-bold text-[10px] w-auto px-2" : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"}`}
                                        title="Edit Module"
                                    >
                                        {editingModuleId === module.id ? "SAVE" : <Pencil className="h-3.5 w-3.5" />}
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDelete("module", module.id) }}
                                        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                        title="Delete Module"
                                    >
                                        <Trash className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider pl-1">
                                    LESSONS
                                </p>

                                {module.lessons?.map((lesson, lIdx) => {
                                    const isSelected = searchParams.get("lessonId") === lesson.id.toString();

                                    return (
                                        <div
                                            key={lesson.id}
                                            onDragOver={(e) => handleLessonDragOver(e, lesson.id, module.id, lIdx)}
                                            onDrop={(e) => handleLessonDrop(e, module.id, lIdx)}
                                            onDragEnd={handleDragEnd}
                                            onClick={() => {
                                                if (editingLessonId !== lesson.id) {
                                                    router.replace(`/admin/curriculum/${subjectId}/content?lessonId=${lesson.id}&type=${lesson.lesson_type || 'module'}`);
                                                    setIsSidebarOpen(false);
                                                }
                                            }}
                                            className={`p-2.5 rounded-lg transition-all group flex items-center justify-between cursor-pointer border ${
                                                isSelected
                                                    ? 'bg-gray-50/90 border-gray-200/90 shadow-2xs'
                                                    : 'bg-white border-gray-200/60 hover:bg-gray-50/60 hover:border-gray-300/70 hover:shadow-2xs'
                                            } ${
                                                dragOverItem?.type === 'lesson' && dragOverItem?.id === lesson.id && dragItem?.id !== lesson.id
                                                    ? 'border-[#E9C46A] border-t-2'
                                                    : ''
                                            }`}
                                        >
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                <div
                                                    className={`cursor-grab active:cursor-grabbing transition-colors shrink-0 ${
                                                        isSelected ? 'text-gray-400' : 'text-gray-300 hover:text-gray-500'
                                                    }`}
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
                                                            className="w-full text-[13.5px] font-medium text-gray-700 bg-white border border-gray-300 rounded-md px-2 py-1 outline-none focus:border-gray-400"
                                                        />
                                                    </div>
                                                ) : (
                                                    <p
                                                        className={`text-[13.5px] transition-colors flex-1 line-clamp-2 pr-2 ${
                                                            isSelected ? 'text-gray-700 font-medium' : 'text-gray-500 font-normal group-hover:text-gray-700'
                                                        }`}
                                                        title={lesson.title}
                                                    >
                                                        {lesson.title}
                                                    </p>
                                                )}
                                            </div>

                                            <div className={`flex items-center gap-0.5 transition-opacity shrink-0 ${
                                                isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                            }`}>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleEdit("lesson", lesson.id, lesson.title) }}
                                                    className={`p-1 rounded-md transition-colors ${editingLessonId === lesson.id ? "bg-[#E9C46A] text-slate-900 font-bold text-[10px] w-auto px-2" : "text-gray-400 hover:text-gray-700 hover:bg-gray-200/70"}`}
                                                    title="Edit Lesson"
                                                >
                                                    {editingLessonId === lesson.id ? "SAVE" : <Pencil className="h-3 w-3" />}
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDelete("lesson", lesson.id) }}
                                                    className="p-1 text-gray-400 hover:text-red-500 hover:bg-gray-200/70 rounded-md transition-colors"
                                                    title="Delete Lesson"
                                                >
                                                    <Trash className="h-3 w-3" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* lesson drop zone at the end of a module list */}
                                {dragItem?.type === 'lesson' && (
                                    <div
                                        className="h-8 border-2 border-solid border-blue-300 rounded-xl bg-blue-50/50 flex items-center justify-center text-blue-500 text-xs font-bold"
                                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOverItem({ type: 'lesson', id: 'end', moduleId: module.id, index: (module.lessons?.length || 0) }) }}
                                        onDrop={(e) => handleLessonDrop(e, module.id, module.lessons?.length || 0)}
                                    >
                                        Drop here
                                    </div>
                                )}

                                {/* button and dropdown to add a new lesson or quiz */}
                                <div className="relative">
                                    <button
                                        onClick={() => {
                                            if (addingLessonToModule === module.id) {
                                                setAddingLessonToModule(null);
                                                setNewLessonType(null);
                                                setNewLessonTitle("");
                                            } else {
                                                setAddingLessonToModule(module.id);
                                            }
                                        }}
                                        className={`w-full flex items-center justify-center py-2 rounded-lg transition-all cursor-pointer shadow-2xs border ${
                                            addingLessonToModule === module.id
                                                ? "bg-gray-200 text-gray-700 border-transparent hover:bg-gray-300/80"
                                                : "bg-gray-50/80 hover:bg-gray-100 border-gray-200/80 text-gray-400 hover:text-gray-600 hover:border-gray-300"
                                        }`}
                                        title={addingLessonToModule === module.id ? "Close Menu" : "Add Lesson"}
                                    >
                                        {addingLessonToModule === module.id ? (
                                            <X className="h-3.5 w-3.5 transition-transform duration-200" />
                                        ) : (
                                            <Plus className="h-3.5 w-3.5" />
                                        )}
                                    </button>

                                    {addingLessonToModule === module.id && (
                                        <div className="mt-2 bg-white border border-gray-200/80 rounded-xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-2">
                                            {!newLessonType ? (
                                                <div className="flex flex-col">
                                                    <button onClick={() => setNewLessonType('module')} className="flex items-center gap-3 px-4 py-3 text-xs font-semibold text-gray-700 hover:bg-gray-50 border-b border-gray-100 transition-colors">
                                                        <PenTool className="h-3.5 w-3.5 text-gray-400" /> Module Builder
                                                    </button>
                                                    <button onClick={() => setNewLessonType('pdf')} className="flex items-center gap-3 px-4 py-3 text-xs font-semibold text-gray-700 hover:bg-gray-50 border-b border-gray-100 transition-colors">
                                                        <FileText className="h-3.5 w-3.5 text-gray-400" /> PDF Builder
                                                    </button>
                                                    <button onClick={() => setNewLessonType('quiz')} className="flex items-center gap-3 px-4 py-3 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                                                        <HelpCircle className="h-3.5 w-3.5 text-gray-400" /> Quiz/Assignment Builder
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="p-3 bg-white flex flex-col gap-2.5 rounded-xl border border-gray-200/80 shadow-2xs">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                                            {newLessonType === 'quiz' ? 'Quiz Name' : 'Lesson Title'}
                                                        </span>
                                                        <button
                                                            onClick={() => { setAddingLessonToModule(null); setNewLessonType(null); setNewLessonTitle(""); }}
                                                            className="text-gray-400 hover:text-gray-600 p-0.5 rounded transition-colors"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                    <input
                                                        type="text"
                                                        placeholder={newLessonType === 'quiz' ? "Name quiz here..." : "Name lesson here..."}
                                                        value={newLessonTitle}
                                                        onChange={(e) => setNewLessonTitle(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') handleAddLesson(module.id)
                                                            if (e.key === 'Escape') { setAddingLessonToModule(null); setNewLessonType(null); setNewLessonTitle(""); }
                                                        }}
                                                        autoFocus
                                                        className="w-full text-xs font-medium text-gray-800 bg-gray-50/80 rounded-lg border border-gray-200/80 px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-gray-300 transition-all placeholder:text-gray-400"
                                                    />
                                                    <div className="flex items-center justify-end gap-1.5 pt-0.5">
                                                        <button
                                                            onClick={() => { setAddingLessonToModule(null); setNewLessonType(null); setNewLessonTitle(""); }}
                                                            className="px-2 py-0.5 text-xs font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            onClick={() => handleAddLesson(module.id)}
                                                            disabled={!newLessonTitle.trim() || isSubmittingLesson}
                                                            className="px-2.5 py-0.5 bg-[#E9C46A] hover:bg-[#dfb550] disabled:opacity-50 disabled:pointer-events-none text-white text-xs font-medium rounded-md shadow-2xs transition-colors flex items-center gap-1"
                                                        >
                                                            {isSubmittingLesson ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                                                            <span>Save</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* add new module section */}
                    <div className="pt-4 border-t border-gray-100">
                        {!addingModule ? (
                            <button
                                onClick={() => setAddingModule(true)}
                                className="w-full py-2.5 bg-[#E9C46A] hover:bg-[#dfb550] text-white text-xs font-bold tracking-wide rounded-lg transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer uppercase"
                            >
                                ADD NEW MODULE
                            </button>
                        ) : (
                            <div className="space-y-2.5 bg-white p-3 rounded-xl border border-gray-200/80 shadow-2xs">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                        New Module
                                    </span>
                                    <button
                                        onClick={() => setAddingModule(false)}
                                        className="text-gray-400 hover:text-gray-600 p-0.5 rounded transition-colors"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Module name..."
                                    className="w-full px-2.5 py-1.5 text-xs font-medium text-gray-800 rounded-lg border border-gray-200/80 bg-gray-50/80 focus:outline-none focus:bg-white focus:border-gray-300 transition-all placeholder:text-gray-400"
                                    value={newModuleName}
                                    onChange={e => setNewModuleName(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') handleAddModule(); if (e.key === 'Escape') setAddingModule(false); }}
                                    autoFocus
                                />
                                <div className="flex items-center justify-end gap-1.5 pt-0.5">
                                    <button
                                        onClick={() => setAddingModule(false)}
                                        className="px-2 py-0.5 text-xs font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleAddModule}
                                        disabled={!newModuleName.trim()}
                                        className="px-2.5 py-0.5 bg-[#E9C46A] hover:bg-[#dfb550] disabled:opacity-50 disabled:pointer-events-none text-white text-xs font-medium rounded-md shadow-2xs transition-colors"
                                    >
                                        Save
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                    </div>
                )}
            </div>

            {/* main content area showing lesson editor */}
            <div className="flex-1 overflow-y-auto bg-[#f5f5f5]">
                {children}
            </div>

            {/* popup modal to view subject file */}
            <SubjectFileViewerModal
                file={viewingFile}
                onClose={() => setViewingFile(null)}
                isStudent={false}
            />

            {/* popup modal to confirm delete */}
            <ConfirmDeleteModal
                isOpen={!!deleteTarget}
                title={`Delete ${deleteTarget?.type || "Item"}`}
                description={`Are you sure you want to delete this ${deleteTarget?.type || "item"}? This action cannot be undone.`}
                confirmText="Delete"
                onConfirm={async () => {
                    if (!deleteTarget) return
                    const { type, id } = deleteTarget
                    setDeleteTarget(null)
                    await deleteItem(type, id)
                }}
                onCancel={() => setDeleteTarget(null)}
            />

            <style jsx global>{`
                .custom-scrollbar {
                    scrollbar-width: thin;
                    scrollbar-color: transparent transparent;
                    transition: scrollbar-color 0.2s ease;
                }
                .custom-scrollbar:hover {
                    scrollbar-color: #cbd5e1 transparent;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                    height: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: transparent;
                    border-radius: 20px;
                    transition: background-color 0.2s ease;
                }
                .custom-scrollbar:hover::-webkit-scrollbar-thumb {
                    background-color: #cbd5e1;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background-color: #94a3b8;
                }
            `}</style>
        </div>
    )
}
