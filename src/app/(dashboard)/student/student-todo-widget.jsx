"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2 } from "lucide-react"

const DEFAULT_STUDENT_TODOS = [
  { id: "1", text: "Review General Education notes", completed: false },
  { id: "2", text: "Take practice mock exam check", completed: false },
]

export function StudentTodoWidget() {
  const [items, setItems] = useState([])
  const [isAdding, setIsAdding] = useState(false)
  const [newText, setNewText] = useState("")

  // Load from localStorage if available
  useEffect(() => {
    try {
      const saved = localStorage.getItem("peak_student_todos")
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setItems(parsed)
          return
        }
      }
      setItems(DEFAULT_STUDENT_TODOS)
    } catch (e) {
      console.error("Failed to load student todos from localStorage", e)
      setItems(DEFAULT_STUDENT_TODOS)
    }
  }, [])

  const saveTodos = (updated) => {
    setItems(updated)
    try {
      localStorage.setItem("peak_student_todos", JSON.stringify(updated))
    } catch (e) {
      console.error("Failed to save student todos to localStorage", e)
    }
  }

  const handleAdd = (e) => {
    e.preventDefault()
    if (!newText.trim()) {
      setIsAdding(false)
      return
    }

    const newItem = {
      id: Date.now().toString(),
      text: newText.trim(),
      completed: false,
    }

    saveTodos([...items, newItem])
    setNewText("")
    setIsAdding(false)
  }

  const toggleComplete = (id) => {
    const updated = items.map((item) =>
      item.id === id ? { ...item, completed: !item.completed } : item
    )
    saveTodos(updated)
  }

  const handleDelete = (id) => {
    const updated = items.filter((item) => item.id !== id)
    saveTodos(updated)
  }

  return (
    <div className="w-full flex-1 rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-md shadow-2xs overflow-hidden flex flex-col transition-all">
      {/* ── Top Bar / Header: Very light gray (#f5f5f5) with soft shadow ── */}
      <div>
        <div className="relative z-10 px-4 py-3 sm:px-4.5 sm:py-3.5 flex items-center justify-between border-b border-black/5 dark:border-white/5 bg-neutral-100 dark:bg-white/[0.05] shadow-[0_2px_4px_-1px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_4px_-1px_rgba(0,0,0,0.3)]">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-medium text-neutral-600 dark:text-neutral-300 select-none">
              To-do List
            </span>
            <span className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400 bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded-full">
              {items.filter((t) => !t.completed).length}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsAdding((prev) => !prev)}
            aria-label="Add to-do item"
            className="size-6 rounded-lg flex items-center justify-center text-[#696969] hover:text-[#3B3B3B] dark:text-gray-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer active:scale-95"
          >
            <Plus className="size-3.5" />
          </button>
        </div>

        {/* ── Content Body Container ── */}
        <div className="p-3.5 sm:p-4 pt-2.5 sm:pt-3 flex-1 flex flex-col">
          {/* ── Add Input Row ── */}
          {isAdding && (
            <form onSubmit={handleAdd} className="mb-2.5 flex items-center gap-2 animate-in fade-in duration-150">
              <input
                type="text"
                autoFocus
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                placeholder="Add a task..."
                className="flex-1 h-8 rounded-lg border border-black/10 dark:border-white/15 bg-white dark:bg-white/5 px-2.5 text-xs text-[#3B3B3B] dark:text-white placeholder:text-[#696969]/60 focus:outline-none focus:ring-1 focus:ring-black/20 dark:focus:ring-white/20 transition-all shadow-2xs"
              />
              <button
                type="submit"
                className="h-8 px-2.5 rounded-lg bg-[#3B3B3B] hover:bg-[#2B2B2B] dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer"
              >
                Add
              </button>
            </form>
          )}

          {/* ── Items List ── */}
          <div className="space-y-1 overflow-y-auto max-h-[175px] pr-0.5 flex-1">
            {items.length === 0 ? (
              <div className="py-4 text-center text-xs text-[#696969] dark:text-gray-500 italic">
                No tasks yet. Press + to add one.
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="group flex items-center justify-between gap-2 px-1.5 py-1.5 rounded-lg hover:bg-black/[0.03] dark:hover:bg-white/[0.04] transition-colors"
                >
                  <div
                    onClick={() => toggleComplete(item.id)}
                    className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer select-none"
                  >
                    {/* Neutral Dot */}
                    <span
                      className={`size-2 rounded-full shrink-0 transition-transform group-hover:scale-125 ${
                        item.completed
                          ? "bg-neutral-300 dark:bg-neutral-600"
                          : "bg-neutral-400 dark:bg-neutral-500"
                      }`}
                    />

                    {/* Task Text */}
                    <span
                      className={`text-xs truncate transition-colors ${
                        item.completed
                          ? "line-through text-[#696969]/50 dark:text-gray-500"
                          : "text-[#3B3B3B] dark:text-gray-200"
                      }`}
                    >
                      {item.text}
                    </span>
                  </div>

                  {/* Delete button (reveals on hover) */}
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    aria-label="Delete task"
                    className="opacity-0 group-hover:opacity-100 size-5 rounded flex items-center justify-center text-[#696969] hover:text-rose-500 dark:text-gray-400 dark:hover:text-rose-400 hover:bg-black/5 dark:hover:bg-white/10 transition-all cursor-pointer"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
