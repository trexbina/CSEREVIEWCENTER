"use client"

import { useState, useEffect } from "react"
import {
  User,
  GraduationCap,
  Shield,
  X,
  Eye,
  EyeOff,
  Info,
  UserPlus,
  Loader2,
} from "lucide-react"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/toast"
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

export default function AddAdminUserDialog({
  isOpen,
  onClose,
  roles = [],
  onUserCreated,
}) {
  // ── Personal Information ──
  const [firstName, setFirstName] = useState("")
  const [middleName, setMiddleName] = useState("")
  const [lastName, setLastName] = useState("")
  const [suffix, setSuffix] = useState("")
  const [birthday, setBirthday] = useState("")
  const [gender, setGender] = useState("")
  const [phone, setPhone] = useState("")
  const [personalEmail, setPersonalEmail] = useState("")
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")
  const [province, setProvince] = useState("")
  const [zipCode, setZipCode] = useState("")

  // ── Avatar ──
  const [avatarUrl, setAvatarUrl] = useState("")
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  // ── Education ──
  const [schoolId, setSchoolId] = useState("")
  const [highestEducation, setHighestEducation] = useState("")
  const [academicCourseId, setAcademicCourseId] = useState("")
  const [yearGraduated, setYearGraduated] = useState("")

  // ── Account Details ──
  const [loginIdPreview, setLoginIdPreview] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [selectedRole, setSelectedRole] = useState("super_admin")
  const [jobRoleDescription, setJobRoleDescription] = useState("")

  // ── System State ──
  const [dropdownData, setDropdownData] = useState({
    schools: [],
    academic_courses: [],
  })
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  // Fetch schools and academic courses dropdown data
  useEffect(() => {
    if (isOpen) {
      fetch("/api/admin/master-data/dropdowns")
        .then((res) => res.json())
        .then((data) => {
          if (data) {
            setDropdownData({
              schools: data.schools || [],
              academic_courses: data.academic_courses || [],
            })
          }
        })
        .catch(console.error)
    }
  }, [isOpen])

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setFirstName("")
      setMiddleName("")
      setLastName("")
      setSuffix("")
      setBirthday("")
      setGender("")
      setPhone("")
      setPersonalEmail("")
      setAddress("")
      setCity("")
      setProvince("")
      setZipCode("")
      setAvatarUrl("")
      setSchoolId("")
      setHighestEducation("")
      setAcademicCourseId("")
      setYearGraduated("")
      setPassword("")
      setConfirmPassword("")
      setShowPassword(false)
      setShowConfirmPassword(false)
      setJobRoleDescription("")
      setError("")
      setSaving(false)

      // Set default selected role
      const defaultRole = roles.find((r) => r.role_key === "super_admin")?.role_key ||
        roles.find((r) => !["student", "teacher"].includes(r.role_key))?.role_key ||
        "super_admin"
      setSelectedRole(defaultRole)
    }
  }, [isOpen, roles])

  // Live preview of the automatic Login ID
  useEffect(() => {
    if (!isOpen) return
    const fullName = [firstName, middleName, lastName, suffix].filter(Boolean).join(" ")
    const params = new URLSearchParams({
      lastName: lastName || "",
      name: fullName || "",
      role: selectedRole || "super_admin",
    })
    fetch(`/api/admin/users/next-sequence?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.loginId) {
          setLoginIdPreview(data.loginId)
        }
      })
      .catch(console.error)
  }, [isOpen, lastName, firstName, middleName, suffix, selectedRole])

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
      toast("Failed to upload image.")
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    if (!firstName.trim() || !lastName.trim()) {
      setError("First and last name are required.")
      return
    }

    if (!password) {
      setError("Password is required.")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    if (!selectedRole) {
      setError("Please select an administrative role.")
      return
    }

    setSaving(true)

    const fullName = [firstName, middleName, lastName, suffix]
      .filter(Boolean)
      .join(" ")
      .trim()

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fullName,
          email: personalEmail || undefined,
          personal_email: personalEmail || null,
          password,
          role: selectedRole,
          first_name: firstName.trim(),
          middle_name: middleName.trim() || null,
          last_name: lastName.trim(),
          suffix: suffix.trim() || null,
          birthday: birthday || null,
          gender: gender || null,
          phone: phone || null,
          address: address || null,
          city: city || null,
          province: province || null,
          zip_code: zipCode || null,
          school_id: schoolId ? parseInt(schoolId, 10) : null,
          academic_course_id: academicCourseId ? parseInt(academicCourseId, 10) : null,
          year_graduated: yearGraduated || null,
          highest_education: highestEducation || null,
          job_role_description: jobRoleDescription.trim() || null,
          avatar_url: avatarUrl || null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Failed to create administrator account.")
        setSaving(false)
        return
      }

      toast("Successfully created administrator account.")
      if (onUserCreated) {
        await onUserCreated()
      }
      onClose()
    } catch (err) {
      console.error("Create admin error:", err)
      setError(err.message || "Something went wrong.")
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  // Collect available admin roles (system defaults + custom roles from Master Data)
  const systemAdminRoles = [
    { role_key: "super_admin", name: "Super Admin (System Owner)" },
    { role_key: "academic_admin", name: "Academic Coordinator (Curriculum & Exams)" },
    { role_key: "registrar", name: "Registrar (Students & Admissions)" },
  ]

  const customRoles = roles.filter(
    (r) => !["super_admin", "academic_admin", "registrar", "student", "teacher", "admin"].includes(r.role_key)
  )

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1E293B] border border-black/10 dark:border-white/10 rounded-2xl max-w-3xl w-full shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/5 dark:border-white/10 shrink-0 bg-white/50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-[#E9C46A]/15 text-[#b08826] dark:text-[#E9C46A] flex items-center justify-center">
              <UserPlus className="size-4.5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#3B3B3B] dark:text-white">
                Add New Admin User
              </h2>
              <p className="text-xs text-[#696969] dark:text-gray-400">
                Create and configure an administrator account with dashboard access.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-[#3B3B3B] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto px-6 py-5 space-y-6 flex-1">
          {error && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs sm:text-sm text-destructive font-medium">
              {error}
            </div>
          )}

          {/* ═══ Personal Information ═══ */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 pt-1">
              <User className="size-4 text-[#696969]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#3B3B3B] dark:text-white">
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
                <Label
                  htmlFor="admin-avatar-file"
                  className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl bg-white dark:bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-[#3B3B3B] dark:text-white hover:bg-neutral-50 dark:hover:bg-white/15 border border-black/10 dark:border-white/10 transition-all shadow-2xs"
                >
                  Upload Photo
                </Label>
                <input
                  id="admin-avatar-file"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
                <p className="text-[11px] text-[#696969] dark:text-gray-400">JPG, PNG or WEBP (Max 2MB)</p>
              </div>
            </div>

            <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1.5">
                <Label htmlFor="admin-first-name" className="text-xs font-semibold text-[#696969]">First Name *</Label>
                <input
                  id="admin-first-name"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Juan"
                  className="w-full h-9 px-3 text-xs rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/5 text-[#3B3B3B] dark:text-white placeholder:text-[#696969]/50 focus:outline-none focus:ring-1.5 focus:ring-[#E9C46A] shadow-2xs transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="admin-middle-name" className="text-xs font-semibold text-[#696969]">Middle Name</Label>
                <input
                  id="admin-middle-name"
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value)}
                  placeholder="Santos"
                  className="w-full h-9 px-3 text-xs rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/5 text-[#3B3B3B] dark:text-white placeholder:text-[#696969]/50 focus:outline-none focus:ring-1.5 focus:ring-[#E9C46A] shadow-2xs transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="admin-last-name" className="text-xs font-semibold text-[#696969]">Last Name *</Label>
                <input
                  id="admin-last-name"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Dela Cruz"
                  className="w-full h-9 px-3 text-xs rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/5 text-[#3B3B3B] dark:text-white placeholder:text-[#696969]/50 focus:outline-none focus:ring-1.5 focus:ring-[#E9C46A] shadow-2xs transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="admin-suffix" className="text-xs font-semibold text-[#696969]">Suffix</Label>
                <input
                  id="admin-suffix"
                  value={suffix}
                  onChange={(e) => setSuffix(e.target.value)}
                  placeholder="Jr., III"
                  className="w-full h-9 px-3 text-xs rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/5 text-[#3B3B3B] dark:text-white placeholder:text-[#696969]/50 focus:outline-none focus:ring-1.5 focus:ring-[#E9C46A] shadow-2xs transition-all"
                />
              </div>
            </div>

            <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1.5">
                <Label htmlFor="admin-birthday" className="text-xs font-semibold text-[#696969]">Birthday</Label>
                <input
                  id="admin-birthday"
                  type="date"
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                  className="w-full h-9 px-3 text-xs rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/5 text-[#3B3B3B] dark:text-white focus:outline-none focus:ring-1.5 focus:ring-[#E9C46A] shadow-2xs transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#696969]">Gender</Label>
                <Select value={gender || "none"} onValueChange={(val) => setGender(val === "none" ? "" : val)}>
                  <SelectTrigger className="w-full h-9 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/5 text-xs text-[#3B3B3B] dark:text-white shadow-2xs">
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
                <Label htmlFor="admin-phone" className="text-xs font-semibold text-[#696969]">Phone Number</Label>
                <input
                  id="admin-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+63 9XX XXX XXXX"
                  className="w-full h-9 px-3 text-xs rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/5 text-[#3B3B3B] dark:text-white placeholder:text-[#696969]/50 focus:outline-none focus:ring-1.5 focus:ring-[#E9C46A] shadow-2xs transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="admin-personal-email" className="text-xs font-semibold text-[#696969]">Email Address</Label>
                <input
                  id="admin-personal-email"
                  type="email"
                  value={personalEmail}
                  onChange={(e) => setPersonalEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full h-9 px-3 text-xs rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/5 text-[#3B3B3B] dark:text-white placeholder:text-[#696969]/50 focus:outline-none focus:ring-1.5 focus:ring-[#E9C46A] shadow-2xs transition-all"
                />
              </div>
            </div>

            <div className="grid gap-3.5 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="admin-address" className="text-xs font-semibold text-[#696969]">Street Address</Label>
                <input
                  id="admin-address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="123 Main St., Barangay Example"
                  className="w-full h-9 px-3 text-xs rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/5 text-[#3B3B3B] dark:text-white placeholder:text-[#696969]/50 focus:outline-none focus:ring-1.5 focus:ring-[#E9C46A] shadow-2xs transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="admin-city" className="text-xs font-semibold text-[#696969]">City / Municipality</Label>
                <input
                  id="admin-city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Quezon City"
                  className="w-full h-9 px-3 text-xs rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/5 text-[#3B3B3B] dark:text-white placeholder:text-[#696969]/50 focus:outline-none focus:ring-1.5 focus:ring-[#E9C46A] shadow-2xs transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <Label htmlFor="admin-province" className="text-xs font-semibold text-[#696969]">Province</Label>
                  <input
                    id="admin-province"
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    placeholder="Metro Manila"
                    className="w-full h-9 px-3 text-xs rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/5 text-[#3B3B3B] dark:text-white placeholder:text-[#696969]/50 focus:outline-none focus:ring-1.5 focus:ring-[#E9C46A] shadow-2xs transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="admin-zip" className="text-xs font-semibold text-[#696969]">ZIP Code</Label>
                  <input
                    id="admin-zip"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    placeholder="1100"
                    className="w-full h-9 px-3 text-xs rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/5 text-[#3B3B3B] dark:text-white placeholder:text-[#696969]/50 focus:outline-none focus:ring-1.5 focus:ring-[#E9C46A] shadow-2xs transition-all"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* ═══ Education Background ═══ */}
          <section className="space-y-4 pt-4 border-t border-black/5 dark:border-white/10">
            <div className="flex items-center gap-2 pt-1">
              <GraduationCap className="size-4 text-[#696969]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#3B3B3B] dark:text-white">
                Education Background
              </h3>
            </div>

            <div className="grid gap-3.5 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#696969]">School / University</Label>
                <Select value={schoolId || "none"} onValueChange={(val) => setSchoolId(val === "none" ? "" : val)}>
                  <SelectTrigger className="w-full h-9 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/5 text-xs text-[#3B3B3B] dark:text-white shadow-2xs">
                    <SelectValue placeholder="Select School" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-slate-900 shadow-xl max-h-56">
                    <SelectItem value="none">None</SelectItem>
                    {dropdownData.schools.map((s) => (
                      <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#696969]">Highest Education</Label>
                <Select value={highestEducation || "none"} onValueChange={(val) => setHighestEducation(val === "none" ? "" : val)}>
                  <SelectTrigger className="w-full h-9 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/5 text-xs text-[#3B3B3B] dark:text-white shadow-2xs">
                    <SelectValue placeholder="Select Education" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-slate-900 shadow-xl">
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="High School">High School</SelectItem>
                    <SelectItem value="Senior High School">Senior High School</SelectItem>
                    <SelectItem value="Vocational / Associate">Vocational / Associate</SelectItem>
                    <SelectItem value="College Undergraduate">College Undergraduate</SelectItem>
                    <SelectItem value="Bachelor's Degree">Bachelor's Degree</SelectItem>
                    <SelectItem value="Master's Degree">Master's Degree</SelectItem>
                    <SelectItem value="Doctorate Degree">Doctorate Degree</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#696969]">Course / Program</Label>
                <Select value={academicCourseId || "none"} onValueChange={(val) => setAcademicCourseId(val === "none" ? "" : val)}>
                  <SelectTrigger className="w-full h-9 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/5 text-xs text-[#3B3B3B] dark:text-white shadow-2xs">
                    <SelectValue placeholder="Select Course" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-slate-900 shadow-xl max-h-56">
                    <SelectItem value="none">None</SelectItem>
                    {dropdownData.academic_courses.map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="admin-year-grad" className="text-xs font-semibold text-[#696969]">Year Graduated</Label>
                <input
                  id="admin-year-grad"
                  type="number"
                  min="1950"
                  max="2099"
                  value={yearGraduated}
                  onChange={(e) => setYearGraduated(e.target.value)}
                  placeholder="2024"
                  className="w-full h-9 px-3 text-xs rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/5 text-[#3B3B3B] dark:text-white placeholder:text-[#696969]/50 focus:outline-none focus:ring-1.5 focus:ring-[#E9C46A] shadow-2xs transition-all"
                />
              </div>
            </div>
          </section>

          {/* ═══ Account Details ═══ */}
          <section className="space-y-4 pt-4 border-t border-black/5 dark:border-white/10">
            <div className="flex items-center gap-2 pt-1">
              <Shield className="size-4 text-[#696969]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#3B3B3B] dark:text-white">
                Account Details
              </h3>
            </div>

            <div className="grid gap-3.5 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="admin-login-id" className="text-xs font-semibold text-[#696969]">Login ID</Label>
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
                        Automatically assigned in sequential order (admin + 5-digit number).
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <input
                  id="admin-login-id"
                  type="text"
                  readOnly
                  disabled
                  value={loginIdPreview || "Generating..."}
                  className="w-full h-9 px-3 text-xs rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-white/5 text-[#3B3B3B] dark:text-white cursor-not-allowed shadow-2xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="admin-password" className="text-xs font-semibold text-[#696969]">Password *</Label>
                <div className="relative">
                  <input
                    id="admin-password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-9 pl-3 pr-9 text-xs rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/5 text-[#3B3B3B] dark:text-white placeholder:text-[#696969]/50 focus:outline-none focus:ring-1.5 focus:ring-[#E9C46A] shadow-2xs transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#696969] hover:text-[#3B3B3B] dark:hover:text-white transition-colors cursor-pointer p-0.5"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="admin-confirm-password" className="text-xs font-semibold text-[#696969]">Confirm Password *</Label>
                <div className="relative">
                  <input
                    id="admin-confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-9 pl-3 pr-9 text-xs rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/5 text-[#3B3B3B] dark:text-white placeholder:text-[#696969]/50 focus:outline-none focus:ring-1.5 focus:ring-[#E9C46A] shadow-2xs transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#696969] hover:text-[#3B3B3B] dark:hover:text-white transition-colors cursor-pointer p-0.5"
                    title={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </button>
                </div>
              </div>

              {/* Admin Role Selector (Admin only!) */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#696969]">Admin Role *</Label>
                <Select value={selectedRole} onValueChange={(val) => setSelectedRole(val)}>
                  <SelectTrigger className="w-full h-9 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/5 text-xs text-[#3B3B3B] dark:text-white shadow-2xs">
                    <SelectValue placeholder="Select Admin Role" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-slate-900 shadow-xl max-h-60">
                    <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                      System Roles
                    </div>
                    {systemAdminRoles.map((r) => (
                      <SelectItem key={r.role_key} value={r.role_key}>
                        {r.name}
                      </SelectItem>
                    ))}

                    {customRoles.length > 0 && (
                      <>
                        <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400 border-t border-black/5 dark:border-white/10 mt-1">
                          Custom Master Data Roles
                        </div>
                        {customRoles.map((r) => (
                          <SelectItem key={r.id || r.role_key} value={r.role_key}>
                            {r.name}
                          </SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Optional Job Description / Title */}
              <div className="space-y-1.5">
                <Label htmlFor="admin-job-role" className="text-xs font-semibold text-[#696969]">Job Title / Description</Label>
                <input
                  id="admin-job-role"
                  type="text"
                  value={jobRoleDescription}
                  onChange={(e) => setJobRoleDescription(e.target.value)}
                  placeholder="e.g. Lead Coordinator, Admissions Officer"
                  className="w-full h-9 px-3 text-xs rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/5 text-[#3B3B3B] dark:text-white placeholder:text-[#696969]/50 focus:outline-none focus:ring-1.5 focus:ring-[#E9C46A] shadow-2xs transition-all"
                />
              </div>
            </div>
          </section>

          {/* Dialog Footer Actions */}
          <div className="pt-4 border-t border-black/5 dark:border-white/10 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-xs font-semibold text-neutral-500 hover:text-[#3B3B3B] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-[#E9C46A] hover:bg-[#dfb550] disabled:opacity-50 text-white font-semibold text-xs px-4.5 py-2 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              {saving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>Create Admin Account</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
