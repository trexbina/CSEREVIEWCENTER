// this tells nextjs to run this create user form in the browser
"use client"

// helper tools from react to hold form input state and load dropdown options
import { useState, useEffect, useRef, useMemo } from "react"

// router helper to redirect after creating a user
import { useRouter } from "next/navigation"

// helper to create links
import Link from "next/link"

// icons used on form section headers and buttons
import {
    ArrowLeft, UserPlus, User, GraduationCap, Shield, ChevronRight, ChevronDown, Check,
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

// create new user account page component
export default function AddUserPage() {
    const router = useRouter()
    const [error, setError] = useState("")
    const [saving, setSaving] = useState(false)

    // account details state
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [role, setRole] = useState("student")
    const [jobRoleDescription, setJobRoleDescription] = useState("")

    // personal profile information state
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
    const [teacherTargets, setTeacherTargets] = useState([])
    const [dropdownData, setDropdownData] = useState({ examinations: [], batches: [], programs: [], majors: [], schools: [], academic_courses: [] })

    // Course tree for multi-select
    const courseTree = useMemo(() => {
        return buildCourseTreeFromMasterData(dropdownData)
    }, [dropdownData])

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
        if (role === "student" && (!examId || !batchId)) {
            setError("Target Examination and Batch are required for students.")
            return
        }
        if (role === "teacher" && !examId && teacherTargets.length === 0) {
            setError("Assigned Examination or Course targets are required for teachers.")
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
                    exam_id: resolvedExamId ? parseInt(resolvedExamId) : null,
                    batch_id: role !== "admin" && batchId ? parseInt(batchId) : null,
                    program_id: role !== "admin" && programId ? parseInt(programId) : null,
                    major_id: role !== "admin" && majorId ? parseInt(majorId) : null,
                    job_role_description: role === "admin" ? jobRoleDescription : null,
                    avatar_url: avatarUrl || null,
                    targets: role === "teacher" ? teacherTargets : [],
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
        <div className="space-y-6 w-full max-w-4xl mx-auto px-2 sm:px-4 py-2 pb-16">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-black/5 dark:border-white/10">
                <div className="flex items-center gap-3">
                    <Link
                        href="/admin/users"
                        className="flex items-center justify-center size-9 rounded-xl bg-white dark:bg-white/10 text-[#696969] hover:text-[#3B3B3B] dark:hover:text-white border border-black/5 dark:border-white/10 shadow-2xs transition-all cursor-pointer"
                        title="Back to Users"
                    >
                        <ArrowLeft className="size-4" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold tracking-wide text-[#3B3B3B] dark:text-white">
                            Add New User
                        </h1>
                        <p className="text-xs text-[#696969] dark:text-gray-400">
                            Create and configure a new account.
                        </p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200/70 dark:border-rose-900/30 p-3.5 text-xs font-semibold text-rose-600">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* ═══ Personal Information ═══ */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2.5 pt-1">
                        <User className="size-4.5 text-[#696969]" />
                        <h2 className="text-base font-bold uppercase tracking-wider text-[#3B3B3B] dark:text-white">
                            Personal Information
                        </h2>
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
                            <Label htmlFor="avatar-file" className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl bg-white dark:bg-white/10 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-[#3B3B3B] dark:text-white hover:bg-white/80 border border-black/5 dark:border-white/10 transition-all shadow-2xs">
                                Upload Photo
                            </Label>
                            <input
                                id="avatar-file"
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
                            <Label htmlFor="first-name" className="text-sm font-semibold text-[#696969]">First Name *</Label>
                            <input id="first-name" required value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Juan" className="w-full h-10.5 px-3.5 text-sm rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/10 text-[#3B3B3B] dark:text-white placeholder:text-[#696969]/50 focus:outline-none focus:ring-1.5 focus:ring-black/15 shadow-2xs transition-all" />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="middle-name" className="text-sm font-semibold text-[#696969]">Middle Name</Label>
                            <input id="middle-name" value={middleName} onChange={(e) => setMiddleName(e.target.value)} placeholder="Santos" className="w-full h-10.5 px-3.5 text-sm rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/10 text-[#3B3B3B] dark:text-white placeholder:text-[#696969]/50 focus:outline-none focus:ring-1.5 focus:ring-black/15 shadow-2xs transition-all" />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="last-name" className="text-sm font-semibold text-[#696969]">Last Name *</Label>
                            <input id="last-name" required value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Dela Cruz" className="w-full h-10.5 px-3.5 text-sm rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/10 text-[#3B3B3B] dark:text-white placeholder:text-[#696969]/50 focus:outline-none focus:ring-1.5 focus:ring-black/15 shadow-2xs transition-all" />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="suffix" className="text-sm font-semibold text-[#696969]">Suffix</Label>
                            <input id="suffix" value={suffix} onChange={(e) => setSuffix(e.target.value)} placeholder="Jr., III" className="w-full h-10.5 px-3.5 text-sm rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/10 text-[#3B3B3B] dark:text-white placeholder:text-[#696969]/50 focus:outline-none focus:ring-1.5 focus:ring-black/15 shadow-2xs transition-all" />
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="birthday" className="text-sm font-semibold text-[#696969]">Birthday</Label>
                            <input id="birthday" type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} className="w-full h-10.5 px-3.5 text-sm rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/10 text-[#3B3B3B] dark:text-white focus:outline-none focus:ring-1.5 focus:ring-black/15 shadow-2xs transition-all" />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-sm font-semibold text-[#696969]">Gender</Label>
                            <Select value={gender || "none"} onValueChange={(val) => setGender(val === "none" ? "" : val)}>
                                <SelectTrigger className="w-full h-10.5 rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/10 text-sm text-[#3B3B3B] dark:text-white shadow-2xs"><SelectValue placeholder="Select gender" /></SelectTrigger>
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
                            <Label htmlFor="phone" className="text-sm font-semibold text-[#696969]">Phone Number</Label>
                            <input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+63 9XX XXX XXXX" className="w-full h-10.5 px-3.5 text-sm rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/10 text-[#3B3B3B] dark:text-white placeholder:text-[#696969]/50 focus:outline-none focus:ring-1.5 focus:ring-black/15 shadow-2xs transition-all" />
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5 sm:col-span-2">
                            <Label htmlFor="address" className="text-sm font-semibold text-[#696969]">Street Address</Label>
                            <input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Main St., Barangay Example" className="w-full h-10.5 px-3.5 text-sm rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/10 text-[#3B3B3B] dark:text-white placeholder:text-[#696969]/50 focus:outline-none focus:ring-1.5 focus:ring-black/15 shadow-2xs transition-all" />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="city" className="text-sm font-semibold text-[#696969]">City / Municipality</Label>
                            <input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Quezon City" className="w-full h-10.5 px-3.5 text-sm rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/10 text-[#3B3B3B] dark:text-white placeholder:text-[#696969]/50 focus:outline-none focus:ring-1.5 focus:ring-black/15 shadow-2xs transition-all" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="province" className="text-sm font-semibold text-[#696969]">Province</Label>
                                <input id="province" value={province} onChange={(e) => setProvince(e.target.value)} placeholder="Metro Manila" className="w-full h-10.5 px-3.5 text-sm rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/10 text-[#3B3B3B] dark:text-white placeholder:text-[#696969]/50 focus:outline-none focus:ring-1.5 focus:ring-black/15 shadow-2xs transition-all" />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="zip" className="text-sm font-semibold text-[#696969]">ZIP Code</Label>
                                <input id="zip" value={zipCode} onChange={(e) => setZipCode(e.target.value)} placeholder="1100" className="w-full h-10.5 px-3.5 text-sm rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/10 text-[#3B3B3B] dark:text-white placeholder:text-[#696969]/50 focus:outline-none focus:ring-1.5 focus:ring-black/15 shadow-2xs transition-all" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* ═══ Education Background ═══ */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2.5 pt-1">
                        <GraduationCap className="size-4.5 text-[#696969]" />
                        <h2 className="text-base font-bold uppercase tracking-wider text-[#3B3B3B] dark:text-white">
                            Education Background
                        </h2>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <Label className="text-sm font-semibold text-[#696969]">Highest Education</Label>
                            <Select value={highestEducation || "none"} onValueChange={(val) => setHighestEducation(val === "none" ? "" : val)}>
                                <SelectTrigger className="w-full h-10.5 rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/10 text-sm text-[#3B3B3B] dark:text-white shadow-2xs"><SelectValue placeholder="Select level" /></SelectTrigger>
                                <SelectContent className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-slate-900 shadow-xl">
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
                            <Label className="text-sm font-semibold text-[#696969]">School / University</Label>
                            <Select value={schoolId || "none"} onValueChange={(val) => setSchoolId(val === "none" ? "" : val)}>
                                <SelectTrigger className="w-full h-10.5 rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/10 text-sm text-[#3B3B3B] dark:text-white shadow-2xs"><SelectValue placeholder="Select School" /></SelectTrigger>
                                <SelectContent className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-slate-900 shadow-xl">
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
                            <Label className="text-sm font-semibold text-[#696969]">Course / Program</Label>
                            <Select value={academicCourseId || "none"} onValueChange={(val) => setAcademicCourseId(val === "none" ? "" : val)}>
                                <SelectTrigger className="w-full h-10.5 rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/10 text-sm text-[#3B3B3B] dark:text-white shadow-2xs"><SelectValue placeholder="Select Course" /></SelectTrigger>
                                <SelectContent className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-slate-900 shadow-xl">
                                    <SelectItem value="none">None</SelectItem>
                                    {dropdownData.academic_courses.map(c => (
                                        <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                    ))}
                                    {dropdownData.academic_courses.length === 0 && <SelectItem value="no_courses" disabled>No courses available</SelectItem>}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="year-grad" className="text-sm font-semibold text-[#696969]">Year Graduated</Label>
                            <input id="year-grad" type="number" min="1950" max="2099" value={yearGraduated} onChange={(e) => setYearGraduated(e.target.value)} placeholder="2024" className="w-full h-10.5 px-3.5 text-sm rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/10 text-[#3B3B3B] dark:text-white placeholder:text-[#696969]/50 focus:outline-none focus:ring-1.5 focus:ring-black/15 shadow-2xs transition-all" />
                        </div>
                    </div>
                </section>

                {/* ═══ Account Details ═══ */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2.5 pt-1">
                        <Shield className="size-4.5 text-[#696969]" />
                        <h2 className="text-base font-bold uppercase tracking-wider text-[#3B3B3B] dark:text-white">
                            Account Details
                        </h2>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5 sm:col-span-2">
                            <Label htmlFor="add-email" className="text-sm font-semibold text-[#696969]">Email *</Label>
                            <input id="add-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="juan@school.edu" className="w-full h-10.5 px-3.5 text-sm rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/10 text-[#3B3B3B] dark:text-white placeholder:text-[#696969]/50 focus:outline-none focus:ring-1.5 focus:ring-black/15 shadow-2xs transition-all" />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="add-password" className="text-sm font-semibold text-[#696969]">Password *</Label>
                            <input id="add-password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full h-10.5 px-3.5 text-sm rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/10 text-[#3B3B3B] dark:text-white placeholder:text-[#696969]/50 focus:outline-none focus:ring-1.5 focus:ring-black/15 shadow-2xs transition-all" />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="confirm-password" className="text-sm font-semibold text-[#696969]">Confirm Password *</Label>
                            <input id="confirm-password" type="password" required minLength={6} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" className="w-full h-10.5 px-3.5 text-sm rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/10 text-[#3B3B3B] dark:text-white placeholder:text-[#696969]/50 focus:outline-none focus:ring-1.5 focus:ring-black/15 shadow-2xs transition-all" />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-sm font-semibold text-[#696969]">User Role *</Label>
                            <Select value={role} onValueChange={(val) => {
                                setRole(val);
                                if (val === "admin") {
                                    setExamId("");
                                    setProgramId("");
                                    setMajorId("");
                                    setBatchId("");
                                } else if (val === "teacher") {
                                    setBatchId("");
                                    setJobRoleDescription("");
                                } else {
                                    setJobRoleDescription("");
                                }
                            }}>
                                <SelectTrigger className="w-full h-10.5 rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/10 text-sm text-[#3B3B3B] dark:text-white shadow-2xs"><SelectValue /></SelectTrigger>
                                <SelectContent className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-slate-900 shadow-xl">
                                    <SelectItem value="student">Student</SelectItem>
                                    <SelectItem value="teacher">Teacher</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        
                        {role === "admin" && (
                            <div className="space-y-1.5">
                                <Label htmlFor="job-role" className="text-sm font-semibold text-[#696969]">Job Role Description *</Label>
                                <input id="job-role" value={jobRoleDescription} onChange={(e) => setJobRoleDescription(e.target.value)} placeholder="e.g. System Administrator, Content Manager" required className="w-full h-10.5 px-3.5 text-sm rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/10 text-[#3B3B3B] dark:text-white placeholder:text-[#696969]/50 focus:outline-none focus:ring-1.5 focus:ring-black/15 shadow-2xs transition-all" />
                            </div>
                        )}

                        {role === "teacher" && (
                            <div className="space-y-3 sm:col-span-2">
                                <div className="space-y-1.5">
                                    <Label className="text-sm font-semibold text-[#696969]">Target Examination / Courses / Specializations *</Label>
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
                                    <p className="text-xs text-[#696969] mt-1">
                                        Select the examination, programs, or specific major specializations this teacher can teach or access.
                                    </p>
                                </div>
                            </div>
                        )}

                        {role === "student" && (
                            <>
                                <div className="space-y-1.5">
                                    <Label className="text-sm font-semibold text-[#696969]">Target Examination *</Label>
                                    <Select value={examId || "none"} onValueChange={(val) => { setExamId(val === "none" ? "" : val); setProgramId(""); setMajorId(""); }}>
                                        <SelectTrigger className="w-full h-10.5 rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/10 text-sm text-[#3B3B3B] dark:text-white shadow-2xs"><SelectValue placeholder="Select Exam" /></SelectTrigger>
                                        <SelectContent className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-slate-900 shadow-xl">
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
                                        <Label className="text-sm font-semibold text-[#696969]">Course / Program</Label>
                                        <Select value={programId || "none"} onValueChange={(val) => { setProgramId(val === "none" ? "" : val); setMajorId(""); }}>
                                            <SelectTrigger className="w-full h-10.5 rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/10 text-sm text-[#3B3B3B] dark:text-white shadow-2xs"><SelectValue placeholder="Select Program" /></SelectTrigger>
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
                                        <Label className="text-sm font-semibold text-[#696969]">Major Specialization</Label>
                                        <Select value={majorId || "none"} onValueChange={(val) => setMajorId(val === "none" ? "" : val)}>
                                            <SelectTrigger className="w-full h-10.5 rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/10 text-sm text-[#3B3B3B] dark:text-white shadow-2xs"><SelectValue placeholder="Select Major" /></SelectTrigger>
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
                                <div className="space-y-1.5">
                                    <Label className="text-sm font-semibold text-[#696969]">Assigned Batch *</Label>
                                    <Select value={batchId || "none"} onValueChange={(val) => setBatchId(val === "none" ? "" : val)}>
                                        <SelectTrigger className="w-full h-10.5 rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/10 text-sm text-[#3B3B3B] dark:text-white shadow-2xs"><SelectValue placeholder="Select Batch" /></SelectTrigger>
                                        <SelectContent className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-slate-900 shadow-xl">
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
                <div className="flex items-center justify-end gap-2.5 pt-2">
                    <Link href="/admin/users">
                        <button type="button" className="px-4 py-2 rounded-xl text-xs font-semibold text-[#696969] hover:text-[#3B3B3B] dark:text-gray-400 dark:hover:text-white bg-white dark:bg-white/10 border border-black/5 dark:border-white/10 transition-all shadow-2xs cursor-pointer">
                            Cancel
                        </button>
                    </Link>
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-1.5 bg-[#E9C46A] hover:bg-[#dfb550] text-white font-bold text-xs tracking-wide uppercase px-5 py-2.5 rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                    >
                        {saving ? (
                            <>
                                <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                Creating…
                            </>
                        ) : (
                            "Create User"
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}
