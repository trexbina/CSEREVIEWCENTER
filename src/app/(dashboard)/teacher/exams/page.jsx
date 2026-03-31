import { ClipboardList } from "lucide-react"

export default function ExamCreatorPage() {

    return (
        <div className="space-y-8">
            <div>
                <div className="flex items-center gap-3">
                    <ClipboardList className="h-8 w-8 text-primary" />
                    <h1 className="text-3xl font-bold text-foreground">Exam Creator</h1>
                </div>
                <p className="mt-2 text-muted-foreground">
                    Create and manage mock exams, quizzes, and practice tests for your reviewees.
                </p>
            </div>

            {/* Create New Exam */}
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-foreground">Create New Exam</h2>
                <p className="mt-4 text-sm text-muted-foreground">
                    The exam builder will be available here. You&apos;ll be able to create timed tests with multiple-choice and essay questions.
                </p>
            </div>

            {/* Existing Exams */}
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-foreground">Existing Exams</h2>
                <p className="mt-4 text-sm text-muted-foreground">
                    No exams created yet. Your published exams and drafts will appear here.
                </p>
            </div>
        </div>
    )
}
