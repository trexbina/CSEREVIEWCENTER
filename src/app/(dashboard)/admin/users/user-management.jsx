// this tells nextjs to run these user tables and dialogs in the browser
"use client"

// helper tools from react for component states and memos
import { useState, useEffect, useCallback, useMemo } from "react"

// router helper to navigate between pages
import { useRouter } from "next/navigation"

// helper for creating navigation links
import Link from "next/link"

// icons for actions and table headers
import {
  Pencil, Trash, BookOpen, Plus, X, Save,
  Search, ArrowUpDown, ArrowUp, ArrowDown, ChevronRight,
  User, GraduationCap, Shield, Check, Minus,
} from "lucide-react"

// ui component helpers
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/toast"
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

// confirmation modal for delete actions
import ConfirmDeleteModal from "@/components/confirm-delete-modal"

// button to delete a user account with a confirmation popup
export function DeleteUserButton({ userId, userName }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  async function performDelete() {
    setLoading(true)

    try {
      const res = await fetch(`/api/admin/users?id=${userId}`, { method: "DELETE" })
      const data = await res.json()

      if (!res.ok) {
        toast(data.error || "Failed to delete user.")
        setLoading(false)
        return
      }

      toast("Successfully moved user to trash.")
      router.refresh()
    } catch {
      toast("Network error occurred.")
      setLoading(false)
    } finally {
      setIsConfirmOpen(false)
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsConfirmOpen(true)}
        disabled={loading}
        className="h-7 w-7 text-gray-400 hover:text-gray-600 cursor-pointer"
        title="Delete User"
      >
        {loading ? (
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          <Trash className="h-3.5 w-3.5" />
        )}
      </Button>

      <ConfirmDeleteModal
        isOpen={isConfirmOpen}
        title="Delete User"
        description={`Are you sure you want to delete "${userName}"? This action cannot be undone.`}
        isDeleting={loading}
        onConfirm={performDelete}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </>
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
  const [dropdownData, setDropdownData] = useState({ examinations: [], batches: [], programs: [], majors: [], schools: [], academic_courses: [], roles: [] })

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
        const isAdminRole = role !== "student" && role !== "teacher"
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
        batch_id: !isAdminRole && batchId ? parseInt(batchId) : null,
        program_id: !isAdminRole && programId ? parseInt(programId) : null,
        major_id: !isAdminRole && majorId ? parseInt(majorId) : null,
        job_role_description: isAdminRole ? jobRoleDescription : null,
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

      toast("Successfully updated user details.")
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
              <div className="relative h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-solid border-border flex items-center justify-center overflow-hidden shrink-0">
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
                <Select value={gender || "none"} onValueChange={(val) => setGender(val === "none" ? "" : val)}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select gender" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
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
                <Select value={highestEducation || "none"} onValueChange={(val) => setHighestEducation(val === "none" ? "" : val)}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select level" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
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
                <Select value={schoolId || "none"} onValueChange={(val) => setSchoolId(val === "none" ? "" : val)}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select School" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {dropdownData.schools.map(s => (
                      <SelectItem key={s.id} value={s.id.toString()}>
                        {s.name} {s.address ? `— ${s.address}` : ""}
                      </SelectItem>
                    ))}
                    {dropdownData.schools.length === 0 && <SelectItem value="no_schools" disabled>No schools available</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Course / Program</Label>
                <Select value={academicCourseId || "none"} onValueChange={(val) => setAcademicCourseId(val === "none" ? "" : val)}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select Course" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {dropdownData.academic_courses.map(c => (
                      <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                    ))}
                    {dropdownData.academic_courses.length === 0 && <SelectItem value="no_courses" disabled>No courses available</SelectItem>}
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
                <Select 
                  value={
                    role !== "student" && role !== "teacher"
                      ? "admin_group"
                      : role
                  } 
                  onValueChange={(val) => {
                    if (val === "admin_group") {
                      setRole("super_admin");
                      setExamId("");
                      setProgramId("");
                      setMajorId("");
                      setBatchId("");
                    } else {
                      setRole(val);
                      setJobRoleDescription("");
                      if (val === "teacher") {
                        setBatchId("");
                      }
                    }
                  }}
                >
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="teacher">Teacher (Instructor)</SelectItem>
                    <SelectItem value="admin_group">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {role !== "student" && role !== "teacher" && (
                <div className="space-y-1 animate-in fade-in zoom-in-95 duration-150">
                  <Label className="text-xs">Admin Role *</Label>
                  <Select 
                    value={role === "admin" ? "super_admin" : role} 
                    onValueChange={(val) => setRole(val)}
                  >
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="super_admin">Super Admin (System Owner)</SelectItem>
                      <SelectItem value="academic_admin">Academic Coordinator (Curriculum & Exams)</SelectItem>
                      <SelectItem value="registrar">Registrar (Students & Admissions)</SelectItem>
                      {(dropdownData.roles || [])
                        .filter(r => !["super_admin", "academic_admin", "registrar"].includes(r.role_key))
                        .map(r => (
                          <SelectItem key={r.id || r.role_key} value={r.role_key}>
                            {r.name}
                          </SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                </div>
              )}

              {role === "teacher" && (
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-xs">Assigned Examination (e.g. LEPT) *</Label>
                  <Select value={examId || "none"} onValueChange={(val) => { setExamId(val === "none" ? "" : val); setProgramId(""); setMajorId(""); }}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select Examination" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {dropdownData.examinations.map(e => (
                        <SelectItem key={e.id} value={e.id.toString()}>{e.name}</SelectItem>
                      ))}
                      {dropdownData.examinations.length === 0 && <SelectItem value="no_exams" disabled>No exams available</SelectItem>}
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground">
                    Determines which examination curriculum modules and categories are accessible to this teacher.
                  </p>
                </div>
              )}

              {role === "student" && (
                <>
                  <div className="space-y-1">
                    <Label className="text-xs">Target Examination</Label>
                    <Select value={examId || "none"} onValueChange={(val) => { setExamId(val === "none" ? "" : val); setProgramId(""); setMajorId(""); }}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Select Exam" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {dropdownData.examinations.map(e => (
                          <SelectItem key={e.id} value={e.id.toString()}>{e.name}</SelectItem>
                        ))}
                        {dropdownData.examinations.length === 0 && <SelectItem value="no_exams" disabled>No exams available</SelectItem>}
                      </SelectContent>
                    </Select>
                  </div>
                  {examId && dropdownData.programs?.some(p => p.exam_id.toString() === examId) && (
                    <div className="space-y-1">
                      <Label className="text-xs">Program</Label>
                      <Select value={programId || "none"} onValueChange={(val) => { setProgramId(val === "none" ? "" : val); setMajorId(""); }}>
                        <SelectTrigger className="w-full"><SelectValue placeholder="Select Program" /></SelectTrigger>
                        <SelectContent>
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
                    <div className="space-y-1">
                      <Label className="text-xs">Major</Label>
                      <Select value={majorId || "none"} onValueChange={(val) => setMajorId(val === "none" ? "" : val)}>
                        <SelectTrigger className="w-full"><SelectValue placeholder="Select Major" /></SelectTrigger>
                        <SelectContent>
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
                  <div className="space-y-1">
                    <Label className="text-xs">Batch</Label>
                    <Select value={batchId || "none"} onValueChange={(val) => setBatchId(val === "none" ? "" : val)}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Select Batch" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {dropdownData.batches
                          .filter(b => !examId || b.exam_id.toString() === examId)
                          .map(b => (
                          <SelectItem key={b.id} value={b.id.toString()}>{b.name} ({b.target_year})</SelectItem>
                        ))}
                        {dropdownData.batches.length === 0 && <SelectItem value="no_batches" disabled>No batches available</SelectItem>}
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
            <Button
              type="submit"
              disabled={saving}
              className="bg-[#E9C46A] hover:bg-[#dfb550] disabled:opacity-50 text-white text-xs font-semibold px-4 py-1.5 rounded-xl shadow-2xs transition-all flex items-center justify-center cursor-pointer h-auto border-0"
            >
              {saving ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent mr-1.5" />
                  Updating…
                </>
              ) : (
                <span>Save Changes</span>
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

function ActionButtons({ user, currentUserId }) {
  const router = useRouter()
  if (user.id === currentUserId) return <div className="h-7 w-7" />
  return (
    <TooltipProvider>
      <div className="flex items-center gap-1 h-7">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-primary"
              onClick={() => router.push(`/admin/users/${user.id}/edit`)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Edit user details</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <DeleteUserButton userId={user.id} userName={user.name} />
            </span>
          </TooltipTrigger>
          <TooltipContent>Permanently delete this user</TooltipContent>
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
        toast(data.error || "Failed to delete selected users.")
        setBulkDeleteLoading(false)
        return
      }
      setSelectedIds([])
      setConfirmDeleteOpen(false)
      toast(`Successfully moved ${data.deletedCount || selectedIds.length} user(s) to trash.`)
      router.refresh()
    } catch {
      toast("Network error. Please try again.")
    } finally {
      setBulkDeleteLoading(false)
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3 flex-1 min-w-[260px]">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#696969]/70" />
            <input
              type="search"
              placeholder="Search by name, email or role…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 text-sm rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/10 text-[#3B3B3B] dark:text-white placeholder:text-[#696969]/60 focus:outline-none focus:ring-1.5 focus:ring-black/15 dark:focus:ring-white/20 transition-all shadow-2xs"
            />
          </div>
          <TooltipProvider>
            <Tooltip delayDuration={150}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-1.5 px-3.5 h-10 rounded-xl text-xs font-semibold text-[#696969] hover:text-[#3B3B3B] dark:text-gray-400 dark:hover:text-white bg-white dark:bg-white/10 hover:bg-white/90 border border-black/5 dark:border-white/10 transition-all shadow-2xs shrink-0 cursor-pointer"
                  onClick={() => router.push("/admin/users/all")}
                >
                  <span>View All</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="bg-white text-gray-800 dark:bg-slate-900 dark:text-slate-100 border border-gray-200 dark:border-slate-800 shadow-md text-xs px-2.5 py-1 rounded-lg">
                See the full user list with advanced filters
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <button
              type="button"
              onClick={() => setConfirmDeleteOpen(true)}
              className="flex items-center gap-1.5 px-3.5 h-9 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/30 hover:bg-rose-100 transition-all shadow-2xs cursor-pointer animate-in fade-in zoom-in-95 duration-150"
            >
              <Trash className="h-3.5 w-3.5" />
              <span>Delete Selected ({selectedIds.length})</span>
            </button>
          )}
        </div>
      </div>

      <div className="w-full overflow-hidden rounded-2xl border border-black/5 dark:border-white/10 bg-card shadow-2xs">
        <div className="max-h-[920px] overflow-y-auto">
          <table className="w-full text-left border-collapse" aria-label="User search results">
            <thead className="sticky top-0 z-10 bg-[#F2F2F2]/80 dark:bg-[#14161b]/90 backdrop-blur-xs border-b border-black/5 dark:border-white/10">
              <tr className="h-11 text-xs font-semibold uppercase tracking-wider text-[#696969]/80 dark:text-gray-400">
                <th className="w-12 px-4 text-center" scope="col"></th>
                <th className="px-4 py-2.5" scope="col">
                  <SortButton label="Name" field="name" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                </th>
                <th className="px-4 py-2.5" scope="col">
                  <SortButton label="Email" field="email" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                </th>
                <th className="px-4 py-2.5" scope="col">
                  <SortButton label="Role" field="role" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                </th>
                <th className="px-4 py-2.5" scope="col">
                  <SortButton label="Joined" field="created_at" sortField={sortDir === "asc" ? sortField : "created_at"} sortDir={sortDir} onSort={handleSort} />
                </th>
                <th className="px-4 py-2.5 text-right pr-6" scope="col">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5 text-sm">
              {isDebouncing ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr className="h-13" key={`skel-${i}`}>
                    <td className="px-4 text-center"><div className="h-4.5 w-4.5 animate-pulse rounded bg-muted mx-auto" /></td>
                    <td className="px-4"><div className="h-4 w-28 animate-pulse rounded bg-muted" /></td>
                    <td className="px-4"><div className="h-4 w-40 animate-pulse rounded bg-muted" /></td>
                    <td className="px-4"><div className="h-5 w-16 animate-pulse rounded-full bg-muted" /></td>
                    <td className="px-4"><div className="h-4 w-20 animate-pulse rounded bg-muted" /></td>
                    <td className="px-4 text-right pr-6"><div className="h-4 w-16 animate-pulse rounded bg-muted ml-auto" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td className="py-12 text-center text-sm font-medium text-[#696969]" colSpan={6}>
                    {hasQuery ? `No users matching "${debouncedQuery}"` : "No users found."}
                  </td>
                </tr>
              ) : (
                filtered.map((user) => {
                  const isCurrentAdmin = user.id === currentUserId
                  const isChecked = selectedIds.includes(user.id)
                  return (
                    <tr className={`h-13 transition-colors hover:bg-black/[0.015] dark:hover:bg-white/[0.02] ${isChecked ? "bg-black/[0.02] dark:bg-white/[0.03]" : ""}`} key={user.id}>
                      <td className="px-4 text-center">
                        <div
                          onClick={() => {
                            if (!isCurrentAdmin) handleToggleUser(user.id)
                          }}
                          className={`mx-auto size-4.5 rounded-md border flex items-center justify-center transition-all cursor-pointer select-none ${
                            isChecked
                              ? "bg-[#3B3B3B] dark:bg-white border-[#3B3B3B] dark:border-white text-white dark:text-gray-900 shadow-xs"
                              : "border-black/20 dark:border-white/20 bg-white/60 dark:bg-white/5 hover:border-black/40 dark:hover:border-white/40"
                          } ${isCurrentAdmin ? "opacity-30 cursor-not-allowed" : ""}`}
                          title={isCurrentAdmin ? "Cannot select yourself" : `Select ${user.name}`}
                        >
                          {isChecked && <Check className="size-3 stroke-[2.5]" />}
                        </div>
                      </td>
                      <td className="px-4 font-semibold">
                        <Link href={`/admin/users/${user.id}`} className="text-[#2563EB] hover:text-[#1D4ED8] dark:text-[#60A5FA] dark:hover:text-[#93C5FD] hover:underline transition-colors">
                          {user.name}
                        </Link>
                      </td>
                      <td className="px-4 text-sm text-[#696969] dark:text-gray-300 font-normal">{user.email}</td>
                      <td className="px-4 text-sm">
                        {(() => {
                          const r = user.role
                          if (r === "super_admin" || r === "admin") {
                            return (
                              <span className="font-semibold text-[#3B3B3B] dark:text-gray-200">
                                Super Admin
                              </span>
                            )
                          }
                          if (r === "academic_admin") {
                            return (
                              <span className="font-semibold text-[#3B3B3B] dark:text-gray-200">
                                Academic Coord.
                              </span>
                            )
                          }
                          if (r === "registrar") {
                            return (
                              <span className="font-semibold text-[#3B3B3B] dark:text-gray-200">
                                Registrar
                              </span>
                            )
                          }
                          if (r === "teacher") {
                            return (
                              <span className="font-semibold text-[#696969] dark:text-gray-300">
                                Instructor
                              </span>
                            )
                          }
                          return (
                            <span className="font-medium capitalize text-[#696969] dark:text-gray-300">
                              {r}
                            </span>
                          )
                        })()}
                      </td>
                      <td className="px-4 text-sm text-[#696969] dark:text-gray-400 font-normal">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : ""}
                      </td>
                      <td className="px-4 text-right pr-6">
                        <div className="flex justify-end">
                          <ActionButtons
                            user={user}
                            currentUserId={currentUserId}
                          />
                        </div>
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
        <p className="mt-3 text-xs text-[#696969] text-right">
          Showing {filtered.length} of {users.filter((u) => {
            const q = debouncedQuery.toLowerCase().trim()
            return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.role?.toLowerCase().includes(q)
          }).length} matching users.{" "}
          <button onClick={() => router.push("/admin/users/all")} className="underline text-[#3B3B3B] dark:text-white hover:text-black font-semibold transition-colors">
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
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("ALL")
  const [sortField, setSortField] = useState("created_at")
  const [sortDir, setSortDir] = useState("desc")

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

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return users.filter((u) => {
      const matchesRole =
        roleFilter === "ALL"
          ? true
          : roleFilter === "admin"
          ? (u.role === "admin" || u.role === "super_admin" || u.role === "academic_admin" || u.role === "registrar")
          : u.role === roleFilter
      const fullName = (u.name || "").toLowerCase()
      const matchesSearch =
        !q ||
        fullName.includes(q) ||
        (u.email || "").toLowerCase().includes(q) ||
        (u.academic_course_name || u.course || "").toLowerCase().includes(q) ||
        (u.program_name || "").toLowerCase().includes(q) ||
        (u.major_name || "").toLowerCase().includes(q)

      return matchesRole && matchesSearch
    })
  }, [users, search, roleFilter])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
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
  }, [filtered, sortField, sortDir])

  const selectableUsers = useMemo(() => sorted.filter((u) => u.id !== currentUserId), [sorted, currentUserId])
  const isAllSelected = selectableUsers.length > 0 && selectableUsers.every((u) => selectedIds.includes(u.id))
  const isSomeSelected = selectableUsers.some((u) => selectedIds.includes(u.id))

  function handleToggleAll() {
    if (isAllSelected) {
      const selectableIdSet = new Set(selectableUsers.map((u) => u.id))
      setSelectedIds((prev) => prev.filter((id) => !selectableIdSet.has(id)))
    } else {
      const selectableIdSet = selectableUsers.map((u) => u.id)
      setSelectedIds((prev) => Array.from(new Set([...prev, ...selectableIdSet])))
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
        toast(data.error || "Failed to delete selected users.")
        setBulkDeleteLoading(false)
        return
      }
      setSelectedIds([])
      setConfirmDeleteOpen(false)
      toast(`Successfully moved ${data.deletedCount || selectedIds.length} user(s) to trash.`)
      router.refresh()
    } catch {
      toast("Network error. Please try again.")
    } finally {
      setBulkDeleteLoading(false)
    }
  }

  const studentCount = users.filter((u) => u.role === "student").length
  const teacherCount = users.filter((u) => u.role === "teacher").length
  const adminCount = users.filter((u) => u.role === "admin" || u.role === "super_admin" || u.role === "academic_admin" || u.role === "registrar").length

  return (
    <div className="space-y-6">
      {/* Controls & Filter toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3 flex-1 min-w-[260px]">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#696969]/70 pointer-events-none" />
            <input
              type="search"
              placeholder="Search user name, email, course, program..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 text-sm rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/10 text-[#3B3B3B] dark:text-white placeholder:text-[#696969]/60 focus:outline-none focus:ring-1.5 focus:ring-black/15 dark:focus:ring-white/20 transition-all shadow-2xs"
            />
          </div>

          {/* Role Filter Dropdown */}
          <div className="w-44 shrink-0">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="h-10 w-full rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/10 text-xs font-semibold text-[#696969] hover:text-[#3B3B3B] dark:text-gray-400 dark:hover:text-white px-3.5 shadow-2xs cursor-pointer">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-slate-900 text-xs shadow-xl">
                <SelectItem value="ALL" className="text-xs py-1.5 cursor-pointer">
                  All Roles ({users.length})
                </SelectItem>
                <SelectItem value="student" className="text-xs py-1.5 cursor-pointer">
                  Students ({studentCount})
                </SelectItem>
                <SelectItem value="teacher" className="text-xs py-1.5 cursor-pointer">
                  Teachers ({teacherCount})
                </SelectItem>
                <SelectItem value="admin" className="text-xs py-1.5 cursor-pointer">
                  Admins ({adminCount})
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Right Action buttons: Delete Selected */}
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <button
              type="button"
              onClick={() => setConfirmDeleteOpen(true)}
              className="flex items-center gap-1.5 px-3.5 h-9 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/30 hover:bg-rose-100 transition-all shadow-2xs cursor-pointer animate-in fade-in zoom-in-95 duration-150"
            >
              <Trash className="h-3.5 w-3.5" />
              <span>Delete Selected ({selectedIds.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Styled Data Table */}
      <div className="w-full overflow-hidden rounded-2xl border border-black/5 dark:border-white/10 bg-card shadow-2xs">
        <div className="max-h-[920px] overflow-y-auto">
          <table className="w-full text-left border-collapse" aria-label="All users table">
            <thead className="sticky top-0 z-10 bg-[#F2F2F2]/80 dark:bg-[#14161b]/90 backdrop-blur-xs border-b border-black/5 dark:border-white/10">
              <tr className="h-11 text-xs font-semibold uppercase tracking-wider text-[#696969]/80 dark:text-gray-400">
                <th className="w-12 px-4 text-center" scope="col"></th>
                <th className="px-4 py-2.5" scope="col">
                  <SortButton label="Name" field="name" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                </th>
                <th className="px-4 py-2.5" scope="col">
                  <SortButton label="Email" field="email" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                </th>
                <th className="px-4 py-2.5" scope="col">
                  <SortButton label="Course" field="academic_course_name" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                </th>
                <th className="px-4 py-2.5" scope="col">
                  <SortButton label="Program" field="program_name" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                </th>
                <th className="px-4 py-2.5" scope="col">
                  <SortButton label="Major" field="major_name" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                </th>
                <th className="px-4 py-2.5" scope="col">
                  <SortButton label="Role" field="role" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                </th>
                <th className="px-4 py-2.5" scope="col">
                  <SortButton label="Joined" field="created_at" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                </th>
                <th className="px-4 py-2.5 text-right pr-6" scope="col">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5 text-sm">
              {sorted.length === 0 ? (
                <tr>
                  <td className="py-12 text-center text-sm font-medium text-[#696969]" colSpan={9}>
                    {search ? `No users matching "${search}"` : "No users found."}
                  </td>
                </tr>
              ) : (
                sorted.map((user) => {
                  const isCurrentAdmin = user.id === currentUserId
                  const isChecked = selectedIds.includes(user.id)
                  const isStudent = user.role === "student"
                  const courseName = isStudent ? (user.academic_course_name || user.course || "—") : "—"
                  const programName = isStudent ? (user.program_name || "—") : "—"
                  const majorName = isStudent ? (user.major_name || "—") : "—"

                  return (
                    <tr
                      key={user.id}
                      className={`h-13 transition-colors hover:bg-black/[0.015] dark:hover:bg-white/[0.02] ${
                        isChecked ? "bg-black/[0.02] dark:bg-white/[0.03]" : ""
                      }`}
                    >
                      <td className="px-4 text-center">
                        <div
                          onClick={() => {
                            if (!isCurrentAdmin) handleToggleUser(user.id)
                          }}
                          className={`mx-auto size-4.5 rounded-md border flex items-center justify-center transition-all cursor-pointer select-none ${
                            isChecked
                              ? "bg-[#3B3B3B] dark:bg-white border-[#3B3B3B] dark:border-white text-white dark:text-gray-900 shadow-xs"
                              : "border-black/20 dark:border-white/20 bg-white/60 dark:bg-white/5 hover:border-black/40 dark:hover:border-white/40"
                          } ${isCurrentAdmin ? "opacity-30 cursor-not-allowed" : ""}`}
                          title={isCurrentAdmin ? "Cannot select yourself" : `Select ${user.name}`}
                        >
                          {isChecked && <Check className="size-3 stroke-[2.5]" />}
                        </div>
                      </td>
                      <td className="px-4 font-semibold">
                        <Link
                          href={`/admin/users/${user.id}`}
                          className="text-[#2563EB] hover:text-[#1D4ED8] dark:text-[#60A5FA] dark:hover:text-[#93C5FD] hover:underline transition-colors"
                        >
                          {user.name}
                        </Link>
                      </td>
                      <td className="px-4 text-sm text-[#696969] dark:text-gray-300 font-normal">{user.email}</td>
                      <td className="px-4 text-sm text-[#696969] dark:text-gray-300 font-normal max-w-[200px]" title={isStudent && courseName !== "—" ? courseName : undefined}>
                        <span className="block truncate">
                          {isStudent ? courseName : ""}
                        </span>
                      </td>
                      <td className="px-4 text-sm text-[#696969] dark:text-gray-300 font-normal whitespace-nowrap">
                        {isStudent ? programName : ""}
                      </td>
                      <td className="px-4 text-sm text-[#696969] dark:text-gray-300 font-normal whitespace-nowrap">
                        {isStudent ? majorName : ""}
                      </td>
                      <td className="px-4 text-sm">
                        {(() => {
                          const r = user.role
                          if (r === "super_admin" || r === "admin") {
                            return (
                              <span className="font-semibold text-[#3B3B3B] dark:text-gray-200">
                                Super Admin
                              </span>
                            )
                          }
                          if (r === "academic_admin") {
                            return (
                              <span className="font-semibold text-[#3B3B3B] dark:text-gray-200">
                                Academic Coord.
                              </span>
                            )
                          }
                          if (r === "registrar") {
                            return (
                              <span className="font-semibold text-[#3B3B3B] dark:text-gray-200">
                                Registrar
                              </span>
                            )
                          }
                          if (r === "teacher") {
                            return (
                              <span className="font-semibold text-[#696969] dark:text-gray-300">
                                Instructor
                              </span>
                            )
                          }
                          return (
                            <span className="font-medium capitalize text-[#696969] dark:text-gray-300">
                              {r}
                            </span>
                          )
                        })()}
                      </td>
                      <td className="px-4 text-sm text-[#696969] dark:text-gray-400 font-normal whitespace-nowrap">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 text-right pr-6">
                        <div className="flex justify-end">
                          <ActionButtons
                            user={user}
                            currentUserId={currentUserId}
                          />
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {search && sorted.length > 0 && (
        <p className="mt-2 text-xs text-[#696969] text-right">
          Showing {sorted.length} of {users.length} users.
        </p>
      )}

      {/* Confirmation Dialog for Batch Delete */}
      <ConfirmDeleteModal
        isOpen={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={handleBulkDelete}
        title="Delete Selected Users"
        message={`Are you sure you want to permanently delete ${selectedIds.length} selected user${selectedIds.length > 1 ? "s" : ""}? This action cannot be undone.`}
        confirmText={bulkDeleteLoading ? "Deleting…" : `Delete ${selectedIds.length} User${selectedIds.length > 1 ? "s" : ""}`}
      />
    </div>
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
                  <p className="text-sm text-muted-foreground py-3 text-center border border-solid border-border rounded-md">
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
                  <p className="text-sm text-muted-foreground py-3 text-center border border-solid border-border rounded-md">
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
                          Add
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
