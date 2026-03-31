import { getSession } from "@/lib/auth-session"
import pool from "@/lib/db"
import { GraduationCap } from "lucide-react"

async function getEnrolledStudents(teacherId) {
    const result = await pool.query(
        `SELECT DISTINCT u.id, u.name, u.email, u.created_at
     FROM users u
     JOIN submissions s ON s.student_id = u.id
     JOIN assignments a ON a.id = s.assignment_id
     WHERE a.teacher_id = $1
     ORDER BY u.name ASC`,
        [teacherId]
    )
    return result.rows
}

export default async function StudentDirectoryPage() {
    const session = await getSession()
    const students = session?.userId ? await getEnrolledStudents(session.userId) : []

    return (
        <div className="space-y-8">
            <div>
                <div className="flex items-center gap-3">
                    <GraduationCap className="h-8 w-8 text-primary" />
                    <h1 className="text-3xl font-bold text-foreground">Student Directory</h1>
                </div>
                <p className="mt-2 text-muted-foreground">
                    View your enrolled reviewees and their basic information.
                </p>
            </div>

            <div className="rounded-lg border border-border bg-card shadow-sm">
                <div className="border-b border-border px-6 py-4">
                    <h2 className="text-lg font-semibold text-foreground">
                        Enrolled Reviewees ({students.length})
                    </h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border text-left">
                                <th className="px-6 py-3 font-medium text-muted-foreground">Name</th>
                                <th className="px-6 py-3 font-medium text-muted-foreground">Email</th>
                                <th className="px-6 py-3 font-medium text-muted-foreground">Enrolled Since</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map((student) => (
                                <tr key={student.id} className="border-b border-border last:border-0">
                                    <td className="px-6 py-3 font-medium text-foreground">{student.name}</td>
                                    <td className="px-6 py-3 text-muted-foreground">{student.email}</td>
                                    <td className="px-6 py-3 text-muted-foreground">
                                        {new Date(student.created_at).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                            {students.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="px-6 py-8 text-center text-muted-foreground">
                                        No enrolled reviewees yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
