"use client"

import { useState, useEffect, useMemo } from "react"
import { Search, RefreshCw, ArrowUpDown } from "lucide-react"

export default function AnalyticalOverviewPage() {
  const [activeTab, setActiveTab] = useState("students") // "students" | "schools"
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [sortField, setSortField] = useState("avgScore")
  const [sortDir, setSortDir] = useState("desc")

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/analytical-overview")
      const json = await res.json()
      if (res.ok) {
        setData(json)
      } else {
        setData(null)
      }
    } catch (err) {
      console.error("Failed to load analytical overview:", err)
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [])

  // Reset sorting when switching tabs
  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setSearch("")
    if (tab === "students") {
      setSortField("avgScore")
      setSortDir("desc")
    } else {
      setSortField("passedCount")
      setSortDir("desc")
    }
  }

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDir("desc")
    }
  }

  // Filter and sort students
  const filteredStudents = useMemo(() => {
    const list = data?.comparativeLeaderboards?.students || []
    let result = list

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter(
        (s) =>
          s.name?.toLowerCase().includes(q) ||
          s.email?.toLowerCase().includes(q) ||
          s.school?.toLowerCase().includes(q) ||
          s.major?.toLowerCase().includes(q)
      )
    }

    return [...result].sort((a, b) => {
      let aVal = a[sortField]
      let bVal = b[sortField]

      if (typeof aVal === "string") {
        return sortDir === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal)
      }
      aVal = aVal ?? 0
      bVal = bVal ?? 0
      return sortDir === "asc" ? aVal - bVal : bVal - aVal
    })
  }, [data, search, sortField, sortDir])

  // Filter and sort schools
  const filteredSchools = useMemo(() => {
    const list = data?.comparativeLeaderboards?.schools || []
    let result = list

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter((s) => s.schoolName?.toLowerCase().includes(q))
    }

    return [...result].sort((a, b) => {
      let aVal = a[sortField]
      let bVal = b[sortField]

      if (typeof aVal === "string") {
        return sortDir === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal)
      }
      aVal = aVal ?? 0
      bVal = bVal ?? 0
      return sortDir === "asc" ? aVal - bVal : bVal - aVal
    })
  }, [data, search, sortField, sortDir])

  return (
    <div className="w-full space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Minimal Tab Switcher */}
        <div className="inline-flex items-center gap-1.5 p-1 bg-[#F2F2F2]/80 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/10">
          <button
            type="button"
            onClick={() => handleTabChange("students")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide whitespace-nowrap transition-all cursor-pointer ${
              activeTab === "students"
                ? "bg-white dark:bg-white/15 text-[#3B3B3B] dark:text-white shadow-xs"
                : "text-[#696969] dark:text-gray-400 hover:text-[#3B3B3B] dark:hover:text-white"
            }`}
          >
            Top Students
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("schools")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide whitespace-nowrap transition-all cursor-pointer ${
              activeTab === "schools"
                ? "bg-white dark:bg-white/15 text-[#3B3B3B] dark:text-white shadow-xs"
                : "text-[#696969] dark:text-gray-400 hover:text-[#3B3B3B] dark:hover:text-white"
            }`}
          >
            Top Schools
          </button>
        </div>

        {/* Refresh button */}
        <button
          type="button"
          onClick={fetchAnalytics}
          disabled={loading}
          className="self-end sm:self-auto flex items-center gap-1.5 px-3 h-9 rounded-xl text-xs font-medium text-[#696969] dark:text-gray-400 bg-white dark:bg-white/10 hover:text-[#3B3B3B] dark:hover:text-white border border-black/5 dark:border-white/10 transition-all shadow-2xs cursor-pointer disabled:opacity-50"
          title="Refresh analytics data"
        >
          <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#696969]/70" />
        <input
          type="search"
          placeholder={
            activeTab === "students"
              ? "Search student by name, email, school, or major…"
              : "Search school by name…"
          }
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-10 pl-10 pr-4 text-sm rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/10 text-[#3B3B3B] dark:text-white placeholder:text-[#696969]/60 focus:outline-none focus:ring-1.5 focus:ring-black/15 dark:focus:ring-white/20 transition-all shadow-2xs"
        />
      </div>

      {/* Table Container */}
      <div className="w-full overflow-hidden rounded-2xl border border-black/5 dark:border-white/10 bg-card shadow-2xs">
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center space-y-2">
            <div className="size-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-medium text-[#696969] dark:text-gray-400">Loading ranking data…</p>
          </div>
        ) : activeTab === "students" ? (
          /* ── Top Students Table ── */
          filteredStudents.length === 0 ? (
            <div className="py-16 text-center text-xs font-medium text-[#696969] dark:text-gray-400">
              {search ? `No students found matching "${search}"` : "No student performance records available."}
            </div>
          ) : (
            <div className="max-h-[720px] overflow-y-auto">
              <table className="w-full text-left border-collapse" aria-label="Top Students Table">
                <thead className="sticky top-0 z-10 bg-[#F2F2F2]/80 dark:bg-[#14161b]/90 backdrop-blur-xs border-b border-black/5 dark:border-white/10">
                  <tr className="h-11 text-xs font-semibold uppercase tracking-wider text-[#696969]/80 dark:text-gray-400">
                    <th className="w-16 px-4 py-2.5 text-center" scope="col">Rank</th>
                    <th className="px-4 py-2.5" scope="col">
                      <button
                        type="button"
                        onClick={() => handleSort("name")}
                        className="inline-flex items-center gap-1.5 hover:text-[#3B3B3B] dark:hover:text-white cursor-pointer"
                      >
                        <span>Student</span>
                        <ArrowUpDown className="size-3 opacity-60" />
                      </button>
                    </th>
                    <th className="px-4 py-2.5" scope="col">
                      <button
                        type="button"
                        onClick={() => handleSort("school")}
                        className="inline-flex items-center gap-1.5 hover:text-[#3B3B3B] dark:hover:text-white cursor-pointer"
                      >
                        <span>Institution</span>
                        <ArrowUpDown className="size-3 opacity-60" />
                      </button>
                    </th>
                    <th className="px-4 py-2.5" scope="col">Major / Specialization</th>
                    <th className="px-4 py-2.5 text-center" scope="col">Exams Completed</th>
                    <th className="px-4 py-2.5 text-right pr-6" scope="col">
                      <button
                        type="button"
                        onClick={() => handleSort("avgScore")}
                        className="inline-flex items-center gap-1.5 hover:text-[#3B3B3B] dark:hover:text-white cursor-pointer ml-auto"
                      >
                        <span>Average Progress</span>
                        <ArrowUpDown className="size-3 opacity-60" />
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 dark:divide-white/5 text-sm">
                  {filteredStudents.map((st, idx) => {
                    const displayRank = idx + 1
                    return (
                      <tr
                        key={st.id}
                        className="h-13 transition-colors hover:bg-black/[0.015] dark:hover:bg-white/[0.02]"
                      >
                        {/* Rank */}
                        <td className="px-4 text-center font-medium text-xs text-[#696969] dark:text-gray-400">
                          #{displayRank}
                        </td>

                        {/* Student Name & Email */}
                        <td className="px-4 py-3">
                          <div className="font-semibold text-xs text-[#3B3B3B] dark:text-gray-100">
                            {st.name || "—"}
                          </div>
                          {st.email && (
                            <div className="text-[11px] text-[#696969] dark:text-gray-400 mt-0.5">
                              {st.email}
                            </div>
                          )}
                        </td>

                        {/* Institution */}
                        <td className="px-4 py-3 text-xs text-[#696969] dark:text-gray-300">
                          {st.school || "—"}
                        </td>

                        {/* Major */}
                        <td className="px-4 py-3 text-xs text-[#696969] dark:text-gray-400">
                          {st.major || "—"}
                        </td>

                        {/* Completed Count */}
                        <td className="px-4 py-3 text-xs text-center text-[#696969] dark:text-gray-300">
                          {st.attemptCount || 0}
                        </td>

                        {/* Average Progress */}
                        <td className="px-4 py-3 text-right pr-6 text-xs whitespace-nowrap">
                          <span className="font-semibold text-[#3B3B3B] dark:text-gray-100">
                            {st.avgScore ? `${st.avgScore}%` : "0%"}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : (
          /* ── Top Schools Table ── */
          filteredSchools.length === 0 ? (
            <div className="py-16 text-center text-xs font-medium text-[#696969] dark:text-gray-400">
              {search ? `No schools found matching "${search}"` : "No institutional performance records available."}
            </div>
          ) : (
            <div className="max-h-[720px] overflow-y-auto">
              <table className="w-full text-left border-collapse" aria-label="Top Schools Table">
                <thead className="sticky top-0 z-10 bg-[#F2F2F2]/80 dark:bg-[#14161b]/90 backdrop-blur-xs border-b border-black/5 dark:border-white/10">
                  <tr className="h-11 text-xs font-semibold uppercase tracking-wider text-[#696969]/80 dark:text-gray-400">
                    <th className="w-16 px-4 py-2.5 text-center" scope="col">Rank</th>
                    <th className="px-4 py-2.5" scope="col">
                      <button
                        type="button"
                        onClick={() => handleSort("schoolName")}
                        className="inline-flex items-center gap-1.5 hover:text-[#3B3B3B] dark:hover:text-white cursor-pointer"
                      >
                        <span>Institution</span>
                        <ArrowUpDown className="size-3 opacity-60" />
                      </button>
                    </th>
                    <th className="px-4 py-2.5 text-center" scope="col">
                      <button
                        type="button"
                        onClick={() => handleSort("studentCount")}
                        className="inline-flex items-center gap-1.5 hover:text-[#3B3B3B] dark:hover:text-white cursor-pointer mx-auto"
                      >
                        <span>Total Students</span>
                        <ArrowUpDown className="size-3 opacity-60" />
                      </button>
                    </th>
                    <th className="px-4 py-2.5 text-center" scope="col">
                      <button
                        type="button"
                        onClick={() => handleSort("passedCount")}
                        className="inline-flex items-center gap-1.5 hover:text-[#3B3B3B] dark:hover:text-white cursor-pointer mx-auto"
                      >
                        <span>Proficient Students</span>
                        <ArrowUpDown className="size-3 opacity-60" />
                      </button>
                    </th>
                    <th className="px-4 py-2.5 text-center" scope="col">
                      <button
                        type="button"
                        onClick={() => handleSort("passRate")}
                        className="inline-flex items-center gap-1.5 hover:text-[#3B3B3B] dark:hover:text-white cursor-pointer mx-auto"
                      >
                        <span>Passing Rate</span>
                        <ArrowUpDown className="size-3 opacity-60" />
                      </button>
                    </th>
                    <th className="px-4 py-2.5 text-right pr-6" scope="col">
                      <button
                        type="button"
                        onClick={() => handleSort("avgScore")}
                        className="inline-flex items-center gap-1.5 hover:text-[#3B3B3B] dark:hover:text-white cursor-pointer ml-auto"
                      >
                        <span>Average Progress</span>
                        <ArrowUpDown className="size-3 opacity-60" />
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 dark:divide-white/5 text-sm">
                  {filteredSchools.map((sch, idx) => {
                    const displayRank = idx + 1
                    return (
                      <tr
                        key={sch.schoolName}
                        className="h-13 transition-colors hover:bg-black/[0.015] dark:hover:bg-white/[0.02]"
                      >
                        {/* Rank */}
                        <td className="px-4 text-center font-medium text-xs text-[#696969] dark:text-gray-400">
                          #{displayRank}
                        </td>

                        {/* School Name */}
                        <td className="px-4 py-3">
                          <div className="font-semibold text-xs text-[#3B3B3B] dark:text-gray-100">
                            {sch.schoolName || "—"}
                          </div>
                        </td>

                        {/* Total Students */}
                        <td className="px-4 py-3 text-xs text-center text-[#696969] dark:text-gray-300">
                          {sch.studentCount || 0}
                        </td>

                        {/* Proficient Students (with good progress) */}
                        <td className="px-4 py-3 text-xs text-center text-[#696969] dark:text-gray-300">
                          <span className="font-medium text-[#3B3B3B] dark:text-gray-200">
                            {sch.passedCount || 0}
                          </span>
                          <span className="text-[11px] text-[#696969] dark:text-gray-400 ml-1">
                            / {sch.studentCount || 0}
                          </span>
                        </td>

                        {/* Passing Rate */}
                        <td className="px-4 py-3 text-xs text-center text-[#696969] dark:text-gray-300">
                          {sch.passRate ?? 0}%
                        </td>

                        {/* Average Progress */}
                        <td className="px-4 py-3 text-right pr-6 text-xs whitespace-nowrap">
                          <span className="font-semibold text-[#3B3B3B] dark:text-gray-100">
                            {sch.avgScore ? `${sch.avgScore}%` : "0%"}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </div>
  )
}
