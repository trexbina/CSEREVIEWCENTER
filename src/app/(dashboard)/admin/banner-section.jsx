"use client"

import { useState, useEffect, useCallback } from "react"
import { Settings, X, Pencil, Trash, Loader2, ImageIcon, ChevronLeft, ChevronRight } from "lucide-react"
import ConfirmDeleteModal from "@/components/confirm-delete-modal"
import { Playfair_Display } from "next/font/google"
import { motion } from "motion/react"

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
})

export function BannerSection() {
  const [slides, setSlides] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  // Modal Control State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalView, setModalView] = useState("list") // "list" or "form"
  const [selectedSlide, setSelectedSlide] = useState(null)
  const [formData, setFormData] = useState({
    id: "",
    src: "",
    alt: "",
    badge: "",
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
      } else {
        setSlides([])
      }
    } catch (err) {
      console.error("Failed to load carousel slides:", err)
      setSlides([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSlides()
  }, [fetchSlides])

  // Auto-advance slide to the next with delay (8 seconds), pausing when user is hovering
  useEffect(() => {
    if (slides.length <= 1 || isHovered || isModalOpen) return
    const timer = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1))
    }, 8000)
    return () => clearInterval(timer)
  }, [slides.length, isHovered, isModalOpen])

  const safeIndex = slides.length > 0 ? currentSlideIndex % slides.length : 0
  const currentSlide = slides[safeIndex] || null
  const nextSlideIndex = slides.length > 0 ? (safeIndex + 1) % slides.length : 0
  const nextSlide = slides[nextSlideIndex] || null

  // Open Modal to Add
  const openAddModal = () => {
    setSelectedSlide(null)
    setFormData({
      src: "",
      alt: "",
      badge: "",
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
        setModalView("list")
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
    isDeleting: false,
  })

  // Delete Slide
  const handleDeleteSlide = (id, slideTitle = "this slide") => {
    setDeleteModal({
      isOpen: true,
      title: "Delete Carousel Slide",
      description: `Are you sure you want to delete "${slideTitle}"? This action cannot be undone.`,
      onConfirm: async () => {
        setDeleteModal((prev) => ({ ...prev, isDeleting: true }))
        try {
          const res = await fetch(`/api/admin/carousel?id=${id}`, {
            method: "DELETE",
          })
          if (res.ok) {
            await fetchSlides()
            setModalView("list")
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
      isDeleting: false,
    })
  }

  const handlePrevSlide = () => {
    if (slides.length <= 1) return
    setCurrentSlideIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1))
  }

  const handleNextSlide = () => {
    if (slides.length <= 1) return
    setCurrentSlideIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1))
  }

  return (
    <div className="relative w-full h-full">
      {/* ── Carousel Banner Container (border removed, slight shadow-md, no hover enlargement) ── */}
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative w-full h-full aspect-[16/8] sm:aspect-[16/7] rounded-2xl bg-neutral-900 shadow-md overflow-hidden select-none flex items-center justify-center"
      >
        {/* Floating Action Controls Inside the Banner Container (Pure fade-in on hover) */}
        <div
          style={{
            opacity: isHovered ? 1 : 0,
            pointerEvents: isHovered ? "auto" : "none",
            transition: "opacity 300ms ease",
          }}
          className="absolute top-3.5 left-3.5 sm:top-4 sm:left-4 z-30 flex items-center gap-1.5"
        >
          {/* Edit Banner Button (More translucent) */}
          <button
            type="button"
            onClick={() => {
              setModalView("list")
              setSelectedSlide(null)
              setIsModalOpen(true)
            }}
            className="inline-flex items-center px-3 h-7.5 text-xs font-medium text-white/90 hover:text-white bg-black/35 hover:bg-black/55 backdrop-blur-md rounded-xl border border-white/10 hover:border-white/20 shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <span>Edit banner</span>
          </button>

          {/* Slide Navigation Buttons (More translucent) */}
          <div className="flex items-center gap-1 bg-black/35 backdrop-blur-md rounded-xl border border-white/10 p-0.5 shadow-xs">
            <button
              type="button"
              onClick={handlePrevSlide}
              disabled={slides.length <= 1}
              aria-label="Previous slide"
              className="size-6.5 rounded-lg flex items-center justify-center text-white/80 hover:text-white hover:bg-white/15 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer active:scale-95"
            >
              <ChevronLeft className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={handleNextSlide}
              disabled={slides.length <= 1}
              aria-label="Next slide"
              className="size-6.5 rounded-lg flex items-center justify-center text-white/80 hover:text-white hover:bg-white/15 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer active:scale-95"
            >
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        </div>
        {slides.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-6 text-center text-neutral-400 select-none">
            <p className="text-xs font-medium">No banner slides added yet.</p>
            <button
              type="button"
              onClick={openAddModal}
              className="mt-2.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-xs border border-white/15 transition-all cursor-pointer shadow-2xs"
            >
              + Add First Slide
            </button>
          </div>
        ) : (
          <>
            {/* Slides Track - Sliding horizontally to the left */}
            <div
              className="absolute inset-0 flex h-full"
              style={{
                width: `${slides.length * 100}%`,
                transform: `translateX(-${(safeIndex * 100) / slides.length}%)`,
                transition: "transform 700ms cubic-bezier(0.4, 0, 0.2, 1)",
                willChange: "transform",
              }}
            >
              {slides.map((slide) => {
                const hasTextContent = Boolean(
                  (slide.title && slide.title.trim()) ||
                  (slide.description && slide.description.trim())
                )

                return (
                  <div
                    key={slide.id || slide.src}
                    style={{ width: `${100 / slides.length}%` }}
                    className="relative h-full shrink-0 select-none overflow-hidden"
                  >
                    {/* Background Image */}
                    <img
                      src={slide.src}
                      alt={slide.alt || slide.title || "Banner slide"}
                      className="w-full h-full object-cover select-none"
                    />

                    {/* Gradient Overlay: Deep readability gradient for slides with text, subtle soft shadow for clean image-only slides */}
                    {hasTextContent ? (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20" />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent" />
                      </>
                    ) : (
                      /* Subtle shadow overlay for banners with no labels (not too dark) */
                      <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/10 to-black/10" />
                    )}

                    {/* Slide Text Content - Slightly decreased font size, refined spacing */}
                    {hasTextContent && (
                      <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8 md:p-10 pb-16 sm:pb-18 max-w-xl z-20 space-y-2">
                        {slide.title && slide.title.trim() && (
                          <h2
                            className={`${playfair.className} text-2xl sm:text-3xl md:text-4xl font-semibold text-white tracking-tight leading-[1.15] drop-shadow-sm`}
                          >
                            {slide.title}
                          </h2>
                        )}
                        {slide.description && slide.description.trim() && (
                          <p className="text-xs sm:text-[13px] text-neutral-200/85 line-clamp-3 max-w-md font-normal leading-relaxed tracking-normal drop-shadow-xs">
                            {slide.description}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Slide indicators (dots) - True sliding pill with motion layoutId */}
            {slides.length > 1 && (
              <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 sm:bottom-3.5 z-30 flex items-center px-2 py-1 rounded-full bg-black/25 backdrop-blur-xs border border-white/10 shadow-xs">
                <div className="flex items-center gap-2">
                  {slides.map((_, i) => {
                    const isActive = i === safeIndex
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setCurrentSlideIndex(i)}
                        aria-label={`Go to slide ${i + 1}`}
                        className="relative flex items-center justify-center p-0.5 cursor-pointer"
                      >
                        {/* Inactive circle dot */}
                        <span className="block size-1.5 rounded-full bg-white/30 hover:bg-white/60 transition-colors" />

                        {/* Active sliding pill that physically slides across between buttons */}
                        {isActive && (
                          <motion.div
                            layoutId="activeSlidePillAdmin"
                            className="absolute inset-y-0.5 -inset-x-0.5 rounded-full bg-white/85 shadow-xs pointer-events-none"
                            transition={{
                              type: "spring",
                              stiffness: 380,
                              damping: 30,
                            }}
                          />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Edit Banner Content Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-xl bg-white dark:bg-[#14161b] rounded-2xl border border-black/10 dark:border-white/10 shadow-xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-black/5 dark:border-white/10">
              <div>
                <h3 className="text-base font-bold text-[#3B3B3B] dark:text-white tracking-tight">
                  Banner Content Manager
                </h3>
                <p className="text-xs text-[#696969] dark:text-gray-400 mt-0.5">
                  Manage announcement slides, badges, images and content
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="size-8 rounded-xl flex items-center justify-center text-[#696969] hover:text-[#3B3B3B] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1">
              {modalView === "list" ? (
                // LIST VIEW
                <div className="space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-black/5 dark:border-white/10">
                    <h4 className="text-xs font-bold text-[#696969] dark:text-gray-400 uppercase tracking-wider">
                      Active Slides ({slides.length})
                    </h4>
                    <button
                      type="button"
                      onClick={openAddModal}
                      className="px-3 h-8 text-xs font-semibold text-white bg-[#3B3B3B] hover:bg-[#2B2B2B] dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 rounded-xl transition-all shadow-2xs cursor-pointer"
                    >
                      Add New Slide
                    </button>
                  </div>

                  {loading ? (
                    <div className="py-8 text-center text-xs text-[#696969]">Loading slides...</div>
                  ) : slides.length === 0 ? (
                    <div className="py-8 text-center text-xs text-[#696969]">
                      No slides created yet. Click "Add New Slide" to create one.
                    </div>
                  ) : (
                    <div className="divide-y divide-black/5 dark:divide-white/5">
                      {slides.map((slide) => (
                        <div
                          key={slide.id}
                          className="flex items-center gap-3.5 py-3 first:pt-1 last:pb-1 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] px-2 rounded-xl transition-colors"
                        >
                          {/* Slide Image Preview */}
                          <div className="w-16 h-10 rounded-lg overflow-hidden border border-black/10 dark:border-white/10 bg-black/5 shrink-0">
                            <img
                              src={slide.src}
                              alt={slide.title || "Slide"}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          {/* Slide Details */}
                          <div className="flex-1 min-w-0">
                            <h5 className="text-xs font-bold text-[#3B3B3B] dark:text-white truncate mb-0.5">
                              {slide.title || "Untitled Slide"}
                            </h5>
                            <p className="text-[11px] text-[#696969] dark:text-gray-400 truncate font-normal">
                              {slide.description || "No description provided."}
                            </p>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => openEditModal(slide)}
                              className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 text-[#696969] hover:text-[#3B3B3B] dark:hover:text-white rounded-lg transition-colors cursor-pointer"
                              title="Edit Slide"
                            >
                              <Pencil className="size-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSlide(slide.id, slide.title || "Slide")}
                              className="p-1.5 text-[#696969] hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                              title="Delete Slide"
                            >
                              <Trash className="size-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                // ADD / EDIT FORM VIEW
                <form id="carousel-slide-form" onSubmit={handleSaveSlide} className="space-y-4">
                  <div className="flex items-start gap-4">
                    {/* Image Picker */}
                    <div className="space-y-1 shrink-0">
                      <label className="block text-xs font-semibold text-[#696969] dark:text-gray-400 uppercase mb-1">
                        Image:
                      </label>
                      <div className="relative h-24 w-32 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/5 flex flex-col items-center justify-center overflow-hidden hover:border-black/30 dark:hover:border-white/30 transition-all cursor-pointer group shadow-2xs">
                        {uploading ? (
                          <Loader2 className="h-5 w-5 animate-spin text-[#696969]" />
                        ) : formData.src ? (
                          <img
                            src={formData.src}
                            alt="Banner Preview"
                            className="absolute inset-0 h-full w-full object-cover z-10"
                          />
                        ) : (
                          <div className="text-center flex flex-col items-center gap-1">
                            <ImageIcon className="h-5 w-5 text-[#696969] group-hover:text-[#3B3B3B] dark:group-hover:text-white transition-colors" />
                            <span className="text-[10px] font-medium text-[#696969] group-hover:text-[#3B3B3B] dark:group-hover:text-white transition-colors">
                              Upload
                            </span>
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
                        <label className="block text-xs font-semibold text-[#696969] dark:text-gray-400 uppercase mb-1">
                          Badge Text <span className="text-[10px] font-normal lowercase opacity-70">(optional)</span>:
                        </label>
                        <input
                          type="text"
                          className="w-full h-10 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/5 px-3 text-sm focus:outline-none focus:ring-1.5 focus:ring-black/15 text-[#3B3B3B] dark:text-white transition-all shadow-2xs"
                          placeholder="Leave empty if no badge"
                          value={formData.badge}
                          onChange={(e) => setFormData((prev) => ({ ...prev, badge: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#696969] dark:text-gray-400 uppercase mb-1">
                          Slide Title <span className="text-[10px] font-normal lowercase opacity-70">(optional)</span>:
                        </label>
                        <input
                          type="text"
                          className="w-full h-10 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/5 px-3 text-sm focus:outline-none focus:ring-1.5 focus:ring-black/15 text-[#3B3B3B] dark:text-white transition-all shadow-2xs"
                          placeholder="Leave empty if no title"
                          value={formData.title}
                          onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-semibold text-[#696969] dark:text-gray-400 uppercase mb-1">
                      Description <span className="text-[10px] font-normal lowercase opacity-70">(optional)</span>:
                    </label>
                    <textarea
                      rows={3}
                      className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1.5 focus:ring-black/15 text-[#3B3B3B] dark:text-white transition-all shadow-2xs"
                      placeholder="Leave empty if no description..."
                      value={formData.description}
                      onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    />
                  </div>

                  {/* Order */}
                  <div className="w-32">
                    <label className="block text-xs font-semibold text-[#696969] dark:text-gray-400 uppercase mb-1">
                      Order:
                    </label>
                    <input
                      type="number"
                      className="w-full h-10 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/5 px-3 text-sm focus:outline-none focus:ring-1.5 focus:ring-black/15 text-[#3B3B3B] dark:text-white transition-all shadow-2xs"
                      value={formData.slide_order}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, slide_order: parseInt(e.target.value, 10) || 0 }))
                      }
                    />
                  </div>
                </form>
              )}
            </div>

            {/* Modal Footer (Form View) */}
            {modalView !== "list" && (
              <div className="flex justify-between items-center px-6 py-4 border-t border-black/5 dark:border-white/10 bg-black/[0.01] dark:bg-white/[0.01]">
                {selectedSlide ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteSlide(selectedSlide.id, selectedSlide.title || "Slide")}
                    className="inline-flex items-center gap-1.5 px-3 h-8.5 rounded-xl border border-rose-200 dark:border-rose-900/40 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer shadow-2xs"
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
                      setFormData({
                        id: "",
                        src: "",
                        alt: "",
                        badge: "",
                        title: "",
                        description: "",
                        slide_order: 0,
                      })
                      setSelectedSlide(null)
                      setModalView("list")
                    }}
                    className="px-4 h-8.5 rounded-xl text-xs font-semibold text-[#696969] hover:text-[#3B3B3B] dark:text-gray-400 dark:hover:text-white bg-white dark:bg-white/10 border border-black/5 dark:border-white/10 hover:bg-black/5 transition-colors cursor-pointer shadow-2xs"
                  >
                    Back to List
                  </button>
                  <button
                    type="submit"
                    form="carousel-slide-form"
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#3B3B3B] hover:bg-[#2B2B2B] dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 px-4 h-8.5 text-xs font-semibold text-white transition-all disabled:opacity-50 shadow-2xs cursor-pointer"
                  >
                    {saving && <Loader2 className="size-3.5 animate-spin" />}
                    Save Slide
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={deleteModal.isOpen}
        title={deleteModal.title}
        description={deleteModal.description}
        isDeleting={deleteModal.isDeleting}
        onConfirm={deleteModal.onConfirm}
        onCancel={() => setDeleteModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  )
}
