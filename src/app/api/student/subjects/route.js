import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { getSession } from "@/lib/auth-session"

/** GET /api/student/subjects — subjects assigned to the logged-in student */
export async function GET() {
    try {
        const session = await getSession()
        if (!session?.userId) {
            return NextResponse.json({ error: "Forbidden." }, { status: 403 })
        }

        const { rows: subjects } = await pool.query(
            `SELECT id, title, code, description, category, subcategory_id, status,
              topics, image_url, unlock_date, created_at, NOW() as assigned_at
       FROM subjects
       WHERE status = 'active' AND (unlock_date IS NULL OR unlock_date <= NOW())
       ORDER BY created_at DESC, id DESC`
        )

        // 1. Fetch total counts of lessons (modules/pdfs) and quizzes per subject
        const { rows: contentCounts } = await pool.query(
            `SELECT 
                sm.subject_id,
                COUNT(sc.id) FILTER (WHERE LOWER(COALESCE(sc.lesson_type, '')) != 'quiz') as total_lessons,
                COUNT(sc.id) FILTER (WHERE LOWER(COALESCE(sc.lesson_type, '')) = 'quiz') as total_quizzes
             FROM subject_contents sc
             JOIN subject_modules sm ON sm.id = sc.module_id
             GROUP BY sm.subject_id`
        ).catch(() => ({ rows: [] }))

        const contentMap = {}
        contentCounts.forEach(c => {
            contentMap[c.subject_id] = {
                totalLessons: parseInt(c.total_lessons || "0", 10),
                totalQuizzes: parseInt(c.total_quizzes || "0", 10)
            }
        })

        // 2. Fetch opened/completed lessons for this student per subject
        const { rows: openedLessonsRows } = await pool.query(
            `SELECT 
                COALESCE(
                  SUBSTRING(details FROM 'SubjectID: ([0-9]+)'),
                  sm.subject_id::text
                ) as subject_id,
                COUNT(DISTINCT SUBSTRING(details FROM 'LessonID: ([0-9]+)')) as opened_count
             FROM student_activities sa
             LEFT JOIN subject_contents sc ON sc.id = (
               CASE WHEN SUBSTRING(sa.details FROM 'LessonID: ([0-9]+)') ~ '^[0-9]+$' 
                    THEN SUBSTRING(sa.details FROM 'LessonID: ([0-9]+)')::int 
                    ELSE NULL END
             )
             LEFT JOIN subject_modules sm ON sm.id = sc.module_id
             WHERE sa.student_id = $1 
               AND sa.activity_type IN ('lesson_open', 'module_complete')
             GROUP BY 1`,
            [session.userId]
        ).catch(() => ({ rows: [] }))

        const openedMap = {}
        openedLessonsRows.forEach(o => {
            if (o.subject_id) {
                openedMap[String(o.subject_id)] = parseInt(o.opened_count || "0", 10)
            }
        })

        // 3. Fetch quiz mastery per subject for this student (based on earned/total points)
        const { rows: quizMasteryRows } = await pool.query(
            `SELECT 
                sm.subject_id,
                COUNT(sqs.id) as completed_quizzes,
                ROUND(AVG(
                    CASE 
                        WHEN sqs.total_points > 0 
                        THEN (sqs.earned_points::numeric / sqs.total_points::numeric) * 100 
                        ELSE 0 
                    END
                ), 1) as avg_mastery_pct
             FROM student_quiz_submissions sqs
             JOIN subject_contents sc ON sc.id = sqs.content_id
             JOIN subject_modules sm ON sm.id = sc.module_id
             WHERE sqs.student_id = $1
             GROUP BY sm.subject_id`,
            [session.userId]
        ).catch(() => ({ rows: [] }))

        const masteryMap = {}
        quizMasteryRows.forEach(q => {
            masteryMap[String(q.subject_id)] = {
                completedQuizzes: parseInt(q.completed_quizzes || "0", 10),
                avgMasteryPct: parseFloat(q.avg_mastery_pct || "0")
            }
        })

        // 4. Attach progress & mastery indicators to each subject
        const enrichedSubjects = subjects.map(s => {
            const sid = String(s.id)
            const counts = contentMap[sid] || { totalLessons: 0, totalQuizzes: 0 }
            const openedLessons = openedMap[sid] || 0
            const mastery = masteryMap[sid] || { completedQuizzes: 0, avgMasteryPct: 0 }

            // Progress indicator: percentage of lesson modules/pdfs opened or completed
            let progressPct = 0
            if (counts.totalLessons > 0) {
                progressPct = Math.min(100, Math.round((openedLessons / counts.totalLessons) * 100))
            } else if (openedLessons > 0) {
                progressPct = 100
            }

            // Mastery indicator: student quiz accuracy / performance (0-100%)
            // The more the student aces quizzes, the higher the mastery score
            let masteryPct = Math.round(mastery.avgMasteryPct || 0)

            return {
                ...s,
                totalLessons: counts.totalLessons,
                totalQuizzes: counts.totalQuizzes,
                openedLessons,
                progressPct,
                masteryPct,
            }
        })

        return NextResponse.json({ subjects: enrichedSubjects })
    } catch (err) {
        console.error("[student/subjects GET]", err)
        return NextResponse.json({ error: "Internal server error." }, { status: 500 })
    }
}
