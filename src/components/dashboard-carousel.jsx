"use client"

import { useState, useEffect, useCallback } from "react"
import { ChevronLeft, ChevronRight, Settings, X, Plus, Pencil, Trash, Upload, Loader2, ImageIcon } from "lucide-react"
import ConfirmDeleteModal from "@/components/confirm-delete-modal"

export function DashboardCarousel() {
    const [slides, setSlides] = useState([])
    const [current, setCurrent] = useState(0)
    const [isAdmin, setIsAdmin] = useState(false)
    const [loading, setLoading] = useState(true)

    // Modal Control State
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [modalView, setModalView] = useState("list") // "list" or "form"
    const [selectedSlide, setSelectedSlide] = useState(null) // null for add mode
    const [formData, setFormData] = useState({
        id: "",
        src: "",
        alt: "",
        badge: "New Course Available",
        title: "",
        description: "",
        slide_order: 0,
    })
    const [uploading, setUploading] = useState(false)
    const [saving, setSaving] = useState(false)

    // Fetch slides from database
    const fetchSlides = useCallback(async () => {
        try {
            const res = await fetch("/api/admin/carousel")
            if (res.ok) {
                const data = await res.json()
                setSlides(data.slides || [])
            }
        } catch (err) {
            console.error("Failed to load carousel slides:", err)
        } finally {
            setLoading(false)
        }
    }, [])

    // Check user role
    const checkRole = useCallback(async () => {
        try {
            const res = await fetch("/api/auth/me")
            if (res.ok) {
                const data = await res.json()
                setIsAdmin(data.user?.role === "admin")
            }
        } catch (err) {
            console.error("Failed to check user role:", err)
        }
    }, [])

    useEffect(() => {
        fetchSlides()
        checkRole()
    }, [fetchSlides, checkRole])

    // Auto-advance every 5 seconds
    useEffect(() => {
        if (slides.length <= 1) return
        const next = () => setCurrent((i) => (i + 1) % slides.length)
        const timer = setInterval(next, 5000)
        return () => clearInterval(timer)
    }, [slides])

    const next = () => setCurrent((i) => (i + 1) % slides.length)
    const prev = () => setCurrent((i) => (i - 1 + slides.length) % slides.length)

    // Open Modal to Add
    const openAddModal = () => {
        setSelectedSlide(null)
        setFormData({
            src: "",
            alt: "",
            badge: "New Course Available",
            title: "",
            description: "",
            slide_order: slides.length,
        })
        setModalView("form")
        setIsModalOpen(true)
    }

    // Open Modal to Edit
    const openEditModal = (slide) => {
        setSelectedSlide(slide)
        setFormData({
            id: slide.id,
            src: slide.src,
            alt: slide.alt || "",
            badge: slide.badge || "",
            title: slide.title || "",
            description: slide.description || "",
            slide_order: slide.slide_order || 0,
        })
        setModalView("form")
        setIsModalOpen(true)
    }

    // Image upload handler
    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        const uploadData = new FormData()
        uploadData.append("file", file)

        try {
            const res = await fetch("/api/admin/upload", {
                method: "POST",
                body: uploadData,
            })
            if (res.ok) {
                const data = await res.json()
                setFormData((prev) => ({ ...prev, src: data.url, alt: file.name }))
            } else {
                const error = await res.json()
                alert(error.error || "Failed to upload image")
            }
        } catch (err) {
            console.error("Upload error:", err)
            alert("Error uploading image")
        } finally {
            setUploading(false)
        }
    }

    // Save Slide (Add or Update)
    const handleSaveSlide = async (e) => {
        e.preventDefault()
        if (!formData.src) {
            alert("Please provide or upload an image")
            return
        }

        setSaving(true)
        const isEdit = !!selectedSlide
        const method = isEdit ? "PUT" : "POST"

        try {
            const res = await fetch("/api/admin/carousel", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            })

            if (res.ok) {
                await fetchSlides()
                setIsModalOpen(false)
            } else {
                const error = await res.json()
                alert(error.error || "Failed to save slide")
            }
        } catch (err) {
            console.error("Save error:", err)
            alert("Error saving slide")
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

    // Delete Slide
    const handleDeleteSlide = (id, slideTitle = "this slide") => {
        setDeleteModal({
            isOpen: true,
            title: "Delete Carousel Slide",
            description: `Are you sure you want to delete "${slideTitle}" from the dashboard carousel? This action cannot be undone.`,
            onConfirm: async () => {
                setDeleteModal(prev => ({ ...prev, isDeleting: true }))
                try {
                    const res = await fetch(`/api/admin/carousel?id=${id}`, {
                        method: "DELETE",
                    })
                    if (res.ok) {
                        await fetchSlides()
                        setIsModalOpen(false)
                    } else {
                        const error = await res.json()
                        alert(error.error || "Failed to delete slide")
                    }
                } catch (err) {
                    console.error("Delete error:", err)
                    alert("Error deleting slide")
                } finally {
                    setDeleteModal({ isOpen: false, title: "", description: "", onConfirm: null, isDeleting: false })
                }
            },
            isDeleting: false
        })
    }

    if (loading) {
        return <div className="w-full aspect-[21/7] rounded-xl border border-border bg-muted animate-pulse" />
    }

    if (slides.length === 0) {
        return (
            <div className="w-full aspect-[21/7] rounded-xl border border-border bg-muted flex flex-col items-center justify-center gap-2 p-6 text-center">
                <p className="text-muted-foreground font-semibold">No slides available.</p>
                {isAdmin && (
                    <button
                        onClick={openAddModal}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/95 transition-colors shadow-sm"
                    >
                        Add Slide
                    </button>
                )}
            </div>
        )
    }

    const currentSlide = slides[current]

    return (
        <div className="group relative w-full overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            {/* Slide container */}
            <div className="relative aspect-[21/7] w-full overflow-hidden">
                {slides.map((slide, i) => (
                    <div
                        key={slide.id || slide.src}
                        className={`absolute inset-0 h-full w-full transition-opacity duration-500 ${
                            i === current ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                        }`}
                    >
                        <img
                            src={slide.src}
                            alt={slide.alt || "Announcement Banner"}
                            className="absolute inset-0 h-full w-full object-cover"
                        />
                        {/* Overlay to ensure text readability */}
                        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-transparent z-10" />

                        {/* Overlay text content */}
                        <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-12 z-20 pointer-events-none">
                            {slide.badge && (
                                <span className="inline-block w-fit rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
                                    {slide.badge}
                                </span>
                            )}
                            {slide.title && (
                                <h2 className="mt-3 text-xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight max-w-xl drop-shadow-md">
                                    {slide.title}
                                </h2>
                            )}
                            {slide.description && (
                                <p className="mt-2 text-xs sm:text-sm md:text-base text-white/80 max-w-md line-clamp-2 sm:line-clamp-3">
                                    {slide.description}
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Left arrow */}
            {slides.length > 1 && (
                <button
                    onClick={prev}
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-background/85 border border-border shadow-md hover:bg-background transition-colors"
                    aria-label="Previous slide"
                >
                    <ChevronLeft className="h-5 w-5 text-foreground" />
                </button>
            )}

            {/* Right arrow */}
            {slides.length > 1 && (
                <button
                    onClick={next}
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-background/85 border border-border shadow-md hover:bg-background transition-colors"
                    aria-label="Next slide"
                >
                    <ChevronRight className="h-5 w-5 text-foreground" />
                </button>
            )}

            {/* Pagination Dots */}
            {slides.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                    {slides.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrent(i)}
                            className={`h-2 w-2 rounded-full transition-colors ${
                                i === current ? "bg-primary" : "bg-white/40 hover:bg-white/60"
                            }`}
                            aria-label={`Go to slide ${i + 1}`}
                        />
                    ))}
                </div>
            )}

            {/* Admin Settings Button (Hover top right) */}
            {isAdmin && (
                <button
                    onClick={() => {
                        setModalView("list")
                        setSelectedSlide(null)
                        setIsModalOpen(true)
                    }}
                    className="absolute top-3 right-3 z-30 flex h-9 w-9 items-center justify-center rounded-full bg-background/80 border border-border shadow-md text-foreground hover:bg-background transition-all opacity-0 group-hover:opacity-100 hover:scale-105"
                    title="Configure Carousel Slides"
                >
                    <Settings className="h-4 w-4" />
                </button>
            )}

            {/* Admin Settings Modal Dialog */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="w-full max-w-xl bg-card rounded-2xl border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
                            <div>
                                <h3 className="text-base sm:text-lg font-bold text-foreground tracking-tight">Carousel Banner Manager</h3>
                                <p className="text-xs text-muted-foreground mt-0.5">Manage slides, badges, images and announcements</p>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors cursor-pointer"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                            {/* List view / Add view / Edit view */}
                            {modalView === "list" ? (
                                // LIST SLIDES VIEW (Table/List Style)
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center pb-2 border-b border-border/60">
                                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                            Active Slides ({slides.length})
                                        </h4>
                                        <button
                                            onClick={openAddModal}
                                            className="rounded-lg bg-[#E9C46A] hover:bg-[#dfb550] px-3.5 py-1.5 text-xs font-bold text-white uppercase tracking-wider transition-all shadow-xs cursor-pointer"
                                        >
                                            Add New Slide
                                        </button>
                                    </div>

                                    <div className="divide-y divide-border/60">
                                        {slides.map((slide) => (
                                            <div
                                                key={slide.id}
                                                className="flex items-center gap-3.5 py-3 first:pt-1 last:pb-1 hover:bg-muted/30 px-2 rounded-lg transition-colors group/row"
                                            >
                                                {/* Slide Image Preview */}
                                                <div className="w-16 h-10 rounded-lg overflow-hidden border border-border/70 bg-muted shrink-0 shadow-2xs">
                                                    <img
                                                        src={slide.src}
                                                        alt={slide.title || "Slide"}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>

                                                {/* Slide Details */}
                                                <div className="flex-1 min-w-0">
                                                    <h5 className="text-xs font-bold text-foreground truncate mb-0.5">
                                                        {slide.title || "Untitled Slide"}
                                                    </h5>
                                                    <p className="text-[11px] text-muted-foreground truncate font-normal">
                                                        {slide.description || "No description provided."}
                                                    </p>
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="flex items-center gap-1 shrink-0">
                                                    <button
                                                        onClick={() => openEditModal(slide)}
                                                        className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer"
                                                        title="Edit Slide"
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteSlide(slide.id, slide.title || "Slide")}
                                                        className="p-1.5 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                                                        title="Delete Slide"
                                                    >
                                                        <Trash className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                // ADD / EDIT FORM VIEW (Matching Categories & Subjects Modal Design)
                                <form id="carousel-slide-form" onSubmit={handleSaveSlide} className="space-y-4">
                                    <div className="flex items-start gap-4">
                                        {/* Image Picker */}
                                        <div className="space-y-1 shrink-0">
                                            <label className="block text-xs font-semibold text-[#7a7a7a] dark:text-muted-foreground uppercase mb-1">
                                                Image:
                                            </label>
                                            <div className="relative h-24 w-32 rounded-xl border border-border bg-muted/40 flex flex-col items-center justify-center overflow-hidden hover:border-[#E9C46A]/70 hover:bg-muted transition-all cursor-pointer group shadow-2xs">
                                                {uploading ? (
                                                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                                ) : formData.src ? (
                                                    <img src={formData.src} alt="Banner Preview" className="absolute inset-0 h-full w-full object-cover z-10" />
                                                ) : (
                                                    <div className="text-center flex flex-col items-center gap-1">
                                                        <ImageIcon className="h-5 w-5 text-muted-foreground group-hover:text-[#E9C46A] transition-colors" />
                                                        <span className="text-[10px] font-medium text-muted-foreground group-hover:text-[#E9C46A] transition-colors">Upload</span>
                                                    </div>
                                                )}
                                                {!uploading && (
                                                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                                        <Pencil className="h-4 w-4 text-white" />
                                                    </div>
                                                )}
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    disabled={uploading}
                                                    onChange={handleImageUpload}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30"
                                                    title="Choose an image"
                                                />
                                            </div>
                                        </div>

                                        {/* Badge and Title Input Fields */}
                                        <div className="flex-1 space-y-3">
                                            <div>
                                                <label className="block text-xs font-semibold text-[#7a7a7a] dark:text-muted-foreground uppercase mb-1">
                                                    Badge Text:
                                                </label>
                                                <input
                                                    type="text"
                                                    className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:border-slate-400 font-medium text-foreground transition-all"
                                                    placeholder="e.g. New Course Available"
                                                    value={formData.badge}
                                                    onChange={(e) => setFormData((prev) => ({ ...prev, badge: e.target.value }))}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-[#7a7a7a] dark:text-muted-foreground uppercase mb-1">
                                                    Slide Title:
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:border-slate-400 font-medium text-foreground transition-all"
                                                    placeholder="e.g. Advancing Through Neural Networks"
                                                    value={formData.title}
                                                    onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label className="block text-xs font-semibold text-[#7a7a7a] dark:text-muted-foreground uppercase mb-1">
                                            Description:
                                        </label>
                                        <textarea
                                            rows={3}
                                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:border-slate-400 font-medium text-foreground transition-all"
                                            placeholder="Describe the announcement or course details..."
                                            value={formData.description}
                                            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                                        />
                                    </div>

                                    {/* Order number input */}
                                    <div className="w-32">
                                        <label className="block text-xs font-semibold text-[#7a7a7a] dark:text-muted-foreground uppercase mb-1">
                                            Order:
                                        </label>
                                        <input
                                            type="number"
                                            className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:border-slate-400 font-medium text-foreground transition-all"
                                            value={formData.slide_order}
                                            onChange={(e) => setFormData((prev) => ({ ...prev, slide_order: parseInt(e.target.value, 10) || 0 }))}
                                        />
                                    </div>
                                </form>
                            )}
                        </div>

                        {/* Modal Footer (Form View) */}
                        {modalView !== "list" && (
                            <div className="flex justify-between items-center px-6 py-4 border-t border-border bg-muted/20">
                                {selectedSlide ? (
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteSlide(selectedSlide.id, selectedSlide.title || "Slide")}
                                        className="inline-flex items-center gap-1.5 px-3 h-8.5 rounded-lg border border-border/80 text-xs font-semibold text-muted-foreground hover:text-rose-600 hover:border-rose-300 dark:hover:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
                                    >
                                        Delete
                                    </button>
                                ) : (
                                    <div />
                                )}

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFormData({ id: "", src: "", alt: "", badge: "New Course Available", title: "", description: "", slide_order: 0 })
                                            setSelectedSlide(null)
                                            setModalView("list")
                                        }}
                                        className="px-4 py-2 rounded-lg text-xs font-semibold text-muted-foreground border border-border hover:bg-muted transition-colors cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        form="carousel-slide-form"
                                        disabled={saving}
                                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#E9C46A] hover:bg-[#dfb550] px-5 py-2 text-xs font-bold text-white uppercase tracking-wider transition-all disabled:opacity-50 shadow-xs cursor-pointer"
                                    >
                                        {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                        Save Slide
                                    </button>
                                </div>
                            </div>
                        )}
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
