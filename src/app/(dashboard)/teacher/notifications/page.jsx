import { Bell } from "lucide-react"

export default function TeacherNotificationsPage() {

    return (
        <div className="space-y-8">
            <div>
                <div className="flex items-center gap-3">
                    <Bell className="h-8 w-8 text-primary" />
                    <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
                </div>
                <p className="mt-2 text-muted-foreground">
                    Stay informed about student submissions, exam completions, and system updates.
                </p>
            </div>

            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-foreground">All Notifications</h2>
                <p className="mt-4 text-sm text-muted-foreground">
                    No notifications yet. You&apos;ll be notified when students submit work or complete exams.
                </p>
            </div>
        </div>
    )
}
