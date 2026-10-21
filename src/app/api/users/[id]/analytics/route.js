import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { getSession } from "@/lib/auth-session"
import { ADMIN_ROLES } from "@/lib/auth"

/**
 * GET /api/users/[id]/analytics
 * Dynamically computes a student's:
 * 1. Module progress -> Subject progress -> Category / Competency progress
 * 2. Overall readiness percentage and performance rating status
 */
export async function GET(request, { params }) {
  try {
    const session = await getSession()
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
    }

    const resolvedParams = await params
    const targetUserId = parseInt(resolvedParams.id, 10)
    if (isNaN(targetUserId)) {
      return NextResponse.json({ error: "Invalid user ID." }, { status: 400 })
    }

    const isAdmin = session.role && ADMIN_ROLES.includes(session.role)
    const isSelf = session.userId === targetUserId

    if (!isAdmin && !isSelf) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 })
    }

    // 1. Fetch student user profile & academic assignment
    const userRes = await pool.query(
      `SELECT 
        u.id, u.name, u.role, u.program_id, u.major_id, u.exam_id,
        p.name AS program_name,
        m.name AS major_name,
        e.name AS exam_name
      FROM users u
      LEFT JOIN programs p ON u.program_id = p.id
      LEFT JOIN majors m ON u.major_id = m.id
      LEFT JOIN examinations e ON u.exam_id = e.id
      WHERE u.id = $1`,
      [targetUserId]
    )

    if (userRes.rows.length === 0) {
      return NextResponse.json({ error: "User not found." }, { status: 404 })
    }

    const user = userRes.rows[0]
    if (user.role !== "student") {
      return NextResponse.json({
        isStudent: false,
        readiness: { percentage: 0, ratingLabel: "N/A" },
        competencies: [],
      })
    }

