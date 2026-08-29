"use client"
import React from "react"
import { X, Trash2 } from "lucide-react"

export default function ConfirmDeleteModal({
  isOpen,
  title = "Confirm Deletion",
  description = "Are you sure you want to delete this item? This action cannot be undone.",
  confirmText = "Delete",
  cancelText = "Cancel",
  isDeleting = false,
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 gap-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[#4d4d4d] break-words flex-1">
            {title}
          </h3>
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-50 shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6">
          <p className="text-sm text-gray-600 leading-relaxed font-normal break-words whitespace-normal">
            {description}
          </p>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-[#ba5a62] hover:bg-[#a64850] text-white font-bold text-xs uppercase px-5 py-2 rounded-xl shadow-sm transition-all cursor-pointer active:scale-95 flex items-center gap-1.5 disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {isDeleting ? "Deleting..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
