"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown, Check } from "lucide-react"

/**
 * Clean MultiSelectDropdown for selecting multiple items or "All"
 * @param {string} label - Input label (e.g. "Course:")
 * @param {Array<{id: string|number, name: string}>} options - Choices list
 * @param {Array<string>} selectedValues - Selected item names e.g. ["LET", "NLE"] or []
 * @param {Function} onChange - Callback returning array of selected names
 * @param {string} placeholder - Placeholder text e.g. "All Courses"
 */
export default function MultiSelectDropdown({
    label,
    options = [],
    selectedValues = [],
    onChange,
    placeholder = "All"
}) {
    const [isOpen, setIsOpen] = useState(false)
    const [search, setSearch] = useState("")
    const dropdownRef = useRef(null)

    // Normalize selected values array
    const rawSelected = Array.isArray(selectedValues) 
        ? selectedValues 
        : (selectedValues ? [selectedValues] : [])

    const isAllSelected = rawSelected.length === 0 || rawSelected.includes("all")

    // Close when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false)
            }
        }
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside)
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [isOpen])

    const handleToggleAll = () => {
        if (isAllSelected) {
            onChange([])
        } else {
            onChange(["all"])
        }
    }

    const handleToggleOption = (optionName) => {
        let newSelected = isAllSelected ? [] : [...rawSelected.filter(v => v !== "all")]
        
        if (newSelected.includes(optionName)) {
            newSelected = newSelected.filter(v => v !== optionName)
        } else {
            newSelected.push(optionName)
        }

        if (newSelected.length === 0) {
            onChange(["all"])
        } else {
            onChange(newSelected)
        }
    }

    const filteredOptions = options.filter(opt =>
        (opt.name || "").toLowerCase().includes(search.toLowerCase())
    )

    // Compute display label
    const getDisplayText = () => {
        if (isAllSelected) return placeholder
        if (rawSelected.length === 1) return rawSelected[0]
        return `${rawSelected.length} Selected`
    }

    return (
        <div className="relative min-w-0" ref={dropdownRef}>
            {label && (
                <label className="block text-xs font-semibold text-[#7a7a7a] uppercase mb-1 truncate" title={label}>
                    {label}
                </label>
            )}
            
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full h-9 rounded-lg border px-2.5 text-xs font-medium flex items-center justify-between gap-1 transition-colors cursor-pointer text-left bg-white ${
                    isOpen ? "border-gray-400 ring-1 ring-gray-300" : "border-gray-200 hover:border-gray-300"
                } ${!isAllSelected ? "text-[#3B3B3B] font-semibold" : "text-gray-600"}`}
            >
                <span className="truncate flex-1">{getDisplayText()}</span>
                <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute z-50 mt-1 left-0 right-0 w-full min-w-[200px] max-w-[280px] bg-white rounded-xl shadow-sm border border-gray-200/80 p-2 font-sans animate-in fade-in zoom-in-95 duration-150">
                    {/* Search inside dropdown if many options */}
                    {options.length > 5 && (
                        <div className="mb-2">
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search..."
                                className="w-full h-7 rounded-md border border-gray-200 px-2 text-xs focus:outline-none focus:border-gray-400"
                                autoFocus
                            />
                        </div>
                    )}

                    <div className="max-h-48 overflow-y-auto space-y-0.5 custom-scrollbar pr-0.5">
                        {/* Option: All */}
                        <div
                            onClick={handleToggleAll}
                            className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs hover:bg-gray-50 cursor-pointer select-none transition-colors"
                        >
                            <div className={`h-4 w-4 rounded flex items-center justify-center border transition-colors shrink-0 ${
                                isAllSelected ? "bg-[#E9C46A] border-[#E9C46A] text-white" : "border-gray-300 bg-white"
                            }`}>
                                {isAllSelected && <Check className="h-3 w-3 stroke-[3]" />}
                            </div>
                            <span className={`truncate flex-1 ${isAllSelected ? "font-bold text-[#3B3B3B]" : "text-gray-700"}`}>
                                {placeholder}
                            </span>
                        </div>

                        {/* Individual Options */}
                        {filteredOptions.length === 0 ? (
                            <div className="text-center py-2 text-xs text-gray-400">No options found</div>
                        ) : (
                            filteredOptions.map((opt) => {
                                const isChecked = !isAllSelected && rawSelected.includes(opt.name)
                                return (
                                    <div
                                        key={opt.id}
                                        onClick={() => handleToggleOption(opt.name)}
                                        className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs hover:bg-gray-50 cursor-pointer select-none transition-colors"
                                    >
                                        <div className={`h-4 w-4 rounded flex items-center justify-center border transition-colors shrink-0 ${
                                            isChecked ? "bg-[#E9C46A] border-[#E9C46A] text-white" : "border-gray-300 bg-white"
                                        }`}>
                                            {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                                        </div>
                                        <span className={`truncate flex-1 ${isChecked ? "font-bold text-[#3B3B3B]" : "text-gray-700"}`} title={opt.name}>
                                            {opt.name}
                                        </span>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
