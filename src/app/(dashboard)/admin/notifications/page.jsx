import { Bell } from "lucide-react"

export default function AdminNotificationsPage() {

    return (
        <div className="space-y-8">
            <div>
                <div className="flex items-center gap-3">
                    <Bell className="h-8 w-8 text-primary" />
                    <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
                </div>
                <p className="mt-2 text-muted-foreground">
                    System alerts, user activity notifications, and administrative updates.
                </p>
            </div>

            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-foreground">All Notifications</h2>
                <p className="mt-4 text-sm text-muted-foreground">
                    No notifications yet. System alerts and important updates will appear here.
                </p>
            </div>
        </div>
    )
}
