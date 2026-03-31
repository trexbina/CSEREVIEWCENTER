import { FileText } from "lucide-react"

export default function MockExamsPage() {

    return (
        <div className="space-y-8">
            <div>
                <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-primary" />
                    <h1 className="text-3xl font-bold text-foreground">Mock Exams</h1>
                </div>
                <p className="mt-2 text-muted-foreground">
                    Practice with timed mock exams to prepare for the LET board examination.
                </p>
            </div>

            {/* Available Exams */}
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-foreground">Available Exams</h2>
                <p className="mt-4 text-sm text-muted-foreground">
                    No mock exams are available right now. Check back later or contact your instructor.
                </p>
            </div>

            {/* Past Attempts */}
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-foreground">Past Attempts</h2>
                <p className="mt-4 text-sm text-muted-foreground">
                    Your completed mock exam results will appear here.
                </p>
            </div>
        </div>
    )
}
