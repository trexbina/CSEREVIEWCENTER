"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { ArrowLeft } from "lucide-react"

const BANNER_SLIDES = [
  { id: 1, src: "/banners/banner-1.png", alt: "Peak Excellence Graduates" },
  { id: 2, src: "/banners/banner-2.jpg", alt: "Peak Excellence Students" },
  { id: 3, src: "/banners/banner-3.jpg", alt: "Peak Excellence Sessions" },
  { id: 4, src: "/banners/banner-4.jpg", alt: "Peak Excellence Campus" },
]

export default function PreRegisterPage() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [dropdownData, setDropdownData] = useState({
    examinations: [],
    batches: [],
    programs: [],
    majors: [],
    schools: [],
    academic_courses: [],
  })
  const [loadingDropdowns, setLoadingDropdowns] = useState(true)

  // Auto-advance banner slides with smooth fading effect like landing page
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % BANNER_SLIDES.length)
    }, 7000)
    return () => clearInterval(timer)
  }, [])

  // Form states
  const [firstName, setFirstName] = useState("")
  const [middleName, setMiddleName] = useState("")
  const [lastName, setLastName] = useState("")
  const [suffix, setSuffix] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [birthday, setBirthday] = useState("")
  const [gender, setGender] = useState("")
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("Cagayan de Oro")
  const [province, setProvince] = useState("Misamis Oriental")
  const [zipCode, setZipCode] = useState("9000")

  // Academic
  const [schoolId, setSchoolId] = useState("")
  const [customSchool, setCustomSchool] = useState("")
  const [academicCourseId, setAcademicCourseId] = useState("")
  const [customCourse, setCustomCourse] = useState("")
  const [yearGraduated, setYearGraduated] = useState("")
  const [highestEducation, setHighestEducation] = useState("")

  // Target Review Program
  const [examId, setExamId] = useState("")
  const [programId, setProgramId] = useState("")
  const [majorId, setMajorId] = useState("")

  // Form submission state
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  // Fetch dropdown options
  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/public/pre-register")
        if (res.ok) {
          const data = await res.json()
          setDropdownData(data)
          // Auto-select LEPT or single exam so Program/Level is immediately visible
          if (data.examinations?.length === 1) {
            setExamId(data.examinations[0].id.toString())
          } else if (data.examinations?.length > 1) {
            const lept = data.examinations.find(
              (e) => e.name?.includes("LEPT") || e.name?.includes("Teachers")
            )
            if (lept) setExamId(lept.id.toString())
          }
        }
      } catch (err) {
        console.error("Failed to load registration dropdowns:", err)
      } finally {
        setLoadingDropdowns(false)
      }
    }
    loadData()
  }, [])

  // Filtered lists based on hierarchy
  const availablePrograms = dropdownData.programs.filter(
    (p) => !examId || p.exam_id?.toString() === examId
  )
  const availableMajors = dropdownData.majors.filter(
    (m) => !programId || m.program_id?.toString() === programId
  )

  async function handleSubmit(e) {
    e.preventDefault()
    setError("")

    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setError("First Name, Last Name, and Email are required.")
      return
    }

    setSubmitting(true)

    try {
      const selectedSchoolObj = dropdownData.schools.find((s) => s.id.toString() === schoolId)
      const selectedCourseObj = dropdownData.academic_courses.find((c) => c.id.toString() === academicCourseId)

      const payload = {
        first_name: firstName,
        middle_name: middleName,
        last_name: lastName,
        suffix: suffix,
        email: email,
        phone: phone,
        birthday: birthday || null,
        gender: gender || null,
        address: address,
        city: city?.trim() || "Cagayan de Oro",
        province: province?.trim() || "Misamis Oriental",
        zip_code: zipCode?.trim() || "9000",
        school: selectedSchoolObj ? selectedSchoolObj.name : customSchool,
        school_id: schoolId && schoolId !== "custom" ? schoolId : null,
        course: selectedCourseObj ? selectedCourseObj.name : customCourse,
        academic_course_id: academicCourseId && academicCourseId !== "custom" ? academicCourseId : null,
        year_graduated: yearGraduated,
        highest_education: highestEducation,
        exam_id: examId || null,
        program_id: programId || null,
        major_id: majorId || null,
        batch_id: null,
      }

      const res = await fetch("/api/public/pre-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Failed to submit application. Please try again.")
        setSubmitting(false)
        return
      }

      setSuccess(true)
    } catch {
      setError("Network error. Please check your connection and try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col lg:flex-row">
        {/* Left Visual Sidebar with Carousel Fade-in */}
        <aside className="relative lg:w-[380px] xl:w-[440px] shrink-0 bg-slate-950 text-white overflow-hidden flex flex-col justify-between p-6 sm:p-8 lg:p-10 min-h-[280px] lg:min-h-screen border-b lg:border-b-0 lg:border-r border-border/50">
          {/* Background Fade-In Carousel Slides */}
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            {BANNER_SLIDES.map((slide, index) => {
              const isActive = index === currentSlide
              return (
                <div
                  key={slide.id}
                  className="absolute inset-0"
                  style={{
                    opacity: isActive ? 1 : 0,
                    zIndex: isActive ? 2 : 1,
                    transition: "opacity 1800ms cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                >
                  <img
                    src={slide.src}
                    alt={slide.alt}
                    className="h-full w-full object-cover object-center filter brightness-[0.45] saturate-[0.9]"
                  />
                </div>
              )
            })}
            {/* Cinematic Gradient Overlay */}
            <div className="absolute inset-0 z-10 bg-gradient-to-b from-slate-950/80 via-slate-950/40 to-slate-950/90 pointer-events-none" />
          </div>

          {/* Top: Back Button */}
          <div className="relative z-20">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-semibold text-white/80 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-md px-3.5 py-2 rounded-full transition-all tracking-wider uppercase group"
            >
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
              <span>Back to Home</span>
            </Link>
          </div>

          {/* Bottom / Center: Inspiring Text & Carousel Indicator */}
          <div className="relative z-20 mt-8 lg:mt-0 space-y-4">
            <div className="space-y-1.5">
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white drop-shadow-sm">
                Begin Your Journey
              </h2>
              <p className="text-xs sm:text-sm text-white/80 leading-relaxed font-normal">
                Join hundreds of successful examinees. Complete your pre-registration to reserve your review slot.
              </p>
            </div>

            {/* Slide Indicators */}
            <div className="flex items-center gap-1.5 pt-2">
              {BANNER_SLIDES.map((slide, index) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => setCurrentSlide(index)}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    index === currentSlide ? "w-6 bg-[#E9C46A]" : "w-1.5 bg-white/30 hover:bg-white/50"
                  }`}
                  aria-label={`Slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </aside>

        {/* Right Content / Form Area */}
        <div className="flex-1 flex flex-col min-h-screen overflow-y-auto">
          {/* Main Content Container */}
          <main className={`flex-1 max-w-4xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-12 ${success ? "flex flex-col items-center justify-center min-h-[70vh]" : ""}`}>
            {success ? (
              <div className="text-center space-y-4 max-w-xl mx-auto py-12">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground uppercase">
                  Application Received
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  Thank you for pre-registering, <span className="font-bold text-foreground">{firstName}</span>! Your application has been submitted to the administration. Once verified and approved, your student account will be activated.
                </p>
                <div className="pt-6">
                  <Link
                    href="/"
                    className="inline-block bg-[#E9C46A] hover:bg-[#dfb550] text-white font-bold text-xs uppercase tracking-wider px-8 py-3 rounded-lg shadow-sm transition-all active:scale-95"
                  >
                    Return to Home
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Header Title Section */}
                <div className="border-b border-border pb-5">
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground uppercase">
                    Student Pre-Registration
                  </h1>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1 font-medium">
                    Please fill out the form below to apply for enrollment. Our administration will review and process your registration.
                  </p>
                </div>

                {error && (
                  <div className="p-3.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold text-center animate-in fade-in duration-150">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* 1. Personal Information */}
                  <div className="space-y-4">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-foreground border-b border-border/60 pb-2">
                      1. Personal Information
                    </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1.5 md:col-span-1">
                      <Label htmlFor="firstName" className="text-xs font-semibold">
                        First Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="firstName"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Juan"
                        className="text-xs rounded-lg border-border/50"
                      />
                    </div>

                    <div className="space-y-1.5 md:col-span-1">
                      <Label htmlFor="middleName" className="text-xs font-semibold">
                        Middle Name
                      </Label>
                      <Input
                        id="middleName"
                        value={middleName}
                        onChange={(e) => setMiddleName(e.target.value)}
                        placeholder="Optional"
                        className="text-xs rounded-lg border-border/50"
                      />
                    </div>

                    <div className="space-y-1.5 md:col-span-1">
                      <Label htmlFor="lastName" className="text-xs font-semibold">
                        Last Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="lastName"
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Dela Cruz"
                        className="text-xs rounded-lg border-border/50"
                      />
                    </div>

                    <div className="space-y-1.5 md:col-span-1">
                      <Label htmlFor="suffix" className="text-xs font-semibold">
                        Suffix
                      </Label>
                      <Input
                        id="suffix"
                        value={suffix}
                        onChange={(e) => setSuffix(e.target.value)}
                        placeholder="Jr., III (Optional)"
                        className="text-xs rounded-lg border-border/50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="email" className="text-xs font-semibold">
                        Email Address <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="juan.delacruz@example.com"
                        className="text-xs rounded-lg border-border/50"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="phone" className="text-xs font-semibold">
                        Contact Number
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="09171234567"
                        className="text-xs rounded-lg border-border/50"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="birthday" className="text-xs font-semibold">
                        Birthday
                      </Label>
                      <Input
                        id="birthday"
                        type="date"
                        value={birthday}
                        onChange={(e) => setBirthday(e.target.value)}
                        className="text-xs rounded-lg border-border/50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="space-y-1.5 sm:col-span-1">
                      <Label className="text-xs font-semibold">Gender</Label>
                      <Select value={gender} onValueChange={setGender}>
                        <SelectTrigger className="text-xs rounded-lg border-border/50 w-full">
                          <SelectValue placeholder="Select Gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other / Prefer not to say</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5 sm:col-span-3">
                      <Label htmlFor="address" className="text-xs font-semibold">
                        Address / Street
                      </Label>
                      <Input
                        id="address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Street Address, Barangay"
                        className="text-xs rounded-lg border-border/50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="city" className="text-xs font-semibold">
                        City / Municipality
                      </Label>
                      <Input
                        id="city"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Cagayan de Oro"
                        className="text-xs rounded-lg border-border/50"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="province" className="text-xs font-semibold">
                        Province
                      </Label>
                      <Input
                        id="province"
                        value={province}
                        onChange={(e) => setProvince(e.target.value)}
                        placeholder="Misamis Oriental"
                        className="text-xs rounded-lg border-border/50"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="zipCode" className="text-xs font-semibold">
                        Zip Code
                      </Label>
                      <Input
                        id="zipCode"
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value)}
                        placeholder="9000"
                        className="text-xs rounded-lg border-border/50"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Educational Background */}
                <div className="space-y-4">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-foreground border-b border-border/40 pb-2">
                    2. Educational Background
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">School / University</Label>
                      <Select value={schoolId} onValueChange={(val) => setSchoolId(val)}>
                        <SelectTrigger className="text-xs rounded-lg border-border/50 w-full">
                          <SelectValue placeholder="Select School" />
                        </SelectTrigger>
                        <SelectContent>
                          {dropdownData.schools.map((s) => (
                            <SelectItem key={s.id} value={s.id.toString()}>
                              {s.name}
                            </SelectItem>
                          ))}
                          <SelectItem value="custom">Other / Not Listed</SelectItem>
                        </SelectContent>
                      </Select>
                      {schoolId === "custom" && (
                        <Input
                          placeholder="Enter your school name"
                          value={customSchool}
                          onChange={(e) => setCustomSchool(e.target.value)}
                          className="text-xs mt-2 rounded-lg border-border/50"
                        />
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Degree / Academic Course</Label>
                      <Select value={academicCourseId} onValueChange={(val) => setAcademicCourseId(val)}>
                        <SelectTrigger className="text-xs rounded-lg border-border/50 w-full">
                          <SelectValue placeholder="Select Course" />
                        </SelectTrigger>
                        <SelectContent>
                          {dropdownData.academic_courses.map((c) => (
                            <SelectItem key={c.id} value={c.id.toString()}>
                              {c.name}
                            </SelectItem>
                          ))}
                          <SelectItem value="custom">Other / Not Listed</SelectItem>
                        </SelectContent>
                      </Select>
                      {academicCourseId === "custom" && (
                        <Input
                          placeholder="Enter your degree/course"
                          value={customCourse}
                          onChange={(e) => setCustomCourse(e.target.value)}
                          className="text-xs mt-2 rounded-lg border-border/50"
                        />
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="yearGraduated" className="text-xs font-semibold">
                        Year Graduated / Expected
                      </Label>
                      <Input
                        id="yearGraduated"
                        value={yearGraduated}
                        onChange={(e) => setYearGraduated(e.target.value)}
                        placeholder="e.g. 2024"
                        className="text-xs rounded-lg border-border/50"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Highest Educational Attainment</Label>
                      <Select value={highestEducation} onValueChange={setHighestEducation}>
                        <SelectTrigger className="text-xs rounded-lg border-border/50 w-full">
                          <SelectValue placeholder="Select Highest Education" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Undergraduate">Undergraduate</SelectItem>
                          <SelectItem value="College Graduate">College Graduate</SelectItem>
                          <SelectItem value="Master's Degree">Master&apos;s Degree</SelectItem>
                          <SelectItem value="Doctorate Degree">Doctorate Degree</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* 3. Review Program Selection */}
                <div className="space-y-4">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-foreground border-b border-border/40 pb-2">
                    3. Target Review Program
                  </h2>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Target Examination</Label>
                    <Select
                      value={examId}
                      onValueChange={(val) => {
                        setExamId(val)
                        setProgramId("")
                        setMajorId("")
                      }}
                    >
                      <SelectTrigger className="text-xs rounded-lg border-border/50 w-full">
                        <SelectValue placeholder="Select Target Exam" />
                      </SelectTrigger>
                      <SelectContent>
                        {dropdownData.examinations.map((e) => (
                          <SelectItem key={e.id} value={e.id.toString()}>
                            {e.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {availablePrograms.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Program / Level</Label>
                        <Select
                          value={programId}
                          onValueChange={(val) => {
                            setProgramId(val)
                            setMajorId("")
                          }}
                        >
                          <SelectTrigger className="text-xs rounded-lg border-border/50 w-full">
                            <SelectValue placeholder="Select Program" />
                          </SelectTrigger>
                          <SelectContent>
                            {availablePrograms.map((p) => (
                              <SelectItem key={p.id} value={p.id.toString()}>
                                {p.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {availableMajors.length > 0 && (
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold">Major / Specialization</Label>
                          <Select value={majorId} onValueChange={setMajorId}>
                            <SelectTrigger className="text-xs rounded-lg border-border/50 w-full">
                              <SelectValue placeholder="Select Major" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableMajors.map((m) => (
                                <SelectItem key={m.id} value={m.id.toString()}>
                                  {m.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Submit Action */}
                <div className="pt-4 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <span className="text-xs text-muted-foreground">
                    By submitting, you agree that your details will be processed for enrollment review.
                  </span>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:w-auto bg-[#E9C46A] hover:bg-[#dfb550] text-white font-bold text-xs uppercase tracking-wider px-8 py-3 rounded-lg shadow-sm transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? "Submitting Application…" : "Submit Pre-Registration"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </main>
        </div>
      </div>
  )
}
