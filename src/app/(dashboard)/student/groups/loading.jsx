export default function GroupsLoading() {
    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            {/* Header skeleton */}
            <div>
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-md bg-muted animate-pulse" />
                    <div className="h-8 w-40 rounded-md bg-muted animate-pulse" />
                </div>
                <div className="mt-2 h-4 w-72 rounded bg-muted animate-pulse" />
            </div>

            {/* Enrolled Groups card skeleton */}
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                <div className="h-5 w-36 rounded bg-muted animate-pulse" />
                <div className="mt-4 h-4 w-64 rounded bg-muted animate-pulse" />
            </div>

            {/* Group Activity card skeleton */}
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                <div className="h-5 w-32 rounded bg-muted animate-pulse" />
                <div className="mt-4 h-4 w-56 rounded bg-muted animate-pulse" />
            </div>
        </div>
    )
}
