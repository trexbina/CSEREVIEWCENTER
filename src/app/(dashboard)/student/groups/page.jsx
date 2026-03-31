import { Users } from "lucide-react"

export default function MyGroupsPage() {

    return (
        <div className="space-y-8">
            <div>
                <div className="flex items-center gap-3">
                    <Users className="h-8 w-8 text-primary" />
                    <h1 className="text-3xl font-bold text-foreground">My Groups</h1>
                </div>
                <p className="mt-2 text-muted-foreground">
                    View and manage your review groups and study circles.
                </p>
            </div>

            {/* Enrolled Groups */}
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-foreground">Enrolled Groups</h2>
                <p className="mt-4 text-sm text-muted-foreground">
                    You are not enrolled in any groups yet. Groups will appear here once your instructor assigns you.
                </p>
            </div>

            {/* Group Activity */}
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-foreground">Group Activity</h2>
                <p className="mt-4 text-sm text-muted-foreground">
                    Recent activity from your groups will be displayed here.
                </p>
            </div>
        </div>
    )
}
