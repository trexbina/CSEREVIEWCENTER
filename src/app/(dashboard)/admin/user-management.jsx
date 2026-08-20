"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Pencil, Trash2, BookOpen, Plus, X, Save,
  Search, ArrowUpDown, ArrowUp, ArrowDown, ChevronRight,
  User, GraduationCap, Shield,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// ─── Add User Form ──────────────────────────────────────
export function AddUserForm() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("student")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Failed to create user.")
        setLoading(false)
        return
      }

      setSuccess(`Created ${data.user.role} account for ${data.user.email}`)
      setName("")
      setEmail("")
      setPassword("")
      setRole("student")
      setLoading(false)
      router.refresh()
    } catch {
      setError("Network error. Please try again.")
      setLoading(false)
    }
  }

  const inputClass =
    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-md bg-primary/10 p-3 text-sm text-primary">
          {success}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="new-name" className="text-sm font-medium text-foreground">
            Full Name
          </label>
          <input
            id="new-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            className={inputClass}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="new-email" className="text-sm font-medium text-foreground">
            Email
          </label>
          <input
            id="new-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="john@school.edu"
            className={inputClass}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="new-password" className="text-sm font-medium text-foreground">
            Password
          </label>
          <input
            id="new-password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className={inputClass}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="new-role" className="text-sm font-medium text-foreground">
            Role
          </label>
          <select
            id="new-role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className={inputClass}
          >
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
      >
        {loading ? "Creating…" : "Add User"}
      </button>
    </form>
  )
}

// ─── Delete User Button ─────────────────────────────────
export function DeleteUserButton({ userId, userName }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirm(`Delete user "${userName}"? This cannot be undone.`)) return
    setLoading(true)

    try {
      const res = await fetch(`/api/admin/users?id=${userId}`, { method: "DELETE" })
      const data = await res.json()

      if (!res.ok) {
        alert(data.error || "Failed to delete user.")
        setLoading(false)
        return
      }

      router.refresh()
    } catch {
      alert("Network error.")
      setLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleDelete}
      disabled={loading}
      className="h-7 w-7 text-muted-foreground hover:text-destructive"
    >
      {loading ? (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        <Trash2 className="h-3.5 w-3.5" />
      )}
    </Button>
  )
}

