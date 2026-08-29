// placeholder skeleton layout displayed while user records are loading
export default function UserManagementLoading() {
    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            {/* header placeholder */}
            <div>
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-md bg-muted animate-pulse" />
                    <div className="h-8 w-52 rounded-md bg-muted animate-pulse" />
                </div>
                <div className="mt-2 h-4 w-80 rounded bg-muted animate-pulse" />
            </div>

            {/* form placeholder */}
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm space-y-4">
                <div className="h-5 w-32 rounded bg-muted animate-pulse" />
                <div className="h-4 w-64 rounded bg-muted animate-pulse" />
                <div className="grid gap-4 sm:grid-cols-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="space-y-1.5">
                            <div className="h-4 w-20 rounded bg-muted animate-pulse" />
                            <div className="h-10 w-full rounded-md bg-muted animate-pulse" />
                        </div>
                    ))}
                </div>
                <div className="h-10 w-28 rounded-md bg-muted animate-pulse" />
            </div>

            {/* table placeholder */}
            <div className="rounded-lg border border-border bg-card shadow-sm">
                <div className="border-b border-border px-6 py-4">
                    <div className="h-5 w-32 rounded bg-muted animate-pulse" />
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border">
                                {["w-24", "w-36", "w-16", "w-20", "w-20"].map((w, i) => (
                                    <th key={i} className="px-6 py-3">
                                        <div className={`h-4 ${w} rounded bg-muted animate-pulse`} />
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i} className="border-b border-border last:border-0">
                                    <td className="px-6 py-3"><div className="h-4 w-28 rounded bg-muted animate-pulse" /></td>
                                    <td className="px-6 py-3"><div className="h-4 w-40 rounded bg-muted animate-pulse" /></td>
                                    <td className="px-6 py-3"><div className="h-5 w-16 rounded-full bg-muted animate-pulse" /></td>
                                    <td className="px-6 py-3"><div className="h-4 w-20 rounded bg-muted animate-pulse" /></td>
                                    <td className="px-6 py-3">
                                        <div className="flex justify-end gap-1">
                                            <div className="h-8 w-8 rounded bg-muted animate-pulse" />
                                            <div className="h-8 w-8 rounded bg-muted animate-pulse" />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
