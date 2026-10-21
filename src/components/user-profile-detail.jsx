"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { isAdminRole } from "@/lib/auth"
import {
  Calendar, MapPin, GraduationCap, Phone, Mail, User,
  Edit, BarChart3, Clock, ArrowLeft, Loader2, Save, X, AlertCircle,
  Key, Lock, Eye, EyeOff, Shield, Info, Camera, BookOpen,
  ChevronDown, ChevronUp
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "@/components/ui/toast"
import { compressImage, fileToDataUrl } from "@/lib/image-compression"

export function UserProfileDetail({ initialUser, showBackBtn = true }) {
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
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Edit fields
  const [firstName, setFirstName] = useState(user.first_name || "")
  const [middleName, setMiddleName] = useState(user.middle_name || "")
  const [lastName, setLastName] = useState(user.last_name || "")
  const [suffix, setSuffix] = useState(user.suffix || "")
  const [birthday, setBirthday] = useState(user.birthday ? new Date(user.birthday).toISOString().split('T')[0] : "")
  const [gender, setGender] = useState(user.gender || "")
  const [phone, setPhone] = useState(user.phone || "")
  const [personalEmail, setPersonalEmail] = useState(user.personal_email || "")
  const [address, setAddress] = useState(user.address || "")
  const [city, setCity] = useState(user.city || "")
  const [province, setProvince] = useState(user.province || "")
  const [zipCode, setZipCode] = useState(user.zip_code || "")
  const [email, setEmail] = useState(user.email || "")
  const [role, setRole] = useState(user.role || "student")
  const [jobRoleDescription, setJobRoleDescription] = useState(user.job_role_description || "")

  const [highestEducation, setHighestEducation] = useState(() => {
    const edu = user.highest_education || ""
    if (edu === "bachelor") return "Bachelor's Degree"
    if (edu === "master") return "Master's Degree"
    if (edu === "doctorate") return "Doctorate Degree"
    return edu
  })
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
  const [activities, setActivities] = useState([])
  const [loadingActivities, setLoadingActivities] = useState(false)
  const [isActivitiesExpanded, setIsActivitiesExpanded] = useState(false)

  const [analyticsData, setAnalyticsData] = useState(null)
  const [loadingAnalytics, setLoadingAnalytics] = useState(false)
  const [expandedCompetency, setExpandedCompetency] = useState(null)
  const [expandedSubjects, setExpandedSubjects] = useState({})

  const toggleCompetency = (key) => {
    setExpandedCompetency((prev) => (prev === key ? null : key))
  }

  const toggleSubject = (subId) => {
    setExpandedSubjects((prev) => ({
      ...prev,
      [subId]: !prev[subId],
    }))
  }

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingAvatar(true)
    try {
      // 1. Compress image to prevent Vercel 4.5MB payload limit errors
      const compressed = await compressImage(file, { maxWidth: 600, maxHeight: 600, quality: 0.85 })
      const formData = new FormData()
      formData.append("file", compressed)

      // 2. Primary upload route: dedicated /api/user/upload
      let uploadedUrl = null
      try {
        const res = await fetch("/api/user/upload", {
          method: "POST",
          body: formData,
        })
        if (res.ok) {
          const data = await res.json()
          if (data?.url) uploadedUrl = data.url
        }
      } catch (userUploadErr) {
        console.warn("Primary user upload endpoint error, trying fallback...", userUploadErr)
      }

      // 3. Fallback to /api/admin/upload if needed
      if (!uploadedUrl) {
        try {
          const fallbackRes = await fetch("/api/admin/upload", {
            method: "POST",
            body: formData,
          })
          if (fallbackRes.ok) {
            const data = await fallbackRes.json()
            if (data?.url) uploadedUrl = data.url
          }
        } catch (adminUploadErr) {
          console.warn("Fallback admin upload endpoint error:", adminUploadErr)
        }
      }

      // 4. Ultra-fallback: direct inline base64 data URI so user is never blocked
      if (!uploadedUrl) {
        uploadedUrl = await fileToDataUrl(compressed)
      }

      setAvatarUrl(uploadedUrl)

      // Auto-persist directly to user profile in DB so it takes effect immediately
      try {
        const updateRes = await fetch("/api/user/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar_url: uploadedUrl,
          }),
        })
        if (updateRes.ok) {
          const updateData = await updateRes.json()
          if (updateData?.user) {
            setUser(updateData.user)
          } else {
            setUser((prev) => ({ ...prev, avatar_url: uploadedUrl }))
          }
        }
      } catch (saveErr) {
        console.warn("Direct avatar update error:", saveErr)
      }

      toast("Profile photo updated successfully.")
    } catch (err) {
      console.error("[Avatar Upload Error]", err)
      toast("Failed to process image. Please try another photo.")
    } finally {
      setUploadingAvatar(false)
    }
  }

  useEffect(() => {
    // Fetch dropdown data for the edit modal
    fetch("/api/admin/master-data/dropdowns")
      .then(res => {
        if (!res.ok) return null
        return res.json()
      })
      .then(data => {
        if (data && data.examinations) setDropdownData(data)
      })
      .catch(() => { })
  }, [])

  useEffect(() => {
    if (user.role === 'student' && user.id) {
      setLoadingActivities(true)
      fetch(`/api/student/activities?studentId=${user.id}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && data.activities) {
            setActivities(data.activities)
          }
        })
        .catch(() => { })
        .finally(() => setLoadingActivities(false))
    }
  }, [user.id, user.role])

  useEffect(() => {
    if (user.role === 'student' && user.id) {
      setLoadingAnalytics(true)
      fetch(`/api/users/${user.id}/analytics?_t=${Date.now()}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache, no-store" },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.success) {
            setAnalyticsData(data)
          }
        })
        .catch((err) => console.error("Failed to load user analytics:", err))
        .finally(() => setLoadingAnalytics(false))
    }
  }, [user.id, user.role])

  function formatActivityTime(dateStr) {
    if (!dateStr) return ""
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`
    if (diffHrs < 24) return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    if (diffDays === 1) return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

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

  const openEditModal = () => {
    let fName = user.first_name || ""
    let lName = user.last_name || ""
    let mName = user.middle_name || ""
    let sName = user.suffix || ""

    if (!fName && user.name) {
      const parts = user.name.trim().split(" ")
      if (parts.length === 1) {
        fName = parts[0]
      } else if (parts.length === 2) {
        fName = parts[0]
        lName = parts[1]
      } else {
        fName = parts[0]
        mName = parts.slice(1, -1).join(" ")
        lName = parts[parts.length - 1]
      }
    }

    setFirstName(fName)
    setMiddleName(mName)
    setLastName(lName)
    setSuffix(sName)
    setBirthday(user.birthday ? new Date(user.birthday).toISOString().split('T')[0] : "")
    setGender(user.gender || "")
    setPhone(user.phone || "")
    setPersonalEmail(user.personal_email || "")
    setAddress(user.address || "")
    setCity(user.city || "")
    setProvince(user.province || "")
    setZipCode(user.zip_code || "")
    setEmail(user.email || "")
    setRole(user.role || "student")
    setJobRoleDescription(user.job_role_description || "")
    setSchoolId(user.school_id ? user.school_id.toString() : "")
    setAcademicCourseId(user.academic_course_id ? user.academic_course_id.toString() : "")
    setYearGraduated(user.year_graduated || "")
    setHighestEducation(user.highest_education || "")
    setExamId(user.exam_id ? user.exam_id.toString() : "")
    setBatchId(user.batch_id ? user.batch_id.toString() : "")
    setProgramId(user.program_id ? user.program_id.toString() : "")
    setMajorId(user.major_id ? user.major_id.toString() : "")
    setAvatarUrl(user.avatar_url || "")
    setNewPassword("")
    setConfirmPassword("")
    setError("")
    setIsEditing(true)
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
      const payload = {
        userId: user.id,
        name: fullName,
        email,
        role,
        password: newPassword?.trim() ? newPassword.trim() : undefined,
        first_name: firstName || null,
        middle_name: middleName || null,
        last_name: lastName || null,
        suffix: suffix || null,
        birthday: birthday || null,
        gender: gender || null,
        phone: phone || null,
        personal_email: personalEmail || null,
        address: address || null,
        city: city || null,
        province: province || null,
        zip_code: zipCode || null,
        school_id: schoolId && schoolId !== "none" ? parseInt(schoolId) : null,
        academic_course_id: academicCourseId && academicCourseId !== "none" ? parseInt(academicCourseId) : null,
        year_graduated: yearGraduated || null,
        highest_education: highestEducation && highestEducation !== "none" ? highestEducation : null,
        exam_id: !["admin", "super_admin", "academic_admin", "registrar"].includes(role) && examId && examId !== "none" ? parseInt(examId) : null,
        batch_id: !["admin", "super_admin", "academic_admin", "registrar"].includes(role) && batchId && batchId !== "none" ? parseInt(batchId) : null,
        program_id: !["admin", "super_admin", "academic_admin", "registrar"].includes(role) && programId && programId !== "none" ? parseInt(programId) : null,
        major_id: !["admin", "super_admin", "academic_admin", "registrar"].includes(role) && majorId && majorId !== "none" ? parseInt(majorId) : null,
        job_role_description: ["admin", "super_admin", "academic_admin", "registrar"].includes(role) ? jobRoleDescription : null,
        avatar_url: avatarUrl || null,
      }

      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || "Failed to update profile details.")
      }

      const updated = await res.json()
      setUser(updated.user)
      setIsEditing(false)
      toast("Successfully updated profile details.")
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
      {/* Profile Header (Stretched) */}
      <div className="relative overflow-hidden w-full bg-card border-b border-border">
        {/* Banner with Illustrative Pattern from SVG */}
        <div
          className="h-52 md:h-64 w-full bg-cover bg-center relative"
          style={{ backgroundImage: "url('/images/image0_1850_4352.jpg')" }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </div>

        {/* Profile Info Row */}
        <div className="px-6 md:px-10 pb-6 pt-0 relative flex flex-col items-center gap-3 -mt-16 md:-mt-20 z-10 text-center">

          {/* Avatar (overlapping the banner) */}
          <div className="relative h-32 w-32 md:h-36 md:w-36 rounded-full border-4 border-card bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden z-20 shrink-0 shadow-sm">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={user.name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-4xl font-bold text-slate-600 dark:text-slate-200">
                {getAvatarInitial(user.name)}
              </span>
            )}
          </div>

          {/* Details */}
          <div className="space-y-1">
            <div className="flex flex-col items-center gap-1">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
                {user.name}
              </h1>
              {user.role !== 'student' || showBackBtn ? (
                <div className="flex justify-center items-center gap-2">
                  <span className={`inline-flex items-center rounded-full px-3 py-0.5 text-xs font-medium uppercase tracking-wider ${isAdminRole(user.role) ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                    (user.role === 'teacher' || user.role === 'teachers') ? 'bg-teal-50 text-teal-700 border border-teal-100' :
                      'bg-blue-50 text-[#E9C46A] border border-blue-100/80'
                    }`}>
                    {user.role_name || (user.role === 'registar' ? 'Registrar' : user.role)}
                  </span>
                </div>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground font-medium pt-0.5">
              Logins: {user.login_count || 1} · Last login: {formatActivityTime(user.last_login_at || user.created_at)}
            </p>

            {/* Edit Profile button (functional for both student and admin) */}
            <div className="pt-2">
              <button
                type="button"
                onClick={openEditModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#3B3B3B] dark:text-gray-200 hover:text-black dark:hover:text-white bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15 rounded-xl border border-black/5 dark:border-white/10 transition-all cursor-pointer shadow-2xs active:scale-95"
              >
                <Edit className="size-3.5" />
                <span>Edit Profile</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sticky Minimal Sub-nav Tabs (NO Blue Highlight) */}
        <div className="border-t border-border bg-card backdrop-blur-md px-6 py-3 flex justify-center gap-8 sticky top-0 z-30">
          <button
            onClick={() => handleTabClick("info")}
            type="button"
            className={`text-sm font-medium tracking-wide transition-all pb-1.5 border-b-2 cursor-pointer ${activeTab === "info"
              ? "border-slate-800 text-slate-900 font-semibold dark:border-slate-100 dark:text-white"
              : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
          >
            Overview
          </button>

          {user.role === 'student' && (
            <>
              <button
                onClick={() => handleTabClick("analytics")}
                type="button"
                className={`text-sm font-medium tracking-wide transition-all pb-1.5 border-b-2 cursor-pointer ${activeTab === "analytics"
                  ? "border-slate-800 text-slate-900 font-semibold dark:border-slate-100 dark:text-white"
                  : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
              >
                Analytical Overview
              </button>

              <button
                onClick={() => handleTabClick("history")}
                type="button"
                className={`text-sm font-medium tracking-wide transition-all pb-1.5 border-b-2 cursor-pointer ${activeTab === "history"
                  ? "border-slate-800 text-slate-900 font-semibold dark:border-slate-100 dark:text-white"
                  : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
              >
                Recent Activity
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
            <div className="md:col-span-2 rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-6">
              <div className="border-b border-border pb-4">
                <h3 className="text-lg font-bold text-foreground">Personal Details</h3>
              </div>

              <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
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
                    <p className="text-[13px] text-muted-foreground font-medium">{field.label}</p>
                    <p className={`text-[15px] font-semibold text-foreground ${field.capitalize ? "capitalize" : ""}`}>{field.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact and Targets column */}
            <div className="space-y-6">
              {/* Contact Card */}
              <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-6">
                <div className="border-b border-border pb-4">
                  <h3 className="text-lg font-bold text-foreground">Contact Info</h3>
                </div>

                <div className="space-y-5">
                  <div className="space-y-1">
                    <p className="text-[13px] text-muted-foreground font-medium">Login ID</p>
                    <p className="text-[15px] font-semibold text-foreground">
                      {user.login_id || user.email || "—"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[13px] text-muted-foreground font-medium">Email Address</p>
                    <a
                      href={user.personal_email || user.email ? `mailto:${user.personal_email || user.email}` : undefined}
                      className="text-[15px] font-semibold text-[#4382DF] hover:underline break-all block"
                    >
                      {user.personal_email || user.email || "—"}
                    </a>
                  </div>
                  {user.personal_email && user.email && user.personal_email.toLowerCase().trim() !== user.email.toLowerCase().trim() && (
                    <div className="space-y-1">
                      <p className="text-[13px] text-muted-foreground font-medium">Institutional Email</p>
                      <a
                        href={`mailto:${user.email}`}
                        className="text-[15px] font-semibold text-muted-foreground hover:text-foreground hover:underline break-all block"
                      >
                        {user.email}
                      </a>
                    </div>
                  )}
                  <div className="space-y-1">
                    <p className="text-[13px] text-muted-foreground font-medium">Phone Number</p>
                    <p className="text-[15px] font-semibold text-foreground">{user.phone || "—"}</p>
                  </div>
                </div>
              </div>

              {/* Academic Target Card (For Students) */}
              {user.role === 'student' && (
                <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-6">
                  <div className="border-b border-border pb-4">
                    <h3 className="text-lg font-bold text-foreground">Academic Profile</h3>
                  </div>

                  <div className="space-y-5">
                    <div className="space-y-1">
                      <p className="text-[13px] text-muted-foreground font-medium">Target Examination</p>
                      <p className="text-[15px] font-semibold text-foreground">{examName}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[13px] text-muted-foreground font-medium">Batch / Year</p>
                      <p className="text-[15px] font-semibold text-foreground">{batchName}</p>
                    </div>
                    {(() => {
                      const effectiveEnd = user.subscription_end_date || user.batch_end_date
                      if (!effectiveEnd) return null
                      const expDate = new Date(effectiveEnd)
                      const today = new Date()
                      today.setHours(0,0,0,0)
                      const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24))
                      const dateStr = expDate.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
                      const isExpired = diffDays < 0
                      return (
                        <div className="space-y-1">
                          <p className="text-[13px] text-muted-foreground font-medium">Subscription Term</p>
                          <div className="flex items-center gap-2">
                            <p className={`text-[15px] font-semibold ${isExpired ? "text-neutral-500" : "text-foreground"}`}>
                              {dateStr}
                            </p>
                            <span className="text-xs px-2 py-0.5 rounded border border-border/40 text-neutral-600 dark:text-neutral-300">
                              {user.is_active === false ? "Account Disabled" : isExpired ? "Term Completed" : diffDays <= 7 ? `${diffDays} days left` : "Active"}
                            </span>
                          </div>
                          {user.subscription_end_date && (
                            <p className="text-[11px] text-muted-foreground">Custom individual extension</p>
                          )}
                        </div>
                      )
                    })()}
                    {programName && programName !== "—" && (
                      <div className="space-y-1">
                        <p className="text-[13px] text-muted-foreground font-medium">Program</p>
                        <p className="text-[15px] font-semibold text-foreground">{programName}</p>
                      </div>
                    )}
                    {majorName && majorName !== "—" && (
                      <div className="space-y-1">
                        <p className="text-[13px] text-muted-foreground font-medium">Specialization / Major</p>
                        <p className="text-[15px] font-semibold text-foreground">{majorName}</p>
                      </div>
                    )}
                    <div className="space-y-1">
                      <p className="text-[13px] text-muted-foreground font-medium">Enrolled</p>
                      <p className="text-[15px] font-semibold text-foreground">{formatDate(user.created_at)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Teaching Assignment Card (For Teachers) */}
              {user.role === 'teacher' && (
                <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-6">
                  <div className="border-b border-border pb-4">
                    <h3 className="text-lg font-bold text-foreground">Teaching Assignment</h3>
                  </div>

                  <div className="space-y-5">
                    <div className="space-y-1">
                      <p className="text-[13px] text-muted-foreground font-medium">Target Examination</p>
                      <p className="text-[15px] font-semibold text-foreground">{examName || "LEPT"}</p>
                    </div>
                    {programName && programName !== "—" && (
                      <div className="space-y-1">
                        <p className="text-[13px] text-muted-foreground font-medium">Course / Program</p>
                        <p className="text-[15px] font-semibold text-foreground">{programName}</p>
                      </div>
                    )}
                    {majorName && majorName !== "—" && (
                      <div className="space-y-1">
                        <p className="text-[13px] text-muted-foreground font-medium">Specialization / Major</p>
                        <p className="text-[15px] font-semibold text-foreground">{majorName}</p>
                      </div>
                    )}
                    {Array.isArray(user.targets) && user.targets.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[13px] text-muted-foreground font-medium">Assigned Categories & Courses</p>
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {user.targets.map((t, idx) => {
                            const str = String(t)
                            let label = str
                            if (str.includes("_cat_")) {
                              const catId = parseInt(str.split("_cat_")[1])
                              const cat = dropdownData.categories?.find(c => c.id === catId)
                              if (cat) label = cat.name
                            } else if (str.startsWith("cat_")) {
                              const cat = dropdownData.categories?.find(c => c.id === parseInt(str.replace("cat_", "")))
                              if (cat) label = cat.name
                            } else if (str.startsWith("exam_")) {
                              const ex = dropdownData.examinations?.find(e => e.id === parseInt(str.replace("exam_", "")))
                              if (ex) label = ex.name
                            } else if (str.startsWith("prog_")) {
                              const pg = dropdownData.programs?.find(p => p.id === parseInt(str.replace("prog_", "")))
                              if (pg) label = pg.name
                            } else if (str.startsWith("maj_")) {
                              const mj = dropdownData.majors?.find(m => m.id === parseInt(str.replace("maj_", "")))
                              if (mj) label = mj.name
                            }
                            return (
                              <span
                                key={idx}
                                className="inline-flex items-center rounded-md bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-800 border border-teal-200/60 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800"
                              >
                                {label}
                              </span>
                            )
                          })}
                        </div>
                      </div>
                    )}
                    <div className="space-y-1">
                      <p className="text-[13px] text-muted-foreground font-medium">Account Created</p>
                      <p className="text-[15px] font-semibold text-foreground">{formatDate(user.created_at)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* PANEL: ANALYTICAL OVERVIEW */}
        {user.role === 'student' && (
          <div id="profile-analytics" className="scroll-mt-24 space-y-6 border-t border-border pt-8">
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-6">
              <div className="border-b border-border pb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-foreground">Analytical Overview</h3>
                {loadingAnalytics && (
                  <span className="text-xs text-muted-foreground animate-pulse">Calculating progress…</span>
                )}
              </div>

              {(() => {
                const readiness = analyticsData?.readiness || {
                  percentage: 0,
                  target: 80,
                  ratingLabel: "FOR MONITORING",
                  badgeClass: "bg-amber-500/10 text-amber-600 border border-amber-500/25 dark:text-amber-400",
                  donutColor: "#eed48f",
                }

                // If no dynamic competencies returned yet, fallback to structure based on student program
                const defaultCompetencies = [
                  { name: "General Education", score: 0, color: "bg-[#eed48f]" },
                  { name: "Professional Education", score: 0, color: "bg-orange-500" },
                ]
                if (majorName && majorName !== "—") {
                  defaultCompetencies.push({
                    name: `Specialization (${majorName})`,
                    score: 0,
                    color: "bg-amber-500",
                  })
                }

                const rawCompetencies =
                  analyticsData?.competencies && analyticsData.competencies.length > 0
                    ? analyticsData.competencies
                    : defaultCompetencies

                // Filter competencies strictly: only include competencies matching the student's program and major
                const competencies = rawCompetencies.filter((comp) => {
                  const compNameLower = (comp.name || "").toLowerCase().trim()
                  // Always keep core Gen Ed and Prof Ed
                  if (compNameLower.includes("general") || compNameLower.includes("gen ed")) return true
                  if (compNameLower.includes("prof")) return true

                  // If student has a major (e.g. English)
                  if (majorName && majorName !== "—") {
                    const mLower = majorName.toLowerCase().trim()
                    // Match own specialization / major
                    if (compNameLower.includes(mLower)) return true
                    // Block other known major names
                    const otherMajorNames = [
                      "filipino",
                      "mathematics",
                      "math",
                      "biological",
                      "biology",
                      "physical science",
                      "values education",
                      "values",
                      "social studies",
                      "social science",
                      "mapeh",
                      "agriculture",
                      "fishery",
                      "technology",
                      "livelihood",
                      "tle",
                    ].filter((m) => !mLower.includes(m) && !m.includes(mLower))

                    if (otherMajorNames.some((om) => compNameLower.includes(om))) {
                      return false
                    }

                    // Otherwise if it's specialization/major without conflicting with another major
                    return compNameLower.includes("specializ") || compNameLower.includes("major")
                  }

                  // If student has no major (e.g. BEEd, BSNEd), exclude all specializations & other majors
                  return false
                })

                // Recalculate readiness percentage based on the active, filtered competencies
                const computedPct =
                  competencies.length > 0
                    ? Math.round(
                        competencies.reduce((acc, c) => acc + (c.score || 0), 0) /
                          competencies.length
                      )
                    : (readiness.percentage || 0)
                const readinessPct = Math.min(100, Math.max(0, computedPct))
                const radius = 40
                const circumference = 2 * Math.PI * radius
                const strokeOffset = circumference * (1 - readinessPct / 100)

                let ratingLabel = readiness.ratingLabel || "FOR MONITORING"
                let badgeClass =
                  readiness.badgeClass ||
                  "bg-amber-500/10 text-amber-600 border border-amber-500/25"
                let donutColor = readiness.donutColor || "#eed48f"

                if (computedPct >= 80) {
                  ratingLabel = "SUPERIOR / IT PREPARED"
                  badgeClass =
                    "bg-emerald-500/10 text-emerald-600 border border-emerald-500/25 dark:text-emerald-400"
                  donutColor = "#10b981"
                } else if (computedPct >= 70) {
                  ratingLabel = "ADEQUATELY PREPARED"
                  badgeClass =
                    "bg-blue-500/10 text-blue-600 border border-blue-500/25 dark:text-blue-400"
                  donutColor = "#3b82f6"
                } else if (computedPct >= 60) {
                  ratingLabel = "FOR MONITORING"
                  badgeClass =
                    "bg-amber-500/10 text-amber-600 border border-amber-500/25 dark:text-amber-400"
                  donutColor = "#eed48f"
                } else {
                  ratingLabel = "AT RISK / NEEDS REINFORCEMENT"
                  badgeClass =
                    "bg-rose-500/10 text-rose-600 border border-rose-500/25 dark:text-rose-400"
                  donutColor = "#f43f5e"
                }

                const activeComp = competencies.find(
                  (c) => (c.key || c.name) === expandedCompetency
                )

                return (
                  <div>
                    {/* Top Overview: Donut & Competency Breakdown */}
                    <div className="grid gap-8 md:grid-cols-5 items-start">
                      {/* Readiness Score Donut */}
                      <div className="md:col-span-2 flex flex-col items-center justify-center text-center md:border-r border-border md:pr-8 py-2 space-y-3">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Overall Readiness
                        </h4>

                        <div className="relative h-40 w-40 flex items-center justify-center my-1">
                          <svg className="h-full w-full transform -rotate-90" viewBox="0 0 100 100">
                            <circle
                              cx="50"
                              cy="50"
                              r={radius}
                              className="stroke-slate-100 dark:stroke-slate-800"
                              strokeWidth="8"
                              fill="transparent"
                            />
                            <circle
                              cx="50"
                              cy="50"
                              r={radius}
                              stroke={donutColor}
                              strokeWidth="8"
                              fill="transparent"
                              strokeDasharray={`${circumference}`}
                              strokeDashoffset={`${strokeOffset}`}
                              strokeLinecap="round"
                              className="transition-all duration-700 ease-out"
                            />
                          </svg>
                          <div className="absolute flex flex-col items-center">
                            <span className="text-3xl font-extrabold text-foreground">
                              {readinessPct}%
                            </span>
                            <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5">
                              Target: {readiness.target || 80}%
                            </span>
                          </div>
                        </div>

                        <span
                          className={`inline-flex items-center rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-wider transition-colors ${badgeClass}`}
                        >
                          {ratingLabel}
                        </span>
                      </div>

                      {/* Competency Breakdown */}
                      <div className="md:col-span-3 space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Competency Breakdown
                          </h4>
                          <span className="text-[11px] text-muted-foreground">
                            Click category to view details below
                          </span>
                        </div>

                        <div className="space-y-4 pt-1">
                          {competencies.map((comp) => {
                            const compKey = comp.key || comp.name
                            const isSelected = expandedCompetency === compKey

                            return (
                              <div
                                key={compKey}
                                onClick={() => toggleCompetency(compKey)}
                                className="cursor-pointer space-y-1.5 select-none"
                              >
                                <div className="flex justify-between text-sm font-medium">
                                  <span className={isSelected ? "font-bold text-foreground" : "text-foreground"}>
                                    {comp.name}
                                  </span>
                                  <span className="text-muted-foreground font-semibold">
                                    {comp.score}%
                                  </span>
                                </div>
                                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full ${comp.color || "bg-[#eed48f]"} rounded-full`}
                                    style={{ width: `${Math.min(100, Math.max(0, comp.score))}%` }}
                                  />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Detail Table Below (Outside of the category) */}
                    {activeComp && (
                      <div className="pt-6 border-t border-border mt-6 space-y-3">
                        <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          <span className="text-foreground font-bold">{activeComp.name}</span>
                          <span className="text-[11px] normal-case text-muted-foreground">
                            Click subject to view modules
                          </span>
                        </div>

                        <div className="border border-border rounded-lg overflow-hidden">
                          <div className="grid grid-cols-12 gap-4 px-4 py-2.5 bg-muted/40 text-xs font-semibold text-muted-foreground border-b border-border">
                            <div className="col-span-6 sm:col-span-6">Subject / Module</div>
                            <div className="col-span-3 sm:col-span-3">Progress</div>
                            <div className="col-span-3 sm:col-span-3">Mastery</div>
                          </div>

                          {(!activeComp.subjects || activeComp.subjects.length === 0) ? (
                            <div className="p-6 text-center text-xs text-muted-foreground">
                              No subjects found under this category.
                            </div>
                          ) : (
                            <div className="divide-y divide-border">
                              {activeComp.subjects.map((subject) => {
                                const subId = String(subject.id)
                                const isSubExpanded = !!expandedSubjects[subId]
                                const subModules = subject.modules || []

                                return (
                                  <div key={subId}>
                                    {/* Subject Row */}
                                    <div
                                      onClick={() => toggleSubject(subId)}
                                      className="grid grid-cols-12 gap-4 px-4 py-3 items-center cursor-pointer select-none"
                                    >
                                      <div className="col-span-6 sm:col-span-6 min-w-0">
                                        <div className={`text-sm text-foreground truncate ${isSubExpanded ? "font-bold" : "font-semibold"}`}>
                                          {subject.name}
                                        </div>
                                        <div className="text-[11px] text-muted-foreground">
                                          {subModules.length} {subModules.length === 1 ? "module" : "modules"}
                                        </div>
                                      </div>

                                      <div className="col-span-3 sm:col-span-3 space-y-1">
                                        <div className="text-xs font-semibold text-foreground">
                                          {subject.progressPct}%
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                          <div
                                            className="h-full bg-primary rounded-full"
                                            style={{ width: `${Math.min(100, Math.max(0, subject.progressPct))}%` }}
                                          />
                                        </div>
                                      </div>

                                      <div className="col-span-3 sm:col-span-3 text-xs text-muted-foreground">
                                        —
                                      </div>
                                    </div>

                                    {/* Modules Sub-rows */}
                                    {isSubExpanded && (
                                      <div className="bg-muted/15 border-t border-border/40 divide-y divide-border/40">
                                        {subModules.length === 0 ? (
                                          <div className="px-6 py-3 text-xs text-muted-foreground">
                                            No modules found inside this subject.
                                          </div>
                                        ) : (
                                          subModules.map((module) => {
                                            const hasAttempts = module.hasQuizAttempts
                                            const mPct = hasAttempts ? module.masteryPct : 0

                                            let masteryColor = "bg-slate-300 dark:bg-slate-700"
                                            if (hasAttempts) {
                                              if (mPct >= 80) masteryColor = "bg-emerald-500"
                                              else if (mPct >= 70) masteryColor = "bg-blue-500"
                                              else if (mPct >= 60) masteryColor = "bg-amber-500"
                                              else masteryColor = "bg-rose-500"
                                            }

                                            return (
                                              <div
                                                key={module.id}
                                                className="grid grid-cols-12 gap-4 px-4 py-2.5 items-center"
                                              >
                                                <div className="col-span-6 sm:col-span-6 pl-4 sm:pl-6 min-w-0">
                                                  <div className="text-xs font-medium text-foreground truncate">
                                                    {module.title}
                                                  </div>
                                                  <div className="text-[10px] text-muted-foreground">
                                                    {module.completedItems} / {module.totalItems} completed
                                                  </div>
                                                </div>

                                                <div className="col-span-3 sm:col-span-3 space-y-1">
                                                  <div className="text-[11px] font-semibold text-foreground">
                                                    {module.progressPct}%
                                                  </div>
                                                  <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                    <div
                                                      className="h-full bg-primary rounded-full"
                                                      style={{ width: `${Math.min(100, Math.max(0, module.progressPct))}%` }}
                                                    />
                                                  </div>
                                                </div>

                                                <div className="col-span-3 sm:col-span-3 space-y-1">
                                                  <div className="text-[11px] font-semibold text-foreground">
                                                    {hasAttempts ? `${module.masteryPct}%` : "—"}
                                                  </div>
                                                  <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                    <div
                                                      className={`h-full ${masteryColor} rounded-full`}
                                                      style={{ width: `${Math.min(100, Math.max(0, mPct))}%` }}
                                                    />
                                                  </div>
                                                </div>
                                              </div>
                                            )
                                          })
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>
          </div>
        )}

        {/* PANEL: HISTORY / RECENT ACTIVITY */}
        {user.role === 'student' && (
          <div id="profile-history" className="scroll-mt-24 space-y-6 border-t border-border pt-8">
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-6">
              <div className="border-b border-border pb-4">
                <h3 className="text-lg font-bold text-foreground">
                  Recent Activity
                </h3>
              </div>

              {loadingActivities ? (
                <div className="flex items-center justify-center py-10 text-muted-foreground text-xs gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span>Loading recent activity…</span>
                </div>
              ) : activities.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground font-medium">
                  No recent activities recorded yet. Completed quizzes and study progress will appear here.
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-6">
                    {activities.slice(0, isActivitiesExpanded ? 10 : 5).map((act, index) => (
                      <div key={act.id || index} className="flex gap-3.5 items-start">
                        <div className="mt-1.5 h-2 w-2 rounded-full flex-shrink-0 bg-black dark:bg-white" />

                        <div className="space-y-1">
                          <p className="font-semibold text-foreground text-sm leading-snug">
                            {act.title}
                          </p>
                          {act.details && (
                            <p className="text-xs text-muted-foreground font-medium">
                              {act.details}
                            </p>
                          )}
                          <p className="text-[10px] text-muted-foreground/60 font-semibold uppercase tracking-wider pt-0.5">
                            {formatActivityTime(act.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {activities.length > 5 && (
                    <div className="pt-2 flex justify-center border-t border-border/60">
                      <button
                        type="button"
                        onClick={() => setIsActivitiesExpanded(!isActivitiesExpanded)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 hover:bg-primary/5 px-4 py-2 rounded-xl transition-all cursor-pointer"
                      >
                        <span>{isActivitiesExpanded ? "Show Less" : "Show More"}</span>
                        {isActivitiesExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Edit Profile Modal Styled like Registration / Add User Dialog */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-black/10 dark:border-white/10 w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-4 animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="border-b border-black/5 dark:border-white/10 px-6 py-4 flex items-center justify-between bg-white/50 dark:bg-white/[0.02] shrink-0">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[#3B3B3B] dark:text-white">
                  Edit Profile
                </h2>
                <p className="text-xs text-[#696969] dark:text-gray-400 mt-0.5">
                  Update personal information, credentials, and profile photo for {user.name || "user"}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="rounded-xl p-1.5 hover:bg-black/5 dark:hover:bg-white/10 text-[#696969] hover:text-[#3B3B3B] dark:hover:text-white transition-all cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto p-6 max-h-[75vh] space-y-6 bg-white dark:bg-[#1E1E1E]">
              {error && (
                <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive font-medium flex items-center gap-2">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* ═══ Personal Information ═══ */}
              <section className="space-y-4">
                <div className="flex items-center gap-2.5 pt-1">
                  <User className="size-4.5 text-[#696969]" />
                  <h3 className="text-base font-bold uppercase tracking-wider text-[#3B3B3B] dark:text-white">
                    Personal Information
                  </h3>
                </div>

                {/* Avatar Upload */}
                <div className="flex items-center gap-4 py-1">
                  <div className="relative size-16 rounded-full bg-white dark:bg-white/10 border border-black/10 dark:border-white/15 flex items-center justify-center overflow-hidden shadow-2xs shrink-0">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar Preview" className="h-full w-full object-cover" />
                    ) : (
                      <User className="size-7 text-[#696969]" />
                    )}
                    {uploadingAvatar && (
                      <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                        <span className="size-4 animate-spin rounded-full border-2 border-[#E9C46A] border-t-transparent" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="edit-avatar-file" className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl bg-white dark:bg-white/10 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-[#3B3B3B] dark:text-white hover:bg-black/5 dark:hover:bg-white/15 border border-black/5 dark:border-white/10 transition-all shadow-2xs">
                      Upload Photo
                    </Label>
                    <input
                      id="edit-avatar-file"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                    />
                    <p className="text-xs text-[#696969]">JPG, PNG or WEBP (Max 2MB)</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-first-name" className="text-sm font-semibold text-[#696969]">First Name *</Label>
                    <input
                      id="edit-first-name"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Juan"
                      className="w-full h-10.5 px-3.5 text-sm rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/10 text-[#3B3B3B] dark:text-white placeholder:text-[#696969]/50 focus:outline-none focus:ring-1.5 focus:ring-black/15 shadow-2xs transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-middle-name" className="text-sm font-semibold text-[#696969]">Middle Name</Label>
                    <input
                      id="edit-middle-name"
                      value={middleName}
                      onChange={(e) => setMiddleName(e.target.value)}
                      placeholder="Santos"
                      className="w-full h-10.5 px-3.5 text-sm rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/10 text-[#3B3B3B] dark:text-white placeholder:text-[#696969]/50 focus:outline-none focus:ring-1.5 focus:ring-black/15 shadow-2xs transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-last-name" className="text-sm font-semibold text-[#696969]">Last Name *</Label>
                    <input
                      id="edit-last-name"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Dela Cruz"
                      className="w-full h-10.5 px-3.5 text-sm rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/10 text-[#3B3B3B] dark:text-white placeholder:text-[#696969]/50 focus:outline-none focus:ring-1.5 focus:ring-black/15 shadow-2xs transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-suffix" className="text-sm font-semibold text-[#696969]">Suffix</Label>
                    <input
                      id="edit-suffix"
                      value={suffix}
                      onChange={(e) => setSuffix(e.target.value)}
                      placeholder="Jr., III"
                      className="w-full h-10.5 px-3.5 text-sm rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/10 text-[#3B3B3B] dark:text-white placeholder:text-[#696969]/50 focus:outline-none focus:ring-1.5 focus:ring-black/15 shadow-2xs transition-all"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-birthday" className="text-sm font-semibold text-[#696969]">Birthday</Label>
                    <input
                      id="edit-birthday"
                      type="date"
                      value={birthday}
                      onChange={(e) => setBirthday(e.target.value)}
                      className="w-full h-10.5 px-3.5 text-sm rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/10 text-[#3B3B3B] dark:text-white focus:outline-none focus:ring-1.5 focus:ring-black/15 shadow-2xs transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold text-[#696969]">Gender</Label>
                    <Select value={gender || "none"} onValueChange={(val) => setGender(val === "none" ? "" : val)}>
                      <SelectTrigger className="w-full h-10.5 rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/10 text-sm text-[#3B3B3B] dark:text-white shadow-2xs">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-slate-900 shadow-xl">
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                        <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-phone" className="text-sm font-semibold text-[#696969]">Phone Number</Label>
                    <input
                      id="edit-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+63 9XX XXX XXXX"
                      className="w-full h-10.5 px-3.5 text-sm rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/10 text-[#3B3B3B] dark:text-white placeholder:text-[#696969]/50 focus:outline-none focus:ring-1.5 focus:ring-black/15 shadow-2xs transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-personal-email" className="text-sm font-semibold text-[#696969]">Personal Email</Label>
                    <input
                      id="edit-personal-email"
                      type="email"
                      value={personalEmail}
                      onChange={(e) => setPersonalEmail(e.target.value)}
                      placeholder="personal@gmail.com"
                      className="w-full h-10.5 px-3.5 text-sm rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/10 text-[#3B3B3B] dark:text-white placeholder:text-[#696969]/50 focus:outline-none focus:ring-1.5 focus:ring-black/15 shadow-2xs transition-all"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="edit-address" className="text-sm font-semibold text-[#696969]">Street Address</Label>
                    <input
                      id="edit-address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="123 Main St., Barangay Example"
                      className="w-full h-10.5 px-3.5 text-sm rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/10 text-[#3B3B3B] dark:text-white placeholder:text-[#696969]/50 focus:outline-none focus:ring-1.5 focus:ring-black/15 shadow-2xs transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-city" className="text-sm font-semibold text-[#696969]">City / Municipality</Label>
                    <input
                      id="edit-city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Quezon City"
                      className="w-full h-10.5 px-3.5 text-sm rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/10 text-[#3B3B3B] dark:text-white placeholder:text-[#696969]/50 focus:outline-none focus:ring-1.5 focus:ring-black/15 shadow-2xs transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-province" className="text-sm font-semibold text-[#696969]">Province</Label>
                      <input
                        id="edit-province"
                        value={province}
                        onChange={(e) => setProvince(e.target.value)}
                        placeholder="Metro Manila"
                        className="w-full h-10.5 px-3.5 text-sm rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/10 text-[#3B3B3B] dark:text-white placeholder:text-[#696969]/50 focus:outline-none focus:ring-1.5 focus:ring-black/15 shadow-2xs transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-zip" className="text-sm font-semibold text-[#696969]">ZIP Code</Label>
                      <input
                        id="edit-zip"
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value)}
                        placeholder="1100"
                        className="w-full h-10.5 px-3.5 text-sm rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/10 text-[#3B3B3B] dark:text-white placeholder:text-[#696969]/50 focus:outline-none focus:ring-1.5 focus:ring-black/15 shadow-2xs transition-all"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* ═══ Education Background ═══ */}
              <section className="space-y-4 pt-6 border-t border-black/5 dark:border-white/10">
                <div className="flex items-center gap-2.5 pt-1">
                  <GraduationCap className="size-4.5 text-[#696969]" />
                  <h3 className="text-base font-bold uppercase tracking-wider text-[#3B3B3B] dark:text-white">
                    Education Background
                  </h3>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold text-[#696969]">School / University</Label>
                    <Select value={schoolId || "none"} onValueChange={(val) => setSchoolId(val === "none" ? "" : val)}>
                      <SelectTrigger className="w-full h-10.5 rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/10 text-sm text-[#3B3B3B] dark:text-white shadow-2xs">
                        <SelectValue placeholder="Select School" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-slate-900 shadow-xl">
                        <SelectItem value="none">None</SelectItem>
                        {dropdownData.schools.map(s => (
                          <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold text-[#696969]">Highest Education</Label>
                    <Select value={highestEducation || ""} onValueChange={(val) => setHighestEducation(val === "none" ? "" : val)}>
                      <SelectTrigger className="w-full h-10.5 rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/10 text-sm text-[#3B3B3B] dark:text-white shadow-2xs">
                        <SelectValue placeholder="Select Education" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-slate-900 shadow-xl">
                        <SelectItem value="Bachelor's Degree">Bachelor&apos;s Degree</SelectItem>
                        <SelectItem value="Master's Degree">Master&apos;s Degree</SelectItem>
                        <SelectItem value="Doctorate Degree">Doctorate Degree</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold text-[#696969]">Course / Program</Label>
                    <Select value={academicCourseId || "none"} onValueChange={(val) => setAcademicCourseId(val === "none" ? "" : val)}>
                      <SelectTrigger className="w-full h-10.5 rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/10 text-sm text-[#3B3B3B] dark:text-white shadow-2xs">
                        <SelectValue placeholder="Select Course" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-slate-900 shadow-xl">
                        <SelectItem value="none">None</SelectItem>
                        {dropdownData.academic_courses.map(c => (
                          <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-year-grad" className="text-sm font-semibold text-[#696969]">Year Graduated</Label>
                    <input
                      id="edit-year-grad"
                      type="number"
                      min="1950"
                      max="2099"
                      value={yearGraduated}
                      onChange={(e) => setYearGraduated(e.target.value)}
                      placeholder="2024"
                      className="w-full h-10.5 px-3.5 text-sm rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/10 text-[#3B3B3B] dark:text-white placeholder:text-[#696969]/50 focus:outline-none focus:ring-1.5 focus:ring-black/15 shadow-2xs transition-all"
                    />
                  </div>
                </div>
              </section>

              {/* ═══ Academic Targets (Teacher & Students) ═══ */}
              {role === "teacher" && (
                <section className="space-y-4 pt-6 border-t border-black/5 dark:border-white/10">
                  <div className="flex items-center gap-2.5 pt-1">
                    <BookOpen className="size-4.5 text-[#696969]" />
                    <h3 className="text-base font-bold uppercase tracking-wider text-[#3B3B3B] dark:text-white">
                      Teaching Assignment
                    </h3>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold text-[#696969]">Assigned Examination (e.g. LEPT)</Label>
                    <Select value={examId || "none"} onValueChange={(val) => { setExamId(val === "none" ? "" : val); setProgramId(""); setMajorId(""); }}>
                      <SelectTrigger className="w-full h-10.5 rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/10 text-sm text-[#3B3B3B] dark:text-white shadow-2xs">
                        <SelectValue placeholder="Select Exam" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-slate-900 shadow-xl">
                        <SelectItem value="none">None</SelectItem>
                        {dropdownData.examinations.map(e => (
                          <SelectItem key={e.id} value={e.id.toString()}>{e.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-[#696969]">
                      Curriculum modules and categories will correspond to this examination.
                    </p>
                  </div>
                </section>
              )}

              {role === "student" && (
                <section className="space-y-4 pt-6 border-t border-black/5 dark:border-white/10">
                  <div className="flex items-center gap-2.5 pt-1">
                    <BookOpen className="size-4.5 text-[#696969]" />
                    <h3 className="text-base font-bold uppercase tracking-wider text-[#3B3B3B] dark:text-white">
                      Academic Details
                    </h3>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-semibold text-[#696969]">Target Examination</Label>
                      <Select value={examId || "none"} onValueChange={(val) => { setExamId(val === "none" ? "" : val); setProgramId(""); setMajorId(""); }}>
                        <SelectTrigger className="w-full h-10.5 rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/10 text-sm text-[#3B3B3B] dark:text-white shadow-2xs">
                          <SelectValue placeholder="Select Exam" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-slate-900 shadow-xl">
                          <SelectItem value="none">None</SelectItem>
                          {dropdownData.examinations.map(e => (
                            <SelectItem key={e.id} value={e.id.toString()}>{e.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-sm font-semibold text-[#696969]">Batch / Review Year</Label>
                      <Select value={batchId || "none"} onValueChange={(val) => setBatchId(val === "none" ? "" : val)}>
                        <SelectTrigger className="w-full h-10.5 rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/10 text-sm text-[#3B3B3B] dark:text-white shadow-2xs">
                          <SelectValue placeholder="Select Batch" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-slate-900 shadow-xl">
                          <SelectItem value="none">None</SelectItem>
                          {dropdownData.batches
                            .filter(b => !examId || b.exam_id.toString() === examId)
                            .map(b => (
                              <SelectItem key={b.id} value={b.id.toString()}>{b.name} ({b.target_year})</SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {examId && dropdownData.programs?.some(p => p.exam_id.toString() === examId) && (
                      <div className="space-y-1.5">
                        <Label className="text-sm font-semibold text-[#696969]">Course / Program</Label>
                        <Select value={programId || "none"} onValueChange={(val) => { setProgramId(val === "none" ? "" : val); setMajorId(""); }}>
                          <SelectTrigger className="w-full h-10.5 rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/10 text-sm text-[#3B3B3B] dark:text-white shadow-2xs">
                            <SelectValue placeholder="Select Program" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-slate-900 shadow-xl">
                            <SelectItem value="none">None</SelectItem>
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
                        <Label className="text-sm font-semibold text-[#696969]">Specialization / Major</Label>
                        <Select value={majorId || "none"} onValueChange={(val) => setMajorId(val === "none" ? "" : val)}>
                          <SelectTrigger className="w-full h-10.5 rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/10 text-sm text-[#3B3B3B] dark:text-white shadow-2xs">
                            <SelectValue placeholder="Select Major" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-slate-900 shadow-xl">
                            <SelectItem value="none">None</SelectItem>
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
                </section>
              )}

              {/* ═══ Administrative Role (Admin / Staff) ═══ */}
              {["admin", "super_admin", "academic_admin", "registrar"].includes(role) && (
                <section className="space-y-4 pt-6 border-t border-black/5 dark:border-white/10">
                  <div className="flex items-center gap-2.5 pt-1">
                    <Shield className="size-4.5 text-[#696969]" />
                    <h3 className="text-base font-bold uppercase tracking-wider text-[#3B3B3B] dark:text-white">
                      Administrative Role
                    </h3>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-semibold text-[#696969]">Assigned Role</Label>
                      <input
                        type="text"
                        readOnly
                        disabled
                        value={user.role}
                        className="w-full h-10.5 px-3.5 text-sm rounded-xl border border-black/5 dark:border-white/10 bg-black/[0.03] dark:bg-white/5 text-[#3B3B3B] dark:text-white uppercase cursor-not-allowed shadow-2xs font-semibold"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="admin-job-role-desc" className="text-sm font-semibold text-[#696969]">Job Description / Responsibility</Label>
                      <input
                        id="admin-job-role-desc"
                        value={jobRoleDescription}
                        onChange={(e) => setJobRoleDescription(e.target.value)}
                        placeholder="e.g. Lead Administrator, System Operations"
                        className="w-full h-10.5 px-3.5 text-sm rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/10 text-[#3B3B3B] dark:text-white placeholder:text-[#696969]/50 focus:outline-none focus:ring-1.5 focus:ring-black/15 shadow-2xs transition-all"
                      />
                    </div>
                  </div>
                </section>
              )}

              {/* ═══ Account Details ═══ */}
              <section className="space-y-4 pt-6 border-t border-black/5 dark:border-white/10">
                <div className="flex items-center gap-2.5 pt-1">
                  <Shield className="size-4.5 text-[#696969]" />
                  <h3 className="text-base font-bold uppercase tracking-wider text-[#3B3B3B] dark:text-white">
                    Account Details
                  </h3>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <Label htmlFor="account-login-id" className="text-sm font-semibold text-[#696969]">Login ID</Label>
                      <TooltipProvider delayDuration={150}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              className="text-[#696969] hover:text-[#3B3B3B] dark:hover:text-white transition-colors cursor-pointer inline-flex items-center justify-center"
                              aria-label="Login ID information"
                            >
                              <Info className="size-3.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            Permanent identifier used for logging into the portal.
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <input
                      id="account-login-id"
                      type="text"
                      readOnly
                      disabled
                      value={user.login_id || user.email || "—"}
                      className="w-full h-10.5 px-3.5 text-sm rounded-xl border border-black/5 dark:border-white/10 bg-black/[0.03] dark:bg-white/5 text-[#3B3B3B] dark:text-white cursor-not-allowed shadow-2xs font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="account-email" className="text-sm font-semibold text-[#696969]">Account Email *</Label>
                    <input
                      id="account-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="account@email.com"
                      className="w-full h-10.5 px-3.5 text-sm rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/10 text-[#3B3B3B] dark:text-white placeholder:text-[#696969]/50 focus:outline-none focus:ring-1.5 focus:ring-black/15 shadow-2xs transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="edit-new-password" className="text-sm font-semibold text-[#696969]">New Password (Optional)</Label>
                    <div className="relative">
                      <input
                        id="edit-new-password"
                        type={showPassword ? "text" : "password"}
                        minLength={6}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Leave blank to keep current password"
                        className="w-full h-10.5 pl-3.5 pr-10 text-sm rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/10 text-[#3B3B3B] dark:text-white placeholder:text-[#696969]/50 focus:outline-none focus:ring-1.5 focus:ring-black/15 shadow-2xs transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#696969] hover:text-[#3B3B3B] dark:hover:text-white transition-colors cursor-pointer p-0.5"
                        title={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="edit-confirm-password" className="text-sm font-semibold text-[#696969]">Confirm New Password</Label>
                    <div className="relative">
                      <input
                        id="edit-confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        minLength={6}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Leave blank to keep current password"
                        className="w-full h-10.5 pl-3.5 pr-10 text-sm rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/10 text-[#3B3B3B] dark:text-white placeholder:text-[#696969]/50 focus:outline-none focus:ring-1.5 focus:ring-black/15 shadow-2xs transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#696969] hover:text-[#3B3B3B] dark:hover:text-white transition-colors cursor-pointer p-0.5"
                        title={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                        {showConfirmPassword ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            </form>

            {/* Footer Actions matching Registration / Add User Dialog */}
            <div className="border-t border-black/5 dark:border-white/10 px-6 py-4 flex items-center justify-end gap-2.5 bg-white/50 dark:bg-white/[0.02] shrink-0">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#696969] hover:text-[#3B3B3B] dark:text-gray-400 dark:hover:text-white bg-white dark:bg-white/10 border border-black/5 dark:border-white/10 transition-all shadow-2xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEditSubmit}
                disabled={saving}
                className="bg-[#E9C46A] hover:bg-[#dfb550] disabled:opacity-50 text-white text-xs font-semibold px-5 py-2 rounded-xl shadow-2xs transition-all flex items-center justify-center cursor-pointer"
              >
                {saving ? (
                  <>
                    <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent mr-1.5" />
                    Saving…
                  </>
                ) : (
                  <span>Save Changes</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}