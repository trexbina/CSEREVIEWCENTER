export default function StudentDirectoryLoading() {
    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            {/* Header skeleton */}
            <div>
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-md bg-muted animate-pulse" />
                    <div className="h-8 w-52 rounded-md bg-muted animate-pulse" />
                </div>
                <div className="mt-2 h-4 w-64 rounded bg-muted animate-pulse" />
            </div>

            {/* Student table skeleton */}
            <div className="rounded-lg border border-border bg-card shadow-sm">
                <div className="border-b border-border px-6 py-4">
                    <div className="h-5 w-44 rounded bg-muted animate-pulse" />
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border">
                                {["w-24", "w-32", "w-28"].map((w, i) => (
                                    <th key={i} className="px-6 py-3">
                                        <div className={`h-4 ${w} rounded bg-muted animate-pulse`} />
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i} className="border-b border-border last:border-0">
                                    <td className="px-6 py-3"><div className="h-4 w-32 rounded bg-muted animate-pulse" /></td>
                                    <td className="px-6 py-3"><div className="h-4 w-44 rounded bg-muted animate-pulse" /></td>
                                    <td className="px-6 py-3"><div className="h-4 w-24 rounded bg-muted animate-pulse" /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
