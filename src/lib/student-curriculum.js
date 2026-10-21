import pool from "./db.js"

/**
 * Checks if a target rule matches a user's value.
 * Handles 'all', empty, JSON array strings like '["LEPT"]', or comma-separated strings.
 */
export function isMatch(targetValue, userValue) {
  if (!targetValue || targetValue === "all" || !userValue) return true
  let targets = []
  try {
    if (typeof targetValue === "string" && targetValue.startsWith("[") && targetValue.endsWith("]")) {
      targets = JSON.parse(targetValue)
    } else if (Array.isArray(targetValue)) {
      targets = targetValue
    } else {
      targets = String(targetValue).split(",").map(t => t.trim())
    }
  } catch {
    targets = [String(targetValue).trim()]
  }
  if (targets.includes("all") || targets.length === 0) return true
  const uLower = String(userValue).toLowerCase()
  return targets.some(t => {
    const tLower = String(t).toLowerCase()
    return uLower.includes(tLower) || tLower.includes(uLower)
  })
}

/**
 * Retrieves the complete curriculum context for a given student:
 * - Student's exam, program, and major
 * - Eligible categories (e.g., General Education, Professional Education, and Specialization)
 * - Array of subject IDs that belong to the student's curriculum
 */
export async function getStudentCurriculumContext(userId, client = pool) {
  const userRes = await client.query(
    `SELECT u.id, u.program_id, u.major_id, u.batch_id, u.exam_id,
            p.name as program_name, m.name as major_name,
            COALESCE(e.name, be.name, u.target_exam) as exam_name
     FROM users u 
     LEFT JOIN programs p ON u.program_id = p.id 
     LEFT JOIN majors m ON u.major_id = m.id 
     LEFT JOIN examinations e ON u.exam_id = e.id
     LEFT JOIN batches b ON u.batch_id = b.id
     LEFT JOIN examinations be ON b.exam_id = be.id
     WHERE u.id = $1`,
    [userId]
  ).catch(() => ({ rows: [] }))

  const userObj = userRes.rows[0] || {}
  const userExam = (userObj.exam_name || "").toLowerCase()
  const userProg = (userObj.program_name || "").toLowerCase()
  const userMajor = (userObj.major_name || "").toLowerCase()

  // Fetch all categories
  const { rows: categories } = await client.query(
    "SELECT * FROM categories ORDER BY created_at ASC"
  ).catch(() => ({ rows: [] }))

  // Filter eligible categories
  const eligibleCategories = categories.filter((cat) => {
    if (!isMatch(cat.target_course, userExam)) return false
    if (!isMatch(cat.target_program, userProg)) return false
    if (!isMatch(cat.target_major, userMajor)) return false
    return true
  })

  // If student has no profile match yet, fallback to all categories to avoid blank state
  const activeCategories = eligibleCategories.length > 0 ? eligibleCategories : categories
  const eligibleCategoryIds = activeCategories.map(c => c.id)
  const eligibleCategoryNames = activeCategories.map(c => c.name)

  // Query matching subjects:
  // 1. Explicitly assigned via student_subjects table
  // 2. OR subcategory belongs to an eligible category
  // 3. OR subject's category name matches an eligible category
  const subjectRes = await client.query(
    `SELECT DISTINCT s.id
     FROM subjects s
     LEFT JOIN subcategories sub ON s.subcategory_id = sub.id
     LEFT JOIN student_subjects ss ON ss.subject_id = s.id AND ss.student_id = $1
     WHERE s.status = 'active'
       AND (
         ss.id IS NOT NULL
         OR (sub.category_id IS NOT NULL AND sub.category_id = ANY($2::int[]))
         OR s.category = ANY($3::text[])
         OR LOWER(s.category) = ANY($4::text[])
       )
     ORDER BY s.id ASC`,
    [
      userId,
      eligibleCategoryIds.length > 0 ? eligibleCategoryIds : [-1],
      eligibleCategoryNames.length > 0 ? eligibleCategoryNames : ["__none__"],
      eligibleCategoryNames.map(n => n.toLowerCase())
    ]
  ).catch(() => ({ rows: [] }))

  const subjectIds = subjectRes.rows.map(r => r.id)

  return {
    user: userObj,
    eligibleCategories: activeCategories,
    eligibleCategoryIds,
    eligibleCategoryNames,
    subjectIds,
  }
}
