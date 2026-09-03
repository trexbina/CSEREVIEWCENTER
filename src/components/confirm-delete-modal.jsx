"use client"
import React from "react"
import { X, Trash2 } from "lucide-react"

export default function ConfirmDeleteModal({
  isOpen,
  title = "Confirm Deletion",
  description,
  message,
  itemName,
  confirmText = "Delete",
  cancelText = "Cancel",
  isDeleting,
  loading,
  onConfirm,
  onCancel,
  onClose,
}) {
  if (!isOpen) return null

  const handleCancel = onCancel || onClose
  const deleting = Boolean(isDeleting || loading)
  const descText =
    description ||
    message ||
    (itemName
      ? `Are you sure you want to delete "${itemName}"? This action cannot be undone.`
      : "Are you sure you want to delete this item? This action cannot be undone.")

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200 text-left">
      <div className="bg-white dark:bg-[#1E1E1E] w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden text-left animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-white/10 gap-3 text-left">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[#4d4d4d] dark:text-gray-200 break-words flex-1 text-left">
            {title}
          </h3>
          <button
            type="button"
            onClick={handleCancel}
            disabled={deleting}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50 shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 text-left">
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed font-normal break-words whitespace-normal text-left">
            {descText}
          </p>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={handleCancel}
            disabled={deleting}
            className="px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="bg-[#ba5a62] hover:bg-[#a64850] text-white font-bold text-xs uppercase px-5 py-2 rounded-xl shadow-sm transition-all cursor-pointer active:scale-95 flex items-center gap-1.5 disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {deleting ? "Deleting..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

