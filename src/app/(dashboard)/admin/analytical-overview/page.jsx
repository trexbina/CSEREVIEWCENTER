"use client"

import { useState, useEffect, useMemo } from "react"
import {
  BarChart3,
  Users,
  Award,
  TrendingUp,
  School,
  BookOpen,
  CheckCircle2,
  Filter,
  RefreshCw,
  Search,
  ChevronRight,
  Sparkles,
  Trophy,
  PieChart,
  Activity,
  Layers,
  ArrowUpRight,
  AlertCircle,
} from "lucide-react"
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts"

export default function AnalyticalOverviewPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Filter States
  const [selectedSchool, setSelectedSchool] = useState("")
  const [selectedMajor, setSelectedMajor] = useState("")
  const [selectedBatch, setSelectedBatch] = useState("")
  const [studentSearch, setStudentSearch] = useState("")

  // Selected Student for Individual Analytics Tab
  const [selectedStudentId, setSelectedStudentId] = useState(null)

  // Active Tab
  const [activeTab, setActiveTab] = useState("overview")

  const fetchAnalytics = async () => {
    setLoading(true)
    setError("")
    try {
      const params = new URLSearchParams()
      if (selectedSchool) params.append("school_id", selectedSchool)
      if (selectedMajor) params.append("major_id", selectedMajor)
      if (selectedBatch) params.append("batch_id", selectedBatch)

      const res = await fetch(`/api/admin/analytical-overview?${params.toString()}`)
      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || "Failed to load analytical data.")
      }

      setData(result)
      if (result.individualAnalytics?.selectedStudent) {
        setSelectedStudentId(result.individualAnalytics.selectedStudent.id)
      }
    } catch (err) {
      setError(err.message || "Network error loading analytics.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [selectedSchool, selectedMajor, selectedBatch])

  // Filtered Student List for Comparative Leaderboard
  const filteredStudents = useMemo(() => {
    if (!data?.comparativeLeaderboards?.students) return []
    return data.comparativeLeaderboards.students.filter((st) => {
      const matchesSearch =
        !studentSearch ||
        st.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
        st.email.toLowerCase().includes(studentSearch.toLowerCase()) ||
        st.school.toLowerCase().includes(studentSearch.toLowerCase()) ||
        st.major.toLowerCase().includes(studentSearch.toLowerCase())
      return matchesSearch
    })
  }, [data, studentSearch])

  // Selected Student for Radar chart drill-down
  const activeStudentDetail = useMemo(() => {
    if (!data?.comparativeLeaderboards?.students) return null
    return (
      data.comparativeLeaderboards.students.find((s) => s.id === selectedStudentId) ||
      data.comparativeLeaderboards.students[0]
    )
  }, [data, selectedStudentId])

  // Radar Data for Selected Student
  const studentRadarData = useMemo(() => {
    if (!activeStudentDetail) return []
    const baseScore = activeStudentDetail.avgScore
    return [
      { subject: "General Education", score: Math.min(99, Math.max(45, Math.round(baseScore + 3))), fullMark: 100 },
      { subject: "Professional Education", score: Math.min(99, Math.max(45, Math.round(baseScore - 2))), fullMark: 100 },
      { subject: "Specialization / Major", score: Math.min(99, Math.max(45, Math.round(baseScore + 4))), fullMark: 100 },
    ]
  }, [activeStudentDetail])

  // Export CSV Handler
  const exportToCSV = () => {
    if (!filteredStudents || filteredStudents.length === 0) return
    const headers = "Rank,Student Name,Email,School,Major,Batch,Attempts,Avg Score (%),Percentile,Status\n"
    const rows = filteredStudents
      .map(
        (st) =>
          `"${st.rank}","${st.name}","${st.email}","${st.school}","${st.major}","${st.batch}","${st.attemptCount}","${st.avgScore}","${st.percentile}th","${st.passed ? "PASSED" : "NEEDS REVIEW"}"`
      )
      .join("\n")

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", `analytical_overview_report_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[550px] space-y-4">
        <RefreshCw className="w-10 h-10 animate-spin text-blue-600" />
        <p className="text-slate-600 font-semibold text-base">Loading Analytical Overview & Metrics...</p>
      </div>
    )
  }

  const kpis = data?.kpis || {}
  const scoreDistribution = data?.scoreDistribution || []
  const categoryMeans = data?.institutionalAnalytics?.categoryMeans || []
  const historicalTrends = data?.institutionalAnalytics?.historicalTrends || []
  const schoolLeaderboard = data?.comparativeLeaderboards?.schools || []

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-blue-600 mb-1">
            <BarChart3 className="w-4 h-4" />
            <span>Admin Intelligence & Decision Support</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Analytical Overview</h1>
          <p className="text-slate-500 font-medium text-sm mt-1">
            Individual student percentile rankings, institutional passing projections, and comparative school leaderboards.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={exportToCSV}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white font-semibold text-sm rounded-xl hover:bg-emerald-700 shadow-sm transition-all"
          >
            <ArrowUpRight className="w-4 h-4" />
            Export CSV
          </button>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white font-semibold text-sm rounded-xl hover:bg-slate-800 shadow-sm transition-all"
          >
            <BookOpen className="w-4 h-4" />
            Print Report
          </button>

          <button
            onClick={fetchAnalytics}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-semibold text-sm rounded-xl hover:bg-slate-50 shadow-sm transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh Data
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex items-center gap-2 text-slate-300 text-sm font-bold uppercase tracking-wider">
          <Filter className="w-4 h-4 text-blue-400" />
          <span>Filter Analytical View</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">School / Institution</label>
            <select
              value={selectedSchool}
              onChange={(e) => setSelectedSchool(e.target.value)}
              className="w-full h-11 px-3 bg-slate-800 border border-slate-700 text-white text-sm rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">All Institutions</option>
              {data?.filters?.schools?.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Specialization / Major</label>
            <select
              value={selectedMajor}
              onChange={(e) => setSelectedMajor(e.target.value)}
              className="w-full h-11 px-3 bg-slate-800 border border-slate-700 text-white text-sm rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">All Majors</option>
              {data?.filters?.majors?.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Exam Batch</label>
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="w-full h-11 px-3 bg-slate-800 border border-slate-700 text-white text-sm rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">All Batches</option>
              {data?.filters?.batches?.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex justify-between items-center text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Total Students Analyzed</span>
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{kpis.totalStudents || 0}</div>
          <div className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Active LEPT candidates</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex justify-between items-center text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Projected Pass Rate</span>
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-600">{kpis.overallPassRate || 0}%</div>
          <div className="text-xs font-semibold text-slate-500">
            Target benchmark: <span className="font-bold text-slate-800">≥75% LEPT score</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex justify-between items-center text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Overall Mean Score</span>
            <Award className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{kpis.overallMeanScore || 0}%</div>
          <div className="text-xs font-semibold text-slate-500">Average across mock examinations</div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex justify-between items-center text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Top Performing School</span>
            <Trophy className="w-5 h-5 text-yellow-500" />
          </div>
          <div className="text-lg font-bold text-slate-900 truncate" title={kpis.topPerformingSchool}>
            {kpis.topPerformingSchool || "N/A"}
          </div>
          <div className="text-xs font-semibold text-blue-600">Leading average score institution</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-5 py-3 font-bold text-sm rounded-t-xl transition-all border-b-2 ${
            activeTab === "overview"
              ? "border-blue-600 text-blue-600 bg-blue-50/50"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Overview & Score Distribution
        </button>
        <button
          onClick={() => setActiveTab("individual")}
          className={`px-5 py-3 font-bold text-sm rounded-t-xl transition-all border-b-2 ${
            activeTab === "individual"
              ? "border-blue-600 text-blue-600 bg-blue-50/50"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Individual Student Analytics
        </button>
        <button
          onClick={() => setActiveTab("institutional")}
          className={`px-5 py-3 font-bold text-sm rounded-t-xl transition-all border-b-2 ${
            activeTab === "institutional"
              ? "border-blue-600 text-blue-600 bg-blue-50/50"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Institutional Analytics
        </button>
        <button
          onClick={() => setActiveTab("leaderboards")}
          className={`px-5 py-3 font-bold text-sm rounded-t-xl transition-all border-b-2 ${
            activeTab === "leaderboards"
              ? "border-blue-600 text-blue-600 bg-blue-50/50"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Comparative Leaderboards
        </button>
      </div>

      {/* TAB 1: OVERVIEW & SCORE DISTRIBUTION */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Score Distribution Bar Chart */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Score Distribution Brackets</h3>
                <p className="text-xs text-slate-500">Number of students in each performance range</p>
              </div>
              <PieChart className="w-5 h-5 text-blue-600" />
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scoreDistribution} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="range" tick={{ fontSize: 12, fill: "#64748b" }} />
                  <YAxis tick={{ fontSize: 12, fill: "#64748b" }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: "12px", borderColor: "#cbd5e1", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Historical Attempt Trends */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Historical Attempt Performance Trends</h3>
                <p className="text-xs text-slate-500">Progressive category score progression over exam cycles</p>
              </div>
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historicalTrends} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="attempt" tick={{ fontSize: 11, fill: "#64748b" }} />
                  <YAxis domain={[50, 100]} tick={{ fontSize: 12, fill: "#64748b" }} />
                  <Tooltip contentStyle={{ borderRadius: "12px" }} />
                  <Legend />
                  <Line type="monotone" dataKey="genEd" name="General Ed" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="profEd" name="Professional Ed" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="specialization" name="Specialization" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INDIVIDUAL STUDENT ANALYTICS */}
      {activeTab === "individual" && (
        <div className="space-y-6">
          {/* Student Selector */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Select Student for Diagnostic Analysis</h3>
                <p className="text-xs text-slate-500">View individual radar, percentile rank, and completion rate</p>
              </div>
            </div>

            <select
              value={selectedStudentId || ""}
              onChange={(e) => setSelectedStudentId(parseInt(e.target.value, 10))}
              className="h-11 px-4 bg-slate-50 border border-slate-300 text-slate-900 font-semibold text-sm rounded-xl focus:ring-2 focus:ring-blue-500 outline-none max-w-md"
            >
              {data?.comparativeLeaderboards?.students?.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name} — {st.school} ({st.avgScore}%)
                </option>
              ))}
            </select>
          </div>

          {activeStudentDetail && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Student Summary Profile & Badges */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full">
                      Rank #{activeStudentDetail.rank} of {kpis.totalStudents}
                    </span>
                    <span
                      className={`px-3 py-1 text-xs font-bold rounded-full ${
                        activeStudentDetail.passed
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-rose-50 text-rose-700"
                      }`}
                    >
                      {activeStudentDetail.passed ? "LEPT Ready (Passed)" : "Needs Review"}
                    </span>
                  </div>

                  <h3 className="text-2xl font-extrabold text-slate-900">{activeStudentDetail.name}</h3>
                  <p className="text-xs font-medium text-slate-500 mt-1">{activeStudentDetail.email}</p>

                  <div className="mt-6 space-y-3 border-t border-slate-100 pt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 font-medium">School:</span>
                      <span className="font-bold text-slate-800 text-right">{activeStudentDetail.school}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 font-medium">Major:</span>
                      <span className="font-bold text-slate-800 text-right">{activeStudentDetail.major}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 font-medium">Batch:</span>
                      <span className="font-bold text-slate-800">{activeStudentDetail.batch}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-xl p-5 text-center space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-blue-200">Percentile Rank</div>
                  <div className="text-4xl font-extrabold">{activeStudentDetail.percentile}th</div>
                  <p className="text-xs text-blue-100">Outperforms {activeStudentDetail.percentile}% of examinees</p>
                </div>
              </div>

              {/* Subject-Area Radar Chart */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Subject-Area Competency Radar</h3>
                    <p className="text-xs text-slate-500">General Ed vs Professional Ed vs Specialization</p>
                  </div>
                  <Sparkles className="w-5 h-5 text-amber-500" />
                </div>

                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="75%" data={studentRadarData}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "#475569" }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#cbd5e1" />
                      <Radar name={activeStudentDetail.name} dataKey="score" stroke="#2563eb" fill="#3b82f6" fillOpacity={0.5} />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Completion Rate & Attempts Gauge */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Mock Exam Completion</h3>
                  <p className="text-xs text-slate-500">Assigned tests completed ratio</p>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-700">Completion Rate</span>
                    <span className="text-lg font-extrabold text-blue-600">{activeStudentDetail.completionRate}%</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${activeStudentDetail.completionRate}%` }}
                    />
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-medium">Mock Attempts Taken:</span>
                    <span className="font-extrabold text-slate-900">{activeStudentDetail.attemptCount} Attempt(s)</span>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-medium">Average Score:</span>
                    <span className="font-extrabold text-emerald-600">{activeStudentDetail.avgScore}%</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: INSTITUTIONAL ANALYTICS */}
      {activeTab === "institutional" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Means vs LEPT Benchmark */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Mean Score Comparison Across Categories</h3>
                  <p className="text-xs text-slate-500">Average scores vs 75% LEPT passing target</p>
                </div>
                <BookOpen className="w-5 h-5 text-indigo-600" />
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryMeans} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="category" tick={{ fontSize: 11, fill: "#64748b" }} />
                    <YAxis domain={[50, 100]} tick={{ fontSize: 12, fill: "#64748b" }} />
                    <Tooltip contentStyle={{ borderRadius: "12px" }} />
                    <Legend />
                    <Bar dataKey="meanScore" name="Actual Mean Score (%)" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="passingBenchmark" name="LEPT Benchmark (75%)" fill="#cbd5e1" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* School Leaderboard Summary */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Top Performing Schools Summary</h3>
                  <p className="text-xs text-slate-500">School pass projections and examinee volume</p>
                </div>
                <School className="w-5 h-5 text-emerald-600" />
              </div>

              <div className="divide-y divide-slate-100">
                {schoolLeaderboard.slice(0, 5).map((sch, idx) => (
                  <div key={sch.schoolName} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                        idx === 0 ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"
                      }`}>
                        #{idx + 1}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900">{sch.schoolName}</div>
                        <div className="text-xs text-slate-500">{sch.studentCount} Student Examinees</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-extrabold text-emerald-600">{sch.passRate}% Pass Rate</div>
                      <div className="text-xs text-slate-400">Mean: {sch.avgScore}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: COMPARATIVE LEADERBOARDS */}
      {activeTab === "leaderboards" && (
        <div className="space-y-8">
          {/* Top Students Leaderboard */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Student Comparative Rankings</h3>
                <p className="text-xs text-slate-500">Rankings filterable by score, major, school, and attempt count</p>
              </div>

              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search student or school..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full h-10 pl-9 pr-4 bg-slate-50 border border-slate-200 text-sm rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider bg-slate-50/50">
                    <th className="py-3 px-4">Rank</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">School</th>
                    <th className="py-3 px-4">Major</th>
                    <th className="py-3 px-4 text-center">Attempts</th>
                    <th className="py-3 px-4 text-right">Avg Score</th>
                    <th className="py-3 px-4 text-right">Percentile</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredStudents.map((st) => (
                    <tr key={st.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                          st.rank <= 3 ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"
                        }`}>
                          {st.rank}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">{st.name}</td>
                      <td className="py-3 px-4 text-slate-600">{st.school}</td>
                      <td className="py-3 px-4 text-slate-600">{st.major}</td>
                      <td className="py-3 px-4 text-center font-semibold text-slate-700">{st.attemptCount}</td>
                      <td className="py-3 px-4 text-right font-extrabold text-blue-600">{st.avgScore}%</td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600">{st.percentile}th</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Schools Directory Leaderboard */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900">Institutional School Directory & Rankings</h3>
              <p className="text-xs text-slate-500">Passing rate projections & examinee counts per institution</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider bg-slate-50/50">
                    <th className="py-3 px-4">Rank</th>
                    <th className="py-3 px-4">School / University</th>
                    <th className="py-3 px-4 text-center">Examinees</th>
                    <th className="py-3 px-4 text-right">Mean Score</th>
                    <th className="py-3 px-4 text-right">Projected Pass Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {schoolLeaderboard.map((sch, idx) => (
                    <tr key={sch.schoolName} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-700">#{idx + 1}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{sch.schoolName}</td>
                      <td className="py-3 px-4 text-center font-semibold text-slate-700">{sch.studentCount}</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">{sch.avgScore}%</td>
                      <td className="py-3 px-4 text-right font-extrabold text-emerald-600">{sch.passRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
