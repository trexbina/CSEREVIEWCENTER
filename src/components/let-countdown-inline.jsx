"use client"

import { useEffect, useState } from "react"
import { Clock } from "lucide-react"

function calcTimeLeft(target) {
    const now = new Date()
    const end = new Date(target)
    let diff = end - now

    if (diff <= 0) return null

    // Approximate months (30.44 days each)
    const totalDays = Math.floor(diff / (1000 * 60 * 60 * 24))
    const months = Math.floor(totalDays / 30)
    const days = totalDays % 30

    diff -= totalDays * 1000 * 60 * 60 * 24
    const hours = Math.floor(diff / (1000 * 60 * 60))
    diff -= hours * 1000 * 60 * 60
    const minutes = Math.floor(diff / (1000 * 60))
    diff -= minutes * 1000 * 60
    const seconds = Math.floor(diff / 1000)

    return { months, days, hours, minutes, seconds }
}

export function LETCountdownInline({ targetDate }) {
    const [time, setTime] = useState(null)

    useEffect(() => {
        setTime(calcTimeLeft(targetDate))
        const id = setInterval(() => setTime(calcTimeLeft(targetDate)), 1000)
        return () => clearInterval(id)
    }, [targetDate])

    if (!time) {
        return (
            <span className="text-xs font-medium text-primary">LET Exam — Today!</span>
        )
    }

    const segments = [
        { value: time.months, label: "months" },
        { value: time.days, label: "days" },
        { value: time.hours, label: "hours" },
        { value: time.minutes, label: "min" },
        { value: time.seconds, label: "sec" },
    ]

    return (
        <div className="inline-flex items-center gap-2 rounded-lg border border-primary/25 bg-primary/5 px-3 py-1.5">
            <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-primary/80 hidden sm:inline">
                LET
            </span>
            <div className="flex gap-2">
                {segments.map((seg) => (
                    <div key={seg.label} className="flex flex-col items-center leading-none">
                        <span className="countdown font-mono text-sm font-bold text-foreground">
                            <span style={{ "--value": seg.value }} aria-live="polite" aria-label={`${seg.value} ${seg.label}`}>
                                {seg.value}
                            </span>
                        </span>
                        <span className="text-[9px] text-muted-foreground">{seg.label}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}
