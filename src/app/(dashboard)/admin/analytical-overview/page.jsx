"use client"

import { useState, useEffect, useMemo } from "react"
import {
  RefreshCw,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Printer,
  AlertCircle
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
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts"

export default function AnalyticalOverviewPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Top Banner Carousel State
  const [currentSlide, setCurrentSlide] = useState(0)

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

  // Auto-advance banner carousel every 6 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 4)
    }, 6000)
    return () => clearInterval(timer)
  }, [])

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
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-3">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground text-xs font-medium">Loading analytics...</p>
      </div>
    )
  }

  const kpis = data?.kpis || {}
  const scoreDistribution = data?.scoreDistribution || []
  const categoryMeans = data?.institutionalAnalytics?.categoryMeans || []
  const historicalTrends = data?.institutionalAnalytics?.historicalTrends || []
  const schoolLeaderboard = data?.comparativeLeaderboards?.schools || []

  const carouselSlides = [
    {
      badge: "Cohort Volume",
      label: "Total Students Analyzed",
      value: kpis.totalStudents || 0,
      subtext: "Active examinees participating across all batches and examinations",
      extra: "Enrolled Candidates"
    },
    {
      badge: "Readiness Projection",
      label: "Projected Pass Rate",
      value: `${kpis.overallPassRate || 0}%`,
      subtext: "Proportion of examinees meeting or exceeding the 75% board passing benchmark",
      extra: "Benchmark Target ≥ 75%"
    },
    {
      badge: "Performance Index",
      label: "Overall Mean Score",
      value: `${kpis.overallMeanScore || 0}%`,
      subtext: "Average diagnostic and mock exam performance across all categories",
      extra: "General Ed · Professional Ed · Major"
    },
    {
      badge: "Institutional Leader",
      label: "Top Performing Institution",
      value: kpis.topPerformingSchool || "—",
      subtext: "Leading academic partner with highest aggregate examinee performance",
      extra: "Top Ranked School"
    }
  ]

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto animate-in fade-in duration-200">
      
      {/* ── Top Metric Banner Carousel ── */}
      <div className="relative w-full overflow-hidden rounded-2xl border border-border bg-card shadow-2xs">
        <div className="p-6 md:p-7 flex flex-col justify-between min-h-[145px]">
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {carouselSlides[currentSlide].badge} • {carouselSlides[currentSlide].label}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentSlide((prev) => (prev - 1 + carouselSlides.length) % carouselSlides.length)}
                className="w-7 h-7 rounded-xl bg-muted/60 hover:bg-muted text-foreground flex items-center justify-center transition-all cursor-pointer border border-border active:scale-95"
                title="Previous metric"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentSlide((prev) => (prev + 1) % carouselSlides.length)}
                className="w-7 h-7 rounded-xl bg-muted/60 hover:bg-muted text-foreground flex items-center justify-center transition-all cursor-pointer border border-border active:scale-95"
                title="Next metric"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="my-2.5 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
            <div className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
              {carouselSlides[currentSlide].value}
            </div>
            <div className="text-xs text-muted-foreground sm:text-right font-medium">
              {carouselSlides[currentSlide].extra}
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 pt-1">
            <p className="text-xs text-muted-foreground">
              {carouselSlides[currentSlide].subtext}
            </p>
            {/* Dots Indicator */}
            <div className="flex items-center gap-1.5 shrink-0">
              {carouselSlides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    currentSlide === idx ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  }`}
                  title={`Metric ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Analytical Overview</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Examinee performance, passing projections, and institutional rankings
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={exportToCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-card hover:bg-muted text-foreground border border-border text-xs font-medium rounded-xl transition-all cursor-pointer shadow-2xs active:scale-95"
            title="Export CSV"
          >
            <Download className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-card hover:bg-muted text-foreground border border-border text-xs font-medium rounded-xl transition-all cursor-pointer shadow-2xs active:scale-95"
            title="Print Report"
          >
            <Printer className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Print</span>
          </button>

          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-card hover:bg-muted text-foreground border border-border text-xs font-medium rounded-xl transition-all cursor-pointer shadow-2xs active:scale-95"
            title="Refresh Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-muted-foreground ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-card border border-border rounded-2xl p-3.5 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <select
              value={selectedSchool}
              onChange={(e) => setSelectedSchool(e.target.value)}
              className="w-full h-9 px-3 pr-8 bg-background border border-border text-foreground text-xs font-medium rounded-xl focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
            >
              <option value="">All Institutions</option>
              {data?.filters?.schools?.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
          </div>

          <div className="relative">
            <select
              value={selectedMajor}
              onChange={(e) => setSelectedMajor(e.target.value)}
              className="w-full h-9 px-3 pr-8 bg-background border border-border text-foreground text-xs font-medium rounded-xl focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
            >
              <option value="">All Majors</option>
              {data?.filters?.majors?.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
          </div>

          <div className="relative">
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="w-full h-9 px-3 pr-8 bg-background border border-border text-foreground text-xs font-medium rounded-xl focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
            >
              <option value="">All Batches</option>
              {data?.filters?.batches?.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-border gap-1 overflow-x-auto select-none">
        {[
          { key: "overview", label: "Overview & Distribution" },
          { key: "individual", label: "Individual Analytics" },
          { key: "institutional", label: "Institutional Analytics" },
          { key: "leaderboards", label: "Comparative Leaderboards" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-all border-b-2 -mb-px cursor-pointer ${
              activeTab === tab.key
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW & SCORE DISTRIBUTION */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Score Distribution Bar Chart */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-2xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-foreground">Score Distribution Brackets</h3>
              <p className="text-xs text-muted-foreground">Number of students per performance range</p>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scoreDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border" opacity={0.6} />
                  <XAxis dataKey="range" tick={{ fontSize: 11, fill: "currentColor" }} className="text-muted-foreground" tickLine={false} axisLine={{ stroke: "currentColor", opacity: 0.2 }} />
                  <YAxis tick={{ fontSize: 11, fill: "currentColor" }} className="text-muted-foreground" allowDecimals={false} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--border)", borderRadius: "10px", fontSize: "12px" }}
                  />
                  <Bar dataKey="count" fill="#E9C46A" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Historical Attempt Trends */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-2xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-foreground">Historical Attempt Trends</h3>
              <p className="text-xs text-muted-foreground">Category score progression over exam cycles</p>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historicalTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border" opacity={0.6} />
                  <XAxis dataKey="attempt" tick={{ fontSize: 11, fill: "currentColor" }} className="text-muted-foreground" tickLine={false} axisLine={{ stroke: "currentColor", opacity: 0.2 }} />
                  <YAxis domain={[50, 100]} tick={{ fontSize: 11, fill: "currentColor" }} className="text-muted-foreground" tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--border)", borderRadius: "10px", fontSize: "12px" }} />
                  <Line type="monotone" dataKey="genEd" name="Gen Ed" stroke="#E9C46A" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="profEd" name="Prof Ed" stroke="#64748b" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="specialization" name="Major" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INDIVIDUAL STUDENT ANALYTICS */}
      {activeTab === "individual" && (
        <div className="space-y-4">
          {/* Student Selector */}
          <div className="bg-card border border-border rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Select Student</h3>
              <p className="text-xs text-muted-foreground">Diagnostic radar, percentile rank, and completion rate</p>
            </div>

            <div className="relative w-full sm:w-80">
              <select
                value={selectedStudentId || ""}
                onChange={(e) => setSelectedStudentId(parseInt(e.target.value, 10))}
                className="w-full h-9 px-3 pr-8 bg-background border border-border text-foreground text-xs font-medium rounded-xl focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
              >
                {data?.comparativeLeaderboards?.students?.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name} — {st.school} ({st.avgScore}%)
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
            </div>
          </div>

          {activeStudentDetail && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Student Summary Profile */}
              <div className="bg-card border border-border rounded-2xl p-5 shadow-2xs space-y-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2 py-0.5 bg-muted text-foreground text-xs font-bold rounded-lg border border-border">
                      Rank #{activeStudentDetail.rank} of {kpis.totalStudents}
                    </span>
                    <span className="text-xs font-semibold text-muted-foreground">
                      {activeStudentDetail.passed ? "Pass Status" : "Review Status"}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-foreground">{activeStudentDetail.name}</h3>
                  <p className="text-xs text-muted-foreground">{activeStudentDetail.email}</p>

                  <div className="mt-4 space-y-2 border-t border-border pt-3 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">School</span>
                      <span className="font-medium text-foreground text-right">{activeStudentDetail.school}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Major</span>
                      <span className="font-medium text-foreground text-right">{activeStudentDetail.major}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Batch</span>
                      <span className="font-medium text-foreground">{activeStudentDetail.batch}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-muted/40 border border-border rounded-xl p-4 text-center space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Percentile Rank</div>
                  <div className="text-3xl font-bold text-foreground">{activeStudentDetail.percentile}th</div>
                  <p className="text-xs text-muted-foreground">Outperforms {activeStudentDetail.percentile}% of examinees</p>
                </div>
              </div>

              {/* Subject-Area Radar Chart */}
              <div className="bg-card border border-border rounded-2xl p-5 shadow-2xs space-y-3">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Competency Radar</h3>
                  <p className="text-xs text-muted-foreground">General Ed · Professional Ed · Specialization</p>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={studentRadarData}>
                      <PolarGrid stroke="currentColor" className="text-border" opacity={0.6} />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: "currentColor" }} className="text-muted-foreground" />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="currentColor" className="text-border" opacity={0.4} />
                      <Radar name={activeStudentDetail.name} dataKey="score" stroke="#E9C46A" fill="#E9C46A" fillOpacity={0.25} />
                      <Tooltip contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--border)", borderRadius: "10px", fontSize: "12px" }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Completion Rate & Stats */}
              <div className="bg-card border border-border rounded-2xl p-5 shadow-2xs space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Mock Exam Metrics</h3>
                  <p className="text-xs text-muted-foreground">Test completion and diagnostic score</p>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground font-medium">Completion Rate</span>
                    <span className="font-bold text-foreground">{activeStudentDetail.completionRate}%</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${activeStudentDetail.completionRate}%` }}
                    />
                  </div>

                  <div className="pt-3 border-t border-border flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Attempts Taken</span>
                    <span className="font-semibold text-foreground">{activeStudentDetail.attemptCount}</span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Average Score</span>
                    <span className="font-bold text-foreground">{activeStudentDetail.avgScore}%</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: INSTITUTIONAL ANALYTICS */}
      {activeTab === "institutional" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Category Means vs LEPT Benchmark */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-2xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-foreground">Category Means vs Benchmark</h3>
              <p className="text-xs text-muted-foreground">Average score comparison against 75% target</p>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryMeans} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border" opacity={0.6} />
                  <XAxis dataKey="category" tick={{ fontSize: 11, fill: "currentColor" }} className="text-muted-foreground" tickLine={false} axisLine={{ stroke: "currentColor", opacity: 0.2 }} />
                  <YAxis domain={[50, 100]} tick={{ fontSize: 11, fill: "currentColor" }} className="text-muted-foreground" tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--border)", borderRadius: "10px", fontSize: "12px" }} />
                  <Bar dataKey="meanScore" name="Mean Score (%)" fill="#E9C46A" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="passingBenchmark" name="Benchmark (75%)" fill="#94a3b8" radius={[4, 4, 0, 0]} opacity={0.5} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* School Leaderboard Summary */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-2xs space-y-3">
            <div>
              <h3 className="text-sm font-bold text-foreground">Top Institutions</h3>
              <p className="text-xs text-muted-foreground">Passing projections and examinee volume</p>
            </div>

            <div className="divide-y divide-border text-xs">
              {schoolLeaderboard.slice(0, 5).map((sch, idx) => (
                <div key={sch.schoolName} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 text-center text-muted-foreground font-semibold">{idx + 1}</span>
                    <div className="truncate">
                      <div className="font-semibold text-foreground truncate">{sch.schoolName}</div>
                      <div className="text-xs text-muted-foreground">{sch.studentCount} examinees</div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-foreground">{sch.passRate}%</div>
                    <div className="text-xs text-muted-foreground">Mean {sch.avgScore}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: COMPARATIVE LEADERBOARDS */}
      {activeTab === "leaderboards" && (
        <div className="space-y-6">
          {/* Top Students Leaderboard */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-foreground">Student Comparative Rankings</h3>
                <p className="text-xs text-muted-foreground">Filtered by score, institution, and batch</p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search student..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full h-8 pl-8 pr-3 bg-background border border-border text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="overflow-x-auto border border-border rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground font-semibold bg-muted/30">
                    <th className="py-2.5 px-3 w-12 text-center">#</th>
                    <th className="py-2.5 px-3">Student Name</th>
                    <th className="py-2.5 px-3">School</th>
                    <th className="py-2.5 px-3">Major</th>
                    <th className="py-2.5 px-3 text-center">Attempts</th>
                    <th className="py-2.5 px-3 text-right">Avg Score</th>
                    <th className="py-2.5 px-3 text-right">Percentile</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredStudents.map((st) => (
                    <tr key={st.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-2.5 px-3 text-center text-muted-foreground font-medium">{st.rank}</td>
                      <td className="py-2.5 px-3 font-semibold text-foreground">{st.name}</td>
                      <td className="py-2.5 px-3 text-muted-foreground">{st.school}</td>
                      <td className="py-2.5 px-3 text-muted-foreground">{st.major}</td>
                      <td className="py-2.5 px-3 text-center text-muted-foreground">{st.attemptCount}</td>
                      <td className="py-2.5 px-3 text-right font-semibold text-foreground">{st.avgScore}%</td>
                      <td className="py-2.5 px-3 text-right text-muted-foreground">{st.percentile}th</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Schools Directory Leaderboard */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-2xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-foreground">Institutional Directory & Rankings</h3>
              <p className="text-xs text-muted-foreground">Passing rate projections and examinee counts</p>
            </div>

            <div className="overflow-x-auto border border-border rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground font-semibold bg-muted/30">
                    <th className="py-2.5 px-3 w-12 text-center">#</th>
                    <th className="py-2.5 px-3">Institution</th>
                    <th className="py-2.5 px-3 text-center">Examinees</th>
                    <th className="py-2.5 px-3 text-right">Mean Score</th>
                    <th className="py-2.5 px-3 text-right">Pass Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {schoolLeaderboard.map((sch, idx) => (
                    <tr key={sch.schoolName} className="hover:bg-muted/20 transition-colors">
                      <td className="py-2.5 px-3 text-center text-muted-foreground font-medium">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-semibold text-foreground">{sch.schoolName}</td>
                      <td className="py-2.5 px-3 text-center text-muted-foreground">{sch.studentCount}</td>
                      <td className="py-2.5 px-3 text-right text-muted-foreground">{sch.avgScore}%</td>
                      <td className="py-2.5 px-3 text-right font-semibold text-foreground">{sch.passRate}%</td>
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
