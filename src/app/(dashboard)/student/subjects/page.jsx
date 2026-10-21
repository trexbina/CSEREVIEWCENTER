"use client"

import { useEffect, useState, useRef } from "react"
import { Loader2, Lock, ArrowLeft, ArrowRight, BookOpen, ChevronDown, ChevronLeft, ChevronRight, ArrowUpDown, Award, CheckCircle2 } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"

export default function StudentSubjectsPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [categories, setCategories] = useState([])
    const [subjects, setSubjects] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const [selectedCategory, setSelectedCategory] = useState(null)
    const [selectedSubcategory, setSelectedSubcategory] = useState(null)

    // UI, Sorting & Pagination States
    const [showMoreDropdown, setShowMoreDropdown] = useState(false)
    const [subSortBy, setSubSortBy] = useState("date_desc")
    const [subjectSortBy, setSubjectSortBy] = useState("date_desc")
    const [subCurrentPage, setSubCurrentPage] = useState(1)
    const [subjectCurrentPage, setSubjectCurrentPage] = useState(1)

    // ── Navigation History Synchronization ──
    const handleSelectCategory = (cat, pushHistory = true) => {
        if (selectedCategory?.id === cat?.id) {
            setSelectedCategory(null)
            setSelectedSubcategory(null)
            setSubCurrentPage(1)
            if (typeof window !== "undefined") {
                sessionStorage.removeItem("student_selected_cat_id")
                sessionStorage.removeItem("student_selected_sub_id")
                if (pushHistory) {
                    window.history.replaceState({ catId: null, subId: null }, "", window.location.pathname)
                }
            }
            return
        }

        setSelectedCategory(cat)
        setSelectedSubcategory(null)
        setSubCurrentPage(1)
        if (typeof window !== "undefined") {
            if (cat) {
                sessionStorage.setItem("student_selected_cat_id", String(cat.id))
                sessionStorage.removeItem("student_selected_sub_id")
                if (pushHistory) {
                    window.history.replaceState({ catId: cat.id, subId: null }, "", `?cat=${cat.id}`)
                }
            } else {
                sessionStorage.removeItem("student_selected_cat_id")
                sessionStorage.removeItem("student_selected_sub_id")
                if (pushHistory) {
                    window.history.replaceState({ catId: null, subId: null }, "", window.location.pathname)
                }
            }
        }
    }

    const handleSelectSubcategory = (sub, pushHistory = true) => {
        setSelectedSubcategory(sub)
        setSubjectCurrentPage(1)
        if (typeof window !== "undefined") {
            sessionStorage.setItem("student_selected_sub_id", String(sub.id))
            if (pushHistory && selectedCategory) {
                window.history.replaceState({ catId: selectedCategory.id, subId: sub.id }, "", `?cat=${selectedCategory.id}&sub=${sub.id}`)
            }
        }
    }

    useEffect(() => {
        async function fetchData() {
            try {
                const urlParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null
                const targetCatId = urlParams?.get("cat") || (typeof window !== "undefined" ? sessionStorage.getItem("student_selected_cat_id") : null)
                const targetSubId = urlParams?.get("sub") || (typeof window !== "undefined" ? sessionStorage.getItem("student_selected_sub_id") : null)

                const [catRes, subRes] = await Promise.all([
                    fetch("/api/student/categories"),
                    fetch("/api/student/subjects"),
                ])
                if (!catRes.ok) throw new Error("Failed to load categories")
                if (!subRes.ok) throw new Error("Failed to load subjects")

                let loadedCats = []
                let matchedCat = null
                let matchedSub = null
                if (catRes.ok) {
                    const catData = await catRes.json()
                    loadedCats = catData.categories || []
                    if (targetCatId) {
                        matchedCat = loadedCats.find(c => String(c.id) === String(targetCatId)) || null
                        if (matchedCat && targetSubId && matchedCat.subcategories) {
                            matchedSub = matchedCat.subcategories.find(s => String(s.id) === String(targetSubId)) || null
                        }
                    }
                }

                let loadedSubjects = []
                if (subRes.ok) {
                    const subData = await subRes.json()
                    loadedSubjects = subData.subjects || []
                }

                setCategories(loadedCats)
                setSubjects(loadedSubjects)
                setSelectedCategory(matchedCat)
                setSelectedSubcategory(matchedSub)

                // Log curriculum page visit activity
                fetch("/api/student/activities", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        activityType: "curriculum_view",
                        title: "Visited Curriculum Page",
                        details: "Accessed subjects and curriculum review modules",
                        status: "info"
                    })
                }).catch(() => {})
            } catch (err) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    if (loading) {
        return (
            <div className="flex min-h-[40vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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

    if (categories.length === 0) {
        return (
            <div className="space-y-6 w-full max-w-6xl mx-auto px-4 py-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-wider text-[#4d4d4d] uppercase mb-1">
                        CATEGORY
                    </h1>
                    <p className="text-[#8c8c8c] text-sm font-medium">Select category to review</p>
                </div>
                <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card p-12 text-center shadow-sm">
                    <Lock className="mb-4 h-12 w-12 text-muted-foreground/50" />
                    <h2 className="text-lg font-semibold text-foreground">No Categories Available</h2>
                    <p className="mt-2 max-w-md text-sm text-muted-foreground">
                        Your administrator has not assigned any categories to your curriculum yet. Please check back later.
                    </p>
                </div>
            </div>
        )
    }

    // Current category subcategories & subjects (filtering out locked/inactive for students)
    const subcategories = (selectedCategory?.subcategories || []).filter(sub => sub.status !== "inactive")

    const currentSubjects = subjects.filter((s) => {
        // Exclude inactive or future-unlocked subjects
        if (s.status === "inactive") return false
        if (s.unlock_date && new Date(s.unlock_date) > new Date()) return false

        if (selectedSubcategory) {
            return s.subcategory_id === selectedSubcategory.id
        }
        if (selectedCategory && selectedCategory.has_subcategories === false) {
            return s.category_id === selectedCategory.id || s.category?.toLowerCase() === selectedCategory.name?.toLowerCase()
        }
        return false
    })

    return (
        <div className="flex flex-col min-h-[calc(100vh-10rem)] space-y-6 w-full max-w-6xl mx-auto px-4 py-4 relative">

            {/* ════════════════════ CATEGORIES SECTION ════════════════════ */}
            {!selectedSubcategory && !(selectedCategory && selectedCategory.has_subcategories === false) && (
                <div className="space-y-4 border-b border-gray-200/60 pb-6">
                    <div>
                        <h1 className="text-2xl font-bold tracking-wider text-[#4d4d4d] uppercase">
                            CATEGORY
                        </h1>
                    </div>

                    {/* Category pills with More dropdown */}
                    {(() => {
                        const MAX_VISIBLE_CATS = 5
                        const isSelectedInOverflow = categories.findIndex(c => c.id === selectedCategory?.id) >= MAX_VISIBLE_CATS

                        let visibleCategories = categories
                        let overflowCategories = []

                        if (categories.length > MAX_VISIBLE_CATS) {
                            if (isSelectedInOverflow && selectedCategory) {
                                visibleCategories = [
                                    ...categories.slice(0, MAX_VISIBLE_CATS - 1),
                                    selectedCategory
                                ]
                                overflowCategories = categories.filter(c => !visibleCategories.some(vc => vc.id === c.id))
                            } else {
                                visibleCategories = categories.slice(0, MAX_VISIBLE_CATS)
                                overflowCategories = categories.slice(MAX_VISIBLE_CATS)
                            }
                        }

                        return (
                            <div className="flex flex-wrap items-center gap-2.5">
                                {visibleCategories.map((cat) => {
                                    const isSelected = selectedCategory?.id === cat.id

                                    return (
                                        <div
                                            key={cat.id}
                                            onClick={() => handleSelectCategory(cat)}
                                            className={`group cursor-pointer flex items-center rounded-lg px-3.5 py-1.5 transition-all duration-200 ${isSelected
                                                ? "bg-[#E9C46A] text-white shadow-sm"
                                                : "bg-gray-50 text-[#4d4d4d] border border-gray-200/50 shadow-sm hover:border-gray-300 hover:bg-gray-100"
                                                }`}
                                        >
                                            <span className="text-xs font-bold uppercase tracking-wider whitespace-nowrap">
                                                {cat.name}
                                            </span>
                                        </div>
                                    )
                                })}

                                {/* More Categories Dropdown */}
                                {overflowCategories.length > 0 && (
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowMoreDropdown(!showMoreDropdown)}
                                            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider border border-gray-200/50 bg-gray-50 text-gray-600 hover:bg-gray-100 hover:border-gray-300 shadow-sm transition-all"
                                        >
                                            <span>More ({overflowCategories.length})</span>
                                            <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${showMoreDropdown ? "rotate-180" : ""}`} />
                                        </button>

                                        {showMoreDropdown && (
                                            <>
                                                <div className="fixed inset-0 z-30" onClick={() => setShowMoreDropdown(false)} />
                                                <div className="absolute left-0 mt-2 z-40 w-56 rounded-xl bg-white border border-gray-200/80 shadow-xl py-1.5 animate-in fade-in zoom-in-95 duration-150">
                                                    <div className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 mb-1">
                                                        More Categories
                                                    </div>
                                                    <div className="max-h-56 overflow-y-auto space-y-0.5 px-1">
                                                        {overflowCategories.map(cat => (
                                                            <div
                                                                key={cat.id}
                                                                onClick={() => {
                                                                    handleSelectCategory(cat)
                                                                    setShowMoreDropdown(false)
                                                                }}
                                                                className="group flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-semibold uppercase text-gray-700 hover:bg-gray-100 cursor-pointer"
                                                            >
                                                                <span className="truncate pr-2">{cat.name}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        )
                    })()}
                </div>
            )}

            {/* ════════════════════ NO CATEGORY SELECTED EMPTY STATE ════════════════════ */}
            {!selectedCategory && (
                <div className="flex-1 flex flex-col items-center justify-center min-h-[48vh] px-4 text-center animate-in fade-in duration-300">
                    <h3 className="text-base font-bold text-[#4d4d4d] uppercase tracking-wider mb-1">
                        Select a Category
                    </h3>
                    <p className="text-xs text-gray-400 max-w-sm leading-relaxed">
                        Please select a category above to browse available subjects and lesson modules.
                    </p>
                </div>
            )}

            {/* ════════════════════ SUBJECTS SECTION ════════════════════ */}
            {!selectedSubcategory && selectedCategory && selectedCategory.has_subcategories !== false && (
                <div className="space-y-6 flex-1 animate-in fade-in duration-300">
                    {(() => {
                        const SUB_ITEMS_PER_PAGE = 8
                        const activeSubcategories = subcategories.filter(sub => sub.status !== "inactive")
                        const sortedSubcategories = [...activeSubcategories].sort((a, b) => {
                            if (subSortBy === "name_asc") return (a.name || "").localeCompare(b.name || "")
                            if (subSortBy === "name_desc") return (b.name || "").localeCompare(a.name || "")
                            if (subSortBy === "date_asc") {
                                const tDiff = new Date(a.created_at || 0) - new Date(b.created_at || 0)
                                return tDiff !== 0 ? tDiff : (a.id || 0) - (b.id || 0)
                            }
                            const tDiff = new Date(b.created_at || 0) - new Date(a.created_at || 0)
                            return tDiff !== 0 ? tDiff : (b.id || 0) - (a.id || 0)
                        })
                        const totalSubPages = Math.max(1, Math.ceil(sortedSubcategories.length / SUB_ITEMS_PER_PAGE))
                        const currentSubPage = Math.min(subCurrentPage, totalSubPages)
                        const paginatedSubcategories = sortedSubcategories.slice((currentSubPage - 1) * SUB_ITEMS_PER_PAGE, currentSubPage * SUB_ITEMS_PER_PAGE)

                        return (
                            <>
                                {/* Header bar: Title above line divider */}
                                <div className="border-b border-gray-200/50 pb-4">
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-lg font-bold tracking-wider text-[#4d4d4d] uppercase">
                                            SUBJECTS
                                        </h2>
                                        <span className="ml-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-100 text-gray-500 uppercase tracking-wider">
                                            {activeSubcategories.length} AVAILABLE
                                        </span>
                                    </div>
                                    <p className="text-[#8c8c8c] text-sm font-medium mt-0.5">Select a subject to view modules.</p>
                                </div>

                                {/* Second Row Below Line Divider: Sorting (Left) & Pagination (Right) */}
                                <div className="flex items-center justify-between gap-4 pt-1">
                                        {/* Minimal Sort Dropdown (Left) */}
                                        <div className="flex items-center gap-1.5 bg-white border border-gray-200/60 rounded-lg px-2.5 py-1 text-xs font-semibold text-gray-500 shadow-2xs">
                                            <ArrowUpDown className="h-3 w-3 text-gray-400 shrink-0" />
                                            <select
                                                value={subSortBy}
                                                onChange={(e) => setSubSortBy(e.target.value)}
                                                className="bg-transparent font-medium text-gray-700 cursor-pointer focus:outline-none text-xs"
                                            >
                                                <option value="date_desc">Newest First</option>
                                                <option value="name_asc">A - Z</option>
                                                <option value="name_desc">Z - A</option>
                                                <option value="date_asc">Oldest First</option>
                                            </select>
                                        </div>

                                        {/* Sub-category Pagination (Right) */}
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setSubCurrentPage(p => Math.max(1, p - 1))}
                                                disabled={currentSubPage === 1}
                                                className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200/60 bg-white text-gray-600 transition-all hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                                                title="Previous Page"
                                            >
                                                <ChevronLeft className="h-3.5 w-3.5" />
                                            </button>
                                            <div className="flex items-center gap-1 px-2.5 py-1 bg-gray-50 rounded-lg border border-gray-200/50 text-xs font-semibold text-gray-500">
                                                <span>Page</span>
                                                <span className="font-bold text-[#4d4d4d]">{currentSubPage}</span>
                                                <span>of</span>
                                                <span className="font-bold text-[#4d4d4d]">{totalSubPages}</span>
                                            </div>
                                            <button
                                                onClick={() => setSubCurrentPage(p => Math.min(totalSubPages, p + 1))}
                                                disabled={currentSubPage === totalSubPages}
                                                className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200/60 bg-white text-gray-600 transition-all hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                                                title="Next Page"
                                            >
                                                <ChevronRight className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>

                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    {paginatedSubcategories.map((sub) => {
                                        const isInactive = sub.status === 'inactive'
                                        const subjectCount = sub.subject_count ?? subjects.filter(s => s.subcategory_id === sub.id).length
                                        return (
                                            <div
                                                key={sub.id}
                                                onClick={() => handleSelectSubcategory(sub)}
                                                className={`group cursor-pointer relative flex aspect-square w-full flex-col overflow-hidden rounded-xl bg-white border shadow-2xs transition-all hover:shadow-sm ${isInactive ? 'border-gray-200/40' : 'border-gray-100 hover:border-gray-200/80'}`}
                                            >
                                                {/* Image Background */}
                                                <div className="absolute inset-0">
                                                    <img
                                                        src={sub.image_url || "/images/default-subcategory.png"}
                                                        alt={sub.name}
                                                        className="absolute inset-0 h-full w-full object-cover"
                                                    />
                                                    {isInactive && <div className="absolute inset-0 bg-black/10" />}
                                                </div>

                                                {/* Sliding White Info Overlay */}
                                                <div className={sub.description?.trim() ? "subcard-overlay" : "subcard-overlay-compact"}>
                                                    <div className="overflow-hidden flex-1 flex flex-col justify-start">
                                                        <div className="flex items-start justify-between gap-2 mb-1.5 shrink-0">
                                                            <span className="block text-xs sm:text-[13px] font-bold tracking-wider text-[#4d4d4d] uppercase flex-1 leading-snug break-words line-clamp-2 group-hover:line-clamp-none">
                                                                {sub.name}
                                                            </span>
                                                            <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-500 border border-gray-200/60 shadow-2xs">
                                                                    {subjectCount}
                                                                </span>
                                                                {isInactive && (
                                                                    <Lock className="h-3.5 w-3.5 text-gray-400 shrink-0" title="Locked for students" />
                                                                )}
                                                            </div>
                                                        </div>
                                                        {sub.description?.trim() && (
                                                            <p className="text-xs leading-relaxed text-[#8c8c8c] line-clamp-3 group-hover:line-clamp-none overflow-y-auto custom-scrollbar">
                                                                {sub.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </>
                        )
                    })()}
                </div>
            )}

            {/* ════════════════════ SUBJECTS SECTION (Shows when Subcategory clicked OR Direct Category) ════════════════════ */}
            {(selectedSubcategory || (selectedCategory && selectedCategory.has_subcategories === false)) && (
                <div className="flex-1 flex flex-col space-y-4 animate-in slide-in-from-right-8 duration-300">
                    {(() => {
                        const SUBJECT_ITEMS_PER_PAGE = 5
                        const sortedSubjects = [...currentSubjects].sort((a, b) => {
                            if (subjectSortBy === "name_asc") return (a.title || "").localeCompare(b.title || "")
                            if (subjectSortBy === "name_desc") return (b.title || "").localeCompare(a.title || "")
                            if (subjectSortBy === "date_asc") {
                                const tDiff = new Date(a.created_at || 0) - new Date(b.created_at || 0)
                                return tDiff !== 0 ? tDiff : (a.id || 0) - (b.id || 0)
                            }
                            const tDiff = new Date(b.created_at || 0) - new Date(a.created_at || 0)
                            return tDiff !== 0 ? tDiff : (b.id || 0) - (a.id || 0)
                        })
                        const totalSubjectPages = Math.max(1, Math.ceil(sortedSubjects.length / SUBJECT_ITEMS_PER_PAGE))
                        const currentSubjPage = Math.min(subjectCurrentPage, totalSubjectPages)
                        const paginatedSubjects = sortedSubjects.slice((currentSubjPage - 1) * SUBJECT_ITEMS_PER_PAGE, currentSubjPage * SUBJECT_ITEMS_PER_PAGE)

                        const rawTitle = selectedSubcategory ? selectedSubcategory.name : (selectedCategory?.name || "")
                        const cleanTitle = rawTitle.replace(/\s*\/\s*(SUBJECTS|MODULES)$/i, "")

                        return (
                            <>
                                <div className="flex items-center justify-between gap-3 border-b border-gray-200/50 pb-3">
                                    <div className="flex items-center gap-2.5 min-w-0 flex-1 overflow-hidden">
                                        <button
                                            onClick={() => {
                                                if (selectedSubcategory) {
                                                    setSelectedSubcategory(null)
                                                    if (typeof window !== "undefined") {
                                                        sessionStorage.removeItem("student_selected_sub_id")
                                                        if (selectedCategory) {
                                                            window.history.pushState({ catId: selectedCategory.id, subId: null }, "", `?cat=${selectedCategory.id}`)
                                                        }
                                                    }
                                                } else {
                                                    setSelectedCategory(null)
                                                    setSelectedSubcategory(null)
                                                    if (typeof window !== "undefined") {
                                                        sessionStorage.removeItem("student_selected_cat_id")
                                                        sessionStorage.removeItem("student_selected_sub_id")
                                                        window.history.pushState({ catId: null, subId: null }, "", window.location.pathname)
                                                    }
                                                }
                                            }}
                                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200/50 bg-gray-100 text-gray-600 transition-all hover:bg-gray-200 hover:text-gray-900 shadow-sm shrink-0 cursor-pointer"
                                            title={selectedSubcategory ? "Back to subjects" : "Back to categories"}
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </button>
                                        <div className="flex items-center gap-2 min-w-0 overflow-hidden flex-1">
                                            <h2 className="text-base sm:text-lg font-bold uppercase tracking-wider text-[#4d4d4d] flex items-center min-w-0 overflow-hidden" title={`${cleanTitle} / MODULES`}>
                                                <span className="truncate max-w-[240px] sm:max-w-[400px] md:max-w-[600px]">
                                                    {cleanTitle}
                                                </span>
                                                <span className="text-gray-300 mx-1.5 shrink-0">/</span>
                                                <span className="shrink-0 text-[#7a7a7a]">MODULES</span>
                                            </h2>
                                            <span className="shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-100 text-gray-500 uppercase tracking-wider">
                                                {currentSubjects.length} AVAILABLE
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {currentSubjects.length === 0 ? (
                                    <div className="flex-1 flex flex-col items-center justify-center min-h-[48vh] px-4 text-center animate-in fade-in duration-300">
                                        <h3 className="text-base font-bold text-[#4d4d4d] uppercase tracking-wider mb-1">
                                            No Modules Available Yet
                                        </h3>
                                        <p className="text-xs text-gray-400 max-w-sm leading-relaxed">
                                            Please check back later or select another category/subject.
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        {/* Controls Row Below the Line: Sort & Pagination */}
                                        <div className="flex items-center justify-between gap-3 pt-1">
                                            {/* Minimal Sort Dropdown */}
                                            <div className="flex items-center gap-1.5 bg-white border border-gray-200/60 rounded-lg px-2.5 py-1 text-xs font-semibold text-gray-500 shadow-2xs">
                                                <ArrowUpDown className="h-3 w-3 text-gray-400 shrink-0" />
                                                <select
                                                    value={subjectSortBy}
                                                    onChange={(e) => setSubjectSortBy(e.target.value)}
                                                    className="bg-transparent font-medium text-gray-700 cursor-pointer focus:outline-none text-xs"
                                                >
                                                    <option value="date_desc">Newest First</option>
                                                    <option value="name_asc">A - Z</option>
                                                    <option value="name_desc">Z - A</option>
                                                    <option value="date_asc">Oldest First</option>
                                                </select>
                                            </div>

                                            {/* Subjects Pagination Controls */}
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => setSubjectCurrentPage(p => Math.max(1, p - 1))}
                                                    disabled={currentSubjPage === 1}
                                                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200/60 bg-white text-gray-600 transition-all hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                                                    title="Previous Page"
                                                >
                                                    <ChevronLeft className="h-3.5 w-3.5" />
                                                </button>
                                                <div className="flex items-center gap-1 px-2.5 py-1 bg-gray-50 rounded-lg border border-gray-200/50 text-xs font-semibold text-gray-500">
                                                    <span>Page</span>
                                                    <span className="font-bold text-[#4d4d4d]">{currentSubjPage}</span>
                                                    <span>of</span>
                                                    <span className="font-bold text-[#4d4d4d]">{totalSubjectPages}</span>
                                                </div>
                                                <button
                                                    onClick={() => setSubjectCurrentPage(p => Math.min(totalSubjectPages, p + 1))}
                                                    disabled={currentSubjPage === totalSubjectPages}
                                                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200/60 bg-white text-gray-600 transition-all hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                                                    title="Next Page"
                                                >
                                                    <ChevronRight className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-3 pt-2">
                                            {paginatedSubjects.map((subject) => {
                                                const isLocked = subject.unlock_date && new Date(subject.unlock_date) > new Date();

                                                return (
                                                    <div
                                                        key={subject.id}
                                                        onClick={() => !isLocked && router.push(`/student/subjects/${subject.id}`)}
                                                        className={`group relative flex bg-white border border-gray-100 rounded-xl overflow-hidden shadow-2xs hover:border-gray-200/80 transition-all p-3.5 items-stretch ${isLocked ? 'opacity-60 grayscale-[40%] cursor-not-allowed' : 'cursor-pointer'}`}
                                                    >
                                                        {/* Image Area */}
                                                        <div className="h-28 w-28 shrink-0 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 shadow-2xs flex items-center justify-center self-center mr-5 relative">
                                                            <img
                                                                src={subject.image_url || "/images/default-subject.png"}
                                                                alt={subject.title}
                                                                className="absolute inset-0 h-full w-full object-cover rounded-xl"
                                                            />
                                                        </div>

                                                        {/* Content Area */}
                                                        <div className="flex-1 flex flex-col justify-between py-0.5 min-w-0">
                                                            <div>
                                                                {/* Top Header Row: Title & Top-Right Circular Indicators */}
                                                                <div className="flex items-start justify-between gap-4 mb-1.5">
                                                                    <div className="min-w-0 flex-1">
                                                                        <h3 className="text-base font-bold text-[#4d4d4d] uppercase flex items-center gap-2 flex-wrap">
                                                                            <span>{subject.title}</span>
                                                                            {isLocked && (
                                                                                <span className="text-[9px] text-blue-600 font-bold bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                                                    (Unlocks {new Date(subject.unlock_date).toLocaleDateString([], { month: 'short', day: 'numeric'})})
                                                                                </span>
                                                                            )}
                                                                        </h3>
                                                                        <p className="text-[#8c8c8c] text-xs leading-relaxed mt-1 line-clamp-2">
                                                                            {subject.description || "No description provided."}
                                                                        </p>
                                                                    </div>

                                                                    {/* Top-Right Circular Indicators Container */}
                                                                    <div className="flex items-center gap-4 shrink-0 pt-0.5">
                                                                        {/* Circular Progress Indicator */}
                                                                        {(() => {
                                                                            const pct = Math.min(100, Math.max(0, subject.progressPct ?? 0))
                                                                            const radius = 15
                                                                            const circumference = 2 * Math.PI * radius
                                                                            const strokeDashoffset = circumference - (pct / 100) * circumference
                                                                            const strokeColor = pct >= 100 
                                                                                ? "#10B981" 
                                                                                : pct >= 60 
                                                                                ? "#F59E0B" 
                                                                                : pct > 0 
                                                                                ? "#4B5563" 
                                                                                : "#E5E7EB"

                                                                            return (
                                                                                <div className="flex items-center gap-2.5" title={`Progress: ${pct}% (${subject.openedLessons ?? 0} of ${subject.totalLessons ?? 0} lessons opened)`}>
                                                                                    <div className="relative size-10 flex items-center justify-center shrink-0">
                                                                                        <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                                                                                            <circle
                                                                                                cx="18"
                                                                                                cy="18"
                                                                                                r={radius}
                                                                                                stroke="#F3F4F6"
                                                                                                strokeWidth="3"
                                                                                                fill="transparent"
                                                                                            />
                                                                                            <circle
                                                                                                cx="18"
                                                                                                cy="18"
                                                                                                r={radius}
                                                                                                stroke={strokeColor}
                                                                                                strokeWidth="3"
                                                                                                strokeDasharray={circumference}
                                                                                                strokeDashoffset={strokeDashoffset}
                                                                                                strokeLinecap="round"
                                                                                                fill="transparent"
                                                                                                className="transition-all duration-700 ease-out"
                                                                                            />
                                                                                        </svg>
                                                                                        <span className="absolute text-[9px] font-bold text-gray-700">
                                                                                            {pct}%
                                                                                        </span>
                                                                                    </div>
                                                                                    <div className="hidden sm:block text-left">
                                                                                        <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block leading-none">
                                                                                            Progress
                                                                                        </span>
                                                                                        <span className="text-[9px] text-gray-400 block mt-1 leading-none">
                                                                                            {subject.openedLessons ?? 0}/{subject.totalLessons ?? 0} lessons
                                                                                        </span>
                                                                                    </div>
                                                                                </div>
                                                                            )
                                                                        })()}

                                                                        {/* Circular Mastery Indicator */}
                                                                        {(() => {
                                                                            const pct = Math.min(100, Math.max(0, subject.masteryPct ?? 0))
                                                                            const radius = 15
                                                                            const circumference = 2 * Math.PI * radius
                                                                            const strokeDashoffset = circumference - (pct / 100) * circumference
                                                                            const strokeColor = pct >= 80 
                                                                                ? "#10B981" 
                                                                                : pct >= 60 
                                                                                ? "#F59E0B" 
                                                                                : pct > 0 
                                                                                ? "#4B5563" 
                                                                                : "#E5E7EB"

                                                                            return (
                                                                                <div className="flex items-center gap-2.5" title={`Mastery: ${pct}% (${pct >= 75 ? "Proficient" : pct > 0 ? "Developing" : "Not assessed"})`}>
                                                                                    <div className="relative size-10 flex items-center justify-center shrink-0">
                                                                                        <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                                                                                            <circle
                                                                                                cx="18"
                                                                                                cy="18"
                                                                                                r={radius}
                                                                                                stroke="#F3F4F6"
                                                                                                strokeWidth="3"
                                                                                                fill="transparent"
                                                                                            />
                                                                                            <circle
                                                                                                cx="18"
                                                                                                cy="18"
                                                                                                r={radius}
                                                                                                stroke={strokeColor}
                                                                                                strokeWidth="3"
                                                                                                strokeDasharray={circumference}
                                                                                                strokeDashoffset={strokeDashoffset}
                                                                                                strokeLinecap="round"
                                                                                                fill="transparent"
                                                                                                className="transition-all duration-700 ease-out"
                                                                                            />
                                                                                        </svg>
                                                                                        <span className="absolute text-[9px] font-bold text-gray-700">
                                                                                            {pct}%
                                                                                        </span>
                                                                                    </div>
                                                                                    <div className="hidden sm:block text-left">
                                                                                        <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block leading-none">
                                                                                            Mastery
                                                                                        </span>
                                                                                        <span className="text-[9px] text-gray-400 block mt-1 leading-none">
                                                                                            {pct >= 75 ? "Proficient" : pct > 0 ? "Developing" : "Not assessed"}
                                                                                        </span>
                                                                                    </div>
                                                                                </div>
                                                                            )
                                                                        })()}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Metadata and View Content */}
                                                            <div className="flex items-center justify-between mt-2">
                                                                <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                                                                    <span className="bg-gray-100 text-gray-600 border border-gray-200/60 px-2.5 py-0.5 rounded-md font-semibold">
                                                                        {subject.code || "SUBJ"}
                                                                    </span>
                                                                </div>

                                                                {isLocked ? (
                                                                    <button disabled className="shrink-0 bg-gray-50 text-gray-400 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-150 flex items-center gap-1.5 cursor-not-allowed">
                                                                        <Lock className="w-3 h-3" /> Locked
                                                                    </button>
                                                                ) : (
                                                                    <button className="group/btn inline-flex items-center gap-1 text-xs font-semibold text-gray-600 hover:text-gray-950 px-2.5 py-1 rounded-lg hover:bg-gray-100/80 transition-all cursor-pointer">
                                                                        <span>Open Module</span>
                                                                        <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover/btn:translate-x-0.5" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </>
                                )}
                            </>
                        )
                    })()}
                </div>
            )}
        </div>
    )
}
