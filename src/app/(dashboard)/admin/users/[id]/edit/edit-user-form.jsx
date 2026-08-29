// this tells nextjs to run this edit form in the browser
"use client"

// helper tools from react to store form state and fetch master data
import { useState, useEffect, useRef, useMemo } from "react"

// router helper to redirect back after saving
import { useRouter } from "next/navigation"

// helper to create links
import Link from "next/link"

// icons used on form section headers and buttons
import {
    ArrowLeft, User, UserCog, Save, ChevronRight, ChevronDown, Check,
} from "lucide-react"

// form component helpers
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

// ─── Nested Category Tree Helpers (Direct Curriculum Categories) ──────────────
function buildCourseTreeFromMasterData(masterData) {
    const { examinations = [], categories = [] } = masterData

    if (examinations.length === 0) return []

    return examinations.map(exam => {
        const examNameLower = exam.name.trim().toLowerCase()

        // Categories targeted to this examination
        const examCategories = categories.filter(c => {
            const cTarget = (c.target_course || "all").trim().toLowerCase()
            if (cTarget === "all") {
                // If set to 'all' or default, attach to first/primary exam (e.g. LEPT)
                return examNameLower === "lept" || exam.id === examinations[0]?.id
            }
            return cTarget === examNameLower || examNameLower.includes(cTarget) || cTarget.includes(examNameLower)
        })

        return {
            id: `exam_${exam.id}`,
            entityType: 'exam',
            rawId: exam.id,
            label: exam.name,
            children: examCategories.map(cat => ({
                id: `exam_${exam.id}_cat_${cat.id}`,
                entityType: 'category',
                rawId: cat.id,
                label: cat.name,
                children: []
            }))
        }
    })
}

function allLeafIds(node) {
    if (!node.children || node.children.length === 0) return [node.id]
    return node.children.flatMap(allLeafIds)
}

function allIds(node) {
    const ids = [node.id]
    if (node.children) ids.push(...node.children.flatMap(allIds))
    return ids
}

function toggleNode(selected, node, tree) {
    const leaves = allLeafIds(node)
    const selfIds = allIds(node)
    const allLeafSelected = leaves.every(id => selected.has(id))

    const next = new Set(selected)
    if (allLeafSelected) {
        selfIds.forEach(id => next.delete(id))
    } else {
        selfIds.forEach(id => next.add(id))
    }
    return reconcile(next, tree)
}

function reconcile(selected, nodes) {
    for (const node of nodes) {
        if (!node.children) continue
        reconcile(selected, node.children)
        const leaves = allLeafIds(node)
        if (leaves.every(id => selected.has(id))) {
            selected.add(node.id)
        } else {
            selected.delete(node.id)
        }
    }
    return selected
}

function checkState(selected, node) {
    const leaves = allLeafIds(node)
    const count = leaves.filter(id => selected.has(id)).length
    if (count === 0) return "none"
    if (count === leaves.length) return "all"
    return "some"
}

function buildSummary(selected, tree) {
    if (selected.size === 0) return "Select courses…"

    const parts = []
    for (const exam of tree) {
        const state = checkState(selected, exam)
        if (state === "all") {
            parts.push(exam.label)
        } else if (state === "some" && exam.children) {
            for (const prog of exam.children) {
                const ps = checkState(selected, prog)
                if (ps === "all") {
                    parts.push(`${exam.label} › ${prog.label}`)
                } else if (ps === "some" && prog.children) {
                    const subs = prog.children
                        .filter(m => selected.has(m.id))
                        .map(m => m.label)
                    parts.push(...subs)
                }
            }
        }
    }
    if (parts.length === 0) return "Select courses…"
    if (parts.length > 2) return `${parts.slice(0, 2).join(", ")} +${parts.length - 2} more`
    return parts.join(", ")
}

function TreeCheckbox({ state }) {
    const base = "w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border transition-colors"
    if (state === "all")
        return (
            <span className={`${base} bg-primary border-primary`}>
                <Check className="h-2.5 w-2.5 text-primary-foreground" strokeWidth={3} />
            </span>
        )
    if (state === "some")
        return (
            <span className={`${base} bg-primary/20 border-primary`}>
                <span className="w-2 h-0.5 rounded-full bg-primary" />
            </span>
        )
    return <span className={`${base} border-muted-foreground/30 bg-background`} />
}

