import pool from "./db.js"
import { ensureCurriculumTierSchema } from "./curriculum-tier.js"

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
export async function getStudentCurriculumContext(userId, client = pool, subscriptionTier = "free") {
  await ensureCurriculumTierSchema(client)
  const userRes = await client.query(
    `SELECT u.id, u.program_id, u.major_id, u.exam_id,
            p.name as program_name, m.name as major_name,
            COALESCE(e.name, u.target_exam) as exam_name
     FROM users u 
     LEFT JOIN programs p ON u.program_id = p.id 
     LEFT JOIN majors m ON u.major_id = m.id 
     LEFT JOIN examinations e ON u.exam_id = e.id
     WHERE u.id = $1`,
    [userId]
  ).catch(() => ({ rows: [] }))

  const userObj = userRes.rows[0] || {}
  const userExam = (userObj.exam_name || "").toLowerCase()
  const userProg = (userObj.program_name || "").toLowerCase()
  const userMajor = (userObj.major_name || "").toLowerCase()

  // Categories are scoped to the student's examination and subscription tier.
  const { rows: categories } = await client.query(
    "SELECT * FROM categories ORDER BY created_at ASC"
  ).catch(() => ({ rows: [] }))

  // Filter eligible categories
  const eligibleCategories = categories.filter((cat) => {
    if (!userObj.exam_id || Number(cat.exam_id) !== Number(userObj.exam_id)) return false
    if (cat.access_tier === "paid" && subscriptionTier !== "paid") return false
    if (!isMatch(cat.target_course, userExam)) return false
    if (!isMatch(cat.target_program, userProg)) return false
    if (!isMatch(cat.target_major, userMajor)) return false
    return true
  })

  const activeCategories = eligibleCategories
  const eligibleCategoryIds = activeCategories.map(c => c.id)
  const eligibleCategoryNames = activeCategories.map(c => c.name)

  // Query matching subjects:
  // Direct subject assignments do not bypass an unavailable category tier.
  const subjectRes = await client.query(
    `SELECT DISTINCT s.id
     FROM subjects s
     LEFT JOIN subcategories sub ON s.subcategory_id = sub.id
     WHERE s.status = 'active'
       AND (
         (sub.category_id IS NOT NULL AND sub.category_id = ANY($1::int[]))
         OR s.category = ANY($2::text[])
         OR LOWER(s.category) = ANY($3::text[])
       )
     ORDER BY s.id ASC`,
    [
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
