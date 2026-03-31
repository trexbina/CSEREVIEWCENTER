import { getSession } from "@/lib/auth-session"
import pool from "@/lib/db"
import { User } from "lucide-react"

async function getProfile(userId) {
    const result = await pool.query(
        "SELECT id, name, email, role, created_at FROM users WHERE id = $1",
        [userId]
    )
    return result.rows[0] || null
}

export default async function ProfilePage() {
    const session = await getSession()
    const profile = session?.userId ? await getProfile(session.userId) : null

    return (
        <div className="space-y-8">
            <div>
                <div className="flex items-center gap-3">
                    <User className="h-8 w-8 text-primary" />
                    <h1 className="text-3xl font-bold text-foreground">Profile</h1>
                </div>
                <p className="mt-2 text-muted-foreground">
                    View and manage your account information.
                </p>
            </div>

            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-foreground">Account Details</h2>

                {profile ? (
                    <dl className="mt-4 space-y-4">
                        {[
                            { label: "Name", value: profile.name },
                            { label: "Email", value: profile.email },
                            { label: "Role", value: profile.role },
                            {
                                label: "Member since",
                                value: new Date(profile.created_at).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                }),
                            },
                        ].map((item) => (
                            <div key={item.label} className="flex flex-col sm:flex-row sm:gap-4">
                                <dt className="text-sm font-medium text-muted-foreground sm:w-32">
                                    {item.label}
                                </dt>
                                <dd className="text-sm text-foreground">{item.value}</dd>
                            </div>
                        ))}
                    </dl>
                ) : (
                    <p className="mt-4 text-sm text-muted-foreground">Unable to load profile.</p>
                )}
            </div>
        </div>
    )
}
