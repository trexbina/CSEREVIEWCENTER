export default function ProfileLoading() {
    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            {/* Header skeleton */}
            <div>
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-md bg-muted animate-pulse" />
                    <div className="h-8 w-32 rounded-md bg-muted animate-pulse" />
                </div>
                <div className="mt-2 h-4 w-64 rounded bg-muted animate-pulse" />
            </div>

            {/* Profile card skeleton */}
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm space-y-4">
                <div className="h-5 w-36 rounded bg-muted animate-pulse" />
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex flex-col sm:flex-row sm:gap-4">
                        <div className="h-4 w-24 rounded bg-muted animate-pulse sm:w-32" />
                        <div className="mt-1 h-4 w-48 rounded bg-muted animate-pulse sm:mt-0" />
                    </div>
                ))}
            </div>
        </div>
    )
}
