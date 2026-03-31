import { BarChart3 } from "lucide-react"

export default function MyProgressPage() {

    return (
        <div className="space-y-8">
            <div>
                <div className="flex items-center gap-3">
                    <BarChart3 className="h-8 w-8 text-primary" />
                    <h1 className="text-3xl font-bold text-foreground">My Progress</h1>
                </div>
                <p className="mt-2 text-muted-foreground">
                    Track your review progress, competency scores, and readiness for the board exam.
                </p>
            </div>

            {/* Overview Stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[
                    { label: "Overall Readiness", value: "—" },
                    { label: "Competencies Covered", value: "0" },
                    { label: "Study Hours", value: "0" },
                ].map((stat) => (
                    <div
                        key={stat.label}
                        className="rounded-lg border border-border bg-card p-6 shadow-sm"
                    >
                        <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                        <p className="mt-2 text-3xl font-bold text-foreground">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Competency Breakdown */}
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-foreground">Competency Breakdown</h2>
                <p className="mt-4 text-sm text-muted-foreground">
                    Your per-competency scores and progress charts will be displayed here once you complete mock exams.
                </p>
            </div>
        </div>
    )
}
