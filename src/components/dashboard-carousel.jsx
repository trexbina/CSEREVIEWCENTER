"use client"

import { useState, useEffect, useCallback } from "react"
import { ChevronLeft, ChevronRight, Settings, X, Plus, Pencil, Trash2, Upload, Loader2 } from "lucide-react"

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

    // Delete Slide
    const handleDeleteSlide = async (id) => {
        if (!confirm("Are you sure you want to delete this slide?")) return

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
        }
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
                        <Plus className="h-4 w-4" /> Add Slide
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="w-full max-w-2xl bg-background rounded-xl border border-border shadow-2xl p-6 md:p-8 animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-foreground">Carousel Banner Manager</h3>
                                <p className="text-xs text-muted-foreground mt-0.5">Manage slides, badges, images and announcements</p>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-muted-foreground hover:text-foreground rounded-lg p-1.5 hover:bg-accent transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* List view / Add view / Edit view */}
                        {modalView === "list" ? (
                            // LIST SLIDES VIEW
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h4 className="text-sm font-semibold text-muted-foreground">Active Slides ({slides.length})</h4>
                                    <button
                                        onClick={openAddModal}
                                        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/95 transition-colors shadow-sm"
                                    >
                                        <Plus className="h-3.5 w-3.5" /> Add New Slide
                                    </button>
                                </div>

                                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                                    {slides.map((slide) => (
                                        <div
                                            key={slide.id}
                                            className="flex items-center gap-4 bg-muted/40 border border-border p-3 rounded-lg hover:bg-muted/60 transition-colors"
                                        >
                                            <img
                                                src={slide.src}
                                                alt={slide.title || "Slide"}
                                                className="w-16 h-10 object-cover rounded border border-border shrink-0"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <span className="inline-block text-[9px] font-bold text-primary uppercase bg-primary/10 px-2 py-0.5 rounded-full mb-1">
                                                    {slide.badge || "No Badge"}
                                                </span>
                                                <h5 className="text-sm font-bold text-foreground truncate">{slide.title || "No Title"}</h5>
                                                <p className="text-xs text-muted-foreground truncate">{slide.description || "No description"}</p>
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0">
                                                <button
                                                    onClick={() => openEditModal(slide)}
                                                    className="p-1.5 hover:bg-accent text-foreground hover:text-blue-500 rounded transition-colors"
                                                    title="Edit Slide"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteSlide(slide.id)}
                                                    className="p-1.5 hover:bg-accent text-destructive hover:text-destructive rounded transition-colors"
                                                    title="Delete Slide"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            // ADD / EDIT FORM VIEW
                            <form onSubmit={handleSaveSlide} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Left: Fields */}
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                                                Badge Text
                                            </label>
                                            <input
                                                type="text"
                                                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                                                placeholder="e.g. New Course Available"
                                                value={formData.badge}
                                                onChange={(e) => setFormData((prev) => ({ ...prev, badge: e.target.value }))}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                                                Slide Title
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                                                placeholder="e.g. Advancing Through Neural Networks"
                                                value={formData.title}
                                                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                                                Description
                                            </label>
                                            <textarea
                                                className="w-full p-3 rounded-md border border-input bg-background text-sm h-24 resize-none"
                                                placeholder="Describe the announcement or course details..."
                                                value={formData.description}
                                                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                                            />
                                        </div>
                                    </div>

                                    {/* Right: Media & Details */}
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                                                Banner Image URL / Upload
                                            </label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    required
                                                    className="flex-1 h-10 px-3 rounded-md border border-input bg-background text-sm"
                                                    placeholder="Image path or external URL"
                                                    value={formData.src}
                                                    onChange={(e) => setFormData((prev) => ({ ...prev, src: e.target.value }))}
                                                />
                                                <label className="flex items-center justify-center size-10 rounded-md border border-input bg-muted hover:bg-accent transition-colors cursor-pointer shrink-0">
                                                    {uploading ? (
                                                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                                    ) : (
                                                        <Upload className="h-4 w-4 text-muted-foreground" />
                                                    )}
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        disabled={uploading}
                                                        onChange={handleImageUpload}
                                                    />
                                                </label>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                                                    Order
                                                </label>
                                                <input
                                                    type="number"
                                                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                                                    value={formData.slide_order}
                                                    onChange={(e) => setFormData((prev) => ({ ...prev, slide_order: parseInt(e.target.value, 10) || 0 }))}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                                                    Alt Text
                                                </label>
                                                <input
                                                    type="text"
                                                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                                                    placeholder="e.g. Banner promo image"
                                                    value={formData.alt}
                                                    onChange={(e) => setFormData((prev) => ({ ...prev, alt: e.target.value }))}
                                                />
                                            </div>
                                        </div>

                                        {formData.src && (
                                            <div className="relative aspect-[21/7] rounded border border-border overflow-hidden bg-muted">
                                                <img src={formData.src} alt="Preview" className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex justify-between border-t border-border pt-4 mt-6">
                                    {selectedSlide ? (
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteSlide(selectedSlide.id)}
                                            className="inline-flex items-center gap-1 rounded-md border border-destructive bg-destructive/10 px-4 h-9 text-xs font-semibold text-destructive hover:bg-destructive hover:text-white transition-colors"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" /> Delete
                                        </button>
                                    ) : (
                                        <div />
                                    )}

                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                // Reset state back to Slide List
                                                setFormData({ id: "", src: "", alt: "", badge: "New Course Available", title: "", description: "", slide_order: 0 })
                                                setSelectedSlide(null)
                                                setModalView("list")
                                            }}
                                            className="px-4 h-9 rounded-md border border-input text-xs font-medium text-foreground hover:bg-accent transition-colors"
                                        >
                                            Back to List
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={saving}
                                            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 h-9 text-xs font-semibold text-primary-foreground hover:bg-primary/95 transition-colors"
                                        >
                                            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                            Save Slide
                                        </button>
                                    </div>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
