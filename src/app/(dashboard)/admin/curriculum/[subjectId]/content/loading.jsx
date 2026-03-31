export default function ContentEditorLoading() {
    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Back button + title skeleton */}
            <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-md bg-muted animate-pulse" />
                <div className="space-y-1">
                    <div className="h-7 w-64 rounded-md bg-muted animate-pulse" />
                    <div className="h-3 w-40 rounded bg-muted animate-pulse" />
                </div>
            </div>

            {/* Toolbar skeleton */}
            <div className="flex items-center gap-3">
                <div className="h-9 w-32 rounded-md bg-muted animate-pulse" />
                <div className="h-9 w-32 rounded-md bg-muted animate-pulse" />
            </div>

            {/* Content blocks skeleton */}
            {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-lg border border-border bg-card p-6 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="h-5 w-48 rounded bg-muted animate-pulse" />
                        <div className="flex gap-2">
                            <div className="h-8 w-8 rounded bg-muted animate-pulse" />
                            <div className="h-8 w-8 rounded bg-muted animate-pulse" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="h-4 w-full rounded bg-muted animate-pulse" />
                        <div className="h-4 w-5/6 rounded bg-muted animate-pulse" />
                        <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
                    </div>
                </div>
            ))}
        </div>
    )
}
