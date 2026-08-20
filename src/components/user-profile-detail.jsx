"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Calendar, MapPin, GraduationCap, Phone, Mail, User,
  Edit, BarChart3, Clock, ArrowLeft, Loader2, Save, X, BookOpen, AlertCircle,
  Key, Lock, Eye, EyeOff
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function UserProfileDetail({ initialUser }) {
  const router = useRouter()
  const [user, setUser] = useState(initialUser)
  const [activeTab, setActiveTab] = useState("info")
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  // Password fields
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  // Edit fields
  const [firstName, setFirstName] = useState(user.first_name || "")
  const [middleName, setMiddleName] = useState(user.middle_name || "")
  const [lastName, setLastName] = useState(user.last_name || "")
  const [suffix, setSuffix] = useState(user.suffix || "")
  const [birthday, setBirthday] = useState(user.birthday ? new Date(user.birthday).toISOString().split('T')[0] : "")
  const [gender, setGender] = useState(user.gender || "")
  const [phone, setPhone] = useState(user.phone || "")
  const [address, setAddress] = useState(user.address || "")
  const [city, setCity] = useState(user.city || "")
  const [province, setProvince] = useState(user.province || "")
  const [zipCode, setZipCode] = useState(user.zip_code || "")
  const [email, setEmail] = useState(user.email || "")
  const [role, setRole] = useState(user.role || "student")

  const [highestEducation, setHighestEducation] = useState(user.highest_education || "")
  const [schoolId, setSchoolId] = useState(user.school_id ? user.school_id.toString() : "")
  const [academicCourseId, setAcademicCourseId] = useState(user.academic_course_id ? user.academic_course_id.toString() : "")
  const [yearGraduated, setYearGraduated] = useState(user.year_graduated || "")

  const [examId, setExamId] = useState(user.exam_id ? user.exam_id.toString() : "")
  const [batchId, setBatchId] = useState(user.batch_id ? user.batch_id.toString() : "")
  const [programId, setProgramId] = useState(user.program_id ? user.program_id.toString() : "")
  const [majorId, setMajorId] = useState(user.major_id ? user.major_id.toString() : "")

  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url || "")
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const [dropdownData, setDropdownData] = useState({ examinations: [], batches: [], programs: [], majors: [], schools: [], academic_courses: [] })

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingAvatar(true)
    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      })
      if (!res.ok) throw new Error("Upload failed")
      const data = await res.json()
      setAvatarUrl(data.url)
    } catch (err) {
      console.error(err)
      alert("Failed to upload image.")
    } finally {
      setUploadingAvatar(false)
    }
  }

  useEffect(() => {
    // Fetch dropdown data for the edit modal
    fetch("/api/admin/master-data/dropdowns")
      .then(res => res.json())
      .then(data => {
        if (data.examinations) setDropdownData(data)
      })
      .catch(console.error)
  }, [])

  // Scroll to section helper
  const handleTabClick = (tabId) => {
    const element = document.getElementById(`profile-${tabId}`)
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" })
      setActiveTab(tabId)
    }
  }

  // Observe active section on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const tabName = entry.target.id.replace("profile-", "")
            setActiveTab(tabName)
          }
        })
      },
      {
        rootMargin: "-15% 0px -65% 0px" // Trigger as section enters center-top viewport
      }
    )

    const sections = ["profile-info"]
    if (user.role === 'student') {
      sections.push("profile-analytics", "profile-history")
    }

    sections.forEach((id) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })

    return () => {
      sections.forEach((id) => {
        const el = document.getElementById(id)
        if (el) observer.unobserve(el)
      })
    }
  }, [user.role])

  // Format date helper
  const formatDate = (dateStr) => {
    if (!dateStr) return "—"
    try {
      const options = { year: 'numeric', month: 'long', day: 'numeric' }
      return new Date(dateStr).toLocaleDateString('en-US', options)
    } catch {
      return dateStr
    }
  }

  // Get initial letters for avatar
  const getAvatarInitial = (name) => {
    if (!name) return "U"
    return name.trim().charAt(0).toUpperCase()
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    setError("")

    if (newPassword && newPassword.length < 6) {
      setError("New password must be at least 6 characters.")
      return
    }

    if (newPassword && newPassword !== confirmPassword) {
      setError("New passwords do not match.")
      return
    }

    setSaving(true)

    const fullName = [firstName, middleName, lastName, suffix]
      .filter(Boolean)
      .join(" ")
      .trim()

    try {
      // First update base login info and optional password
      const basePayload = {
        name: fullName,
        email,
        role,
      }
      if (newPassword?.trim()) {
        basePayload.password = newPassword.trim()
      }

      const resBase = await fetch(`/api/admin/users?id=${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(basePayload)
      })

      if (!resBase.ok) {
        const errData = await resBase.json()
        throw new Error(errData.error || "Failed to update account details.")
      }

      // Then update profile metadata details using a custom endpoint or extended update
      // Since the base API doesn't update metadata, let's write a route to handle full updates
      const resFull = await fetch(`/api/admin/users/profile-update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: user.id,
          first_name: firstName || null,
          middle_name: middleName || null,
          last_name: lastName || null,
          suffix: suffix || null,
          birthday: birthday || null,
          gender: gender || null,
          phone: phone || null,
          address: address || null,
          city: city || null,
          province: province || null,
          zip_code: zipCode || null,
          school_id: schoolId ? parseInt(schoolId) : null,
          academic_course_id: academicCourseId ? parseInt(academicCourseId) : null,
          year_graduated: yearGraduated || null,
          highest_education: highestEducation || null,
          exam_id: role !== "admin" && examId ? parseInt(examId) : null,
          batch_id: role !== "admin" && batchId ? parseInt(batchId) : null,
          program_id: role !== "admin" && programId ? parseInt(programId) : null,
          major_id: role !== "admin" && majorId ? parseInt(majorId) : null,
          avatar_url: avatarUrl || null,
        })
      })

      if (!resFull.ok) {
        const errData = await resFull.json()
        throw new Error(errData.error || "Failed to update profile details.")
      }

      const updated = await resFull.json()
      setUser(updated.user)
      setIsEditing(false)
      router.refresh()
    } catch (err) {
      setError(err.message || "Network error. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  // Get display names for school, course, batch, exam
  const schoolName = dropdownData.schools.find(s => s.id.toString() === schoolId)?.name || user.school_name || user.school || "—"
  const courseName = dropdownData.academic_courses.find(c => c.id.toString() === academicCourseId)?.name || user.academic_course_name || user.course || "—"
  const examName = dropdownData.examinations.find(e => e.id.toString() === examId)?.name || user.exam_name || "—"
  const batchName = dropdownData.batches.find(b => b.id.toString() === batchId)?.name || user.batch_name || "—"
  const programName = dropdownData.programs.find(p => p.id.toString() === programId)?.name || user.program_name || "—"
  const majorName = dropdownData.majors.find(m => m.id.toString() === majorId)?.name || user.major_name || "—"
  return (
    <div className="space-y-0">
      {/* Back button */}
      <div className="max-w-5xl mx-auto px-6 pt-6 pb-2">
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted hover:text-foreground transition-all shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to User List
        </Link>
      </div>

      {/* Profile Header (Stretched) */}
      <div className="relative overflow-hidden w-full bg-card border-b border-border">
        {/* Banner with Illustrative Pattern from SVG */}
        <div
          className="h-56 md:h-72 w-full bg-cover bg-center relative"
          style={{ backgroundImage: "url('/images/image0_1850_4352.jpg')" }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          <div className="absolute right-8 bottom-6 text-xs font-bold text-white bg-black/40 px-3.5 py-1.5 rounded-full backdrop-blur-md">
            Enrolled: {formatDate(user.created_at)}
          </div>
        </div>

        {/* Profile Info Row */}
        <div className="px-8 pb-8 pt-0 relative flex flex-col items-center gap-4 -mt-16 md:-mt-20 z-10 text-center">
          {/* Avatar (overlapping the banner) */}
          <div className="h-32 w-32 md:h-36 md:w-36 rounded-full border-4 border-card bg-slate-200 dark:bg-slate-700 flex items-center justify-center shadow-xl overflow-hidden relative z-20 shrink-0">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={user.name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-5xl font-extrabold text-slate-600 dark:text-slate-200">
                {getAvatarInitial(user.name)}
              </span>
            )}
          </div>

          {/* Details */}
          <div className="space-y-2">
            <div className="flex flex-col items-center gap-2">
              <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
                {user.name}
              </h1>
              <div className="flex justify-center gap-2">
                <span className={`inline-flex items-center rounded-full px-3 py-0.5 text-xs font-bold uppercase tracking-wider ${
                  user.role === 'admin' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' :
                  user.role === 'teacher' ? 'bg-teal-500/10 text-teal-600 border border-teal-500/20' : 
                  'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                }`}>
                  {user.role}
                </span>
                {user.role === 'student' && batchName !== '—' && (
                  <span className="inline-flex items-center rounded-full px-3 py-0.5 text-xs font-semibold bg-muted text-muted-foreground border border-border">
                    {batchName}
                  </span>
                )}
              </div>
            </div>
            <p className="text-sm text-muted-foreground font-medium">
              Logins: 18 · Last login: 2 hours ago
            </p>
          </div>

          {/* Edit User Button (Positioned on the right) */}
          <div className="absolute right-8 top-20 md:top-24">
            <Button
              onClick={() => setIsEditing(true)}
              className="bg-[#eed48f] hover:bg-[#e4c46c] text-slate-900 font-extrabold text-xs uppercase tracking-widest rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all px-6 py-3 flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              EDIT USER
            </Button>
          </div>
        </div>

        {/* Sticky Custom Nav Tabs */}
        <div className="border-t border-border bg-slate-50/50 dark:bg-slate-900/50 px-6 py-4 flex justify-center gap-4 sticky top-0 z-30 backdrop-blur-md">
          <button
            onClick={() => handleTabClick("info")}
            type="button"
            className={`px-5 py-2 rounded-md text-xs font-bold tracking-wide uppercase transition-all border ${
              activeTab === "info"
                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-border shadow-sm"
                : "bg-transparent text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/50"
            }`}
          >
            INFO
          </button>
          
          {user.role === 'student' && (
            <>
              <button
                onClick={() => handleTabClick("analytics")}
                type="button"
                className={`px-5 py-2 rounded-md text-xs font-bold tracking-wide uppercase transition-all border ${
                  activeTab === "analytics"
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-border shadow-sm"
                    : "bg-transparent text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/50"
                }`}
              >
                ANALYTICAL OVERVIEW
              </button>
              
              <button
                onClick={() => handleTabClick("history")}
                type="button"
                className={`px-5 py-2 rounded-md text-xs font-bold tracking-wide uppercase transition-all border ${
                  activeTab === "history"
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-border shadow-sm"
                    : "bg-transparent text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/50"
                }`}
              >
                HISTORY
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stacked Panels (All visible, scrolling navigates) */}
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8 pb-16">
        {/* PANEL: INFO */}
        <div id="profile-info" className="scroll-mt-24 space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Basics Card */}
            <div className="md:col-span-2 rounded-[28px] border border-border bg-card p-8 shadow-sm space-y-6">
              <div className="flex items-center gap-2 border-b border-border/80 pb-4">
                <User className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-bold text-foreground">Personal Details</h3>
              </div>

              <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2 text-sm">
                {[
                  { label: "Birthday", value: formatDate(user.birthday) },
                  { label: "Gender", value: user.gender || "—", capitalize: true },
                  { label: "Street Address", value: user.address || "—" },
                  { label: "City / Municipality", value: user.city || "—" },
                  { label: "Province", value: user.province || "—" },
                  { label: "ZIP Code", value: user.zip_code || "—" },
                  { label: "Highest Education", value: user.highest_education ? user.highest_education.replace('_', ' ') : "—", capitalize: true },
                  { label: "School / University", value: schoolName },
                  { label: "Course / Program", value: courseName },
                  { label: "Year Graduated", value: user.year_graduated || "—" },
                ].map((field) => (
                  <div key={field.label} className="space-y-1">
                    <p className="text-[10px] text-muted-foreground font-extrabold uppercase tracking-wider">{field.label}</p>
                    <p className={`text-sm font-semibold text-foreground ${field.capitalize ? "capitalize" : ""}`}>{field.value}</p>
                  </div>
                ))}
                
                {user.role === 'admin' && (
                  <div className="sm:col-span-2 space-y-1">
                    <p className="text-[10px] text-muted-foreground font-extrabold uppercase tracking-wider">Job Role Description</p>
                    <p className="text-sm font-semibold text-foreground">{user.job_role_description || "—"}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Contact and Targets column */}
            <div className="space-y-6">
              {/* Contact Card */}
              <div className="rounded-[28px] border border-border bg-card p-8 shadow-sm space-y-6">
                <div className="flex items-center gap-2 border-b border-border/80 pb-4">
                  <Phone className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-bold text-foreground">Contact Info</h3>
                </div>

                <div className="space-y-5 text-sm">
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground font-extrabold uppercase tracking-wider">Email Address</p>
                    <a href={`mailto:${user.email}`} className="text-sm font-semibold text-primary hover:underline break-all block">
                      {user.email}
                    </a>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground font-extrabold uppercase tracking-wider">Phone Number</p>
                    <p className="text-sm font-semibold text-foreground">{user.phone || "—"}</p>
                  </div>
                </div>
              </div>

              {/* Academic Target Card (For Students) */}
              {user.role === 'student' && (
                <div className="rounded-[28px] border border-border bg-card p-8 shadow-sm space-y-6">
                  <div className="flex items-center gap-2 border-b border-border/80 pb-4">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-bold text-foreground">Academic Profile</h3>
                  </div>

                  <div className="space-y-5 text-sm">
                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground font-extrabold uppercase tracking-wider">Target Examination</p>
                      <p className="text-sm font-semibold text-foreground">{examName}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground font-extrabold uppercase tracking-wider">Batch / Year</p>
                      <p className="text-sm font-semibold text-foreground">{batchName}</p>
                    </div>
                    {programName && programName !== "—" && (
                      <div className="space-y-1">
                        <p className="text-[10px] text-muted-foreground font-extrabold uppercase tracking-wider">Program</p>
                        <p className="text-sm font-semibold text-foreground">{programName}</p>
                      </div>
                    )}
                    {majorName && majorName !== "—" && (
                      <div className="space-y-1">
                        <p className="text-[10px] text-muted-foreground font-extrabold uppercase tracking-wider">Specialization / Major</p>
                        <p className="text-sm font-semibold text-foreground">{majorName}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* PANEL: ANALYTICAL OVERVIEW */}
        {user.role === 'student' && (
          <div id="profile-analytics" className="scroll-mt-24 space-y-6 border-t border-border pt-8">
            <div className="grid gap-6 md:grid-cols-5">
              {/* Readiness Score Card */}
              <div className="md:col-span-2 rounded-[28px] border border-border bg-card p-8 shadow-sm flex flex-col items-center justify-between text-center min-h-[340px]">
                <h3 className="text-sm font-extrabold text-muted-foreground uppercase tracking-widest">
                  Overall Readiness
                </h3>
                
                {/* Circular Donut Chart */}
                <div className="relative h-44 w-44 flex items-center justify-center my-4">
                  <svg className="h-full w-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      className="stroke-slate-100 dark:stroke-slate-800"
                      strokeWidth="8"
                      fill="transparent"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      className="stroke-[#eed48f]"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={`${2 * Math.PI * 40}`}
                      strokeDashoffset={`${2 * Math.PI * 40 * (1 - 0.62)}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-4xl font-black text-foreground">62%</span>
                    <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider mt-0.5">Target: 80%</span>
                  </div>
                </div>

                <span className="inline-flex items-center rounded-full bg-amber-500/10 border border-amber-500/25 px-5 py-1.5 text-xs font-extrabold text-amber-600 uppercase tracking-widest">
                  FOR MONITORING
                </span>
              </div>

              {/* Competency Breakdown Bar Widget */}
              <div className="md:col-span-3 rounded-[28px] border border-border bg-card p-8 shadow-sm space-y-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-foreground border-b border-border/80 pb-4 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Competency Breakdown
                  </h3>
                </div>

                <div className="space-y-6 py-2">
                  {[
                    { name: "General Education", score: 65, color: "bg-[#eed48f]" },
                    { name: "Professional Education", score: 58, color: "bg-orange-400" },
                    { name: "Specialization (English)", score: 64, color: "bg-amber-400" }
                  ].map((comp) => (
                    <div key={comp.name} className="space-y-2">
                      <div className="flex justify-between text-sm font-semibold">
                        <span className="text-foreground">{comp.name}</span>
                        <span className="text-muted-foreground">{comp.score}%</span>
                      </div>
                      <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${comp.color} rounded-full transition-all duration-500`}
                          style={{ width: `${comp.score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PANEL: HISTORY */}
        {user.role === 'student' && (
          <div id="profile-history" className="scroll-mt-24 space-y-6 border-t border-border pt-8">
            <div className="rounded-[28px] border border-border bg-card p-8 shadow-sm space-y-6">
              <h3 className="text-base font-bold text-foreground border-b border-border/80 pb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Recent Activity
              </h3>

              <div className="space-y-8 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100 dark:before:bg-slate-800">
                {[
                  {
                    title: "Completed Quiz: Child and Adolescent Development (Quiz 4)",
                    details: "Score: 52% (Failed) · Time taken: 14m 20s",
                    time: "Today, 10:12 AM",
                    success: false
                  },
                  {
                    title: "Retook Comprehensive Mock Exam 1",
                    details: "Overall Score: 80% · Target achieved!",
                    time: "Oct 14, 2026, 2:00 PM",
                    success: true
                  },
                  {
                    title: "Completed Comprehensive Mock Exam 1",
                    details: "Overall Score: 58% (Passed) · Score needs improvement.",
                    time: "Oct 11, 2026, 2:00 PM",
                    success: true
                  }
                ].map((act, index) => (
                  <div key={index} className="flex gap-4 relative pl-8">
                    <div className={`absolute left-[5px] top-1.5 h-4 w-4 rounded-full border-2 bg-card ${
                      act.success ? "border-emerald-500" : "border-rose-500"
                    }`} />

                    <div className="space-y-1.5">
                      <p className="font-semibold text-foreground text-sm leading-snug">
                        {act.title}
                      </p>
                      <p className="text-xs text-muted-foreground font-medium">
                        {act.details}
                      </p>
                      <p className="text-[10px] text-muted-foreground/60 font-semibold uppercase">
                        {act.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Advanced Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-950 rounded-2xl border border-border w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col my-8">
            {/* Header */}
            <div className="border-b border-border px-6 py-4 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
              <div className="flex items-center gap-2">
                <Edit className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Edit User Profile</h3>
              </div>
              <button
                onClick={() => setIsEditing(false)}
                className="rounded-full p-1 hover:bg-slate-200 dark:hover:bg-slate-800 text-muted-foreground hover:text-foreground transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Form */}
            <form onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto p-6 max-h-[70vh] space-y-6 bg-white dark:bg-slate-950">
              {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              {/* ═══ Account Security & Password ═══ */}
              <div className="space-y-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
                <div className="flex items-center justify-between border-b border-primary/20 pb-2">
                  <div className="flex items-center gap-2">
                    <Key className="h-4 w-4 text-primary" />
                    <h4 className="text-xs font-bold uppercase tracking-widest text-primary">
                      Account Password & Role
                    </h4>
                  </div>
                  <span className="text-[11px] font-medium text-muted-foreground">
                    Original password is encrypted & hidden
                  </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-email" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Email Address</Label>
                    <Input id="edit-email" type="email" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Account Role</Label>
                    <Select value={role} onValueChange={setRole}>
                      <SelectTrigger className="w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"><SelectValue placeholder="Select Role" /></SelectTrigger>
                      <SelectContent className="bg-white dark:bg-slate-950 border border-border">
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="teacher">Teacher</SelectItem>
                        <SelectItem value="admin">Administrator</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* New Password */}
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-new-password" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                      <span>Set New Password</span>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-[10px] text-primary font-semibold hover:underline flex items-center gap-1"
                      >
                        {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        {showPassword ? "Hide" : "Show"}
                      </button>
                    </Label>
                    <div className="relative">
                      <Input
                        id="edit-new-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Leave blank to keep unchanged"
                        className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800 pr-10"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                    <p className="text-[10px] text-muted-foreground">Min. 6 characters. Leave empty if no change.</p>
                  </div>

                  {/* Confirm New Password */}
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-confirm-password" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        id="edit-confirm-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Confirm new password"
                        disabled={!newPassword}
                        className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800 pr-10 disabled:opacity-50"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              {/* ═══ Personal Details ═══ */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 border-b border-border pb-1">
                  <User className="h-4 w-4" /> Personal Details
                </h4>

                {/* Avatar Edit Upload */}
                <div className="flex flex-col sm:flex-row items-center gap-5 pb-4 border-b border-border/50">
                  <div className="relative h-20 w-20 rounded-full bg-slate-100 dark:bg-slate-900 border-2 border-dashed border-border flex items-center justify-center overflow-hidden">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar Preview" className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-8 w-8 text-muted-foreground" />
                    )}
                    {uploadingAvatar && (
                      <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                        <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-1 text-center sm:text-left">
                    <Label htmlFor="edit-avatar-file" className="cursor-pointer inline-flex items-center gap-1.5 rounded-md bg-secondary px-3 py-1.5 text-xs font-bold text-secondary-foreground hover:bg-secondary/80 transition-colors">
                      Change Photo
                    </Label>
                    <input
                      id="edit-avatar-file"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                    />
                    <p className="text-[10px] text-muted-foreground">JPG, PNG or WEBP. Max size 2MB.</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-first-name" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">First Name</Label>
                    <Input id="edit-first-name" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-middle-name" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Middle Name</Label>
                    <Input id="edit-middle-name" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800" value={middleName} onChange={(e) => setMiddleName(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-last-name" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Last Name</Label>
                    <Input id="edit-last-name" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-suffix" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Suffix</Label>
                    <Input id="edit-suffix" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800" value={suffix} onChange={(e) => setSuffix(e.target.value)} />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-birthday" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Birthday</Label>
                    <Input id="edit-birthday" type="date" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800" value={birthday} onChange={(e) => setBirthday(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Gender</Label>
                    <Select value={gender} onValueChange={setGender}>
                      <SelectTrigger className="w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"><SelectValue placeholder="Select Gender" /></SelectTrigger>
                      <SelectContent className="bg-white dark:bg-slate-950 border border-border">
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                        <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-phone" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Phone Number</Label>
                    <Input id="edit-phone" type="tel" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="sm:col-span-3 space-y-1.5">
                    <Label htmlFor="edit-address" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Street Address</Label>
                    <Input id="edit-address" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800" value={address} onChange={(e) => setAddress(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-city" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">City / Municipality</Label>
                    <Input id="edit-city" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800" value={city} onChange={(e) => setCity(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-province" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Province</Label>
                    <Input id="edit-province" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800" value={province} onChange={(e) => setProvince(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-zip" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">ZIP Code</Label>
                    <Input id="edit-zip" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800" value={zipCode} onChange={(e) => setZipCode(e.target.value)} />
                  </div>
                </div>
              </div>

              {/* ═══ Education Background ═══ */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 border-b border-border pb-1">
                  <GraduationCap className="h-4 w-4" /> Education Background
                </h4>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Highest Education</Label>
                    <Select value={highestEducation} onValueChange={setHighestEducation}>
                      <SelectTrigger className="w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"><SelectValue placeholder="Select Level" /></SelectTrigger>
                      <SelectContent className="bg-white dark:bg-slate-950 border border-border">
                        <SelectItem value="high_school">High School</SelectItem>
                        <SelectItem value="vocational">Vocational / Technical</SelectItem>
                        <SelectItem value="bachelor">Bachelor's Degree</SelectItem>
                        <SelectItem value="master">Master's Degree</SelectItem>
                        <SelectItem value="doctorate">Doctorate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">School / University</Label>
                    <Select value={schoolId} onValueChange={setSchoolId}>
                      <SelectTrigger className="w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"><SelectValue placeholder="Select School" /></SelectTrigger>
                      <SelectContent className="bg-white dark:bg-slate-950 border border-border">
                        {dropdownData.schools.map(s => (
                          <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Course / Program</Label>
                    <Select value={academicCourseId} onValueChange={setAcademicCourseId}>
                      <SelectTrigger className="w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"><SelectValue placeholder="Select Course" /></SelectTrigger>
                      <SelectContent className="bg-white dark:bg-slate-950 border border-border">
                        {dropdownData.academic_courses.map(c => (
                          <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-year-grad" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Year Graduated</Label>
                    <Input id="edit-year-grad" type="number" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800" value={yearGraduated} onChange={(e) => setYearGraduated(e.target.value)} />
                  </div>
                </div>
              </div>

              {/* ═══ Academic Targets (Students only) ═══ */}
              {role === "student" && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 border-b border-border pb-1">
                    <BookOpen className="h-4 w-4" /> Academic Details
                  </h4>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Target Examination</Label>
                      <Select value={examId} onValueChange={(val) => { setExamId(val); setProgramId(""); setMajorId(""); }}>
                        <SelectTrigger className="w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"><SelectValue placeholder="Select Exam" /></SelectTrigger>
                        <SelectContent className="bg-white dark:bg-slate-950 border border-border">
                          {dropdownData.examinations.map(e => (
                            <SelectItem key={e.id} value={e.id.toString()}>{e.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Batch / Review Year</Label>
                      <Select value={batchId} onValueChange={setBatchId}>
                        <SelectTrigger className="w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"><SelectValue placeholder="Select Batch" /></SelectTrigger>
                        <SelectContent className="bg-white dark:bg-slate-950 border border-border">
                          {dropdownData.batches
                            .filter(b => !examId || b.exam_id.toString() === examId)
                            .map(b => (
                              <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {examId && dropdownData.programs?.some(p => p.exam_id.toString() === examId) && (
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Program</Label>
                        <Select value={programId} onValueChange={(val) => { setProgramId(val); setMajorId(""); }}>
                          <SelectTrigger className="w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"><SelectValue placeholder="Select Program" /></SelectTrigger>
                          <SelectContent className="bg-white dark:bg-slate-950 border border-border">
                            {dropdownData.programs
                              .filter(p => p.exam_id.toString() === examId)
                              .map(p => (
                                <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {programId && dropdownData.majors?.some(m => m.program_id.toString() === programId) && (
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Specialization / Major</Label>
                        <Select value={majorId} onValueChange={setMajorId}>
                          <SelectTrigger className="w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"><SelectValue placeholder="Select Major" /></SelectTrigger>
                          <SelectContent className="bg-white dark:bg-slate-950 border border-border">
                            {dropdownData.majors
                              .filter(m => m.program_id.toString() === programId)
                              .map(m => (
                                <SelectItem key={m.id} value={m.id.toString()}>{m.name}</SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </form>

            {/* Footer */}
            <div className="border-t border-border px-6 py-4 flex items-center justify-end gap-3 bg-slate-50 dark:bg-slate-900/50">
              <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={handleEditSubmit} disabled={saving} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}