// Helper to check multi-target match against student attributes (handles 'all', comma-separated, or JSON arrays)
function isMatch(targetValue, userValue) {
  if (!targetValue || targetValue === "all") return true
  let targets = []
  try {
    if (typeof targetValue === "string") {
      const trimmed = targetValue.trim()
      if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
        targets = JSON.parse(trimmed)
      } else {
        targets = trimmed.split(",").map((t) => t.trim())
      }
    } else if (Array.isArray(targetValue)) {
      targets = targetValue
    } else {
      targets = [String(targetValue).trim()]
    }
  } catch (e) {
    targets = [String(targetValue).trim()]
  }

  targets = targets.map((t) => String(t).trim()).filter(Boolean)
  if (targets.length === 0 || targets.some((t) => t.toLowerCase() === "all")) return true

  if (!userValue || userValue === "—") return false

  const uLower = String(userValue).toLowerCase().trim()
  return targets.some((t) => {
    const tLower = t.toLowerCase()
    return uLower.includes(tLower) || tLower.includes(uLower)
  })
}

    const programName = user.program_name || ""
    const majorName = user.major_name && user.major_name !== "—" ? user.major_name : ""
    const examName = user.exam_name || ""
    const isSecondary =
      programName.toLowerCase().includes("secondary") ||
      programName.toLowerCase().includes("bsed") ||
      Boolean(majorName)

    // 2. Fetch curriculum modules, subjects, and categories
    const [
      curriculumRes,
      contentCountsRes,
      completedItemsRes,
      progressTableRes,
    ] = await Promise.all([
      // Modules with subject (subcategory) and category mapping
      pool.query(`
        SELECT 
          s.id AS module_id,
          s.title AS module_title,
          s.subcategory_id AS subject_id,
          COALESCE(sc.name, s.title) AS subject_name,
          COALESCE(sc.category_id, s.category_id, c.id) AS category_id,
          COALESCE(c.name, s.category, 'General Education') AS category_name,
          c.target_course,
          c.target_program,
          c.target_major
        FROM subjects s
        LEFT JOIN subcategories sc ON s.subcategory_id = sc.id
        LEFT JOIN categories c ON (
          sc.category_id = c.id 
          OR s.category_id = c.id 
          OR LOWER(TRIM(c.name)) = LOWER(TRIM(s.category))
          OR (s.category ILIKE '%filipino%' AND c.name ILIKE '%filipino%')
          OR (s.category ILIKE '%mathematics%' AND c.name ILIKE '%mathematics%')
          OR (s.category ILIKE '%biological%' AND c.name ILIKE '%biological%')
          OR (s.category ILIKE '%physical science%' AND c.name ILIKE '%physical science%')
          OR (s.category ILIKE '%values education%' AND c.name ILIKE '%values education%')
          OR (s.category ILIKE '%english%' AND c.name ILIKE '%english%')
          OR (s.category ILIKE '%social%' AND c.name ILIKE '%social%')
          OR (s.category ILIKE '%mapeh%' AND c.name ILIKE '%mapeh%')
          OR (s.category ILIKE '%agriculture%' AND c.name ILIKE '%agriculture%')
        )
        WHERE s.status = 'active'
        ORDER BY s.id ASC
      `).catch(() => ({ rows: [] })),

      // Total content items (lessons + quizzes) per module
      pool.query(`
        SELECT 
          sm.subject_id AS module_id,
          COUNT(sc.id)::int AS total_items,
          COUNT(sc.id) FILTER (WHERE LOWER(COALESCE(sc.lesson_type, '')) != 'quiz')::int AS total_lessons,
          COUNT(sc.id) FILTER (WHERE LOWER(COALESCE(sc.lesson_type, '')) = 'quiz')::int AS total_quizzes
        FROM subject_contents sc
        JOIN subject_modules sm ON sm.id = sc.module_id
        GROUP BY sm.subject_id
      `).catch(() => ({ rows: [] })),

      // Student completed items per module
      pool.query(`
        WITH completed AS (
          SELECT DISTINCT
            sm.subject_id AS module_id,
            sc.id AS content_id
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

          SELECT DISTINCT
            sm.subject_id AS module_id,
            sqs.content_id
          FROM student_quiz_submissions sqs
          JOIN subject_contents sc ON sc.id = sqs.content_id
          JOIN subject_modules sm ON sm.id = sc.module_id
          WHERE sqs.student_id = $1
        )
        SELECT module_id, COUNT(content_id)::int AS completed_count
        FROM completed
        GROUP BY module_id
      `, [targetUserId]).catch(() => ({ rows: [] })),

      // Saved student_subject_progress table
      pool.query(`
        SELECT subject_id AS module_id, completed_items, total_items, progress_pct 
        FROM student_subject_progress 
        WHERE student_id = $1
      `, [targetUserId]).catch(() => ({ rows: [] })),
    ])

    // Build lookup maps for modules
    const totalItemsMap = {}
    contentCountsRes.rows.forEach((r) => {
      totalItemsMap[String(r.module_id)] = parseInt(r.total_items, 10) || 0
    })

    const completedItemsMap = {}
    completedItemsRes.rows.forEach((r) => {
      completedItemsMap[String(r.module_id)] = parseInt(r.completed_count, 10) || 0
    })

    // Complement from student_subject_progress
    progressTableRes.rows.forEach((r) => {
      const mid = String(r.module_id)
      const comp = parseInt(r.completed_items, 10) || 0
      const tot = parseInt(r.total_items, 10) || 0
      if (comp > (completedItemsMap[mid] || 0)) {
        completedItemsMap[mid] = comp
      }
      if (tot > (totalItemsMap[mid] || 0)) {
        totalItemsMap[mid] = tot
      }
    })

    // Filter curriculum modules strictly based on the student's exam, program, and major
    const relevantCurriculumRows = curriculumRes.rows.filter((mod) => {
      // 1. Course / Exam check
      if (mod.target_course && !isMatch(mod.target_course, examName)) return false
      // 2. Program check
      if (mod.target_program && !isMatch(mod.target_program, programName)) return false
      // 3. Major check
      if (mod.target_major && !isMatch(mod.target_major, majorName)) return false

      // Safety check: ensure categories targeting other majors are never included
      if (majorName) {
        const catNameLower = (mod.category_name || "").toLowerCase()
        const otherKnownMajors = [
          "filipino",
          "mathematics",
          "biological science",
          "physical science",
          "values education",
          "social studies",
          "social science",
          "mapeh",
          "agriculture",
        ].filter(
          (m) =>
            !majorName.toLowerCase().includes(m) && !m.includes(majorName.toLowerCase())
        )

        const matchesOtherMajor = otherKnownMajors.some((om) => catNameLower.includes(om))
        if (matchesOtherMajor && !catNameLower.includes(majorName.toLowerCase())) {
          return false
        }
      } else if (!isSecondary) {
        const catNameLower = (mod.category_name || "").toLowerCase()
        if (catNameLower.includes("specializ") || catNameLower.includes("major")) {
          return false
        }
      }

      return true
    })

    // 3. Roll up modules into Subjects (subcategories)
    const subjectsMap = {}
    relevantCurriculumRows.forEach((mod) => {
      const subKey = String(mod.subject_id || `direct_${mod.module_id}`)
      if (!subjectsMap[subKey]) {
        subjectsMap[subKey] = {
          id: subKey,
          name: mod.subject_name || mod.module_title,
          categoryName: mod.category_name || "General Education",
          categoryTargetCourse: mod.target_course,
          categoryTargetProgram: mod.target_program,
          categoryTargetMajor: mod.target_major,
          totalItems: 0,
          completedItems: 0,
          moduleCount: 0,
        }
      }

      const mid = String(mod.module_id)
      const tot = totalItemsMap[mid] || 0
      const comp = Math.min(tot, completedItemsMap[mid] || 0)

      subjectsMap[subKey].totalItems += tot
      subjectsMap[subKey].completedItems += comp
      subjectsMap[subKey].moduleCount += 1
    })

    // Calculate each subject's progress percentage
    const subjectsList = Object.values(subjectsMap).map((sub) => {
      const progressPct =
        sub.totalItems > 0
          ? Math.min(100, Math.round((sub.completedItems / sub.totalItems) * 100))
          : 0
      return {
        ...sub,
        progressPct,
      }
    })

    // 4. Roll up subjects into Competencies / Categories
    // Define target competencies based on student curriculum:
    const competenciesDef = [
      {
        key: "gen_ed",
        name: "General Education",
        color: "bg-[#eed48f]",
        match: (cat, name) =>
          cat.includes("general") ||
          cat.includes("gen ed") ||
          name.includes("general education"),
      },
      {
        key: "prof_ed",
        name: "Professional Education",
        color: "bg-orange-500",
        match: (cat, name) =>
          cat.includes("prof") ||
          name.includes("professional education"),
      },
    ]

    // If Secondary Education or has major, include Specialization (Major)
    if (isSecondary) {
      const specLabel = majorName ? `Specialization (${majorName})` : "Specialization / Major"
      competenciesDef.push({
        key: "specialization",
        name: specLabel,
        color: "bg-amber-500",
        match: (cat, name) => {
          if (!majorName) {
            return cat.includes("specializ") || cat.includes("major")
          }
          const mLower = majorName.toLowerCase()
          return (
            cat.includes(mLower) ||
            name.includes(mLower) ||
            ((cat.includes("specializ") || cat.includes("major")) &&
              ![
                "filipino",
                "mathematics",
                "biological",
                "physical",
                "values",
                "social",
                "mapeh",
                "agriculture",
              ]
                .filter((m) => !mLower.includes(m))
                .some((m) => cat.includes(m) || name.includes(m)))
          )
        },
      })
    }

    // Bucket subjects into the competencies
    const processedSubjectKeys = new Set()

    const competencyResults = competenciesDef.map((compDef) => {
      const matchedSubjects = subjectsList.filter((sub) => {
        const cat = (sub.categoryName || "").toLowerCase()
        const name = (sub.name || "").toLowerCase()
        return compDef.match(cat, name)
      })

      matchedSubjects.forEach((sub) => processedSubjectKeys.add(sub.id))

      const totalItems = matchedSubjects.reduce((acc, s) => acc + s.totalItems, 0)
      const completedItems = matchedSubjects.reduce((acc, s) => acc + s.completedItems, 0)

      let score = 0
      if (totalItems > 0) {
        score = Math.min(100, Math.round((completedItems / totalItems) * 100))
      } else if (matchedSubjects.length > 0) {
        // Average of subject percentages if no explicit item counts
        const sumPct = matchedSubjects.reduce((acc, s) => acc + s.progressPct, 0)
        score = Math.min(100, Math.round(sumPct / matchedSubjects.length))
      }

      return {
        key: compDef.key,
        name: compDef.name,
        score,
        color: compDef.color,
        subjectCount: matchedSubjects.length,
        totalItems,
        completedItems,
      }
    })

    // Capture any remaining active categories that didn't match standard LEPT names
    // but ONLY if they are valid for this student's exam, program, and major
    const remainingSubjects = subjectsList.filter((sub) => {
      if (processedSubjectKeys.has(sub.id)) return false
      if (sub.categoryTargetCourse && !isMatch(sub.categoryTargetCourse, examName)) return false
      if (sub.categoryTargetProgram && !isMatch(sub.categoryTargetProgram, programName)) return false
      if (sub.categoryTargetMajor && !isMatch(sub.categoryTargetMajor, majorName)) return false

      if (majorName) {
        const catNameLower = (sub.categoryName || "").toLowerCase()
        const otherKnownMajors = [
          "filipino",
          "mathematics",
          "biological science",
          "physical science",
          "values education",
          "social studies",
          "social science",
          "mapeh",
          "agriculture",
        ].filter(
          (m) =>
            !majorName.toLowerCase().includes(m) && !m.includes(majorName.toLowerCase())
        )
        if (otherKnownMajors.some((om) => catNameLower.includes(om))) {
          return false
        }
      }
      return true
    })

    const extraCategoryMap = {}

    remainingSubjects.forEach((sub) => {
      const cat = sub.categoryName || "Other"
      if (!extraCategoryMap[cat]) {
        extraCategoryMap[cat] = {
          name: cat,
          totalItems: 0,
          completedItems: 0,
          subjects: [],
        }
      }
      extraCategoryMap[cat].totalItems += sub.totalItems
      extraCategoryMap[cat].completedItems += sub.completedItems
      extraCategoryMap[cat].subjects.push(sub)
    })

    const palette = ["bg-teal-500", "bg-sky-500", "bg-indigo-500", "bg-emerald-500"]
    let paletteIdx = 0

    Object.values(extraCategoryMap).forEach((extra) => {
      let score = 0
      if (extra.totalItems > 0) {
        score = Math.min(100, Math.round((extra.completedItems / extra.totalItems) * 100))
      } else if (extra.subjects.length > 0) {
        const sumPct = extra.subjects.reduce((acc, s) => acc + s.progressPct, 0)
        score = Math.min(100, Math.round(sumPct / extra.subjects.length))
      }

      competencyResults.push({
        key: `custom_${extra.name.toLowerCase().replace(/\s+/g, "_")}`,
        name: extra.name,
        score,
        color: palette[paletteIdx % palette.length],
        subjectCount: extra.subjects.length,
        totalItems: extra.totalItems,
        completedItems: extra.completedItems,
      })
      paletteIdx++
    })

    // 5. Calculate Overall Readiness Score & Performance Rating
    const validCompetencies = competencyResults.filter((c) => c.score !== undefined)
    const overallPercentage =
      validCompetencies.length > 0
        ? Math.min(
            100,
            Math.round(
              validCompetencies.reduce((acc, c) => acc + c.score, 0) / validCompetencies.length
            )
          )
        : 0

    // Rating determination matching Performance Standards
    let ratingLabel = "FOR MONITORING"
    let ratingStatus = "monitoring"
    let badgeClass = "bg-amber-500/10 text-amber-600 border border-amber-500/25 dark:text-amber-400"
    let donutColor = "#eed48f"

    if (overallPercentage >= 80) {
      ratingLabel = "SUPERIOR / IT PREPARED"
      ratingStatus = "superior"
      badgeClass = "bg-emerald-500/10 text-emerald-600 border border-emerald-500/25 dark:text-emerald-400"
      donutColor = "#10b981"
    } else if (overallPercentage >= 70) {
      ratingLabel = "ADEQUATELY PREPARED"
      ratingStatus = "adequate"
      badgeClass = "bg-blue-500/10 text-blue-600 border border-blue-500/25 dark:text-blue-400"
      donutColor = "#3b82f6"
    } else if (overallPercentage >= 60) {
      ratingLabel = "FOR MONITORING"
      ratingStatus = "monitoring"
      badgeClass = "bg-amber-500/10 text-amber-600 border border-amber-500/25 dark:text-amber-400"
      donutColor = "#eed48f"
    } else {
      ratingLabel = "AT RISK / NEEDS REINFORCEMENT"
      ratingStatus = "at_risk"
      badgeClass = "bg-rose-500/10 text-rose-600 border border-rose-500/25 dark:text-rose-400"
      donutColor = "#f43f5e"
    }

    return NextResponse.json({
      success: true,
      isStudent: true,
      userId: targetUserId,
      studentName: user.name,
      programName,
      majorName,
      isSecondary,
      readiness: {
        percentage: overallPercentage,
        target: 80,
        ratingLabel,
        ratingStatus,
        badgeClass,
        donutColor,
      },
      competencies: competencyResults,
      subjectsSummary: subjectsList.map((s) => ({
        id: s.id,
        name: s.name,
        category: s.categoryName,
        progressPct: s.progressPct,
        moduleCount: s.moduleCount,
      })),
    })
  } catch (error) {
    console.error("Error calculating user profile analytics:", error)
    return NextResponse.json(
      { error: "Internal Server Error", message: error.message },
      { status: 500 }
    )
  }
}
