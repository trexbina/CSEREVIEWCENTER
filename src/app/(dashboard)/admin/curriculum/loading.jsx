export default function CurriculumLoading() {
    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            {/* Header skeleton */}
            <div>
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-md bg-muted animate-pulse" />
                    <div className="h-8 w-56 rounded-md bg-muted animate-pulse" />
                </div>
                <div className="mt-2 h-4 w-80 rounded bg-muted animate-pulse" />
            </div>

            {/* LET Competencies card skeleton */}
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                <div className="h-5 w-40 rounded bg-muted animate-pulse" />
                <div className="mt-4 h-4 w-72 rounded bg-muted animate-pulse" />
            </div>

            {/* Subject manager toolbar skeleton */}
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                    <div className="h-5 w-32 rounded bg-muted animate-pulse" />
                    <div className="h-9 w-36 rounded-md bg-muted animate-pulse" />
                </div>
                <div className="flex gap-3">
                    <div className="h-9 flex-1 rounded-md bg-muted animate-pulse" />
                    <div className="h-9 w-40 rounded-md bg-muted animate-pulse" />
                </div>
                {/* Subject rows skeleton */}
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between rounded-md border border-border px-4 py-3">
                        <div className="space-y-2">
                            <div className="h-4 w-48 rounded bg-muted animate-pulse" />
                            <div className="h-3 w-24 rounded bg-muted animate-pulse" />
                        </div>
                        <div className="flex gap-2">
                            <div className="h-8 w-8 rounded bg-muted animate-pulse" />
                            <div className="h-8 w-8 rounded bg-muted animate-pulse" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
