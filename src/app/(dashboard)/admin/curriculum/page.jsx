// this tells nextjs to run this page in the browser
"use client"

// these are helper tools from react to remember things and do actions when page opens
import { useEffect, useState, useCallback, useRef } from "react"

// these are small icons used on the buttons and cards
import { X, Pencil, Trash, Image as ImageIcon, Plus, ChevronDown, Lock, Clock, ChevronLeft, ChevronRight, Settings, ArrowUpDown } from "lucide-react"
import { LordIcon } from "@/components/ui/lord-icon"

// this lets us make clickable links to other pages
import Link from "next/link"

// these are small helper popups to pick dates and times easily
import MinimalDatePicker from "@/components/ui/MinimalDatePicker"
import MinimalTimePicker from "@/components/ui/MinimalTimePicker"

// this is the popup that asks if you really want to delete something
import ConfirmDeleteModal from "@/components/confirm-delete-modal"

// this is the main screen for managing categories subcategories and subjects
export default function CurriculumManagerPage() {
    // these hold the lists of items from our database
    const [categories, setCategories] = useState([])
    const [subcategories, setSubcategories] = useState([])
    const [subjects, setSubjects] = useState([])

    // this tells the page if data is still downloading
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // these remember which item the user clicked on right now
    const [selectedCategory, setSelectedCategory] = useState(null)
    const [selectedSubcategory, setSelectedSubcategory] = useState(null)

    // these remember how to sort items and what page number we are on
    const [subSortBy, setSubSortBy] = useState("date_desc")
    const [subjectSortBy, setSubjectSortBy] = useState("date_desc")
    const [showMoreDropdown, setShowMoreDropdown] = useState(false)
    const [subCurrentPage, setSubCurrentPage] = useState(1)
    const [subjectCurrentPage, setSubjectCurrentPage] = useState(1)
    const [saving, setSaving] = useState(false)

    // this holds the list of courses programs and majors for the dropdowns
    const [masterData, setMasterData] = useState({ examinations: [], programs: [], majors: [] })

    // this remembers information when adding or editing a category
    const [isCatModalOpen, setIsCatModalOpen] = useState(false)
    const [catModalMode, setCatModalMode] = useState("add")
    const [catModalData, setCatModalData] = useState({
        id: null,
        name: "",
        has_subcategories: true,
        target_course: "all",
        target_program: "all",
        target_major: "all"
    })

    // this remembers information when adding or editing a subcategory
    const [isSubModalOpen, setIsSubModalOpen] = useState(false)
    const [subModalMode, setSubModalMode] = useState("add")
    const [subModalData, setSubModalData] = useState({
        id: null,
        name: "",
        description: "",
        image_url: "",
        imageFile: null,
        status: "active"
    })

    // this remembers information when adding or editing a subject
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

    // this is for showing simple message boxes or asking yes no questions
    const [uiDialog, setUiDialog] = useState({
        open: false,
        title: "Notice",
        description: "",
        confirmText: "OK",
        onConfirm: null,
    })

    // this closes the message box
    function closeDialog() {
        setUiDialog((prev) => ({ ...prev, open: false, onConfirm: null }))
    }

    // this opens a message box to show an error message
    function showError(message, title = "Action failed") {
        setUiDialog({
            open: true,
            title,
            description: String(message || "Something went wrong."),
            confirmText: "OK",
            onConfirm: null,
        })
    }

    // this opens a confirmation box asking the user before deleting
    function showConfirm({ title, description, onConfirm, confirmText = "Delete" }) {
        setUiDialog({
            open: true,
            title,
            description,
            confirmText,
            onConfirm,
        })
    }

    // this runs whatever action was confirmed in the popup box
    async function handleDialogAction() {
        const action = uiDialog.onConfirm
        closeDialog()
        if (typeof action === "function") {
            await action()
        }
    }

    // this remembers when a category is clicked and saves it in the browser history
    const handleSelectCategory = useCallback((cat, pushHistory = true) => {
        // if user clicks the category that is already open it deselects it and goes back to normal
        if (selectedCategory?.id === cat?.id) {
            setSelectedCategory(null)
            setSelectedSubcategory(null)
            setSubcategories([])
            setSubCurrentPage(1)
            if (typeof window !== "undefined") {
                sessionStorage.removeItem("admin_curriculum_cat_id")
                sessionStorage.removeItem("admin_curriculum_sub_id")
                if (pushHistory) {
                    window.history.replaceState({ catId: null, subId: null }, "", window.location.pathname)
                }
            }
            return
        }

        // select the category and reset subcategories
        setSelectedCategory(cat)
        setSelectedSubcategory(null)
        setSubCurrentPage(1)
        if (typeof window !== "undefined") {
            if (cat) {
                sessionStorage.setItem("admin_curriculum_cat_id", String(cat.id))
                sessionStorage.removeItem("admin_curriculum_sub_id")
                if (pushHistory) {
                    window.history.replaceState({ catId: cat.id, subId: null }, "", `?cat=${cat.id}`)
                }
            } else {
                sessionStorage.removeItem("admin_curriculum_cat_id")
                sessionStorage.removeItem("admin_curriculum_sub_id")
                if (pushHistory) {
                    window.history.replaceState({ catId: null, subId: null }, "", window.location.pathname)
                }
            }
        }
    }, [selectedCategory])

    // this remembers when a subcategory is clicked and updates the link bar
    const handleSelectSubcategory = useCallback((sub, pushHistory = true) => {
        setSelectedSubcategory(sub)
        setSubjectCurrentPage(1)
        if (typeof window !== "undefined") {
            sessionStorage.setItem("admin_curriculum_sub_id", String(sub.id))
            if (pushHistory && selectedCategory) {
                window.history.replaceState({ catId: selectedCategory.id, subId: sub.id }, "", `?cat=${selectedCategory.id}&sub=${sub.id}`)
            }
        }
    }, [selectedCategory])

    // this downloads all categories subjects and dropdown choices from the server
    const fetchData = useCallback(async () => {
        try {
            // check if there is a category or subcategory id saved in the url or browser memory
            const urlParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null
            const targetCatId = urlParams?.get("cat") || (typeof window !== "undefined" ? sessionStorage.getItem("admin_curriculum_cat_id") : null)
            const targetSubId = urlParams?.get("sub") || (typeof window !== "undefined" ? sessionStorage.getItem("admin_curriculum_sub_id") : null)

            // request all the data at the same time to make it faster
            const catPromise = fetch("/api/admin/categories").catch((e) => { console.warn(e); return null })
            const subjPromise = fetch("/api/admin/subjects").catch((e) => { console.warn(e); return null })
            const masterPromise = fetch("/api/admin/master-data/dropdowns").catch((e) => { console.warn(e); return null })
            const subPromise = targetCatId ? fetch(`/api/admin/subcategories?category_id=${targetCatId}`).catch(() => null) : null

            const [catRes, subjRes, masterRes, subRes] = await Promise.all([catPromise, subjPromise, masterPromise, subPromise])

            let loadedCats = []
            let matchedCat = null
            if (catRes && catRes.ok) {
                let catData = await catRes.json()
                loadedCats = catData.categories || []
                if (targetCatId) {
                    matchedCat = loadedCats.find(c => String(c.id) === String(targetCatId)) || null
                }
            }

            let loadedSubs = []
            let matchedSub = null
            if (subRes && subRes.ok) {
                let subData = await subRes.json()
                loadedSubs = subData.subcategories || []
                if (targetSubId) {
                    matchedSub = loadedSubs.find(s => String(s.id) === String(targetSubId)) || null
                }
            }

            let loadedSubjects = []
            if (subjRes && subjRes.ok) {
                let subjData = await subjRes.json()
                loadedSubjects = subjData.subjects || []
            }

            // put all loaded data into memory so the screen updates smoothly
            setCategories(loadedCats)
            setSubcategories(loadedSubs)
            setSubjects(loadedSubjects)
            setSelectedCategory(matchedCat)
            setSelectedSubcategory(matchedSub)

            if (masterRes && masterRes.ok) {
                let masterDataRes = await masterRes.json()
                setMasterData({
                    examinations: masterDataRes.examinations || [],
                    programs: masterDataRes.programs || [],
                    majors: masterDataRes.majors || []
                })
            }
        } catch (err) {
            console.error("Fetch error:", err)
        } finally {
            setLoading(false)
        }
    }, [])

    // run data download as soon as the page opens
    useEffect(() => {
        fetchData()
    }, [fetchData])

    // load subcategories whenever the user picks a different category
    const isInitialMount = useRef(true)
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false
            return
        }

        if (!selectedCategory?.id) {
            setSubcategories([])
            return
        }

        let isMounted = true
        fetch(`/api/admin/subcategories?category_id=${selectedCategory.id}`)
            .then((r) => (r && r.ok ? r.json() : null))
            .then((d) => {
                if (!isMounted) return
                const list = d?.subcategories || []
                setSubcategories(list)
            })
            .catch(() => {
                if (isMounted) setSubcategories([])
            })

        return () => { isMounted = false }
    }, [selectedCategory?.id])

    // filter and show only the subjects that belong to the current subcategory or category
    const currentSubjects = subjects.filter((s) => {
        if (selectedSubcategory) {
            return s.subcategory_id === selectedSubcategory.id
        }
        if (selectedCategory && selectedCategory.has_subcategories === false) {
            return s.category_id === selectedCategory.id || s.category?.toLowerCase() === selectedCategory.name?.toLowerCase()
        }
        return false
    })

    // CATEGORY FUNCTIONS

    // this opens the popup window to add or edit a category
    function openCatModal(mode, cat = null) {
        setCatModalMode(mode)
        if (mode === "edit" && cat) {
            setCatModalData({
                id: cat.id,
                name: cat.name,
                has_subcategories: cat.has_subcategories !== false,
                target_course: cat.target_course || "all",
                target_program: cat.target_program || "all",
                target_major: cat.target_major || "all"
            })
        } else {
            setCatModalData({
                id: null,
                name: "",
                has_subcategories: true,
                target_course: "all",
                target_program: "all",
                target_major: "all"
            })
        }
        setIsCatModalOpen(true)
    }

    // this saves the category to the database
    async function handleSaveCategory() {
        if (!catModalData.name.trim()) return
        setSaving(true)
        try {
            const method = catModalMode === "add" ? "POST" : "PUT"
            const url = catModalMode === "add" ? "/api/admin/categories" : `/api/admin/categories?id=${catModalData.id}`

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: catModalData.name.trim(),
                    has_subcategories: catModalData.has_subcategories,
                    target_course: catModalData.target_course,
                    target_program: catModalData.target_program,
                    target_major: catModalData.target_major
                }),
            })
            if (!res.ok) throw new Error((await res.json()).error || `Failed to ${catModalMode} category`)
            const data = await res.json()

            if (catModalMode === "add") {
                setCategories((prev) => [...prev, data.category])
                if (!selectedCategory) setSelectedCategory(data.category)
            } else {
                setCategories((prev) => prev.map(c => c.id === catModalData.id ? data.category : c))
                if (selectedCategory?.id === catModalData.id) setSelectedCategory(data.category)
            }
            setIsCatModalOpen(false)
        } catch (err) { showError(err.message) } finally { setSaving(false) }
    }

    // this tells the database to delete the category
    async function deleteCategory(catId) {
        try {
            const res = await fetch(`/api/admin/categories?id=${catId}`, { method: "DELETE" })
            if (!res.ok) throw new Error("Failed to delete category")
            setCategories((prev) => prev.filter((c) => c.id !== catId))
            if (selectedCategory?.id === catId) {
                setSelectedCategory(null)
                setSelectedSubcategory(null)
                setSubcategories([])
            }
        } catch (err) { showError(err.message) }
    }

    // this asks the user first before deleting a category
    function handleDeleteCategory(catId) {
        showConfirm({
            title: "Delete category?",
            description: "This will remove the category and its subcategories.",
            onConfirm: () => deleteCategory(catId),
        })
    }

    // SUBCATEGORY FUNCTIONS

    // this opens the popup window to add or edit a subcategory
    function openSubModal(mode, sub = null) {
        setSubModalMode(mode)
        if (mode === "edit" && sub) {
            setSubModalData({
                id: sub.id,
                name: sub.name,
                description: sub.description || "",
                image_url: sub.image_url || "",
                imageFile: null,
                status: sub.status || "active",
            })
        } else {
            setSubModalData({ id: null, name: "", description: "", image_url: "", imageFile: null, status: "active" })
        }
        setIsSubModalOpen(true)
    }

    // this uploads the photo and saves subcategory information
    async function handleSaveSubcategory() {
        if (!subModalData.name.trim() || !selectedCategory?.id) return
        setSaving(true)
        try {
            const method = subModalMode === "add" ? "POST" : "PUT"
            const url = subModalMode === "add" ? "/api/admin/subcategories" : `/api/admin/subcategories?id=${subModalData.id}`
            const formData = new FormData()
            formData.append("name", subModalData.name.trim())
            if (subModalData.description) formData.append("description", subModalData.description.trim())
            formData.append("status", subModalData.status)
            if (subModalMode === "add") {
                formData.append("category_id", selectedCategory.id)
            }
            if (subModalData.imageFile) {
                formData.append("image", subModalData.imageFile)
            } else if (subModalData.image_url) {
                formData.append("image_url", subModalData.image_url)
            }

            const res = await fetch(url, { method, body: formData })
            if (!res.ok) throw new Error((await res.json()).error || `Failed to ${subModalMode} subcategory`)
            const data = await res.json()

            if (subModalMode === "add") setSubcategories((prev) => [...prev, data.subcategory])
            else setSubcategories((prev) => prev.map(s => s.id === subModalData.id ? data.subcategory : s))

            setIsSubModalOpen(false)
        } catch (err) { showError(err.message) } finally { setSaving(false) }
    }

    // this deletes a subcategory from the database
    async function deleteSubcategory(subId) {
        try {
            const res = await fetch(`/api/admin/subcategories?id=${subId}`, { method: "DELETE" })
            if (!res.ok) throw new Error("Failed to delete subcategory")
            setSubcategories((prev) => prev.filter((s) => s.id !== subId))
            if (selectedSubcategory?.id === subId) setSelectedSubcategory(null)
        } catch (err) { showError(err.message) }
    }

    // this asks the user first before deleting a subcategory
    function handleDeleteSubcategory(subId) {
        showConfirm({
            title: "Delete subcategory?",
            description: "This will remove the selected subcategory.",
            onConfirm: () => deleteSubcategory(subId),
        })
    }

    // SUBJECT FUNCTIONS

    // this opens the popup window to add or edit a subject
    function openSubjectModal(mode, sub = null) {
        setSubjectModalMode(mode)
        if (mode === "edit" && sub) {
            let dateVal = ""
            let timeVal = ""
            if (sub.unlock_date) {
                const d = new Date(sub.unlock_date)
                dateVal = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
                timeVal = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
            }
            setSubjectModalData({
                id: sub.id,
                title: sub.title,
                code: sub.code,
                description: sub.description || "",
                image_url: sub.image_url || "",
                imageFile: null,
                unlock_date: dateVal,
                unlock_time: timeVal,
                status: sub.status || "active"
            })
        } else {
            setSubjectModalData({ id: null, title: "", code: "", description: "", image_url: "", imageFile: null, unlock_date: "", unlock_time: "", status: "active" })
        }
        setIsSubjectModalOpen(true)
    }

    // this uploads subject details and its image to the database
    async function handleSaveSubject() {
        if (!subjectModalData.title.trim() || !subjectModalData.code.trim()) return
        if (!selectedSubcategory?.id && !selectedCategory?.name) return
        setSaving(true)
        try {
            const method = subjectModalMode === "add" ? "POST" : "PUT"
            const url = subjectModalMode === "add" ? "/api/admin/subjects" : `/api/admin/subjects?id=${subjectModalData.id}`

            const formData = new FormData()
            formData.append("title", subjectModalData.title.trim())
            formData.append("code", subjectModalData.code.trim())
            if (subjectModalData.description) formData.append("description", subjectModalData.description.trim())
            formData.append("status", subjectModalData.status)

            // if subject is locked and has an unlock date we format the date and time
            if (subjectModalData.status === "inactive" && subjectModalData.unlock_date) {
                const timePart = subjectModalData.unlock_time ? subjectModalData.unlock_time : "00:00"
                const combinedDateTime = new Date(`${subjectModalData.unlock_date}T${timePart}:00`)
                formData.append("unlock_date", combinedDateTime.toISOString())
            } else {
                formData.append("unlock_date", "")
            }

            if (selectedSubcategory?.id) {
                formData.append("subcategory_id", selectedSubcategory.id)
            }
            if (selectedCategory?.name) {
                formData.append("category", selectedCategory.name)
            }

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
        } catch (err) { showError(err.message) } finally { setSaving(false) }
    }

    // this deletes a subject from the database
    async function deleteSubject(subId) {
        try {
            const res = await fetch(`/api/admin/subjects?id=${subId}`, { method: "DELETE" })
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}))
                throw new Error(errData.error || "Failed to delete subject")
            }
            setSubjects((prev) => prev.filter((s) => s.id !== subId))
        } catch (err) { showError(err.message) }
    }

    // this asks the user first before deleting a subject
    function handleDeleteSubject(subId) {
        showConfirm({
            title: "Delete subject?",
            description: "This subject and its related content will be removed.",
            onConfirm: () => deleteSubject(subId),
        })
    }

    // if the page is still downloading data we show placeholder boxes
    if (loading) {
        return (
            <div className="space-y-12 w-full max-w-6xl mx-auto px-4 py-8 animate-in fade-in duration-300">
                {/* categories skeleton */}
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

                {/* subcategory cards skeleton */}
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

                {/* subject rows skeleton */}
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

    // if an error happened we show a red alert box
    if (error) {
        return (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-destructive">
                {error}
            </div>
        )
    }

    // this is the main page design that appears on the screen
    return (
        <div className="flex flex-col min-h-[calc(100vh-10rem)] space-y-6 w-full max-w-6xl mx-auto px-4 py-4 relative">

            {/* top category buttons */}
            {!selectedSubcategory && !(selectedCategory && selectedCategory.has_subcategories === false) && (
                <div className="space-y-4 border-b border-border pb-6">
                    <div>
                        <div className="flex items-center gap-2">
                            <div className="shrink-0 flex items-center justify-center pointer-events-none [&_path]:!fill-[#E9C46A] [&_path]:!stroke-[#E9C46A] [&_circle]:!stroke-[#E9C46A] [&_rect]:!stroke-[#E9C46A]">
                                <LordIcon
                                    src="/icons/category.json"
                                    trigger="loop"
                                    delay={4000}
                                    size={28}
                                    speed={1}
                                />
                            </div>
                            <h1 className="text-2xl font-bold tracking-wider text-foreground uppercase">
                                CATEGORY
                            </h1>
                        </div>
                    </div>

                    {/* list of category buttons and more dropdown if there are too many */}
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
                                            className={`group cursor-pointer flex items-center rounded-lg px-3.5 py-1.5 transition-all duration-300 ${isSelected
                                                ? "bg-[#E9C46A] text-white shadow-sm"
                                                : "bg-card text-foreground border border-border/80 shadow-xs hover:bg-muted/80"
                                                }`}
                                        >
                                            <span className="text-xs font-bold uppercase tracking-wider whitespace-nowrap select-none">
                                                {cat.name}
                                            </span>

                                            {/* edit and delete buttons when hovering on category */}
                                            <div className="cat-pill-actions">
                                                <div className={`cat-pill-inner ${isSelected ? "text-white/75" : "text-muted-foreground"}`}>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            openCatModal("edit", cat);
                                                        }}
                                                        className={`p-0.5 shrink-0 transition-colors ${isSelected ? "hover:text-white" : "hover:text-foreground"}`}
                                                        title="Category Settings"
                                                    >
                                                        <Settings className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat.id) }}
                                                        className={`p-0.5 shrink-0 transition-colors ${isSelected ? "hover:text-white" : "hover:text-foreground"}`}
                                                        title="Delete category"
                                                    >
                                                        <Trash className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}

                                {/* dropdown button that shows hidden categories */}
                                {overflowCategories.length > 0 && (
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowMoreDropdown(!showMoreDropdown)}
                                            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider border border-border/80 bg-card text-muted-foreground hover:bg-muted hover:text-foreground shadow-xs transition-all cursor-pointer"
                                        >
                                            <span>More ({overflowCategories.length})</span>
                                            <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${showMoreDropdown ? "rotate-180" : ""}`} />
                                        </button>

                                        {showMoreDropdown && (
                                            <>
                                                <div className="fixed inset-0 z-30" onClick={() => setShowMoreDropdown(false)} />
                                                <div className="absolute left-0 mt-2 z-40 w-56 rounded-xl bg-popover border border-border shadow-xl py-1.5 animate-in fade-in zoom-in-95 duration-150">
                                                    <div className="px-3 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border mb-1">
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
                                                                className="group flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-semibold uppercase text-foreground hover:bg-muted transition-all duration-150 cursor-pointer"
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

                                {/* plus button to add a new category */}
                                <button
                                    onClick={() => openCatModal("add")}
                                    title="Add Category"
                                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/80 bg-card text-muted-foreground transition-all duration-300 ease-out hover:bg-muted hover:text-foreground shadow-xs shrink-0 cursor-pointer"
                                >
                                    <Plus className="h-4 w-4" strokeWidth={2.5} />
                                </button>
                            </div>
                        )
                    })()}
                </div>
            )}

            {/* empty screen message when no category is selected yet */}
            {!selectedCategory && (
                <div className="flex-1 flex flex-col items-center justify-center min-h-[48vh] px-4 text-center animate-in fade-in duration-300">
                    <h3 className="text-base font-bold text-foreground uppercase tracking-wider mb-1">
                        Select or Add a Category
                    </h3>
                    <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
                        Please select a category above to view its sub-categories, competencies, and subjects, or click + to add a new category.
                    </p>
                </div>
            )}

            {/* subcategory cards grid */}
            {!selectedSubcategory && selectedCategory && selectedCategory.has_subcategories !== false && (
                <div className="space-y-6 flex-1 animate-in fade-in duration-300">
                    {(() => {
                        const SUB_ITEMS_PER_PAGE = 8
                        const sortedSubcategories = [...subcategories].sort((a, b) => {
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
                                {/* header bar: title and description without bottom line divider */}
                                <div className="pb-1">
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-lg font-bold tracking-wider text-foreground uppercase">
                                            SUB-CATEGORY
                                        </h2>
                                        <span className="ml-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-muted text-muted-foreground uppercase tracking-wider">
                                            {subcategories.length} AVAILABLE
                                        </span>
                                    </div>
                                    <p className="text-muted-foreground text-sm font-medium mt-0.5">Select a sub-category to view subjects, or add a new one.</p>
                                </div>

                                {/* controls row below the line divider: sort (left) & pagination (right) */}
                                <div className="flex items-center justify-between gap-4 pt-1">
                                    {/* minimal sort dropdown (left) */}
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

                                    {/* subcategory pagination (right) */}
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

                                                {/* Sliding White Info Overlay: Cover bottom initially, slide UP smoothly to fill entire card ONLY if description exists */}
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
                                                                {/* Lock icon indicator */}
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

                                                    {/* Bottom Action Footer (Edit, Delete, and Status) */}
                                                    <div className="subcard-footer">
                                                        <span className={`text-[11px] font-semibold tracking-wide ${isInactive ? 'text-amber-600' : 'text-emerald-600'}`}>
                                                            {isInactive ? "Locked for students" : "Active"}
                                                        </span>
                                                        <div className="flex items-center gap-1 text-[#8c8c8c]">
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); openSubModal("edit", sub) }}
                                                                className="p-1 hover:text-[#4d4d4d] transition-colors shrink-0"
                                                                title="Edit subcategory"
                                                            >
                                                                <Pencil className="h-3.5 w-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleDeleteSubcategory(sub.id) }}
                                                                className="p-1 hover:text-[#4d4d4d] transition-colors shrink-0"
                                                                title="Delete subcategory"
                                                            >
                                                                <Trash className="h-3.5 w-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}

                                    {/* Show ADD SUB-CATEGORY button on last page */}
                                    {currentSubPage === totalSubPages && (
                                        <button
                                            onClick={() => openSubModal("add")}
                                            className="flex aspect-square w-full items-center justify-center rounded-xl bg-gray-100 border border-gray-200/50 shadow-sm transition-all hover:bg-gray-200 hover:border-gray-300 group"
                                        >
                                            <span className="text-xs font-bold tracking-wider text-gray-600 group-hover:text-gray-900 uppercase">
                                                ADD SUB-CATEGORY +
                                            </span>
                                        </button>
                                    )}
                                </div>
                            </>
                        )
                    })()}
                </div>
            )}

            {/* subjects section shows up when a subcategory or direct category is clicked */}
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
                        const cleanTitle = rawTitle.replace(/\s*\/\s*SUBJECTS$/i, "")

                        return (
                            <>
                                {/* top bar with back button and add subject button */}
                                <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <button
                                            onClick={() => {
                                                if (selectedSubcategory) {
                                                    setSelectedSubcategory(null)
                                                    if (typeof window !== "undefined") {
                                                        sessionStorage.removeItem("admin_curriculum_sub_id")
                                                        window.history.pushState({ catId: selectedCategory?.id, subId: null }, "", `?catId=${selectedCategory?.id}`)
                                                    }
                                                } else {
                                                    setSelectedCategory(null)
                                                    setSelectedSubcategory(null)
                                                    if (typeof window !== "undefined") {
                                                        sessionStorage.removeItem("admin_curriculum_cat_id")
                                                        sessionStorage.removeItem("admin_curriculum_sub_id")
                                                        window.history.pushState({ catId: null, subId: null }, "", window.location.pathname)
                                                    }
                                                }
                                            }}
                                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/80 bg-card text-muted-foreground transition-all hover:bg-muted hover:text-foreground shadow-xs shrink-0 cursor-pointer"
                                            title={selectedSubcategory ? "Back to subcategories" : "Back to categories"}
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </button>
                                        <div className="flex items-center gap-2 min-w-0 overflow-hidden flex-1">
                                            <h2 className="text-base sm:text-lg font-bold uppercase tracking-wider text-foreground flex items-center min-w-0 overflow-hidden" title={`${cleanTitle} / SUBJECTS`}>
                                                <span className="truncate max-w-[240px] sm:max-w-[400px] md:max-w-[600px]">
                                                    {cleanTitle}
                                                </span>
                                                <span className="text-muted-foreground/40 mx-1.5 shrink-0">/</span>
                                                <span className="shrink-0 text-muted-foreground">SUBJECTS</span>
                                            </h2>
                                            <span className="shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold bg-muted text-muted-foreground uppercase tracking-wider">
                                                {currentSubjects.length} AVAILABLE
                                            </span>
                                        </div>
                                    </div>

                                    {/* button to add a new subject */}
                                    <button
                                        onClick={() => openSubjectModal("add")}
                                        className="shrink-0 rounded-lg bg-[#E9C46A] px-4 py-2 text-xs font-bold text-white hover:bg-[#dfb550] transition-colors shadow-sm uppercase tracking-wide cursor-pointer"
                                    >
                                        ADD SUBJECT
                                    </button>
                                </div>

                                {currentSubjects.length === 0 ? (
                                    <div className="flex-1 flex flex-col items-center justify-center min-h-[48vh] px-4 text-center animate-in fade-in duration-300">
                                        <h3 className="text-base font-bold text-foreground uppercase tracking-wider mb-1">
                                            No Subjects Created Yet
                                        </h3>
                                        <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
                                            Click &quot;ADD SUBJECT&quot; above to create a new subject for this curriculum.
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        {/* sorting dropdown and page numbers */}
                                        <div className="flex items-center justify-between gap-3 pt-1">
                                            {/* Minimal Sort Dropdown */}
                                            <div className="flex items-center gap-1.5 bg-card border border-border/80 rounded-lg px-2.5 py-1 text-xs font-semibold text-muted-foreground shadow-2xs">
                                                <ArrowUpDown className="h-3 w-3 text-muted-foreground shrink-0" />
                                                <select
                                                    value={subjectSortBy}
                                                    onChange={(e) => setSubjectSortBy(e.target.value)}
                                                    className="bg-transparent font-medium text-foreground cursor-pointer focus:outline-none text-xs"
                                                >
                                                    <option value="date_desc">Newest First</option>
                                                    <option value="name_asc">A - Z</option>
                                                    <option value="name_desc">Z - A</option>
                                                    <option value="date_asc">Oldest First</option>
                                                </select>
                                            </div>

                                            {/* pagination buttons to switch pages */}
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => setSubjectCurrentPage(p => Math.max(1, p - 1))}
                                                    disabled={currentSubjPage === 1}
                                                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/80 bg-card text-muted-foreground transition-all hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs cursor-pointer"
                                                    title="Previous Page"
                                                >
                                                    <ChevronLeft className="h-3.5 w-3.5" />
                                                </button>
                                                <div className="flex items-center gap-1 px-2.5 py-1 bg-card rounded-lg border border-border/80 text-xs font-semibold text-muted-foreground">
                                                    <span>Page</span>
                                                    <span className="font-bold text-foreground">{currentSubjPage}</span>
                                                    <span>of</span>
                                                    <span className="font-bold text-foreground">{totalSubjectPages}</span>
                                                </div>
                                                <button
                                                    onClick={() => setSubjectCurrentPage(p => Math.min(totalSubjectPages, p + 1))}
                                                    disabled={currentSubjPage === totalSubjectPages}
                                                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/80 bg-card text-muted-foreground transition-all hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs cursor-pointer"
                                                    title="Next Page"
                                                >
                                                    <ChevronRight className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* list of subject cards */}
                                        <div className="space-y-3 pt-2">
                                            {paginatedSubjects.map((subject) => (
                                                <div key={subject.id} className="group relative flex bg-card border border-border/80 rounded-xl overflow-hidden shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all p-3.5 items-stretch">
                                                    {/* subject image box */}
                                                    <div className="h-28 w-28 shrink-0 rounded-xl overflow-hidden bg-muted/60 border border-border/80 shadow-2xs flex items-center justify-center self-center mr-5 relative">
                                                        <img
                                                            src={subject.image_url || "/images/default-subject.png"}
                                                            alt={subject.title}
                                                            className="absolute inset-0 h-full w-full object-cover rounded-xl"
                                                        />
                                                    </div>

                                                    {/* subject information title and description */}
                                                    <div className="flex-1 flex flex-col justify-between py-0.5">
                                                        <div>
                                                            <div className="flex items-center flex-wrap gap-2.5 mb-1.5">
                                                                <h3 className="text-base font-bold text-foreground uppercase tracking-wide">
                                                                    {subject.title}
                                                                </h3>
                                                                {subject.status === "inactive" && (
                                                                    <span className="inline-flex items-center gap-1.5 bg-muted text-muted-foreground px-2.5 py-0.5 rounded-full border border-border text-xs font-semibold">
                                                                        <Lock className="h-3 w-3 text-muted-foreground" />
                                                                        <span>Locked</span>
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-muted-foreground text-xs leading-relaxed mb-2 line-clamp-2">
                                                                {subject.description || "No description provided."}
                                                            </p>
                                                        </div>

                                                        <div className="flex items-center gap-3 text-xs font-semibold text-muted-foreground">
                                                            <span className="bg-muted px-2.5 py-1 rounded-full border border-border">
                                                                Date added: {new Date(subject.created_at).toLocaleDateString()}
                                                            </span>
                                                            <span className="bg-muted px-2.5 py-1 rounded-full border border-border">
                                                                Code: {subject.code}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* button to enter and edit lessons inside the subject */}
                                                    <div className="flex items-end justify-end gap-3 shrink-0 ml-4 py-0.5">
                                                        {subject.status === "inactive" && subject.unlock_date && new Date(subject.unlock_date) > new Date() && (
                                                            <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-500 px-3 py-1.5 rounded-full border border-gray-200 text-xs font-semibold">
                                                                <Clock className="h-3.5 w-3.5 text-gray-400" />
                                                                <span>Scheduled to open: <span className="font-bold text-gray-700">{new Date(subject.unlock_date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span></span>
                                                            </span>
                                                        )}
                                                        <Link href={`/admin/curriculum/${subject.id}/content`} className="bg-gray-100 text-[#4d4d4d] hover:bg-gray-200 px-4 py-1.5 rounded-lg font-bold text-xs transition-colors border border-gray-200 shadow-sm inline-block">
                                                            Edit content
                                                        </Link>
                                                    </div>

                                                    {/* buttons to edit or delete subject */}
                                                    <div className="absolute top-3 right-3 flex opacity-0 group-hover:opacity-100 transition-opacity gap-1 z-10">
                                                        <button
                                                            onClick={() => openSubjectModal("edit", subject)}
                                                            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                                                            title="Edit Subject Details"
                                                        >
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteSubject(subject.id)}
                                                            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                                                            title="Delete Subject"
                                                        >
                                                            <Trash className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </>
                        )
                    })()}
                </div>
            )}

            {/* popup window for adding or editing categories */}
            {isCatModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="w-full max-w-[480px] bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
                            <h2 className="text-base font-semibold uppercase tracking-wider text-[#4d4d4d]">
                                {catModalMode === "add" ? "Add New Category" : "Category Settings"}
                            </h2>
                            <button
                                onClick={() => setIsCatModalOpen(false)}
                                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Category Name */}
                            <div>
                                <label className="block text-xs font-semibold text-[#7a7a7a] uppercase mb-1">
                                    Category Name:
                                </label>
                                <input
                                    type="text"
                                    value={catModalData.name}
                                    onChange={(e) => setCatModalData({ ...catModalData, name: e.target.value })}
                                    placeholder="e.g. Professional Education"
                                    className="w-full h-10 rounded-xl border border-gray-200 px-3 text-sm focus:outline-none focus:border-gray-400 font-medium text-gray-800"
                                />
                            </div>

                            {/* Has Subcategories Toggle */}
                            <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-200/50">
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={catModalData.has_subcategories}
                                        onChange={(e) => setCatModalData({ ...catModalData, has_subcategories: e.target.checked })}
                                        className="mt-0.5 rounded border-gray-300 text-[#E9C46A] focus:ring-0 h-4 w-4"
                                    />
                                    <div>
                                        <span className="block text-xs font-semibold text-[#4d4d4d] uppercase">
                                            Includes Sub-categories
                                        </span>
                                        <span className="block text-xs font-normal text-gray-500 mt-0.5">
                                            Uncheck if this category links directly to subjects.
                                        </span>
                                    </div>
                                </label>
                            </div>

                            {/* course program and major dropdown choices */}
                            {(() => {
                                // filter available programs based on selected course
                                let availablePrograms = masterData.programs
                                if (catModalData.target_course && catModalData.target_course !== "all") {
                                    const matchedExam = masterData.examinations.find(ex => ex.name.toLowerCase() === catModalData.target_course.toLowerCase())
                                    if (matchedExam) {
                                        availablePrograms = masterData.programs.filter(p => String(p.exam_id) === String(matchedExam.id))
                                    } else {
                                        availablePrograms = []
                                    }
                                }

                                // filter available majors based on selected program or course
                                let availableMajors = masterData.majors
                                if (catModalData.target_program && catModalData.target_program !== "all") {
                                    const matchedProg = masterData.programs.find(pr => pr.name.toLowerCase() === catModalData.target_program.toLowerCase())
                                    if (matchedProg) {
                                        availableMajors = masterData.majors.filter(m => String(m.program_id) === String(matchedProg.id))
                                    } else {
                                        availableMajors = []
                                    }
                                } else if (catModalData.target_course && catModalData.target_course !== "all") {
                                    const validProgIds = availablePrograms.map(p => String(p.id))
                                    availableMajors = masterData.majors.filter(m => validProgIds.includes(String(m.program_id)))
                                }

                                return (
                                    <div className="grid grid-cols-3 gap-2.5 pt-1">
                                        <div>
                                            <label className="block text-xs font-semibold text-[#7a7a7a] uppercase mb-1 truncate" title="Target Course">
                                                Course:
                                            </label>
                                            <select
                                                value={catModalData.target_course || "all"}
                                                onChange={(e) => setCatModalData({
                                                    ...catModalData,
                                                    target_course: e.target.value,
                                                    target_program: "all",
                                                    target_major: "all"
                                                })}
                                                className="w-full h-9 rounded-lg border border-gray-200 bg-white px-2 text-xs font-medium text-gray-700 focus:outline-none focus:border-gray-400 cursor-pointer"
                                            >
                                                <option value="all">All Courses</option>
                                                {masterData.examinations.map(e => (
                                                    <option key={e.id} value={e.name}>{e.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-[#7a7a7a] uppercase mb-1 truncate" title="Target Program">
                                                Program:
                                            </label>
                                            <select
                                                value={catModalData.target_program || "all"}
                                                onChange={(e) => setCatModalData({
                                                    ...catModalData,
                                                    target_program: e.target.value,
                                                    target_major: "all"
                                                })}
                                                className="w-full h-9 rounded-lg border border-gray-200 bg-white px-2 text-xs font-medium text-gray-700 focus:outline-none focus:border-gray-400 cursor-pointer"
                                            >
                                                <option value="all">All Programs</option>
                                                {availablePrograms.map(p => (
                                                    <option key={p.id} value={p.name}>{p.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-[#7a7a7a] uppercase mb-1 truncate" title="Target Major">
                                                Major:
                                            </label>
                                            <select
                                                value={catModalData.target_major || "all"}
                                                onChange={(e) => setCatModalData({ ...catModalData, target_major: e.target.value })}
                                                className="w-full h-9 rounded-lg border border-gray-200 bg-white px-2 text-xs font-medium text-gray-700 focus:outline-none focus:border-gray-400 cursor-pointer"
                                            >
                                                <option value="all">All Majors</option>
                                                {availableMajors.map(m => (
                                                    <option key={m.id} value={m.name}>{m.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                )
                            })()}

                            {/* cancel and save buttons */}
                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                                <button
                                    onClick={() => setIsCatModalOpen(false)}
                                    className="rounded-lg px-4 py-2 text-xs font-semibold text-gray-500 border border-gray-200 hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveCategory}
                                    disabled={saving || !catModalData.name.trim()}
                                    className="rounded-lg px-5 py-2 text-xs font-bold text-white bg-[#E9C46A] hover:bg-[#dfb550] transition-colors disabled:opacity-50 shadow-sm uppercase tracking-wide"
                                >
                                    {saving ? "..." : "Save Settings"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* popup window for adding or editing a subcategory */}
            {isSubModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="w-full max-w-[600px] bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 animate-in zoom-in-95 duration-200">
                        {/* modal top bar */}
                        <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
                            <h2 className="text-base font-semibold uppercase tracking-wider text-[#4d4d4d]">
                                {subModalMode === "add" ? "Add Sub-category" : "Edit Sub-category"}
                            </h2>
                            <button
                                onClick={() => setIsSubModalOpen(false)}
                                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="flex gap-5 items-start">
                                {/* choose image for subcategory */}
                                <div className="shrink-0 flex flex-col items-start gap-1">
                                    <label className="block text-xs font-semibold text-[#7a7a7a] uppercase">
                                        Image:
                                    </label>
                                    <div className="relative h-24 w-24 rounded-xl border border-gray-200 bg-gray-50 flex flex-col items-center justify-center overflow-hidden hover:border-[#E9C46A]/50 hover:bg-blue-50/30 transition-all cursor-pointer group shadow-2xs">
                                        {subModalData.imageFile ? (
                                            <img src={URL.createObjectURL(subModalData.imageFile)} alt="Preview" className="absolute inset-0 h-full w-full object-cover z-10" />
                                        ) : subModalData.image_url ? (
                                            <img src={subModalData.image_url} alt="Preview" className="absolute inset-0 h-full w-full object-cover z-10" />
                                        ) : (
                                            <div className="text-center flex flex-col items-center gap-1">
                                                <ImageIcon className="h-5 w-5 text-gray-400 group-hover:text-[#E9C46A] transition-colors" />
                                                <span className="text-[10px] font-medium text-gray-400 group-hover:text-[#E9C46A] transition-colors">Upload</span>
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/35 backdrop-blur-[1px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                            <Pencil className="h-4 w-4 text-white" />
                                        </div>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                                if (e.target.files && e.target.files[0]) {
                                                    setSubModalData({ ...subModalData, imageFile: e.target.files[0] })
                                                }
                                            }}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30"
                                            title="Choose an image"
                                        />
                                    </div>
                                </div>

                                {/* type name and description */}
                                <div className="flex-1 space-y-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-[#7a7a7a] uppercase mb-1">
                                            Subcategory Name:
                                        </label>
                                        <input
                                            type="text"
                                            value={subModalData.name}
                                            onChange={e => setSubModalData({ ...subModalData, name: e.target.value })}
                                            placeholder="e.g. English Literature"
                                            className="w-full h-10 rounded-xl border border-gray-200 px-3 text-sm focus:outline-none focus:border-gray-400 font-medium text-gray-800"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-[#7a7a7a] uppercase mb-1">
                                            Description:
                                        </label>
                                        <textarea
                                            value={subModalData.description}
                                            onChange={e => setSubModalData({ ...subModalData, description: e.target.value })}
                                            rows={3}
                                            placeholder="Brief overview..."
                                            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm resize-none focus:outline-none focus:border-gray-400 font-medium text-gray-800"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* toggle switch for active or inactive status */}
                            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                <div className="flex items-center gap-3">
                                    <label className="text-xs font-semibold text-[#7a7a7a] uppercase">Status:</label>
                                    <button
                                        type="button"
                                        onClick={() => setSubModalData({ ...subModalData, status: subModalData.status === "active" ? "inactive" : "active" })}
                                        className="relative flex items-center gap-2 cursor-pointer"
                                    >
                                        <div className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5 ${subModalData.status === 'active' ? 'bg-[#E9C46A]' : 'bg-gray-300'}`}>
                                            <div className={`w-4 h-4 rounded-full bg-white shadow-xs transform transition-transform duration-200 ${subModalData.status === 'active' ? 'translate-x-4' : 'translate-x-0'}`} />
                                        </div>
                                        <span className={`text-xs font-semibold ${subModalData.status === 'active' ? 'text-[#E9C46A]' : 'text-gray-400'}`}>
                                            {subModalData.status === 'active' ? 'Active' : 'Inactive'}
                                        </span>
                                    </button>
                                </div>

                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setIsSubModalOpen(false)}
                                        className="rounded-lg px-4 py-2 text-xs font-semibold text-gray-500 border border-gray-200 hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveSubcategory}
                                        disabled={saving || !subModalData.name.trim()}
                                        className="rounded-lg px-5 py-2 text-xs font-bold text-white bg-[#E9C46A] hover:bg-[#dfb550] transition-colors disabled:opacity-50 shadow-sm uppercase tracking-wide"
                                    >
                                        {saving ? "..." : "Save"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* popup window for adding or editing a subject */}
            {isSubjectModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="w-full max-w-[600px] bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 animate-in zoom-in-95 duration-200">
                        {/* modal top bar */}
                        <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
                            <h2 className="text-base font-semibold uppercase tracking-wider text-[#4d4d4d]">
                                {subjectModalMode === "add" ? "Add Subject" : "Edit Subject"}
                            </h2>
                            <button
                                onClick={() => setIsSubjectModalOpen(false)}
                                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-[#7a7a7a] uppercase mb-1">
                                        Title:
                                    </label>
                                    <input
                                        type="text"
                                        value={subjectModalData.title}
                                        onChange={e => setSubjectModalData({ ...subjectModalData, title: e.target.value })}
                                        placeholder="Subject Title..."
                                        className="w-full h-10 rounded-xl border border-gray-200 px-3 text-sm focus:outline-none focus:border-gray-400 font-medium text-gray-800"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-[#7a7a7a] uppercase mb-1">
                                        Code:
                                    </label>
                                    <input
                                        type="text"
                                        value={subjectModalData.code}
                                        onChange={e => setSubjectModalData({ ...subjectModalData, code: e.target.value })}
                                        placeholder="e.g. ENG-101"
                                        className="w-full h-10 rounded-xl border border-gray-200 px-3 text-sm uppercase focus:outline-none focus:border-gray-400 font-medium text-gray-800"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-5 items-start">
                                {/* choose image for subject */}
                                <div className="shrink-0 flex flex-col items-start gap-1">
                                    <label className="block text-xs font-semibold text-[#7a7a7a] uppercase">
                                        Image:
                                    </label>
                                    <div className="relative h-24 w-24 rounded-xl border border-gray-200 bg-gray-50 flex flex-col items-center justify-center overflow-hidden hover:border-gray-300 hover:bg-gray-100 transition-all cursor-pointer group shadow-2xs">
                                        {subjectModalData.imageFile ? (
                                            <img src={URL.createObjectURL(subjectModalData.imageFile)} alt="Preview" className="absolute inset-0 h-full w-full object-cover z-10" />
                                        ) : subjectModalData.image_url ? (
                                            <img src={subjectModalData.image_url} alt="Preview" className="absolute inset-0 h-full w-full object-cover z-10" />
                                        ) : (
                                            <div className="text-center flex flex-col items-center gap-1">
                                                <ImageIcon className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                                                <span className="text-[10px] font-medium text-gray-400 group-hover:text-gray-600 transition-colors">Upload</span>
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/35 backdrop-blur-[1px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                            <Pencil className="h-4 w-4 text-white" />
                                        </div>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                                if (e.target.files && e.target.files[0]) {
                                                    setSubjectModalData({ ...subjectModalData, imageFile: e.target.files[0] })
                                                }
                                            }}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30"
                                            title="Choose an image"
                                        />
                                    </div>
                                </div>

                                {/* subject description box */}
                                <div className="flex-1 space-y-1">
                                    <label className="block text-xs font-semibold text-[#7a7a7a] uppercase mb-1">
                                        Description:
                                    </label>
                                    <textarea
                                        value={subjectModalData.description}
                                        onChange={e => setSubjectModalData({ ...subjectModalData, description: e.target.value })}
                                        rows={4}
                                        placeholder="Subject description and overview..."
                                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm resize-none focus:outline-none focus:border-gray-400 font-medium text-gray-800"
                                    />
                                </div>
                            </div>

                            {/* unlock date picker if subject is locked */}
                            {subjectModalData.status === "inactive" && (
                                <div className="pt-1 animate-in fade-in duration-200">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-semibold text-[#7a7a7a] uppercase mb-1">
                                                Unlock Date:
                                            </label>
                                            <MinimalDatePicker
                                                value={subjectModalData.unlock_date}
                                                onChange={(dateStr) => setSubjectModalData({ ...subjectModalData, unlock_date: dateStr })}
                                                placeholder="Select unlock date..."
                                                popoverPosition="top"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-[#7a7a7a] uppercase mb-1">
                                                Unlock Time:
                                            </label>
                                            <MinimalTimePicker
                                                value={subjectModalData.unlock_time || ""}
                                                onChange={(timeStr) => setSubjectModalData({ ...subjectModalData, unlock_time: timeStr })}
                                            />
                                        </div>
                                    </div>
                                    <span className="text-xs font-normal text-gray-400 block mt-1">
                                        Leave blank to keep locked.
                                    </span>
                                </div>
                            )}

                            {/* status toggle and save button */}
                            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                <div className="flex items-center gap-3">
                                    <label className="text-xs font-semibold text-[#7a7a7a] uppercase">Status:</label>
                                    <button
                                        type="button"
                                        onClick={() => setSubjectModalData({ ...subjectModalData, status: subjectModalData.status === "active" ? "inactive" : "active" })}
                                        className="relative flex items-center gap-2 cursor-pointer"
                                    >
                                        <div className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5 ${subjectModalData.status === 'active' ? 'bg-[#E9C46A]' : 'bg-gray-300'}`}>
                                            <div className={`w-4 h-4 rounded-full bg-white shadow-xs transform transition-transform duration-200 ${subjectModalData.status === 'active' ? 'translate-x-4' : 'translate-x-0'}`} />
                                        </div>
                                        <span className={`text-xs font-semibold ${subjectModalData.status === 'active' ? 'text-[#E9C46A]' : 'text-gray-400'}`}>
                                            {subjectModalData.status === 'active' ? 'Active' : 'Inactive'}
                                        </span>
                                    </button>
                                </div>

                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setIsSubjectModalOpen(false)}
                                        className="rounded-lg px-4 py-2 text-xs font-semibold text-gray-500 border border-gray-200 hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveSubject}
                                        disabled={saving || !subjectModalData.title.trim() || !subjectModalData.code.trim()}
                                        className="rounded-lg px-5 py-2 text-xs font-bold text-white bg-[#E9C46A] hover:bg-[#dfb550] transition-colors disabled:opacity-50 shadow-sm uppercase tracking-wide"
                                    >
                                        {saving ? "..." : "Save Subject"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* popup modal to confirm delete */}
            <ConfirmDeleteModal
                isOpen={uiDialog.open}
                title={uiDialog.title}
                description={uiDialog.description}
                confirmText={uiDialog.confirmText || "Delete"}
                onConfirm={handleDialogAction}
                onCancel={closeDialog}
            />
        </div>
    )
}
