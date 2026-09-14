"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Search, X, Loader2 } from "lucide-react"

export function AdminHeaderSearch() {
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)
  const inputRef = useRef(null)
  const router = useRouter()

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Keyboard shortcut (Cmd+K / Ctrl+K) to focus search bar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        inputRef.current?.focus()
        if (query.trim() && results !== null) setIsOpen(true)
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false)
        inputRef.current?.blur()
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, query, results])

  // Debounced search query
  useEffect(() => {
    if (!query.trim()) {
      setResults(null)
      setLoading(false)
      setIsOpen(false)
      return
    }

    setLoading(true)
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`)
        if (res.ok) {
          const data = await res.json()
          setResults(data)
          setIsOpen(true)
        } else {
          setResults(null)
        }
      } catch (err) {
        console.error("Search fetch error:", err)
        setResults(null)
      } finally {
        setLoading(false)
      }
    }, 180)

    return () => clearTimeout(timer)
  }, [query])

  const users = results?.users || []
  const categories = results?.categories || []
  const subcategories = results?.subcategories || []
  const subjects = results?.subjects || []
  const modules = results?.modules || []
  const mockExams = results?.mock_exams || []
  const masterData = results?.master_data || []

  const totalCount =
    users.length +
    categories.length +
    subcategories.length +
    subjects.length +
    modules.length +
    mockExams.length +
    masterData.length

  const handleSelect = (href) => {
    setIsOpen(false)
    setQuery("")
    router.push(href)
  }

  return (
    <div ref={containerRef} className="relative w-44 sm:w-56 md:w-64">
      {/* Search Input Bar */}
      <div className="relative flex items-center">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[#696969]/70 dark:text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onFocus={() => {
            if (query.trim() && results !== null) setIsOpen(true)
          }}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search.."
          className="w-full h-9 pl-8.5 pr-8 text-xs rounded-xl bg-[#F2F2F2] dark:bg-white/10 text-[#3B3B3B] dark:text-white placeholder:text-[#696969]/60 dark:placeholder:text-gray-400 border border-transparent focus:border-black/10 dark:focus:border-white/15 focus:bg-white dark:focus:bg-[#1a1b1e] focus:outline-none focus:ring-1.5 focus:ring-black/10 transition-all shadow-2xs"
        />

        {/* Right side indicator: Spinner or Clear */}
        {(loading || query) && (
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center">
            {loading ? (
              <Loader2 className="size-3.5 text-muted-foreground animate-spin" />
            ) : (
              <button
                onClick={() => {
                  setQuery("")
                  setResults(null)
                  setIsOpen(false)
                }}
                className="text-[#696969] hover:text-foreground p-0.5 rounded cursor-pointer"
              >
                <X className="size-3" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Minimal Suggestion Menu (Clean, matching width, neutral styling, no icons, no pill badges) */}
      {isOpen && query.trim().length > 0 && results !== null && (
        <div className="absolute left-0 right-0 top-full mt-1.5 w-full bg-white dark:bg-[#1c1c1e] rounded-xl border border-black/10 dark:border-white/10 shadow-sm overflow-hidden z-50 flex flex-col max-h-[65vh]">
          <div className="overflow-y-auto p-1.5 divide-y divide-black/5 dark:divide-white/5 text-xs">
            {totalCount === 0 && (
              <div className="py-4 text-center text-muted-foreground text-[11px]">
                No results found
              </div>
            )}

            {/* USERS */}
            {users.length > 0 && (
              <div className="py-1 first:pt-0.5 last:pb-0.5">
                <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Users
                </div>
                {users.map((u) => (
                  <div
                    key={`u-${u.id}`}
                    onClick={() => handleSelect(u.href)}
                    className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-medium text-foreground truncate">{u.name}</div>
                      <div className="text-[11px] text-muted-foreground truncate">{u.email}</div>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0 capitalize">
                      {u.role ? u.role.replace("_", " ") : "user"}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* SUBJECTS */}
            {subjects.length > 0 && (
              <div className="py-1 first:pt-0.5 last:pb-0.5">
                <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Subjects
                </div>
                {subjects.map((s) => (
                  <div
                    key={`s-${s.id}`}
                    onClick={() => handleSelect(s.href)}
                    className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-medium text-foreground truncate">{s.title}</div>
                      {s.code && <div className="text-[11px] text-muted-foreground truncate">{s.code}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* MODULES */}
            {modules.length > 0 && (
              <div className="py-1 first:pt-0.5 last:pb-0.5">
                <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Modules
                </div>
                {modules.map((m) => (
                  <div
                    key={`m-${m.id}`}
                    onClick={() => handleSelect(m.href)}
                    className="px-2 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <div className="font-medium text-foreground truncate">{m.title}</div>
                    {m.subject_title && (
                      <div className="text-[11px] text-muted-foreground truncate">{m.subject_title}</div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* MOCK EXAMS */}
            {mockExams.length > 0 && (
              <div className="py-1 first:pt-0.5 last:pb-0.5">
                <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Mock Exams
                </div>
                {mockExams.map((e) => (
                  <div
                    key={`e-${e.id}`}
                    onClick={() => handleSelect(e.href)}
                    className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-medium text-foreground truncate">{e.title}</div>
                      {e.exam_code && <div className="text-[11px] text-muted-foreground truncate">{e.exam_code}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* CATEGORIES & SUBCATEGORIES */}
            {(categories.length > 0 || subcategories.length > 0) && (
              <div className="py-1 first:pt-0.5 last:pb-0.5">
                <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Curriculum
                </div>
                {categories.map((c) => (
                  <div
                    key={`c-${c.id}`}
                    onClick={() => handleSelect(c.href)}
                    className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <span className="font-medium text-foreground truncate">{c.name}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0">Category</span>
                  </div>
                ))}
                {subcategories.map((sub) => (
                  <div
                    key={`sub-${sub.id}`}
                    onClick={() => handleSelect(sub.href)}
                    className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <span className="font-medium text-foreground truncate">{sub.name}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0">Subcategory</span>
                  </div>
                ))}
              </div>
            )}

            {/* MASTER DATA */}
            {masterData.length > 0 && (
              <div className="py-1 first:pt-0.5 last:pb-0.5">
                <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Master Data
                </div>
                {masterData.map((md, idx) => (
                  <div
                    key={`md-${md.type}-${md.id}-${idx}`}
                    onClick={() => handleSelect(md.href)}
                    className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <span className="font-medium text-foreground truncate">{md.title}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0">{md.type}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
