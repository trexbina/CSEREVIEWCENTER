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

        // 2. Fetch completed content items (finished lessons + submitted quizzes regardless of grade) for this student
        const { rows: completedRows } = await pool.query(
            `WITH completed_items AS (
                -- Non-quiz lessons opened or completed
                SELECT DISTINCT
                    sm.subject_id,
                    sc.id as content_id,
                    'lesson' as item_type
                FROM student_activities sa
                JOIN subject_contents sc ON sc.id = (
                    CASE WHEN SUBSTRING(sa.details FROM 'LessonID: ([0-9]+)') ~ '^[0-9]+$' 
                         THEN SUBSTRING(sa.details FROM 'LessonID: ([0-9]+)')::int 
                         ELSE NULL END
                )
                JOIN subject_modules sm ON sm.id = sc.module_id
                WHERE sa.student_id = $1 
                  AND sa.activity_type IN ('lesson_open', 'module_complete')
                  AND LOWER(COALESCE(sc.lesson_type, '')) != 'quiz'

                UNION

                -- Finished quizzes regardless of grade
                SELECT DISTINCT
                    sm.subject_id,
                    sqs.content_id,
                    'quiz' as item_type
                FROM student_quiz_submissions sqs
                JOIN subject_contents sc ON sc.id = sqs.content_id
                JOIN subject_modules sm ON sm.id = sc.module_id
                WHERE sqs.student_id = $1
            )
            SELECT 
                subject_id,
                COUNT(content_id) as total_completed,
                COUNT(content_id) FILTER (WHERE item_type = 'lesson') as completed_lessons,
                COUNT(content_id) FILTER (WHERE item_type = 'quiz') as completed_quizzes
            FROM completed_items
            GROUP BY subject_id`,
            [session.userId]
        ).catch(() => ({ rows: [] }))

        const completedMap = {}
        completedRows.forEach(c => {
            if (c.subject_id) {
                completedMap[String(c.subject_id)] = {
                    totalCompleted: parseInt(c.total_completed || "0", 10),
                    completedLessons: parseInt(c.completed_lessons || "0", 10),
                    completedQuizzes: parseInt(c.completed_quizzes || "0", 10),
                }
            }
        })

        // 3. Fetch quiz mastery per subject for this student (based on earned/total points)
        // Whenever student takes a quiz, mastery updates: progresses on high score, downgrades on bad score
        const { rows: quizMasteryRows } = await pool.query(
            `SELECT 
                sm.subject_id,
                COUNT(sqs.id) as attempted_quizzes_count,
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
                attemptedQuizzesCount: parseInt(q.attempted_quizzes_count || "0", 10),
                avgMasteryPct: parseFloat(q.avg_mastery_pct || "0")
            }
        })

        // 4. Attach progress & mastery indicators to each module/subject
        const enrichedSubjects = subjects.map(s => {
            const sid = String(s.id)
            const counts = contentMap[sid] || { totalLessons: 0, totalQuizzes: 0 }
            const totalItems = counts.totalLessons + counts.totalQuizzes

            const comp = completedMap[sid] || { totalCompleted: 0, completedLessons: 0, completedQuizzes: 0 }
            const mastery = masteryMap[sid] || { attemptedQuizzesCount: 0, avgMasteryPct: 0 }

            const totalCompleted = comp.totalCompleted
            // Progress indicator: percentage of total items (lessons + quizzes) finished regardless of grade
            let progressPct = 0
            if (totalItems > 0) {
                progressPct = Math.min(100, Math.round((totalCompleted / totalItems) * 100))
            } else if (totalCompleted > 0) {
                progressPct = 100
            }

            // Mastery indicator: student quiz accuracy across attempted quizzes (0-100%)
            // Progresses on high scores, downgrades or lessens on lower scores
            const hasQuizAttempts = mastery.attemptedQuizzesCount > 0
            const masteryPct = hasQuizAttempts ? Math.round(mastery.avgMasteryPct || 0) : 0

            return {
                ...s,
                totalLessons: counts.totalLessons,
                totalQuizzes: counts.totalQuizzes,
                totalItems,
                openedLessons: comp.completedLessons,
                completedQuizzes: comp.completedQuizzes,
                completedItems: totalCompleted,
                progressPct,
                masteryPct,
                hasQuizAttempts,
            }
        })

        return NextResponse.json({ subjects: enrichedSubjects })
    } catch (err) {
        console.error("[student/subjects GET]", err)
        return NextResponse.json({ error: "Internal server error." }, { status: 500 })
    }
}
