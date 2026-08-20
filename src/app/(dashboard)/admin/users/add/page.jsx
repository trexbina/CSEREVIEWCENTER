"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
    ArrowLeft, UserPlus, User, GraduationCap, Shield,
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

export default function AddUserPage() {
    const router = useRouter()
    const [error, setError] = useState("")
    const [saving, setSaving] = useState(false)

    // ── Account ──
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
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
        fetch("/api/admin/master-data/dropdowns")
            .then(res => res.json())
            .then(data => {
                if (data.examinations) setDropdownData(data)
            })
            .catch(console.error)
    }, [])

    async function handleSubmit(e) {
        e.preventDefault()
        setError("")

        if (password !== confirmPassword) {
            setError("Passwords do not match.")
            return
        }
        if (role !== "admin" && (!examId || !batchId)) {
            setError("Target Examination and Batch are required.")
            return
        }
        if (role === "admin" && !jobRoleDescription) {
            setError("Job Role Description is required for admins.")
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
                    email,
                    password,
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
                }),
            })

            const data = await res.json()

            if (!res.ok) {
                setError(data.error || "Failed to create user.")
                setSaving(false)
                return
            }

            router.push("/admin/users")
            router.refresh()
        } catch {
            setError("Network error. Please try again.")
            setSaving(false)
        }
    }

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Link
                    href="/admin/users"
                    className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <UserPlus className="h-6 w-6 text-primary" />
                        Add New User
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Fill in the details below to create a new account.
                    </p>
                </div>
            </div>

            {error && (
                <div className="rounded-md bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* ═══ Personal Information ═══ */}
                <section className="rounded-lg border border-border bg-card p-6 shadow-sm space-y-5">
                    <div className="flex items-center gap-2 border-b border-border pb-3">
                        <User className="h-5 w-5 text-primary" />
                        <h2 className="text-lg font-semibold text-foreground">Personal Information</h2>
                    </div>

                    {/* Avatar Upload */}
                    <div className="flex flex-col sm:flex-row items-center gap-5 pb-4 border-b border-border/50">
                        <div className="relative h-20 w-20 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-border flex items-center justify-center overflow-hidden">
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
                            <Label htmlFor="avatar-file" className="cursor-pointer inline-flex items-center gap-1.5 rounded-md bg-secondary px-3 py-1.5 text-xs font-bold text-secondary-foreground hover:bg-secondary/80 transition-colors">
                                Upload Photo
                            </Label>
                            <input
                                id="avatar-file"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleAvatarUpload}
                            />
                            <p className="text-[10px] text-muted-foreground">JPG, PNG or WEBP. Max size 2MB.</p>
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="first-name">First Name *</Label>
                            <Input id="first-name" required value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Juan" />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="middle-name">Middle Name</Label>
                            <Input id="middle-name" value={middleName} onChange={(e) => setMiddleName(e.target.value)} placeholder="Santos" />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="last-name">Last Name *</Label>
                            <Input id="last-name" required value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Dela Cruz" />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="suffix">Suffix</Label>
                            <Input id="suffix" value={suffix} onChange={(e) => setSuffix(e.target.value)} placeholder="Jr., III" />
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="birthday">Birthday</Label>
                            <Input id="birthday" type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Gender</Label>
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
                        <div className="space-y-1.5">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+63 9XX XXX XXXX" />
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5 sm:col-span-2">
                            <Label htmlFor="address">Street Address</Label>
                            <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Main St., Barangay Example" />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="city">City / Municipality</Label>
                            <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Quezon City" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="province">Province</Label>
                                <Input id="province" value={province} onChange={(e) => setProvince(e.target.value)} placeholder="Metro Manila" />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="zip">ZIP Code</Label>
                                <Input id="zip" value={zipCode} onChange={(e) => setZipCode(e.target.value)} placeholder="1100" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* ═══ Education Background ═══ */}
                <section className="rounded-lg border border-border bg-card p-6 shadow-sm space-y-5">
                    <div className="flex items-center gap-2 border-b border-border pb-3">
                        <GraduationCap className="h-5 w-5 text-primary" />
                        <h2 className="text-lg font-semibold text-foreground">Education Background</h2>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <Label>Highest Education</Label>
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
                        <div className="space-y-1.5">
                            <Label>School / University</Label>
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
                        <div className="space-y-1.5">
                            <Label>Course / Program</Label>
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
                        <div className="space-y-1.5">
                            <Label htmlFor="year-grad">Year Graduated</Label>
                            <Input id="year-grad" type="number" min="1950" max="2099" value={yearGraduated} onChange={(e) => setYearGraduated(e.target.value)} placeholder="2024" />
                        </div>
                    </div>
                </section>

                {/* ═══ Account Details ═══ */}
                <section className="rounded-lg border border-border bg-card p-6 shadow-sm space-y-5">
                    <div className="flex items-center gap-2 border-b border-border pb-3">
                        <Shield className="h-5 w-5 text-primary" />
                        <h2 className="text-lg font-semibold text-foreground">Account Details</h2>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5 sm:col-span-2">
                            <Label htmlFor="add-email">Email *</Label>
                            <Input id="add-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="juan@school.edu" />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="add-password">Password *</Label>
                            <Input id="add-password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="confirm-password">Confirm Password *</Label>
                            <Input id="confirm-password" type="password" required minLength={6} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" />
                        </div>
                        <div className="space-y-1.5">
                            <Label>User Type *</Label>
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
                            <div className="space-y-1.5">
                                <Label htmlFor="job-role">Job Role Description *</Label>
                                <Input id="job-role" value={jobRoleDescription} onChange={(e) => setJobRoleDescription(e.target.value)} placeholder="e.g. System Administrator, Content Manager" required />
                            </div>
                        )}

                        {role !== "admin" && (
                            <>
                                <div className="space-y-1.5">
                                    <Label>Target Examination *</Label>
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
                                    <div className="space-y-1.5">
                                        <Label>Course / Program</Label>
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
                                    <div className="space-y-1.5">
                                        <Label>Specialization / Major</Label>
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
                                <div className="space-y-1.5">
                                    <Label>Batch *</Label>
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

                {/* ═══ Actions ═══ */}
                <div className="flex items-center justify-end gap-3 pt-2">
                    <Link href="/admin/users">
                        <Button type="button" variant="outline">Cancel</Button>
                    </Link>
                    <Button type="submit" disabled={saving} className="gap-2">
                        {saving ? (
                            <>
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                Creating…
                            </>
                        ) : (
                            <>
                                <UserPlus className="h-4 w-4" />
                                Create User
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    )
}
