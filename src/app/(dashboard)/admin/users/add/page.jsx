"use client"

import { useState } from "react"
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
    const [school, setSchool] = useState("")
    const [course, setCourse] = useState("")
    const [yearGraduated, setYearGraduated] = useState("")
    const [highestEducation, setHighestEducation] = useState("")

    async function handleSubmit(e) {
        e.preventDefault()
        setError("")

        if (password !== confirmPassword) {
            setError("Passwords do not match.")
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
                    school: school || null,
                    course: course || null,
                    year_graduated: yearGraduated || null,
                    highest_education: highestEducation || null,
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
                            <Label htmlFor="school">School / University</Label>
                            <Input id="school" value={school} onChange={(e) => setSchool(e.target.value)} placeholder="University of the Philippines" />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="course">Course / Program</Label>
                            <Input id="course" value={course} onChange={(e) => setCourse(e.target.value)} placeholder="BS Computer Science" />
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
                            <Label>Role *</Label>
                            <Select value={role} onValueChange={setRole}>
                                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="student">Student</SelectItem>
                                    <SelectItem value="teacher">Teacher</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
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
