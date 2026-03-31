"use client"

import { useEffect, useState, useCallback } from "react"
import { Loader2, X, Pencil, Trash, ArrowLeft, Image as ImageIcon } from "lucide-react"
import Link from "next/link"

export default function CurriculumManagerPage() {
    const [categories, setCategories] = useState([])
    const [subcategories, setSubcategories] = useState([])
    const [subjects, setSubjects] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const [selectedCategory, setSelectedCategory] = useState(null)
    const [selectedSubcategory, setSelectedSubcategory] = useState(null)
    
    // UI states
    const [showCatInput, setShowCatInput] = useState(false)
    const [newCatName, setNewCatName] = useState("")
    const [saving, setSaving] = useState(false)

    // Category Edit state
    const [editingCategoryId, setEditingCategoryId] = useState(null)
    const [editCatName, setEditCatName] = useState("")

    // Subcategory Modal state
    const [isSubModalOpen, setIsSubModalOpen] = useState(false)
    const [subModalMode, setSubModalMode] = useState("add") // "add" or "edit"
    const [subModalData, setSubModalData] = useState({
        id: null,
        name: "",
        description: "",
        status: "active"
    })

    // Subject Form state (for future or current basic edits if needed)
    // Here we focus on UI, but we'll add a modal for Subject too so they can set image/desc
    const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false)
    const [subjectModalMode, setSubjectModalMode] = useState("add")
    const [subjectModalData, setSubjectModalData] = useState({
        id: null,
        title: "",
        code: "",
        description: "",
        image_url: "",
        imageFile: null,
        unlock_date: "",
        status: "active"
    })

    // ── Data Fetching ──
    const fetchData = useCallback(async () => {
        try {
            const [catRes, subRes, subjRes] = await Promise.all([
                fetch("/api/admin/categories"),
                selectedCategory ? fetch(`/api/admin/subcategories?category_id=${selectedCategory.id}`) : Promise.resolve({ ok: true, json: () => ({ subcategories: [] }) }),
                fetch("/api/admin/subjects")
            ])
            
            if (!catRes.ok) throw new Error("Failed to load categories")
            let catData = await catRes.json()
            setCategories(catData.categories || [])
            
            if (selectedCategory && subRes.ok) {
                let subData = await subRes.json()
                setSubcategories(subData.subcategories || [])
            } else {
                setSubcategories([])
            }
            
            if (subjRes.ok) {
                let subjData = await subjRes.json()
                setSubjects(subjData.subjects || [])
            }
            
            if (!selectedCategory && catData.categories?.length > 0) {
                setSelectedCategory(catData.categories[0])
            }
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [selectedCategory])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    // Filter subjects by the currently selected subcategory
    const currentSubjects = subjects.filter(
        s => s.subcategory_id === selectedSubcategory?.id 
        // Fallback: if migrating old data with only string category, we might check that too, 
        // but new design uses subcategory_id
    )

    // ── Category Methods ──
    async function handleAddCategory() {
        if (!newCatName.trim()) return
        setSaving(true)
        try {
            const res = await fetch("/api/admin/categories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newCatName.trim() }),
            })
            if (!res.ok) throw new Error((await res.json()).error || "Failed to add category")
            const data = await res.json()
            setCategories((prev) => [...prev, data.category])
            if (!selectedCategory) setSelectedCategory(data.category)
            setNewCatName("")
            setShowCatInput(false)
        } catch (err) { alert(err.message) } finally { setSaving(false) }
    }

    async function handleEditCategory(catId) {
        if (!editCatName.trim()) return
        setSaving(true)
        try {
            const res = await fetch(`/api/admin/categories?id=${catId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: editCatName.trim() }),
            })
            if (!res.ok) throw new Error((await res.json()).error || "Failed to edit category")
            const data = await res.json()
            setCategories((prev) => prev.map(c => c.id === catId ? data.category : c))
            if (selectedCategory?.id === catId) setSelectedCategory(data.category)
            setEditingCategoryId(null)
        } catch (err) { alert(err.message) } finally { setSaving(false) }
    }

    async function handleDeleteCategory(catId) {
        if (!confirm("Delete this category and all its subcategories?")) return
        try {
            const res = await fetch(`/api/admin/categories?id=${catId}`, { method: "DELETE" })
            if (!res.ok) throw new Error("Failed to delete category")
            setCategories((prev) => prev.filter((c) => c.id !== catId))
            if (selectedCategory?.id === catId) {
                setSelectedCategory(null)
                setSelectedSubcategory(null)
                setSubcategories([])
            }
        } catch (err) { alert(err.message) }
    }

    // ── Subcategory Methods ──
    function openSubModal(mode, sub = null) {
        setSubModalMode(mode)
        if (mode === "edit" && sub) {
            setSubModalData({ id: sub.id, name: sub.name, description: sub.description || "", status: sub.status || "active" })
        } else {
            setSubModalData({ id: null, name: "", description: "", status: "active" })
        }
        setIsSubModalOpen(true)
    }

    async function handleSaveSubcategory() {
        if (!subModalData.name.trim() || !selectedCategory?.id) return
        setSaving(true)
        try {
            const method = subModalMode === "add" ? "POST" : "PUT"
            const url = subModalMode === "add" ? "/api/admin/subcategories" : `/api/admin/subcategories?id=${subModalData.id}`
            const payload = { ...subModalData, ...(subModalMode === "add" && { category_id: selectedCategory.id }) }

            const res = await fetch(url, {
                method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
            })
            if (!res.ok) throw new Error((await res.json()).error || `Failed to ${subModalMode} subcategory`)
            const data = await res.json()
            
            if (subModalMode === "add") setSubcategories((prev) => [...prev, data.subcategory])
            else setSubcategories((prev) => prev.map(s => s.id === subModalData.id ? data.subcategory : s))
            
            setIsSubModalOpen(false)
        } catch (err) { alert(err.message) } finally { setSaving(false) }
    }

    async function handleDeleteSubcategory(subId) {
        if (!confirm("Delete this subcategory?")) return
        try {
            const res = await fetch(`/api/admin/subcategories?id=${subId}`, { method: "DELETE" })
            if (!res.ok) throw new Error("Failed to delete subcategory")
            setSubcategories((prev) => prev.filter((s) => s.id !== subId))
            if (selectedSubcategory?.id === subId) setSelectedSubcategory(null)
        } catch (err) { alert(err.message) }
    }

    // ── Subject Methods ──
    function openSubjectModal(mode, sub = null) {
        setSubjectModalMode(mode)
        if (mode === "edit" && sub) {
            setSubjectModalData({ 
                id: sub.id, 
                title: sub.title, 
                code: sub.code, 
                description: sub.description || "", 
                image_url: sub.image_url || "",
                imageFile: null,
                // Ensure date format "YYYY-MM-DDTHH:mm" for datetime-local input
                unlock_date: sub.unlock_date ? new Date(sub.unlock_date).toISOString().slice(0, 16) : "",
                status: sub.status || "active" 
            })
        } else {
            setSubjectModalData({ id: null, title: "", code: "", description: "", image_url: "", imageFile: null, unlock_date: "", status: "active" })
        }
        setIsSubjectModalOpen(true)
    }

    async function handleSaveSubject() {
        if (!subjectModalData.title.trim() || !subjectModalData.code.trim() || !selectedSubcategory?.id) return
        setSaving(true)
        try {
            const method = subjectModalMode === "add" ? "POST" : "PUT"
            const url = subjectModalMode === "add" ? "/api/admin/subjects" : `/api/admin/subjects?id=${subjectModalData.id}`
            
            const formData = new FormData()
            formData.append("title", subjectModalData.title.trim())
            formData.append("code", subjectModalData.code.trim())
            if (subjectModalData.description) formData.append("description", subjectModalData.description.trim())
            formData.append("status", subjectModalData.status)
            if (subjectModalData.unlock_date) formData.append("unlock_date", new Date(subjectModalData.unlock_date).toISOString())
            formData.append("subcategory_id", selectedSubcategory.id)
            formData.append("category", selectedCategory.name)
            
            if (subjectModalData.imageFile) {
                formData.append("image", subjectModalData.imageFile)
            } else if (subjectModalData.image_url) {
                formData.append("image_url", subjectModalData.image_url)
            }

            const res = await fetch(url, {
                method, body: formData,
            })
            if (!res.ok) throw new Error((await res.json()).error || `Failed to ${subjectModalMode} subject`)
            const data = await res.json()
            
            if (subjectModalMode === "add") setSubjects((prev) => [data.subject, ...prev])
            else setSubjects((prev) => prev.map(s => s.id === subjectModalData.id ? data.subject : s))
            
            setIsSubjectModalOpen(false)
        } catch (err) { alert(err.message) } finally { setSaving(false) }
    }

    async function handleDeleteSubject(subId) {
        if (!confirm("Delete this subject?")) return
        try {
            const res = await fetch(`/api/admin/subjects?id=${subId}`, { method: "DELETE" })
            if (!res.ok) throw new Error("Failed to delete subject")
            setSubjects((prev) => prev.filter((s) => s.id !== subId))
        } catch (err) { alert(err.message) }
    }

    if (loading) {
        return (
            <div className="space-y-12 w-full max-w-6xl mx-auto px-4 py-8 animate-in fade-in duration-300">
                {/* Categories skeleton */}
                <div className="space-y-6">
                    <div className="space-y-2">
                        <div className="h-10 w-48 bg-gray-200 rounded-lg animate-pulse" />
                        <div className="h-4 w-64 bg-gray-100 rounded animate-pulse" />
                    </div>
                    <div className="flex flex-wrap gap-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-10 w-28 bg-gray-100 rounded-lg animate-pulse" />
                        ))}
                        <div className="h-10 w-36 bg-[#fdf2f3] rounded-lg animate-pulse" />
                    </div>
                </div>

                {/* Subcategory cards skeleton */}
                <div className="space-y-6">
                    <div className="space-y-2">
                        <div className="h-9 w-44 bg-gray-200 rounded-lg animate-pulse" />
                        <div className="h-4 w-80 bg-gray-100 rounded animate-pulse" />
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="aspect-square w-full bg-gray-50 border border-gray-100 rounded-[1.25rem] animate-pulse" />
                        ))}
                        <div className="aspect-square w-full bg-[#fdf2f3] border border-[#f5cdd0]/30 rounded-[1.25rem] animate-pulse" />
                    </div>
                </div>

                {/* Subject rows skeleton */}
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex items-center gap-6 bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                            <div className="h-40 w-40 shrink-0 bg-gray-100 rounded-2xl animate-pulse" />
                            <div className="flex-1 space-y-3">
                                <div className="h-6 w-56 bg-gray-200 rounded animate-pulse" />
                                <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
                                <div className="h-4 w-4/5 bg-gray-100 rounded animate-pulse" />
                                <div className="flex gap-3 pt-2">
                                    <div className="h-7 w-28 bg-gray-100 rounded-full animate-pulse" />
                                    <div className="h-7 w-20 bg-gray-100 rounded-full animate-pulse" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-destructive">
                {error}
            </div>
        )
    }

    return (
        <div className="space-y-12 w-full max-w-6xl mx-auto px-4 py-8 relative">
            
            {/* ════════════════════ CATEGORIES SECTION ════════════════════ */}
            {!selectedSubcategory && (
                <div className="space-y-6">
                    <div>
                        <h1 className="text-4xl font-extrabold tracking-tight text-[#4d4d4d] uppercase mb-1">
                            CATEGORIES
                        </h1>
                        <p className="text-[#8c8c8c] text-[15px]">Select or add category</p>
                    </div>

                    {/* Category pills */}
                    <div className="flex flex-wrap items-center gap-4">
                        {categories.map((cat) => {
                            const isSelected = selectedCategory?.id === cat.id
                            
                            if (editingCategoryId === cat.id) {
                                return (
                                    <div key={cat.id} className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-2 py-1.5 shadow-sm">
                                        <input
                                            type="text"
                                            value={editCatName}
                                            onChange={(e) => setEditCatName(e.target.value)}
                                            onKeyDown={(e) => e.key === "Enter" && handleEditCategory(cat.id)}
                                            autoFocus
                                            className="w-32 text-sm uppercase font-semibold text-[#4d4d4d] focus:outline-none"
                                        />
                                        <button onClick={() => handleEditCategory(cat.id)} disabled={saving} className="text-green-600 hover:text-green-700 p-1">
                                            {saving ? <Loader2 className="w-4 h-4 animate-spin"/> : <span className="text-xs font-bold">SAVE</span>}
                                        </button>
                                        <button onClick={() => setEditingCategoryId(null)} className="text-gray-400 hover:text-gray-600 p-1">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                )
                            }

                            return (
                                <div 
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`group cursor-pointer flex items-center gap-3 rounded-lg px-5 py-2.5 transition-all ${
                                        isSelected
                                            ? "bg-[#f5cdd0] text-[#ba5a62] shadow-sm transform scale-105"
                                            : "bg-gray-50 text-[#4d4d4d] border border-gray-200 shadow-sm hover:border-gray-300 hover:bg-gray-100"
                                    }`}
                                >
                                    <span className="text-sm font-semibold uppercase tracking-wide">
                                        {cat.name}
                                    </span>
                                    
                                    {/* Edit & Delete icons */}
                                    <div className={`flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity ${isSelected ? "text-[#ba5a62]" : "text-gray-400"}`}>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setEditingCategoryId(cat.id); setEditCatName(cat.name) }}
                                            className="hover:text-blue-500 transition-colors"
                                            title="Edit category"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat.id) }}
                                            className="hover:text-red-500 transition-colors"
                                            title="Delete category"
                                        >
                                            <Trash className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            )
                        })}

                        {/* Add Category button / input */}
                        {!showCatInput ? (
                            <button
                                onClick={() => setShowCatInput(true)}
                                className="rounded-lg border-2 border-dashed border-[#f5cdd0] bg-[#fdf2f3] px-6 py-2.5 text-sm font-semibold uppercase tracking-wide text-[#ba5a62] transition-all hover:bg-[#f5cdd0] hover:text-white"
                            >
                                ADD CATEGORY +
                            </button>
                        ) : (
                            <div className="flex items-center gap-2">
                                <input
                                    type="text" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
                                    placeholder="Category... " autoFocus className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f5cdd0]"
                                />
                                <button
                                    onClick={handleAddCategory} disabled={saving || !newCatName.trim()}
                                    className="rounded-lg bg-[#f5cdd0] px-4 py-2 text-sm font-semibold text-[#ba5a62] hover:bg-[#eeb8bc] disabled:opacity-50"
                                >
                                    {saving ? "..." : "Add"}
                                </button>
                                <button onClick={() => { setShowCatInput(false); setNewCatName("") }} className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-500 hover:bg-gray-50">Cancel</button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ════════════════════ SUB-CATEGORY SECTION ════════════════════ */}
            {!selectedSubcategory && selectedCategory && (
                <div className="space-y-6 flex-1 animate-in fade-in duration-300">
                    <div>
                        <h2 className="text-3xl font-extrabold tracking-tight text-[#4d4d4d] uppercase mb-1">
                            SUB-CATEGORY
                        </h2>
                        <p className="text-[#8c8c8c] text-[15px]">Select a sub-category to view subjects, or add a new one.</p>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        {subcategories.map((sub) => {
                            const isInactive = sub.status === 'inactive'
                            return (
                                <div
                                    key={sub.id}
                                    onClick={() => setSelectedSubcategory(sub)}
                                    className={`group cursor-pointer relative flex aspect-[1/1] w-full flex-col p-4 rounded-[1.25rem] bg-gray-50 border shadow-sm transition-all hover:-translate-y-1 hover:shadow-md ${isInactive ? 'border-gray-200' : 'border-gray-200 hover:border-gray-300'}`}
                                >
                                    {/* Lock overlay for inactive cards */}
                                    {isInactive && (
                                        <div className="absolute inset-0 rounded-[1.25rem] bg-white/70 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 pointer-events-none">
                                            <div className="flex flex-col items-center gap-2">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-10 w-10 text-[#c0392b]">
                                                    <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z" clipRule="evenodd" />
                                                </svg>
                                                <p className="text-xs text-center font-medium text-[#8c8c8c] px-4 leading-snug">
                                                    This subcategory is locked and cannot be viewed by the student.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex-1 flex flex-col items-center justify-center gap-3 mt-4">
                                        <span className={`text-lg font-bold tracking-[0.1em] uppercase text-center line-clamp-2 ${isInactive ? 'text-[#b0b0b0]' : 'text-[#7a7a7a]'}`}>
                                            {sub.name}
                                        </span>
                                        {sub.description && (
                                            <p className={`text-xs text-center line-clamp-3 ${isInactive ? 'text-[#c0c0c0]' : 'text-[#8c8c8c]'}`}>
                                                {sub.description}
                                            </p>
                                        )}
                                    </div>
                                    
                                    {/* Edit & Delete Actions */}
                                    <div className="h-8 flex items-end justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity w-full pb-2 relative z-20">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); openSubModal("edit", sub) }}
                                            className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-blue-500 transition-colors"
                                            title="Edit subcategory"
                                        >
                                            <Pencil className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDeleteSubcategory(sub.id) }}
                                            className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-red-500 transition-colors"
                                            title="Delete subcategory"
                                        >
                                            <Trash className="h-3.5 w-3.5" /> 
                                        </button>
                                    </div>
                                </div>
                            )
                        })}

                        <button
                            onClick={() => openSubModal("add")}
                            className="flex aspect-[1/1] w-full items-center justify-center rounded-[1.25rem] bg-[#f5cdd0] border border-[#eeb8bc] shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
                        >
                            <span className="text-base font-bold tracking-[0.08em] text-[#ba5a62] uppercase">
                                ADD SUB-CATEGORY +
                            </span>
                        </button>
                    </div>
                </div>
            )}

            {/* ════════════════════ SUBJECTS SECTION (Shows when Subcategory clicked) ════════════════════ */}
            {selectedSubcategory && (
                <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
                    <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setSelectedSubcategory(null)}
                                className="flex items-center gap-2 text-sm font-semibold text-gray-500 transition-colors hover:text-gray-900 bg-gray-50 hover:bg-gray-100 border border-gray-200 shadow-sm px-4 py-2 rounded-lg"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to Subcategories
                            </button>
                            <h2 className="text-3xl font-extrabold uppercase tracking-tight text-[#4d4d4d]">
                                {selectedSubcategory.name} <span className="text-gray-300 mx-2">/</span> SUBJECTS
                            </h2>
                        </div>
                        <button
                            onClick={() => openSubjectModal("add")}
                            className="rounded-lg bg-[#f5cdd0] px-6 py-2.5 text-sm font-semibold text-[#ba5a62] hover:bg-[#eeb8bc] transition-colors shadow-sm"
                        >
                            ADD SUBJECT +
                        </button>
                    </div>

                    {/* Subcategory Navigation Tabs */}
                    <div className="flex flex-wrap items-center gap-3">
                        {subcategories.map(sub => {
                            const isSelected = selectedSubcategory?.id === sub.id;
                            return (
                                <div
                                    key={sub.id}
                                    onClick={() => setSelectedSubcategory(sub)}
                                    className={`group cursor-pointer flex items-center gap-2 rounded-lg px-4 py-2 transition-all text-[13px] font-bold uppercase tracking-wide ${
                                        isSelected 
                                            ? "bg-[#f5cdd0] text-[#ba5a62] shadow-sm transform scale-[1.02]" 
                                            : "bg-gray-50 text-[#4d4d4d] border border-gray-200 shadow-sm hover:border-gray-300 hover:bg-gray-100"
                                    }`}
                                >
                                    <span>{sub.name}</span>
                                    {isSelected && (
                                        <div className="flex items-center gap-1.5 ml-1">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); openSubModal("edit", sub) }}
                                                className="hover:text-[#ba5a62]/70 transition-colors"
                                                title="Edit Subcategory"
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                            </button>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleDeleteSubcategory(sub.id) }}
                                                className="hover:text-red-500 transition-colors"
                                                title="Delete Subcategory"
                                            >
                                                <Trash className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>

                    <div className="space-y-4 pt-4">
                        {currentSubjects.length === 0 ? (
                            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
                                <p className="text-[#8c8c8c] font-medium text-lg">No subjects created yet.</p>
                                <p className="text-sm text-gray-400 mt-1">Click "Add Subject +" to get started.</p>
                            </div>
                        ) : (
                            currentSubjects.map((subject) => (
                                <div key={subject.id} className="group relative flex bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:-translate-y-0.5 hover:shadow-sm hover:border-gray-300 transition-all p-4 items-stretch">
                                    {/* Image Area */}
                                    <div className="h-40 w-40 shrink-0 rounded-2xl overflow-hidden bg-[#fdf2f3] border border-[#f5cdd0]/50 shadow-sm flex items-center justify-center self-center mr-8 relative">
                                        {subject.image_url ? (
                                            <img src={subject.image_url} alt={subject.title} className="absolute inset-0 h-full w-full object-cover rounded-xl" />
                                        ) : (
                                            <ImageIcon className="h-10 w-10 text-[#ba5a62] opacity-30" />
                                        )}
                                    </div>
                                    
                                    {/* Content Area */}
                                    <div className="flex-1 flex flex-col justify-between py-1">
                                        <div>
                                            <h3 className="text-xl font-extrabold text-[#4d4d4d] uppercase mb-2">
                                                {subject.title} 
                                                {subject.status === "inactive" && <span className="ml-2 text-[10px] text-red-500 font-bold bg-red-100 px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm border border-red-200">(Locked)</span>}
                                                {subject.unlock_date && new Date(subject.unlock_date) > new Date() && (
                                                    <span className="ml-2 text-[10px] text-blue-600 font-bold bg-blue-100 px-2 py-0.5 rounded-full shadow-sm border border-blue-200">
                                                        ⏰ Scheduled: {new Date(subject.unlock_date).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'})}
                                                    </span>
                                                )}
                                            </h3>
                                            <p className="text-[#8c8c8c] text-sm leading-relaxed mb-4 line-clamp-2">
                                                {subject.description || "No description provided."}
                                            </p>
                                        </div>
                                        
                                        <div className="flex items-center gap-4 text-xs font-semibold text-gray-500">
                                            <span className="bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200 shadow-sm">
                                                Date added: {new Date(subject.created_at).toLocaleDateString()}
                                            </span>
                                            <span className="bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200 shadow-sm">
                                                Code: {subject.code}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Edit Content Button (Bottom Right) */}
                                    <div className="flex flex-col justify-end items-end shrink-0 ml-4 py-1">
                                        <Link href={`/admin/curriculum/${subject.id}/content`} className="bg-gray-100 text-[#4d4d4d] hover:bg-gray-200 px-5 py-2 rounded-lg font-semibold text-sm transition-colors border border-gray-200 shadow-sm inline-block">
                                            Edit content
                                        </Link>
                                    </div>

                                    {/* Top Right Edit/Delete Icons */}
                                    <div className="absolute top-4 right-4 flex opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                                        <button 
                                            onClick={() => openSubjectModal("edit", subject)}
                                            className="p-1.5 text-gray-400 hover:text-blue-500 bg-white rounded-md shadow-sm border border-gray-200 transition-colors"
                                            title="Edit Subject Details"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteSubject(subject.id)}
                                            className="p-1.5 text-gray-400 hover:text-red-500 bg-white rounded-md shadow-sm border border-gray-200 transition-colors"
                                            title="Delete Subject"
                                        >
                                            <Trash className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* ════════════════════ SUBCATEGORY MODAL ════════════════════ */}
            {isSubModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="w-full max-w-[600px] bg-[#fafafa] rounded-xl shadow-xl border border-gray-200 p-8 animate-in zoom-in duration-200">
                        {/* modal content same as before ... */}
                        <div className="mb-8">
                            <h2 className="text-2xl font-extrabold tracking-wide text-[#7a7a7a] uppercase mb-2">
                                {subModalMode === "add" ? "ADD SUB-CATEGORY" : "EDIT SUB-CATEGORY"}
                            </h2>
                            <p className="text-[15px] font-medium text-[#8c8c8c]">
                                Add sub-category name, description, and toggle button for status (activate/inactivate)
                            </p>
                        </div>
                        <div className="w-full h-px bg-gray-200 mb-8" />
                        <div className="space-y-6">
                            <div>
                                <label className="block text-[#7a7a7a] text-lg font-semibold mb-2">Name:</label>
                                <input type="text" value={subModalData.name} onChange={e => setSubModalData({...subModalData, name: e.target.value})} className="w-full h-12 rounded-xl border border-gray-200 bg-[#fefefe] px-4 focus:outline-none focus:ring-1 focus:ring-[#f5cdd0] focus:border-[#f5cdd0]" />
                            </div>
                            <div>
                                <label className="block text-[#7a7a7a] text-lg font-semibold mb-2">Description:</label>
                                <textarea value={subModalData.description} onChange={e => setSubModalData({...subModalData, description: e.target.value})} rows={3} className="w-full rounded-xl border border-gray-200 bg-[#fefefe] px-4 py-3 resize-none focus:outline-none focus:ring-1 focus:ring-[#f5cdd0] focus:border-[#f5cdd0]" />
                            </div>
                            <div className="flex items-center justify-between pt-4">
                                <div className="flex items-center gap-4">
                                    <label className="text-[#7a7a7a] text-lg font-semibold">Status:</label>
                                    <button type="button" onClick={() => setSubModalData({...subModalData, status: subModalData.status === "active" ? "inactive" : "active"})} className="relative flex items-center gap-3">
                                        <div className={`w-[46px] h-6 rounded-full transition-colors flex items-center px-0.5 ${subModalData.status === 'active' ? 'bg-[#98d4b3]' : 'bg-[#e0e0e0]'}`}>
                                            <div className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${subModalData.status === 'active' ? 'translate-x-[22px]' : 'translate-x-0'}`} />
                                        </div>
                                        <span className={`text-[15px] font-medium ${subModalData.status === 'active' ? 'text-[#5ca17e]' : 'text-[#f06e6e]'}`}>
                                            {subModalData.status === 'active' ? 'Active' : 'Inactive'}
                                        </span>
                                    </button>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button onClick={() => setIsSubModalOpen(false)} className="rounded-lg px-6 py-2.5 text-[15px] font-semibold text-[#7a7a7a] border-2 border-gray-200 hover:bg-gray-50 transition-colors">Cancel</button>
                                    <button onClick={handleSaveSubcategory} disabled={saving || !subModalData.name.trim()} className="rounded-lg px-8 py-2.5 text-[15px] font-semibold text-[#7a7a7a] bg-[#e6e6e6] hover:bg-[#d4d4d4] transition-colors disabled:opacity-50">
                                        {saving ? "..." : "Save"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ════════════════════ SUBJECT MODAL ════════════════════ */}
            {isSubjectModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="w-full max-w-[600px] bg-[#fafafa] rounded-xl shadow-xl border border-gray-200 p-8 animate-in zoom-in duration-200">
                        <div className="mb-6">
                            <h2 className="text-2xl font-extrabold tracking-wide text-[#7a7a7a] uppercase mb-2">
                                {subjectModalMode === "add" ? "ADD SUBJECT" : "EDIT SUBJECT"}
                            </h2>
                        </div>
                        <div className="w-full h-px bg-gray-200 mb-6" />
                        
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[#7a7a7a] text-sm font-semibold mb-1">Title:</label>
                                    <input type="text" value={subjectModalData.title} onChange={e => setSubjectModalData({...subjectModalData, title: e.target.value})} className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#f5cdd0]" />
                                </div>
                                <div>
                                    <label className="block text-[#7a7a7a] text-sm font-semibold mb-1">Code:</label>
                                    <input type="text" value={subjectModalData.code} onChange={e => setSubjectModalData({...subjectModalData, code: e.target.value})} className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm uppercase focus:outline-none focus:ring-1 focus:ring-[#f5cdd0]" />
                                </div>
                            </div>

                            <div className="flex gap-6 items-stretch">
                                {/* Image Upload Area */}
                                <div className="shrink-0 flex flex-col items-center gap-2">
                                    <label className="text-[#7a7a7a] text-sm font-semibold self-start">Subject Image:</label>
                                    <div className="relative h-32 w-32 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center overflow-hidden hover:bg-gray-100 transition-colors group">
                                        {subjectModalData.imageFile ? (
                                            <img src={URL.createObjectURL(subjectModalData.imageFile)} alt="Preview" className="absolute inset-0 h-full w-full object-cover z-10" />
                                        ) : subjectModalData.image_url ? (
                                            <img src={subjectModalData.image_url} alt="Preview" className="absolute inset-0 h-full w-full object-cover z-10" />
                                        ) : (
                                            <div className="text-center p-2">
                                                <ImageIcon className="h-8 w-8 text-gray-400 mx-auto mb-2 opacity-50" />
                                                <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wide">Upload Image</span>
                                            </div>
                                        )}
                                        {/* Hover Overlay indicating clickability */}
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                            <span className="text-white text-xs font-bold uppercase tracking-wider">Change</span>
                                        </div>
                                        <input 
                                            type="file" 
                                            accept="image/*"
                                            onChange={(e) => {
                                                if (e.target.files && e.target.files[0]) {
                                                    setSubjectModalData({...subjectModalData, imageFile: e.target.files[0]})
                                                }
                                            }}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30"
                                            title="Choose an image"
                                        />
                                    </div>
                                    <p className="text-[11px] font-medium text-gray-400 text-center uppercase tracking-wide">Square Ratio (1:1)</p>
                                </div>

                                {/* Text Fields Area */}
                                <div className="flex-1 flex flex-col">
                                    <label className="block text-[#7a7a7a] text-sm font-semibold mb-1">Description:</label>
                                    <textarea value={subjectModalData.description} onChange={e => setSubjectModalData({...subjectModalData, description: e.target.value})} className="w-full flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-[#f5cdd0] shadow-sm bg-[#fefefe]" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[#7a7a7a] text-sm font-semibold mb-1 mt-2">Unlock Date & Time (Optional Drip Content):</label>
                                <div className="flex items-center gap-2">
                                    <input type="datetime-local" value={subjectModalData.unlock_date || ""} onChange={e => setSubjectModalData({...subjectModalData, unlock_date: e.target.value})} className="h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#f5cdd0] shadow-sm bg-[#fefefe] flex-1 max-w-[250px]" />
                                    {subjectModalData.unlock_date && (
                                        <button 
                                            type="button"
                                            onClick={() => setSubjectModalData({...subjectModalData, unlock_date: ""})}
                                            className="rounded-full bg-red-50 p-1.5 text-red-500 hover:bg-red-100 hover:text-red-700 transition-colors"
                                            title="Clear Date"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}
                                    <span className="text-xs text-gray-400 font-semibold max-w-[200px] leading-tight flex-1 ml-2">
                                        Leave blank to make available immediately.
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-4">
                                <div className="flex items-center gap-4">
                                    <label className="text-[#7a7a7a] text-sm font-semibold">Status:</label>
                                    <button type="button" onClick={() => setSubjectModalData({...subjectModalData, status: subjectModalData.status === "active" ? "inactive" : "active"})} className="relative flex items-center gap-2">
                                        <div className={`w-[36px] h-5 rounded-full transition-colors flex items-center px-0.5 ${subjectModalData.status === 'active' ? 'bg-[#98d4b3]' : 'bg-[#e0e0e0]'}`}>
                                            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${subjectModalData.status === 'active' ? 'translate-x-[16px]' : 'translate-x-0'}`} />
                                        </div>
                                    </button>
                                </div>

                                <div className="flex items-center gap-3">
                                    <button onClick={() => setIsSubjectModalOpen(false)} className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-500 border border-gray-200 hover:bg-gray-50 transition-colors">Cancel</button>
                                    <button onClick={handleSaveSubject} disabled={saving || !subjectModalData.title.trim() || !subjectModalData.code.trim()} className="rounded-lg px-6 py-2 text-sm font-semibold text-white bg-[#ba5a62] hover:bg-[#a04a52] transition-colors disabled:opacity-50">
                                        {saving ? "..." : "Save Subject"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
