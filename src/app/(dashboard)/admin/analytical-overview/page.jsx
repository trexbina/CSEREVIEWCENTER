"use client"

import { useState, useEffect, useMemo } from "react"
import { Search, RefreshCw, ArrowUpDown } from "lucide-react"
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts"

export default function AnalyticalOverviewPage() {
  const [activeTab, setActiveTab] = useState("students") // "students" | "schools"
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [sortField, setSortField] = useState("avgScore")
  const [sortDir, setSortDir] = useState("desc")

  const mockExamOptions = data?.filters?.mockExams || []
  const [selectedExamId, setSelectedExamId] = useState("ALL")

  // Determine current active mock exam passer stats based on dropdown
  const passersData = useMemo(() => {
    const raw = data?.mockExamPassersData
    if (!raw) {
      return {
        title: "All Mock Exams (Combined)",
        totalTakers: 0,
        passedCount: 0,
        failedCount: 0,
        passRate: 0,
        failRate: 0,
        averageScore: 0,
      }
    }

    if (selectedExamId === "ALL") {
      return {
        title: "All Mock Exams (Combined)",
        totalTakers: raw.overall?.totalAttempts || 0,
        passedCount: raw.overall?.passedCount || 0,
        failedCount: raw.overall?.failedCount || 0,
        passRate: raw.overall?.passRate || 0,
        failRate: raw.overall?.failRate || 0,
        averageScore: raw.overall?.averageScore || 0,
      }
    }

    const found = raw.perExam?.find((e) => String(e.id) === String(selectedExamId))
    if (found) {
      return {
        title: found.title || `Mock Exam #${found.id}`,
        totalTakers: found.totalTakers || 0,
        passedCount: found.passedCount || 0,
        failedCount: found.failedCount || 0,
        passRate: found.passRate || 0,
        failRate: found.failRate || 0,
        averageScore: found.averageScore || 0,
      }
    }

    return {
      title: "Selected Mock Exam",
      totalTakers: 0,
      passedCount: 0,
      failedCount: 0,
      passRate: 0,
      failRate: 0,
      averageScore: 0,
    }
  }, [data, selectedExamId])

  // Overview comparison chart data (all mock exams side by side for context)
  const comparisonBarData = useMemo(() => {
    const list = data?.mockExamPassersData?.perExam || []
    return list.map((e) => ({
      name: e.exam_code || e.title?.slice(0, 15) || `Exam ${e.id}`,
      fullName: e.title,
      passRate: e.passRate || 0,
      failRate: e.failRate || 0,
      passedCount: e.passedCount || 0,
      totalTakers: e.totalTakers || 0,
      avgScore: e.averageScore || 0,
    }))
  }, [data])

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
    <div className="w-full space-y-8 pb-12">
      {/* ═══ SECTION 1: Top Students & Top Schools Table ═══ */}
      <div className="space-y-5">
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

      {/* ═══ SECTION 2: Mock Exam Passers Graphical Interface ═══ */}
      <div className="space-y-4 pt-4 border-t border-black/5 dark:border-white/10">
        {/* Section Header & Mock Exam Filter Dropdown */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold tracking-wide text-[#3B3B3B] dark:text-white">
              Mock Exam Passers Rate
            </h2>
            <p className="text-xs text-[#696969] dark:text-gray-400 mt-0.5">
              Percentage of students meeting the passing benchmark (75% and above) across mock examinations.
            </p>
          </div>

          {/* Exam Selector Dropdown */}
          <div className="flex items-center gap-2">
            <label htmlFor="mock-exam-select" className="text-xs text-[#696969] dark:text-gray-400 whitespace-nowrap">
              View:
            </label>
            <select
              id="mock-exam-select"
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="h-9 px-3 text-xs font-semibold rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-white/10 text-[#3B3B3B] dark:text-white focus:outline-none focus:ring-1.5 focus:ring-black/15 dark:focus:ring-white/20 transition-all shadow-2xs cursor-pointer"
            >
              <option value="ALL">All Mock Exams (Combined)</option>
              {mockExamOptions.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.exam_code ? `${exam.exam_code} — ` : ""}{exam.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Graphical Summary Cards & Visual Charts */}
        <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-card p-5 sm:p-6 shadow-2xs space-y-6">
          {/* Selected Exam Title & Stats Metrics */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-black/5 dark:border-white/5">
            <div>
              <div className="text-xs font-semibold text-[#3B3B3B] dark:text-white">
                {passersData.title}
              </div>
              <div className="text-[11px] text-[#696969] dark:text-gray-400 mt-0.5">
                {selectedExamId === "ALL"
                  ? "Aggregate performance across all active mock exams"
                  : "Individual mock examination performance metrics"}
              </div>
            </div>

            {/* Key Metrics */}
            <div className="flex items-center gap-6 sm:gap-8 flex-wrap text-xs">
              <div>
                <span className="text-[11px] text-[#696969] dark:text-gray-400 block">Total Attempts</span>
                <span className="font-semibold text-[#3B3B3B] dark:text-white text-sm">
                  {passersData.totalTakers}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-[#696969] dark:text-gray-400 block">Passing Rate</span>
                <span className="font-semibold text-[#3B3B3B] dark:text-white text-sm">
                  {passersData.passRate}%
                </span>
              </div>
              <div>
                <span className="text-[11px] text-[#696969] dark:text-gray-400 block">Passed / Below Passing</span>
                <span className="font-semibold text-[#3B3B3B] dark:text-white text-sm">
                  {passersData.passedCount} / {passersData.failedCount}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-[#696969] dark:text-gray-400 block">Average Score</span>
                <span className="font-semibold text-[#3B3B3B] dark:text-white text-sm">
                  {passersData.averageScore}%
                </span>
              </div>
            </div>
          </div>

          {/* Graphical Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Donut Chart: Pass vs Below Benchmark */}
            <div className={`flex flex-col items-center justify-center p-4 rounded-xl border border-black/5 dark:border-white/5 bg-black/[0.01] dark:bg-white/[0.01] ${comparisonBarData.length > 0 && selectedExamId === "ALL" ? "lg:col-span-5" : "lg:col-span-12"}`}>
              <div className="text-xs font-semibold text-[#3B3B3B] dark:text-white mb-2 text-center">
                Pass / Below 75% Ratio
              </div>

              {passersData.totalTakers === 0 ? (
                <div className="h-[200px] flex items-center justify-center text-xs text-[#696969] dark:text-gray-400">
                  No mock exam attempts recorded yet.
                </div>
              ) : (
                <div className="relative w-full max-w-[240px] h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Passed (>= 75%)", value: passersData.passedCount || 0 },
                          { name: "Below 75%", value: passersData.failedCount || 0 },
                        ]}
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                        stroke="transparent"
                      >
                        <Cell fill="#3B3B3B" className="dark:fill-white transition-all" />
                        <Cell fill="#D1D5DB" className="dark:fill-white/20 transition-all" />
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--card, #ffffff)",
                          border: "1px solid rgba(0,0,0,0.1)",
                          borderRadius: "10px",
                          fontSize: "12px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Center percentage label */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xl font-bold tracking-tight text-[#3B3B3B] dark:text-white">
                      {passersData.passRate}%
                    </span>
                    <span className="text-[10px] text-[#696969] dark:text-gray-400">
                      Pass Rate
                    </span>
                  </div>
                </div>
              )}

              {/* Legend */}
              <div className="flex items-center justify-center gap-6 mt-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-[#3B3B3B] dark:bg-white" />
                  <span className="text-[#696969] dark:text-gray-400">
                    Passed: <strong className="text-[#3B3B3B] dark:text-white font-semibold">{passersData.passedCount}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-gray-300 dark:bg-white/25" />
                  <span className="text-[#696969] dark:text-gray-400">
                    Below 75%: <strong className="text-[#3B3B3B] dark:text-white font-semibold">{passersData.failedCount}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Comparative Bar Chart across Mock Exams (shown when All is selected) */}
            {comparisonBarData.length > 0 && selectedExamId === "ALL" && (
              <div className="lg:col-span-7 flex flex-col p-4 rounded-xl border border-black/5 dark:border-white/5 bg-black/[0.01] dark:bg-white/[0.01]">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-semibold text-[#3B3B3B] dark:text-white">
                    Passing Rate by Mock Examination (%)
                  </div>
                  <span className="text-[11px] text-[#696969] dark:text-gray-400">
                    Benchmark: 75%
                  </span>
                </div>

                <div className="w-full h-[210px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={comparisonBarData}
                      margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(0,0,0,0.05)"
                        className="dark:stroke-white/10"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11, fill: "#696969" }}
                        axisLine={false}
                        tickLine={false}
                        interval={0}
                        angle={-15}
                        textAnchor="end"
                      />
                      <YAxis
                        domain={[0, 100]}
                        ticks={[0, 25, 50, 75, 100]}
                        tick={{ fontSize: 11, fill: "#696969" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        formatter={(value) => [`${value}%`, "Passing Rate"]}
                        labelFormatter={(name, items) => {
                          const item = items?.[0]?.payload
                          return item?.fullName || name
                        }}
                        contentStyle={{
                          backgroundColor: "var(--card, #ffffff)",
                          border: "1px solid rgba(0,0,0,0.1)",
                          borderRadius: "10px",
                          fontSize: "12px",
                        }}
                      />
                      <Bar
                        dataKey="passRate"
                        fill="#3B3B3B"
                        className="dark:fill-white cursor-pointer"
                        radius={[4, 4, 0, 0]}
                        onClick={(entry) => {
                          const examObj = mockExamOptions.find((m) => m.exam_code === entry.name || m.title === entry.fullName)
                          if (examObj) setSelectedExamId(String(examObj.id))
                        }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