function TreeRow({ node, selected, onToggle, depth = 0 }) {
    const [open, setOpen] = useState(depth === 0)
    const hasChildren = node.children && node.children.length > 0
    const state = checkState(selected, node)

    return (
        <div>
            <div
                className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-muted/60 transition-colors select-none"
                style={{ paddingLeft: `${12 + depth * 16}px` }}
                onClick={() => {
                    if (hasChildren) setOpen(o => !o)
                    onToggle(node)
                }}
            >
                {hasChildren ? (
                    <ChevronRight
                        className={`h-3.5 w-3.5 text-muted-foreground flex-shrink-0 transition-transform ${open ? "rotate-90" : ""}`}
                        onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
                    />
                ) : (
                    <span className="w-3.5 flex-shrink-0" />
                )}

                <TreeCheckbox state={state} />

                <span
                    className={`text-[13px] leading-tight font-medium ${
                        depth === 0
                            ? "text-foreground font-bold"
                            : depth === 1
                            ? "text-foreground font-semibold"
                            : "text-muted-foreground"
                    }`}
                >
                    {node.label}
                </span>
            </div>

            {hasChildren && open && (
                <div>
                    {node.children.map(child => (
                        <TreeRow
                            key={child.id}
                            node={child}
                            selected={selected}
                            onToggle={onToggle}
                            depth={depth + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

function CourseMultiSelect({ selected, onChange, tree }) {
    const [open, setOpen] = useState(false)
    const ref = useRef(null)

    useEffect(() => {
        function handler(e) {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false)
        }
        document.addEventListener("mousedown", handler)
        return () => document.removeEventListener("mousedown", handler)
    }, [])

    function handleToggle(node) {
        const nextSet = toggleNode(new Set(selected), node, tree)
        onChange(Array.from(nextSet))
    }

    const summary = buildSummary(new Set(selected), tree)
    const hasSelection = selected.length > 0

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm text-left flex items-center justify-between focus:outline-none focus:ring-1 focus:ring-ring transition-colors cursor-pointer"
            >
                <span className={`truncate ${hasSelection ? "text-foreground font-medium" : "text-muted-foreground font-normal"}`}>
                    {summary}
                </span>
                <ChevronDown className={`h-4 w-4 text-muted-foreground flex-shrink-0 ml-2 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>

            {open && (
                <div className="absolute z-50 mt-1.5 w-full bg-popover rounded-xl border border-border shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-2 border-b border-border bg-muted/40">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Select Target Courses</span>
                    </div>

                    <div className="max-h-64 overflow-y-auto py-1.5 px-1">
                        {tree.length === 0 ? (
                            <div className="text-center py-6 text-xs text-muted-foreground">
                                No examinations or courses configured yet.
                            </div>
                        ) : (
                            tree.map(exam => (
                                <TreeRow
                                    key={exam.id}
                                    node={exam}
                                    selected={new Set(selected)}
                                    onToggle={handleToggle}
                                    depth={0}
                                />
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

// interactive form component to edit an existing user profile
export default function EditUserForm({ initialUser }) {
    const router = useRouter()
    const [error, setError] = useState("")
    const [saving, setSaving] = useState(false)

    // account details prefilled with existing user info
    const [email, setEmail] = useState(initialUser.email || "")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [role, setRole] = useState(initialUser.role || "student")
    const [jobRoleDescription, setJobRoleDescription] = useState(initialUser.job_role_description || "")

    // personal profile information prefilled with existing user info
    const [firstName, setFirstName] = useState(initialUser.first_name || "")
    const [middleName, setMiddleName] = useState(initialUser.middle_name || "")
    const [lastName, setLastName] = useState(initialUser.last_name || "")
    const [suffix, setSuffix] = useState(initialUser.suffix || "")
    const [birthday, setBirthday] = useState(
        initialUser.birthday ? new Date(initialUser.birthday).toISOString().split('T')[0] : ""
    )
    const [gender, setGender] = useState(initialUser.gender || "")
    const [phone, setPhone] = useState(initialUser.phone || "")
    const [address, setAddress] = useState(initialUser.address || "")
    const [city, setCity] = useState(initialUser.city || "")
    const [province, setProvince] = useState(initialUser.province || "")
    const [zipCode, setZipCode] = useState(initialUser.zip_code || "")

    // ── Education Background ──
    const [schoolId, setSchoolId] = useState(initialUser.school_id ? String(initialUser.school_id) : "")
    const [academicCourseId, setAcademicCourseId] = useState(initialUser.academic_course_id ? String(initialUser.academic_course_id) : "")
    const [yearGraduated, setYearGraduated] = useState(initialUser.year_graduated || "")
    const [highestEducation, setHighestEducation] = useState(initialUser.highest_education || "")

    // ── Master Data ──
    const [examId, setExamId] = useState(initialUser.exam_id ? String(initialUser.exam_id) : "")
    const [batchId, setBatchId] = useState(initialUser.batch_id ? String(initialUser.batch_id) : "")
    const [programId, setProgramId] = useState(initialUser.program_id ? String(initialUser.program_id) : "")
    const [majorId, setMajorId] = useState(initialUser.major_id ? String(initialUser.major_id) : "")
    const [teacherTargets, setTeacherTargets] = useState(() => {
        if (Array.isArray(initialUser.targets) && initialUser.targets.length > 0) {
            return initialUser.targets
        }
        if (initialUser.role === "teacher" && initialUser.exam_id) {
            return [`exam_${initialUser.exam_id}`]
        }
        return []
    })
    const [dropdownData, setDropdownData] = useState({ examinations: [], batches: [], programs: [], majors: [], schools: [], academic_courses: [] })

    // Course tree for multi-select
    const courseTree = useMemo(() => {
        return buildCourseTreeFromMasterData(dropdownData)
    }, [dropdownData])

    // ── Avatar Upload ──
    const [avatarUrl, setAvatarUrl] = useState(initialUser.avatar_url || "")
    const [uploadingAvatar, setUploadingAvatar] = useState(false)

    useEffect(() => {
        fetch("/api/admin/master-data/dropdowns")
            .then(res => res.json())
            .then(data => {
                if (data && !data.error) {
                    setDropdownData(data)
                }
            })
            .catch(err => console.error("Failed to load dropdowns:", err))
    }, [])

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
            setError("Failed to upload avatar image.")
        } finally {
            setUploadingAvatar(false)
        }
    }

    async function handleSubmit(e) {
        e.preventDefault()
        setError("")

        if (!email.trim()) {
            setError("Email is required.")
            return
        }

        if (password && password !== confirmPassword) {
            setError("Passwords do not match.")
            return
        }

        if (password && password.length < 6) {
            setError("Password must be at least 6 characters.")
            return
        }

        if (role === "student" && (!examId || !batchId)) {
            setError("Target Examination and Batch are required for students.")
            return
        }

        if (role === "teacher" && !examId && teacherTargets.length === 0) {
            setError("Assigned Examination or Course targets are required for teachers.")
            return
        }

        if (role === "admin" && !jobRoleDescription.trim()) {
            setError("Job Role Description is required for admins.")
            return
        }

        setSaving(true)

        // Extract primary exam_id from teacherTargets if examId is empty
        let resolvedExamId = examId
        if (role === "teacher" && (!resolvedExamId || resolvedExamId === "")) {
            const firstExamTarget = teacherTargets.find(t => String(t).startsWith("exam_"))
            if (firstExamTarget) {
                resolvedExamId = firstExamTarget.replace("exam_", "")
            } else if (dropdownData.examinations.length > 0) {
                resolvedExamId = dropdownData.examinations[0].id.toString()
            }
        }

        try {
            const fullName = [firstName, middleName, lastName, suffix].filter(Boolean).join(" ").trim() || initialUser.name || email.split("@")[0]

            const payload = {
                name: fullName,
                email: email.toLowerCase().trim(),
                role,
                first_name: firstName.trim() || null,
                middle_name: middleName.trim() || null,
                last_name: lastName.trim() || null,
                suffix: suffix.trim() || null,
                birthday: birthday || null,
                gender: gender || null,
                phone: phone.trim() || null,
                address: address.trim() || null,
                city: city.trim() || null,
                province: province.trim() || null,
                zip_code: zipCode.trim() || null,
                highest_education: highestEducation || null,
                school_id: schoolId ? parseInt(schoolId) : null,
                academic_course_id: academicCourseId ? parseInt(academicCourseId) : null,
                year_graduated: yearGraduated ? parseInt(yearGraduated) : null,
                exam_id: role !== "admin" && resolvedExamId ? parseInt(resolvedExamId) : null,
                batch_id: role !== "admin" && batchId ? parseInt(batchId) : null,
                program_id: role !== "admin" && programId ? parseInt(programId) : null,
                major_id: role !== "admin" && majorId ? parseInt(majorId) : null,
                job_role_description: role === "admin" ? jobRoleDescription.trim() : null,
                avatar_url: avatarUrl || null,
                targets: role === "teacher" ? teacherTargets : [],
            }

            if (password) {
                payload.password = password
            }

            const res = await fetch(`/api/admin/users?id=${initialUser.id}`, {
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

            router.push("/admin/users")
            router.refresh()
        } catch {
            setError("Network error. Please try again.")
            setSaving(false)
        }
    }

    return (
        <div className="space-y-6 w-full max-w-4xl mx-auto px-4 py-4 pb-16">
            {/* Header */}
            <div className="border-b border-border pb-5">
                <div className="flex items-center gap-2 mb-1">
                    <UserCog className="h-6 w-6 text-[#E9C46A]" />
                    <h1 className="text-2xl font-bold tracking-wider text-foreground uppercase">
                        EDIT USER
                    </h1>
                </div>
                <p className="text-muted-foreground text-sm font-medium">
                    Update personal, educational, and account details below.
                </p>
            </div>

            {error && (
                <div className="rounded-md bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* ═══ Personal Information ═══ */}
                <section className="rounded-lg border border-border/80 bg-card/70 p-6 shadow-2xs space-y-5">
                    <div className="border-b border-border pb-3">
                        <h2 className="text-lg font-semibold text-foreground">Personal Information</h2>
                    </div>

                    {/* Avatar Upload */}
                    <div className="flex flex-col sm:flex-row items-center gap-5 pb-4 border-b border-border/50">
                        <div className="relative h-20 w-20 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-solid border-border flex items-center justify-center overflow-hidden">
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
                <section className="rounded-lg border border-border/80 bg-card/70 p-6 shadow-2xs space-y-5">
                    <div className="border-b border-border pb-3">
                        <h2 className="text-lg font-semibold text-foreground">Education Background</h2>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <Label>Highest Education</Label>
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
                        <div className="space-y-1.5">
                            <Label>School / University</Label>
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
                        <div className="space-y-1.5">
                            <Label>Course / Program</Label>
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
                        <div className="space-y-1.5">
                            <Label htmlFor="year-grad">Year Graduated</Label>
                            <Input id="year-grad" type="number" min="1950" max="2099" value={yearGraduated} onChange={(e) => setYearGraduated(e.target.value)} placeholder="2024" />
                        </div>
                    </div>
                </section>

                {/* ═══ Account Details ═══ */}
                <section className="rounded-lg border border-border/80 bg-card/70 p-6 shadow-2xs space-y-5">
                    <div className="border-b border-border pb-3">
                        <h2 className="text-lg font-semibold text-foreground">Account Details</h2>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5 sm:col-span-2">
                            <Label htmlFor="edit-email">Email *</Label>
                            <Input id="edit-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="juan@school.edu" />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="edit-password">New Password <span className="text-xs font-normal text-muted-foreground">(leave blank to keep current)</span></Label>
                            <Input id="edit-password" type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="edit-confirm-password">Confirm New Password</Label>
                            <Input id="edit-confirm-password" type="password" minLength={6} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" />
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
                                <Label htmlFor="edit-job-role">Job Role Description *</Label>
                                <Input id="edit-job-role" value={jobRoleDescription} onChange={(e) => setJobRoleDescription(e.target.value)} placeholder="e.g. System Administrator, Content Manager" required />
                            </div>
                        )}

                        {role === "teacher" && (
                            <div className="space-y-3 sm:col-span-2">
                                <div className="space-y-1.5">
                                    <Label>Target Examination / Courses / Specializations *</Label>
                                    <CourseMultiSelect
                                        selected={teacherTargets}
                                        onChange={(newTargets) => {
                                            setTeacherTargets(newTargets)
                                            const firstExam = newTargets.find(t => String(t).startsWith("exam_"))
                                            if (firstExam) {
                                                setExamId(firstExam.replace("exam_", ""))
                                            }
                                        }}
                                        tree={courseTree}
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Select the examination, programs, or specific major specializations this teacher can teach or access (e.g. Gen Ed, Prof Ed, English, Mathematics).
                                    </p>
                                </div>
                            </div>
                        )}

                        {role === "student" && (
                            <>
                                <div className="space-y-1.5">
                                    <Label>Target Examination *</Label>
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
                                    <div className="space-y-1.5">
                                        <Label>Course / Program</Label>
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
                                    <div className="space-y-1.5">
                                        <Label>Specialization / Major</Label>
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
                                <div className="space-y-1.5">
                                    <Label>Batch *</Label>
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

                {/* ═══ Actions ═══ */}
                <div className="flex items-center justify-end gap-3 pt-2">
                    <Link href="/admin/users">
                        <Button type="button" variant="outline">Cancel</Button>
                    </Link>
                    <Button type="submit" disabled={saving}>
                        {saving ? (
                            <>
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                Saving…
                            </>
                        ) : (
                            "Save Changes"
                        )}
                    </Button>
                </div>
            </form>
        </div>
    )
}
