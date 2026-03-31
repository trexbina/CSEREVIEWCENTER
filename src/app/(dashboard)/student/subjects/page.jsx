"use client"

import { useEffect, useState } from "react"
import { Loader2, Lock, ArrowLeft, ChevronRight, BookOpen } from "lucide-react"
import { useRouter } from "next/navigation"

export default function StudentSubjectsPage() {
    const router = useRouter()
    const [categories, setCategories] = useState([])
    const [subjects, setSubjects] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const [selectedCategory, setSelectedCategory] = useState(null)
    const [selectedSubcategory, setSelectedSubcategory] = useState(null)

    useEffect(() => {
        async function fetchData() {
            try {
                const [catRes, subRes] = await Promise.all([
                    fetch("/api/student/categories"),
                    fetch("/api/student/subjects"),
                ])
                if (!catRes.ok) throw new Error("Failed to load categories")
                if (!subRes.ok) throw new Error("Failed to load subjects")

                const catData = await catRes.json()
                const subData = await subRes.json()

                setCategories(catData.categories || [])
                setSubjects(subData.subjects || [])

                // Auto-select first category
                if (catData.categories?.length > 0) {
                    setSelectedCategory(catData.categories[0])
                }
            } catch (err) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    if (loading) {
        return (
            <div className="flex min-h-[40vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-destructive">
                {error}
            </div>
        )
    }

    if (categories.length === 0) {
        return (
            <div className="space-y-8 w-full max-w-6xl mx-auto px-4 py-8">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-[#4d4d4d] uppercase">CATEGORIES</h1>
                    <p className="mt-2 text-[#8c8c8c] text-[15px]">
                        Category, sub-category, subjects?
                    </p>
                </div>
                <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card p-12 text-center shadow-sm">
                    <Lock className="mb-4 h-12 w-12 text-muted-foreground/50" />
                    <h2 className="text-lg font-semibold text-foreground">No Categories Available</h2>
                    <p className="mt-2 max-w-md text-sm text-muted-foreground">
                        Your administrator has not created any categories yet. Please contact your admin to get started.
                    </p>
                </div>
            </div>
        )
    }

    // Get subcategories for the selected category
    const currentSubcategories = selectedCategory?.subcategories || []

    // Only show subjects belonging to the explicitly selected subcategory
    const filteredSubjects = subjects.filter(s => s.subcategory_id === selectedSubcategory?.id)

    return (
        <div className="space-y-10 w-full max-w-6xl mx-auto px-4 py-8">
            {/* Header section */}
            <div>
                <h1 className="text-4xl font-extrabold tracking-tight text-[#4d4d4d] uppercase mb-1">CATEGORIES</h1>
                <p className="text-[#8c8c8c] text-[15px]">
                    Category, sub-category, subjects?
                </p>
            </div>

            {!selectedSubcategory ? (
                // CATEGORY AND SUBCATEGORY VIEW
                <div className="space-y-10">
                    {/* Category Tabs */}
                    <div className="flex flex-wrap items-center gap-4">
                        {categories.map((cat) => {
                            const isSelected = selectedCategory?.id === cat.id
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`rounded-lg px-6 py-2.5 text-sm font-semibold uppercase tracking-wide transition-all ${
                                        isSelected
                                            ? "bg-[#f5cdd0] text-[#ba5a62] shadow-sm transform scale-105"
                                            : "bg-gray-50 text-[#4d4d4d] border border-gray-200 shadow-sm hover:border-gray-300 hover:bg-gray-100"
                                    }`}
                                >
                                    {cat.name}
                                </button>
                            )
                        })}
                    </div>

                    {/* Subcategories Grid */}
                    {currentSubcategories.filter(s => s.status !== "inactive").length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card p-12 text-center shadow-sm">
                            <p className="text-sm text-muted-foreground">
                                No subcategories in this category yet.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                            {currentSubcategories.filter(s => s.status !== "inactive").map((subcat) => (
                                <button
                                    key={subcat.id}
                                    onClick={() => setSelectedSubcategory(subcat)}
                                    className="group flex aspect-[1/1] w-full flex-col p-4 rounded-[1.25rem] bg-gray-50 border border-gray-200 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md hover:border-gray-300 active:translate-y-0"
                                >
                                    <div className="flex-1 flex flex-col items-center justify-center gap-3 mt-4 w-full">
                                        <span className="text-lg font-bold tracking-[0.1em] text-[#7a7a7a] uppercase text-center line-clamp-2 transition-colors group-hover:text-black">
                                            {subcat.name}
                                        </span>
                                        {subcat.description && (
                                            <p className="text-xs text-center text-[#8c8c8c] line-clamp-3">
                                                {subcat.description}
                                            </p>
                                        )}
                                    </div>
                                    {/* Empty spacer to precisely match the height taken up by edit/delete buttons on the admin side, ensuring text remains at identical vertical alignment */}
                                    <div className="h-8 w-full" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                // SUBJECTS VIEW (After clicking a Subcategory)
                <div className="space-y-6">
                    <div className="flex items-center gap-4 border-b pb-4">
                        <button
                            onClick={() => setSelectedSubcategory(null)}
                            className="flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-black bg-white border shadow-sm px-4 py-2 rounded-lg"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </button>
                        <h2 className="text-2xl font-bold uppercase tracking-widest text-[#4d4d4d]">
                            {selectedSubcategory.name} Subjects
                        </h2>
                    </div>

                    {filteredSubjects.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card p-12 text-center shadow-sm">
                            <Lock className="mb-4 h-12 w-12 text-muted-foreground/50" />
                            <h2 className="text-lg font-semibold text-foreground">No Subjects</h2>
                            <p className="mt-2 max-w-md text-sm text-muted-foreground">
                                No subjects have been assigned to you yet in this subcategory.
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-5 pt-4">
                            {filteredSubjects.map((subject) => {
                                const isLocked = subject.unlock_date && new Date(subject.unlock_date) > new Date();

                                return (
                                    <div 
                                        key={subject.id} 
                                        onClick={() => !isLocked && router.push(`/student/subjects/${subject.id}`)}
                                        className={`group flex items-stretch gap-6 bg-white rounded-md p-5 shadow-sm border border-gray-100 ${isLocked ? 'opacity-60 grayscale-[50%] cursor-not-allowed' : 'hover:shadow-md hover:border-gray-300 cursor-pointer'} transition-all duration-300 relative overflow-hidden`}
                                    >
                                        {isLocked && (
                                            <div className="absolute top-0 right-0 m-4 px-3 py-1.5 bg-blue-50/90 backdrop-blur border border-blue-200 rounded-full text-xs font-bold text-blue-700 uppercase tracking-wider shadow-sm z-10 flex items-center gap-2">
                                                <Lock className="w-3.5 h-3.5" />
                                                Unlocks on {new Date(subject.unlock_date).toLocaleDateString([], { month: 'short', day: 'numeric'})}
                                            </div>
                                        )}

                                        <div className="w-36 h-36 shrink-0 bg-gray-100 rounded-md flex items-center justify-center border border-gray-200 overflow-hidden relative">
                                            {subject.image_url ? (
                                                <img src={subject.image_url} alt={subject.title} className="absolute inset-0 w-full h-full object-cover" />
                                            ) : (
                                                <BookOpen className="w-10 h-10 text-gray-400" />
                                            )}
                                        </div>

                                        <div className="flex-1 flex flex-col justify-between py-1">
                                            <div>
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="text-[17px] font-extrabold text-[#4a4a4a] uppercase tracking-wide">{subject.title}</h4>
                                                </div>
                                                <p className="text-[13px] text-[#8c8c8c] line-clamp-2 pr-24">{subject.description || "No description provided."}</p>
                                            </div>
                                            
                                            <div className="flex items-center justify-between mt-4">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[11px] font-semibold text-[#8c8c8c] border border-gray-200 bg-gray-50 px-3 py-1.5 rounded-full">
                                                        Date added: {new Date(subject.created_at || Date.now()).toLocaleDateString()}
                                                    </span>
                                                    <span className="text-[11px] font-semibold text-[#8c8c8c] border border-gray-200 bg-gray-50 px-3 py-1.5 rounded-full">
                                                        Code: {subject.code}
                                                    </span>
                                                </div>

                                                {isLocked ? (
                                                    <button disabled className="shrink-0 bg-gray-100 text-gray-500 px-4 py-2 rounded-md font-semibold text-xs transition-colors border border-gray-200 flex items-center gap-2">
                                                        <Lock className="w-3.5 h-3.5" /> Locked
                                                    </button>
                                                ) : (
                                                    <button className="shrink-0 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-4 py-2 text-xs rounded-md transition-colors border border-gray-200">
                                                        View content
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>)
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
