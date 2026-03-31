import { getSession } from "@/lib/auth-session"
import pool from "@/lib/db"
import Link from "next/link"
import { Users, ArrowLeft } from "lucide-react"
import { UserTable } from "../../user-management"

async function getAllUsers() {
    const result = await pool.query(
        "SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC"
    )
    return result.rows
}

export default async function AllUsersPage() {
    const session = await getSession()
    const users = session?.userId ? await getAllUsers() : []

    const counts = users.reduce(
        (acc, u) => { acc[u.role] = (acc[u.role] || 0) + 1; return acc },
        {}
    )

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <Users className="h-8 w-8 text-primary" />
                        <h1 className="text-3xl font-bold text-foreground">All Users</h1>
                    </div>
                    <p className="mt-2 text-muted-foreground">
                        Complete user directory — sort by any column, edit, delete, or assign subjects.
                    </p>
                </div>
                <Link
                    href="/admin/users"
                    className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors shrink-0"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                </Link>
            </div>

            {/* Summary badges */}
            <div className="flex flex-wrap gap-3">
                {[
                    { label: "Total", value: users.length, color: "bg-primary/10 text-primary" },
                    { label: "Students", value: counts.student || 0, color: "bg-secondary text-secondary-foreground" },
                    { label: "Teachers", value: counts.teacher || 0, color: "bg-primary/15 text-primary" },
                    { label: "Admins", value: counts.admin || 0, color: "bg-destructive/15 text-destructive" },
                ].map(({ label, value, color }) => (
                    <span
                        key={label}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${color}`}
                    >
                        {label}: <strong>{value}</strong>
                    </span>
                ))}
            </div>

            {/* Full sortable table */}
            <div className="rounded-lg border border-border bg-card shadow-sm">
                <div className="border-b border-border px-6 py-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-foreground">
                        All Users ({users.length})
                    </h2>
                    <p className="text-xs text-muted-foreground">Click column headers to sort</p>
                </div>
                <div className="p-4">
                    <UserTable users={users} currentUserId={session?.userId} />
                </div>
            </div>
        </div>
    )
}