// ─── Edit User Dialog ───────────────────────────────────
export function EditUserDialog({ open, onOpenChange, user }) {
  const router = useRouter()
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  // ── Account ──
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("student")
  const [jobRoleDescription, setJobRoleDescription] = useState("")

  // ── Personal Information ──
  const [firstName, setFirstName] = useState("")
  const [middleName, setMiddleName] = useState("")
  const [lastName, setLastName] = useState("")
  const [suffix, setSuffix] = useState("")
  const [birthday, setBirthday] = useState("")
  const [gender, setGender] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")
  const [province, setProvince] = useState("")
  const [zipCode, setZipCode] = useState("")

  // ── Education Background ──
  const [schoolId, setSchoolId] = useState("")
  const [academicCourseId, setAcademicCourseId] = useState("")
  const [yearGraduated, setYearGraduated] = useState("")
  const [highestEducation, setHighestEducation] = useState("")

  // ── Master Data ──
  const [examId, setExamId] = useState("")
  const [batchId, setBatchId] = useState("")
  const [programId, setProgramId] = useState("")
  const [majorId, setMajorId] = useState("")
  const [dropdownData, setDropdownData] = useState({ examinations: [], batches: [], programs: [], majors: [], schools: [], academic_courses: [] })

  // ── Avatar Upload ──
  const [avatarUrl, setAvatarUrl] = useState("")
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

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
    if (open) {
      fetch("/api/admin/master-data/dropdowns")
        .then(res => res.json())
        .then(data => {
          if (data.examinations) setDropdownData(data)
        })
        .catch(console.error)
    }
  }, [open])

  useEffect(() => {
    if (open && user) {
      setEmail(user.email || "")
      setRole(user.role || "student")
      setPassword("")
      setError("")

      setFirstName(user.first_name || (user.name ? user.name.split(" ")[0] : ""))
      setMiddleName(user.middle_name || "")
      setLastName(user.last_name || (user.name ? user.name.split(" ").slice(1).join(" ") : ""))
      setSuffix(user.suffix || "")
      setBirthday(user.birthday ? new Date(user.birthday).toISOString().split('T')[0] : "")
      setGender(user.gender || "")
      setPhone(user.phone || "")
      setAddress(user.address || "")
      setCity(user.city || "")
      setProvince(user.province || "")
      setZipCode(user.zip_code || "")

      setSchoolId(user.school_id ? user.school_id.toString() : "")
      setAcademicCourseId(user.academic_course_id ? user.academic_course_id.toString() : "")
      setYearGraduated(user.year_graduated || "")
      setHighestEducation(user.highest_education || "")

      setExamId(user.exam_id ? user.exam_id.toString() : "")
      setBatchId(user.batch_id ? user.batch_id.toString() : "")
      setProgramId(user.program_id ? user.program_id.toString() : "")
      setMajorId(user.major_id ? user.major_id.toString() : "")
      setJobRoleDescription(user.job_role_description || "")
      setAvatarUrl(user.avatar_url || "")
    }
  }, [open, user])

  async function handleSubmit(e) {
    e.preventDefault()
    setError("")
    setSaving(true)

    const fullName = [firstName, middleName, lastName, suffix]
      .filter(Boolean)
      .join(" ")
      .trim() || user?.name || email

    try {
      const payload = {
        name: fullName,
        email,
        role,
        first_name: firstName,
        middle_name: middleName,
        last_name: lastName,
        suffix,
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
        exam_id: examId ? parseInt(examId) : null,
        batch_id: role !== "admin" && batchId ? parseInt(batchId) : null,
        program_id: role !== "admin" && programId ? parseInt(programId) : null,
        major_id: role !== "admin" && majorId ? parseInt(majorId) : null,
        job_role_description: role === "admin" ? jobRoleDescription : null,
        avatar_url: avatarUrl || null,
      }

      if (password.trim()) {
        payload.password = password.trim()
      }

      const res = await fetch(`/api/admin/users?id=${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Failed to update user.")
        setSaving(false)
        return
      }

      onOpenChange(false)
      router.refresh()
    } catch {
      setError("Network error. Please try again.")
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Pencil className="h-5 w-5 text-primary" />
              Edit User Details
            </DialogTitle>
            <DialogDescription>
              Update user profile, credentials, and master data settings.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* ═══ Personal Information ═══ */}
          <section className="rounded-lg border border-border bg-card p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-2">
              <User className="h-4 w-4 text-primary" />
              <h3 className="text-base font-semibold text-foreground">Personal Information</h3>
            </div>

            {/* Avatar Upload */}
            <div className="flex flex-col sm:flex-row items-center gap-4 pb-3 border-b border-border/50">
              <div className="relative h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-border flex items-center justify-center overflow-hidden shrink-0">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar Preview" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-7 w-7 text-muted-foreground" />
                )}
                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                )}
              </div>
              <div className="space-y-1 text-center sm:text-left">
                <Label htmlFor="edit-avatar-file" className="cursor-pointer inline-flex items-center gap-1.5 rounded-md bg-secondary px-3 py-1 text-xs font-bold text-secondary-foreground hover:bg-secondary/80 transition-colors">
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

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1">
                <Label htmlFor="edit-first-name" className="text-xs">First Name *</Label>
                <Input id="edit-first-name" required value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Juan" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-middle-name" className="text-xs">Middle Name</Label>
                <Input id="edit-middle-name" value={middleName} onChange={(e) => setMiddleName(e.target.value)} placeholder="Santos" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-last-name" className="text-xs">Last Name *</Label>
                <Input id="edit-last-name" required value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Dela Cruz" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-suffix" className="text-xs">Suffix</Label>
                <Input id="edit-suffix" value={suffix} onChange={(e) => setSuffix(e.target.value)} placeholder="Jr." />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <Label htmlFor="edit-birthday" className="text-xs">Birthday</Label>
                <Input id="edit-birthday" type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Gender</Label>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select gender" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-phone" className="text-xs">Phone Number</Label>
                <Input id="edit-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+63 9XX XXX XXXX" />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="edit-address" className="text-xs">Street Address</Label>
                <Input id="edit-address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Main St., Barangay Example" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-city" className="text-xs">City / Municipality</Label>
                <Input id="edit-city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Quezon City" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="edit-province" className="text-xs">Province</Label>
                  <Input id="edit-province" value={province} onChange={(e) => setProvince(e.target.value)} placeholder="Metro Manila" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-zip" className="text-xs">ZIP Code</Label>
                  <Input id="edit-zip" value={zipCode} onChange={(e) => setZipCode(e.target.value)} placeholder="1100" />
                </div>
              </div>
            </div>
          </section>

          {/* ═══ Education Background ═══ */}
          <section className="rounded-lg border border-border bg-card p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-2">
              <GraduationCap className="h-4 w-4 text-primary" />
              <h3 className="text-base font-semibold text-foreground">Education Background</h3>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">Highest Education</Label>
                <Select value={highestEducation} onValueChange={setHighestEducation}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select level" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high_school">High School</SelectItem>
                    <SelectItem value="vocational">Vocational / Technical</SelectItem>
                    <SelectItem value="bachelor">Bachelor&apos;s Degree</SelectItem>
                    <SelectItem value="master">Master&apos;s Degree</SelectItem>
                    <SelectItem value="doctorate">Doctorate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">School / University</Label>
                <Select value={schoolId} onValueChange={setSchoolId}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select School" /></SelectTrigger>
                  <SelectContent>
                    {dropdownData.schools.map(s => (
                      <SelectItem key={s.id} value={s.id.toString()}>
                        {s.name} {s.address ? `— ${s.address}` : ""}
                      </SelectItem>
                    ))}
                    {dropdownData.schools.length === 0 && <SelectItem value="none" disabled>No schools available</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Course / Program</Label>
                <Select value={academicCourseId} onValueChange={setAcademicCourseId}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select Course" /></SelectTrigger>
                  <SelectContent>
                    {dropdownData.academic_courses.map(c => (
                      <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                    ))}
                    {dropdownData.academic_courses.length === 0 && <SelectItem value="none" disabled>No courses available</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-year-grad" className="text-xs">Year Graduated</Label>
                <Input id="edit-year-grad" type="number" min="1950" max="2099" value={yearGraduated} onChange={(e) => setYearGraduated(e.target.value)} placeholder="2024" />
              </div>
            </div>
          </section>

          {/* ═══ Account Details ═══ */}
          <section className="rounded-lg border border-border bg-card p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-2">
              <Shield className="h-4 w-4 text-primary" />
              <h3 className="text-base font-semibold text-foreground">Account & Role Details</h3>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="edit-user-email" className="text-xs">Email *</Label>
                <Input id="edit-user-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="juan@school.edu" />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="edit-user-password" className="text-xs">Set New Password (optional)</Label>
                  <span className="text-[10px] text-muted-foreground font-medium">Original password is encrypted & hidden</span>
                </div>
                <Input id="edit-user-password" type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Leave blank to keep current password unchanged" />
                <p className="text-[10px] text-muted-foreground">Min. 6 characters. Only fill this if you want to reset this user's password.</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">User Role *</Label>
                <Select value={role} onValueChange={(val) => {
                  setRole(val);
                  if (val === "admin") {
                    setExamId("");
                    setProgramId("");
                    setMajorId("");
                    setBatchId("");
                  } else {
                    setJobRoleDescription("");
                  }
                }}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {role === "admin" && (
                <div className="space-y-1">
                  <Label htmlFor="edit-job-role" className="text-xs">Job Role Description *</Label>
                  <Input id="edit-job-role" value={jobRoleDescription} onChange={(e) => setJobRoleDescription(e.target.value)} placeholder="e.g. System Administrator" required />
                </div>
              )}

              {role !== "admin" && (
                <>
                  <div className="space-y-1">
                    <Label className="text-xs">Target Examination</Label>
                    <Select value={examId} onValueChange={(val) => { setExamId(val); setProgramId(""); setMajorId(""); }}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Select Exam" /></SelectTrigger>
                      <SelectContent>
                        {dropdownData.examinations.map(e => (
                          <SelectItem key={e.id} value={e.id.toString()}>{e.name}</SelectItem>
                        ))}
                        {dropdownData.examinations.length === 0 && <SelectItem value="none" disabled>No exams available</SelectItem>}
                      </SelectContent>
                    </Select>
                  </div>
                  {examId && dropdownData.programs?.some(p => p.exam_id.toString() === examId) && (
                    <div className="space-y-1">
                      <Label className="text-xs">Program</Label>
                      <Select value={programId} onValueChange={(val) => { setProgramId(val); setMajorId(""); }}>
                        <SelectTrigger className="w-full"><SelectValue placeholder="Select Program" /></SelectTrigger>
                        <SelectContent>
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
                    <div className="space-y-1">
                      <Label className="text-xs">Major</Label>
                      <Select value={majorId} onValueChange={setMajorId}>
                        <SelectTrigger className="w-full"><SelectValue placeholder="Select Major" /></SelectTrigger>
                        <SelectContent>
                          {dropdownData.majors
                            .filter(m => m.program_id.toString() === programId)
                            .map(m => (
                            <SelectItem key={m.id} value={m.id.toString()}>{m.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="space-y-1">
                    <Label className="text-xs">Batch</Label>
                    <Select value={batchId} onValueChange={setBatchId}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Select Batch" /></SelectTrigger>
                      <SelectContent>
                        {dropdownData.batches
                          .filter(b => !examId || b.exam_id.toString() === examId)
                          .map(b => (
                          <SelectItem key={b.id} value={b.id.toString()}>{b.name} ({b.target_year})</SelectItem>
                        ))}
                        {dropdownData.batches.length === 0 && <SelectItem value="none" disabled>No batches available</SelectItem>}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>
          </section>

          <DialogFooter className="pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={saving} className="gap-2">
              {saving ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Updating…
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" /> Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Shared helpers ────────────────────────────────────
const roleBadgeColor = {
  admin: "bg-destructive/15 text-destructive",
  teacher: "bg-primary/15 text-primary",
  student: "bg-secondary text-secondary-foreground",
}

function SortButton({ label, field, sortField, sortDir, onSort }) {
  const active = sortField === field
  return (
    <button
      onClick={() => onSort(field)}
      className="flex items-center gap-1 hover:text-foreground transition-colors font-medium"
    >
      {label}
      {active ? (
        sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
      ) : (
        <ArrowUpDown className="h-3 w-3 opacity-40" />
      )}
    </button>
  )
}

function ActionButtons({ user, currentUserId, onEdit, onAssign }) {
  if (user.id === currentUserId) return null
  return (
    <TooltipProvider>
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-primary"
              onClick={() => onEdit(user)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Edit user details</TooltipContent>
        </Tooltip>

        {user.role === "student" && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-primary"
                onClick={() => onAssign(user)}
              >
                <BookOpen className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Assign subjects to this student</TooltipContent>
          </Tooltip>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <DeleteUserButton userId={user.id} userName={user.name} />
            </span>
          </TooltipTrigger>
          <TooltipContent className="text-destructive">Permanently delete this user</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}

// ─── User Search Table (shown on /admin/users) ──────────
export function UserSearchTable({ users, currentUserId }) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [sortField, setSortField] = useState("created_at")
  const [sortDir, setSortDir] = useState("desc")
  const [editOpen, setEditOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  
  // Selection & Bulk Delete state
  const [selectedIds, setSelectedIds] = useState([])
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false)

  // 1-second debounce
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 1000)
    return () => clearTimeout(timer)
  }, [query])

  function handleSort(field) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortDir("asc")
    }
  }

  const hasQuery = debouncedQuery.trim().length > 0
  const isDebouncing = query.trim() !== debouncedQuery.trim() && query.trim().length > 0

  const filtered = useMemo(() => {
    let list = users
    if (hasQuery) {
      const q = debouncedQuery.toLowerCase().trim()
      list = list.filter((u) =>
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.role?.toLowerCase().includes(q)
      )
    }
    return list
      .sort((a, b) => {
        let av = a[sortField] ?? ""
        let bv = b[sortField] ?? ""
        if (sortField === "created_at") {
          av = new Date(av).getTime()
          bv = new Date(bv).getTime()
        } else {
          av = String(av).toLowerCase()
          bv = String(bv).toLowerCase()
        }
        return sortDir === "asc" ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1)
      })
      .slice(0, 8)
  }, [users, debouncedQuery, hasQuery, sortField, sortDir])

  const selectableUsers = useMemo(() => filtered.filter((u) => u.id !== currentUserId), [filtered, currentUserId])
  const isAllSelected = selectableUsers.length > 0 && selectableUsers.every((u) => selectedIds.includes(u.id))
  const isSomeSelected = selectableUsers.some((u) => selectedIds.includes(u.id))

  function handleToggleAll() {
    if (isAllSelected) {
      const selectableSet = new Set(selectableUsers.map((u) => u.id))
      setSelectedIds((prev) => prev.filter((id) => !selectableSet.has(id)))
    } else {
      const newIds = selectableUsers.map((u) => u.id)
      setSelectedIds((prev) => Array.from(new Set([...prev, ...newIds])))
    }
  }

  function handleToggleUser(userId) {
    setSelectedIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    )
  }

  async function handleBulkDelete() {
    setBulkDeleteLoading(true)
    try {
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || "Failed to delete selected users.")
        setBulkDeleteLoading(false)
        return
      }
      setSelectedIds([])
      setConfirmDeleteOpen(false)
      router.refresh()
    } catch {
      alert("Network error. Please try again.")
    } finally {
      setBulkDeleteLoading(false)
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 flex-1 min-w-[240px]">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email or role…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 shrink-0"
                  onClick={() => router.push("/admin/users/all")}
                >
                  View All
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>See the full user list with advanced filters</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="flex items-center gap-2">
          {selectableUsers.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleAll}
              className="text-xs font-medium"
            >
              {isAllSelected ? "Deselect All" : `Select All (${selectableUsers.length})`}
            </Button>
          )}

          {selectedIds.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setConfirmDeleteOpen(true)}
              className="gap-1.5 text-xs"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete Selected ({selectedIds.length})
            </Button>
          )}
        </div>
      </div>

      <div className="mdc-data-table w-full">
        <div className="mdc-data-table__table-container">
          <table className="mdc-data-table__table" aria-label="User search results">
            <thead>
              <tr className="mdc-data-table__header-row">
                <th className="mdc-data-table__header-cell w-10 text-center" role="columnheader" scope="col">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(input) => {
                      if (input) input.indeterminate = isSomeSelected && !isAllSelected
                    }}
                    onChange={handleToggleAll}
                    disabled={selectableUsers.length === 0}
                    className="h-4 w-4 rounded border-input cursor-pointer accent-primary align-middle"
                    title={isAllSelected ? "Deselect All" : "Select All"}
                  />
                </th>
                <th className="mdc-data-table__header-cell" role="columnheader" scope="col">
                  <SortButton label="Name" field="name" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                </th>
                <th className="mdc-data-table__header-cell" role="columnheader" scope="col">
                  <SortButton label="Email" field="email" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                </th>
                <th className="mdc-data-table__header-cell" role="columnheader" scope="col">
                  <SortButton label="Role" field="role" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                </th>
                <th className="mdc-data-table__header-cell" role="columnheader" scope="col">
                  <SortButton label="Joined" field="created_at" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                </th>
                <th className="mdc-data-table__header-cell text-right" role="columnheader" scope="col">Actions</th>
              </tr>
            </thead>
            <tbody className="mdc-data-table__content">
              {isDebouncing ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr className="mdc-data-table__row" key={`skel-${i}`}>
                    <td className="mdc-data-table__cell"><div className="h-4 w-4 animate-pulse rounded bg-muted mx-auto" /></td>
                    <td className="mdc-data-table__cell"><div className="h-4 w-28 animate-pulse rounded bg-muted" /></td>
                    <td className="mdc-data-table__cell"><div className="h-4 w-40 animate-pulse rounded bg-muted" /></td>
                    <td className="mdc-data-table__cell"><div className="h-5 w-16 animate-pulse rounded-full bg-muted" /></td>
                    <td className="mdc-data-table__cell"><div className="h-4 w-20 animate-pulse rounded bg-muted" /></td>
                    <td className="mdc-data-table__cell text-right"><div className="ml-auto h-4 w-16 animate-pulse rounded bg-muted" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr className="mdc-data-table__row">
                  <td className="mdc-data-table__cell py-8 text-center text-muted-foreground" colSpan={6}>
                    {hasQuery ? `No users matching "${debouncedQuery}"` : "No users found."}
                  </td>
                </tr>
              ) : (
                filtered.map((user) => {
                  const isCurrentAdmin = user.id === currentUserId
                  const isChecked = selectedIds.includes(user.id)
                  return (
                    <tr className={`mdc-data-table__row ${isChecked ? "bg-muted/40" : ""}`} key={user.id}>
                      <td className="mdc-data-table__cell text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={isCurrentAdmin}
                          onChange={() => handleToggleUser(user.id)}
                          className="h-4 w-4 rounded border-input cursor-pointer accent-primary align-middle disabled:opacity-30 disabled:cursor-not-allowed"
                          title={isCurrentAdmin ? "Cannot select yourself" : `Select ${user.name}`}
                        />
                      </td>
                      <td className="mdc-data-table__cell font-medium">
                        <Link href={`/admin/users/${user.id}`} className="hover:underline text-primary">
                          {user.name}
                        </Link>
                      </td>
                      <td className="mdc-data-table__cell text-muted-foreground">{user.email}</td>
                      <td className="mdc-data-table__cell">
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${roleBadgeColor[user.role] || "bg-secondary text-secondary-foreground"}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="mdc-data-table__cell text-muted-foreground">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : ""}
                      </td>
                      <td className="mdc-data-table__cell text-right">
                        <ActionButtons
                          user={user}
                          currentUserId={currentUserId}
                          onEdit={(u) => { setSelected(u); setEditOpen(true) }}
                          onAssign={(u) => { setSelected(u); setAssignOpen(true) }}
                        />
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {hasQuery && filtered.length > 0 && (
        <p className="mt-2 text-xs text-muted-foreground text-right">
          Showing {filtered.length} of {users.filter((u) => {
            const q = debouncedQuery.toLowerCase().trim()
            return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.role?.toLowerCase().includes(q)
          }).length} matching users.{" "}
          <button onClick={() => router.push("/admin/users/all")} className="underline hover:text-foreground transition-colors">
            View all {users.length} users →
          </button>
        </p>
      )}

      {/* Confirmation Dialog for Batch Delete */}
      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Selected Users</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete {selectedIds.length} selected user{selectedIds.length > 1 ? "s" : ""}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkDeleteLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={bulkDeleteLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {bulkDeleteLoading ? "Deleting…" : `Delete ${selectedIds.length} User${selectedIds.length > 1 ? "s" : ""}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {selected && (
        <>
          <EditUserDialog
            open={editOpen}
            onOpenChange={(v) => { setEditOpen(v); if (!v) setSelected(null) }}
            user={selected}
          />
          <AssignSubjectsDialog
            open={assignOpen}
            onOpenChange={(v) => { setAssignOpen(v); if (!v) setSelected(null) }}
            user={selected}
          />
        </>
      )}
    </>
  )
}

// ─── Full User Table (used on /admin/users/all) ─────────
export function UserTable({ users, currentUserId }) {
  const router = useRouter()
  const [sortField, setSortField] = useState("created_at")
  const [sortDir, setSortDir] = useState("desc")
  const [editOpen, setEditOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const [selected, setSelected] = useState(null)

  // Selection & Bulk Delete state
  const [selectedIds, setSelectedIds] = useState([])
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false)

  function handleSort(field) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortDir("asc")
    }
  }

  const sorted = useMemo(() =>
    [...users].sort((a, b) => {
      let av = a[sortField] ?? ""
      let bv = b[sortField] ?? ""
      if (sortField === "created_at") {
        av = new Date(av).getTime()
        bv = new Date(bv).getTime()
      } else {
        av = String(av).toLowerCase()
        bv = String(bv).toLowerCase()
      }
      return sortDir === "asc" ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1)
    })
    , [users, sortField, sortDir])

  const selectableUsers = useMemo(() => sorted.filter((u) => u.id !== currentUserId), [sorted, currentUserId])
  const isAllSelected = selectableUsers.length > 0 && selectableUsers.every((u) => selectedIds.includes(u.id))
  const isSomeSelected = selectableUsers.some((u) => selectedIds.includes(u.id))

  function handleToggleAll() {
    if (isAllSelected) {
      setSelectedIds([])
    } else {
      setSelectedIds(selectableUsers.map((u) => u.id))
    }
  }

  function handleToggleUser(userId) {
    setSelectedIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    )
  }

  async function handleBulkDelete() {
    setBulkDeleteLoading(true)
    try {
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || "Failed to delete selected users.")
        setBulkDeleteLoading(false)
        return
      }
      setSelectedIds([])
      setConfirmDeleteOpen(false)
      router.refresh()
    } catch {
      alert("Network error. Please try again.")
    } finally {
      setBulkDeleteLoading(false)
    }
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          {selectableUsers.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleAll}
              className="text-xs font-medium"
            >
              {isAllSelected ? "Deselect All" : `Select All (${selectableUsers.length})`}
            </Button>
          )}
        </div>

        {selectedIds.length > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setConfirmDeleteOpen(true)}
            className="gap-1.5 text-xs"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete Selected ({selectedIds.length})
          </Button>
        )}
      </div>

      <div className="mdc-data-table w-full">
        <div className="mdc-data-table__table-container">
          <table className="mdc-data-table__table" aria-label="All users">
            <thead>
              <tr className="mdc-data-table__header-row">
                <th className="mdc-data-table__header-cell w-10 text-center" role="columnheader" scope="col">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(input) => {
                      if (input) input.indeterminate = isSomeSelected && !isAllSelected
                    }}
                    onChange={handleToggleAll}
                    disabled={selectableUsers.length === 0}
                    className="h-4 w-4 rounded border-input cursor-pointer accent-primary align-middle"
                    title={isAllSelected ? "Deselect All" : "Select All"}
                  />
                </th>
                <th className="mdc-data-table__header-cell" role="columnheader" scope="col">
                  <SortButton label="Name" field="name" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                </th>
                <th className="mdc-data-table__header-cell" role="columnheader" scope="col">
                  <SortButton label="Email" field="email" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                </th>
                <th className="mdc-data-table__header-cell" role="columnheader" scope="col">
                  <SortButton label="Role" field="role" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                </th>
                <th className="mdc-data-table__header-cell" role="columnheader" scope="col">
                  <SortButton label="Joined" field="created_at" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                </th>
                <th className="mdc-data-table__header-cell text-right" role="columnheader" scope="col">Actions</th>
              </tr>
            </thead>
            <tbody className="mdc-data-table__content">
              {sorted.length === 0 ? (
                <tr className="mdc-data-table__row">
                  <td className="mdc-data-table__cell py-8 text-center text-muted-foreground" colSpan={6}>
                    No users found.
                  </td>
                </tr>
              ) : (
                sorted.map((user) => {
                  const isCurrentAdmin = user.id === currentUserId
                  const isChecked = selectedIds.includes(user.id)
                  return (
                    <tr className={`mdc-data-table__row ${isChecked ? "bg-muted/40" : ""}`} key={user.id}>
                      <td className="mdc-data-table__cell text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={isCurrentAdmin}
                          onChange={() => handleToggleUser(user.id)}
                          className="h-4 w-4 rounded border-input cursor-pointer accent-primary align-middle disabled:opacity-30 disabled:cursor-not-allowed"
                          title={isCurrentAdmin ? "Cannot select yourself" : `Select ${user.name}`}
                        />
                      </td>
                      <td className="mdc-data-table__cell font-medium">
                        <Link href={`/admin/users/${user.id}`} className="hover:underline text-primary">
                          {user.name}
                        </Link>
                      </td>
                      <td className="mdc-data-table__cell text-muted-foreground">{user.email}</td>
                      <td className="mdc-data-table__cell">
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${roleBadgeColor[user.role] || "bg-secondary text-secondary-foreground"}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="mdc-data-table__cell text-muted-foreground">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : ""}
                      </td>
                      <td className="mdc-data-table__cell text-right">
                        <ActionButtons
                          user={user}
                          currentUserId={currentUserId}
                          onEdit={(u) => { setSelected(u); setEditOpen(true) }}
                          onAssign={(u) => { setSelected(u); setAssignOpen(true) }}
                        />
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Dialog for Batch Delete */}
      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Selected Users</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete {selectedIds.length} selected user{selectedIds.length > 1 ? "s" : ""}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkDeleteLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={bulkDeleteLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {bulkDeleteLoading ? "Deleting…" : `Delete ${selectedIds.length} User${selectedIds.length > 1 ? "s" : ""}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {selected && (
        <>
          <EditUserDialog
            open={editOpen}
            onOpenChange={(v) => { setEditOpen(v); if (!v) setSelected(null) }}
            user={selected}
          />
          <AssignSubjectsDialog
            open={assignOpen}
            onOpenChange={(v) => { setAssignOpen(v); if (!v) setSelected(null) }}
            user={selected}
          />
        </>
      )}
    </>
  )
}

// ─── Assign Subjects Dialog ─────────────────────────────
export function AssignSubjectsDialog({ open, onOpenChange, user }) {
  const [assigned, setAssigned] = useState([])
  const [allSubjects, setAllSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState(false)
  const [removing, setRemoving] = useState(null)

  const loadData = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/student-subjects?studentId=${user.id}`)
      if (res.ok) {
        const data = await res.json()
        setAssigned(data.assigned)
        setAllSubjects(data.subjects)
      }
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (open && user) loadData()
  }, [open, user, loadData])

  // subjects not yet assigned
  const assignedIds = new Set(assigned.map((a) => a.id))
  const available = allSubjects.filter((s) => !assignedIds.has(s.id))

  async function handleAssign(subjectId) {
    setAssigning(true)
    try {
      const res = await fetch("/api/admin/student-subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_id: user.id, subject_id: subjectId }),
      })
      if (res.ok) await loadData()
    } finally {
      setAssigning(false)
    }
  }

  async function handleRemove(subjectId) {
    setRemoving(subjectId)
    try {
      await fetch(
        `/api/admin/student-subjects?studentId=${user.id}&subjectId=${subjectId}`,
        { method: "DELETE" }
      )
      await loadData()
    } finally {
      setRemoving(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Assign Subjects
          </DialogTitle>
          <DialogDescription>
            Manage subject assignments for <strong>{user?.name}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : (
            <div className="space-y-5">
              {/* Assigned subjects */}
              <div>
                <h3 className="text-sm font-medium text-foreground mb-2">
                  Assigned Subjects ({assigned.length})
                </h3>
                {assigned.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-3 text-center border border-dashed rounded-md">
                    No subjects assigned yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {assigned.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between rounded-md border bg-card px-3 py-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Badge variant="outline" className="font-mono text-[10px] shrink-0">
                            {s.code}
                          </Badge>
                          <span className="text-sm font-medium truncate">
                            {s.title}
                          </span>
                          {s.category && (
                            <Badge variant="secondary" className="text-[10px] hidden sm:inline-flex">
                              {s.category}
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0 text-destructive hover:bg-destructive/10"
                          onClick={() => handleRemove(s.id)}
                          disabled={removing === s.id}
                        >
                          {removing === s.id ? (
                            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          ) : (
                            <X className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Available subjects to add */}
              <div>
                <h3 className="text-sm font-medium text-foreground mb-2">
                  Available Subjects ({available.length})
                </h3>
                {available.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-3 text-center border border-dashed rounded-md">
                    {allSubjects.length === 0
                      ? "No subjects created yet. Create subjects in Curriculum Manager first."
                      : "All subjects have been assigned."}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {available.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Badge variant="outline" className="font-mono text-[10px] shrink-0">
                            {s.code}
                          </Badge>
                          <span className="text-sm truncate">
                            {s.title}
                          </span>
                          {s.category && (
                            <Badge variant="secondary" className="text-[10px] hidden sm:inline-flex">
                              {s.category}
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 shrink-0 text-xs"
                          onClick={() => handleAssign(s.id)}
                          disabled={assigning}
                        >
                          <Plus className="mr-1 h-3 w-3" /> Add
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
