import pool from "@/lib/db"

export const LEPT_DASHBOARD_PATH = "/lept-student-dashboard"
export const NCLEX_DASHBOARD_PATH = "/nclex-student-dashboard"

export function dashboardPathForExamination(examinationName) {
  return String(examinationName || "").toUpperCase().includes("NCLEX")
    ? NCLEX_DASHBOARD_PATH
    : LEPT_DASHBOARD_PATH
}

export async function getStudentDashboardPath(userId, client = pool) {
  const { rows } = await client.query(
    `SELECT e.name
     FROM users u
     LEFT JOIN examinations e ON e.id = u.exam_id
     WHERE u.id = $1`,
    [userId]
  )
  return dashboardPathForExamination(rows[0]?.name)
}

