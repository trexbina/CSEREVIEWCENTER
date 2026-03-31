export default function StudentLoading() {
    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            {/* Header skeleton */}
            <div>
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-md bg-muted animate-pulse" />
                    <div className="h-8 w-48 rounded-md bg-muted animate-pulse" />
                </div>
                <div className="mt-2 h-4 w-72 rounded bg-muted animate-pulse" />
            </div>

            {/* Content skeleton */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="rounded-lg border border-border bg-card p-6 shadow-sm">
                        <div className="h-4 w-24 rounded bg-muted animate-pulse" />
                        <div className="mt-3 h-8 w-16 rounded bg-muted animate-pulse" />
                        <div className="mt-2 h-3 w-32 rounded bg-muted animate-pulse" />
                    </div>
                ))}
            </div>
        </div>
    )
}
