import { getSession } from "@/lib/auth-session"
import pool from "@/lib/db"
import Link from "next/link"
import { Users, Plus } from "lucide-react"
import { UserSearchTable } from "../user-management"

async function getAllUsers() {
    const result = await pool.query(
        "SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC"
    )
    return result.rows
}

export default async function UserManagementPage() {
    const session = await getSession()
    const users = session?.userId ? await getAllUsers() : []

    return (
        <div className="space-y-8">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <Users className="h-8 w-8 text-primary" />
                        <h1 className="text-3xl font-bold text-foreground">User Management</h1>
                    </div>
                    <p className="mt-2 text-muted-foreground">
                        Manage students, instructors, and staff roles. Only admins can create or remove accounts.
                    </p>
                </div>
                <Link
                    href="/admin/users/add"
                    className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors shrink-0"
                >
                    <Plus className="h-4 w-4" />
                    Add User
                </Link>
            </div>

            {/* Quick Search + View All */}
            <div className="rounded-lg border border-border bg-card shadow-sm">
                <div className="border-b border-border px-6 py-4">
                    <h2 className="text-lg font-semibold text-foreground">
                        Quick User Search
                    </h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Search by name, email, or role. Use &quot;View All&quot; to manage the complete list.
                    </p>
                </div>
                <div className="p-6">
                    <UserSearchTable users={users} currentUserId={session?.userId} />
                </div>
            </div>
        </div>
    )
}
